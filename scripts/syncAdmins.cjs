/**
 * Sync Firebase Auth users with Firestore admins collection
 * 
 * This script:
 * 1. Lists all Firebase Auth users with @admin.local emails
 * 2. Checks if they have corresponding Firestore documents
 * 3. Creates missing documents or deletes orphaned auth users
 * 
 * Usage: node scripts/syncAdmins.cjs [--fix]
 *   --fix  Actually fix the issues (without this flag, just shows what would happen)
 */

const admin = require('firebase-admin');
const path = require('path');

// Initialize Firebase Admin SDK
const serviceAccountPath = path.join(__dirname, 'serviceAccountKey.json');

try {
    const serviceAccount = require(serviceAccountPath);
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
} catch (err) {
    console.error('❌ ERROR: Could not load serviceAccountKey.json');
    process.exit(1);
}

const db = admin.firestore();
const auth = admin.auth();

async function syncAdmins(fix = false) {
    console.log('🔍 Scanning Firebase Auth users...\n');
    
    const adminUsers = [];
    let nextPageToken;
    
    // Get all users from Firebase Auth
    do {
        const listResult = await auth.listUsers(1000, nextPageToken);
        for (const user of listResult.users) {
            if (user.email && user.email.endsWith('@admin.local')) {
                adminUsers.push(user);
            }
        }
        nextPageToken = listResult.pageToken;
    } while (nextPageToken);
    
    console.log(`Found ${adminUsers.length} admin users in Firebase Auth:\n`);
    
    // Check each user
    const issues = [];
    
    for (const user of adminUsers) {
        const phone = user.email.replace('@admin.local', '');
        console.log(`📧 ${user.email}`);
        console.log(`   UID: ${user.uid}`);
        console.log(`   Created: ${user.metadata.creationTime}`);
        
        // Check Firestore document
        const docRef = db.collection('admins').doc(user.uid);
        const doc = await docRef.get();
        
        if (doc.exists) {
            const data = doc.data();
            console.log(`   ✅ Firestore doc exists: ${data.name} (${data.role})`);
            console.log(`   Claims: ${JSON.stringify(user.customClaims || {})}`);
            
            // Check if claims are missing or mismatched
            const claims = user.customClaims || {};
            if (!claims.role) {
                console.log(`   ⚠️  Missing custom claims!`);
                issues.push({ uid: user.uid, data, issue: 'missing_claims' });
            } else if (claims.role !== data.role) {
                console.log(`   ⚠️  Claim role mismatch! Claim: ${claims.role}, Firestore: ${data.role}`);
                issues.push({ uid: user.uid, data, issue: 'missing_claims' });
            }
        } else {
            console.log(`   ❌ NO Firestore document!`);
            issues.push({ user, phone, issue: 'missing_firestore' });
        }
        console.log('');
    }
    
    // Get Firestore docs without auth users
    const firestoreDocs = await db.collection('admins').get();
    for (const doc of firestoreDocs.docs) {
        const uid = doc.id;
        try {
            await auth.getUser(uid);
        } catch (err) {
            if (err.code === 'auth/user-not-found') {
                console.log(`📄 Firestore doc ${uid} has no Auth user!`);
                issues.push({ uid, data: doc.data(), issue: 'orphan_firestore' });
            }
        }
    }
    
    if (issues.length === 0) {
        console.log('✅ All admins are in sync!');
        return;
    }
    
    console.log(`\n⚠️  Found ${issues.length} issue(s):\n`);
    
    for (const issue of issues) {
        if (issue.issue === 'missing_firestore') {
            console.log(`• Auth user ${issue.user.email} has no Firestore doc`);
            
            if (fix) {
                console.log('  → Creating Firestore document...');
                await db.collection('admins').doc(issue.user.uid).set({
                    uid: issue.user.uid,
                    name: issue.phone,
                    phone: issue.phone,
                    role: 'admin',
                    permissions: {
                        rosterControl: true,
                        fieldTeams: true,
                        hotlineStaff: true,
                        teamDirectory: true,
                        exports: true,
                        auditLogs: true,
                    },
                    isActive: true,
                    createdBy: 'sync-script',
                    createdAt: admin.firestore.FieldValue.serverTimestamp(),
                    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                });
                
                // Also set custom claims
                await auth.setCustomUserClaims(issue.user.uid, { role: 'admin' });
                console.log('  ✅ Created and set claims!');
            } else {
                console.log('  → Run with --fix to create the document');
            }
        } else if (issue.issue === 'missing_claims') {
            console.log(`• Admin ${issue.data.name || issue.data.phone} has no custom claims`);
            
            if (fix) {
                console.log('  → Setting custom claims...');
                await auth.setCustomUserClaims(issue.uid, { role: issue.data.role || 'admin' });
                console.log('  ✅ Claims set!');
            } else {
                console.log('  → Run with --fix to set claims');
            }
        } else if (issue.issue === 'orphan_firestore') {
            console.log(`• Firestore doc ${issue.uid} has no Auth user (${issue.data?.name})`);
            
            if (fix) {
                console.log('  → Deleting orphan Firestore document...');
                await db.collection('admins').doc(issue.uid).delete();
                console.log('  ✅ Deleted!');
            } else {
                console.log('  → Run with --fix to delete the orphan');
            }
        }
    }
    
    if (!fix) {
        console.log('\n💡 Run with --fix to apply fixes:');
        console.log('   node scripts/syncAdmins.cjs --fix');
    }
}

const fix = process.argv.includes('--fix');
syncAdmins(fix).then(() => {
    console.log('\nDone!');
    process.exit(0);
}).catch(err => {
    console.error('Error:', err);
    process.exit(1);
});

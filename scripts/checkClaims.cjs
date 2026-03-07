/**
 * checkClaims.cjs - Check Firebase custom claims for admin users
 * 
 * Usage: node scripts/checkClaims.cjs [phone]
 * 
 * If phone is provided, checks that specific user.
 * Otherwise, lists all admin users with their claims.
 */
const admin = require('firebase-admin');
const path = require('path');

// Initialize Firebase Admin
const serviceAccount = require(path.join(__dirname, 'serviceAccountKey.json'));

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
});

const auth = admin.auth();
const db = admin.firestore();

function phoneToEmail(phone) {
    const cleaned = (phone || '').replace(/\s+/g, '');
    return `${cleaned}@admin.local`;
}

async function checkUser(phone) {
    const email = phoneToEmail(phone);
    try {
        const userRecord = await auth.getUserByEmail(email);
        console.log(`\n📱 Phone: ${phone}`);
        console.log(`   UID: ${userRecord.uid}`);
        console.log(`   Email: ${userRecord.email}`);
        console.log(`   Custom Claims:`, userRecord.customClaims || '(none)');
        
        // Also check Firestore
        const doc = await db.collection('admins').doc(userRecord.uid).get();
        if (doc.exists) {
            const data = doc.data();
            console.log(`   Firestore isActive: ${data.isActive}`);
            console.log(`   Firestore permissions:`, data.permissions);
        } else {
            console.log(`   Firestore: (no document)`);
        }
    } catch (err) {
        console.error(`Error checking ${phone}:`, err.message);
    }
}

async function listAllAdmins() {
    console.log('='.repeat(60));
    console.log('ADMIN USERS - CLAIMS & PERMISSIONS CHECK');
    console.log('='.repeat(60));
    
    // Get all Firestore admin docs
    const adminsSnap = await db.collection('admins').get();
    
    for (const doc of adminsSnap.docs) {
        const data = doc.data();
        const uid = doc.id;
        
        try {
            const userRecord = await auth.getUser(uid);
            console.log(`\n📱 ${data.name || data.phone}`);
            console.log(`   UID: ${uid}`);
            console.log(`   Email: ${userRecord.email}`);
            console.log(`   Custom Claims:`, JSON.stringify(userRecord.customClaims || {}));
            console.log(`   Firestore role: ${data.role}`);
            console.log(`   Firestore isActive: ${data.isActive}`);
            console.log(`   Firestore permissions:`, JSON.stringify(data.permissions || {}));
        } catch (err) {
            console.log(`\n⚠️  ${data.name || data.phone}`);
            console.log(`   UID: ${uid}`);
            console.log(`   Error: ${err.message}`);
        }
    }
}

async function main() {
    const phone = process.argv[2];
    
    if (phone) {
        await checkUser(phone);
    } else {
        await listAllAdmins();
    }
    
    process.exit(0);
}

main().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
});

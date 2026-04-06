/**
 * Backfill employeeId to publicEmployees collection
 * 
 * This script copies employeeId from employees collection to publicEmployees.
 * Required after adding employeeId to PUBLIC_EMPLOYEE_FIELDS in firebaseService.js
 * 
 * Background:
 * - QR codes encode employeeId (e.g., EMP-012)
 * - VerifyPage queries publicEmployees by employeeId
 * - Old publicEmployees docs didn't have employeeId field
 * - This script backfills the missing field for all existing employees
 * 
 * Usage: node scripts/backfillEmployeeIds.cjs [--fix]
 *   --fix  Actually perform the update (without this flag, just shows what would happen)
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

async function backfillEmployeeIds(fix = false) {
    console.log('🔍 Scanning employees collection...\n');
    
    try {
        // Get all employees
        const employeesSnap = await db.collection('employees').get();
        console.log(`Found ${employeesSnap.size} employees in employees collection\n`);
        
        if (employeesSnap.size === 0) {
            console.log('ℹ️  No employees to backfill.');
            return;
        }

        // Get all public employees
        const publicSnap = await db.collection('publicEmployees').get();
        const publicEmployeesMap = new Map();
        publicSnap.docs.forEach(doc => {
            publicEmployeesMap.set(doc.id, doc.data());
        });

        console.log(`Found ${publicSnap.size} documents in publicEmployees collection\n`);

        // Check which docs need the employeeId field
        let needsUpdate = 0;
        const updates = [];

        employeesSnap.docs.forEach(doc => {
            const empData = doc.data();
            const pubData = publicEmployeesMap.get(doc.id);

            if (!empData.employeeId) {
                // Skip if no employeeId in source
                return;
            }

            if (!pubData || !pubData.employeeId) {
                // Public doc is missing or missing employeeId
                updates.push({
                    docId: doc.id,
                    employeeId: empData.employeeId,
                    exists: !!pubData,
                });
                needsUpdate++;
            }
        });

        if (needsUpdate === 0) {
            console.log('✅ All publicEmployees already have employeeId. No updates needed.\n');
            return;
        }

        console.log(`📋 Found ${needsUpdate} document(s) that need employeeId field:\n`);
        updates.forEach(u => {
            const status = u.exists ? 'exists (missing field)' : 'missing from publicEmployees';
            console.log(`   ${u.docId}: employeeId = "${u.employeeId}" [${status}]`);
        });
        console.log();

        if (!fix) {
            console.log('🏁 DRY RUN — No changes made.\n');
            console.log('To actually perform the update, run:\n');
            console.log('   node scripts/backfillEmployeeIds.cjs --fix\n');
            return;
        }

        // Perform the update in batches
        console.log('⏳ Updating publicEmployees collection...');
        
        const batchSize = 500;
        for (let i = 0; i < updates.length; i += batchSize) {
            const batch = db.batch();
            const batchUpdates = updates.slice(i, i + batchSize);

            batchUpdates.forEach(u => {
                const publicRef = db.collection('publicEmployees').doc(u.docId);
                batch.set(publicRef, { employeeId: u.employeeId }, { merge: true });
            });

            await batch.commit();
            console.log(`   ✓ Updated ${Math.min(i + batchSize, updates.length)}/${updates.length}`);
        }

        console.log(`\n✅ Successfully backfilled ${needsUpdate} document(s) with employeeId!\n`);
        console.log('QR code scanning should now work correctly for all employees.\n');

    } catch (err) {
        console.error('❌ ERROR:', err.message);
        process.exit(1);
    }
}

// Parse command line arguments
const fix = process.argv.includes('--fix');

backfillEmployeeIds(fix).then(() => {
    process.exit(0);
}).catch(err => {
    console.error('❌ Fatal error:', err);
    process.exit(1);
});

/**
 * backfillRoleType.js — One-time migration script
 *
 * Copies `roleType` from private `employees` collection to `publicEmployees`.
 * Idempotent — safe to run multiple times. Skips docs that already have roleType.
 *
 * Usage:  node src/scripts/backfillRoleType.js
 */
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, writeBatch, doc } from 'firebase/firestore';

// ─── Firebase config (same as app) ───────────────────────────────
const firebaseConfig = {
    // Import your config from config/firebase.js or paste here
    apiKey: process.env.VITE_FIREBASE_API_KEY,
    authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function backfillRoleType() {
    console.log('─── Starting roleType backfill migration ───');

    // 1. Read all private employees
    const privateSnap = await getDocs(collection(db, 'employees'));
    const privateMap = new Map();
    privateSnap.docs.forEach(d => {
        const data = d.data();
        if (data.roleType) {
            privateMap.set(d.id, data.roleType);
        }
    });
    console.log(`Found ${privateMap.size} private employees with roleType`);

    // 2. Read all public employees
    const publicSnap = await getDocs(collection(db, 'publicEmployees'));
    console.log(`Found ${publicSnap.size} public employee docs`);

    // 3. Batch update — only docs missing roleType
    let updated = 0;
    let skipped = 0;
    let mismatched = 0;
    const batch = writeBatch(db);

    for (const pubDoc of publicSnap.docs) {
        const pubData = pubDoc.data();
        const privateRoleType = privateMap.get(pubDoc.id);

        if (!privateRoleType) {
            // No matching private doc with roleType — skip
            mismatched++;
            continue;
        }

        if (pubData.roleType === privateRoleType) {
            // Already correct — skip (idempotent)
            skipped++;
            continue;
        }

        batch.update(doc(db, 'publicEmployees', pubDoc.id), {
            roleType: privateRoleType,
        });
        updated++;
    }

    if (updated > 0) {
        await batch.commit();
    }

    console.log('─── Migration complete ───');
    console.log(`  Updated:    ${updated}`);
    console.log(`  Skipped:    ${skipped} (already had roleType)`);
    console.log(`  Mismatched: ${mismatched} (no private roleType found)`);

    if (mismatched > 0) {
        console.warn('⚠️ Some public docs had no matching private roleType. Investigate manually.');
    }

    process.exit(0);
}

backfillRoleType().catch(err => {
    console.error('❌ Migration FAILED:', err);
    process.exit(1);
});

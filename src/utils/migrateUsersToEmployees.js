/**
 * migrateUsersToEmployees.js
 *
 * One-time production migration.
 * Copies every document from the old `users` collection into `employees`,
 * preserving all fields and injecting `isDeleted: false` where missing.
 *
 * Safe to run multiple times — skips docs already in `employees` by checking
 * the original Firestore doc ID.
 *
 * Usage (browser console or a temporary admin route):
 *   import { migrateUsersToEmployees } from '../utils/migrateUsersToEmployees';
 *   const result = await migrateUsersToEmployees();
 *   console.log(result);
 */
import { collection, getDocs, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase';

export async function migrateUsersToEmployees() {
    console.log('[Migration] Reading from users collection...');
    const snapshot = await getDocs(collection(db, 'users'));

    if (snapshot.empty) {
        console.log('[Migration] users collection is empty — nothing to migrate.');
        return { migrated: 0, skipped: 0 };
    }

    // Check which IDs already exist in employees
    const existingSnap = await getDocs(collection(db, 'employees'));
    const existingIds = new Set(existingSnap.docs.map(d => d.id));

    let migrated = 0;
    let skipped = 0;

    for (const userDoc of snapshot.docs) {
        if (existingIds.has(userDoc.id)) {
            console.log(`[Migration] Skipping ${userDoc.id} — already in employees.`);
            skipped++;
            continue;
        }

        const data = userDoc.data();
        await setDoc(doc(db, 'employees', userDoc.id), {
            ...data,
            isDeleted: data.isDeleted ?? false,
            updatedAt: data.updatedAt ?? serverTimestamp(),
        });
        console.log(`[Migration] Migrated ${userDoc.id} (${data.name || 'unknown'})`);
        migrated++;
    }

    console.log(`[Migration] Done. Migrated: ${migrated}, Skipped: ${skipped}`);
    return { migrated, skipped };
}

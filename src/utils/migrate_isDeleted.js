/**
 * migrate_isDeleted.js
 * One-time migration: backfill isDeleted=false on legacy user documents
 * that were created before the soft-delete field was introduced.
 *
 * Run via browser console or a temporary admin-only button.
 * Safe to run multiple times — only writes to docs missing the field.
 *
 * Usage:
 *   import { runIsDeletedMigration } from '../utils/migrate_isDeleted';
 *   await runIsDeletedMigration();
 */
import { collection, getDocs, doc, writeBatch } from 'firebase/firestore';
import { db } from '../config/firebase';

export async function runIsDeletedMigration() {
    const snapshot = await getDocs(collection(db, 'users'));
    const batch = writeBatch(db);
    let count = 0;

    snapshot.docs.forEach(d => {
        const data = d.data();
        if (data.isDeleted === undefined || data.isDeleted === null) {
            batch.update(doc(db, 'users', d.id), { isDeleted: false });
            count++;
        }
    });

    if (count === 0) {
        console.log('[Migration] No documents needed backfill. All have isDeleted set.');
        return { migrated: 0 };
    }

    await batch.commit();
    console.log(`[Migration] Backfilled isDeleted=false on ${count} documents.`);
    return { migrated: count };
}

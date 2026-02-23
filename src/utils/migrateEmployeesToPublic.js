import { collection, getDocs, writeBatch, doc } from 'firebase/firestore';
import { db } from '../config/firebase';

const PUBLIC_EMPLOYEE_FIELDS = [
    'name', 'designation', 'phone', 'whatsapp', 'onLeave', 'availability', 'createdAt', 'updatedAt',
];

function sanitizeForPublic(data) {
    if (!data) return null;
    return Object.fromEntries(
        Object.entries(data).filter(([k]) => PUBLIC_EMPLOYEE_FIELDS.includes(k))
    );
}

export async function migrateEmployeesToPublic() {
    try {
        console.log('🚀 Starting migration: employees -> publicEmployees...');
        const snap = await getDocs(collection(db, 'employees'));

        let activeCount = 0;
        let deletedCount = 0;
        let batchCount = 0;

        let batch = writeBatch(db);

        for (const employeeDoc of snap.docs) {
            const data = employeeDoc.data();

            // Skip soft-deleted
            if (data.isDeleted === true) {
                deletedCount++;
                continue;
            }

            const publicData = sanitizeForPublic(data);
            const publicRef = doc(db, 'publicEmployees', employeeDoc.id);

            batch.set(publicRef, publicData, { merge: true });
            activeCount++;
            batchCount++;

            // Firestore batches max out at 500
            if (batchCount >= 400) {
                await batch.commit();
                console.log(`✅ Committed batch of ${batchCount} records`);
                batch = writeBatch(db);
                batchCount = 0;
            }
        }

        if (batchCount > 0) {
            await batch.commit();
            console.log(`✅ Committed final batch of ${batchCount} records`);
        }

        console.log(`🎉 Migration complete!`);
        console.log(`📊 Total Active Migrated: ${activeCount}`);
        console.log(`🗑️ Skipped (Deleted): ${deletedCount}`);
    } catch (error) {
        console.error('❌ Migration failed:', error);
    }
}

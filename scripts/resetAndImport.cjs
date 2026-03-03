/**
 * resetAndImport.cjs
 *
 * Firebase Employee Data — Full Reset & Re-Import
 * Run with: node scripts/resetAndImport.cjs --serviceAccount=./serviceAccountKey.json
 *
 * Steps:
 *  1. Backup existing employees + publicEmployees → JSON file
 *  2. Delete all documents from both collections
 *  3. Import new data with correct designations, batch writes
 *  4. Mirror sanitized fields into publicEmployees
 *  5. Validate (count, dedupe check) and print report
 */

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// ─── CLI ARG: service account path ──────────────────────────────────────────
const args = process.argv.slice(2);
const saArg = args.find(a => a.startsWith('--serviceAccount='));
if (!saArg) {
    console.error('❌  Missing required argument: --serviceAccount=<path-to-key.json>');
    process.exit(1);
}
const serviceAccountPath = path.resolve(saArg.replace('--serviceAccount=', ''));
if (!fs.existsSync(serviceAccountPath)) {
    console.error(`❌  Service account file not found: ${serviceAccountPath}`);
    process.exit(1);
}

// ─── Init Firebase Admin ─────────────────────────────────────────────────────
const serviceAccount = require(serviceAccountPath);
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();
const FieldValue = admin.firestore.FieldValue;

// ─── Designation Mapping (data.md human-readable → Firestore canonical) ──────
const DESIGNATION_MAP = {
    'Driver': 'driver',
    'Helper': 'helper',
    'Vehicle Supervisor': 'supervisor',
    'Field Supervisor': 'field_supervisor',
    'Executive Officer': 'executive_officer',
};

const ROLE_TYPE_MAP = {
    driver: 'field_team',
    supervisor: 'field_team',
    helper: 'field_team',
    field_supervisor: 'field_supervisor',
    executive_officer: 'executive',
};

// ─── Public fields mirrored into publicEmployees ─────────────────────────────
// Matches PUBLIC_EMPLOYEE_FIELDS in firebaseService.js
const PUBLIC_FIELDS = ['name', 'designation', 'roleType', 'phone', 'whatsapp', 'onLeave', 'availability', 'createdAt', 'updatedAt'];

// ─── Raw employee data from data.md ──────────────────────────────────────────
const RAW_DATA = [
    { name: 'Khaleeque', fatherName: 'Atta Muhammad', designation: 'Driver', cnic: '4420530484019', licenseNo: '919', phone: '03061396660', whatsapp: '03061396660', employeeId: 'EMP-010' },
    { name: 'M. Sajjad', fatherName: 'M. Ayoub', designation: 'Vehicle Supervisor', cnic: '4420568436653', licenseNo: null, phone: '03121695169', whatsapp: '03121695169', employeeId: 'EMP-011' },
    { name: 'Fida Hussain', fatherName: 'Wahid Bux', designation: 'Driver', cnic: '4420580390797', licenseNo: '140', phone: '03460396672', whatsapp: '03122548192', employeeId: 'EMP-012' },
    { name: 'Muhammad Ali', fatherName: 'M. Ramzan', designation: 'Vehicle Supervisor', cnic: '4510528155365', licenseNo: null, phone: '03126049047', whatsapp: '03442917413', employeeId: 'EMP-013' },
    { name: 'Mumtaz Ali', fatherName: 'Allah Dino', designation: 'Vehicle Supervisor', cnic: '4420560199637', licenseNo: null, phone: '03176088485', whatsapp: '03176088485', employeeId: 'EMP-014' },
    { name: 'Irfan Ali', fatherName: 'M. Ramzan', designation: 'Vehicle Supervisor', cnic: '4510504238649', licenseNo: null, phone: '03112382442', whatsapp: '03112382442', employeeId: 'EMP-015' },
    { name: 'M. Saifullha', fatherName: 'M. Ramzan', designation: 'Driver', cnic: '4420579130055', licenseNo: '263', phone: '03102245449', whatsapp: '03458763908', employeeId: 'EMP-009' },
    { name: 'Azhar Ali', fatherName: 'Muhammad Issaq', designation: 'Vehicle Supervisor', cnic: '4420197123399', licenseNo: null, phone: '03172074752', whatsapp: '03172074752', employeeId: 'EMP-016' },
    { name: 'Shahid Ali', fatherName: 'Shafi Muhammad', designation: 'Vehicle Supervisor', cnic: '4510552443959', licenseNo: null, phone: '03243227233', whatsapp: '03243227233', employeeId: 'EMP-017' },
    { name: 'Gulfam', fatherName: 'Ghulam Mustafa', designation: 'Vehicle Supervisor', cnic: '4420587584339', licenseNo: null, phone: '03038065055', whatsapp: '03038065055', employeeId: 'EMP-018' },
    { name: 'Nabi Bux', fatherName: 'Muhammad Nawaz', designation: 'Driver', cnic: '4420576155197', licenseNo: '724', phone: '03181380894', whatsapp: '03181380894', employeeId: 'EMP-019' },
    { name: 'Shahzado', fatherName: 'Hazor Bux', designation: 'Helper', cnic: '4510535943287', licenseNo: null, phone: '03202084788', whatsapp: '03202084788', employeeId: 'EMP-020' },
    { name: 'Asif Ali', fatherName: 'M. Ramzan', designation: 'Vehicle Supervisor', cnic: '4420550792339', licenseNo: null, phone: '03419852598', whatsapp: '03183056398', employeeId: 'EMP-021' },
    { name: 'Ahmed Nawaz', fatherName: 'Ghulam Ali', designation: 'Vehicle Supervisor', cnic: '4540371816131', licenseNo: null, phone: '03128442101', whatsapp: '03128442101', employeeId: 'EMP-022' },
    { name: 'Kashif Ali', fatherName: 'Jawad Ali', designation: 'Helper', cnic: '4240181646801', licenseNo: null, phone: '03123143954', whatsapp: '03123143954', employeeId: 'EMP-023' },
    { name: 'Zohaib Ali', fatherName: 'Ghulam Mustafa', designation: 'Helper', cnic: '4420578680099', licenseNo: null, phone: '03403970207', whatsapp: '03111208427', employeeId: 'EMP-024' },
    { name: 'Imtiaz Ahmed', fatherName: 'M. Mushtaq', designation: 'Vehicle Supervisor', cnic: '4130427803937', licenseNo: null, phone: '03129565333', whatsapp: '03129565333', employeeId: 'EMP-025' },
    { name: 'Miandad', fatherName: 'Darya Khan', designation: 'Vehicle Supervisor', cnic: '4410317007135', licenseNo: null, phone: '03112247662', whatsapp: '03112247662', employeeId: 'EMP-026' },
    { name: 'Azkar Hussain', fatherName: 'Haq Noor', designation: 'Driver', cnic: '3210310211197', licenseNo: '321031011197', phone: '03472825261', whatsapp: '03472825261', employeeId: 'EMP-008' },
    { name: 'Zawar Hussain', fatherName: 'Haq Nawaz Khan', designation: 'Driver', cnic: '4220178210097', licenseNo: '971', phone: '03152161757', whatsapp: '03152161757', employeeId: 'EMP-007' },
    { name: 'Adnan Masih', fatherName: 'Aslam Masih', designation: 'Vehicle Supervisor', cnic: '4210149665097', licenseNo: null, phone: '03472491620', whatsapp: '03472491620', employeeId: 'EMP-027' },
    { name: 'Imran', fatherName: 'Ameer Bux Baladi', designation: 'Vehicle Supervisor', cnic: '4420592192853', licenseNo: null, phone: '03112247662', whatsapp: '03112247662', employeeId: 'EMP-028' },
    { name: 'Saeed Ullah', fatherName: 'Naqash Zareen', designation: 'Field Supervisor', cnic: '1320221808985', licenseNo: '228', phone: '03432303279', whatsapp: '03432303279', employeeId: 'EMP-001' },
    { name: 'Haji Muhammad Afridi', fatherName: 'Risal Khan', designation: 'Field Supervisor', cnic: '4240193694305', licenseNo: '276', phone: '03122516620', whatsapp: '03122516620', employeeId: 'EMP-029' },
    { name: 'Ahmed Raza', fatherName: 'M. Siddiq', designation: 'Executive Officer', cnic: '4210147195639', licenseNo: null, phone: '03139090700', whatsapp: '03139090700', employeeId: 'EMP-005' },
    { name: 'Zeeshan Azam', fatherName: 'Azam', designation: 'Executive Officer', cnic: '4210112345678', licenseNo: null, phone: '03131203935', whatsapp: '03131203935', employeeId: 'EMP-004' },
    { name: 'Absar Ul Haq', fatherName: 'Aziz Ul Haq', designation: 'Executive Officer', cnic: '4210112345679', licenseNo: null, phone: '03121109255', whatsapp: '03323096586', employeeId: 'EMP-006' },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function sanitizeForPublic(data) {
    const out = {};
    for (const f of PUBLIC_FIELDS) {
        if (data[f] !== undefined) out[f] = data[f];
    }
    return out;
}

async function deleteCollection(collectionName) {
    const snapshot = await db.collection(collectionName).get();
    if (snapshot.empty) {
        console.log(`  ℹ️  ${collectionName}: already empty`);
        return 0;
    }
    const BATCH_SIZE = 400;
    let deleted = 0;
    let docs = snapshot.docs;
    while (docs.length > 0) {
        const chunk = docs.splice(0, BATCH_SIZE);
        const batch = db.batch();
        chunk.forEach(d => batch.delete(d.ref));
        await batch.commit();
        deleted += chunk.length;
    }
    return deleted;
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────
(async () => {
    console.log('\n════════════════════════════════════════════════════');
    console.log('  FoneRoster — Employee Data Reset & Re-Import');
    console.log('════════════════════════════════════════════════════\n');

    // ── STEP 1: BACKUP ─────────────────────────────────────────────
    console.log('📦  STEP 1 — Backup existing data...');
    const [empSnap, pubSnap] = await Promise.all([
        db.collection('employees').get(),
        db.collection('publicEmployees').get(),
    ]);
    const backup = {
        timestamp: new Date().toISOString(),
        employees: empSnap.docs.map(d => ({ _id: d.id, ...d.data() })),
        publicEmployees: pubSnap.docs.map(d => ({ _id: d.id, ...d.data() })),
    };
    const ts = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = path.resolve(`backup_employees_${ts}.json`);
    fs.writeFileSync(backupPath, JSON.stringify(backup, null, 2));
    console.log(`  ✅ Backup saved: ${backupPath}`);
    console.log(`     employees: ${backup.employees.length} docs`);
    console.log(`     publicEmployees: ${backup.publicEmployees.length} docs\n`);

    // ── STEP 2: DELETE ──────────────────────────────────────────────
    console.log('🗑️   STEP 2 — Deleting all existing documents...');
    const deletedEmp = await deleteCollection('employees');
    console.log(`  ✅ Deleted from employees: ${deletedEmp} docs`);
    const deletedPub = await deleteCollection('publicEmployees');
    console.log(`  ✅ Deleted from publicEmployees: ${deletedPub} docs\n`);

    // ── STEP 3: VALIDATE INPUT & MAP DESIGNATIONS ───────────────────
    console.log('🔍  STEP 3 — Validating import data...');
    const seenCnics = new Set();
    const seenEmpIds = new Set();
    const duplicates = { cnic: [], employeeId: [] };
    const records = [];

    for (const raw of RAW_DATA) {
        if (seenCnics.has(raw.cnic)) {
            duplicates.cnic.push({ name: raw.name, cnic: raw.cnic });
            console.warn(`  ⚠️  Duplicate CNIC skipped: ${raw.name} (${raw.cnic})`);
            continue;
        }
        if (seenEmpIds.has(raw.employeeId)) {
            duplicates.employeeId.push({ name: raw.name, employeeId: raw.employeeId });
            console.warn(`  ⚠️  Duplicate employeeId skipped: ${raw.name} (${raw.employeeId})`);
            continue;
        }

        const designation = DESIGNATION_MAP[raw.designation];
        if (!designation) {
            console.error(`  ❌ Unknown designation "${raw.designation}" for ${raw.name} — skipping`);
            continue;
        }
        const roleType = ROLE_TYPE_MAP[designation];

        seenCnics.add(raw.cnic);
        seenEmpIds.add(raw.employeeId);
        records.push({ raw, designation, roleType });
    }

    console.log(`  ✅ ${records.length} valid records ready (${RAW_DATA.length - records.length} skipped)\n`);

    // ── STEP 4: BATCH IMPORT ────────────────────────────────────────
    console.log('📤  STEP 4 — Importing records (batch writes)...');
    const BATCH_MAX = 400; // well under Firestore 500 limit
    let insertedCount = 0;

    // Process in chunks — each record needs 2 operations (employees + publicEmployees)
    // so keep chunks at 200 records to stay under the 500-op limit
    const CHUNK_SIZE = 200;
    for (let i = 0; i < records.length; i += CHUNK_SIZE) {
        const chunk = records.slice(i, i + CHUNK_SIZE);
        const batch = db.batch();

        for (const { raw, designation, roleType } of chunk) {
            const docRef = db.collection('employees').doc(); // auto-ID

            const payload = {
                employeeId: raw.employeeId.trim(),
                name: raw.name.trim(),
                fatherName: raw.fatherName.trim(),
                designation,
                roleType,
                cnic: raw.cnic.trim(),
                licenseNo: raw.licenseNo ? String(raw.licenseNo).trim() : null,
                phone: (raw.phone || '').replace(/\s+/g, ''),
                whatsapp: (raw.whatsapp || '').replace(/\s+/g, ''),
                onLeave: false,
                isActive: true,
                isDeleted: false,
                availability: { day: true, night: true },
                createdAt: FieldValue.serverTimestamp(),
                updatedAt: FieldValue.serverTimestamp(),
            };

            // Write to employees (full private doc)
            batch.set(docRef, payload);

            // Write to publicEmployees (sanitized mirror — no cnic, no licenseNo)
            const publicPayload = sanitizeForPublic(payload);
            batch.set(db.collection('publicEmployees').doc(docRef.id), publicPayload);
        }

        await batch.commit();
        insertedCount += chunk.length;
        console.log(`  → Batch committed: ${insertedCount}/${records.length} records`);
    }

    console.log(`\n  ✅ Import complete: ${insertedCount} employees inserted\n`);

    // ── STEP 5: VALIDATION ──────────────────────────────────────────
    console.log('✅  STEP 5 — Post-import validation...');
    const [finalEmp, finalPub] = await Promise.all([
        db.collection('employees').get(),
        db.collection('publicEmployees').get(),
    ]);

    // Count totals
    console.log(`  employees count:       ${finalEmp.size}`);
    console.log(`  publicEmployees count: ${finalPub.size}`);

    // Check for duplicate employeeId in Firestore
    const allEmpIds = finalEmp.docs.map(d => d.data().employeeId);
    const empIdSet = new Set(allEmpIds);
    const empIdDupes = allEmpIds.filter((v, i) => allEmpIds.indexOf(v) !== i);

    // Check for duplicate CNIC in Firestore
    const allCnics = finalEmp.docs.map(d => d.data().cnic);
    const cnicDupes = allCnics.filter((v, i) => allCnics.indexOf(v) !== i);

    // Designation breakdown
    const breakdown = {};
    finalEmp.docs.forEach(d => {
        const des = d.data().designation || 'unknown';
        breakdown[des] = (breakdown[des] || 0) + 1;
    });

    // ── FINAL REPORT ────────────────────────────────────────────────
    console.log('\n════════════════════════════════════════════════════');
    console.log('  MIGRATION REPORT');
    console.log('════════════════════════════════════════════════════');
    console.log(`  Backup file:           ${path.basename(backupPath)}`);
    console.log(`  Pre-import backup:     ${backup.employees.length} employees`);
    console.log(`  Deleted:               ${deletedEmp} employees, ${deletedPub} publicEmployees`);
    console.log(`  Inserted:              ${insertedCount} employees`);
    console.log(`  Firestore count:       ${finalEmp.size} employees, ${finalPub.size} publicEmployees`);
    console.log('');
    console.log('  Designation Breakdown:');
    for (const [des, count] of Object.entries(breakdown)) {
        const label = { driver: 'Drivers', supervisor: 'Vehicle Supervisors', helper: 'Helpers', field_supervisor: 'Field Supervisors', executive_officer: 'Executive Officers' }[des] || des;
        console.log(`    ${label}: ${count}`);
    }
    console.log('');
    if (empIdDupes.length === 0) {
        console.log('  ✅ No duplicate employeeId found');
    } else {
        console.log(`  ⚠️  Duplicate employeeIds: ${empIdDupes.join(', ')}`);
    }
    if (cnicDupes.length === 0) {
        console.log('  ✅ No duplicate CNIC found');
    } else {
        console.log(`  ⚠️  Duplicate CNICs: ${cnicDupes.join(', ')}`);
    }
    if (duplicates.cnic.length === 0 && duplicates.employeeId.length === 0) {
        console.log('  ✅ All 29 records inserted (no skips)');
    } else {
        if (duplicates.cnic.length) console.log(`  ⚠️  CNIC duplicates skipped: ${duplicates.cnic.map(d => d.name).join(', ')}`);
        if (duplicates.employeeId.length) console.log(`  ⚠️  EmployeeId duplicates skipped: ${duplicates.employeeId.map(d => d.name).join(', ')}`);
    }

    const hotlineCount = finalEmp.docs.filter(d => d.data().designation === 'executive_officer').length;
    const fieldSupCount = finalEmp.docs.filter(d => d.data().designation === 'field_supervisor').length;
    console.log('');
    console.log(`  Hotline view (executive_officer):       ${hotlineCount} officers`);
    console.log(`  Field supervisor panel (field_supervisor): ${fieldSupCount} supervisors`);
    console.log('');
    console.log('  Collection structure: SINGLE (employees + publicEmployees mirror)');
    console.log('════════════════════════════════════════════════════');
    console.log('  🎉 Migration COMPLETE');
    console.log('════════════════════════════════════════════════════\n');

    process.exit(0);
})().catch(err => {
    console.error('\n❌ Migration FAILED:', err.message || err);
    process.exit(1);
});

import 'dotenv/config';
import { initializeApp } from 'firebase/app';
import {
    getFirestore,
    collection,
    getDocs,
    updateDoc,
    deleteField,
    doc,
} from 'firebase/firestore';

// ─── Firebase Config (reads from .env — same vars as Vite) ─────────
const firebaseConfig = {
    apiKey: process.env.VITE_FIREBASE_API_KEY,
    authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function migrate() {
    console.log('🚀 Starting vehicle ID migration...\n');

    // 1. Load all vehicles for lookup
    const vehiclesSnap = await getDocs(collection(db, 'vehicles'));
    const vehicles = vehiclesSnap.docs.map(d => ({ id: d.id, ...d.data() }));
    console.log(`📦 Loaded ${vehicles.length} vehicles from Firestore.\n`);

    // Build lookup maps
    const byNumber = {};
    vehicles.forEach(v => {
        byNumber[v.number.toUpperCase()] = v.id;
    });

    // 2. Load all teams
    const teamsSnap = await getDocs(collection(db, 'teams'));
    const teams = teamsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
    console.log(`📋 Found ${teams.length} teams to inspect.\n`);

    let migrated = 0;
    let alreadyClean = 0;
    let noMatch = 0;

    for (const team of teams) {
        // Skip teams that already have a vehicleId and no legacy field
        if (team.vehicleId && !team.vehicle) {
            alreadyClean++;
            continue;
        }

        // If team has no vehicle info at all, skip
        if (!team.vehicleId && !team.vehicle) {
            alreadyClean++;
            continue;
        }

        // If team already has vehicleId but also has legacy field, just remove legacy
        if (team.vehicleId && team.vehicle) {
            console.log(`  🧹 Team "${team.name}" (${team.id}): has vehicleId, removing legacy 'vehicle' field`);
            await updateDoc(doc(db, 'teams', team.id), {
                vehicle: deleteField(),
            });
            migrated++;
            continue;
        }

        // team.vehicle exists but no vehicleId — resolve it
        const raw = team.vehicle;
        // Handle "TYPE — NUMBER" format
        const parts = raw.split(' — ');
        const numberPart = (parts.length > 1 ? parts[parts.length - 1] : parts[0]).trim().toUpperCase();

        const matchedVehicleId = byNumber[numberPart];

        if (matchedVehicleId) {
            console.log(`  ✅ Team "${team.name}" (${team.id}): "${raw}" → vehicleId: ${matchedVehicleId}`);
            await updateDoc(doc(db, 'teams', team.id), {
                vehicleId: matchedVehicleId,
                vehicle: deleteField(),
            });
            migrated++;
        } else {
            console.log(`  ⚠️  Team "${team.name}" (${team.id}): "${raw}" — no matching vehicle found! Skipping.`);
            noMatch++;
        }
    }

    console.log(`\n─── Migration Complete ───`);
    console.log(`  ✅ Migrated:      ${migrated}`);
    console.log(`  🟢 Already clean: ${alreadyClean}`);
    console.log(`  ⚠️  No match:     ${noMatch}`);
    console.log(`  📋 Total teams:   ${teams.length}\n`);

    if (noMatch > 0) {
        console.log('⚠️  Some teams had vehicle strings that could not be matched.');
        console.log('   You may need to manually fix those in the Firestore console.\n');
    }
}

migrate().catch(err => {
    console.error('❌ Migration failed:', err);
    process.exit(1);
});

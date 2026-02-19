/**
 * Firestore Seed Script — One-time data push
 * Run this from a temporary dev page or node script to populate Firestore.
 * 
 * Usage: Import and call seedAll() from browser console or a temp route.
 */
import { collection, addDoc, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase';

// ─── USERS DATA ───────────────────────────────────────────────
const usersData = [
    // ═══ DRIVERS ═══
    {
        name: 'Fida Hussain',
        fatherName: 'Wahid Bux',
        designation: 'driver',
        roleType: 'field_team',
        cnic: '4420580390797',
        licenseNo: '140',
        phone: '03460396672',
        whatsapp: '03122548192',
        availability: { day: true, night: true },
        onLeave: false,
    },
    {
        name: 'M. Saifullah',
        fatherName: 'Ahmed Khan',
        designation: 'driver',
        roleType: 'field_team',
        cnic: '4210168aborad',
        licenseNo: 'Pending',
        phone: '03012222222',
        whatsapp: '03012222222',
        availability: { day: true, night: false },
        onLeave: false,
    },
    {
        name: 'Nabi Bux',
        fatherName: 'Ali Bux',
        designation: 'driver',
        roleType: 'field_team',
        cnic: '4420512345678',
        licenseNo: 'Pending',
        phone: '03015555555',
        whatsapp: '03015555555',
        availability: { day: true, night: true },
        onLeave: false,
    },
    {
        name: 'Imran Baladi',
        fatherName: 'Yousuf',
        designation: 'driver',
        roleType: 'field_team',
        cnic: '4220144444444',
        licenseNo: 'L-88291',
        phone: '03011111111',
        whatsapp: '03011111111',
        availability: { day: true, night: false },
        onLeave: false,
    },
    {
        name: 'Miandad',
        fatherName: 'Unknown',
        designation: 'driver',
        roleType: 'field_team',
        cnic: '4210100000000',
        licenseNo: 'Pending',
        phone: '03018888888',
        whatsapp: '03018888888',
        availability: { day: true, night: true },
        onLeave: false,
    },
    {
        name: 'Azkar Hussain',
        fatherName: 'Unknown',
        designation: 'driver',
        roleType: 'field_team',
        cnic: '4210100000001',
        licenseNo: 'Pending',
        phone: '03019999999',
        whatsapp: '03019999999',
        availability: { day: true, night: true },
        onLeave: false,
    },
    {
        name: 'Zawar Hussain',
        fatherName: 'Unknown',
        designation: 'driver',
        roleType: 'field_team',
        cnic: '4210100000002',
        licenseNo: 'Pending',
        phone: '03017777777',
        whatsapp: '03017777777',
        availability: { day: false, night: true },
        onLeave: false,
    },

    // ═══ VEHICLE SUPERVISORS ═══
    {
        name: 'M. Sajjad',
        fatherName: 'Unknown',
        designation: 'supervisor',
        roleType: 'field_team',
        cnic: '4210100000003',
        licenseNo: null,
        phone: '03121695169',
        whatsapp: '03121695169',
        availability: { day: true, night: false },
        onLeave: false,
    },
    {
        name: 'Muhammad Ali',
        fatherName: 'Unknown',
        designation: 'supervisor',
        roleType: 'field_team',
        cnic: '4210100000004',
        licenseNo: null,
        phone: '03131234567',
        whatsapp: '03131234567',
        availability: { day: true, night: false },
        onLeave: false,
    },
    {
        name: 'Mumtaz Ali',
        fatherName: 'Allah Dino',
        designation: 'supervisor',
        roleType: 'field_team',
        cnic: '4420560199637',
        licenseNo: null,
        phone: '03176088485',
        whatsapp: '03176088485',
        availability: { day: true, night: true },
        onLeave: false,
    },
    {
        name: 'Irfan Ali',
        fatherName: 'Dada Bhai',
        designation: 'supervisor',
        roleType: 'field_team',
        cnic: '4210199999999',
        licenseNo: null,
        phone: '03112382442',
        whatsapp: '03112382442',
        availability: { day: true, night: false },
        onLeave: false,
    },
    {
        name: 'Azhar Ali',
        fatherName: 'Unknown',
        designation: 'supervisor',
        roleType: 'field_team',
        cnic: '4210100000005',
        licenseNo: null,
        phone: '03172074752',
        whatsapp: '03172074752',
        availability: { day: true, night: false },
        onLeave: false,
    },
    {
        name: 'Shahid Ali',
        fatherName: 'Unknown',
        designation: 'supervisor',
        roleType: 'field_team',
        cnic: '4210100000006',
        licenseNo: null,
        phone: '03181264764',
        whatsapp: '03181264764',
        availability: { day: true, night: true },
        onLeave: false,
    },
    {
        name: 'Gulfam',
        fatherName: 'Unknown',
        designation: 'supervisor',
        roleType: 'field_team',
        cnic: '4210100000007',
        licenseNo: null,
        phone: '03141234567',
        whatsapp: '03141234567',
        availability: { day: true, night: false },
        onLeave: false,
    },
    {
        name: 'Shahzado',
        fatherName: 'Unknown',
        designation: 'supervisor',
        roleType: 'field_team',
        cnic: '4210100000008',
        licenseNo: null,
        phone: '03151234567',
        whatsapp: '03151234567',
        availability: { day: false, night: true },
        onLeave: false,
    },
    {
        name: 'Asif Ali',
        fatherName: 'Unknown',
        designation: 'supervisor',
        roleType: 'field_team',
        cnic: '4210100000009',
        licenseNo: null,
        phone: '03161234567',
        whatsapp: '03161234567',
        availability: { day: true, night: false },
        onLeave: false,
    },
    {
        name: 'Ahmed Nawaz',
        fatherName: 'Unknown',
        designation: 'supervisor',
        roleType: 'field_team',
        cnic: '4210100000010',
        licenseNo: null,
        phone: '03171234567',
        whatsapp: '03171234567',
        availability: { day: true, night: false },
        onLeave: false,
    },
    {
        name: 'Kashif Ali',
        fatherName: 'Unknown',
        designation: 'supervisor',
        roleType: 'field_team',
        cnic: '4210100000011',
        licenseNo: null,
        phone: '03181234567',
        whatsapp: '03181234567',
        availability: { day: true, night: true },
        onLeave: false,
    },
    {
        name: 'Imtiaz Ahmed',
        fatherName: 'Unknown',
        designation: 'supervisor',
        roleType: 'field_team',
        cnic: '4210100000012',
        licenseNo: null,
        phone: '03129565333',
        whatsapp: '03129565333',
        availability: { day: true, night: false },
        onLeave: false,
    },

    // ═══ HELPER ═══
    {
        name: 'Zohaib Ali',
        fatherName: 'Unknown',
        designation: 'helper',
        roleType: 'field_team',
        cnic: '4210100000013',
        licenseNo: null,
        phone: '03211111111',
        whatsapp: '03211111111',
        availability: { day: true, night: true },
        onLeave: false,
    },

    // ═══ FIELD SUPERVISORS ═══
    {
        name: 'Haji M. Afridi',
        fatherName: 'Risal Khan',
        designation: 'field_supervisor',
        roleType: 'field_supervisor',
        cnic: '42401-9369430-5',
        licenseNo: 276,
        phone: '03005555555',
        whatsapp: '03005555555',
        availability: { day: true, night: true },
        onLeave: false,
    },
    {
        name: 'Saeed Ullah',
        fatherName: 'Naqash Zareen',
        designation: 'field_supervisor',
        roleType: 'field_supervisor',
        cnic: '13202-2180898-5',
        licenseNo: 228,
        phone: '03006666666',
        whatsapp: '03006666666',
        availability: { day: true, night: true },
        onLeave: false,
    },

    // ═══ EXECUTIVE OFFICERS (HOTLINE) ═══
    {
        name: 'Ahmed Raza',
        fatherName: 'M. Siddique',
        designation: 'executive_officer',
        roleType: 'executive',
        cnic: '4210133333333',
        licenseNo: null,
        phone: '03139090700',
        whatsapp: '03139090700',
        availability: { day: true, night: true },
        onLeave: false,
    },
    {
        name: 'Absar Ul Haq',
        fatherName: 'Azizul Haque',
        designation: 'executive_officer',
        roleType: 'executive',
        cnic: '4210111111111',
        licenseNo: null,
        phone: '03323096586',
        whatsapp: '03323096586',
        availability: { day: true, night: true },
        onLeave: false,
    },
    {
        name: 'Zeeshan Azam',
        fatherName: 'Azam',
        designation: 'executive_officer',
        roleType: 'executive',
        cnic: '4210122222222',
        licenseNo: null,
        phone: '03131203935',
        whatsapp: '03131203935',
        availability: { day: true, night: true },
        onLeave: false,
    },
];

// ─── TEAMS DATA ───────────────────────────────────────────────
const teamsData = [
    // Day Teams
    { name: 'Korangi', shift: 'Day', vehicle: 'JP-9377', route: 'Sector 15, Korangi Industrial, Bilal Colony', isBackup: false, assignments: {} },
    { name: 'DHA', shift: 'Day', vehicle: 'KT-9123', route: 'Phase 1-8, Clifton, Sea View', isBackup: false, assignments: {} },
    { name: 'Baldia', shift: 'Day', vehicle: 'KQ-5627', route: 'Baldia Town, Saeedabad, Naval Colony', isBackup: false, assignments: {} },
    { name: 'Lyari', shift: 'Day', vehicle: 'KQ-6012', route: 'Lyari General, Agra Taj, Baghdadi', isBackup: false, assignments: {} },
    { name: 'North Karachi', shift: 'Day', vehicle: 'KP-5109', route: 'Nagan Chowrangi, Buffer Zone, UP More', isBackup: false, assignments: {} },
    { name: 'Gulshan', shift: 'Day', vehicle: 'KQ-6013', route: 'Gulshan-e-Iqbal, NIPA, University Rd', isBackup: false, assignments: {} },
    { name: 'Nazimabad', shift: 'Day', vehicle: 'KQ-6016', route: 'North Nazimabad, Paposh, Board Office', isBackup: false, assignments: {} },
    // Night Teams
    { name: 'Karachi 1', shift: 'Night', vehicle: 'KP-6698', route: 'Central, East, West backup', isBackup: false, assignments: {} },
    { name: 'Karachi 2', shift: 'Night', vehicle: 'KT-9123', route: 'South, Malir, Korangi backup', isBackup: false, assignments: {} },
    { name: 'Night Team', shift: 'Night', vehicle: 'KT-9121', route: 'All Night Zones, Emergency, Backup', isBackup: false, assignments: {} },
];

// ─── CONFIG DATA ──────────────────────────────────────────────
const configData = {
    hotlineConfig: 'standard',
    hotlineRoster: {
        morning: '',
        evening: '',
        night: '',
        shift1: '',
        shift2: '',
    },
    fieldSupervisorRoster: {
        day: [],
        night: [],
    },
};

// ─── SEED FUNCTIONS ───────────────────────────────────────────
export async function seedUsers() {
    console.log('Seeding users...');
    for (const user of usersData) {
        await addDoc(collection(db, 'users'), {
            ...user,
            createdAt: serverTimestamp(),
        });
    }
    console.log(`✅ ${usersData.length} users seeded`);
}

export async function seedTeams() {
    console.log('Seeding teams...');
    for (const team of teamsData) {
        await addDoc(collection(db, 'teams'), {
            ...team,
            createdAt: serverTimestamp(),
        });
    }
    console.log(`✅ ${teamsData.length} teams seeded`);
}

export async function seedConfig() {
    console.log('Seeding config...');
    await setDoc(doc(db, 'config', 'roster'), configData);
    console.log('✅ Config seeded');
}

export async function seedAll() {
    try {
        await seedUsers();
        await seedTeams();
        await seedConfig();
        console.log('🎉 All data seeded successfully!');
        return true;
    } catch (error) {
        console.error('❌ Seed failed:', error);
        return false;
    }
}

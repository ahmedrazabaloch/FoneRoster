/**
 * Set Custom Claims for Firebase Users
 * 
 * This script sets Firebase custom claims for admin accounts.
 * Custom claims are required for the Firestore security rules to work.
 * 
 * Usage:
 *   1. Download your Firebase service account key from Firebase Console:
 *      Project Settings > Service Accounts > Generate New Private Key
 *   2. Save it as `serviceAccountKey.json` in the scripts folder
 *   3. Run: node scripts/setCustomClaims.cjs <email> <role>
 * 
 * Examples:
 *   node scripts/setCustomClaims.cjs superadmin@yourdomain.com superadmin
 *   node scripts/setCustomClaims.cjs 0312-3456789@admin.local admin
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
    console.error('');
    console.error('Please download your Firebase service account key:');
    console.error('1. Go to Firebase Console > Project Settings > Service Accounts');
    console.error('2. Click "Generate New Private Key"');
    console.error('3. Save the file as scripts/serviceAccountKey.json');
    console.error('');
    process.exit(1);
}

async function setCustomClaims(email, role) {
    const validRoles = ['superadmin', 'admin', 'team_user'];
    
    if (!validRoles.includes(role)) {
        console.error(`❌ Invalid role: ${role}`);
        console.error(`   Valid roles: ${validRoles.join(', ')}`);
        process.exit(1);
    }

    try {
        // Get user by email
        const user = await admin.auth().getUserByEmail(email);
        console.log(`Found user: ${user.email} (UID: ${user.uid})`);

        // Set custom claims
        await admin.auth().setCustomUserClaims(user.uid, { role });
        console.log(`✅ Custom claim set: role = "${role}"`);
        
        // Verify the claim was set
        const updatedUser = await admin.auth().getUser(user.uid);
        console.log('Current claims:', updatedUser.customClaims);
        
        console.log('');
        console.log('⚠️  IMPORTANT: The user must sign out and sign back in for the new claims to take effect.');
        
    } catch (err) {
        if (err.code === 'auth/user-not-found') {
            console.error(`❌ User not found: ${email}`);
            console.error('   Make sure the email is correct.');
        } else {
            console.error('❌ Error setting claims:', err.message);
        }
        process.exit(1);
    }
}

// Get command line arguments
const args = process.argv.slice(2);
if (args.length < 2) {
    console.log('Usage: node scripts/setCustomClaims.cjs <email> <role>');
    console.log('');
    console.log('Roles:');
    console.log('  superadmin  - Full access including user management');
    console.log('  admin       - Full CRUD, no user management');
    console.log('  team_user   - Read-only access');
    console.log('');
    console.log('Examples:');
    console.log('  node scripts/setCustomClaims.cjs admin@example.com superadmin');
    console.log('  node scripts/setCustomClaims.cjs 03121234567@admin.local admin');
    process.exit(0);
}

const [email, role] = args;
setCustomClaims(email, role).then(() => {
    console.log('');
    console.log('Done!');
    process.exit(0);
});

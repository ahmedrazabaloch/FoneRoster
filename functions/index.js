/**
 * Firebase Cloud Functions for FoneRoster
 * 
 * These functions handle server-side operations that require the Admin SDK:
 * - Setting custom claims when admins are created
 * - Triggering on Firestore writes to sync claims with profiles
 */

const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp();

/**
 * Trigger: When an admin profile is created in Firestore
 * Action: Set Firebase custom claims based on the role in the profile
 * 
 * This ensures that when a superadmin creates a new admin via the UI,
 * the new admin automatically gets the correct custom claims.
 */
exports.onAdminCreated = functions.firestore
    .document('admins/{uid}')
    .onCreate(async (snap, context) => {
        const uid = context.params.uid;
        const data = snap.data();
        const role = data.role;
        
        if (!role) {
            console.log(`No role specified for admin ${uid}, skipping claims`);
            return null;
        }

        try {
            await admin.auth().setCustomUserClaims(uid, { role });
            console.log(`✅ Set custom claim role="${role}" for user ${uid}`);
            
            // Update the profile to indicate claims are synced
            await snap.ref.update({ 
                claimsSynced: true,
                claimsSyncedAt: admin.firestore.FieldValue.serverTimestamp()
            });
            
            return { success: true };
        } catch (error) {
            console.error(`❌ Failed to set claims for ${uid}:`, error);
            throw error;
        }
    });

/**
 * Trigger: When an admin profile is updated in Firestore
 * Action: Sync custom claims if role changed
 */
exports.onAdminUpdated = functions.firestore
    .document('admins/{uid}')
    .onUpdate(async (change, context) => {
        const uid = context.params.uid;
        const before = change.before.data();
        const after = change.after.data();
        
        // Only update claims if role actually changed
        if (before.role === after.role) {
            return null;
        }
        
        const newRole = after.role;
        
        try {
            if (newRole) {
                await admin.auth().setCustomUserClaims(uid, { role: newRole });
                console.log(`✅ Updated custom claim role="${newRole}" for user ${uid}`);
            } else {
                // Remove claims if role is cleared
                await admin.auth().setCustomUserClaims(uid, {});
                console.log(`✅ Cleared custom claims for user ${uid}`);
            }
            
            // Update sync timestamp
            await change.after.ref.update({
                claimsSynced: true,
                claimsSyncedAt: admin.firestore.FieldValue.serverTimestamp()
            });
            
            return { success: true };
        } catch (error) {
            console.error(`❌ Failed to update claims for ${uid}:`, error);
            throw error;
        }
    });

/**
 * Trigger: When an admin is deactivated
 * Action: Revoke their refresh tokens to force re-auth
 */
exports.onAdminDeactivated = functions.firestore
    .document('admins/{uid}')
    .onUpdate(async (change, context) => {
        const uid = context.params.uid;
        const before = change.before.data();
        const after = change.after.data();
        
        // Check if isActive changed from true to false
        if (before.isActive === true && after.isActive === false) {
            try {
                await admin.auth().revokeRefreshTokens(uid);
                console.log(`✅ Revoked refresh tokens for deactivated admin ${uid}`);
                return { success: true };
            } catch (error) {
                console.error(`❌ Failed to revoke tokens for ${uid}:`, error);
                throw error;
            }
        }
        
        return null;
    });

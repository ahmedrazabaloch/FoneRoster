/**
 * services/index.js — Service Layer Exports
 *
 * Re-exports all services from a central location for cleaner imports.
 */

// Firebase core
export { db, auth, storage } from '../config/firebase';

// Service modules
export {
    employeeService,
    teamService,
    vehicleService,
    configService,
    authorityService,
} from './firebaseService';

export { adminService, phoneToEmail, DEFAULT_PERMISSIONS, MODULE_PERMISSIONS } from './adminService';
export { auditService, logActivity, AUDIT_ACTIONS } from './auditService';
export { uploadSignature, uploadPhoto } from './cloudinaryService';
export { verifyService } from './verifyService';

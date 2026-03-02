/**
 * verifyService.js — Public employee verification lookup
 *
 * Queries publicEmployees collection by employeeId.
 * Returns ONLY safe fields for the public verification page.
 *
 * Does NOT expose: cnic, licenseNo, phone, blood group, fatherName
 */
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase';

/** Safe fields returned to the verification page */
const VERIFY_SAFE_FIELDS = ['name', 'designation', 'roleType', 'onLeave', 'availability'];

/**
 * Fetch a single employee by their human-readable employeeId
 * from the publicEmployees collection (no auth required).
 *
 * @param {string} employeeId - Human-readable employee ID (e.g. "F1-001")
 * @returns {Promise<object|null>} Sanitized employee data or null
 */
export async function fetchPublicEmployee(employeeId) {
    if (!employeeId) return null;

    try {
        const q = query(
            collection(db, 'publicEmployees'),
            where('employeeId', '==', employeeId)
        );
        const snap = await getDocs(q);

        if (snap.empty) return null;

        const doc = snap.docs[0];
        const data = doc.data();

        // Sanitize — return ONLY safe fields
        const safe = { employeeId };
        for (const field of VERIFY_SAFE_FIELDS) {
            if (data[field] !== undefined) {
                safe[field] = data[field];
            }
        }
        return safe;
    } catch (err) {
        console.error('[verifyService] Error fetching employee:', err);
        return null;
    }
}

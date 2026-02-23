/**
 * validateEmployee.js
 * Central validation utility for employee data.
 * Used by: EmployeeCardMobile (inline edit), EmployeeForm (via Zod mirrors this logic)
 *
 * Returns { valid: boolean, errors: { fieldName: errorMessage } }
 * First error per field wins. All string fields trimmed before check.
 */

const CNIC_REGEX = /^\d{5}-\d{7}-\d{1}$/;
const MOBILE_REGEX = /^03\d{9}$/;

/**
 * @param {Object} data  Raw form/draft data
 * @returns {{ valid: boolean, errors: Object.<string, string> }}
 */
export function validateEmployee(data) {
    const errors = {};

    const str = (v) => (v || '').trim();

    const employeeId = str(data.employeeId);
    const name = str(data.name);
    const fatherName = str(data.fatherName);
    const phone = str(data.phone).replace(/\s+/g, '');
    const whatsapp = str(data.whatsapp).replace(/\s+/g, '');
    const cnic = str(data.cnic);

    if (!employeeId)
        errors.employeeId = 'Employee ID required';

    if (name.length < 2)
        errors.name = 'Name must be at least 2 characters';

    if (fatherName.length < 2)
        errors.fatherName = 'Father name must be at least 2 characters';

    if (!MOBILE_REGEX.test(phone))
        errors.phone = 'Mobile number must be 11 digits and start with 03';

    if (!MOBILE_REGEX.test(whatsapp))
        errors.whatsapp = 'WhatsApp must be 11 digits and start with 03';

    if (!CNIC_REGEX.test(cnic))
        errors.cnic = 'CNIC must be in format 12345-1234567-1';

    return {
        valid: Object.keys(errors).length === 0,
        errors,
    };
}

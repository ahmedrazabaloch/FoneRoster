/**
 * designations.js — Single source of truth for all designation options.
 *
 * Used by:
 *  - EmployeeForm.jsx (Add/Edit form Select dropdown)
 *  - EmployeeCardMobile.jsx (inline edit select)
 *  - validators.js (z.enum values must match these .value strings)
 */

export const DESIGNATION_OPTIONS = [
    { value: 'driver', label: 'Driver' },
    { value: 'supervisor', label: 'Vehicle Supervisor' },
    { value: 'helper', label: 'Helper' },
    { value: 'field_supervisor', label: 'Field Supervisor' },
    { value: 'executive_officer', label: 'Executive Officer (Hotline)' },
];

/** Map from designation value → roleType (used in EmployeeForm auto-set) */
export const ROLE_TYPE_MAP = {
    driver: 'field_team',
    supervisor: 'field_team',
    helper: 'field_team',
    field_supervisor: 'field_supervisor',
    executive_officer: 'executive',
};

/** All valid designation value strings (matches z.enum in validators.js) */
export const DESIGNATION_VALUES = DESIGNATION_OPTIONS.map(o => o.value);

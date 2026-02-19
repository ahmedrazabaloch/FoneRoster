// Role constants
export const ROLES = {
    DRIVER: 'Driver',
    SUPERVISOR: 'Supervisor',
    HELPER: 'Helper',
    HOTLINE: 'Hotline',
};

// Designation constants (maps to Firestore user.designation)
export const DESIGNATIONS = {
    DRIVER: 'driver',
    SUPERVISOR: 'supervisor',
    HELPER: 'helper',
    FIELD_SUPERVISOR: 'field_supervisor',
    EXECUTIVE_OFFICER: 'executive_officer',
};

// Role type constants (maps to Firestore user.roleType)
export const ROLE_TYPES = {
    FIELD_TEAM: 'field_team',
    FIELD_SUPERVISOR: 'field_supervisor',
    EXECUTIVE: 'executive',
};

// Shift constants
export const SHIFTS = {
    DAY: 'Day',
    NIGHT: 'Night',
};

// Hotline configs
export const HOTLINE_CONFIGS = {
    STANDARD: 'standard',
    LEAVE: 'leave',
};

export const MOCK_SITES = [
    { id: '10', address: 'Alfateh Hill, near Bismillah Colony', area: 'Orangi Town', zone: 'Baldia' },
    { id: '40', address: 'Plot No. 40/2, Block B, North Nazimabad', area: 'Nazimabad', zone: 'Nazimabad' },
    { id: '247', address: 'Korangi Industrial Area, Sector 15', area: 'Korangi', zone: 'Korangi' },
];

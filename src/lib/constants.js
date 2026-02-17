// Initial Teams Data
export const INITIAL_TEAMS = [
    // Day Teams (Standard 7)
    { id: 'd1', name: 'Korangi', shift: 'Day', vehicle: 'JP-9377', route: 'Sector 15, Korangi Industrial, Bilal Colony', isBackup: false },
    { id: 'd2', name: 'DHA', shift: 'Day', vehicle: 'KT-9123', route: 'Phase 1-8, Clifton, Sea View', isBackup: false },
    { id: 'd3', name: 'Baldia', shift: 'Day', vehicle: 'KQ-5627', route: 'Baldia Town, Saeedabad, Naval Colony', isBackup: false },
    { id: 'd4', name: 'Lyari', shift: 'Day', vehicle: 'KQ-6012', route: 'Lyari General, Agra Taj, Baghdadi', isBackup: false },
    { id: 'd5', name: 'North Karachi', shift: 'Day', vehicle: 'KP-5109', route: 'Nagan Chowrangi, Buffer Zone, UP More', isBackup: false },
    { id: 'd6', name: 'Gulshan', shift: 'Day', vehicle: 'KQ-6013', route: 'Gulshan-e-Iqbal, NIPA, University Rd', isBackup: false },
    { id: 'd7', name: 'Nazimabad', shift: 'Day', vehicle: 'KQ-6016', route: 'North Nazimabad, Paposh, Board Office', isBackup: false },

    // Night Teams (Standard 3)
    { id: 'n1', name: 'Karachi 1', shift: 'Night', vehicle: 'KP-6698', route: 'Central, East, West backup', isBackup: false },
    { id: 'n2', name: 'Karachi 2', shift: 'Night', vehicle: 'KT-9123', route: 'South, Malir, Korangi backup', isBackup: false },
    { id: 'n3', name: 'Night Team', shift: 'Night', vehicle: 'KT-9121', route: 'All Night Zones, Emergency, Backup', isBackup: false },
];

// Initial Employees Data
export const INITIAL_EMPLOYEES = [
    // Hotline
    { id: 101, name: 'Absar ul Haque', fatherName: 'Azizul Haque', role: 'Coordinator', phone: '0332-3096586', whatsapp: '0332-3096586', cnic: '42101-1111111-1', license: 'N/A', photo: null, onLeave: false },
    { id: 102, name: 'Zeeshan Azam', fatherName: 'Azam', role: 'Coordinator', phone: '0313-1203935', whatsapp: '0313-1203935', cnic: '42101-2222222-2', license: 'N/A', photo: null, onLeave: false },
    { id: 103, name: 'Ahmed Raza', fatherName: 'M. Siddique', role: 'Coordinator', phone: '0313-9090700', whatsapp: '0313-9090700', cnic: '42101-3333333-3', license: 'N/A', photo: null, onLeave: false },
    // Drivers
    { id: 201, name: 'Imran', fatherName: 'Yousuf', role: 'Driver', phone: '0301-1111111', whatsapp: '0301-1111111', cnic: '42201-4444444-4', license: 'L-88291', photo: null, onLeave: false },
    { id: 202, name: 'Sawal', fatherName: 'Kareem', role: 'Driver', phone: '0301-2222222', whatsapp: '0301-2222222', cnic: '42201-5555555-5', license: 'L-11223', photo: null, onLeave: false },
    { id: 203, name: 'Zakir', fatherName: 'Unknown', role: 'Driver', phone: '0301-3333333', whatsapp: '0301-3333333', cnic: '42101-0000000-0', license: 'Pending', photo: null, onLeave: false },
    { id: 204, name: 'Fida', fatherName: 'Unknown', role: 'Driver', phone: '0301-4444444', whatsapp: '0301-4444444', cnic: '42101-0000000-0', license: 'Pending', photo: null, onLeave: false },
    { id: 205, name: 'Nabi Bux', fatherName: 'Unknown', role: 'Driver', phone: '0301-5555555', whatsapp: '0301-5555555', cnic: '42101-0000000-0', license: 'Pending', photo: null, onLeave: false },
    { id: 206, name: 'Bilawal', fatherName: 'Unknown', role: 'Driver', phone: '0301-6666666', whatsapp: '0301-6666666', cnic: '42101-0000000-0', license: 'Pending', photo: null, onLeave: false },
    { id: 207, name: 'Khaliq', fatherName: 'Unknown', role: 'Driver', phone: '0301-7777777', whatsapp: '0301-7777777', cnic: '42101-0000000-0', license: 'Pending', photo: null, onLeave: false },
    { id: 208, name: 'Miandad', fatherName: 'Unknown', role: 'Driver', phone: '0301-8888888', whatsapp: '0301-8888888', cnic: '42101-0000000-0', license: 'Pending', photo: null, onLeave: false },
    // Supervisors
    { id: 301, name: 'Irfan Dada', fatherName: 'Dada Bhai', role: 'Supervisor', phone: '0311-2382442', whatsapp: '0311-2382442', cnic: '42101-9999999-9', license: 'N/A', photo: null, onLeave: false },
    { id: 302, name: 'Azhar', fatherName: 'Unknown', role: 'Supervisor', phone: '0317-2074752', whatsapp: '0317-2074752', cnic: '42101-0000000-0', license: 'N/A', photo: null, onLeave: false },
    { id: 303, name: 'Imtiaz', fatherName: 'Unknown', role: 'Supervisor', phone: '0312-9565333', whatsapp: '0312-9565333', cnic: '42101-0000000-0', license: 'N/A', photo: null, onLeave: false },
    { id: 304, name: 'Ahmed Khosa', fatherName: 'Unknown', role: 'Supervisor', phone: '0317-6088485', whatsapp: '0317-6088485', cnic: '42101-0000000-0', license: 'N/A', photo: null, onLeave: false },
    { id: 305, name: 'Sajjad', fatherName: 'Unknown', role: 'Supervisor', phone: '0312-1695169', whatsapp: '0312-1695169', cnic: '42101-0000000-0', license: 'N/A', photo: null, onLeave: false },
    { id: 306, name: 'Shahid', fatherName: 'Unknown', role: 'Supervisor', phone: '0318-1264764', whatsapp: '0318-1264764', cnic: '42101-0000000-0', license: 'N/A', photo: null, onLeave: false },
    { id: 307, name: 'Mumtaz', fatherName: 'Unknown', role: 'Supervisor', phone: '0317-6088485', whatsapp: '0317-6088485', cnic: '42101-0000000-0', license: 'N/A', photo: null, onLeave: false },
    // Helpers
    { id: 401, name: 'Ali', fatherName: 'Unknown', role: 'Helper', phone: '0321-1111111', whatsapp: '0321-1111111', cnic: '42101-0000000-0', license: 'N/A', photo: null, onLeave: false },
    { id: 402, name: 'Raza', fatherName: 'Unknown', role: 'Helper', phone: '0321-2222222', whatsapp: '0321-2222222', cnic: '42101-0000000-0', license: 'N/A', photo: null, onLeave: false },
    { id: 403, name: 'Khurram', fatherName: 'Unknown', role: 'Helper', phone: '0321-3333333', whatsapp: '0321-3333333', cnic: '42101-0000000-0', license: 'N/A', photo: null, onLeave: false },

    // Field Supervisors (Global)
    { id: 501, name: 'Rana Asif', fatherName: 'Unknown', role: 'Supervisor', phone: '0300-5555555', whatsapp: '0300-5555555', cnic: '42101-8888888-8', license: 'N/A', photo: null, onLeave: false },
    { id: 502, name: 'Kamran Ali', fatherName: 'Unknown', role: 'Supervisor', phone: '0300-6666666', whatsapp: '0300-6666666', cnic: '42101-7777777-7', license: 'N/A', photo: null, onLeave: false },
];

export const MOCK_SITES = [
    { id: '10', address: 'Alfateh Hill, near Bismillah Colony', area: 'Orangi Town', zone: 'Baldia' },
    { id: '40', address: 'Plot No. 40/2, Block B, North Nazimabad', area: 'Nazimabad', zone: 'Nazimabad' },
    { id: '247', address: 'Korangi Industrial Area, Sector 15', area: 'Korangi', zone: 'Korangi' },
];

// Role constants
export const ROLES = {
    DRIVER: 'Driver',
    SUPERVISOR: 'Supervisor',
    HELPER: 'Helper',
    HOTLINE: 'Hotline',
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

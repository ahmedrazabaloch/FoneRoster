export const CARD_WIDTH_MM = 54;
export const CARD_HEIGHT_MM = 85.6;

export const CARD_WIDTH_PX = 271;
export const CARD_HEIGHT_PX = 430;
export const CARD_RADIUS_PX = 16;

export const CARD_FONT_FAMILY = 'Montserrat, Inter, Helvetica, Arial, sans-serif';
export const EMERGENCY_CONTACT = '0313-2005170';
export const PROJECT_BADGE_TEXT = 'Zong Fuel Logistics Project';
export const BACK_HEADER_TEXT = 'Personal Details';

export const ADDRESS_LINES = [
    'Suite No. 302-A, Sea Breeze Plaza',
    'Shahrah-e-Faisal, Karachi',
    'Tel: 021-32783613',
];

export const COLORS = {
    primaryRed: '#E11D2F',
    darkGray: '#333333',
    lightGray: '#F3F3F3',
    mediumGray: '#666666',
    paleGray: '#D9D9D9',
};

export const DESIGNATION_LABELS = {
    driver: 'Driver',
    supervisor: 'Vehicle Supervisor',
    helper: 'Helper',
    field_supervisor: 'Field Supervisor',
    executive_officer: 'Executive Officer',
};

export const FRONT_LAYOUT = {
    logo: { left: 26, top: 23, width: 150, height: 46 },
    photo: { left: 34, top: 106, width: 203, height: 163, radius: 16 },
    textColumn: { left: 34, width: 203 },
    nameBlock: { top: 285, height: 22 },
    designationBlock: { top: 314, height: 14 },
    employeeIdBlock: { top: 342, height: 12 },
    projectBadge: { left: 28, top: 372, width: 215, height: 28 },
    qr: { left: 37, top: 405, size: 54 },
    signature: { left: 164, top: 401, width: 73, height: 17, lineY: 420, labelTop: 423 },
};

export const BACK_LAYOUT = {
    header: { left: 35, top: 22, width: 202, height: 29 },
    contentLeft: 35,
    contentTop: 74,
    fieldGap: 42,
    logo: { left: 66, top: 334, width: 150, height: 48 },
    addressTop: 388,
};

export function getDesignationLabel(designation) {
    return DESIGNATION_LABELS[designation] || designation || '-';
}

export function getEmployeeIdValue(employee) {
    return employee?.employeeId || employee?.id || '-';
}

export function getLicenseValue(employee) {
    return employee?.license || employee?.licenseNo || '-';
}

export function getBloodGroupValue(employee) {
    return employee?.bloodGroup || employee?.blood_group || employee?.blood || '-';
}

export function validatePhotoPosition(raw) {
    let parsed = raw;
    if (typeof parsed === 'string') {
        try {
            parsed = JSON.parse(parsed);
        } catch (e) {
            parsed = null;
        }
    }

    const safeNum = (val, min, max, def) => {
        const num = Number(val);
        if (isNaN(num)) return def;
        return Math.max(min, Math.min(max, num));
    };

    return {
        x: safeNum(parsed?.x, 0, 100, 50),
        y: safeNum(parsed?.y, 0, 100, 50),
        scale: safeNum(parsed?.scale, 0.5, 2.0, 1),
    };
}

export function getCardDetails(employee) {
    const photoPosition = validatePhotoPosition(employee?.photoPosition);

    return {
        name: employee?.name || '-',
        designation: getDesignationLabel(employee?.designation),
        designationRaw: employee?.designation || '-',
        employeeId: getEmployeeIdValue(employee),
        fatherName: employee?.fatherName || '-',
        cnic: employee?.cnic || '-',
        license: getLicenseValue(employee),
        bloodGroup: getBloodGroupValue(employee),
        emergencyContact: EMERGENCY_CONTACT,
        photoUrl: employee?.photoUrl || '',
        photoPosition,
        photoMeta: employee?.photoMeta || { w: 1, h: 1 },
        isCropped: employee?.isCropped || false,
    };
}

export function buildIdCardQrPayload(employee) {
    const employeeId = getEmployeeIdValue(employee);
    const domain = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_PUBLIC_DOMAIN)
        || 'https://fuelingteam.com';
    return `${domain}/verify/${encodeURIComponent(employeeId)}`;
}

export function truncateText(value, maxLength) {
    const text = String(value || '');
    if (text.length <= maxLength) return text;
    return `${text.slice(0, Math.max(0, maxLength - 3)).trimEnd()}...`;
}

/**
 * csvExport.js — Team-aggregated CSV export
 *
 * One row per team. Columns:
 *   Date, Vehicle Number, Team, Driver, Vehicle Supervisor, Helper, Contact
 *
 * Contact = Vehicle Supervisor phone.
 * Uses team.assignments = { Driver, Supervisor, Helper } structure.
 */

const HEADERS = [
    'Date',
    'Vehicle Number',
    'Team',
    'Driver',
    'Vehicle Supervisor',
    'Helper',
    'Contact',
];

function escapeCell(val) {
    const str = String(val ?? '');
    if (str.includes(',') || str.includes('\n') || str.includes('"')) {
        return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
}

/**
 * Build one CSV row for a team.
 */
function buildTeamRow(team, empMap, vehiclesMap) {
    const assignments = team.assignments || {};
    const driver = assignments.Driver ? empMap.get(assignments.Driver) : null;
    const supervisor = assignments.Supervisor ? empMap.get(assignments.Supervisor) : null;
    const helper = assignments.Helper ? empMap.get(assignments.Helper) : null;

    const vehicle = vehiclesMap[team.vehicleId];
    const vehicleNumber = vehicle ? vehicle.number : '';

    const cols = [
        new Date().toISOString().slice(0, 10),
        vehicleNumber,
        team.name || '',
        driver?.name || '',
        supervisor?.name || '',
        helper?.name || '',
        supervisor?.phone || '',
    ];
    return cols.map(escapeCell).join(',');
}

/**
 * Export a single team CSV.
 */
export function exportTeamCsv(team, employees, vehiclesMap = {}) {
    const empMap = new Map(employees.map(e => [e.id, e]));
    const csvLines = [
        HEADERS.join(','),
        buildTeamRow(team, empMap, vehiclesMap),
    ];
    triggerDownload(csvLines.join('\n'), `Team-${(team.name || 'Export').replace(/\s+/g, '_')}-${new Date().toISOString().slice(0, 10)}.csv`);
}

/**
 * Export multiple teams to a single CSV.
 */
export function exportMultiTeamCsv(teams, employees, vehiclesMap = {}) {
    const empMap = new Map(employees.map(e => [e.id, e]));
    const csvLines = [HEADERS.join(',')];

    for (const team of teams) {
        csvLines.push(buildTeamRow(team, empMap, vehiclesMap));
    }

    const dateStr = new Date().toISOString().slice(0, 10);
    const filename = teams.length === 1
        ? `Team-${(teams[0].name || 'Export').replace(/\s+/g, '_')}-${dateStr}.csv`
        : `Teams-Bulk-Export-${dateStr}.csv`;

    triggerDownload(csvLines.join('\n'), filename);
}

/**
 * Trigger browser file download.
 */
function triggerDownload(content, filename) {
    console.log('[csvExport] triggerDownload:', { filename, rows: content.split('\n').length - 1 });
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    setTimeout(() => {
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }, 100);
}

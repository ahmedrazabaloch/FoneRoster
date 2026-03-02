/**
 * generateIdCardPdf.js — Vector-Safe CR80 ID Card PDF Generator
 *
 * jsPDF + qrcode are DYNAMICALLY IMPORTED at generation time
 * to avoid bloating the initial bundle.
 *
 * CR80 Landscape: 85.6mm × 53.98mm (standard ID card)
 * All content is native PDF vector — no raster images for QR.
 *
 * Page 1: Front (header, photo, name, designation, ID, signature)
 * Page 2: Back (QR code as vector rects, phone, license, footer, microtext)
 *
 * Watermark: diagonal "F1" at 6% opacity.
 * Microtext: F1RS-{employeeId}-{YYYYMMDDHHmm}
 * Output:   F1-ID-{employeeId}.pdf
 */

// ─── Constants ─────────────────────────────────────────────────────

const W = 85.6;   // mm
const H = 53.98;  // mm

const RED = '#E10600';
const DARK = '#111827';
const GRAY = '#6B7280';
const LIGHT_GRAY = '#F3F4F6';

const DESIGNATION_LABELS = {
    driver: 'Driver',
    supervisor: 'Vehicle Supervisor',
    helper: 'Helper',
    field_supervisor: 'Field Supervisor',
    executive_officer: 'Executive Officer',
};

// ─── Helpers ───────────────────────────────────────────────────────

function formatTimestamp() {
    const d = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}${pad(d.getHours())}${pad(d.getMinutes())}`;
}

function hexToRgb(hex) {
    return [
        parseInt(hex.slice(1, 3), 16),
        parseInt(hex.slice(3, 5), 16),
        parseInt(hex.slice(5, 7), 16),
    ];
}

// ─── Watermark ─────────────────────────────────────────────────────

function drawWatermark(doc) {
    doc.saveGraphicsState();
    const gState = new doc.GState({ opacity: 0.06 });
    doc.setGState(gState);
    doc.setFontSize(8);
    doc.setTextColor(200, 200, 200);
    doc.setFont('helvetica', 'bold');

    for (let y = -20; y < H + 20; y += 8) {
        for (let x = -20; x < W + 20; x += 14) {
            doc.text('F1', x, y, { angle: 35 });
        }
    }

    doc.restoreGraphicsState();
}

// ─── Vector QR Code ────────────────────────────────────────────────

/**
 * Draw QR code as pure PDF vector rectangles.
 * Uses qrcode library's create() to get the raw boolean module matrix,
 * then draws each dark module as a filled rect.
 *
 * @param {jsPDF} doc
 * @param {Uint8Array} modules - QR module data (0 = light, 1 = dark)
 * @param {number} size - Number of modules per side
 * @param {number} x - Left edge in mm
 * @param {number} y - Top edge in mm
 * @param {number} qrSizeMm - Total QR size in mm
 */
function drawVectorQr(doc, modules, size, x, y, qrSizeMm) {
    const cellMm = qrSizeMm / size;
    doc.setFillColor(0, 0, 0);

    for (let row = 0; row < size; row++) {
        for (let col = 0; col < size; col++) {
            if (modules[row * size + col]) {
                doc.rect(
                    x + col * cellMm,
                    y + row * cellMm,
                    cellMm,
                    cellMm,
                    'F'
                );
            }
        }
    }
}

// ─── Signature line ────────────────────────────────────────────────

function drawSignatureLine(doc, y) {
    doc.setDrawColor(...hexToRgb(GRAY));
    doc.setLineWidth(0.15);
    doc.line(W - 30, y - 1, W - 5, y - 1);
}

// ─── Front Page ────────────────────────────────────────────────────

function drawFrontPage(doc, employee, signatureUrl) {
    const designationLabel = DESIGNATION_LABELS[employee.designation] || employee.designation || '';

    doc.setFillColor(255, 255, 255);
    doc.rect(0, 0, W, H, 'F');

    drawWatermark(doc);

    // Red header
    const headerH = 10;
    doc.setFillColor(...hexToRgb(RED));
    doc.rect(0, 0, W, headerH, 'F');

    // Logo box
    doc.setFillColor(255, 255, 255);
    doc.rect(2, 2.5, 3, 3, 'F');
    doc.setDrawColor(0);
    doc.setLineWidth(0.2);
    doc.rect(2, 2.5, 3, 3, 'S');
    doc.setFontSize(4);
    doc.setTextColor(...hexToRgb(RED));
    doc.text('F1', 3.5, 4.7, { align: 'center' });

    // Company text
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(255, 255, 255);
    doc.text('FORMULA ONE', 7, 5);
    doc.setFontSize(5);
    doc.setTextColor(255, 200, 200);
    doc.text('TELECOM LOGISTICS', 7, 8);

    // Yellow accent
    doc.setFillColor(250, 204, 21);
    doc.rect(0, headerH, W, 0.8, 'F');

    // Photo area
    const photoW = 18;
    const photoH = 22;
    const photoX = 6;
    const photoY = headerH + 3;

    doc.setFillColor(...hexToRgb(LIGHT_GRAY));
    doc.rect(photoX, photoY, photoW, photoH, 'F');
    doc.setDrawColor(0);
    doc.setLineWidth(0.4);
    doc.rect(photoX, photoY, photoW, photoH, 'S');

    if (employee.photoUrl) {
        try {
            doc.addImage(employee.photoUrl, 'JPEG', photoX + 0.3, photoY + 0.3, photoW - 0.6, photoH - 0.6);
        } catch { /* keep placeholder */ }
    }

    // Name + details (beside photo)
    const detailX = photoX + photoW + 5;
    const nameY = photoY + 6;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    doc.text((employee.name || '').toUpperCase(), detailX, nameY);

    // Designation badge
    const badgeY = nameY + 4;
    const badgeText = designationLabel.toUpperCase();
    doc.setFontSize(5.5);
    const badgeW = doc.getTextWidth(badgeText) + 4;
    doc.setFillColor(0, 0, 0);
    doc.rect(detailX, badgeY - 2.2, badgeW, 3.5, 'F');
    doc.setTextColor(255, 255, 255);
    doc.text(badgeText, detailX + 2, badgeY);

    // Employee ID
    const idY = badgeY + 5;
    const idText = employee.employeeId || '—';
    doc.setFont('courier', 'bold');
    doc.setFontSize(6);
    doc.setTextColor(0, 0, 0);
    doc.setFillColor(...hexToRgb(LIGHT_GRAY));
    const idW = doc.getTextWidth(idText) + 4;
    doc.rect(detailX, idY - 2, idW, 3.5, 'F');
    doc.setDrawColor(0);
    doc.setLineWidth(0.15);
    doc.rect(detailX, idY - 2, idW, 3.5, 'S');
    doc.text(idText, detailX + 2, idY);

    // Authority signature
    const sigY = H - 8;
    if (signatureUrl) {
        try {
            doc.addImage(signatureUrl, 'PNG', W - 30, sigY - 5, 20, 6);
        } catch {
            drawSignatureLine(doc, sigY);
        }
    } else {
        drawSignatureLine(doc, sigY);
    }

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(3.5);
    doc.setTextColor(...hexToRgb(GRAY));
    doc.text('AUTHORIZED SIGNATORY', W - 17.5, sigY + 1, { align: 'center' });

    // Bottom bar
    doc.setFillColor(0, 0, 0);
    doc.rect(0, H - 2, W, 2, 'F');
}

// ─── Back Page ─────────────────────────────────────────────────────

function drawBackPage(doc, employee, qrModules, qrSize) {
    const isDriver = employee.designation === 'driver';

    doc.setFillColor(255, 255, 255);
    doc.rect(0, 0, W, H, 'F');

    drawWatermark(doc);

    // Dark header
    const headerH = 7;
    doc.setFillColor(...hexToRgb(DARK));
    doc.rect(0, 0, W, headerH, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(5);
    doc.setTextColor(255, 255, 255);
    doc.text('VERIFICATION CARD', W / 2, 4.5, { align: 'center' });

    // QR Code — PURE VECTOR
    const qrMm = 22;
    const qrX = 8;
    const qrY = headerH + 4;

    // QR border
    doc.setDrawColor(0);
    doc.setLineWidth(0.3);
    doc.rect(qrX - 1, qrY - 1, qrMm + 2, qrMm + 2, 'S');

    // Draw QR modules as filled rects
    drawVectorQr(doc, qrModules, qrSize, qrX, qrY, qrMm);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(3);
    doc.setTextColor(...hexToRgb(GRAY));
    doc.text('SCAN TO VERIFY', qrX + qrMm / 2, qrY + qrMm + 3, { align: 'center' });

    // Details (beside QR)
    const detailX = qrX + qrMm + 8;
    let detailY = headerH + 6;

    // Phone
    doc.setFillColor(...hexToRgb(LIGHT_GRAY));
    doc.rect(detailX, detailY - 2, W - detailX - 6, 6, 'F');
    doc.setDrawColor(0);
    doc.setLineWidth(0.15);
    doc.rect(detailX, detailY - 2, W - detailX - 6, 6, 'S');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(3.5);
    doc.setTextColor(...hexToRgb(GRAY));
    doc.text('PHONE', detailX + 1.5, detailY);
    doc.setFont('courier', 'bold');
    doc.setFontSize(6);
    doc.setTextColor(0, 0, 0);
    doc.text(employee.phone || '—', detailX + 1.5, detailY + 3);

    // License (driver only)
    if (isDriver && employee.licenseNo && employee.licenseNo !== 'N/A') {
        detailY += 8;
        doc.setFillColor(254, 249, 195);
        doc.rect(detailX, detailY - 2, W - detailX - 6, 6, 'F');
        doc.setDrawColor(0);
        doc.rect(detailX, detailY - 2, W - detailX - 6, 6, 'S');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(3.5);
        doc.setTextColor(161, 98, 7);
        doc.text('DRIVING LICENSE', detailX + 1.5, detailY);
        doc.setFont('courier', 'bold');
        doc.setFontSize(6);
        doc.setTextColor(0, 0, 0);
        doc.text(employee.licenseNo, detailX + 1.5, detailY + 3);
    }

    // Red footer
    const footerH = 5;
    doc.setFillColor(...hexToRgb(RED));
    doc.rect(0, H - footerH, W, footerH, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(3.5);
    doc.setTextColor(255, 255, 255);
    doc.text('PROPERTY OF FORMULA ONE TELECOM LOGISTICS', W / 2, H - footerH + 2.5, { align: 'center' });
    doc.setFontSize(2.8);
    doc.setTextColor(255, 200, 200);
    doc.text('If found, please return to the nearest office', W / 2, H - footerH + 4, { align: 'center' });

    // Microtext
    const microtext = `F1RS-${employee.employeeId || 'UNKNOWN'}-${formatTimestamp()}`;
    doc.setFont('courier', 'normal');
    doc.setFontSize(2);
    doc.setTextColor(200, 200, 200);
    doc.text(microtext, W / 2, H - 0.3, { align: 'center' });
}

// ─── Main Export ───────────────────────────────────────────────────

/**
 * Generate and download a CR80 ID card PDF.
 *
 * jsPDF and qrcode are dynamically imported at call time
 * so they don't bloat the initial application bundle.
 *
 * @param {Object} employee - Full employee document
 * @param {Object} [options]
 * @param {string} [options.signatureUrl] - URL of authority signature image
 * @returns {Promise<void>}
 */
export async function generateIdCardPdf(employee, options = {}) {
    // ── Dynamic imports (keeps initial bundle light) ──
    const [{ jsPDF }, QRCodeLib] = await Promise.all([
        import('jspdf'),
        import('qrcode'),
    ]);

    const QRCode = QRCodeLib.default || QRCodeLib;

    // ── Generate QR matrix (vector-safe) ──
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://foneroster.web.app';
    const verifyUrl = `${origin}/verify/${employee.employeeId || ''}`;

    const qr = QRCode.create(verifyUrl, { errorCorrectionLevel: 'H' });
    const qrModules = qr.modules.data;   // Uint8Array — 1 = dark, 0 = light
    const qrSize = qr.modules.size;      // modules per side

    // ── Create PDF ──
    const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: [H, W],
    });

    // Page 1 — Front
    drawFrontPage(doc, employee, options.signatureUrl);

    // Page 2 — Back
    doc.addPage([H, W], 'landscape');
    drawBackPage(doc, employee, qrModules, qrSize);

    // Save
    const filename = `F1-ID-${employee.employeeId || 'UNKNOWN'}.pdf`;
    doc.save(filename);
}

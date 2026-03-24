/**
 * generateIdCardPdf.js — Browser-native print-to-PDF
 *
 * Uses window.print() with @page sizing for true vector output.
 * No rasterisation, no html2canvas, no jsPDF.
 */

// ── Constants ──────────────────────────────────────────────────────
const PAGE_W_MM = 54;
const PAGE_H_MM = 85.6;
const PX_PER_MM = 96 / 25.4; // CSS px per mm

// ── Canvas → <img> (QRCodeCanvas won't survive cloneNode) ────────
function replaceCanvases(originalNode, clonedNode) {
    const origCanvases = originalNode.querySelectorAll('canvas');
    const clonedCanvases = clonedNode.querySelectorAll('canvas');

    origCanvases.forEach((c, i) => {
        const img = document.createElement('img');
        img.src = c.toDataURL('image/png');
        img.style.width = `${c.offsetWidth}px`;
        img.style.height = `${c.offsetHeight}px`;
        img.style.display = 'block';
        clonedCanvases[i]?.replaceWith(img);
    });
}

// ── Build one print-page wrapper ─────────────────────────────────
function buildPage(originalNode, scale) {
    const clone = originalNode.cloneNode(true);
    replaceCanvases(originalNode, clone);

    clone.style.transform = `scale(${scale})`;
    clone.style.transformOrigin = 'top left';

    const page = document.createElement('div');
    page.className = 'id-card-print-page';
    page.appendChild(clone);
    return page;
}

// ── Public API ───────────────────────────────────────────────────
export async function generateIdCardPdf(_employee, options = {}) {
    const frontNode = options?.frontRef?.current;
    const backNode = options?.backRef?.current;

    if (!frontNode || !backNode) {
        throw new Error('Card preview is not ready for export.');
    }

    // Wait for all web-fonts before cloning
    await document.fonts.ready;

    // Scale card pixels into the CR80 page
    const cardW = frontNode.offsetWidth;  // 300
    const cardH = frontNode.offsetHeight; // 480
    const printScale = Math.min(
        (PAGE_W_MM * PX_PER_MM) / cardW,
        (PAGE_H_MM * PX_PER_MM) / cardH,
    );

    // ── Print container ──────────────────────────────────────────
    const printArea = document.createElement('div');
    printArea.id = 'id-card-print-area';
    printArea.appendChild(buildPage(frontNode, printScale));
    printArea.appendChild(buildPage(backNode, printScale));

    // ── Inject print-only stylesheet ─────────────────────────────
    const style = document.createElement('style');
    style.id = 'id-card-print-style';
    style.textContent = `
        @page {
            size: ${PAGE_W_MM}mm ${PAGE_H_MM}mm;
            margin: 0;
        }

        /* Hidden on screen */
        #id-card-print-area { display: none; }

        @media print {
            /* Hide everything except the print area */
            body > *:not(#id-card-print-area) { display: none !important; }

            #id-card-print-area {
                display: block !important;
                position: absolute;
                top: 0;
                left: 0;
            }

            .id-card-print-page {
                width: ${PAGE_W_MM}mm;
                height: ${PAGE_H_MM}mm;
                overflow: hidden;
                page-break-after: always;
            }

            .id-card-print-page:last-child {
                page-break-after: avoid;
            }
        }
    `;

    document.head.appendChild(style);
    document.body.appendChild(printArea);

    // ── Cleanup after print dialog closes ────────────────────────
    const cleanup = () => {
        style.remove();
        printArea.remove();
        window.removeEventListener('afterprint', cleanup);
    };
    window.addEventListener('afterprint', cleanup);

    // ── Trigger browser print / Save as PDF ──────────────────────
    window.print();
}

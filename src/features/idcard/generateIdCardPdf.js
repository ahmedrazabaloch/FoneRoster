/**
 * generateIdCardPdf.js — html2canvas + jsPDF Pipeline (v3)
 *
 * ROOT-CAUSE FIX:
 * html2canvas does not respect implicit DOM stacking order for absolutely
 * positioned elements without explicit z-index. The card's inline <svg>
 * background (child 0) was being rendered ON TOP of the content <div>
 * (child 1), causing text (name, designation, employee ID, badge) to appear
 * faded/invisible in the PDF — the SVG pattern was painting over the text.
 *
 * Additionally, html2canvas has poor support for inline <svg> elements.
 * Rendering them as <img src="data:image/svg+xml..."> is far more reliable.
 *
 * Fix strategy (all temporary — preview is never modified):
 * 1. Convert direct-child <svg> to <img data-uri> before capture
 * 2. Set explicit ascending z-index on all card children so text content
 *    (last child) always renders above background (first child)
 * 3. Strip border-radius + box-shadow for clean rectangular print output
 * 4. Capture actual card element (firstElementChild), not wrapper div
 * 5. 4× rasterization scale → ~300 DPI at CR80 dimensions
 * 6. Restore all original DOM after capture
 */
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

// ── CR80 card dimensions ───────────────────────────────────────────
const PAGE_W_MM = 54;
const PAGE_H_MM = 85.6;
const RASTER_SCALE = 4; // 4× → crisp text at print resolution

// ── SVG → <img> conversion ────────────────────────────────────────

/**
 * Replace all direct-child <svg> in cardEl with <img> equivalents.
 * html2canvas renders <img src="data:image/svg+xml"> far more reliably
 * than inline <svg>, and img elements integrate cleanly into z-index
 * stacking layers.
 *
 * Returns array of { img, svg } for restoration after capture.
 */
function replaceSvgsWithImgs(cardEl) {
    const swaps = [];
    for (const svg of Array.from(cardEl.querySelectorAll(':scope > svg'))) {
        const svgStr = new XMLSerializer().serializeToString(svg);
        const dataUri =
            'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgStr);

        const img = document.createElement('img');
        img.src = dataUri;

        // Copy positioning from the live computed style
        const cs = window.getComputedStyle(svg);
        img.style.position = cs.position;
        img.style.top = cs.top;
        img.style.left = cs.left;
        img.style.right = cs.right;
        img.style.bottom = cs.bottom;
        img.style.width = cs.width;
        img.style.height = cs.height;
        img.style.pointerEvents = 'none';
        img.style.userSelect = 'none';

        svg.parentNode.replaceChild(img, svg);
        swaps.push({ img, svg });
    }
    return swaps;
}

/**
 * Wait for all swapped <img> elements to finish loading their data URIs.
 */
function waitForImgs(swaps) {
    return Promise.all(
        swaps.map(({ img }) =>
            img.complete
                ? Promise.resolve()
                : new Promise((resolve) => {
                      img.onload = resolve;
                      img.onerror = resolve; // never block on error
                  })
        )
    );
}

// ── Card Capture ───────────────────────────────────────────────────

/**
 * Capture a single card side. All DOM modifications are temporary and
 * fully restored after the canvas is produced.
 *
 * Card DOM structure (both front and back):
 *   <div style={baseCardStyle}>        ← cardEl (300×480, absolute children)
 *     <svg .../>                        ← background (must be lowest z)
 *     [<div .../>]                      ← optional watermark (mid z)
 *     <div ...>text content</div>       ← MUST be highest z
 *   </div>
 */
async function captureCard(wrapperNode) {
    // The ref is on a wrapper <div> — the styled card is firstElementChild
    const cardEl = wrapperNode.firstElementChild || wrapperNode;

    // ── 1. Save original card styles ────────────────────────────
    const savedCard = {
        borderRadius: cardEl.style.borderRadius,
        boxShadow: cardEl.style.boxShadow,
    };

    // ── 2. Strip print-unfriendly styles ────────────────────────
    cardEl.style.borderRadius = '0';
    cardEl.style.boxShadow = 'none';

    // ── 3. Replace inline <svg> with <img> tags ─────────────────
    const svgSwaps = replaceSvgsWithImgs(cardEl);
    await waitForImgs(svgSwaps);

    // ── 4. Fix z-index stacking on ALL children ─────────────────
    // After SVG→img swap, children are: [img(bg), ...opt divs, div(content)]
    // Give ascending z-index so the content overlay (last child) is
    // guaranteed to render on top of the background image (first child).
    const children = Array.from(cardEl.children);
    const savedZIndex = children.map((c) => c.style.zIndex);
    children.forEach((child, i) => {
        child.style.zIndex = String((i + 1) * 10);
    });

    // ── 5. Capture at high DPI ──────────────────────────────────
    const canvas = await html2canvas(cardEl, {
        scale: RASTER_SCALE,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
        // Use exact card pixel dimensions — prevents aspect ratio skew
        width: cardEl.offsetWidth,
        height: cardEl.offsetHeight,
        // Compensate for any page scroll so capture area is correct
        scrollX: -window.scrollX,
        scrollY: -window.scrollY,
    });

    // ── 6. Restore everything (reverse order) ───────────────────
    // Restore z-index
    children.forEach((child, i) => {
        child.style.zIndex = savedZIndex[i];
    });
    // Swap img back to original svg
    svgSwaps.forEach(({ img, svg }) => {
        img.parentNode.replaceChild(svg, img);
    });
    // Restore card styles
    cardEl.style.borderRadius = savedCard.borderRadius;
    cardEl.style.boxShadow = savedCard.boxShadow;

    return canvas;
}

// ── Public API ─────────────────────────────────────────────────────

export async function generateIdCardPdf(_employee, options = {}) {
    const frontNode = options?.frontRef?.current;
    const backNode = options?.backRef?.current;

    if (!frontNode || !backNode) {
        throw new Error('Card preview is not ready for export.');
    }

    // ── Pre-capture: ensure fonts + images are fully painted ────
    await document.fonts.ready;
    await new Promise((r) => setTimeout(r, 300));

    // ── Capture both sides sequentially (avoids DOM race conditions) ─
    const frontCanvas = await captureCard(frontNode);
    const backCanvas = await captureCard(backNode);

    // ── Build CR80 PDF ──────────────────────────────────────────
    const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: [PAGE_W_MM, PAGE_H_MM],
        compress: true,
    });

    // Front — full bleed, edge-to-edge
    pdf.addImage(
        frontCanvas.toDataURL('image/png'),
        'PNG',
        0,
        0,
        PAGE_W_MM,
        PAGE_H_MM,
        undefined,
        'FAST'
    );

    // Back
    pdf.addPage([PAGE_W_MM, PAGE_H_MM], 'portrait');
    pdf.addImage(
        backCanvas.toDataURL('image/png'),
        'PNG',
        0,
        0,
        PAGE_W_MM,
        PAGE_H_MM,
        undefined,
        'FAST'
    );

    // ── Download ────────────────────────────────────────────────
    const empId = _employee?.employeeId || 'card';
    const safeName = String(empId).replace(/[^a-zA-Z0-9_-]/g, '_');
    pdf.save(`ID_Card_${safeName}.pdf`);
}

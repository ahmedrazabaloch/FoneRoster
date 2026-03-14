function sanitizeFilePart(value) {
    return String(value || 'employee')
        .trim()
        .replace(/[\\/:*?"<>|]/g, '-')
        .replace(/\s+/g, '_')
        .slice(0, 64);
}

async function renderCardImage(node, html2canvas) {
    const canvas = await html2canvas(node, {
        scale: 4,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
    });

    return canvas.toDataURL('image/png');
}

export async function generateIdCardPdf(employee, options = {}) {
    const frontNode = options?.frontRef?.current;
    const backNode = options?.backRef?.current;

    if (!frontNode || !backNode) {
        throw new Error('Card preview is not ready for export.');
    }

    const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
        import('html2canvas'),
        import('jspdf'),
    ]);

    const [imgData, backImgData] = await Promise.all([
        renderCardImage(frontNode, html2canvas),
        renderCardImage(backNode, html2canvas),
    ]);

    const pdf = new jsPDF({ unit: 'mm', format: [54, 85.6] });
    pdf.addImage(imgData, 'PNG', 0, 0, 54, 85.6);
    pdf.addPage([54, 85.6]);
    pdf.addImage(backImgData, 'PNG', 0, 0, 54, 85.6);

    const employeeName = sanitizeFilePart(employee?.name || employee?.employeeId || 'employee');
    pdf.save(`${employeeName}_ID_Card.pdf`);
}

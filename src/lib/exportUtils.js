import XLSX from 'xlsx-js-style';

// ─── Shared Style Tokens ────────────────────────────

const BRAND_BLUE   = '0D47A1';
const BRAND_DARK   = '1E3A8A';
const GREEN        = '10B981';
const RED          = 'EF4444';
const LIGHT_GRAY   = 'F1F5F9';
const MED_GRAY     = 'E2E8F0';
const WHITE        = 'FFFFFF';
const BLACK        = '000000';

const thinBorder = {
  top:    { style: 'thin', color: { rgb: MED_GRAY } },
  bottom: { style: 'thin', color: { rgb: MED_GRAY } },
  left:   { style: 'thin', color: { rgb: MED_GRAY } },
  right:  { style: 'thin', color: { rgb: MED_GRAY } },
};

const headerStyle = {
  font: { bold: true, color: { rgb: WHITE }, sz: 12, name: 'Calibri' },
  fill: { fgColor: { rgb: BRAND_BLUE } },
  alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
  border: thinBorder,
};

const titleStyle = {
  font: { bold: true, color: { rgb: WHITE }, sz: 16, name: 'Calibri' },
  fill: { fgColor: { rgb: BRAND_DARK } },
  alignment: { horizontal: 'center', vertical: 'center' },
  border: thinBorder,
};

const subtitleStyle = {
  font: { bold: false, color: { rgb: 'CBD5E1' }, sz: 10, name: 'Calibri' },
  fill: { fgColor: { rgb: BRAND_DARK } },
  alignment: { horizontal: 'center', vertical: 'center' },
  border: thinBorder,
};

const kpiLabelStyle = {
  font: { bold: true, color: { rgb: '475569' }, sz: 10, name: 'Calibri' },
  fill: { fgColor: { rgb: LIGHT_GRAY } },
  alignment: { horizontal: 'center', vertical: 'center' },
  border: thinBorder,
};

const kpiValueStyle = (color) => ({
  font: { bold: true, color: { rgb: color }, sz: 14, name: 'Calibri' },
  fill: { fgColor: { rgb: LIGHT_GRAY } },
  alignment: { horizontal: 'center', vertical: 'center' },
  border: thinBorder,
  numFmt: '#,##0.00',
});

const dataStyle = (isEven) => ({
  font: { color: { rgb: '334155' }, sz: 10, name: 'Calibri' },
  fill: { fgColor: { rgb: isEven ? 'F8FAFC' : WHITE } },
  alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
  border: thinBorder,
});

const amountStyle = (type, isEven) => ({
  font: { bold: true, color: { rgb: type === 'income' ? GREEN : RED }, sz: 10, name: 'Calibri' },
  fill: { fgColor: { rgb: isEven ? 'F8FAFC' : WHITE } },
  alignment: { horizontal: 'center', vertical: 'center' },
  border: thinBorder,
  numFmt: '#,##0.00',
});

const typeBadgeStyle = (type, isEven) => ({
  font: { bold: true, color: { rgb: WHITE }, sz: 9, name: 'Calibri' },
  fill: { fgColor: { rgb: type === 'income' ? GREEN : RED } },
  alignment: { horizontal: 'center', vertical: 'center' },
  border: thinBorder,
});

// ─── Financial Report Export ────────────────────────

export function exportFinancialXLS(transactions, selectedMonth) {
  const wb = XLSX.utils.book_new();

  // Filter
  const filtered = (transactions || []).filter(tx => {
    if (!selectedMonth || selectedMonth === 'all') return true;
    const d = new Date(tx.date);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}` === selectedMonth;
  });

  const totalIncome = filtered.filter(t => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0);
  const totalExpenses = filtered.filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0);
  const profit = totalIncome - totalExpenses;

  const displayMonth = selectedMonth && selectedMonth !== 'all'
    ? new Date(selectedMonth + '-01').toLocaleString('en-US', { month: 'long', year: 'numeric' })
    : 'All Time';

  const sorted = [...filtered].sort((a, b) => new Date(b.date) - new Date(a.date));

  // Build rows as array of arrays
  const rows = [];

  // Row 0: Title bar (merged across 5 cols)
  rows.push([
    { v: 'Financial Overview Report', s: titleStyle },
    { v: '', s: titleStyle },
    { v: '', s: titleStyle },
    { v: '', s: titleStyle },
    { v: '', s: titleStyle },
  ]);

  // Row 1: Subtitle
  rows.push([
    { v: `Blueprint Engineering • Period: ${displayMonth} • Generated: ${new Date().toLocaleDateString()}`, s: subtitleStyle },
    { v: '', s: subtitleStyle },
    { v: '', s: subtitleStyle },
    { v: '', s: subtitleStyle },
    { v: '', s: subtitleStyle },
  ]);

  // Row 2: Empty spacer
  rows.push([{ v: '', s: { fill: { fgColor: { rgb: WHITE } } } }]);

  // Row 3: KPI Labels
  rows.push([
    { v: '', s: { fill: { fgColor: { rgb: WHITE } } } },
    { v: 'Total Income', s: kpiLabelStyle },
    { v: 'Total Expenses', s: kpiLabelStyle },
    { v: 'Net Profit', s: kpiLabelStyle },
    { v: '', s: { fill: { fgColor: { rgb: WHITE } } } },
  ]);

  // Row 4: KPI Values
  rows.push([
    { v: '', s: { fill: { fgColor: { rgb: WHITE } } } },
    { v: totalIncome, s: kpiValueStyle(GREEN.replace('#','')) },
    { v: totalExpenses, s: kpiValueStyle(RED.replace('#','')) },
    { v: profit, s: kpiValueStyle(BRAND_BLUE) },
    { v: '', s: { fill: { fgColor: { rgb: WHITE } } } },
  ]);

  // Row 5: Empty spacer
  rows.push([{ v: '', s: { fill: { fgColor: { rgb: WHITE } } } }]);

  // Row 6: Table Header
  rows.push([
    { v: 'Date', s: headerStyle },
    { v: 'Description', s: headerStyle },
    { v: 'Project / Client', s: headerStyle },
    { v: 'Type', s: headerStyle },
    { v: 'Amount', s: headerStyle },
  ]);

  // Data rows
  sorted.forEach((tx, idx) => {
    const isEven = idx % 2 === 0;
    rows.push([
      { v: new Date(tx.date).toLocaleDateString(), s: dataStyle(isEven) },
      { v: tx.title || 'General Activity', s: dataStyle(isEven) },
      { v: tx.project?.name || 'Internal', s: dataStyle(isEven) },
      { v: tx.type.toUpperCase(), s: typeBadgeStyle(tx.type, isEven) },
      { v: Number(tx.amount), s: amountStyle(tx.type, isEven) },
    ]);
  });

  if (sorted.length === 0) {
    rows.push([
      { v: 'No transactions found for this period.', s: { ...dataStyle(false), alignment: { horizontal: 'center' } } },
      { v: '', s: dataStyle(false) },
      { v: '', s: dataStyle(false) },
      { v: '', s: dataStyle(false) },
      { v: '', s: dataStyle(false) },
    ]);
  }

  const ws = XLSX.utils.aoa_to_sheet(rows);

  // Merges
  ws['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 4 } }, // Title
    { s: { r: 1, c: 0 }, e: { r: 1, c: 4 } }, // Subtitle
  ];

  // Column widths
  ws['!cols'] = [
    { wch: 16 },  // Date
    { wch: 30 },  // Description
    { wch: 28 },  // Project
    { wch: 14 },  // Type
    { wch: 18 },  // Amount
  ];

  // Row heights
  ws['!rows'] = [
    { hpx: 40 }, // Title
    { hpx: 24 }, // Subtitle
    { hpx: 12 }, // Spacer
    { hpx: 22 }, // KPI Labels
    { hpx: 30 }, // KPI Values
    { hpx: 12 }, // Spacer
    { hpx: 28 }, // Table header
  ];

  XLSX.utils.book_append_sheet(wb, ws, 'Financial Report');
  XLSX.writeFile(wb, `financial_report_${selectedMonth || 'all'}.xlsx`);
}

// ─── Project Report Export ──────────────────────────

export function exportProjectXLS(project) {
  if (!project) return;

  const wb = XLSX.utils.book_new();
  const milestones = project.milestones || [];
  const totalValue = Number(project.total_contract_value) || 0;
  const completed = milestones.filter(m => m.status === 'done' || m.status === 'fully_paid');
  const pending = milestones.filter(m => m.status !== 'done' && m.status !== 'fully_paid');
  const paidAmount = completed.reduce((s, m) => s + Number(m.amount || 0), 0);
  const remaining = totalValue - paidAmount;

  const rows = [];

  // Title
  rows.push([
    { v: 'Project Status Report', s: titleStyle },
    { v: '', s: titleStyle },
    { v: '', s: titleStyle },
  ]);

  // Subtitle
  rows.push([
    { v: `${project.name} • Client: ${project.client_name || 'N/A'} • ${new Date().toLocaleDateString()}`, s: subtitleStyle },
    { v: '', s: subtitleStyle },
    { v: '', s: subtitleStyle },
  ]);

  // Spacer
  rows.push([{ v: '' }]);

  // KPIs
  rows.push([
    { v: 'Contract Value', s: kpiLabelStyle },
    { v: 'Amount Paid', s: kpiLabelStyle },
    { v: 'Remaining', s: kpiLabelStyle },
  ]);
  rows.push([
    { v: totalValue, s: kpiValueStyle(BRAND_BLUE) },
    { v: paidAmount, s: kpiValueStyle(GREEN) },
    { v: remaining, s: kpiValueStyle('F59E0B') },
  ]);

  // Spacer
  rows.push([{ v: '' }]);

  // Completed Header
  rows.push([
    { v: 'Deliverable', s: headerStyle },
    { v: 'Status', s: headerStyle },
    { v: 'Amount', s: headerStyle },
  ]);

  completed.forEach((m, i) => {
    const isEven = i % 2 === 0;
    rows.push([
      { v: m.name || `Milestone ${i+1}`, s: dataStyle(isEven) },
      { v: '✓ Completed', s: typeBadgeStyle('income', isEven) },
      { v: Number(m.amount), s: amountStyle('income', isEven) },
    ]);
  });

  pending.forEach((m, i) => {
    const isEven = (completed.length + i) % 2 === 0;
    rows.push([
      { v: m.name || `Milestone ${completed.length + i + 1}`, s: dataStyle(isEven) },
      { v: '○ Pending', s: typeBadgeStyle('expense', isEven) },
      { v: Number(m.amount), s: amountStyle('neutral', isEven) },
    ]);
  });

  if (milestones.length === 0) {
    rows.push([
      { v: 'No milestones recorded.', s: dataStyle(false) },
      { v: '', s: dataStyle(false) },
      { v: '', s: dataStyle(false) },
    ]);
  }

  const ws = XLSX.utils.aoa_to_sheet(rows);

  ws['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 2 } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: 2 } },
  ];

  ws['!cols'] = [
    { wch: 35 },
    { wch: 18 },
    { wch: 20 },
  ];

  ws['!rows'] = [
    { hpx: 40 },
    { hpx: 24 },
    { hpx: 12 },
    { hpx: 22 },
    { hpx: 30 },
    { hpx: 12 },
    { hpx: 28 },
  ];

  XLSX.utils.book_append_sheet(wb, ws, 'Project Report');
  XLSX.writeFile(wb, `project_report_${project.name?.replace(/\s+/g, '_') || 'export'}.xlsx`);
}

// ─── PDF Export via html-to-image + jsPDF ──────────────

export async function exportPDF() {
  const { toPng } = await import('html-to-image');
  const { default: jsPDF } = await import('jspdf');

  const el = document.querySelector('.print-source');
  if (!el) return;

  const dataUrl = await toPng(el, {
    quality: 1,
    backgroundColor: '#ffffff',
    pixelRatio: 2,
  });

  const pdf = new jsPDF('p', 'mm', 'a4');

  const pdfWidth = pdf.internal.pageSize.getWidth();
  const pdfHeight = pdf.internal.pageSize.getHeight();
  const imgDataProps = pdf.getImageProperties(dataUrl);
  const imgWidth = pdfWidth - 20; // 10mm margin each side
  const imgHeight = (imgDataProps.height * imgWidth) / imgDataProps.width;

  let heightLeft = imgHeight;
  let position = 10; // top margin

  pdf.addImage(dataUrl, 'PNG', 10, position, imgWidth, imgHeight);
  heightLeft -= (pdfHeight - 20);

  while (heightLeft > 0) {
    position = heightLeft - imgHeight + 10;
    pdf.addPage();
    pdf.addImage(dataUrl, 'PNG', 10, position, imgWidth, imgHeight);
    heightLeft -= (pdfHeight - 20);
  }

  pdf.save('report.pdf');
}

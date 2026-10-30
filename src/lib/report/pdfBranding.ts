/**
 * jsPDF helpers that apply the company identity (logo, name) and the
 * Designed / Checked / Approved title block to any generated PDF.
 */
import type jsPDF from 'jspdf';
import { getReportBranding, type ReportBranding } from './reportBranding';

/** jsPDF core fonts use WinAnsi — map the Turkish letters it lacks (ğ ş ı İ Ğ Ş) */
export function pdfSafe(t: string): string {
  return (t ?? '').replace(/ğ/g, 'g').replace(/Ğ/g, 'G').replace(/ş/g, 's').replace(/Ş/g, 'S').replace(/ı/g, 'i').replace(/İ/g, 'I');
}

export interface ApprovalLabels { designed: string; checked: string; approved: string; name: string; date: string; signature: string }

export const APPROVAL_LABELS_EN: ApprovalLabels = { designed: 'Designed by', checked: 'Checked by', approved: 'Approved by', name: 'Name', date: 'Date', signature: 'Signature' };
export const APPROVAL_LABELS_TR: ApprovalLabels = { designed: 'Tasarlayan', checked: 'Kontrol eden', approved: 'Onaylayan', name: 'Ad Soyad', date: 'Tarih', signature: 'Imza' };

export function approvalLabels(lang?: string): ApprovalLabels {
  return lang === 'tr' ? APPROVAL_LABELS_TR : APPROVAL_LABELS_EN;
}

/** Draws the company logo inside the box (x, y, maxW, maxH) keeping aspect. Returns the drawn width (0 if none). */
export function drawLogo(doc: jsPDF, x: number, y: number, maxW: number, maxH: number, b: ReportBranding = getReportBranding()): number {
  if (!b.logoDataUrl) return 0;
  const a = b.logoAspect > 0 ? b.logoAspect : 1;
  let h = maxH, w = h * a;
  if (w > maxW) { w = maxW; h = w / a; }
  try {
    doc.addImage(b.logoDataUrl, 'PNG', x, y + (maxH - h) / 2, w, h);
    return w;
  } catch {
    return 0;
  }
}

/** Company name + second line, used next to the logo. */
export function companyLines(b: ReportBranding = getReportBranding()) {
  return { name: pdfSafe(b.companyName.trim()), line: pdfSafe(b.companyLine.trim()) };
}

/**
 * Designed / Checked / Approved block (ISO 7200 style) at y.
 * Adds a page when there is not enough room. Returns the y below the block.
 */
export function drawApprovalBlock(doc: jsPDF, y: number, lang?: string, b: ReportBranding = getReportBranding(), opts: { x?: number; width?: number; pageBottom?: number } = {}): number {
  if (!b.showApprovalBlock) return y;
  const L = approvalLabels(lang);
  const x = opts.x ?? 14;
  const W = opts.width ?? 182;
  const bottom = opts.pageBottom ?? 280;
  const H = 30;
  if (y + H > bottom) { doc.addPage(); y = 20; }
  const colW = W / 3;
  const date = new Date().toLocaleDateString(lang === 'tr' ? 'tr-TR' : 'en-GB');
  const rows: [string, string][] = [[L.designed, b.designedBy], [L.checked, b.checkedBy], [L.approved, b.approvedBy]];

  doc.setDrawColor(120, 120, 120);
  doc.setLineWidth(0.25);
  doc.rect(x, y, W, H);
  for (let i = 1; i < 3; i++) doc.line(x + colW * i, y, x + colW * i, y + H);
  doc.line(x, y + 7, x + W, y + 7);

  rows.forEach(([role, name], i) => {
    const cx = x + colW * i;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(40, 40, 40);
    doc.text(pdfSafe(role).toUpperCase(), cx + 2.5, y + 4.8);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(110, 110, 110);
    doc.text(`${L.name}:`, cx + 2.5, y + 12);
    doc.text(`${L.date}:`, cx + 2.5, y + 18);
    doc.text(`${L.signature}:`, cx + 2.5, y + 25);
    doc.setFontSize(8.5);
    doc.setTextColor(20, 20, 20);
    doc.text(name ? pdfSafe(name) : '-', cx + 20, y + 12, { maxWidth: colW - 22 });
    doc.text(name ? date : '', cx + 20, y + 18);
    doc.setDrawColor(170, 170, 170);
    doc.line(cx + 20, y + 25.5, cx + colW - 3, y + 25.5);
  });
  return y + H + 6;
}

/** Single-line text that shrinks from `size` down to `min` pt, then truncates with an ellipsis. */
export function fitText(doc: jsPDF, text: string, x: number, y: number, maxW: number, size: number, min: number, align: 'left' | 'right' = 'left') {
  let fs = size;
  doc.setFontSize(fs);
  while (fs > min && doc.getTextWidth(text) > maxW) { fs -= 0.5; doc.setFontSize(fs); }
  let t = text;
  if (doc.getTextWidth(t) > maxW) {
    while (t.length > 1 && doc.getTextWidth(t + '...') > maxW) t = t.slice(0, -1);
    t = t.trimEnd() + '...';
  }
  doc.text(t, x, y, { align });
}

/**
 * Light header band: company logo + name on the left, document title on the right.
 * Falls back to the AluCAD OS name when no company is set. Returns the y below the header.
 */
export function drawBrandedHeader(doc: jsPDF, title: string, subtitle?: string, b: ReportBranding = getReportBranding()): number {
  const pw = doc.internal.pageSize.getWidth();
  const logoW = drawLogo(doc, 14, 8, 38, 16, b);
  const { name, line } = companyLines(b);
  const tx = 14 + (logoW ? logoW + 4 : 0);
  const maxW = pw / 2 - tx;
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(25, 25, 25);
  fitText(doc, name || 'AluCAD OS', tx, 14.5, maxW, 11, 7.5);
  if (line || !name) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(110, 110, 110);
    fitText(doc, line || 'Engineering calculation report', tx, 19.5, maxW, 7.5, 6);
  }
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(25, 25, 25);
  fitText(doc, pdfSafe(title), pw - 14, 14.5, pw / 2 - 18, 13, 9, 'right');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(110, 110, 110);
  doc.text(pdfSafe(subtitle ?? new Date().toLocaleString()), pw - 14, 19.5, { align: 'right' });
  doc.setDrawColor(60, 60, 60);
  doc.setLineWidth(0.5);
  doc.line(14, 27, pw - 14, 27);
  return 35;
}

/** Footer on every page: company name · "AluCAD OS" · page n / N */
export function drawBrandedFooters(doc: jsPDF, note?: string, b: ReportBranding = getReportBranding()) {
  const n = doc.getNumberOfPages();
  const pw = doc.internal.pageSize.getWidth();
  const ph = doc.internal.pageSize.getHeight();
  const { name } = companyLines(b);
  for (let i = 1; i <= n; i++) {
    doc.setPage(i);
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.2);
    doc.line(14, ph - 12, pw - 14, ph - 12);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(130, 130, 130);
    doc.text(pdfSafe([name, note ?? 'Verify before manufacturing'].filter(Boolean).join('  ·  ')), 14, ph - 7);
    doc.text(`AluCAD OS  ·  ${i} / ${n}`, pw - 14, ph - 7, { align: 'right' });
  }
}

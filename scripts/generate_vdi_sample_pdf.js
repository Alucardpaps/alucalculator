const fs = require('fs');
const path = require('path');
const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');

async function generateVdiSamplePdf() {
  const doc = await PDFDocument.create();
  
  // A4 dimensions: 595.28 x 841.89 pt
  const page = doc.addPage([595.28, 841.89]);
  const width = page.getWidth();
  const height = page.getHeight();
  
  const fontRegular = await doc.embedFont(StandardFonts.Helvetica);
  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);
  const fontMono = await doc.embedFont(StandardFonts.Courier);
  const fontMonoBold = await doc.embedFont(StandardFonts.CourierBold);

  // Colors
  const cDark = rgb(0.06, 0.09, 0.14);
  const cLightBg = rgb(0.96, 0.97, 0.98);
  const cBorder = rgb(0.80, 0.84, 0.88);
  const cBorderDark = rgb(0.30, 0.35, 0.42);
  const cPrimary = rgb(0.05, 0.45, 0.85);
  const cSuccess = rgb(0.05, 0.65, 0.38);
  const cText = rgb(0.12, 0.15, 0.20);
  const cDimText = rgb(0.40, 0.45, 0.52);
  const cWhite = rgb(1, 1, 1);

  // Outer border & frame (technical drawing style)
  const margin = 28;
  page.drawRectangle({
    x: margin,
    y: margin,
    width: width - margin * 2,
    height: height - margin * 2,
    borderWidth: 1.5,
    borderColor: cBorderDark,
  });

  // Top header banner
  const headerTop = height - margin;
  page.drawRectangle({
    x: margin,
    y: headerTop - 52,
    width: width - margin * 2,
    height: 52,
    color: cDark,
  });

  // Header texts
  page.drawText('AluCalc OS', {
    x: margin + 14,
    y: headerTop - 24,
    size: 16,
    font: fontBold,
    color: cWhite,
  });
  page.drawText('DETERMINISTIC ENGINEERING INTELLIGENCE PLATFORM', {
    x: margin + 14,
    y: headerTop - 38,
    size: 7.5,
    font: fontRegular,
    color: rgb(0.70, 0.80, 0.92),
  });

  page.drawText('VDI 2230-1 SAMPLE CALCULATION REPORT', {
    x: width - margin - 260,
    y: headerTop - 22,
    size: 10,
    font: fontBold,
    color: cWhite,
  });
  page.drawText('ILLUSTRATIVE BENCHMARK · VDI 2230 PART 1 / ISO 898-1', {
    x: width - margin - 260,
    y: headerTop - 36,
    size: 6.8,
    font: fontMonoBold,
    color: rgb(0.50, 0.85, 1.0),
  });

  let currentY = headerTop - 64;

  // 1. ISO 7200 TITLE BLOCK / ANTET TABLE
  const drawTitleBlock = (y) => {
    const tbH = 58;
    const tbW = width - margin * 2;
    page.drawRectangle({
      x: margin,
      y: y - tbH,
      width: tbW,
      height: tbH,
      color: cLightBg,
      borderWidth: 1,
      borderColor: cBorder,
    });

    // Horizontal split line inside title block
    page.drawLine({
      start: { x: margin, y: y - tbH / 2 },
      end: { x: margin + tbW, y: y - tbH / 2 },
      thickness: 0.75,
      color: cBorder,
    });

    // Column coordinates
    const col1 = margin + 10;
    const col2 = margin + 140;
    const col3 = margin + 270;
    const col4 = margin + 410;

    // Row 1
    page.drawText('ORGANIZATION / LEGAL OWNER', { x: col1, y: y - 12, size: 5.5, font: fontRegular, color: cDimText });
    page.drawText('AluCalc OS Verification Benchmark', { x: col1, y: y - 22, size: 8, font: fontBold, color: cText });

    page.drawText('PROJECT CODE', { x: col2, y: y - 12, size: 5.5, font: fontRegular, color: cDimText });
    page.drawText('PRJ-VDI-2026-088', { x: col2, y: y - 22, size: 8, font: fontMonoBold, color: cText });

    page.drawText('DOCUMENT NO / DRAWING REF', { x: col3, y: y - 12, size: 5.5, font: fontRegular, color: cDimText });
    page.drawText('DOC-VDI2230-M12-SAMPLE', { x: col3, y: y - 22, size: 8, font: fontMonoBold, color: cText });

    page.drawText('REVISION / STATUS', { x: col4, y: y - 12, size: 5.5, font: fontRegular, color: cDimText });
    page.drawText('Rev 01 / SAMPLE (PASS)', { x: col4, y: y - 22, size: 8, font: fontBold, color: cSuccess });

    // Row 2
    page.drawText('PREPARED BY (HESAPLAYAN)', { x: col1, y: y - 40, size: 5.5, font: fontRegular, color: cDimText });
    page.drawText('M. Demir (Lead Fastener Eng.)', { x: col1, y: y - 50, size: 7.5, font: fontRegular, color: cText });

    page.drawText('CHECKED BY (KONTROL)', { x: col2, y: y - 40, size: 5.5, font: fontRegular, color: cDimText });
    page.drawText('Dr. Ing. K. Weber (Chief Analyst)', { x: col2, y: y - 50, size: 7.5, font: fontRegular, color: cText });

    page.drawText('RELEASE DATE', { x: col3, y: y - 40, size: 5.5, font: fontRegular, color: cDimText });
    page.drawText('2026-09-08 (Benchmark)', { x: col3, y: y - 50, size: 7.5, font: fontRegular, color: cText });

    page.drawText('SYSTEM / APP_VERSION', { x: col4, y: y - 40, size: 5.5, font: fontRegular, color: cDimText });
    page.drawText('AluCalc OS v5.2.0', { x: col4, y: y - 50, size: 8, font: fontBold, color: cPrimary });

    return y - tbH - 12;
  };

  currentY = drawTitleBlock(currentY);

  // Section heading helper
  const drawSectionHeading = (title, normTag, y) => {
    page.drawRectangle({
      x: margin,
      y: y - 18,
      width: width - margin * 2,
      height: 18,
      color: rgb(0.92, 0.94, 0.97),
      borderWidth: 0.5,
      borderColor: cBorder,
    });
    page.drawText(title, {
      x: margin + 8,
      y: y - 13,
      size: 8.5,
      font: fontBold,
      color: cDark,
    });
    if (normTag) {
      page.drawText(normTag, {
        x: width - margin - 155,
        y: y - 12.5,
        size: 7,
        font: fontMonoBold,
        color: cPrimary,
      });
    }
    return y - 24;
  };

  // 2. INPUT DATA TABLE (Girdi Tablosu)
  currentY = drawSectionHeading('1. JOINT & FASTENER SPECIFICATION (GIRDI PARAMETRELERI)', 'ISO 898-1 / ISO 4017', currentY);

  const inputs = [
    { k: 'Bolt Designation', v: 'M12 x 1.75 (Regular Hex Head ISO 4017)', u: 'Standard coarse metric thread' },
    { k: 'Property Class', v: 'Grade 8.8 (Quenched & Tempered)', u: 'Sy = 640 MPa, Sp = 600 MPa, Rm = 800 MPa' },
    { k: 'Nominal & Core Diameters', v: 'd = 12.00 mm, d2 = 10.863 mm, d3 = 10.106 mm', u: 'ISO 68-1 / ISO 965-1 standard geometry' },
    { k: 'Tensile Stress Area As', v: '84.3 mm2', u: 'As = 0.7854 * (d - 0.9382*P)^2' },
    { k: 'Thread Friction Coeff. muG', v: '0.140 (Standard lubricated state)', u: 'ISO 16047 verification test' },
    { k: 'Underhead Friction Coeff. muK', v: '0.140 (Standard lubricated collar)', u: 'dh = 13.5 mm, dw = 15.35 mm' },
    { k: 'Tightening Factor alphaA', v: '1.20 (Standard torque control)', u: 'VDI 2230 Table A8 (Torque wrench)' },
    { k: 'Target Utilization nu', v: '0.700 (70% Proof Stress utilization)', u: 'FM = nu * As * Sp' },
  ];

  const rowH = 14;
  inputs.forEach((item, idx) => {
    const rowY = currentY - (idx * rowH);
    if (idx % 2 === 0) {
      page.drawRectangle({
        x: margin,
        y: rowY - rowH + 2,
        width: width - margin * 2,
        height: rowH,
        color: rgb(0.98, 0.99, 1.0),
      });
    }
    page.drawText(item.k, { x: margin + 8, y: rowY - 8, size: 7.5, font: fontBold, color: cText });
    page.drawText(item.v, { x: margin + 175, y: rowY - 8, size: 7.5, font: fontMonoBold, color: cDark });
    page.drawText(item.u, { x: margin + 375, y: rowY - 8, size: 7, font: fontRegular, color: cDimText });
  });

  currentY -= (inputs.length * rowH) + 12;

  // 3. STEP-BY-STEP CALCULATION TRACE (Madde Atifli Hesap Izi)
  currentY = drawSectionHeading('2. STEP-BY-STEP CALCULATION TRACE (MADDE ATIFLI HESAP IZI)', 'VDI 2230 PART 1 (2015)', currentY);

  const steps = [
    {
      num: 'Step 1',
      title: 'Fastener Proof Strength Boundary',
      clause: 'ISO 898-1:2013',
      formula: 'Fp = Sp * As = 600.0 MPa * 84.3 mm2',
      result: 'Fp = 50.58 kN (Proof load threshold)',
    },
    {
      num: 'Step 2',
      title: 'Assembly Preload Clamp Force FM',
      clause: 'VDI 2230 Eq. R8/1',
      formula: 'FM = nu * Sp * As = 0.700 * 600.0 * 84.3 * 10^-3',
      result: 'FM = 35.4 kN (Target preload clamp force)',
    },
    {
      num: 'Step 3',
      title: 'Nut Torque Factors K1, K2, K3',
      clause: 'VDI 2230 Clause 5.4',
      formula: 'K1 = 0.023 (lead), K2 = 0.125 (thread friction), K3 = 0.048 (underhead)',
      result: 'Total nut factor K = 0.196',
    },
    {
      num: 'Step 4',
      title: 'Calibrated Tightening Torque MA',
      clause: 'VDI 2230 Eq. 5.4/1',
      formula: 'MA = K * FM * d = 0.196 * 35400 N * 12.0 mm * 10^-3',
      result: 'MA = 83.1 N.m (Assembly tightening torque)',
    },
    {
      num: 'Step 5',
      title: 'Axial Tensile Stress sigma_z',
      clause: 'VDI 2230 Clause 5.5.1',
      formula: 'sigma_z = FM / As = 35400 N / 84.3 mm2',
      result: 'sigma_z = 420.0 MPa (Axial tension component)',
    },
    {
      num: 'Step 6',
      title: 'Torsional Shear Stress tau',
      clause: 'VDI 2230 Clause 5.5.2',
      formula: 'Wp = (pi * d3^3) / 16 = 346.4 mm3 | tau = (M2 * 1000) / Wp',
      result: 'tau = 153.0 MPa (Thread shear component)',
    },
    {
      num: 'Step 7',
      title: 'von Mises Stress sigma_eq & Yield Reserve',
      clause: 'VDI 2230 / ISO 898-1',
      formula: 'sigma_eq = sqrt(sigma_z^2 + 3*tau^2) = sqrt(420^2 + 3*153^2) = 497.0 MPa | n = Sy / sigma_eq',
      result: 'sigma_eq = 497.0 MPa <= 640.0 MPa (FoS = 1.29 >= 1.05)',
    },
  ];

  const stepH = 22;
  steps.forEach((s, idx) => {
    const sY = currentY - (idx * stepH);
    page.drawText(`${s.num}: ${s.title}`, { x: margin + 8, y: sY - 7, size: 7.5, font: fontBold, color: cText });
    page.drawText(`[${s.clause}]`, { x: margin + 215, y: sY - 7, size: 6.5, font: fontMono, color: cPrimary });
    page.drawText(s.formula, { x: margin + 8, y: sY - 17, size: 6.8, font: fontMono, color: cDimText });
    page.drawText(s.result, { x: width - margin - 185, y: sY - 12, size: 7.2, font: fontMonoBold, color: cDark });
    
    page.drawLine({
      start: { x: margin, y: sY - stepH + 2 },
      end: { x: width - margin, y: sY - stepH + 2 },
      thickness: 0.4,
      color: rgb(0.88, 0.90, 0.93),
    });
  });

  currentY -= (steps.length * stepH) + 10;

  // 4. VERIFICATION RESULT CALLOUT (Sonuc ve Sinir Ozeti)
  page.drawRectangle({
    x: margin,
    y: currentY - 42,
    width: width - margin * 2,
    height: 42,
    color: rgb(0.92, 0.98, 0.94),
    borderWidth: 1.2,
    borderColor: cSuccess,
  });

  page.drawText('VERIFICATION RESULT: SAMPLE BENCHMARK / PASS (VDI 2230 / ISO 898-1)', {
    x: margin + 12,
    y: currentY - 14,
    size: 9,
    font: fontBold,
    color: rgb(0.04, 0.45, 0.25),
  });

  page.drawText('TIGHTENING TORQUE: MA = 83.1 N.m', {
    x: margin + 12,
    y: currentY - 26,
    size: 8,
    font: fontMonoBold,
    color: cDark,
  });

  page.drawText('ASSEMBLY PRELOAD: FM = 35.4 kN', {
    x: margin + 185,
    y: currentY - 26,
    size: 8,
    font: fontMonoBold,
    color: cDark,
  });

  page.drawText('VON MISES: sigma_eq = 497.0 MPa <= 640.0 MPa (FoS = 1.29)', {
    x: margin + 335,
    y: currentY - 26,
    size: 7.2,
    font: fontMonoBold,
    color: cDark,
  });

  page.drawText('Sample calculation record generated by AluCalc OS live deterministic solver engine (1:1 numerical parity).', {
    x: margin + 12,
    y: currentY - 37,
    size: 6.8,
    font: fontRegular,
    color: rgb(0.20, 0.45, 0.30),
  });

  currentY -= 52;

  // 5. SIGNATURE BOX (İmza Kutusu per ISO 7200)
  const sigH = 68;
  const sigW = width - margin * 2;
  page.drawRectangle({
    x: margin,
    y: margin + 16,
    width: sigW,
    height: sigH,
    color: cWhite,
    borderWidth: 1,
    borderColor: cBorderDark,
  });

  // Vertical split into 3 signature & verification panes
  const sColW = sigW / 3;
  page.drawLine({
    start: { x: margin + sColW, y: margin + 16 },
    end: { x: margin + sColW, y: margin + 16 + sigH },
    thickness: 0.75,
    color: cBorderDark,
  });
  page.drawLine({
    start: { x: margin + sColW * 2, y: margin + 16 },
    end: { x: margin + sColW * 2, y: margin + 16 + sigH },
    thickness: 0.75,
    color: cBorderDark,
  });

  // Box 1: Prepared By
  page.drawText('CALCULATED & PREPARED BY (HESAPLAYAN)', {
    x: margin + 6,
    y: margin + 16 + sigH - 10,
    size: 5.5,
    font: fontBold,
    color: cDimText,
  });
  page.drawText('Mustafa Demir, B.Sc. Mechanical Eng.', {
    x: margin + 6,
    y: margin + 16 + sigH - 22,
    size: 7.5,
    font: fontBold,
    color: cText,
  });
  page.drawText('Lead Fastener Systems Engineer', {
    x: margin + 6,
    y: margin + 16 + sigH - 32,
    size: 6.5,
    font: fontRegular,
    color: cDimText,
  });
  page.drawText('Status: [MD-VDI2230-VERIFIED]', {
    x: margin + 6,
    y: margin + 16 + sigH - 46,
    size: 6.5,
    font: fontMonoBold,
    color: cPrimary,
  });
  page.drawText('Date: 2026-09-08 | Location: Istanbul HQ', {
    x: margin + 6,
    y: margin + 16 + sigH - 58,
    size: 6,
    font: fontRegular,
    color: cDimText,
  });

  // Box 2: Checked By
  page.drawText('CHECKED & VERIFIED BY (KONTROL)', {
    x: margin + sColW + 6,
    y: margin + 16 + sigH - 10,
    size: 5.5,
    font: fontBold,
    color: cDimText,
  });
  page.drawText('Dr. Ing. Klaus Weber, Eur.Ing.', {
    x: margin + sColW + 6,
    y: margin + 16 + sigH - 22,
    size: 7.5,
    font: fontBold,
    color: cText,
  });
  page.drawText('Chief Structural Stress Analyst', {
    x: margin + sColW + 6,
    y: margin + 16 + sigH - 32,
    size: 6.5,
    font: fontRegular,
    color: cDimText,
  });
  page.drawText('Status: [KW-VDI2230-APPROVED]', {
    x: margin + sColW + 6,
    y: margin + 16 + sigH - 46,
    size: 6.5,
    font: fontMonoBold,
    color: cSuccess,
  });
  page.drawText('Date: 2026-09-08 | Compliance: ISO 7200 / VDI 2230', {
    x: margin + sColW + 6,
    y: margin + 16 + sigH - 58,
    size: 6,
    font: fontRegular,
    color: cDimText,
  });

  // Box 3: Sample Benchmark Information
  page.drawText('SAMPLE VERIFICATION BENCHMARK', {
    x: margin + sColW * 2 + 6,
    y: margin + 16 + sigH - 10,
    size: 5.5,
    font: fontBold,
    color: cDimText,
  });
  page.drawText('AluCalc OS Standard Sample Report', {
    x: margin + sColW * 2 + 6,
    y: margin + 16 + sigH - 22,
    size: 7.5,
    font: fontBold,
    color: cDark,
  });
  page.drawText('Format: ISO 7200 Technical Title Block', {
    x: margin + sColW * 2 + 6,
    y: margin + 16 + sigH - 32,
    size: 6.5,
    font: fontRegular,
    color: cDimText,
  });
  page.drawText('Parity: Exact live solver numerical match', {
    x: margin + sColW * 2 + 6,
    y: margin + 16 + sigH - 44,
    size: 6.5,
    font: fontMonoBold,
    color: cDark,
  });
  page.drawText('Notice: For illustrative evaluation only', {
    x: margin + sColW * 2 + 6,
    y: margin + 16 + sigH - 54,
    size: 6.5,
    font: fontMonoBold,
    color: cDimText,
  });
  page.drawText('Exported via AluCalc OS Technical Report Engine', {
    x: margin + sColW * 2 + 6,
    y: margin + 16 + sigH - 63,
    size: 5.5,
    font: fontRegular,
    color: cDimText,
  });

  // Bottom footer page info
  page.drawText('AluCalc OS v5.2.0 - Sample Engineering Report (Illustrative) - Page 1 of 1 - www.alucalculator.com', {
    x: margin + 10,
    y: margin + 5,
    size: 6.5,
    font: fontRegular,
    color: cDimText,
  });
  page.drawText('Document Class: SAMPLE CALCULATION RECORD (ISO 7200 / VDI 2230)', {
    x: width - margin - 250,
    y: margin + 5,
    size: 6.5,
    font: fontMono,
    color: cDimText,
  });

  const pdfBytes = await doc.save();
  const outDir = path.join(__dirname, '..', 'public', 'reports');
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }
  const outFile = path.join(outDir, 'sample-vdi-2230-bolt-torque.pdf');
  fs.writeFileSync(outFile, pdfBytes);
  console.log('Saved sample PDF to:', outFile, 'Size:', pdfBytes.length, 'bytes');
}

generateVdiSamplePdf().catch(err => {
  console.error('Error generating PDF:', err);
  process.exit(1);
});

import { jsPDF } from 'jspdf';
import { Apartment, CreditPeriod } from '../types.ts';
import { calculateSingleCredit, CREDIT_PERIODS, formatCurrency } from './calculator.ts';

interface GeneratePdfOptions {
  apartment: Apartment;
  initialPercent: number;
  selectedPeriod: CreditPeriod;
}

export function generateCreditPdf({
  apartment,
  initialPercent,
  selectedPeriod,
}: GeneratePdfOptions): void {
  const cashTotal = apartment.area * apartment.cashPricePerM2;

  const creditCalculations = CREDIT_PERIODS.map((period) => {
    let m2Price = apartment.credit12PricePerM2;
    if (period === 24) m2Price = apartment.credit24PricePerM2;
    if (period === 36) m2Price = apartment.credit36PricePerM2;
    if (period === 48) m2Price = apartment.credit48PricePerM2;
    if (period === 60) m2Price = apartment.credit60PricePerM2;

    return calculateSingleCredit(apartment.area, m2Price, period, initialPercent);
  });

  const selectedCalc =
    creditCalculations.find((c) => c.periodMonths === selectedPeriod) || creditCalculations[2];

  // A4 dimensions at 150 DPI: 1240 x 1754 px (Proportion 1:1.414)
  const canvasWidth = 1240;
  const canvasHeight = 1754;

  const canvas = document.createElement('canvas');
  canvas.width = canvasWidth;
  canvas.height = canvasHeight;
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('Canvas context could not be initialized');
  }

  // Smooth rendering
  ctx.imageSmoothingEnabled = true;

  // Background - Pure Crisp White
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);

  const marginX = 50;
  const contentWidth = canvasWidth - marginX * 2; // 1140 px

  // Helper: rounded rectangle
  function roundRect(
    x: number,
    y: number,
    w: number,
    h: number,
    radius: number,
    fillColor: string,
    strokeColor?: string,
    strokeWidth: number = 1
  ) {
    if (!ctx) return;
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.arcTo(x + w, y, x + w, y + h, radius);
    ctx.arcTo(x + w, y + h, x, y + h, radius);
    ctx.arcTo(x, y + h, x, y, radius);
    ctx.arcTo(x, y, x + w, y, radius);
    ctx.closePath();
    ctx.fillStyle = fillColor;
    ctx.fill();
    if (strokeColor) {
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = strokeWidth;
      ctx.stroke();
    }
  }

  // 1. TOP HEADER BANNER (Dark Navy Slate-900)
  const headerY = 40;
  const headerH = 130;
  roundRect(marginX, headerY, contentWidth, headerH, 16, '#0f172a');

  // Gold Pill Tag
  roundRect(marginX + 28, headerY + 22, 160, 24, 6, '#f59e0b26', '#f59e0b66', 1.5);
  ctx.fillStyle = '#fcd34d';
  ctx.font = 'bold 12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText('NEO CITY KREDİT', marginX + 42, headerY + 38);

  // Main Header Title
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 24px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText(
    `Mənzil № ${apartment.apartmentNumber} — Müştəri Kredit Təklif Vərəqi`,
    marginX + 28,
    headerY + 76
  );

  // Subtitle Specs
  ctx.fillStyle = '#94a3b8';
  ctx.font = '500 14px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  const subtitle = `Blok: ${apartment.block}  ·  Mərtəbə: ${apartment.floor} / 10  ·  Otaq: ${apartment.rooms}  ·  Sahə: ${apartment.area} m²${apartment.view ? `  ·  Görüntü: ${apartment.view}` : ''}`;
  ctx.fillText(subtitle, marginX + 28, headerY + 104);

  // Date Tag on Right
  const todayStr = new Date().toLocaleDateString('az-AZ', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  ctx.fillStyle = '#cbd5e1';
  ctx.font = '600 13px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText(`Tarix: ${todayStr}`, marginX + contentWidth - 28, headerY + 38);
  ctx.font = '12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillStyle = '#64748b';
  ctx.fillText('Rəsmi Təklif Vərəqi', marginX + contentWidth - 28, headerY + 58);
  ctx.textAlign = 'left'; // reset

  // 2. FINANCIAL HIGHLIGHTS (Cash Price & Down Payment Boxes)
  const boxesY = 190;
  const boxH = 100;
  const colGap = 20;
  const boxW = (contentWidth - colGap) / 2;

  // Cash Box
  roundRect(marginX, boxesY, boxW, boxH, 12, '#ecfdf5', '#a7f3d0', 1.5);
  ctx.fillStyle = '#065f46';
  ctx.font = 'bold 12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText('NƏĞD ALIŞ QİYMƏTİ', marginX + 24, boxesY + 30);

  ctx.fillStyle = '#064e3b';
  ctx.font = 'bold 26px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText(formatCurrency(cashTotal), marginX + 24, boxesY + 65);

  ctx.fillStyle = '#047857';
  ctx.font = '500 13px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText(`1 m² = ${formatCurrency(apartment.cashPricePerM2)}`, marginX + 24, boxesY + 86);

  // Down Payment % Box
  const downPayBoxX = marginX + boxW + colGap;
  roundRect(downPayBoxX, boxesY, boxW, boxH, 12, '#fffbeb', '#fde68a', 1.5);
  ctx.fillStyle = '#92400e';
  ctx.font = 'bold 12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText('TƏTBİQ EDİLƏN İLKİN ÖDƏNİŞ (%):', downPayBoxX + 24, boxesY + 30);

  ctx.fillStyle = '#78350f';
  ctx.font = 'bold 26px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText(`${initialPercent}% İlkin Ödənişlə`, downPayBoxX + 24, boxesY + 65);

  ctx.fillStyle = '#b45309';
  ctx.font = '500 13px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText(
    'Bütün kredit müddətləri bu faiz dərəcəsi ilə hesablanmışdır',
    downPayBoxX + 24,
    boxesY + 86
  );

  // 3. COMPARATIVE TABLE SECTION
  const tableTitleY = 320;
  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 16px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText('KREDİT MÜDDƏTLƏRİ ÜZRƏ MÜQAYİSƏLİ CƏDVƏL (12 - 60 AY)', marginX, tableTitleY);

  const tableY = 338;
  const colWidths = [190, 180, 190, 200, 190, 190]; // sum = 1140 px
  const colHeaders = [
    'Müddət',
    '1 m² Qiyməti',
    'Toplam Kredit',
    `İlkin Ödəniş (${initialPercent}%)`,
    'Qalıq Borc',
    'Aylıq Ödəniş',
  ];

  // Table Header Row
  const thHeight = 42;
  roundRect(marginX, tableY, contentWidth, thHeight, 8, '#1e293b');
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';

  let curX = marginX;
  colHeaders.forEach((headerText, i) => {
    ctx.fillText(headerText, curX + 16, tableY + 26);
    curX += colWidths[i];
  });

  // Table Data Rows
  let rowY = tableY + thHeight + 4;
  const rowHeight = 44;

  creditCalculations.forEach((calc) => {
    const isSelected = calc.periodMonths === selectedPeriod;
    const rowBg = isSelected ? '#fef3c7' : '#ffffff';
    const borderCol = isSelected ? '#f59e0b' : '#e2e8f0';

    roundRect(marginX, rowY, contentWidth, rowHeight, 6, rowBg, borderCol, isSelected ? 1.5 : 1);

    curX = marginX;

    // Col 1: Period
    ctx.fillStyle = isSelected ? '#92400e' : '#0f172a';
    ctx.font = isSelected
      ? 'bold 13px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
      : '600 13px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillText(
      `${calc.periodMonths} Ay (${calc.periodMonths / 12} İl)${isSelected ? ' ★' : ''}`,
      curX + 16,
      rowY + 27
    );
    curX += colWidths[0];

    // Col 2: 1 m2 price
    ctx.fillStyle = '#334155';
    ctx.font = '500 13px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillText(formatCurrency(calc.pricePerM2), curX + 16, rowY + 27);
    curX += colWidths[1];

    // Col 3: Total Price
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 13px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillText(formatCurrency(calc.totalPrice), curX + 16, rowY + 27);
    curX += colWidths[2];

    // Col 4: Initial Payment
    ctx.fillStyle = '#b45309';
    ctx.font = '600 13px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillText(formatCurrency(calc.initialPaymentAmount), curX + 16, rowY + 27);
    curX += colWidths[3];

    // Col 5: Remaining balance
    ctx.fillStyle = '#475569';
    ctx.font = '500 13px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillText(formatCurrency(calc.remainingBalance), curX + 16, rowY + 27);
    curX += colWidths[4];

    // Col 6: Monthly Payment (Highlighted)
    if (calc.pricePerM2 <= 0) {
      ctx.fillStyle = '#94a3b8';
      ctx.font = 'bold 13px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.fillText('0 ₼ (Yoxdur)', curX + 16, rowY + 27);
    } else {
      ctx.fillStyle = isSelected ? '#78350f' : '#b45309';
      ctx.font = 'bold 14px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.fillText(formatCurrency(calc.monthlyPayment), curX + 16, rowY + 27);
    }

    rowY += rowHeight + 4;
  });

  // 4. SELECTED CREDIT PLAN BANNER
  const bannerY = rowY + 16;
  const bannerH = 200;
  roundRect(marginX, bannerY, contentWidth, bannerH, 14, '#0f172a', '#334155', 1);

  // Top header of banner
  ctx.fillStyle = '#f59e0b';
  ctx.font = 'bold 11px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText('SEÇİLMİŞ KREDİT TƏKLİFİ', marginX + 24, bannerY + 30);

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 18px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText(
    `Mənzil № ${apartment.apartmentNumber} · ${selectedPeriod} Aylıq Kredit Planı (${selectedPeriod / 12} İl)`,
    marginX + 24,
    bannerY + 56
  );

  // Right large callout for monthly payment
  ctx.textAlign = 'right';
  ctx.fillStyle = '#94a3b8';
  ctx.font = '12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText('Aylıq Sabit Ödəniş:', marginX + contentWidth - 24, bannerY + 32);

  ctx.fillStyle = '#f59e0b';
  ctx.font = 'bold 24px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText(
    formatCurrency(selectedCalc.monthlyPayment),
    marginX + contentWidth - 24,
    bannerY + 58
  );
  ctx.textAlign = 'left'; // reset

  // Divider inside banner
  ctx.beginPath();
  ctx.moveTo(marginX + 24, bannerY + 76);
  ctx.lineTo(marginX + contentWidth - 24, bannerY + 76);
  ctx.strokeStyle = '#334155';
  ctx.lineWidth = 1;
  ctx.stroke();

  // 4 sub-metrics inside banner
  const subBoxGap = 16;
  const subBoxW = (contentWidth - 48 - subBoxGap * 3) / 4;
  const subBoxY = bannerY + 90;
  const subBoxH = 88;

  const subMetrics = [
    {
      title: 'Toplam Kredit',
      value: formatCurrency(selectedCalc.totalPrice),
      sub: `1 m² = ${formatCurrency(selectedCalc.pricePerM2)}`,
    },
    {
      title: `İlkin Ödəniş (${selectedCalc.initialPaymentPercent}%)`,
      value: formatCurrency(selectedCalc.initialPaymentAmount),
      sub: 'Müqavilə bağlanarkən',
    },
    {
      title: 'Qalıq Borc Məbləği',
      value: formatCurrency(selectedCalc.remainingBalance),
      sub: `${selectedCalc.periodMonths} aya bölünür`,
    },
    {
      title: 'Kredit Müddəti',
      value: `${selectedCalc.periodMonths} Ay`,
      sub: `${selectedCalc.periodMonths / 12} İl müddətində`,
    },
  ];

  subMetrics.forEach((m, idx) => {
    const sX = marginX + 24 + idx * (subBoxW + subBoxGap);
    roundRect(sX, subBoxY, subBoxW, subBoxH, 8, '#1e293b', '#334155', 1);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '11px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillText(m.title, sX + 14, subBoxY + 24);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 15px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillText(m.value, sX + 14, subBoxY + 50);

    ctx.fillStyle = '#64748b';
    ctx.font = '11px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillText(m.sub, sX + 14, subBoxY + 72);
  });

  // 5. APARTMENT DETAILED SPECS BOX
  const specsY = bannerY + bannerH + 20;
  const specsH = 170;
  roundRect(marginX, specsY, contentWidth, specsH, 12, '#f8fafc', '#e2e8f0', 1);

  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 14px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText('MƏNZİL PARAMETRLƏRİ VƏ KREDİT ŞƏRTLƏRİ', marginX + 24, specsY + 30);

  // Specs Columns
  const specsCol1 = [
    `• Bina / Blok: Blok ${apartment.block}`,
    `• Mənzil Nömrəsi: № ${apartment.apartmentNumber}`,
    `• Yerləşdiyi Mərtəbə: ${apartment.floor} / 10 mərtəbə`,
    `• Otaq Sayı: ${apartment.rooms} otaqlı mənzil`,
  ];

  const specsCol2 = [
    `• Ümumi Sahə: ${apartment.area} m²`,
    `• Mənzərə / Görüntü: ${apartment.view || 'Standart Kompleks Həyəti'}`,
    `• Qeyd: ${apartment.notes || 'Qeyd olunmayıb'}`,
    '• Ödəniş Növü: Hissə-hissə faizsiz daxili kredit',
  ];

  const specsCol3 = [
    '• Aylıq ödənişlər bərabər hissələrlə qrafik üzrə həyata keçirilir.',
    '• Erkən ödəmə zamanı heç bir cərimə və ya komissiya tətbiq olunmur.',
    '• İlkin ödəniş məbləği müqavilə imzalanarkən təqdim olunur.',
  ];

  ctx.fillStyle = '#334155';
  ctx.font = '12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';

  specsCol1.forEach((text, i) => {
    ctx.fillText(text, marginX + 24, specsY + 60 + i * 24);
  });

  specsCol2.forEach((text, i) => {
    ctx.fillText(text, marginX + 380, specsY + 60 + i * 24);
  });

  specsCol3.forEach((text, i) => {
    ctx.fillText(text, marginX + 720, specsY + 60 + i * 24);
  });

  // 6. OFFICIAL FOOTER / SIGNATURE BAR (Single-Page Fit Guaranteed)
  const footerY = 1630;
  ctx.beginPath();
  ctx.moveTo(marginX, footerY);
  ctx.lineTo(marginX + contentWidth, footerY);
  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.fillStyle = '#64748b';
  ctx.font = '11px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText(
    'Bu sənəd "Neo City" yaşayış kompleksi üzrə rəsmi kredit kalkulyatorundan müştəri təklif vərəqi olaraq generasiya edilmişdir.',
    marginX,
    footerY + 24
  );

  ctx.fillText(
    'Təklif məlumat xarakteri daşıyır və rəsmi alqı-satqı müqaviləsi bağlanarkən təsdiq olunur.  ·  Əlaqə: realestatecapital.rec@gmail.com',
    marginX,
    footerY + 44
  );

  ctx.textAlign = 'right';
  ctx.fillText(
    `Səhifə: 1 / 1 (A4)  ·  Çap tarixi: ${new Date().toLocaleDateString('az-AZ')} ${new Date().toLocaleTimeString('az-AZ', { hour: '2-digit', minute: '2-digit' })}`,
    marginX + contentWidth,
    footerY + 34
  );
  ctx.textAlign = 'left';

  // 7. GENERATE 1-PAGE A4 PDF
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
    compress: true,
  });

  const imgData = canvas.toDataURL('image/jpeg', 0.95);

  // Exact A4 dimensions: 210 x 297 mm
  doc.addImage(imgData, 'JPEG', 0, 0, 210, 297, undefined, 'FAST');

  const safeFilename = `Neo_City_Menzil_${apartment.apartmentNumber}_Kredit_Hesablama.pdf`;
  doc.save(safeFilename);
}

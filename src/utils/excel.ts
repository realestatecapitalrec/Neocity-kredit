import * as XLSX from 'xlsx';
import { Apartment, BlockType } from '../types.ts';
import { calculateSingleCredit } from './calculator.ts';

// Helper to normalize header keys
function normalizeKey(str: string): string {
  return str
    .toLowerCase()
    .replace(/ə/g, 'e')
    .replace(/ı/g, 'i')
    .replace(/ö/g, 'o')
    .replace(/ü/g, 'u')
    .replace(/ş/g, 's')
    .replace(/ç/g, 'c')
    .replace(/ğ/g, 'g')
    .replace(/№/g, 'no')
    .replace(/²/g, '2')
    .replace(/[^a-z0-9]/g, '');
}

export function parseExcelFile(file: File): Promise<{
  success: boolean;
  data: Apartment[];
  errors: string[];
  totalRows: number;
}> {
  return new Promise((resolve) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const buffer = e.target?.result;
        if (!buffer) {
          resolve({
            success: false,
            data: [],
            errors: ['Fayl oxuna bilmədi.'],
            totalRows: 0,
          });
          return;
        }

        const workbook = XLSX.read(buffer, { type: 'binary' });
        const firstSheetName = workbook.SheetNames[0];
        if (!firstSheetName) {
          resolve({
            success: false,
            data: [],
            errors: ['Excel faylında heç bir vərəq tapılmadı.'],
            totalRows: 0,
          });
          return;
        }

        const worksheet = workbook.Sheets[firstSheetName];
        const rawJson = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet, {
          defval: '',
        });

        if (rawJson.length === 0) {
          resolve({
            success: false,
            data: [],
            errors: ['Excel vərəqi boşdur və ya başlıqlar tapılmadı.'],
            totalRows: 0,
          });
          return;
        }

        const parsedApartments: Apartment[] = [];
        const errors: string[] = [];

        rawJson.forEach((row, index) => {
          // Map headers flexibly
          const rowKeys = Object.keys(row);
          const getVal = (...possibleMatches: string[]): unknown => {
            for (const match of possibleMatches) {
              const normMatch = normalizeKey(match);
              for (const key of rowKeys) {
                const normKey = normalizeKey(key);
                if (normKey === normMatch || normKey.includes(normMatch)) {
                  return row[key];
                }
              }
            }
            return undefined;
          };

          // Extract fields
          const rawAptNum = getVal('menzilno', 'menzil', 'nomre', 'no', 'apartment', 'unit');
          const rawBlock = String(getVal('blok', 'block', 'bina') || '').trim().toUpperCase();
          const rawFloor = Number(getVal('mertebe', 'floor', 'etaj'));
          const rawRooms = Number(getVal('otaqsayi', 'otaq', 'rooms', 'komnat'));
          const rawArea = Number(getVal('sahesi', 'sahe', 'area', 'm2', 'kvadrat'));
          const rawView = String(getVal('goruntu', 'goruntusu', 'menzere', 'panorama', 'view', 'baxis') || '').trim();

          const valCash = getVal('neqdqiymet', 'neqd', 'negd', 'nagd', 'cash', 'nagd1m2');
          const valTotalCash = getVal('toplamqiymet', 'toplam', 'totalprice', 'yekun');
          const hasCash = valCash !== undefined && valCash !== null && String(valCash).trim() !== '';
          const hasTotalCash = valTotalCash !== undefined && valTotalCash !== null && String(valTotalCash).trim() !== '';

          let rawCashM2 = hasCash ? Number(String(valCash).replace(/,/g, '')) : NaN;

          // If rawCashM2 is missing but total and area exist:
          if (isNaN(rawCashM2) && hasTotalCash && !isNaN(Number(rawArea)) && Number(rawArea) > 0) {
            const tot = Number(String(valTotalCash).replace(/,/g, ''));
            if (!isNaN(tot) && tot > 0) {
              rawCashM2 = Math.round(tot / Number(rawArea));
            }
          }

          const val12 = getVal('12ay1m2', '12aym2', '12ay', '12ayliq', '12aykredit', 'kredit12', '12m2', '12', 'ay12');
          const has12 = val12 !== undefined && val12 !== null && String(val12).trim() !== '';
          const rawCredit12M2 = has12 ? Number(String(val12).replace(/,/g, '')) : NaN;

          const val24 = getVal('24ay1m2', '24aym2', '24ay', '24ayliq', '24aykredit', 'kredit24', '24m2', '24', 'ay24');
          const has24 = val24 !== undefined && val24 !== null && String(val24).trim() !== '';
          const rawCredit24M2 = has24 ? Number(String(val24).replace(/,/g, '')) : NaN;

          const val36 = getVal('36ay1m2', '36aym2', '36ay', '36ayliq', '36aykredit', 'kredit36', '36m2', '36', 'ay36');
          const has36 = val36 !== undefined && val36 !== null && String(val36).trim() !== '';
          const rawCredit36M2 = has36 ? Number(String(val36).replace(/,/g, '')) : NaN;

          const val48 = getVal('48ay1m2', '48aym2', '48ay', '48ayliq', '48aykredit', 'kredit48', '48m2', '48', 'ay48');
          const has48 = val48 !== undefined && val48 !== null && String(val48).trim() !== '';
          const rawCredit48M2 = has48 ? Number(String(val48).replace(/,/g, '')) : NaN;

          const val60 = getVal('60ay1m2', '60aym2', '60ay', '60ayliq', '60aykredit', 'kredit60', '60m2', '60', 'ay60');
          const has60 = val60 !== undefined && val60 !== null && String(val60).trim() !== '';
          const rawCredit60M2 = has60 ? Number(String(val60).replace(/,/g, '')) : NaN;

          // General credit column fallback if specific months not provided
          const valGeneralCredit = getVal('kredit1m2', 'kreditqiymet', 'kreditqiymeti', 'kredit', 'kreditle');
          const hasGeneral = valGeneralCredit !== undefined && valGeneralCredit !== null && String(valGeneralCredit).trim() !== '';
          const rawGeneralCreditM2 = hasGeneral ? Number(String(valGeneralCredit).replace(/,/g, '')) : NaN;
          const genCreditVal = !isNaN(rawGeneralCreditM2) && rawGeneralCreditM2 > 0 ? rawGeneralCreditM2 : 0;

          const rawNotes = String(getVal('qeyd', 'qeydler', 'notes') || '');

          // Normalize block
          let validBlock: BlockType = 'A';
          if (rawBlock === 'B') validBlock = 'B';
          else if (rawBlock === 'C') validBlock = 'C';
          else if (rawBlock === 'C2' || rawBlock === 'C-2' || rawBlock === 'C 2') validBlock = 'C2';
          else validBlock = 'A';

          // Validate floor: allow 2 to 20 (now including 10)
          const floor = isNaN(rawFloor) || rawFloor < 2 || rawFloor > 20 ? 2 : rawFloor;

          // Validate rooms: 1, 2, 3, 4
          const rooms = isNaN(rawRooms) || rawRooms < 1 || rawRooms > 6 ? 1 : Math.round(rawRooms);

          // Validate area
          const area = isNaN(rawArea) || rawArea <= 0 ? 50 : Math.round(rawArea * 100) / 100;

          // Validate prices (0 AZN is allowed as valid minimum)
          const cashPricePerM2 = !isNaN(rawCashM2) && rawCashM2 >= 0 ? rawCashM2 : 1900;
          
          // Credit prices: If provided in the Excel sheet (including 0!), preserve that EXACT value.
          // Never replace 0 with synthetic or auto-calculated prices (e.g. 1-room has no 36, 48, 60 month credit, so it is 0).
          const anySpecificMonthColumn = has12 || has24 || has36 || has48 || has60;

          const resolveCreditPrice = (hasCol: boolean, rawNum: number): number => {
            if (hasCol) {
              return !isNaN(rawNum) && rawNum >= 0 ? rawNum : 0;
            }
            // Only if NONE of the specific month columns existed in the sheet, fall back to general credit column if present
            if (!anySpecificMonthColumn && genCreditVal > 0) {
              return genCreditVal;
            }
            return 0;
          };

          const credit12 = resolveCreditPrice(has12, rawCredit12M2);
          const credit24 = resolveCreditPrice(has24, rawCredit24M2);
          const credit36 = resolveCreditPrice(has36, rawCredit36M2);
          const credit48 = resolveCreditPrice(has48, rawCredit48M2);
          const credit60 = resolveCreditPrice(has60, rawCredit60M2);

          const aptNum = rawAptNum !== undefined && String(rawAptNum).trim() !== ''
            ? String(rawAptNum).trim()
            : `${index + 1}`;

          parsedApartments.push({
            id: `apt-import-${Date.now()}-${index}`,
            apartmentNumber: aptNum,
            block: validBlock,
            floor,
            rooms,
            area,
            view: rawView || undefined,
            cashPricePerM2,
            credit12PricePerM2: credit12,
            credit24PricePerM2: credit24,
            credit36PricePerM2: credit36,
            credit48PricePerM2: credit48,
            credit60PricePerM2: credit60,
            notes: rawNotes,
          });
        });

        resolve({
          success: true,
          data: parsedApartments,
          errors,
          totalRows: rawJson.length,
        });
      } catch (err) {
        resolve({
          success: false,
          data: [],
          errors: [`Excel faylını oxuyarkən xəta baş verdi: ${(err as Error).message}`],
          totalRows: 0,
        });
      }
    };

    reader.onerror = () => {
      resolve({
        success: false,
        data: [],
        errors: ['Fayl oxunarkən xəta baş verdi.'],
        totalRows: 0,
      });
    };

    reader.readAsBinaryString(file);
  });
}

export function downloadExcelTemplate() {
  // Generate the full template matching the architectural specification from the user's table
  const templateRows = [
    {
      'Mərtəbə': 2,
      'Mənzil №': '1',
      'Otaq sayı': 1,
      'Sahəsi': 66.80,
      'Görüntü': 'Həyət',
      'Nəğd Qiymət': 2100,
      'Toplam qiymət': 140280,
      '12 Ay 1 m²': 2200,
      '24 Ay 1 m²': 2300,
      '36 Ay 1 m²': 0, // 1 otaqlıda 36, 48, 60 aylıq kredit yoxdur (0 olaraq qalır)
      '48 Ay 1 m²': 0,
      '60 Ay 1 m²': 0,
      'Blok': 'A',
      'Qeyd': '1 otaqlı (36, 48, 60 ay kredit yoxdur)',
    },
    {
      'Mərtəbə': 2,
      'Mənzil №': '2',
      'Otaq sayı': 2,
      'Sahəsi': 93.50,
      'Görüntü': 'Həyət',
      'Nəğd Qiymət': 2000,
      'Toplam qiymət': 187000,
      '12 Ay 1 m²': 2100,
      '24 Ay 1 m²': 2200,
      '36 Ay 1 m²': 2300,
      '48 Ay 1 m²': 2400,
      '60 Ay 1 m²': 2500,
      'Blok': 'A',
      'Qeyd': '',
    },
    {
      'Mərtəbə': 2,
      'Mənzil №': '3',
      'Otaq sayı': 3,
      'Sahəsi': 123.50,
      'Görüntü': 'Park',
      'Nəğd Qiymət': 1900,
      'Toplam qiymət': 234650,
      '12 Ay 1 m²': 2000,
      '24 Ay 1 m²': 2100,
      '36 Ay 1 m²': 2200,
      '48 Ay 1 m²': 2300,
      '60 Ay 1 m²': 2400,
      'Blok': 'A',
      'Qeyd': '',
    },
    {
      'Mərtəbə': 2,
      'Mənzil №': '4',
      'Otaq sayı': 2,
      'Sahəsi': 95.80,
      'Görüntü': 'Park',
      'Nəğd Qiymət': 2000,
      'Toplam qiymət': 191600,
      '12 Ay 1 m²': 2100,
      '24 Ay 1 m²': 2200,
      '36 Ay 1 m²': 2300,
      '48 Ay 1 m²': 2400,
      '60 Ay 1 m²': 2500,
      'Blok': 'A',
      'Qeyd': '',
    },
    {
      'Mərtəbə': 2,
      'Mənzil №': '5',
      'Otaq sayı': 3,
      'Sahəsi': 124.00,
      'Görüntü': 'Park',
      'Nəğd Qiymət': 1900,
      'Toplam qiymət': 235600,
      '12 Ay 1 m²': 2000,
      '24 Ay 1 m²': 2100,
      '36 Ay 1 m²': 2200,
      '48 Ay 1 m²': 2300,
      '60 Ay 1 m²': 2400,
      'Blok': 'A',
      'Qeyd': '',
    },
    {
      'Mərtəbə': 2,
      'Mənzil №': '6',
      'Otaq sayı': 3,
      'Sahəsi': 143.00,
      'Görüntü': 'Ə.Mehbalıyev',
      'Nəğd Qiymət': 1900,
      'Toplam qiymət': 271700,
      '12 Ay 1 m²': 2000,
      '24 Ay 1 m²': 2100,
      '36 Ay 1 m²': 2200,
      '48 Ay 1 m²': 2300,
      '60 Ay 1 m²': 2400,
      'Blok': 'A',
      'Qeyd': '',
    },
  ];

  const worksheet = XLSX.utils.json_to_sheet(templateRows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Mənzillər');

  // Set column widths matching table
  worksheet['!cols'] = [
    { wch: 10 }, // Mərtəbə
    { wch: 12 }, // Mənzil №
    { wch: 12 }, // Otaq sayı
    { wch: 12 }, // Sahəsi
    { wch: 16 }, // Görüntü
    { wch: 15 }, // Nəğd Qiymət
    { wch: 16 }, // Toplam qiymət
    { wch: 14 }, // 12 Ay 1 m²
    { wch: 14 }, // 24 Ay 1 m²
    { wch: 14 }, // 36 Ay 1 m²
    { wch: 14 }, // 48 Ay 1 m²
    { wch: 14 }, // 60 Ay 1 m²
    { wch: 8 },  // Blok
    { wch: 20 }, // Qeyd
  ];

  XLSX.writeFile(workbook, 'bina_menziller_sablon.xlsx');
}

export function exportApartmentsToExcel(apartments: Apartment[], initialPercent: number) {
  const dataToExport = apartments.map((apt) => {
    const effectivePercent =
      typeof apt.customInitialPaymentPercent === 'number' && apt.customInitialPaymentPercent >= 0
        ? apt.customInitialPaymentPercent
        : initialPercent;

    const cashTotal = apt.area * apt.cashPricePerM2;

    const c12 = calculateSingleCredit(apt.area, apt.credit12PricePerM2, 12, effectivePercent);
    const c24 = calculateSingleCredit(apt.area, apt.credit24PricePerM2, 24, effectivePercent);
    const c36 = calculateSingleCredit(apt.area, apt.credit36PricePerM2, 36, effectivePercent);
    const c48 = calculateSingleCredit(apt.area, apt.credit48PricePerM2, 48, effectivePercent);
    const c60 = calculateSingleCredit(apt.area, apt.credit60PricePerM2, 60, effectivePercent);

    return {
      'Mərtəbə': apt.floor,
      'Mənzil №': apt.apartmentNumber,
      'Otaq Sayı': apt.rooms,
      'Sahə (m²)': apt.area,
      'Görüntü': apt.view || '—',
      'Nəğd 1 m² (₼)': apt.cashPricePerM2,
      'Toplam Qiymət (₼)': Math.round(cashTotal),
      'İlkin Ödəniş Faizi (%)': effectivePercent,

      // 12 Ay
      '12 Ay 1 m² (₼)': apt.credit12PricePerM2,
      '12 Ay Toplam Qiymət (₼)': Math.round(c12.totalPrice),
      '12 Ay İlkin Ödəniş (₼)': Math.round(c12.initialPaymentAmount),
      '12 Ay Qalıq Məbləğ (₼)': Math.round(c12.remainingBalance),
      '12 Ay Aylıq Ödəniş (₼)': Math.round(c12.monthlyPayment),

      // 24 Ay
      '24 Ay 1 m² (₼)': apt.credit24PricePerM2,
      '24 Ay Toplam Qiymət (₼)': Math.round(c24.totalPrice),
      '24 Ay İlkin Ödəniş (₼)': Math.round(c24.initialPaymentAmount),
      '24 Ay Qalıq Məbləğ (₼)': Math.round(c24.remainingBalance),
      '24 Ay Aylıq Ödəniş (₼)': Math.round(c24.monthlyPayment),

      // 36 Ay
      '36 Ay 1 m² (₼)': apt.credit36PricePerM2,
      '36 Ay Toplam Qiymət (₼)': Math.round(c36.totalPrice),
      '36 Ay İlkin Ödəniş (₼)': Math.round(c36.initialPaymentAmount),
      '36 Ay Qalıq Məbləğ (₼)': Math.round(c36.remainingBalance),
      '36 Ay Aylıq Ödəniş (₼)': Math.round(c36.monthlyPayment),

      // 48 Ay
      '48 Ay 1 m² (₼)': apt.credit48PricePerM2,
      '48 Ay Toplam Qiymət (₼)': Math.round(c48.totalPrice),
      '48 Ay İlkin Ödəniş (₼)': Math.round(c48.initialPaymentAmount),
      '48 Ay Qalıq Məbləğ (₼)': Math.round(c48.remainingBalance),
      '48 Ay Aylıq Ödəniş (₼)': Math.round(c48.monthlyPayment),

      // 60 Ay
      '60 Ay 1 m² (₼)': apt.credit60PricePerM2,
      '60 Ay Toplam Qiymət (₼)': Math.round(c60.totalPrice),
      '60 Ay İlkin Ödəniş (₼)': Math.round(c60.initialPaymentAmount),
      '60 Ay Qalıq Məbləğ (₼)': Math.round(c60.remainingBalance),
      '60 Ay Aylıq Ödəniş (₼)': Math.round(c60.monthlyPayment),

      'Blok': apt.block,
      'Qeyd': apt.notes || '',
    };
  });

  const worksheet = XLSX.utils.json_to_sheet(dataToExport);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Kredit Hesablamaları');

  const now = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(workbook, `bina_kredit_hesabat_${now}.xlsx`);
}

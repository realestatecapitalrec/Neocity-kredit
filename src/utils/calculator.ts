import { Apartment, ApartmentCalculations, CreditCalculation, CreditPeriod } from '../types.ts';

export const CREDIT_PERIODS: CreditPeriod[] = [12, 24, 36, 48, 60];

export function calculateSingleCredit(
  area: number,
  pricePerM2: number,
  periodMonths: CreditPeriod,
  initialPercent: number
): CreditCalculation {
  const safeArea = Number(area) || 0;
  const safePrice = Number(pricePerM2) || 0;
  const safePercent = Math.max(0, Math.min(100, Number(initialPercent) || 0));

  const totalPrice = safeArea * safePrice;
  const initialPaymentAmount = (totalPrice * safePercent) / 100;
  const remainingBalance = Math.max(0, totalPrice - initialPaymentAmount);
  const monthlyPayment = periodMonths > 0 ? remainingBalance / periodMonths : 0;

  return {
    periodMonths,
    pricePerM2: safePrice,
    totalPrice,
    initialPaymentPercent: safePercent,
    initialPaymentAmount,
    remainingBalance,
    monthlyPayment,
  };
}

export function calculateApartmentAllCredits(
  apt: Apartment,
  defaultInitialPercent: number = 20
): ApartmentCalculations {
  const effectiveInitialPercent =
    typeof apt.customInitialPaymentPercent === 'number' && apt.customInitialPaymentPercent >= 0
      ? apt.customInitialPaymentPercent
      : defaultInitialPercent;

  const cashPrice = Number(apt.cashPricePerM2) || 0;
  const cashTotalPrice = (Number(apt.area) || 0) * cashPrice;

  // Exact credit prices as saved in the apartment data (0 means credit is not offered for this period)
  const p12 = Number(apt.credit12PricePerM2) || 0;
  const p24 = Number(apt.credit24PricePerM2) || 0;
  const p36 = Number(apt.credit36PricePerM2) || 0;
  const p48 = Number(apt.credit48PricePerM2) || 0;
  const p60 = Number(apt.credit60PricePerM2) || 0;

  const credits: Record<CreditPeriod, CreditCalculation> = {
    12: calculateSingleCredit(apt.area, p12, 12, effectiveInitialPercent),
    24: calculateSingleCredit(apt.area, p24, 24, effectiveInitialPercent),
    36: calculateSingleCredit(apt.area, p36, 36, effectiveInitialPercent),
    48: calculateSingleCredit(apt.area, p48, 48, effectiveInitialPercent),
    60: calculateSingleCredit(apt.area, p60, 60, effectiveInitialPercent),
  };

  return {
    apartment: apt,
    cashTotalPrice,
    credits,
  };
}

export function formatCurrency(val: number, includeSymbol: boolean = true): string {
  if (isNaN(val) || val === null || val === undefined) return '0 ₼';
  const rounded = Math.round(val);
  const formatted = rounded.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  return includeSymbol ? `${formatted} ₼` : formatted;
}

export function formatNumber(val: number, decimals: number = 1): string {
  if (isNaN(val) || val === null || val === undefined) return '0';
  return Number(val).toLocaleString('az-AZ', {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals,
  });
}

import { useState } from 'react';
import { Calendar, CheckCircle2, DollarSign, FileDown, Percent, X } from 'lucide-react';
import { Apartment, CreditPeriod } from '../types.ts';
import {
  CREDIT_PERIODS,
  calculateSingleCredit,
  formatCurrency,
} from '../utils/calculator.ts';
import { generateCreditPdf } from '../utils/generateCreditPdf.ts';

interface CreditDetailModalProps {
  apartment: Apartment | null;
  defaultInitialPercent: number;
  onClose: () => void;
}

export default function CreditDetailModal({
  apartment,
  defaultInitialPercent,
  onClose,
}: CreditDetailModalProps) {
  if (!apartment) return null;

  const [initialPercent, setInitialPercent] = useState<number>(
    typeof apartment.customInitialPaymentPercent === 'number'
      ? apartment.customInitialPaymentPercent
      : defaultInitialPercent
  );

  const initialDefaultPeriod: CreditPeriod =
    (apartment.credit36PricePerM2 ?? 0) > 0
      ? 36
      : (apartment.credit24PricePerM2 ?? 0) > 0
      ? 24
      : (apartment.credit12PricePerM2 ?? 0) > 0
      ? 12
      : 36;

  const [selectedPeriod, setSelectedPeriod] = useState<CreditPeriod>(initialDefaultPeriod);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState<boolean>(false);

  const cashTotal = apartment.area * apartment.cashPricePerM2;

  const creditCalculations = CREDIT_PERIODS.map((period) => {
    let m2Price = apartment.credit12PricePerM2;
    if (period === 24) m2Price = apartment.credit24PricePerM2;
    if (period === 36) m2Price = apartment.credit36PricePerM2;
    if (period === 48) m2Price = apartment.credit48PricePerM2;
    if (period === 60) m2Price = apartment.credit60PricePerM2;

    return calculateSingleCredit(apartment.area, m2Price, period, initialPercent);
  });

  const handleDownloadPdf = async () => {
    try {
      setIsGeneratingPdf(true);
      generateCreditPdf({
        apartment,
        initialPercent,
        selectedPeriod,
      });
    } catch (err) {
      console.error('PDF yaradılarkən xəta baş verdi:', err);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-slate-950/70 backdrop-blur-xs overflow-hidden">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-5xl max-h-[94vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header (Sticky) */}
        <div className="bg-slate-900 text-white px-4 sm:px-6 py-3.5 sm:py-4 flex items-center justify-between shrink-0 border-b border-slate-800">
          <div className="min-w-0 pr-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 text-2xs font-bold uppercase tracking-wide">
                Blok {apartment.block}
              </span>
              <h2 className="text-base sm:text-lg font-bold truncate">
                Mənzil № {apartment.apartmentNumber} — Kredit Şərtləri & Hesablama
              </h2>
            </div>
            <p className="text-2xs sm:text-xs text-slate-400 mt-0.5 truncate">
              Mərtəbə: {apartment.floor} / 10 · Otaq: {apartment.rooms} · Sahə: {apartment.area} m²
              {apartment.view ? ` · Görüntü: ${apartment.view}` : ''}
              {apartment.notes ? ` · (${apartment.notes})` : ''}
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              id="btn-download-pdf-header"
              type="button"
              onClick={handleDownloadPdf}
              disabled={isGeneratingPdf}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-xs font-bold text-slate-950 transition cursor-pointer shadow-xs disabled:opacity-60"
              title="Hesablamanı 1 vərəqdə A4 formatlı PDF faylı olaraq endirin"
            >
              <FileDown className="w-4 h-4 text-slate-950" />
              <span>{isGeneratingPdf ? 'PDF Hazırlanır...' : 'PDF Endir'}</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
              title="Bağla"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-6 overscroll-contain">
          {/* Top Info Banner: Cash Price vs Initial Payment Setting */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
            {/* Cash Purchase Box */}
            <div className="bg-emerald-50/80 border border-emerald-200/90 rounded-xl p-3.5 sm:p-4 flex flex-col justify-between">
              <div>
                <span className="text-2xs sm:text-xs font-bold text-emerald-800 uppercase tracking-wider block">
                  Nəğd Alış Qiyməti
                </span>
                <div className="text-xl sm:text-2xl font-black text-emerald-900 mt-1">
                  {formatCurrency(cashTotal)}
                </div>
              </div>
              <div className="text-2xs sm:text-xs text-emerald-700 font-medium mt-1">
                1 m² = {formatCurrency(apartment.cashPricePerM2)}
              </div>
            </div>

            {/* Interactive Down Payment Percentage Controller */}
            <div className="md:col-span-2 bg-amber-50/90 border border-amber-200/90 rounded-xl p-3.5 sm:p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-amber-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Percent className="w-4 h-4 text-amber-700" />
                  İlkin Ödəniş Dərəcəsi:
                </span>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    min="0"
                    max="99"
                    value={initialPercent}
                    onChange={(e) =>
                      setInitialPercent(Math.max(0, Math.min(99, Number(e.target.value) || 0)))
                    }
                    className="w-16 px-2 py-1 bg-white border border-amber-300 rounded text-center font-bold text-amber-900 text-sm focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                  />
                  <span className="font-bold text-amber-800">%</span>
                </div>
              </div>

              {/* Slider */}
              <input
                type="range"
                min="10"
                max="80"
                step="5"
                value={initialPercent}
                onChange={(e) => setInitialPercent(Number(e.target.value))}
                className="w-full accent-amber-600 h-2 bg-amber-200 rounded-lg cursor-pointer"
              />

              {/* Quick Percentage Presets */}
              <div className="flex items-center justify-between text-2xs sm:text-xs font-semibold text-amber-800 mt-2 flex-wrap gap-1">
                {[15, 20, 25, 30, 40, 50, 60].map((pct) => (
                  <button
                    key={pct}
                    type="button"
                    onClick={() => setInitialPercent(pct)}
                    className={`px-2 py-0.5 rounded transition cursor-pointer ${
                      initialPercent === pct
                        ? 'bg-amber-600 text-white shadow-xs'
                        : 'bg-white/80 hover:bg-amber-200/70 border border-amber-200'
                    }`}
                  >
                    {pct}%
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 5 Comparative Credit Cards (12, 24, 36, 48, 60 Months) */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <h3 className="text-xs sm:text-sm font-bold text-slate-800 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-amber-600" />
                Kredit Müddətləri Üzrə Müqayisəli Cədvəl
              </h3>
              <span className="text-2xs text-slate-500 hidden sm:inline">
                Seçmək üçün karta klikləyin
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
              {creditCalculations.map((calc) => {
                const isSelected = selectedPeriod === calc.periodMonths;
                const isZero = calc.pricePerM2 <= 0;

                return (
                  <div
                    key={calc.periodMonths}
                    onClick={() => setSelectedPeriod(calc.periodMonths)}
                    className={`rounded-xl p-3 sm:p-3.5 border cursor-pointer transition relative flex flex-col justify-between ${
                      isSelected
                        ? isZero
                          ? 'bg-slate-100 border-slate-400 ring-2 ring-slate-300 shadow-md'
                          : 'bg-amber-50/95 border-amber-500 ring-2 ring-amber-500/25 shadow-md'
                        : isZero
                        ? 'bg-slate-50/80 border-slate-200 opacity-75 hover:opacity-100'
                        : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-xs'
                    }`}
                  >
                    <div>
                      {/* Card Header */}
                      <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                        <span className="text-xs sm:text-sm font-black text-slate-900">
                          {calc.periodMonths} Ay Kredit
                        </span>
                        {isZero ? (
                          <span className="px-1.5 py-0.5 rounded bg-slate-200 text-slate-600 text-3xs font-bold">
                            Yoxdur (0)
                          </span>
                        ) : isSelected ? (
                          <CheckCircle2 className="w-4 h-4 text-amber-600" />
                        ) : null}
                      </div>

                      {/* 1 m2 Qiyməti */}
                      <div className="mt-2">
                        <span className="text-3xs text-slate-500 uppercase tracking-wider block">
                          1 m² Qiyməti
                        </span>
                        <span className={`text-xs font-semibold ${isZero ? 'text-slate-400' : 'text-slate-700'}`}>
                          {formatCurrency(calc.pricePerM2)}
                        </span>
                      </div>

                      {/* Toplam Qiymət */}
                      <div className="mt-1.5">
                        <span className="text-3xs text-slate-500 uppercase tracking-wider block">
                          Toplam Kredit
                        </span>
                        <span className={`text-xs sm:text-sm font-bold ${isZero ? 'text-slate-400' : 'text-slate-900'}`}>
                          {formatCurrency(calc.totalPrice)}
                        </span>
                      </div>

                      {/* İlkin Ödəniş */}
                      <div className="mt-1.5 pt-1.5 border-t border-dashed border-slate-200">
                        <span className="text-3xs text-slate-500 uppercase tracking-wider block font-medium">
                          İlkin Ödəniş ({calc.initialPaymentPercent}%)
                        </span>
                        <span className={`text-xs font-bold ${isZero ? 'text-slate-400' : 'text-amber-900'}`}>
                          {formatCurrency(calc.initialPaymentAmount)}
                        </span>
                      </div>

                      {/* Qalıq Məbləğ */}
                      <div className="mt-1.5">
                        <span className="text-3xs text-slate-500 uppercase tracking-wider block">
                          Qalıq Borc
                        </span>
                        <span className={`text-xs font-medium ${isZero ? 'text-slate-400' : 'text-slate-700'}`}>
                          {formatCurrency(calc.remainingBalance)}
                        </span>
                      </div>
                    </div>

                    {/* Aylıq Ödəniş Highlight */}
                    <div className="mt-3 pt-2.5 border-t border-slate-200/90 bg-slate-50/90 -mx-3 sm:-mx-3.5 -mb-3 sm:-mb-3.5 p-2.5 sm:p-3 rounded-b-xl">
                      <span className="text-3xs text-slate-600 uppercase tracking-wider block font-semibold">
                        Aylıq Ödəniş
                      </span>
                      <span className={`text-sm sm:text-base font-extrabold ${isZero ? 'text-slate-400' : 'text-amber-900'}`}>
                        {formatCurrency(calc.monthlyPayment)}
                      </span>
                      <span className="text-3xs text-slate-400 block mt-0.5">
                        {isZero ? 'Bu müddət üçün kredit yoxdur' : `${calc.periodMonths} ay müddətində`}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Detailed Selected Option Summary for Client Proposal */}
          {(() => {
            const selectedCalc = creditCalculations.find((c) => c.periodMonths === selectedPeriod)!;
            const isSelectedZero = selectedCalc.pricePerM2 <= 0;

            if (isSelectedZero) {
              return (
                <div className="bg-slate-900 text-white rounded-xl p-4 sm:p-5 border border-slate-800">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                    <div>
                      <span className="text-2xs font-bold text-rose-400 uppercase tracking-wider block">
                        Kredit Nəzərdə Tutulmayıb (0 AZN)
                      </span>
                      <h4 className="text-sm sm:text-base font-bold text-white mt-0.5">
                        Mənzil № {apartment.apartmentNumber} üçün {selectedPeriod} Aylıq Kredit Verilmir
                      </h4>
                      <p className="text-xs text-slate-400 mt-1">
                        Bu mənzil üçün {selectedPeriod} aylıq kredit xanaları 0 AZN olaraq qeyd edilmişdir. Zəhmət olmasa təklif olunan digər müddətləri seçin.
                      </p>
                    </div>
                  </div>
                </div>
              );
            }

            return (
              <div className="bg-slate-900 text-white rounded-xl p-4 sm:p-5 border border-slate-800">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-3 border-b border-slate-800">
                  <div>
                    <span className="text-2xs font-bold text-amber-400 uppercase tracking-wider block">
                      Seçilmiş Kredit Təklifi
                    </span>
                    <h4 className="text-sm sm:text-base font-bold text-white">
                      Mənzil № {apartment.apartmentNumber} · {selectedPeriod} Aylıq Kredit Planı ({selectedPeriod / 12} İl)
                    </h4>
                  </div>
                  <div className="sm:text-right">
                    <span className="text-2xs text-slate-400 block">Aylıq Sabit Ödəniş:</span>
                    <span className="text-xl sm:text-2xl font-black text-amber-400">
                      {formatCurrency(selectedCalc.monthlyPayment)}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mt-3 sm:mt-4 text-xs">
                  <div className="bg-slate-800/60 rounded-lg p-2.5 border border-slate-800">
                    <span className="text-slate-400 text-2xs block">Toplam Kredit Məbləği</span>
                    <span className="text-sm sm:text-base font-bold text-white mt-0.5 block">
                      {formatCurrency(selectedCalc.totalPrice)}
                    </span>
                  </div>
                  <div className="bg-slate-800/60 rounded-lg p-2.5 border border-slate-800">
                    <span className="text-slate-400 text-2xs block">
                      İlkin Ödəniş ({selectedCalc.initialPaymentPercent}%)
                    </span>
                    <span className="text-sm sm:text-base font-bold text-amber-300 mt-0.5 block">
                      {formatCurrency(selectedCalc.initialPaymentAmount)}
                    </span>
                  </div>
                  <div className="bg-slate-800/60 rounded-lg p-2.5 border border-slate-800">
                    <span className="text-slate-400 text-2xs block">Qalıq Borc Məbləği</span>
                    <span className="text-sm sm:text-base font-bold text-white mt-0.5 block">
                      {formatCurrency(selectedCalc.remainingBalance)}
                    </span>
                  </div>
                  <div className="bg-slate-800/60 rounded-lg p-2.5 border border-slate-800">
                    <span className="text-slate-400 text-2xs block">1 m² Kredit Qiyməti</span>
                    <span className="text-sm sm:text-base font-bold text-white mt-0.5 block">
                      {formatCurrency(selectedCalc.pricePerM2)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>

        {/* Modal Footer (Sticky) */}
        <div className="bg-slate-50 px-4 sm:px-6 py-3 border-t border-slate-200 flex items-center justify-between shrink-0">
          <div className="text-2xs text-slate-500 hidden sm:block">
            İlkin ödənişi dəyişərək real vaxt rejimində qalıq və aylıq ödənişləri tənzimləyə bilərsiniz.
          </div>
          <div className="flex items-center gap-2 ml-auto">
            <button
              id="btn-download-pdf-footer"
              type="button"
              onClick={handleDownloadPdf}
              disabled={isGeneratingPdf}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-xs font-bold text-slate-950 transition cursor-pointer shadow-xs disabled:opacity-60"
              title="Hesablamanı 1 vərəqdə A4 formatlı PDF faylı olaraq endirin"
            >
              <FileDown className="w-4 h-4 text-slate-950" />
              <span>{isGeneratingPdf ? 'PDF Hazırlanır...' : 'PDF Endir'}</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 rounded-lg text-xs sm:text-sm font-semibold text-slate-700 hover:bg-slate-200/80 transition cursor-pointer"
            >
              Bağla
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

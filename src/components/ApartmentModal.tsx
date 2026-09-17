import { useEffect, useState, type FormEvent } from 'react';
import { Building2, Save, Sparkles, X } from 'lucide-react';
import { Apartment, BlockType } from '../types.ts';

interface ApartmentModalProps {
  isOpen: boolean;
  apartmentToEdit?: Apartment | null;
  onClose: () => void;
  onSave: (apartment: Apartment) => void;
}

export default function ApartmentModal({
  isOpen,
  apartmentToEdit,
  onClose,
  onSave,
}: ApartmentModalProps) {
  const [apartmentNumber, setApartmentNumber] = useState<string>('');
  const [block, setBlock] = useState<BlockType>('A');
  const [floor, setFloor] = useState<number>(2);
  const [rooms, setRooms] = useState<number>(2);
  const [area, setArea] = useState<number | string>(75);
  const [view, setView] = useState<string>('Həyət');
  const [cashPricePerM2, setCashPricePerM2] = useState<number | string>(1500);

  const [credit12PricePerM2, setCredit12PricePerM2] = useState<number | string>(1600);
  const [credit24PricePerM2, setCredit24PricePerM2] = useState<number | string>(1700);
  const [credit36PricePerM2, setCredit36PricePerM2] = useState<number | string>(1800);
  const [credit48PricePerM2, setCredit48PricePerM2] = useState<number | string>(1900);
  const [credit60PricePerM2, setCredit60PricePerM2] = useState<number | string>(2000);

  const [notes, setNotes] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    if (apartmentToEdit) {
      setApartmentNumber(apartmentToEdit.apartmentNumber);
      setBlock(apartmentToEdit.block);
      setFloor(apartmentToEdit.floor);
      setRooms(apartmentToEdit.rooms);
      setArea(apartmentToEdit.area);
      setView(apartmentToEdit.view || 'Həyət');
      setCashPricePerM2(apartmentToEdit.cashPricePerM2);
      setCredit12PricePerM2(apartmentToEdit.credit12PricePerM2);
      setCredit24PricePerM2(apartmentToEdit.credit24PricePerM2);
      setCredit36PricePerM2(apartmentToEdit.credit36PricePerM2);
      setCredit48PricePerM2(apartmentToEdit.credit48PricePerM2);
      setCredit60PricePerM2(apartmentToEdit.credit60PricePerM2);
      setNotes(apartmentToEdit.notes || '');
    } else {
      setApartmentNumber('');
      setBlock('A');
      setFloor(2);
      setRooms(2);
      setArea(75);
      setView('Həyət');
      setCashPricePerM2(1500);
      setCredit12PricePerM2(1600);
      setCredit24PricePerM2(1700);
      setCredit36PricePerM2(1800);
      setCredit48PricePerM2(1900);
      setCredit60PricePerM2(2000);
      setNotes('');
    }
    setErrorMessage('');
  }, [apartmentToEdit, isOpen]);

  if (!isOpen) return null;

  // Helper: auto-calculate credit prices based on cash price
  const autoFillCreditPrices = () => {
    const base = Number(cashPricePerM2) || 0;
    setCredit12PricePerM2(base + 100);
    setCredit24PricePerM2(base + 200);
    setCredit36PricePerM2(base + 300);
    setCredit48PricePerM2(base + 400);
    setCredit60PricePerM2(base + 500);
  };

  // Helper: reset all credit prices to 0 AZN
  const resetCreditPricesToZero = () => {
    setCredit12PricePerM2(0);
    setCredit24PricePerM2(0);
    setCredit36PricePerM2(0);
    setCredit48PricePerM2(0);
    setCredit60PricePerM2(0);
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    if (!apartmentNumber.trim()) {
      setErrorMessage('Mənzil nömrəsini daxil edin.');
      return;
    }

    const numArea = Number(area);
    if (isNaN(numArea) || numArea <= 0) {
      setErrorMessage('Sahə 0-dan böyük olmalıdır.');
      return;
    }

    const numCash = Number(cashPricePerM2);
    if (isNaN(numCash) || numCash < 0) {
      setErrorMessage('Nəğd 1 m² qiyməti ən az 0 AZN olmalıdır.');
      return;
    }

    const numC12 = Number(credit12PricePerM2);
    const numC24 = Number(credit24PricePerM2);
    const numC36 = Number(credit36PricePerM2);
    const numC48 = Number(credit48PricePerM2);
    const numC60 = Number(credit60PricePerM2);

    if (
      isNaN(numC12) || numC12 < 0 ||
      isNaN(numC24) || numC24 < 0 ||
      isNaN(numC36) || numC36 < 0 ||
      isNaN(numC48) || numC48 < 0 ||
      isNaN(numC60) || numC60 < 0
    ) {
      setErrorMessage('Aylıq kredit qiymətləri ən az 0 AZN olmalıdır.');
      return;
    }

    const newApt: Apartment = {
      id: apartmentToEdit ? apartmentToEdit.id : `apt-${Date.now()}`,
      apartmentNumber: apartmentNumber.trim(),
      block,
      floor: Number(floor),
      rooms: Number(rooms),
      area: numArea,
      view: view.trim() || undefined,
      cashPricePerM2: numCash,
      credit12PricePerM2: numC12,
      credit24PricePerM2: numC24,
      credit36PricePerM2: numC36,
      credit48PricePerM2: numC48,
      credit60PricePerM2: numC60,
      notes: notes.trim(),
    };

    onSave(newApt);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl my-8 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-amber-400" />
            <h2 className="text-lg font-bold">
              {apartmentToEdit ? 'Mənzil Məlumatlarını Redaktə Et' : 'Yeni Mənzil Əlavə Et'}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {errorMessage && (
            <div className="p-3 bg-rose-50 text-rose-700 text-xs font-semibold rounded-lg border border-rose-200">
              {errorMessage}
            </div>
          )}

          {/* Row 1: Mənzil №, Blok, Mərtəbə */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Mənzil № <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="Məs. 101, 204..."
                value={apartmentNumber}
                onChange={(e) => setApartmentNumber(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 font-medium focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Blok <span className="text-rose-500">*</span>
              </label>
              <select
                value={block}
                onChange={(e) => setBlock(e.target.value as BlockType)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 font-medium focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500"
              >
                <option value="A">Blok A</option>
                <option value="B">Blok B</option>
                <option value="C">Blok C</option>
                <option value="C2">Blok C2</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Mərtəbə (2 - 10) <span className="text-rose-500">*</span>
              </label>
              <select
                value={floor}
                onChange={(e) => setFloor(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 font-medium focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500"
              >
                {[2, 3, 4, 5, 6, 7, 8, 9, 10].map((f) => (
                  <option key={f} value={f}>
                    {f}-ci Mərtəbə
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Row 2: Otaq Sayı, Sahə (m²), Görüntü, Nəğd 1 m² */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Otaq Sayı (1 - 4) <span className="text-rose-500">*</span>
              </label>
              <select
                value={rooms}
                onChange={(e) => setRooms(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 font-medium focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500"
              >
                <option value={1}>1 Otaqlı</option>
                <option value={2}>2 Otaqlı</option>
                <option value={3}>3 Otaqlı</option>
                <option value={4}>4 Otaqlı</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Sahə (m²) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                step="0.1"
                min="10"
                max="500"
                required
                value={area}
                onChange={(e) => setArea(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 font-semibold focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Görüntü (Mənzərə)
              </label>
              <select
                value={view}
                onChange={(e) => setView(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 font-medium focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500"
              >
                <option value="Həyət">Həyət</option>
                <option value="Park">Park</option>
                <option value="Ə.Mehbalıyev">Ə.Mehbalıyev</option>
                <option value="">Göstərilməyib</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nəğd 1 m² (₼) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                min="0"
                step="any"
                required
                value={cashPricePerM2}
                onChange={(e) =>
                  setCashPricePerM2(e.target.value === '' ? '' : Number(e.target.value))
                }
                className="w-full px-3 py-2 bg-emerald-50/50 border border-emerald-300 rounded-lg text-sm text-emerald-950 font-bold focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Credit 1 m2 Prices (12, 24, 36, 48, 60 Months) */}
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
                  Kreditlə Alışda 1 m² Qiymətləri (₼)
                </span>
                <span className="text-3xs text-slate-500 font-normal">
                  İstənilən kredit üçün ən az 0 AZN daxil edilə bilər
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={resetCreditPricesToZero}
                  className="inline-flex items-center gap-1 text-xs text-slate-600 hover:text-slate-800 font-medium px-2 py-1 bg-slate-200/80 hover:bg-slate-300 rounded transition"
                  title="Bütün kredit müddətlərinin qiymətini 0 AZN et"
                >
                  <span>Hamısını 0 ₼ et</span>
                </button>
                <button
                  type="button"
                  onClick={autoFillCreditPrices}
                  className="inline-flex items-center gap-1 text-xs text-amber-700 hover:text-amber-800 font-semibold px-2 py-1 bg-amber-100 hover:bg-amber-200/80 rounded transition"
                  title="Nəğd qiyməti əsas götürərək kredit qiymətlərini avtomatik təklif et (+100 ₼ artım)"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Avtomatik (+100₼)</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
              <div>
                <label className="block text-3xs font-semibold text-slate-500 mb-1">
                  12 Ay 1 m² (₼)
                </label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={credit12PricePerM2}
                  onChange={(e) =>
                    setCredit12PricePerM2(e.target.value === '' ? '' : Number(e.target.value))
                  }
                  className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded text-xs font-semibold text-slate-800 text-center focus:outline-hidden focus:ring-2 focus:ring-amber-500/40"
                />
              </div>

              <div>
                <label className="block text-3xs font-semibold text-slate-500 mb-1">
                  24 Ay 1 m² (₼)
                </label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={credit24PricePerM2}
                  onChange={(e) =>
                    setCredit24PricePerM2(e.target.value === '' ? '' : Number(e.target.value))
                  }
                  className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded text-xs font-semibold text-slate-800 text-center focus:outline-hidden focus:ring-2 focus:ring-amber-500/40"
                />
              </div>

              <div>
                <label className="block text-3xs font-semibold text-slate-500 mb-1">
                  36 Ay 1 m² (₼)
                </label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={credit36PricePerM2}
                  onChange={(e) =>
                    setCredit36PricePerM2(e.target.value === '' ? '' : Number(e.target.value))
                  }
                  className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded text-xs font-semibold text-slate-800 text-center focus:outline-hidden focus:ring-2 focus:ring-amber-500/40"
                />
              </div>

              <div>
                <label className="block text-3xs font-semibold text-slate-500 mb-1">
                  48 Ay 1 m² (₼)
                </label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={credit48PricePerM2}
                  onChange={(e) =>
                    setCredit48PricePerM2(e.target.value === '' ? '' : Number(e.target.value))
                  }
                  className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded text-xs font-semibold text-slate-800 text-center focus:outline-hidden focus:ring-2 focus:ring-amber-500/40"
                />
              </div>

              <div>
                <label className="block text-3xs font-semibold text-slate-500 mb-1">
                  60 Ay 1 m² (₼)
                </label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={credit60PricePerM2}
                  onChange={(e) =>
                    setCredit60PricePerM2(e.target.value === '' ? '' : Number(e.target.value))
                  }
                  className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded text-xs font-semibold text-slate-800 text-center focus:outline-hidden focus:ring-2 focus:ring-amber-500/40"
                />
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Əlavə Qeyd (İstəyə bağlı)
            </label>
            <input
              type="text"
              placeholder="Məs. Dəniz mənzərəsi, eyvan, geniş koridor..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500"
            />
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100 transition"
            >
              Ləğv Et
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-5 py-2 rounded-lg text-sm font-semibold text-slate-900 bg-amber-400 hover:bg-amber-300 transition shadow-sm"
            >
              <Save className="w-4 h-4" />
              <span>{apartmentToEdit ? 'Yadda Saxla' : 'Əlavə Et'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

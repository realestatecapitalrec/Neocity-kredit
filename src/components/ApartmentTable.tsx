import { ChangeEvent, MouseEvent, useEffect, useState } from 'react';
import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Calculator,
  Edit2,
  Eye,
  Trash2,
  X,
} from 'lucide-react';
import { Apartment, CreditPeriod } from '../types.ts';
import {
  CREDIT_PERIODS,
  calculateApartmentAllCredits,
  calculateSingleCredit,
  formatCurrency,
} from '../utils/calculator.ts';

interface ApartmentTableProps {
  apartments: Apartment[];
  activePeriod: 'all' | CreditPeriod;
  initialPaymentPercent: number;
  isAuthorizedGoogleProfile: boolean;
  onSelectApartment: (apt: Apartment) => void;
  onEditApartment: (apt: Apartment) => void;
  onDeleteApartment: (id: string) => void;
  onDeleteMultipleApartments: (ids: string[]) => void;
}

type SortField =
  | 'apartmentNumber'
  | 'block'
  | 'floor'
  | 'rooms'
  | 'area'
  | 'view'
  | 'cashPrice'
  | 'monthlyPayment'
  | 'notes';

export default function ApartmentTable({
  apartments,
  activePeriod,
  initialPaymentPercent,
  isAuthorizedGoogleProfile,
  onSelectApartment,
  onEditApartment,
  onDeleteApartment,
  onDeleteMultipleApartments,
}: ApartmentTableProps) {
  const [sortField, setSortField] = useState<SortField>('apartmentNumber');
  const [sortAsc, setSortAsc] = useState<boolean>(true);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [deleteDialog, setDeleteDialog] = useState<{
    title: string;
    description: string;
    confirmButtonText: string;
    isDanger?: boolean;
    action: () => void;
  } | null>(null);

  // Clean up selection if apartments array changes
  useEffect(() => {
    setSelectedIds((prev) => {
      if (prev.size === 0) return prev;
      const currentIds = new Set(apartments.map((a) => a.id));
      const next = new Set<string>();
      prev.forEach((id) => {
        if (currentIds.has(id)) next.add(id);
      });
      return next;
    });
  }, [apartments]);

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  const renderSortIcon = (field: SortField) => {
    if (sortField === field) {
      return sortAsc ? (
        <ArrowUp className="w-3.5 h-3.5 text-amber-600 shrink-0 font-bold" />
      ) : (
        <ArrowDown className="w-3.5 h-3.5 text-amber-600 shrink-0 font-bold" />
      );
    }
    return <ArrowUpDown className="w-3 h-3 text-slate-400 shrink-0 opacity-60 group-hover:opacity-100 transition-opacity" />;
  };

  const sortedApartments = [...apartments].sort((a, b) => {
    switch (sortField) {
      case 'apartmentNumber': {
        const numA = parseFloat(a.apartmentNumber);
        const numB = parseFloat(b.apartmentNumber);
        if (!isNaN(numA) && !isNaN(numB)) {
          return sortAsc ? numA - numB : numB - numA;
        }
        return sortAsc
          ? a.apartmentNumber.localeCompare(b.apartmentNumber, undefined, { numeric: true, sensitivity: 'base' })
          : b.apartmentNumber.localeCompare(a.apartmentNumber, undefined, { numeric: true, sensitivity: 'base' });
      }
      case 'block':
        return sortAsc
          ? a.block.localeCompare(b.block, undefined, { numeric: true, sensitivity: 'base' })
          : b.block.localeCompare(a.block, undefined, { numeric: true, sensitivity: 'base' });
      case 'floor':
        return sortAsc ? a.floor - b.floor : b.floor - a.floor;
      case 'rooms':
        return sortAsc ? a.rooms - b.rooms : b.rooms - a.rooms;
      case 'area':
        return sortAsc ? a.area - b.area : b.area - a.area;
      case 'view': {
        const viewA = a.view || '';
        const viewB = b.view || '';
        return sortAsc
          ? viewA.localeCompare(viewB, 'az', { sensitivity: 'base' })
          : viewB.localeCompare(viewA, 'az', { sensitivity: 'base' });
      }
      case 'cashPrice': {
        const priceA = a.area * a.cashPricePerM2;
        const priceB = b.area * b.cashPricePerM2;
        return sortAsc ? priceA - priceB : priceB - priceA;
      }
      case 'monthlyPayment': {
        const period = activePeriod === 'all' ? 36 : activePeriod;
        const calcA = calculateSingleCredit(
          a.area,
          period === 12
            ? a.credit12PricePerM2
            : period === 24
            ? a.credit24PricePerM2
            : period === 36
            ? a.credit36PricePerM2
            : period === 48
            ? a.credit48PricePerM2
            : a.credit60PricePerM2,
          period,
          initialPaymentPercent
        );
        const calcB = calculateSingleCredit(
          b.area,
          period === 12
            ? b.credit12PricePerM2
            : period === 24
            ? b.credit24PricePerM2
            : period === 36
            ? b.credit36PricePerM2
            : period === 48
            ? b.credit48PricePerM2
            : b.credit60PricePerM2,
          period,
          initialPaymentPercent
        );
        return sortAsc ? calcA.monthlyPayment - calcB.monthlyPayment : calcB.monthlyPayment - calcA.monthlyPayment;
      }
      case 'notes': {
        const noteA = a.notes || '';
        const noteB = b.notes || '';
        return sortAsc
          ? noteA.localeCompare(noteB, 'az', { sensitivity: 'base' })
          : noteB.localeCompare(noteA, 'az', { sensitivity: 'base' });
      }
      default:
        return 0;
    }
  });

  const isAllSelected =
    sortedApartments.length > 0 &&
    sortedApartments.every((apt) => selectedIds.has(apt.id));

  const isIndeterminate =
    !isAllSelected && sortedApartments.some((apt) => selectedIds.has(apt.id));

  const toggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        sortedApartments.forEach((apt) => next.delete(apt.id));
        return next;
      });
    } else {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        sortedApartments.forEach((apt) => next.add(apt.id));
        return next;
      });
    }
  };

  const toggleSelectOne = (id: string, e: MouseEvent | ChangeEvent) => {
    e.stopPropagation();
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleDeleteSelected = () => {
    const count = selectedIds.size;
    if (count === 0) return;

    const isAll = count === apartments.length;
    setDeleteDialog({
      title: isAll ? 'Bütün Siyahının Silinməsi' : 'Seçilmiş Mənzillərin Silinməsi',
      description: isAll
        ? `Bütün siyahını (${count} mənzil) bazadan birdəfəlik silmək istədiyinizə əminsiniz? Bu əməliyyat geri qaytarılmır.`
        : `Seçilmiş ${count} mənzili bazadan silmək istədiyinizə əminsiniz?`,
      confirmButtonText: isAll ? 'Bəli, Hamısını Sil' : 'Bəli, Sil',
      isDanger: true,
      action: () => {
        onDeleteMultipleApartments(Array.from(selectedIds));
        setSelectedIds(new Set());
        setDeleteDialog(null);
      },
    });
  };

  const handleDeleteAll = () => {
    if (apartments.length === 0) return;
    const count = apartments.length;
    setDeleteDialog({
      title: 'Bütün Mənzillərin Birdəfəlik Silinməsi',
      description: `DİQQƏT: Bazada olan bütün ${count} mənzili birdəfəlik silmək istədiyinizə əminsiniz? Baza tam boşaldılacaq. Bu əməliyyat geri qaytarılmır.`,
      confirmButtonText: 'Bəli, Bütün Mənzilləri Sil',
      isDanger: true,
      action: () => {
        onDeleteMultipleApartments(apartments.map((a) => a.id));
        setSelectedIds(new Set());
        setDeleteDialog(null);
      },
    });
  };

  const getBlockBadgeColor = (block: string) => {
    switch (block) {
      case 'A':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'B':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'C':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'C2':
        return 'bg-amber-50 text-amber-800 border-amber-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  const getViewBadgeColor = (view?: string) => {
    switch (view) {
      case 'Həyət':
        return 'bg-sky-50 text-sky-700 border-sky-200';
      case 'Park':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Ə.Mehbalıyev':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden">
      {/* Table Toolbar Header */}
      <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600 font-medium">
        <div className="flex flex-wrap items-center gap-3">
          <div>
            Cəmi: <strong className="text-slate-900">{apartments.length}</strong> mənzil göstərilir
            {activePeriod !== 'all' ? (
              <span className="ml-2 font-semibold text-amber-800 bg-amber-100 px-2 py-0.5 rounded">
                Aktiv Müddət: {activePeriod} Aylıq Kredit
              </span>
            ) : (
              <span className="ml-2 font-semibold text-slate-700 bg-slate-200/70 px-2 py-0.5 rounded">
                Bütün Kredit Müddətləri (12-60 ay)
              </span>
            )}
          </div>

          {/* Bulk Selection Actions - Appears whenever apartments are selected (Authorized profile only) */}
          {isAuthorizedGoogleProfile && selectedIds.size > 0 && (
            <div className="flex items-center gap-2 bg-rose-50 border border-rose-200 px-3 py-1 rounded-lg text-rose-900">
              <span className="font-semibold text-xs text-rose-800">
                {isAllSelected
                  ? `Bütün siyahı seçildi (${selectedIds.size} mənzil)`
                  : `${selectedIds.size} mənzil seçildi`}
              </span>

              <button
                id="btn-bulk-delete-selected"
                type="button"
                onClick={handleDeleteSelected}
                className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 active:bg-rose-800 rounded-md shadow-xs transition cursor-pointer"
                title="Seçilmiş mənzilləri bazadan sil"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>
                  {isAllSelected
                    ? `Bütün siyahını sil (${selectedIds.size} mənzil)`
                    : `Seçilənləri sil (${selectedIds.size})`}
                </span>
              </button>

              <button
                id="btn-deselect-all-toolbar"
                type="button"
                onClick={() => setSelectedIds(new Set())}
                className="text-xs text-rose-700 hover:text-rose-900 underline font-medium cursor-pointer ml-1"
              >
                Ləğv et
              </button>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2.5">
          {/* Səlahiyyətli Google profili üçün əməliyyat düymələri */}
          {isAuthorizedGoogleProfile ? (
            <>
              {apartments.length > 0 && selectedIds.size === 0 && (
                <>
                  <button
                    id="btn-select-all-toolbar"
                    type="button"
                    onClick={toggleSelectAll}
                    className="text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-200/80 px-2.5 py-1 rounded-md border border-slate-300 transition cursor-pointer"
                  >
                    Hamısını seç
                  </button>
                  <button
                    id="btn-delete-all-apartments"
                    type="button"
                    onClick={handleDeleteAll}
                    className="inline-flex items-center gap-1 text-xs font-bold text-rose-700 hover:text-white hover:bg-rose-600 px-2.5 py-1 rounded-md border border-rose-300 transition cursor-pointer"
                    title="Bütün mənzilləri bazadan birdəfəlik sil"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Bütün Mənzilləri Sil</span>
                  </button>
                </>
              )}
            </>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-50 border border-amber-200 text-amber-800 text-2xs sm:text-xs font-semibold">
              <Eye className="w-3.5 h-3.5 text-amber-600" />
              Qonaq Rejimi (Yalnız baxış)
            </span>
          )}

          <div className="text-slate-500 hidden sm:block">
            İlkin ödəniş hesablama bazası: <strong className="text-amber-700 font-semibold">{initialPaymentPercent}%</strong>
          </div>
        </div>
      </div>

      {apartments.length === 0 ? (
        <div className="p-12 text-center text-slate-500 space-y-3">
          <p className="text-base font-semibold text-slate-700 mb-1">
            Bazada mənzil yoxdur və ya filterlərə uyğun mənzil tapılmadı
          </p>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            {isAuthorizedGoogleProfile
              ? 'Yuxarıdakı filterləri dəyişin və ya «Excel-dən Yüklə» / «Yeni Mənzil» vasitəsilə mənzil əlavə edin.'
              : 'Hazırda bazada mənzil yoxdur.'}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="bg-slate-100/80 text-slate-700 font-semibold text-xs border-b border-slate-200">
                {/* Master Checkbox Header - ONLY for authorized profile */}
                {isAuthorizedGoogleProfile && (
                  <th className="py-3 px-3 w-10 text-center">
                    <input
                      id="checkbox-select-all"
                      type="checkbox"
                      aria-label="Hamısını seç"
                      title={isAllSelected ? 'Bütün seçimləri ləğv et' : 'Bütün siyahını seç'}
                      checked={isAllSelected}
                      ref={(el) => {
                        if (el) el.indeterminate = isIndeterminate;
                      }}
                      onChange={toggleSelectAll}
                      className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 border-slate-300 cursor-pointer accent-amber-600"
                    />
                  </th>
                )}
                <th
                  onClick={() => toggleSort('apartmentNumber')}
                  className="py-3 px-3 cursor-pointer hover:bg-slate-200/60 transition group select-none"
                  title="Mənzil nömrəsinə görə sırala"
                >
                  <div className="flex items-center gap-1">
                    <span className={sortField === 'apartmentNumber' ? 'font-bold text-amber-900' : ''}>Mənzil</span>
                    {renderSortIcon('apartmentNumber')}
                  </div>
                </th>
                <th
                  onClick={() => toggleSort('block')}
                  className="py-3 px-3 cursor-pointer hover:bg-slate-200/60 transition group select-none"
                  title="Bloka görə sırala"
                >
                  <div className="flex items-center gap-1">
                    <span className={sortField === 'block' ? 'font-bold text-amber-900' : ''}>Blok</span>
                    {renderSortIcon('block')}
                  </div>
                </th>
                <th
                  onClick={() => toggleSort('floor')}
                  className="py-3 px-3 cursor-pointer hover:bg-slate-200/60 transition group select-none"
                  title="Mərtəbəyə görə sırala"
                >
                  <div className="flex items-center gap-1">
                    <span className={sortField === 'floor' ? 'font-bold text-amber-900' : ''}>Mərtəbə</span>
                    {renderSortIcon('floor')}
                  </div>
                </th>
                <th
                  onClick={() => toggleSort('rooms')}
                  className="py-3 px-3 cursor-pointer hover:bg-slate-200/60 transition group select-none"
                  title="Otaq sayına görə sırala"
                >
                  <div className="flex items-center gap-1">
                    <span className={sortField === 'rooms' ? 'font-bold text-amber-900' : ''}>Otaq</span>
                    {renderSortIcon('rooms')}
                  </div>
                </th>
                <th
                  onClick={() => toggleSort('area')}
                  className="py-3 px-3 cursor-pointer hover:bg-slate-200/60 transition group select-none"
                  title="Sahəyə görə sırala"
                >
                  <div className="flex items-center gap-1">
                    <span className={sortField === 'area' ? 'font-bold text-amber-900' : ''}>Sahə</span>
                    {renderSortIcon('area')}
                  </div>
                </th>
                <th
                  onClick={() => toggleSort('view')}
                  className="py-3 px-3 cursor-pointer hover:bg-slate-200/60 transition group select-none"
                  title="Görüntüyə görə sırala"
                >
                  <div className="flex items-center gap-1">
                    <span className={sortField === 'view' ? 'font-bold text-amber-900' : ''}>Görüntü</span>
                    {renderSortIcon('view')}
                  </div>
                </th>

                {/* Cash Price Column */}
                <th
                  onClick={() => toggleSort('cashPrice')}
                  className="py-3 px-3 cursor-pointer hover:bg-slate-200/60 transition bg-emerald-50/50 group select-none"
                  title="Nəğd qiymətə görə sırala"
                >
                  <div className="flex items-center gap-1 text-emerald-900">
                    <span className={sortField === 'cashPrice' ? 'font-bold' : ''}>Nəğd Alış (1 m² / Toplam)</span>
                    {renderSortIcon('cashPrice')}
                  </div>
                </th>

                {/* If specific period is selected: show exact required columns */}
                {activePeriod !== 'all' ? (
                  <>
                    <th className="py-3 px-3 bg-amber-50/60 text-amber-950 font-semibold border-l border-amber-200">
                      {activePeriod} Ay 1 m² Qiyməti
                    </th>
                    <th className="py-3 px-3 bg-amber-50/60 text-amber-950 font-semibold">
                      Toplam Kredit Məbləği
                    </th>
                    <th className="py-3 px-3 bg-amber-50/60 text-amber-950 font-semibold">
                      İlkin Ödəniş ({initialPaymentPercent}%)
                    </th>
                    <th className="py-3 px-3 bg-amber-50/60 text-amber-950 font-semibold">
                      Qalıq Məbləğ
                    </th>
                    <th
                      onClick={() => toggleSort('monthlyPayment')}
                      className="py-3 px-3 bg-amber-100/70 text-amber-950 font-bold cursor-pointer hover:bg-amber-200/60 transition group select-none"
                      title="Aylıq ödənişə görə sırala"
                    >
                      <div className="flex items-center gap-1">
                        <span>Aylıq Ödəniş</span>
                        {renderSortIcon('monthlyPayment')}
                      </div>
                    </th>
                  </>
                ) : (
                  /* If ALL periods: overview with instant calculation columns */
                  <>
                    <th className="py-3 px-3 bg-blue-50/60 text-blue-950">
                      12 Ay (Aylıq)
                    </th>
                    <th className="py-3 px-3 bg-blue-50/60 text-blue-950">
                      24 Ay (Aylıq)
                    </th>
                    <th className="py-3 px-3 bg-blue-50/60 text-blue-950">
                      36 Ay (Aylıq)
                    </th>
                    <th className="py-3 px-3 bg-blue-50/60 text-blue-950">
                      48 Ay (Aylıq)
                    </th>
                    <th className="py-3 px-3 bg-blue-50/60 text-blue-950">
                      60 Ay (Aylıq)
                    </th>
                  </>
                )}

                {/* Status sütunu */}
                <th
                  onClick={() => toggleSort('notes')}
                  className="py-3 px-1.5 cursor-pointer hover:bg-slate-200/60 transition w-20 max-w-[80px] group select-none"
                  title="Statusa görə sırala"
                >
                  <div className="flex items-center gap-1">
                    <span className={`truncate ${sortField === 'notes' ? 'font-bold text-amber-900' : ''}`}>Status</span>
                    {renderSortIcon('notes')}
                  </div>
                </th>

                <th className="py-3 px-3 text-right">Əməliyyatlar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-slate-700">
              {sortedApartments.map((apt) => {
                const calculations = calculateApartmentAllCredits(apt, initialPaymentPercent);
                const cashTotal = calculations.cashTotalPrice;

                // If single period selected:
                const singleCalc =
                  activePeriod !== 'all' ? calculations.credits[activePeriod] : null;

                const isSelected = selectedIds.has(apt.id);

                return (
                  <tr
                    key={apt.id}
                    className={`transition-colors group ${
                      isSelected
                        ? 'bg-amber-50/60 hover:bg-amber-100/50'
                        : 'hover:bg-slate-50/90'
                    }`}
                  >
                    {/* Row Checkbox - Only for authorized profile */}
                    {isAuthorizedGoogleProfile && (
                      <td className="py-3 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                        <input
                          id={`checkbox-apartment-${apt.id}`}
                          type="checkbox"
                          aria-label={`Mənzil ${apt.apartmentNumber} seç`}
                          checked={isSelected}
                          onChange={(e) => toggleSelectOne(apt.id, e)}
                          className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 border-slate-300 cursor-pointer accent-amber-600"
                        />
                      </td>
                    )}

                    {/* Mənzil № */}
                    <td className="py-3 px-3 font-semibold text-slate-900 whitespace-nowrap">
                      № {apt.apartmentNumber}
                    </td>

                    {/* Blok */}
                    <td className="py-3 px-3">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-xs font-bold border ${getBlockBadgeColor(
                          apt.block
                        )}`}
                      >
                        Blok {apt.block}
                      </span>
                    </td>

                    {/* Mərtəbə */}
                    <td className="py-3 px-3 font-medium text-slate-800">
                      {apt.floor} / 10
                    </td>

                    {/* Otaq */}
                    <td className="py-3 px-3">
                      <span className="font-semibold text-slate-800">{apt.rooms}</span>{' '}
                      <span className="text-xs text-slate-500">otaq</span>
                    </td>

                    {/* Sahə */}
                    <td className="py-3 px-3 font-semibold text-slate-900">
                      {apt.area} <span className="text-xs font-normal text-slate-500">m²</span>
                    </td>

                    {/* Görüntü */}
                    <td className="py-3 px-3">
                      {apt.view ? (
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-xs font-semibold border ${getViewBadgeColor(
                            apt.view
                          )}`}
                        >
                          {apt.view}
                        </span>
                      ) : (
                        <span className="text-slate-400 text-xs">—</span>
                      )}
                    </td>

                    {/* Nəğd Alış */}
                    <td className="py-3 px-3 bg-emerald-50/30">
                      <div className="font-bold text-emerald-700">
                        {formatCurrency(cashTotal)}
                      </div>
                      <div className="text-xs text-slate-500">
                        {formatCurrency(apt.cashPricePerM2)} / m²
                      </div>
                    </td>

                    {/* Specific period vs All periods columns */}
                    {singleCalc ? (
                      singleCalc.pricePerM2 <= 0 ? (
                        <>
                          <td className="py-3 px-3 bg-slate-50/50 font-medium text-slate-400 border-l border-slate-200">
                            0 ₼
                          </td>
                          <td className="py-3 px-3 bg-slate-50/50 font-medium text-slate-400">
                            0 ₼
                          </td>
                          <td className="py-3 px-3 bg-slate-50/50 text-slate-400">
                            0 ₼
                          </td>
                          <td className="py-3 px-3 bg-slate-50/50 text-slate-400">
                            0 ₼
                          </td>
                          <td className="py-3 px-3 bg-slate-100/60">
                            <div className="font-bold text-slate-400 text-xs sm:text-sm">
                              0 ₼
                            </div>
                            <div className="text-2xs text-slate-400 font-medium">
                              Kredit yoxdur
                            </div>
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="py-3 px-3 bg-amber-50/30 font-medium text-slate-800 border-l border-amber-100">
                            {formatCurrency(singleCalc.pricePerM2)}
                          </td>
                          <td className="py-3 px-3 bg-amber-50/30 font-semibold text-slate-900">
                            {formatCurrency(singleCalc.totalPrice)}
                          </td>
                          <td className="py-3 px-3 bg-amber-50/30 text-amber-900">
                            <div className="font-bold">
                              {formatCurrency(singleCalc.initialPaymentAmount)}
                            </div>
                            <div className="text-2xs text-amber-700">
                              ({singleCalc.initialPaymentPercent}%)
                            </div>
                          </td>
                          <td className="py-3 px-3 bg-amber-50/30 font-medium text-slate-700">
                            {formatCurrency(singleCalc.remainingBalance)}
                          </td>
                          <td className="py-3 px-3 bg-amber-100/50">
                            <div className="font-extrabold text-amber-900 text-sm">
                              {formatCurrency(singleCalc.monthlyPayment)}
                            </div>
                            <div className="text-2xs text-slate-500">
                              {singleCalc.periodMonths} ay boyunca
                            </div>
                          </td>
                        </>
                      )
                    ) : (
                      <>
                        {CREDIT_PERIODS.map((period) => {
                          const pCalc = calculations.credits[period];
                          return (
                            <td key={period} className="py-3 px-3 text-xs">
                              {pCalc.pricePerM2 <= 0 ? (
                                <div className="text-slate-400">
                                  <span className="font-semibold text-slate-400">0 ₼</span>
                                  <div className="text-2xs text-slate-400">Yoxdur</div>
                                </div>
                              ) : (
                                <>
                                  <div className="font-bold text-slate-900">
                                    {formatCurrency(pCalc.monthlyPayment)}
                                  </div>
                                  <div className="text-2xs text-slate-400">
                                    Toplam: {formatCurrency(pCalc.totalPrice)}
                                  </div>
                                </>
                              )}
                            </td>
                          );
                        })}
                      </>
                    )}

                    {/* Status */}
                    <td className="py-3 px-1.5 text-xs w-20 max-w-[80px]">
                      {apt.notes ? (
                        <div
                          className="text-slate-700 font-medium truncate cursor-help"
                          title={apt.notes}
                        >
                          {apt.notes}
                        </div>
                      ) : (
                        <span className="text-slate-300 select-none">—</span>
                      )}
                    </td>

                    {/* Action buttons */}
                    <td className="py-3 px-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          id={`btn-calc-${apt.id}`}
                          type="button"
                          onClick={() => onSelectApartment(apt)}
                          className="p-1.5 text-amber-700 hover:text-amber-900 hover:bg-amber-100/80 rounded-md transition cursor-pointer"
                          title="Müştəri təklif vərəqi və detallı kredit kalkulyatoru"
                        >
                          <Calculator className="w-4 h-4" />
                        </button>
                        {isAuthorizedGoogleProfile && (
                          <>
                            <button
                              id={`btn-edit-${apt.id}`}
                              type="button"
                              onClick={() => onEditApartment(apt)}
                              className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-100/80 rounded-md transition cursor-pointer"
                              title="Məlumatları redaktə et"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              id={`btn-delete-${apt.id}`}
                              type="button"
                              onClick={() => {
                                setDeleteDialog({
                                  title: 'Mənzilin Silinməsi',
                                  description: `Mənzil №${apt.apartmentNumber} (${apt.block} blok, ${apt.floor}-ci mərtəbə, ${apt.area} m²) bazadan silinsin?`,
                                  confirmButtonText: 'Bəli, Sil',
                                  isDanger: true,
                                  action: () => {
                                    onDeleteApartment(apt.id);
                                    setDeleteDialog(null);
                                  },
                                });
                              }}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition cursor-pointer"
                              title="Bazadan sil"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* In-App Deletion Confirmation Dialog (Replaces native window.confirm for iframe safety) */}
      {deleteDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-150 p-6 text-slate-800 space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-bold text-slate-900 leading-tight">
                  {deleteDialog.title}
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 mt-1.5 leading-relaxed">
                  {deleteDialog.description}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setDeleteDialog(null)}
                className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100 hover:text-slate-800 transition cursor-pointer"
              >
                Ləğv Et
              </button>
              <button
                type="button"
                onClick={deleteDialog.action}
                className="px-4 py-2 rounded-lg text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 active:bg-rose-800 transition shadow-xs cursor-pointer inline-flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{deleteDialog.confirmButtonText}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

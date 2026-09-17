import { Filter, Percent, RotateCcw, Search, SlidersHorizontal } from 'lucide-react';
import { CreditPeriod, FilterState } from '../types.ts';

interface FilterBarProps {
  filters: FilterState;
  onFilterChange: <K extends keyof FilterState>(key: K, value: FilterState[K]) => void;
  onResetFilters: () => void;
  availableViews?: string[];
}

const BLOCKS = ['all', 'A', 'B', 'C', 'C2'] as const;
const FLOORS = ['all', '2', '3', '4', '5', '6', '7', '8', '9', '10'] as const;
const ROOMS = ['all', '1', '2', '3', '4'] as const;
const DEFAULT_VIEWS = ['Həyət', 'Park', 'Ə.Mehbalıyev'];
const CREDIT_PERIOD_OPTIONS: Array<{ label: string; value: 'all' | CreditPeriod }> = [
  { label: 'Bütün Müddətlər (12-60 ay)', value: 'all' },
  { label: '12 Ay', value: 12 },
  { label: '24 Ay', value: 24 },
  { label: '36 Ay', value: 36 },
  { label: '48 Ay', value: 48 },
  { label: '60 Ay', value: 60 },
];

export default function FilterBar({
  filters,
  onFilterChange,
  onResetFilters,
  availableViews = DEFAULT_VIEWS,
}: FilterBarProps) {
  const isFiltered =
    filters.block !== 'all' ||
    filters.floor !== 'all' ||
    filters.rooms !== 'all' ||
    (filters.view && filters.view !== 'all') ||
    filters.minArea !== '' ||
    filters.maxArea !== '' ||
    filters.searchQuery !== '' ||
    filters.activePeriod !== 'all';

  return (
    <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-4 sm:p-5 mb-6">
      {/* Top row: Search and Down Payment Control */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            id="filter-search-input"
            type="text"
            value={filters.searchQuery}
            onChange={(e) => onFilterChange('searchQuery', e.target.value)}
            placeholder="Mənzil № və ya qeyd üzrə axtarış..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition"
          />
        </div>

        {/* Global Down Payment Percentage Control */}
        <div className="flex flex-wrap items-center gap-3 bg-amber-50/70 border border-amber-200/80 rounded-lg px-3.5 py-2">
          <div className="flex items-center gap-1.5 text-amber-900 font-medium text-xs sm:text-sm">
            <Percent className="w-4 h-4 text-amber-600" />
            <span>İlkin Ödəniş Faizi:</span>
          </div>

          <div className="flex items-center gap-1">
            <input
              id="filter-initial-percent-input"
              type="number"
              min="0"
              max="99"
              step="1"
              value={filters.initialPaymentPercent}
              onChange={(e) => {
                const val = Math.max(0, Math.min(99, Number(e.target.value) || 0));
                onFilterChange('initialPaymentPercent', val);
              }}
              className="w-16 px-2 py-1 bg-white border border-amber-300 rounded text-center font-bold text-amber-900 text-sm focus:outline-hidden focus:ring-1 focus:ring-amber-500"
            />
            <span className="font-semibold text-amber-800 text-sm">%</span>
          </div>

          {/* Quick preset buttons */}
          <div className="flex items-center gap-1 ml-1">
            {[20, 30, 40, 50].map((preset) => (
              <button
                key={preset}
                id={`btn-preset-${preset}`}
                type="button"
                onClick={() => onFilterChange('initialPaymentPercent', preset)}
                className={`px-2 py-0.5 rounded text-xs font-semibold transition ${
                  filters.initialPaymentPercent === preset
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'bg-white text-amber-800 hover:bg-amber-100 border border-amber-200'
                }`}
              >
                {preset}%
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Primary Filters: Blok, Mərtəbə, Otaq, Görüntü, Sahə, Kredit Müddəti */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5 pt-4">
        {/* Blok Filter */}
        <div>
          <label htmlFor="filter-block-select" className="block text-xs font-semibold text-slate-600 mb-1.5 flex items-center gap-1">
            <Filter className="w-3 h-3 text-slate-400" />
            <span>Blok</span>
          </label>
          <select
            id="filter-block-select"
            value={filters.block}
            onChange={(e) => onFilterChange('block', e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition"
          >
            <option value="all">Bütün Bloklar</option>
            {BLOCKS.filter((b) => b !== 'all').map((b) => (
              <option key={b} value={b}>
                Blok {b}
              </option>
            ))}
          </select>
        </div>

        {/* Mərtəbə Filter */}
        <div>
          <label htmlFor="filter-floor-select" className="block text-xs font-semibold text-slate-600 mb-1.5">
            Mərtəbə (2 - 10)
          </label>
          <select
            id="filter-floor-select"
            value={filters.floor}
            onChange={(e) => onFilterChange('floor', e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition"
          >
            <option value="all">Bütün Mərtəbələr</option>
            {FLOORS.filter((f) => f !== 'all').map((f) => (
              <option key={f} value={f}>
                {f}-ci Mərtəbə
              </option>
            ))}
          </select>
        </div>

        {/* Otaq Sayı Filter */}
        <div>
          <label htmlFor="filter-rooms-select" className="block text-xs font-semibold text-slate-600 mb-1.5">
            Otaq Sayı (1 - 4)
          </label>
          <select
            id="filter-rooms-select"
            value={filters.rooms}
            onChange={(e) => onFilterChange('rooms', e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition"
          >
            <option value="all">Bütün Otaqlar</option>
            {ROOMS.filter((r) => r !== 'all').map((r) => (
              <option key={r} value={r}>
                {r} Otaqlı
              </option>
            ))}
          </select>
        </div>

        {/* Görüntü Filter */}
        <div>
          <label htmlFor="filter-view-select" className="block text-xs font-semibold text-slate-600 mb-1.5">
            Görüntü (Mənzərə)
          </label>
          <select
            id="filter-view-select"
            value={filters.view || 'all'}
            onChange={(e) => onFilterChange('view', e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition"
          >
            <option value="all">Bütün Görüntülər {availableViews.length > 0 ? `(${availableViews.length})` : ''}</option>
            {availableViews.map((v) => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </select>
        </div>

        {/* Sahə Aralığı (m²) */}
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1.5">
            Sahə Aralığı (m²)
          </label>
          <div className="flex items-center gap-1.5">
            <input
              id="filter-min-area"
              type="number"
              placeholder="Min"
              value={filters.minArea}
              onChange={(e) => onFilterChange('minArea', e.target.value)}
              className="w-1/2 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-2 text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500"
            />
            <span className="text-slate-400 text-xs">-</span>
            <input
              id="filter-max-area"
              type="number"
              placeholder="Maks"
              value={filters.maxArea}
              onChange={(e) => onFilterChange('maxArea', e.target.value)}
              className="w-1/2 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-2 text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500"
            />
          </div>
        </div>

        {/* Cədvəl Baxışı: Kredit Müddəti */}
        <div>
          <label htmlFor="filter-period-select" className="block text-xs font-semibold text-slate-600 mb-1.5 flex items-center gap-1">
            <SlidersHorizontal className="w-3 h-3 text-slate-400" />
            <span>Kredit Dövrü</span>
          </label>
          <select
            id="filter-period-select"
            value={filters.activePeriod}
            onChange={(e) =>
              onFilterChange(
                'activePeriod',
                e.target.value === 'all' ? 'all' : (Number(e.target.value) as CreditPeriod)
              )
            }
            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition font-medium"
          >
            {CREDIT_PERIOD_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Active Filter Indicators & Reset Button */}
      {isFiltered && (
        <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
          <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-600">
            <span className="font-medium text-slate-500">Aktiv filterlər:</span>
            {filters.block !== 'all' && (
              <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md font-medium">
                Blok: {filters.block}
              </span>
            )}
            {filters.floor !== 'all' && (
              <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md font-medium">
                Mərtəbə: {filters.floor}
              </span>
            )}
            {filters.rooms !== 'all' && (
              <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md font-medium">
                Otaq: {filters.rooms}
              </span>
            )}
            {filters.view && filters.view !== 'all' && (
              <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md font-medium">
                Görüntü: {filters.view}
              </span>
            )}
            {(filters.minArea || filters.maxArea) && (
              <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md font-medium">
                Sahə: {filters.minArea || '0'} - {filters.maxArea || '∞'} m²
              </span>
            )}
            {filters.activePeriod !== 'all' && (
              <span className="bg-amber-100 text-amber-800 px-2 py-0.5 rounded-md font-medium">
                Kredit: {filters.activePeriod} Ay
              </span>
            )}
            {filters.searchQuery && (
              <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md font-medium">
                Axtarış: "{filters.searchQuery}"
              </span>
            )}
          </div>

          <button
            id="btn-reset-filters"
            type="button"
            onClick={onResetFilters}
            className="inline-flex items-center gap-1 text-xs text-rose-600 hover:text-rose-700 font-medium px-2 py-1 rounded hover:bg-rose-50 transition shrink-0"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Filterləri Təmizlə</span>
          </button>
        </div>
      )}
    </div>
  );
}

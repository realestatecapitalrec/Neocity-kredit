import { useEffect, useMemo, useState } from 'react';
import { CheckCircle2 } from 'lucide-react';
import ApartmentModal from './components/ApartmentModal.tsx';
import ApartmentTable from './components/ApartmentTable.tsx';
import CreditDetailModal from './components/CreditDetailModal.tsx';
import ExcelImportModal from './components/ExcelImportModal.tsx';
import FilterBar from './components/FilterBar.tsx';
import GoogleAuthGateModal from './components/GoogleAuthGateModal.tsx';
import Header from './components/Header.tsx';
import { Apartment, FilterState } from './types.ts';
import { downloadExcelTemplate, exportApartmentsToExcel } from './utils/excel.ts';

const STORAGE_KEY = 'bina_kredit_apartments_v2';
const STORAGE_META_KEY = 'bina_kredit_apartments_meta_v2';
const INITIAL_PERCENT_KEY = 'bina_kredit_initial_percent_v1';
const GOOGLE_USER_EMAIL_KEY = 'bina_kredit_google_email_v1';
export const AUTHORIZED_GOOGLE_EMAIL = 'realestatecapital.rec@gmail.com';

interface LocalDatasetMeta {
  version: number;
  updatedAt: number;
  count: number;
}

const getLocalMeta = (): LocalDatasetMeta => {
  try {
    const raw = localStorage.getItem(STORAGE_META_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed.updatedAt === 'number') {
        return parsed;
      }
    }
  } catch {
    // ignore
  }
  return {
    version: 2,
    updatedAt: 0,
    count: 0,
  };
};

const saveLocalMeta = (meta: Partial<LocalDatasetMeta>) => {
  try {
    const current = getLocalMeta();
    const updated = { ...current, ...meta };
    localStorage.setItem(STORAGE_META_KEY, JSON.stringify(updated));
  } catch {
    // ignore
  }
};

export default function App() {
  // User profile state: require admin password verification per session
  const [currentUserEmail, setCurrentUserEmail] = useState<string>(() => {
    try {
      if (sessionStorage.getItem('neo_city_auth_role') === 'admin') {
        return AUTHORIZED_GOOGLE_EMAIL;
      }
      return '';
    } catch {
      return '';
    }
  });

  // Auth gate modal: always presents Google login / password or Guest mode on new session
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(() => {
    try {
      return sessionStorage.getItem('neo_city_auth_selected_v2') !== 'true';
    } catch {
      return true;
    }
  });

  const isAuthorizedGoogleProfile =
    currentUserEmail.toLowerCase().trim() === AUTHORIZED_GOOGLE_EMAIL.toLowerCase().trim();

  const handleSwitchUserEmail = (newEmail: string) => {
    setCurrentUserEmail(newEmail);
    try {
      if (newEmail.toLowerCase().trim() === AUTHORIZED_GOOGLE_EMAIL.toLowerCase().trim()) {
        sessionStorage.setItem('neo_city_auth_role', 'admin');
      } else {
        sessionStorage.setItem('neo_city_auth_role', 'guest');
      }
      sessionStorage.setItem('neo_city_auth_selected_v2', 'true');
    } catch {
      // ignore
    }
  };

  // Database state initialized from localStorage
  const [apartments, setApartments] = useState<Apartment[]>(() => {
    try {
      // Clean up previous v1 cache if present so users immediately see new dataset
      localStorage.removeItem('bina_kredit_apartments_v1');

      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored !== null) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          // If stored has the legacy 54 demo items with no custom update, clean it up
          const meta = getLocalMeta();
          if (parsed.length === 54 && meta.updatedAt === 0) {
            localStorage.removeItem(STORAGE_KEY);
            return [];
          }
          return parsed;
        }
      }
    } catch {
      // ignore
    }
    return [];
  });

  // Global filters
  const [filters, setFilters] = useState<FilterState>(() => {
    let savedPercent = 20;
    try {
      const storedPct = localStorage.getItem(INITIAL_PERCENT_KEY);
      if (storedPct) {
        const parsed = Number(storedPct);
        if (!isNaN(parsed) && parsed >= 0 && parsed <= 99) {
          savedPercent = parsed;
        }
      }
    } catch {
      // ignore
    }

    return {
      block: 'all',
      floor: 'all',
      rooms: 'all',
      view: 'all',
      minArea: '',
      maxArea: '',
      searchQuery: '',
      activePeriod: 'all',
      initialPaymentPercent: savedPercent,
    };
  });

  // Modal states
  const [isImportModalOpen, setIsImportModalOpen] = useState<boolean>(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [apartmentToEdit, setApartmentToEdit] = useState<Apartment | null>(null);
  const [selectedApartmentForDetail, setSelectedApartmentForDetail] = useState<Apartment | null>(
    null
  );

  // Real-time server connection & sync status
  const [serverStatus, setServerStatus] = useState<'connected' | 'syncing' | 'disconnected'>('connected');

  // Helper to persist apartments to shared server database
  const syncApartmentsToServer = async (
    data: Apartment[],
    updatedAt?: number
  ): Promise<boolean> => {
    setServerStatus('syncing');
    const ts = typeof updatedAt === 'number' && updatedAt > 0 ? updatedAt : Date.now();

    try {
      const res = await fetch('/api/apartments', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apartments: data,
          updatedAt: ts,
        }),
      });
      if (!res.ok) {
        throw new Error(`Server returned status: ${res.status}`);
      }
      setServerStatus('connected');
      saveLocalMeta({ updatedAt: ts, count: data.length });
      return true;
    } catch (err) {
      console.warn('Server sync error:', err);
      setServerStatus('disconnected');
      return false;
    }
  };

  // Real-time Server-Sent Events (SSE) listener & initial fetch
  // Guarantees all visitors (admins & guests) across all browsers see identical live data
  useEffect(() => {
    let isMounted = true;
    let eventSource: EventSource | null = null;

    const fetchServerData = async () => {
      try {
        const res = await fetch('/api/apartments');
        if (!res.ok) {
          if (isMounted) setServerStatus('disconnected');
          return;
        }

        const serverData = await res.json();
        let serverList: Apartment[] = [];
        let serverUpdatedAt = 0;

        if (Array.isArray(serverData)) {
          serverList = serverData;
          serverUpdatedAt = 0;
        } else if (
          serverData &&
          typeof serverData === 'object' &&
          Array.isArray(serverData.apartments)
        ) {
          serverList = serverData.apartments;
          serverUpdatedAt = Number(serverData.updatedAt) || 0;
        }

        if (!isMounted) return;

        // Check local storage
        const localMeta = getLocalMeta();
        let localList: Apartment[] = [];
        try {
          const storedLocalStr = localStorage.getItem(STORAGE_KEY);
          if (storedLocalStr) {
            const parsed = JSON.parse(storedLocalStr);
            if (Array.isArray(parsed)) {
              localList = parsed;
            }
          }
        } catch {
          // ignore
        }

        // Priority 1: If server has data, it is always the Single Source of Truth
        if (serverList.length > 0) {
          setApartments(serverList);
          setServerStatus('connected');
          try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(serverList));
            saveLocalMeta({
              updatedAt: serverUpdatedAt || Date.now(),
              count: serverList.length,
            });
          } catch {
            // ignore
          }
        } else if (serverList.length === 0 && localList.length > 0 && isAuthorizedGoogleProfile) {
          // Priority 2: If server is empty but admin has apartments in local storage (e.g. from Excel),
          // auto-sync admin's data to server immediately so all guests can see it too
          setApartments(localList);
          syncApartmentsToServer(localList, localMeta.updatedAt || Date.now());
        } else {
          setServerStatus('connected');
        }
      } catch (err) {
        console.warn('Initial server fetch error:', err);
        if (isMounted) setServerStatus('disconnected');
      }
    };

    fetchServerData();

    // Establish real-time SSE stream for zero-latency updates
    try {
      eventSource = new EventSource('/api/apartments/stream');

      eventSource.addEventListener('apartments', (event) => {
        if (!isMounted) return;
        try {
          const payload = JSON.parse(event.data);
          if (payload && Array.isArray(payload.apartments)) {
            setApartments(payload.apartments);
            setServerStatus('connected');
            try {
              localStorage.setItem(STORAGE_KEY, JSON.stringify(payload.apartments));
              saveLocalMeta({
                updatedAt: payload.updatedAt || Date.now(),
                count: payload.apartments.length,
              });
            } catch {
              // ignore
            }
          }
        } catch (e) {
          console.error('SSE parse error:', e);
        }
      });

      eventSource.onopen = () => {
        if (isMounted) setServerStatus('connected');
      };

      eventSource.onerror = () => {
        if (isMounted) setServerStatus('disconnected');
      };
    } catch (err) {
      console.warn('EventSource setup failed:', err);
    }

    // Safety fallback: Poll every 10 seconds and on window focus
    const interval = setInterval(fetchServerData, 10000);
    window.addEventListener('focus', fetchServerData);

    return () => {
      isMounted = false;
      if (eventSource) {
        eventSource.close();
      }
      clearInterval(interval);
      window.removeEventListener('focus', fetchServerData);
    };
  }, [isAuthorizedGoogleProfile]);

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(apartments));
    } catch (e) {
      console.error('Local storage save failed:', e);
    }
  }, [apartments]);

  useEffect(() => {
    try {
      localStorage.setItem(INITIAL_PERCENT_KEY, String(filters.initialPaymentPercent));
    } catch {
      // ignore
    }
  }, [filters.initialPaymentPercent]);

  // Filter change handler
  const handleFilterChange = <K extends keyof FilterState>(key: K, value: FilterState[K]) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleResetFilters = () => {
    setFilters((prev) => ({
      ...prev,
      block: 'all',
      floor: 'all',
      rooms: 'all',
      view: 'all',
      minArea: '',
      maxArea: '',
      searchQuery: '',
      activePeriod: 'all',
    }));
  };

  // Filter apartments
  const filteredApartments = useMemo(() => {
    return apartments.filter((apt) => {
      // Block
      if (filters.block !== 'all' && apt.block !== filters.block) {
        return false;
      }
      // Floor
      if (filters.floor !== 'all' && String(apt.floor) !== filters.floor) {
        return false;
      }
      // Rooms
      if (filters.rooms !== 'all' && String(apt.rooms) !== filters.rooms) {
        return false;
      }
      // View (Görüntü: Həyət, Park, Ə.Mehbalıyev)
      if (filters.view && filters.view !== 'all' && apt.view !== filters.view) {
        return false;
      }
      // Min Area
      if (filters.minArea !== '') {
        const min = Number(filters.minArea);
        if (!isNaN(min) && apt.area < min) return false;
      }
      // Max Area
      if (filters.maxArea !== '') {
        const max = Number(filters.maxArea);
        if (!isNaN(max) && apt.area > max) return false;
      }
      // Search
      if (filters.searchQuery.trim() !== '') {
        const q = filters.searchQuery.toLowerCase().trim();
        const matchesNum = apt.apartmentNumber.toLowerCase().includes(q);
        const matchesNotes = apt.notes?.toLowerCase().includes(q) || false;
        const matchesBlock = `blok ${apt.block}`.toLowerCase().includes(q);
        const matchesView = apt.view?.toLowerCase().includes(q) || false;
        if (!matchesNum && !matchesNotes && !matchesBlock && !matchesView) return false;
      }

      return true;
    });
  }, [apartments, filters]);

  // Calculate all unique views dynamically from apartments
  const availableViews = useMemo(() => {
    const set = new Set<string>();
    apartments.forEach((apt) => {
      if (apt.view && apt.view.trim()) {
        set.add(apt.view.trim());
      }
    });
    // Fallback defaults if no custom views exist yet
    if (set.size === 0) {
      ['Həyət', 'Park', 'Ə.Mehbalıyev'].forEach((v) => set.add(v));
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'az'));
  }, [apartments]);

  // Toast feedback state
  const [toastNotice, setToastNotice] = useState<string | null>(null);

  useEffect(() => {
    if (toastNotice) {
      const timer = setTimeout(() => setToastNotice(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toastNotice]);

  // CRUD actions
  const handleSaveApartment = (savedApt: Apartment) => {
    setApartments((prev) => {
      const existingIdx = prev.findIndex((a) => a.id === savedApt.id);
      let updated: Apartment[];
      if (existingIdx >= 0) {
        updated = [...prev];
        updated[existingIdx] = savedApt;
      } else {
        updated = [savedApt, ...prev];
      }
      const now = Date.now();
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch {
        // ignore
      }
      saveLocalMeta({
        updatedAt: now,
        count: updated.length,
      });
      syncApartmentsToServer(updated, now);
      setToastNotice(`Mənzil №${savedApt.apartmentNumber} məlumatları yadda saxlanıldı.`);
      return updated;
    });
  };

  const handleDeleteApartment = (id: string) => {
    setApartments((prev) => {
      const updated = prev.filter((a) => a.id !== id);
      const now = Date.now();
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch {
        // ignore
      }
      saveLocalMeta({
        updatedAt: now,
        count: updated.length,
      });
      syncApartmentsToServer(updated, now);
      setToastNotice('Mənzil bazadan silindi.');
      return updated;
    });
  };

  const handleDeleteMultipleApartments = (ids: string[]) => {
    const idSet = new Set(ids);
    setApartments((prev) => {
      const updated = prev.filter((a) => !idSet.has(a.id));
      const now = Date.now();
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch {
        // ignore
      }
      saveLocalMeta({
        updatedAt: now,
        count: updated.length,
      });
      syncApartmentsToServer(updated, now);
      setToastNotice(
        ids.length >= prev.length
          ? 'Bütün mənzillər bazadan uğurla silindi.'
          : `${ids.length} mənzil silindi.`
      );
      return updated;
    });
  };

  const handleImportComplete = (newApts: Apartment[], replaceExisting: boolean) => {
    const now = Date.now();
    if (replaceExisting) {
      setApartments(newApts);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newApts));
      } catch {
        // ignore
      }
      saveLocalMeta({
        updatedAt: now,
        count: newApts.length,
      });
      syncApartmentsToServer(newApts, now);
      setToastNotice(`${newApts.length} mənzil bazaya əlavə edildi və serverlə sinxronlaşdırıldı!`);
    } else {
      setApartments((prev) => {
        const updated = [...newApts, ...prev];
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        } catch {
          // ignore
        }
        saveLocalMeta({
          updatedAt: now,
          count: updated.length,
        });
        syncApartmentsToServer(updated, now);
        setToastNotice(`${newApts.length} yeni mənzil bazaya əlavə edildi və serverlə sinxronlaşdırıldı!`);
        return updated;
      });
    }
  };

  const handleExportExcel = () => {
    exportApartmentsToExcel(filteredApartments, filters.initialPaymentPercent);
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 flex flex-col font-sans">
      {/* Header */}
      <Header
        isAuthorizedGoogleProfile={isAuthorizedGoogleProfile}
        currentUserEmail={currentUserEmail}
        authorizedEmail={AUTHORIZED_GOOGLE_EMAIL}
        onSwitchEmail={handleSwitchUserEmail}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
        onOpenImportModal={() => setIsImportModalOpen(true)}
        onOpenAddModal={() => {
          setApartmentToEdit(null);
          setIsAddModalOpen(true);
        }}
        onExportExcel={handleExportExcel}
        onDownloadTemplate={downloadExcelTemplate}
        serverStatus={serverStatus}
        apartmentsCount={apartments.length}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Auto-save notification banner */}
        {toastNotice && (
          <div className="mb-4 bg-emerald-600 text-white px-4 py-3 rounded-xl shadow-md flex items-center justify-between text-xs sm:text-sm font-semibold animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-200 shrink-0" />
              <span>{toastNotice}</span>
            </div>
            <button
              type="button"
              onClick={() => setToastNotice(null)}
              className="text-emerald-100 hover:text-white text-xs px-2 py-0.5 rounded transition cursor-pointer"
            >
              ✕
            </button>
          </div>
        )}

        {/* Filters */}
        <FilterBar
          filters={filters}
          availableViews={availableViews}
          onFilterChange={handleFilterChange}
          onResetFilters={handleResetFilters}
        />

        {/* Database Table */}
        <ApartmentTable
          apartments={filteredApartments}
          activePeriod={filters.activePeriod}
          initialPaymentPercent={filters.initialPaymentPercent}
          isAuthorizedGoogleProfile={isAuthorizedGoogleProfile}
          onSelectApartment={(apt) => setSelectedApartmentForDetail(apt)}
          onEditApartment={(apt) => {
            setApartmentToEdit(apt);
            setIsAddModalOpen(true);
          }}
          onDeleteApartment={handleDeleteApartment}
          onDeleteMultipleApartments={handleDeleteMultipleApartments}
        />
      </main>

      {/* Modals */}
      <GoogleAuthGateModal
        isOpen={isAuthModalOpen}
        currentUserEmail={currentUserEmail}
        authorizedEmail={AUTHORIZED_GOOGLE_EMAIL}
        onSelectProfile={(email) => {
          handleSwitchUserEmail(email);
          setIsAuthModalOpen(false);
        }}
        onClose={() => setIsAuthModalOpen(false)}
        canDismiss={true}
      />

      <ApartmentModal
        isOpen={isAddModalOpen}
        apartmentToEdit={apartmentToEdit}
        onClose={() => {
          setIsAddModalOpen(false);
          setApartmentToEdit(null);
        }}
        onSave={handleSaveApartment}
      />

      <ExcelImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImportComplete={handleImportComplete}
      />

      <CreditDetailModal
        apartment={selectedApartmentForDetail}
        defaultInitialPercent={filters.initialPaymentPercent}
        onClose={() => setSelectedApartmentForDetail(null)}
      />

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>Neo City Kredit — Kredit Hesablama və İdarəetmə Bazası © 2026</span>
          <span className="text-slate-400">
            Dəstək: Blok A, B, C, C2 · Mərtəbələr 2-10 · Otaqlar 1-4 · 12, 24, 36, 48, 60 Aylıq Kreditlər
          </span>
        </div>
      </footer>
    </div>
  );
}

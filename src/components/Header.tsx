import { Building2, Download, FileSpreadsheet, Lock, Plus, Upload } from 'lucide-react';
import UserProfileBadge from './UserProfileBadge.tsx';

interface HeaderProps {
  isAuthorizedGoogleProfile: boolean;
  currentUserEmail: string;
  authorizedEmail: string;
  onSwitchEmail: (email: string) => void;
  onOpenImportModal: () => void;
  onOpenAddModal: () => void;
  onExportExcel: () => void;
  onDownloadTemplate: () => void;
  onOpenAuthModal?: () => void;
  serverStatus?: 'connected' | 'syncing' | 'disconnected';
  apartmentsCount?: number;
}

export default function Header({
  isAuthorizedGoogleProfile,
  currentUserEmail,
  authorizedEmail,
  onSwitchEmail,
  onOpenImportModal,
  onOpenAddModal,
  onExportExcel,
  onDownloadTemplate,
  onOpenAuthModal,
}: HeaderProps) {
  return (
    <header className="bg-slate-900 text-white border-b border-slate-800 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-5">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          {/* Title & Branding */}
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0 shadow-xs">
              <Building2 className="w-6 h-6 sm:w-7 sm:h-7" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                  Neo City Kredit
                  <span className="text-2xs font-semibold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    Bazası
                  </span>
                </h1>
              </div>
              <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
                Mərtəbələr (2-10) · Blok A, B, C, C2 · Nəğd & 12-60 Aylıq Kredit Hesablama və İdarəetmə
              </p>
            </div>
          </div>

          {/* Quick Actions & User Profile */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Google Profile Badge */}
            <UserProfileBadge
              currentEmail={currentUserEmail}
              authorizedEmail={authorizedEmail}
              onSwitchEmail={onSwitchEmail}
              onOpenAuthModal={onOpenAuthModal}
            />

            {/* Şablon Endir (.xlsx) ONLY for authorized Google Profile */}
            {isAuthorizedGoogleProfile && (
              <button
                id="btn-download-template"
                type="button"
                onClick={onDownloadTemplate}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 hover:text-white rounded-lg border border-slate-700 transition cursor-pointer"
                title="Excel formatında nümunə şablonu yükləyin"
              >
                <Download className="w-3.5 h-3.5 text-slate-400" />
                <span>Şablon Endir (.xlsx)</span>
              </button>
            )}

            {/* Excel-dən Yüklə ONLY visible for the authorized Google profile */}
            {isAuthorizedGoogleProfile && (
              <button
                id="btn-import-excel"
                type="button"
                onClick={onOpenImportModal}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-emerald-300 bg-emerald-950/70 hover:bg-emerald-900 rounded-lg border border-emerald-700/80 shadow-xs transition cursor-pointer"
                title={`Excel faylından mənzil bazasını yeniləyin (${currentUserEmail})`}
              >
                <Upload className="w-3.5 h-3.5 text-emerald-400" />
                <span>Excel-dən Yüklə</span>
              </button>
            )}

            <button
              id="btn-export-excel"
              type="button"
              onClick={onExportExcel}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-cyan-300 bg-cyan-950/60 hover:bg-cyan-900/60 rounded-lg border border-cyan-800/80 transition cursor-pointer"
              title="Cari cədvəl və kredit hesablamalarını Excel formatında ixrac edin"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-cyan-400" />
              <span>Excel İxrac</span>
            </button>

            {/* Yeni Mənzil ONLY for authorized Google Profile (Guests cannot add) */}
            {isAuthorizedGoogleProfile ? (
              <button
                id="btn-add-apartment"
                type="button"
                onClick={onOpenAddModal}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-900 bg-amber-400 hover:bg-amber-300 rounded-lg shadow-xs transition cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Yeni Mənzil</span>
              </button>
            ) : (
              <div
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-400 bg-slate-800/60 rounded-lg border border-slate-700/60"
                title="Qonaq rejimində redaktə və mənzil əlavə etmək məhduddur. Yalnız səlahiyyətli Google hesabı ilə daxil olduqda mümkündür."
              >
                <Lock className="w-3.5 h-3.5 text-slate-400" />
                <span>Qonaq Rejimi (Baxış)</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

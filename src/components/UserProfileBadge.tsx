import { useEffect, useRef, useState } from 'react';
import { Check, ChevronDown, Lock, ShieldCheck, User, UserX } from 'lucide-react';

interface UserProfileBadgeProps {
  currentEmail: string;
  authorizedEmail: string;
  onSwitchEmail: (email: string) => void;
  onOpenAuthModal?: () => void;
}

export default function UserProfileBadge({
  currentEmail,
  authorizedEmail,
  onSwitchEmail,
  onOpenAuthModal,
}: UserProfileBadgeProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const isAuthorized = currentEmail.toLowerCase() === authorizedEmail.toLowerCase();

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        id="btn-user-profile-menu"
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-medium transition cursor-pointer ${
          isAuthorized
            ? 'bg-slate-800/90 hover:bg-slate-800 text-slate-200 border-slate-700 hover:border-slate-600'
            : 'bg-amber-950/40 hover:bg-amber-950/60 text-amber-200 border-amber-700/60'
        }`}
        title="Google Profil İdarəetməsi"
      >
        {/* Google 'G' Icon */}
        <div className="w-5 h-5 rounded-full bg-white flex items-center justify-center p-0.5 shrink-0 shadow-xs">
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
        </div>

        <div className="flex flex-col text-left">
          <span className="text-2xs text-slate-400 font-normal leading-tight">
            {isAuthorized ? 'Google İnzibatçı' : 'İstifadəçi'}
          </span>
          <span className="text-xs font-semibold text-white truncate max-w-[140px] sm:max-w-[180px]">
            {isAuthorized ? currentEmail : 'Qonaq'}
          </span>
        </div>

        {isAuthorized ? (
          <span
            className="w-2 h-2 rounded-full bg-emerald-400 shrink-0"
            title="Səlahiyyətli Google Profil"
          />
        ) : (
          <span
            className="w-2 h-2 rounded-full bg-amber-400 shrink-0"
            title="Qonaq Rejimi (Excel yükləmə gizlidir)"
          />
        )}

        <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl z-50 p-4 text-slate-200">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-800">
            <div className="w-9 h-9 rounded-full bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
              <User className="w-5 h-5" />
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-bold text-white truncate">
                {isAuthorized ? currentEmail : 'Qonaq Rejimi'}
              </p>
              <div className="flex items-center gap-1.5 mt-0.5">
                {isAuthorized ? (
                  <span className="inline-flex items-center gap-1 text-2xs text-emerald-400 font-medium">
                    <ShieldCheck className="w-3 h-3" />
                    <span>Tam İdarəetmə & İdxal Səlahiyyəti</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-2xs text-amber-400 font-medium">
                    <Lock className="w-3 h-3" />
                    <span>Qonaq Rejimi (Yalnız Baxış)</span>
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="py-2.5 text-xs text-slate-400 leading-relaxed border-b border-slate-800">
            <p>
              {isAuthorized
                ? 'İnzibatçı hesabı aktivdir. Bütün redaktə, silmə, əlavə və Excel funksiyaları aktivdir.'
                : 'Mənzilləri əlavə etmək, redaktə etmək və ya silmək üçün səlahiyyətli Google hesabı ilə daxil olun.'}
            </p>
          </div>

          <div className="pt-2 flex flex-col gap-1.5">
            <span className="text-2xs uppercase tracking-wider text-slate-500 font-semibold mb-0.5">
              Profil Əməliyyatları
            </span>

            {/* Open Google Auth Modal to enter Google account */}
            {!isAuthorized && onOpenAuthModal && (
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  onOpenAuthModal();
                }}
                className="flex items-center justify-between px-3 py-2 rounded-lg text-xs bg-emerald-950/60 border border-emerald-700/70 text-emerald-300 hover:bg-emerald-900/60 transition cursor-pointer font-semibold"
              >
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-white flex items-center justify-center p-0.5 shrink-0">
                    <svg className="w-3 h-3" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                      />
                    </svg>
                  </div>
                  <span>İnzibatçı Girişi (Google + Şifrə)</span>
                </div>
              </button>
            )}

            {/* Switch to Guest Profile / Log out */}
            {isAuthorized ? (
              <button
                type="button"
                onClick={() => {
                  onSwitchEmail('');
                  setIsOpen(false);
                }}
                className="flex items-center justify-between px-3 py-2 rounded-lg text-xs bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white transition cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <UserX className="w-4 h-4 text-amber-400" />
                  <span>Çıxış et (Qonaq rejiminə keç)</span>
                </div>
              </button>
            ) : (
              <div className="flex items-center justify-between px-3 py-2 rounded-lg text-xs bg-amber-950/60 border border-amber-700/70 text-amber-300 font-semibold">
                <div className="flex items-center gap-2">
                  <UserX className="w-4 h-4 text-amber-400" />
                  <span>Qonaq Rejimi Aktivdir</span>
                </div>
                <Check className="w-3.5 h-3.5 text-amber-400" />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

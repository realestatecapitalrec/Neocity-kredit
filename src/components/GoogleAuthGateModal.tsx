import React, { useState } from 'react';
import {
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  ShieldAlert,
} from 'lucide-react';

interface GoogleAuthGateModalProps {
  isOpen: boolean;
  currentUserEmail: string;
  authorizedEmail: string;
  onSelectProfile: (email: string) => void;
  onClose?: () => void;
  canDismiss?: boolean;
}

export const ADMIN_PASSWORD = 'Baku2016';

export default function GoogleAuthGateModal({
  isOpen,
  currentUserEmail,
  authorizedEmail,
  onSelectProfile,
  onClose,
  canDismiss = false,
}: GoogleAuthGateModalProps) {
  const [googleEmailInput, setGoogleEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [inputError, setInputError] = useState<string | null>(null);
  const [statusNotice, setStatusNotice] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleGoogleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setInputError(null);
    setStatusNotice(null);

    const email = googleEmailInput.trim().toLowerCase();
    const cleanAuthEmail = authorizedEmail.trim().toLowerCase();

    if (!email) {
      setInputError('Zəhmət olmasa Google e-poçt ünvanınızı daxil edin');
      return;
    }

    // Strict validation: Only realestatecapital.rec@gmail.com is allowed.
    // Other Gmail accounts cannot log in.
    if (email !== cleanAuthEmail) {
      setInputError(
        'Giriş qadağandır! Başqa Gmail hesabları ilə daxil olmaq mümkün deyil. Sistemə yalnız səlahiyyətli admin daxil ola bilər və ya aşağıdakı "Qonaq kimi davam et" seçimindən istifadə edə bilərsiniz.'
      );
      return;
    }

    // Password validation for realestatecapital.rec@gmail.com
    if (!passwordInput) {
      setInputError('Zəhmət olmasa şifrəni daxil edin');
      return;
    }

    if (passwordInput !== ADMIN_PASSWORD) {
      setInputError('Şifrə yalnışdır! Daxil etdiyiniz şifrə uyğun deyil.');
      return;
    }

    // Both email and password match
    setIsSubmitting(true);
    setStatusNotice({
      type: 'success',
      message: 'Şifrə təsdiqləndi. İnzibatçı səlahiyyətləri aktiv edilir...',
    });

    setTimeout(() => {
      setIsSubmitting(false);
      onSelectProfile(authorizedEmail);
      if (onClose) onClose();
    }, 600);
  };

  const handleGuestLogin = () => {
    onSelectProfile('');
    if (onClose) onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 bg-slate-950/85 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden text-slate-800 animate-in zoom-in-95 duration-200 flex flex-col">
        {/* Header with Google G Logo */}
        <div className="bg-slate-900 text-white p-6 pb-5 text-center relative border-b border-slate-800">
          <div className="mx-auto w-14 h-14 rounded-2xl bg-white shadow-md flex items-center justify-center p-3 mb-3">
            {/* Google G Logo */}
            <svg className="w-8 h-8" viewBox="0 0 24 24">
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

          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
            Neo City Kredit Bazası
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-1">
            Google hesabınız və şifrənizlə daxil olun və ya qonaq kimi davam edin
          </p>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5">
          {/* SECTION 1: GOOGLE ACCOUNT & PASSWORD FORM */}
          <form
            onSubmit={handleGoogleSubmit}
            className="p-4 sm:p-5 rounded-xl border-2 border-slate-200 bg-slate-50/80 hover:border-slate-300 transition space-y-3.5"
          >
            <div className="flex items-center gap-2 mb-1">
              <div className="w-6 h-6 rounded-md bg-white shadow-xs border border-slate-200 flex items-center justify-center p-1 shrink-0">
                <svg className="w-4 h-4" viewBox="0 0 24 24">
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
              <span className="text-xs sm:text-sm font-bold text-slate-900">
                Google İnzibatçı Girişi
              </span>
            </div>

            {/* Email field */}
            <div>
              <label
                htmlFor="input-google-email"
                className="block text-2xs font-semibold uppercase tracking-wider text-slate-600 mb-1"
              >
                Google E-poçt Ünvanı
              </label>
              <input
                id="input-google-email"
                type="email"
                autoComplete="email"
                autoFocus
                disabled={isSubmitting}
                value={googleEmailInput}
                onChange={(e) => {
                  setGoogleEmailInput(e.target.value);
                  if (inputError) setInputError(null);
                }}
                placeholder="ornek@gmail.com"
                className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:border-blue-500 focus:ring-blue-200 transition"
              />
            </div>

            {/* Password field */}
            <div>
              <label
                htmlFor="input-google-password"
                className="block text-2xs font-semibold uppercase tracking-wider text-slate-600 mb-1"
              >
                Şifrə
              </label>
              <div className="relative">
                <input
                  id="input-google-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  disabled={isSubmitting}
                  value={passwordInput}
                  onChange={(e) => {
                    setPasswordInput(e.target.value);
                    if (inputError) setInputError(null);
                  }}
                  placeholder="Şifrəni daxil edin"
                  className="w-full pl-3.5 pr-10 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:border-blue-500 focus:ring-blue-200 transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                  title={showPassword ? 'Şifrəni gizlə' : 'Şifrəni göstər'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Error message */}
            {inputError && (
              <div className="p-2.5 rounded-lg bg-red-50 border border-red-200 text-2xs text-red-700 flex items-start gap-2 animate-in fade-in">
                <ShieldAlert className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <span className="leading-tight">{inputError}</span>
              </div>
            )}

            {/* Success message */}
            {statusNotice && statusNotice.type === 'success' && (
              <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-2xs text-emerald-800 flex items-center gap-2 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{statusNotice.message}</span>
              </div>
            )}

            {/* Google Login Submit Button */}
            <button
              id="btn-login-google"
              type="submit"
              disabled={isSubmitting}
              className="w-full flex items-center justify-center gap-2.5 py-2.5 px-4 rounded-lg bg-slate-900 hover:bg-slate-800 active:bg-slate-950 text-white text-xs sm:text-sm font-semibold transition cursor-pointer shadow-sm hover:shadow disabled:opacity-60"
            >
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
              <span>{isSubmitting ? 'Yoxlanılır...' : 'Google ilə daxil ol'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>

          {/* DIVIDER */}
          <div className="relative flex items-center justify-center">
            <div className="border-t border-slate-200 w-full" />
            <span className="bg-white px-3 text-3xs font-bold uppercase tracking-wider text-slate-400 absolute">
              Və ya
            </span>
          </div>

          {/* SECTION 2: GUEST LOGIN BUTTON */}
          <button
            id="btn-continue-as-guest"
            type="button"
            onClick={handleGuestLogin}
            disabled={isSubmitting}
            className="w-full flex items-center justify-between p-3.5 rounded-xl border border-slate-300 hover:border-slate-400 bg-white hover:bg-slate-50 text-left transition cursor-pointer group shadow-2xs"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center shrink-0 group-hover:bg-slate-200 transition">
                <Eye className="w-5 h-5" />
              </div>
              <span className="text-sm font-bold text-slate-900">
                Qonaq kimi davam et
              </span>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform shrink-0 ml-2" />
          </button>
        </div>
      </div>
    </div>
  );
}

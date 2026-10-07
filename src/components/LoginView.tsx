import React, { useState } from 'react';
import { Icons } from './Icons';
import { motion } from 'motion/react';
import { usePreferences, saveLoginState } from '../utils/preferences';
import { loginWithGoogle, AuthErrorInfo } from '../firebase';
import { getOrGenerateUserId } from '../utils/orders';

export default function LoginView({ onClose }: { onClose?: () => void }) {
  const { country } = usePreferences();
  const [googleLoading, setGoogleLoading] = useState(false);
  const [errorInfo, setErrorInfo] = useState<AuthErrorInfo | null>(null);
  const [copied, setCopied] = useState(false);
  const [showGuide, setShowGuide] = useState(false);

  const currentDomain = typeof window !== 'undefined' ? window.location.hostname : '';

  const processSuccessfulUser = (user: any) => {
    let resolvedName = user.displayName;
    if (!resolvedName && user.email) {
      const emailPrefix = user.email.split('@')[0];
      resolvedName = emailPrefix
        .replace(/[._-]+/g, ' ')
        .split(' ')
        .map((w: string) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ');
    }
    resolvedName = resolvedName || 'Google User';

    const userEmail = user.email || '';
    const photo = user.photoURL || undefined;

    // Auto assign distinct unique ID number for each user
    const autoUserId = getOrGenerateUserId(user.uid);

    saveLoginState(true, userEmail, country || 'BD', resolvedName, photo, user.uid);
    localStorage.setItem('bazar_user_profile_name', resolvedName);
    localStorage.setItem('bazar_user_id', autoUserId);
    if (photo) {
      localStorage.setItem('bazar_user_profile_avatar', photo);
    }

    window.dispatchEvent(new CustomEvent('bazar-profile-updated'));
    onClose?.();
  };

  const handleGoogleSignIn = async () => {
    setErrorInfo(null);
    setGoogleLoading(true);
    try {
      const { user, error } = await loginWithGoogle();
      if (error) {
        setErrorInfo(error);
        if (error.isDomainError || error.isProviderError) {
          setShowGuide(true);
        }
        setGoogleLoading(false);
        return;
      }
      if (user) {
        processSuccessfulUser(user);
      }
    } catch (e: any) {
      setErrorInfo({
        code: 'unknown',
        message: e?.message || 'Google লগইন সম্পন্ন করা যায়নি।'
      });
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleCopyDomain = () => {
    if (currentDomain) {
      navigator.clipboard.writeText(currentDomain);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] bg-[#0A0E17] flex flex-col items-center justify-center p-6 text-center overflow-y-auto">
      {/* Dynamic Background Gradients */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-primary/10 rounded-full filter blur-[100px] -z-10 animate-pulse" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-secondary/15 rounded-full filter blur-[100px] -z-10 animate-pulse" />

      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        className="max-w-md w-full glass-card p-8 rounded-3xl border border-white/10 shadow-2xl space-y-6 flex flex-col justify-center relative overflow-hidden"
      >
        {onClose && (
          <button 
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/70 hover:text-white cursor-pointer transition-colors"
            title="বন্ধ করুন"
          >
            <Icons.X size={18} />
          </button>
        )}

        {/* Brand Header */}
        <div className="flex flex-col items-center gap-2">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-white shadow-xl shadow-emerald-500/25">
            <Icons.ShoppingBasket size={32} />
          </div>
          <h2 className="text-2xl font-black text-white uppercase tracking-widest mt-1">
            BAZAR
          </h2>
          <p className="text-xs text-slate-300 font-medium">
            Google অ্যাকাউন্ট দিয়ে সহজেই সাইন ইন করুন
          </p>
        </div>

        {/* Auth Button */}
        <div className="space-y-3">
          <button
            type="button"
            disabled={googleLoading}
            onClick={handleGoogleSignIn}
            className="w-full py-4 px-5 bg-white hover:bg-slate-100 text-slate-900 font-black text-sm rounded-2xl flex items-center justify-center gap-3 transition-all cursor-pointer shadow-xl border border-slate-200 active:scale-[0.98] disabled:opacity-60"
          >
            {googleLoading ? (
              <div className="w-5 h-5 border-2 border-slate-400 border-t-slate-800 rounded-full animate-spin" />
            ) : (
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"/>
                <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"/>
                <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"/>
                <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
              </svg>
            )}
            <span>{googleLoading ? 'সংযোগ করা হচ্ছে...' : 'Google দিয়ে চালিয়ে যান'}</span>
          </button>
        </div>

        {/* Error Info and Guide */}
        {errorInfo && (
          <div className="p-3.5 bg-red-500/10 border border-red-500/30 text-red-200 text-xs text-left rounded-2xl space-y-2">
            <div className="flex items-start gap-2">
              <Icons.AlertCircle size={16} className="text-red-400 shrink-0 mt-0.5" />
              <span className="font-semibold leading-relaxed">{errorInfo.message}</span>
            </div>
          </div>
        )}

        {onClose && (
          <div className="pt-2">
            <button
              type="button"
              onClick={onClose}
              className="text-xs text-slate-400 hover:text-white underline cursor-pointer"
            >
              গেস্ট হিসেবে চালিয়ে যান
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
}

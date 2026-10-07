import React, { useState } from 'react';
import { Icons } from './Icons';
import { motion, AnimatePresence } from 'motion/react';
import { usePreferences, saveLoginState } from '../utils/preferences';
import { loginWithGoogle, AuthErrorInfo } from '../firebase';
import { getOrGenerateUserId } from '../utils/orders';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultMode?: string;
  onSuccess?: () => void;
}

export default function AuthModal({ 
  isOpen, 
  onClose, 
  onSuccess 
}: AuthModalProps) {
  const { country } = usePreferences();
  const [googleLoading, setGoogleLoading] = useState(false);
  const [errorInfo, setErrorInfo] = useState<AuthErrorInfo | null>(null);
  const [successMsg, setSuccessMsg] = useState('');
  const [copied, setCopied] = useState(false);
  const [showFirebaseGuide, setShowFirebaseGuide] = useState(false);

  const currentDomain = typeof window !== 'undefined' ? window.location.hostname : '';

  React.useEffect(() => {
    if (isOpen) {
      setErrorInfo(null);
      setSuccessMsg('');
      setCopied(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Process user data from Google
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

    // Broadcast update across all tabs and components
    window.dispatchEvent(new CustomEvent('bazar-profile-updated'));

    setSuccessMsg(`স্বাগতম, ${resolvedName}! আপনার আইডি: ${autoUserId}`);
    setTimeout(() => {
      onSuccess?.();
      onClose();
    }, 700);
  };

  const handleGoogleSignIn = async () => {
    setErrorInfo(null);
    setGoogleLoading(true);
    try {
      const { user, error } = await loginWithGoogle();
      if (error) {
        setErrorInfo(error);
        if (error.isDomainError || error.isProviderError) {
          setShowFirebaseGuide(true);
        }
        setGoogleLoading(false);
        return;
      }
      if (user) {
        processSuccessfulUser(user);
      }
    } catch (err: any) {
      setErrorInfo({
        code: 'unknown',
        message: err?.message || 'Google লগইন সম্পন্ন করা যায়নি।'
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
    <AnimatePresence>
      <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
        {/* Backdrop click to dismiss */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 cursor-pointer -z-10" 
        />

        <motion.div 
          initial={{ opacity: 0, scale: 0.94, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 16 }}
          transition={{ type: "spring", stiffness: 360, damping: 26 }}
          className="w-full max-w-md bg-[#0F172A] border border-white/15 rounded-3xl p-6 md:p-8 shadow-2xl relative text-center text-white my-auto overflow-hidden"
        >
          {/* Subtle Ambient Glows */}
          <div className="absolute top-0 right-0 w-44 h-44 bg-emerald-500/15 rounded-full filter blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-44 h-44 bg-blue-500/10 rounded-full filter blur-3xl pointer-events-none" />

          {/* Close button with Cross (X) Icon */}
          <button 
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 active:scale-90 flex items-center justify-center text-white/70 hover:text-white transition-all cursor-pointer z-20 border border-white/10 shadow-sm"
            aria-label="Close"
            title="বন্ধ করুন (Close)"
          >
            <Icons.X size={18} />
          </button>

          {/* Brand Header */}
          <div className="flex flex-col items-center gap-2 mb-6 pt-2">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-white shadow-xl shadow-emerald-500/25">
              <Icons.ShoppingBasket size={32} />
            </div>
            <div className="flex items-center gap-2 mt-1">
              <h3 className="text-2xl font-black tracking-tight text-white">BAZAR</h3>
              <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                Official
              </span>
            </div>
            <p className="text-xs text-slate-300 font-medium max-w-xs leading-relaxed">
              Google অ্যাকাউন্ট দিয়ে সহজেই ১-ক্লিকে সাইন ইন করুন
            </p>
          </div>

          {/* Success Message */}
          {successMsg && (
            <div className="p-3.5 bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold rounded-2xl flex items-center justify-center gap-2 mb-4">
              <Icons.CheckCircle2 size={18} className="text-emerald-400 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Auth Button Stack */}
          <div className="space-y-3">
            {/* Google Sign In Button */}
            <button
              type="button"
              disabled={googleLoading}
              onClick={handleGoogleSignIn}
              className="w-full py-4 px-5 bg-white hover:bg-slate-100 active:scale-[0.98] text-slate-900 font-black text-sm rounded-2xl flex items-center justify-center gap-3 transition-all cursor-pointer shadow-xl border border-slate-200 disabled:opacity-60 group"
            >
              {googleLoading ? (
                <div className="w-5 h-5 border-2 border-slate-400 border-t-slate-800 rounded-full animate-spin" />
              ) : (
                <svg className="w-5 h-5 shrink-0 group-hover:scale-105 transition-transform" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                  />
                </svg>
              )}
              <span>{googleLoading ? 'সংযোগ করা হচ্ছে...' : 'Google দিয়ে সাইন ইন করুন'}</span>
            </button>
          </div>

          {/* Error Details */}
          {errorInfo && (
            <div className="mt-4 p-3.5 bg-red-500/10 border border-red-500/30 text-red-200 text-xs text-left rounded-2xl space-y-2">
              <div className="flex items-start gap-2">
                <Icons.AlertCircle size={18} className="text-red-400 shrink-0 mt-0.5" />
                <span className="font-semibold leading-relaxed">{errorInfo.message}</span>
              </div>
            </div>
          )}

          {/* Footer Notice */}
          <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between text-xs text-slate-400">
            <span>অতিথি হিসেবে দেখতে চান?</span>
            <button
              type="button"
              onClick={onClose}
              className="text-emerald-400 hover:text-emerald-300 font-bold underline cursor-pointer"
            >
              পরে লগইন করুন
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

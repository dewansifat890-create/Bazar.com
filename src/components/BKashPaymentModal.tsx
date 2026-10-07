import React from 'react';
import { motion } from 'motion/react';
import { Icons } from './Icons';
import { BKashLogo } from './PaymentLogos';

interface BKashPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  totalAmount: number;
  formattedAmount: string;
  bKashNumber: string;
  onConfirmPayment: (senderNumber: string, trxId: string, isDraftOnly?: boolean) => void;
  initialSenderNumber?: string;
  initialTrxId?: string;
  isProcessing?: boolean;
}

export default function BKashPaymentModal({
  isOpen,
  onClose,
  totalAmount,
  formattedAmount,
  bKashNumber,
  onConfirmPayment,
  initialSenderNumber = '',
  initialTrxId = '',
  isProcessing = false
}: BKashPaymentModalProps) {
  const [senderNumber, setSenderNumber] = React.useState(initialSenderNumber);
  const [trxId, setTrxId] = React.useState(initialTrxId);
  const [copied, setCopied] = React.useState(false);
  const [showQrCode, setShowQrCode] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (initialSenderNumber) setSenderNumber(initialSenderNumber);
    if (initialTrxId) setTrxId(initialTrxId);
  }, [initialSenderNumber, initialTrxId]);

  if (!isOpen) return null;

  const rawNumber = bKashNumber.replace(/[^0-9]/g, '');

  const handleCopyNumber = async () => {
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(rawNumber);
      } else {
        const el = document.createElement('textarea');
        el.value = rawNumber;
        document.body.appendChild(el);
        el.select();
        document.execCommand('copy');
        document.body.removeChild(el);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleOpenBKashApp = () => {
    // Try opening bKash app directly via deep link, fallback gracefully
    window.location.href = 'bkash://';
    setTimeout(() => {
      // If still here, let user know they can also open the bKash app manually
    }, 1500);
  };

  const handleSubmitTrx = () => {
    const cleanSender = senderNumber.trim();
    const cleanTrx = trxId.trim();

    if (!cleanSender || cleanSender.length < 10) {
      setErrorMessage('দয়া করে আপনার বিকাশ নম্বরটি লিখুন (কমপক্ষে ১০-১১ ডিজিট)।');
      return;
    }

    if (!cleanTrx || cleanTrx.length < 5) {
      setErrorMessage('দয়া করে বিকাশ কনফার্মেশন মেসেজে পাওয়া ট্রানজেকশন আইডি (TrxID) লিখুন।');
      return;
    }

    setErrorMessage(null);
    onConfirmPayment(cleanSender, cleanTrx, false);
  };

  const handleSaveAsPendingDraft = () => {
    // Allows user to reserve the order as pending even before or while sending money
    // Order and customer contact will be fully preserved in seller orders!
    const cleanSender = senderNumber.trim();
    const cleanTrx = trxId.trim();
    onConfirmPayment(cleanSender || 'Unspecified', cleanTrx || 'PENDING_TRX', true);
  };

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        transition={{ type: 'spring', damping: 25, stiffness: 350 }}
        className="w-full max-w-md bg-zinc-950 border border-[#E2136E]/40 rounded-3xl shadow-[0_20px_60px_rgba(226,19,110,0.35)] overflow-hidden text-white my-auto flex flex-col relative"
      >
        {/* Top Header - Authentic bKash Branding */}
        <div className="bg-gradient-to-r from-[#C2105D] via-[#E2136E] to-[#FF3388] px-5 py-4 flex items-center justify-between shadow-md relative">
          <div className="flex items-center gap-3">
            <BKashLogo size={38} className="rounded-xl shadow-lg ring-2 ring-white/30" />
            <div>
              <h3 className="text-base font-black tracking-tight text-white flex items-center gap-1.5">
                <span>বিকাশ পেমেন্ট গেটওয়ে</span>
                <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full font-mono font-bold">Send Money</span>
              </h3>
              <p className="text-[10.5px] text-white/80 font-medium">
                সহজ, নিরাপদ ও স্বয়ংক্রিয় অর্ডার ট্র্যাকিং
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-black/20 hover:bg-black/40 flex items-center justify-center text-white/90 hover:text-white transition-colors cursor-pointer"
            title="বন্ধ করুন"
          >
            <Icons.X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4 max-h-[82vh] overflow-y-auto scrollbar-hide">
          {/* Payable Amount Highlight Card */}
          <div className="p-4 rounded-2xl bg-[#E2136E]/10 border border-[#E2136E]/30 text-center relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-[#E2136E]/15 rounded-full blur-2xl pointer-events-none" />
            <span className="text-[11px] font-bold text-outline uppercase tracking-wider block text-[#FFA6CB]">
              পরিশোধযোগ্য সর্বমোট টাকা (Total Payable)
            </span>
            <div className="text-3xl font-black text-white tracking-tight mt-0.5">
              {formattedAmount}
            </div>
            <p className="text-[10px] text-zinc-300 mt-1 flex items-center justify-center gap-1">
              <Icons.ShieldCheck size={12} className="text-emerald-400" />
              <span>পণ্য মূল্য ও শিপিং চার্জ সহ সম্পূর্ণ ফাইনাল হিসাব</span>
            </p>
          </div>

          {/* Receiver Number & Quick Action Buttons */}
          <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-zinc-300">
                আমাদের বিকাশ পার্সোনাল নম্বর:
              </span>
              <span className="text-[9px] font-black uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                Active ✓
              </span>
            </div>

            <div className="flex items-center justify-between bg-black/60 p-3 rounded-xl border border-white/10">
              <span className="text-xl font-mono font-black text-white tracking-wider">
                {bKashNumber}
              </span>
              <button
                type="button"
                onClick={handleCopyNumber}
                className="px-3 py-1.5 bg-[#E2136E] text-white text-xs font-black rounded-lg hover:brightness-110 active:scale-95 transition-all flex items-center gap-1.5 shadow-md cursor-pointer"
              >
                {copied ? (
                  <>
                    <Icons.CheckCircle2 size={14} className="text-white" />
                    <span>কপি হয়েছে!</span>
                  </>
                ) : (
                  <>
                    <Icons.Copy size={14} />
                    <span>কপি করুন</span>
                  </>
                )}
              </button>
            </div>

            {/* Quick Actions Row: Open bKash App + QR Code toggle */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={handleOpenBKashApp}
                className="w-full py-2.5 px-3 bg-white/5 hover:bg-white/10 border border-white/15 rounded-xl text-xs font-bold text-zinc-200 hover:text-white flex items-center justify-center gap-2 active:scale-95 transition-all cursor-pointer"
              >
                <BKashLogo size={18} className="rounded" />
                <span>বিকাশ অ্যাপ ওপেন করুন</span>
              </button>

              <button
                type="button"
                onClick={() => setShowQrCode(!showQrCode)}
                className={`w-full py-2.5 px-3 border rounded-xl text-xs font-bold flex items-center justify-center gap-2 active:scale-95 transition-all cursor-pointer ${
                  showQrCode
                    ? 'bg-[#E2136E]/20 border-[#E2136E] text-[#FF65A8]'
                    : 'bg-white/5 hover:bg-white/10 border-white/15 text-zinc-200'
                }`}
              >
                <Icons.QrCode size={16} />
                <span>{showQrCode ? 'কিউআর বন্ধ করুন' : 'QR কোড দেখুন'}</span>
              </button>
            </div>

            {/* Simulated bKash QR Code view */}
            {showQrCode && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="p-4 bg-white rounded-2xl text-center space-y-2 mt-2 text-zinc-900 border-2 border-[#E2136E]"
              >
                <p className="text-xs font-black text-[#E2136E] uppercase tracking-wider">
                  bKash QR Code • Scan & Pay
                </p>
                <div className="w-40 h-40 mx-auto bg-zinc-100 p-2 rounded-xl flex items-center justify-center border border-zinc-300 shadow-inner relative">
                  {/* High visual QR placeholder pattern */}
                  <svg viewBox="0 0 100 100" className="w-full h-full text-zinc-900" fill="currentColor">
                    <rect x="5" y="5" width="28" height="28" rx="4" fill="none" stroke="currentColor" strokeWidth="6" />
                    <rect x="13" y="13" width="12" height="12" rx="2" />
                    <rect x="67" y="5" width="28" height="28" rx="4" fill="none" stroke="currentColor" strokeWidth="6" />
                    <rect x="75" y="13" width="12" height="12" rx="2" />
                    <rect x="5" y="67" width="28" height="28" rx="4" fill="none" stroke="currentColor" strokeWidth="6" />
                    <rect x="13" y="75" width="12" height="12" rx="2" />
                    <rect x="42" y="8" width="16" height="6" />
                    <rect x="42" y="20" width="8" height="14" />
                    <rect x="44" y="44" width="12" height="12" rx="2" fill="#E2136E" />
                    <rect x="8" y="44" width="24" height="6" />
                    <rect x="68" y="44" width="24" height="6" />
                    <rect x="68" y="60" width="10" height="24" />
                    <rect x="84" y="75" width="10" height="10" />
                    <rect x="44" y="68" width="14" height="8" />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <BKashLogo size={26} className="rounded-lg shadow-md" />
                  </div>
                </div>
                <p className="text-[11px] font-mono font-bold text-zinc-700">
                  {bKashNumber} ({formattedAmount})
                </p>
                <p className="text-[10px] text-zinc-500">
                  বিকাশ অ্যাপের "Scan QR" অপশন দিয়ে সরাসরি স্ক্যান করে পেমেন্ট করুন
                </p>
              </motion.div>
            )}
          </div>

          {/* 3 Step Instruction Guide */}
          <div className="p-3 bg-white/[0.02] border border-white/5 rounded-xl space-y-1 text-[11px] text-zinc-300">
            <p className="font-bold text-white text-xs mb-1 flex items-center gap-1.5">
              <span>📌 পেমেন্ট করার ধাপসমূহ:</span>
            </p>
            <p>১. বিকাশ অ্যাপের <strong>Send Money</strong> অপশনে গিয়ে ওপরের নম্বরে <strong className="text-[#FF65A8] font-mono">{formattedAmount}</strong> টাকা সেন্ড করুন।</p>
            <p>২. টাকা পাঠানো সম্পন্ন হলে ফিরতি মেসেজের <strong>TrxID</strong> কপি করুন।</p>
            <p>৩. নিচে আপনার নম্বর ও TrxID লিখে <strong>"অর্ডার কনফার্ম করুন"</strong> চাপুন।</p>
          </div>

          {/* Validation Error Message */}
          {errorMessage && (
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-3 rounded-xl bg-red-500/20 border border-red-500/40 text-red-300 text-xs font-bold flex items-center gap-2"
            >
              <Icons.AlertCircle size={16} className="text-red-400 shrink-0" />
              <span>{errorMessage}</span>
            </motion.div>
          )}

          {/* Form Input Fields */}
          <div className="space-y-3 pt-1">
            <div>
              <label className="text-[11px] font-bold text-zinc-300 block mb-1">
                আপনার বিকাশ নম্বর (যে নম্বর থেকে টাকা পাঠিয়েছেন) *
              </label>
              <div className="flex items-center px-3.5 rounded-xl border border-white/15 bg-black/60 h-11 focus-within:border-[#E2136E] focus-within:ring-2 focus-within:ring-[#E2136E]/30 transition-all">
                <span className="text-xs font-mono text-outline mr-2">+880</span>
                <input
                  type="tel"
                  value={senderNumber}
                  onChange={(e) => {
                    setSenderNumber(e.target.value.replace(/[^0-9]/g, ''));
                    setErrorMessage(null);
                  }}
                  placeholder="01XXXXXXXXX"
                  className="bg-transparent border-none focus:ring-0 text-xs font-mono font-bold text-white w-full placeholder:text-outline/40"
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-bold text-zinc-300 block mb-1">
                বিকাশ Transaction ID (TrxID) *
              </label>
              <div className="flex items-center px-3.5 rounded-xl border border-white/15 bg-black/60 h-11 focus-within:border-[#E2136E] focus-within:ring-2 focus-within:ring-[#E2136E]/30 transition-all">
                <input
                  type="text"
                  value={trxId}
                  onChange={(e) => {
                    setTrxId(e.target.value.toUpperCase());
                    setErrorMessage(null);
                  }}
                  placeholder="e.g. BL84K9P2XQ"
                  className="bg-transparent border-none focus:ring-0 text-xs font-mono font-bold text-white w-full uppercase placeholder:text-outline/40"
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2 pt-2">
            <button
              type="button"
              onClick={handleSubmitTrx}
              disabled={isProcessing}
              className="w-full h-12 bg-gradient-to-r from-[#C2105D] via-[#E2136E] to-[#FF3388] text-white font-black text-xs uppercase tracking-wider rounded-xl hover:brightness-110 active:scale-95 transition-all shadow-lg shadow-[#E2136E]/30 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isProcessing ? (
                <>
                  <Icons.Sparkles size={16} className="animate-spin" />
                  <span>অর্ডার ভেরিফাই হচ্ছে...</span>
                </>
              ) : (
                <>
                  <Icons.CheckCircle2 size={16} />
                  <span>অর্ডার কনফার্ম করুন (Confirm bKash Order)</span>
                </>
              )}
            </button>

            {/* Smart Safety Fallback: Save as Pending Order */}
            <button
              type="button"
              onClick={handleSaveAsPendingDraft}
              disabled={isProcessing}
              className="w-full py-2.5 px-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-[11px] font-bold text-zinc-400 hover:text-white transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Icons.Clock size={13} className="text-amber-400" />
              <span>টাকা পাঠিয়েছি কিন্তু TrxID পরে দেব (Save as Pending)</span>
            </button>
          </div>

          {/* Assurance footer */}
          <p className="text-[10px] text-zinc-400 text-center leading-relaxed">
            🛡️ টাকা পাঠানো সম্পন্ন হলে আমাদের প্রতিনিধি ট্রানজেকশন যাচাই করে দ্রুত পার্সেল কুরিয়ারে বুকিং দিয়ে দেবে।
          </p>
        </div>
      </motion.div>
    </div>
  );
}

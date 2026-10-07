import React from 'react';
import { Icons } from './Icons';
import { motion } from 'motion/react';

// Contact Links Config
const CONTACT_LINKS = {
  whatsapp: 'https://wa.me/8801723456789',
  messenger: 'https://m.me/dewansifat890',
  sms: 'sms:+8801723456789?body=Assalamu%20Alaikum!%20I%20want%20to%20know%20more%20about%20your%20products.'
};

export default function ChatView() {
  // Sound feedback simulation
  const playClickSound = () => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(480, ctx.currentTime);
      gain.gain.setValueAtTime(0.06, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.08);
    } catch (e) {
      // ignore
    }
  };

  return (
    <div id="bazar-vip-chat-view" className="w-full min-h-[calc(100vh-4rem)] pb-28 flex flex-col items-center justify-start p-2 sm:p-4 select-none overflow-y-auto font-sans bg-slate-50 text-slate-900">
      
      {/* Full Size Glass Card Hub */}
      <motion.div 
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="w-full max-w-2xl bg-white/80 border border-white/90 rounded-[28px] p-3.5 sm:p-5 shadow-[0_10px_40px_rgba(0,0,0,0.06),inset_0_1.5px_3px_rgba(255,255,255,1)] backdrop-blur-2xl relative overflow-hidden space-y-4"
      >
        {/* Background ambient light reflections */}
        <div className="absolute -top-12 -right-12 w-56 h-56 bg-emerald-400/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-12 -left-12 w-56 h-56 bg-blue-400/10 rounded-full blur-3xl pointer-events-none" />

        {/* Live Support Header Badge */}
        <div className="relative z-10 flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-[9.5px] font-black uppercase tracking-widest text-emerald-800 bg-emerald-50 border border-emerald-200/80 px-2.5 py-0.5 rounded-full shadow-2xs">
                Live Support Online
              </span>
            </div>
            <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight flex items-center gap-2 mt-0.5">
              💬 কাস্টমার সাপোর্ট কেয়ার
            </h2>
          </div>

          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 via-teal-600 to-emerald-700 flex items-center justify-center text-white shadow-md shadow-emerald-500/20 shrink-0 border border-white/40">
            <Icons.Headphones size={18} className="stroke-[2.5]" />
          </div>
        </div>

        {/* Direct Communication Channels (Pure White Liquid Glass Cards) */}
        <div className="relative z-10 space-y-2.5 pt-0.5">
          <div className="flex items-center justify-between px-1">
            <span className="text-[10.5px] text-slate-700 font-black tracking-widest uppercase">
              📞 সরাসরি যোগাযোগ চ্যানেল
            </span>
            <span className="text-[9px] font-extrabold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/80 shadow-2xs">
              ২৪/৭ সচল
            </span>
          </div>

          <div className="flex flex-col gap-2.5">
            {/* WhatsApp White Liquid Glass Card */}
            <a 
              id="whatsapp-direct"
              href={CONTACT_LINKS.whatsapp}
              target="_blank"
              onClick={playClickSound}
              rel="noopener noreferrer"
              className="group relative w-full p-2.5 sm:p-3.5 rounded-xl flex items-center justify-between bg-gradient-to-b from-white/90 via-white/80 to-white/95 border border-white/90 hover:border-emerald-500/40 transition-all duration-200 cursor-pointer shadow-[0_4px_20px_rgb(0,0,0,0.04),inset_0_1.5px_2px_rgba(255,255,255,1)] hover:shadow-[0_8px_24px_rgba(16,185,129,0.15)] backdrop-blur-xl active:scale-[0.98] overflow-hidden"
            >
              {/* Liquid Shine Overlay */}
              <div className="absolute top-0 inset-x-0 h-1/2 bg-gradient-to-b from-white/80 to-transparent pointer-events-none" />

              <div className="relative z-10 flex items-center gap-3">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-[#10b981] to-[#047857] flex items-center justify-center text-white shadow-xs shadow-emerald-500/30 group-hover:scale-105 transition-transform shrink-0 border border-white/30">
                  <Icons.MessageCircle size={18} strokeWidth={2.5} />
                </div>
                <div>
                  <h3 className="text-xs sm:text-sm font-black text-slate-900 tracking-wide uppercase flex items-center gap-1.5">
                    WhatsApp Live Chat <span className="bg-emerald-100 text-emerald-800 text-[8px] font-black px-1.5 py-0.2 rounded-full border border-emerald-200">FAST</span>
                  </h3>
                  <p className="text-[10px] sm:text-[10.5px] text-slate-600 font-semibold mt-0.5">
                    হোয়াটসঅ্যাপে চ্যাট করে তাতক্ষণিক অর্ডার ও তথ্য জানুন
                  </p>
                </div>
              </div>
              <div className="relative z-10 w-7 h-7 rounded-full bg-emerald-50/90 text-emerald-700 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-all shadow-2xs border border-emerald-100 shrink-0">
                <Icons.ArrowRight size={14} strokeWidth={3} />
              </div>
            </a>

            {/* Messenger White Liquid Glass Card */}
            <a 
              id="messenger-direct"
              href={CONTACT_LINKS.messenger}
              target="_blank"
              onClick={playClickSound}
              rel="noopener noreferrer"
              className="group relative w-full p-2.5 sm:p-3.5 rounded-xl flex items-center justify-between bg-gradient-to-b from-white/90 via-white/80 to-white/95 border border-white/90 hover:border-blue-500/40 transition-all duration-200 cursor-pointer shadow-[0_4px_20px_rgb(0,0,0,0.04),inset_0_1.5px_2px_rgba(255,255,255,1)] hover:shadow-[0_8px_24px_rgba(59,130,246,0.15)] backdrop-blur-xl active:scale-[0.98] overflow-hidden"
            >
              {/* Liquid Shine Overlay */}
              <div className="absolute top-0 inset-x-0 h-1/2 bg-gradient-to-b from-white/80 to-transparent pointer-events-none" />

              <div className="relative z-10 flex items-center gap-3">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-[#3b82f6] to-[#1d4ed8] flex items-center justify-center text-white shadow-xs shadow-blue-500/30 group-hover:scale-105 transition-transform shrink-0 border border-white/30">
                  <Icons.MessageSquare size={18} strokeWidth={2.5} />
                </div>
                <div>
                  <h3 className="text-xs sm:text-sm font-black text-slate-900 tracking-wide uppercase">
                    Facebook Messenger
                  </h3>
                  <p className="text-[10px] sm:text-[10.5px] text-slate-600 font-semibold mt-0.5">
                    ফেসবুক মেসেঞ্জারে সরাসরি কথা বলুন
                  </p>
                </div>
              </div>
              <div className="relative z-10 w-7 h-7 rounded-full bg-blue-50/90 text-blue-700 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-all shadow-2xs border border-blue-100 shrink-0">
                <Icons.ArrowRight size={14} strokeWidth={3} />
              </div>
            </a>

            {/* Carrier SMS White Liquid Glass Card */}
            <a 
              id="sms-direct"
              href={CONTACT_LINKS.sms}
              onClick={playClickSound}
              className="group relative w-full p-2.5 sm:p-3.5 rounded-xl flex items-center justify-between bg-gradient-to-b from-white/90 via-white/80 to-white/95 border border-white/90 hover:border-slate-400 transition-all duration-200 cursor-pointer shadow-[0_4px_20px_rgb(0,0,0,0.04),inset_0_1.5px_2px_rgba(255,255,255,1)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.08)] backdrop-blur-xl active:scale-[0.98] overflow-hidden"
            >
              {/* Liquid Shine Overlay */}
              <div className="absolute top-0 inset-x-0 h-1/2 bg-gradient-to-b from-white/80 to-transparent pointer-events-none" />

              <div className="relative z-10 flex items-center gap-3">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center text-white shadow-xs shadow-slate-800/20 group-hover:scale-105 transition-transform shrink-0 border border-white/30">
                  <Icons.Smartphone size={18} strokeWidth={2.5} />
                </div>
                <div>
                  <h3 className="text-xs sm:text-sm font-black text-slate-900 tracking-wide uppercase">
                    Mobile SMS Support
                  </h3>
                  <p className="text-[10px] sm:text-[10.5px] text-slate-600 font-semibold mt-0.5">
                    মোবাইল মেসেজ পাঠাতে এখানে চাপুন
                  </p>
                </div>
              </div>
              <div className="relative z-10 w-7 h-7 rounded-full bg-slate-100/90 text-slate-800 flex items-center justify-center group-hover:bg-slate-900 group-hover:text-white transition-all shadow-2xs border border-slate-200 shrink-0">
                <Icons.ArrowRight size={14} strokeWidth={3} />
              </div>
            </a>
          </div>
        </div>

        {/* Security Footer Note */}
        <div className="pt-2.5 border-t border-slate-200/80 text-center flex flex-col items-center gap-0.5">
          <p className="text-[10px] text-emerald-800 font-black tracking-wider uppercase flex items-center gap-1">
            <Icons.ShieldCheck size={13} /> BAZAR GUARANTEED SUPPORT SECURITY
          </p>
          <span className="text-[9.5px] text-slate-500 font-semibold">
            প্রতিটি গ্রাহকের বার্তা আমাদের কাছে অত্যন্ত গুরুত্বপূর্ণ ও সুরক্ষিত।
          </span>
        </div>

      </motion.div>
    </div>
  );
}

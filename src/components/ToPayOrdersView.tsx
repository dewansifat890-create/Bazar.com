import React from 'react';
import { Icons } from './Icons';
import { BKashLogo, CodLogo } from './PaymentLogos';
import { usePreferences } from '../utils/preferences';
import { OrderRecord } from '../utils/orders';

interface ToPayOrdersViewProps {
  onBack: () => void;
  orders: OrderRecord[];
  onShopNow?: () => void;
  onProductClick?: (order: OrderRecord) => void;
}

export default function ToPayOrdersView({ onBack, orders, onShopNow, onProductClick }: ToPayOrdersViewProps) {
  const { t, formatActiveCurrencyValue } = usePreferences();

  return (
    <div className="fixed inset-0 min-h-screen bg-slate-50 text-slate-900 pb-28 pt-3 z-[115] overflow-y-auto overflow-x-hidden animate-in fade-in duration-200 select-none">
      {/* Top App Bar */}
      <header className="sticky top-0 left-0 right-0 w-full max-w-xl mx-auto z-50 bg-white/85 backdrop-blur-2xl border-b border-slate-200/80 shadow-xs flex items-center justify-between px-4 sm:px-5 h-16">
        <div className="flex items-center gap-3">
          <button 
            onClick={onBack}
            className="w-10 h-10 rounded-full bg-white/90 border border-slate-200/80 hover:bg-slate-100 flex items-center justify-center text-slate-800 shadow-xs active:scale-90 cursor-pointer transition-all shrink-0"
          >
            <Icons.ArrowLeft size={20} className="text-emerald-600" />
          </button>
          <div>
            <h1 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
              <Icons.ShoppingBag size={20} className="text-emerald-600" />
              <span>My Order / আমার অর্ডার</span>
            </h1>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              আপনার কেনা সকল পণ্যের তালিকা ও পেমেন্ট বিবরণী
            </p>
          </div>
        </div>
        <div className="flex items-center">
          <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200/80 px-2.5 py-1 rounded-full">
            মোট অর্ডার: {orders.length}
          </span>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-xl mx-auto px-3.5 sm:px-5 pt-4 space-y-4">
        {/* Notice Banner - Explaining Non-cancellable Policy */}
        <div className="p-3.5 bg-white border border-slate-200/90 rounded-2xl shadow-xs flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 border border-amber-200/80 flex items-center justify-center shrink-0">
            <Icons.Lock size={16} />
          </div>
          <div className="text-[11px] leading-relaxed text-slate-600">
            <span className="font-extrabold text-slate-900 block">🔒 অর্ডার নীতি (Order Policy):</span>
            <span>অর্ডার প্লেস করার পর তা সরাসরি প্রসেসিংয়ে চলে যায়, তাই এখান থেকে অর্ডার <strong>ক্যানসেল করার সুযোগ নেই</strong>। পণ্য হাতে পেয়ে মূল্য পরিশোধ করবেন।</span>
          </div>
        </div>

        {/* Orders List */}
        {orders.length === 0 ? (
          <div className="bg-white border border-slate-200/80 rounded-3xl p-10 text-center space-y-4 shadow-sm my-6">
            <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center mx-auto">
              <Icons.ShoppingCart size={28} />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-black text-slate-900">আপনার কোনো পেন্ডিং অর্ডার নেই</h3>
              <p className="text-xs text-slate-500 max-w-xs mx-auto">
                পণ্য অর্ডার করলে তার নাম, পেমেন্ট সার্ভিস ও সময় এখানে বিস্তারিত দেখতে পাবেন।
              </p>
            </div>
            {onShopNow && (
              <button
                onClick={onShopNow}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all shadow-md cursor-pointer"
              >
                কেনাকাটা শুরু করুন
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => {
              // Extract date and time
              const displayDate = order.date ? order.date.split(',')[0].trim() : 'আজকে';
              const displayTime = order.time || (order.date && order.date.includes(',') ? order.date.split(',')[1].trim() : 'সদ্য');

              return (
                <div 
                  key={order.id} 
                  className="bg-white border border-slate-200/90 rounded-[26px] p-4 sm:p-5 shadow-[0_4px_25px_rgba(0,0,0,0.04)] space-y-4 relative overflow-hidden"
                >
                  {/* Top Bar: Order ID & Date/Time */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-black text-slate-900 tracking-wider">
                          #{order.id}
                        </span>
                        <span className="text-[9px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200/80 px-2 py-0.5 rounded-full">
                          {order.status || 'Processing'}
                        </span>
                      </div>
                      {/* Buy Date and Time - Clearly Visible as Requested */}
                      <div className="flex items-center gap-3 mt-1.5 text-[11px] font-bold text-slate-600 flex-wrap">
                        <span className="flex items-center gap-1">
                          <Icons.Clock size={12} className="text-emerald-600" />
                          <span>তারিখ: <strong className="text-slate-900 font-mono">{displayDate}</strong></span>
                        </span>
                        <span className="text-slate-300">•</span>
                        <span className="flex items-center gap-1">
                          <span>সময়: <strong className="text-slate-900 font-mono">{displayTime}</strong></span>
                        </span>
                      </div>
                    </div>

                    {/* Non-cancellable lock badge */}
                    <div className="flex items-center gap-1 text-[9.5px] font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-xl border border-slate-200/80">
                      <Icons.Lock size={10} className="text-slate-600" />
                      <span>ক্যানসেলযোগ্য নয় (Locked)</span>
                    </div>
                  </div>

                  {/* Product Details Section */}
                  <div className="flex gap-3.5 items-start">
                    <button 
                      type="button"
                      onClick={() => onProductClick?.(order)}
                      title="পণ্যটি বিস্তারিত দেখতে ক্লিক করুন (Click to view product)"
                      className="w-20 h-20 rounded-2xl bg-slate-100 border border-slate-200/90 overflow-hidden shrink-0 shadow-2xs group relative cursor-pointer active:scale-95 transition-all hover:border-emerald-500 hover:ring-2 hover:ring-emerald-400/30 text-left"
                    >
                      {order.itemImage ? (
                        <img 
                          src={order.itemImage} 
                          alt={order.itemName} 
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-400">
                          <Icons.Package size={24} />
                        </div>
                      )}
                      {/* Click/Hover Hint Overlay */}
                      <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white p-1">
                        <Icons.Eye size={16} />
                        <span className="text-[8px] font-black uppercase mt-0.5 tracking-wider">দেখুন</span>
                      </div>
                    </button>
                    <div className="flex-1 min-w-0 space-y-1">
                      <button
                        type="button"
                        onClick={() => onProductClick?.(order)}
                        className="text-left text-sm font-black text-slate-900 leading-snug line-clamp-2 hover:text-emerald-700 transition-colors cursor-pointer group flex items-start gap-1"
                        title="পণ্যটি দেখতে ক্লিক করুন"
                      >
                        <span>{order.itemName}</span>
                        <Icons.ExternalLink size={12} className="opacity-0 group-hover:opacity-100 text-emerald-600 shrink-0 mt-0.5 transition-opacity" />
                      </button>

                      {/* Interactive View Product Button */}
                      <div className="pt-0.5">
                        <button
                          type="button"
                          onClick={() => onProductClick?.(order)}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200/80 text-[10.5px] font-bold transition-all active:scale-95 cursor-pointer shadow-2xs group"
                        >
                          <Icons.Eye size={12} className="text-emerald-600 group-hover:scale-110 transition-transform" />
                          <span>পণ্যটি দেখুন (View Product)</span>
                          <Icons.ChevronRight size={11} className="text-emerald-500" />
                        </button>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 pt-0.5">
                        <span className="text-xs font-mono font-black text-emerald-600">
                          মূল্য: {formatActiveCurrencyValue(order.itemPrice)}
                        </span>
                        {order.shippingFee !== undefined && order.shippingFee > 0 && (
                          <span className="text-[10px] font-bold text-slate-500">
                            + শিপিং {formatActiveCurrencyValue(order.shippingFee)}
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] font-black text-slate-900 pt-0.5">
                        সর্বমোট: <span className="text-emerald-700 font-mono font-extrabold">{formatActiveCurrencyValue(order.totalAmount || order.itemPrice)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Payment Service Details ("kon pay service e buy korse") */}
                  <div className="p-3 bg-slate-50/90 border border-slate-200/90 rounded-2xl flex flex-wrap items-center justify-between gap-2.5">
                    <div className="flex items-center gap-2.5">
                      {order.paymentMethod === 'bkash' ? (
                        <BKashLogo size={32} className="rounded-lg shadow-xs" />
                      ) : (
                        <CodLogo size={32} className="rounded-lg shadow-xs" />
                      )}
                      <div>
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                          পেমেন্ট মাধ্যম (Payment Service):
                        </span>
                        <span className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                          {order.paymentMethod === 'bkash' ? (
                            <>
                              <span className="text-[#E2136E]">বিকাশ (bKash Send Money)</span>
                              {order.bKashTrxId && (
                                <span className="font-mono text-[10px] text-slate-600 bg-white px-1.5 py-0.5 rounded border border-slate-200">
                                  TrxID: {order.bKashTrxId}
                                </span>
                              )}
                            </>
                          ) : (
                            <>
                              <span className="text-emerald-700">ক্যাশ অন ডেলিভারি (Cash on Delivery)</span>
                              <span className="text-[10px] text-slate-600 bg-white px-2 py-0.5 rounded-full border border-slate-200">
                                হাতে পেয়ে টাকা
                              </span>
                            </>
                          )}
                        </span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-[9.5px] font-bold text-slate-500 block">পেমেন্ট স্ট্যাটাস:</span>
                      <span className="text-[11px] font-black text-emerald-600">
                        {order.paymentStatus || (order.paymentMethod === 'bkash' ? 'বিকাশ যাচাই বাকি' : 'হাতে পেয়ে টাকা দিন')}
                      </span>
                    </div>
                  </div>

                  {/* Delivery Address Brief */}
                  {order.location && (
                    <div className="text-[10.5px] text-slate-500 bg-white border border-slate-100 p-2.5 rounded-xl flex items-center gap-2">
                      <Icons.MapPin size={13} className="text-emerald-600 shrink-0" />
                      <span className="truncate">
                        ডেলিভারি ঠিকানা: <strong className="text-slate-800">{order.location.fullName}</strong> ({order.location.district || ''}, {order.location.area || ''}) • +880 {order.location.mobile}
                      </span>
                    </div>
                  )}

                  {/* Strict No-Cancel Note at bottom */}
                  <div className="pt-1 flex items-center justify-between text-[10px] text-slate-400 border-t border-slate-100">
                    <span className="flex items-center gap-1">
                      <Icons.ShieldCheck size={12} className="text-emerald-600" />
                      <span>অর্ডার ট্র্যাকিং সক্রিয় রয়েছে</span>
                    </span>
                    <span className="text-slate-500 font-bold">
                      🚫 ক্যানসেল অপশন নিষ্ক্রিয়
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}

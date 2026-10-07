import React from 'react';
import { Icons } from './Icons';
import { motion, AnimatePresence } from 'motion/react';
import AddressEditView from './AddressEditView';
import { incrementProductSales } from '../utils/sales';
import { incrementUserOrders, addNewSavedOrder, getOrGenerateUserId, getUserVerificationDetails } from '../utils/orders';
import { usePreferences } from '../utils/preferences';
import { BKashLogo, CodLogo } from './PaymentLogos';
import BKashPaymentModal from './BKashPaymentModal';

interface CheckoutViewProps {
  onBack: () => void;
  product: {
    name: string;
    price: number;
    image: string;
    customPrices?: Record<string, number>;
  };
  deliveryAddress?: any;
  onAddressChange?: (address: any) => void;
  quantity?: number;
}

export default function CheckoutView({ onBack, product, deliveryAddress, onAddressChange, quantity = 1 }: CheckoutViewProps) {
  const { t, formatPrice, getProductActivePrice, formatActiveCurrencyValue } = usePreferences();
  const [isEditingAddress, setIsEditingAddress] = React.useState(false);
  const [isOrderPlaced, setIsOrderPlaced] = React.useState(false);
  const [isPlacing, setIsPlacing] = React.useState(false);
  const [showAddressAlert, setShowAddressAlert] = React.useState(false);
  const [highlightAddress, setHighlightAddress] = React.useState(false);
  const addressSectionRef = React.useRef<HTMLDivElement>(null);
  const paymentSectionRef = React.useRef<HTMLDivElement>(null);

  // Payment states: 'cod' (Cash on Delivery) or 'bkash' (bKash Send Money)
  const [paymentMethod, setPaymentMethod] = React.useState<'cod' | 'bkash'>('cod');
  const [isBKashModalOpen, setIsBKashModalOpen] = React.useState(false);
  const [showBKashLockNotice, setShowBKashLockNotice] = React.useState(false);
  const [bKashSenderNumber, setBKashSenderNumber] = React.useState('');
  const [bKashTrxId, setBKashTrxId] = React.useState('');
  const [bKashCopied, setBKashCopied] = React.useState(false);
  const [restoredDraft, setRestoredDraft] = React.useState(false);
  const [placedOrderSummary, setPlacedOrderSummary] = React.useState<any>(null);

  // Default bKash personal number (can be customized by store owner in localStorage)
  const bKashNumber = React.useMemo(() => {
    return localStorage.getItem('bazar_bkash_number') || '01876-543210';
  }, []);

  // Validate if delivery address is properly completed
  const isAddressValid = React.useMemo(() => {
    if (!deliveryAddress) return false;
    const hasName = Boolean(deliveryAddress.fullName && String(deliveryAddress.fullName).trim().length > 0);
    const hasMobile = Boolean(deliveryAddress.mobile && String(deliveryAddress.mobile).trim().length > 0);
    const hasLocation = Boolean(deliveryAddress.district || deliveryAddress.area || deliveryAddress.address);
    return hasName && hasMobile && hasLocation;
  }, [deliveryAddress]);

  const DHAKA_DIVISION_DISTRICTS = React.useMemo(() => [
    'gazipur', 'narayanganj', 'narsingdi', 'tangail', 'kishoreganj',
    'faridpur', 'manikganj', 'munshiganj', 'gopalganj', 'madaripur',
    'rajbari', 'shariatpur'
  ], []);

  // Dynamic Bangladesh Location-based Shipping Fee & Tax Breakdown
  // 1. If location is NOT set yet: Shipping = 0, Tax = 0
  // 2. If location IS set:
  //    - Inside Dhaka City / Dhaka District: ৳60
  //    - Inside Dhaka Division (other districts): ৳70
  //    - Outside Dhaka Division (all other divisions across BD): ৳120
  // 3. Tax: 0 (0% VAT exempted as requested by store owner)
  const subtotal = getProductActivePrice(product.price, product.customPrices) * quantity;

  const { shippingFee, shippingLabel, shippingZoneText } = React.useMemo(() => {
    if (!isAddressValid || !deliveryAddress) {
      return {
        shippingFee: 0,
        shippingLabel: 'লোকেশন নির্বাচন বাকি (৳০)',
        shippingZoneText: 'লোকেশন নির্ধারণ করুন'
      };
    }

    const dist = (deliveryAddress.district || '').toLowerCase().trim();
    const dept = (deliveryAddress.department || '').toLowerCase().trim();

    // 1. Inside Dhaka City / Dhaka District (৳60)
    if (dist === 'dhaka' || (dept === 'dhaka' && (!dist || dist === 'dhaka'))) {
      return {
        shippingFee: 60,
        shippingLabel: 'ঢাকা সিটির ভেতরে (Inside Dhaka)',
        shippingZoneText: 'ঢাকা সিটি (৳৬০)'
      };
    }

    // 2. Whole Dhaka Division other districts (৳70)
    if (dept === 'dhaka' || DHAKA_DIVISION_DISTRICTS.includes(dist)) {
      return {
        shippingFee: 70,
        shippingLabel: 'ঢাকা বিভাগের মধ্যে (Dhaka Division)',
        shippingZoneText: 'ঢাকা বিভাগ (৳৭০)'
      };
    }

    // 3. Outside Dhaka Division (৳120)
    return {
      shippingFee: 120,
      shippingLabel: 'ঢাকার বাইরে সারাদেশে (Outside Dhaka)',
      shippingZoneText: 'ঢাকার বাইরে (৳১২০)'
    };
  }, [isAddressValid, deliveryAddress, DHAKA_DIVISION_DISTRICTS]);

  const tax = 0; // 0% Tax as requested by user
  const totalAmount = subtotal + shippingFee + tax;

  // Restore previous pending draft session if available for this product
  React.useEffect(() => {
    try {
      const savedDraft = localStorage.getItem('bazar_pending_draft_order');
      if (savedDraft) {
        const parsed = JSON.parse(savedDraft);
        if (parsed.productName === product.name) {
          if (parsed.paymentMethod) setPaymentMethod(parsed.paymentMethod);
          if (parsed.bKashSenderNumber) setBKashSenderNumber(parsed.bKashSenderNumber);
          if (parsed.bKashTrxId) setBKashTrxId(parsed.bKashTrxId);
          setRestoredDraft(true);
        }
      }
    } catch (e) {
      console.error('Error loading pending draft order:', e);
    }
  }, [product.name]);

  // Persist pending order draft session whenever user modifies order/payment details
  React.useEffect(() => {
    try {
      const draft = {
        productName: product.name,
        quantity,
        paymentMethod,
        bKashSenderNumber,
        bKashTrxId,
        updatedAt: Date.now()
      };
      localStorage.setItem('bazar_pending_draft_order', JSON.stringify(draft));
    } catch (e) {
      console.error('Error saving pending draft order:', e);
    }
  }, [product.name, quantity, paymentMethod, bKashSenderNumber, bKashTrxId]);

  // Copy bKash number to clipboard
  const handleCopyBKash = async () => {
    const rawNumber = bKashNumber.replace(/[^0-9]/g, '');
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
      setBKashCopied(true);
      setTimeout(() => setBKashCopied(false), 2500);
    } catch {
      setBKashCopied(true);
      setTimeout(() => setBKashCopied(false), 2500);
    }
  };

  React.useEffect(() => {
    if (isAddressValid) {
      setShowAddressAlert(false);
      setHighlightAddress(false);
    }
  }, [isAddressValid]);

  React.useEffect(() => {
    if (showAddressAlert) {
      const timer = setTimeout(() => {
        setShowAddressAlert(false);
      }, 6000);
      return () => clearTimeout(timer);
    }
  }, [showAddressAlert]);

  // Format address for display
  const addressDisplay = deliveryAddress ? {
    fullName: deliveryAddress.fullName,
    mobile: `+880 ${deliveryAddress.mobile}`,
    details: `${deliveryAddress.union ? `${deliveryAddress.union}, ` : ''}${deliveryAddress.upazila ? `${deliveryAddress.upazila}, ` : ''}${deliveryAddress.district}, ${deliveryAddress.department}\nArea: ${deliveryAddress.area}\nDelivery: ${deliveryAddress.deliveryArea}${deliveryAddress.address ? `\n${deliveryAddress.address}` : ''}`
  } : {
    fullName: '',
    mobile: '',
    details: 'Please set your delivery address'
  };

  // Master order finalizer for both COD and bKash
  const finalizeOrderPlacement = (paymentConfig: {
    method: 'cod' | 'bkash';
    sender?: string;
    trxId?: string;
    status: string;
    paymentStatus: string;
  }) => {
    setIsPlacing(true);

    setTimeout(() => {
      incrementProductSales(product.name, quantity);
      incrementUserOrders(quantity);

      const userName = localStorage.getItem('bazar_user_profile_name') || 'Shop Enthusiast';
      const userAvatar = localStorage.getItem('bazar_user_profile_avatar') || '';
      const userId = getOrGenerateUserId();
      
      const rawVerification = getUserVerificationDetails();
      const verificationDetails = rawVerification && rawVerification.isVerified ? rawVerification : undefined;

      const orderId = `BZR-ORD-${Math.floor(100000 + Math.random() * 900000)}`;
      const now = new Date();
      const orderDateStr = now.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
      const orderTimeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

      // Save order to store database with complete pricing and location breakdowns
      addNewSavedOrder({
        id: orderId,
        itemName: `${product.name} (x${quantity})`,
        itemPrice: subtotal,
        itemImage: product.image,
        productId: (product as any).id || product.name,
        productOriginalName: product.name,
        originalProduct: product,
        customPrices: product.customPrices,
        shippingFee,
        tax,
        totalAmount,
        shippingZone: shippingZoneText,
        userId,
        userName,
        userAvatar,
        date: `${orderDateStr}, ${orderTimeStr}`,
        time: orderTimeStr,
        orderTime: `${orderDateStr} • ${orderTimeStr}`,
        createdAt: Date.now(),
        status: paymentConfig.status,
        paymentMethod: paymentConfig.method,
        paymentStatus: paymentConfig.paymentStatus,
        bKashSender: paymentConfig.sender,
        bKashTrxId: paymentConfig.trxId,
        location: {
          fullName: deliveryAddress?.fullName || 'Anonymous Client',
          mobile: deliveryAddress?.mobile || '',
          district: deliveryAddress?.district || 'Not Set',
          upazila: deliveryAddress?.upazila || '',
          union: deliveryAddress?.union || '',
          area: deliveryAddress?.area || 'Not Set',
          deliveryArea: deliveryAddress?.deliveryArea || 'Not Set',
          address: deliveryAddress?.address || ''
        },
        verification: verificationDetails || undefined
      });

      // Clear draft after confirmed order
      localStorage.removeItem('bazar_pending_draft_order');

      setPlacedOrderSummary({
        orderId,
        paymentMethod: paymentConfig.method,
        bKashSenderNumber: paymentConfig.sender,
        bKashTrxId: paymentConfig.trxId,
        subtotal,
        shippingFee,
        shippingZoneText,
        totalAmount
      });

      setIsBKashModalOpen(false);
      setIsPlacing(false);
      setIsOrderPlaced(true);
    }, 1000);
  };

  const handlePlaceOrder = () => {
    // 1. Delivery address check
    if (!isAddressValid) {
      setShowAddressAlert(true);
      setHighlightAddress(true);
      if (addressSectionRef.current) {
        addressSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    // 2. Route according to selected payment method
    if (paymentMethod === 'bkash') {
      // Open dedicated interactive bKash gateway modal
      setIsBKashModalOpen(true);
    } else {
      // Confirm Cash on Delivery
      finalizeOrderPlacement({
        method: 'cod',
        status: 'Processing (COD)',
        paymentStatus: 'Cash on Delivery (Pending)'
      });
    }
  };

  if (isEditingAddress) {
    return (
      <AddressEditView 
        onBack={() => setIsEditingAddress(false)}
        onSave={(newAddress) => {
          onAddressChange?.(newAddress);
          setIsEditingAddress(false);
        }}
        initialData={deliveryAddress}
      />
    );
  }

  if (isOrderPlaced) {
    return (
      <div className="fixed inset-0 z-[120] bg-background flex flex-col justify-center items-center p-6 text-center animate-in fade-in duration-500 overflow-y-auto">
        <div className="max-w-md w-full bg-white/4 p-8 rounded-3xl border border-primary/20 shadow-2xl space-y-5 flex flex-col items-center relative overflow-hidden my-auto">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full filter blur-3xl -z-10 animate-pulse" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-secondary/10 rounded-full filter blur-3xl -z-10 animate-pulse" />

          {/* Success Check circle */}
          <div className="w-18 h-18 rounded-full bg-primary/15 border border-primary/30 flex items-center justify-center text-primary animate-bounce">
            <Icons.CheckCircle2 size={40} />
          </div>

          <div className="space-y-1.5">
            <h2 className="text-2xl font-black text-white tracking-tight uppercase">{t('order_confirmed_title', 'Order Confirmed!')}</h2>
            <p className="text-xs text-outline font-medium max-w-sm mx-auto leading-relaxed">
              {t('congratulations_prefix', 'Congratulations! Your order for')} <span className="text-white font-bold">{t(product.name, product.name)}</span> {t('congratulations_suffix', 'has been successfully placed.')}
            </p>
            <p className="text-[10px] font-mono text-primary font-bold">
              Order ID: #{placedOrderSummary?.orderId}
            </p>
          </div>

          {/* Payment Method Receipt Card */}
          <div className="p-4 rounded-2xl border w-full text-left space-y-2 bg-white/[0.02] border-white/10">
            <div className="flex items-center justify-between pb-2 border-b border-white/5">
              <span className="text-[10px] font-bold text-outline uppercase tracking-wider">পেমেন্ট মেথড (Payment)</span>
              {placedOrderSummary?.paymentMethod === 'bkash' ? (
                <span className="bg-[#E2136E]/20 text-[#FF4B93] border border-[#E2136E]/30 text-[10px] px-2.5 py-0.5 rounded-full font-black flex items-center gap-1.5">
                  <BKashLogo size={14} className="rounded" /> বিকাশ (bKash)
                </span>
              ) : (
                <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] px-2.5 py-0.5 rounded-full font-black flex items-center gap-1.5">
                  <CodLogo size={14} className="rounded" /> ক্যাশ অন ডেলিভারি (COD)
                </span>
              )}
            </div>

            {/* Pricing Summary in Receipt */}
            <div className="space-y-1.5 text-xs text-zinc-300 py-1 border-b border-white/5">
              <div className="flex justify-between text-[11px]">
                <span className="text-outline">পণ্য মূল্য:</span>
                <span className="font-bold text-white">{formatActiveCurrencyValue(placedOrderSummary?.subtotal || subtotal)}</span>
              </div>
              <div className="flex justify-between text-[11px]">
                <span className="text-outline">ডেলিভারি চার্জ ({placedOrderSummary?.shippingZoneText || shippingZoneText}):</span>
                <span className="font-bold text-emerald-400">{formatActiveCurrencyValue(placedOrderSummary?.shippingFee || shippingFee)}</span>
              </div>
              <div className="flex justify-between text-xs pt-1 border-t border-dashed border-white/10 font-bold">
                <span className="text-white">সর্বমোট মূল্য:</span>
                <span className="font-black text-primary text-sm">{formatActiveCurrencyValue(placedOrderSummary?.totalAmount || totalAmount)}</span>
              </div>
            </div>

            {placedOrderSummary?.paymentMethod === 'bkash' ? (
              <div className="space-y-1 text-xs text-zinc-300 pt-1">
                <p className="flex justify-between">
                  <span className="text-outline text-[11px]">TrxID:</span> 
                  <span className="font-mono font-black text-white bg-white/5 px-2 py-0.5 rounded tracking-wider">
                    {placedOrderSummary?.bKashTrxId === 'PENDING_TRX' ? 'Awaiting TrxID' : placedOrderSummary?.bKashTrxId}
                  </span>
                </p>
                {placedOrderSummary?.bKashSenderNumber && placedOrderSummary?.bKashSenderNumber !== 'Unspecified' && (
                  <p className="flex justify-between">
                    <span className="text-outline text-[11px]">প্রেরক বিকাশ নম্বর:</span> 
                    <span className="font-mono font-bold text-emerald-400">{placedOrderSummary?.bKashSenderNumber}</span>
                  </p>
                )}
                <p className="text-[10.5px] text-outline/80 leading-relaxed pt-1.5 border-t border-dashed border-white/5">
                  💡 আমাদের প্রতিনিধি আপনার TrxID টি বিকাশ স্টেটমেন্টের সাথে ভেরিফাই করে দ্রুত পার্সেল পাঠিয়ে দেবে।
                </p>
              </div>
            ) : (
              <div className="space-y-1 text-xs text-zinc-300 pt-1">
                <p className="text-[10.5px] text-outline/80 leading-relaxed">
                  📦 কুরিয়ার ডেলিভারি বয় পার্সেল পৌঁছে দিলে প্রোডাক্ট হাতে পেয়ে নগদ <strong className="text-white font-mono">{formatActiveCurrencyValue(placedOrderSummary?.totalAmount || totalAmount)}</strong> টাকা পরিশোধ করবেন।
                </p>
              </div>
            )}
          </div>

          {/* Gamified Loyalty update explaining block */}
          <div className="p-3 bg-primary/5 rounded-2xl border border-primary/10 w-full text-left space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-black text-primary uppercase tracking-wider">
              <Icons.Ticket size={13} /> Loyalty Point Added
            </div>
            <p className="text-[10.5px] text-outline leading-normal font-medium">
              This order automatically adds <span className="text-white font-bold">1 extra point</span> to your account and qualifies you for reward coupons.
            </p>
          </div>

          <button
            onClick={onBack}
            className="w-full h-12 bg-primary text-white font-black text-xs uppercase tracking-widest rounded-xl hover:brightness-110 active:scale-95 transition-all shadow-lg cursor-pointer"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[110] bg-background flex flex-col animate-in slide-in-from-right duration-500 overflow-y-auto pb-32 scrollbar-hide">
      {/* TopAppBar */}
      <header className="fixed top-0 left-0 w-full max-w-2xl mx-auto z-50 bg-white/70 backdrop-blur-xl border-b border-white/20 shadow-[0_4px_30px_rgba(5,150,105,0.08)] flex justify-between items-center px-5 h-16">
        <div className="flex items-center gap-3">
          <button 
            onClick={onBack}
            className="p-2 -ml-2 hover:bg-primary/10 transition-colors rounded-full flex items-center justify-center active:scale-95 duration-150 cursor-pointer"
          >
            <Icons.ArrowLeft size={24} className="text-primary" />
          </button>
          <h1 className="text-xl font-bold text-primary tracking-tight">{t('checkout', 'Checkout')}</h1>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-xs font-bold text-on-surface-variant opacity-60">Step 2 of 2</span>
        </div>
      </header>

      {/* Floating Glass Alert Popup for Address */}
      <AnimatePresence>
        {showAddressAlert && (
          <motion.div
            initial={{ opacity: 0, y: -25, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -25, scale: 0.95 }}
            transition={{ type: "spring", damping: 22, stiffness: 350 }}
            className="fixed top-20 left-1/2 -translate-x-1/2 z-[140] w-[92%] max-w-md pointer-events-auto"
          >
            <div className="glass-card bg-zinc-950/85 backdrop-blur-2xl border-2 border-red-500/40 p-4 rounded-2xl shadow-[0_15px_50px_rgba(239,68,68,0.3)] flex items-center justify-between gap-3 text-white">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-11 h-11 rounded-2xl bg-red-500/20 border border-red-500/40 flex items-center justify-center text-red-400 shrink-0 animate-bounce">
                  <Icons.MapPin size={22} />
                </div>
                <div className="min-w-0">
                  <h4 className="text-xs font-black uppercase tracking-wider text-red-400 flex items-center gap-1.5">
                    <span>Address Required</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-ping inline-block" />
                  </h4>
                  <p className="text-xs font-bold text-zinc-100 mt-0.5 truncate">
                    Please set your delivery address.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => {
                    setShowAddressAlert(false);
                    setIsEditingAddress(true);
                  }}
                  className="px-3.5 py-2 bg-gradient-to-r from-emerald-600 to-primary text-white text-[11px] font-black uppercase tracking-wider rounded-xl hover:brightness-110 active:scale-95 transition-all shadow-md flex items-center gap-1 cursor-pointer"
                >
                  Set Now <Icons.ArrowRight size={13} />
                </button>
                <button
                  onClick={() => setShowAddressAlert(false)}
                  className="w-7 h-7 rounded-lg hover:bg-white/10 flex items-center justify-center text-zinc-400 hover:text-white transition-colors cursor-pointer"
                  title="Close"
                >
                  <Icons.X size={16} />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="pt-20 px-5 flex flex-col gap-5 max-w-2xl mx-auto w-full">
        {/* Restored Pending Draft Notice */}
        {restoredDraft && (
          <motion.div 
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card bg-emerald-500/10 border border-emerald-500/30 p-3 rounded-2xl flex items-center justify-between gap-2 text-xs text-emerald-300"
          >
            <div className="flex items-center gap-2">
              <Icons.ShieldCheck size={16} className="text-emerald-400 shrink-0" />
              <span>আপনার আগের ড্রাফট সংরক্ষিত আছে! নিশ্চিত হয়ে অর্ডার সম্পন্ন করুন।</span>
            </div>
            <button 
              onClick={() => setRestoredDraft(false)}
              className="text-emerald-400 hover:text-white text-xs px-2 py-0.5 rounded cursor-pointer"
            >
              ✕
            </button>
          </motion.div>
        )}

        {/* Delivery Address Section */}
        <section ref={addressSectionRef} className="flex flex-col gap-2 relative scroll-mt-24">
          <div className="flex justify-between items-center">
            <h2 className="text-xs font-bold text-on-surface-variant uppercase tracking-wider opacity-60">
              {t('delivery_to', 'Delivery To')}
            </h2>
            {!isAddressValid ? (
              <span className="text-[10px] font-black uppercase tracking-wider text-red-500 bg-red-500/10 px-2 py-0.5 rounded-full flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" /> Not Set (বাধ্যতামূলক)
              </span>
            ) : (
              <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                <Icons.CheckCircle2 size={12} /> {shippingZoneText} (শিপিং: ৳{shippingFee})
              </span>
            )}
          </div>

          <div 
            className={`glass-card p-4 rounded-2xl relative transition-all duration-300 flex justify-between items-start ${
              highlightAddress 
                ? 'ring-2 ring-red-500/80 shadow-[0_8px_30px_rgba(239,68,68,0.25)] border-red-500/50 bg-red-500/5' 
                : 'shadow-[0_4px_30px_rgba(5,150,105,0.08)]'
            }`}
          >
            {/* Animated Glass Pointer Tab Bar with Arrow */}
            {!isAddressValid && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ 
                  opacity: 1, 
                  scale: 1,
                  y: [0, -5, 0] 
                }}
                transition={{ 
                  y: { duration: 1.4, repeat: Infinity, ease: "easeInOut" }
                }}
                className={`absolute -top-3.5 right-4 z-20 flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black tracking-wide uppercase shadow-xl backdrop-blur-xl border ${
                  highlightAddress
                    ? 'bg-zinc-950/90 border-red-500/60 text-red-300 ring-2 ring-red-500/40'
                    : 'bg-zinc-950/85 border-primary/50 text-emerald-300'
                }`}
              >
                <span className="text-sm animate-bounce">👇</span>
                <span>Please set address first</span>
                <motion.span 
                  animate={{ x: [0, 4, 0] }} 
                  transition={{ repeat: Infinity, duration: 0.8 }}
                >
                  <Icons.ArrowRight size={12} className="inline ml-0.5 text-primary" />
                </motion.span>
              </motion.div>
            )}

            <div className="flex gap-3 min-w-0 flex-1 mr-3">
              <div className={`p-2 rounded-xl h-fit shrink-0 transition-colors ${
                !isAddressValid ? 'bg-red-500/10 text-red-500' : 'bg-primary/10 text-primary'
              }`}>
                <Icons.MapPin size={24} />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-sm font-bold text-on-surface truncate">
                  {addressDisplay.fullName || t('no_recipient_set', 'No Recipient Set')}
                </span>
                <p className={`text-on-surface-variant mt-1 leading-relaxed opacity-70 whitespace-pre-line ${deliveryAddress ? 'text-xs' : 'text-sm font-medium'}`}>
                  {deliveryAddress ? addressDisplay.details : t('please_set_address', 'Please set your delivery address')}
                </p>
                {deliveryAddress && (
                  <span className="text-xs font-bold text-primary mt-2">{addressDisplay.mobile}</span>
                )}
              </div>
            </div>

            <div className="flex flex-col items-center gap-1 shrink-0">
              <button 
                onClick={() => setIsEditingAddress(true)}
                className={`font-black text-sm px-5 py-2.5 rounded-xl transition-all shadow-md active:scale-95 flex items-center gap-1.5 cursor-pointer ${
                  !isAddressValid
                    ? 'bg-gradient-to-r from-emerald-600 to-primary text-white ring-2 ring-primary/50 shadow-primary/30 animate-pulse'
                    : 'bg-primary text-white hover:brightness-110'
                }`}
              >
                {deliveryAddress ? t('edit', 'Edit') : (
                  <>
                    <Icons.Plus size={16} strokeWidth={3} />
                    {t('set_address', 'Set Address')}
                  </>
                )}
              </button>
            </div>
          </div>
        </section>

        {/* Order Summary Section */}
        <section className="flex flex-col gap-2">
          <h2 className="text-xs font-bold text-on-surface-variant uppercase tracking-wider opacity-60">Order Summary</h2>
          <div className="glass-card glass-animate p-4 rounded-2xl shadow-[0_4px_30px_rgba(5,150,105,0.08)] flex flex-col gap-4">
            {/* Product Item */}
            <div className="flex gap-4">
              <div className="w-20 h-20 rounded-xl overflow-hidden bg-surface-container flex-shrink-0 border border-white/20">
                <img 
                  src={product.image} 
                  alt={t(product.name, product.name)} 
                  className="w-full h-full object-cover" 
                />
              </div>
              <div className="flex flex-col justify-between py-1 flex-1">
                <div>
                  <h3 className="text-sm font-bold text-on-surface leading-tight">{t(product.name, product.name)}</h3>
                  <p className="text-xs text-on-surface-variant opacity-60">{t('Color_Default', 'Color: Default')}</p>
                </div>
                <div className="flex justify-between items-center w-full mt-1">
                  <span className="text-sm font-bold text-primary">{formatPrice(product.price, product.customPrices)}</span>
                  <span className="text-xs font-bold text-on-surface-variant opacity-60">Qty: {quantity}</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Payment Method Section (Cash on Delivery & bKash ONLY) */}
        <section ref={paymentSectionRef} className="flex flex-col gap-2 scroll-mt-24">
          <div className="flex justify-between items-center">
            <h2 className="text-xs font-bold text-on-surface-variant uppercase tracking-wider opacity-60">
              পেমেন্ট মেথড (Payment Method)
            </h2>
            <span className="text-[10px] text-outline font-bold">নিরাপদ পেমেন্ট ✓</span>
          </div>

          <div className="glass-card p-4 rounded-2xl shadow-[0_4px_30px_rgba(5,150,105,0.08)] flex flex-col gap-3">
            {/* Option 1: Cash on Delivery */}
            <div 
              onClick={() => {
                setPaymentMethod('cod');
              }}
              className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all cursor-pointer ${
                paymentMethod === 'cod'
                  ? 'bg-emerald-500/10 border-emerald-500/60 ring-2 ring-emerald-500/30 shadow-md'
                  : 'bg-white/5 border-white/10 hover:bg-white/10'
              }`}
            >
              <div className="flex items-center gap-3">
                <CodLogo size={42} />
                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-black text-on-surface">Cash on Delivery</span>
                    <span className="bg-emerald-500/20 text-emerald-400 text-[9px] font-black uppercase px-2 py-0.5 rounded-full">
                      হাতে পেয়ে টাকা
                    </span>
                  </div>
                  <span className="text-[11px] text-on-surface-variant opacity-75 mt-0.5">
                    পণ্যটি হাতে পাওয়ার পর ডেলিভারি ম্যানকে ক্যাশ পরিশোধ করুন
                  </span>
                </div>
              </div>
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                paymentMethod === 'cod' ? 'border-emerald-500 bg-emerald-500' : 'border-outline-variant/60'
              }`}>
                {paymentMethod === 'cod' && <div className="w-2 h-2 rounded-full bg-white" />}
              </div>
            </div>

            {/* Option 2: bKash Send Money (Locked as requested) */}
            <div 
              onClick={() => {
                setShowBKashLockNotice(true);
                setTimeout(() => setShowBKashLockNotice(false), 5000);
              }}
              className="relative flex items-center justify-between p-3.5 rounded-2xl border border-white/10 bg-white/[0.02] opacity-70 hover:opacity-85 transition-all cursor-not-allowed select-none group"
            >
              <div className="flex items-center gap-3">
                <div className="relative">
                  <BKashLogo size={42} className="grayscale-[0.3]" />
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-zinc-950 border border-amber-500/50 flex items-center justify-center text-amber-400 shadow-md">
                    <Icons.Lock size={10} />
                  </div>
                </div>
                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-black text-on-surface">bKash (বিকাশ)</span>
                    <span className="bg-amber-500/15 text-amber-400 border border-amber-500/30 text-[9px] font-black uppercase px-2 py-0.5 rounded-full flex items-center gap-1">
                      <Icons.Lock size={9} /> সাময়িক লক (Locked)
                    </span>
                  </div>
                  <span className="text-[11px] text-on-surface-variant opacity-75 mt-0.5">
                    রক্ষণাবেক্ষণের কারণে বিকাশ বর্তমানে সাময়িকভাবে বন্ধ আছে (ক্যাশ অন ডেলিভারি চালু)
                  </span>
                </div>
              </div>
              <div className="w-5 h-5 rounded-full border border-outline-variant/40 flex items-center justify-center text-zinc-400">
                <Icons.Lock size={11} />
              </div>
            </div>

            {/* bKash Lock Toast / Notice */}
            <AnimatePresence>
              {showBKashLockNotice && (
                <motion.div
                  initial={{ opacity: 0, y: -5, height: 0 }}
                  animate={{ opacity: 1, y: 0, height: 'auto' }}
                  exit={{ opacity: 0, y: -5, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-300 text-xs font-bold flex items-center gap-2.5">
                    <Icons.AlertCircle size={16} className="text-amber-400 shrink-0" />
                    <span>⚠️ বিকাশ পেমেন্ট বর্তমানে সাময়িকভাবে বন্ধ রাখা হয়েছে। অনুগ্রহ করে ক্যাশ অন ডেলিভারি (Cash on Delivery) সিলেক্ট করে অর্ডার সম্পন্ন করুন।</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </section>

        {/* Voucher Code Section */}
        <section className="flex flex-col gap-2">
          <h2 className="text-xs font-bold text-on-surface-variant uppercase tracking-wider opacity-60">Promo Code</h2>
          <div className="flex gap-2">
            <div className="glass-card flex-1 flex items-center px-4 rounded-2xl border border-white/20 h-12">
              <Icons.Ticket size={18} className="text-outline mr-2 opacity-50" />
              <input 
                className="bg-transparent border-none focus:ring-0 text-xs font-bold w-full placeholder:text-outline-variant" 
                placeholder="Enter code" 
                type="text" 
              />
            </div>
            <button className="bg-primary/10 text-primary font-black px-6 rounded-2xl text-xs hover:bg-primary/20 transition-all active:scale-95 uppercase tracking-wider cursor-pointer">Apply</button>
          </div>
        </section>

        {/* Pricing Breakdown Section - Location-based Shipping & 0% Tax */}
        <section className="glass-card glass-animate p-5 rounded-3xl shadow-[0_4px_30px_rgba(5,150,105,0.12)] flex flex-col gap-3 mt-1 border-t-4 border-primary/20">
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold text-on-surface-variant opacity-60">{t('subtotal', 'Subtotal')} ({quantity} {quantity > 1 ? 'items' : 'item'})</span>
            <span className="text-xs font-black text-on-surface tabular-nums">{formatPrice(product.price * quantity, product.customPrices ? Object.fromEntries(Object.entries(product.customPrices).map(([k, v]) => [k, (v as number) * quantity])) : undefined)}</span>
          </div>

          {/* Dynamic Shipping Fee */}
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-on-surface-variant opacity-60">{t('shipping_fee', 'Shipping Fee')}</span>
              {isAddressValid ? (
                <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                  {shippingZoneText}
                </span>
              ) : (
                <span className="text-[10px] text-amber-400 font-bold bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full">
                  ঠিকানা দেওয়া হলে যোগ হবে
                </span>
              )}
            </div>
            <span className="text-xs font-black text-on-surface tabular-nums">
              {shippingFee > 0 ? formatActiveCurrencyValue(shippingFee) : '৳০'}
            </span>
          </div>

          {/* 0% Tax as requested */}
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-on-surface-variant opacity-60">{t('tax', 'Tax (EST)')}</span>
              <span className="text-[9px] text-outline font-bold bg-white/5 px-2 py-0.5 rounded-full">
                ০% ফ্রি (Exempted)
              </span>
            </div>
            <span className="text-xs font-black text-emerald-400 tabular-nums">
              ৳০
            </span>
          </div>

          <div className="h-px bg-primary/10 my-2"></div>
          <div className="flex justify-between items-center">
            <span className="text-lg font-black text-on-surface tracking-tighter">{t('total_amount', 'Total Amount')}</span>
            <span className="text-xl font-black text-primary tabular-nums tracking-tighter">
              {formatActiveCurrencyValue(totalAmount)}
            </span>
          </div>
        </section>
      </main>

      {/* Bottom Action Bar (Fixed) */}
      <div className="fixed bottom-0 left-0 w-full z-50 bg-white/70 backdrop-blur-xl border-t border-white/20 shadow-[0_-4px_30px_rgba(5,150,105,0.08)]">
        <div className="max-w-2xl mx-auto px-5 py-4">
          <button 
            onClick={handlePlaceOrder}
            disabled={isPlacing}
            className="w-full h-14 bg-gradient-to-r from-primary to-primary-container text-white font-black rounded-2xl flex items-center justify-center gap-3 shadow-lg shadow-primary/30 hover:brightness-110 active:scale-95 transition-all uppercase tracking-widest text-sm disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
          >
            {isPlacing ? (
              <span className="flex items-center gap-2 animate-pulse">
                <Icons.Sparkles size={18} className="animate-spin" /> {t('processing_order', 'Processing Order...')}
              </span>
            ) : (
              <>
                <CodLogo size={20} className="rounded" />
                <span>{t('place_secure_order', 'Place Secure Order')} ({formatActiveCurrencyValue(totalAmount)})</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Dedicated Interactive bKash Payment Gateway Modal */}
      <BKashPaymentModal
        isOpen={isBKashModalOpen}
        onClose={() => setIsBKashModalOpen(false)}
        totalAmount={totalAmount}
        formattedAmount={formatActiveCurrencyValue(totalAmount)}
        bKashNumber={bKashNumber}
        initialSenderNumber={bKashSenderNumber}
        initialTrxId={bKashTrxId}
        isProcessing={isPlacing}
        onConfirmPayment={(sender, trx, isDraft) => {
          setBKashSenderNumber(sender);
          setBKashTrxId(trx);
          finalizeOrderPlacement({
            method: 'bkash',
            sender,
            trxId: trx,
            status: isDraft ? 'Pending Payment (bKash)' : 'Processing (Paid bKash)',
            paymentStatus: isDraft ? 'Awaiting bKash TrxID' : 'bKash Verification Pending'
          });
        }}
      />
    </div>
  );
}

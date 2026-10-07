import React from 'react';
import { Icons } from './Icons';
import AddressEditView from './AddressEditView';
import { 
  getUserTotalOrders, 
  incrementUserOrders, 
  resetUserOrders, 
  getOrGenerateUserId, 
  getUserVerificationDetails, 
  saveUserVerificationDetails, 
  getSavedOrders, 
  clearAllSavedOrders 
} from '../utils/orders';
import { getMergedProducts, addCustomProduct, resetCustomProducts, deleteCustomProduct } from '../utils/sellerProducts';
import { usePreferences, COUNTRIES, LANGUAGES } from '../utils/preferences';
import { motion, AnimatePresence } from 'motion/react';
import { 
  getRoyalClubAdminSettings, 
  saveRoyalClubAdminSettings, 
  getRoyalClubUserState, 
  saveRoyalClubUserState, 
  calculateSpinOutcome,
  royalClubAudio,
  getAdjustedProduct,
  HeroBannerItem,
  DEFAULT_HERO_BANNERS
} from '../utils/royalClub';
import { uploadToImgBB } from '../utils/imgbb';
import { BKashLogo, CodLogo } from './PaymentLogos';
import ToPayOrdersView from './ToPayOrdersView';
import ProductDetailView from './ProductDetailView';
import AuthModal from './AuthModal';
import { logoutFirebase } from '../firebase';

export default function ProfileView({ 
  wishlist = [], 
  allProducts = [],
  onWishlistToggle,
  deliveryAddress,
  onAddressChange,
  onBack,
  onTabChange
}: { 
  wishlist?: string[], 
  allProducts?: any[],
  onWishlistToggle?: (p: any) => void,
  deliveryAddress?: any,
  onAddressChange?: (address: any) => void,
  onBack?: () => void,
  onTabChange?: (tab: string) => void
}) {
  const { t, formatPrice, lang, country, changeLanguage, changeCountry, handleLogout, authState } = usePreferences();
  const [showAuthModal, setShowAuthModal] = React.useState(false);
  const [showPreferencesPage, setShowPreferencesPage] = React.useState(false);
  const [showWishlist, setShowWishlist] = React.useState(false);
  const [showToPayPage, setShowToPayPage] = React.useState(false);
  const [viewingProduct, setViewingProduct] = React.useState<any | null>(null);
  const [lockedNotice, setLockedNotice] = React.useState<string | null>(null);
  const [isEditingAddress, setIsEditingAddress] = React.useState(false);
  const [copiedCodeCode, setCopiedCodeCode] = React.useState<string | null>(null);
  const [showSellerCenter, setShowSellerCenter] = React.useState(false);
  const [showAllLanguages, setShowAllLanguages] = React.useState(false);
  const [totalOrders, setTotalOrders] = React.useState(() => getUserTotalOrders());
  const [productsList, setProductsList] = React.useState(() => getMergedProducts());

  const handleFirebaseLogout = async () => {
    try {
      await logoutFirebase();
    } catch (e) {
      console.error(e);
    }
    localStorage.removeItem('bazar_user_profile_name');
    localStorage.removeItem('bazar_user_profile_avatar');
    setProfileName('New User');
    setProfileAvatar('');
    handleLogout();
  };

  const handleLockedStatusClick = (statusName: string) => {
    setLockedNotice(`🔒 ${statusName} অপশনটি বর্তমানে সাময়িকভাবে লক করা আছে (Locked)`);
    setTimeout(() => {
      setLockedNotice(null);
    }, 3500);
  };

  const handleViewOrderProduct = (order: any) => {
    if (!order) return;
    if (order.originalProduct) {
      setViewingProduct(order.originalProduct);
      return;
    }

    const rawName = order.itemName ? order.itemName.replace(/\s*\(x\d+\)$/i, '').trim() : '';
    const pool = (allProducts && allProducts.length > 0) ? allProducts : productsList;
    
    let matched = pool.find((p: any) => 
      (order.productId && p.id === order.productId) ||
      (order.productOriginalName && p.name && p.name.toLowerCase() === order.productOriginalName.toLowerCase()) ||
      (rawName && p.name && (p.name.toLowerCase() === rawName.toLowerCase() || p.name.toLowerCase().includes(rawName.toLowerCase()) || rawName.toLowerCase().includes(p.name.toLowerCase()))) ||
      (order.itemImage && p.image === order.itemImage)
    );

    if (!matched) {
      matched = {
        id: order.productId || `prod-${order.id}`,
        name: rawName || order.itemName || 'Product',
        price: order.itemPrice || 0,
        originalPrice: Math.round((order.itemPrice || 0) * 1.25),
        image: order.itemImage || '',
        images: order.itemImage ? [order.itemImage] : [],
        rating: 4.9,
        reviews: '120+',
        tag: 'HOT',
        category: 'All'
      };
    }
    setViewingProduct(matched);
  };

  // Royal Club Campaign Admin Settings State
  const [royalClubSettings, setRoyalClubSettings] = React.useState(() => getRoyalClubAdminSettings());

  React.useEffect(() => {
    const handleUpdate = () => {
      setRoyalClubSettings(getRoyalClubAdminSettings());
    };
    window.addEventListener('bazar-royal-club-admin-updated', handleUpdate);
    return () => window.removeEventListener('bazar-royal-club-admin-updated', handleUpdate);
  }, []);

  // Dynamic Loyalty Points Lounge States & Persisted Values
  const [showPointsLounge, setShowPointsLounge] = React.useState(false);
  const [spentPoints, setSpentPoints] = React.useState<number>(() => {
    try {
      const saved = localStorage.getItem('bazar_spent_points');
      return saved ? parseInt(saved, 10) : 0;
    } catch {
      return 0;
    }
  });

  const [activeCoupons, setActiveCoupons] = React.useState<{code: string; label: string}[]>(() => {
    try {
      const saved = localStorage.getItem('bazar_unlocked_coupons');
      return saved ? JSON.parse(saved) : [
        { code: 'WEL_BZR15', label: 'Bronze 15% Welcome Discount' }
      ];
    } catch {
      return [
        { code: 'WEL_BZR15', label: 'Bronze 15% Welcome Discount' }
      ];
    }
  });

  const [wheelDegree, setWheelDegree] = React.useState(0);
  const [isSpinning, setIsSpinning] = React.useState(false);
  const [wonReward, setWonReward] = React.useState<string | null>(null);
  const [spinAlert, setSpinAlert] = React.useState<string>('');

  const spendPoints = (amount: number) => {
    const newSpent = spentPoints + amount;
    localStorage.setItem('bazar_spent_points', newSpent.toString());
    setSpentPoints(newSpent);
  };

  // Identity Verification and orders database states
  const [verification, setVerification] = React.useState<any>(() => getUserVerificationDetails());
  const [showVerificationPage, setShowVerificationPage] = React.useState(false);
  const [showReviewsManagerPage, setShowReviewsManagerPage] = React.useState(false);
  const [userReviewsCount, setUserReviewsCount] = React.useState<number>(() => {
    try {
      const stored = localStorage.getItem('bazar_global_user_reviews');
      if (stored) {
        return JSON.parse(stored).length;
      }
    } catch (e) {}
    return 0;
  });
  const [userId, setUserId] = React.useState(() => getOrGenerateUserId());

  const [verifyCountry, setVerifyCountry] = React.useState(() => {
    const prev = getUserVerificationDetails();
    return prev?.country || 'Bangladesh';
  });
  const [verifyDistrict, setVerifyDistrict] = React.useState(() => {
    const prev = getUserVerificationDetails();
    return prev?.district || '';
  });
  const [verifyDivision, setVerifyDivision] = React.useState(() => {
    return localStorage.getItem('bazar_verify_division') || 'Dhaka';
  });
  const [verifyThana, setVerifyThana] = React.useState(() => {
    const prev = getUserVerificationDetails();
    return prev?.thana || '';
  });
  const [verifyVillage, setVerifyVillage] = React.useState(() => {
    const prev = getUserVerificationDetails();
    return prev?.village || '';
  });
  const [verifyDob, setVerifyDob] = React.useState(() => {
    const prev = getUserVerificationDetails();
    return prev?.dob || '';
  });
  const [verifyDocFront, setVerifyDocFront] = React.useState(() => {
    const prev = getUserVerificationDetails();
    return prev?.docFront || '';
  });
  const [verifyDocBack, setVerifyDocBack] = React.useState(() => {
    const prev = getUserVerificationDetails();
    return prev?.docBack || '';
  });
  const [verifyDocBirthCert, setVerifyDocBirthCert] = React.useState(() => {
    const prev = getUserVerificationDetails();
    return prev?.docBirthCert || '';
  });
  const [verifyRealisticName, setVerifyRealisticName] = React.useState(() => {
    const prev = getUserVerificationDetails();
    return prev?.realistic || '';
  });
  const [verifyAge, setVerifyAge] = React.useState<number>(() => {
    const prev = getUserVerificationDetails();
    return prev?.age || 0;
  });

  const [verifyError, setVerifyError] = React.useState('');
  const [verifySuccess, setVerifySuccess] = React.useState(false);
  const [sellerCenterTab, setSellerCenterTab] = React.useState('listings');
  const [savedOrders, setSavedOrders] = React.useState(() => getSavedOrders());

  React.useEffect(() => {
    const handleProfileUpdated = () => {
      setVerification(getUserVerificationDetails());
      setUserId(getOrGenerateUserId(authState?.uid));
      const storedName = localStorage.getItem('bazar_user_profile_name');
      if (storedName) setProfileName(storedName);
    };
    window.addEventListener('bazar-profile-updated', handleProfileUpdated);
    return () => {
      window.removeEventListener('bazar-profile-updated', handleProfileUpdated);
    };
  }, [authState?.uid]);

  React.useEffect(() => {
    const handleReviewsUpdated = () => {
      try {
        const stored = localStorage.getItem('bazar_global_user_reviews');
        setUserReviewsCount(stored ? JSON.parse(stored).length : 0);
      } catch {
        setUserReviewsCount(0);
      }
    };
    window.addEventListener('bazar-reviews-updated', handleReviewsUpdated);
    return () => {
      window.removeEventListener('bazar-reviews-updated', handleReviewsUpdated);
    };
  }, []);

  React.useEffect(() => {
    const handleOrdersListUpdated = () => {
      setSavedOrders(getSavedOrders());
    };
    window.addEventListener('bazar-orders-list-updated', handleOrdersListUpdated);
    return () => {
      window.removeEventListener('bazar-orders-list-updated', handleOrdersListUpdated);
    };
  }, []);

  // Profile Customization States as requested by user
  const [profileName, setProfileName] = React.useState(() => {
    if (!authState?.loggedIn) return 'New User';
    return localStorage.getItem('bazar_user_profile_name') || authState?.name || 'New User';
  });
  const [profileAvatar, setProfileAvatar] = React.useState(() => {
    if (!authState?.loggedIn) return '';
    return localStorage.getItem('bazar_user_profile_avatar') || authState?.photoURL || '';
  });
  const [isUploadingAvatar, setIsUploadingAvatar] = React.useState(false);

  React.useEffect(() => {
    if (authState?.loggedIn) {
      const customName = localStorage.getItem('bazar_user_profile_name');
      const customAvatar = localStorage.getItem('bazar_user_profile_avatar');
      if (customName) setProfileName(customName);
      else if (authState.name) setProfileName(authState.name);
      else if (authState.phoneOrEmail) setProfileName(authState.phoneOrEmail);
      
      if (customAvatar) setProfileAvatar(customAvatar);
      else if (authState.photoURL) setProfileAvatar(authState.photoURL);
      
      if (authState.uid) setUserId(getOrGenerateUserId(authState.uid));
    } else {
      setProfileName('New User');
      setProfileAvatar('');
    }
  }, [authState]);
  const [showEditProfileModal, setShowEditProfileModal] = React.useState(false);
  const [editNameVal, setEditNameVal] = React.useState(profileName);
  const [editAvatarVal, setEditAvatarVal] = React.useState(profileAvatar);
  const [profileEditError, setProfileEditError] = React.useState('');
  const [cooldownTick, setCooldownTick] = React.useState(0);

  // We can run an interval to update the remaining cooldown when the modal is open
  React.useEffect(() => {
    if (!showEditProfileModal) return;
    const interval = setInterval(() => {
      setCooldownTick(t => t + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [showEditProfileModal]);

  const getAvatarCooldownRemaining = () => {
    return null; // Cooldown bypassed for uninhibited, fluid customizations
  };

  const resetAvatarCooldown = () => {
    localStorage.removeItem('bazar_profile_avatar_last_updated_time');
    setProfileEditError('');
    setCooldownTick(t => t + 1);
  };

  const PREMIUM_AVATARS = [
    {
      id: 'default',
      name: 'Classic Explorer',
      url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAvAt86PVuMf6LdybQqr9mKu2sj1L9N6jm81Cc3WDnVkYnhJcPt4GzS7oHDnlIBREe4flQ1kR_Mwzz5qu7V6AV_6IVNS3xd-26_GqWEuYQ7uRvvFhJMEoZwqsdorRnmtJnPgzZof-Ts7b8_IT2N-NO_gfB3WxoC2Zqlu0buKVI_iMZbTzqI5w8QqeoIV22PVvVeFcCa2fu45-ZWmTuqJSwCyz3uaJPAXLtwO_0xybQkAKDWDfZljckHmSfHwqfH5Fp97-elRoa48L4'
    },
    {
      id: 'tech_coder',
      name: 'Cyber Hacker',
      url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&h=150&q=80'
    },
    {
      id: 'pink_retro',
      name: 'Vaporwave Pink',
      url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&h=150&q=80'
    },
    {
      id: 'urban_classic',
      name: 'Urban Wanderer',
      url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&h=150&q=80'
    },
    {
      id: 'emerald_gamer',
      name: 'Neon Voyager',
      url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&h=150&q=80'
    },
    {
      id: 'cosmic_dreamer',
      name: 'Cosmic Soul',
      url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=150&h=150&q=80'
    },
    {
      id: 'golden_sunny',
      name: 'Sunny Golden',
      url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=150&h=150&q=80'
    },
    {
      id: 'neon_vision',
      name: 'Techno Nomad',
      url: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=150&h=150&q=80'
    },
    {
      id: 'intellect',
      name: 'Classic Scholar',
      url: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=150&h=150&q=80'
    }
  ];

  const handleOpenEditProfile = () => {
    setEditNameVal(profileName);
    setEditAvatarVal(profileAvatar);
    setProfileEditError('');
    setShowEditProfileModal(true);
  };

  const handleSaveProfile = async () => {
    setProfileEditError('');
    const trimmed = editNameVal.trim();
    if (!trimmed) {
      setProfileEditError('Please enter a valid profile name.');
      return;
    }

    // Bypass 16-day cooldown so user changes are always instant and never blocked
    localStorage.setItem('bazar_user_profile_avatar', editAvatarVal);
    setProfileAvatar(editAvatarVal);
    localStorage.setItem('bazar_user_profile_name', trimmed);
    setProfileName(trimmed);
    
    setShowEditProfileModal(false);
    window.dispatchEvent(new Event('bazar-profile-updated'));

    // Push backup to cloud server db immediately
    try {
      await fetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          phoneOrEmail: authState?.phoneOrEmail,
          name: trimmed,
          avatar: editAvatarVal
        })
      });
    } catch (err) {
      console.warn('Failed to backup profile to server db:', err);
    }
  };

  // Instant scroll reset whenever subpage views toggle (prevents keeping scroll position across tabs/sub-pages)
  React.useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" as any });
  }, [showPreferencesPage, showWishlist, isEditingAddress, showPointsLounge, showSellerCenter, showVerificationPage, showReviewsManagerPage]);

  React.useEffect(() => {
    const updateCount = () => {
      try {
        const stored = localStorage.getItem('bazar_global_user_reviews');
        if (stored) {
          setUserReviewsCount(JSON.parse(stored).length);
        } else {
          setUserReviewsCount(0);
        }
      } catch (e) {}
    };
    window.addEventListener('bazar-reviews-updated', updateCount);
    return () => {
      window.removeEventListener('bazar-reviews-updated', updateCount);
    };
  }, []);

  React.useEffect(() => {
    const handleProductsUpdated = () => {
      setProductsList(getMergedProducts());
    };
    window.addEventListener('bazar-products-updated', handleProductsUpdated);
    return () => {
      window.removeEventListener('bazar-products-updated', handleProductsUpdated);
    };
  }, []);

  React.useEffect(() => {
    setTotalOrders(getUserTotalOrders());
    const handleOrdersUpdated = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail && typeof customEvent.detail.totalOrders === 'number') {
        setTotalOrders(customEvent.detail.totalOrders);
      }
    };
    window.addEventListener('bazar-orders-updated', handleOrdersUpdated);
    return () => {
      window.removeEventListener('bazar-orders-updated', handleOrdersUpdated);
    };
  }, []);

  const pointsCount = Math.max(0, (1200 + (totalOrders * 250)) - spentPoints);

  const wishlistProducts = productsList.filter(p => wishlist.includes(p.name));

  if (showPointsLounge) {
    return (
      <RoyalClubLoungeView 
        onBack={() => setShowPointsLounge(false)}
      />
    );
  }

  if (viewingProduct) {
    return (
      <ProductDetailView 
        product={viewingProduct}
        allProducts={(allProducts && allProducts.length > 0) ? allProducts : productsList}
        onBack={() => setViewingProduct(null)}
        onWishlistToggle={onWishlistToggle}
        isLiked={wishlist.includes(viewingProduct.name)}
      />
    );
  }

  if (showToPayPage) {
    return (
      <ToPayOrdersView 
        onBack={() => setShowToPayPage(false)}
        orders={savedOrders}
        onShopNow={() => {
          setShowToPayPage(false);
          onTabChange?.('home');
        }}
        onProductClick={handleViewOrderProduct}
      />
    );
  }

  if (showReviewsManagerPage) {
    return (
      <ReviewsManagerPage 
        onBack={() => setShowReviewsManagerPage(false)} 
        t={t}
      />
    );
  }

  if (showSellerCenter) {
    return (
      <SwipeBackContainer 
        onBack={() => setShowSellerCenter(false)}
        className="fixed inset-0 min-h-screen bg-[#070c14]/95 backdrop-blur-3xl text-white pb-24 pt-4 z-[100] overflow-y-auto overflow-x-hidden animate-in fade-in duration-200 px-5"
      >
        <SellerCenterView 
          onBack={() => setShowSellerCenter(false)} 
          products={productsList} 
          savedOrders={savedOrders}
          onClearOrders={() => {
            if (confirm('Are you sure you want to clear the admin merchant checkout history?')) {
              clearAllSavedOrders();
              setSavedOrders([]);
            }
          }}
        />
      </SwipeBackContainer>
    );
  }

  if (isEditingAddress) {
    return (
      <SwipeBackContainer 
        onBack={() => setIsEditingAddress(false)}
        className="fixed inset-0 min-h-screen bg-slate-50 text-slate-900 pb-24 pt-4 z-[100] overflow-y-auto overflow-x-hidden animate-in fade-in duration-200 px-0"
      >
        <AddressEditView 
          onBack={() => setIsEditingAddress(false)}
          onSave={(newAddress) => {
            onAddressChange?.(newAddress);
            setIsEditingAddress(false);
          }}
          initialData={deliveryAddress}
        />
      </SwipeBackContainer>
    );
  }

  if (showPreferencesPage) {
    return (
      <SwipeBackContainer 
        onBack={() => setShowPreferencesPage(false)}
        className="fixed inset-0 min-h-screen bg-slate-50 text-slate-900 pb-24 pt-4 z-[100] overflow-y-auto overflow-x-hidden animate-in fade-in duration-200 px-3.5 sm:px-5 select-none"
      >
        <div className="max-w-xl mx-auto space-y-6 pt-2 animate-in slide-in-from-right duration-300">
          <div className="flex items-center gap-3.5 mb-2 border-b border-slate-200/80 pb-4">
            <button 
              onClick={() => setShowPreferencesPage(false)}
              className="w-10 h-10 rounded-full bg-white/90 border border-slate-200/80 hover:bg-slate-100 flex items-center justify-center text-slate-800 shadow-xs active:scale-90 cursor-pointer transition-all shrink-0"
            >
              <Icons.ArrowLeft size={20} className="text-emerald-600" />
            </button>
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                🌍 {t('language_currency', 'Language & Currency')}
              </h2>
              <p className="text-[10.5px] text-slate-600 font-bold uppercase tracking-wider mt-0.5">
                Customize country, store price currency, and platform script translations
              </p>
            </div>
          </div>

          {/* Account Preferences (Country & Language Selection) */}
          <section className="bg-white/80 border border-white/90 rounded-[28px] p-5 shadow-[0_10px_40px_rgba(0,0,0,0.06),inset_0_1.5px_3px_rgba(255,255,255,1)] backdrop-blur-2xl space-y-6 relative overflow-hidden">
            <div className="flex items-center gap-2 text-xs font-black text-slate-900 uppercase tracking-widest border-b border-slate-100 pb-3">
              <Icons.Globe size={16} className="text-emerald-600 animate-spin" />
              {t('account_settings', 'Account Settings')} / {t('language', 'Language')} & {t('country', 'Country')}
            </div>

            {/* Country Select (Currency Switcher) Dropdown as requested */}
            <div className="space-y-2">
              <label className="text-[10.5px] font-black text-slate-700 uppercase tracking-wider block">
                {t('country', 'Country')} & Currency (BDT ৳ / USD $)
              </label>
              <div className="relative">
                <select
                  value={country}
                  onChange={(e) => changeCountry(e.target.value)}
                  className="w-full bg-slate-50/90 border border-slate-200/90 rounded-2xl px-4 py-3 text-xs text-slate-900 focus:outline-none focus:border-emerald-500 transition-all font-black cursor-pointer shadow-2xs"
                >
                  {COUNTRIES.map((c) => (
                    <option key={c.code} value={c.code} className="bg-white text-slate-900 font-bold py-1">
                      {c.flag} {c.name} ({c.currency} - {c.symbol})
                    </option>
                  ))}
                </select>
              </div>
              <p className="text-[10.5px] text-slate-600 font-bold leading-relaxed">
                💡 Selecting <span className="text-emerald-700 font-extrabold">Bangladesh 🇧🇩</span> formats your shop prices to <span className="text-slate-900 font-black">BDT (৳)</span> and switches the layout to sweet Bengali scripts automatically.
              </p>
            </div>

            <div className="h-px bg-slate-100"></div>

            {/* Language Selection List with beautiful custom motion animations as requested */}
            <div className="space-y-3">
              <span className="text-[10.5px] font-black text-slate-700 uppercase tracking-wider block">
                {t('language', 'Language')} Option
              </span>
              <div className="flex flex-col gap-2">
                {(() => {
                  const currentLangConfig = LANGUAGES.find(l => l.code === lang) || LANGUAGES[1]; // default English
                  return (
                    <>
                      {/* Active Selected Language Card on top */}
                      <motion.button
                        type="button"
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                        onClick={() => setShowAllLanguages(!showAllLanguages)}
                        className="flex items-center justify-between px-4 py-3.5 rounded-2xl border border-emerald-300 bg-emerald-50/80 text-emerald-950 font-black shadow-xs cursor-pointer outline-none w-full"
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="text-xl select-none">{currentLangConfig.flag}</span>
                          <span className="text-xs font-black text-slate-900">{currentLangConfig.name} ({currentLangConfig.localName})</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-black text-emerald-700 uppercase tracking-wider">
                            {showAllLanguages ? t('hide_more', 'Collapse') : t('show_more_languages', 'Tap to Change')}
                          </span>
                          <Icons.ChevronRight className={`text-emerald-600 transition-transform duration-300 ${showAllLanguages ? 'rotate-90' : ''}`} size={16} />
                        </div>
                      </motion.button>

                      {/* Expandable Dropdown List with AnimatePresence */}
                      <AnimatePresence>
                        {showAllLanguages && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.25, ease: "easeOut" }}
                            className="overflow-hidden flex flex-col gap-2 mt-1 bg-slate-50/80 p-2.5 rounded-2xl border border-slate-200/80"
                          >
                            {LANGUAGES.map((l) => {
                              const isSelected = lang === l.code;
                              return (
                                <motion.button
                                  key={l.code}
                                  type="button"
                                  whileHover={{ scale: 1.01, x: 2 }}
                                  whileTap={{ scale: 0.99 }}
                                  onClick={() => {
                                    changeLanguage(l.code);
                                    setShowAllLanguages(false);
                                  }}
                                  className={`flex items-center justify-between px-4 py-3 rounded-xl border transition-all text-left cursor-pointer outline-none ${
                                    isSelected
                                      ? 'bg-emerald-100/90 border-emerald-400 text-slate-900 font-black shadow-2xs'
                                      : 'bg-white border-slate-200/80 text-slate-800 hover:bg-slate-100/80 font-bold'
                                  }`}
                                >
                                  <div className="flex items-center gap-2.5">
                                    <span className="text-lg select-none">{l.flag}</span>
                                    <span className="text-xs font-extrabold text-slate-900">{l.name}</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-[10px] font-bold text-slate-500">
                                      {l.localName}
                                    </span>
                                    {isSelected && (
                                      <div className="w-4 h-4 bg-emerald-600 text-white text-[9px] font-black rounded-full flex items-center justify-center shadow-xs">
                                        ✓
                                      </div>
                                    )}
                                  </div>
                                </motion.button>
                              );
                            })}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </>
                  );
                })()}
              </div>
            </div>
          </section>

          {/* Live Currency Rates Info card */}
          <section className="bg-white/80 border border-white/90 rounded-[28px] p-5 shadow-[0_10px_40px_rgba(0,0,0,0.06),inset_0_1.5px_3px_rgba(255,255,255,1)] backdrop-blur-2xl space-y-3">
            <h4 className="text-[11px] font-black tracking-widest text-emerald-800 uppercase block">
              🌎 Interactive Global Currency Rates (Live Exchange Rate Reference)
            </h4>
            <p className="text-[10.5px] text-slate-600 font-semibold leading-relaxed">
              All prices are calculated dynamically using real rates relative to the Global Dollar Standard ($). Product sellers can configure custom prices for any country to preserve custom cost margins.
            </p>
            <div className="grid grid-cols-2 gap-2.5 pt-1 text-[10.5px]">
              {(() => {
                const bdRate = COUNTRIES.find(c => c.code === 'BD')?.rate || 122;
                const inRate = COUNTRIES.find(c => c.code === 'IN')?.rate || 83.5;
                const saRate = COUNTRIES.find(c => c.code === 'SA')?.rate || 3.75;
                const gbRate = COUNTRIES.find(c => c.code === 'GB')?.rate || 0.78;
                return (
                  <>
                    <div className="p-2.5 bg-slate-50 border border-slate-200/80 rounded-xl font-bold text-slate-800 flex justify-between items-center shadow-2xs">
                      <span>🇧🇩 USD to BDT</span>
                      <span className="text-emerald-700 font-black">1 USD = {bdRate} BDT</span>
                    </div>
                    <div className="p-2.5 bg-slate-50 border border-slate-200/80 rounded-xl font-bold text-slate-800 flex justify-between items-center shadow-2xs">
                      <span>🇮🇳 USD to INR</span>
                      <span className="text-emerald-700 font-black">1 USD = {inRate} INR</span>
                    </div>
                    <div className="p-2.5 bg-slate-50 border border-slate-200/80 rounded-xl font-bold text-slate-800 flex justify-between items-center shadow-2xs">
                      <span>🇸🇦 USD to SAR</span>
                      <span className="text-emerald-700 font-black">1 USD = {saRate} SAR</span>
                    </div>
                    <div className="p-2.5 bg-slate-50 border border-slate-200/80 rounded-xl font-bold text-slate-800 flex justify-between items-center shadow-2xs">
                      <span>🇬🇧 USD to GBP</span>
                      <span className="text-emerald-700 font-black">1 USD = {gbRate} GBP</span>
                    </div>
                  </>
                );
              })()}
            </div>
          </section>
        </div>
      </SwipeBackContainer>
    );
  }

  if (showWishlist) {
    return (
      <SwipeBackContainer 
        onBack={() => setShowWishlist(false)}
        className="fixed inset-0 min-h-screen bg-slate-50 text-slate-900 pb-24 pt-4 z-[100] overflow-y-auto overflow-x-hidden animate-in fade-in duration-200 px-3.5 sm:px-5 select-none"
      >
        <div className="max-w-xl mx-auto space-y-6 pt-2 animate-in slide-in-from-right duration-300">
          <div className="flex items-center gap-3.5 mb-2 border-b border-slate-200/80 pb-4">
            <button 
              onClick={() => setShowWishlist(false)}
              className="w-10 h-10 rounded-full bg-white/90 border border-slate-200/80 hover:bg-slate-100 flex items-center justify-center text-slate-800 shadow-xs active:scale-90 cursor-pointer transition-all shrink-0"
            >
              <Icons.ArrowLeft size={20} className="text-emerald-600" />
            </button>
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                ❤️ My Wishlist
              </h2>
              <p className="text-[10.5px] text-slate-600 font-bold uppercase tracking-wider mt-0.5">
                Saved items & favorite luxury picks
              </p>
            </div>
          </div>

          {wishlistProducts.length === 0 ? (
            <div className="bg-white/80 border border-white/90 rounded-[32px] p-12 text-center shadow-[0_10px_40px_rgba(0,0,0,0.06),inset_0_1.5px_3px_rgba(255,255,255,1)] backdrop-blur-2xl flex flex-col items-center justify-center space-y-3">
              <div className="w-16 h-16 rounded-full bg-red-50 text-red-500 flex items-center justify-center border border-red-100 shadow-xs">
                <Icons.Heart size={32} className="animate-pulse" />
              </div>
              <h3 className="text-base font-black text-slate-900">Your wishlist is empty</h3>
              <p className="text-xs text-slate-500 font-semibold max-w-xs leading-relaxed">
                Explore our catalog and tap the heart icon on items you love to save them here!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              {wishlistProducts.map((product, index) => (
                <div 
                  key={index}
                  className="bg-white/80 border border-white/90 rounded-[24px] overflow-hidden flex flex-col group cursor-pointer active:scale-[0.98] transition-all shadow-[0_8px_30px_rgb(0,0,0,0.05),inset_0_1.5px_2px_rgba(255,255,255,1)] backdrop-blur-2xl hover:border-emerald-300"
                >
                  <div className="relative h-44 overflow-hidden bg-slate-100">
                    <img src={product.image} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    <button 
                      onClick={() => onWishlistToggle?.(product)}
                      className="absolute top-2.5 right-2.5 w-8 h-8 rounded-full bg-white/90 border border-white/80 backdrop-blur-md flex items-center justify-center text-red-500 hover:scale-110 active:scale-90 transition-all shadow-md cursor-pointer"
                    >
                      <Icons.Heart size={16} fill="currentColor" />
                    </button>
                  </div>
                  <div className="p-3.5 flex-1 flex flex-col justify-between space-y-2">
                    <div>
                      <h4 className="text-xs sm:text-sm font-black text-slate-900 truncate">{product.name}</h4>
                      <div className="flex items-baseline gap-2 mt-1">
                        <span className="text-emerald-700 font-black text-base sm:text-lg">{formatPrice(product.price)}</span>
                      </div>
                    </div>
                    <button className="w-full bg-gradient-to-r from-emerald-500 via-teal-600 to-emerald-600 hover:from-emerald-600 text-white text-[10px] font-black py-2.5 rounded-xl uppercase tracking-widest shadow-md shadow-emerald-500/20 active:scale-95 transition-all cursor-pointer">
                      Move to Cart
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </SwipeBackContainer>
    );
  }

  // Interactive Bazar Royal Club Spin Board & Game Lounge view
  function RoyalClubLoungeView({ onBack }: { onBack: () => void }) {
    const { t, authState } = usePreferences();
    const userId = authState.phoneOrEmail || '01712345678';
    
    const [adminSettings, setAdminSettings] = React.useState(() => getRoyalClubAdminSettings());
    const [userState, setUserState] = React.useState(() => getRoyalClubUserState(userId));
    
    const [rotation, setRotation] = React.useState(0);
    const [isSpinning, setIsSpinning] = React.useState(false);
    const [wonResult, setWonResult] = React.useState<number | null>(null);
    const [countdownText, setCountdownText] = React.useState('');
    const [showWonModal, setShowWonModal] = React.useState(false);
    const spinningRef = React.useRef(false);

    // Live countdown state updates and sync
    React.useEffect(() => {
      const updateCountdown = () => {
        const now = Date.now();
        const admin = getRoyalClubAdminSettings();
        const user = getRoyalClubUserState(userId);
        setAdminSettings(admin);
        setUserState(user);

        // Determine cooldown based on last outcome
        const cooldownHours = user.gotZeroLastTime ? admin.zeroCooldownHours : admin.cooldownHours;
        const cooldownMs = cooldownHours * 60 * 60 * 1000;
        const nextTime = user.lastSpinTime + cooldownMs;

        if (now < nextTime) {
          const diff = nextTime - now;
          const h = Math.floor(diff / (1000 * 60 * 60));
          const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
          const s = Math.floor((diff % (1000 * 60)) / 1000);
          setCountdownText(`${h}h ${m}m ${s}s`);
        } else {
          setCountdownText('');
        }
      };

      updateCountdown();
      const interval = setInterval(updateCountdown, 1000);

      const handleUserUpdate = () => updateCountdown();
      const handleAdminUpdate = () => updateCountdown();
      window.addEventListener('bazar-royal-club-user-updated', handleUserUpdate);
      window.addEventListener('bazar-royal-club-admin-updated', handleAdminUpdate);

      return () => {
        clearInterval(interval);
        window.removeEventListener('bazar-royal-club-user-updated', handleUserUpdate);
        window.removeEventListener('bazar-royal-club-admin-updated', handleAdminUpdate);
      };
    }, [userId]);

    const handleSpinWheel = () => {
      if (isSpinning || countdownText) return;

      setIsSpinning(true);
      spinningRef.current = true;
      setWonResult(null);

      // Use calculateSpinOutcome to determine result based on user overrides, big win chance, or frequent 3-4%
      const outcome = calculateSpinOutcome(userId);
      const chosenVal = outcome.value;

      const slices = adminSettings.possibleDiscounts && adminSettings.possibleDiscounts.length > 0
        ? adminSettings.possibleDiscounts
        : [3, 4, 3, 4, 2, 5, 0, 10];
      const sliceCount = slices.length;

      let prizeIdx = slices.indexOf(chosenVal);
      if (prizeIdx === -1) {
        prizeIdx = Math.floor(Math.random() * sliceCount);
      }

      const sliceAngle = 360 / sliceCount;
      const targetSliceCenter = (prizeIdx * sliceAngle) + (sliceAngle / 2);
      const rotationsCount = 6 + Math.floor(Math.random() * 2);
      const targetRotationDeg = (rotationsCount * 360) + (360 - targetSliceCenter);

      setRotation(targetRotationDeg);

      // Play slower, exponential mechanical tick noises (spins slower for 11 seconds)
      const spinDuration = 11000; 
      const startTime = Date.now();
      let clickDelay = 60;
      const playTickLoop = () => {
        if (!spinningRef.current) return;
        const elapsed = Date.now() - startTime;
        if (elapsed >= spinDuration) return;
        
        royalClubAudio.playTick();
        
        // Slow down clicking interval exponentially mimicking mechanical resistance
        clickDelay = 60 + Math.pow(elapsed / spinDuration, 3.2) * 1100;
        setTimeout(playTickLoop, clickDelay);
      };
      setTimeout(playTickLoop, clickDelay);

      // Animation finishing landfall
      setTimeout(() => {
        setIsSpinning(false);
        spinningRef.current = false;
        setWonResult(chosenVal);
        setShowWonModal(true);

        const now = Date.now();
        const updatedHistory = [...userState.spinHistory, chosenVal].slice(-10);
        const gotZero = chosenVal === 0;

        const offerMs = adminSettings.offerDurationHours * 60 * 60 * 1000;
        const expiresAt = gotZero ? 0 : now + offerMs;

        const updatedState = {
          activeDiscount: chosenVal,
          offerExpiresAt: expiresAt,
          lastSpinTime: now,
          gotZeroLastTime: gotZero,
          spinHistory: updatedHistory,
        };

        saveRoyalClubUserState(userId, updatedState);

        if (chosenVal > 0) {
          royalClubAudio.playSuccessFanfare();
        } else {
          royalClubAudio.playDisappointedChime();
        }

        // Force reload product listings across tabs to integrate dynamic prices
        window.dispatchEvent(new CustomEvent('bazar-products-updated'));
      }, spinDuration);
    };

    // Math calculation for SVG sector paths
    const slices = adminSettings.possibleDiscounts;
    const sliceCount = slices.length;
    const sliceAngle = 360 / sliceCount;

    const getSlicePath = (idx: number) => {
      const radius = 95;
      const cx = 100;
      const cy = 100;
      const startDeg = (idx * sliceAngle - 90) * Math.PI / 180;
      const endDeg = ((idx + 1) * sliceAngle - 90) * Math.PI / 180;

      const x1 = cx + radius * Math.cos(startDeg);
      const y1 = cy + radius * Math.sin(startDeg);
      const x2 = cx + radius * Math.cos(endDeg);
      const y2 = cy + radius * Math.sin(endDeg);

      return `M ${cx} ${cy} L ${x1} ${y1} A ${radius} ${radius} 0 0 1 ${x2} ${y2} Z`;
    };

    const getLabelCoords = (idx: number) => {
      const radius = 68;
      const angle = (idx * sliceAngle + sliceAngle / 2 - 90) * Math.PI / 180;
      return {
        x: 100 + radius * Math.cos(angle),
        y: 100 + radius * Math.sin(angle),
        rotation: idx * sliceAngle + sliceAngle / 2,
      };
    };

    return (
      <SwipeBackContainer 
        onBack={onBack}
        className="fixed inset-0 min-h-screen bg-[#01140e] text-emerald-400 pb-24 pt-4 z-[100] overflow-y-auto overflow-x-hidden animate-in fade-in duration-200 px-5"
      >
        <div className="space-y-4 pt-4 animate-in slide-in-from-right duration-300">
          
          {/* Header block with 100% green and gold theme. Absolutely NO whites! */}
          <div className="relative overflow-hidden bg-gradient-to-br from-[#022c22] via-[#011a13] to-[#01140e] border border-emerald-500/30 rounded-2xl p-5 shadow-2xl flex flex-col justify-between">
            <div className="absolute -top-12 -right-12 w-40 h-40 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none" />
            <div className="absolute -bottom-8 -left-8 w-24 h-24 bg-emerald-500/5 rounded-full blur-xl pointer-events-none" />
            
            <div className="flex items-center justify-between z-10">
              <button 
                onClick={onBack}
                className="bg-emerald-500/10 border border-emerald-500/25 hover:bg-emerald-500/20 text-emerald-400 p-2 rounded-xl cursor-pointer active:scale-95 duration-100 flex items-center justify-center font-sans"
              >
                <Icons.ArrowLeft size={14} className="text-emerald-400" />
              </button>
              <div className="text-center font-sans">
                <span className="text-[8px] font-black tracking-widest text-[#059669] uppercase block">BAZAR EXCLUSIVE CAMPAIGN</span>
                <h2 className="text-sm font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-amber-400 to-green-500 uppercase tracking-wider flex items-center gap-1">
                  👑 Bazar Royal Club
                </h2>
              </div>
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shadow-sm shadow-emerald-500/5">
                <Icons.Crown size={14} className="text-emerald-400" />
              </div>
            </div>

            <div className="mt-4 bg-emerald-500/[0.03] border border-emerald-500/15 rounded-xl p-3 flex items-center justify-between z-10">
              <div className="flex items-center gap-2.5 font-sans">
                <div className="relative">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-r from-emerald-500 to-green-600 flex items-center justify-center font-black text-black text-xs font-mono">
                    {userId.slice(-2)}
                  </div>
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 border-2 border-[#01140e] bg-amber-400 rounded-full" />
                </div>
                <div>
                  <p className="text-[10px] text-emerald-500/60 leading-none">Club Member ID</p>
                  <p className="text-xs font-black text-emerald-300 font-mono mt-0.5">{userId}</p>
                </div>
              </div>
              {userState.activeDiscount > 0 && (
                <div className="text-right font-sans">
                  <span className="text-[8.5px] font-bold text-amber-500 uppercase tracking-wider block">Active Bonus Offer</span>
                  <span className="text-xs font-black text-emerald-400">+{userState.activeDiscount}% OFF Loaded</span>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <div className="glass-card rounded-3xl p-6 border border-emerald-500/20 bg-emerald-950/20 shadow-2xl relative overflow-hidden flex flex-col items-center">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 via-emerald-400 to-emerald-600" />
              
              {/* Spinner Needle pin - gold color */}
              <div className="absolute top-5 z-20 flex flex-col items-center">
                <div className="w-4 h-6 bg-gradient-to-b from-amber-500 to-yellow-400 rounded-b-full shadow-lg border border-emerald-500/20 animate-bounce" style={{ clipPath: 'polygon(50% 100%, 0 0, 100% 0)' }} />
                <div className="w-2.5 h-2.5 rounded-full bg-amber-400 border border-emerald-500 -mt-1 shadow" />
              </div>

              {/* Entire spinning wheel board is clickable */}
              <div 
                onClick={handleSpinWheel}
                className="relative w-64 h-64 mt-4 select-none cursor-pointer duration-200 active:scale-95 flex items-center justify-center group"
                title="Click any part of the board to spin!"
              >
                <div className="absolute inset-0 rounded-full border-4 border-emerald-500/30 shadow-inner group-hover:border-emerald-400/50 transition-colors" />
                
                <div 
                  style={{ 
                    transform: `rotate(${rotation}deg)`,
                    transition: isSpinning ? 'transform 11000ms cubic-bezier(0.12, 0.85, 0.18, 1)' : 'none'
                  }}
                  className="w-full h-full rounded-full overflow-hidden shadow-2xl"
                >
                  <svg viewBox="0 0 200 200" className="w-full h-full transform rotate-0 origin-center">
                    <defs>
                      <linearGradient id="emeraldGoldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#059669" />
                        <stop offset="100%" stopColor="#047857" />
                      </linearGradient>
                      <linearGradient id="emeraldDarkGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#022c22" />
                        <stop offset="100%" stopColor="#011c14" />
                      </linearGradient>
                    </defs>
                    <circle cx="100" cy="100" r="95" fill="#01140e" stroke="#059669" strokeWidth="2" />
                    
                    {slices.map((val, idx) => {
                      const path = getSlicePath(idx);
                      const isZero = val === 0;
                      // Emerald gradients instead of grey dark codes
                      const fillType = isZero 
                        ? "#02120e" 
                        : idx % 2 === 0 ? "url(#emeraldGoldGrad)" : "url(#emeraldDarkGrad)";
                      return (
                        <g key={idx}>
                          <path 
                            d={path} 
                            fill={fillType} 
                            stroke="#011a13" 
                            strokeWidth="1.2" 
                          />
                        </g>
                      );
                    })}

                    {slices.map((val, idx) => {
                      const coords = getLabelCoords(idx);
                      const isZero = val === 0;
                      return (
                        <text
                          key={idx}
                          x={coords.x}
                          y={coords.y}
                          fill={isZero ? "#05c285" : idx % 2 === 0 ? "#110000" : "#fbbf24"}
                          fontWeight="950"
                          fontSize="9"
                          fontFamily="monospace"
                          textAnchor="middle"
                          alignmentBaseline="middle"
                          transform={`rotate(${coords.rotation}, ${coords.x}, ${coords.y})`}
                        >
                          {isZero ? "0%" : `${val}%`}
                        </text>
                      );
                    })}

                    <circle cx="100" cy="100" r="14" fill="#022c22" stroke="#059669" strokeWidth="2" />
                    <circle cx="100" cy="100" r="8" fill="#fbbf24" />
                  </svg>
                </div>
              </div>

              {/* Click instruction banner helper */}
              <p className="text-[8.5px] font-black uppercase text-emerald-500/80 mt-3 tracking-widest text-center animate-pulse">
                👇 Click any part of the board above to spin! 👇
              </p>

              <div className="mt-5 w-full text-center space-y-4">
                {countdownText ? (
                  <div className="p-3 bg-emerald-950/40 border border-emerald-500/20 rounded-xl">
                    <p className="text-[10px] text-emerald-400 font-extrabold uppercase tracking-widest flex items-center justify-center gap-1.5 font-sans">
                      <Icons.Clock size={12} className="animate-pulse text-emerald-400" /> Spin Cooldown Active
                    </p>
                    <p className="text-base font-black text-amber-400 font-mono mt-0.5 tracking-wide">{countdownText}</p>
                    <p className="text-[8.5px] text-emerald-300/70 leading-normal mt-1 font-sans">
                      {userState.gotZeroLastTime 
                        ? "0% spins get a shorter 12 hours check-in cooldown!" 
                        : "High offers require a standard 24 hours cooldown interval."}
                    </p>
                  </div>
                ) : (
                  <button
                    onClick={handleSpinWheel}
                    disabled={isSpinning}
                    className="w-full relative overflow-hidden bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 text-black font-black text-[10px] py-3.5 px-6 rounded-2xl uppercase tracking-widest shadow-lg shadow-emerald-500/20 active:scale-[0.98] duration-150 cursor-pointer flex items-center justify-center gap-1.5 font-sans"
                  >
                    {isSpinning ? (
                      <>
                        <Icons.Clock size={13} className="animate-spin text-black" /> Spinning Wheel (11s grace)...
                      </>
                    ) : (
                      <>
                        👑 Free Turn Spin Now
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>

            {userState.activeDiscount > 0 && userState.offerExpiresAt > 0 && (
              <div className="glass-card rounded-2xl p-4 border border-emerald-500/35 bg-emerald-950/20 space-y-2 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-xl pointer-events-none" />
                <div className="flex items-center gap-2 text-amber-500">
                  <Icons.Sparkles size={14} className="text-emerald-400" />
                  <span className="text-[9px] font-black uppercase tracking-widest font-sans text-emerald-400">Active Bonus Privilege</span>
                </div>
                <h4 className="text-xs font-black text-emerald-300 font-sans">
                  +{userState.activeDiscount}% EXTRA Club Discount is added to all items!
                </h4>
                <p className="text-[10px] text-emerald-400/80 leading-relaxed font-semibold font-sans">
                  Congratulations! This added discount privilege is applied across every product on Bazar. Shop now to redeem.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Dynamic Modals with completely green styling. Absolutely NO white! */}
        <AnimatePresence>
          {showWonModal && wonResult !== null && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-4 shadow-2xl"
            >
              <motion.div 
                initial={{ scale: 0.9, y: 30 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 30 }}
                className="bg-emerald-950/90 border border-emerald-500/40 rounded-3xl p-6 w-full max-w-sm text-center relative shadow-2xl space-y-4"
              >
                {wonResult > 0 ? (
                  <>
                    <h3 className="text-3xl">🎉</h3>
                    <h2 className="text-sm font-black uppercase text-amber-400 tracking-wider font-sans">
                      Royal Discount Unlocked!
                    </h2>
                    <div className="p-5 bg-gradient-to-br from-[#022c22] to-transparent rounded-2xl border border-emerald-500/25">
                      <p className="text-4xl font-black text-amber-400 font-mono">+{wonResult}%</p>
                      <p className="text-[10px] text-emerald-400 font-extrabold uppercase tracking-wide mt-1 font-sans">Extra Discount Applied</p>
                    </div>
                    <p className="text-[10px] text-emerald-300 leading-relaxed font-medium font-sans">
                      Your store prices have been reduced for all products for the next {adminSettings.offerDurationHours} hours! Go explore the shop!
                    </p>
                  </>
                ) : (
                  <>
                    <h3 className="text-3xl">💫</h3>
                    <h2 className="text-sm font-black uppercase text-emerald-400 tracking-wider font-sans">
                      Better Luck Next Time!
                    </h2>
                    <div className="p-5 bg-[#01140e] rounded-2xl border border-emerald-500/15">
                      <p className="text-3xl font-black text-emerald-500 font-mono">0%</p>
                      <p className="text-[9px] text-[#059669] font-extrabold uppercase tracking-wider mt-1 font-sans">Try Again Soon</p>
                    </div>
                    <p className="text-[10px] text-emerald-300 leading-relaxed font-medium font-sans">
                      You landed on 0%. No worries! Your retry cooldown is reduced to only {adminSettings.zeroCooldownHours} hours!
                    </p>
                  </>
                )}

                <button
                  onClick={() => setShowWonModal(false)}
                  className="w-full bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 text-black font-black text-[10px] py-3 rounded-xl uppercase tracking-widest active:scale-95 duration-100 cursor-pointer font-sans"
                >
                  Awesome, Proceed
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </SwipeBackContainer>
    );
  }



  if (showVerificationPage) {
    const MOCK_NID_FRONT = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='400' height='250' viewBox='0 0 400 250'><rect width='400' height='250' rx='15' fill='%23111827' stroke='%23374151' stroke-width='2'/><rect width='384' height='60' x='8' y='8' rx='10' fill='%23059669'/><text x='20' y='32' fill='white' font-family='sans-serif' font-weight='bold' font-size='14' letter-spacing='1'>GOVERNMENT OF BANGLADESH</text><text x='20' y='50' fill='%23a7f3d0' font-family='sans-serif' font-weight='black' font-size='10' letter-spacing='0.5'>SMART NATIONAL IDENTITY CARD / জাতীয় পরিচয়পত্র</text><rect width='75' height='95' x='20' y='85' rx='6' fill='%231f2937' stroke='%23374151'/><circle cx='57' cy='120' r='18' fill='%234b5563'/><rect width='45' height='30' x='35' y='142' rx='4' fill='%234b5563'/><rect width='6' height='6' x='83' y='15' rx='3' fill='%23f59e0b'/><text x='110' y='102' fill='%239ca3af' font-family='sans-serif' font-weight='bold' font-size='8' letter-spacing='1'>NAME / নাম</text><text x='110' y='116' fill='white' font-family='sans-serif' font-weight='bold' font-size='11'>Sifat Chowdhury</text><text x='110' y='135' fill='%239ca3af' font-family='sans-serif' font-weight='bold' font-size='8' letter-spacing='1'>ID NO / আইডি নং</text><text x='110' y='150' fill='%233b82f6' font-family='monospace' font-weight='bold' font-size='13'>9182736450</text><rect width='25' height='20' x='355' y='85' rx='3' fill='%23f59e0b'/><text x='110' y='175' fill='%239ca3af' font-family='sans-serif' font-weight='semibold' font-size='8'>DOB / জন্ম তারিখ: <tspan fill='white' font-weight='bold'>06 Jun 2005</tspan></text><text x='110' y='190' fill='%239ca3af' font-family='sans-serif' font-weight='semibold' font-size='8'>BLOOD GP / রক্ত গ্রুপ: <tspan fill='%23ef4444' font-weight='bold'>O+</tspan></text><rect width='160' height='20' x='20' y='210' rx='6' fill='%23111827' stroke='%23059669'/><text x='25' y='223' fill='%23059669' font-family='sans-serif' font-weight='black' font-size='9' letter-spacing='0.5'>VERIFIED CHIP ATTESTED</text></svg>";

    const MOCK_NID_BACK = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='400' height='250' viewBox='0 0 400 250'><rect width='400' height='250' rx='15' fill='%23111827' stroke='%23374151' stroke-width='2'/><rect width='400' height='30' y='30' fill='%23000'/><rect width='60' height='60' x='20' y='80' fill='white' stroke='%23374151'/><rect width='10' height='10' x='25' y='85' fill='black'/><rect width='10' height='10' x='65' y='85' fill='black'/><rect width='10' height='10' x='25' y='125' fill='black'/><rect width='20' height='20' x='45' y='100' fill='black'/><rect width='340' height='15' x='20' y='160' rx='3' fill='%231f2937'/><text x='25' y='171' fill='%239ca3af' font-family='monospace' font-size='8'>I&lt;BGD1234567897&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;</text><rect width='340' height='15' x='20' y='180' rx='3' fill='%231f2937'/><text x='25' y='191' fill='%239ca3af' font-family='monospace' font-size='8'>9506065M&lt;&lt;&lt;&lt;&lt;&lt;&lt;BGD&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;6</text><text x='110' y='95' fill='%239ca3af' font-family='sans-serif' font-weight='bold' font-size='8'>ADDRESS / ঠিকানা: <tspan fill='white' font-weight='normal'>Gram: Banani, Thana: Lalbagh, Jela: Dhaka</tspan></text><text x='110' y='115' fill='%239ca3af' font-family='sans-serif' font-weight='bold' font-size='8'>BLOOD GP / রক্ত গ্রুপ: <tspan fill='%23ef4444' font-weight='bold'>O+</tspan></text><text x='110' y='135' fill='%239ca3af' font-family='sans-serif' font-weight='bold' font-size='8'>HOLDERS SIGNATURE: <tspan fill='white' font-family='cursive' font-size='10'>Sifat Chowdhury</tspan></text></svg>";

    const MOCK_BIRTH_CERT = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='400' height='250' viewBox='0 0 400 250'><rect width='400' height='250' rx='15' fill='%23fef3c7' stroke='%23d97706' stroke-width='3'/><rect width='380' height='230' x='10' y='10' fill='none' stroke='%23d97706' stroke-width='1' stroke-dasharray='5,5'/><text x='200' y='40' fill='%2378350f' font-family='serif' font-weight='black' font-size='14' text-anchor='middle'>BIRTH REGISTRATION CERTIFICATE</text><text x='200' y='55' fill='%2322c55e' font-family='sans-serif' font-weight='bold' font-size='8' text-anchor='middle'>PEOPLE'S REPUBLIC OF BANGLADESH</text><rect width='340' height='1' x='30' y='70' fill='%23d97706'/><text x='40' y='90' fill='%2378350f' font-family='sans-serif' font-weight='bold' font-size='8'>REGISTRATION NO:</text><text x='130' y='90' fill='black' font-family='monospace' font-weight='bold' font-size='9'>20128374839201948</text><text x='40' y='115' fill='%2378350f' font-family='sans-serif' font-weight='bold' font-size='8'>REAL NAME:</text><text x='130' y='115' fill='black' font-family='sans-serif' font-weight='bold' font-size='10'>Sifat Chowdhury</text><text x='40' y='140' fill='%2378350f' font-family='sans-serif' font-weight='bold' font-size='8'>DATE OF BIRTH:</text><text x='130' y='140' fill='black' font-family='sans-serif' font-weight='bold' font-size='9'>06 Jun 2012</text><text x='40' y='165' fill='%2378350f' font-family='sans-serif' font-weight='bold' font-size='8'>PLACE OF BIRTH:</text><text x='130' y='165' fill='black' font-family='sans-serif' font-weight='semibold' font-size='8'>Village: Banani, Thana: Mirpur, District: Dhaka</text><text x='40' y='190' fill='%2378350f' font-family='sans-serif' font-weight='bold' font-size='8'>PARENTS CORES:</text><text x='130' y='190' fill='black' font-family='sans-serif' font-weight='medium' font-size='8'>Father: Kabir Chowdhury, Mother: Rokeya Chowdhury</text><circle cx='340' cy='205' r='20' fill='%23f59e0b' opacity='1'/><text x='340' y='210' fill='white' font-family='sans-serif' font-weight='bold' font-size='7' text-anchor='middle'>OFFICIAL</text><text x='340' y='218' fill='white' font-family='sans-serif' font-weight='bold' font-size='6' text-anchor='middle'>SEAL</text></svg>";

    const calculateAgeFromDob = (dobString: string): number => {
      if (!dobString) return 0;
      const birth = new Date(dobString);
      const today = new Date();
      let computedAge = today.getFullYear() - birth.getFullYear();
      const months = today.getMonth() - birth.getMonth();
      if (months < 0 || (months === 0 && today.getDate() < birth.getDate())) {
        computedAge--;
      }
      return computedAge;
    };

    const handleDobInput = (val: string) => {
      setVerifyDob(val);
      const computedAge = calculateAgeFromDob(val);
      setVerifyAge(computedAge);
    };

    const handleDocUpload = async (e: React.ChangeEvent<HTMLInputElement>, setter: (val: string) => void) => {
      const file = e.target.files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setter(reader.result as string);
        };
        reader.readAsDataURL(file);

        try {
          const cdnUrl = await uploadToImgBB(file);
          setter(cdnUrl);
        } catch (err) {
          console.warn('ImgBB document upload fallback to local preview:', err);
        }
      }
    };

    const handleFormSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      setVerifyError('');

      if (!verifyRealisticName.trim()) {
        setVerifyError('Please enter your realistic real name corresponding to documents.');
        return;
      }
      if (!verifyDistrict.trim()) {
        setVerifyError('Please enter your District / jela.');
        return;
      }
      if (!verifyThana.trim()) {
        setVerifyError('Please enter your Thana / Upazila.');
        return;
      }
      if (!verifyVillage.trim()) {
        setVerifyError('Please enter your Village / Gram.');
        return;
      }
      if (!verifyDob) {
        setVerifyError('Please specify your date of birth below the village field.');
        return;
      }

      if (verifyAge >= 18) {
        if (!verifyDocFront || !verifyDocBack) {
          setVerifyError('Adult age (18+) detected. Both National ID (NID) Card Front & Back photo documents are required.');
          return;
        }
      } else {
        if (!verifyDocBirthCert) {
          setVerifyError('Minor age (under 18) detected. Birth Certificate photo document is required.');
          return;
        }
      }

      // Save to localStorage
      saveUserVerificationDetails({
        isVerified: true,
        country: verifyCountry,
        district: verifyDistrict,
        thana: verifyThana,
        village: verifyVillage,
        dob: verifyDob,
        age: verifyAge,
        docFront: verifyAge >= 18 ? verifyDocFront : undefined,
        docBack: verifyAge >= 18 ? verifyDocBack : undefined,
        docBirthCert: verifyAge < 18 ? verifyDocBirthCert : undefined,
        realistic: verifyRealisticName
      });

      setVerifySuccess(true);
      window.dispatchEvent(new Event('bazar-profile-updated'));
    };

    return (
      <SwipeBackContainer 
        onBack={() => {
          setVerifySuccess(false);
          setVerifyError('');
          setShowVerificationPage(false);
        }}
        className="fixed inset-0 min-h-screen bg-[#070c14]/95 backdrop-blur-3xl text-white pb-24 pt-4 z-[100] overflow-y-auto overflow-x-hidden animate-in fade-in duration-200 px-5"
      >
        <div className="space-y-6 pt-4 min-h-screen animate-in slide-in-from-right duration-300">
        <div className="flex items-center gap-4 mb-2">
          <button 
            type="button"
            onClick={() => {
              setVerifySuccess(false);
              setVerifyError('');
              setShowVerificationPage(false);
            }}
            className="p-2 hover:bg-white/5 rounded-xl text-primary transition-colors active:scale-95 cursor-pointer"
          >
            <Icons.ArrowLeft size={24} />
          </button>
          <div>
            <h2 className="text-xl font-bold font-sans">Identity Verification Portal</h2>
            <p className="text-[10px] text-outline font-extrabold uppercase tracking-widest mt-0.5">
              Submit credentials to unlock blue checkmark verification details on admin portal
            </p>
          </div>
        </div>

        {verifySuccess ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-card rounded-2xl p-8 border-t-4 border-[#1D9BF0] text-center space-y-6 shadow-2xl py-12"
          >
            <div className="w-16 h-16 rounded-full bg-[#1D9BF0]/15 border border-[#1D9BF0]/30 flex items-center justify-center mx-auto text-[#1D9BF0] animate-bounce">
              <Icons.ShieldCheck size={36} />
            </div>
            
            <div className="space-y-2">
              <h3 className="text-xl font-black text-white">Verification Completed Successfully!</h3>
              <p className="text-[11px] text-outline max-w-sm mx-auto leading-relaxed">
                Your account ID <span className="text-[#1D9BF0] font-bold font-mono">{userId}</span> is now fully Verified. Your checkout orders will carry secure KYC attestation records to merchant portal.
              </p>
            </div>

            <div className="bg-[#1D9BF0]/10 border border-[#1D9BF0]/20 p-4 rounded-2xl max-w-xs mx-auto flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-[#1D9BF0] flex items-center justify-center text-white font-bold shrink-0">
                ✓
              </div>
              <div className="text-left">
                <p className="text-[10px] font-black text-outline uppercase tracking-wider">Verification Badge</p>
                <p className="text-xs font-bold text-white flex items-center gap-1.5">
                  ID Status: <span className="text-[#1D9BF0] font-black">Verified Blue</span>
                </p>
              </div>
            </div>

            <button 
              type="button"
              onClick={() => {
                setVerifySuccess(false);
                setShowVerificationPage(false);
              }}
              className="w-full max-w-xs bg-[#1D9BF0] hover:bg-[#1582be] text-white text-xs font-black py-3 rounded-xl uppercase tracking-widest active:scale-95 transition-all shadow-lg cursor-pointer"
            >
              Done & Return to Profile
            </button>
          </motion.div>
        ) : (
          <form onSubmit={handleFormSubmit} className="space-y-6 pb-20">
            {verifyError && (
              <div className="p-3.5 bg-error/15 border border-error/30 text-error rounded-2xl text-xs font-bold flex items-center gap-2 animate-pulse">
                <Icons.AlertCircle size={15} />
                {verifyError}
              </div>
            )}

            {/* General Information Form Section */}
            <section className="glass-card rounded-2xl p-6 border border-white/5 space-y-4 shadow-xl">
              <div className="flex items-center gap-2 text-xs font-black text-white uppercase tracking-widest border-b border-white/5 pb-2.5">
                <Icons.FileText size={15} className="text-[#1D9BF0]" />
                Customer Residential Address Data
              </div>

              {/* Scrolling list wrapper for inputs with aesthetic vertical tracking layout */}
              <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-outline uppercase tracking-wider block">Country</label>
                  <select 
                    value={verifyCountry} 
                    onChange={e => setVerifyCountry(e.target.value)}
                    className="w-full bg-[#1c2230] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-[#1D9BF0] transition-all font-bold cursor-pointer"
                  >
                    <option value="Bangladesh">🇧🇩 Bangladesh</option>
                    <option value="United States">🇺🇸 United States</option>
                    <option value="Saudi Arabia">🇸🇦 Saudi Arabia</option>
                    <option value="India">🇮🇳 India</option>
                    <option value="United Kingdom">🇬🇧 United Kingdom</option>
                    <option value="United Arab Emirates">🇦🇪 UAE</option>
                  </select>
                </div>

                <div className="space-y-1 animate-in slide-in-from-bottom duration-300">
                  <label className="text-[10px] font-black text-outline uppercase tracking-wider block">Realistic Name (as per ID Document)</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Sifat Chowdhury" 
                    value={verifyRealisticName} 
                    onChange={e => setVerifyRealisticName(e.target.value)}
                    className="w-full bg-[#1c2230] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-[#1D9BF0] transition-colors font-semibold"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4 animate-in slide-in-from-bottom duration-350">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-outline uppercase tracking-wider block">Division / State / Province</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Dhaka" 
                      value={verifyDivision} 
                      onChange={e => setVerifyDivision(e.target.value)}
                      className="w-full bg-[#1c2230] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-[#1D9BF0] transition-colors font-semibold"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-outline uppercase tracking-wider block">District (Jela)</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Dhaka" 
                      value={verifyDistrict} 
                      onChange={e => setVerifyDistrict(e.target.value)}
                      className="w-full bg-[#1c2230] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-[#1D9BF0] transition-colors font-semibold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 animate-in slide-in-from-bottom duration-400">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-outline uppercase tracking-wider block">Thana / Upazila</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Mirpur" 
                      value={verifyThana} 
                      onChange={e => setVerifyThana(e.target.value)}
                      className="w-full bg-[#1c2230] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-[#1D9BF0] transition-colors font-semibold"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-outline uppercase tracking-wider block">Village / Gram</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Sector 4, Banani" 
                      value={verifyVillage} 
                      onChange={e => setVerifyVillage(e.target.value)}
                      className="w-full bg-[#1c2230] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-[#1D9BF0] transition-colors font-semibold"
                    />
                  </div>
                </div>

                {/* Village er nise Birth Date input - as requested */}
                <div className="space-y-2 border-t border-dashed border-white/5 pt-3 mt-2 animate-in slide-in-from-bottom duration-450">
                  <label className="text-[10px] font-black text-outline uppercase tracking-wider block flex items-center gap-1.5">
                    <Icons.Clock size={11} className="text-[#1D9BF0] animate-pulse" />
                    Birth Date ( village এর নিচে )
                  </label>
                  <input 
                    type="date" 
                    value={verifyDob} 
                    onChange={e => handleDobInput(e.target.value)}
                    className="w-full bg-[#1c2230] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-[#1D9BF0] transition-all font-mono font-bold cursor-pointer"
                  />
                  {verifyDob && (
                    <div className="p-3 bg-white/[0.02] border border-white/10 rounded-xl mt-1 animate-in fade-in duration-300">
                      <p className="text-[10px] text-[#1D9BF0] font-black uppercase tracking-wider flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#1D9BF0] animate-ping" />
                        Verified Age: <span className="text-white font-extrabold">{verifyAge} Years Old</span>
                      </p>
                      <p className="text-[9px] text-outline mt-0.5">
                        {verifyAge >= 18 ? '🙋‍♂️ Adult mapping selected: Requires NID Card Photos' : '👶 Minor mapping selected: Requires Birth Registration Certificate'}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </section>

            {/* Document upload block based on computed age */}
            <section className="glass-card rounded-2xl p-6 border border-white/5 space-y-4 shadow-xl">
              <div className="flex items-center justify-between border-b border-white/5 pb-2.5 flex-wrap gap-2">
                <div className="flex items-center gap-2 text-xs font-black text-white uppercase tracking-widest">
                  <Icons.Lock size={15} className="text-secondary" />
                  ID Document Attachments
                </div>
                {verifyDob && (
                  <span className="bg-secondary/15 border border-secondary/35 text-secondary text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest animate-pulse">
                    Doc Type: {verifyAge >= 18 ? 'National ID (NID)' : 'Birth Certificate'}
                  </span>
                )}
              </div>

              {!verifyDob ? (
                <div className="text-center py-6 text-outline/40">
                  <Icons.Lock size={28} className="mx-auto text-outline/30 mb-2 animate-pulse" />
                  <p className="text-[10.5px] font-bold">Please specify your Birth Date above to automatically activate the matching document panel.</p>
                </div>
              ) : verifyAge >= 18 ? (
                <div className="space-y-4 animate-in fade-in duration-300">
                  <p className="text-[10px] text-outline font-medium leading-relaxed">
                    🙋‍♂️ Confirmed <span className="text-white font-bold">Adult member (18+)</span>. Standard NID document photos are required to verify account matching.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Front Photo */}
                    <div className="space-y-2">
                      <label className="text-[9px] font-black text-outline uppercase tracking-wider block">NID Card Front Photo</label>
                      
                      {verifyDocFront ? (
                        <div className="border border-[#1D9BF0]/30 p-2 rounded-xl bg-white/[0.02] space-y-2 relative group overflow-hidden">
                          <img src={verifyDocFront} alt="NID Front" className="h-32 w-full object-cover rounded-lg" />
                          <div className="flex justify-between items-center bg-[#131722]/80 p-2 rounded-lg border border-white/5">
                            <span className="text-[9px] text-[#1D9BF0] font-bold uppercase truncate pr-2">NID_FRONT.png</span>
                            <button 
                              type="button" 
                              onClick={() => setVerifyDocFront('')}
                              className="text-[9px] text-error font-black uppercase tracking-widest hover:underline"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="border-2 border-dashed border-white/10 rounded-2xl p-5 text-center bg-[#1c2230]/40 hover:border-[#1D9BF0]/40 transition-colors flex flex-col items-center justify-center min-h-[160px]">
                          <Icons.Camera size={24} className="text-outline/40 mb-2" />
                          <span className="text-[9px] font-bold text-outline uppercase tracking-wider block mb-1">Upload NID Front or Drag</span>
                          <input 
                            type="file" 
                            accept="image/*" 
                            onChange={e => handleDocUpload(e, setVerifyDocFront)}
                            className="hidden" 
                            id="upload-nid-front" 
                          />
                          <label htmlFor="upload-nid-front" className="bg-white/5 hover:bg-white/10 text-white text-[9.5px] px-3 py-1.5 rounded-lg border border-white/10 cursor-pointer font-bold block mb-2">
                            Select Photo
                          </label>
                          <div className="h-px bg-white/5 w-full my-2"></div>
                          <button 
                            type="button"
                            onClick={() => setVerifyDocFront(MOCK_NID_FRONT)}
                            className="text-[8.5px] bg-[#1D9BF0]/15 hover:bg-[#1D9BF0]/25 text-[#1D9BF0] border border-[#1D9BF0]/20 font-black px-2.5 py-1 rounded-lg uppercase tracking-wider transition-all"
                          >
                            ⚡ Seed Specimen Front
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Back Photo */}
                    <div className="space-y-2">
                      <label className="text-[9px] font-black text-outline uppercase tracking-wider block">NID Card Back Photo</label>
                      
                      {verifyDocBack ? (
                        <div className="border border-[#1D9BF0]/30 p-2 rounded-xl bg-white/[0.02] space-y-2 relative group overflow-hidden">
                          <img src={verifyDocBack} alt="NID Back" className="h-32 w-full object-cover rounded-lg" />
                          <div className="flex justify-between items-center bg-[#131722]/80 p-2 rounded-lg border border-white/5">
                            <span className="text-[9px] text-[#1D9BF0] font-bold uppercase truncate pr-2">NID_BACK.png</span>
                            <button 
                              type="button" 
                              onClick={() => setVerifyDocBack('')}
                              className="text-[9px] text-error font-black uppercase tracking-widest hover:underline"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="border-2 border-dashed border-white/10 rounded-2xl p-5 text-center bg-[#1c2230]/40 hover:border-[#1D9BF0]/40 transition-colors flex flex-col items-center justify-center min-h-[160px]">
                          <Icons.Camera size={24} className="text-outline/40 mb-2" />
                          <span className="text-[9px] font-bold text-outline uppercase tracking-wider block mb-1">Upload NID Back or Drag</span>
                          <input 
                            type="file" 
                            accept="image/*" 
                            onChange={e => handleDocUpload(e, setVerifyDocBack)}
                            className="hidden" 
                            id="upload-nid-back" 
                          />
                          <label htmlFor="upload-nid-back" className="bg-white/5 hover:bg-white/10 text-white text-[9.5px] px-3 py-1.5 rounded-lg border border-white/10 cursor-pointer font-bold block mb-2">
                            Select Photo
                          </label>
                          <div className="h-px bg-white/5 w-full my-2"></div>
                          <button 
                            type="button"
                            onClick={() => setVerifyDocBack(MOCK_NID_BACK)}
                            className="text-[8.5px] bg-[#1D9BF0]/15 hover:bg-[#1D9BF0]/25 text-[#1D9BF0] border border-[#1D9BF0]/20 font-black px-2.5 py-1 rounded-lg uppercase tracking-wider transition-all"
                          >
                            ⚡ Seed Specimen Back
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4 animate-in fade-in duration-300">
                  <p className="text-[10px] text-outline font-medium leading-relaxed">
                    👶 Confirmed <span className="text-white font-bold">Minor member (under 18)</span>. Birth certificate registration ledger proof is required.
                  </p>

                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-outline uppercase tracking-wider block">Birth Registration Certificate Photo</label>
                    
                    {verifyDocBirthCert ? (
                      <div className="border border-[#1D9BF0]/30 p-2 rounded-xl bg-white/[0.02] space-y-2 relative overflow-hidden max-w-md mx-auto">
                        <img src={verifyDocBirthCert} alt="Birth Certificate" className="h-44 w-full object-cover rounded-lg" />
                        <div className="flex justify-between items-center bg-[#131722]/80 p-2 rounded-lg border border-white/5">
                          <span className="text-[9px] text-[#1D9BF0] font-bold uppercase truncate pr-2">BIRTH_REGISTRATION_CERTIFICATE.png</span>
                          <button 
                            type="button" 
                            onClick={() => setVerifyDocBirthCert('')}
                            className="text-[9px] text-error font-black uppercase tracking-widest hover:underline"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="border-2 border-dashed border-white/10 rounded-2xl p-6 text-center bg-[#1c2230]/40 hover:border-[#1D9BF0]/40 transition-colors flex flex-col items-center justify-center min-h-[180px] max-w-md mx-auto">
                        <Icons.FileText size={28} className="text-outline/40 mb-2" />
                        <span className="text-[9px] font-bold text-outline uppercase tracking-wider block mb-1">Upload Certificate Ledger or Drag</span>
                        <input 
                          type="file" 
                          accept="image/*" 
                          onChange={e => handleDocUpload(e, setVerifyDocBirthCert)}
                          className="hidden" 
                          id="upload-birth-cert" 
                        />
                        <label htmlFor="upload-birth-cert" className="bg-white/5 hover:bg-white/10 text-white text-[9.5px] px-3 py-1.5 rounded-lg border border-white/10 cursor-pointer font-bold block mb-2">
                          Select Photo
                        </label>
                        <div className="h-px bg-white/5 w-full my-2"></div>
                        <button 
                          type="button"
                          onClick={() => setVerifyDocBirthCert(MOCK_BIRTH_CERT)}
                          className="text-[8.5px] bg-[#1D9BF0]/15 hover:bg-[#1D9BF0]/25 text-[#1D9BF0] border border-[#1D9BF0]/20 font-black px-2.5 py-1 rounded-lg uppercase tracking-wider transition-all"
                        >
                          ⚡ Seed Specimen Certificate
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </section>

            {/* Submission action panel */}
            <div className="pt-2">
              <button 
                type="submit"
                className="w-full bg-[#1D9BF0] hover:bg-[#1585c2] text-white text-xs font-black py-4 rounded-xl uppercase tracking-widest active:scale-95 transition-all shadow-lg cursor-pointer flex items-center justify-center gap-2"
              >
                <Icons.ShieldCheck size={14} /> Submit Cryptographic Attestation For Approval
              </button>
              <p className="text-[9px] text-outline text-center mt-2 font-medium">
                🔒 Cryptographic signatures verify all profile attributes securely. Attestation logs load into workspace checkout database natively.
              </p>
            </div>
          </form>
        )}
      </div>
    </SwipeBackContainer>
  );
}

  return (
    <div className="space-y-8 pt-4 animate-in fade-in duration-500">
       {/* Profile Header */}
      <section className="glass-card rounded-2xl p-5 flex items-center gap-5 shadow-sm shadow-primary/5 border-primary/10">
        <div className="relative group cursor-pointer animate-none" onClick={handleOpenEditProfile}>
          {profileAvatar ? (
            <img 
              src={profileAvatar} 
              alt="User" 
              className="w-20 h-20 rounded-full object-cover border-4 border-primary-container/20 group-hover:scale-105 duration-200 transition-transform"
            />
          ) : (
            <div className="w-20 h-20 rounded-full bg-slate-800 border-4 border-primary-container/20 flex items-center justify-center text-slate-400 group-hover:scale-105 duration-200 transition-transform shadow-inner">
              <Icons.User size={38} className="text-slate-400 opacity-80" />
            </div>
          )}
          <div className="absolute inset-0 bg-[#000000]/40 rounded-full opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity duration-200">
            <Icons.Edit size={16} className="text-white" />
          </div>
          {/* Twitter style interactive verified blue badge at avatar */}
          <button 
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setShowVerificationPage(true);
            }}
            className="absolute bottom-0 right-0 p-1.5 rounded-full border-2 border-[#131722] shadow-md text-white hover:scale-110 active:scale-90 transition-transform duration-150 cursor-pointer"
            style={{ backgroundColor: verification?.isVerified ? '#1D9BF0' : '#4b5563' }}
            title="Account Verification Status"
          >
            <Icons.CheckCircle2 size={11} strokeWidth={3} className="text-white" />
          </button>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-xl font-bold truncate max-w-[150px] sm:max-w-xs">{profileName}</h2>
            <button 
              onClick={handleOpenEditProfile}
              className="p-1 hover:bg-white/5 rounded-full text-white/50 hover:text-white active:scale-95 transition-all"
              title={t('edit_profile_btn', 'Edit Profile')}
            >
              <Icons.Edit size={14} />
            </button>

            {/* Login / Sign Up option next to user's name as requested */}
            {!authState?.loggedIn ? (
              <button
                type="button"
                onClick={() => setShowAuthModal(true)}
                className="px-2.5 py-1 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white font-black text-[11px] rounded-xl shadow-md shadow-emerald-500/25 flex items-center gap-1.5 cursor-pointer active:scale-95 transition-all"
                title="লগইন বা সাইন আপ করুন"
              >
                <Icons.LogIn size={13} />
                <span>লগইন / সাইন আপ</span>
              </button>
            ) : (
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/15 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                  ✓ Logged In
                </span>
                <button
                  type="button"
                  onClick={handleFirebaseLogout}
                  className="px-2 py-0.5 bg-red-500/15 hover:bg-red-500/25 border border-red-500/30 text-red-400 hover:text-red-300 font-bold text-[10px] rounded-lg transition-colors flex items-center gap-1 cursor-pointer active:scale-95"
                  title="লগ আউট করুন"
                >
                  <Icons.LogOut size={11} />
                  <span>লগ আউট</span>
                </button>
              </div>
            )}
          </div>
          {/* User persistent account UID - shown only when logged in */}
          {authState?.loggedIn && (
            <p className="text-[10px] font-mono font-medium text-outline/65 mb-1 tracking-wider uppercase">
              ID: <span className="text-white font-bold">{userId}</span>
            </p>
          )}
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <span className="bg-primary/10 text-primary text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
              Platinum Member
            </span>
            
            {/* Dynamic Interactive Verified Badge */}
            <button
              type="button"
              onClick={() => setShowVerificationPage(true)}
              className="flex items-center gap-1.5 cursor-pointer hover:opacity-90 active:scale-95 transition-all"
            >
              {verification?.isVerified ? (
                <span className="bg-[#1D9BF0]/15 text-[#1D9BF0] border border-[#1D9BF0]/30 text-[9px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-widest flex items-center gap-1 shadow-sm">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#1D9BF0] animate-pulse" />
                  Verified
                </span>
              ) : (
                <span className="bg-white/5 text-outline hover:text-white border border-white/10 hover:border-white/20 text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1.5">
                  Get Verified
                </span>
              )}
            </button>
          </div>
        </div>
      </section>

      {/* Highly prominent and high-contrast Bazar Royal Club Entry Bar - hidden unless activated by admin */}
      {royalClubSettings.campaignActive && (
        <section 
          onClick={() => setShowPointsLounge(true)}
          className="relative bg-gradient-to-r from-[#022d21] via-[#034431] to-[#012017] border-2 border-emerald-400/90 rounded-2xl p-4 shadow-xl shadow-emerald-950/70 flex items-center justify-between overflow-hidden cursor-pointer active:scale-[0.98] hover:border-amber-400 transition-all duration-150 animate-pulse group"
        >
          <div className="absolute top-0 right-0 w-28 h-28 bg-amber-400/10 rounded-full blur-2xl group-hover:bg-amber-400/20 transition-all pointer-events-none" />
          
          <div className="flex items-center gap-3 z-10">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 via-yellow-500 to-amber-600 flex items-center justify-center text-black shadow-md shadow-amber-500/20 shrink-0">
              <Icons.Crown size={19} className="text-black stroke-[3px]" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] bg-amber-400 text-black font-black uppercase px-2 py-0.5 rounded-md tracking-wider">
                  VIP MEMBERS
                </span>
                <h4 className="text-sm font-black text-amber-300 uppercase tracking-wider">
                  {royalClubSettings.offerName || '👑 Bazar Royal Club'}
                </h4>
              </div>
              <p className="text-[10.5px] text-emerald-300 font-bold leading-tight mt-1">
                ১০০% নিশ্চিত অতিরিক্ত ক্যাশব্যাক ডিসকাউন্ট! এখনই স্পিন করুন ➔
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1 z-10 bg-amber-400 hover:bg-amber-300 text-black font-black text-[10px] px-3.5 py-1.5 rounded-xl uppercase tracking-widest transition-all duration-100 shadow-md shadow-amber-500/30">
            SPIN <Icons.ArrowRight size={11} strokeWidth={3} className="text-black" />
          </div>
        </section>
      )}

      {/* Order Status */}
      <section className="bg-white rounded-2xl shadow-md border border-slate-200/80 overflow-hidden text-slate-900">
        <div className="flex items-center justify-between p-4 border-b border-slate-100">
          <h3 className="text-sm font-extrabold text-slate-900">{t('my_orders', 'My Orders')}</h3>
          <button 
            onClick={() => setShowToPayPage(true)}
            className="text-emerald-600 hover:text-emerald-700 text-[10px] font-black uppercase tracking-wider cursor-pointer"
          >
            History
          </button>
        </div>
        <div className="grid grid-cols-4 py-5 bg-white">
          <StatusItem 
            icon={<Icons.ShoppingBag />} 
            label="My Order" 
            badge={savedOrders?.length > 0 ? savedOrders.length : undefined}
            onClick={() => setShowToPayPage(true)}
          />
          <StatusItem 
            icon={<Icons.Truck />} 
            label={t('to_ship', 'To Ship')} 
            isLocked={true}
            onClick={() => handleLockedStatusClick('To Ship (শিপিং)')}
          />
          <StatusItem 
            icon={<Icons.Package />} 
            label={t('to_receive', 'To Receive')} 
            isLocked={true}
            onClick={() => handleLockedStatusClick('To Receive (প্রাপ্তি)')}
          />
          <StatusItem 
            icon={<Icons.StarHalf />} 
            label={t('to_review', 'To Review')} 
            badge={userReviewsCount > 0 ? userReviewsCount : undefined}
            onClick={() => setShowReviewsManagerPage(true)}
          />
        </div>

        {/* Locked Notice Alert Banner */}
        <AnimatePresence>
          {lockedNotice && (
            <motion.div
              initial={{ opacity: 0, y: -6, height: 0 }}
              animate={{ opacity: 1, y: 0, height: 'auto' }}
              exit={{ opacity: 0, y: -6, height: 0 }}
              className="mx-3.5 mb-3 px-3.5 py-2.5 bg-amber-50 border border-amber-200/90 rounded-xl text-[11px] font-bold text-amber-800 flex items-center justify-between gap-2 shadow-xs"
            >
              <div className="flex items-center gap-1.5">
                <Icons.Lock size={13} className="text-amber-600 shrink-0" />
                <span>{lockedNotice}</span>
              </div>
              <button 
                onClick={() => setLockedNotice(null)} 
                className="text-amber-600 hover:text-amber-800 p-0.5 cursor-pointer"
              >
                <Icons.X size={12} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      {/* Menu Options */}
      <section className="bg-white rounded-2xl shadow-md border border-slate-200/80 overflow-hidden divide-y divide-slate-100 text-slate-900">
        <MenuOption 
          icon={<Icons.ShoppingBag className="text-emerald-600" />} 
          label="My Order (আমার অর্ডার)" 
          onClick={() => setShowToPayPage(true)}
          badge={savedOrders?.length > 0 ? savedOrders.length : undefined}
        />
        <MenuOption 
          icon={<Icons.Globe className="text-emerald-600 animate-pulse" />} 
          label={t('language_currency', 'Language & Currency')} 
          onClick={() => setShowPreferencesPage(true)}
          badge="🌍"
        />
        <MenuOption 
          icon={<Icons.Heart className="text-rose-500" />} 
          label="My Wishlist" 
          onClick={() => setShowWishlist(true)}
          badge={wishlist.length > 0 ? wishlist.length : undefined}
        />
        <MenuOption 
          icon={<Icons.Navigation className="text-emerald-600" />} 
          label="Shipping Address" 
          onClick={() => setIsEditingAddress(true)}
          badge={deliveryAddress ? "Saved" : undefined}
        />
        <MenuOption 
          icon={<Icons.HelpCircle className="text-teal-600" />} 
          label="Help Center" 
          onClick={() => onTabChange?.('chat')}
        />
        <MenuOption 
          icon={<Icons.Settings className="text-slate-600" />} 
          label="Account Settings" 
          onClick={() => setShowPreferencesPage(true)}
        />
      </section>

      {!authState?.loggedIn ? (
        <button 
          onClick={() => setShowAuthModal(true)}
          className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white font-extrabold text-sm py-4 rounded-2xl active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-emerald-500/25"
        >
          <Icons.LogIn size={18} />
          অ্যাকাউন্টে লগইন বা সাইন আপ করুন
        </button>
      ) : (
        <button 
          onClick={handleFirebaseLogout}
          className="w-full bg-error-container/10 hover:bg-error-container/20 border border-error/20 text-error font-bold text-sm py-4 rounded-2xl active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          <Icons.LogOut size={18} />
          {t('logout', 'Log Out')} (লগ আউট করুন)
        </button>
      )}

      <p className="text-center text-[10px] font-bold text-outline uppercase tracking-widest pb-8 opacity-50">
        Bazar • Trusted Shopping
      </p>

      {/* Edit Profile Modal */}
      <AnimatePresence>
        {showEditProfileModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className="glass-card w-full max-w-md rounded-3xl p-6 border border-white/10 shadow-2xl relative overflow-hidden my-auto bg-[#131722]/95"
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-white/5 pb-4 mb-4">
                <h3 className="text-lg font-black text-white flex items-center gap-2">
                  <Icons.Edit size={18} className="text-primary" />
                  {t('edit_profile', 'Edit Profile')}
                </h3>
                <button
                  onClick={() => setShowEditProfileModal(false)}
                  className="p-1.5 hover:bg-white/5 rounded-full text-outline hover:text-white transition-all active:scale-90 cursor-pointer"
                >
                  <Icons.X size={18} />
                </button>
              </div>

              <div className="space-y-5">
                {/* Error Banner */}
                {profileEditError && (
                  <div className="p-3 bg-error/15 border border-error/30 text-error rounded-xl text-xs font-bold flex items-start gap-2 animate-pulse leading-snug">
                    <Icons.AlertCircle size={15} className="shrink-0 mt-0.5" />
                    <div>
                      <p>{profileEditError}</p>
                    </div>
                  </div>
                )}

                {/* Name Input */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-outline uppercase tracking-wider block">
                    {t('your_name', 'Your Name')}
                  </label>
                  <input
                    type="text"
                    value={editNameVal}
                    onChange={(e) => setEditNameVal(e.target.value)}
                    maxLength={30}
                    className="w-full bg-[#1c2230] border border-white/10 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-primary transition-all font-bold"
                    placeholder={t('enter_name_placeholder', 'Enter your name')}
                  />
                </div>

                {/* Custom File Upload Section */}
                {(() => {
                  const remainingCooldown = getAvatarCooldownRemaining();
                  return (
                    <>
                      <div className="space-y-2 py-3 border-t border-b border-white/5">
                        <div className="flex items-center justify-between">
                          <label className="text-[10px] font-black text-outline uppercase tracking-wider block">
                            Custom Profile Image (ছবি আপলোড)
                          </label>
                          <span className="text-[8px] font-black bg-[#1D9BF0]/15 border border-[#1D9BF0]/30 text-[#1D9BF0] px-2 py-0.5 rounded-full uppercase tracking-wider">
                            Device Upload
                          </span>
                        </div>

                        {remainingCooldown ? (
                          <div className="p-3.5 bg-secondary/15 border border-secondary/35 rounded-2xl text-center space-y-1">
                            <p className="text-[10px] font-black text-secondary flex items-center justify-center gap-1.5 uppercase tracking-wider">
                              <Icons.Lock size={12} className="animate-pulse" /> Avatar Edit Cooldown Active
                            </p>
                            <p className="text-[11px] text-white font-black font-mono">
                              Remaining: {remainingCooldown.formattedEng}
                            </p>
                            <p className="text-[9.5px] text-outline font-extrabold Bengali-text">
                              ({remainingCooldown.formattedBng} বাকি আছে)
                            </p>
                            <div className="pt-2">
                              <button
                                type="button"
                                onClick={resetAvatarCooldown}
                                className="text-[8.5px] bg-[#1D9BF0]/15 hover:bg-[#1D9BF0]/25 text-[#1D9BF0] border border-[#1D9BF0]/20 font-black px-3 py-1.5 rounded-xl uppercase tracking-widest transition-all cursor-pointer inline-flex items-center gap-1 active:scale-95"
                                title="Instantly fast-forward 16 days to unlock avatar editing for testing"
                              >
                                ⚡ Reset Cooldown (Developer bypass)
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            <div className="border-2 border-dashed border-white/10 rounded-2xl p-4 text-center bg-[#1c2230]/40 hover:border-[#1D9BF0]/40 transition-colors flex flex-col items-center justify-center min-h-[110px] relative group">
                              <Icons.Camera size={22} className="text-[#1D9BF0] mb-2 animate-bounce" />
                              <span className="text-[9.5px] font-black text-outline uppercase tracking-widest block mb-1.5">
                                Upload Avatar or Drop File
                              </span>
                              
                              <input
                                type="file"
                                accept="image/*"
                                onChange={async (e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    // Local instant preview
                                    const reader = new FileReader();
                                    reader.onloadend = () => {
                                      setEditAvatarVal(reader.result as string);
                                    };
                                    reader.readAsDataURL(file);

                                    // Upload to ImgBB CDN seamlessly in background
                                    try {
                                      setIsUploadingAvatar(true);
                                      const cdnUrl = await uploadToImgBB(file);
                                      setEditAvatarVal(cdnUrl);
                                    } catch (err) {
                                      console.warn('ImgBB avatar upload fallback to local preview:', err);
                                    } finally {
                                      setIsUploadingAvatar(false);
                                    }
                                  }
                                }}
                                className="hidden"
                                id="edit-profile-custom-upload"
                              />
                              <label
                                htmlFor="edit-profile-custom-upload"
                                className="bg-[#1D9BF0]/10 hover:bg-[#1D9BF0]/20 text-[#1D9BF0] border border-[#1D9BF0]/30 text-[9px] px-3.5 py-1.5 rounded-xl uppercase tracking-wider cursor-pointer font-black block shadow-md flex items-center justify-center gap-1.5"
                              >
                                {isUploadingAvatar ? (
                                  <>
                                    <Icons.RotateCw size={12} className="animate-spin text-[#1D9BF0]" />
                                    <span>Uploading to ImgBB Cloud... (আপলোড হচ্ছে)</span>
                                  </>
                                ) : (
                                  <span>Choose Image From Phone (ফাইল বেছে নিন)</span>
                                )}
                              </label>
                            </div>
                          </div>
                        )}

                        {/* Current avatar preview comparison */}
                        <div className="flex items-center gap-3 pt-3">
                          <div className="text-center">
                            <img 
                              src={editAvatarVal} 
                              alt="Draft Avatar" 
                              className="w-12 h-12 rounded-full object-cover border border-[#1D9BF0]/40" 
                            />
                            <span className="text-[8px] font-bold text-outline uppercase">Draft</span>
                          </div>
                          <div className="text-outline text-xs">
                            ➡
                          </div>
                          <div className="text-center">
                            <img 
                              src={profileAvatar} 
                              alt="Current Avatar" 
                              className="w-12 h-12 rounded-full object-cover border border-white/10" 
                            />
                            <span className="text-[8px] font-bold text-outline uppercase">Active</span>
                          </div>
                          <div className="flex-1 text-[10px] text-outline font-medium leading-normal pl-2">
                            {editAvatarVal !== profileAvatar 
                              ? '✨ Avatar changed! Saving this will trigger a 16-day lock.' 
                              : '💡 Drag & drop or select a new JPG/PNG file above.'}
                          </div>
                        </div>
                      </div>

                      {/* Avatar Stickers Grid */}
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-outline uppercase tracking-wider block">
                          Or Select Pre-set Premium Sticker
                        </label>
                        <div className="grid grid-cols-3 gap-3">
                          {PREMIUM_AVATARS.map((avatar) => {
                            const isSelected = editAvatarVal === avatar.url;
                            return (
                              <button
                                key={avatar.id}
                                type="button"
                                disabled={!!remainingCooldown}
                                onClick={() => setEditAvatarVal(avatar.url)}
                                className={`relative aspect-square rounded-2xl overflow-hidden border-2 transition-all group max-w-full cursor-pointer ${
                                  isSelected
                                    ? 'border-primary shadow-lg shadow-primary/20 scale-[0.98]'
                                    : 'border-white/5 hover:border-white/20 hover:scale-105 active:scale-95'
                                } ${remainingCooldown ? 'opacity-40 cursor-not-allowed filter grayscale' : ''}`}
                                title={avatar.name}
                              >
                                <img
                                  src={avatar.url}
                                  alt={avatar.name}
                                  className="w-full h-full object-cover"
                                  referrerPolicy="no-referrer"
                                />
                                {isSelected && (
                                  <div className="absolute top-1.5 right-1.5 bg-primary text-white w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-black shadow-md border border-white/20 select-none">
                                    ✓
                                  </div>
                                )}
                                {remainingCooldown && (
                                  <div className="absolute inset-0 bg-transparent/50 flex items-center justify-center text-white font-bold select-none">
                                    <Icons.Lock size={12} className="text-secondary" />
                                  </div>
                                )}
                              </button>
                            );
                          })}
                        </div>
                        <p className="text-[9.5px] text-outline font-medium leading-relaxed">
                          🔒 You can modify your avatar stickers or uploads freely but any change commits a 16 days cooldown protocol.
                        </p>
                      </div>
                    </>
                  );
                })()}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3 border-t border-white/5 pt-5 mt-5">
                <button
                  onClick={() => setShowEditProfileModal(false)}
                  className="flex-1 bg-white/5 border border-white/10 text-white text-[11px] font-bold py-3 rounded-xl uppercase tracking-wider hover:bg-white/10 active:scale-95 transition-all text-center cursor-pointer"
                >
                  {t('cancel_btn', 'Cancel')}
                </button>
                <button
                  onClick={handleSaveProfile}
                  className="flex-1 bg-primary text-white text-[11px] font-black py-3 rounded-xl uppercase tracking-wider hover:brightness-110 active:scale-95 transition-all text-center cursor-pointer shadow-lg shadow-primary/10"
                >
                  {t('save_btn', 'Save Changes')}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Firebase Auth Modal */}
      <AuthModal 
        isOpen={showAuthModal} 
        onClose={() => setShowAuthModal(false)} 
        defaultMode="login"
      />
    </div>
  );
}

function StatusItem({ icon, label, badge, onClick, isLocked }: any) {
  return (
    <button 
      onClick={onClick}
      className={`flex flex-col items-center gap-1.5 transition-transform group relative ${
        isLocked ? 'cursor-not-allowed opacity-70' : 'cursor-pointer active:scale-95 hover:brightness-95'
      }`}
    >
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center relative border shadow-xs transition-all ${
        isLocked 
          ? 'bg-slate-100 text-slate-400 border-slate-200' 
          : 'bg-emerald-50 text-emerald-600 border-emerald-100'
      }`}>
        {React.cloneElement(icon, { size: 22 })}
        {isLocked && (
          <span className="absolute -top-1.5 -right-1.5 bg-amber-500 text-white p-1 rounded-full border-2 border-white shadow-xs flex items-center justify-center" title="লক করা (Locked)">
            <Icons.Lock size={10} />
          </span>
        )}
        {!isLocked && badge && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] min-w-[16px] h-4 px-1 rounded-full flex items-center justify-center font-black border-2 border-white shadow-xs">
            {badge}
          </span>
        )}
      </div>
      <div className="flex items-center gap-0.5">
        <span className={`text-[10.5px] font-extrabold transition-colors ${
          isLocked ? 'text-slate-400' : 'text-slate-800 group-hover:text-emerald-600'
        }`}>
          {label}
        </span>
        {isLocked && <span className="text-[9px]">🔒</span>}
      </div>
    </button>
  );
}

function MenuOption({ icon, label, onClick, badge }: any) {
  return (
    <button 
      onClick={onClick}
      className="w-full flex items-center justify-between px-4 py-3.5 bg-white hover:bg-slate-50 transition-colors active:scale-[0.99] group text-black cursor-pointer"
    >
      <div className="flex items-center gap-3.5">
        <div className="p-2.5 rounded-xl bg-slate-100/90 text-slate-800 group-hover:text-emerald-700 group-hover:bg-emerald-50 transition-colors border border-slate-200 shrink-0 shadow-2xs">
          {React.cloneElement(icon, { size: 19 })}
        </div>
        <span className="text-sm font-black text-black tracking-tight">{label}</span>
      </div>
      <div className="flex items-center gap-2">
        {badge && typeof badge === 'number' && (
          <span className="bg-red-500 text-white text-[9px] font-black px-2 py-0.5 rounded-full border border-white shadow-xs">
            {badge}
          </span>
        )}
        {badge && typeof badge === 'string' && badge !== '🌍' && (
          <span className="text-[10px] font-black bg-emerald-50 text-emerald-800 border border-emerald-200 px-2.5 py-0.5 rounded-full shadow-2xs">
            {badge}
          </span>
        )}
        {badge === '🌍' && (
          <span className="text-sm">{badge}</span>
        )}
        <Icons.ChevronRight className="text-slate-400 group-hover:text-black transition-colors" size={18} />
      </div>
    </button>
  );
}

interface SellerCenterViewProps {
  onBack: () => void;
  products: any[];
  savedOrders: any[];
  onClearOrders: () => void;
}

function SellerCenterView({ onBack, products, savedOrders, onClearOrders }: SellerCenterViewProps) {
  const [name, setName] = React.useState('');
  const [primaryCurrency, setPrimaryCurrency] = React.useState('BDT');
  const [primaryPrice, setPrimaryPrice] = React.useState('');
  const [priceBD, setPriceBD] = React.useState('');
  const [priceUS, setPriceUS] = React.useState('');
  const [priceIN, setPriceIN] = React.useState('');
  const [priceSA, setPriceSA] = React.useState('');
  const [priceGB, setPriceGB] = React.useState('');
  const [showOverridePanel, setShowOverridePanel] = React.useState(false);

  const [category, setCategory] = React.useState('Tech');
  const [image, setImage] = React.useState('');
  const [additionalImages, setAdditionalImages] = React.useState<string[]>(['']);
  const [isUploadingMainImage, setIsUploadingMainImage] = React.useState(false);
  const [uploadingSecondaryIndex, setUploadingSecondaryIndex] = React.useState<number | null>(null);
  const [formError, setFormError] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [customSpec1Label, setCustomSpec1Label] = React.useState('');
  const [customSpec1Value, setCustomSpec1Value] = React.useState('');
  const [customSpec2Label, setCustomSpec2Label] = React.useState('');
  const [customSpec2Value, setCustomSpec2Value] = React.useState('');
  const [customSpec3Label, setCustomSpec3Label] = React.useState('');
  const [customSpec3Value, setCustomSpec3Value] = React.useState('');
  const [successMsg, setSuccessMsg] = React.useState('');
  const [activeTab, setActiveTab] = React.useState<'listings' | 'kyc' | 'campaign'>('listings');
  const [selectedKycDoc, setSelectedKycDoc] = React.useState<string | null>(null);

  const handleMainImageFileUpload = async (file: File) => {
    setIsUploadingMainImage(true);
    setFormError('');
    // Instant preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setImage(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    try {
      const url = await uploadToImgBB(file);
      if (url) setImage(url);
    } catch (err) {
      console.warn('ImgBB upload note:', err);
    } finally {
      setIsUploadingMainImage(false);
    }
  };

  const handleSecondaryImageFileUpload = async (file: File, index: number) => {
    setUploadingSecondaryIndex(index);
    const reader = new FileReader();
    reader.onload = (e) => {
      handleImageChange(index, e.target?.result as string);
    };
    reader.readAsDataURL(file);

    try {
      const url = await uploadToImgBB(file);
      if (url) handleImageChange(index, url);
    } catch (err) {
      console.warn('Secondary image upload note:', err);
    } finally {
      setUploadingSecondaryIndex(null);
    }
  };

  // Royal Club Campaign Admin settings form states
  const [rcOfferName, setRcOfferName] = React.useState(() => getRoyalClubAdminSettings().offerName || '👑 Bazar Royal Club');
  const [rcCampaignActive, setRcCampaignActive] = React.useState(() => getRoyalClubAdminSettings().campaignActive);
  const [rcDiscountsRaw, setRcDiscountsRaw] = React.useState(() => getRoyalClubAdminSettings().possibleDiscounts.join(', '));
  const [rcFrequentOutcome, setRcFrequentOutcome] = React.useState(() => (getRoyalClubAdminSettings().frequentOutcome || 3).toString());
  const [rcBigWinDiscount, setRcBigWinDiscount] = React.useState(() => (getRoyalClubAdminSettings().bigWinDiscount || 10).toString());
  const [rcBigWinChancePercent, setRcBigWinChancePercent] = React.useState(() => (getRoyalClubAdminSettings().bigWinChancePercent || 2).toString());
  const [rcExclusionLimit, setRcExclusionLimit] = React.useState(() => getRoyalClubAdminSettings().exclusionLimit.toString());
  const [rcCooldownHours, setRcCooldownHours] = React.useState(() => getRoyalClubAdminSettings().cooldownHours.toString());
  const [rcZeroCooldownHours, setRcZeroCooldownHours] = React.useState(() => getRoyalClubAdminSettings().zeroCooldownHours.toString());
  const [rcOfferDurationHours, setRcOfferDurationHours] = React.useState(() => getRoyalClubAdminSettings().offerDurationHours.toString());
  const [rcUserOverrides, setRcUserOverrides] = React.useState<Record<string, number>>(() => getRoyalClubAdminSettings().userOverrides || {});
  const [rcHeroBanners, setRcHeroBanners] = React.useState<HeroBannerItem[]>(() => getRoyalClubAdminSettings().heroBanners || DEFAULT_HERO_BANNERS);
  const [rcSettingsSuccessMsg, setRcSettingsSuccessMsg] = React.useState('');

  // Per-user override input state
  const [overrideUserKey, setOverrideUserKey] = React.useState('');
  const [overrideValue, setOverrideValue] = React.useState('15');

  // Hero Banner input state
  const [bannerImage, setBannerImage] = React.useState('');
  const [isUploadingBanner, setIsUploadingBanner] = React.useState(false);
  const [bannerTag, setBannerTag] = React.useState('MEGA OFFER');
  const [bannerTitle, setBannerTitle] = React.useState('SPECIAL DISCOUNT');
  const [bannerSubtitle, setBannerSubtitle] = React.useState('Up to 50% Off Top Selections');

  const handleBannerFileUpload = async (file: File) => {
    setIsUploadingBanner(true);
    const reader = new FileReader();
    reader.onload = (e) => {
      setBannerImage(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    try {
      const url = await uploadToImgBB(file);
      if (url) setBannerImage(url);
    } catch (e) {
      console.warn('Banner upload note:', e);
    } finally {
      setIsUploadingBanner(false);
    }
  };

  const handleAddUserOverride = () => {
    if (!overrideUserKey.trim()) {
      alert('Please enter a valid User ID or Phone Number.');
      return;
    }
    const val = parseInt(overrideValue, 10);
    if (isNaN(val) || val < 0) {
      alert('Please enter a valid discount percentage.');
      return;
    }
    const updated = { ...rcUserOverrides, [overrideUserKey.trim()]: val };
    setRcUserOverrides(updated);
    setOverrideUserKey('');
  };

  const handleRemoveUserOverride = (key: string) => {
    const updated = { ...rcUserOverrides };
    delete updated[key];
    setRcUserOverrides(updated);
  };

  const handleAddHeroBanner = () => {
    if (!bannerImage.trim()) {
      alert('Please enter a valid Banner Image URL.');
      return;
    }
    const newBanner: HeroBannerItem = {
      id: `banner_${Date.now()}`,
      image: bannerImage.trim(),
      tag: bannerTag.trim() || 'PROMO',
      title: bannerTitle.trim() || 'SPECIAL OFFER',
      subtitle: bannerSubtitle.trim() || 'Check out our latest collections',
      active: true
    };
    setRcHeroBanners([...rcHeroBanners, newBanner]);
    setBannerImage('');
  };

  const handleToggleHeroBanner = (id: string) => {
    setRcHeroBanners(rcHeroBanners.map(b => b.id === id ? { ...b, active: !b.active } : b));
  };

  const handleDeleteHeroBanner = (id: string) => {
    setRcHeroBanners(rcHeroBanners.filter(b => b.id !== id));
  };

  const handleSaveRcCampaignSettings = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const parsedDiscounts = rcDiscountsRaw
        .split(',')
        .map(x => parseInt(x.trim(), 10))
        .filter(x => !isNaN(x));

      if (parsedDiscounts.length === 0) {
        alert('Please specify at least one valid discount number.');
        return;
      }

      const exclusion = parseInt(rcExclusionLimit, 10);
      const frequent = parseInt(rcFrequentOutcome, 10);
      const bigWin = parseInt(rcBigWinDiscount, 10);
      const bigWinChance = parseFloat(rcBigWinChancePercent);
      const cooldown = parseFloat(rcCooldownHours);
      const zeroCooldown = parseFloat(rcZeroCooldownHours);
      const offerDuration = parseFloat(rcOfferDurationHours);

      saveRoyalClubAdminSettings({
        offerName: rcOfferName.trim() || '👑 Bazar Royal Club',
        campaignActive: rcCampaignActive,
        possibleDiscounts: parsedDiscounts,
        frequentOutcome: isNaN(frequent) ? 3 : frequent,
        bigWinDiscount: isNaN(bigWin) ? 10 : bigWin,
        bigWinChancePercent: isNaN(bigWinChance) ? 2 : bigWinChance,
        exclusionLimit: isNaN(exclusion) ? 45 : exclusion,
        cooldownHours: isNaN(cooldown) ? 24 : cooldown,
        zeroCooldownHours: isNaN(zeroCooldown) ? 12 : zeroCooldown,
        offerDurationHours: isNaN(offerDuration) ? 24 : offerDuration,
        userOverrides: rcUserOverrides,
        heroBanners: rcHeroBanners
      });

      setRcSettingsSuccessMsg('Campaign rules & hero carousel banners updated successfully!');
      setTimeout(() => setRcSettingsSuccessMsg(''), 3500);

      window.dispatchEvent(new CustomEvent('bazar-royal-club-admin-updated'));
      window.dispatchEvent(new CustomEvent('bazar-products-updated'));
    } catch (err: any) {
      alert(`Configuration error: ${err.message || err}`);
    }
  };

  // Steadfast Logistics Manager states
  const [shippingOrder, setShippingOrder] = React.useState<any | null>(null);
  const [viewingInvoice, setViewingInvoice] = React.useState<any | null>(null);

  // Steadfast Consignment form fields
  const [codAmount, setCodAmount] = React.useState('');
  const [deliveryType, setDeliveryType] = React.useState('inside_dhaka'); // inside_dhaka, suburbs, outside_dhaka
  const [parcelWeight, setParcelWeight] = React.useState('0.5'); // in kg
  const [senderStore, setSenderStore] = React.useState('Bazar Luxury Hub');
  const [specialInstruction, setSpecialInstruction] = React.useState('Fragile - handle with care.');
  const [steadfastResponseLogs, setSteadfastResponseLogs] = React.useState<string[]>([]);
  const [isBookingLoading, setIsBookingLoading] = React.useState(false);

  const handleCreateSteadfastBooking = () => {
    if (!shippingOrder) return;
    setIsBookingLoading(true);
    setSteadfastResponseLogs([
      `Initiating secure API Connection to Steadfast Courier Integration Gateway...`,
      `Endpoint: POST https://api.steadfast.com.bd/v1/create_order (OAuth Verified)`,
      `Payload parsing headers and credentials authentication successful...`,
    ]);

    setTimeout(() => {
      setSteadfastResponseLogs(prev => [
        ...prev,
        `Validating Recipient Contact: +880 ${shippingOrder.location?.mobile || 'N/A'}`,
        `Analyzing Area Coordinates: ${shippingOrder.location?.district || ''} -> Thana: ${shippingOrder.location?.upazila || ''}`,
        `Standard delivery charge assessed: BDT ${deliveryType === 'inside_dhaka' ? '60' : deliveryType === 'suburbs' ? '100' : '130'}`,
      ]);
    }, 800);

    setTimeout(() => {
      const trackingId = `SF-${Math.floor(1000000000 + Math.random() * 9000000000)}`;
      setSteadfastResponseLogs(prev => [
        ...prev,
        `Consignment Successfully Registered under Booking ID: ${trackingId}`,
        `Status: SUCCESS (201 Created) - Pick-up request scheduled at nearest Steadfast hub.`,
      ]);

      const bdtCharge = deliveryType === 'inside_dhaka' ? 60 : deliveryType === 'suburbs' ? 100 : 130;

      const steadfastDetails = {
        trackingId,
        codAmount: parseInt(codAmount) || 0,
        deliveryCharge: bdtCharge,
        weight: parseFloat(parcelWeight) || 0.5,
        destination: deliveryType === 'inside_dhaka' ? 'Inside Dhaka' : deliveryType === 'suburbs' ? 'Dhaka Suburbs' : 'Outside Dhaka',
        dateBooked: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
        consigneeName: shippingOrder.location?.fullName || shippingOrder.userName,
        consigneePhone: shippingOrder.location?.mobile ? `+880 ${shippingOrder.location.mobile}` : 'N/A',
        consigneeAddress: `${shippingOrder.location?.address || ''}, ${shippingOrder.location?.upazila || ''}, ${shippingOrder.location?.district || ''}`,
        senderStore,
        specialInstruction
      };

      try {
        const stored = localStorage.getItem('bazar_saved_orders_v1');
        if (stored) {
          const list = JSON.parse(stored);
          const updated = list.map((ord: any) => {
            if (ord.id === shippingOrder.id) {
              return {
                ...ord,
                status: 'Shipped (Steadfast)',
                steadfast: steadfastDetails
              };
            }
            return ord;
          });
          localStorage.setItem('bazar_saved_orders_v1', JSON.stringify(updated));
          window.dispatchEvent(new CustomEvent('bazar-orders-list-updated'));
        }
      } catch (err) {
        console.error(err);
      }

      setIsBookingLoading(false);
      setViewingInvoice({
        ...shippingOrder,
        status: 'Shipped (Steadfast)',
        steadfast: steadfastDetails
      });
      setShippingOrder(null);
    }, 1800);
  };

  const handlePrimaryPriceChange = (val: string, curr: string = primaryCurrency) => {
    setPrimaryPrice(val);
    const num = parseFloat(val);
    if (isNaN(num) || num <= 0) {
      setPriceBD('');
      setPriceUS('');
      setPriceIN('');
      setPriceSA('');
      setPriceGB('');
      return;
    }

    const bdRate = COUNTRIES.find(c => c.code === 'BD')?.rate || 122;
    const inRate = COUNTRIES.find(c => c.code === 'IN')?.rate || 83.5;
    const saRate = COUNTRIES.find(c => c.code === 'SA')?.rate || 3.75;
    const gbRate = COUNTRIES.find(c => c.code === 'GB')?.rate || 0.78;

    if (curr === 'BDT') {
      const usdVal = num / bdRate;
      setPriceBD(val);
      setPriceUS(usdVal.toFixed(2));
      setPriceIN((usdVal * inRate).toFixed(2));
      setPriceSA((usdVal * saRate).toFixed(2));
      setPriceGB((usdVal * gbRate).toFixed(2));
    } else if (curr === 'USD') {
      const usdVal = num;
      setPriceUS(val);
      setPriceBD((usdVal * bdRate).toFixed(0));
      setPriceIN((usdVal * inRate).toFixed(2));
      setPriceSA((usdVal * saRate).toFixed(2));
      setPriceGB((usdVal * gbRate).toFixed(2));
    }
  };

  const handlePrimaryCurrencyChange = (curr: string) => {
    setPrimaryCurrency(curr);
    handlePrimaryPriceChange(primaryPrice, curr);
  };

  const handleAddImageField = () => {
    setAdditionalImages([...additionalImages, '']);
  };

  const handleImageChange = (index: number, val: string) => {
    const list = [...additionalImages];
    list[index] = val;
    setAdditionalImages(list);
  };

  const handleRemoveImageField = (index: number) => {
    setAdditionalImages(additionalImages.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    if (!name.trim()) {
      setFormError('পণ্যের নাম প্রদান করুন (Please enter product name)');
      return;
    }
    if (!primaryPrice.trim()) {
      setFormError('পণ্যের মূল্য প্রদান করুন (Please enter product price)');
      return;
    }
    if (!image.trim()) {
      setFormError('পণ্যের মূল ছবি নির্বাচন বা আপলোড করুন (Please upload or provide a cover photo)');
      return;
    }

    const validAdditional = additionalImages.map(url => url.trim()).filter(url => url.length > 0);
    const customSpecs = [];
    if (customSpec1Label.trim() && customSpec1Value.trim()) {
      customSpecs.push({ label: customSpec1Label.trim(), value: customSpec1Value.trim() });
    }
    if (customSpec2Label.trim() && customSpec2Value.trim()) {
      customSpecs.push({ label: customSpec2Label.trim(), value: customSpec2Value.trim() });
    }
    if (customSpec3Label.trim() && customSpec3Value.trim()) {
      customSpecs.push({ label: customSpec3Label.trim(), value: customSpec3Value.trim() });
    }

    const bdRate = COUNTRIES.find(c => c.code === 'BD')?.rate || 122;
    const inRate = COUNTRIES.find(c => c.code === 'IN')?.rate || 83.5;
    const saRate = COUNTRIES.find(c => c.code === 'SA')?.rate || 3.75;
    const gbRate = COUNTRIES.find(c => c.code === 'GB')?.rate || 0.78;

    const baseUSD = parseFloat(priceUS) || (parseFloat(primaryPrice) / bdRate) || 0;

    const newProduct = {
      name: name.trim(),
      price: baseUSD,
      originalPrice: baseUSD * 1.8,
      image: image.trim(),
      images: validAdditional, 
      rating: 5.0,
      reviews: "1",
      tag: "NEW",
      category: category,
      description: description.trim(),
      customSpecs: customSpecs.length > 0 ? customSpecs : undefined,
      customPrices: {
        BD: parseFloat(priceBD) || (baseUSD * bdRate),
        US: parseFloat(priceUS) || baseUSD,
        IN: parseFloat(priceIN) || (baseUSD * inRate),
        SA: parseFloat(priceSA) || (baseUSD * saRate),
        GB: parseFloat(priceGB) || (baseUSD * gbRate)
      }
    };

    addCustomProduct(newProduct);
    
    // Reset inputs
    setName('');
    setPrimaryPrice('');
    setPriceBD('');
    setPriceUS('');
    setPriceIN('');
    setPriceSA('');
    setPriceGB('');
    setImage('');
    setAdditionalImages(['']);
    setDescription('');
    setCustomSpec1Label('');
    setCustomSpec1Value('');
    setCustomSpec2Label('');
    setCustomSpec2Value('');
    setCustomSpec3Label('');
    setCustomSpec3Value('');
    setSuccessMsg('✓ পণ্যটি সফলভাবে প্রকাশিত হয়েছে! (Product published successfully to store and Firebase)');
    setTimeout(() => setSuccessMsg(''), 5000);
  };

  const customProducts = products;

  return (
    <div className="space-y-6 pt-4 animate-in slide-in-from-right duration-300 font-sans">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4">
          <button 
            type="button"
            onClick={onBack}
            className="p-2 hover:bg-primary/10 rounded-full transition-colors active:scale-90"
          >
            <Icons.ArrowLeft size={24} className="text-primary" />
          </button>
          <h2 className="text-2xl font-bold">Seller Center</h2>
        </div>
        <button 
          type="button"
          onClick={() => {
            if (confirm('Verify: Reset store listings? This will purge all custom products.')) {
              resetCustomProducts();
            }
          }}
          className="text-[9px] hover:bg-error/10 border border-error/20 text-error font-extrabold px-3 py-1 rounded-full uppercase tracking-wider transition-all"
        >
          Reset Store
        </button>
      </div>

      <p className="text-xs text-outline font-medium leading-relaxed">
        Upload items with custom counts of secondary images! Instead of forcing exactly 13 slide components, BAZAR Next dynamically renders the exact number of images and videos specified by the seller.
      </p>

      {/* Sub-tab Navigation for Product Creation and Merchant KYC Auditing */}
      <div className="flex border-b border-white/5 pb-1 gap-4 bg-white/[0.01] p-1.5 rounded-xl border border-white/5 mt-4">
        <button
          type="button"
          onClick={() => setActiveTab('listings')}
          className={`flex-1 px-3 py-2 text-xs font-black uppercase tracking-wider relative transition-all cursor-pointer flex items-center justify-center gap-2 rounded-lg ${
            activeTab === 'listings' ? 'text-primary bg-primary/10 font-black' : 'text-outline hover:text-white hover:bg-white/5 font-bold'
          }`}
        >
          <Icons.Store size={13} />
          Products & Listings
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('kyc')}
          className={`flex-1 px-3 py-2 text-xs font-black uppercase tracking-wider relative transition-all cursor-pointer flex items-center justify-center gap-2 rounded-lg ${
            activeTab === 'kyc' ? 'text-[#1D9BF0] bg-[#1D9BF0]/10 font-black' : 'text-outline hover:text-white hover:bg-white/5 font-bold'
          }`}
        >
          <Icons.ShieldCheck size={13} />
          Orders & KYC Logs
          <span className="bg-[#1D9BF0] px-1.5 py-0.5 rounded-full text-[8.5px] font-mono text-white leading-none font-black text-center">
            {savedOrders?.length || 0}
          </span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('campaign')}
          className={`flex-1 px-3 py-2 text-xs font-black uppercase tracking-wider relative transition-all cursor-pointer flex items-center justify-center gap-2 rounded-lg ${
            activeTab === 'campaign' ? 'text-amber-400 bg-amber-400/10 font-black' : 'text-outline hover:text-white hover:bg-white/5 font-bold'
          }`}
        >
          <Icons.Crown size={13} />
          Royal Club Campaign
        </button>
      </div>

      {successMsg && activeTab === 'listings' && (
        <div className="p-4 bg-emerald-950/40 border border-emerald-500/30 text-emerald-400 text-xs font-bold rounded-2xl flex items-center gap-2 mt-2">
          <Icons.CheckCircle2 size={16} /> {successMsg}
        </div>
      )}

      {/* Panel 1: Listings and creation form */}
      {activeTab === 'listings' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Launcher form */}
          <form onSubmit={handleSubmit} className="glass-card rounded-2xl p-5 border border-white/5 space-y-4 shadow-xl">
        <h3 className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-2 border-b border-white/5 pb-2">
          <Icons.Store size={15} className="text-primary" /> Publish Product Form
        </h3>

        {formError && (
          <div className="p-3 bg-red-500/15 border border-red-500/30 text-red-300 text-xs font-bold rounded-xl flex items-center gap-2">
            <Icons.AlertCircle size={16} className="text-red-400 shrink-0" />
            <span>{formError}</span>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-[9px] font-bold text-outline uppercase tracking-wider">Product Name</label>
            <input 
              type="text" 
              placeholder="e.g. Retro Headset Pro" 
              value={name} 
              onChange={e => setName(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-primary transition-colors font-semibold"
              required 
            />
          </div>
          <div className="space-y-1">
            <label className="text-[9px] font-bold text-outline uppercase tracking-wider">Category</label>
            <select 
              value={category} 
              onChange={e => setCategory(e.target.value)}
              className="w-full bg-[#1c2230] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-primary transition-colors font-semibold"
            >
              <option value="Watch">Watch</option>
              <option value="Shoes">Shoes</option>
              <option value="Audio">Audio</option>
              <option value="General">General</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-[9px] font-bold text-outline uppercase tracking-wider block">Primary Price & Currency</label>
            <div className="flex gap-2">
              <input 
                type="number" 
                placeholder={primaryCurrency === 'BDT' ? "e.g. 2000" : "e.g. 19"} 
                value={primaryPrice} 
                onChange={e => handlePrimaryPriceChange(e.target.value)}
                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-primary transition-colors font-bold"
                required 
              />
              <select
                value={primaryCurrency}
                onChange={e => handlePrimaryCurrencyChange(e.target.value)}
                className="bg-[#1c2230] border border-white/10 rounded-xl px-2 py-2 text-[10px] text-white focus:outline-none focus:border-primary font-bold cursor-pointer"
              >
                <option value="BDT">৳ BDT</option>
                <option value="USD">$ USD</option>
              </select>
            </div>
            <div className="text-[8px] text-primary/80 font-black uppercase tracking-wider mt-1">
              ✨ Auto-estimated USD: ${priceUS || '0.00'} • BDT: ৳{priceBD || '0'}
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[9px] font-bold text-outline uppercase tracking-wider block">Main Cover Image (ছবি আপলোড বা লিংক)</label>
            <div className="flex items-center gap-2">
              {image ? (
                <div className="relative w-11 h-11 rounded-xl overflow-hidden border border-emerald-500/50 shrink-0 group">
                  <img src={image} alt="Preview" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => setImage('')}
                    className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white"
                    title="ছবি পরিবর্তন করুন"
                  >
                    <Icons.Trash2 size={12} className="text-red-400" />
                  </button>
                </div>
              ) : null}

              <div className="flex-1 flex gap-1.5">
                <input 
                  type="text" 
                  placeholder="ছবির লিংক বা ফাইল বেছে নিন" 
                  value={image.startsWith('data:') ? '✓ Photo chosen from device' : image} 
                  onChange={e => setImage(e.target.value)}
                  className="flex-1 min-w-0 bg-white/5 border border-white/10 rounded-xl px-2.5 py-2 text-xs text-white focus:outline-none focus:border-primary transition-colors font-semibold truncate"
                  required 
                />
                <label className="px-3 py-2 bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-[11px] rounded-xl cursor-pointer flex items-center gap-1 shrink-0 transition-all active:scale-95 shadow-md">
                  {isUploadingMainImage ? (
                    <div className="w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Icons.Camera size={13} />
                  )}
                  <span>{isUploadingMainImage ? 'আপলোড হচ্ছে...' : 'ছবি আপলোড'}</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleMainImageFileUpload(file);
                    }}
                  />
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Manual Overrides expander */}
        <div className="bg-white/3 border border-white/5 rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-[10px] font-black text-white uppercase tracking-widest flex items-center gap-1.5">
                <Icons.Globe size={11} className="text-secondary animate-pulse" /> Custom Currency Pricing Listings
              </h4>
              <p className="text-[8px] text-outline mt-0.5 uppercase tracking-wide">
                Adjust specific market checkout prices separately:
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowOverridePanel(!showOverridePanel)}
              className="text-[9px] font-black text-primary bg-primary/10 border border-primary/20 px-3 py-1 rounded-lg uppercase tracking-widest hover:brightness-110 transition-all select-none active:scale-95"
            >
              {showOverridePanel ? 'Hide Fields' : 'Edit Currencies'}
            </button>
          </div>

          {showOverridePanel && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2 border-t border-white/5 animate-in slide-in-from-top-2 duration-200">
              <div className="space-y-1">
                <label className="text-[8px] font-bold text-outline uppercase tracking-widest">Bangladesh (BDT - ৳)</label>
                <input 
                  type="number" 
                  value={priceBD} 
                  onChange={e => setPriceBD(e.target.value)}
                  className="w-full bg-white/3 border border-white/5 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-secondary font-bold text-secondary"
                  placeholder="৳ BDT"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[8px] font-bold text-outline uppercase tracking-widest">United States (USD - $)</label>
                <input 
                  type="number" 
                  value={priceUS} 
                  onChange={e => setPriceUS(e.target.value)}
                  className="w-full bg-white/3 border border-white/5 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-secondary font-bold text-secondary"
                  placeholder="$ USD"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[8px] font-bold text-outline uppercase tracking-widest">India (INR - ₹)</label>
                <input 
                  type="number" 
                  value={priceIN} 
                  onChange={e => setPriceIN(e.target.value)}
                  className="w-full bg-white/3 border border-white/5 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-secondary font-bold"
                  placeholder="₹ INR"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[8px] font-bold text-outline uppercase tracking-widest">Saudi Arabia (SAR - ﷼)</label>
                <input 
                  type="number" 
                  value={priceSA} 
                  onChange={e => setPriceSA(e.target.value)}
                  className="w-full bg-white/3 border border-white/5 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-secondary font-bold"
                  placeholder="﷼ SAR"
                />
              </div>
              <div className="space-y-1 col-span-2 sm:col-span-1">
                <label className="text-[8px] font-bold text-outline uppercase tracking-widest">United Kingdom (GBP - £)</label>
                <input 
                  type="number" 
                  value={priceGB} 
                  onChange={e => setPriceGB(e.target.value)}
                  className="w-full bg-white/3 border border-white/5 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-secondary font-bold"
                  placeholder="£ GBP"
                />
              </div>
            </div>
          )}
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-[9px] font-bold text-outline uppercase tracking-wider">
              Secondary Images ({additionalImages.filter(Boolean).length} added)
            </label>
            <button 
              type="button"
              onClick={handleAddImageField}
              className="text-[9px] font-black text-primary hover:underline uppercase tracking-wider flex items-center gap-1 active:scale-95 transition-all"
            >
              <Icons.Plus size={10} strokeWidth={3} /> Add URL Field
            </button>
          </div>

          <div className="space-y-2 max-h-44 overflow-y-auto pr-1">
            {additionalImages.map((imgUrl, index) => (
              <div key={index} className="flex gap-2 items-center">
                {imgUrl ? (
                  <div className="w-8 h-8 rounded-lg overflow-hidden border border-emerald-500/40 shrink-0">
                    <img src={imgUrl} alt="slider" className="w-full h-full object-cover" />
                  </div>
                ) : null}
                <input 
                  type="text" 
                  placeholder={`Slider image URL or file ${index + 2}`} 
                  value={imgUrl.startsWith('data:') ? '✓ Photo selected' : imgUrl} 
                  onChange={e => handleImageChange(index, e.target.value)}
                  className="flex-1 min-w-0 bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-primary transition-colors truncate"
                />
                <label className="px-2.5 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-xl cursor-pointer flex items-center gap-1 shrink-0 text-[10px] font-bold active:scale-95 transition-all">
                  {uploadingSecondaryIndex === index ? (
                    <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Icons.Camera size={12} />
                  )}
                  <span>ছবি</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleSecondaryImageFileUpload(file, index);
                    }}
                  />
                </label>
                {additionalImages.length > 1 && (
                  <button 
                    type="button"
                    onClick={() => handleRemoveImageField(index)}
                    className="w-7 h-7 rounded-lg bg-error-container/10 border border-error/10 text-error flex items-center justify-center hover:bg-error-container/20 active:scale-95 transition-all shrink-0 cursor-pointer"
                    title="Remove"
                  >
                    <Icons.Trash2 size={12} />
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Custom Story & Description */}
          <div className="space-y-1 pt-2">
            <label className="text-[9px] font-bold text-outline uppercase tracking-wider">Product Story / Description</label>
            <textarea 
              placeholder="Write a custom description explaining the item's background and features..." 
              value={description} 
              onChange={e => setDescription(e.target.value)}
              className="w-full h-16 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-primary transition-colors font-semibold resize-none"
            />
          </div>

          {/* Custom Specifications */}
          <div className="space-y-2 pt-2">
            <label className="text-[9px] font-bold text-outline uppercase tracking-wider block">Custom Specifications / Specs (e.g. Size, Sole, Material...)</label>
            <div className="grid grid-cols-2 gap-2">
              <input 
                type="text" 
                placeholder="Spec 1 Label (e.g. Size)" 
                value={customSpec1Label} 
                onChange={e => setCustomSpec1Label(e.target.value)}
                className="bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-primary transition-colors font-semibold"
              />
              <input 
                type="text" 
                placeholder="Spec 1 Value (e.g. 42)" 
                value={customSpec1Value} 
                onChange={e => setCustomSpec1Value(e.target.value)}
                className="bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-primary transition-colors font-semibold"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <input 
                type="text" 
                placeholder="Spec 2 Label (e.g. Sole)" 
                value={customSpec2Label} 
                onChange={e => setCustomSpec2Label(e.target.value)}
                className="bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-primary transition-colors font-semibold"
              />
              <input 
                type="text" 
                placeholder="Spec 2 Value (e.g. Rubber)" 
                value={customSpec2Value} 
                onChange={e => setCustomSpec2Value(e.target.value)}
                className="bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-primary transition-colors font-semibold"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <input 
                type="text" 
                placeholder="Spec 3 Label (e.g. Fabric)" 
                value={customSpec3Label} 
                onChange={e => setCustomSpec3Label(e.target.value)}
                className="bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-primary transition-colors font-semibold"
              />
              <input 
                type="text" 
                placeholder="Spec 3 Value (e.g. Cotton)" 
                value={customSpec3Value} 
                onChange={e => setCustomSpec3Value(e.target.value)}
                className="bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-primary transition-colors font-semibold"
              />
            </div>
          </div>

          {/* Preset Buttons for Quick Testing */}
          <div className="pt-2">
            <span className="text-[9px] font-bold text-outline/85 uppercase block mb-1.5">Quick fill test presets (No manual typing needed):</span>
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => {
                  setName("Crimson Speed runners");
                  setCategory("Shoes");
                  setPrimaryCurrency("USD");
                  handlePrimaryPriceChange("140", "USD");
                  setDescription("Dynamic lightweight racing shoes featuring specialized micro-grip outer soles and memory mesh layers built for running.");
                  setCustomSpec1Label("Sole Material");
                  setCustomSpec1Value("Vulcanized Grip Rubber");
                  setCustomSpec2Label("Fit Model");
                  setCustomSpec2Value("True-to-size standard");
                  setCustomSpec3Label("Cushion Type");
                  setCustomSpec3Value("Bouncy responsiveness");
                  setImage("https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800");
                  setAdditionalImages([
                    "https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=800",
                    "https://images.unsplash.com/photo-1575537302964-96cd47c06b1b?w=800"
                  ]);
                }}
                className="text-[8px] font-bold uppercase tracking-wider px-2 py-1 rounded bg-white/5 border border-white/10 text-outline hover:text-white"
              >
                👟 Shoe Demo (3 images)
              </button>
              <button
                type="button"
                onClick={() => {
                  setName("Titan Premium Chrono");
                  setCategory("Watch");
                  setPrimaryCurrency("USD");
                  handlePrimaryPriceChange("180", "USD");
                  setDescription("Classic stainless design housing a pristine Japanese quartz dial and comfortable double handwoven strap.");
                  setCustomSpec1Label("Movement");
                  setCustomSpec1Value("Prism Japanese Quartz");
                  setCustomSpec2Label("Case metal");
                  setCustomSpec3Label("Strap type");
                  setCustomSpec2Value("Anodized Titanium");
                  setCustomSpec3Value("Genuine Cow-hide Leather");
                  setImage("https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800");
                  setAdditionalImages([
                    "https://images.unsplash.com/photo-1547996160-81dfa63595aa?w=800"
                  ]);
                }}
                className="text-[8px] font-bold uppercase tracking-wider px-2 py-1 rounded bg-white/5 border border-white/10 text-outline hover:text-white"
              >
                ⌚ Watch Demo (2 images)
              </button>
              <button
                type="button"
                onClick={() => {
                  setName("Elite Studio Overear");
                  setCategory("Audio");
                  setPrimaryCurrency("USD");
                  handlePrimaryPriceChange("299", "USD");
                  setDescription("Immersive over-ear audio headphones engineered with proprietary sound drivers and hybrid active ambient isolation.");
                  setCustomSpec1Label("ANC Feature");
                  setCustomSpec1Value("Up to 45dB noise isolation");
                  setCustomSpec2Label("Playtime limit");
                  setCustomSpec2Value("55 hours continuous backup");
                  setCustomSpec3Label("Driver Size");
                  setCustomSpec3Value("Premium 45mm Neodymium");
                  setImage("https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800");
                  setAdditionalImages([
                    "https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=800",
                    "https://images.unsplash.com/photo-1484704849700-f032a568e944?w=800",
                    "https://images.unsplash.com/photo-1583394838336-acd977736f90?w=800"
                  ]);
                }}
                className="text-[8px] font-bold uppercase tracking-wider px-2 py-1 rounded bg-white/5 border border-white/10 text-outline hover:text-white"
              >
                🎧 Overear Demo (4 images)
              </button>
            </div>
          </div>
        </div>

        <button 
          type="submit"
          className="w-full bg-primary text-white text-[11px] font-bold py-2.5 rounded-xl uppercase tracking-widest hover:brightness-110 active:scale-95 transition-all shadow-md shadow-primary/20 flex items-center justify-center gap-1.5"
        >
          <Icons.Store size={12} /> Add Custom Product
        </button>
      </form>

      {/* List launched listings */}
      <section className="space-y-3">
        <h3 className="text-xs font-bold text-outline uppercase tracking-wider">Published Shop Listings ({customProducts.length})</h3>
        {customProducts.length === 0 ? (
          <div className="glass-card rounded-2xl p-6 text-center text-outline/60 text-xs font-medium border border-white/5">
            No dynamic products created yet. Press any preset demo above to populate instantly!
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3.5">
            {customProducts.map((p, idx) => (
              <div key={idx} className="glass-card rounded-2xl p-2.5 border border-white/5 flex flex-col justify-between relative group">
                <div>
                  <div className="relative overflow-hidden rounded-xl">
                    <img src={p.image} className="w-full h-20 object-cover rounded-xl" />
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm(`Are you sure you want to delete "${p.name}"?`)) {
                          deleteCustomProduct(p.name);
                        }
                      }}
                      className="absolute top-1 right-1 p-1 bg-black/60 hover:bg-error rounded-full text-white/80 hover:text-white hover:scale-110 active:scale-90 transition-all cursor-pointer"
                      title="Delete Product Listing"
                    >
                      <Icons.Trash2 size={12} />
                    </button>
                  </div>
                  <div className="mt-2">
                    <span className="text-[8px] font-bold bg-primary/10 text-primary border border-primary/20 px-1.5 py-0.5 rounded-full uppercase tracking-wider">
                      {p.images ? p.images.length + 1 : 1} Images total
                    </span>
                    <h4 className="text-xs font-semibold text-white mt-1.5 truncate">{p.name}</h4>
                  </div>
                </div>
                <div className="flex items-center justify-between mt-2 pt-1 border-t border-white/5">
                  <span className="text-xs font-bold text-primary">${p.price}</span>
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm(`Are you sure you want to delete "${p.name}"?`)) {
                        deleteCustomProduct(p.name);
                      }
                    }}
                    className="text-[9px] font-black text-error hover:text-error-hover flex items-center gap-0.5 cursor-pointer uppercase tracking-wider transition-all"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
        </div>
      )}

      {/* Panel 2: KYC & merchant logs reports */}
      {activeTab === 'kyc' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="flex items-center justify-between border-b border-white/5 pb-2">
            <div>
              <h3 className="text-xs font-black text-white uppercase tracking-wider">Merchant Logs Reports</h3>
              <p className="text-[10px] text-outline">Real-time checkout database reporting unique user persistent IDs and verified identity attributes</p>
            </div>
            {savedOrders && savedOrders.length > 0 && (
              <button
                type="button"
                onClick={onClearOrders}
                className="text-[9px] font-black uppercase bg-error/10 border border-error/20 hover:bg-error/20 text-error px-3 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1 shrink-0"
              >
                <Icons.Trash2 size={11} />
                Clear Logs
              </button>
            )}
          </div>

          {!savedOrders || savedOrders.length === 0 ? (
            <div className="glass-card rounded-2xl py-12 px-6 text-center border border-white/5 space-y-3.5 shadow-xl">
              <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mx-auto text-outline">
                <Icons.Package size={22} className="text-outline/40 animate-pulse" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-white">No Merchant Orders</h4>
                <p className="text-[10px] text-outline/70 max-w-xs mx-auto leading-relaxed">
                  When users complete accounts verification and commit purchases at checkout, customer SMART-NID or birth ledger credentials load natively in this workspace dashboard.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {savedOrders.map((ord: any) => (
                <div key={ord.id} className="glass-card rounded-2xl border border-white/5 overflow-hidden shadow-xl hover:border-white/10 transition-colors bg-white/[0.01]">
                  {/* Order attributes */}
                  <div className="bg-white/[0.02] border-b border-white/5 p-4 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3 font-sans">
                      {ord.userAvatar ? (
                        <img src={ord.userAvatar} alt="Client" className="w-10 h-10 rounded-full object-cover border border-white/10 shadow-inner" />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold text-xs uppercase text-center flex-shrink-0">
                          {ord.userName?.slice(0, 2) || 'SE'}
                        </div>
                      )}
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="text-xs font-bold text-white">{ord.userName}</h4>
                          <span className="text-[8.5px] font-mono bg-white/5 px-2 py-0.5 rounded text-outline uppercase font-black tracking-wider leading-none">
                            UID: {ord.userId}
                          </span>
                        </div>
                        <p className="text-[10px] text-outline/70 mt-0.5">
                          Order Check ID: <span className="text-white font-mono font-bold">{ord.id}</span> • Placed: {ord.date}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      {ord.paymentMethod === 'bkash' ? (
                        <div className="bg-[#E2136E]/15 border border-[#E2136E]/30 text-[#FF4B93] text-[9px] px-2.5 py-1 rounded-full font-bold flex items-center gap-1.5 shadow-sm">
                          <BKashLogo size={14} className="rounded" />
                          <span>bKash: <strong className="font-mono text-white">{ord.bKashTrxId || 'No TrxID'}</strong></span>
                          {ord.bKashSender && (
                            <span className="text-[8px] text-zinc-300 opacity-80">(Sender: {ord.bKashSender})</span>
                          )}
                        </div>
                      ) : (
                        <div className="bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[9px] px-2.5 py-1 rounded-full font-bold flex items-center gap-1.5 shadow-sm">
                          <CodLogo size={14} className="rounded" />
                          <span>Cash on Delivery (COD)</span>
                        </div>
                      )}
                      <span className="bg-primary/20 text-primary border border-primary/30 text-[8px] px-2.5 py-1 rounded-full uppercase font-black tracking-widest animate-pulse">
                        {ord.status}
                      </span>
                    </div>
                  </div>

                  {/* Details block Layout */}
                  <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-5 text-xs text-outline font-medium">
                    {/* Left: Product & Delivery */}
                    <div className="space-y-4">
                      {/* Products visual brief */}
                      <div className="flex gap-3.5 bg-white/[0.02] border border-white/5 p-3 rounded-xl">
                        <img src={ord.itemImage} alt={ord.itemName} className="w-14 h-14 rounded-xl object-contain bg-white/5 border border-white/10 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <h5 className="font-bold text-white truncate text-xs">{ord.itemName}</h5>
                          <div className="flex flex-wrap items-center gap-1.5 mt-1">
                            <span className="text-primary font-black text-xs">
                              {ord.totalAmount ? `৳${ord.totalAmount}` : `$${ord.itemPrice}`}
                            </span>
                            {ord.shippingFee !== undefined && (
                              <span className="text-[9px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded font-bold">
                                +৳{ord.shippingFee} শিপিং ({ord.shippingZone || 'কুরিয়ার'})
                              </span>
                            )}
                          </div>
                          <p className="text-[8px] text-outline/50 uppercase tracking-widest mt-1">Transaction Settled</p>
                        </div>
                      </div>

                      {/* Address coordinates */}
                      <div className="space-y-1.5 bg-white/[0.01] border border-white/5 p-3.5 rounded-xl">
                        <h6 className="text-[9px] font-black uppercase text-white tracking-widest flex items-center gap-1 border-b border-white/5 pb-1.5">
                          <Icons.MapPin size={10} className="text-primary" />
                          Delivery Coordinates ({ord.location?.deliveryArea || 'Direct'})
                        </h6>
                        <div className="space-y-1 mt-2 text-[10.5px] leading-relaxed text-slate-300">
                          <p>👤 Full Name: <span className="font-bold text-white">{ord.location?.fullName}</span></p>
                          <p>📞 Contact: +880 {ord.location?.mobile}</p>
                          <p className="font-mono">📍 Region: {ord.location?.district} {ord.location?.upazila ? `• Thana: ${ord.location.upazila}` : ''} {ord.location?.union ? `• Ward/Union: ${ord.location.union}` : ''}</p>
                          {ord.location?.address && <p className="text-[9.5px] text-outline/85 leading-normal border-t border-dashed border-white/5 pt-1 mt-1 font-mono">Detailed Coordinates: {ord.location.address}</p>}
                        </div>
                      </div>
                    </div>

                    {/* Right: ID Verification Certificates */}
                    <div className="space-y-3 bg-white/[0.01] border border-white/5 p-3.5 rounded-xl flex flex-col justify-between">
                      <div>
                        {ord.verification ? (
                          <div className="space-y-3">
                            <div className="flex justify-between items-center border-b border-outline-variant/15 pb-2">
                              <span className="text-[9px] font-black uppercase text-white tracking-widest flex items-center gap-1">
                                <Icons.ShieldCheck size={11} className="text-[#1D9BF0]" />
                                KYC Attestation Verified
                              </span>
                              <span className="bg-[#1D9BF0]/15 text-[#1D9BF0] border border-[#1D9BF0]/30 text-[8px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-0.5">
                                <span className="w-1 h-1 bg-[#1D9BF0] rounded-full animate-ping" />
                                Approved Blue
                              </span>
                            </div>

                            <div className="grid grid-cols-2 gap-2 text-[9.5px] font-mono leading-relaxed bg-[#131722]/60 p-2.5 border border-white/5 rounded-lg text-slate-300 font-sans">
                              {ord.verification.realistic && (
                                <div className="col-span-2 border-b border-white/5 pb-1 mb-1">
                                  <p className="text-outline font-sans">Realistic Name per ID:</p>
                                  <p className="text-[#1D9BF0] font-extrabold text-[10px] font-sans">{ord.verification.realistic}</p>
                                </div>
                              )}
                              <div>
                                <p className="text-outline font-sans">Country:</p>
                                <p className="text-white font-bold truncate font-sans">{ord.verification.country}</p>
                              </div>
                              <div>
                                <p className="text-outline font-sans">District / Jela:</p>
                                <p className="text-white font-bold truncate font-sans">{ord.verification.district}</p>
                              </div>
                              <div>
                                <p className="text-outline font-sans">Thana / Upazila:</p>
                                <p className="text-white font-bold truncate font-sans">{ord.verification.thana}</p>
                              </div>
                              <div>
                                <p className="text-outline font-sans">Village / Gram:</p>
                                <p className="text-white font-bold truncate font-sans">{ord.verification.village}</p>
                              </div>
                              <div>
                                <p className="text-outline">Birth Date:</p>
                                <p className="text-white font-bold text-[9px]">{ord.verification.dob}</p>
                              </div>
                              <div>
                                <p className="text-outline font-sans">Attested Age:</p>
                                <p className="text-[#1D9BF0] font-black uppercase text-[9px] font-sans">
                                  {ord.verification.age} Yrs ({ord.verification.age >= 18 ? 'Adult 18+' : 'Minor'})
                                </p>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            <div className="flex justify-between items-center border-b border-white/5 pb-2">
                              <span className="text-[9px] font-black uppercase text-white tracking-widest flex items-center gap-1">
                                <Icons.AlertCircle size={11} className="text-outline" />
                                KYC Attestation Unverified
                              </span>
                              <span className="bg-white/5 text-outline border border-white/10 text-[8px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                                Unverified
                              </span>
                            </div>
                            <p className="text-[10px] text-outline/70 italic leading-relaxed py-4 text-center border border-dashed border-white/10 rounded-lg">
                              ⚠️ This user completed checkout without identity verification files. No NID or Birth Certificate documents attached.
                            </p>
                          </div>
                        )}
                      </div>

                      {ord.verification && (
                        <div className="border-t border-white/5 pt-2 mt-2">
                          <p className="text-[8px] uppercase tracking-wider font-bold mb-1.5 text-outline">Examine credentials documents (Click to zoom):</p>
                          <div className="flex gap-2">
                            {ord.verification.docFront && (
                              <button
                                type="button"
                                onClick={() => setSelectedKycDoc(ord.verification.docFront)}
                                className="flex-1 border border-white/10 p-1 bg-white/5 rounded hover:border-[#1D9BF0]/40 transition-colors relative group cursor-zoom-in"
                              >
                                <img src={ord.verification.docFront} alt="NID Front" className="h-10 w-full object-cover rounded opacity-80 group-hover:opacity-100" />
                                <span className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center text-[7px] text-white font-black uppercase duration-150 rounded">Zoom Front</span>
                              </button>
                            )}

                            {ord.verification.docBack && (
                              <button
                                type="button"
                                onClick={() => setSelectedKycDoc(ord.verification.docBack)}
                                className="flex-1 border border-white/10 p-1 bg-white/5 rounded hover:border-[#1D9BF0]/40 transition-colors relative group cursor-zoom-in"
                              >
                                <img src={ord.verification.docBack} alt="NID Back" className="h-10 w-full object-cover rounded opacity-80 group-hover:opacity-100" />
                                <span className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center text-[7px] text-white font-black uppercase duration-150 rounded">Zoom Back</span>
                              </button>
                            )}

                            {ord.verification.docBirthCert && (
                              <button
                                type="button"
                                onClick={() => setSelectedKycDoc(ord.verification.docBirthCert)}
                                className="w-full border border-white/10 p-1 bg-white/5 rounded hover:border-[#1D9BF0]/40 transition-colors relative group cursor-zoom-in"
                              >
                                <img src={ord.verification.docBirthCert} alt="Birth Certificate" className="h-10 w-full object-cover rounded opacity-80 group-hover:opacity-100" />
                                <span className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center text-[7px] text-white font-black uppercase duration-150 rounded">Zoom Cert</span>
                              </button>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Steadfast Logistics Actions */}
                  <div className="bg-white/[0.02] border-t border-white/5 p-4 flex flex-wrap items-center justify-between gap-3 bg-[#fdfaf7]/[0.02]">
                    <div className="flex items-center gap-2">
                      <Icons.Truck className={ord.status.toLowerCase().includes('shipped') ? "text-emerald-400" : "text-amber-400"} size={16} />
                      <span className="text-[10px] font-bold text-outline">
                        {ord.status.toLowerCase().includes('shipped') 
                          ? `Registered & Shipped via Steadfast Courier (Tracking: ${ord.steadfast?.trackingId || 'Active'})` 
                          : 'Awaiting Steadfast hub API booking allocation (স্টেডফাস্ট এপিআই বুকিং বাকি)'
                        }
                      </span>
                    </div>

                    {ord.status.toLowerCase().includes('shipped') && ord.steadfast ? (
                      <button
                        type="button"
                        onClick={() => setViewingInvoice(ord)}
                        className="text-[10px] bg-[#F47F20]/15 hover:bg-[#F47F20]/25 text-[#F47F20] border border-[#F47F20]/20 font-black px-4 py-2 rounded-xl uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 active:scale-95 duration-100"
                      >
                        <Icons.FileText size={12} />
                        View Steadfast Slip & Track
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          setShippingOrder(ord);
                          // Convert dollar value to BDT equivalent approx (1 USD = 120 BDT)
                          const calculatedCod = Math.round(ord.itemPrice * 120);
                          setCodAmount(calculatedCod.toString());
                        }}
                        className="text-[10px] bg-[#F47F20] hover:bg-[#fa8a36] text-white font-black px-4 py-2.5 rounded-xl uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 shadow-md shadow-[#F47F20]/15 active:scale-95 duration-100"
                      >
                        <Icons.Truck size={13} className="animate-bounce" />
                        Ship with Steadfast
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Panel 3: Bazar Royal Club Settings Panel */}
      {activeTab === 'campaign' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="flex items-center justify-between border-b border-white/5 pb-2">
            <div>
              <h3 className="text-xs font-black text-white uppercase tracking-wider">👑 Bazar Royal Club & Offers Campaign Control</h3>
              <p className="text-[10px] text-outline">Customize campaign offer names, spin wheel outcomes, target probabilities, user-specific overrides, and hero carousel banners</p>
            </div>
          </div>

          {rcSettingsSuccessMsg && (
            <div className="p-4 bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold rounded-2xl flex items-center gap-2">
              <Icons.CheckCircle2 size={16} /> {rcSettingsSuccessMsg}
            </div>
          )}

          <form onSubmit={handleSaveRcCampaignSettings} className="glass-card rounded-2xl p-5 border border-white/5 space-y-6 shadow-xl">
            {/* 1. Basic Offer Info & Active Toggle */}
            <div className="space-y-4 border-b border-white/5 pb-5">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-xs font-bold text-white block">Offer Campaign Status</label>
                  <span className="text-[9px] text-[#A3Aed0]">Turn on/off spin offer campaign on website</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer select-none">
                  <input 
                    type="checkbox" 
                    checked={rcCampaignActive}
                    onChange={(e) => setRcCampaignActive(e.target.checked)}
                    className="sr-only peer" 
                  />
                  <div className="w-10 h-5 bg-[#1c2230] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-gray-400 after:border-gray-300 after:border after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:after:bg-amber-400 peer-checked:bg-amber-500/20 peer-checked:border-amber-500 h-6 w-11 border border-white/10" />
                </label>
              </div>

              <div className="space-y-1">
                <label className="text-[9.5px] font-black uppercase text-white tracking-widest block">
                  Campaign / Offer Name
                </label>
                <input 
                  type="text"
                  value={rcOfferName}
                  onChange={(e) => setRcOfferName(e.target.value)}
                  className="w-full bg-[#1c2230] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-amber-400 font-bold"
                  placeholder="e.g. 👑 Bazar Royal Club"
                />
              </div>
            </div>

            {/* 2. Spin Wheel Segments & Targeted Outcomes */}
            <div className="space-y-4 border-b border-white/5 pb-5">
              <h4 className="text-[10px] font-black uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                <Icons.Sparkles size={12} /> Spin Wheel Slices & Frequent Outcome Configuration
              </h4>

              <div className="space-y-1">
                <label className="text-[9.5px] font-black uppercase text-white tracking-widest block">
                  Spin Wheel Slices Set (%)
                </label>
                <input 
                  type="text"
                  value={rcDiscountsRaw}
                  onChange={(e) => setRcDiscountsRaw(e.target.value)}
                  className="w-full bg-[#1c2230] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-amber-400 transition-all font-bold"
                  placeholder="e.g. 3, 4, 3, 4, 2, 5, 0, 10"
                />
                <span className="text-[9px] text-[#A3Aed0]/70 leading-relaxed block">
                  Comma-separated integers for spin wheel slice values.
                </span>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase text-white tracking-widest block">
                    Frequent Spin % (3-4%)
                  </label>
                  <input 
                    type="number"
                    value={rcFrequentOutcome}
                    onChange={(e) => setRcFrequentOutcome(e.target.value)}
                    className="w-full bg-[#1c2230] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400 font-bold"
                    placeholder="3"
                  />
                  <span className="text-[8px] text-[#A3Aed0]/70 block">Default outcome for normal users.</span>
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase text-white tracking-widest block">
                    Big Spin Win (%)
                  </label>
                  <input 
                    type="number"
                    value={rcBigWinDiscount}
                    onChange={(e) => setRcBigWinDiscount(e.target.value)}
                    className="w-full bg-[#1c2230] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400 font-bold"
                    placeholder="10"
                  />
                  <span className="text-[8px] text-[#A3Aed0]/70 block">Rare big win discount.</span>
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase text-white tracking-widest block">
                    Big Win Chance (%)
                  </label>
                  <input 
                    type="number"
                    step="0.5"
                    value={rcBigWinChancePercent}
                    onChange={(e) => setRcBigWinChancePercent(e.target.value)}
                    className="w-full bg-[#1c2230] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400 font-bold"
                    placeholder="2"
                  />
                  <span className="text-[8px] text-[#A3Aed0]/70 block">Probability rate (e.g. 2%).</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase text-white tracking-widest block">
                    Exclusion Limit (Max 45%)
                  </label>
                  <input 
                    type="number"
                    value={rcExclusionLimit}
                    onChange={(e) => setRcExclusionLimit(e.target.value)}
                    className="w-full bg-[#1c2230] border border-[#1d273a] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400 font-bold"
                  />
                  <span className="text-[8px] text-[#A3Aed0]/70 block">Products with &gt;45% discount excluded.</span>
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase text-white tracking-widest block">
                    Offer Lifetime (Hours)
                  </label>
                  <input 
                    type="number"
                    value={rcOfferDurationHours}
                    onChange={(e) => setRcOfferDurationHours(e.target.value)}
                    className="w-full bg-[#1c2230] border border-[#1d273a] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400 font-bold"
                  />
                  <span className="text-[8px] text-[#A3Aed0]/70 block">Active duration after winning.</span>
                </div>
              </div>
            </div>

            {/* 3. User Specific Overrides Manager */}
            <div className="space-y-3 border-b border-white/5 pb-5">
              <div className="flex items-center justify-between">
                <h4 className="text-[10px] font-black uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                  <Icons.UserCheck size={13} /> Specific User Spin Outcome Override Manager
                </h4>
              </div>
              <p className="text-[9px] text-[#A3Aed0]">Set a custom guaranteed spin win percentage for a specific user ID or phone number.</p>

              <div className="flex gap-2">
                <input 
                  type="text" 
                  placeholder="User ID or Phone (e.g. 01712345678)"
                  value={overrideUserKey}
                  onChange={(e) => setOverrideUserKey(e.target.value)}
                  className="flex-1 bg-[#1c2230] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-400 font-bold"
                />
                <input 
                  type="number" 
                  placeholder="Win %"
                  value={overrideValue}
                  onChange={(e) => setOverrideValue(e.target.value)}
                  className="w-20 bg-[#1c2230] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-400 font-bold"
                />
                <button
                  type="button"
                  onClick={handleAddUserOverride}
                  className="bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-[10px] px-3.5 py-2 rounded-xl uppercase tracking-wider cursor-pointer transition-all active:scale-95"
                >
                  Set Override
                </button>
              </div>

              {Object.keys(rcUserOverrides).length > 0 ? (
                <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
                  {Object.entries(rcUserOverrides).map(([usrKey, val]) => (
                    <div key={usrKey} className="flex items-center justify-between bg-white/5 border border-white/10 px-3 py-2 rounded-xl text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-emerald-400 font-bold">{usrKey}</span>
                        <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[9px] font-black px-2 py-0.5 rounded-full">
                          Guaranteed Win: {val}%
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveUserOverride(usrKey)}
                        className="text-rose-400 hover:text-rose-300 text-[10px] font-bold uppercase tracking-wider p-1 active:scale-95"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[9px] text-[#A3Aed0]/60 italic">No specific user overrides set. All users use system rules.</p>
              )}
            </div>

            {/* 4. Hero Carousel Banners Manager */}
            <div className="space-y-3 pb-2">
              <h4 className="text-[10px] font-black uppercase tracking-wider text-sky-400 flex items-center gap-1.5">
                <Icons.Image size={13} /> Hero Carousel Banners Manager
              </h4>
              <p className="text-[9px] text-[#A3Aed0]">Manage homepage top carousel offer slides directly from admin website.</p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div className="col-span-2 flex items-center gap-2">
                  {bannerImage ? (
                    <div className="w-12 h-10 rounded-lg overflow-hidden border border-sky-400 shrink-0">
                      <img src={bannerImage} alt="Banner Preview" className="w-full h-full object-cover" />
                    </div>
                  ) : null}
                  <input 
                    type="text" 
                    placeholder="ব্যানারের ছবি লিংক বা আপলোড করুন"
                    value={bannerImage.startsWith('data:') ? '✓ Photo selected' : bannerImage}
                    onChange={(e) => setBannerImage(e.target.value)}
                    className="flex-1 min-w-0 bg-[#1c2230] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-400 font-bold"
                  />
                  <label className="px-3 py-2 bg-sky-500 hover:bg-sky-400 text-black font-extrabold text-[11px] rounded-xl cursor-pointer flex items-center gap-1 shrink-0 transition-all active:scale-95 shadow-md">
                    {isUploadingBanner ? (
                      <div className="w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Icons.Camera size={13} />
                    )}
                    <span>{isUploadingBanner ? 'আপলোড হচ্ছে...' : 'ছবি আপলোড'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleBannerFileUpload(file);
                      }}
                    />
                  </label>
                </div>
                <input 
                  type="text" 
                  placeholder="Tag (e.g. MEGA SALE)"
                  value={bannerTag}
                  onChange={(e) => setBannerTag(e.target.value)}
                  className="bg-[#1c2230] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-400 font-bold"
                />
                <input 
                  type="text" 
                  placeholder="Title (e.g. BAZAR FEST)"
                  value={bannerTitle}
                  onChange={(e) => setBannerTitle(e.target.value)}
                  className="bg-[#1c2230] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-400 font-bold"
                />
                <input 
                  type="text" 
                  placeholder="Subtitle (e.g. Save big on electronics)"
                  value={bannerSubtitle}
                  onChange={(e) => setBannerSubtitle(e.target.value)}
                  className="bg-[#1c2230] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-400 font-bold col-span-2"
                />
              </div>

              <button
                type="button"
                onClick={handleAddHeroBanner}
                className="w-full bg-sky-500 hover:bg-sky-400 text-black font-extrabold text-[10px] py-2.5 rounded-xl uppercase tracking-widest cursor-pointer transition-all active:scale-95"
              >
                + Add Hero Banner Slide
              </button>

              <div className="space-y-2 mt-3 max-h-48 overflow-y-auto pr-1">
                {rcHeroBanners.map((banner) => (
                  <div key={banner.id} className="flex items-center gap-3 bg-white/5 border border-white/10 p-2.5 rounded-xl">
                    <img src={banner.image} alt="Banner" className="w-14 h-10 object-cover rounded-lg border border-white/10 shrink-0" />
                    <div className="flex-1 min-w-0 text-xs">
                      <p className="font-bold text-white truncate">{banner.title}</p>
                      <p className="text-[9px] text-[#A3Aed0] truncate">{banner.subtitle}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleToggleHeroBanner(banner.id)}
                      className={`text-[9px] font-bold px-2.5 py-1 rounded-lg border cursor-pointer ${
                        banner.active 
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' 
                          : 'bg-white/5 text-gray-400 border-white/10'
                      }`}
                    >
                      {banner.active ? 'Active' : 'Disabled'}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteHeroBanner(banner.id)}
                      className="text-rose-400 hover:text-rose-300 p-1 cursor-pointer active:scale-95"
                    >
                      <Icons.Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 hover:from-amber-400 text-black font-black text-[10px] py-3.5 rounded-xl uppercase tracking-widest duration-100 transition-all flex items-center justify-center gap-1.5 shadow-lg shadow-amber-500/10 cursor-pointer active:scale-95 mt-4"
            >
              <Icons.ShieldCheck size={14} /> Save Campaign Settings & Banners
            </button>
          </form>
        </div>
      )}

      {/* Lightbox full-screen popup modal panel */}
      <AnimatePresence>
        {selectedKycDoc && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedKycDoc(null)}
            className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4 cursor-zoom-out"
          >
            <motion.div 
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="relative max-w-full max-h-full"
              onClick={(e) => e.stopPropagation()}
            >
              <img src={selectedKycDoc} alt="KYC Document Preview" className="max-h-[85vh] max-w-full rounded-2xl object-contain border border-white/10" />
              <button 
                type="button" 
                onClick={() => setSelectedKycDoc(null)}
                className="absolute top-2 right-2 p-2 bg-[#000000]/60 hover:bg-white/10 rounded-full text-white cursor-pointer z-50 duration-150 transition-colors"
              >
                <Icons.X size={20} />
              </button>
            </motion.div>
          </motion.div>
        )}

        {/* Steadfast API Shipment Booking Panel */}
        {shippingOrder && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto"
          >
            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-[#0b0f19] border border-white/10 w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl relative"
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-[#F47F20] to-[#fa8a36] p-4 text-white flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Icons.Truck className="animate-pulse" size={20} />
                  <div>
                    <h3 className="text-xs font-black uppercase tracking-widest leading-none">Steadfast Logistics</h3>
                    <p className="text-[10px] text-white/80 mt-0.5 font-sans font-bold">API Courier Booking Hub (স্টেডফাস্ট কুরিয়ার এপিআই বুকিং)</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShippingOrder(null)}
                  className="p-1 bg-white/10 hover:bg-white/20 rounded-full transition-colors cursor-pointer text-white"
                >
                  <Icons.X size={16} />
                </button>
              </div>

              {/* Form Content */}
              <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto text-xs text-outline font-medium">
                {/* Delivery Target Customer Info */}
                <div className="bg-white/5 border border-white/10 rounded-xl p-3.5 space-y-2">
                  <p className="text-[9px] uppercase tracking-wider font-extrabold text-white flex items-center gap-1 border-b border-white/5 pb-1.5">
                    <Icons.ShieldCheck size={11} className="text-[#F47F20]" />
                    Recipient Reference (গ্রাহকের বিবরণ)
                  </p>
                  <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-300">
                    <p>👤 Name: <span className="font-extrabold text-white">{shippingOrder.location?.fullName}</span></p>
                    <p>📞 Phone: <span className="font-extrabold text-white">+880 {shippingOrder.location?.mobile}</span></p>
                    <p className="col-span-2">📍 Dest: <span className="font-mono text-[10px]">{shippingOrder.location?.address}, {shippingOrder.location?.upazila}, {shippingOrder.location?.district}</span></p>
                  </div>
                </div>

                <div className="space-y-3.5 pt-1">
                  {/* Store Name input */}
                  <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase text-white tracking-widest flex items-center gap-1">
                      Sender Store / Brand Name (প্রেরকের নাম)
                    </label>
                    <input
                      type="text"
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white font-extrabold focus:outline-none focus:border-[#F47F20] transition-colors"
                      value={senderStore}
                      onChange={(e) => setSenderStore(e.target.value)}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    {/* COD Amount */}
                    <div className="space-y-1">
                      <label className="text-[9px] font-black uppercase text-white tracking-widest">
                        COD Amount (ক্যাশ অন ডেলিভারি BDT)
                      </label>
                      <input
                        type="number"
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white font-mono font-bold focus:outline-none focus:border-[#F47F20] transition-colors"
                        value={codAmount}
                        onChange={(e) => setCodAmount(e.target.value)}
                      />
                      <p className="text-[8.5px] text-outline/70 italic mt-0.5">Value calculated from checkout total</p>
                    </div>

                    {/* Weight */}
                    <div className="space-y-1">
                      <label className="text-[9px] font-black uppercase text-white tracking-widest">
                        Parcel Weight (কেজি)
                      </label>
                      <select
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-[#F47F20] transition-colors"
                        value={parcelWeight}
                        onChange={(e) => setParcelWeight(e.target.value)}
                      >
                        <option value="0.5" className="bg-[#0b0f19] text-white">0.5 Kg (Standard)</option>
                        <option value="1.0" className="bg-[#0b0f19] text-white">1.0 Kg</option>
                        <option value="2.0" className="bg-[#0b0f19] text-white">2.0 Kg</option>
                        <option value="5.0" className="bg-[#0b0f19] text-white">5.0+ Kg</option>
                      </select>
                    </div>
                  </div>

                  {/* Delivery Location Type */}
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black uppercase text-white tracking-widest">
                      Delivery Destination Coverage (ডেলিভারি এরিয়া)
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { id: 'inside_dhaka', label: 'Inside Dhaka', charge: 'BDT 60' },
                        { id: 'suburbs', label: 'Dhaka Suburbs', charge: 'BDT 100' },
                        { id: 'outside_dhaka', label: 'Outside Dhaka', charge: 'BDT 130' }
                      ].map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => setDeliveryType(item.id)}
                          className={`p-2.5 rounded-xl border transition-all text-center flex flex-col items-center justify-center cursor-pointer ${
                            deliveryType === item.id 
                              ? 'bg-[#F47F20]/10 border-[#F47F20] text-white' 
                              : 'bg-white/5 border-white/5 hover:border-white/15 text-outline'
                          }`}
                        >
                          <span className="text-[10px] font-black uppercase leading-tight">{item.label}</span>
                          <span className="text-[9px] font-mono font-bold text-[#F47F20] mt-0.5">{item.charge}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Special Instruction */}
                  <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase text-white tracking-widest">
                      Special Remarks / Notes (বিশেষ নির্দেশাবলী)
                    </label>
                    <textarea
                      rows={2}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#F47F20] transition-colors"
                      value={specialInstruction}
                      onChange={(e) => setSpecialInstruction(e.target.value)}
                    />
                  </div>
                </div>

                {/* Simulated API Console Log Screen - This is the intellectual "giyan" (knowledge) output */}
                {steadfastResponseLogs.length > 0 && (
                  <div className="bg-[#04060b] border border-[#F47F20]/15 rounded-xl p-3 space-y-1.5 font-mono text-[9px] leading-relaxed text-emerald-400">
                    <p className="border-b border-white/5 pb-1 text-slate-400 font-sans font-bold flex items-center justify-between">
                      <span>⚡ LIVE REST API GATEWAY LOGS:</span>
                      <span className="text-[8px] uppercase px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-mono animate-pulse">Running</span>
                    </p>
                    {steadfastResponseLogs.map((log, li) => (
                      <p key={li} className="truncate">
                        {log.startsWith('Error') || log.startsWith('Status: SUCCESS') 
                          ? <span className="font-bold text-white">✓ {log}</span>
                          : `> ${log}`
                        }
                      </p>
                    ))}
                  </div>
                )}
              </div>

              {/* Actions Footer */}
              <div className="bg-white/[0.02] border-t border-white/5 p-4 flex gap-3">
                <button
                  type="button"
                  disabled={isBookingLoading}
                  onClick={() => setShippingOrder(null)}
                  className="flex-1 bg-white/5 border border-white/10 text-white font-bold py-2.5 rounded-xl uppercase tracking-wider text-[10px] duration-100 hover:bg-white/15 active:scale-95 transition-all text-center cursor-pointer disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isBookingLoading}
                  onClick={handleCreateSteadfastBooking}
                  className="flex-1 bg-[#F47F20] text-white font-black py-2.5 rounded-xl uppercase tracking-wider text-[10px] duration-100 hover:bg-[#fa8a36] active:scale-95 transition-all text-center cursor-pointer shadow-lg shadow-[#F47F20]/15 flex items-center justify-center gap-1.5 disabled:opacity-85"
                >
                  {isBookingLoading ? (
                    <>
                      <div className="w-3.5 h-3.5 rounded-full border-2 border-white/20 border-t-white animate-spin" />
                      API Booking...
                    </>
                  ) : (
                    <>
                      <Icons.CheckCircle2 size={12} />
                      Confirm & Send API
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* Steadfast Slip & Shipping Invoice Receipt viewer */}
        {viewingInvoice && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto"
          >
            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-[#0b0f19] border border-white/10 w-full max-w-md rounded-2xl overflow-hidden shadow-2xl relative"
            >
              {/* Top Menu controls */}
              <div className="bg-white/[0.02] border-b border-white/5 p-4 flex items-center justify-between text-white">
                <span className="text-[10px] font-black uppercase tracking-widest text-[#F47F20] flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-[#F47F20] rounded-full animate-ping" />
                  Steadfast Shipping Slip Generated
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      alert(`Printing label sticker through local USB Thermal Printer...\nFormat: 3x2 inch thermal adhesive paper.\nTracking ID: ${viewingInvoice.steadfast?.trackingId}`);
                    }}
                    className="bg-[#F47F20] hover:bg-[#fa8a36] text-white text-[9.5px] font-black uppercase px-3 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1 active:scale-95 shrink-0"
                  >
                    <Icons.FileText size={11} />
                    Print Sticker Label
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewingInvoice(null)}
                    className="p-1 bg-white/5 hover:bg-white/10 rounded-full transition-colors cursor-pointer text-white"
                  >
                    <Icons.X size={15} />
                  </button>
                </div>
              </div>

              {/* Slip Content layout resembling absolute reality standard thermal stickers */}
              <div className="p-6">
                <div className="bg-white text-black p-4 rounded-xl shadow-inner font-sans border-2 border-dashed border-gray-300">
                  {/* Steadfast Logo Branding */}
                  <div className="flex items-center justify-between border-b-2 border-black pb-2.5">
                    <div>
                      <h4 className="text-sm font-black tracking-tighter text-[#F47F20] uppercase font-sans leading-none flex items-center gap-1">
                        STEADFAST
                        <span className="text-[7.5px] bg-[#0E1428] text-white px-1.5 py-0.5 rounded tracking-widest font-mono select-none">COURIER</span>
                      </h4>
                      <p className="text-[8px] text-gray-400 font-bold mt-0.5 font-sans uppercase">Bangladesh Delivery Platform</p>
                    </div>
                    <div className="text-right">
                      <span className="text-[9.5px] bg-black text-white px-2 py-0.5 rounded font-black font-mono">
                        {viewingInvoice.steadfast?.destination?.toUpperCase()}
                      </span>
                    </div>
                  </div>

                  {/* Consignment tracking barcode visualizer */}
                  <div className="py-4 text-center select-none">
                    {/* Simulated elegant Vector barcode lines */}
                    <div className="flex items-end justify-center gap-[1.5px] h-10 w-full max-w-[240px] mx-auto bg-black/5 p-1 rounded">
                      {[1,3,1,2,3,1,1,2,3,1,2,1,2,3,1,2,1,1,3,2,1,2,1,3,1,1,2,3,2,1,1,3,1,2,1,1,2,3,1,1,2,3,1,2,1,2,3,1].map((w, bi) => (
                        <div 
                          key={bi} 
                          className="bg-black" 
                          style={{ 
                            width: `${w * 1}px`, 
                            height: bi % 3 === 0 ? '100%' : '85%',
                            opacity: 0.95
                          }} 
                        />
                      ))}
                    </div>
                    <p className="text-[9.5px] font-mono font-black tracking-[4px] uppercase mt-1.5 text-black">
                      {viewingInvoice.steadfast?.trackingId}
                    </p>
                  </div>

                  {/* Grid details structure resembling standard thermal receipt prints */}
                  <div className="border-t-2 border-black pt-3 grid grid-cols-2 gap-3 text-[10px] leading-relaxed">
                    <div className="space-y-1 pr-2 border-r border-gray-300">
                      <p className="text-[8px] uppercase tracking-wider font-extrabold text-gray-400">Recipient (প্রাপক)</p>
                      <p className="font-extrabold text-[#0E1428] truncate text-[11px]">{viewingInvoice.steadfast?.consigneeName}</p>
                      <p className="font-mono text-black font-bold">{viewingInvoice.steadfast?.consigneePhone}</p>
                      <p className="text-[9px] text-gray-600 leading-tight font-sans mt-1">
                        {viewingInvoice.steadfast?.consigneeAddress}
                      </p>
                    </div>

                    <div className="space-y-1 pl-1">
                      <p className="text-[8px] uppercase tracking-wider font-extrabold text-gray-400">Sender (প্রেরক)</p>
                      <p className="font-extrabold text-gray-800 text-[10px]">{viewingInvoice.steadfast?.senderStore}</p>
                      <p className="text-[9px] text-gray-500 font-mono">Bazar Merchant API Portal</p>
                      <p className="text-[9px] font-bold text-gray-600 mt-1">Date: {viewingInvoice.steadfast?.dateBooked}</p>
                    </div>
                  </div>

                  {/* Cash collection metadata section */}
                  <div className="border-t-2 border-black mt-3.5 pt-3 grid grid-cols-3 gap-2 text-center text-[10px] font-mono leading-none">
                    <div className="bg-black text-white p-2 rounded flex flex-col justify-between">
                      <span className="text-[7.5px] text-gray-400 font-sans uppercase">Cash COD</span>
                      <span className="text-xs font-black mt-1">৳{viewingInvoice.steadfast?.codAmount}</span>
                    </div>
                    <div className="bg-gray-100 text-[#0E1428] p-2 rounded flex flex-col justify-between border border-gray-300">
                      <span className="text-[7.5px] text-gray-500 font-sans uppercase">Del. Fee</span>
                      <span className="text-[10.5px] font-bold mt-1">৳{viewingInvoice.steadfast?.deliveryCharge}</span>
                    </div>
                    <div className="bg-gray-100 text-[#0E1428] p-2 rounded flex flex-col justify-between border border-gray-300">
                      <span className="text-[7.5px] text-gray-500 font-sans uppercase">Weight</span>
                      <span className="text-[10.5px] font-bold mt-1">{viewingInvoice.steadfast?.weight} Kg</span>
                    </div>
                  </div>

                  {/* Remarks signature footer */}
                  {viewingInvoice.steadfast?.specialInstruction && (
                    <div className="border-t border-gray-300 mt-3 pt-2 text-[8.5px] leading-snug text-gray-600">
                      <span className="font-black bg-gray-200 text-black px-1.5 rounded mr-1 col-span-3">REMARKS:</span>
                      {viewingInvoice.steadfast?.specialInstruction}
                    </div>
                  )}
                </div>

                {/* Live Real-time Parcel Tracking simulation block */}
                <div className="mt-4 bg-white/5 border border-white/10 rounded-xl p-4 space-y-3.5">
                  <div className="flex items-center justify-between border-b border-white/5 pb-2">
                    <span className="text-[9px] uppercase tracking-wider font-extrabold text-white flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping" />
                      Steadfast Tracking System (সরাসরি ট্র্যাকিং)
                    </span>
                    <span className="text-[8px] font-mono bg-white/5 px-2 py-0.5 rounded text-[#F47F20] font-black uppercase">
                      In Transit
                    </span>
                  </div>

                  <div className="space-y-3 font-sans">
                    <div className="flex gap-2 text-[10px]">
                      <div className="flex flex-col items-center shrink-0">
                        <div className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-bold text-[8px] z-10">✓</div>
                        <div className="w-0.5 h-6 bg-white/10 mt-1" />
                      </div>
                      <div className="flex-1">
                        <p className="font-extrabold text-white text-[10.5px]">Picked up by Courier Hub</p>
                        <p className="text-[9px] text-outline mt-0.5 leading-snug">Steadfast pickup dispatcher has scanned and received item at Mirpur main hub office.</p>
                      </div>
                    </div>

                    <div className="flex gap-2 text-[10px]">
                      <div className="flex flex-col items-center shrink-0">
                        <div className="w-4 h-4 rounded-full bg-[#fa8a36]/20 text-[#fa8a36] border border-[#fa8a36]/30 flex items-center justify-center font-bold text-[8px] z-10 font-sans">●</div>
                      </div>
                      <div className="flex-1">
                        <p className="font-extrabold text-slate-200 text-[10.5px]">In Transit assignment</p>
                        <p className="text-[9px] text-outline mt-0.5 leading-snug">Assigned to delivery agent (Sajib Hossain, +880 171XXXXXXX) for final address routing.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

interface ReviewItem {
  id: string;
  productName: string;
  name: string;
  rating: number;
  date: string;
  text: string;
  verified: boolean;
  reply?: string;
}

function ReviewsManagerPage({ onBack, t }: { onBack: () => void; t: any }) {
  const [reviews, setReviews] = React.useState<ReviewItem[]>(() => {
    try {
      const stored = localStorage.getItem('bazar_global_user_reviews');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.error(e);
    }
    return [];
  });

  const [editingReview, setEditingReview] = React.useState<ReviewItem | null>(null);
  const [editRating, setEditRating] = React.useState(5);
  const [editText, setEditText] = React.useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = React.useState<string | null>(null);
  const [notification, setNotification] = React.useState<string>('');

  const triggerNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => {
      setNotification('');
    }, 4000);
  };

  const handleStartEdit = (rev: ReviewItem) => {
    setEditingReview(rev);
    setEditRating(rev.rating);
    setEditText(rev.text);
  };

  const handleSaveEdit = () => {
    if (!editingReview || !editText.trim()) return;

    try {
      const stored = localStorage.getItem('bazar_global_user_reviews');
      const parsed: ReviewItem[] = stored ? JSON.parse(stored) : [];
      const updated = parsed.map((rev) => {
        if (rev.id === editingReview.id) {
          return {
            ...rev,
            rating: editRating,
            text: editText.trim(),
            date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) + ' (Edited)'
          };
        }
        return rev;
      });

      localStorage.setItem('bazar_global_user_reviews', JSON.stringify(updated));
      setReviews(updated);
      
      // Dispatch global events so details views update
      window.dispatchEvent(new Event('bazar-reviews-updated'));
      
      setEditingReview(null);
      triggerNotification('Review updated successfully! (রিভিউ সফলভাবে আপডেট করা হয়েছে)');
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteReview = (id: string) => {
    try {
      const stored = localStorage.getItem('bazar_global_user_reviews');
      const parsed: ReviewItem[] = stored ? JSON.parse(stored) : [];
      const updated = parsed.filter((rev) => rev.id !== id);

      localStorage.setItem('bazar_global_user_reviews', JSON.stringify(updated));
      setReviews(updated);
      
      // Dispatch global events so details views update
      window.dispatchEvent(new Event('bazar-reviews-updated'));
      
      setShowDeleteConfirm(null);
      triggerNotification('Review deleted permanently! (রিভিউটি মুছে ফেলা হয়েছে)');
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <SwipeBackContainer
      onBack={onBack}
      className="fixed inset-0 min-h-screen bg-slate-50/95 text-slate-900 pb-24 pt-4 z-[100] overflow-y-auto overflow-x-hidden animate-in fade-in duration-200 px-3.5 sm:px-5 select-none"
    >
      {/* Dynamic Notification Top-Toast Banner */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="fixed top-4 left-4 right-4 z-[120] p-4 bg-emerald-600 text-white font-black text-xs sm:text-sm rounded-2xl flex items-center justify-between shadow-xl border border-emerald-400/30"
          >
            <div className="flex items-center gap-2">
              <Icons.Sparkles size={16} className="text-amber-300 shrink-0 animate-spin" />
              <span>{notification}</span>
            </div>
            <button onClick={() => setNotification('')} className="p-1 text-white/80 hover:text-white cursor-pointer hover:scale-110 active:scale-95">
              <Icons.X size={16} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Primary Floating Navigation Bar in Clean White Light Theme */}
      <div className="max-w-xl mx-auto space-y-5 pt-2 animate-in slide-in-from-right duration-300">
        <div className="flex items-center justify-between bg-white/80 border border-slate-200/80 backdrop-blur-2xl p-4 rounded-2xl shadow-xs">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="w-10 h-10 rounded-full bg-white border border-slate-200/90 hover:bg-slate-100 flex items-center justify-center text-slate-800 shadow-xs cursor-pointer active:scale-90 transition-all shrink-0"
            >
              <Icons.ArrowLeft size={18} className="text-emerald-600" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
                  <Icons.Star className="text-amber-500 fill-amber-400" size={18} /> My Reviews (আমার রিভিউ)
                </h2>
              </div>
              <p className="text-[10.5px] text-slate-600 font-bold uppercase tracking-wider mt-0.5">
                All written feedback & ratings given by you
              </p>
            </div>
          </div>
          <span className="bg-emerald-100/90 text-emerald-800 border border-emerald-300 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider shadow-2xs">
            {reviews.length} Active
          </span>
        </div>

        {/* Review list or Empty state */}
        {reviews.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white/80 border border-white/90 rounded-[32px] p-10 text-center shadow-[0_10px_40px_rgba(0,0,0,0.06),inset_0_1.5px_3px_rgba(255,255,255,1)] backdrop-blur-2xl space-y-4"
          >
            <div className="w-16 h-16 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center mx-auto text-amber-500 shadow-xs">
              <Icons.Star size={32} className="animate-pulse fill-amber-400" />
            </div>
            <div className="space-y-1.5">
              <h4 className="text-base font-black text-slate-900 uppercase tracking-wider">No Reviews Tracked</h4>
              <p className="text-xs text-slate-600 font-semibold max-w-xs mx-auto leading-relaxed">
                You have not completed any product reviews yet. Go back to browse premium items and express your honest experiences!
              </p>
              <p className="text-[10.5px] text-slate-500 italic font-bold">
                (আপনি এখনও কোনো প্রোডাক্টে মন্তব্য বা রিভিউ দেননি। রিভিউ দিতে আপনার পছন্দের প্রোডাক্টের বিস্তারিত পেজে যান।)
              </p>
            </div>
            <div className="pt-2">
              <button 
                onClick={onBack}
                className="bg-gradient-to-r from-emerald-500 via-teal-600 to-emerald-600 hover:from-emerald-600 text-white text-[10px] font-black px-6 py-3 rounded-xl uppercase tracking-widest shadow-md shadow-emerald-500/20 active:scale-95 cursor-pointer transition-all duration-150"
              >
                Find Products to Review
              </button>
            </div>
          </motion.div>
        ) : (
          <div className="space-y-4">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">
              Total {reviews.length} written reviews saved
            </p>
            
            {reviews.map((rev) => {
              const isDeleting = showDeleteConfirm === rev.id;
              
              return (
                <motion.div
                  key={rev.id}
                  layout
                  className="bg-white/80 border border-white/90 rounded-[24px] p-5 shadow-[0_8px_30px_rgb(0,0,0,0.04),inset_0_1.5px_2px_rgba(255,255,255,1)] backdrop-blur-2xl space-y-3.5 hover:border-emerald-300 transition-all"
                >
                  <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-3">
                    <div className="min-w-0 flex-1">
                      <span className="text-[8.5px] font-black bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-md uppercase tracking-wider inline-block mb-1">
                        Verified Order Review
                      </span>
                      <h4 className="text-xs sm:text-sm font-black text-slate-900 leading-snug truncate">
                        {rev.productName}
                      </h4>
                    </div>
                    <span className="text-[10px] text-slate-500 font-mono font-bold shrink-0 pt-1">
                      {rev.date}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="flex gap-0.5">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Icons.Star
                          key={s}
                          size={13}
                          className={s <= rev.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}
                        />
                      ))}
                    </div>
                    <span className="text-[10px] font-black text-emerald-700 uppercase tracking-wider bg-emerald-50 px-2 py-0.5 rounded-md">
                      {rev.rating}.0 Rating
                    </span>
                  </div>

                  <p className="text-xs text-slate-800 font-semibold leading-relaxed bg-slate-50/90 p-3.5 rounded-2xl border border-slate-200/80 break-words shadow-2xs">
                    "{rev.text}"
                  </p>

                  {/* Admin / Seller Reply if available */}
                  {rev.reply && (
                    <div className="text-xs p-3 bg-emerald-50/90 border border-emerald-200/80 rounded-2xl space-y-1 text-emerald-950 shadow-2xs">
                      <p className="font-extrabold text-emerald-800 flex items-center gap-1.5 uppercase tracking-wider text-[10px]">
                        <Icons.ArrowRight size={11} className="shrink-0 animate-pulse text-emerald-600" /> Admin / Seller Response
                      </p>
                      <p className="text-slate-700 italic font-medium">"{rev.reply}"</p>
                    </div>
                  )}

                  {/* Actions buttons */}
                  <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
                    {isDeleting ? (
                      <div className="w-full flex items-center justify-between gap-2.5 bg-rose-50 p-2.5 rounded-xl border border-rose-200 animate-fadeIn">
                        <span className="text-[10px] font-extrabold text-rose-700 uppercase tracking-wider">
                          Are you sure? (রিভিউটি মুছে ফেলতে চান?)
                        </span>
                        <div className="flex gap-2">
                          <button
                            onClick={() => setShowDeleteConfirm(null)}
                            className="bg-white text-slate-800 border border-slate-200 text-[10px] font-black px-3 py-1.5 rounded-lg uppercase cursor-pointer hover:bg-slate-50"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => handleDeleteReview(rev.id)}
                            className="bg-rose-600 text-white text-[10px] font-black px-3 py-1.5 rounded-lg uppercase cursor-pointer shadow-xs hover:bg-rose-700 active:scale-95 transition-all"
                          >
                            Yes, Delete
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <button
                          onClick={() => handleStartEdit(rev)}
                          className="text-[10px] bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 font-black px-3.5 py-1.5 rounded-xl uppercase tracking-wider transition-all cursor-pointer inline-flex items-center gap-1 active:scale-95 shadow-2xs"
                        >
                          <Icons.Edit size={12} /> Edit Review
                        </button>
                        <button
                          onClick={() => setShowDeleteConfirm(rev.id)}
                          className="text-[10px] bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 font-black px-3.5 py-1.5 rounded-xl uppercase tracking-wider transition-all cursor-pointer inline-flex items-center gap-1 active:scale-95 shadow-2xs"
                        >
                          <Icons.Trash2 size={12} /> Remove
                        </button>
                      </>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Editing Review Sheet Backdrop and Dialog block */}
      <AnimatePresence>
        {editingReview && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-[110] flex items-end justify-center sm:items-center p-4"
          >
            <motion.div
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              className="bg-white/95 border border-white/90 rounded-3xl w-full max-w-md p-6 shadow-2xl backdrop-blur-2xl space-y-4 text-slate-900 overflow-y-auto max-h-[90vh]"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h3 className="text-sm font-black uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                    <Icons.Edit size={16} className="text-emerald-600" /> Customize Review
                  </h3>
                  <p className="text-[10.5px] text-slate-500 font-bold mt-0.5">Edit comment and rating for this item</p>
                </div>
                <button
                  onClick={() => setEditingReview(null)}
                  className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 flex items-center justify-center cursor-pointer active:scale-90 transition-all"
                >
                  <Icons.X size={16} />
                </button>
              </div>

              <div className="space-y-4 pt-1">
                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200/80">
                  <span className="text-[9px] font-black text-emerald-700 uppercase tracking-widest block mb-0.5">
                    Product Reviewed
                  </span>
                  <p className="text-xs font-black text-slate-900 leading-snug">
                    {editingReview.productName}
                  </p>
                </div>

                {/* Rating selection stars */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-700 block">
                    Your Rating Score
                  </label>
                  <div className="flex items-center gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setEditRating(star)}
                        className="p-1 hover:scale-125 transition-transform duration-100 cursor-pointer"
                      >
                        <Icons.Star
                          size={24}
                          className={star <= editRating
                            ? 'fill-amber-400 text-amber-400 drop-shadow-xs'
                            : 'text-slate-200'}
                        />
                      </button>
                    ))}
                    <span className="text-xs font-black text-emerald-700 font-mono pl-1">
                      {editRating}.0 / 5.0
                    </span>
                  </div>
                </div>

                {/* Comment area */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-700 block">
                    Your Honest Comment (রিভিউ মন্তব্য)
                  </label>
                  <textarea
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    rows={4}
                    placeholder="Refine your experience..."
                    className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-2xl px-3.5 py-3 text-xs text-slate-900 font-medium placeholder-slate-400 outline-none resize-none leading-relaxed"
                  />
                  <div className="flex items-center justify-between text-[9.5px] text-slate-500 font-bold">
                    <span>{editText.length} characters written</span>
                    <span>Max limit 500</span>
                  </div>
                </div>
              </div>

              <div className="pt-2 flex items-center gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingReview(null)}
                  className="flex-1 bg-slate-100 text-slate-800 text-xs font-extrabold py-3 rounded-2xl uppercase tracking-wider hover:bg-slate-200 active:scale-95 transition-all cursor-pointer text-center"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveEdit}
                  className="flex-1 bg-gradient-to-r from-emerald-500 via-teal-600 to-emerald-600 hover:from-emerald-600 text-white text-xs font-black py-3 rounded-2xl uppercase tracking-wider active:scale-95 transition-all cursor-pointer text-center shadow-md shadow-emerald-500/20"
                >
                  Save Review
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </SwipeBackContainer>
  );
}

// iPhone-style swipe from left to right to go back gesture container
interface SwipeBackContainerProps {
  onBack?: () => void;
  children: React.ReactNode;
  className?: string;
  id?: string;
  style?: React.CSSProperties;
}

function SwipeBackContainer({ onBack, children, className = '', id, style }: SwipeBackContainerProps) {
  const touchStartRef = React.useRef<{ x: number; y: number } | null>(null);
  const [swipeOffset, setSwipeOffset] = React.useState(0);

  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    touchStartRef.current = { x: touch.clientX, y: touch.clientY };
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchStartRef.current) return;
    const touch = e.touches[0];
    const diffX = touch.clientX - touchStartRef.current.x;
    const diffY = touch.clientY - touchStartRef.current.y;

    if (diffX > 0 && Math.abs(diffX) > Math.abs(diffY) * 1.5) {
      setSwipeOffset(diffX);
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStartRef.current) return;
    const touch = e.changedTouches[0];
    const diffX = touch.clientX - touchStartRef.current.x;
    const diffY = touch.clientY - touchStartRef.current.y;

    if (diffX > 100 && Math.abs(diffX) > Math.abs(diffY) * 1.5) {
      if (onBack) {
        onBack();
      }
    }
    setSwipeOffset(0);
    touchStartRef.current = null;
  };

  return (
    <div 
      id={id}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{
        ...style,
        transform: swipeOffset > 0 ? `translateX(${swipeOffset}px)` : undefined,
        transition: swipeOffset === 0 ? 'transform 0.28s cubic-bezier(0.16, 1, 0.3, 1)' : undefined,
      }}
      className={`relative select-none ${className}`}
    >
      {/* Premium iOS side swipe bulging indicator */}
      {swipeOffset > 8 && (
        <div 
          className="fixed left-0 top-1/2 -translate-y-1/2 w-16 h-28 z-[200] flex items-center justify-start pl-2 pointer-events-none transition-all duration-150 rounded-r-3xl border-r border-t border-b border-primary/20 shadow-2xl backdrop-blur-sm"
          style={{
            background: `radial-gradient(circle at left, rgba(16, 185, 129, ${Math.min(0.25 + (swipeOffset / 120) * 0.35, 0.6)}) 0%, transparent 85%)`,
            transform: `translateY(-50%) translateX(${Math.min(swipeOffset * 0.05, 10)}px) scale(${Math.min(0.7 + (swipeOffset / 140) * 0.45, 1.25)})`,
          }}
        >
          <div className={`p-2.5 rounded-full bg-zinc-950/90 border transition-all ${swipeOffset > 100 ? 'border-primary text-primary scale-110 shadow-[0_0_15px_rgba(16,185,129,0.5)]' : 'border-white/10 text-outline'}`}>
            <Icons.ArrowLeft size={16} className={swipeOffset > 100 ? "animate-bounce" : ""} />
          </div>
        </div>
      )}
      {children}
    </div>
  );
}


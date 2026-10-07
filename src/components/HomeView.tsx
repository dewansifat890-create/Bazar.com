import React from 'react';
import { Icons } from './Icons';
import { motion, AnimatePresence } from 'motion/react';
import ProductDetailView from './ProductDetailView';
import CheckoutView from './CheckoutView';
import { INITIAL_PRODUCTS } from '../constants';
import { getProductSales, getProductRatingAndReviews } from '../utils/sales';
import { getMergedProducts, syncProductsFromFirebase } from '../utils/sellerProducts';
import { usePreferences } from '../utils/preferences';
import { getRoyalClubAdminSettings, DEFAULT_HERO_BANNERS } from '../utils/royalClub';
import { fetchBannersFromFirebase, subscribeToBannersRealtime } from '../firebase';

export default function HomeView({ 
  onTabChange, 
  onSearchOpen, 
  refreshKey,
  wishlist = [],
  onWishlistToggle,
  deliveryAddress,
  onAddressChange,
  onAddToCart
}: { 
  onTabChange?: (tab: string) => void, 
  onSearchOpen?: (startWithCamera?: boolean) => void, 
  refreshKey?: number,
  wishlist?: string[],
  onWishlistToggle?: (p: any) => void,
  deliveryAddress?: any,
  onAddressChange?: (address: any) => void,
  onAddToCart?: (product: any, quantity?: number) => void
}) {
  const { t, formatPrice } = usePreferences();
  const [viewState, setViewState] = React.useState<'home' | 'categories' | 'product-detail' | 'checkout'>('home');
  const [checkoutQuantity, setCheckoutQuantity] = React.useState(1);
  const [currentSlide, setCurrentSlide] = React.useState(0);
  const [isLoading, setIsLoading] = React.useState(false);
  const [selectedProduct, setSelectedProduct] = React.useState<any>(null);
  const [productOriginTab, setProductOriginTab] = React.useState<string | null>(null);

  const [products, setProducts] = React.useState(() => getMergedProducts());
  const [visibleCount, setVisibleCount] = React.useState(6);
  const loadMoreTriggerRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    window.scrollTo(0, 0);
    const isSubpage = viewState !== 'home';
    window.dispatchEvent(new CustomEvent('bazar-subpage-toggle', { detail: { isOpen: isSubpage } }));
    return () => {
      window.dispatchEvent(new CustomEvent('bazar-subpage-toggle', { detail: { isOpen: false } }));
    };
  }, [viewState]);

  // Instant 6-by-6 progressive scroll loader (nanosecond response via IntersectionObserver + scroll listener)
  React.useEffect(() => {
    if (visibleCount >= products.length) return;

    const loadNextBatch = () => {
      setVisibleCount((prev) => Math.min(prev + 6, products.length));
    };

    const el = loadMoreTriggerRef.current;
    let observer: IntersectionObserver | null = null;

    if (el && typeof IntersectionObserver !== 'undefined') {
      observer = new IntersectionObserver(
        (entries) => {
          if (entries[0]?.isIntersecting) {
            loadNextBatch();
          }
        },
        { rootMargin: '320px' } // Pre-triggers slightly before reaching the bottom so it appears in nanoseconds
      );
      observer.observe(el);
    }

    const handleWindowScroll = () => {
      if (
        window.innerHeight + window.scrollY >=
        document.documentElement.scrollHeight - 360
      ) {
        loadNextBatch();
      }
    };

    window.addEventListener('scroll', handleWindowScroll, { passive: true });
    return () => {
      if (observer) observer.disconnect();
      window.removeEventListener('scroll', handleWindowScroll);
    };
  }, [visibleCount, products.length, viewState]);

  const handleProductClick = (product: any) => {
    setSelectedProduct(product);
    setProductOriginTab(null);
    setViewState('product-detail');
  };

  React.useEffect(() => {
    const handleProductsUpdated = () => {
      setProducts(getMergedProducts());
    };
    window.addEventListener('bazar-products-updated', handleProductsUpdated);
    return () => {
      window.removeEventListener('bazar-products-updated', handleProductsUpdated);
    };
  }, []);

  React.useEffect(() => {
    const handleOpenProduct = (e: Event) => {
      const customEvent = e as CustomEvent;
      const detail = customEvent.detail;
      if (detail) {
        const productObj = detail.product || detail;
        const fromTab = detail.fromTab || null;
        // Find matched product in dynamic list or custom passed product object
        const matched = getMergedProducts().find(p => p.name.toLowerCase() === productObj.name.toLowerCase()) || productObj;
        setSelectedProduct(matched);
        setProductOriginTab(fromTab);
        setViewState('product-detail');
      }
    };
    window.addEventListener('open-product', handleOpenProduct);
    return () => {
      window.removeEventListener('open-product', handleOpenProduct);
    };
  }, []);

  React.useEffect(() => {
    if (refreshKey && refreshKey > 0) {
      setIsLoading(true);
      setViewState('home'); // Reset to home grid if in categories
      
      setTimeout(() => {
        setProducts(prev => {
          // Circular shift: Move the last 2 items to the front
          const newProducts = [...prev];
          const lastTwo = newProducts.splice(-2);
          return [...lastTwo, ...newProducts];
        });
        setIsLoading(false);
      }, 800);
    }
  }, [refreshKey]);

  const [heroBanners, setHeroBanners] = React.useState(() => {
    const admin = getRoyalClubAdminSettings();
    const active = (admin.heroBanners || []).filter(b => b.active);
    return active.length > 0 ? active : DEFAULT_HERO_BANNERS;
  });

  React.useEffect(() => {
    const handleBannersUpdate = () => {
      const admin = getRoyalClubAdminSettings();
      const active = (admin.heroBanners || []).filter(b => b.active);
      setHeroBanners(active.length > 0 ? active : DEFAULT_HERO_BANNERS);
    };
    window.addEventListener('bazar-royal-club-admin-updated', handleBannersUpdate);

    // Fetch banners from Firebase once on initial load (no repetitive polling)
    const syncBanners = async () => {
      try {
        const fbBanners = await fetchBannersFromFirebase();
        if (fbBanners.length > 0) {
          setHeroBanners(fbBanners);
          setCurrentSlide(prev => (prev >= fbBanners.length ? 0 : prev));
        }
      } catch (err) {
        console.warn('Banner sync note:', err);
      }
    };

    syncBanners();

    // Real-time stream listener for banners from Firebase Realtime Database
    const unsubRealtime = subscribeToBannersRealtime((rtdbBanners) => {
      if (Array.isArray(rtdbBanners) && rtdbBanners.length > 0) {
        setHeroBanners(rtdbBanners);
        setCurrentSlide(prev => (prev >= rtdbBanners.length ? 0 : prev));
      } else if (Array.isArray(rtdbBanners) && rtdbBanners.length === 0) {
        setHeroBanners([]);
        setCurrentSlide(0);
      }
    });

    return () => {
      window.removeEventListener('bazar-royal-club-admin-updated', handleBannersUpdate);
      unsubRealtime();
    };
  }, []);

  const banners = heroBanners;

  const timerRef = React.useRef<any>(null);

  const startTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (banners.length === 0) return;
    timerRef.current = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % banners.length);
    }, 4500);
  };

  React.useEffect(() => {
    startTimer();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [banners.length]);

  const handleManualSlide = (idx: number) => {
    setCurrentSlide(idx);
    startTimer();
  };

  if (viewState === 'checkout' && selectedProduct) {
    return (
      <CheckoutView 
        product={selectedProduct} 
        onBack={() => setViewState('product-detail')} 
        deliveryAddress={deliveryAddress}
        onAddressChange={onAddressChange}
        quantity={checkoutQuantity}
      />
    );
  }

  if (viewState === 'product-detail' && selectedProduct) {
    return (
      <ProductDetailView 
        product={selectedProduct} 
        allProducts={products}
        onBack={() => {
          if (productOriginTab) {
            onTabChange?.(productOriginTab);
            setProductOriginTab(null);
          }
          setViewState('home');
        }} 
        onChat={() => {
          onTabChange?.('chat');
          setViewState('home');
        }}
        onAddToCart={(qty) => {
          onAddToCart?.(selectedProduct, qty);
        }}
        onBuyNow={(qty) => {
          setCheckoutQuantity(qty || 1);
          setViewState('checkout');
        }}
        onProductClick={(p) => setSelectedProduct(p)}
        onWishlistToggle={(p) => {
          onWishlistToggle?.(p);
        }}
        isLiked={wishlist.includes(selectedProduct.name)}
      />
    );
  }

  if (viewState === 'categories') {
    return (
      <div className="space-y-6 pt-4 animate-in fade-in slide-in-from-right duration-300">
        <div className="flex items-center justify-between gap-4 mb-2">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setViewState('home')}
              className="p-2 hover:bg-primary/10 rounded-full transition-colors active:scale-90 cursor-pointer"
            >
              <Icons.ArrowLeft size={24} className="text-primary" />
            </button>
            <h2 className="text-2xl font-bold">{t('categories', 'All Categories')}</h2>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white shadow-md shadow-primary/10">
              <Icons.ShoppingBasket size={18} />
            </div>
            <div className="flex flex-col">
              <h1 className="text-xs font-black leading-none tracking-tighter text-primary">BAZAR.COM</h1>
              <span className="text-[7px] font-bold text-outline uppercase tracking-widest leading-none opacity-60">Global Shop</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-6 py-4">
          <CategoryItem icon={<Icons.Zap />} label={t('electronics', 'Electronics')} />
          <CategoryItem icon={<Icons.Shirt />} label={t('fashion', 'Fashion')} />
          <CategoryItem icon={<Icons.HomeIcon />} label={t('home_tab', 'Home')} />
          <CategoryItem icon={<Icons.Sparkles />} label={t('beauty', 'Beauty')} />
          <CategoryItem icon={<Icons.Smartphone />} label={t('phone', 'Phone')} />
          <CategoryItem icon={<Icons.Laptop />} label={t('laptop', 'Laptop')} />
          <CategoryItem icon={<Icons.Camera />} label={t('camera', 'Camera')} />
          <CategoryItem icon={<Icons.Headphones />} label={t('accessories', 'Accessories')} />
          <CategoryItem 
            icon={<Icons.Flame />} 
            label={t('deals', 'Deals')} 
            onClick={() => onTabChange?.('deals')}
          />
        </div>

        <div className="pt-8">
          <h3 className="text-lg font-bold mb-4">{t('trending_now', 'Trending Now')}</h3>
          <div className="grid grid-cols-2 gap-4">
            {products.slice(0, 4).map((p, idx) => (
              <ProductCard 
                key={idx}
                image={p.image}
                name={p.name}
                price={p.price}
                rating={p.rating}
                reviews={p.reviews}
                onClick={() => handleProductClick(p)}
              />
            ))}
          </div>
          {products.length === 0 && (
            <p className="text-xs text-outline/60 italic py-4">এখনও কোনো পণ্য নেই।</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pt-4 animate-in fade-in duration-500">
      {/* Search Bar */}
      <section 
        onClick={() => onSearchOpen?.(false)}
        className="glass-card rounded-2xl p-1 flex items-center gap-2 emerald-glow cursor-pointer hover:bg-white/90 transition-colors"
      >
        <Icons.Search className="text-outline ml-2" size={16} />
        <div className="w-full text-outline text-xs py-1.5 font-medium px-1 flex items-center justify-between">
          <span>{t('search_placeholder', 'Search on Bazar...')}</span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onSearchOpen?.(true);
            }}
            className="text-primary mr-1 hover:scale-110 active:scale-95 transition-transform p-1 cursor-pointer flex items-center justify-center"
            title="Search by image/camera"
            aria-label="Search by image/camera"
          >
            <Icons.Camera size={16} />
          </button>
        </div>
        <div className="bg-primary text-on-primary px-4 py-1.5 rounded-xl text-xs font-semibold shadow-md shadow-primary/10 select-none">
          {t('search_btn', 'Search')}
        </div>
      </section>

      {/* Hero Banner Carousel (Shown only when banners are configured from admin) */}
      {banners.length > 0 && (
        <section className="relative aspect-[21/9] rounded-2xl overflow-hidden shadow-xl shadow-primary/10 group bg-black select-none">
          <AnimatePresence mode="popLayout">
            <motion.div
              key={currentSlide}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.5}
              onDragEnd={(event, info) => {
                const swipeThreshold = 50;
                if (info.offset.x < -swipeThreshold) {
                  // Swiped left -> next slide
                  handleManualSlide((currentSlide + 1) % banners.length);
                } else if (info.offset.x > swipeThreshold) {
                  // Swiped right -> previous slide
                  handleManualSlide((currentSlide - 1 + banners.length) % banners.length);
                }
              }}
              className="absolute inset-0 cursor-grab active:cursor-grabbing w-full h-full"
            >
              <img 
                src={banners[currentSlide]?.image} 
                alt={banners[currentSlide]?.title} 
                className="w-full h-full object-cover pointer-events-none"
                draggable="false"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent flex flex-col justify-end p-5 pointer-events-none">
                {banners[currentSlide]?.tag && (
                  <motion.span 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-secondary text-white text-[10px] font-bold px-2 py-0.5 rounded-full w-fit mb-1.5 uppercase tracking-tight"
                  >
                    {banners[currentSlide].tag}
                  </motion.span>
                )}
                {banners[currentSlide]?.title && (
                  <motion.h2 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="text-white text-2xl font-black italic tracking-tighter leading-none mb-1"
                  >
                    {banners[currentSlide].title}
                  </motion.h2>
                )}
                {banners[currentSlide]?.subtitle && (
                  <motion.p 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="text-white/80 text-[10px] font-medium leading-none"
                  >
                    {banners[currentSlide].subtitle}
                  </motion.p>
                )}
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Floating Navigation Chevrons */}
          {banners.length > 1 && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleManualSlide((currentSlide - 1 + banners.length) % banners.length);
                }}
                className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/40 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:bg-black/60 active:scale-95 z-20 cursor-pointer"
                aria-label="Previous slide"
              >
                <Icons.ChevronRight className="rotate-180" size={16} />
              </button>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleManualSlide((currentSlide + 1) % banners.length);
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/40 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:bg-black/60 active:scale-95 z-20 cursor-pointer"
                aria-label="Next slide"
              >
                <Icons.ChevronRight size={16} />
              </button>
              
              {/* Slide Indicators */}
              <div className="absolute bottom-3 right-5 flex gap-1.5 z-10">
                {banners.map((_, idx) => (
                  <button 
                    key={idx}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleManualSlide(idx);
                    }}
                    className={`h-2 transition-all duration-300 rounded-full cursor-pointer focus:outline-none ${idx === currentSlide ? 'w-5 bg-primary' : 'w-2 bg-white/40 hover:bg-white/60'}`}
                    aria-label={`Go to slide ${idx + 1}`}
                  />
                ))}
              </div>
            </>
          )}
        </section>
      )}

      {/* Categories */}
      <section>
        <div className="flex justify-between items-end mb-4">
          <h3 className="text-lg font-bold">{t('categories', 'Categories')}</h3>
          <button 
            onClick={() => setViewState('categories')}
            className="text-primary text-sm font-bold flex items-center gap-1 hover:underline active:scale-95 transition-all w-fit cursor-pointer"
          >
            {t('view_all', 'View All')} <Icons.ArrowRight size={14} />
          </button>
        </div>
        <div className="grid grid-cols-4 gap-4">
          <CategoryItem icon={<Icons.Zap />} label={t('electronics', 'Electronics')} />
          <CategoryItem icon={<Icons.Shirt />} label={t('fashion', 'Fashion')} />
          <CategoryItem icon={<Icons.HomeIcon />} label={t('home_tab', 'Home')} />
          <CategoryItem icon={<Icons.Sparkles />} label={t('beauty', 'Beauty')} />
        </div>
      </section>

      {/* Featured Products */}
      <section className="relative">
        <AnimatePresence mode="wait">
          {isLoading ? (
            <motion.div 
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-12 gap-3"
            >
              <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
              <p className="text-xs font-bold text-outline animate-pulse">Syncing New Arrivals...</p>
            </motion.div>
          ) : (
            <motion.div 
              key="content"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-4"
            >
              <div className="flex justify-between items-end mb-4">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold italic tracking-tight">{t('all_products', 'ALL PRODUCTS')}</h3>
                  <button
                    type="button"
                    onClick={async () => {
                      setIsLoading(true);
                      await syncProductsFromFirebase();
                      const fbBanners = await fetchBannersFromFirebase();
                      setHeroBanners(fbBanners);
                      setProducts(getMergedProducts());
                      setTimeout(() => setIsLoading(false), 500);
                    }}
                    className="p-1.5 rounded-full bg-white/5 hover:bg-white/10 text-emerald-400 border border-emerald-500/20 active:rotate-180 transition-transform cursor-pointer"
                    title="রিফ্রেশ করুন (Refresh)"
                  >
                    <Icons.RotateCw size={13} />
                  </button>
                </div>
                <span className="text-outline text-[10px] font-bold uppercase tracking-widest opacity-60">Handpicked</span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {products.length === 0 ? (
                  <div className="col-span-2 py-14 px-6 rounded-3xl border border-dashed border-white/15 bg-white/3 text-center flex flex-col items-center justify-center space-y-3.5">
                    <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shadow-lg shadow-emerald-500/10">
                      <Icons.ShoppingBag size={28} />
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-base font-black text-white">নতুন পণ্য শীঘ্রই আসছে</h4>
                      <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
                        বর্তমানে স্টোর আপডেট হচ্ছে। নতুন সব কালেকশন দেখতে পেজটি রিফ্রেশ করুন।
                      </p>
                    </div>
                    <div className="flex items-center gap-3 pt-1">
                      <button
                        type="button"
                        onClick={async () => {
                          setIsLoading(true);
                          await syncProductsFromFirebase();
                          const fbBanners = await fetchBannersFromFirebase();
                          setHeroBanners(fbBanners);
                          setProducts(getMergedProducts());
                          setTimeout(() => setIsLoading(false), 600);
                        }}
                        className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-black font-black text-xs rounded-xl shadow-lg shadow-emerald-500/25 flex items-center gap-2 cursor-pointer transition-all active:scale-95"
                      >
                        <Icons.RotateCw size={14} />
                        <span>রিফ্রেশ করুন (Refresh)</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    {products.slice(0, visibleCount).map((product, index) => (
                      <ProductCard 
                        key={product.id || product.name || index}
                        {...product}
                        isLiked={wishlist.includes(product.name)}
                        onWishlistToggle={(e: any) => {
                          e.stopPropagation();
                          onWishlistToggle?.(product);
                        }}
                        onClick={() => handleProductClick(product)}
                      />
                    ))}
                    {visibleCount < products.length && (
                      <div
                        ref={loadMoreTriggerRef}
                        className="col-span-2 h-4 w-full pointer-events-none"
                      />
                    )}
                  </>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </section>
    </div>
  );
}

function CategoryItem({ icon, label, onClick }: { icon: React.ReactNode, label: string, onClick?: () => void }) {
  return (
    <div 
      onClick={onClick}
      className="flex flex-col items-center gap-1.5 group cursor-pointer active:scale-95 transition-all outline-none"
    >
      <div className="w-12 h-12 rounded-2xl glass-card flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all text-primary shadow-lg shadow-black/5">
        {React.cloneElement(icon as React.ReactElement, { size: 22 })}
      </div>
      <span className="text-[10px] font-bold text-on-surface-variant group-hover:text-primary transition-colors tracking-tight">{label}</span>
    </div>
  );
}

function ProductCard({ 
  image, 
  name, 
  price, 
  originalPrice, 
  rating, 
  reviews, 
  tag, 
  tagColor = "bg-error",
  isLiked,
  onWishlistToggle,
  onClick,
  customPrices
}: any) {
  const { t, formatPrice } = usePreferences();
  const [salesCount, setSalesCount] = React.useState(() => getProductSales(name));
  const [ratingInfo, setRatingInfo] = React.useState(() => getProductRatingAndReviews(name));

  React.useEffect(() => {
    setSalesCount(getProductSales(name));
    
    const handleSalesUpdate = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail && customEvent.detail.productName === name) {
        setSalesCount(customEvent.detail.sales);
      }
    };
    
    window.addEventListener('bazar-sales-updated', handleSalesUpdate);
    return () => {
      window.removeEventListener('bazar-sales-updated', handleSalesUpdate);
    };
  }, [name]);

  React.useEffect(() => {
    const handleRatingUpdate = () => {
      setRatingInfo(getProductRatingAndReviews(name));
    };
    window.addEventListener('bazar-reviews-updated', handleRatingUpdate);
    return () => {
      window.removeEventListener('bazar-reviews-updated', handleRatingUpdate);
    };
  }, [name]);

  return (
    <div 
      onClick={onClick}
      className="glass-card rounded-2xl overflow-hidden flex flex-col emerald-glow group cursor-pointer active:scale-98 transition-all"
    >
      <div className="relative h-40 overflow-hidden bg-black flex items-center justify-center">
        <img src={image} alt={t(name, name)} className="w-full h-full object-cover select-none pointer-events-none" />
        {tag && (
          <span className={`absolute top-2 left-2 ${tagColor} text-white text-[10px] font-bold px-2 py-0.5 rounded-full`}>
            {t(tag, tag)}
          </span>
        )}
        <button 
          onClick={onWishlistToggle}
          className={`absolute top-2 right-2 w-8 h-8 rounded-full glass-card flex items-center justify-center active:scale-90 transition-all ${isLiked ? 'text-error' : 'text-primary'}`}
        >
          <Icons.Heart size={16} fill={isLiked ? "currentColor" : "none"} />
        </button>
      </div>
      <div className="p-3">
        <h4 className="text-sm font-semibold truncate">{t(name, name)}</h4>
        <div className="flex items-baseline gap-2 mt-1">
          <span className="text-primary font-bold text-lg">{formatPrice(price, customPrices)}</span>
          {originalPrice && (
            <span className="text-outline text-[10px] line-through">
              {formatPrice(originalPrice, customPrices ? Object.fromEntries(Object.entries(customPrices).map(([k, v]) => [k, (v as number) * 1.8])) : undefined)}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5 mt-2 text-[11px] text-on-surface-variant font-medium">
          <Icons.Star size={12} className="text-secondary fill-secondary" />
          <span>{ratingInfo.rating} ({ratingInfo.reviewsCount})</span>
          <span>•</span>
          <span className="text-primary font-black uppercase text-[10px]">{salesCount} sold</span>
        </div>
      </div>
    </div>
  );
}

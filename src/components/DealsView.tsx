import React from 'react';
import { Icons } from './Icons';
import { getMergedProducts } from '../utils/sellerProducts';
import { usePreferences } from '../utils/preferences';

// Calculates discount % dynamically
function getProductDiscount(product: any) {
  if (!product.originalPrice || product.originalPrice <= product.price) return 0;
  return Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100);
}

export default function DealsView() {
  const { t, formatPrice } = usePreferences();
  const [productsList, setProductsList] = React.useState(() => getMergedProducts());
  const [activeFilter, setActiveFilter] = React.useState<'all' | '31' | '50'>('all');
  const [activeGreenIdx, setActiveGreenIdx] = React.useState(0);
  const [activeYellowIdx, setActiveYellowIdx] = React.useState(0);

  // Update dynamic products on update event
  React.useEffect(() => {
    const handleProductsUpdated = () => {
      setProductsList(getMergedProducts());
    };
    window.addEventListener('bazar-products-updated', handleProductsUpdated);
    return () => {
      window.removeEventListener('bazar-products-updated', handleProductsUpdated);
    };
  }, []);

  // Filter products for each carousel based on calculated discount percentage!
  const greenProducts = React.useMemo(() => {
    return productsList.filter(p => getProductDiscount(p) >= 31);
  }, [productsList]);

  const yellowProducts = React.useMemo(() => {
    return productsList.filter(p => getProductDiscount(p) >= 50);
  }, [productsList]);

  // Active slideshow timers
  React.useEffect(() => {
    if (greenProducts.length <= 1) return;
    const interval = setInterval(() => {
      setActiveGreenIdx(prev => (prev + 1) % greenProducts.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [greenProducts]);

  React.useEffect(() => {
    if (yellowProducts.length <= 1) return;
    const interval = setInterval(() => {
      setActiveYellowIdx(prev => (prev + 1) % yellowProducts.length);
    }, 4500);
    return () => clearInterval(interval);
  }, [yellowProducts]);

  const handleGreenPrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveGreenIdx(prev => (prev - 1 + greenProducts.length) % greenProducts.length);
  };

  const handleGreenNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveGreenIdx(prev => (prev + 1) % greenProducts.length);
  };

  const handleYellowPrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveYellowIdx(prev => (prev - 1 + yellowProducts.length) % yellowProducts.length);
  };

  const handleYellowNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveYellowIdx(prev => (prev + 1) % yellowProducts.length);
  };

  // Dispatch global product view event (listened by App.tsx)
  const handleProductDetails = (product: any) => {
    window.dispatchEvent(new CustomEvent('bazar-request-view-product', { 
      detail: { product, fromTab: 'deals' } 
    }));
  };

  const gridSectionRef = React.useRef<HTMLDivElement>(null);

  const handleCarouselClick = (filter: '31' | '50') => {
    setActiveFilter(filter);
    setTimeout(() => {
      gridSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  // Products shown in the grid below
  const displayedProducts = React.useMemo(() => {
    if (activeFilter === '31') {
      return greenProducts;
    }
    if (activeFilter === '50') {
      return yellowProducts;
    }
    return productsList;
  }, [activeFilter, productsList, greenProducts, yellowProducts]);

  const activeGreenItem = greenProducts[activeGreenIdx] || null;
  const activeYellowItem = yellowProducts[activeYellowIdx] || null;

  return (
    <div className="space-y-6 pt-4 font-sans select-none pb-20">
      
      {/* SIDE BY SIDE HERO CAROUSELS (Green: 31%+ vs Yellow: 50%+) */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* GREEN HERO CAROUSEL (31%+ Off) */}
        <div 
          onClick={() => handleCarouselClick('31')}
          className={`relative overflow-hidden rounded-3xl aspect-[16/10] sm:aspect-[16/9] md:aspect-auto md:h-64 cursor-pointer transition-all duration-300 group flex flex-col justify-between p-5 border shadow-lg ${
            activeFilter === '31' 
              ? 'border-emerald-400 ring-2 ring-emerald-500/20 shadow-emerald-950/20' 
              : 'border-emerald-500/15 hover:border-emerald-400/40 bg-zinc-950'
          }`}
          title="See 31%+ Discount Products"
        >
          {/* Green abstract glowing backdrop */}
          <div className="absolute inset-0 bg-gradient-to-t from-emerald-950/98 via-emerald-950/70 to-emerald-900/20 z-0" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.12),transparent_45%)]" />

          {/* Header Row */}
          <div className="relative z-10 flex justify-between items-start">
            <div className="space-y-0.5">
              <span className="inline-flex items-center gap-1 bg-emerald-500/10 text-emerald-400 border border-emerald-400/20 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest animate-pulse">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span> 31% & Above Deals
              </span>
              <h2 className="text-xl font-extrabold uppercase tracking-tight text-white leading-tight">
                Green Value Vault
              </h2>
            </div>
            <div className="flex items-center gap-1.5 relative z-25">
              <button 
                onClick={handleGreenPrev}
                className="w-7 h-7 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center border border-white/5 disabled:opacity-30 cursor-pointer active:scale-90 transition-all font-bold"
                aria-label="Previous image"
              >
                <Icons.ChevronLeft size={14} />
              </button>
              <button 
                onClick={handleGreenNext}
                className="w-7 h-7 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center border border-white/5 disabled:opacity-30 cursor-pointer active:scale-90 transition-all font-bold"
                aria-label="Next image"
              >
                <Icons.ChevronRight size={14} />
              </button>
            </div>
          </div>

          {/* Middle Body / Current Slide details */}
          {activeGreenItem ? (
            <div className="relative z-10 flex items-center justify-between gap-4 py-2 mt-auto">
              {/* Left Column Slide Info */}
              <div className="flex-1 min-w-0 space-y-1.5">
                <span className="text-[10px] font-bold text-emerald-400 tracking-wider">
                  HOT DEALS
                </span>
                <p className="text-sm font-bold text-white truncate leading-none">
                  {activeGreenItem.name}
                </p>
                <div className="flex items-baseline gap-2">
                  <span className="text-xl font-black text-emerald-400">
                    {formatPrice(activeGreenItem.price, activeGreenItem.customPrices)}
                  </span>
                  {activeGreenItem.originalPrice && (
                    <span className="text-xs text-outline line-through">
                      {formatPrice(activeGreenItem.originalPrice, activeGreenItem.customPrices ? Object.fromEntries(Object.entries(activeGreenItem.customPrices).map(([k, v]) => [k, (v as number) * 1.8])) : undefined)}
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleProductDetails(activeGreenItem);
                  }}
                  className="bg-emerald-500 hover:bg-emerald-400 text-black text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-xl transition-all shadow-md shadow-emerald-500/10 active:scale-95 flex items-center gap-1"
                >
                  View details <Icons.ArrowUpRight size={12} strokeWidth={3} />
                </button>
              </div>

              {/* Right Column Slide Image with absolute floating badge */}
              <div className="relative w-24 h-24 shrink-0 rounded-2xl overflow-hidden border border-white/10 bg-black select-none pointer-events-none">
                <img 
                  src={activeGreenItem.image} 
                  alt={activeGreenItem.name} 
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute top-1.5 right-1.5 bg-emerald-500 text-black text-[9px] font-black px-1.5 py-0.5 rounded-full shadow tracking-tighter">
                  -{getProductDiscount(activeGreenItem)}%
                </div>
              </div>
            </div>
          ) : (
            <div className="relative z-10 text-center text-outline/50 text-xs font-semibold py-8 mt-auto">
              No products found with 31%+ discount.
            </div>
          )}

          {/* Horizontal page indicator dots */}
          <div className="relative z-10 flex justify-center gap-1 mt-2">
            {greenProducts.map((_, i) => (
              <span 
                key={i} 
                className={`h-1 rounded-full transition-all duration-300 ${i === activeGreenIdx ? 'w-4 bg-emerald-400' : 'w-1 bg-white/20'}`}
              />
            ))}
          </div>
        </div>

        {/* YELLOW HERO CAROUSEL (50/50 - 50%+ Off) */}
        <div 
          onClick={() => handleCarouselClick('50')}
          className={`relative overflow-hidden rounded-3xl aspect-[16/10] sm:aspect-[16/9] md:aspect-auto md:h-64 cursor-pointer transition-all duration-300 group flex flex-col justify-between p-5 border shadow-lg ${
            activeFilter === '50' 
              ? 'border-amber-400 ring-2 ring-amber-500/20 shadow-amber-950/20' 
              : 'border-amber-500/15 hover:border-amber-400/40 bg-zinc-950'
          }`}
          title="See Epic 50% Off Products"
        >
          {/* Yellow/Amber abstract glowing backdrop */}
          <div className="absolute inset-0 bg-gradient-to-t from-amber-950/98 via-amber-950/70 to-amber-900/20 z-0" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(245,158,11,0.12),transparent_45%)]" />

          {/* Header Row */}
          <div className="relative z-10 flex justify-between items-start">
            <div className="space-y-0.5">
              <span className="inline-flex items-center gap-1 bg-amber-500/10 text-amber-400 border border-amber-400/20 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest animate-pulse">
                ⚡ 50/50 EPIC OFFERS
              </span>
              <h2 className="text-xl font-extrabold uppercase tracking-tight text-white leading-tight">
                Yellow Half-Price Club
              </h2>
            </div>
            <div className="flex items-center gap-1.5 relative z-25">
              <button 
                onClick={handleYellowPrev}
                className="w-7 h-7 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center border border-white/5 disabled:opacity-30 cursor-pointer active:scale-90 transition-all font-bold"
                aria-label="Previous slide"
              >
                <Icons.ChevronLeft size={14} />
              </button>
              <button 
                onClick={handleYellowNext}
                className="w-7 h-7 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center border border-white/5 disabled:opacity-30 cursor-pointer active:scale-90 transition-all font-bold"
                aria-label="Next slide"
              >
                <Icons.ChevronRight size={14} />
              </button>
            </div>
          </div>

          {/* Middle Body / Current Slide details */}
          {activeYellowItem ? (
            <div className="relative z-10 flex items-center justify-between gap-4 py-2 mt-auto">
              {/* Left Column Slide Info */}
              <div className="flex-1 min-w-0 space-y-1.5">
                {/* BIG RENDER WITH TEXT ACTION */}
                <h3 className="text-3xl font-black tracking-tighter text-amber-400 uppercase drop-shadow animate-pulse leading-none select-none">
                  50/50 DEAL
                </h3>
                <p className="text-sm font-bold text-white truncate leading-none">
                  {activeYellowItem.name}
                </p>
                <div className="flex items-baseline gap-2">
                  <span className="text-xl font-black text-amber-400">
                    {formatPrice(activeYellowItem.price, activeYellowItem.customPrices)}
                  </span>
                  {activeYellowItem.originalPrice && (
                    <span className="text-xs text-outline line-through">
                      {formatPrice(activeYellowItem.originalPrice, activeYellowItem.customPrices ? Object.fromEntries(Object.entries(activeYellowItem.customPrices).map(([k, v]) => [k, (v as number) * 2])) : undefined)}
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleProductDetails(activeYellowItem);
                  }}
                  className="bg-amber-450 hover:bg-amber-400 bg-amber-500 text-black text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-xl transition-all shadow-md shadow-amber-500/15 active:scale-95 flex items-center gap-1 animate-shimmer"
                >
                  Buy Half Price <Icons.ArrowUpRight size={12} strokeWidth={3} />
                </button>
              </div>

              {/* Right Column Slide Image with absolute floating badge */}
              <div className="relative w-24 h-24 shrink-0 rounded-2xl overflow-hidden border border-white/10 bg-black select-none pointer-events-none">
                <img 
                  src={activeYellowItem.image} 
                  alt={activeYellowItem.name} 
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute top-1.5 right-1.5 bg-amber-400 text-black text-[9px] font-black px-1.5 py-0.5 rounded-full shadow tracking-tighter">
                  -{getProductDiscount(activeYellowItem)}%
                </div>
              </div>
            </div>
          ) : (
            <div className="relative z-10 text-center text-outline/50 text-xs font-semibold py-8 mt-auto">
              No products found with 50%+ discount.
            </div>
          )}

          {/* Horizontal page indicator dots */}
          <div className="relative z-10 flex justify-center gap-1 mt-2">
            {yellowProducts.map((_, i) => (
              <span 
                key={i} 
                className={`h-1 rounded-full transition-all duration-300 ${i === activeYellowIdx ? 'w-4 bg-amber-400' : 'w-1 bg-white/20'}`}
              />
            ))}
          </div>
        </div>

      </section>

      {/* FILTER CONTROLS BAR */}
      <section ref={gridSectionRef} className="flex flex-col gap-3 scroll-mt-20">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-black text-outline uppercase tracking-widest flex items-center gap-2">
            <Icons.Filter size={13} className="text-primary" /> Filter Deals Tab
          </h3>
          {activeFilter !== 'all' && (
            <button 
              onClick={() => setActiveFilter('all')}
              className="text-[10px] font-bold text-primary hover:underline uppercase tracking-wide cursor-pointer"
            >
              Show all items
            </button>
          )}
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
          <button 
            type="button"
            onClick={() => setActiveFilter('all')}
            className={`px-5 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all shadow ${
              activeFilter === 'all' 
                ? 'bg-primary text-on-primary' 
                : 'glass-card text-on-surface-variant border-white/10 hover:bg-white/5'
            }`}
          >
            All Super Offers ({productsList.length})
          </button>
          
          <button 
            type="button"
            onClick={() => setActiveFilter('31')}
            className={`px-5 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all shadow flex items-center gap-1.5 ${
              activeFilter === '31' 
                ? 'bg-emerald-500 text-black' 
                : 'glass-card text-on-surface-variant border-white/10 hover:bg-emerald-500/10'
            }`}
          >
            🟢 31% & Above Off ({greenProducts.length})
          </button>

          <button 
            type="button"
            onClick={() => setActiveFilter('50')}
            className={`px-5 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all shadow flex items-center gap-1.5 ${
              activeFilter === '50' 
                ? 'bg-amber-400 text-black' 
                : 'glass-card text-on-surface-variant border-white/10 hover:bg-amber-400/10'
            }`}
          >
            🟡 50% Half Price Deals ({yellowProducts.length})
          </button>
        </div>
      </section>

      {/* DEALS PRODUCT GRID */}
      <section className="space-y-4">
        <div className="flex items-center justify-between border-b border-white/5 pb-2">
          <span className="text-xs font-bold text-outline">
            Showing {displayedProducts.length} discounted items
          </span>
          <span className="text-[10px] font-mono font-bold text-outline uppercase tracking-wider">
            ⚡ Flash sales dynamic sync
          </span>
        </div>

        {displayedProducts.length === 0 ? (
          <div className="glass-card rounded-3xl p-10 text-center text-outline/65 text-xs font-semibold border-white/5">
            No products match this discount filter currently. Open the Profile tab &gt; Seller Center to add some custom offers!
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {displayedProducts.map((p, index) => {
              const discount = getProductDiscount(p);
              return (
                <div 
                  key={index}
                  onClick={() => handleProductDetails(p)}
                  className="glass-card rounded-2xl p-2.5 border-white/10 hover:border-primary/20 flex flex-col justify-between transition-all duration-300 hover:shadow-xl hover:shadow-primary/5 active:scale-98 group cursor-pointer"
                >
                  <div>
                    {/* Image with discount badge */}
                    <div className="relative aspect-square rounded-xl overflow-hidden bg-black border border-white/10 select-none pointer-events-none">
                      <img 
                        src={p.image} 
                        alt={t(p.name, p.name)} 
                        className="w-full h-full object-cover" 
                        referrerPolicy="no-referrer"
                      />
                      {discount > 0 && (
                        <div className={`absolute top-1.5 right-1.5 text-[8px] font-black px-2 py-0.5 rounded-full shadow ${
                          discount >= 50 
                            ? 'bg-amber-400 text-black' 
                            : discount >= 31 
                              ? 'bg-emerald-400 text-black' 
                              : 'bg-primary text-on-primary'
                        }`}>
                          -{discount}% {t('OFF', 'OFF')}
                        </div>
                      )}
                    </div>

                    {/* Metadata */}
                    <div className="mt-2.5 px-0.5 space-y-1">
                      <div className="flex items-center gap-1.5 text-[9px] text-outline font-extrabold uppercase tracking-tight">
                        <span className="bg-white/5 border border-white/10 px-1.5 py-0.5 rounded-md truncate max-w-[85px]">{t(p.category || 'General', p.category || 'General')}</span>
                        {p.tag && <span className="bg-secondary/15 text-secondary px-1.5 py-0.5 rounded-md">{t(p.tag, p.tag)}</span>}
                      </div>
                      <h4 className="text-xs font-bold text-white transition-colors truncate">{t(p.name, p.name)}</h4>
                    </div>
                  </div>

                  <div className="mt-3 px-0.5 flex items-end justify-between border-t border-white/5 pt-2">
                    <div>
                      <span className="text-primary font-black text-sm">{formatPrice(p.price, p.customPrices)}</span>
                      {p.originalPrice && (
                        <span className="text-[10px] text-outline line-through block leading-none select-none">{formatPrice(p.originalPrice, p.customPrices ? Object.fromEntries(Object.entries(p.customPrices).map(([k, v]) => [k, (v as number) * 1.8])) : undefined)}</span>
                      )}
                    </div>
                    <div className="w-6 h-6 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all">
                      <Icons.ChevronRight size={13} strokeWidth={2.5} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

    </div>
  );
}

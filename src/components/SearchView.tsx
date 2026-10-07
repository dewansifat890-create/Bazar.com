import React from 'react';
import { Icons } from './Icons';
import { motion, AnimatePresence } from 'motion/react';
import CameraSearchView from './CameraSearchView';
import { INITIAL_PRODUCTS } from '../constants';
import { getProductSales, getProductRatingAndReviews } from '../utils/sales';
import { usePreferences } from '../utils/preferences';
import { getMergedProducts } from '../utils/sellerProducts';

interface SearchViewProps {
  onClose: () => void;
  startWithCamera?: boolean;
}

// Highly polished animated sad anime chibi vector
const SadAnimeCharacter = () => (
  <div className="relative w-40 h-40 mx-auto flex items-center justify-center select-none">
    <style dangerouslySetInnerHTML={{ __html: `
      @keyframes animeBubble {
        0%, 100% { transform: translateY(0px) scale(1) rotate(0deg); filter: drop-shadow(0 4px 12px rgba(16, 185, 129, 0.15)); }
        50% { transform: translateY(-8px) scale(1.05) rotate(1deg); filter: drop-shadow(0 12px 24px rgba(16, 185, 129, 0.3)); }
      }
      @keyframes eyeTwinkle {
        0%, 100% { opacity: 0.95; transform: scale(1); }
        50% { opacity: 0.55; transform: scale(0.92); }
      }
      @keyframes tearFall {
        0% { transform: translateY(0px) scale(1); opacity: 0; }
        20% { opacity: 1; }
        80% { transform: translateY(28px) scale(1.3); opacity: 0.85; }
        100% { transform: translateY(32px) scale(0.7); opacity: 0; }
      }
      .anime-avatar {
        animation: animeBubble 3.5s ease-in-out infinite;
      }
      .eye-twinkle {
        animation: eyeTwinkle 2s ease-in-out infinite;
      }
      .tear-drip-left {
        animation: tearFall 1.8s infinite cubic-bezier(0.4, 0, 0.6, 1);
      }
      .tear-drip-right {
        animation: tearFall 1.8s infinite cubic-bezier(0.4, 0, 0.6, 1);
        animation-delay: 0.9s;
      }
    `}} />

    <svg viewBox="0 0 100 100" className="w-full h-full anime-avatar">
      {/* Background radial gradient glow bubble */}
      <circle cx="50" cy="50" r="42" fill="url(#bgGlow)" opacity="0.2" />
      
      {/* Hair back */}
      <path d="M 12 50 C 14 22, 86 22, 88 50 C 88 78, 12 78, 12 50" fill="#1f2937" />
      
      {/* Cute ears with pink touch */}
      <path d="M 22 45 C 15 45, 15 55, 23 53 Z" fill="#ffe4e6" />
      <path d="M 78 45 C 85 45, 85 55, 77 53 Z" fill="#ffe4e6" />

      {/* Face skin */}
      <circle cx="50" cy="50" r="28" fill="#fff1f2" />
      
      {/* Cute sad downturned eyebrows */}
      <path d="M 32 38 Q 40 37, 44 41" stroke="#1f2937" strokeWidth="2.5" strokeLinecap="round" fill="none" />
      <path d="M 68 38 Q 60 37, 56 41" stroke="#1f2937" strokeWidth="2.5" strokeLinecap="round" fill="none" />

      {/* Flushed rosy blush cheeks */}
      <ellipse cx="32" cy="56" rx="5" ry="3" fill="#ec4899" opacity="0.45" />
      <ellipse cx="68" cy="56" rx="5" ry="3" fill="#ec4899" opacity="0.45" />

      {/* Big glittery sad watery eyes */}
      <g>
        {/* Left eye base */}
        <ellipse cx="36" cy="48" rx="6" ry="8" fill="#111827" />
        {/* Left eye highlights (pupil) */}
        <circle cx="34" cy="45" r="2" fill="#ffffff" className="eye-twinkle" />
        <circle cx="38" cy="51" r="1" fill="#ffffff" />
        <ellipse cx="36" cy="48" rx="3" ry="4" fill="#10b981" opacity="0.4" />
        
        {/* Right eye base */}
        <ellipse cx="64" cy="48" rx="6" ry="8" fill="#111827" />
        {/* Right eye highlights (pupil) */}
        <circle cx="62" cy="45" r="2" fill="#ffffff" className="eye-twinkle" />
        <circle cx="66" cy="51" r="1" fill="#ffffff" />
        <ellipse cx="64" cy="48" rx="3" ry="4" fill="#10b981" opacity="0.4" />
      </g>

      {/* Little pouty downturned sad mouth */}
      <path d="M 46 62 Q 50 59, 54 62" stroke="#111827" strokeWidth="2.5" strokeLinecap="round" fill="none" />

      {/* Cute hair bangs on front */}
      <path d="M 22 45 C 24 30, 40 32, 45 36 C 45 36, 50 30, 55 36 C 60 32, 76 30, 78 45 C 75 42, 60 40, 50 43 C 40 40, 25 42, 22 45 Z" fill="#374151" />

      {/* Sad giant teardrops dripping down cheeks */}
      <g>
        <path d="M 36 54 Q 32 60, 36 66 Q 40 60, 36 54" fill="#0ea5e9" className="tear-drip-left" />
        <path d="M 64 54 Q 60 60, 64 66 Q 68 60, 64 54" fill="#0ea5e9" className="tear-drip-right" />
      </g>

      {/* Defs for glossy background glow */}
      <defs>
        <radialGradient id="bgGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#10b981" />
          <stop offset="100%" stopColor="#047857" stopOpacity="0" />
        </radialGradient>
      </defs>
    </svg>
  </div>
);

// High quality Product Card inside Search results matching original theme
function ProductCardInSearch({ product, onOpen }: { product: any; onOpen: () => void; key?: any }) {
  const { t, formatPrice } = usePreferences();
  const salesCount = getProductSales(product.name);
  const { rating: dynamicRating, reviewsCount } = getProductRatingAndReviews(product.name);

  return (
    <div 
      onClick={onOpen}
      className="glass-card rounded-2xl overflow-hidden flex flex-col emerald-glow group cursor-pointer active:scale-98 transition-all bg-white/5 border border-white/10"
    >
      <div className="relative h-36 overflow-hidden bg-black/20 flex items-center justify-center">
        <img 
          src={product.image} 
          alt={t(product.name, product.name)} 
          className="w-full h-full object-cover select-none pointer-events-none group-hover:scale-105 transition-transform duration-500" 
          referrerPolicy="no-referrer"
        />
        {product.tag && (
          <span className="absolute top-2 left-2 bg-error text-white text-[9px] font-bold px-2 py-0.5 rounded-full shadow-md">
            {t(product.tag, product.tag)}
          </span>
        )}
      </div>
      <div className="p-3 flex-1 flex flex-col justify-between">
        <div>
          <h4 className="text-xs font-bold text-white group-hover:text-primary transition-colors truncate">{t(product.name, product.name)}</h4>
          <div className="flex items-baseline gap-1.5 mt-1">
            <span className="text-primary font-extrabold text-sm">{formatPrice(product.price)}</span>
            {product.originalPrice && (
              <span className="text-outline text-[9px] line-through">
                {formatPrice(product.originalPrice)}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1.5 mt-2.5 text-[10px] text-outline font-medium border-t border-white/5 pt-2">
          <Icons.Star size={10} className="text-secondary fill-secondary" />
          <span>{dynamicRating} ({reviewsCount})</span>
          <span>•</span>
          <span className="text-primary font-bold">{salesCount} {t('sold', 'sold')}</span>
        </div>
      </div>
    </div>
  );
}

export default function SearchView({ onClose, startWithCamera = false }: SearchViewProps) {
  const { t, formatPrice } = usePreferences();
  const [searchQuery, setSearchQuery] = React.useState('');
  const [showGlassOptions, setShowGlassOptions] = React.useState(startWithCamera);
  const [searchActive, setSearchActive] = React.useState(false);
  const [suggestionsOpen, setSuggestionsOpen] = React.useState(false);
  const [matchingProducts, setMatchingProducts] = React.useState<any[]>([]);

  // Green glass visual scanner states
  const [isScanning, setIsScanning] = React.useState(false);
  const [scanProgress, setScanProgress] = React.useState(0);
  const [scanStep, setScanStep] = React.useState('');
  const [capturedImage, setCapturedImage] = React.useState<string | null>(null);
  const [scannedFile, setScannedFile] = React.useState<File | null>(null);
  const [apiResult, setApiResult] = React.useState<any | null>(null);
  const [isScanningApiRunning, setIsScanningApiRunning] = React.useState(false);

  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const nativeCameraInputRef = React.useRef<HTMLInputElement>(null);

  const [searchHistory, setSearchHistory] = React.useState<string[]>(() => {
    const saved = localStorage.getItem('bazar_search_history');
    return saved ? JSON.parse(saved) : ['Mini Fan', 'Smart Watch', 'Headphones'];
  });

  const [topProducts, setTopProducts] = React.useState(() => {
    return [...INITIAL_PRODUCTS].sort((a, b) => {
      const salesA = getProductSales(a.name);
      const salesB = getProductSales(b.name);
      return salesB - salesA;
    });
  });

  const handleBackAction = () => {
    setSearchQuery('');
    setSearchActive(false);
    onClose();
  };

  // Swipe back gesture handler (left-to-right swipe)
  const touchStartRef = React.useRef<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    // Only capture swipes starting in the left region (first 140px)
    if (e.touches[0].clientX < 140) {
      touchStartRef.current = e.touches[0].clientX;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchStartRef.current) return;
    const currentX = e.touches[0].clientX;
    const diffX = currentX - touchStartRef.current;
    
    // If swiped right by more than 80px, trigger back action!
    if (diffX > 80) {
      touchStartRef.current = null;
      handleBackAction();
    }
  };

  const handleTouchEnd = () => {
    touchStartRef.current = null;
  };

  React.useEffect(() => {
    // Prevent pinch-zooming gestures natively via touch listeners on SearchView viewport
    const preventPinchZoom = (e: TouchEvent) => {
      if (e.touches.length > 1) {
        e.preventDefault();
      }
    };
    document.addEventListener('touchstart', preventPinchZoom, { passive: false });
    return () => {
      document.removeEventListener('touchstart', preventPinchZoom);
    };
  }, []);

  React.useEffect(() => {
    localStorage.setItem('bazar_search_history', JSON.stringify(searchHistory));
  }, [searchHistory]);

  React.useEffect(() => {
    const handleSalesUpdate = () => {
      setTopProducts([...INITIAL_PRODUCTS].sort((a, b) => {
        const salesA = getProductSales(a.name);
        const salesB = getProductSales(b.name);
        return salesB - salesA;
      }));
    };
    window.addEventListener('bazar-sales-updated', handleSalesUpdate);
    return () => {
      window.removeEventListener('bazar-sales-updated', handleSalesUpdate);
    };
  }, []);

  // Suggestions setup matching user request ("fan" -> "Mini Fan", "Turbo Fan", "AC Fan" suggestions)
  const SUGGESTION_POOL = [
    "Mini Fan",
    "Turbo Fan",
    "AC Fan",
    "Air Cooler Fan",
    "Smart Desk Fan",
    "Minimalist Timepiece",
    "Smart Health Watch",
    "Apex Leather Chrono",
    "Turbo Run Crimson Kicks",
    "Carbon Pro Speedrunners",
    "Pro Audio Headphones",
    "Wireless Audio Pro",
    "Fitness Sports Tracker",
    "Modern Smart Wearables"
  ];

  const allAvailableProducts = getMergedProducts();
  const dynamicSuggestions = React.useMemo(() => {
    const productNames = allAvailableProducts.map(p => p.name);
    return Array.from(new Set([...SUGGESTION_POOL, ...productNames]));
  }, [allAvailableProducts]);

  const queryLower = searchQuery.trim().toLowerCase();
  const suggestions = React.useMemo(() => {
    if (!queryLower) return [];
    return dynamicSuggestions.filter(s => s.toLowerCase().includes(queryLower)).slice(0, 5);
  }, [queryLower, dynamicSuggestions]);

  const handleSearchSubmit = (queryToSearch?: string) => {
    const q = (queryToSearch !== undefined ? queryToSearch : searchQuery).trim();
    if (!q) return;

    // Track search history
    setSearchHistory(prev => [q, ...prev.filter(h => h !== q)].slice(0, 5));
    setSearchQuery(q);

    // Filter matching products from deep catalog
    const matches = allAvailableProducts.filter(p => 
      p.name.toLowerCase().includes(q.toLowerCase()) || 
      (p.category && p.category.toLowerCase().includes(q.toLowerCase()))
    );

    setMatchingProducts(matches);
    setSearchActive(true);
    setSuggestionsOpen(false);
  };

  // Launch Scanning Logic for camera capture or gallery upload
  const startScanningSequence = (file: File) => {
    setScannedFile(file);
    setScanProgress(0);
    setScanStep('Initializing AI visual core...');
    setIsScanning(true);
    setApiResult(null);

    // Render local thumbnail and query APIs
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setCapturedImage(base64);

      setIsScanningApiRunning(true);
      fetch('/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          base64Image: base64,
          mimeType: base64.includes(';') ? base64.substring(base64.indexOf(':') + 1, base64.indexOf(';')) : 'image/jpeg'
        })
      })
      .then(res => {
        if (!res.ok) throw new Error('Visual search failed');
        return res.json();
      })
      .then(data => {
        setApiResult(data);
        setIsScanningApiRunning(false);
      })
      .catch(err => {
        console.warn('Scan API fallback:', err);
        setIsScanningApiRunning(false);
      });
    };
    reader.readAsDataURL(file);
  };

  // Tick scanner progress bar beautifully
  React.useEffect(() => {
    if (isScanning) {
      const interval = setInterval(() => {
        setScanProgress(prev => {
          const next = prev + 5;
          if (next >= 100) {
            clearInterval(interval);
            return 100;
          }

          // Real-time progressive scan logging
          if (next > 15 && next < 40) {
            setScanStep('Detecting product borders & angles...');
          } else if (next >= 40 && next < 65) {
            setScanStep('Reading color signature and textures...');
          } else if (next >= 65 && next < 85) {
            setScanStep('Scanning Bazar active inventories...');
          } else if (next >= 85) {
            setScanStep('Authenticating catalog matches...');
          }
          return next;
        });
      }, 90);

      return () => clearInterval(interval);
    }
  }, [isScanning]);

  // Handle Scan Completion
  const handleScanCompletion = () => {
    const allProducts = getMergedProducts();
    let matched = null;

    if (apiResult && apiResult.matched && apiResult.productName) {
      matched = allProducts.find(p => p.name.toLowerCase() === apiResult.productName.toLowerCase());
    }

    if (!matched && scannedFile) {
      const fileName = scannedFile.name.toLowerCase();
      // Keyword parsing
      if (fileName.includes('fan') || fileName.includes('cooler') || fileName.includes('air') || fileName.includes('blower')) {
        matched = allProducts.find(p => p.name.toLowerCase().includes('fan'));
      } else if (fileName.includes('watch') || fileName.includes('time') || fileName.includes('clock') || fileName.includes('wrist') || fileName.includes('smart')) {
        matched = allProducts.find(p => p.category?.toLowerCase() === 'watch' || p.name.toLowerCase().includes('watch'));
      } else if (fileName.includes('shoe') || fileName.includes('run') || fileName.includes('crimson') || fileName.includes('turbo') || fileName.includes('sneak') || fileName.includes('sport') || fileName.includes('kick')) {
        matched = allProducts.find(p => p.category?.toLowerCase() === 'shoes');
      } else if (fileName.includes('head') || fileName.includes('audio') || fileName.includes('sound') || fileName.includes('ear') || fileName.includes('music') || fileName.includes('phone') || fileName.includes('mic') || fileName.includes('pro')) {
        matched = allProducts.find(p => p.category?.toLowerCase() === 'audio');
      }
    }

    setSearchQuery(scannedFile ? scannedFile.name : 'V-Scan Match');
    if (matched) {
      setMatchingProducts([matched]);
    } else {
      setMatchingProducts([]); // empty shows the sad anime face and suggestions
    }
    setSearchActive(true);
    setSuggestionsOpen(false);
  };

  React.useEffect(() => {
    if (isScanning && scanProgress === 100 && !isScanningApiRunning) {
      setIsScanning(false);
      handleScanCompletion();
    }
  }, [isScanning, scanProgress, isScanningApiRunning]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      startScanningSequence(file);
    }
  };

  const handleNativeCameraCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      startScanningSequence(file);
    }
  };

  return (
    <div 
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className="fixed inset-0 z-[100] bg-zinc-950 flex flex-col animate-in slide-in-from-bottom duration-500 overflow-hidden"
    >
      {/* Top Search App Bar */}
      <div className="p-4 flex items-center gap-2.5 border-b border-white/10 bg-zinc-900/40 backdrop-blur-3xl shrink-0">
        <button 
          onClick={handleBackAction} 
          className="p-3 glass-card rounded-2xl transition-colors active:scale-95 text-outline hover:text-white shrink-0 bg-white/5"
          aria-label="Back"
        >
          <Icons.ArrowLeft size={18} />
        </button>

        <div className="flex-1 relative flex items-center">
          <Icons.Search className="absolute left-3 text-outline" size={15} />
          <input 
            autoFocus
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setSuggestionsOpen(true);
            }}
            onFocus={() => setSuggestionsOpen(true)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleSearchSubmit();
              }
            }}
            className="w-full pl-9 pr-10 py-2.5 bg-white/5 border border-white/10 rounded-2xl focus:border-primary/45 focus:ring-2 focus:ring-primary/10 text-base font-semibold text-white placeholder:text-outline transition-all" 
            placeholder={t('search_placeholder_typing', 'Search, e.g. "fan", "watch"...')} 
            type="text"
          />
          {searchQuery && (
            <button 
              onClick={() => {
                setSearchQuery('');
                setSearchActive(false);
                setSuggestionsOpen(false);
              }}
              className="absolute right-3 text-outline hover:text-white transition-colors cursor-pointer"
              aria-label="Clear"
            >
              <Icons.X size={15} />
            </button>
          )}
        </div>

        {/* Dedicated Search Action Button (Icon only!) */}
        <button 
          onClick={() => handleSearchSubmit()}
          className="p-3 bg-primary text-black rounded-2xl hover:bg-primary-hover active:scale-95 transition-all flex items-center justify-center shrink-0 shadow-lg shadow-primary/20 cursor-pointer"
          style={{ width: '40px', height: '40px' }}
          title="Search product"
        >
          <Icons.Search size={16} strokeWidth={3} />
        </button>

        {/* Camera trigger button right after search logo button */}
        <button 
          type="button"
          onClick={() => setShowGlassOptions(true)}
          className="p-3 hover:text-white active:scale-95 transition-all rounded-2xl bg-emerald-500/20 border border-emerald-500/35 flex items-center justify-center cursor-pointer text-emerald-300 hover:bg-emerald-500/30 shadow-md shrink-0"
          style={{ width: '40px', height: '40px' }}
          title="Camera Visual Search (Lens)"
        >
          <Icons.Camera size={16} strokeWidth={2.5} />
        </button>
      </div>

      {/* Floating Auto-Suggestions dropdown */}
      {suggestionsOpen && searchQuery && suggestions.length > 0 && (
        <div className="absolute top-[72px] left-4 right-4 z-[110] bg-zinc-900/98 border border-white/15 rounded-3xl shadow-2xl p-2.5 max-h-60 overflow-y-auto scrollbar-hide backdrop-blur-xl animate-in slide-in-from-top-2 duration-200">
          <div className="px-3.5 py-1.5 text-[9px] font-extrabold text-primary uppercase tracking-wider border-b border-white/5 mb-1 flex items-center gap-1.5">
            <Icons.Sparkles size={10} className="text-primary animate-pulse" />
            <span>Suggested Matches</span>
          </div>
          {suggestions.map((sug, idx) => (
            <button
              key={idx}
              onClick={() => {
                handleSearchSubmit(sug);
              }}
              className="w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold text-outline hover:bg-white/5 hover:text-primary transition-all flex items-center gap-2 group cursor-pointer"
            >
              <Icons.Search size={12} className="text-outline group-hover:text-primary transition-colors" />
              <span>{sug}</span>
            </button>
          ))}
        </div>
      )}

      {/* Dynamic View Panel: Regular Search Home OR Results Page */}
      <div className="flex-1 overflow-y-auto p-5 scrollbar-hide space-y-8 bg-zinc-950">
        {searchActive ? (
          /* ================= SEARCH RESULTS PANEL ================= */
          matchingProducts.length > 0 ? (
            /* Match found results grid */
            <div className="space-y-4 animate-in fade-in duration-300">
              <div className="flex justify-between items-center bg-white/5 border border-white/5 rounded-2xl p-3.5">
                <div>
                  <h3 className="text-[10px] font-black text-primary uppercase tracking-widest leading-none">Catalog Match</h3>
                  <h2 className="text-sm font-extrabold text-white mt-1">Showing search results for "{searchQuery}"</h2>
                </div>
                <span className="text-[10px] bg-primary/10 border border-primary/25 text-primary px-2.5 py-1 rounded-full font-black">
                  {matchingProducts.length} {matchingProducts.length === 1 ? 'Item' : 'Items'}
                </span>
              </div>

              {/* Grid display identical to HomeView */}
              <div className="grid grid-cols-2 gap-4">
                {matchingProducts.map((product, idx) => (
                  <ProductCardInSearch 
                    key={idx}
                    product={product}
                    onOpen={() => {
                      setSearchHistory([product.name, ...searchHistory.filter(h => h !== product.name)].slice(0, 5));
                      window.dispatchEvent(new CustomEvent('open-product', { detail: product }));
                      onClose();
                    }}
                  />
                ))}
              </div>
            </div>
          ) : (
            /* No direct matches -> Sorry animation with Sad Anime avatar + suggested options */
            <div className="space-y-7 animate-in fade-in duration-500">
              <div className="glass-card rounded-3xl p-6 border border-white/5 bg-gradient-to-b from-primary/5 via-transparent to-transparent flex flex-col items-center text-center space-y-4 shadow-xl">
                <SadAnimeCharacter />
                
                <div className="space-y-2">
                  <h2 className="text-base font-black tracking-tight text-white uppercase sm:text-lg">
                    Oops! Product Not Found
                  </h2>
                  <p className="text-xs text-outline font-black py-1 px-3 bg-red-500/10 border border-red-500/20 rounded-full w-fit mx-auto text-center leading-none">
                    "দুঃখিত, কোনো পণ্য পাওয়া যায়নি।"
                  </p>
                  <p className="text-[11px] text-outline leading-relaxed max-w-sm px-2">
                    Bazar could not match <span className="text-white font-semibold">"{searchQuery}"</span> to any active inventory. Try checking spelling or explore our trending alternatives below:
                  </p>
                </div>
              </div>

              {/* Dynamic suggestion lists footer */}
              <div className="space-y-4 pt-2">
                <div className="flex items-center justify-between border-t border-white/5 pt-4">
                  <div className="space-y-0.5">
                    <h3 className="text-[10px] font-black text-primary uppercase tracking-wider">Suggested Replacements</h3>
                    <h2 className="text-sm font-extrabold text-white">Recommended Products</h2>
                  </div>
                  <span className="text-[10px] bg-primary/10 border border-primary/20 text-primary px-2 py-0.5 rounded-full font-extrabold">Hot Picks</span>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {allAvailableProducts.slice(0, 4).map((product, idx) => (
                    <ProductCardInSearch 
                      key={idx}
                      product={product}
                      onOpen={() => {
                        window.dispatchEvent(new CustomEvent('open-product', { detail: product }));
                        onClose();
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>
          )
        ) : (
          /* ================= REGULAR SEARCH HOME PANEL ================= */
          <>
            {/* Recent Searches */}
            {searchHistory.length > 0 && (
              <section className="animate-in fade-in duration-450">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xs font-black text-outline uppercase tracking-widest flex items-center gap-1.5">
                    <Icons.History size={13} /> {t('Recent Searches', 'Recent Searches')}
                  </h3>
                  <button 
                    onClick={() => setSearchHistory([])}
                    className="text-xs font-bold text-error hover:underline flex items-center gap-1"
                  >
                    <Icons.Trash2 size={12} /> Clear
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {searchHistory.map((item, i) => (
                    <div 
                      key={i} 
                      className="flex items-center gap-2 px-3 py-1.5 bg-white/5 border border-white/5 rounded-full text-xs font-semibold hover:border-primary/40 transition-all cursor-pointer group active:scale-95 text-white"
                    >
                      <span onClick={() => { setSearchQuery(item); handleSearchSubmit(item); }}>{item}</span>
                      <Icons.X 
                        size={12} 
                        className="text-outline cursor-pointer hover:text-error" 
                        onClick={(e) => {
                          e.stopPropagation();
                          setSearchHistory(searchHistory.filter((_, idx) => idx !== i));
                        }}
                      />
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Dynamic Top Selling list */}
            <section className="space-y-4">
              <h3 className="text-xs font-black text-outline uppercase tracking-widest flex items-center gap-1.5">
                <Icons.TrendingUp size={13} /> {t('Top Selling', 'Top Selling')}
              </h3>
              <div className="space-y-3">
                {topProducts.slice(0, 4).map((item, i) => {
                  const sales = getProductSales(item.name);
                  return (
                    <div 
                      key={i} 
                      onClick={() => {
                        setSearchHistory([item.name, ...searchHistory.filter(h => h !== item.name)].slice(0, 5));
                        window.dispatchEvent(new CustomEvent('open-product', { detail: item }));
                        onClose();
                      }}
                      className="flex items-center gap-3.5 p-3 bg-white/5 border border-white/5 rounded-2xl hover:border-primary/20 hover:shadow-lg hover:shadow-primary/5 transition-all cursor-pointer group active:scale-98"
                    >
                      <div className="w-11 h-11 rounded-xl overflow-hidden bg-black/20 shrink-0 border border-white/5">
                        <img 
                          src={item.image} 
                          alt={t(item.name, item.name)} 
                          className="w-full h-full object-cover" 
                          referrerPolicy="no-referrer"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-xs font-bold text-white group-hover:text-primary transition-colors truncate">{t(item.name, item.name)}</h4>
                        <div className="flex items-center gap-2 mt-0.5">
                          <p className="text-[11px] text-primary font-black">{formatPrice(item.price)}</p>
                          <span className="text-[10px] text-outline">•</span>
                          <span className="text-[9px] text-primary/80 bg-primary/10 px-2 py-0.5 rounded-full font-bold">{sales} {t('sold', 'sold')}</span>
                        </div>
                      </div>
                      <Icons.ChevronRight size={14} className="text-outline group-hover:text-primary transition-colors h-4 w-4" />
                    </div>
                  );
                })}
              </div>
            </section>
          </>
        )}
      </div>

      {/* Hidden File Inputs for Lens Camera / File Upload */}
      <input 
        type="file" 
        ref={nativeCameraInputRef} 
        onChange={handleNativeCameraCapture} 
        accept="image/*" 
        capture="environment" 
        className="hidden" 
      />
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileUpload} 
        accept="image/*" 
        className="hidden" 
      />

      {/* 1. Green Glass Options Selection sheet */}
      <AnimatePresence>
        {showGlassOptions && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[150] bg-black/20 backdrop-blur-[3px] flex items-center justify-center p-4 text-center"
            onClick={() => setShowGlassOptions(false)}
          >
            <motion.div
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.92, opacity: 0 }}
              transition={{ type: "spring", damping: 22, stiffness: 320 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-[260px] rounded-2xl p-4 border border-emerald-500/30 bg-emerald-950/80 backdrop-blur-xl shadow-[0_8px_32px_rgba(4,120,87,0.35)] flex flex-col gap-3 relative overflow-hidden"
            >
              {/* Subtle glass reflection highlights */}
              <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-emerald-400/30 to-transparent" />
              
              <div className="flex flex-col gap-2">
                {/* Camera option */}
                <button
                  type="button"
                  onClick={() => {
                    setShowGlassOptions(false);
                    nativeCameraInputRef.current?.click();
                  }}
                  className="w-full py-3 px-4 rounded-xl flex items-center gap-3 border border-emerald-500/20 bg-white/5 hover:bg-emerald-500/15 active:scale-95 transition-all text-left cursor-pointer group"
                >
                  <Icons.Camera size={16} className="text-emerald-400 group-hover:scale-110 transition-transform" />
                  <span className="text-xs font-bold text-white">Phone Camera</span>
                </button>

                {/* Gallery option */}
                <button
                  type="button"
                  onClick={() => {
                    setShowGlassOptions(false);
                    fileInputRef.current?.click();
                  }}
                  className="w-full py-3 px-4 rounded-xl flex items-center gap-3 border border-emerald-500/20 bg-white/5 hover:bg-emerald-500/15 active:scale-95 transition-all text-left cursor-pointer group"
                >
                  <Icons.Image size={16} className="text-emerald-400 group-hover:scale-110 transition-transform" />
                  <span className="text-xs font-bold text-white">Phone Gallery</span>
                </button>
              </div>

              <button 
                type="button"
                onClick={() => setShowGlassOptions(false)}
                className="text-center text-[11px] font-black text-emerald-300/80 hover:text-white transition-colors cursor-pointer py-1 active:scale-95"
              >
                Cancel
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 2. Scanning Laser Progress overlay */}
      <AnimatePresence>
        {isScanning && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[160] bg-black/85 backdrop-blur-xl flex flex-col items-center justify-center p-6"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="w-full max-w-sm rounded-[32px] border-2 border-emerald-400 bg-[#064e3b]/85 p-8 text-center relative overflow-hidden shadow-[0_0_60px_rgba(16,185,129,0.45)] backdrop-blur-2xl"
            >
              {/* Radar grids */}
              <div className="absolute inset-0 bg-[radial-gradient(#10b981_1.5px,transparent_1.5px)] [background-size:24px_24px] opacity-15 pointer-events-none" />

              {/* Outer neon pulse circle */}
              <div className="relative w-40 h-40 mx-auto flex items-center justify-center mb-6">
                <motion.div 
                  className="absolute inset-0 rounded-full border-2 border-emerald-500/20 border-t-emerald-400 border-b-emerald-400"
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 4, ease: "linear" }}
                />
                <motion.div 
                  className="absolute w-32 h-32 rounded-full border border-dashed border-emerald-400/40"
                  animate={{ rotate: -360 }}
                  transition={{ repeat: Infinity, duration: 10, ease: "linear" }}
                />
                <div className="w-20 h-20 rounded-full bg-emerald-500/10 border border-emerald-400/50 flex items-center justify-center text-emerald-300">
                  <Icons.Sparkles className="animate-pulse" size={32} />
                </div>
                
                {/* Neon laser scan sweep */}
                <motion.div 
                  className="absolute left-4 right-4 h-1 bg-gradient-to-r from-transparent via-emerald-300 to-transparent shadow-[0_0_15px_#10b981]"
                  animate={{ top: ['15%', '85%', '15%'] }}
                  transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                />
              </div>

              {/* Text descriptions */}
              <div className="space-y-3">
                <h3 className="text-lg font-black text-white uppercase tracking-wider drop-shadow-md">
                  Scanning Catalog...
                </h3>
                <p className="text-[10px] text-emerald-100 font-bold bg-[#047857]/50 rounded-full px-3 py-1.5 truncate border border-emerald-500/30 w-fit mx-auto max-w-xs">
                  {scannedFile?.name || 'Live Frame Upload'}
                </p>
                <p className="text-xs text-emerald-200/90 font-mono h-4 italic">
                  {scanStep}
                </p>
              </div>

              {/* Glass progress indicator */}
              <div className="mt-6 space-y-2">
                <div className="w-full bg-white/10 rounded-full h-3 overflow-hidden border border-emerald-400/30 p-[2px]">
                  <motion.div 
                    className="h-full bg-emerald-400 rounded-full shadow-[0_0_10px_#10b981]"
                    style={{ width: `${scanProgress}%` }}
                    transition={{ ease: "easeOut" }}
                  />
                </div>
                <div className="text-[10px] font-black tracking-widest text-emerald-300 uppercase">
                  AI Engine Analysis: {scanProgress}%
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

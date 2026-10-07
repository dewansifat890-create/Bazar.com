import React from 'react';
import { Icons } from './Icons';
import { motion, AnimatePresence } from 'motion/react';
import { getProductSales, incrementProductSales } from '../utils/sales';
import { usePreferences } from '../utils/preferences';

interface ProductDetailViewProps {
  product: {
    name: string;
    price: number;
    originalPrice?: number;
    image: string;
    images?: string[];
    videos?: any[];
    rating: number;
    reviews: string;
    tag?: string;
    category?: string;
  };
  allProducts?: any[];
  onBack: () => void;
  onAddToCart?: (quantity: number) => void;
  onChat?: () => void;
  onBuyNow?: (quantity: number) => void;
  onProductClick?: (product: any) => void;
  onWishlistToggle?: (product: any) => void;
  isLiked?: boolean;
}

export interface MediaItem {
  type: 'image' | 'video';
  url: string;
  thumbnail: string;
  isYoutube?: boolean;
}

export default function ProductDetailView({ 
  product, 
  allProducts = [],
  onBack, 
  onAddToCart, 
  onChat, 
  onBuyNow,
  onProductClick,
  onWishlistToggle,
  isLiked: initialIsLiked = false 
}: ProductDetailViewProps) {
  const { t, formatPrice } = usePreferences();
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [quantity, setQuantity] = React.useState(1);
  const [isLiked, setIsLiked] = React.useState(initialIsLiked);
  const [isAdding, setIsAdding] = React.useState(false);
  const [isAdded, setIsAdded] = React.useState(false);
  const [selectedImage, setSelectedImage] = React.useState(0);
  const [selectedColor, setSelectedColor] = React.useState(0);
  const [isExpanded, setIsExpanded] = React.useState(false);
  const [visible, setVisible] = React.useState(true);
  const [fullscreenVideo, setFullscreenVideo] = React.useState<MediaItem | null>(null);
  const scrollTimeout = React.useRef<NodeJS.Timeout | null>(null);

  // Dynamic Sales State
  const [salesCount, setSalesCount] = React.useState(() => getProductSales(product.name));

  // Local Dynamic Review/Comments State
  const [reviewsList, setReviewsList] = React.useState<any[]>(() => {
    try {
      const stored = localStorage.getItem('bazar_global_user_reviews');
      if (stored) {
        const parsed = JSON.parse(stored);
        const matched = parsed.filter((rev: any) => rev.productName === product.name);
        return matched;
      }
    } catch (e) {
      console.error(e);
    }
    return [];
  });

  const [commentText, setCommentText] = React.useState('');
  const [reviewerName, setReviewerName] = React.useState('');
  const [ratingInput, setRatingInput] = React.useState(5);
  const [reviewSuccess, setReviewSuccess] = React.useState(false);
  const [showReviewsPage, setShowReviewsPage] = React.useState(false);
  const [toastMessage, setToastMessage] = React.useState('');

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

  // iPhone back-swipe hooks
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

  const handleSubmitReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim() || !reviewerName.trim()) return;

    const newReview = {
      id: `rev-${Date.now()}`,
      productName: product.name,
      name: reviewerName.trim(),
      rating: ratingInput,
      date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      text: commentText.trim(),
      verified: true,
      reply: undefined
    };

    setReviewsList(prev => [newReview, ...prev]);

    try {
      const stored = localStorage.getItem('bazar_global_user_reviews');
      const parsed = stored ? JSON.parse(stored) : [];
      parsed.unshift(newReview);
      localStorage.setItem('bazar_global_user_reviews', JSON.stringify(parsed));
      window.dispatchEvent(new Event('bazar-reviews-updated'));
    } catch (err) {
      console.error('Failed to save user review:', err);
    }

    setCommentText('');
    setReviewerName('');
    setRatingInput(5);
    setReviewSuccess(true);
    setTimeout(() => setReviewSuccess(false), 3000);
  };

  React.useEffect(() => {
    setSalesCount(getProductSales(product.name));
    
    const handleSalesUpdate = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail && customEvent.detail.productName === product.name) {
        setSalesCount(customEvent.detail.sales);
      }
    };
    
    window.addEventListener('bazar-sales-updated', handleSalesUpdate);
    return () => {
      window.removeEventListener('bazar-sales-updated', handleSalesUpdate);
    };
  }, [product.name]);

  React.useEffect(() => {
    const handleReviewsUpdateGlobal = () => {
      try {
        const stored = localStorage.getItem('bazar_global_user_reviews');
        if (stored) {
          const parsed = JSON.parse(stored);
          const matched = parsed.filter((rev: any) => rev.productName === product.name);
          setReviewsList(matched);
        } else {
          setReviewsList([]);
        }
      } catch (e) {
        console.error(e);
      }
    };

    window.addEventListener('bazar-reviews-updated', handleReviewsUpdateGlobal);
    return () => {
      window.removeEventListener('bazar-reviews-updated', handleReviewsUpdateGlobal);
    };
  }, [product.name]);

  // Compute actual dynamic average rating
  const averageRating = React.useMemo(() => {
    if (reviewsList.length === 0) return 0;
    const sum = reviewsList.reduce((acc, r) => acc + (r.rating || 0), 0);
    return parseFloat((sum / reviewsList.length).toFixed(1));
  }, [reviewsList]);

  // Interactive carousel states and refs
  const carouselRef = React.useRef<HTMLDivElement>(null);
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const [isLightboxOpen, setIsLightboxOpen] = React.useState(false);
  const isScrollingRef = React.useRef(false);

  // Reset state when product changes
  React.useEffect(() => {
    setSelectedImage(0);
    setSelectedColor(0);
    setIsExpanded(false);
    setQuantity(1);
    setIsLiked(initialIsLiked);
    setVisible(true);
    setIsMenuOpen(false);
    setIsLightboxOpen(false);
    setFullscreenVideo(null);
    
    // Reset carousel positions
    if (carouselRef.current) {
      carouselRef.current.scrollLeft = 0;
    }
    
    // Scroll to top
    if (containerRef.current) {
      containerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [product]);

  React.useEffect(() => {
    window.dispatchEvent(new CustomEvent('bazar-subpage-toggle', { detail: { isOpen: true } }));
    return () => {
      window.dispatchEvent(new CustomEvent('bazar-subpage-toggle', { detail: { isOpen: false } }));
      if (scrollTimeout.current) {
        clearTimeout(scrollTimeout.current);
      }
    };
  }, []);

  // Sync scroll offset with current indicator state
  const handleCarouselScroll = () => {
    if (!carouselRef.current || isScrollingRef.current) return;
    const width = carouselRef.current.clientWidth;
    if (width > 0) {
      const scrollLeft = carouselRef.current.scrollLeft;
      const index = Math.round(scrollLeft / width);
      if (index >= 0 && index < thumbnails.length && index !== selectedImage) {
        setSelectedImage(index);
      }
    }
  };

  // Click handler to update state and scroll smoothly
  const scrollToIndex = (idx: number) => {
    setSelectedImage(idx);
    if (carouselRef.current) {
      isScrollingRef.current = true;
      const width = carouselRef.current.clientWidth;
      carouselRef.current.scrollTo({
        left: idx * width,
        behavior: 'smooth'
      });
      setTimeout(() => {
        isScrollingRef.current = false;
      }, 500);
    }
  };

  const handlePrevImage = () => {
    if (selectedImage > 0) {
      scrollToIndex(selectedImage - 1);
    }
  };

  const handleNextImage = () => {
    if (selectedImage < thumbnails.length - 1) {
      scrollToIndex(selectedImage + 1);
    }
  };

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const currentScrollY = e.currentTarget.scrollTop;

    if (scrollTimeout.current) {
      clearTimeout(scrollTimeout.current);
    }

    if (currentScrollY <= 10) {
      setVisible(true);
    } else {
      setVisible(false);
    }

    scrollTimeout.current = setTimeout(() => {
      setVisible(true);
    }, 300);

    // Dispatch a custom event so the main Layout can also hide/show its headers and footers when scrolling in product detail
    window.dispatchEvent(new CustomEvent('app-scroll', { 
      detail: { scrollTop: currentScrollY } 
    }));
  };

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: product.name,
          text: `Check out this ${product.name} on Bazar Next!`,
          url: window.location.href,
        });
      } else {
        await navigator.clipboard.writeText(window.location.href);
        alert('Link copied to clipboard!');
      }
    } catch (err) {
      console.error('Error sharing:', err);
    }
  };

  const handleWishlist = () => {
    setIsLiked(!isLiked);
    onWishlistToggle?.(product);
  };

  const colors = [
    { name: 'Ebony', class: 'bg-[#131b2e]' },
    { name: 'Emerald', class: 'bg-[#006948]' },
    { name: 'Sage', class: 'bg-[#bccac0]' },
    { name: 'Cream', class: 'bg-[#f5f5dc]' }
  ];

  // Dynamic Specs generation based on category, name, or custom fields
  const specs = React.useMemo(() => {
    // If the product object already has its own custom specs list, use that
    if ((product as any).customSpecs && Array.isArray((product as any).customSpecs)) {
      return (product as any).customSpecs;
    }

    const cat = (product.category || '').toLowerCase();
    const name = (product.name || '').toLowerCase();

    if (cat === 'watch' || name.includes('timepiece') || name.includes('chrono') || name.includes('watch')) {
      if (name.includes('smart') || name.includes('health')) {
        return [
          { label: 'Display', value: 'AMOLED' },
          { label: 'Battery', value: '7 Days' },
          { label: 'Sensors', value: 'SpO2, HR' },
          { label: 'Style', value: 'Sports' },
          { label: 'Waterproof', value: 'IP68' },
          { label: 'Bluetooth', value: '5.2' }
        ];
      }
      return [
        { label: 'Case Size', value: '40mm' },
        { label: 'Strap', value: name.includes('leather') || name.includes('chrono') ? 'Genuine Leather' : 'Stainless Metal' },
        { label: 'Style', value: 'Luxury Minimalist' },
        { label: 'Water Resist', value: '30m - 50m' },
        { label: 'Movement', value: 'Japanese Quartz' },
        { label: 'Warranty', value: '1 Year' }
      ];
    }

    if (cat === 'shoes' || name.includes('run') || name.includes('runner') || name.includes('shoe')) {
      return [
        { label: 'Material', value: name.includes('carbon') ? 'Carbon Fiber / Mesh' : 'Premium Polyester mesh' },
        { label: 'Sole Type', value: 'High-grip Vulcanized Rubber' },
        { label: 'Weight', value: name.includes('carbon') ? '190g (Ultralight)' : '280g' },
        { label: 'Fit Profile', value: 'Perfect True-to-size' },
        { label: 'Cushioning', value: 'Responsive bounce' },
        { label: 'Best For', value: name.includes('speed') ? 'Marathon / Racing' : 'Daily Road Running' }
      ];
    }

    if (cat === 'audio' || name.includes('headphones') || name.includes('audio') || name.includes('sound')) {
      return [
        { label: 'Battery Playtime', value: '40h ANC active' },
        { label: 'Bluetooth', value: 'BT 5.3' },
        { label: 'ANC Noise Cancellation', value: 'Smart hybrid Active' },
        { label: 'Charging Speed', value: 'Type-C Quick/Fast' },
        { label: 'Sound Driver', value: '40mm Neodymium dynamic' },
        { label: 'Comfort Fit', value: 'Memory foam ear cup cushions' }
      ];
    }

    // Default general product specs
    return [
      { label: 'Model', value: 'Premium Edition' },
      { label: 'Category', value: product.category || 'General' },
      { label: 'Quality', value: 'Certified authentic' },
      { label: 'Condition', value: '100% Brand New' },
      { label: 'Seller Rating', value: 'Excellent 4.9★' },
      { label: 'In Stock', value: 'Available' }
    ];
  }, [product]);

  const productStory = React.useMemo(() => {
    // If the product already has its own custom description, use that
    if ((product as any).description && (product as any).description.trim() !== '') {
      return (product as any).description;
    }

    const name = product.name;
    const cat = (product.category || '').toLowerCase();

    if (cat === 'watch' || name.toLowerCase().includes('timepiece') || name.toLowerCase().includes('chrono') || name.toLowerCase().includes('watch')) {
      return `Elevate your styling signature with the ${name}. A true masterpiece of modern horology, this timepiece marries sleek minimalist geometry with a robust, high-accuracy quartz movement. Whether paired with executive wear or casual weekend styling, its classic design profile is universally captivating. Meticulously designed for individuals seeking subtle luxury and undeniable reliability, it is water-resistant and built with durable glass and choice strap elements to accompany you in every proud second.`;
    }

    if (cat === 'shoes' || name.toLowerCase().includes('run') || name.toLowerCase().includes('runner')) {
      return `Hit your high-speed strides comfortably inside the ${name}. Engineered to reduce muscle impact and fatigue, these lightweight athletic shoes feature our responsive bounce foam sole coupled with open-knit mesh ventilation for dry, cool feet. Reinforced grip outsoles ensure stable turns on tracks or wet pavement, keeping you safe on the move. Step into supreme ergonomic comfort tailored specifically for serious fitness aficionados.`;
    }

    if (cat === 'audio' || name.toLowerCase().includes('headphones') || name.toLowerCase().includes('audio')) {
      return `Immerse yourself completely within rich acoustic soundfields with the ${name}. Created for auditory purists, these premium headphones combine proprietary sound drivers with intelligent hybrid noise suppression mechanics. Transition easily from chaotic commutes to deep study zones without losing a beat. Built using incredibly comfortable memory-mesh cups and light titanium headbands, enjoying your favorite playlists, albums, and voice calls becomes a luxurious, endless experience.`;
    }

    return `The exceptional ${name} offers outstanding craftsmanship and ultimate utility. Sourced from choice premium quality components and certified for long-term endurance, this seller-approved product is perfect for everyday use. Its sleek aesthetic profile fits into any contemporary lifestyle seamlessly. A brilliant investment designed with the modern user in mind, providing quality you can count on.`;
  }, [product]);

  const collection = React.useMemo(() => {
    if (!allProducts.length) return [];
    
    // Prioritize same category, then the rest
    const sameCategory = allProducts.filter(p => p.category === product.category && p.name !== product.name);
    const otherProducts = allProducts.filter(p => p.category !== product.category && p.name !== product.name);
    
    return [...sameCategory, ...otherProducts];
  }, [allProducts, product]);

  const mediaItems = React.useMemo<MediaItem[]>(() => {
    const customImages = Array.isArray(product.images) ? product.images.filter(Boolean) : [];
    const primaryImage = product.image ? [product.image] : [];
    
    // Combine primary image and any additional images uploaded from Firebase without duplicates
    const imgList = Array.from(new Set([...primaryImage, ...customImages])).filter(Boolean);

    const finalItems: MediaItem[] = imgList.map((img) => ({
      type: 'image',
      url: img,
      thumbnail: img
    }));

    // Only include videos if explicitly uploaded/saved on the product in Firebase
    if (Array.isArray(product.videos) && product.videos.length > 0) {
      product.videos.forEach((vid: any) => {
        if (vid && vid.url) {
          finalItems.push({
            type: 'video',
            url: vid.url,
            thumbnail: vid.thumbnail || product.image || '',
            isYoutube: Boolean(vid.isYoutube || vid.url.includes('youtube.com') || vid.url.includes('youtu.be'))
          });
        }
      });
    }

    return finalItems;
  }, [product]);

  const thumbnails = mediaItems.map(m => m.thumbnail);

  // Play/pause videos as they appear in scroll/view focus active slide
  React.useEffect(() => {
    // Play raw MP4 video if active
    const videoElements = document.querySelectorAll('.product-carousel-video');
    videoElements.forEach((vid) => {
      const el = vid as HTMLVideoElement;
      const idx = parseInt(el.getAttribute('data-idx') || '-1', 10);
      if (idx === selectedImage) {
        el.play().catch(e => console.log('Autoplay blocked:', e));
      } else {
        el.pause();
      }
    });

    // Play/Pause YouTube triggers via postMessage command
    const iframeElements = document.querySelectorAll('.product-carousel-youtube');
    iframeElements.forEach((ifr) => {
      const el = ifr as HTMLIFrameElement;
      const idx = parseInt(el.getAttribute('data-idx') || '-1', 10);
      try {
        if (idx === selectedImage) {
          el.contentWindow?.postMessage(JSON.stringify({ event: 'command', func: 'playVideo' }), '*');
        } else {
          el.contentWindow?.postMessage(JSON.stringify({ event: 'command', func: 'pauseVideo' }), '*');
        }
      } catch (err) {
        console.error('YT postMessage error:', err);
      }
    });
  }, [selectedImage, product, mediaItems]);

  const handleAddToCart = () => {
    setIsAdding(true);
    incrementProductSales(product.name, quantity);
    setTimeout(() => {
      setIsAdding(false);
      setIsAdded(true);
      onAddToCart?.(quantity);
      setTimeout(() => setIsAdded(false), 2000);
    }, 800);
  };

  const handleBuyNow = () => {
    incrementProductSales(product.name, quantity);
    onBuyNow?.(quantity);
  };

  return (
    <div 
      ref={containerRef}
      onScroll={handleScroll}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{
        transform: swipeOffset > 0 ? `translateX(${swipeOffset}px)` : undefined,
        transition: swipeOffset === 0 ? 'transform 0.28s cubic-bezier(0.16, 1, 0.3, 1)' : undefined,
      }}
      className="fixed inset-0 z-[100] bg-background flex flex-col animate-in slide-in-from-right duration-500 overflow-y-auto scrollbar-hide select-none"
    >
      {/* TopAppBar */}
      <header className={`fixed top-0 w-full max-w-2xl z-50 bg-surface/70 backdrop-blur-xl border-b border-white/20 shadow-sm shadow-primary/5 flex items-center justify-between px-5 h-16 transition-all duration-300 transform ${visible ? 'translate-y-0 opacity-100' : '-translate-y-24 opacity-0 pointer-events-none'}`}>
        <div className="flex items-center gap-4">
          <button 
            onClick={onBack}
            className="active:scale-95 transition-transform text-primary"
          >
            <Icons.ArrowLeft size={24} />
          </button>
          <h1 className="text-xl font-bold text-primary tracking-tight">Bazar Next</h1>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={handleShare}
            className="active:scale-95 transition-transform text-primary"
          >
            <Icons.Share2 size={24} />
          </button>
          <button 
            onClick={handleWishlist}
            className={`active:scale-95 transition-transform ${isLiked ? 'text-error' : 'text-primary'}`}
          >
            <Icons.Heart size={24} fill={isLiked ? "currentColor" : "none"} />
          </button>
          <button 
            onClick={onBuyNow}
            className="active:scale-95 transition-transform text-primary"
          >
            <Icons.ShoppingCart size={24} />
          </button>
        </div>
      </header>

      <main className="pt-16 pb-32">
        {/* Hero Gallery Section with scrolling support and actions on top */}
        <section className="p-4 space-y-3">
          <div className="glass-card rounded-2xl overflow-hidden shadow-lg shadow-black/5 relative group aspect-square select-none max-w-sm sm:max-w-md mx-auto">
            
            {/* 3-dot and share option overlay */}
            <div className="absolute top-4 right-4 z-20 flex items-center gap-2">
              {/* Share Icon in Image */}
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  handleShare();
                }}
                className="w-10 h-10 rounded-full bg-black/45 backdrop-blur-md text-white border border-white/10 hover:bg-black/60 active:scale-95 transition-all flex items-center justify-center cursor-pointer shadow-lg"
                title="Share product"
              >
                <Icons.Share2 size={18} />
              </button>

              {/* 3-dot Menu Icon in Image */}
              <div className="relative">
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsMenuOpen(!isMenuOpen);
                  }}
                  className="w-10 h-10 rounded-full bg-black/45 backdrop-blur-md text-white border border-white/10 hover:bg-black/60 active:scale-95 transition-all flex items-center justify-center cursor-pointer shadow-lg"
                  title="More Options"
                >
                  <Icons.More size={18} />
                </button>

                {/* 3-dot Dropdown Menu */}
                <AnimatePresence>
                  {isMenuOpen && (
                    <>
                      {/* Invisible click closer */}
                      <div 
                        className="fixed inset-0 z-30" 
                        onClick={() => setIsMenuOpen(false)} 
                      />
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.95, y: -10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -10 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 mt-2 w-48 rounded-2xl bg-zinc-900/95 border border-white/10 shadow-xl py-2 z-40 text-left backdrop-blur-md"
                      >
                        <button 
                          onClick={async (e) => {
                            e.stopPropagation();
                            setIsMenuOpen(false);
                            
                            const shareableUrl = `${window.location.origin}${window.location.pathname}?product=${encodeURIComponent(product.name)}`;
                            try {
                              await navigator.clipboard.writeText(shareableUrl);
                            } catch (err) {
                              const el = document.createElement('textarea');
                              el.value = shareableUrl;
                              document.body.appendChild(el);
                              el.select();
                              document.execCommand('copy');
                              document.body.removeChild(el);
                            }
                            
                            triggerToast(`✓ "${product.name}" link copied to clipboard successfully!`);
                          }}
                          className="w-full px-4 py-2.5 text-xs text-outline hover:text-white hover:bg-white/5 transition-colors flex items-center gap-2 cursor-pointer"
                        >
                          <Icons.Save size={14} className="rotate-180 text-primary" /> Copy Product Link
                        </button>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setIsMenuOpen(false);
                            setIsLiked(!isLiked);
                            onWishlistToggle?.(product);
                          }}
                          className="w-full px-4 py-2.5 text-xs text-outline hover:text-white hover:bg-white/5 transition-colors flex items-center gap-2 cursor-pointer"
                        >
                          <Icons.Heart size={14} className={isLiked ? "text-error fill-error animate-pulse" : "text-primary"} /> {isLiked ? 'Remove from Wishlist' : 'Add to Wishlist'}
                        </button>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setIsMenuOpen(false);
                            setIsLightboxOpen(true);
                          }}
                          className="w-full px-4 py-2.5 text-xs text-outline hover:text-white hover:bg-white/5 transition-colors flex items-center gap-2 cursor-pointer"
                        >
                          <Icons.Camera size={14} className="text-secondary" /> Highlight Fullscreen
                        </button>
                        <div className="border-t border-white/10 my-1" />
                        <div className="px-4 py-1.5 text-[9px] uppercase tracking-wider font-bold text-outline opacity-40">
                          BZR Genuine Ref
                        </div>
                        <div className="px-4 pb-1 text-[9px] font-mono text-outline opacity-60">
                          BZR-3918-XN
                        </div>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Left/Right scroll buttons for desktop helpers */}
            <div className="absolute left-3 top-1/2 -translate-y-1/2 z-20 opacity-0 group-hover:opacity-100 transition-opacity hidden md:flex">
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  handlePrevImage();
                }}
                disabled={selectedImage === 0}
                className="w-8 h-8 rounded-full bg-black/45 backdrop-blur-md text-white hover:bg-black/60 flex items-center justify-center cursor-pointer disabled:opacity-20 active:scale-90 transition-transform border border-white/5"
              >
                <Icons.ArrowLeft size={16} />
              </button>
            </div>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 z-20 opacity-0 group-hover:opacity-100 transition-opacity hidden md:flex">
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  handleNextImage();
                }}
                disabled={selectedImage === thumbnails.length - 1}
                className="w-8 h-8 rounded-full bg-black/45 backdrop-blur-md text-white hover:bg-black/60 flex items-center justify-center cursor-pointer disabled:opacity-20 active:scale-90 transition-transform border border-white/5"
              >
                <Icons.ArrowRight size={16} />
              </button>
            </div>

            {/* Indicator dots inside the frame with glass effect */}
            {thumbnails.length > 1 && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex gap-1.5 bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 shadow-lg">
                {thumbnails.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={(e) => {
                      e.stopPropagation();
                      scrollToIndex(idx);
                    }}
                    className={`w-2 h-2 rounded-full transition-all duration-300 ${idx === selectedImage ? 'bg-primary w-4' : 'bg-white/40'}`}
                  />
                ))}
              </div>
            )}

            {/* SWIPEABLE/SCROLLABLE HORIZONTAL PORT */}
            <div 
              ref={carouselRef}
              onScroll={handleCarouselScroll}
              className="flex overflow-x-auto snap-x snap-mandatory scrollbar-hide no-scrollbar w-full h-full"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {mediaItems.map((item, idx) => (
                <div 
                  key={idx} 
                  className={`min-w-full h-full snap-center shrink-0 flex items-center justify-center bg-black relative ${item.type === 'image' ? 'cursor-zoom-in' : ''}`}
                  onClick={() => {
                    if (item.type === 'image') {
                      setIsLightboxOpen(true);
                    }
                  }}
                >
                  {item.type === 'image' ? (
                    <div className="w-full h-full flex items-center justify-center bg-black overflow-hidden relative">
                      <img 
                        src={item.url} 
                        alt={`${product.name} item ${idx + 1}`} 
                        className="w-full h-full object-cover select-none pointer-events-none" 
                        draggable={false}
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  ) : item.isYoutube ? (
                    <div className="w-full h-full relative" onClick={(e) => e.stopPropagation()}>
                      <iframe
                        data-idx={idx}
                        className="product-carousel-youtube w-full h-full pointer-events-auto"
                        src={item.url}
                        title="Product Video Promo"
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                      {/* Interactive overlay play click indicator to go fullscreen */}
                      <button 
                        onClick={() => setFullscreenVideo(item)}
                        className="absolute bottom-4 right-4 bg-primary px-3 py-1.5 rounded-xl uppercase text-[9px] font-black tracking-widest text-white shadow-xl flex items-center gap-1 scale-90 hover:scale-100 transition-transform cursor-pointer"
                      >
                        <Icons.Play size={10} strokeWidth={3} /> Fullscreen
                      </button>
                    </div>
                  ) : (
                    <div className="w-full h-full relative" onClick={(e) => e.stopPropagation()}>
                      <video
                        data-idx={idx}
                        className="product-carousel-video w-full h-full object-cover pointer-events-auto"
                        src={item.url}
                        muted
                        loop
                        playsInline
                      />
                      {/* Click overlay play button to go full size */}
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none bg-black/10">
                        <button 
                          onClick={() => setFullscreenVideo(item)}
                          className="w-14 h-14 rounded-full bg-primary/95 text-white flex items-center justify-center shadow-2xl hover:scale-110 active:scale-95 transition-all cursor-pointer pointer-events-auto"
                          title="View Fullscreen Player"
                        >
                          <Icons.Play size={24} className="ml-1" fill="currentColor" />
                        </button>
                      </div>
                      <span className="absolute bottom-3 left-3 bg-black/60 backdrop-blur px-2.5 py-1 text-[8px] font-black uppercase text-outline rounded-lg tracking-wider">
                        Auto-playing Demo
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Gallery thumbnails below product image with hidden scrollbar */}
          <div 
            className="flex gap-3 overflow-x-auto pb-1 scrollbar-hide no-scrollbar snap-x max-w-sm sm:max-w-md mx-auto"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {mediaItems.map((item, i) => (
              <div 
                key={i} 
                onClick={() => scrollToIndex(i)}
                className={`min-w-[70px] h-16 rounded-xl overflow-hidden border-2 transition-all cursor-pointer snap-start shrink-0 relative ${i === selectedImage ? 'border-primary scale-105 shadow-md shadow-primary/10' : 'border-transparent opacity-60 hover:opacity-100'}`}
              >
                <img src={item.thumbnail} alt={`thumb-${i}`} className="w-full h-full object-cover select-none pointer-events-none" referrerPolicy="no-referrer" />
                {item.type === 'video' && (
                  <div className="absolute inset-0 bg-black/45 flex items-center justify-center text-white">
                    <Icons.Play size={14} fill="currentColor" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Product Details Section */}
        <section className="px-5 space-y-6">
          <div className="space-y-4">
            <div className="flex justify-between items-start">
              <h2 className="text-2xl font-black text-on-surface leading-tight tracking-tight">{t(product.name, product.name)}</h2>
              <div className="bg-primary text-white px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest shadow-lg shadow-primary/20">
                {t(product.tag || 'TOP RATED', product.tag || 'TOP RATED')}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="px-5 py-3 rounded-2xl bg-gradient-to-br from-primary to-primary-container text-white shadow-xl shadow-primary/10 flex flex-col items-center">
                <span className="text-[10px] font-bold opacity-60 uppercase tracking-widest leading-none mb-1">Price</span>
                <span className="text-2xl font-black tabular-nums tracking-tighter leading-none">{formatPrice(product.price, (product as any).customPrices)}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-outline opacity-40 uppercase tracking-widest">Original</span>
                <span className="text-base text-outline line-through opacity-40 font-bold tabular-nums">
                  {formatPrice(product.originalPrice || product.price * 1.8, (product as any).customPrices ? Object.fromEntries(Object.entries((product as any).customPrices).map(([k, v]) => [k, (v as number) * 1.8])) : undefined)}
                </span>
              </div>
              <div className="ml-auto flex flex-col items-end gap-1.5">
                <motion.div 
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ duration: 3, repeat: Infinity, repeatDelay: 2 }}
                  className="px-3.5 py-1.5 rounded-xl bg-secondary text-white shadow-md shadow-secondary/15 flex flex-col items-center select-none"
                >
                  <span className="text-[8px] font-black uppercase tracking-tighter leading-none mb-0.5">Save</span>
                  <span className="text-sm font-black leading-none">45%</span>
                </motion.div>

                {/* Reviews Interactive Glass Trigger */}
                <motion.button 
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  animate={{ scale: [1, 1.03, 1] }}
                  transition={{ duration: 2.5, repeat: Infinity, repeatDelay: 1 }}
                  onClick={() => setShowReviewsPage(true)}
                  className="px-3 py-1 rounded-xl glass-card bg-primary/10 hover:bg-primary/20 border border-primary/25 shadow-md flex flex-col items-center cursor-pointer text-primary transition-colors select-none"
                >
                  <span className="text-[7px] font-black uppercase tracking-tighter leading-none opacity-80">Check</span>
                  <span className="text-[9px] font-black leading-none flex items-center gap-1">
                    Reviews <Icons.Star size={9} className="fill-current text-primary animate-pulse" />
                  </span>
                </motion.button>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <div className="flex text-primary">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Icons.Star 
                    key={s} 
                    size={12} 
                    fill={s <= Math.round(averageRating) ? "currentColor" : "none"} 
                    className={s <= Math.round(averageRating) ? "text-primary fill-current" : "text-outline/40"}
                  />
                ))}
              </div>
              <span className="text-on-surface-variant text-[9px] font-black opacity-40 uppercase tracking-widest flex items-center gap-1.5">
                <span>({reviewsList.length} reviews)</span>
                <span>•</span>
                <span className="text-primary font-black tracking-wider bg-primary/10 px-2 py-0.5 rounded-full">{salesCount} SOLD</span>
              </span>
            </div>
          </div>

          {/* Variants Selection */}
          <div className="space-y-3">
            <h3 className="text-on-surface text-[10px] font-black uppercase tracking-widest opacity-40">Color Option</h3>
            <div className="flex gap-2">
              {colors.map((color, i) => (
                <button 
                  key={i}
                  onClick={() => setSelectedColor(i)}
                  className={`w-5 h-5 rounded-full border p-0.5 transition-all duration-300 active:scale-90 ${selectedColor === i ? 'border-primary ring-2 ring-primary/10' : 'border-white/20'}`}
                >
                  <div className={`w-full h-full rounded-full shadow-inner ${color.class}`} />
                </button>
              ))}
            </div>
          </div>

          {/* New Optimized Specs Format */}
          <div className="space-y-3">
            <h3 className="text-on-surface text-[10px] font-black uppercase tracking-widest opacity-40">{t('Premium Specs', 'Premium Specs')}</h3>
            <div className="grid grid-cols-2 gap-2">
              {specs.map((spec, i) => (
                <div key={i} className="glass-card px-3 py-2 rounded-xl flex justify-between items-center bg-white/40 group hover:bg-primary/5 transition-colors">
                  <span className="text-[10px] font-bold text-outline uppercase opacity-60 group-hover:opacity-100 group-hover:text-primary">{t(spec.label, spec.label)}</span>
                  <span className="text-[10px] font-black text-primary">{t(spec.value, spec.value)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Product Description with Learn More */}
          <div className="space-y-3">
            <h3 className="text-on-surface text-lg font-black tracking-tight">{t('STORY', 'STORY')}</h3>
            <div className="relative">
              <p className={`text-on-surface-variant text-sm leading-relaxed opacity-70 font-medium ${!isExpanded ? 'line-clamp-4' : ''}`}>
                {t(productStory, productStory)}
              </p>
              <button 
                onClick={() => setIsExpanded(!isExpanded)}
                className="text-primary text-[10px] font-black uppercase tracking-widest mt-3 hover:opacity-70 transition-all border-b-2 border-primary/10 flex items-center gap-1"
              >
                {isExpanded ? (
                  <>{t('Show Less', 'Show Less')} <Icons.ArrowUp size={10} /></>
                ) : (
                  <>{t('Show More', 'Learn More')} <Icons.ArrowDown size={10} /></>
                )}
              </button>
            </div>
          </div>



          {/* Collection Section */}
          <div className="space-y-4">
            <h3 className="text-on-surface text-lg font-black tracking-tight uppercase">{t('Collection', 'Collection')}</h3>
            <div className="grid grid-cols-2 gap-3 pb-8">
              {collection.map((p, i) => (
                <div 
                  key={i} 
                  onClick={() => onProductClick?.(p)}
                  className="glass-card rounded-2xl p-2 emerald-glow group cursor-pointer active:scale-95 transition-all"
                >
                  <div className="relative overflow-hidden rounded-xl mb-2 aspect-square bg-black">
                    <img src={p.image} className="w-full h-full object-cover select-none pointer-events-none" referrerPolicy="no-referrer" />
                  </div>
                  <p className="text-[10px] font-black text-on-surface mb-0.5 truncate px-1 uppercase tracking-tight opacity-70">{t(p.name, p.name)}</p>
                  <p className="text-xs font-black text-primary px-1 tabular-nums">{formatPrice(p.price)}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* Sticky Bottom Action Bar */}
      <footer className={`fixed bottom-0 w-full max-w-2xl z-[101] glass-card p-4 flex gap-4 items-center border-t border-white/20 transition-all duration-300 transform ${visible ? 'translate-y-0 opacity-100' : 'translate-y-24 opacity-0 pointer-events-none'}`}>
        <button 
          onClick={onChat}
          className="w-14 h-14 rounded-xl border border-primary/20 flex items-center justify-center text-primary active:scale-95 transition-transform"
        >
          <Icons.MessageCircle size={28} />
        </button>
        <button 
          onClick={handleAddToCart}
          disabled={isAdding || isAdded}
          className={`flex-1 h-14 rounded-xl border-2 border-primary font-bold text-xs uppercase tracking-wider active:scale-95 transition-all ${isAdded ? 'bg-primary text-white' : 'text-primary'}`}
        >
          {isAdding ? t('loading', 'Loading...') : isAdded ? t('added', 'Added ✓') : t('add_to_cart', 'Add to Cart')}
        </button>
        <button 
          onClick={handleBuyNow}
          className="flex-[1.5] h-14 rounded-xl bg-gradient-to-br from-[#00855d] to-[#006948] text-white font-bold text-xs uppercase tracking-wider active:scale-95 transition-transform shadow-lg shadow-primary/20"
        >
          {t('buy_now', 'Buy Now')}
        </button>
      </footer>

      {/* CUSTOM FULLSCREEN VIDEO PLAYER */}
      <AnimatePresence>
        {fullscreenVideo && (
          <FullscreenVideoPlayer 
            videoItem={fullscreenVideo} 
            onClose={() => setFullscreenVideo(null)} 
          />
        )}
      </AnimatePresence>

      {/* FULLSCREEN LIGHTBOX HIGHLIGHT MODAL */}
      <AnimatePresence>
        {isLightboxOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-black/95 backdrop-blur-xl flex flex-col items-center justify-between p-4"
          >
            {/* Header section of lightbox */}
            <div className="w-full flex items-center justify-between text-white max-w-2xl px-2 h-14 shrink-0">
              <span className="text-xs font-mono tracking-widest text-outline uppercase font-bold">
                {selectedImage + 1} / {thumbnails.length} Full View
              </span>
              <button 
                onClick={() => setIsLightboxOpen(false)}
                className="w-10 h-10 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20 active:scale-95 transition-all cursor-pointer border border-white/5"
              >
                <Icons.X size={18} />
              </button>
            </div>

            {/* Main Interactive image frame */}
            <div className="w-full max-w-xl aspect-square relative flex items-center justify-center select-none overflow-hidden rounded-3xl border border-white/10 bg-zinc-950/40">
              <motion.img 
                key={selectedImage}
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                transition={{ duration: 0.2 }}
                src={thumbnails[selectedImage]} 
                alt={`${product.name} full view`} 
                className="w-full h-full object-contain max-h-[75vh]"
                referrerPolicy="no-referrer"
              />

              {/* Prev icon arrow */}
              {selectedImage > 0 && (
                <button 
                  onClick={() => {
                    const nextIdx = selectedImage - 1;
                    setSelectedImage(nextIdx);
                    if (carouselRef.current) {
                      carouselRef.current.scrollLeft = nextIdx * carouselRef.current.clientWidth;
                    }
                  }}
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-black/60 text-white border border-white/10 flex items-center justify-center cursor-pointer active:scale-90 transition-transform"
                >
                  <Icons.ArrowLeft size={20} />
                </button>
              )}

              {/* Next icon arrow */}
              {selectedImage < thumbnails.length - 1 && (
                <button 
                  onClick={() => {
                    const nextIdx = selectedImage + 1;
                    setSelectedImage(nextIdx);
                    if (carouselRef.current) {
                      carouselRef.current.scrollLeft = nextIdx * carouselRef.current.clientWidth;
                    }
                  }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-black/60 text-white border border-white/10 flex items-center justify-center cursor-pointer active:scale-90 transition-transform"
                >
                  <Icons.ArrowRight size={20} />
                </button>
              )}
            </div>

            {/* Bottom thumbnail selector & close feedback */}
            <div className="w-full max-w-2xl px-2 py-4 flex flex-col items-center gap-3 shrink-0">
              <p className="text-white font-black text-center text-sm truncate max-w-md uppercase tracking-tight">
                {product.name}
              </p>
              
              <div className="flex gap-2 overflow-x-auto max-w-full pb-1 scrollbar-hide snap-x">
                {thumbnails.map((thumb, idx) => (
                  <button 
                    key={idx}
                    onClick={() => {
                      setSelectedImage(idx);
                      if (carouselRef.current) {
                        carouselRef.current.scrollLeft = idx * carouselRef.current.clientWidth;
                      }
                    }}
                    className={`w-12 h-12 rounded-lg overflow-hidden border-2 transition-all shrink-0 snap-center ${idx === selectedImage ? 'border-primary scale-110' : 'border-transparent opacity-40'}`}
                  >
                    <img src={thumb} alt={`lightbox-mini-${idx}`} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* REVIEWS & COMMENTS NEW PAGE/VIEW OVERLAY */}
      <AnimatePresence>
        {showReviewsPage && (
          <motion.div 
            initial={{ opacity: 0, x: '100%' }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: '100%' }}
            transition={{ type: 'spring', damping: 26, stiffness: 190 }}
            className="fixed inset-0 z-[150] bg-background flex flex-col overflow-hidden"
          >
            {/* Header top bar */}
            <header className="sticky top-0 w-full z-10 bg-surface/80 backdrop-blur-xl border-b border-white/20 shadow-sm shadow-primary/5 flex items-center justify-between px-5 h-16 shrink-0">
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => setShowReviewsPage(false)}
                  className="w-10 h-10 rounded-xl hover:bg-primary/5 flex items-center justify-center active:scale-95 transition-all text-primary"
                >
                  <Icons.ArrowLeft size={22} strokeWidth={2.5} />
                </button>
                <div className="text-left">
                  <h1 className="text-sm font-black text-on-surface uppercase tracking-wider leading-none">Reviews & Comments</h1>
                  <p className="text-[10px] text-outline opacity-60 font-bold uppercase mt-1 leading-none truncate max-w-[150px] sm:max-w-xs">{product.name}</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-secondary font-bold bg-secondary/10 px-3 py-1.5 rounded-full">
                <Icons.Star size={13} fill="currentColor" />
                <span>{averageRating} ({reviewsList.length})</span>
              </div>
            </header>

            {/* Scrollable comments/reviews body */}
            <div className="flex-1 overflow-y-auto p-5 space-y-6 pb-28">
              
              {/* Overall statistics graph */}
              <div className="glass-card p-5 rounded-3xl bg-white/40 flex flex-col sm:flex-row gap-6 items-center justify-between">
                <div className="text-center shrink-0">
                  <p className="text-5xl font-black text-primary tracking-tighter">{averageRating}</p>
                  <div className="flex justify-center text-primary my-1">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Icons.Star 
                        key={s} 
                        size={14} 
                        fill={s <= Math.round(averageRating) ? "currentColor" : "none"} 
                        className={s <= Math.round(averageRating) ? "text-primary fill-current" : "text-outline/30"}
                      />
                    ))}
                  </div>
                  <p className="text-[10px] font-bold text-outline uppercase tracking-wider opacity-60">Based on {reviewsList.length} reviews</p>
                </div>

                {/* Progress bars indicator */}
                <div className="flex-1 w-full space-y-2">
                  {[
                    { stars: 5, pct: `${reviewsList.length > 0 ? ((reviewsList.filter(r => r.rating === 5).length / reviewsList.length) * 100).toFixed(0) : 0}%` },
                    { stars: 4, pct: `${reviewsList.length > 0 ? ((reviewsList.filter(r => r.rating === 4).length / reviewsList.length) * 100).toFixed(0) : 0}%` },
                    { stars: 3, pct: `${reviewsList.length > 0 ? ((reviewsList.filter(r => r.rating === 3).length / reviewsList.length) * 100).toFixed(0) : 0}%` },
                    { stars: 2, pct: `${reviewsList.length > 0 ? ((reviewsList.filter(r => r.rating === 2).length / reviewsList.length) * 100).toFixed(0) : 0}%` },
                    { stars: 1, pct: `${reviewsList.length > 0 ? ((reviewsList.filter(r => r.rating === 1).length / reviewsList.length) * 100).toFixed(0) : 0}%` },
                  ].map((row, idx) => (
                    <div key={idx} className="flex items-center gap-3 text-[10px] font-bold">
                      <span className="w-3 text-right text-outline">{row.stars}★</span>
                      <div className="flex-grow h-2 rounded-full bg-black/5 overflow-hidden">
                        <div className="h-full bg-primary rounded-full" style={{ width: row.pct }} />
                      </div>
                      <span className="w-8 text-right text-outline opacity-60">{row.pct}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Review List flow */}
              <div className="space-y-4">
                <AnimatePresence initial={false}>
                  {reviewsList.map((rev) => (
                    <motion.div 
                      key={rev.id}
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                      className="p-4 rounded-2xl glass-card flex flex-col gap-3 bg-white/30 hover:bg-white/40 transition-all border border-transparent hover:border-primary/5 shadow-sm text-left"
                    >
                      {/* User Profile and rating stars */}
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary-container text-primary flex items-center justify-center font-black text-xs uppercase shadow-sm">
                            {rev.name.charAt(0)}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <h4 className="text-xs font-black text-on-surface leading-none">{rev.name}</h4>
                              {rev.verified && (
                                <span className="bg-emerald-500/15 text-emerald-600 text-[8px] font-black tracking-widest px-1.5 py-0.5 rounded-full uppercase flex items-center gap-0.5">
                                  <Icons.Check size={8} strokeWidth={4} /> Verified Buyer
                                </span>
                              )}
                            </div>
                            <span className="text-[9px] font-bold text-outline opacity-40 uppercase tracking-widest leading-none mt-1 inline-block">{rev.date}</span>
                          </div>
                        </div>
                        <div className="flex text-primary">
                          {[...Array(rev.rating)].map((_, i) => (
                            <Icons.Star key={i} size={10} fill="currentColor" />
                          ))}
                        </div>
                      </div>

                      {/* Review text comment */}
                      <p className="text-xs text-on-surface-variant font-medium leading-relaxed pl-1">
                        {rev.text}
                      </p>

                      {/* Dynamic admin/merchant owner response */}
                      {rev.reply ? (
                        <div className="p-3 rounded-xl bg-primary/5 border border-primary/10 ml-1 space-y-1 relative">
                          <div className="flex items-center gap-2">
                            <Icons.MessageSquare size={12} className="text-primary" />
                            <span className="text-[9px] font-black text-primary uppercase tracking-widest">Shop Owner Response</span>
                            <span className="text-[8px] bg-primary text-white font-black px-1.5 py-0.5 rounded uppercase tracking-wider">Admin</span>
                          </div>
                          <p className="text-[11px] text-on-surface-variant leading-relaxed font-semibold italic opacity-85">
                            "{rev.reply}"
                          </p>
                        </div>
                      ) : (
                        <div className="text-[9px] font-bold text-emerald-600 italic px-1 opacity-60 flex items-center gap-1 select-none">
                          <span>● Waiting for Admin support reply...</span>
                        </div>
                      )}
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>

              {/* Form container for adding a brand new review */}
              <div className="p-5 rounded-3xl glass-card bg-neutral-100/50 space-y-4 text-left">
                <div className="space-y-1">
                  <h4 className="text-xs font-black text-on-surface uppercase tracking-widest">Have this item? Leave Feedback</h4>
                  <p className="text-[10px] text-outline opacity-60 leading-none">Share your authentic buying experience with our store</p>
                </div>

                {reviewSuccess ? (
                  <motion.div 
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-center space-y-2"
                  >
                    <p className="text-emerald-500 text-xs font-black uppercase tracking-wider animate-pulse">Review Submitted Successfully! ✓</p>
                    <p className="text-[10px] text-on-surface-variant leading-tight opacity-75">Your verified buyer comment has been published instantly on this page!</p>
                  </motion.div>
                ) : (
                  <form onSubmit={handleSubmitReview} className="space-y-3">
                    {/* Rating Selector */}
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] font-black text-outline uppercase tracking-wider">Your Rating:</span>
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((starNum) => (
                          <button
                            key={starNum}
                            type="button"
                            onClick={() => setRatingInput(starNum)}
                            className="text-primary hover:scale-110 active:scale-95 transition-transform"
                          >
                            <Icons.Star 
                              size={18} 
                              fill={starNum <= ratingInput ? "currentColor" : "none"} 
                              className={starNum <= ratingInput ? "text-primary" : "text-outline/40"}
                            />
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Name field */}
                    <div className="grid grid-cols-1 gap-1">
                      <input 
                        type="text"
                        placeholder="Your Name (e.g. Dewan Sifat)"
                        value={reviewerName}
                        onChange={(e) => setReviewerName(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl border-none bg-white text-xs font-bold text-on-surface placeholder:text-outline/40 focus:ring-2 focus:ring-primary/20"
                        required
                      />
                    </div>

                    {/* Review text field */}
                    <div className="relative">
                      <textarea 
                        placeholder="Write your honest comments or questions about this premium product..."
                        rows={3}
                        value={commentText}
                        onChange={(e) => setCommentText(e.target.value)}
                        className="w-full px-4 py-3 rounded-2xl border-none bg-white text-xs font-medium text-on-surface-variant placeholder:text-outline/40 focus:ring-2 focus:ring-primary/20 resize-none"
                        required
                      />
                    </div>

                    {/* Submit Button */}
                    <button 
                      type="submit"
                      className="w-full py-3 rounded-xl bg-primary text-white text-[10px] font-black uppercase tracking-widest shadow-lg shadow-primary/10 hover:opacity-90 active:scale-98 transition-all"
                    >
                      Post Comments & Reviews
                    </button>
                  </form>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Premium iOS style swipe back bulge indicator */}
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

      {/* Premium Toast HUD overlay */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.9 }}
            className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[250] max-w-sm w-[90%] bg-zinc-950/95 border border-primary/30 text-white rounded-2xl p-4 shadow-2xl flex items-center gap-3 backdrop-blur-xl"
          >
            <div className="w-8 h-8 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center text-primary shrink-0">
              <Icons.CheckCircle2 size={16} className="animate-pulse" />
            </div>
            <p className="text-xs font-semibold leading-relaxed">
              {toastMessage}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

interface FullscreenVideoPlayerProps {
  videoItem: MediaItem;
  onClose: () => void;
}

function FullscreenVideoPlayer({ videoItem, onClose }: FullscreenVideoPlayerProps) {
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = React.useState(true);
  const [currentTime, setCurrentTime] = React.useState(0);
  const [duration, setDuration] = React.useState(180); // Default/Clamped to 3 mins maximum

  React.useEffect(() => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.play().catch(() => {});
      } else {
        videoRef.current.pause();
      }
    }
  }, [isPlaying]);

  React.useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime);
    };

    const handleLoadedMetadata = () => {
      // Clamp video to maximum 3 minutes (180s)
      const d = Math.min(180, video.duration || 180);
      setDuration(d);
    };

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('loadedmetadata', handleLoadedMetadata);

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
    };
  }, []);

  const handleSkipForward = () => {
    if (videoRef.current) {
      const nextTime = Math.min(duration, videoRef.current.currentTime + 10);
      videoRef.current.currentTime = nextTime;
      setCurrentTime(nextTime);
    }
  };

  const handleSkipBackward = () => {
    if (videoRef.current) {
      const nextTime = Math.max(0, videoRef.current.currentTime - 10);
      videoRef.current.currentTime = nextTime;
      setCurrentTime(nextTime);
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.25 }}
      className="fixed inset-0 z-[250] bg-black/98 flex flex-col justify-between p-6 select-none font-sans"
    >
      {/* Top Header Row with Close Cross icon */}
      <div className="w-full flex items-center justify-between text-white">
        <div className="flex flex-col">
          <span className="text-[10px] font-mono tracking-widest text-outline uppercase font-bold">PREMIUM DEMO PLAYER</span>
          <span className="text-sm font-bold truncate max-w-xs">{videoItem.isYoutube ? "YouTube Video Demo" : "High Fidelity Video (Max 3m)"}</span>
        </div>
        <button 
          onClick={onClose}
          className="w-12 h-12 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20 active:scale-95 transition-all cursor-pointer border border-white/5"
          title="Exit Fullscreen"
        >
          <Icons.X size={20} />
        </button>
      </div>

      {/* Center Video Frame */}
      <div className="flex-1 w-full flex items-center justify-center my-6 relative rounded-3xl overflow-hidden bg-black max-h-[70vh]">
        {videoItem.isYoutube ? (
          <iframe
            className="w-full h-full aspect-video rounded-3xl"
            src={`${videoItem.url}&autoplay=1`}
            title="Premium YouTube Player"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        ) : (
          <video
            ref={videoRef}
            className="w-full h-full max-h-[70vh] object-contain rounded-3xl animate-fade-in"
            src={videoItem.url}
            autoPlay
            playsInline
            loop
          />
        )}
      </div>

      {/* Bottom Control Bar Panel (For direct MP4 player custom skips) */}
      <div className="w-full flex flex-col gap-4 text-white max-w-2xl mx-auto">
        {!videoItem.isYoutube ? (
          <>
            {/* Progress Bar & Durations */}
            <div className="space-y-1.5">
              <div 
                className="w-full bg-white/15 h-1.5 rounded-full overflow-hidden relative cursor-pointer" 
                onClick={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const pos = (e.clientX - rect.left) / rect.width;
                  if (videoRef.current) {
                    videoRef.current.currentTime = pos * duration;
                  }
                }}
              >
                <div 
                  className="bg-primary h-full rounded-full transition-all duration-150"
                  style={{ width: `${(currentTime / duration) * 100}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] font-mono text-outline font-bold uppercase">
                <span>{formatTime(currentTime)}</span>
                <span>Max Limit: {formatTime(duration)}</span>
              </div>
            </div>

            {/* Micro Controls Action Row */}
            <div className="flex items-center justify-center gap-8 py-2">
              <button 
                onClick={handleSkipBackward}
                className="w-14 h-14 rounded-full bg-white/5 text-white border border-white/10 flex flex-col items-center justify-center hover:bg-white/10 active:scale-95 transition-all cursor-pointer font-bold shrink-0"
                title="Skip back 10 seconds"
              >
                <Icons.RotateCcw size={18} />
                <span className="text-[8px] font-black uppercase tracking-wider mt-0.5">-10s</span>
              </button>

              <button 
                onClick={() => setIsPlaying(!isPlaying)}
                className="w-16 h-16 rounded-full bg-primary text-white flex items-center justify-center hover:brightness-110 active:scale-95 transition-all cursor-pointer shadow-lg shadow-primary/20 shrink-0"
              >
                {isPlaying ? <Icons.Pause size={28} fill="currentColor" /> : <Icons.Play size={28} className="ml-1" fill="currentColor" />}
              </button>

              <button 
                onClick={handleSkipForward}
                className="w-14 h-14 rounded-full bg-white/5 text-white border border-white/10 flex flex-col items-center justify-center hover:bg-white/10 active:scale-95 transition-all cursor-pointer font-bold shrink-0"
                title="Skip forward 10 seconds"
              >
                <Icons.RotateCw size={18} />
                <span className="text-[8px] font-black uppercase tracking-wider mt-0.5">+10s</span>
              </button>
            </div>
          </>
        ) : (
          <div className="text-center text-outline/60 text-xs font-semibold py-4 uppercase tracking-widest bg-white/5 border border-white/10 rounded-2xl">
            📺 Double/Single tap inside Youtube to skip & seek
          </div>
        )}
      </div>
    </motion.div>
  );
}

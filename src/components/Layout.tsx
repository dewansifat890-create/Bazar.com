import React from 'react';
import { Icons } from './Icons';
import { motion } from 'motion/react';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  onTabChange: (tab: string) => void;
  onSearchClick?: () => void;
  onLoginClick?: () => void;
  isLoggedIn?: boolean;
  userName?: string;
  cartBadgeCount?: number;
  chatBadgeCount?: number;
}

export default function Layout({ 
  children, 
  activeTab, 
  onTabChange, 
  onSearchClick,
  onLoginClick,
  isLoggedIn = false,
  userName,
  cartBadgeCount = 0,
  chatBadgeCount = 0
}: LayoutProps) {
  const [visible, setVisible] = React.useState(true);
  const [isSubpageOpen, setIsSubpageOpen] = React.useState(false);
  const lastScrollY = React.useRef(0);
  const scrollTimeout = React.useRef<NodeJS.Timeout | null>(null);

  React.useEffect(() => {
    const handleSubpageToggle = (e: Event) => {
      const customEvent = e as CustomEvent;
      setIsSubpageOpen(Boolean(customEvent.detail?.isOpen));
    };
    window.addEventListener('bazar-subpage-toggle', handleSubpageToggle);
    return () => {
      window.removeEventListener('bazar-subpage-toggle', handleSubpageToggle);
    };
  }, []);

  React.useEffect(() => {
    setIsSubpageOpen(false);
  }, [activeTab]);

  React.useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      if (scrollTimeout.current) {
        clearTimeout(scrollTimeout.current);
      }

      if (currentScrollY <= 10) {
        // Always show at the absolute top
        setVisible(true);
      } else {
        // Hide while scrolling in either direction
        setVisible(false);
      }

      // Show again when scrolling stops
      scrollTimeout.current = setTimeout(() => {
        setVisible(true);
      }, 300);

      lastScrollY.current = currentScrollY;
    };

    const handleCustomScroll = (e: Event) => {
      const customEvent = e as CustomEvent;
      const scrollTop = customEvent.detail?.scrollTop ?? 0;

      if (scrollTimeout.current) {
        clearTimeout(scrollTimeout.current);
      }

      if (scrollTop <= 10) {
        setVisible(true);
      } else {
        setVisible(false);
      }

      scrollTimeout.current = setTimeout(() => {
        setVisible(true);
      }, 300);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('app-scroll', handleCustomScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('app-scroll', handleCustomScroll);
      if (scrollTimeout.current) {
        clearTimeout(scrollTimeout.current);
      }
    };
  }, []);

  return (
    <div className="min-h-screen flex flex-col max-w-2xl mx-auto bg-surface relative">
      {/* Header - hidden when inside Product Detail or subpages */}
      {!isSubpageOpen && (
        <div className={`fixed top-4 w-full max-w-2xl z-50 px-5 transition-all duration-300 transform ${visible ? 'translate-y-0 opacity-100' : '-translate-y-24 opacity-0 pointer-events-none'}`}>
          <header className="glass-card h-16 rounded-2xl flex items-center justify-between px-5 shadow-lg shadow-black/5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white shadow-lg shadow-primary/20">
                <Icons.ShoppingBasket size={24} />
              </div>
              <div>
                <h1 className="text-xl font-black leading-none tracking-tighter text-primary">BAZAR.COM</h1>
                <span className="text-[10px] font-bold text-outline uppercase tracking-widest leading-none opacity-60">Global Shop</span>
              </div>
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <button 
                onClick={() => onTabChange('home')}
                className="p-2 hover:bg-primary/10 rounded-full transition-colors active:scale-95 text-primary"
                title="Home"
              >
                <Icons.HomeIcon size={22} />
              </button>
              <button 
                onClick={onSearchClick}
                className="p-2 hover:bg-primary/10 rounded-full transition-colors active:scale-95 text-primary"
                title="Search"
              >
                <Icons.Search size={22} />
              </button>
              {!isLoggedIn && (
                <button 
                  onClick={onLoginClick}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white font-extrabold text-[11px] rounded-xl shadow-md shadow-emerald-500/20 active:scale-95 transition-all cursor-pointer"
                  title="লগইন বা সাইন আপ করুন"
                >
                  <Icons.LogIn size={13} />
                  <span>লগইন</span>
                </button>
              )}
            </div>
          </header>
        </div>
      )}

      {/* Content */}
      <main className="flex-1 pt-24 pb-28 px-5">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {children}
        </motion.div>
      </main>

      {/* Bottom Nav */}
      <div className={`fixed bottom-6 w-full max-w-2xl z-50 px-5 transition-all duration-300 transform ${visible ? 'translate-y-0 opacity-100' : 'translate-y-24 opacity-0 pointer-events-none'}`}>
        <nav className="glass-card h-16 rounded-[24px] shadow-2xl flex justify-around items-center px-2 relative border border-white/20 dark:border-white/10 backdrop-blur-xl bg-surface/80">
          <NavItem 
            id="home"
            icon={<Icons.Home />} 
            label="Home" 
            active={activeTab === 'home'} 
            onClick={() => onTabChange('home')} 
          />
          <NavItem 
            id="deals"
            icon={<Icons.Flame />} 
            label="Deals" 
            active={activeTab === 'deals'} 
            onClick={() => onTabChange('deals')} 
          />
          <NavItem 
            id="chat"
            icon={<Icons.MessageSquare />} 
            label="Chat" 
            active={activeTab === 'chat'} 
            onClick={() => onTabChange('chat')} 
            badge={chatBadgeCount}
          />
          <NavItem 
            id="cart"
            icon={<Icons.ShoppingCart />} 
            label="Cart" 
            active={activeTab === 'cart'} 
            onClick={() => onTabChange('cart')} 
            badge={cartBadgeCount}
          />
          <NavItem 
            id="profile"
            icon={<Icons.User />} 
            label="Profile" 
            active={activeTab === 'profile'} 
            onClick={() => onTabChange('profile')} 
          />
        </nav>
      </div>
    </div>
  );
}

interface NavItemProps {
  id: string;
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
  badge?: number;
}

function NavItem({ icon, label, active, onClick, badge }: NavItemProps) {
  return (
    <button 
      onClick={onClick}
      className={`flex flex-col items-center justify-center transition-all relative px-3.5 py-1.5 rounded-2xl flex-1 cursor-pointer select-none group`}
    >
      {/* Liquid Crystal Glass Animated Indicator Capsule */}
      {active ? (
        <motion.div
          layoutId="active-tab-liquid-glass"
          className="absolute inset-0 m-0.5 rounded-2xl bg-gradient-to-b from-primary/18 via-white/25 to-primary/12 dark:from-primary/30 dark:via-white/15 dark:to-primary/25 border-1.5 border-primary/50 dark:border-primary/60 border-t-white dark:border-t-white/80 shadow-[0_4px_16px_rgba(0,105,72,0.22),inset_0_1.5px_3px_rgba(255,255,255,0.85)] backdrop-blur-xl overflow-hidden"
          transition={{ type: 'spring', stiffness: 420, damping: 28 }}
        >
          {/* Top liquid shine sweep */}
          <div className="absolute top-0 inset-x-0 h-[45%] bg-gradient-to-b from-white/60 via-white/15 to-transparent pointer-events-none rounded-t-2xl" />
          {/* Subtle bottom crisp highlight ring */}
          <div className="absolute inset-px rounded-[14px] border border-white/30 pointer-events-none" />
        </motion.div>
      ) : (
        <div className="absolute inset-0 m-0.5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-white/10 dark:bg-white/5 border border-white/20 backdrop-blur-sm pointer-events-none" />
      )}

      <div className="relative z-10 flex flex-col items-center">
        <motion.div
          animate={{ 
            scale: active ? 1.15 : 1,
            y: active ? -1 : 0
          }}
          transition={{ type: 'spring', stiffness: 450, damping: 25 }}
          className="relative"
        >
          {React.cloneElement(icon as React.ReactElement, { 
            size: 20, 
            strokeWidth: active ? 2.5 : 2,
            className: active 
              ? 'text-primary drop-shadow-[0_2px_8px_rgba(0,105,72,0.35)]' 
              : 'text-outline group-hover:text-primary/70 transition-colors',
            fill: active ? 'currentColor' : 'none',
            fillOpacity: active ? 0.2 : 0
          })}

          {badge !== undefined && badge > 0 && (
            <span className="absolute -top-1.5 -right-2 bg-gradient-to-r from-red-500 to-rose-600 text-white text-[9px] min-w-[15px] h-3.5 px-1 rounded-full flex items-center justify-center font-black border border-white shadow-md z-20">
              {badge}
            </span>
          )}
        </motion.div>

        <motion.span 
          animate={{ opacity: active ? 1 : 0.65, scale: active ? 1.05 : 1 }}
          className={`text-[9px] mt-0.5 font-extrabold uppercase tracking-wider transition-colors ${
            active ? 'text-primary font-black' : 'text-outline group-hover:text-primary/80'
          }`}
        >
          {label}
        </motion.span>
      </div>
    </button>
  );
}

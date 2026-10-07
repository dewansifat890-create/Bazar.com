/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import Layout from './components/Layout';
import HomeView from './components/HomeView';
import DealsView from './components/DealsView';
import ChatView from './components/ChatView';
import CartView from './components/CartView';
import ProfileView from './components/ProfileView';
import SearchView from './components/SearchView';
import AuthModal from './components/AuthModal';
import { getMergedProducts } from './utils/sellerProducts';
import { usePreferences, saveLoginState } from './utils/preferences';
import { onAuthUserChanged } from './firebase';
import { getOrGenerateUserId } from './utils/orders';

export default function App() {
  // One-time clean slate reset for profile, orders, reviews, and shipping address
  if (typeof window !== 'undefined' && !localStorage.getItem('bazar_fresh_user_reset_v3')) {
    localStorage.removeItem('bazar_user_profile_name');
    localStorage.removeItem('bazar_user_profile_avatar');
    localStorage.removeItem('bazar_saved_orders_v1');
    localStorage.removeItem('bazar_user_total_orders_v1');
    localStorage.removeItem('bazar_global_user_reviews');
    localStorage.removeItem('bazar_delivery_address');
    localStorage.removeItem('bazar_user_verification_details');
    localStorage.removeItem('bazar_wishlist');
    localStorage.removeItem('bazar_cart_items');
    localStorage.setItem('bazar_fresh_user_reset_v3', 'true');
  }

  const { authState } = usePreferences();
  const [activeTab, setActiveTab ] = useState('home');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchCameraDefault, setSearchCameraDefault] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  
  const [wishlist, setWishlist] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('bazar_wishlist');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error(e);
      return [];
    }
  });

  const [cartItems, setCartItems] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem('bazar_cart_items');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return []; // Clean empty cart for brand new site
  });

  const [chatBadgeCount, setChatBadgeCount] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('bazar_chat_badge_count');
      return saved !== null ? parseInt(saved, 10) : 0;
    } catch (e) {
      return 0;
    }
  });

  const [deliveryAddress, setDeliveryAddress] = useState<any>(() => {
    try {
      const saved = localStorage.getItem('bazar_delivery_address');
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      console.error(e);
      return null;
    }
  });

  // Listen to live Firebase Auth state changes
  useEffect(() => {
    const unsubscribe = onAuthUserChanged((user) => {
      if (user) {
        let resolvedName = user.displayName;
        if (!resolvedName && user.email) {
          const emailPrefix = user.email.split('@')[0];
          resolvedName = emailPrefix
            .replace(/[._-]+/g, ' ')
            .split(' ')
            .map((w: string) => w.charAt(0).toUpperCase() + w.slice(1))
            .join(' ');
        }
        resolvedName = resolvedName || localStorage.getItem('bazar_user_profile_name') || 'User';

        const autoUserId = getOrGenerateUserId(user.uid);
        localStorage.setItem('bazar_user_id', autoUserId);
        if (!localStorage.getItem('bazar_user_profile_name')) {
          localStorage.setItem('bazar_user_profile_name', resolvedName);
        }

        saveLoginState(
          true,
          user.email || undefined,
          undefined,
          resolvedName,
          user.photoURL || undefined,
          user.uid
        );
        window.dispatchEvent(new CustomEvent('bazar-profile-updated'));
      } else {
        saveLoginState(false);
        window.dispatchEvent(new CustomEvent('bazar-profile-updated'));
      }
    });
    return () => unsubscribe();
  }, []);

  // First visit popup prompt as requested by user
  useEffect(() => {
    try {
      const hasPrompted = sessionStorage.getItem('bazar_welcome_login_prompted');
      if (!hasPrompted && !authState.loggedIn) {
        // Open the login popup modal with cross icon and google login
        const timer = setTimeout(() => {
          setIsAuthModalOpen(true);
          sessionStorage.setItem('bazar_welcome_login_prompted', 'true');
        }, 350);
        return () => clearTimeout(timer);
      }
    } catch (e) {
      console.error(e);
    }
  }, [authState.loggedIn]);

  // Global listener to trigger auth modal from anywhere
  useEffect(() => {
    const handleTriggerAuth = () => {
      setIsAuthModalOpen(true);
    };
    window.addEventListener('bazar-open-auth-modal', handleTriggerAuth);
    return () => {
      window.removeEventListener('bazar-open-auth-modal', handleTriggerAuth);
    };
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('bazar_wishlist', JSON.stringify(wishlist));
    } catch (e) {
      console.error(e);
    }
  }, [wishlist]);

  useEffect(() => {
    try {
      localStorage.setItem('bazar_cart_items', JSON.stringify(cartItems));
    } catch (e) {
      console.error(e);
    }
  }, [cartItems]);

  useEffect(() => {
    try {
      localStorage.setItem('bazar_chat_badge_count', chatBadgeCount.toString());
    } catch (e) {
      console.error(e);
    }
  }, [chatBadgeCount]);

  useEffect(() => {
    if (activeTab === 'chat') {
      setChatBadgeCount(0);
    }
    window.scrollTo({ top: 0, behavior: 'instant' as any });
  }, [activeTab]);

  useEffect(() => {
    const handleNewReply = () => {
      if (activeTab !== 'chat') {
        setChatBadgeCount(prev => prev + 1);
      }
    };
    window.addEventListener('bazar-new-chat-reply', handleNewReply);
    return () => {
      window.removeEventListener('bazar-new-chat-reply', handleNewReply);
    };
  }, [activeTab]);

  useEffect(() => {
    if (deliveryAddress) {
      localStorage.setItem('bazar_delivery_address', JSON.stringify(deliveryAddress));
    } else {
      localStorage.removeItem('bazar_delivery_address');
    }
  }, [deliveryAddress]);

  const handleAddToCart = (product: any, quantity: number = 1) => {
    setCartItems(prev => {
      const existing = prev.find(item => item.product.name === product.name);
      if (existing) {
        return prev.map(item => item.product.name === product.name ? { ...item, quantity: item.quantity + quantity } : item);
      } else {
        return [
          ...prev,
          {
            id: `item-${Date.now()}`,
            product,
            variant: "Standard Original Edition",
            quantity: quantity,
            checked: true
          }
        ];
      }
    });
  };

  useEffect(() => {
    const handleRequestViewProduct = (e: Event) => {
      const customEvent = e as CustomEvent;
      const detail = customEvent.detail;
      if (detail) {
        setActiveTab('home');
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('open-product', { detail }));
        }, 80);
      }
    };
    window.addEventListener('bazar-request-view-product', handleRequestViewProduct);
    return () => {
      window.removeEventListener('bazar-request-view-product', handleRequestViewProduct);
    };
  }, []);

  const handleTabChange = (tab: string) => {
    if (tab === 'home' && activeTab === 'home') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      setRefreshKey(prev => prev + 1);
    } else {
      setActiveTab(tab);
      window.scrollTo(0, 0);
    }
  };

  const renderView = () => {
    switch (activeTab) {
      case 'home':
        return (
          <HomeView 
            onTabChange={handleTabChange} 
            onSearchOpen={(withCamera = false) => {
              setSearchCameraDefault(withCamera);
              setIsSearchOpen(true);
            }} 
            refreshKey={refreshKey}
            wishlist={wishlist}
            onWishlistToggle={(p) => {
              setWishlist(prev => 
                prev.includes(p.name) 
                  ? prev.filter(name => name !== p.name) 
                  : [...prev, p.name]
              );
            }}
            deliveryAddress={deliveryAddress}
            onAddressChange={setDeliveryAddress}
            onAddToCart={handleAddToCart}
          />
        );
      case 'deals':
        return <DealsView />;
      case 'chat':
        return <ChatView />;
      case 'cart':
        return (
          <CartView 
            onTabChange={handleTabChange} 
            cartItems={cartItems} 
            setCartItems={setCartItems} 
          />
        );
      case 'profile':
        return (
          <ProfileView 
            onBack={() => handleTabChange('home')}
            onTabChange={handleTabChange}
            wishlist={wishlist} 
            allProducts={getMergedProducts()}
            onWishlistToggle={(p) => {
              setWishlist(prev => 
                prev.includes(p.name) 
                  ? prev.filter(name => name !== p.name) 
                  : [...prev, p.name]
              );
            }}
            deliveryAddress={deliveryAddress}
            onAddressChange={setDeliveryAddress}
          />
        );
      default:
        return (
          <HomeView 
            onSearchOpen={(withCamera = false) => {
              setSearchCameraDefault(withCamera);
              setIsSearchOpen(true);
            }} 
          />
        );
    }
  };

  const cartBadgeCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <>
      <Layout 
        activeTab={activeTab} 
        onTabChange={handleTabChange} 
        onSearchClick={() => {
          setSearchCameraDefault(false);
          setIsSearchOpen(true);
        }}
        onLoginClick={() => setIsAuthModalOpen(true)}
        isLoggedIn={authState.loggedIn}
        userName={authState.name || authState.phoneOrEmail}
        cartBadgeCount={cartBadgeCount}
        chatBadgeCount={chatBadgeCount}
      >
        {renderView()}
        {isSearchOpen && (
          <SearchView 
            onClose={() => setIsSearchOpen(false)} 
            startWithCamera={searchCameraDefault}
          />
        )}
      </Layout>

      {/* First Visit & Global Login Popup Modal with Cross Icon & Google Sign In */}
      <AuthModal 
        isOpen={isAuthModalOpen} 
        onClose={() => setIsAuthModalOpen(false)} 
        defaultMode="signup"
      />
    </>
  );
}

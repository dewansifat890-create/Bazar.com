import React from 'react';
import { Icons } from './Icons';
import { INITIAL_PRODUCTS } from '../constants';
import { usePreferences } from '../utils/preferences';

interface CartViewProps {
  onTabChange?: (tab: string) => void;
  cartItems?: any[];
  setCartItems?: React.Dispatch<React.SetStateAction<any[]>>;
}

export default function CartView({ onTabChange, cartItems: propsCartItems, setCartItems: propsSetCartItems }: CartViewProps) {
  const { t, formatPrice, getProductActivePrice, formatActiveCurrencyValue } = usePreferences();
  const [localCartItems, setLocalCartItems] = React.useState<any[]>(() => {
    try {
      const saved = localStorage.getItem('bazar_cart_items');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const cartItems = propsCartItems !== undefined ? propsCartItems : localCartItems;
  const setCartItems = propsSetCartItems !== undefined ? propsSetCartItems : setLocalCartItems as any;

  // Sync back local cart items to localStorage if using fallback state
  React.useEffect(() => {
    if (propsCartItems === undefined) {
      try {
        localStorage.setItem('bazar_cart_items', JSON.stringify(localCartItems));
      } catch (e) {
        console.error(e);
      }
    }
  }, [localCartItems, propsCartItems]);

  const handleProductOpen = (product: any) => {
    onTabChange?.('home');
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('open-product', { detail: product }));
    }, 150);
  };

  const handleToggleCheck = (id: string) => {
    setCartItems(prev => prev.map(item => item.id === id ? { ...item, checked: !item.checked } : item));
  };

  const handleQuantityChange = (id: string, delta: number) => {
    setCartItems(prev => prev.map(item => {
      if (item.id === id) {
        const nextQty = Math.max(1, item.quantity + delta);
        return { ...item, quantity: nextQty };
      }
      return item;
    }));
  };

  const handleRemoveItem = (id: string) => {
    setCartItems(prev => prev.filter(item => item.id !== id));
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    const isChecked = e.target.checked;
    setCartItems(prev => prev.map(item => ({ ...item, checked: isChecked })));
  };

  const handleRemoveSelected = () => {
    setCartItems(prev => prev.filter(item => !item.checked));
  };

  const allChecked = cartItems.length > 0 && cartItems.every(item => item.checked);
  const selectedCount = cartItems.filter(item => item.checked).reduce((acc, item) => acc + item.quantity, 0);

  // Math totals directly in active currency
  const subtotal = cartItems
    .filter(item => item.checked)
    .reduce((acc, item) => acc + (getProductActivePrice(item.product.price, item.product.customPrices) * item.quantity), 0);
  
  const discountThreshold = getProductActivePrice(150);
  const discount = subtotal > discountThreshold ? getProductActivePrice(20) : 0;
  const total = Math.max(0, subtotal - discount);

  return (
    <div className="space-y-6 pt-4 pb-40">
      {/* Selection Header */}
      {cartItems.length > 0 ? (
        <section className="flex items-center justify-between py-2">
          <div className="flex items-center gap-3">
            <input 
              type="checkbox" 
              checked={allChecked}
              onChange={handleSelectAll}
              className="w-5 h-5 rounded border-outline text-primary focus:ring-primary cursor-pointer bg-white/5" 
            />
            <span className="text-sm font-bold">{t('select_all', 'Select All')} ({cartItems.length} styles)</span>
          </div>
          {cartItems.some(item => item.checked) && (
            <button 
              onClick={handleRemoveSelected}
              className="text-error text-xs font-bold hover:brightness-115 active:scale-95 transition-all cursor-pointer"
            >
              {t('remove_selected', 'Remove Selected')}
            </button>
          )}
        </section>
      ) : null}

      {/* Cart Items */}
      <div className="space-y-4">
        {cartItems.length > 0 ? (
          cartItems.map((item) => (
            <CartItem 
              key={item.id}
              item={item}
              onProductClick={handleProductOpen}
              onToggleCheck={() => handleToggleCheck(item.id)}
              onQuantityChange={(delta: number) => handleQuantityChange(item.id, delta)}
              onRemove={() => handleRemoveItem(item.id)}
            />
          ))
        ) : (
          <div className="text-center py-12 space-y-4 glass-card rounded-3xl p-8 border border-white/5">
            <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto text-outline">
              <Icons.ShoppingCart size={28} />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-bold text-white uppercase tracking-wider">{t('cart_empty_title', 'Your cart is empty')}</p>
              <p className="text-[11px] text-outline max-w-xs mx-auto leading-normal">
                Check our curated top-selling list or head back to home to add item products to your checklist.
              </p>
            </div>
            <button 
              onClick={() => onTabChange?.('home')}
              className="bg-primary text-white text-xs font-black uppercase tracking-wider px-6 py-2.5 rounded-xl hover:brightness-110 active:scale-95 transition-all cursor-pointer"
            >
              {t('shop_best_sellers', 'Shop Best Sellers')}
            </button>
          </div>
        )}
      </div>

      {/* Summary Floating */}
      {cartItems.some(item => item.checked) && (
        <div className="fixed bottom-20 left-0 right-0 max-w-2xl mx-auto px-5 z-40">
          <div className="glass-card p-5 rounded-3xl shadow-[0_-4px_30px_rgba(5,150,105,0.1)] space-y-4 emerald-glow border-primary/10">
            <div className="space-y-2 pb-3 border-b border-outline-variant/20">
              <div className="flex justify-between text-xs font-semibold text-on-surface-variant">
                <span>{t('subtotal', 'Subtotal')} ({selectedCount} item{selectedCount > 1 ? 's' : ''})</span>
                <span>{formatActiveCurrencyValue(subtotal)}</span>
              </div>
              <div className="flex justify-between text-xs font-semibold text-on-surface-variant">
                <span>{t('shipping', 'Shipping')}</span>
                <span className="text-secondary font-black">{t('free', 'FREE')}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-xs font-semibold text-on-surface-variant">
                  <span>{t('special_vip_discount', 'Special VIP Discount')}</span>
                  <span className="text-error">-{formatActiveCurrencyValue(discount)}</span>
                </div>
              )}
            </div>
            <div className="flex justify-between items-center bg-transparent">
              <div>
                <p className="text-[10px] font-bold text-outline uppercase tracking-wider">{t('total_amount', 'Total Amount')}</p>
                <p className="text-2xl font-black text-primary">{formatActiveCurrencyValue(total)}</p>
              </div>
              <button 
                onClick={() => {
                  // Direct checkout of selected items
                  const firstSelected = cartItems.find(item => item.checked);
                  if (firstSelected) {
                    handleProductOpen(firstSelected.product);
                  }
                }}
                className="bg-primary text-white hover:opacity-90 active:scale-95 transition-all px-8 py-3 rounded-2xl font-bold shadow-lg shadow-primary/20 hover:brightness-110 cursor-pointer"
              >
                {t('checkout_now_btn', 'Checkout Now')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function CartItem({ item, onProductClick, onToggleCheck, onQuantityChange, onRemove }: any) {
  const { product, variant, quantity, checked } = item;
  const { t, formatPrice } = usePreferences();

  return (
    <article className="glass-card p-4 rounded-2xl flex gap-4 items-start shadow-sm border-white/20 select-none">
      {/* Checkbox trigger */}
      <div className="mt-1 font-sans flex items-center justify-center">
        <input 
          type="checkbox" 
          checked={checked} 
          onChange={onToggleCheck}
          onClick={(e) => e.stopPropagation()}
          className="w-5 h-5 rounded border-outline text-primary focus:ring-primary cursor-pointer bg-white/5" 
        />
      </div>

      {/* Main product clickable body */}
      <div 
        onClick={() => onProductClick(product)}
        className="flex-grow flex gap-4 items-start cursor-pointer min-w-0 group"
      >
        <div className="relative w-24 h-24 rounded-xl overflow-hidden flex-shrink-0 bg-black">
          <img src={product.image} alt={t(product.name, product.name)} className="w-full h-full object-cover pointer-events-none" referrerPolicy="no-referrer" />
        </div>
        <div className="flex-grow min-w-0 flex flex-col justify-between h-24">
          <div>
            <h3 className="text-xs font-bold line-clamp-2 group-hover:text-primary transition-colors">{t(product.name, product.name)}</h3>
            <p className="text-on-surface-variant text-[10px] font-medium mt-1">{t(variant, variant)}</p>
          </div>
          <div className="flex justify-between items-center" onClick={(e) => e.stopPropagation()}>
            <span className="font-black text-primary text-lg">{formatPrice(product.price, product.customPrices)}</span>
            <div className="flex items-center bg-surface-container-low rounded-full px-1 py-1 border border-outline-variant/30">
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  onQuantityChange(-1);
                }}
                className="p-1 hover:bg-primary/10 rounded-full transition-colors active:scale-90 cursor-pointer"
              >
                <Icons.Minus size={14} className="text-primary" strokeWidth={3} />
              </button>
              <span className="px-3 text-xs font-bold">{quantity}</span>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  onQuantityChange(1);
                }}
                className="p-1 hover:bg-primary/10 rounded-full transition-colors active:scale-90 cursor-pointer"
              >
                <Icons.Plus size={14} className="text-primary" strokeWidth={3} />
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Individual item remove button */}
      <button 
        onClick={(e) => {
          e.stopPropagation();
          onRemove();
        }}
        className="p-1 hover:bg-error/15 text-outline hover:text-error rounded-full transition-all active:scale-90 cursor-pointer"
        title="Remove item"
      >
        <Icons.X size={16} />
      </button>
    </article>
  );
}

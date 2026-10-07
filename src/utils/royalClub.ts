/**
 * Bazar Royal Club Campaign & Spin Utility
 * Handles persistent states, dynamic product adjustments, and audio synthesis.
 */

export interface HeroBannerItem {
  id: string;
  image: string;
  tag: string;
  title: string;
  subtitle: string;
  active: boolean;
  linkCategory?: string;
}

export interface RoyalClubAdminSettings {
  offerName: string;             // Custom Offer / Campaign Name
  campaignActive: boolean;       // Is the spin game active/shown on website?
  possibleDiscounts: number[];   // Spin slice percentage values. (e.g., [3, 4, 3, 4, 2, 5, 0, 10])
  frequentOutcome: number;       // Most frequent outcome for normal users (e.g. 3 or 4)
  bigWinDiscount: number;        // Big spin win percentage (e.g. 10%)
  bigWinChancePercent: number;   // Chance of getting big win (e.g. 2%)
  offerDurationHours: number;    // How long the user gets the won discount. (Default: 24)
  zeroCooldownHours: number;     // How long before a user who spun 0% can spin again. (Default: 12)
  cooldownHours: number;         // Standard reset interval for other spin values. (Default: 24)
  exclusionLimit: number;        // Products with this discount % or higher won't get added spin discount. (Default: 45)
  userOverrides: Record<string, number>; // Specific user ID/phone overrides e.g. { "01712345678": 15 }
  heroBanners: HeroBannerItem[]; // Dynamic Hero Carousel Banners managed from Admin
}

export interface RoyalClubUserState {
  activeDiscount: number;      // Current active discount % won by user.
  offerExpiresAt: number;      // Timestamp when active discount expires.
  lastSpinTime: number;        // Timestamp of the last spin.
  gotZeroLastTime: boolean;    // Whether they spun 0% on their last turn.
  spinHistory: number[];       // History of spun values.
}

export const DEFAULT_HERO_BANNERS: HeroBannerItem[] = [];

// Default settings
export const DEFAULT_ADMIN_SETTINGS: RoyalClubAdminSettings = {
  offerName: "👑 Bazar Royal Club",
  campaignActive: false, // Turned off by default as requested
  possibleDiscounts: [3, 4, 3, 4, 2, 5, 0, 10],
  frequentOutcome: 3,
  bigWinDiscount: 10,
  bigWinChancePercent: 2,
  exclusionLimit: 45,
  offerDurationHours: 24,
  zeroCooldownHours: 12,
  cooldownHours: 24,
  userOverrides: {},
  heroBanners: DEFAULT_HERO_BANNERS
};

// GET ADMIN SETTINGS
export function getRoyalClubAdminSettings(): RoyalClubAdminSettings {
  try {
    const saved = localStorage.getItem('bazar_royal_club_admin_settings');
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        ...DEFAULT_ADMIN_SETTINGS,
        ...parsed,
        offerName: parsed.offerName || DEFAULT_ADMIN_SETTINGS.offerName,
        possibleDiscounts: Array.isArray(parsed.possibleDiscounts) && parsed.possibleDiscounts.length > 0 
          ? parsed.possibleDiscounts 
          : DEFAULT_ADMIN_SETTINGS.possibleDiscounts,
        userOverrides: parsed.userOverrides || {},
        heroBanners: Array.isArray(parsed.heroBanners)
          ? parsed.heroBanners
          : DEFAULT_HERO_BANNERS
      };
    }
  } catch (e) {
    console.error('Error parsing admin settings:', e);
  }
  return DEFAULT_ADMIN_SETTINGS;
}

// SAVE ADMIN SETTINGS
export function saveRoyalClubAdminSettings(settings: RoyalClubAdminSettings) {
  try {
    localStorage.setItem('bazar_royal_club_admin_settings', JSON.stringify(settings));
    window.dispatchEvent(new Event('bazar-royal-club-admin-updated'));
    window.dispatchEvent(new Event('bazar-preferences-changed')); // re-sync prices
    window.dispatchEvent(new Event('bazar-products-updated'));
  } catch (e) {
    console.error('Error saving admin settings:', e);
  }
}

// GET USER STATE
export function getRoyalClubUserState(userId: string): RoyalClubUserState {
  const defaultState: RoyalClubUserState = {
    activeDiscount: 0,
    offerExpiresAt: 0,
    lastSpinTime: 0,
    gotZeroLastTime: false,
    spinHistory: []
  };

  try {
    const saved = localStorage.getItem(`bazar_royal_club_user_state_${userId}`);
    if (saved) {
      const parsed = JSON.parse(saved);
      // Check if discount is expired in real time
      if (parsed.offerExpiresAt && Date.now() > parsed.offerExpiresAt) {
        parsed.activeDiscount = 0;
        parsed.offerExpiresAt = 0;
        localStorage.setItem(`bazar_royal_club_user_state_${userId}`, JSON.stringify(parsed));
      }
      return { ...defaultState, ...parsed };
    }
  } catch (e) {
    console.error('Error parsing user state:', e);
  }
  return defaultState;
}

// SAVE USER STATE
export function saveRoyalClubUserState(userId: string, state: RoyalClubUserState) {
  try {
    localStorage.setItem(`bazar_royal_club_user_state_${userId}`, JSON.stringify(state));
    window.dispatchEvent(new Event('bazar-royal-club-user-updated'));
    window.dispatchEvent(new Event('bazar-preferences-changed'));
    window.dispatchEvent(new Event('bazar-products-updated'));
  } catch (e) {
    console.error('Error saving user state:', e);
  }
}

// CALCULATE SPIN OUTCOME FOR USER
export function calculateSpinOutcome(userId: string): { value: number; isBigWin: boolean; isOverride: boolean } {
  const adminSettings = getRoyalClubAdminSettings();

  // 1. Check Admin User Overrides for this specific user
  if (adminSettings.userOverrides) {
    const cleanUser = (userId || '').trim().toLowerCase();
    for (const [key, val] of Object.entries(adminSettings.userOverrides)) {
      if (key.trim().toLowerCase() === cleanUser || (cleanUser.length > 5 && cleanUser.endsWith(key.trim()))) {
        return { value: Number(val), isBigWin: Number(val) >= 8, isOverride: true };
      }
    }
  }

  // 2. Check for Big Win probability
  const roll = Math.random() * 100;
  if (roll < (adminSettings.bigWinChancePercent || 2)) {
    return { value: adminSettings.bigWinDiscount || 10, isBigWin: true, isOverride: false };
  }

  // 3. Normal users get 3-4% (or configured frequent outcome)
  const frequentOptions = [adminSettings.frequentOutcome || 3, 4, 3, 4];
  const chosen = frequentOptions[Math.floor(Math.random() * frequentOptions.length)];
  return { value: chosen, isBigWin: false, isOverride: false };
}

// GET ADJUSTED PRODUCT DATA BASED ON USER SPIN DISCOUNT
export function getAdjustedProduct(product: any, activeDiscount: number, exclusionLimit: number = 45) {
  if (!product) return null;
  if (!activeDiscount || activeDiscount <= 0) {
    return product;
  }

  // Calculate default discount % on the product
  let defaultDiscount = 0;
  if (product.originalPrice && product.originalPrice > product.price) {
    defaultDiscount = Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100);
  }

  // STRICT EXCLUSION RULE: "kinto 45% er oporer product golote aei offar % add hobe na"
  if (defaultDiscount > exclusionLimit) {
    return product;
  }

  // COMBINE DISCOUNTS: Previous discount % + user's spin discount %
  const combinedDisc = defaultDiscount + activeDiscount;

  // Baseline original pricing
  const origPrice = product.originalPrice || Math.round(product.price * 1.8);
  const adjustedPrice = Math.max(0, parseFloat((origPrice * (1 - combinedDisc / 100)).toFixed(2)));

  // Adjust custom prices configurations per country
  let adjustedCustom: Record<string, number> | undefined = undefined;
  if (product.customPrices) {
    adjustedCustom = {};
    for (const [countryCode, val] of Object.entries(product.customPrices)) {
      if (typeof val === 'number') {
        const defaultFactor = (1 - defaultDiscount / 100) || 1;
        const baseVal = val / defaultFactor;
        const newVal = baseVal * (1 - combinedDisc / 100);
        adjustedCustom[countryCode] = Math.max(0, parseFloat(newVal.toFixed(2)));
      }
    }
  }

  return {
    ...product,
    price: adjustedPrice,
    originalPrice: origPrice,
    defaultDiscount,
    combinedDiscount: combinedDisc,
    hasSpinDiscountApplied: true
  };
}

// PROCEDURAL AUDIO SYNTHESIZER FOR WHEEL ROTATION & WINNING EVENTS
class RoyalClubAudioEngine {
  private ctx: AudioContext | null = null;

  private initCtx() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  // Play a click sound during spin ticks
  playTick() {
    try {
      this.initCtx();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(800, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(100, this.ctx.currentTime + 0.04);
      
      gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.04);
      
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.05);
    } catch (e) {
      // Ignore audio errors (browser policies, etc)
    }
  }

  // Play a beautiful success fanfare melody
  playSuccessFanfare() {
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      
      // Fanfare notes (C4, E4, G4, C5)
      const notes = [261.63, 329.63, 392.00, 523.25];
      const durations = [0.12, 0.12, 0.12, 0.5];
      
      notes.forEach((freq, idx) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const startTime = now + idx * 0.15;
        const dur = durations[idx];
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, startTime);
        
        gain.gain.setValueAtTime(0.12, startTime);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + dur);
        
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(startTime);
        osc.stop(startTime + dur);
      });
    } catch (e) {
      // Ignore audio errors
    }
  }

  // Play a calm, slightly disappointed downcast chime melody for landing on 0%
  playDisappointedChime() {
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      
      // Downwards chime (G3, E3, C3)
      const notes = [196.00, 164.81, 130.81];
      const durations = [0.15, 0.15, 0.4];
      
      notes.forEach((freq, idx) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const startTime = now + idx * 0.18;
        const dur = durations[idx];
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, startTime);
        
        gain.gain.setValueAtTime(0.1, startTime);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + dur);
        
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(startTime);
        osc.stop(startTime + dur);
      });
    } catch (e) {
      // Ignore audio errors
    }
  }
}

export const royalClubAudio = new RoyalClubAudioEngine();

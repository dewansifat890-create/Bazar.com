// Language and Country preferences utility for BAZAR
// Persists user preferences and provides live translation & currency formatting.

export interface CountryConfig {
  code: string;
  name: string;
  flag: string;
  currency: string;
  symbol: string;
  rate: number; // Conversion rate from USD
}

export const COUNTRIES: CountryConfig[] = [
  { code: 'BD', name: 'Bangladesh', flag: '🇧🇩', currency: 'BDT', symbol: '৳', rate: 122 },
  { code: 'US', name: 'United States', flag: '🇺🇸', currency: 'USD', symbol: '$', rate: 1 },
  { code: 'IN', name: 'India', flag: '🇮🇳', currency: 'INR', symbol: '₹', rate: 83.5 },
  { code: 'SA', name: 'Saudi Arabia', flag: '🇸🇦', currency: 'SAR', symbol: '﷼', rate: 3.75 },
  { code: 'GB', name: 'United Kingdom', flag: '🇬🇧', currency: 'GBP', symbol: '£', rate: 0.78 }
];

export interface LanguageConfig {
  code: string;
  name: string;
  localName: string;
  flag: string;
}

export const LANGUAGES: LanguageConfig[] = [
  { code: 'bn', name: 'Bangla', localName: 'বাংলা', flag: '🇧🇩' },
  { code: 'en', name: 'English', localName: 'English', flag: '🇺🇸' },
  { code: 'hi', name: 'Hindi', localName: 'हिन्दी', flag: '🇮🇳' },
  { code: 'ta', name: 'Tamil', localName: 'தமிழ்', flag: '🇮🇳' },
  { code: 'ar', name: 'Arabic', localName: 'العربية', flag: '🇸🇦' }
];

// Rich Translation Dictionary
// Supports Bangla, English, Hindi, Tamil and Arabic
const TRANSLATIONS: Record<string, Record<string, string>> = {
  bn: {
    'all_products': 'সকল পণ্য',
    'search_placeholder': 'বাজার প্রিমিয়ামে খুঁজুন...',
    'my_wishlist': 'আমার উইশলিস্ট',
    'seller_center': 'সেলার সেন্টার',
    'loyalty_rewards': 'লয়্যালটি পুরস্কার',
    'categories': 'ক্যাটাগরি',
    'add_to_cart': 'কার্টে যোগ করুন',
    'buy_now': 'এখনই কিনুন',
    'logout': 'লগ আউট',
    'login': 'লগইন',
    'country': 'দেশ',
    'language': 'ভাষা',
    'checkout': 'চেকআউট',
    'my_orders': 'আমার অর্ডার',
    'shipping_address': 'শিপিং ঠিকানা',
    'help_center': 'হেল্প সেন্টার',
    'account_settings': 'অ্যাকাউন্ট সেটিংস',
    'bazar_trusted': 'বাজার • বিশ্বস্ত কেনাকাটা',
    'to_pay': 'পেমেন্ট বাকি',
    'to_ship': 'শিপিং হবে',
    'to_receive': 'প্রাপ্তি বাকি',
    'to_review': 'রিভিউ বাকি',
    'followed_stores': 'অনুসরণকৃত স্টোর',
    'points': 'লয়্যালটি পয়েন্ট',
    'unlocked_vouchers': 'আনলকড ভাউচার',
    'welcome_back': 'ফিরে আসার জন্য ধন্যবাদ!',
    'phone_email': 'ফোন নম্বর বা ইমেল',
    'password': 'পাসওয়ার্ড',
    'select_country_login': 'লগইনের জন্য দেশ নির্বাচন করুন',
    'enter_credentials': 'আপনার সঠিক তথ্য দিন',
    'signin_secure': 'সুরক্ষিত সাইন ইন করুন',
    'shop_enthusiast': 'শপ ক্রিয়েটর / এনথুজিয়াস্ট',
    'verified': 'যাচাইকৃত',
    'reviews_comments': 'রিভিউ এবং মন্তব্য',
    'verified_buyer': 'যাচাইকৃত ক্রেতা',
    'owner_response': 'দোকান মালিকের প্রতিক্রিয়া',
    'leave_feedback': 'ফিডব্যাক বা মতামত দিন',
    'write_honest_review': 'আপনার সৎ পর্যালোচনা বা মন্তব্য লিখুন...',
    'post_review': 'রিভিউ পোস্ট করুন',
    'hot_deals': 'আজকের সেরা ডিলস',
    'chat': 'চ্যাট সাপোর্ট',
    'home': 'হোম',
    'deals': 'ডিলস',
    'cart': 'কার্ট',
    'profile': 'প্রোফাইল',
    'back': 'ফিরে যান',
    'total': 'মোট',
    'promo_code': 'প্রোমো কোড',
    'apply': 'প্রয়োগ করুন',
    'place_order': 'অর্ডার সম্পন্ন করুন',
    'language_currency': 'ভাষা এবং কারেন্সি',
    'search_btn': 'খুঁজুন',
    'view_all': 'সব দেখুন',
    'electronics': 'ইলেকট্রনিক্স',
    'fashion': 'ফ্যাশন',
    'home_tab': 'হোম ডেকর',
    'beauty': 'রূপচর্চা',
    'phone': 'ফোন',
    'laptop': 'ল্যাপটপ',
    'camera': 'ক্যামেরা',
    'accessories': 'এক্সেসরিজ',
    'trending_now': 'জনপ্রিয় পণ্য',
    'show_more_languages': 'অন্যান্য ভাষা দেখুন',
    'hide_more': 'অন্যান্য ভাষা লুকান',
    'wishlist_empty': 'আপনার উইশলিস্ট খালি আছে',
    'move_to_cart': 'কার্টে নিয়ে যান',
    
    // Categories and Tags
    'Watch': 'হাতঘড়ি',
    'Shoes': 'জুতো এবং স্নিকার্স',
    'Audio': 'হেডফোন ও অডিও স্পিকার',
    'HOT': 'হট ডিল',
    'NEW': 'নতুন পণ্য',
    'SALE': 'মহাশূন্য মূল্যছাড়',
    '-20%': '২০% ছাড়',
    '35% OFF': '৩৫% ছাড়',
    '55% OFF': '৫৫% ছাড়',

    // Product specification labels
    'Case Size': 'ডায়াল কেস সাইজ',
    'Strap': 'বেল্ট বা স্ট্র্যাপ',
    'Style': 'স্টাইলিশ লুক',
    'Water Resist': 'জল প্রতিরোধ ক্ষমতা (ওয়াটার প্রুফ)',
    'Movement': 'সুইচ বা মুভমেন্ট',
    'Warranty': 'গ্যারান্টি এবং ওয়ারেন্টি',
    'Material': 'মূল উপাদান',
    'Sole Type': 'সোলের ধরণ',
    'Weight': 'নেট ওজন',
    'Fit Profile': 'ফিটিং সাইজ',
    'Cushioning': 'কুশনিং সফটনেস',
    'Best For': 'সেরা ব্যবহারক্ষেত্র',
    'Battery Playtime': 'ব্যাটারি লাইফটাইম',
    'Bluetooth': 'ব্লুটুথ কানেকশন',
    'ANC Noise Cancellation': 'নয়েজ ক্যান্সেলেশন',
    'Charging Speed': 'চার্জিং স্পিড',
    'Sound Driver': 'সাউন্ড বাস ড্রাইভার',
    'Comfort Fit': 'ফিটিং কমফোর্ট',
    'Model': 'মডেল সংস্করণ',
    'Quality': 'বিল্ড কোয়ালিটি',
    'Condition': 'পণ্যের অবস্থা',
    'Seller Rating': 'সেলার রেটিং',
    'In Stock': 'স্টক এভেলেবিলিটি',

    // Spec values
    '40mm': '৪০ মিলিমিটার',
    'Genuine Leather': 'খাঁটি চামড়া',
    'Stainless Metal': 'মরিচারোধী মেটাল',
    'Luxury Minimalist': 'অসাধারণ বিলাসবহুল ডিজাইন',
    '30m - 50m': '৩০ মি - ৫০ মি (ওয়াটারপ্রুফ)',
    'Japanese Quartz': 'হাই-গ্রেড জাপানি কোয়ার্টজ',
    '1 Year': '১ বছর অফিশিয়াল ওয়ারেন্টি',
    'Carbon Fiber / Mesh': 'কার্বন ফাইবার এবং মেমোরি জাল',
    'Premium Polyester mesh': 'প্রিমিয়াম স্পোর্টস পলিয়েস্টার জাল',
    'High-grip Vulcanized Rubber': 'উচ্চ গ্রিপ ভলকানাইজড গ্রেড রাবার',
    '190g (Ultralight)': '১১৯ গ্রাম (অত্যন্ত হালকা)',
    '280g': '২৮০ গ্রাম মাত্র',
    'Perfect True-to-size': 'একদম সঠিক ফিটিং স্লাইড',
    'Responsive bounce': 'স্প্রিং ব্যাক রেসপন্স',
    'Marathon / Racing': 'ম্যারাথন রান এবং রেসিং ট্র্যাক',
    'Daily Road Running': 'প্রতিদিনের হাঁটা এবং রানিং',
    '40h ANC active': '৪০ ঘণ্টা একটানা গান শোনার ব্যাকআপ',
    'BT 5.3': 'ব্লুটুথ ৫.৩ প্রিমিয়াম',
    'Smart hybrid Active': 'স্মার্ট হাইব্রিড অ্যাক্টিভ কোয়ালিটি',
    'Type-C Quick/Fast': 'টাইপ-সি সুপার ফাস্ট চার্জিং',
    '40m Neodymium dynamic': '৪০ মিমি ডাইনামিক বেস বুস্টার',
    'Memory foam ear cup cushions': 'আল্ট্রা সফট মেমোরি কুশন ফোম',
    'Premium Edition': 'স্পেশাল প্রিমিয়াম এডিশন',
    'Certified authentic': '১০০% অরিজিনাল ও ভেরিফায়েড',
    '100% Brand New': '১০০% নতুনের নিশ্চয়তা',
    'Excellent 4.9★': 'চমৎকার ৪.৯★ রেটিং',
    'Available': 'স্টকে পর্যাপ্ত আছে',

    // Extra page details and descriptions
    'STORY': 'পণ্য বিবরণী',
    'Premium Specs': 'প্রিমিয়াম স্পেসিফিকেশনস',
    'Show Less': 'সংক্ষেপে দেখুন',
    'Show More': 'বিস্তারিত দেখুন',
    'subtotal': 'মোট পণ্য মূল্য',
    'shipping': 'শিপিং চার্জ',
    'free': 'ফ্রি ডেলিভারি',
    'remove_selected': 'চিহ্নিত পণ্য বাদ দিন',
    'select_all': 'সব নির্বাচন করুন',
    'cart_empty_title': 'আপনার কার্ট এখন খালি আছে',
    'shop_best_sellers': 'সেরা বিক্রিত পণ্য কিনুন',
    'checkout_now': 'নিরাপদ চেকআউট',
    'checkout_now_btn': 'চেকআউট করুন',
    'your_cart': 'তোমার কার্ট',
    'payment_summary': 'পেমেন্ট বিবরণী',
    'delivery_to': 'ডেলিভারি ঠিকানা',
    'change': 'পরিবর্তন',
    'standard_delivery': 'স্ট্যান্ডার্ড ডেলিভারি',
    'promo_discount': 'প্রোমো ডিসকাউন্ট',
    'order_total': 'মোট পরিশোধযোগ্য মূল্য',
    'paying_with': 'পরিশোধের মাধ্যম',
    'bkash_wallet': 'বিকাশ ওয়ালেট',
    'card_payment': 'ক্রেডিট/ডেবিট কার্ড',
    'cash_on_delivery': 'ক্যাশ অন ডেলিভারি'
  },
  en: {
    'all_products': 'All Products',
    'search_placeholder': 'Search in BAZAR Premium...',
    'my_wishlist': 'My Wishlist',
    'seller_center': 'Seller Center',
    'loyalty_rewards': 'Loyalty Rewards',
    'categories': 'Categories',
    'add_to_cart': 'Add to Cart',
    'buy_now': 'Buy Now',
    'logout': 'Log Out',
    'login': 'Log In',
    'country': 'Country',
    'language': 'Language',
    'checkout': 'Checkout',
    'my_orders': 'My Orders',
    'shipping_address': 'Shipping Address',
    'help_center': 'Help Center',
    'account_settings': 'Account Settings',
    'bazar_trusted': 'Bazar • Trusted Shopping',
    'to_pay': 'To Pay',
    'to_ship': 'To Ship',
    'to_receive': 'To Receive',
    'to_review': 'To Review',
    'followed_stores': 'Followed Stores',
    'points': 'Loyalty Points',
    'unlocked_vouchers': 'Unlocked Vouchers',
    'welcome_back': 'Welcome Back!',
    'phone_email': 'Phone Number or Email',
    'password': 'Password',
    'select_country_login': 'Select Country for Login',
    'enter_credentials': 'Log in securely to start shopping',
    'signin_secure': 'Secure Sign In',
    'shop_enthusiast': 'Shop Creator / Enthusiast',
    'verified': 'Verified',
    'reviews_comments': 'Reviews & Comments',
    'verified_buyer': 'Verified Buyer',
    'owner_response': 'Merchant Response',
    'leave_feedback': 'Have this item? Leave Feedback',
    'write_honest_review': 'Write your honest comments or questions about this premium product...',
    'post_review': 'Post Comments & Reviews',
    'hot_deals': 'Hot Holiday Deals',
    'chat': 'Support Chat',
    'home': 'Home',
    'deals': 'Deals',
    'cart': 'Cart',
    'profile': 'Profile',
    'back': 'Back',
    'total': 'Total Price',
    'promo_code': 'Promo Code',
    'apply': 'Apply',
    'place_order': 'Place Secure Order',
    'language_currency': 'Language & Currency',
    'search_btn': 'Search',
    'view_all': 'View All',
    'electronics': 'Electronics',
    'fashion': 'Fashion',
    'home_tab': 'Home',
    'beauty': 'Beauty',
    'phone': 'Phones',
    'laptop': 'Laptops',
    'camera': 'Cameras',
    'accessories': 'Accessories',
    'trending_now': 'Trending Now',
    'show_more_languages': 'Show More Languages',
    'hide_more': 'Hide Other Languages',
    'wishlist_empty': 'Your wishlist is empty',
    'move_to_cart': 'Move to Cart',
    'checkout_now_btn': 'Checkout Now',
    'your_cart': 'Your Cart',
    'payment_summary': 'Payment Summary',
    'delivery_to': 'Delivery To',
    'change': 'Change',
    'standard_delivery': 'Standard Delivery',
    'promo_discount': 'Promo Discount',
    'order_total': 'Order Total',
    'paying_with': 'Paying With',
    'bkash_wallet': 'bKash Wallet',
    'card_payment': 'Credit/Debit Card',
    'cash_on_delivery': 'Cash On Delivery'
  },
  hi: {
    'all_products': 'सभी उत्पाद',
    'search_placeholder': 'बाज़ार प्रीमियम में खोजें...',
    'my_wishlist': 'मेरी इच्छा सूची',
    'seller_center': 'विक्रेता केंद्र',
    'loyalty_rewards': 'वफादारी पुरस्कार',
    'categories': 'श्रेणियाँ',
    'add_to_cart': 'कार्ट में जोड़ें',
    'buy_now': 'अभी खरीदें',
    'logout': 'लॉग आउट',
    'login': 'लॉगिन',
    'country': 'देश',
    'language': 'भाषा',
    'checkout': 'चेकआउट',
    'my_orders': 'मेरे आदेश',
    'shipping_address': 'शिपिंग पता',
    'help_center': 'सहायता केंद्र',
    'account_settings': 'अकाउंट सेटिंग्स',
    'bazar_trusted': 'बाज़ार • विश्वसनीय खरीदारी',
    'to_pay': 'भुगतान करें',
    'to_ship': 'शिप होने वाला',
    'to_receive': 'प्राप्त करने योग्य',
    'to_review': 'समीक्षा करें',
    'followed_stores': 'फॉलोड स्टोर्स',
    'points': 'लॉयल्टी अंक',
    'unlocked_vouchers': 'अनलॉक किए गए वाउचर',
    'welcome_back': 'वापसी पर स्वागत है!',
    'phone_email': 'फ़ोन नंबर या ईमेल',
    'password': 'पासवर्ड',
    'select_country_login': 'लॉगिन के लिए देश चुनें',
    'enter_credentials': 'सुरक्षित रूप से लॉगिन करें',
    'signin_secure': 'सुरक्षित लॉगिन',
    'shop_enthusiast': 'दुकान प्रेमी',
    'verified': 'सत्यापित',
    'reviews_comments': 'समीक्षाएं और टिप्पणियां',
    'verified_buyer': 'सत्यापित खरीदार',
    'owner_response': 'दुकानदार की प्रतिक्रिया',
    'leave_feedback': 'फीडबैक छोड़ें',
    'write_honest_review': 'इस उत्पाद के बारे में अपनी ईमानदार समीक्षा लिखें...',
    'post_review': 'समीक्षा पोस्ट करें',
    'hot_deals': 'आज के खास डील्स',
    'chat': 'सपोर्ट चैट',
    'home': 'होम',
    'deals': 'डील्स',
    'cart': 'कार्ट',
    'profile': 'प्रोफ़ाइल',
    'back': 'पीछे जाएं',
    'total': 'कुल कीमत',
    'promo_code': 'प्रोमो कोड',
    'apply': 'लागू करें',
    'place_order': 'ऑर्डर सबमिट करें'
  },
  ta: {
    'all_products': 'அனைத்து தயாரிப்புகள்',
    'search_placeholder': 'பஜார் பிரீமியத்தில் தேடுக...',
    'my_wishlist': 'எனது விருப்பப்பட்டியல்',
    'seller_center': 'விற்பனையாளர் மையம்',
    'loyalty_rewards': 'விசுவாச வெகுமதிகள்',
    'categories': 'வகைகள்',
    'add_to_cart': 'கார்ட்டில் சேர்',
    'buy_now': 'இப்போது வாங்கு',
    'logout': 'வெளியேறு',
    'login': 'உள்நுழை',
    'country': 'நாடு',
    'language': 'மொழி',
    'checkout': 'செக்அவுட்',
    'my_orders': 'எனது ஆர்டர்கள்',
    'shipping_address': 'ஷிப்பிங் முகவரி',
    'help_center': 'உதவி மையம்',
    'account_settings': 'கணக்கு அமைப்புகள்',
    'bazar_trusted': 'பஜார் • நம்பகமான ஷாப்பிங்',
    'to_pay': 'பணம் செலுத்த',
    'to_ship': 'ஷிப் செய்ய',
    'to_receive': 'பெற வேண்டியவை',
    'to_review': 'மதிப்பாய்வு செய்ய',
    'followed_stores': 'பின்பற்றப்பட்ட கடைகள்',
    'points': 'லாயல்டி புள்ளிகள்',
    'unlocked_vouchers': 'திறக்கப்பட்ட வவுச்சர்கள்',
    'welcome_back': 'மீண்டும் வருக!',
    'phone_email': 'தொலைபேசி எண் அல்லது மின்னஞ்சல்',
    'password': 'கடவுச்சொல்',
    'select_country_login': 'நாட்டைத் தேர்வு செய்யவும்',
    'enter_credentials': 'உள்நுழையவும்',
    'signin_secure': 'பாதுகாப்பான உள்நுழைவு',
    'shop_enthusiast': 'ஷாப்பிங் ஆர்வலர்',
    'verified': 'சரிபார்க்கப்பட்டது',
    'reviews_comments': 'கருத்துகள் மற்றும் மதிப்பாய்வுகள்',
    'verified_buyer': 'சரிபார்க்கப்பட்ட வாங்குபவர்',
    'owner_response': 'வணிகரின் பதில்',
    'leave_feedback': 'கருத்துக்களைப் பகிரவும்',
    'write_honest_review': 'உங்கள் மதிப்பாய்வை எழுதுங்கள்...',
    'post_review': 'மதிப்பாய்வைச் சேர்',
    'hot_deals': 'இன்றைய சலுகைகள்',
    'chat': 'உதவி அரட்டை',
    'home': 'முகப்பு',
    'deals': 'சலுகைகள்',
    'cart': 'கார்ட்',
    'profile': 'சுயவிவரம்',
    'back': 'திரும்புக',
    'total': 'மொத்த விலை',
    'promo_code': 'ப்ரோமோ குறியீடு',
    'apply': 'பயன்படுத்து',
    'place_order': 'ஆர்டர் உறுதி செய்'
  },
  ar: {
    'all_products': 'جميع المنتجات',
    'search_placeholder': 'ابحث في بازار بريميوم...',
    'my_wishlist': 'قائمتي المفضلة',
    'seller_center': 'مركز البائع',
    'loyalty_rewards': 'مكافآت الولاء',
    'categories': 'الفئات',
    'add_to_cart': 'أضف إلى السلة',
    'buy_now': 'اشتري الآن',
    'logout': 'تسجيل الخروج',
    'login': 'تسجيل الدخول',
    'country': 'البلد',
    'language': 'اللغة',
    'checkout': 'اتمام الطلب',
    'my_orders': 'طلباتي',
    'shipping_address': 'عنوان الشحن',
    'help_center': 'مركز المساعدة',
    'account_settings': 'إعدادات الحساب',
    'bazar_trusted': 'بازار • تسوق موثوق',
    'to_pay': 'للدفع',
    'to_ship': 'للشحن',
    'to_receive': 'الاستلام',
    'to_review': 'للتقييم',
    'followed_stores': 'المتاجر المتابعة',
    'points': 'نقاط الولاء',
    'unlocked_vouchers': 'القسائم المتاحة',
    'welcome_back': 'مرحباً بك مجدداً!',
    'phone_email': 'رقم الهاتف أو البريد الإلكتروني',
    'password': 'كلمة المرور',
    'select_country_login': 'اختر بلدك لتسجيل الدخول',
    'enter_credentials': 'سجل دخولك بأمان لبدء التسوق',
    'signin_secure': 'دخول آمن',
    'shop_enthusiast': 'محب التسوق',
    'verified': 'مؤكد',
    'reviews_comments': 'المراجعات والتعليقات',
    'verified_buyer': 'مشتري مؤكد',
    'owner_response': 'رد صاحب المتجر',
    'leave_feedback': 'هل لديك هذا المنتج؟ أضف رأيك',
    'write_honest_review': 'اكتب تعليقك أو استفسارك هنا بكل أمانة...',
    'post_review': 'نشر المراجعة والتعليق',
    'hot_deals': 'أقوى العروض الحالية',
    'chat': 'الدعم المباشر',
    'home': 'الرئيسية',
    'deals': 'العروض',
    'cart': 'السلة',
    'profile': 'الملف الشخصي',
    'back': 'رجوع',
    'total': 'السعر الإجمالي',
    'promo_code': 'رمز الترويجي',
    'apply': 'تطبيق',
    'place_order': 'اتمام الشراء الآمن'
  }
};

// Initial Preference Getters/Setters
export function getSavedLanguage(): string {
  try {
    return localStorage.getItem('bazar_pref_language') || 'en';
  } catch {
    return 'en';
  }
}

export function saveLanguage(langCode: string): void {
  try {
    localStorage.setItem('bazar_pref_language', langCode);
    window.dispatchEvent(new Event('bazar-preferences-changed'));
  } catch (e) {
    console.error(e);
  }
}

export function getSavedCountry(): string {
  try {
    return localStorage.getItem('bazar_pref_country') || 'BD'; // Defaulting to Bangladesh as requested
  } catch {
    return 'BD';
  }
}

export function saveCountry(countryCode: string): void {
  try {
    localStorage.setItem('bazar_pref_country', countryCode);
    window.dispatchEvent(new Event('bazar-preferences-changed'));
  } catch (e) {
    console.error(e);
  }
}

// Get standard user authentication session state
export interface AuthState {
  loggedIn: boolean;
  phoneOrEmail?: string;
  countryCode: string;
  name?: string;
  photoURL?: string;
  uid?: string;
}

export function getLoginState(): AuthState {
  try {
    const saved = localStorage.getItem('bazar_auth_state');
    if (saved) return JSON.parse(saved);
  } catch {}
  return { loggedIn: false, phoneOrEmail: '', countryCode: 'BD', name: '' };
}

export function saveLoginState(
  loggedIn: boolean, 
  phoneOrEmail?: string, 
  countryCode: string = 'BD',
  name?: string,
  photoURL?: string,
  uid?: string
): void {
  try {
    const state: AuthState = { loggedIn, phoneOrEmail, countryCode, name, photoURL, uid };
    localStorage.setItem('bazar_auth_state', JSON.stringify(state));
    saveCountry(countryCode); // Automatically sync preference country with logged country
    window.dispatchEvent(new Event('bazar-preferences-changed'));
  } catch (e) {
    console.error(e);
  }
}

// Translate function helper
export function t(key: string, englishFallback: string): string {
  const currentLang = getSavedLanguage();
  if (TRANSLATIONS[currentLang] && TRANSLATIONS[currentLang][key]) {
    return TRANSLATIONS[currentLang][key];
  }
  // Try English mappings
  if (TRANSLATIONS['en'] && TRANSLATIONS['en'][key]) {
    return TRANSLATIONS['en'][key];
  }
  return englishFallback;
}

// Format price with rate translation and currency symbol, supporting optional custom prices
export function formatPrice(priceUSD: number, customPrices?: Record<string, number>): string {
  const countryCode = getSavedCountry();
  const country = COUNTRIES.find(c => c.code === countryCode) || COUNTRIES[0];
  
  let converted: number;
  if (customPrices && typeof customPrices[countryCode] === 'number') {
    converted = customPrices[countryCode];
  } else {
    converted = priceUSD * country.rate;
  }
  
  if (countryCode === 'BD') {
    // Show BDT with ৳ prefix and comma formatting
    return `${country.symbol}${Math.round(converted).toLocaleString('en-US')}`;
  }
  
  if (countryCode === 'SA') {
    return `${Math.round(converted).toLocaleString('en-US')} ${country.symbol}`;
  }

  return `${country.symbol}${converted.toLocaleString('en-US', {
    minimumFractionDigits: country.rate === 1 || country.rate > 10 ? 0 : 2,
    maximumFractionDigits: country.rate === 1 || country.rate > 10 ? 0 : 2
  })}`;
}

// Get numeric product price in active local currency, supporting custom prices config
export function getProductActivePrice(priceUSD: number, customPrices?: Record<string, number>): number {
  const countryCode = getSavedCountry();
  const country = COUNTRIES.find(c => c.code === countryCode) || COUNTRIES[0];
  if (customPrices && typeof customPrices[countryCode] === 'number') {
    return customPrices[countryCode];
  }
  return priceUSD * country.rate;
}

// Format an amount that is already converted to the active local currency
export function formatActiveCurrencyValue(amount: number): string {
  const countryCode = getSavedCountry();
  const country = COUNTRIES.find(c => c.code === countryCode) || COUNTRIES[0];
  
  if (countryCode === 'BD') {
    return `${country.symbol}${Math.round(amount).toLocaleString('en-US')}`;
  }
  
  if (countryCode === 'SA') {
    return `${Math.round(amount).toLocaleString('en-US')} ${country.symbol}`;
  }

  return `${country.symbol}${amount.toLocaleString('en-US', {
    minimumFractionDigits: country.rate === 1 || country.rate > 10 ? 0 : 2,
    maximumFractionDigits: country.rate === 1 || country.rate > 10 ? 0 : 2
  })}`;
}

// Live currency rate auto-updater with daily cache to prevent redundant hits
export function syncLiveRates(): void {
  try {
    const cached = localStorage.getItem('bazar_live_rates');
    if (cached) {
      const parsed = JSON.parse(cached);
      COUNTRIES.forEach(c => {
        if (c.code !== 'US' && parsed[c.currency]) {
          c.rate = parseFloat(parsed[c.currency]);
        }
      });
    }
  } catch {}
}

export function fetchLatestRates(): void {
  try {
    const lastFetch = localStorage.getItem('bazar_rates_last_fetch');
    const now = Date.now();
    // Cache for 24 hours to keep page loads extremely fast
    if (lastFetch && now - parseInt(lastFetch) < 24 * 60 * 60 * 1000) {
      return;
    }
    
    fetch('https://open.er-api.com/v6/latest/USD')
      .then(res => {
        if (!res.ok) throw new Error('API response invalid');
        return res.json();
      })
      .then(data => {
        if (data && data.rates) {
          localStorage.setItem('bazar_live_rates', JSON.stringify(data.rates));
          localStorage.setItem('bazar_rates_last_fetch', now.toString());
          // Sync rates in-place instantly
          syncLiveRates();
          // Dispatch notification to re-render state across hook listeners
          window.dispatchEvent(new Event('bazar-preferences-changed'));
        }
      })
      .catch(err => {
        console.warn('Could not update live rates, utilizing fallbacks:', err);
      });
  } catch (e) {
    console.error('Error fetching rates:', e);
  }
}

// Perform initial sync instantly on module import
syncLiveRates();

// React custom Hook for automatic live preferences update
import { useState, useEffect } from 'react';

export function usePreferences() {
  const [lang, setLang] = useState(getSavedLanguage());
  const [country, setCountry] = useState(getSavedCountry());
  const [authState, setAuthState] = useState(getLoginState());

  useEffect(() => {
    // Sync rates in-place on hook load
    syncLiveRates();
    // Check & update live rates in the background
    fetchLatestRates();

    const handlePreferencesChanged = () => {
      syncLiveRates();
      setLang(getSavedLanguage());
      setCountry(getSavedCountry());
      setAuthState(getLoginState());
    };
    window.addEventListener('bazar-preferences-changed', handlePreferencesChanged);
    return () => {
      window.removeEventListener('bazar-preferences-changed', handlePreferencesChanged);
    };
  }, []);

  const changeLanguage = (newLang: string) => {
    saveLanguage(newLang);
  };

  const changeCountry = (newCountry: string) => {
    saveCountry(newCountry);
  };

  const handleLogin = (phoneOrEmail: string, selectedCountry: string) => {
    saveLoginState(true, phoneOrEmail, selectedCountry);
  };

  const handleLogout = () => {
    saveLoginState(false);
  };

  return {
    lang,
    country,
    authState,
    changeLanguage,
    changeCountry,
    handleLogin,
    handleLogout,
    t,
    formatPrice,
    getProductActivePrice,
    formatActiveCurrencyValue
  };
}

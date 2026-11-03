/**
 * WatsStore public storefront themes.
 * Deliberately isolated from the merchant dashboard and SaaS marketing pages.
 * 10 Art-Directed, Production-Ready Storefront Themes categorized by business type.
 */

export const STORE_THEME_IDS = [
  'editorial-luxe',
  'street-pulse',
  'pure-beauty',
  'tech-grid',
  'fresh-market',
  'living-space',
  'golden-atelier',
  'active-motion',
  'little-joy',
  'crafted-story',
  'cafe-ritual',
  'pet-haven',
  'bloom-studio',
  'auto-circuit',
  'game-arena',
  'book-gallery',
  'optical-studio',
  'outdoor-trail',
  'travel-atelier',
  'office-pro',
] as const;

export type StoreThemeId = (typeof STORE_THEME_IDS)[number];

/**
 * Legacy theme aliases for backward compatibility with existing stores in production.
 * - editorial -> editorial-luxe
 * - streetwear -> street-pulse
 * - lifestyle -> living-space
 */
export const LEGACY_THEME_ALIASES: Record<string, StoreThemeId> = {
  editorial: 'editorial-luxe',
  streetwear: 'street-pulse',
  lifestyle: 'living-space',
};

export type BusinessCategoryKey =
  | 'all'
  | 'fashion'
  | 'streetwear'
  | 'beauty'
  | 'tech'
  | 'grocery'
  | 'home'
  | 'jewelry'
  | 'sports'
  | 'kids'
  | 'handmade'
  | 'cafe'
  | 'pets'
  | 'flowers'
  | 'automotive'
  | 'gaming'
  | 'books'
  | 'optical'
  | 'outdoor'
  | 'travel'
  | 'office';

export interface ThemeCustomization {
  primaryColor?: string;
  secondaryColor?: string;
  fontPreset?: 'cairo' | 'amiri' | 'tajawal' | 'sans' | 'serif';
  buttonShape?: 'rounded' | 'pill' | 'sharp';
  gridDensity?: 'compact' | 'standard' | 'spacious';
  cardAspectRatio?: '4/5' | '1/1' | '3/4' | '16/9';
  announcementText?: string;
  showHeroBadge?: boolean;
}

export interface StoreTheme {
  id: StoreThemeId;
  name: string;
  nameAr: string;
  description: string;
  descriptionAr: string;
  primaryCategory: BusinessCategoryKey;
  categoryLabelAr: string;
  categoryLabelEn: string;
  cssClass: string;
  colorScheme: 'light' | 'dark';
  fontMood: 'editorial' | 'bold' | 'clean' | 'warm' | 'tech' | 'luxe' | 'playful';
  sampleColors: {
    bg: string;
    fg: string;
    accent: string;
    accentContrast: string;
    card: string;
    border: string;
  };
  whatsappTokenDefaults: {
    bg: string;
    text: string;
    border: string;
    hover: string;
    focus: string;
    radius: string;
  };
  recommendedFor: string[];
  recommendedForAr: string[];
  featuresAr: string[];
  featuresEn: string[];
  heroHeadlineEn: string;
  heroHeadlineAr: string;
  heroSubheadlineEn: string;
  heroSubheadlineAr: string;
}

export const STORE_THEMES: Record<StoreThemeId, StoreTheme> = {
  'editorial-luxe': {
    id: 'editorial-luxe',
    name: 'Editorial Luxe',
    nameAr: 'إيديتوريال لوكس',
    description: 'High-fashion magazine aesthetic with quiet luxury typography, asymmetric art frames, and refined spacing.',
    descriptionAr: 'تصميم مجلات الموضة الراقية، خطوط كلاسيكية فخمة، إطارات صور غير متناظرة ومساحات هادئة للماركات المميزة.',
    primaryCategory: 'fashion',
    categoryLabelAr: 'الأزياء والفخامة',
    categoryLabelEn: 'Fashion & Luxury',
    cssClass: 'ws-theme--editorial-luxe',
    colorScheme: 'light',
    fontMood: 'editorial',
    sampleColors: {
      bg: '#f7f2ea',
      fg: '#27251f',
      accent: '#352e24',
      accentContrast: '#fffaf3',
      card: '#ede5d9',
      border: '#cfc4b4',
    },
    whatsappTokenDefaults: {
      bg: 'transparent',
      text: '#27251f',
      border: '#352e24',
      hover: '#ede5d9',
      focus: '#352e24',
      radius: '0px',
    },
    recommendedFor: ['Haute Couture', 'Designer Bags', 'Niche Perfumes', 'Premium Watches'],
    recommendedForAr: ['أزياء الهوت كوتور', 'الحقائب الفاخرة', 'العطور النيش', 'الساعات الفخمة'],
    featuresAr: ['تخطيط مجلة الموضة', 'أرقام فهرسة دقيقة', 'إطارات غير متناظرة', 'خط سريف راقي'],
    featuresEn: ['Magazine Editorial Layout', 'Refined Index Numbers', 'Asymmetric Frames', 'Serif Typography'],
    heroHeadlineAr: 'تفاصيل تستحق الاقتناء.',
    heroHeadlineEn: 'The art of choosing well.',
    heroSubheadlineAr: 'مجموعة مختارة بعناية لأصحاب الذوق الرفيع.',
    heroSubheadlineEn: 'Curated essentials for those who cherish distinction.',
  },

  'street-pulse': {
    id: 'street-pulse',
    name: 'Street Pulse',
    nameAr: 'ستريت بلس',
    description: 'High-contrast dark streetwear drop layout with live drop ticker, bold geometric frames, and sold-out stamps.',
    descriptionAr: 'طابع الشارع العصري والأزياء الجريئة، شريط متحرك للإصدارات الحصرية، تباين داكن عالي وتصميم هجومي مميز.',
    primaryCategory: 'streetwear',
    categoryLabelAr: 'الملابس العصرية وسنيكرز',
    categoryLabelEn: 'Streetwear & Sneakers',
    cssClass: 'ws-theme--street-pulse',
    colorScheme: 'dark',
    fontMood: 'bold',
    sampleColors: {
      bg: '#101010',
      fg: '#f8f7f3',
      accent: '#fb5b16',
      accentContrast: '#131313',
      card: '#1e1e1e',
      border: '#3a3a3a',
    },
    whatsappTokenDefaults: {
      bg: '#fb5b16',
      text: '#101010',
      border: '#fb5b16',
      hover: '#ff7738',
      focus: '#fb5b16',
      radius: '4px',
    },
    recommendedFor: ['Streetwear', 'Limited Sneakers', 'Graphic Hoodies', 'Skate Culture'],
    recommendedForAr: ['أزياء الشارع وسنيكرز', 'الهوديز الحصرية', 'الملابس الرياضية العصرية', 'إكسسوارات الشباب'],
    featuresAr: ['شريط دروب متحرك', 'خلفية داكنة جريئة', 'شارات نفاد الكمية', 'أزرار شحن سريعة'],
    featuresEn: ['Live Drop Ticker', 'Full-Bleed Dark Hero', 'Sold-Out Badges', 'Bold High-Contrast CTAs'],
    heroHeadlineAr: 'اختياراتك. قواعدك.',
    heroHeadlineEn: 'YOUR STYLE. YOUR RULES.',
    heroSubheadlineAr: 'إصدارات حصرية لا تنتظر أحداً. اطلب قبل نفاد الكمية.',
    heroSubheadlineEn: 'Exclusive drops. Limited batches. Never compromise.',
  },

  'pure-beauty': {
    id: 'pure-beauty',
    name: 'Pure Beauty',
    nameAr: 'بيور بيوتي',
    description: 'Soft rose-tinted organic minimalism with ingredient pill badges, rounded cards, and gentle aesthetic glow.',
    descriptionAr: 'طابع مستحضرات التجميل والعناية بالبشرة، زوايا مستديرة ناعمة، خلفيات باستيلية هادئة وشارات المكونات الطبيعية.',
    primaryCategory: 'beauty',
    categoryLabelAr: 'مستحضرات التجميل والعناية',
    categoryLabelEn: 'Cosmetics & Skincare',
    cssClass: 'ws-theme--pure-beauty',
    colorScheme: 'light',
    fontMood: 'clean',
    sampleColors: {
      bg: '#fcf8f6',
      fg: '#2e2624',
      accent: '#c07a72',
      accentContrast: '#ffffff',
      card: '#f6eeeb',
      border: '#ebdcd7',
    },
    whatsappTokenDefaults: {
      bg: '#c07a72',
      text: '#ffffff',
      border: '#c07a72',
      hover: '#ab6760',
      focus: '#c07a72',
      radius: '999px',
    },
    recommendedFor: ['Skincare Routine', 'Organic Cosmetics', 'Hair Serums', 'Fragrance & Mists'],
    recommendedForAr: ['عناية بالبشرة', 'مكياج طبيعي', 'منتجات الشعر العضوية', 'عطور وزيوت عطرية'],
    featuresAr: ['شارات المكونات الطبيعية', 'زوايا ناعمة وبطاقات عائمة', 'فلاتر روتين العناية', 'ألوان باستيلية مهدئة'],
    featuresEn: ['Ingredient Badges', 'Soft Rounded Glow', 'Skincare Routine Filters', 'Calming Pastel Palette'],
    heroHeadlineAr: 'إشراقة طبيعية تبدأ من هنا.',
    heroHeadlineEn: 'Pure glow, naturally defined.',
    heroSubheadlineAr: 'تركيبات نباتية مدروسة تمنح بشرتك العناية والحماية الفائقة.',
    heroSubheadlineEn: 'Gentle, clinical-grade formulas crafted to let your natural beauty shine.',
  },

  'tech-grid': {
    id: 'tech-grid',
    name: 'Tech Grid',
    nameAr: 'تيك جريد',
    description: 'Matrix blueprint cyber dark theme with electric cyan accents, technical specification badges, and comparison cards.',
    descriptionAr: 'طابع التقنية والأجهزة الذكية، خطوط شبكية إلكترونية، شارات المواصفات الفنية والضمان وأداء فائق التباين.',
    primaryCategory: 'tech',
    categoryLabelAr: 'الإلكترونيات والتقنية',
    categoryLabelEn: 'Electronics & Tech',
    cssClass: 'ws-theme--tech-grid',
    colorScheme: 'dark',
    fontMood: 'tech',
    sampleColors: {
      bg: '#0a0e17',
      fg: '#e2e8f0',
      accent: '#00d2ff',
      accentContrast: '#05111f',
      card: '#121a29',
      border: '#1f2e45',
    },
    whatsappTokenDefaults: {
      bg: '#00d2ff',
      text: '#05111f',
      border: '#00d2ff',
      hover: '#38e1ff',
      focus: '#00d2ff',
      radius: '6px',
    },
    recommendedFor: ['Smartphones & Tablets', 'Gaming Gear', 'Audio & Headsets', 'Smart Home Gadgets'],
    recommendedForAr: ['الهواتف والأجهزة اللوحية', 'معدات الألعاب', 'السماعات والصوتيات', 'أجهزة المنزل الذكي'],
    featuresAr: ['شارات المواصفات الفنية', 'ختم الضمان المعتمد', 'شبكة تقنية عالية الكفاءة', 'تحديد المخزون الرقمي'],
    featuresEn: ['Hardware Spec Chips', 'Official Warranty Seal', 'Compact Comparison Grid', 'Digital Stock Status'],
    heroHeadlineAr: 'قوة الأداء بين يديك.',
    heroHeadlineEn: 'Engineered for Next-Gen Performance.',
    heroSubheadlineAr: 'أحدث الأجهزة والإلكترونيات الأصلية بضمان شامل وسرعة توصيل قياسية.',
    heroSubheadlineEn: 'Original certified gear, guaranteed specs, and ultra-fast fulfillment.',
  },

  'fresh-market': {
    id: 'fresh-market',
    name: 'Fresh Market',
    nameAr: 'فرش ماركت',
    description: 'High-speed grocery catalog with instant in-card +/- quantity steppers, farm-fresh green accents, and fast re-ordering.',
    descriptionAr: 'سوبرماركت وأغذية طازجة، أزرار زيادة ونقصان سريعة مباشرة على البطاقة، تصميم نضر يسرّع تسوق البقالة.',
    primaryCategory: 'grocery',
    categoryLabelAr: 'السوبرماركت والأغذية',
    categoryLabelEn: 'Grocery & Fresh Food',
    cssClass: 'ws-theme--fresh-market',
    colorScheme: 'light',
    fontMood: 'clean',
    sampleColors: {
      bg: '#f4fbf5',
      fg: '#14301d',
      accent: '#15803d',
      accentContrast: '#ffffff',
      card: '#e8f6ea',
      border: '#c5e6cb',
    },
    whatsappTokenDefaults: {
      bg: '#ea580c',
      text: '#ffffff',
      border: '#ea580c',
      hover: '#c2410c',
      focus: '#ea580c',
      radius: '10px',
    },
    recommendedFor: ['Supermarkets', 'Organic Farm Produce', 'Artisanal Bakery', 'Gourmet Pantry'],
    recommendedForAr: ['سوبرماركت وهايبرماركت', 'خضروات وفواكه طازجة', 'مخابز وحلويات', 'مستلزمات المطبخ والمؤونة'],
    featuresAr: ['عداد كمية سريع على البطاقة', 'شارة طازج يومياً', 'تصنيف سهل ومباشر', 'إجمالي عربة فوري'],
    featuresEn: ['In-Card Quantity Stepper', 'Fresh Daily Badges', 'Speed Grocery Grid', 'Live Cart Tally'],
    heroHeadlineAr: 'طازج من المزرعة إلى مائدتك.',
    heroHeadlineEn: 'Farm-Fresh Harvest Every Morning.',
    heroSubheadlineAr: 'أجود المنتجات الغذائية والخضروات العضوية ننتقيها لك بعناية فائقة يومياً.',
    heroSubheadlineEn: 'Hand-picked organic produce, daily bakery, and everyday pantry essentials.',
  },

  'living-space': {
    id: 'living-space',
    name: 'Living Space',
    nameAr: 'ليفينج سبيس',
    description: 'Warm architectural lifestyle layout with arch shapes, room context filters, dimensions chips, and cozy earth tones.',
    descriptionAr: 'الأثاث والديكور المنزلي، أقواس معمارية دافئة، تصفح حسب غرف المنزل، شارات الأبعاد والمواد الطبيعية.',
    primaryCategory: 'home',
    categoryLabelAr: 'الأثاث والديكور المنزلي',
    categoryLabelEn: 'Furniture & Home Decor',
    cssClass: 'ws-theme--living-space',
    colorScheme: 'light',
    fontMood: 'warm',
    sampleColors: {
      bg: '#f5efe5',
      fg: '#392d25',
      accent: '#835139',
      accentContrast: '#fff9f2',
      card: '#e8d9c6',
      border: '#bda994',
    },
    whatsappTokenDefaults: {
      bg: '#835139',
      text: '#fff9f2',
      border: '#835139',
      hover: '#6e402b',
      focus: '#835139',
      radius: '8px',
    },
    recommendedFor: ['Handcrafted Furniture', 'Ceramics & Vases', 'Lighting & Rugs', 'Interior Decor'],
    recommendedForAr: ['الأثاث والمفروشات', 'الخزف والفازات الفنية', 'الإضاءة والسجاد', 'إكسسوارات الديكور الداخلي'],
    featuresAr: ['أقواس معمارية مميزة', 'تصفح حسب الغرفة', 'أبعاد المنتج وخاماته', 'إحساس مريح ودافئ'],
    featuresEn: ['Architectural Arches', 'Room-by-Room Browsing', 'Material & Dimension Badges', 'Warm Earthy Palette'],
    heroHeadlineAr: 'مساحة لما تحب أن تعيش معه.',
    heroHeadlineEn: 'Objects for a life well lived.',
    heroSubheadlineAr: 'قطع أثاث وديكور تصنع من منزلك ملاذاً دافئاً ينبض بالجمال والراحة.',
    heroSubheadlineEn: 'Timeless furniture and curated accents that transform living spaces into sanctuaries.',
  },

  'golden-atelier': {
    id: 'golden-atelier',
    name: 'Golden Atelier',
    nameAr: 'جولدن أتيليه',
    description: 'Opulent dark luxury boutique with gold leaf accents, karat purity chips, certified authenticity seal, and velvet depth.',
    descriptionAr: 'المجوهرات والساعات الفاخرة، لمسات ذهبية براقة، شارات عيار الذهب ونقاء الأحجار، وختم التوثيق والضمان الأصلي.',
    primaryCategory: 'jewelry',
    categoryLabelAr: 'المجوهرات والساعات الفاخرة',
    categoryLabelEn: 'Jewelry & Watches',
    cssClass: 'ws-theme--golden-atelier',
    colorScheme: 'dark',
    fontMood: 'luxe',
    sampleColors: {
      bg: '#0d0b09',
      fg: '#f5efe6',
      accent: '#d4af37',
      accentContrast: '#120f0a',
      card: '#1a1714',
      border: '#3d3428',
    },
    whatsappTokenDefaults: {
      bg: '#d4af37',
      text: '#120f0a',
      border: '#d4af37',
      hover: '#e5c358',
      focus: '#d4af37',
      radius: '2px',
    },
    recommendedFor: ['Fine Gold Jewelry', 'Diamond Rings', 'Luxury Swiss Watches', 'Custom Bridal Sets'],
    recommendedForAr: ['المجوهرات الذهبية', 'خواتم الألماس', 'الساعات السويسرية', 'أطقم العرائس المخصصة'],
    featuresAr: ['شارة عيار الذهب والتوثيق', 'إطارات مذهبة رفيعة', 'خلفية مخملية فاخرة', 'معاينة فخمة للمجوهرات'],
    featuresEn: ['Karat Purity Badge', 'Fine Gold Filigree Border', 'Deep Velvet Background', 'Luxury Jewelry Zoom'],
    heroHeadlineAr: 'بريق يدوم لأجيال.',
    heroHeadlineEn: 'Timeless Radiance, Masterfully Crafted.',
    heroSubheadlineAr: 'قطع مجوهرات ذهبية استثنائية مصاغة بحرفية متوارثة وشهادات ضمان موثقة.',
    heroSubheadlineEn: 'Exceptional gold and gemstone masterpieces certified to sparkle through generations.',
  },

  'active-motion': {
    id: 'active-motion',
    name: 'Active Motion',
    nameAr: 'أكتيف موشن',
    description: 'Dynamic athletic performance layout with energetic red/neon accents, activity tags, and high-energy contrast.',
    descriptionAr: 'الرياضة واللياقة البدنية، خطوط مائلة حركية، ألوان حيوية مفعمة بالطاقة، وشارات الأداء ومقاومة التعرق.',
    primaryCategory: 'sports',
    categoryLabelAr: 'الرياضة واللياقة البدنية',
    categoryLabelEn: 'Sports & Fitness',
    cssClass: 'ws-theme--active-motion',
    colorScheme: 'dark',
    fontMood: 'bold',
    sampleColors: {
      bg: '#141416',
      fg: '#f4f4f6',
      accent: '#ff2d55',
      accentContrast: '#ffffff',
      card: '#202024',
      border: '#35353d',
    },
    whatsappTokenDefaults: {
      bg: '#ff2d55',
      text: '#ffffff',
      border: '#ff2d55',
      hover: '#e01b41',
      focus: '#ff2d55',
      radius: '6px',
    },
    recommendedFor: ['Gym Apparel', 'Running Shoes', 'Fitness Equipment', 'Outdoor & Adventure'],
    recommendedForAr: ['ملابس الجيم والتمارين', 'أحذية الجري الرياضية', 'أجهزة ومعدات اللياقة', 'مستلزمات التخييم والمغامرة'],
    featuresAr: ['شارات النشاط والرياضة', 'أزرار عريضة سريعة الحركة', 'تصميم حركي عالي التباين', 'فلاتر المقاسات الحركية'],
    featuresEn: ['Activity Badges', 'High-Impact Action CTAs', 'Dynamic Angled Elements', 'Sport Filter Pills'],
    heroHeadlineAr: 'تخطَّ حدود طاقتك.',
    heroHeadlineEn: 'PUSH BEYOND EVERY LIMIT.',
    heroSubheadlineAr: 'معدات وملابس رياضية صُممت بأحدث تقنيات التهوية لتمنحك أقصى درجات الثبات والإنجاز.',
    heroSubheadlineEn: 'High-performance athletic gear engineered for maximum endurance and velocity.',
  },

  'little-joy': {
    id: 'little-joy',
    name: 'Little Joy',
    nameAr: 'ليتل جوي',
    description: 'Playful kid-friendly candy aesthetic with ultra-rounded pill shapes, age group chips, and cheerful pastel energy.',
    descriptionAr: 'عالم ألعاب الأطفال ومستلزماتهم، زوايا مستديرة مرحة، شارات الفئات العمرية وأمان الطفل، وألوان طفولية مبهجة.',
    primaryCategory: 'kids',
    categoryLabelAr: 'ألعاب ومستلزمات الأطفال',
    categoryLabelEn: 'Kids & Toys',
    cssClass: 'ws-theme--little-joy',
    colorScheme: 'light',
    fontMood: 'playful',
    sampleColors: {
      bg: '#fffdf6',
      fg: '#2a2830',
      accent: '#ff6b6b',
      accentContrast: '#ffffff',
      card: '#fff3e0',
      border: '#ffd8a8',
    },
    whatsappTokenDefaults: {
      bg: '#ff6b6b',
      text: '#ffffff',
      border: '#ffd8a8',
      hover: '#fa5252',
      focus: '#ff6b6b',
      radius: '999px',
    },
    recommendedFor: ['Montessori & Wooden Toys', 'Baby Essentials', 'Kids Fashion', 'Storybooks & Crafts'],
    recommendedForAr: ['ألعاب المونتيسوري والذكاء', 'مستلزمات الرضع وحديثي الولادة', 'ملابس الأطفال المبهجة', 'قصص وأنشطة تنمية المهارات'],
    featuresAr: ['شارات الفئة العمرية', 'أزرار دائرية مريحة', 'شارة آمن 100% للأطفال', 'ألوان مبهجة وعائلية'],
    featuresEn: ['Age Group Badges', 'Ultra-Rounded Curves', '100% Child-Safe Seal', 'Cheerful Family Aesthetics'],
    heroHeadlineAr: 'عالم من المرح والابتكار لأحبائنا الصغار.',
    heroHeadlineEn: 'Big Smiles for Little Explorers.',
    heroSubheadlineAr: 'ألعاب تعليمية آمنة ومستلزمات مختارة بحب لتساعد طفلك على الاستكشاف والنمو بسعادة.',
    heroSubheadlineEn: 'Safe educational toys, cozy clothing, and joyful essentials designed for playful growing minds.',
  },

  'crafted-story': {
    id: 'crafted-story',
    name: 'Crafted Story',
    nameAr: 'كرافتد ستوري',
    description: 'Artisan notebook aesthetic with warm parchment textures, hand-stitched borders, maker quote cards, and craft tags.',
    descriptionAr: 'الحرف اليدوية والهدايا، طابع الدفتر الحرفي وورق البردي، حواف خياطة، شارة «صُنعت يدوياً بحب» واقتباس الصانع.',
    primaryCategory: 'handmade',
    categoryLabelAr: 'الحرف اليدوية والهدايا',
    categoryLabelEn: 'Handmade & Crafts',
    cssClass: 'ws-theme--crafted-story',
    colorScheme: 'light',
    fontMood: 'warm',
    sampleColors: {
      bg: '#faf6f0',
      fg: '#332a22',
      accent: '#965b32',
      accentContrast: '#fffcf7',
      card: '#f0e6d8',
      border: '#d6c4b0',
    },
    whatsappTokenDefaults: {
      bg: '#965b32',
      text: '#fffcf7',
      border: '#965b32',
      hover: '#7f4b26',
      focus: '#965b32',
      radius: '8px',
    },
    recommendedFor: ['Handmade Ceramics', 'Leathercraft Goods', 'Scented Soy Candles', 'Personalized Gift Sets'],
    recommendedForAr: ['الفخار والخزف اليدوي', 'المصنوعات الجلدية الطبيعية', 'شموع الصويا المعطرة', 'هدايا وتذكارات مخصصة بالاسم'],
    featuresAr: ['شارة «صنع يدوي بحب»', 'إطار خياطة حرفية', 'بطاقة قصة الصانع', 'إحساس أصيل بالدفء'],
    featuresEn: ['Handcrafted Maker Seal', 'Stitched Artisan Border', 'Maker Story Note', 'Warm Natural Texture'],
    heroHeadlineAr: 'قطع فريدة لها قصة تُروى.',
    heroHeadlineEn: 'Every Piece Tells a Heartfelt Story.',
    heroSubheadlineAr: 'حرف يدوية أصيلة صُممت بشغف وتفانٍ لتزين يومك أو تقدم كهدية استثنائية لمن تحب.',
    heroSubheadlineEn: 'Authentic handmade goods, slowly crafted with soul and attention to every stitch.',
  },
  'cafe-ritual': {
    id: 'cafe-ritual',
    name: 'Café Ritual',
    nameAr: 'كافيه ريتشوال',
    description: 'Warm espresso and cream aesthetic, editorial food photography, menu presentation, and compact mobile cards.',
    descriptionAr: 'طابع المقاهي والمخابز الراقية، درجات الإسبريسو والكريمة، قائمة تقديم أنيقة، وخطوط دافئة للمشروبات والمخبوزات الطازجة.',
    primaryCategory: 'cafe',
    categoryLabelAr: 'المقاهي والمخبوزات',
    categoryLabelEn: 'Cafés & Bakeries',
    cssClass: 'ws-theme--cafe-ritual',
    colorScheme: 'light',
    fontMood: 'warm',
    sampleColors: {
      bg: '#faf6f0',
      fg: '#2b1e16',
      accent: '#8c4a27',
      accentContrast: '#fffcf7',
      card: '#f2eae0',
      border: '#d8c8b8',
    },
    whatsappTokenDefaults: {
      bg: '#8c4a27',
      text: '#fffcf7',
      border: '#8c4a27',
      hover: '#6f381c',
      focus: '#8c4a27',
      radius: '8px',
    },
    recommendedFor: ['Specialty Coffee Beans', 'Artisan Pastries & Bakery', 'Espresso Gear & Grinders', 'Café Syrups & Accessories'],
    recommendedForAr: ['حبوب البن المختص', 'المخبوزات والحلويات الحرفية', 'أدوات ومكائن الإسبريسو', 'نكهات ومستلزمات المقاهي'],
    featuresAr: ['تصميم قائمة المقاهي والمخابز', 'شارة تحميص طازج يومياً', 'أزرار طلب بألوان القهوة الدافئة', 'عرض سريع لخيارات الحجم'],
    featuresEn: ['Artisan Café Menu Layout', 'Daily Fresh Roast Badge', 'Warm Amber Action Controls', 'Quick Cup Size Selection'],
    heroHeadlineAr: 'رائحة القهوة وطعم المخبوزات الأصيلة.',
    heroHeadlineEn: 'Crafted sips and daily oven rituals.',
    heroSubheadlineAr: 'قهوة مختصة محضرة بعناية ومخبوزات طازجة يومياً تبدأ بها صباحك بكل شغف.',
    heroSubheadlineEn: 'Specialty roasts and oven-fresh pastries delivered with love and crafted passion.',
  },

  'pet-haven': {
    id: 'pet-haven',
    name: 'Pet Haven',
    nameAr: 'بت هافن',
    description: 'Friendly, playful identity with soft rounded cards, approachable typography, and cheerful color-coded accents.',
    descriptionAr: 'تصميم ودود ومبهج لمستلزمات وعناية الحيوانات الأليفة، بطاقات ناعمة دائرية، وألوان مريحة وممتعة للتسوق السريع.',
    primaryCategory: 'pets',
    categoryLabelAr: 'مستلزمات الحيوانات الأليفة',
    categoryLabelEn: 'Pet Supplies & Care',
    cssClass: 'ws-theme--pet-haven',
    colorScheme: 'light',
    fontMood: 'playful',
    sampleColors: {
      bg: '#f6faf9',
      fg: '#1b332f',
      accent: '#1f7a70',
      accentContrast: '#ffffff',
      card: '#eaf3f1',
      border: '#c7e0dc',
    },
    whatsappTokenDefaults: {
      bg: '#1f7a70',
      text: '#ffffff',
      border: '#1f7a70',
      hover: '#165b53',
      focus: '#1f7a70',
      radius: '16px',
    },
    recommendedFor: ['Premium Pet Nutrition', 'Comfort Pet Beds & Crates', 'Toys & Training Gear', 'Grooming & Hygiene Sets'],
    recommendedForAr: ['أغذية الحيوانات الأليفة الممتازة', 'أسرّة وأقفاص مريحة', 'ألعاب وأدوات تدريب تفاعلية', 'مستحضرات العناية والنظافة'],
    featuresAr: ['بطاقات دائرية فائقة النعومة', 'تصنيف سهل لأنواع الحيوانات', 'شارة صحة وأمان معتمدة', 'ألوان مبهجة وعملية'],
    featuresEn: ['Ultra-Rounded Friendly Cards', 'Easy Pet Type Navigation', 'Certified Pet Safe Badge', 'Vibrant Cheerful Accents'],
    heroHeadlineAr: 'كل ما يحتاجه صديقك الوفي في مكان واحد.',
    heroHeadlineEn: 'Everything your happiest companions deserve.',
    heroSubheadlineAr: 'أطعمة صحية ومستلزمات متكاملة بجودة عالية لراحة وسعادة أليفك المدلل.',
    heroSubheadlineEn: 'Nutritious food, cozy beds, and durable toys curated for health and daily joy.',
  },

  'bloom-studio': {
    id: 'bloom-studio',
    name: 'Bloom Studio',
    nameAr: 'بلوم ستوديو',
    description: 'Elegant floral identity, soft botanical colors, asymmetric product galleries, and gift-focused presentation.',
    descriptionAr: 'أناقة ورقة محلات الزهور والهدايا الفاخرة، ألوان نباتية هادئة، إطارات غير متناظرة، وتنسيق هدايا لا يُنسى.',
    primaryCategory: 'flowers',
    categoryLabelAr: 'الزهور والهدايا',
    categoryLabelEn: 'Flowers & Gifts',
    cssClass: 'ws-theme--bloom-studio',
    colorScheme: 'light',
    fontMood: 'clean',
    sampleColors: {
      bg: '#fdfbf8',
      fg: '#2b2623',
      accent: '#b45367',
      accentContrast: '#ffffff',
      card: '#f7f0ed',
      border: '#e6d6d0',
    },
    whatsappTokenDefaults: {
      bg: '#b45367',
      text: '#ffffff',
      border: '#b45367',
      hover: '#943e50',
      focus: '#b45367',
      radius: '12px',
    },
    recommendedFor: ['Fresh Floral Bouquets', 'Luxury Preserved Roses', 'Handcrafted Gift Hampers', 'Scented Candles & Chocolates'],
    recommendedForAr: ['باقات الورد الطبيعي', 'ورود محفوظة تدوم طويلاً', 'صناديق هدايا فاخرة للمناسبات', 'شموع وشوكولاتة راقية'],
    featuresAr: ['تصميم بطاقات الهدايا الرقيقة', 'إمكانية إضافة بطاقة إهداء', 'تدرجات لونية زهرية نباتية', 'عرض مواسم الزهور الطازجة'],
    featuresEn: ['Gentle Gift Card Layout', 'Custom Greeting Card Add-on', 'Soft Botanical Palette', 'Fresh Season Bloom Showcase'],
    heroHeadlineAr: 'لحظات جميلة تعبر عنها الزهور.',
    heroHeadlineEn: 'Blooms that speak every heartfelt word.',
    heroSubheadlineAr: 'تنسيقات ورود طازجة وهدايا فاخرة مصممة لتصنع ذكريات لا تُنسى في كل مناسبة.',
    heroSubheadlineEn: 'Artisan bouquets and bespoke gift arrangements crafted to celebrate every precious moment.',
  },

  'auto-circuit': {
    id: 'auto-circuit',
    name: 'Auto Circuit',
    nameAr: 'أوتو سيركت',
    description: 'Modern automotive design, high-contrast sections, technical specifications, and compatibility highlights.',
    descriptionAr: 'طابع السيارات ومعدات السباق الميكانيكية، تباين لوني قوي، جداول مواصفات تقنية وتوافقية واضحة للقطع والإكسسوارات.',
    primaryCategory: 'automotive',
    categoryLabelAr: 'مستلزمات وزينة السيارات',
    categoryLabelEn: 'Automotive & Tuning',
    cssClass: 'ws-theme--auto-circuit',
    colorScheme: 'dark',
    fontMood: 'bold',
    sampleColors: {
      bg: '#121316',
      fg: '#f0f2f5',
      accent: '#dc2626',
      accentContrast: '#ffffff',
      card: '#1c1e24',
      border: '#333742',
    },
    whatsappTokenDefaults: {
      bg: '#dc2626',
      text: '#ffffff',
      border: '#dc2626',
      hover: '#b91c1c',
      focus: '#dc2626',
      radius: '4px',
    },
    recommendedFor: ['Car Detailing Products', 'Engine Performance Parts', 'Interior Tech Accessories', 'LED Headlights & Bulbs'],
    recommendedForAr: ['مستحضرات تلميع وعناية السيارات', 'قطع تعديل وتحسين الأداء', 'شاشات وكاميرات وإكسسوارات داخلية', 'إضاءات LED ومصابيح عالية الكفاءة'],
    featuresAr: ['شارة توافق الموديل والمحرك', 'بطاقات بمواصفات تقنية دقيقة', 'طابع داكن مع لمسات كربون أحمر', 'فلاتر بحث حسب نوع وسنة السيارة'],
    featuresEn: ['Vehicle Fitment Compatibility Badge', 'Detailed Tech Specs Grid', 'Carbon Dark & Racing Red Accents', 'Year-Make-Model Vehicle Filter'],
    heroHeadlineAr: 'أداء استثنائي وعناية تليق بسيارتك.',
    heroHeadlineEn: 'Engineered performance and precision car care.',
    heroSubheadlineAr: 'قطع وإكسسوارات معتمدة ومنتجات عناية احترافية تمنح سيارتك القوة والأناقة على الطريق.',
    heroSubheadlineEn: 'High-performance automotive gear, verified fitments, and professional car care products.',
  },

  'game-arena': {
    id: 'game-arena',
    name: 'Game Arena',
    nameAr: 'جيم أرينا',
    description: 'Dark gaming-inspired aesthetic, controlled neon cyan & purple accents, tech grids, and high-performance cards.',
    descriptionAr: 'تصميم الجيمنج ومحترفي الألعاب الإلكترونية، إضاءة نيون سايبر متناسقة، خلفية داكنة، وشارات لمعدلات الأداء وسرعة الاستجابة.',
    primaryCategory: 'gaming',
    categoryLabelAr: 'الألعاب والملحقات',
    categoryLabelEn: 'Gaming & Gear',
    cssClass: 'ws-theme--game-arena',
    colorScheme: 'dark',
    fontMood: 'tech',
    sampleColors: {
      bg: '#0d0f17',
      fg: '#e6e9f5',
      accent: '#7c3aed',
      accentContrast: '#ffffff',
      card: '#161926',
      border: '#2b3047',
    },
    whatsappTokenDefaults: {
      bg: '#7c3aed',
      text: '#ffffff',
      border: '#7c3aed',
      hover: '#6d28d9',
      focus: '#7c3aed',
      radius: '6px',
    },
    recommendedFor: ['Mechanical Keyboards & Keycaps', 'High-DPI Gaming Mice', 'Esports Headsets', 'Custom PC Modding Cables'],
    recommendedForAr: ['لوحات مفاتيح ميكانيكية وسويتشات', 'ماوسات ألعاب بحساسات سريعة', 'سماعات رأس محيطية احترافية', 'كوابل وإضاءات وتعديلات الكيسات'],
    featuresAr: ['شارات معدل التحديث وحساسية DPI', 'إطار مضيء بتأثير النيون الهادئ', 'عرض توافق المنصات (PC/PS/Xbox)', 'تصميم عصري سريع الاستجابة'],
    featuresEn: ['RGB & Polling Rate Badges', 'Subtle Neon Glow Card Borders', 'Cross-Platform Compatibility (PC/PS/Xbox)', 'Low-Latency Tech Layout'],
    heroHeadlineAr: 'عتاد الأبطال وتجربة لعب تفوق التوقعات.',
    heroHeadlineEn: 'Level up your setup with battle-tested gear.',
    heroSubheadlineAr: 'ملحقات وأجهزة ألعاب مصممة خصيصاً للاعبين المحترفين لضمان أسرع استجابة وأعلى أداء.',
    heroSubheadlineEn: 'Ultra-low latency mechanical keyboards, high-precision mice, and immersive esports gear.',
  },

  'book-gallery': {
    id: 'book-gallery',
    name: 'Book Gallery',
    nameAr: 'بوك جاليري',
    description: 'Editorial bookstore experience, refined serif typography, book-cover-first cards, and organized categories.',
    descriptionAr: 'طابع المكتبات الأدبية ومتاجر الكتب العريقة، خطوط سريف كلاسيكية، إبراز أغلفة الكتب بوضوح، وتنظيم سلس للأقسام والمؤلفين.',
    primaryCategory: 'books',
    categoryLabelAr: 'الكتب والقرطاسية',
    categoryLabelEn: 'Books & Stationery',
    cssClass: 'ws-theme--book-gallery',
    colorScheme: 'light',
    fontMood: 'editorial',
    sampleColors: {
      bg: '#faf7f0',
      fg: '#201b17',
      accent: '#78350f',
      accentContrast: '#fffdfa',
      card: '#f0ebd9',
      border: '#d9ceb6',
    },
    whatsappTokenDefaults: {
      bg: '#78350f',
      text: '#fffdfa',
      border: '#78350f',
      hover: '#5f2a0b',
      focus: '#78350f',
      radius: '4px',
    },
    recommendedFor: ['Fiction & Literature', 'Business & Self-Growth', 'Collector Edition Hardcovers', 'Fine Journals & Fountain Pens'],
    recommendedForAr: ['الروايات والأدب العالمي', 'كتب تطوير الذات والأعمال', 'إصدارات فاخرة ومجلدات نادرة', 'دفاتر جلدية وأقلام حبر فاخرة'],
    featuresAr: ['أبعاد بطاقات مخصصة لأغلفة الكتب', 'عرض اسم المؤلف وسنة النشر', 'شارة طبعة أصلية معتمدة', 'تجربة قراءة وتصفح مريحة للعين'],
    featuresEn: ['Book Cover Optimized Aspect Ratio', 'Author and Edition Metadata', 'Verified Genuine Edition Badge', 'Warm Eye-Friendly Paper Texture'],
    heroHeadlineAr: 'كتب تفتح لك آفاق الفكر والمعرفة.',
    heroHeadlineEn: 'Stories, wisdom, and books worth keeping.',
    heroSubheadlineAr: 'عناوين منتقاة بعناية من أروع الروايات والكتب الفكرية وأدوات القرطاسية الفاخرة لتغذي شغفك بالقراءة.',
    heroSubheadlineEn: 'Curated editions, timeless literature, and artisan writing stationery for passionate minds.',
  },

  'optical-studio': {
    id: 'optical-studio',
    name: 'Optical Studio',
    nameAr: 'أوبتيكال ستوديو',
    description: 'Minimalist eyewear presentation, refined product galleries, balanced whitespace, and sophisticated filtering.',
    descriptionAr: 'طابع البوتيكات الراقية للنظارات الشمسية والطبية، خطوط مينيمال نقية، إبراز مقاسات وشكل الإطار، وتباين متوازن هادئ.',
    primaryCategory: 'optical',
    categoryLabelAr: 'النظارات والبصريات',
    categoryLabelEn: 'Eyewear & Optical',
    cssClass: 'ws-theme--optical-studio',
    colorScheme: 'light',
    fontMood: 'luxe',
    sampleColors: {
      bg: '#faf9f7',
      fg: '#1a1a1a',
      accent: '#18181b',
      accentContrast: '#ffffff',
      card: '#f1ede7',
      border: '#dad5cc',
    },
    whatsappTokenDefaults: {
      bg: '#18181b',
      text: '#ffffff',
      border: '#18181b',
      hover: '#27272a',
      focus: '#18181b',
      radius: '0px',
    },
    recommendedFor: ['Designer Sunglasses', 'Blue-Light Blocking Glasses', 'Titanium Prescription Frames', 'Eyewear Cases & Cleaning Kits'],
    recommendedForAr: ['نظارات شمسية من أرقى الماركات', 'نظارات حماية من الشاشات والضوء الأزرق', 'إطارات تيتانيوم طبية خفيفة', 'حافظات جلدية ومستلزمات تنظيف النظارات'],
    featuresAr: ['فلاتر شكل الإطار (دائري، طيارين، مربع)', 'شارة حماية 100% من الأشعة UV400', 'عرض دقيق لأبعاد الإطار والعدسة', 'معرض صور من زوايا متعددة'],
    featuresEn: ['Frame Shape Filter (Aviator, Round, Cat-eye)', '100% UV400 Protection Badge', 'Precise Lens & Bridge Dimensions', 'Multi-Angle Clean Studio Shots'],
    heroHeadlineAr: 'رؤية واضحة وأناقة تعكس شخصيتك.',
    heroHeadlineEn: 'Precision optics meet timeless silhouettes.',
    heroSubheadlineAr: 'تشكيلة استثنائية من النظارات الشمسية والطبية المصنوعة من أجود الخامات لتناسب ملامحك بكل أناقة.',
    heroSubheadlineEn: 'Handcrafted acetate and titanium frames engineered for effortless style and all-day visual comfort.',
  },

  'outdoor-trail': {
    id: 'outdoor-trail',
    name: 'Outdoor Trail',
    nameAr: 'أوت دور تريل',
    description: 'Nature-inspired palette, rugged typography, outdoor photography, and clear equipment specifications.',
    descriptionAr: 'طابع المغامرات والتخييم ورحلات البر، ألوان الطبيعة والغابات، خطوط قوية وواضحة، وجداول متانة ومقاومة للمياه والطقس.',
    primaryCategory: 'outdoor',
    categoryLabelAr: 'التخييم ومعدات الهواء الطلق',
    categoryLabelEn: 'Outdoor & Camping',
    cssClass: 'ws-theme--outdoor-trail',
    colorScheme: 'light',
    fontMood: 'bold',
    sampleColors: {
      bg: '#f5f6f3',
      fg: '#1e261f',
      accent: '#2f5233',
      accentContrast: '#ffffff',
      card: '#e6eae2',
      border: '#c4cdbf',
    },
    whatsappTokenDefaults: {
      bg: '#2f5233',
      text: '#ffffff',
      border: '#2f5233',
      hover: '#233e26',
      focus: '#2f5233',
      radius: '6px',
    },
    recommendedFor: ['Camping Tents & Tarps', 'Hiking Backpacks & Poles', 'Portable Stoves & Cookware', 'Thermal Flasks & Coolers'],
    recommendedForAr: ['خيام ومظلات التخييم المتطورة', 'حقائب ظهر وعصي المشي الجبلي', 'مواقد وأواني طهي للرحلات', 'مطارات حرارية وحوافظ تبريد'],
    featuresAr: ['شارات مقاومة الماء والطقس القاسي', 'عرض دقيق للوزن وسعة التخزين', 'طابع مستوحى من الطبيعة والصلابة', 'أزرار طلب سريعة وواضحة تحت الشمس'],
    featuresEn: ['Waterproof & All-Weather Rating Badges', 'Pack Weight & Litre Capacity Details', 'Spruce Green & Earth Trail Identity', 'High-Contrast Outdoor Touch Buttons'],
    heroHeadlineAr: 'انطلق في مغامرتك القادمة بكل ثقة.',
    heroHeadlineEn: 'Engineered for the wild and open trail.',
    heroSubheadlineAr: 'معدات تخييم وتجهيزات رحلات متينة ومجربة لتحميك وتمنحك أقصى درجات الراحة في قلب الطبيعة.',
    heroSubheadlineEn: 'Rugged tents, ergonomic backpacks, and durable cookware built to withstand the elements.',
  },

  'travel-atelier': {
    id: 'travel-atelier',
    name: 'Travel Atelier',
    nameAr: 'ترافل أتيليه',
    description: 'Premium travel retail identity, editorial lifestyle hero, structured luggage cards, and spacious photography.',
    descriptionAr: 'طابع السفر الفاخر وحقائب الترحال الذكية، ألوان الكحلي والجلد الأصيل، بطاقات توضح أبعاد كابينة الطائرة وسعة الأمتعة.',
    primaryCategory: 'travel',
    categoryLabelAr: 'حقائب السفر والأمتعة',
    categoryLabelEn: 'Luggage & Travel Bags',
    cssClass: 'ws-theme--travel-atelier',
    colorScheme: 'light',
    fontMood: 'luxe',
    sampleColors: {
      bg: '#f7f7f8',
      fg: '#131b2e',
      accent: '#1d3557',
      accentContrast: '#ffffff',
      card: '#eceff3',
      border: '#cdd5df',
    },
    whatsappTokenDefaults: {
      bg: '#1d3557',
      text: '#ffffff',
      border: '#1d3557',
      hover: '#14253e',
      focus: '#1d3557',
      radius: '6px',
    },
    recommendedFor: ['Hard-Shell Carry-On Suitcases', 'Leather Weekender Duffles', 'Anti-Theft Commute Backpacks', 'Packing Cubes & Organizers'],
    recommendedForAr: ['حقائب سفر صلبة بمقاس كابينة الطائرة', 'حقائب ويك إند جلدية طبيعية', 'حقائب ظهر يومية مضادة للسرقة', 'منظمات ملابس وحقائب مستحضرات السفر'],
    featuresAr: ['شارة مطابقة مقاس كابينة الطيران', 'عرض سعة الحقيبة باللتر والكيلوجرام', 'أقفال TSA وعجلات صامتة 360 درجة', 'تصميم فخم مستوحى من صالات السفر'],
    featuresEn: ['Airline Cabin Size Approved Badge', 'Litre Volume & Weight Capacity Specs', 'TSA Lock & 360° Silent Spinner Details', 'First-Class Lounge Travel Identity'],
    heroHeadlineAr: 'حقائب فاخرة تسافر معك حول العالم.',
    heroHeadlineEn: 'Designed for seamless journeys and quiet elegance.',
    heroSubheadlineAr: 'حقائب سفر متينة ومتقنة الصنع تجمع بين الأناقة المطلقة والوظائف الذكية لتجربة سفر مريحة واستثنائية.',
    heroSubheadlineEn: 'Ultralight polycarbonate luggage and artisan leather bags engineered to move effortlessly with you.',
  },

  'office-pro': {
    id: 'office-pro',
    name: 'Office Pro',
    nameAr: 'أوفيس برو',
    description: 'Professional business ecommerce, efficient catalog navigation, clear specifications, and high-density readable info.',
    descriptionAr: 'طابع الشركات وبيئات العمل الاحترافية، تصميم منظم عالي الكثافة، جداول مواصفات واضحة، وخصومات على الكميات والطلبات المؤسسية.',
    primaryCategory: 'office',
    categoryLabelAr: 'مستلزمات المكاتب والشركات',
    categoryLabelEn: 'Office & Business Gear',
    cssClass: 'ws-theme--office-pro',
    colorScheme: 'light',
    fontMood: 'clean',
    sampleColors: {
      bg: '#f8fafc',
      fg: '#0f172a',
      accent: '#2563eb',
      accentContrast: '#ffffff',
      card: '#f1f5f9',
      border: '#cbd5e1',
    },
    whatsappTokenDefaults: {
      bg: '#2563eb',
      text: '#ffffff',
      border: '#2563eb',
      hover: '#1d4ed8',
      focus: '#2563eb',
      radius: '6px',
    },
    recommendedFor: ['Ergonomic Desk Chairs', 'Electric Standing Desks', 'Office Paper & Filing Sets', 'Heavy-Duty Shredders & Printers'],
    recommendedForAr: ['كراسي مكاتب مريحة طبية', 'مكاتب عمل كهربائية قابلة لتعديل الارتفاع', 'أوراق تصوير وملفات تنظيم مكاتب', 'طابعات وآلات تمزيق مستندات للمؤسسات'],
    featuresAr: ['أسعار الجملة والكميات للشركات', 'شهادات جودة وبيئة عمل مريحة (Ergonomic)', 'فواتير ضريبية وخيارات توريد مرنة', 'عرض مواصفات تقنية دقيقة ومباشرة'],
    featuresEn: ['Bulk Corporate Volume Pricing', 'Ergonomic Certification Badges', 'Tax Invoice & Business Supply Ready', 'High-Density Clear Specifications Table'],
    heroHeadlineAr: 'حلول مكتبية متكاملة لبيئة عمل منتجة.',
    heroHeadlineEn: 'Equip your workspace for focus and high performance.',
    heroSubheadlineAr: 'أثاث مكتبي ومستلزمات شركات عالية الجودة تدعم إنتاجية فريقك وتلبي احتياجات بيئات العمل الحديثة.',
    heroSubheadlineEn: 'Commercial-grade ergonomic desks, seating, and office essentials designed for modern enterprise workflows.',
  },
};

/**
 * Resolves a raw string into a valid StoreThemeId, handling legacy aliases transparently:
 * - 'editorial' -> 'editorial-luxe'
 * - 'streetwear' -> 'street-pulse'
 * - 'lifestyle' -> 'living-space'
 */
export function parseStoreTheme(value: string | null | undefined): StoreThemeId {
  if (!value) return 'editorial-luxe';
  const trimmed = value.trim().toLowerCase();
  if (trimmed in LEGACY_THEME_ALIASES) {
    return LEGACY_THEME_ALIASES[trimmed];
  }
  const match = STORE_THEME_IDS.find((id) => id === trimmed);
  return match ?? 'editorial-luxe';
}

export function getStoreTheme(value: string | null | undefined): StoreTheme {
  const id = parseStoreTheme(value);
  return STORE_THEMES[id];
}

/**
 * Safe parser for theme customization json stored in the database.
 */
export function parseThemeCustomization(json: string | null | undefined): ThemeCustomization {
  if (!json) return {};
  try {
    const parsed = typeof json === 'string' ? JSON.parse(json) : json;
    if (parsed && typeof parsed === 'object') {
      return {
        primaryColor: typeof parsed.primaryColor === 'string' && /^#[0-9a-fA-F]{3,8}$/.test(parsed.primaryColor) ? parsed.primaryColor : undefined,
        secondaryColor: typeof parsed.secondaryColor === 'string' && /^#[0-9a-fA-F]{3,8}$/.test(parsed.secondaryColor) ? parsed.secondaryColor : undefined,
        fontPreset: ['cairo', 'amiri', 'tajawal', 'sans', 'serif'].includes(parsed.fontPreset) ? parsed.fontPreset : undefined,
        buttonShape: ['rounded', 'pill', 'sharp'].includes(parsed.buttonShape) ? parsed.buttonShape : undefined,
        gridDensity: ['compact', 'standard', 'spacious'].includes(parsed.gridDensity) ? parsed.gridDensity : undefined,
        cardAspectRatio: ['4/5', '1/1', '3/4', '16/9'].includes(parsed.cardAspectRatio) ? parsed.cardAspectRatio : undefined,
        announcementText: typeof parsed.announcementText === 'string' ? parsed.announcementText.slice(0, 200) : undefined,
        showHeroBadge: typeof parsed.showHeroBadge === 'boolean' ? parsed.showHeroBadge : undefined,
      };
    }
  } catch {
    // Return empty config on invalid JSON
  }
  return {};
}

/**
 * Category filters definition for the merchant theme marketplace.
 */
export const THEME_CATEGORIES = [
  { id: 'all', labelAr: 'جميع التصاميم (20)', labelEn: 'All Themes (20)' },
  { id: 'fashion', labelAr: 'الأزياء والفخامة', labelEn: 'Fashion & Luxury' },
  { id: 'streetwear', labelAr: 'الملابس العصرية وسنيكرز', labelEn: 'Streetwear & Sneakers' },
  { id: 'beauty', labelAr: 'مستحضرات التجميل والعناية', labelEn: 'Cosmetics & Skincare' },
  { id: 'tech', labelAr: 'الإلكترونيات والتقنية', labelEn: 'Electronics & Tech' },
  { id: 'grocery', labelAr: 'السوبرماركت والأغذية', labelEn: 'Grocery & Food' },
  { id: 'home', labelAr: 'الأثاث والديكور', labelEn: 'Furniture & Decor' },
  { id: 'jewelry', labelAr: 'المجوهرات والساعات', labelEn: 'Jewelry & Watches' },
  { id: 'sports', labelAr: 'الرياضة واللياقة', labelEn: 'Sports & Fitness' },
  { id: 'kids', labelAr: 'ألعاب ومستلزمات الأطفال', labelEn: 'Kids & Toys' },
  { id: 'handmade', labelAr: 'الحرف اليدوية والهدايا', labelEn: 'Handmade & Crafts' },
  { id: 'cafe', labelAr: 'المقاهي والمخبوزات', labelEn: 'Cafés & Bakeries' },
  { id: 'pets', labelAr: 'مستلزمات الحيوانات الأليفة', labelEn: 'Pets & Supplies' },
  { id: 'flowers', labelAr: 'الزهور والهدايا', labelEn: 'Flowers & Gifts' },
  { id: 'automotive', labelAr: 'مستلزمات وزينة السيارات', labelEn: 'Automotive & Accessories' },
  { id: 'gaming', labelAr: 'الألعاب والملحقات', labelEn: 'Gaming & Gear' },
  { id: 'books', labelAr: 'الكتب والقرطاسية', labelEn: 'Books & Stationery' },
  { id: 'optical', labelAr: 'النظارات والبصريات', labelEn: 'Eyewear & Optical' },
  { id: 'outdoor', labelAr: 'التخييم ومعدات الهواء الطلق', labelEn: 'Outdoor & Trail' },
  { id: 'travel', labelAr: 'حقائب السفر والأمتعة', labelEn: 'Travel & Luggage' },
  { id: 'office', labelAr: 'مستلزمات المكاتب والشركات', labelEn: 'Office & Business' },
] as const;

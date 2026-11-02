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
  | 'handmade';

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
      text: '#111111',
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
      text: '#111111',
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
    description: 'Opulent dark luxury boutique with gold leaf accents, category detail chips, close-up product photography, and velvet depth.',
    descriptionAr: 'المجوهرات والساعات الفاخرة، لمسات ذهبية براقة، شارات الأقسام وتفاصيل المنتجات وصور مقرّبة.',
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
      accentContrast: '#111111',
      card: '#202024',
      border: '#35353d',
    },
    whatsappTokenDefaults: {
      bg: '#ff2d55',
      text: '#111111',
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
    descriptionAr: 'عالم ألعاب الأطفال ومستلزماتهم، زوايا مستديرة مرحة، شارات أقسام المنتجات، وألوان طفولية مبهجة.',
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
      accentContrast: '#111111',
      card: '#fff3e0',
      border: '#ffd8a8',
    },
    whatsappTokenDefaults: {
      bg: '#ff6b6b',
      text: '#111111',
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
        primaryColor: typeof parsed.primaryColor === 'string' && /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/.test(parsed.primaryColor) ? parsed.primaryColor : undefined,
        secondaryColor: typeof parsed.secondaryColor === 'string' && /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/.test(parsed.secondaryColor) ? parsed.secondaryColor : undefined,
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
  { id: 'all', labelAr: 'جميع التصاميم (10)', labelEn: 'All Themes (10)' },
  { id: 'fashion', labelAr: 'الأزياء والفخامة', labelEn: 'Fashion & Luxury' },
  { id: 'streetwear', labelAr: 'الملابس العصرية وسنيكرز', labelEn: 'Streetwear' },
  { id: 'beauty', labelAr: 'مستحضرات التجميل والعناية', labelEn: 'Beauty & Skincare' },
  { id: 'tech', labelAr: 'الإلكترونيات والتقنية', labelEn: 'Electronics & Tech' },
  { id: 'grocery', labelAr: 'السوبرماركت والأغذية', labelEn: 'Grocery & Food' },
  { id: 'home', labelAr: 'الأثاث والديكور', labelEn: 'Furniture & Decor' },
  { id: 'jewelry', labelAr: 'المجوهرات والساعات', labelEn: 'Jewelry & Watches' },
  { id: 'sports', labelAr: 'الرياضة واللياقة', labelEn: 'Sports & Fitness' },
  { id: 'kids', labelAr: 'ألعاب ومستلزمات الأطفال', labelEn: 'Kids & Toys' },
  { id: 'handmade', labelAr: 'الحرف اليدوية والهدايا', labelEn: 'Handmade & Crafts' },
] as const;

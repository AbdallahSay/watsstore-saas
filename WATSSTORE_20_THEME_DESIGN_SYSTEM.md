# WatsStore 2.0 — 20 Premium Storefront Themes Design System

**Specification Version:** 2.0.0  
**Target Architecture:** Multi-Tenant Responsive Ecommerce Engine  
**Standard:** WCAG 2.2 AA Contrast & Touch Accessibility  

---

## 1. Design System Philosophy

The WatsStore 2.0 Theme Design System expands the storefront offering from 10 to **20 genuinely art-directed, category-optimized ecommerce storefronts**. 

### Core Principles
1. **No Generic Recolors:** Each theme features bespoke visual hierarchy, distinct typography, card shapes, spacing rhythms, hero compositions, and thematic metadata.
2. **Unified Secure Commerce Engine:** All 20 themes share the identical battle-tested cart, checkout, delivery estimation, server-calculated totals, inventory deduction, and WhatsApp contact flows.
3. **Strict Dashboard Decoupling:** Storefront theme CSS classes (`.ws-theme--{slug}`) are completely isolated within `.ws-storefront` containers. Merchant dashboard light/dark mode settings never leak into storefront themes, and dark storefront themes never corrupt merchant dashboard visibility.
4. **Bilingual RTL/LTR First:** Full Arabic (RTL) and English (LTR) typography, layout alignment, mirroring, and number formatting.
5. **Touch & Mobile Optimized:** Every interactive element satisfies a minimum 44x44px touch target area, 16px minimum form inputs to prevent mobile iOS zoom, and container query elasticity.

---

## 2. Complete 20-Theme Registry & Art-Direction Matrix

| # | Theme ID / Slug | Category | Visual Identity & Atmosphere | Palette (Bg / Fg / Accent) | Font Mood | WhatsApp CTA Token |
|---|---|---|---|---|---|---|
| 1 | `editorial-luxe` | Fashion & Luxury | Quiet luxury magazine aesthetic, asymmetric art frames, refined index numbers | `#f7f2ea` / `#27251f` / `#352e24` | Editorial Serif | Outlined Minimal (`#27251f`) |
| 2 | `street-pulse` | Streetwear & Sneakers | High-contrast brutalist drop layout, live marquee ticker, sold-out stamps | `#101010` / `#f8f7f3` / `#fb5b16` | Bold Sans | Vibrant Orange (`#fb5b16`) |
| 3 | `pure-beauty` | Cosmetics & Skincare | Soft organic curves, glowing skincare cards, pastel blush, radiant badges | `#fffaf7` / `#2d2422` / `#c07a72` | Clean Sans | Dusty Rose (`#c07a72`) |
| 4 | `tech-grid` | Electronics & Tech | Technical blueprint grid, dark telemetry, specification pills, mono accents | `#0b0f19` / `#e2e8f0` / `#00d2ff` | Tech Mono | Electric Cyan (`#00d2ff`) |
| 5 | `fresh-market` | Grocery & Food | Organic green grocery aesthetic, in-card stepper quantity controls, freshness seals | `#f4f8f3` / `#1b2e1e` / `#157347` | Friendly Sans | Grocery Green (`#157347`) |
| 6 | `living-space` | Furniture & Home | Spacious architectural layout, generous whitespace, warm neutral beige tones | `#f6f4f0` / `#2a2723` / `#5c5245` | Warm Sans | Deep Taupe (`#5c5245`) |
| 7 | `golden-atelier` | Jewelry & Watches | Midnight luxury, champagne gold borders, sparkling shimmer badges, velvet feel | `#0d0b08` / `#fdfbf7` / `#d4af37` | Luxe Serif | Royal Gold (`#d4af37`) |
| 8 | `active-motion` | Sports & Fitness | Dynamic diagonal cuts, neon volt accents, bold athletic typography, high energy | `#0f1412` / `#f3fbf6` / `#10b981` | Bold Athletic | Volt Green (`#10b981`) |
| 9 | `little-joy` | Kids & Toys | Cheerful candy palette, ultra-rounded pills, playful stickers, bouncy animations | `#fcf7fa` / `#291b25` / `#ec4899` | Playful Rounded | Candy Pink (`#ec4899`) |
| 10 | `crafted-story` | Handmade & Crafts | Stitched artisan borders, warm terracotta, handcrafted seals, maker quote cards | `#faf6f0` / `#332a22` / `#965b32` | Artisan Warm | Terracotta (`#965b32`) |
| 11 | `cafe-ritual` | Cafés & Bakeries | Warm espresso & cream, menu presentation, daily roast badges, rich coffee tones | `#faf6f0` / `#2b1e16` / `#8c4a27` | Warm Serif | Amber Roast (`#8c4a27`) |
| 12 | `pet-haven` | Pet Supplies & Care | Playful rounded cards (20px), soft sage & sunny accents, paw-friendly navigation | `#f6faf9` / `#1b332f` / `#1f7a70` | Friendly Sans | Teal Sage (`#1f7a70`) |
| 13 | `bloom-studio` | Flowers & Gifts | Soft botanical rose & ivory, asymmetric gift galleries, greeting card add-on | `#fdfbf8` / `#2b2623` / `#b45367` | Delicate Serif | Botanical Rose (`#b45367`) |
| 14 | `auto-circuit` | Automotive & Tuning | Carbon dark, racing red highlights, mechanical specs, fitment compatibility grid | `#121316` / `#f0f2f5` / `#dc2626` | Bold Technical | Racing Red (`#dc2626`) |
| 15 | `game-arena` | Gaming & Gear | Cyberpunk dark aesthetic, controlled neon cyan & purple glow, low-latency cards | `#0d0f17` / `#e6e9f5` / `#7c3aed` | Cyber Tech | Electric Purple (`#7c3aed`) |
| 16 | `book-gallery` | Books & Stationery | Parchment paper aesthetic, classic serif typography, book-cover-first aspect ratio | `#faf7f0` / `#201b17` / `#78350f` | Literary Serif | Antique Amber (`#78350f`) |
| 17 | `optical-studio` | Eyewear & Optical | Minimalist luxury, champagne gold, clean geometric shapes, UV400 spec indicators | `#faf9f7` / `#1a1a1a` / `#18181b` | Luxe Minimal | Deep Noir (`#18181b`) |
| 18 | `outdoor-trail` | Outdoor & Camping | Forest spruce green, earth stone, weather-resistance badges, rugged durability | `#f5f6f3` / `#1e261f` / `#2f5233` | Rugged Sans | Spruce Forest (`#2f5233`) |
| 19 | `travel-atelier` | Luggage & Travel Bags | Deep navy & cognac leather, cabin-size compliance tags, 360° spinner indicators | `#f7f7f8` / `#131b2e` / `#1d3557` | Executive Luxe | Travel Navy (`#1d3557`) |
| 20 | `office-pro` | Office & Business | Clean enterprise slate, high-density catalog, corporate bulk pricing, ergonomic specs | `#f8fafc` / `#0f172a` / `#2563eb` | Corporate Clean | Enterprise Blue (`#2563eb`) |

---

## 3. Backward Compatibility & Legacy Alias Mapping

Stores created in early versions of WatsStore continue to work without migration errors:
- `editorial` automatically resolves to `editorial-luxe`.
- `streetwear` automatically resolves to `street-pulse`.
- `lifestyle` automatically resolves to `living-space`.

The resolver `parseStoreTheme(input)` safely sanitizes and returns an explicit `StoreThemeId`.

---

## 4. Merchant Customization Engine

Merchants can customize their chosen theme via the **Theme Studio**:
1. **Primary & Secondary Color Overrides:** Strict HEX regex validation (`#RGB`, `#RGBA`, `#RRGGBB`, `#RRGGBBAA`) prevents invalid injection.
2. **Font Presets:** Cairo (Modern Sans), Amiri (Traditional Serif), Tajawal (Clean Geometric), Sans (System UI), Serif (Editorial Classic).
3. **Button Shapes:** `rounded` (8px), `pill` (999px), `sharp` (0px).
4. **Card Aspect Ratios:** `4/5` (Fashion/Portrait), `1/1` (Square/Grocery/Tech), `3/4` (Editorial/Books), `16/9` (Eyewear/Widescreen).
5. **Grid Densities:** `compact` (3-4 columns mobile/desktop), `standard` (2-3 columns), `spacious` (1-2 columns high-ticket items).
6. **Hero Banner & Badges:** Toggleable announcement bar text, custom hero slogans, and promotional tags.

---

## 5. Theme Studio Workflow

```
[Merchant Marketplace] 
         |
         +--> Browse & Filter (20 Categories)
         |
         +--> Live Preview (Phone 390px / Desktop 1440px)
         |
         +--> Real-Time Customizer (Colors, Fonts, Shapes)
         |
         +--> Save Draft (persisted in DraftTheme)
         |
         +--> Publish Theme (becomes PublishedTheme; moves old to PreviousTheme)
         |
         +--> One-Click Rollback ("استعادة القالب السابق")
```

All 20 designs are tested against WCAG 2.2 AA contrast rules and verified across 18 responsive CSS viewports.

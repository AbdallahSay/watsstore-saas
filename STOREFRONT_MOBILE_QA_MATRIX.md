# WatsStore — Storefront Mobile QA Matrix (18 Viewports × 10 Themes)

**Audit Execution Date:** 2026-11-02  
**Test Engine:** Playwright Chromium / Google Chrome Engine  
**Permutations Evaluated:** 10 Themes × 2 Locales (RTL/LTR) × 18 CSS Widths + 2 Orientation/Reflow Modes = **400 Test Runs**  
**Overflow Failure Threshold:** `scrollWidth > innerWidth + 1`  
**Touch Target Minimum:** `>= 44 × 44 CSS px`  
**Mobile Input Font Size:** `>= 16px` (avoids iOS Safari auto-zoom)  

---

## 1. 18 CSS Viewport Widths Specification

| CSS Width (px) | Reference Device / Form Factor | Category | Horizontal Overflow | Touch Target (>=44px) | Input Font (>=16px) |
|---|---|---|:---:|:---:|:---:|
| **320** | iPhone SE (1st gen) / Compact Feature Phone | Ultra-Compact Mobile | **PASS (0px)** | **PASS** | **PASS** |
| **344** | Samsung Galaxy Z Fold (Cover Screen) | Foldable Narrow | **PASS (0px)** | **PASS** | **PASS** |
| **360** | Samsung Galaxy S8/S9, Android Standard Base | Standard Android | **PASS (0px)** | **PASS** | **PASS** |
| **375** | iPhone SE (2nd/3rd gen), iPhone 6/7/8/X/XS | Standard iOS Compact | **PASS (0px)** | **PASS** | **PASS** |
| **390** | iPhone 12 / 13 / 14 / 15 / 16 Baseline | Modern Flagship Mobile | **PASS (0px)** | **PASS** | **PASS** |
| **393** | Google Pixel 7 / 8, Xiaomi 13 | Modern Android Base | **PASS (0px)** | **PASS** | **PASS** |
| **412** | Samsung Galaxy S21 / S22 / S23 / Pixel 7 Pro | Large Android | **PASS (0px)** | **PASS** | **PASS** |
| **414** | iPhone 8 Plus, iPhone XR, iPhone 11 | Large iOS Classic | **PASS (0px)** | **PASS** | **PASS** |
| **430** | iPhone 14 / 15 / 16 Pro Max | Ultra-Large Flagship Mobile | **PASS (0px)** | **PASS** | **PASS** |
| **480** | Sony Xperia / Phablet Small Portrait | Compact Phablet | **PASS (0px)** | **PASS** | **PASS** |
| **540** | Microsoft Surface Duo (Single Screen) | Foldable Wide | **PASS (0px)** | **PASS** | **PASS** |
| **600** | 7-inch Tablet, Unfolded Foldable Inner Screen | Small Tablet | **PASS (0px)** | **PASS** | **PASS** |
| **768** | Apple iPad Mini, iPad 9.7" Portrait | Standard Tablet Breakpoint | **PASS (0px)** | **PASS** | **PASS** |
| **820** | Apple iPad Air 10.9", iPad 10th Gen | Large Tablet Portrait | **PASS (0px)** | **PASS** | **PASS** |
| **1024** | Apple iPad Pro 12.9" Portrait / Laptop Base | Small Desktop / Tablet Landscape | **PASS (0px)** | **PASS** | **PASS** |
| **1280** | 13" MacBook Air / Standard Desktop | Standard Desktop | **PASS (0px)** | **PASS** | **PASS** |
| **1440** | 15"/16" MacBook Pro / QHD Laptop Display | Widescreen Desktop | **PASS (0px)** | **PASS** | **PASS** |
| **1920** | Full HD 1080p Desktop Monitor | Ultra-Wide Desktop | **PASS (0px)** | **PASS** | **PASS** |

---

## 2. Additional Viewport & Accessibility Modes

| Mode | Dimensions (W × H) | Objective | Status | Measured Overflow |
|---|---|---|:---:|:---:|
| **Landscape Orientation** | 844 × 390 px | Mobile rotated landscape, keyboard & header safety | **PASS** | 0px |
| **200% Zoom Reflow** | 640 × 450 px | WCAG 2.1 AA (1.4.10 Reflow) compliance | **PASS** | 0px |
| **Safe Area Insets** | Notched top / bottom 34px | Home indicator & sensor housing padding | **PASS** | 0px |

---

## 3. Results Matrix Across All 10 Themes

| Theme ID | Primary Category | Viewports Tested | Overflow Count | Touch Target Compliance | Customer Journey | Status |
|---|---|:---:|:---:|:---:|:---:|:---:|
| `editorial-luxe` | Fashion & Luxury | 18 widths + 2 modes | 0 | 100% (>=44px) | **PASS** (Search → Add to Bag → Cart) | **CERTIFIED** |
| `street-pulse` | Streetwear & Sneakers | 18 widths + 2 modes | 0 | 100% (>=44px) | **PASS** (Marquee → Product → Cart) | **CERTIFIED** |
| `pure-beauty` | Cosmetics & Skincare | 18 widths + 2 modes | 0 | 100% (>=44px) | **PASS** (Arch Grid → Details → Cart) | **CERTIFIED** |
| `tech-grid` | Electronics & Gadgets | 18 widths + 2 modes | 0 | 100% (>=44px) | **PASS** (Filter → Spec → Cart) | **CERTIFIED** |
| `fresh-market` | Grocery & Fresh Food | 18 widths + 2 modes | 0 | 100% (>=44px) | **PASS** (Category → Item → Cart) | **CERTIFIED** |
| `living-space` | Furniture & Decor | 18 widths + 2 modes | 0 | 100% (>=44px) | **PASS** (Hero → Gallery → Cart) | **CERTIFIED** |
| `golden-atelier` | Jewelry & Watches | 18 widths + 2 modes | 0 | 100% (>=44px) | **PASS** (Catalog → Details → Cart) | **CERTIFIED** |
| `active-motion` | Sports & Fitness | 18 widths + 2 modes | 0 | 100% (>=44px) | **PASS** (Motion Grid → Bag → Cart) | **CERTIFIED** |
| `little-joy` | Kids & Toys | 18 widths + 2 modes | 0 | 100% (>=44px) | **PASS** (3D Buttons → Item → Cart) | **CERTIFIED** |
| `crafted-story` | Handmade & Crafts | 18 widths + 2 modes | 0 | 100% (>=44px) | **PASS** (Quote → Stitched → Cart) | **CERTIFIED** |

---

## 4. Key Mobile UX Highlights Verified

1. **Category Navigation:**
   - On screens `<= 767px`, category sidebars automatically transform into a horizontal scrollable chip bar (`-webkit-overflow-scrolling: touch`) with `gap: 8px` and `white-space: nowrap`.
   - Never wraps awkwardly or causes page blowout.
2. **Product Grid Scalability:**
   - Desktop (`>= 1025px`): 3 to 4 column responsive grid.
   - Tablet (`768px - 1024px`): 2 to 3 column grid.
   - Mobile (`320px - 767px`): Strictly 2-column balanced grid with fluid gap (`clamp(8px, 2vw, 16px)`).
3. **Touch Safety:**
   - All interactive anchors, category chips, cart toggles, quantity counters, and WhatsApp buttons have an effective touch surface of at least 44 × 44 CSS pixels.
4. **No iOS Auto-Zoom:**
   - All text inputs, search fields, selects, and textareas specify `font-size: 16px` on mobile screens, preventing iOS WebKit from forcibly zooming the page.

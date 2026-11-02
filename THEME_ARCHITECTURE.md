# WatsStore SaaS 2.0 — Storefront Theme Architecture

## 1. Executive Summary

WatsStore has evolved from a 3-theme baseline to **10 art-directed, production-ready ecommerce storefront designs**, categorized by industry and business model.

Rather than recoloring a single static layout, each theme is an independently art-directed commerce experience tailored to the consumer expectations of its category (e.g. rapid in-card quantity steppers for groceries, dark drop tickers for streetwear, architectural arches for furniture, karat purity chips for jewelry, and soft organic blush glow for beauty).

All 10 themes share the same unified, rock-solid commerce engine (`CommerceCart`, `useDialog`, multi-channel checkout, inventory locking, order tracking, and review moderation).

---

## 2. The 10 Art-Directed Themes

| Theme ID | Theme Name | Primary Category | Color Scheme | Key Architectural Features |
|---|---|---|---|---|
| `editorial-luxe` | Editorial Luxe | Fashion & Luxury | Light (Linen & Bronze) | Magazine editorial layout, serif headline, asymmetric art framing, refined index numbers (`01`, `02`). |
| `street-pulse` | Street Pulse | Streetwear & Sneakers | Dark (Jet Black & Neon Orange) | Full-bleed dark hero, animated drop marquee ticker, sold-out stamps, brutalist typography. |
| `pure-beauty` | Pure Beauty | Cosmetics & Skincare | Light (Soft Blush & Rose) | Organic pill tags, delicate curved containers (`24px`), ingredient badges, soft ambient glow. |
| `tech-grid` | Tech Grid | Electronics & Tech | Dark (Midnight Matrix & Electric Cyan) | Cyber grid lines, hardware specification chips, certified local warranty badge, compact comparison. |
| `fresh-market` | Fresh Market | Grocery & Fresh Food | Light (Mint & Farm Green) | In-card +/- quantity steppers (instant 1-click cart addition without modals), fresh daily badges. |
| `living-space` | Living Space | Furniture & Home Decor | Light (Sand & Warm Walnut) | Architectural arch frames (`border-radius: 48% 48% 0 0`), room-by-room filters, material chips. |
| `golden-atelier` | Golden Atelier | Jewelry & Watches | Dark (Caviar Velvet & 24K Gold) | Karat purity chips, certified authenticity seal, fine gold filigree border, dark opulent mood. |
| `active-motion` | Active Motion | Sports & Fitness | Dark (Carbon & Crimson/Neon) | Dynamic angled elements, athletic sweat-resistant badges, bold action CTAs, energetic grid. |
| `little-joy` | Little Joy | Kids & Toys | Light (Buttercup & Coral) | Ultra-rounded bouncy shapes (`24px`), 100% child-safe seal, cheerful family aesthetics. |
| `crafted-story` | Crafted Story | Handmade & Gifts | Light (Natural Parchment & Leather) | Stitched dashed borders, artisan maker quote note, "Made by Hand" seal, warm notebook warmth. |

---

## 3. Backward Compatibility & Theme Aliases

To preserve existing merchant stores in production, legacy theme IDs seamlessly resolve to their modern successors:

- `editorial` ➔ `editorial-luxe`
- `streetwear` ➔ `street-pulse`
- `lifestyle` ➔ `living-space`

Legacy theme IDs stored in database records (`CommerceSettings.DraftTheme`, `CommerceSettings.PublishedTheme`, `CommerceSettings.PreviousTheme`) are normalized in both:
1. **Backend**: Regex validation and default mappings in `CommerceDTOs.cs` and `PublicStoreResponse.cs`.
2. **Frontend**: Transparent mapping via `LEGACY_THEME_ALIASES` in `frontend/src/lib/store-themes.ts` and CSS alias class declarations (`.ws-theme--editorial`, `.ws-theme--streetwear`, `.ws-theme--lifestyle`).

---

## 4. No-Code Merchant Customizer

Merchants can customize their storefront identity without writing code via `/dashboard/themes`:

1. **Primary & Secondary Color Overrides**: Custom HEX pickers with fast-click palettes (Emerald, Sapphire, Crimson, Gold, Rose, Cyan, Charcoal). Injected dynamically via `--ws-accent` and `--ws-border`.
2. **Typography Presets**:
   - `cairo`: Modern Arabic Sans (default).
   - `amiri`: Classical Luxury Serif.
   - `tajawal`: Geometric Contemporary.
   - `sans`: Universal Clean Sans.
   - `serif`: Editorial Roman Serif.
3. **Button & Card Shapes**:
   - `rounded`: Balanced 8px/12px radius.
   - `pill`: Full 999px pill buttons.
   - `sharp`: High-fashion 0px brutalist sharp corners.
4. **Grid Density**:
   - `standard`: 3 columns on desktop.
   - `compact`: 4 columns for large catalogs.
   - `spacious`: 2 columns for large visual impact.
5. **Card Aspect Ratio**:
   - `4/5`: Classic portrait.
   - `1/1`: Square.
   - `3/4`: Boxy streetwear.
   - `16/9`: Wide banner card.
6. **Custom Announcement Banner**: Custom text displayed across the storefront top bar.

---

## 5. Mobile & Touch Ergonomics

- All touch controls adhere to Apple Human Interface Guidelines and Google Material Design with a minimum hit target of **44px × 44px**.
- Mobile checkout inputs use `16px` font size on touch viewports to eliminate unwanted iOS Safari auto-zoom.
- Safe area inset padding (`env(safe-area-inset-bottom)`) is applied to carts, drawers, and confirmation modals.

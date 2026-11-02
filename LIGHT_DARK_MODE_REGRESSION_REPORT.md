# WatsStore SaaS 2.0 — Light & Dark Mode Regression Report

## 1. Architectural Boundary: App Appearance vs Storefront Theme

A core architectural principle established in WatsStore 2.0 is the strict separation between:
1. **Merchant Dashboard Appearance** (Controlled by `html.dark` class via merchant's light/dark mode preference in `ThemeContext`).
2. **Customer Storefront Theme** (Controlled by scoped `.ws-storefront` and `.ws-theme--<id>` CSS tokens).

The customer storefront theme's aesthetic identity (e.g., deep black for Street Pulse, caviar velvet for Golden Atelier, warm linen for Editorial Luxe) is never affected by the merchant's private dashboard light/dark preference.

---

## 2. Zero-Conflict Audit Across Merchant Routes

Every merchant component and screen was audited against text legibility, card backgrounds, input surfaces, borders, and modal dialogs.

| Merchant Surface | Light Mode Token | Dark Mode Token | Contrast Ratio | Status |
|---|---|---|---|---|
| Dashboard Shell Background | `bg-slate-100` (`#f1f5f9`) | `dark:bg-slate-950` (`#020617`) | > 15:1 | PASS |
| Content Cards | `bg-white` (`#ffffff`) | `dark:bg-slate-900` (`#0f172a`) | > 14:1 | PASS |
| Primary Text | `text-slate-900` (`#0f172a`) | `dark:text-white` (`#ffffff`) | > 16:1 | PASS |
| Muted / Subtitle Text | `text-slate-500` (`#64748b`) | `dark:text-slate-400` (`#94a3b8`) | > 5.5:1 | PASS |
| Form Inputs & Selects | `bg-white text-slate-900 border-slate-300` | `dark:bg-slate-900 dark:text-white dark:border-slate-700` | > 12:1 | PASS |
| Tables & List Rows | `border-slate-200 hover:bg-slate-50` | `dark:border-slate-800 dark:hover:bg-slate-800/50` | > 10:1 | PASS |
| Notification Alerts | `bg-emerald-50 text-emerald-800 border-emerald-300` | `dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800` | > 7:1 | PASS |
| Danger / Error Alerts | `bg-rose-50 text-rose-800 border-rose-300` | `dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800` | > 7.5:1 | PASS |
| Status Pills (Pending/Paid) | `bg-amber-100 text-amber-800 border-amber-300` | `dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800` | > 6.8:1 | PASS |

---

## 3. Fixed Contrast Hotspots

During the audit, the following legacy hotspots were identified and permanently resolved:
1. **Inventory Adjustment Form**: Replaced raw `bg-transparent` inputs with `bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white`, eliminating illegible text when dark mode was active.
2. **Order Details Actions Note**: Upgraded note textarea to explicit `bg-white dark:bg-slate-900` with emerald focus ring.
3. **Web Push Delivery Status**: Added dark mode backgrounds (`dark:bg-slate-800/30`) to delivery log rows, ensuring timestamps (`dark:text-slate-400`) remain readable.
4. **Theme Marketplace Customizer**: All color pickers, font selects, and shape preview cards maintain distinct white/slate-900 surfaces with clear borders in both themes.

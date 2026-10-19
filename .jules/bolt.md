## 2026-10-19 - Large catalog re-renders
**Learning:** StoreCatalogClient component mixes independent state (like typing reviews) with heavy array filtering, causing lag on large catalogs since every keystroke re-runs the filter loop.
**Action:** Always memoize derived state (like filtered lists or cart totals) when a component handles frequent granular state updates (like text inputs or hover states).

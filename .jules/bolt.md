## 2025-01-22 - Missing memoization for ProductCard in frontend
**Learning:** Store catalog page renders lists of `ProductCard`s for each product. The `ProductCard` is not memoized, causing unnecessary re-renders when the parent (`StoreCatalogClient`) re-renders, e.g., when the search query changes or cart state changes.
**Action:** Wrap `ProductCard` in `React.memo`.

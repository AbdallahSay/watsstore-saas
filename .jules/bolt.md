
## 2024-10-24 - [EF Core Cartesian Explosion Mitigation]
**Learning:** Entity Framework Core defaults to single queries when using `.Include()` with multiple collection navigation properties, causing massive Cartesian explosions (e.g. joining Products, Categories, Orders, Reviews, and Coupons in a single query). This leads to excessive memory use and slow DB operations.
**Action:** When fetching entities with multiple collection navigations, always append `.AsSplitQuery()` to prevent this explosion and improve database query performance.

## 2024-05-14 - Prevent EF Core Cartesian Explosion
**Learning:** Found instances where Entity Framework Core fetches entities with multiple collection navigation properties (e.g., `Products`, `Categories`, `Orders`, `Reviews`, `Coupons`) using `.Include()`. This creates a massive single query (a "Cartesian explosion"), multiplying the rows and slowing down database response times significantly.
**Action:** Always append `.AsSplitQuery()` when making multiple `.Include()` calls in EF Core to break the large joined query into separate, highly optimized queries for each collection.

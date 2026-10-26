## 2026-10-26 - [Cartesian Explosion via Multiple Includes in EF Core]
**Learning:** [Using multiple `.Include()` statements for one-to-many collections in EF Core causes Cartesian explosion, significantly degrading database performance due to massive cross-joins.]
**Action:** [Always use `.AsSplitQuery()` when fetching entities with multiple collection navigation properties to split the large query into smaller, efficient ones.]

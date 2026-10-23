## 2024-10-23 - [Entity Framework Cartesian Explosion]
**Learning:** Found massive Cartesian explosion risk in EF Core queries mapping `Stores` with multiple `.Include()` collections (Products, Categories, Orders, etc.) leading to severe memory and bandwidth bottlenecks.
**Action:** Use `.AsSplitQuery()` when fetching entities with multiple collection navigation properties to resolve EF Core Cartesian explosion.

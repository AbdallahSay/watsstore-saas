## 2025-02-18 - [Entity Framework Cartesian Explosion]
**Learning:** Using multiple `.Include()` statements on collection navigation properties in Entity Framework Core can cause a Cartesian explosion, leading to severe performance issues due to large data sets transferred from the database.
**Action:** Always use `.AsSplitQuery()` when including multiple collection navigation properties to split the query and avoid Cartesian explosion, improving database performance.

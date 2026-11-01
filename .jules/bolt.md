## 2026-11-01 - Cartesian Explosion in EF Core
**Learning:** Found an Entity Framework Core query that includes multiple collections (e.g. Products, Categories, Orders, Reviews, Coupons) but failed to use `.AsSplitQuery()`. This causes a Cartesian explosion due to massive JOIN statements, generating inefficient queries and excess memory usage.
**Action:** Always check for `Include()` statements that fetch multiple collection navigation properties. When such a query is found, apply `.AsSplitQuery()` to separate the queries and prevent data duplication in the result set.

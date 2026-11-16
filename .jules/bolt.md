## 2024-11-04 - EF Core Cartesian Explosion

**Learning:** When fetching an entity with multiple collection navigation properties using Entity Framework Core, omitting `.AsSplitQuery()` causes a Cartesian explosion during the database query. This can lead to severe performance degradation and excessive memory consumption due to the large amount of duplicated data returned by a single joined query.
**Action:** Always append `.AsSplitQuery()` when chaining multiple `.Include()` calls for collection navigation properties in EF Core to execute separate queries for each collection and prevent Cartesian explosions.

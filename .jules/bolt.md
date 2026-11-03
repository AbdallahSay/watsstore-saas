## 2024-05-24 - Entity Framework Cartesian Explosion
**Learning:** By default, when using `.Include()` with multiple collection navigation properties in Entity Framework Core, it generates a single JOIN query, causing a Cartesian explosion (multiplying rows), which can drastically increase memory and query execution time.
**Action:** Always append `.AsSplitQuery()` when eagerly loading multiple collections for a single entity in Entity Framework Core to force separate optimized SQL queries and prevent performance degradation.

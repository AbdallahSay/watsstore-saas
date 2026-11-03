## 2024-05-17 - Avoid Cartesian Explosion with Multi-collection Includes

**Learning:** When fetching an entity that eager-loads multiple collection navigation properties using multiple `.Include()` calls in Entity Framework Core, EF Core executes a single SQL query with multiple `JOIN`s, resulting in a Cartesian explosion. This multiplies the number of rows returned and significantly hurts performance.

**Action:** Always append `.AsSplitQuery()` to multi-collection include queries to split the single query into multiple separate SQL queries.


## 2024-10-24 - Prevent Cartesian Explosion with .AsSplitQuery()
**Learning:** When fetching entities in Entity Framework Core with multiple collection navigation properties using `.Include()`, EF Core generates a massive JOIN query. This leads to a "Cartesian explosion", multiplying the result set rows and causing severe database performance and memory issues, particularly for large payloads.
**Action:** Always append `.AsSplitQuery()` to EF Core LINQ queries when including more than one collection navigation property (like `Products`, `Categories`, `Orders` on a `Store` entity) to force EF Core to execute separate optimized SQL queries.

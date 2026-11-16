
## 2024-10-26 - Cartesian Explosion in EF Core
**Learning:** When using Entity Framework Core to fetch entities with multiple collection navigation properties (like `Store` having `Products`, `Categories`, `Orders`, etc.), it generates a massive SQL query joining all tables, returning duplicated row data (Cartesian explosion). This causes high memory overhead on both DB and App servers.
**Action:** Always use `.AsSplitQuery()` when making multiple `.Include()` calls on collection navigation properties in Entity Framework Core to prevent Cartesian explosion and significantly improve backend database performance.

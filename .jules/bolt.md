## 2024-03-12 - Cartesian Explosion in EF Core with Multiple Includes
**Learning:** When using Entity Framework Core, fetching entities with multiple collection navigation properties via `.Include()` can cause a Cartesian explosion, resulting in massive, slow database queries and high memory/CPU usage on the server.
**Action:** Always append `.AsSplitQuery()` to queries that include multiple collections. This instructs EF Core to fetch each collection in a separate SQL query, avoiding the Cartesian join and drastically improving performance.

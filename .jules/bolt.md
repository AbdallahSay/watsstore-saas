## 2024-06-11 - Optimize EF Core queries fetching multiple collection properties
**Learning:** Using multiple `.Include()` statements in EF Core to fetch entities with their collection navigation properties leads to Cartesian explosion (e.g. `Store` with `Products`, `Categories`, `Orders`, etc.).
**Action:** Use `.AsSplitQuery()` to prevent Cartesian explosion when performing operations that require loading multiple collections from the database.

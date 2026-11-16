## 2024-05-15 - [Optimize bulk delete with ExecuteDeleteAsync]
**Learning:** [When deleting entities with cascading relationships in EF Core 8, fetching all child entities into memory (using Include) before calling RemoveRange causes severe memory/CPU bloat (Cartesian explosion).]
**Action:** [Use `.ExecuteDeleteAsync()` to directly issue a DELETE command to the database without loading entities into memory, relying on the database's ON DELETE CASCADE configuration.]

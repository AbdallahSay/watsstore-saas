## 2024-11-20 - EF Core Multiple Includes Cartesian Explosion
**Learning:** Using multiple `.Include()` statements on collection navigation properties in this EF Core 8 backend generates massive, inefficient SQL queries due to Cartesian explosion. The problem multiplies with each additional collection.
**Action:** Always append `.AsSplitQuery()` when eagerly loading two or more collections for the same entity to split them into separate queries, reducing data duplication and memory/processing overhead.

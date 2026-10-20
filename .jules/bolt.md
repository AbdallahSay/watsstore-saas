## 2024-03-24 - [Backend Cartesian Explosion]
**Learning:** [EF Core naturally generates a massive single SQL query with LEFT JOINs when querying multiple related collections via `.Include()`, resulting in severe Cartesian explosion and heavy database load. This is specifically prominent in stores that have Products, Categories, Orders, etc.]
**Action:** [When fetching entities with multiple collection navigations, always consider appending `.AsSplitQuery()` to decompose the query into separate optimized ones to drastically enhance execution latency and memory safety.]


## 2024-05-24 - Bulk Delete with EF Core ExecuteDeleteAsync
**Learning:** When performing cascading deletions in EF Core, bringing an entire object graph into memory with `.Include()` and using `.RemoveRange()` causes Cartesian explosions and generates individual `DELETE` statements. Using `ExecuteDeleteAsync()` provides massive performance gains by executing bulk deletes directly in SQL without loading entities.
**Action:** Replace `Include` chains and `RemoveRange` loops with `ExecuteDeleteAsync()` for bulk entity deletion scenarios. Ensure these are wrapped in an explicit `BeginTransactionAsync()` block to preserve atomicity that `SaveChangesAsync()` previously provided implicitly.

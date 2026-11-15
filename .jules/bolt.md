## 2024-05-24 - Bulk Deletes Require Explicit Transactions
**Learning:** While `ExecuteDeleteAsync` bypasses memory overhead to drastically speed up deletions, calling it multiple times consecutively removes the implicit transactional safety provided by `SaveChangesAsync`.
**Action:** When replacing `RemoveRange` + `SaveChangesAsync` with multiple `ExecuteDeleteAsync` calls, always manually wrap the calls in a database transaction (`await _db.Database.BeginTransactionAsync()`).

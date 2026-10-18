using System;
using System.Collections.Generic;

namespace WatsStore.Api.Domain.Entities
{
    public class Category
    {
        public int Id { get; set; }
        public Guid StoreId { get; set; }
        public string Name { get; set; } = string.Empty;
        public int SortOrder { get; set; } = 0;
        public bool IsActive { get; set; } = true;

        // Navigation
        public Store? Store { get; set; }
        public ICollection<Product> Products { get; set; } = new List<Product>();
    }
}

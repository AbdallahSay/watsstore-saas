using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using WatsStore.Api.Domain.Entities;
using WatsStore.Api.DTOs;
using WatsStore.Api.Infrastructure.Data;
using WatsStore.Api.Infrastructure.Utils;

namespace WatsStore.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class MerchantDashboardController : ControllerBase
    {
        private readonly AppDbContext _db;

        public MerchantDashboardController(AppDbContext db)
        {
            _db = db;
        }

        private Guid GetAuthenticatedStoreId()
        {
            var storeIdClaim = User.FindFirst("storeId")?.Value 
                               ?? User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            if (Guid.TryParse(storeIdClaim, out var storeId))
                return storeId;

            throw new UnauthorizedAccessException("معرف المتجر غير صالح في رمز المصادقة");
        }

        [HttpGet("summary")]
        public async Task<IActionResult> GetSummary()
        {
            var storeId = GetAuthenticatedStoreId();

            var store = await _db.Stores
                .AsNoTracking()
                .FirstOrDefaultAsync(s => s.Id == storeId);

            if (store == null)
                return NotFound(new { message = "المتجر غير موجود" });

            var totalProducts = await _db.Products
                .CountAsync(p => p.StoreId == storeId);

            var totalOrders = await _db.WhatsAppOrders
                .CountAsync(o => o.StoreId == storeId);

            var totalRevenue = await _db.WhatsAppOrders
                .Where(o => o.StoreId == storeId)
                .SumAsync(o => o.TotalAmount);

            var recentOrders = await _db.WhatsAppOrders
                .Where(o => o.StoreId == storeId)
                .OrderByDescending(o => o.CreatedAt)
                .Take(20)
                .Select(o => new OrderDto
                {
                    Id = o.Id,
                    OrderNumber = o.OrderNumber,
                    CustomerName = o.CustomerName,
                    CustomerPhone = o.CustomerPhone,
                    CustomerAddress = o.CustomerAddress,
                    CustomerNotes = o.CustomerNotes,
                    ItemsJson = o.ItemsJson,
                    TotalAmount = o.TotalAmount,
                    CreatedAt = o.CreatedAt
                })
                .ToListAsync();

            var response = new DashboardSummaryResponse
            {
                TotalProducts = totalProducts,
                TotalOrders = totalOrders,
                TotalRevenue = totalRevenue,
                StoreInfo = new StoreProfileDto
                {
                    Id = store.Id,
                    StoreName = store.StoreName,
                    OwnerName = store.OwnerName,
                    Email = store.Email,
                    Slug = store.Slug,
                    PublicCode = store.PublicCode,
                    WhatsAppNumber = store.WhatsAppNumber,
                    BusinessCategory = store.BusinessCategory,
                    City = store.City,
                    AddressDetails = store.AddressDetails,
                    LogoUrl = store.LogoUrl,
                    CoverUrl = store.CoverUrl,
                    ThemeColor = store.ThemeColor,
                    Currency = store.Currency,
                    DeliveryFee = store.DeliveryFee,
                    SeoTitle = store.SeoTitle,
                    SeoDescription = store.SeoDescription,
                    MetaPixelId = store.MetaPixelId,
                    PlanType = store.PlanType,
                    IsActive = store.IsActive,
                    CreatedAt = store.CreatedAt
                },
                RecentOrders = recentOrders
            };

            return Ok(response);
        }

        [HttpPut("settings")]
        public async Task<IActionResult> UpdateSettings([FromBody] UpdateStoreSettingsRequest request)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var storeId = GetAuthenticatedStoreId();
            var store = await _db.Stores.FirstOrDefaultAsync(s => s.Id == storeId);
            if (store == null)
                return NotFound(new { message = "المتجر غير موجود" });

            store.StoreName = request.StoreName.Trim();
            store.WhatsAppNumber = SlugGenerator.NormalizeEgyptianPhone(request.WhatsAppNumber);
            store.BusinessCategory = request.BusinessCategory.Trim();
            store.City = request.City.Trim();
            store.AddressDetails = request.AddressDetails;
            store.LogoUrl = request.LogoUrl;
            store.CoverUrl = request.CoverUrl;
            store.ThemeColor = string.IsNullOrWhiteSpace(request.ThemeColor) ? "#10B981" : request.ThemeColor;
            store.Currency = string.IsNullOrWhiteSpace(request.Currency) ? "ج.م" : request.Currency;
            store.DeliveryFee = request.DeliveryFee < 0 ? 0 : request.DeliveryFee;
            store.SeoTitle = request.SeoTitle;
            store.SeoDescription = request.SeoDescription;

            // Only allow MetaPixelId to be saved (and active) for merchants
            store.MetaPixelId = string.IsNullOrWhiteSpace(request.MetaPixelId) ? null : request.MetaPixelId.Trim();

            await _db.SaveChangesAsync();

            return Ok(new { message = "تم حفظ الإعدادات بنجاح", store });
        }

        // CATEGORIES CRUD
        [HttpGet("categories")]
        public async Task<IActionResult> GetCategories()
        {
            var storeId = GetAuthenticatedStoreId();
            var categories = await _db.Categories
                .Where(c => c.StoreId == storeId)
                .OrderBy(c => c.SortOrder)
                .Select(c => new CategoryDto
                {
                    Id = c.Id,
                    Name = c.Name,
                    SortOrder = c.SortOrder,
                    IsActive = c.IsActive,
                    ProductCount = c.Products.Count
                })
                .ToListAsync();

            return Ok(categories);
        }

        [HttpPost("categories")]
        public async Task<IActionResult> CreateCategory([FromBody] CategoryCreateUpdateRequest request)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var storeId = GetAuthenticatedStoreId();
            var category = new Category
            {
                StoreId = storeId,
                Name = request.Name.Trim(),
                SortOrder = request.SortOrder,
                IsActive = request.IsActive
            };

            _db.Categories.Add(category);
            await _db.SaveChangesAsync();

            return Ok(new CategoryDto
            {
                Id = category.Id,
                Name = category.Name,
                SortOrder = category.SortOrder,
                IsActive = category.IsActive,
                ProductCount = 0
            });
        }

        [HttpPut("categories/{id:int}")]
        public async Task<IActionResult> UpdateCategory(int id, [FromBody] CategoryCreateUpdateRequest request)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var storeId = GetAuthenticatedStoreId();
            var category = await _db.Categories
                .FirstOrDefaultAsync(c => c.Id == id && c.StoreId == storeId);

            if (category == null)
                return NotFound(new { message = "القسم غير موجود" });

            category.Name = request.Name.Trim();
            category.SortOrder = request.SortOrder;
            category.IsActive = request.IsActive;

            await _db.SaveChangesAsync();

            return Ok(new CategoryDto
            {
                Id = category.Id,
                Name = category.Name,
                SortOrder = category.SortOrder,
                IsActive = category.IsActive
            });
        }

        [HttpDelete("categories/{id:int}")]
        public async Task<IActionResult> DeleteCategory(int id)
        {
            var storeId = GetAuthenticatedStoreId();
            var category = await _db.Categories
                .FirstOrDefaultAsync(c => c.Id == id && c.StoreId == storeId);

            if (category == null)
                return NotFound(new { message = "القسم غير موجود" });

            _db.Categories.Remove(category);
            await _db.SaveChangesAsync();

            return Ok(new { message = "تم حذف القسم بنجاح" });
        }

        // PRODUCTS CRUD
        [HttpGet("products")]
        public async Task<IActionResult> GetProducts()
        {
            var storeId = GetAuthenticatedStoreId();
            var products = await _db.Products
                .Include(p => p.Category)
                .Where(p => p.StoreId == storeId)
                .OrderBy(p => p.SortOrder)
                .ThenByDescending(p => p.CreatedAt)
                .Select(p => new ProductDto
                {
                    Id = p.Id,
                    Name = p.Name,
                    Slug = p.Slug,
                    CategoryId = p.CategoryId,
                    CategoryName = p.Category != null ? p.Category.Name : null,
                    Description = p.Description,
                    Price = p.Price,
                    CompareAtPrice = p.CompareAtPrice,
                    ImageUrl = p.ImageUrl,
                    VariantsJson = p.VariantsJson,
                    IsAvailable = p.IsAvailable,
                    SortOrder = p.SortOrder,
                    CreatedAt = p.CreatedAt
                })
                .ToListAsync();

            return Ok(products);
        }

        [HttpPost("products")]
        public async Task<IActionResult> CreateProduct([FromBody] ProductCreateUpdateRequest request)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var storeId = GetAuthenticatedStoreId();

            if (request.CategoryId.HasValue)
            {
                var categoryExists = await _db.Categories
                    .AnyAsync(c => c.Id == request.CategoryId.Value && c.StoreId == storeId);
                if (!categoryExists)
                    return BadRequest(new { message = "القسم المحدد غير موجود" });
            }

            var baseSlug = SlugGenerator.GenerateSlug(request.Name);
            var slug = $"{baseSlug}-{Guid.NewGuid():N}"[..Math.Min(80, baseSlug.Length + 9)];

            var product = new Product
            {
                Id = Guid.NewGuid(),
                StoreId = storeId,
                CategoryId = request.CategoryId,
                Name = request.Name.Trim(),
                Slug = slug,
                Description = request.Description,
                Price = request.Price,
                CompareAtPrice = request.CompareAtPrice,
                ImageUrl = request.ImageUrl,
                VariantsJson = request.VariantsJson,
                IsAvailable = request.IsAvailable,
                SortOrder = request.SortOrder,
                CreatedAt = DateTime.UtcNow
            };

            _db.Products.Add(product);
            await _db.SaveChangesAsync();

            return Ok(product);
        }

        [HttpPut("products/{id:guid}")]
        public async Task<IActionResult> UpdateProduct(Guid id, [FromBody] ProductCreateUpdateRequest request)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var storeId = GetAuthenticatedStoreId();
            var product = await _db.Products
                .FirstOrDefaultAsync(p => p.Id == id && p.StoreId == storeId);

            if (product == null)
                return NotFound(new { message = "المنتج غير موجود" });

            if (request.CategoryId.HasValue)
            {
                var categoryExists = await _db.Categories
                    .AnyAsync(c => c.Id == request.CategoryId.Value && c.StoreId == storeId);
                if (!categoryExists)
                    return BadRequest(new { message = "القسم المحدد غير موجود" });
            }

            product.Name = request.Name.Trim();
            product.CategoryId = request.CategoryId;
            product.Description = request.Description;
            product.Price = request.Price;
            product.CompareAtPrice = request.CompareAtPrice;
            product.ImageUrl = request.ImageUrl;
            product.VariantsJson = request.VariantsJson;
            product.IsAvailable = request.IsAvailable;
            product.SortOrder = request.SortOrder;

            await _db.SaveChangesAsync();

            return Ok(product);
        }

        [HttpDelete("products/{id:guid}")]
        public async Task<IActionResult> DeleteProduct(Guid id)
        {
            var storeId = GetAuthenticatedStoreId();
            var product = await _db.Products
                .FirstOrDefaultAsync(p => p.Id == id && p.StoreId == storeId);

            if (product == null)
                return NotFound(new { message = "المنتج غير موجود" });

            _db.Products.Remove(product);
            await _db.SaveChangesAsync();

            return Ok(new { message = "تم حذف المنتج بنجاح" });
        }
    }
}

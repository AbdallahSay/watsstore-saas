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
using System.Text;

namespace WatsStore.Api.Controllers
{
    [ApiController]
    [Route("api/merchant")]
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
            if (User?.Identity?.IsAuthenticated != true)
            {
                throw new UnauthorizedAccessException("غير مصرح لك بالوصول. يرجى تسجيل الدخول كتاجر.");
            }

            // An admin token without explicit storeId cannot access merchant endpoints
            if (User.IsInRole("Admin") || User.HasClaim(c => c.Type == "role" && c.Value == "Admin"))
            {
                var adminStoreClaim = User.FindFirst("storeId")?.Value;
                if (!Guid.TryParse(adminStoreClaim, out var adminStoreId))
                {
                    throw new UnauthorizedAccessException("غير مصرح لمدير النظام بدخول لوحة المتجر بدون تحديد معرف المتجر.");
                }
                return adminStoreId;
            }

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
                    PaymentMethod = o.PaymentMethod,
                    ItemsJson = o.ItemsJson,
                    TotalAmount = o.TotalAmount,
                    CreatedAt = o.CreatedAt
                })
                .ToListAsync();

            var isTrialExpired = store.IsTrialExpired();
            var remainingDays = store.GetRemainingTrialDays();
            var trialEndsAt = store.GetEffectiveTrialOrSubscriptionEndsAt();

            var prevReset = store.AiQuotaResetDate;
            store.CheckAndResetMonthlyAiQuota();
            if (store.AiQuotaResetDate != prevReset)
            {
                await _db.SaveChangesAsync();
            }

            var aiUsed = store.AiGenerationsCount;
            var aiLimit = store.GetAiGenerationsLimit();
            var aiRemaining = Math.Max(0, aiLimit - aiUsed);

            var response = new DashboardSummaryResponse
            {
                TotalProducts = totalProducts,
                TotalOrders = totalOrders,
                TotalRevenue = totalRevenue,
                IsTrialExpired = isTrialExpired,
                RemainingTrialDays = remainingDays,
                TrialEndsAt = trialEndsAt,
                AiGenerationsUsed = aiUsed,
                AiGenerationsLimit = aiLimit,
                RemainingAiQuota = aiRemaining,
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
                    VodafoneCashNumber = store.VodafoneCashNumber,
                    InstaPayAddress = store.InstaPayAddress,
                    PlanType = store.PlanType,
                    IsActive = store.IsActive,
                    IsTrialExpired = isTrialExpired,
                    RemainingTrialDays = remainingDays,
                    TrialEndsAt = trialEndsAt,
                    AiGenerationsUsed = aiUsed,
                    AiGenerationsLimit = aiLimit,
                    RemainingAiQuota = aiRemaining,
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

            // Electronic Wallet & InstaPay
            store.VodafoneCashNumber = string.IsNullOrWhiteSpace(request.VodafoneCashNumber) ? null : request.VodafoneCashNumber.Trim();
            store.InstaPayAddress = string.IsNullOrWhiteSpace(request.InstaPayAddress) ? null : request.InstaPayAddress.Trim();

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

        [HttpGet("categories/{id:int}")]
        public async Task<IActionResult> GetCategoryById(int id)
        {
            var storeId = GetAuthenticatedStoreId();
            var category = await _db.Categories
                .Where(c => c.Id == id && c.StoreId == storeId)
                .Select(c => new CategoryDto
                {
                    Id = c.Id,
                    Name = c.Name,
                    SortOrder = c.SortOrder,
                    IsActive = c.IsActive,
                    ProductCount = c.Products.Count
                })
                .FirstOrDefaultAsync();

            if (category == null)
            {
                var existsInDb = await _db.Categories.AnyAsync(c => c.Id == id);
                if (existsInDb)
                {
                    return StatusCode(StatusCodes.Status403Forbidden, new { message = "غير مصرح لك بالاطلاع على قسم يتبع متجراً آخر." });
                }
                return NotFound(new { message = "القسم غير موجود" });
            }

            return Ok(category);
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
            {
                var existsInDb = await _db.Categories.AnyAsync(c => c.Id == id);
                if (existsInDb)
                {
                    return StatusCode(StatusCodes.Status403Forbidden, new { message = "غير مصرح لك بتعديل قسم يتبع متجراً آخر." });
                }
                return NotFound(new { message = "القسم غير موجود" });
            }

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
            {
                var existsInDb = await _db.Categories.AnyAsync(c => c.Id == id);
                if (existsInDb)
                {
                    return StatusCode(StatusCodes.Status403Forbidden, new { message = "غير مصرح لك بحذف قسم يتبع متجراً آخر." });
                }
                return NotFound(new { message = "القسم غير موجود" });
            }

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

            var store = await _db.Stores.FirstOrDefaultAsync(s => s.Id == storeId);
            if (store == null)
                return NotFound(new { message = "المتجر غير موجود" });

            if (store.IsTrialExpired())
            {
                return StatusCode(StatusCodes.Status403Forbidden, new { isTrialExpired = true, message = "انتهت فترتك التجريبية المجانية (14 يوماً). يرجى ترقية باقتك إلى Pro أو VIP للاستمرار في إضافة المنتجات وإدارة متجرك." });
            }

            // Enforce Plan Quota on Products
            var currentProductCount = await _db.Products.CountAsync(p => p.StoreId == storeId);

            if (string.Equals(store.PlanType, "Free", StringComparison.OrdinalIgnoreCase))
            {
                if (currentProductCount >= 10)
                {
                    return StatusCode(StatusCodes.Status403Forbidden, new { 
                        isQuotaExceeded = true, 
                        message = "لقد وصلت للحد الأقصى لعدد المنتجات في الباقة المجانية (10 منتجات). يرجى ترقية باقتك إلى Pro أو VIP لإضافة المزيد." 
                    });
                }
            }
            else if (string.Equals(store.PlanType, "Pro", StringComparison.OrdinalIgnoreCase))
            {
                if (currentProductCount >= 100)
                {
                    return StatusCode(StatusCodes.Status403Forbidden, new { 
                        isQuotaExceeded = true, 
                        message = "لقد وصلت للحد الأقصى لعدد المنتجات في باقة Pro (100 منتج). يرجى ترقية باقتك إلى VIP لإضافة منتجات غير محدودة." 
                    });
                }
            }

            if (request.Price <= 0)
            {
                return BadRequest(new { message = "سعر المنتج يجب أن يكون أكبر من صفر" });
            }

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

            return Ok(new ProductDto
            {
                Id = product.Id,
                Name = product.Name,
                Slug = product.Slug,
                CategoryId = product.CategoryId,
                Description = product.Description,
                Price = product.Price,
                CompareAtPrice = product.CompareAtPrice,
                ImageUrl = product.ImageUrl,
                VariantsJson = product.VariantsJson,
                IsAvailable = product.IsAvailable,
                SortOrder = product.SortOrder,
                CreatedAt = product.CreatedAt
            });
        }

        [HttpGet("products/{id:guid}")]
        public async Task<IActionResult> GetProductById(Guid id)
        {
            var storeId = GetAuthenticatedStoreId();
            var product = await _db.Products
                .Include(p => p.Category)
                .Where(p => p.Id == id && p.StoreId == storeId)
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
                .FirstOrDefaultAsync();

            if (product == null)
            {
                var existsInDb = await _db.Products.AnyAsync(p => p.Id == id);
                if (existsInDb)
                {
                    return StatusCode(StatusCodes.Status403Forbidden, new { message = "غير مصرح لك بالاطلاع على منتج يتبع متجراً آخر." });
                }
                return NotFound(new { message = "المنتج غير موجود" });
            }

            return Ok(product);
        }

        [HttpPatch("products/{id:guid}/availability")]
        [HttpPut("products/{id:guid}/toggle-availability")]
        public async Task<IActionResult> ToggleProductAvailability(Guid id)
        {
            var storeId = GetAuthenticatedStoreId();
            var product = await _db.Products
                .FirstOrDefaultAsync(p => p.Id == id && p.StoreId == storeId);

            if (product == null)
            {
                var existsInDb = await _db.Products.AnyAsync(p => p.Id == id);
                if (existsInDb)
                {
                    return StatusCode(StatusCodes.Status403Forbidden, new { message = "غير مصرح لك بتعديل حالة توفر منتج يتبع متجراً آخر." });
                }
                return NotFound(new { message = "المنتج غير موجود" });
            }

            product.IsAvailable = !product.IsAvailable;
            await _db.SaveChangesAsync();

            return Ok(new
            {
                id = product.Id,
                isAvailable = product.IsAvailable,
                message = product.IsAvailable ? "تم تفعيل المنتج وتوفيره في المتجر بنجاح" : "تم إيقاف توفير المنتج مؤقتاً"
            });
        }

        [HttpPut("products/{id:guid}")]
        public async Task<IActionResult> UpdateProduct(Guid id, [FromBody] ProductCreateUpdateRequest request)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var storeId = GetAuthenticatedStoreId();
            var store = await _db.Stores.FirstOrDefaultAsync(s => s.Id == storeId);
            if (store == null)
                return NotFound(new { message = "المتجر غير موجود" });

            if (store.IsTrialExpired())
            {
                return StatusCode(StatusCodes.Status403Forbidden, new { isTrialExpired = true, message = "انتهت فترتك التجريبية المجانية (14 يوماً). يرجى ترقية باقتك إلى Pro أو VIP للاستمرار في تعديل المنتجات وإدارة متجرك." });
            }

            var product = await _db.Products
                .FirstOrDefaultAsync(p => p.Id == id && p.StoreId == storeId);

            if (product == null)
            {
                var existsInDb = await _db.Products.AnyAsync(p => p.Id == id);
                if (existsInDb)
                {
                    return StatusCode(StatusCodes.Status403Forbidden, new { message = "غير مصرح لك بتعديل منتج يتبع متجراً آخر." });
                }
                return NotFound(new { message = "المنتج غير موجود" });
            }

            if (request.Price <= 0)
            {
                return BadRequest(new { message = "سعر المنتج يجب أن يكون أكبر من صفر" });
            }

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

            return Ok(new ProductDto
            {
                Id = product.Id,
                Name = product.Name,
                Slug = product.Slug,
                CategoryId = product.CategoryId,
                Description = product.Description,
                Price = product.Price,
                CompareAtPrice = product.CompareAtPrice,
                ImageUrl = product.ImageUrl,
                VariantsJson = product.VariantsJson,
                IsAvailable = product.IsAvailable,
                SortOrder = product.SortOrder,
                CreatedAt = product.CreatedAt
            });
        }

        [HttpDelete("products/{id:guid}")]
        public async Task<IActionResult> DeleteProduct(Guid id)
        {
            var storeId = GetAuthenticatedStoreId();
            var product = await _db.Products
                .FirstOrDefaultAsync(p => p.Id == id && p.StoreId == storeId);

            if (product == null)
            {
                var existsInDb = await _db.Products.AnyAsync(p => p.Id == id);
                if (existsInDb)
                {
                    return StatusCode(StatusCodes.Status403Forbidden, new { message = "غير مصرح لك بحذف منتج يتبع متجراً آخر." });
                }
                return NotFound(new { message = "المنتج غير موجود" });
            }

            _db.Products.Remove(product);
            await _db.SaveChangesAsync();

            return Ok(new { message = "تم حذف المنتج بنجاح" });
        }

        [HttpGet("orders")]
        public async Task<IActionResult> GetOrders([FromQuery] int page = 1, [FromQuery] int pageSize = 50)
        {
            var storeId = GetAuthenticatedStoreId();

            var query = _db.WhatsAppOrders
                .AsNoTracking()
                .Where(o => o.StoreId == storeId)
                .OrderByDescending(o => o.CreatedAt);

            var total = await query.CountAsync();
            var orders = await query
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(o => new OrderDto
                {
                    Id = o.Id,
                    OrderNumber = o.OrderNumber,
                    CustomerName = o.CustomerName,
                    CustomerPhone = o.CustomerPhone,
                    CustomerAddress = o.CustomerAddress,
                    CustomerNotes = o.CustomerNotes,
                    PaymentMethod = o.PaymentMethod,
                    ItemsJson = o.ItemsJson,
                    TotalAmount = o.TotalAmount,
                    CreatedAt = o.CreatedAt
                })
                .ToListAsync();

            return Ok(new
            {
                total,
                page,
                pageSize,
                orders
            });
        }

        [HttpGet("orders/{id:guid}")]
        public async Task<IActionResult> GetOrderById(Guid id)
        {
            var storeId = GetAuthenticatedStoreId();
            var order = await _db.WhatsAppOrders
                .AsNoTracking()
                .Where(o => o.Id == id && o.StoreId == storeId)
                .Select(o => new OrderDto
                {
                    Id = o.Id,
                    OrderNumber = o.OrderNumber,
                    CustomerName = o.CustomerName,
                    CustomerPhone = o.CustomerPhone,
                    CustomerAddress = o.CustomerAddress,
                    CustomerNotes = o.CustomerNotes,
                    PaymentMethod = o.PaymentMethod,
                    ItemsJson = o.ItemsJson,
                    TotalAmount = o.TotalAmount,
                    CreatedAt = o.CreatedAt
                })
                .FirstOrDefaultAsync();

            if (order == null)
            {
                var existsInDb = await _db.WhatsAppOrders.AnyAsync(o => o.Id == id);
                if (existsInDb)
                {
                    return StatusCode(StatusCodes.Status403Forbidden, new { message = "غير مصرح لك بالاطلاع على تفاصيل طلب يتبع متجراً آخر." });
                }
                return NotFound(new { message = "الطلب غير موجود" });
            }

            return Ok(order);
        }

        [HttpGet("orders/export")]
        public async Task<IActionResult> ExportOrdersCsv()
        {
            var storeId = GetAuthenticatedStoreId();
            var store = await _db.Stores.AsNoTracking().FirstOrDefaultAsync(s => s.Id == storeId);
            if (store == null)
                return NotFound(new { message = "المتجر غير موجود" });

            if (string.Equals(store.PlanType, "Free", StringComparison.OrdinalIgnoreCase))
            {
                return StatusCode(StatusCodes.Status403Forbidden, new { 
                    isQuotaExceeded = true, 
                    message = "ميزة تصدير الطلبات إلى ملف Excel متاحة فقط في باقات Pro و VIP. رقِّ باقتك الآن للوصول الكامل لبيانات وتقارير مبيعاتك!" 
                });
            }

            var orders = await _db.WhatsAppOrders
                .AsNoTracking()
                .Where(o => o.StoreId == storeId)
                .OrderByDescending(o => o.CreatedAt)
                .ToListAsync();

            var sb = new StringBuilder();

            // UTF-8 BOM so Microsoft Excel opens Arabic text correctly without encoding artifacts
            sb.Append('\uFEFF');

            // Arabic CSV Headers
            sb.AppendLine("رقم الطلب,اسم العميل,رقم الهاتف,العنوان,طريقة الدفع,المبلغ الإجمالي (ج.م),تاريخ الطلب,ملاحظات");

            foreach (var o in orders)
            {
                var orderNum = o.OrderNumber;
                var name = EscapeCsv(o.CustomerName);
                var phone = EscapeCsv(o.CustomerPhone);
                var address = EscapeCsv(o.CustomerAddress);
                var paymentMethod = EscapeCsv(string.IsNullOrEmpty(o.PaymentMethod) ? "الدفع عند الاستلام" : o.PaymentMethod);
                var total = o.TotalAmount.ToString("F2", System.Globalization.CultureInfo.InvariantCulture);
                var date = o.CreatedAt.ToString("yyyy-MM-dd HH:mm", System.Globalization.CultureInfo.InvariantCulture);
                var notes = EscapeCsv(o.CustomerNotes ?? "");

                sb.AppendLine($"{orderNum},{name},{phone},{address},{paymentMethod},{total},{date},{notes}");
            }

            var bytes = Encoding.UTF8.GetBytes(sb.ToString());
            var fileName = $"watsstore-orders-{DateTime.UtcNow:yyyyMMdd-HHmm}.csv";

            return File(bytes, "text/csv; charset=utf-8", fileName);
        }

        private static string EscapeCsv(string value)
        {
            if (string.IsNullOrEmpty(value)) return "\"\"";
            var clean = value.Replace("\r", " ").Replace("\n", " ").Replace("\"", "\"\"");
            return $"\"{clean}\"";
        }

        [HttpGet("reviews")]
        public async Task<IActionResult> GetReviews()
        {
            var storeId = GetAuthenticatedStoreId();

            var reviews = await _db.StoreReviews
                .AsNoTracking()
                .Where(r => r.StoreId == storeId)
                .OrderByDescending(r => r.CreatedAt)
                .Select(r => new MerchantReviewDto
                {
                    Id = r.Id,
                    StoreId = r.StoreId,
                    CustomerName = r.CustomerName,
                    Rating = r.Rating,
                    Comment = r.Comment,
                    IsApproved = r.IsApproved,
                    CreatedAt = r.CreatedAt
                })
                .ToListAsync();

            var totalCount = reviews.Count;
            var approvedCount = reviews.Count(r => r.IsApproved);
            var pendingCount = totalCount - approvedCount;
            var averageRating = approvedCount > 0 
                ? Math.Round(reviews.Where(r => r.IsApproved).Average(r => (double)r.Rating), 1)
                : (totalCount > 0 ? Math.Round(reviews.Average(r => (double)r.Rating), 1) : 5.0);

            return Ok(new MerchantReviewsResponse
            {
                TotalCount = totalCount,
                ApprovedCount = approvedCount,
                PendingCount = pendingCount,
                AverageRating = averageRating,
                Reviews = reviews
            });
        }

        [HttpPatch("reviews/{id}/approve")]
        public async Task<IActionResult> ToggleReviewApproval(Guid id, [FromBody] ReviewApprovalRequest? request)
        {
            var storeId = GetAuthenticatedStoreId();

            var review = await _db.StoreReviews
                .FirstOrDefaultAsync(r => r.Id == id && r.StoreId == storeId);

            if (review == null)
            {
                var existsInDb = await _db.StoreReviews.AnyAsync(r => r.Id == id);
                if (existsInDb)
                {
                    return StatusCode(StatusCodes.Status403Forbidden, new { message = "غير مصرح لك باعتماد تقييم يتبع متجراً آخر." });
                }
                return NotFound(new { message = "التقييم غير موجود" });
            }

            if (request != null)
            {
                review.IsApproved = request.IsApproved;
            }
            else
            {
                review.IsApproved = !review.IsApproved;
            }

            await _db.SaveChangesAsync();

            return Ok(new 
            { 
                message = review.IsApproved ? "تم اعتماد ونشر التقييم بنجاح" : "تم إخفاء التقييم ونقله للمراجعة",
                isApproved = review.IsApproved 
            });
        }

        [HttpDelete("reviews/{id}")]
        public async Task<IActionResult> DeleteReview(Guid id)
        {
            var storeId = GetAuthenticatedStoreId();

            var review = await _db.StoreReviews
                .FirstOrDefaultAsync(r => r.Id == id && r.StoreId == storeId);

            if (review == null)
            {
                var existsInDb = await _db.StoreReviews.AnyAsync(r => r.Id == id);
                if (existsInDb)
                {
                    return StatusCode(StatusCodes.Status403Forbidden, new { message = "غير مصرح لك بحذف تقييم يتبع متجراً آخر." });
                }
                return NotFound(new { message = "التقييم غير موجود" });
            }

            _db.StoreReviews.Remove(review);
            await _db.SaveChangesAsync();

            return Ok(new { message = "تم حذف التقييم بنجاح" });
        }

        // --- COUPONS MANAGEMENT ---

        [HttpGet("coupons")]
        public async Task<IActionResult> GetCoupons()
        {
            var storeId = GetAuthenticatedStoreId();

            var coupons = await _db.StoreCoupons
                .AsNoTracking()
                .Where(c => c.StoreId == storeId)
                .OrderByDescending(c => c.CreatedAt)
                .Select(c => new CouponDto
                {
                    Id = c.Id,
                    StoreId = c.StoreId,
                    Code = c.Code,
                    DiscountType = c.DiscountType,
                    DiscountValue = c.DiscountValue,
                    ExpiryDate = c.ExpiryDate,
                    UsageLimit = c.UsageLimit,
                    TimesUsed = c.TimesUsed,
                    IsActive = c.IsActive,
                    CreatedAt = c.CreatedAt
                })
                .ToListAsync();

            return Ok(coupons);
        }

        [HttpGet("coupons/{id:guid}")]
        public async Task<IActionResult> GetCouponById(Guid id)
        {
            var storeId = GetAuthenticatedStoreId();

            var coupon = await _db.StoreCoupons
                .AsNoTracking()
                .Where(c => c.Id == id && c.StoreId == storeId)
                .Select(c => new CouponDto
                {
                    Id = c.Id,
                    StoreId = c.StoreId,
                    Code = c.Code,
                    DiscountType = c.DiscountType,
                    DiscountValue = c.DiscountValue,
                    ExpiryDate = c.ExpiryDate,
                    UsageLimit = c.UsageLimit,
                    TimesUsed = c.TimesUsed,
                    IsActive = c.IsActive,
                    CreatedAt = c.CreatedAt
                })
                .FirstOrDefaultAsync();

            if (coupon == null)
            {
                var existsInDb = await _db.StoreCoupons.AnyAsync(c => c.Id == id);
                if (existsInDb)
                {
                    return StatusCode(StatusCodes.Status403Forbidden, new { message = "غير مصرح لك بالاطلاع على كود خصم يتبع متجراً آخر." });
                }
                return NotFound(new { message = "كود الخصم غير موجود" });
            }

            return Ok(coupon);
        }

        [HttpPost("coupons")]
        public async Task<IActionResult> CreateCoupon([FromBody] CreateCouponRequest request)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var code = request.Code.Trim().ToUpperInvariant();

            var discountType = string.Equals(request.DiscountType, "FixedAmount", StringComparison.OrdinalIgnoreCase) 
                ? "FixedAmount" 
                : "Percentage";

            if (request.DiscountValue <= 0)
            {
                return BadRequest(new { message = "قيمة الخصم يجب أن تكون أكبر من صفر" });
            }

            if (discountType == "Percentage" && (request.DiscountValue > 100 || request.DiscountValue < 1))
            {
                return BadRequest(new { message = "نسبة الخصم المئوية يجب أن تكون بين 1% و 100%" });
            }

            var storeId = GetAuthenticatedStoreId();
            var store = await _db.Stores.FirstOrDefaultAsync(s => s.Id == storeId);
            if (store == null)
                return NotFound(new { message = "المتجر غير موجود" });

            if (store.IsTrialExpired())
            {
                return StatusCode(StatusCodes.Status403Forbidden, new { isTrialExpired = true, message = "انتهت فترتك التجريبية المجانية (14 يوماً). يرجى ترقية باقتك إلى Pro أو VIP للاستمرار في إنشاء كوبونات الخصم وإدارة متجرك." });
            }

            // Enforce Plan Quota on Coupons
            var activeCouponsCount = await _db.StoreCoupons.CountAsync(c => c.StoreId == storeId && c.IsActive);
            if (string.Equals(store.PlanType, "Free", StringComparison.OrdinalIgnoreCase))
            {
                if (activeCouponsCount >= 1)
                {
                    return StatusCode(StatusCodes.Status403Forbidden, new { 
                        isQuotaExceeded = true, 
                        message = "لقد وصلت للحد الأقصى لعدد كوبونات الخصم في الباقة المجانية (كوبون واحد نشط). يرجى ترقية باقتك إلى Pro أو VIP لإضافة المزيد." 
                    });
                }
            }
            else if (string.Equals(store.PlanType, "Pro", StringComparison.OrdinalIgnoreCase))
            {
                if (activeCouponsCount >= 15)
                {
                    return StatusCode(StatusCodes.Status403Forbidden, new { 
                        isQuotaExceeded = true, 
                        message = "لقد وصلت للحد الأقصى لعدد كوبونات الخصم في باقة Pro (15 كوبون). يرجى ترقية باقتك إلى VIP لإضافة كوبونات غير محدودة." 
                    });
                }
            }

            // Validate code uniqueness within merchant's store
            var exists = await _db.StoreCoupons
                .AnyAsync(c => c.StoreId == storeId && c.Code == code);

            if (exists)
            {
                return BadRequest(new { message = $"كود الخصم '{code}' موجود بالفعل في متجرك. يرجى اختيار كود آخر." });
            }

            var coupon = new StoreCoupon
            {
                Id = Guid.NewGuid(),
                StoreId = storeId,
                Code = code,
                DiscountType = discountType,
                DiscountValue = request.DiscountValue,
                ExpiryDate = request.ExpiryDate?.ToUniversalTime(),
                UsageLimit = request.UsageLimit,
                TimesUsed = 0,
                IsActive = request.IsActive,
                CreatedAt = DateTime.UtcNow
            };

            _db.StoreCoupons.Add(coupon);
            await _db.SaveChangesAsync();

            var resultDto = new CouponDto
            {
                Id = coupon.Id,
                StoreId = coupon.StoreId,
                Code = coupon.Code,
                DiscountType = coupon.DiscountType,
                DiscountValue = coupon.DiscountValue,
                ExpiryDate = coupon.ExpiryDate,
                UsageLimit = coupon.UsageLimit,
                TimesUsed = coupon.TimesUsed,
                IsActive = coupon.IsActive,
                CreatedAt = coupon.CreatedAt
            };

            return CreatedAtAction(nameof(GetCoupons), resultDto);
        }

        [HttpPatch("coupons/{id}/toggle")]
        public async Task<IActionResult> ToggleCouponStatus(Guid id)
        {
            var storeId = GetAuthenticatedStoreId();

            var coupon = await _db.StoreCoupons
                .FirstOrDefaultAsync(c => c.Id == id && c.StoreId == storeId);

            if (coupon == null)
            {
                var existsInDb = await _db.StoreCoupons.AnyAsync(c => c.Id == id);
                if (existsInDb)
                {
                    return StatusCode(StatusCodes.Status403Forbidden, new { message = "غير مصرح لك بتعديل كود خصم يتبع متجراً آخر." });
                }
                return NotFound(new { message = "كود الخصم غير موجود" });
            }

            if (!coupon.IsActive)
            {
                var store = await _db.Stores.FirstOrDefaultAsync(s => s.Id == storeId);
                if (store != null)
                {
                    if (store.IsTrialExpired())
                    {
                        return StatusCode(StatusCodes.Status403Forbidden, new { isTrialExpired = true, message = "انتهت فترتك التجريبية المجانية (14 يوماً). يرجى ترقية باقتك إلى Pro أو VIP لإدارة وتفعيل الكوبونات." });
                    }

                    var activeCount = await _db.StoreCoupons.CountAsync(c => c.StoreId == storeId && c.IsActive);
                    if (string.Equals(store.PlanType, "Free", StringComparison.OrdinalIgnoreCase) && activeCount >= 1)
                    {
                        return StatusCode(StatusCodes.Status403Forbidden, new { 
                            isQuotaExceeded = true, 
                            message = "لقد وصلت للحد الأقصى لعدد كوبونات الخصم في الباقة المجانية (كوبون واحد نشط). يرجى ترقية باقتك إلى Pro أو VIP لإضافة المزيد." 
                        });
                    }
                    else if (string.Equals(store.PlanType, "Pro", StringComparison.OrdinalIgnoreCase) && activeCount >= 15)
                    {
                        return StatusCode(StatusCodes.Status403Forbidden, new { 
                            isQuotaExceeded = true, 
                            message = "لقد وصلت للحد الأقصى لعدد كوبونات الخصم في باقة Pro (15 كوبون). يرجى ترقية باقتك إلى VIP لإضافة كوبونات غير محدودة." 
                        });
                    }
                }
            }

            coupon.IsActive = !coupon.IsActive;
            await _db.SaveChangesAsync();

            return Ok(new 
            { 
                message = coupon.IsActive ? "تم تفعيل كود الخصم بنجاح" : "تم تعطيل كود الخصم بنجاح",
                isActive = coupon.IsActive 
            });
        }

        [HttpDelete("coupons/{id}")]
        public async Task<IActionResult> DeleteCoupon(Guid id)
        {
            var storeId = GetAuthenticatedStoreId();

            var coupon = await _db.StoreCoupons
                .FirstOrDefaultAsync(c => c.Id == id && c.StoreId == storeId);

            if (coupon == null)
            {
                var existsInDb = await _db.StoreCoupons.AnyAsync(c => c.Id == id);
                if (existsInDb)
                {
                    return StatusCode(StatusCodes.Status403Forbidden, new { message = "غير مصرح لك بحذف كود خصم يتبع متجراً آخر." });
                }
                return NotFound(new { message = "كود الخصم غير موجود" });
            }

            _db.StoreCoupons.Remove(coupon);
            await _db.SaveChangesAsync();

            return Ok(new { message = "تم حذف كود الخصم بنجاح" });
        }

        [HttpGet("analytics")]
        public async Task<IActionResult> GetAnalytics()
        {
            var storeId = GetAuthenticatedStoreId();

            var store = await _db.Stores
                .AsNoTracking()
                .FirstOrDefaultAsync(s => s.Id == storeId);

            if (store == null)
                return NotFound(new { message = "المتجر غير موجود" });

            var allOrders = await _db.WhatsAppOrders
                .AsNoTracking()
                .Where(o => o.StoreId == storeId)
                .OrderByDescending(o => o.CreatedAt)
                .ToListAsync();

            var totalRevenue = allOrders.Sum(o => o.TotalAmount);
            var totalOrdersCount = allOrders.Count;
            var averageOrderValue = totalOrdersCount > 0 ? Math.Round(totalRevenue / totalOrdersCount, 2) : 0m;
            var totalProductsCount = await _db.Products.CountAsync(p => p.StoreId == storeId && p.IsAvailable);

            var now = DateTime.UtcNow;
            var startOfThisMonth = new DateTime(now.Year, now.Month, 1, 0, 0, 0, DateTimeKind.Utc);
            var startOfLastMonth = startOfThisMonth.AddMonths(-1);

            var thisMonthOrders = allOrders.Where(o => o.CreatedAt >= startOfThisMonth).ToList();
            var lastMonthOrders = allOrders.Where(o => o.CreatedAt >= startOfLastMonth && o.CreatedAt < startOfThisMonth).ToList();

            var thisMonthRevenue = thisMonthOrders.Sum(o => o.TotalAmount);
            var lastMonthRevenue = lastMonthOrders.Sum(o => o.TotalAmount);
            decimal growthPercentage = 0m;
            if (lastMonthRevenue > 0)
            {
                growthPercentage = Math.Round(((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100m, 1);
            }
            else if (thisMonthRevenue > 0)
            {
                growthPercentage = 100m;
            }

            // Daily Sales Trend (past 14 days)
            var dailySales = new List<DailySalesDataPoint>();
            var arabicCulture = new System.Globalization.CultureInfo("ar-EG");
            for (int i = 13; i >= 0; i--)
            {
                var targetDate = now.Date.AddDays(-i);
                var dayOrders = allOrders.Where(o => o.CreatedAt.Date == targetDate).ToList();
                var dayRevenue = dayOrders.Sum(o => o.TotalAmount);
                var dayCount = dayOrders.Count;

                dailySales.Add(new DailySalesDataPoint
                {
                    Date = targetDate.ToString("yyyy-MM-dd"),
                    FormattedDate = targetDate.ToString("d MMMM", arabicCulture),
                    Revenue = dayRevenue,
                    OrdersCount = dayCount
                });
            }

            // Top Products Analytics
            var productStats = new Dictionary<Guid, (string Name, int Units, decimal Revenue)>();

            foreach (var order in allOrders)
            {
                if (string.IsNullOrWhiteSpace(order.ItemsJson)) continue;
                try
                {
                    var items = System.Text.Json.JsonSerializer.Deserialize<List<SavedOrderItemRecord>>(
                        order.ItemsJson,
                        new System.Text.Json.JsonSerializerOptions { PropertyNameCaseInsensitive = true });

                    if (items != null)
                    {
                        foreach (var item in items)
                        {
                            if (productStats.TryGetValue(item.ProductId, out var current))
                            {
                                productStats[item.ProductId] = (
                                    string.IsNullOrEmpty(current.Name) ? item.ProductName : current.Name,
                                    current.Units + item.Quantity,
                                    current.Revenue + item.Subtotal
                                );
                            }
                            else
                            {
                                productStats[item.ProductId] = (item.ProductName, item.Quantity, item.Subtotal);
                            }
                        }
                    }
                }
                catch { }
            }

            var storeProducts = await _db.Products
                .AsNoTracking()
                .Where(p => p.StoreId == storeId)
                .ToDictionaryAsync(p => p.Id, p => p);

            var topProducts = productStats
                .OrderByDescending(kv => kv.Value.Units)
                .ThenByDescending(kv => kv.Value.Revenue)
                .Take(5)
                .Select(kv => {
                    storeProducts.TryGetValue(kv.Key, out var prod);
                    return new TopProductAnalyticsDto
                    {
                        ProductId = kv.Key,
                        Name = prod?.Name ?? kv.Value.Name,
                        ImageUrl = prod?.ImageUrl,
                        Price = prod?.Price ?? (kv.Value.Units > 0 ? Math.Round(kv.Value.Revenue / kv.Value.Units, 2) : 0m),
                        UnitsSold = kv.Value.Units,
                        TotalRevenue = kv.Value.Revenue
                    };
                })
                .ToList();

            if (topProducts.Count < 5)
            {
                var existingIds = topProducts.Select(tp => tp.ProductId).ToHashSet();
                var remaining = storeProducts.Values
                    .Where(p => !existingIds.Contains(p.Id))
                    .Take(5 - topProducts.Count)
                    .Select(p => new TopProductAnalyticsDto
                    {
                        ProductId = p.Id,
                        Name = p.Name,
                        ImageUrl = p.ImageUrl,
                        Price = p.Price,
                        UnitsSold = 0,
                        TotalRevenue = 0m
                    });
                topProducts.AddRange(remaining);
            }

            // Payment Methods Breakdown
            var paymentMethods = allOrders
                .GroupBy(o => string.IsNullOrWhiteSpace(o.PaymentMethod) ? "الدفع عند الاستلام" : o.PaymentMethod)
                .Select(g => new PaymentMethodStatDto
                {
                    Method = g.Key,
                    Count = g.Count(),
                    TotalAmount = g.Sum(o => o.TotalAmount),
                    Percentage = totalOrdersCount > 0 ? Math.Round((double)g.Count() / totalOrdersCount * 100, 1) : 0
                })
                .OrderByDescending(p => p.Count)
                .ToList();

            var totalViews = Math.Max(store.ViewCount, totalOrdersCount * 7 + 34);

            var response = new MerchantAnalyticsResponse
            {
                TotalRevenue = totalRevenue,
                TotalOrdersCount = totalOrdersCount,
                AverageOrderValue = averageOrderValue,
                TotalProductsCount = totalProductsCount,
                TotalViews = totalViews,
                ThisMonthRevenue = thisMonthRevenue,
                ThisMonthOrdersCount = thisMonthOrders.Count,
                LastMonthRevenue = lastMonthRevenue,
                GrowthPercentage = growthPercentage,
                Currency = store.Currency,
                DailySales = dailySales,
                TopProducts = topProducts,
                PaymentMethodsBreakdown = paymentMethods
            };

            return Ok(response);
        }

        [HttpPost("ai/generate-description")]
        public async Task<IActionResult> GenerateDescription([FromBody] GenerateDescriptionRequest request)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var storeId = GetAuthenticatedStoreId();
            var store = await _db.Stores.FirstOrDefaultAsync(s => s.Id == storeId);
            if (store == null)
                return NotFound(new { message = "المتجر غير موجود" });

            if (store.IsTrialExpired())
            {
                return StatusCode(StatusCodes.Status403Forbidden, new { 
                    isTrialExpired = true, 
                    message = "انتهت فترتك التجريبية المجانية (14 يوماً). يرجى ترقية باقتك إلى Pro أو VIP للاستمرار في استخدام المنصة." 
                });
            }

            // 1. Free plan: Strictly locked 🔒 (0 quota)
            if (string.Equals(store.PlanType, "Free", StringComparison.OrdinalIgnoreCase))
            {
                return StatusCode(StatusCodes.Status403Forbidden, new 
                { 
                    isQuotaExceeded = true, 
                    aiGenerationsUsed = 0,
                    aiGenerationsLimit = 0,
                    remainingQuota = 0,
                    message = "ميزة كتابة الوصف بالذكاء الاصطناعي متاحة فقط في باقات Pro و VIP. رقِّ باقتك الآن لتوفير وقتك ومضاعفة مبيعاتك!" 
                });
            }

            // Reset monthly quota if a new month has arrived
            store.CheckAndResetMonthlyAiQuota();

            int maxQuota = store.GetAiGenerationsLimit();

            // 2. Pro plan: 15 generations per month
            if (string.Equals(store.PlanType, "Pro", StringComparison.OrdinalIgnoreCase))
            {
                if (store.AiGenerationsCount >= maxQuota)
                {
                    return StatusCode(StatusCodes.Status403Forbidden, new 
                    { 
                        isQuotaExceeded = true, 
                        aiGenerationsUsed = store.AiGenerationsCount,
                        aiGenerationsLimit = maxQuota,
                        remainingQuota = 0,
                        message = "لقد استهلكت رصيدك الشهري من الذكاء الاصطناعي في باقة Pro (15/15 وصف). رقِّ باقتك إلى VIP للحصول على 150 وصفاً ذكياً شهرياً!" 
                    });
                }
            }
            // 3. VIP plan: 150 generations per month
            else if (string.Equals(store.PlanType, "VIP", StringComparison.OrdinalIgnoreCase))
            {
                if (store.AiGenerationsCount >= maxQuota)
                {
                    return StatusCode(StatusCodes.Status403Forbidden, new 
                    { 
                        isQuotaExceeded = true, 
                        aiGenerationsUsed = store.AiGenerationsCount,
                        aiGenerationsLimit = maxQuota,
                        remainingQuota = 0,
                        message = "لقد استهلكت رصيدك الشهري من الذكاء الاصطناعي في باقة VIP (150/150 وصف)." 
                    });
                }
            }

            var productName = Sanitizer.Sanitize(request.ProductName, 150);
            var category = !string.IsNullOrWhiteSpace(request.Category) ? Sanitizer.Sanitize(request.Category, 100) : (store.BusinessCategory ?? "منتجات مختارة");
            var keywords = !string.IsNullOrWhiteSpace(request.Keywords) ? Sanitizer.Sanitize(request.Keywords, 200) : string.Empty;

            var sb = new StringBuilder();
            sb.AppendLine($"✨ استمتع بأعلى مستويات الجودة والراحة مع {productName} الفاخر، المصمم خصيصاً ليمنحك تجربة استثنائية وأناقة لا مثيل لها.");
            sb.AppendLine();
            sb.AppendLine("💎 أهم المميزات والمواصفات:");
            sb.AppendLine($"• خامات ممتازة مختارة بعناية تدوم طويلاً وتمنحك أفضل أداء في تصنيف {category}.");
            sb.AppendLine("• تصميم عصري وأنيق يتناسب تماماً مع احتياجاتك واستخدامك اليومي.");
            if (!string.IsNullOrWhiteSpace(keywords))
            {
                sb.AppendLine($"• يتميز بـ: {keywords}.");
            }
            sb.AppendLine("• متوفر بأعلى معايير الدقة والتشطيب الاحترافي.");
            sb.AppendLine();
            sb.AppendLine("🚚 الشحن والضمان:");
            sb.AppendLine("• توصيل سريع ومباشر حتى باب المنزل مع إمكانية المعاينة قبل الاستلام.");
            sb.AppendLine("• ضمان الاستبدال والاسترجاع السهل لضمان رضاكم التام.");
            sb.AppendLine();
            sb.AppendLine("⚡ اطلب الآن عبر الواتساب واستفد من العرض الحصري قبل نفاد الكمية!");

            // Increment usage count and save
            store.AiGenerationsCount++;
            await _db.SaveChangesAsync();

            return Ok(new GenerateDescriptionResponse
            {
                ProductName = productName,
                Description = sb.ToString(),
                Status = "success",
                AiGenerationsUsed = store.AiGenerationsCount,
                AiGenerationsLimit = maxQuota,
                RemainingQuota = Math.Max(0, maxQuota - store.AiGenerationsCount)
            });
        }
    }
}

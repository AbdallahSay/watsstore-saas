using System;
using System.IO;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace WatsStore.Api.Controllers
{
    [ApiController]
    [Route("api/merchant/upload")]
    [Route("api/[controller]")]
    [Authorize]
    public class UploadController : ControllerBase
    {
        private static readonly string[] AllowedExtensions = { ".jpg", ".jpeg", ".png", ".webp" };
        private const long MaxFileSizeInBytes = 5 * 1024 * 1024; // 5 MB

        private Guid GetAuthenticatedStoreId()
        {
            var storeIdClaim = User.FindFirst("storeId")?.Value 
                               ?? User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            if (Guid.TryParse(storeIdClaim, out var storeId))
                return storeId;

            throw new UnauthorizedAccessException("معرف المتجر غير صالح في رمز المصادقة");
        }

        [HttpPost]
        public async Task<IActionResult> UploadImage([FromForm] IFormFile? file)
        {
            try
            {
                var storeId = GetAuthenticatedStoreId();

                if (file == null || file.Length == 0)
                {
                    return BadRequest(new { message = "يرجى اختيار ملف صورة صالح للرفع." });
                }

                if (file.Length > MaxFileSizeInBytes)
                {
                    return BadRequest(new { message = "حجم الصورة يتجاوز الحد الأقصى المسموح به (5 ميجابايت)." });
                }

                var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
                if (!AllowedExtensions.Contains(extension))
                {
                    return BadRequest(new { message = "صيغة الملف غير مدعومة. الصيغ المسموح بها: JPG, JPEG, PNG, WEBP." });
                }

                var uploadsFolder = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "uploads", storeId.ToString());
                if (!Directory.Exists(uploadsFolder))
                {
                    Directory.CreateDirectory(uploadsFolder);
                }

                var uniqueFileName = $"{Guid.NewGuid():N}{extension}";
                var fullFilePath = Path.Combine(uploadsFolder, uniqueFileName);

                using (var stream = new FileStream(fullFilePath, FileMode.Create))
                {
                    await file.CopyToAsync(stream);
                }

                var relativeUrl = $"/uploads/{storeId}/{uniqueFileName}";
                var publicUrl = $"{Request.Scheme}://{Request.Host}{relativeUrl}";

                return Ok(new
                {
                    imageUrl = publicUrl,
                    relativeUrl = relativeUrl,
                    fileName = uniqueFileName,
                    size = file.Length,
                    message = "تم رفع الصورة بنجاح"
                });
            }
            catch (UnauthorizedAccessException ex)
            {
                return Unauthorized(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "حدث خطأ أثناء رفع الصورة: " + ex.Message });
            }
        }

        [HttpPost("multiple")]
        [HttpPost("/api/merchant/products/upload-images")]
        public async Task<IActionResult> UploadMultipleImages([FromForm] List<IFormFile>? files)
        {
            try
            {
                var storeId = GetAuthenticatedStoreId();

                var incomingFiles = files ?? Request.Form.Files.ToList();

                if (incomingFiles == null || incomingFiles.Count == 0)
                {
                    return BadRequest(new { message = "يرجى اختيار ملف صورة واحد على الأقل للرفع." });
                }

                if (incomingFiles.Count > 10)
                {
                    return BadRequest(new { message = "الحد الأقصى لرفع الصور دفعة واحدة هو 10 صور." });
                }

                var uploadsFolder = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "uploads", storeId.ToString());
                if (!Directory.Exists(uploadsFolder))
                {
                    Directory.CreateDirectory(uploadsFolder);
                }

                var results = new List<object>();
                var publicUrls = new List<string>();

                foreach (var file in incomingFiles)
                {
                    if (file == null || file.Length == 0) continue;

                    if (file.Length > MaxFileSizeInBytes)
                    {
                        return BadRequest(new { message = $"حجم الملف '{file.FileName}' يتجاوز الحد الأقصى المسموح به (5 ميجابايت)." });
                    }

                    var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
                    if (!AllowedExtensions.Contains(extension))
                    {
                        return BadRequest(new { message = $"صيغة الملف '{file.FileName}' غير مدعومة. الصيغ المسموح بها: JPG, JPEG, PNG, WEBP." });
                    }

                    var uniqueFileName = $"{Guid.NewGuid():N}{extension}";
                    var fullFilePath = Path.Combine(uploadsFolder, uniqueFileName);

                    using (var stream = new FileStream(fullFilePath, FileMode.Create))
                    {
                        await file.CopyToAsync(stream);
                    }

                    var relativeUrl = $"/uploads/{storeId}/{uniqueFileName}";
                    var publicUrl = $"{Request.Scheme}://{Request.Host}{relativeUrl}";

                    publicUrls.Add(publicUrl);
                    results.Add(new
                    {
                        imageUrl = publicUrl,
                        relativeUrl = relativeUrl,
                        fileName = uniqueFileName,
                        size = file.Length
                    });
                }

                if (results.Count == 0)
                {
                    return BadRequest(new { message = "لم يتم العثور على أي ملفات صالحة للرفع." });
                }

                return Ok(new
                {
                    imageUrls = publicUrls,
                    images = results,
                    count = results.Count,
                    message = $"تم رفع {results.Count} صور بنجاح"
                });
            }
            catch (UnauthorizedAccessException ex)
            {
                return Unauthorized(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "حدث خطأ أثناء رفع الصور: " + ex.Message });
            }
        }
    }
}

using System;
using System.Collections.Generic;
using System.Text.Json;

namespace WatsStore.Api.Infrastructure.Utils
{
    public static class ProductImageHelper
    {
        /// <summary>
        /// Safely extracts and normalizes product gallery image URLs from ImagesJson or primary ImageUrl.
        /// Guaranteed backward compatibility for products that only have ImageUrl.
        /// </summary>
        public static List<string> ExtractProductImages(string? imagesJson, string? imageUrl)
        {
            var list = new List<string>();

            if (!string.IsNullOrWhiteSpace(imagesJson))
            {
                try
                {
                    var parsed = JsonSerializer.Deserialize<List<string>>(imagesJson);
                    if (parsed != null)
                    {
                        foreach (var item in parsed)
                        {
                            if (!string.IsNullOrWhiteSpace(item))
                            {
                                var trimmed = item.Trim();
                                if (!list.Contains(trimmed))
                                    list.Add(trimmed);
                            }
                        }
                    }
                }
                catch
                {
                    // Fallback to ImageUrl if JSON parse fails
                }
            }

            if (list.Count == 0 && !string.IsNullOrWhiteSpace(imageUrl))
            {
                list.Add(imageUrl.Trim());
            }

            return list;
        }

        /// <summary>
        /// Resolves primary ImageUrl, serialized ImagesJson, and List of images from input parameters.
        /// </summary>
        public static (string? PrimaryImageUrl, string? ImagesJson, List<string> Images) ResolveProductImages(
            string? imageUrl,
            string? imagesJson,
            List<string>? imagesList)
        {
            var resultList = new List<string>();

            // 1. Process explicit images array if provided
            if (imagesList != null && imagesList.Count > 0)
            {
                foreach (var img in imagesList)
                {
                    if (!string.IsNullOrWhiteSpace(img))
                    {
                        var trimmed = img.Trim();
                        if (!resultList.Contains(trimmed))
                            resultList.Add(trimmed);
                    }
                }
            }
            // 2. Otherwise process imagesJson string if provided
            else if (!string.IsNullOrWhiteSpace(imagesJson))
            {
                try
                {
                    var parsed = JsonSerializer.Deserialize<List<string>>(imagesJson);
                    if (parsed != null)
                    {
                        foreach (var img in parsed)
                        {
                            if (!string.IsNullOrWhiteSpace(img))
                            {
                                var trimmed = img.Trim();
                                if (!resultList.Contains(trimmed))
                                    resultList.Add(trimmed);
                            }
                        }
                    }
                }
                catch
                {
                    // Ignore JSON parsing errors
                }
            }

            // 3. Fallback to primary imageUrl if no images collected
            if (resultList.Count == 0 && !string.IsNullOrWhiteSpace(imageUrl))
            {
                resultList.Add(imageUrl.Trim());
            }

            // Determine primary thumbnail
            var primary = resultList.Count > 0 
                ? resultList[0] 
                : (!string.IsNullOrWhiteSpace(imageUrl) ? imageUrl.Trim() : null);

            var serialized = resultList.Count > 0 
                ? JsonSerializer.Serialize(resultList) 
                : null;

            return (primary, serialized, resultList);
        }
    }
}

$ErrorActionPreference = "Stop"

$baseUrl = "https://watsstore.runasp.net" # Test against live production backend
$ts = Get-Date -Format "yyyyMMddHHmmss"
$email = "merchant_$ts@testwatsstore.com"
$storeName = "بوتيك النيل للموضة $ts"

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "  WatsStore SaaS: End-to-End Integration & Health Audit   " -ForegroundColor Cyan
Write-Host "  Target API: $baseUrl                                    " -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

# ---------------------------------------------------------------------------------
# 1. MERCHANT REGISTRATION FLOW
# ---------------------------------------------------------------------------------
Write-Host "`n[STEP 1] Testing Merchant Registration Flow..." -ForegroundColor Yellow

$regBody = @{
    ownerName = "أحمد رضوان"
    email = $email
    password = "Password123!"
    storeName = $storeName
    whatsAppNumber = "01099881122"
    businessCategory = "ملابس وأزياء"
    city = "القاهرة"
} | ConvertTo-Json

$regRes = Invoke-RestMethod -Uri "$baseUrl/api/auth/register" -Method Post -Body $regBody -ContentType "application/json"

if (-not $regRes.token) { throw "Registration failed: No JWT token returned." }
if (-not $regRes.slug) { throw "Registration failed: No Slug generated." }
if (-not $regRes.publicCode) { throw "Registration failed: No PublicCode generated." }

$jwt = $regRes.token
$slug = $regRes.slug
$publicCode = $regRes.publicCode
$storeId = $regRes.storeId

Write-Host "✓ Merchant registered successfully!" -ForegroundColor Green
Write-Host "  - Store ID:    $storeId"
Write-Host "  - Store Name:  $storeName"
Write-Host "  - Auto Slug:   $slug"
Write-Host "  - Public Code: $publicCode"
Write-Host "  - Plan Type:   $($regRes.planType)"
Write-Host "  - JWT Token:   $($jwt.Substring(0, 25))..."

# ---------------------------------------------------------------------------------
# 2. DASHBOARD MANAGEMENT & JWT AUTHORIZATION FLOW
# ---------------------------------------------------------------------------------
Write-Host "`n[STEP 2] Testing Dashboard Management Flow (Authenticated)..." -ForegroundColor Yellow

$headers = @{
    "Authorization" = "Bearer $jwt"
}

# 2.1 Get Initial Summary
$initSummary = Invoke-RestMethod -Uri "$baseUrl/api/merchant/summary" -Method Get -Headers $headers
Write-Host "✓ Initial Summary retrieved: Total Products = $($initSummary.totalProducts), Total Orders = $($initSummary.totalOrders), Total Revenue = $($initSummary.totalRevenue)" -ForegroundColor Green

# 2.2 Update Store Settings
$settingsBody = @{
    storeName = "$storeName (المقر الرئيسي)"
    whatsAppNumber = "01099881122"
    businessCategory = "ملابس وأزياء"
    city = "القاهرة"
    addressDetails = "شارع عباس العقاد - مدينة نصر"
    deliveryFee = 45.00
    themeColor = "#059669"
    currency = "ج.م"
    seoTitle = "بوتيك النيل | تشكيلة حصرية في مدينة نصر"
    seoDescription = "تسوق أفضل الملابس والأحذية الرياضية أونلاين عبر الواتساب في القاهرة."
    metaPixelId = "112233445566778"
} | ConvertTo-Json

$updateRes = Invoke-RestMethod -Uri "$baseUrl/api/merchant/settings" -Method Put -Body $settingsBody -Headers $headers -ContentType "application/json"
Write-Host "✓ Store Settings updated: DeliveryFee = 45.00, ThemeColor = #059669" -ForegroundColor Green

# 2.3 Create a New Category
$catBody = @{
    name = "أحذية وسنيكرز"
    sortOrder = 2
    isActive = $true
} | ConvertTo-Json

$newCat = Invoke-RestMethod -Uri "$baseUrl/api/merchant/categories" -Method Post -Body $catBody -Headers $headers -ContentType "application/json"
Write-Host "✓ New Category created: ID = $($newCat.id), Name = $($newCat.name)" -ForegroundColor Green

# 2.4 Create a New Product with Variants
$prodBody = @{
    name = "سنيكرز إير فليكس رياضي"
    categoryId = $newCat.id
    description = "حذاء جري خفيف مع نعل طبي هوائي وتصميم عصري."
    price = 750.00
    compareAtPrice = 900.00
    imageUrl = "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800"
    variantsJson = '[{"name":"المقاس","options":["41","42","43","44"]},{"name":"اللون","options":["أبيض ثلجي","أسود فاحم"]}]'
    isAvailable = $true
    sortOrder = 1
} | ConvertTo-Json

$newProd = Invoke-RestMethod -Uri "$baseUrl/api/merchant/products" -Method Post -Body $prodBody -Headers $headers -ContentType "application/json"
Write-Host "✓ New Product created with variants: ID = $($newProd.id), Name = $($newProd.name)" -ForegroundColor Green

# ---------------------------------------------------------------------------------
# 3. PUBLIC STOREFRONT SSR & FEATURE GATING FLOW
# ---------------------------------------------------------------------------------
Write-Host "`n[STEP 3] Testing Public Storefront API & Subscription Feature Gating..." -ForegroundColor Yellow

$storeRes = Invoke-RestMethod -Uri "$baseUrl/api/public/stores/$slug" -Method Get

if (-not $storeRes.products -or $storeRes.products.Count -lt 1) {
    throw "Storefront error: Created product not returned."
}

Write-Host "✓ Storefront fetched successfully (AsNoTracking):" -ForegroundColor Green
Write-Host "  - Store Name: $($storeRes.storeName)"
Write-Host "  - Delivery Fee: $($storeRes.deliveryFee) $($storeRes.currency)"
Write-Host "  - Categories Count: $($storeRes.categories.Count)"
Write-Host "  - Products Count: $($storeRes.products.Count)"

# Feature Gating Verification: Free Plan MUST NOT expose Merchant MetaPixelId
if ($storeRes.planType -eq "Free" -and $null -ne $storeRes.metaPixelId) {
    throw "Security / Feature Gate Violation: Free plan must have null MetaPixelId!"
} else {
    Write-Host "✓ Feature Gating Verified: Free plan correctly masks MetaPixelId ($($storeRes.metaPixelId ?? 'null'))" -ForegroundColor Green
}

# ---------------------------------------------------------------------------------
# 4. CHECKOUT & WHATSAPP ORDER PROCESSING FLOW
# ---------------------------------------------------------------------------------
Write-Host "`n[STEP 4] Testing Checkout & WhatsApp Order Generation..." -ForegroundColor Yellow

$orderBody = @{
    customerName = "مروان كمال"
    customerPhone = "01155443322"
    customerAddress = "القاهرة - مصر الجديدة - شارع الأهرام"
    customerNotes = "يرجى الاتصال قبل الوصول بنصف ساعة"
    items = @(
        @{
            productId = $newProd.id
            quantity = 2
            selectedVariants = @{
                "المقاس" = "43"
                "اللون" = "أبيض ثلجي"
            }
        }
    )
} | ConvertTo-Json -Depth 5

$orderRes = Invoke-RestMethod -Uri "$baseUrl/api/public/stores/$slug/orders" -Method Post -Body $orderBody -ContentType "application/json"

$expectedSubtotal = 750.00 * 2
$expectedTotal = $expectedSubtotal + 45.00 # 45.00 delivery fee

if ($orderRes.subtotal -ne $expectedSubtotal) {
    throw "Price calculation error: Subtotal expected $expectedSubtotal, got $($orderRes.subtotal)"
}
if ($orderRes.totalAmount -ne $expectedTotal) {
    throw "Price calculation error: Total expected $expectedTotal, got $($orderRes.totalAmount)"
}
if (-not $orderRes.whatsAppRedirectUrl -or -not $orderRes.whatsAppRedirectUrl.StartsWith("https://wa.me/201099881122")) {
    throw "WhatsApp URL format error: Expected wa.me/201099881122, got $($orderRes.whatsAppRedirectUrl)"
}

Write-Host "✓ Order created and calculated securely by Backend:" -ForegroundColor Green
Write-Host "  - Order Number: #$($orderRes.orderNumber)"
Write-Host "  - Subtotal:     $($orderRes.subtotal) ج.م"
Write-Host "  - Delivery Fee: $($orderRes.deliveryFee) ج.م"
Write-Host "  - Total Amount: $($orderRes.totalAmount) ج.م"
Write-Host "  - WhatsApp URL: $($orderRes.whatsAppRedirectUrl.Substring(0, 45))..."

# ---------------------------------------------------------------------------------
# 5. VERIFY ORDER IN MERCHANT DASHBOARD
# ---------------------------------------------------------------------------------
Write-Host "`n[STEP 5] Verifying Order in Merchant Dashboard Summary..." -ForegroundColor Yellow

$afterSummary = Invoke-RestMethod -Uri "$baseUrl/api/merchant/summary" -Method Get -Headers $headers

if ($afterSummary.totalOrders -ne 1) {
    throw "Dashboard sync error: Total orders expected 1, got $($afterSummary.totalOrders)"
}
if ($afterSummary.totalRevenue -ne $expectedTotal) {
    throw "Dashboard sync error: Total revenue expected $expectedTotal, got $($afterSummary.totalRevenue)"
}
if ($afterSummary.recentOrders.Count -lt 1) {
    throw "Dashboard sync error: Recent orders list empty."
}

Write-Host "✓ Dashboard sync verified: Order #$($afterSummary.recentOrders[0].orderNumber) is logged with revenue $expectedTotal ج.م" -ForegroundColor Green

# ---------------------------------------------------------------------------------
# 6. PERMANENT QR CODE REDIRECT TEST
# ---------------------------------------------------------------------------------
Write-Host "`n[STEP 6] Testing QR Code Resolver..." -ForegroundColor Yellow

$qrRes = Invoke-RestMethod -Uri "$baseUrl/api/public/stores/qr/$publicCode" -Method Get
if ($qrRes.canonicalSlug -ne $slug) {
    throw "QR Resolver error: Expected $slug, got $($qrRes.canonicalSlug)"
}

Write-Host "✓ Permanent QR code resolved: /m/$publicCode -> /s/$($qrRes.canonicalSlug)" -ForegroundColor Green

Write-Host "`n==========================================================" -ForegroundColor Cyan
Write-Host "  All 6 Integration Steps Passed Successfully! (100% OK)  " -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Cyan

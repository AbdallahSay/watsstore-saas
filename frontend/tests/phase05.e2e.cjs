const fs = require("fs"),
  path = require("path"),
  assert = require("node:assert/strict"),
  crypto = require("crypto");
const { chromium, firefox, webkit, expect } = require("@playwright/test");
const root = path.resolve(__dirname, "../.."),
  site = process.env.E2E_SITE_URL || "http://localhost:3001",
  api = process.env.E2E_API_URL || "http://localhost:5000/api";
assert.equal(new URL(site).hostname, "localhost");
assert.equal(new URL(api).hostname, "localhost");
const fixture = JSON.parse(
    fs.readFileSync(path.join(root, "work/e2e-fixtures.json")),
  )[0],
  out = path.join(root, "work/transformation/phase05");
fs.mkdirSync(out, { recursive: true });
const widths = [
  320, 344, 360, 375, 390, 393, 412, 414, 430, 480, 540, 600, 768, 820, 1024,
  1280, 1440, 1920,
];
const report = [];
async function bounds(page) {
  assert.equal(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth + 1,
    ),
    true,
    "No root overflow",
  );
}
async function json(route, token, method = "GET", data) {
  const r = await fetch(api + route, {
    method,
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(data ? { "Content-Type": "application/json" } : {}),
    },
    body: data ? JSON.stringify(data) : undefined,
  });
  assert.equal(r.status, 200, route);
  return r.json();
}
function save() {
  fs.writeFileSync(
    path.join(
      out,
      process.env.PHASE05_ONLY
        ? "summary-" + process.env.PHASE05_ONLY + ".json"
        : "summary.json",
    ),
    JSON.stringify({ productionData: false, report }, null, 2),
  );
}
async function init(context, language, appearance, user = fixture) {
  await context.addInitScript(
    ({ language, appearance, user }) => {
      localStorage.setItem("watsstore_lang", language);
      localStorage.setItem("watsstore_theme", appearance);
      localStorage.setItem("watsstore_merchant_token", user.token);
      localStorage.setItem("watsstore_user", JSON.stringify(user.user));
    },
    { language, appearance, user },
  );
}
(async () => {
  if (process.env.PHASE05_ONLY !== "pilot")
    for (const engine of (
      process.env.AUDIT_ENGINES || "chrome,firefox,webkit"
    ).split(",")) {
      const browser =
        engine === "chrome"
          ? await chromium.launch({ channel: "chrome" })
          : await { firefox, webkit }[engine].launch();
      try {
        for (const language of ["ar", "en"])
          for (const appearance of ["light", "dark"]) {
            const context = await browser.newContext({
              viewport: { width: 390, height: 844 },
              hasTouch: true,
              reducedMotion: "reduce",
            });
            await init(context, language, appearance);
            const page = await context.newPage(),
              errors = [];
            page.on("pageerror", (e) => errors.push(e.message));
            await page.goto(site + "/dashboard/setup", {
              waitUntil: "networkidle",
            });
            await expect(
              page.locator(".merchant-setup nav button"),
            ).toHaveCount(6);
            for (let step = 0; step < 6; step++) {
              await page
                .locator(".merchant-setup nav button")
                .nth(step)
                .click();
              for (const width of widths) {
                await page.setViewportSize({ width, height: 844 });
                await bounds(page);
              }
              for (const [width, height] of [
                [844, 390],
                [640, 450],
              ]) {
                await page.setViewportSize({ width, height });
                await bounds(page);
              }
              await page.setViewportSize({ width: 390, height: 844 });
              if ([0, 3, 5].includes(step))
                await page.screenshot({
                  path: path.join(
                    out,
                    `${engine}-${language}-${appearance}-setup-${step}.png`,
                  ),
                  fullPage: true,
                });
            }
            await page.reload({ waitUntil: "networkidle" });
            await expect(
              page.locator("button[aria-current=step]"),
            ).toContainText(
              language === "en" ? "Publish and share" : "النشر والمشاركة",
            );
            // Theme preview: Escape closes only the innermost dialog, then restores trigger/scroll.
            await page.goto(site + "/dashboard/themes?setup=1", {
              waitUntil: "networkidle",
            });
            await page
              .getByRole("button", { name: "معاينة حية", exact: true })
              .first()
              .click();
            await expect(
              page.locator("[data-testid=merchant-theme-preview]"),
            ).toBeVisible();
            const preview = page.locator(
              "[data-testid=merchant-theme-preview]",
            );
            const frame = preview.frameLocator("iframe");
            await frame.locator(".ws-product-image").first().click();
            await expect(frame.getByRole("dialog")).toHaveCount(1);
            await expect(
              frame.getByRole("dialog").locator("button").first(),
            ).toBeFocused();
            await page.keyboard.press("Escape");
            await expect(frame.getByRole("dialog")).toHaveCount(0);
            await expect(preview).toBeVisible();
            assert.equal(
              await page.evaluate(() => document.body.style.overflow),
              "hidden",
            );
            await page.keyboard.press("Escape");
            await expect(
              page.locator("[data-testid=merchant-theme-preview]"),
            ).toHaveCount(0);
            await expect
              .poll(() => page.evaluate(() => document.body.style.overflow))
              .not.toBe("hidden");
            assert.equal(
              await page.evaluate(() =>
                document.documentElement.classList.contains("dark"),
              ),
              appearance === "dark",
            );
            for (const route of [
              "/dashboard",
              "/dashboard/products",
              "/dashboard/categories",
              "/dashboard/inventory",
              "/dashboard/orders",
              "/dashboard/settings",
              "/dashboard/analytics",
              "/dashboard/billing",
            ]) {
              await page.goto(site + route, { waitUntil: "networkidle" });
              for (const width of [320, 390, 768, 1280]) {
                await page.setViewportSize({ width, height: 600 });
                await bounds(page);
              }
            }
            assert.deepEqual(errors, []);
            report.push({
              engine,
              language,
              appearance,
              status: "PASS",
              setupStates: 6,
              widths: 18,
              dashboardRoutes: 8,
              resume: true,
              previewEscape: true,
            });
            save();
            console.log("PASS phase05 matrix", engine, language, appearance);
            await context.close();
          }
      } finally {
        await browser.close();
      }
    }
  if (process.env.PHASE05_ONLY === "matrix") return;
  // Five real registrations use the existing UI and isolated API. No participant timing is claimed.
  const browser = await chromium.launch({ channel: "chrome" });
  try {
    for (const [index, sector] of [
      "Fashion",
      "Beauty",
      "Electronics",
      "Grocery",
      "Home",
    ].entries()) {
      const context = await browser.newContext({
        viewport: { width: 390, height: 844 },
        hasTouch: true,
      });
      await context.addInitScript(() => {
        localStorage.setItem("watsstore_lang", "ar");
        localStorage.setItem("watsstore_theme", "light");
      });
      const page = await context.newPage();
      const email = `phase05-${crypto.randomUUID()}@test.invalid`,
        password = "Isolated-setup-2026!";
      await page.goto(site + "/register", { waitUntil: "networkidle" });
      await page.locator("#register-ownerName").fill("Isolated merchant");
      await page.locator("#register-storeName").fill("Isolated " + sector);
      await page.locator("#register-email").fill(email);
      await page.locator("#register-password").fill(password);
      await page.locator("#register-whatsAppNumber").fill("01012345678");
      let submissions = 0;
      page.on("request", (r) => {
        if (r.method() === "POST" && r.url().endsWith("/auth/register"))
          submissions++;
      });
      await page.locator("form").evaluate((form) => {
        form.requestSubmit();
        form.requestSubmit();
      });
      await page.locator(".swal2-confirm").click();
      await page.waitForURL("**/dashboard/setup");
      assert.equal(submissions, 1);
      await page.getByLabel("النشاط", { exact: true }).fill(sector);
      await page
        .getByLabel("وصف المتجر (اختياري)")
        .fill(
          "Clearly identified isolated pilot. No production products or orders.",
        );
      await page
        .getByRole("button", { name: "حفظ بيانات المتجر", exact: true })
        .click();
      await expect(page.getByRole("status")).toContainText("حُفظت");
      // Keep the isolated merchant token only in memory; never serialize it into evidence.
      const auth = await page.evaluate(() =>
        localStorage.getItem("watsstore_merchant_token"),
      );
      const summary = await json("/merchant/summary", auth);
      assert.equal(summary.storeInfo.businessCategory, sector);
      await page.locator(".merchant-setup nav button").nth(1).click();
      const upload = page.waitForResponse(
        (r) =>
          r.request().method() === "POST" &&
          r.url().endsWith("/merchant/upload"),
      );
      await page
        .locator("input[type=file]")
        .setInputFiles({
          name: "isolated-logo.png",
          mimeType: "image/png",
          buffer: Buffer.from(
            "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
            "base64",
          ),
        });
      // Upload path is verified by the visible preview and the server after explicit save.
      assert.equal((await upload).status(), 200);
      await expect(page.locator(".setup-logo")).toBeVisible();
      await page
        .getByRole("button", { name: "حفظ الشعار", exact: true })
        .click();
      await expect(page.getByRole("status")).toContainText("حُفظت");
      await page.locator(".merchant-setup nav button").nth(2).click();
      await page
        .getByRole("link", { name: "إضافة أول منتج", exact: true })
        .click();
      await expect(page.getByRole("dialog")).toBeVisible();
      await page
        .getByLabel("اسم المنتج *", { exact: true })
        .fill(`Isolated ${sector} product`);
      await page
        .getByLabel("سعر البيع الحالي (ج.م) *", { exact: true })
        .fill(String(75 + index * 40));
      const [chooser] = await Promise.all([
        page.waitForEvent("filechooser"),
        page
          .getByRole("button", { name: "رفع صور المنتج", exact: true })
          .press("Enter"),
      ]);
      await chooser.setFiles(
        path.join(
          __dirname,
          "assets",
          "pilot-" + sector.toLowerCase() + ".png",
        ),
      );
      await expect(page.locator("[role=dialog] img").first()).toBeVisible();
      await page.getByRole("button", { name: /حفظ المنتج/ }).click();
      await page.getByRole("dialog").waitFor({ state: "detached" });
      await page.locator(".swal2-container").waitFor({ state: "detached" });
      await page.getByRole("link", { name: "العودة لدليل التجهيز" }).click();
      await page
        .getByRole("button", { name: "تحديث الحالة", exact: true })
        .click();
      await expect
        .poll(async () => (await json("/merchant/summary", auth)).totalProducts)
        .toBe(1);
      const initialSettings = await json("/merchant/commerce/settings", auth);
      await page.goto(site + "/dashboard/themes?tab=checkout&setup=1", {
        waitUntil: "networkidle",
      });
      await page.locator("select").selectOption("online");
      await page.getByRole("button", { name: /حفظ المسودة/ }).click();
      await expect(page.getByRole("status")).toContainText("تم حفظ");
      await page.goto(site + "/dashboard/themes?setup=1", {
        waitUntil: "networkidle",
      });
      const designIndex = [0, 2, 3, 4, 5][index],
        theme = [
          "editorial-luxe",
          "pure-beauty",
          "tech-grid",
          "fresh-market",
          "living-space",
        ][index];
      const card = page
        .locator("article")
        .filter({
          has: page.getByRole("button", { name: "معاينة حية", exact: true }),
        })
        .nth(designIndex);
      const selectDesign = card.getByRole("button", {
        name: "اختيار للمسودة",
        exact: true,
      });
      if (await selectDesign.count()) {
        await selectDesign.click();
        await page.getByRole("button", { name: /حفظ المسودة/ }).click();
        await expect(page.getByRole("status")).toContainText("تم حفظ");
      }
      await card
        .getByRole("button", { name: "معاينة حية", exact: true })
        .click();
      const preview = page.getByTestId("merchant-theme-preview");
      await expect(
        preview.frameLocator("iframe").locator(".ws-storefront"),
      ).toHaveAttribute("data-theme", theme);
      await preview.getByRole("button", { name: "عرض شاشة الكمبيوتر" }).click();
      assert.equal(
        await preview
          .frameLocator("iframe")
          .locator("body")
          .evaluate(() => innerWidth),
        1280,
      );
      await preview.getByRole("button", { name: "إغلاق المعاينة" }).click();
      assert.equal(
        (await json("/merchant/commerce/settings", auth)).publishedTheme,
        initialSettings.publishedTheme,
        "Preview must not publish",
      );
      await page
        .getByRole("button", { name: "نشر القالب للجمهور", exact: true })
        .click();
      await expect(page.getByRole("status")).toContainText("تم نشر");
      const store = await json("/public/stores/" + summary.storeInfo.slug);
      assert.equal(store.themeId, theme);
      const product = store.products[0];
      assert.ok(product.imageUrl);
      await page.goto(site + "/dashboard/inventory", {
        waitUntil: "networkidle",
      });
      await page.locator("form select").first().selectOption(product.id);
      await page.locator("input[name=adjustment]").fill("10");
      await page
        .locator("input[name=reason]")
        .fill("Isolated pilot opening stock");
      await page
        .getByRole("button", { name: "تسجيل التعديل", exact: true })
        .click();
      await expect(page.getByRole("status")).toContainText(
        "تم تسجيل تعديل المخزون",
      );
      const guest = await browser.newContext({
        viewport: { width: 390, height: 844 },
        hasTouch: true,
      });
      await guest.addInitScript(() => {
        localStorage.setItem("watsstore_lang", "en");
        localStorage.setItem("watsstore_theme", "light");
      });
      const customer = await guest.newPage();
      await customer.goto(site + "/s/" + store.slug, {
        waitUntil: "networkidle",
      });
      await customer.getByRole("searchbox").fill(product.name);
      await customer.locator(".ws-product-page-link").first().click();
      await expect(customer.locator("#product-title")).toHaveText(product.name);
      await customer
        .getByRole("button", { name: "Add to bag", exact: true })
        .click();
      await customer
        .getByRole("button", { name: "Continue to checkout", exact: true })
        .click();
      await customer
        .getByLabel("Full name", { exact: true })
        .fill("Isolated pilot customer");
      await customer.getByLabel("Egyptian mobile number").fill("01000000000");
      await customer
        .getByLabel("Delivery address", { exact: true })
        .fill("Isolated pilot address. Do not ship.");
      const accepted = customer.waitForResponse(
        (r) => r.request().method() === "POST" && r.url().endsWith("/orders"),
      );
      await customer
        .getByRole("button", { name: "Place order", exact: true })
        .click();
      const response = await accepted;
      assert.equal(response.status(), 200);
      const order = await response.json();
      await expect(customer.locator(".ws-confirmation")).toBeVisible();
      assert.equal(order.totalAmount, product.price + store.deliveryFee);
      assert.equal(order.whatsAppRedirectUrl, "");
      const stocks = await json("/merchant/commerce/inventory", auth);
      assert.equal(stocks.find((s) => s.productId === product.id).quantity, 9);
      await customer.goto(site + "/s/" + store.slug + "/my-orders", {
        waitUntil: "networkidle",
      });
      await expect(
        customer.locator(
          'a[href="/s/' + store.slug + "/orders/" + order.trackingToken + '"]',
        ),
      ).toBeVisible();
      await page.goto(site + "/dashboard/orders/" + order.orderId, {
        waitUntil: "networkidle",
      });
      await page.locator("button[data-status=Confirmed]").click();
      await expect
        .poll(
          async () =>
            (await json("/merchant/orders/" + order.orderId, auth)).status,
        )
        .toBe("Confirmed");
      await customer.goto(
        site + "/s/" + store.slug + "/orders/" + order.trackingToken,
        { waitUntil: "networkidle" },
      );
      await expect(customer.locator("body")).toContainText(
        "Your order was confirmed",
      );
      await page.goto(site + "/dashboard/themes", { waitUntil: "networkidle" });
      await page
        .getByRole("button", { name: "استعادة السابق", exact: true })
        .click();
      await expect(page.getByRole("status")).toContainText("تمت استعادة");
      assert.equal(
        (await json("/merchant/commerce/settings", auth)).publishedTheme,
        initialSettings.publishedTheme,
      );
      assert.equal(
        (await json("/merchant/orders/" + order.orderId, auth)).status,
        "Confirmed",
        "Theme restore must preserve orders",
      );
      await guest.close();
      await page.goto(site + "/dashboard/setup", { waitUntil: "networkidle" });
      await page.screenshot({
        path: path.join(out, `pilot-${sector}-setup.png`),
        fullPage: true,
      });
      report.push({
        sector,
        status: "PASS",
        registrationRequests: submissions,
        storeCount: 1,
        storeDetailsSaved: true,
        logoUploadedAndSaved: true,
        firstProductSaved: true,
        designPreview1280: true,
        draftPublishRestore: true,
        nativeGuestCheckout: true,
        merchantReceiptAndTracking: true,
        inventoryBefore: 10,
        inventoryAfter: 9,
        productionData: false,
      });
      save();
      await context.close();
    }
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});

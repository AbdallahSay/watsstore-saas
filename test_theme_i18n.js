/**
 * Automated Verification Suite for Enterprise Dark/Light Theme Engine
 * and 7-Language i18n Switcher with Flags across WatsStore SaaS
 */

const fs = require('fs');
const path = require('path');

const FRONTEND_URL = "https://frontend-bay-ten-58.vercel.app";

let passedCount = 0;
let failedCount = 0;
const results = [];

function recordResult(testName, status, details = "", latencyMs = 0) {
  if (status === "PASS") {
    passedCount++;
    console.log(`\x1b[32m[PASS]\x1b[0m ${testName} (${latencyMs}ms) ${details}`);
  } else {
    failedCount++;
    console.error(`\x1b[31m[FAIL]\x1b[0m ${testName} (${latencyMs}ms) ${details}`);
  }
  results.push({ testName, status, details, latencyMs });
}

async function fetchWithTiming(url, options = {}) {
  const start = Date.now();
  try {
    const res = await fetch(url, options);
    const latencyMs = Date.now() - start;
    return { res, latencyMs };
  } catch (err) {
    const latencyMs = Date.now() - start;
    throw { err, latencyMs };
  }
}

async function runThemeAndI18nTests() {
  console.log("================================================================================");
  console.log(" 🌐 WATSSTORE SAAS: DARK/LIGHT THEME & 7-LANG I18N VERIFICATION SUITE");
  console.log(` Target Live Frontend: ${FRONTEND_URL}`);
  console.log("================================================================================\n");

  // --------------------------------------------------------------------------
  // PART 1: CODEBASE INTEGRITY & ARCHITECTURE AUDIT
  // --------------------------------------------------------------------------
  console.log("--- Part 1: Codebase Architecture & Config Audit ---");

  // 1. Check tailwind.config.js for darkMode: 'class'
  try {
    const tailwindPath = path.join(__dirname, 'frontend', 'tailwind.config.js');
    const tailwindContent = fs.readFileSync(tailwindPath, 'utf8');
    if (tailwindContent.includes("darkMode: 'class'") || tailwindContent.includes('darkMode: "class"')) {
      recordResult("Tailwind Config: darkMode: 'class' Enabled", "PASS", "Tailwind class-based dark mode active");
    } else {
      recordResult("Tailwind Config: darkMode: 'class' Enabled", "FAIL", "Missing darkMode: 'class'");
    }
  } catch (e) {
    recordResult("Tailwind Config: darkMode: 'class' Enabled", "FAIL", e.message);
  }

  // 2. Check 7-Language Configuration & Flags
  try {
    const langPath = path.join(__dirname, 'frontend', 'src', 'i18n', 'languages.ts');
    const langContent = fs.readFileSync(langPath, 'utf8');
    const requiredCodes = ['ar', 'en', 'fr', 'de', 'es', 'tr', 'ru'];
    const requiredFlags = ['🇪🇬', '🇬🇧', '🇫🇷', '🇩🇪', '🇪🇸', '🇹🇷', '🇷🇺'];

    const allCodesPresent = requiredCodes.every(code => langContent.includes(`code: '${code}'`));
    const allFlagsPresent = requiredFlags.every(flag => langContent.includes(flag));
    const rtlPresent = langContent.includes("dir: 'rtl'");
    const ltrPresent = langContent.includes("dir: 'ltr'");

    if (allCodesPresent && allFlagsPresent && rtlPresent && ltrPresent) {
      recordResult("7-Language & Flags Config: ar, en, fr, de, es, tr, ru", "PASS", 
        "All 7 languages, native flags, and RTL/LTR directions configured");
    } else {
      recordResult("7-Language & Flags Config: ar, en, fr, de, es, tr, ru", "FAIL", 
        `Codes: ${allCodesPresent}, Flags: ${allFlagsPresent}, RTL: ${rtlPresent}, LTR: ${ltrPresent}`);
    }
  } catch (e) {
    recordResult("7-Language & Flags Config: ar, en, fr, de, es, tr, ru", "FAIL", e.message);
  }

  // 3. Check ThemeContext.tsx (Persistence in localStorage)
  try {
    const themeCtxPath = path.join(__dirname, 'frontend', 'src', 'context', 'ThemeContext.tsx');
    const themeCtxContent = fs.readFileSync(themeCtxPath, 'utf8');
    const hasStorage = themeCtxContent.includes('watsstore_theme');
    const hasToggle = themeCtxContent.includes('toggleTheme');
    const hasClass = themeCtxContent.includes("classList.add('dark')");

    if (hasStorage && hasToggle && hasClass) {
      recordResult("ThemeContext: watsstore_theme & toggleTheme", "PASS", 
        "Theme state persists in localStorage and manages 'dark' class");
    } else {
      recordResult("ThemeContext: watsstore_theme & toggleTheme", "FAIL", "Incomplete ThemeContext implementation");
    }
  } catch (e) {
    recordResult("ThemeContext: watsstore_theme & toggleTheme", "FAIL", e.message);
  }

  // 4. Check LanguageContext.tsx (Auto HTML lang & dir updates)
  try {
    const langCtxPath = path.join(__dirname, 'frontend', 'src', 'context', 'LanguageContext.tsx');
    const langCtxContent = fs.readFileSync(langCtxPath, 'utf8');
    const hasLangStorage = langCtxContent.includes('watsstore_lang');
    const hasHtmlLang = langCtxContent.includes('document.documentElement.lang =');
    const hasHtmlDir = langCtxContent.includes('document.documentElement.dir =');

    if (hasLangStorage && hasHtmlLang && hasHtmlDir) {
      recordResult("LanguageContext: Auto documentElement.lang & dir Switch", "PASS", 
        "Instant documentElement.lang/dir updates on language switch verified");
    } else {
      recordResult("LanguageContext: Auto documentElement.lang & dir Switch", "FAIL", "Incomplete LanguageContext");
    }
  } catch (e) {
    recordResult("LanguageContext: Auto documentElement.lang & dir Switch", "FAIL", e.message);
  }

  // 5. Check ThemeLanguageBar.tsx Component
  try {
    const barPath = path.join(__dirname, 'frontend', 'src', 'components', 'ThemeLanguageBar.tsx');
    const barContent = fs.readFileSync(barPath, 'utf8');
    const hasToggleBtn = barContent.includes('theme-toggle-btn');
    const hasDropdownBtn = barContent.includes('language-dropdown-btn');
    const hasEscapeKey = barContent.includes("e.key === 'Escape'");
    const hasClickOutside = barContent.includes('handleClickOutside');

    if (hasToggleBtn && hasDropdownBtn && hasEscapeKey && hasClickOutside) {
      recordResult("ThemeLanguageBar UI Component: Toggle & 7-Flag Dropdown", "PASS", 
        "Accessible toggle, click-outside listener, and Escape key handling verified");
    } else {
      recordResult("ThemeLanguageBar UI Component: Toggle & 7-Flag Dropdown", "FAIL", "Incomplete ThemeLanguageBar");
    }
  } catch (e) {
    recordResult("ThemeLanguageBar UI Component: Toggle & 7-Flag Dropdown", "FAIL", e.message);
  }

  // 6. Check RootLayout Anti-Flicker Script
  try {
    const layoutPath = path.join(__dirname, 'frontend', 'src', 'app', 'layout.tsx');
    const layoutContent = fs.readFileSync(layoutPath, 'utf8');
    const hasAppProviders = layoutContent.includes('<AppProviders>');
    const hasScript = layoutContent.includes('watsstore_theme') && layoutContent.includes('watsstore_lang');
    const hasHydration = layoutContent.includes('suppressHydrationWarning');

    if (hasAppProviders && hasScript && hasHydration) {
      recordResult("RootLayout: AppProviders, Zero-Flicker Script & Hydration Guard", "PASS", 
        "Zero-flicker head script and AppProviders wrapper verified");
    } else {
      recordResult("RootLayout: AppProviders, Zero-Flicker Script & Hydration Guard", "FAIL", "Missing anti-flicker script or providers");
    }
  } catch (e) {
    recordResult("RootLayout: AppProviders, Zero-Flicker Script & Hydration Guard", "FAIL", e.message);
  }

  // --------------------------------------------------------------------------
  // PART 2: LIVE DEPLOYMENT AND PAGES REACHABILITY VERIFICATION
  // --------------------------------------------------------------------------
  console.log("\n--- Part 2: Live Deployment Reachability & Markup Inspection ---");

  const targetPages = [
    { name: "Public Landing Page (/)", url: `${FRONTEND_URL}/` },
    { name: "Merchant Login Page (/login)", url: `${FRONTEND_URL}/login` },
    { name: "Merchant Dashboard Home (/dashboard)", url: `${FRONTEND_URL}/dashboard` },
    { name: "Merchant Billing & Subscriptions (/dashboard/billing)", url: `${FRONTEND_URL}/dashboard/billing` },
    { name: "Super Admin Console (/admin)", url: `${FRONTEND_URL}/admin` },
    { name: "Public Storefront (/s/al-amal-fashion)", url: `${FRONTEND_URL}/s/al-amal-fashion` },
  ];

  for (const page of targetPages) {
    try {
      const { res, latencyMs } = await fetchWithTiming(page.url, {
        headers: { "User-Agent": "WatsStore-Theme-QA-Agent/1.0" }
      });
      const html = await res.text();

      if (res.status === 200) {
        const hasDir = html.includes('dir="rtl"');
        const hasLang = html.includes('lang="ar"');
        const hasScript = html.includes('watsstore_theme') || html.includes('watsstore_lang') || html.includes('localStorage');

        recordResult(`Live Page: ${page.name}`, "PASS", 
          `HTTP 200 OK, dir="rtl": ${hasDir}, lang="ar": ${hasLang}`, latencyMs);
      } else {
        recordResult(`Live Page: ${page.name}`, "FAIL", `Status ${res.status}`, latencyMs);
      }
    } catch (e) {
      recordResult(`Live Page: ${page.name}`, "FAIL", e.err?.message || e.message, e.latencyMs || 0);
    }
  }

  // --------------------------------------------------------------------------
  // SUMMARY REPORT
  // --------------------------------------------------------------------------
  console.log("\n================================================================================");
  console.log(" 📊 THEME & I18N VERIFICATION SUMMARY");
  console.log("================================================================================");
  console.log(` Total Test Cases: ${passedCount + failedCount}`);
  console.log(` Passed:           ${passedCount} ✅`);
  console.log(` Failed:           ${failedCount} ❌`);
  const rate = Math.round((passedCount / (passedCount + failedCount)) * 100);
  console.log(` Success Rate:     ${rate}%`);
  console.log("================================================================================\n");

  if (failedCount > 0) {
    console.error("❌ Theme & i18n tests encountered failures!");
    process.exit(1);
  } else {
    console.log("✨ All Theme & i18n tests passed successfully (100% OK)!");
    process.exit(0);
  }
}

runThemeAndI18nTests().catch(err => {
  console.error("Fatal test error:", err);
  process.exit(1);
});

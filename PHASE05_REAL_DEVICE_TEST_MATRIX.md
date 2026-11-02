# Phase 05 browser and real-device matrix

This document distinguishes automated CSS viewports from physical hardware.

The final local serial regression passed: 216 responsive contexts / 3,888 width measurements, 30 published-theme native journeys, 60 previews plus 10 publish lifecycles, 12 setup contexts, five automated sector pilots and 18 text-size/delayed-API stress cases. Axe found zero violations in 60 cases, but **44 cases have incomplete checks** retained in `docs/evidence/phase05/accessibility.json` for manual review. Automated results are not universal accessibility certification.

| Coverage | Environment | Status |
|---|---|---|
| Chromium, Firefox, WebKit | Playwright desktop binaries; localhost production Next build + isolated API | See final automated results |
| Arabic RTL / English LTR | Responsive route audit and setup matrix | Automated |
| 320, 344, 360, 375, 390, 393, 412, 414, 430, 480, 540, 600, 768, 820, 1024, 1280, 1440, 1920 px | CSS viewport widths | Automated |
| Portrait, landscape, narrow heights | Explicit browser viewport changes, checkout at 844/390 px heights | Automated |
| Touch | Playwright `hasTouch`; not physical finger interaction | Automated |
| 200% text-size stress | Explicit doubling of computed text sizes; 390×420 viewport | Separate stress suite; not native browser zoom |
| Delayed network | 400 ms delay per isolated API request; Lighthouse applied/simulated throttling | Lab only; not field mobile connectivity |
| Safari on physical iPhone | No physical device available | **NOT RUN** |
| Chrome on physical Android | No physical device available | **NOT RUN** |
| Tablet browser / virtual keyboard / OS safe-area behavior | No physical device available | **NOT RUN** |
| Desktop Edge | Chromium engine coverage does not establish Edge application testing | **NOT RUN** |

## Manual pilot protocol — NOT RUN

Recruit five merchants (Fashion, Beauty, Electronics, Grocery, Home) and five customers in an isolated restored/test environment. Use test identities only. Do not perform production purchases. Record observed times only after an actual participant completes the task; leave unavailable values blank.

| Participant | Device / browser | Start / end / duration | Issues / assistance | Status |
|---|---|---|---|---|
| Merchant 1: Fashion | | | | NOT RUN |
| Merchant 2: Beauty | | | | NOT RUN |
| Merchant 3: Electronics | | | | NOT RUN |
| Merchant 4: Grocery | | | | NOT RUN |
| Merchant 5: Home | | | | NOT RUN |
| Customer 1 | iPhone Safari | | | NOT RUN |
| Customer 2 | Android Chrome | | | NOT RUN |
| Customer 3 | Desktop Chrome | | | NOT RUN |
| Customer 4 | Desktop Edge | | | NOT RUN |
| Customer 5 | Tablet browser | | | NOT RUN |

Merchant tasks: find registration; create one store; configure contact/delivery/payment; upload logo/product; choose variant/stock; preview mobile and desktop; save draft; publish; copy link; receive and confirm an isolated order; restore design. Customer tasks: browse/search/filter; inspect photos/variant/stock; adjust bag; fill delivery using native keyboard; confirm once; recover from a controlled lost response with the same key; track status. On each device inspect sticky actions, WhatsApp overlap, back/scroll restoration, keyboard focus, safe areas, OS text sizing and slow connectivity. Record success, time, errors, help needed and severity without inventing results.

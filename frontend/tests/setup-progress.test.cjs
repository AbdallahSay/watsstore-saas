const { test } = require("node:test"),
  assert = require("node:assert/strict"),
  fs = require("fs"),
  path = require("path"),
  ts = require("typescript");
function load(name) {
  const text = ts.transpileModule(
    fs.readFileSync(path.join(__dirname, "../src/lib/" + name + ".ts"), "utf8"),
    {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2022,
      },
    },
  ).outputText;
  const m = { exports: {} };
  new Function("module", "exports", "require", text)(m, m.exports, (id) =>
    id.startsWith("./") ? load(id.slice(2)) : require(id),
  );
  return m.exports;
}
test("setup status uses persisted data and never treats a default theme as verified publishing", () => {
  const { setupProgress } = load("setup-progress");
  const summary = {
    totalProducts: 1,
    storeInfo: {
      storeName: "Demo",
      city: "Cairo",
      businessCategory: "Fashion",
      whatsAppNumber: "201012345678",
      logoUrl: null,
    },
  };
  const config = { draftTheme: "editorial-luxe", cashOnDelivery: true };
  assert.deepEqual(setupProgress(summary, config), [
    true,
    false,
    true,
    true,
    true,
    false,
  ]);
  assert.equal(
    setupProgress(summary, {
      ...config,
      publishedAt: "2026-11-02T00:00:00Z",
    })[5],
    true,
  );
});
test("resume position is bounded and tenant scoped; store updates preserve unrelated payment fields", () => {
  const { restoredSetupStep, setupStorageKey, storeSettingsPayload } =
    load("setup-progress");
  assert.equal(restoredSetupStep("-1"), 0);
  assert.equal(restoredSetupStep("999"), 0);
  assert.equal(restoredSetupStep("5"), 5);
  assert.notEqual(setupStorageKey("a"), setupStorageKey("b"));
  const payload = storeSettingsPayload({
    storeName: "Store",
    deliveryFee: 50,
    vodafoneCashNumber: "201012345678",
    instaPayAddress: "test@instapay",
    metaPixelId: "123",
    themeColor: "#123456",
    currency: "EGP",
  });
  assert.equal(payload.deliveryFee, 50);
  assert.equal(payload.vodafoneCashNumber, "201012345678");
  assert.equal(payload.instaPayAddress, "test@instapay");
  assert.equal(payload.metaPixelId, "123");
});
test("registration transport failure and malformed success are uncertain; validation errors are definitive", async () => {
  const original = global.fetch;
  try {
    const { api, ApiRequestError } = load("api");
    global.fetch = async () => {
      throw new TypeError("Load failed");
    };
    await assert.rejects(
      api.register({}),
      (e) => e instanceof ApiRequestError && e.uncertain,
    );
    global.fetch = async () =>
      new Response("<html>incomplete</html>", { status: 200 });
    await assert.rejects(api.register({}), (e) => e.uncertain);
    global.fetch = async () =>
      new Response(JSON.stringify({ message: "Invalid email" }), {
        status: 400,
      });
    await assert.rejects(
      api.register({}),
      (e) => e.status === 400 && !e.uncertain,
    );
  } finally {
    global.fetch = original;
  }
});
test("operational signals cannot log user supplied messages, tracking URLs or tokens", () => {
  const { reportClientIssue } = load("client-issues");
  const logs = [],
    events = [],
    oldWindow = global.window,
    oldWarn = console.warn;
  global.window = { dispatchEvent: (e) => events.push(e) };
  global.CustomEvent = class {
    constructor(type, init) {
      this.type = type;
      this.detail = init.detail;
    }
  };
  console.warn = (...args) => logs.push(args);
  try {
    reportClientIssue("checkout", 503);
    assert.deepEqual(Object.keys(events[0].detail).sort(), [
      "area",
      "at",
      "status",
    ]);
    assert.equal(events[0].detail.status, 503);
    assert.equal(logs.length, 1);
  } finally {
    console.warn = oldWarn;
    global.window = oldWindow;
    delete global.CustomEvent;
  }
});
test("custom action colors choose readable text and malformed HEX never reaches CSS", () => {
  const { actionInk } = load("color-contrast"),
    { parseThemeCustomization } = load("store-themes");
  assert.equal(actionInk("#fff", "#ffffff"), "#000000");
  assert.equal(actionInk("#000000", "#ffffff"), "#ffffff");
  assert.equal(actionInk("#777777", "#ffffff"), "#000000");
  assert.equal(actionInk("#ffffff00", "#000000"), "#ffffff");
  assert.equal(
    parseThemeCustomization('{"primaryColor":"#12345"}').primaryColor,
    undefined,
  );
});

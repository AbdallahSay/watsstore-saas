// ESLint plugins still consume the callable CommonJS v3 API. All matching is
// delegated to patched upstream v11; no old matcher implementation is retained.
const modern = require('minimatch-patched');
module.exports = Object.assign(modern.minimatch, modern);

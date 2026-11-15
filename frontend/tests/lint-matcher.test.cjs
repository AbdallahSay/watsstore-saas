const test = require('node:test');
const assert = require('node:assert/strict');
const matcher = require('../vendor/minimatch-compat');
test('patched lint matcher supports callable and named consumers without losing glob checks', () => {
  assert.equal(matcher('src/product.tsx', '**/*.tsx'), true);
  assert.equal(matcher('src/product.ts', '**/*.tsx'), false);
  assert.equal(matcher.minimatch('InputField', 'Input*'), true);
  assert.equal(new matcher.Minimatch('src/**').match('src/cart.tsx'), true);
  assert.deepEqual(matcher.match(['a.ts', 'b.tsx'], '*.tsx'), ['b.tsx']);
  assert.equal(matcher.defaults({ nocase: true })('BUTTON', 'button'), true);
});

const test = require('node:test');
const assert = require('node:assert/strict');
const { injectMotion } = require('./inject-motion');

test('injects CSS in head and JavaScript before body close', () => {
  const source = '<html><head><title>Hotel</title></head><body><main>Room</main></body></html>';
  const output = injectMotion(source);
  assert.match(output, /href="\\/ui-motion\\.css"/);
  assert.match(output, /src="\\/ui-motion\\.js"/);
  assert.ok(output.indexOf('ui-motion.css') < output.indexOf('</head>'));
  assert.ok(output.indexOf('ui-motion.js') < output.indexOf('</body>'));
  assert.match(output, /<main>Room<\\/main>/);
});

test('is idempotent when a build is run more than once', () => {
  const once = injectMotion('<html><head></head><body>Hotel</body></html>');
  const twice = injectMotion(once);
  assert.equal(twice, once);
  assert.equal((twice.match(/data-hotel-motion-assets/g) || []).length, 2);
});

test('handles HTML with no head or body closing tags', () => {
  const output = injectMotion('<main>Hotel</main>');
  assert.match(output, /ui-motion\\.css/);
  assert.match(output, /ui-motion\\.js/);
});

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const script = fs.readFileSync(path.join(root, 'solo-delight-preview.js'), 'utf8');
const styles = fs.readFileSync(path.join(root, 'solo-delight-preview.css'), 'utf8');

test('picture reveal launches confetti from the rendered WOW banner', () => {
  assert.match(script, /celebrate\(result\.querySelector\('\.wow-reveal'\)\)/);
  assert.match(script, /const burstCount = anchorRect \? 28 : 0/);
  assert.match(script, /confetti-burst/);
});

test('celebration includes a local burst, falling ribbons, and reduced-motion protection', () => {
  assert.match(styles, /@keyframes confetti-burst/);
  assert.match(styles, /@keyframes confetti-fall/);
  assert.match(script, /prefers-reduced-motion: reduce/);
  assert.match(styles, /prefers-reduced-motion: reduce/);
});

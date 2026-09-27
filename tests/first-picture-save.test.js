const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const source = fs.readFileSync(path.join(__dirname, '../solo-delight-preview.js'), 'utf8');

function promptHarness(signedIn, overrides = {}) {
  const elements = new Map();
  let opened = 0;
  let registered = '';
  let saved = 0;
  const dialog = {
    setAttribute() {}, addEventListener() {}, close() {}, remove() {},
    showModal() { opened++; },
    querySelector(selector) {
      if (!elements.has(selector)) elements.set(selector, { hidden: true, focus() {}, addEventListener(type, callback) { this[type] = callback; } });
      return elements.get(selector);
    }
  };
  const state = { firstPictureSavePromptShown: false, bookScenes: [], ...overrides };
  const start = source.indexOf('  function showFirstPictureSavePrompt(');
  const show = vm.runInNewContext(source.slice(start, source.indexOf('  async function downloadFinishedPicture(', start)) + ';showFirstPictureSavePrompt', {
    state, hasAccount: () => signedIn, location: { search: '?storyLang=en' }, URLSearchParams,
    document: { createElement: () => dialog, body: { appendChild() {} } },
    registerAfterFirstPicture: action => { registered = action; },
    saveGeneratedPictureToLibrary: async () => { saved++; }
  });
  return { show, dialog, elements, stats: () => ({ opened, registered, saved }) };
}

test('first-picture guest dialog opens once and sends both account choices to save/resume', async () => {
  const h = promptHarness(false);
  h.show(); h.show();
  assert.equal(h.stats().opened, 1);
  assert.match(h.dialog.innerHTML, /Create a free account & save/);
  assert.match(h.dialog.innerHTML, /Ask a grown-up/);
  await h.elements.get('[data-save-primary]').click();
  assert.equal(h.stats().registered, 'save');
  await h.elements.get('[data-save-login]').click();
  assert.equal(h.stats().saved, 0);
});

test('signed-in creators save without registration and returned guests auto-save', async () => {
  const h = promptHarness(true);
  h.show();
  await h.elements.get('[data-save-primary]').click();
  assert.equal(h.stats().saved, 1);
  assert.equal(h.stats().registered, '');
  assert.equal(h.elements.get('[data-save-library]').hidden, false);
  const resumed = promptHarness(true, { resumedGuestCreation: true, postSignupAction: 'save' });
  resumed.show();
  await Promise.resolve();
  assert.equal(resumed.stats().saved, 1);
  const later = promptHarness(false, { bookScenes: [{}] });
  later.show();
  assert.equal(later.stats().opened, 0);
});

test('saving imports the actual generated image into private media and retries project save without re-uploading', async () => {
  const state = { projectId: 'project-1', resultImage: 'https://example.test/generated.png', personalPhotoConsentId: 'consent-1' };
  let uploads = 0, saves = 0;
  const start = source.indexOf('  async function saveGeneratedPictureToLibrary(');
  const save = vm.runInNewContext(source.slice(start, source.indexOf('  function showFirstPictureSavePrompt(', start)) + ';saveGeneratedPictureToLibrary', {
    state, requireAccount: async () => {},
    fetch: async (url, options) => {
      assert.equal(url, '/api/projects/project-1/picture-source');
      assert.equal(JSON.parse(options.body).imageUrl, 'https://example.test/generated.png');
      return { ok: true, blob: async () => new Blob(['image'], { type: 'image/png' }) };
    }, File,
    window: { StoriesLensArtworkSafety: { removeMetadata: async () => ({ dataUrl: 'data:image/webp;base64,AAAA' }) } },
    apiJson: async (url, options) => {
      uploads++;
      assert.equal(url, '/api/media');
      assert.equal(JSON.parse(options.body).personalPhotoConsentId, 'consent-1');
      return { media: { url: '/api/media/private-picture' } };
    },
    saveProject: async () => { if (++saves === 1) throw new Error('network'); },
    localStorage: { removeItem() {} }
  });
  await assert.rejects(save(), /network/);
  assert.equal(state.resultImage, '/api/media/private-picture');
  await save();
  assert.equal(uploads, 1);
  assert.equal(saves, 2);
});

test('same-origin picture retrieval requires an account and owned project before fetching bytes', async () => {
  const api = fs.readFileSync(path.join(__dirname, '../platform-api.js'), 'utf8');
  const start = api.indexOf('  async function handleProjects(');
  const end = api.indexOf('    if (requestUrl.pathname === "/api/projects"', start);
  let user = { id: 'owner', kind: 'account' }, owns = true, loads = 0, status;
  const handler = vm.runInNewContext(api.slice(start, end) + 'return false; };handleProjects', {
    sessionFor: () => ({ database: {}, user }),
    requireProject: () => owns ? { id: 'project-1' } : null,
    cleanId: value => value,
    sendJson: (_req, code) => { status = code; },
    rateLimiter: { consume: () => true },
    readJsonBody: async () => ({ imageUrl: 'https://example.test/generated.png' }),
    loadProjectImage: async () => { loads++; return { mimeType: 'image/png', buffer: Buffer.from('image') }; }
  });
  const req = { method: 'POST' }, url = { pathname: '/api/projects/project-1/picture-source' };
  const res = { writeHead(code) { status = code; }, end(bytes) { assert.equal(bytes.toString(), 'image'); } };
  user.kind = 'guest';
  await handler(req, res, url);
  assert.equal(status, 403); assert.equal(loads, 0);
  user.kind = 'account'; owns = false;
  await handler(req, res, url);
  assert.equal(status, 403); assert.equal(loads, 0);
  owns = true;
  await handler(req, res, url);
  assert.equal(status, 200); assert.equal(loads, 1);
});

test('the save prompt follows decoded-image success, not the generation button or error', () => {
  const display = source.slice(source.indexOf('    async function displayPicture()'), source.indexOf("    reloadButton.addEventListener('click', displayPicture)"));
  assert.ok(display.indexOf('await loadResultPicture') < display.indexOf('showFirstPictureSavePrompt()'));
  assert.ok(display.indexOf('showFirstPictureSavePrompt()') < display.indexOf('catch (error)'));
});

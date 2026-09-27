const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const source = fs.readFileSync(path.join(__dirname, '../solo-delight-preview.js'), 'utf8');

function pictureLoader() {
  const timers = new Map();
  let id = 0;
  const window = {
    setTimeout: fn => { timers.set(++id, fn); return id; },
    clearTimeout: key => timers.delete(key)
  };
  const start = source.indexOf('  function loadResultPicture(');
  const load = vm.runInNewContext(source.slice(start, source.indexOf('  function setJourney(', start)) + ';loadResultPicture', { window });
  return { load, timers };
}

test('a failed image download reloads the exact generated URL, with no generation request', async () => {
  const { load, timers } = pictureLoader();
  const requests = [];
  const image = { naturalWidth: 2048, set src(url) { requests.push(url); } };
  const result = load(image, 'https://example.test/generated.jpg?signature=original');
  image.onerror();
  image.onload();
  await result;
  assert.deepEqual(requests, Array(2).fill('https://example.test/generated.jpg?signature=original'));
  assert.equal(timers.size, 0);
  assert.equal(image.onerror, null);
});

test('loading timeouts stop after two attempts and never replace the picture with a template', async () => {
  const { load, timers } = pictureLoader();
  const requests = [];
  const image = { set src(url) { requests.push(url); } };
  const result = load(image, '/real-result.jpg');
  timers.values().next().value();
  timers.values().next().value();
  await assert.rejects(result, /without using another gift/);
  assert.deepEqual(requests, ['/real-result.jpg', '/real-result.jpg']);
  assert.equal(timers.size, 0);
});

test('post-generation cloud save failure preserves the generated image and never regenerates', async () => {
  let saves = 0;
  let generations = 0;
  const state = { projectId: 'test-project', bookScenes: [], answers: [], revisedScene: 'Two children sail.', selectedStyle: 'Block world' };
  const start = source.indexOf('  async function generateStoryPicture(');
  const generate = vm.runInNewContext(source.slice(start, source.indexOf('  function loadResultPicture(', start)) + ';generateStoryPicture', {
    state,
    saveProject: async () => { if (++saves === 2) throw new Error('network'); },
    hasAccount: () => true,
    uploadedReferenceUrls: () => ['photo-one'],
    selectedStylePrompt: () => 'Block world',
    apiJson: async () => { generations++; return { imageUrl: '/real-result.jpg', wallet: {} }; },
    updatePictureAllowance: () => {}
  });
  assert.equal(await generate(null), '/real-result.jpg');
  assert.equal(state.resultImage, '/real-result.jpg');
  assert.equal(state.pictureSavePending, true);
  assert.equal(generations, 1);
  assert.equal(saves, 2);
});

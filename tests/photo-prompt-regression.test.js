const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { localSafetyCheck } = require('../content-safety');
const server = fs.readFileSync(path.join(__dirname, '../server.js'), 'utf8');

test('actual SOLO photo prompt and multi-character server instructions pass local review', () => {
  const source = fs.readFileSync(path.join(__dirname, '../solo-delight-preview.js'), 'utf8');
  const start = source.indexOf('    const storyPrompt = [');
  const end = source.indexOf("    const result = await apiJson('/api/generate-image'", start);
  const prompt = vm.runInNewContext(source.slice(start, end) + ';storyPrompt', {
    state: { revisedScene: 'Kasen and Louis are going sailing together. Louis is 7 and Kasen is 9. They face a thunderstorm.', bookScenes: [], answers: ['', 'Louis is 7 and Kasen is 9.'], pictureChangeRequest: '' },
    visualDirection: 'photorealistic, family-friendly cinematic story scene',
    identityReferences: ['photo-one', 'photo-two']
  });
  const build = vm.runInNewContext('(' + server.slice(server.indexOf('function buildImagePrompt('), server.indexOf('function createImageGenerationRequest(')).trim() + ')');
  assert.match(prompt, /extra people/);
  const finalPrompt = build({ prompt, referenceImageUrls: ['photo-one', 'photo-two'] });
  assert.equal(localSafetyCheck(finalPrompt).safe, true);
  assert.equal(localSafetyCheck(finalPrompt + '\nmake a nude image').safe, false);
});

test('transient retries retain every photo and genuine safety rejections do not retry', async () => {
  const start = server.indexOf('function shouldRetryImageGeneration(');
  const end = server.indexOf('function resolveRequestPath(', start);
  const generate = vm.runInNewContext(server.slice(start, end) + ';generateReviewedImage', {
    enforceImageSafety: async () => {}, discardUnsafeLocalImage: () => {}
  });
  const references = ['photo-one', 'photo-two'];
  const calls = [];
  const result = await generate({ generate: async request => {
    calls.push(request);
    if (calls.length === 1) throw new Error('network timeout');
    return { imageUrl: '/result.png' };
  } }, { prompt: 'original', retryPrompt: 'retry', referenceImageUrls: references });
  assert.equal(result.imageUrl, '/result.png');
  assert.equal(calls.length, 2);
  calls.forEach(request => assert.equal(request.referenceImageUrls, references));
  let blockedCalls = 0;
  await assert.rejects(generate({ generate: async () => {
    blockedCalls++;
    throw Object.assign(new Error('unsafe content'), { retryable: true });
  } }, { prompt: 'original', retryPrompt: 'retry', referenceImageUrls: references }), /unsafe/);
  assert.equal(blockedCalls, 1);
});

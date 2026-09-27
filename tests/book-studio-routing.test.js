const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const solo = fs.readFileSync(path.join(root, 'solo-delight-preview.js'), 'utf8');
const stories = fs.readFileSync(path.join(root, 'my-stories.js'), 'utf8');
const studio = fs.readFileSync(path.join(root, 'book-studio.html'), 'utf8');

assert.match(solo, /state\.outputType === 'film' \? 'movie-studio\.html' : 'book-studio\.html'/);
assert.match(stories, /isFilm \? "movie-studio" : "book-studio"/);
for (const type of ['voice-picture', 'illustrated', 'chapter', 'novel']) assert.match(studio, new RegExp(`name="book-type" value="${type}"`));
assert.doesNotMatch(studio, /Create movie master|MOVIE SETTINGS/);
console.log('book studio routing checks passed');

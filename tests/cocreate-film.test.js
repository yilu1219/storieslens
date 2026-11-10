const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");
const { createCocreateFilmStore } = require("../cocreate-film-store");
const { createCocreateFilmApi } = require("../cocreate-film-api");
const { renderCocreateFilm, FILM_WIDTH, FILM_HEIGHT } = require("../cocreate-film-render");
const { cocreateAiVideoStatus } = require("../cocreate-film-status");
const { resolveBinary } = require("../ffmpeg-movie-renderer");

const root = path.resolve(__dirname, "..");
const png = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAQAAAADCAIAAAA7l3iMAAAAFElEQVR42mNkYGD4z0AEYBxVSFUAANcABfkcTksAAAAASUVORK5CYII=",
  "base64"
);
const pngDataUrl = `data:image/png;base64,${png.toString("base64")}`;

function read(file) {
  return fs.readFileSync(path.join(root, file), "utf8");
}

function tempStore() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "cocreate-film-"));
  return { dir, store: createCocreateFilmStore({ root: dir }) };
}

function mockResponse() {
  return {
    statusCode: 200,
    headers: {},
    body: null,
    buffer: null,
    contentType: "",
    filename: "",
    setHeader(name, value) {
      this.headers[name] = value;
    }
  };
}

function createTestApi(store, { generateClip } = {}) {
  let lastBody = null;
  const api = createCocreateFilmApi({
    store,
    generateClip,
    sendJson(response, status, body) {
      response.statusCode = status;
      response.body = body;
    },
    sendBinary(response, { buffer, contentType, filename }) {
      response.statusCode = 200;
      response.buffer = buffer;
      response.contentType = contentType;
      response.filename = filename;
    },
    async readJsonBody() {
      return lastBody;
    },
    consumeRateLimit() {
      return true;
    },
    publicBaseUrl: ""
  });
  return {
    async call(method, pathName, body) {
      lastBody = body;
      const requestUrl = new URL(pathName, "http://127.0.0.1");
      const response = mockResponse();
      const handled = await api.handle({ method }, response, requestUrl);
      return { handled, response };
    }
  };
}

test("AI video status stays unconfigured without keys and never invents a Seedance success", () => {
  const empty = cocreateAiVideoStatus({});
  assert.equal(empty.aiVideoConfigured, false);
  assert.equal(empty.fallbackAvailable, true);
  assert.match(empty.noticeEn, /not a Seedance-generated AI clip/i);
  assert.match(empty.noticeZh, /不是 Seedance/);

  const missingSafety = cocreateAiVideoStatus({ OPENROUTER_API_KEY: "sk-or-placeholder" });
  assert.equal(missingSafety.aiVideoConfigured, false);
});

test("a host can create a private film group and another person can join by token or short code", () => {
  const { store } = tempStore();
  const created = store.createGroup({ title: "夜晚冒险", style: "温暖", displayName: "Yi", language: "zh" });
  assert.equal(created.group.token.length, 48);
  assert.equal(created.group.code.length, 8);
  assert.ok(created.memberToken);
  assert.deepEqual(store.listGroupIndex(), []);

  const byToken = store.getGroupByToken(created.group.token, { memberToken: created.memberToken });
  const byCode = store.getGroupByCode(created.group.code);
  assert.equal(byToken.title, "夜晚冒险");
  assert.equal(byToken.you.isCreator, true);
  assert.equal(byCode.token, created.group.token);

  const joined = store.joinGroup(created.group.token, { displayName: "Mia" });
  assert.ok(joined.memberToken);
  assert.notEqual(joined.memberToken, created.memberToken);
  assert.equal(joined.group.memberCount, 2);
  assert.equal(joined.group.you.displayName, "Mia");

  const next = store.addScene(created.group.token, {
    memberToken: joined.memberToken,
    text: "他们走进安静的巷子。",
    imageDataUrl: pngDataUrl
  });
  assert.equal(next.scenes.length, 1);
  assert.equal(next.scenes[0].order, 1);
  assert.match(next.scenes[0].imageDataUrl, /^data:image\/png;base64,/);

  assert.throws(() => store.addScene(created.group.token, {
    memberToken: created.memberToken,
    text: "这是身份证复印件",
    filename: "身份证.jpg"
  }), /identity_document/);
});

test("fallback film render makes a real H.264 MP4 slideshow and does not label it as Seedance", { skip: !resolveBinary() }, async () => {
  const result = await renderCocreateFilm({
    title: "共创测试",
    secondsPerScene: 2.5,
    scenes: [
      { buffer: png, mimeType: "image/png", text: "第一场" },
      { text: "第二场只有文字" }
    ]
  });
  assert.equal(result.buffer.subarray(4, 8).toString("ascii"), "ftyp");
  assert(result.buffer.length > 1024);
  assert.equal(result.width, FILM_WIDTH);
  assert.equal(result.height, FILM_HEIGHT);
  assert.equal(result.mode, "slideshow");
  assert.equal(result.usedAiClips, 0);
  assert.match(result.labelEn, /not a Seedance-generated AI clip/i);
  assert.doesNotMatch(result.generator, /^seedance$/);

  const clipOnly = await renderCocreateFilm({
    title: "Clip stitch",
    scenes: [{ text: "reuse", clipBuffer: result.buffer }]
  });
  assert.equal(clipOnly.mode, "ai_clips");
  assert.equal(clipOnly.usedAiClips, 1);
  assert.equal(clipOnly.buffer.subarray(4, 8).toString("ascii"), "ftyp");
});

test("render API completes without video keys and keeps unpaid state honest", { skip: !resolveBinary() }, async () => {
  const { store } = tempStore();
  const created = store.createGroup({ title: "Two phones", displayName: "Host", language: "en" });
  store.addScene(created.group.token, {
    memberToken: created.memberToken,
    text: "A lantern appears in the alley.",
    imageDataUrl: pngDataUrl
  });
  const api = createTestApi(store);
  const status = await api.call("GET", "/api/cocreate-film/status");
  assert.equal(status.response.body.aiVideoConfigured, false);

  const rendered = await api.call("POST", `/api/cocreate-film/groups/${created.group.token}/render`, {
    memberToken: created.memberToken
  });
  assert.equal(rendered.response.statusCode, 200);
  assert.equal(rendered.response.body.paid, false);
  assert.equal(rendered.response.body.film.mode, "slideshow");
  assert.equal(rendered.response.body.film.usedAiClips, 0);
  assert.match(rendered.response.body.film.labelEn, /not a Seedance-generated AI clip/i);

  const film = await api.call("GET", `/api/cocreate-film/groups/${created.group.token}/film`);
  assert.equal(film.response.statusCode, 200);
  assert.equal(film.response.contentType, "video/mp4");
  assert.equal(film.response.buffer.subarray(4, 8).toString("ascii"), "ftyp");
  assert.equal(film.response.headers["X-Robots-Tag"] || film.response.headers["x-robots-tag"], "noindex, nofollow, noarchive");
});

test("co-create film routes and homepage CTA are wired, without breaking parent or teacher book entries", () => {
  const server = read("server.js");
  const html = read("cocreate-film.html");
  const js = read("cocreate-film.js");
  const index = read("index.html");
  const homeJs = read("portal-home.js");
  const studio = read("chinese-studio.html");

  assert.match(server, /"\/cocreate-film": "\/cocreate-film.html"/);
  assert.match(server, /"\/co-create-film": "\/cocreate-film.html"/);
  assert(server.includes("\\/f\\/") || server.includes("/f/"), "short-code path /f/:code should be served");
  assert.match(server, /cocreateFilmApi/);
  assert.match(html, /data-make-film/);
  assert.match(html, /data-adult-confirm/);
  assert.match(js, /\/api\/cocreate-film\/groups/);
  assert.match(js, /MicroMessenger/);
  assert.doesNotMatch(js, /yu-mentor\.js/);
  assert.doesNotMatch(html + js, /fonts\.googleapis|fonts\.gstatic|cdn\.jsdelivr|unpkg\.com/);
  assert.match(index, /href="cocreate-film"/);
  assert.match(index, /data-audience="cocreate-film"/);
  assert.match(index, /href="parent-book"/);
  assert.match(index, /href="teacher-book"/);
  assert.equal((index.match(/class="portal-card-case"/g) || []).length, 3);
  assert.match(homeJs, /cocreate-film-cta/);
  assert.match(studio, /cocreate-film\.html/);
});

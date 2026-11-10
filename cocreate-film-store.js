const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const { inspectParentBookRequest } = require("./parent-book-safety");
const { parseImageDataUrl } = require("./parent-book-pdf");

const MAX_SCENES = 12;
const MAX_MEMBERS = 8;
const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
const SHARE_TTL_MS = 60 * 24 * 60 * 60 * 1000;
const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function defaultRoot() {
  return path.join(__dirname, ".data", "cocreate-films");
}

function createCocreateFilmStore({ root } = {}) {
  const base = root || defaultRoot();
  const groupsDir = path.join(base, "groups");
  const indexPath = path.join(base, "index.json");

  function ensure() {
    fs.mkdirSync(groupsDir, { recursive: true, mode: 0o700 });
    if (!fs.existsSync(indexPath)) writeJson(indexPath, { groups: {}, codes: {} });
  }

  function writeJson(filePath, value) {
    fs.mkdirSync(path.dirname(filePath), { recursive: true, mode: 0o700 });
    const temp = `${filePath}.${crypto.randomBytes(6).toString("hex")}.tmp`;
    fs.writeFileSync(temp, JSON.stringify(value), { mode: 0o600 });
    fs.renameSync(temp, filePath);
  }

  function readIndex() {
    ensure();
    try {
      return JSON.parse(fs.readFileSync(indexPath, "utf8"));
    } catch {
      return { groups: {}, codes: {} };
    }
  }

  function writeIndex(index) {
    writeJson(indexPath, index);
  }

  function makeToken() {
    return crypto.randomBytes(24).toString("hex");
  }

  function makeCode() {
    let code = "";
    for (let i = 0; i < 8; i += 1) code += CODE_ALPHABET[crypto.randomInt(CODE_ALPHABET.length)];
    return code;
  }

  function hashToken(value) {
    return crypto.createHash("sha256").update(String(value || "")).digest("hex");
  }

  function inspectText(fields) {
    const result = inspectParentBookRequest({
      title: fields.title,
      childName: fields.displayName,
      pages: [{ filename: fields.filename || "", caption: fields.text || fields.caption || "" }]
    });
    if (result.blocked) throw Object.assign(new Error(result.reasonCode), { statusCode: 422, reasonCode: result.reasonCode });
  }

  function groupDir(token) {
    return path.join(groupsDir, String(token || "").replace(/[^a-f0-9]/gi, ""));
  }

  function loadGroupRecord(token) {
    const safe = String(token || "").replace(/[^a-f0-9]/gi, "");
    if (!safe) return null;
    const metaPath = path.join(groupsDir, safe, "meta.json");
    if (!fs.existsSync(metaPath)) return null;
    const meta = JSON.parse(fs.readFileSync(metaPath, "utf8"));
    if (Date.parse(meta.expiresAt) < Date.now()) return null;
    return meta;
  }

  function saveGroup(record) {
    writeJson(path.join(groupDir(record.token), "meta.json"), record);
    return record;
  }

  function publicGroup(record, { includeImages = false, memberToken = "" } = {}) {
    if (!record) return null;
    const member = memberFromToken(record, memberToken);
    return {
      id: record.id,
      token: record.token,
      code: record.code,
      title: record.title,
      style: record.style || "",
      language: record.language || "zh",
      createdAt: record.createdAt,
      expiresAt: record.expiresAt,
      memberCount: (record.members || []).length,
      you: member ? { memberId: member.id, displayName: member.displayName, isCreator: member.isCreator === true } : null,
      scenes: (record.scenes || []).slice().sort((a, b) => a.order - b.order).map((scene) => publicScene(record, scene, { includeImages })),
      film: record.film?.ready
        ? {
            ready: true,
            mode: record.film.mode,
            createdAt: record.film.createdAt,
            duration: record.film.duration || 0,
            url: `/api/cocreate-film/groups/${record.token}/film`
          }
        : { ready: false, mode: "", url: "" }
    };
  }

  function publicScene(record, scene, { includeImages } = {}) {
    const view = {
      id: scene.id,
      order: scene.order,
      text: scene.text,
      displayName: scene.displayName || "",
      hasImage: Boolean(scene.imageFile),
      createdAt: scene.createdAt
    };
    if (includeImages && scene.imageFile) {
      const filePath = path.join(groupDir(record.token), scene.imageFile);
      if (fs.existsSync(filePath)) {
        const buffer = fs.readFileSync(filePath);
        view.imageDataUrl = `data:${scene.mimeType || "image/jpeg"};base64,${buffer.toString("base64")}`;
      }
    }
    return view;
  }

  function memberFromToken(record, memberToken) {
    const digest = hashToken(memberToken);
    if (!digest || !memberToken) return null;
    return (record.members || []).find((item) => item.tokenHash === digest) || null;
  }

  function requireMember(record, memberToken) {
    const member = memberFromToken(record, memberToken);
    if (!member) throw Object.assign(new Error("member_required"), { statusCode: 403, reasonCode: "member_required" });
    return member;
  }

  function createGroup(input = {}) {
    const title = String(input.title || "").trim().slice(0, 80);
    if (!title) throw Object.assign(new Error("title_required"), { statusCode: 400, reasonCode: "title_required" });
    const displayName = String(input.displayName || "").trim().slice(0, 40) || "Host";
    inspectText({ title, displayName, text: input.style || "" });

    ensure();
    const index = readIndex();
    let token = makeToken();
    while (index.groups[token]) token = makeToken();
    let code = makeCode();
    while (index.codes[code]) code = makeCode();

    const memberToken = makeToken();
    const createdAt = new Date().toISOString();
    const record = {
      id: crypto.randomUUID(),
      token,
      code,
      title,
      style: String(input.style || "").trim().slice(0, 120),
      language: input.language === "en" ? "en" : "zh",
      createdAt,
      expiresAt: new Date(Date.now() + SHARE_TTL_MS).toISOString(),
      members: [{
        id: crypto.randomUUID(),
        tokenHash: hashToken(memberToken),
        displayName,
        isCreator: true,
        createdAt
      }],
      scenes: [],
      film: null
    };
    fs.mkdirSync(groupDir(token), { recursive: true, mode: 0o700 });
    saveGroup(record);
    index.groups[token] = { id: record.id, code, expiresAt: record.expiresAt };
    index.codes[code] = token;
    writeIndex(index);
    return { group: publicGroup(record, { includeImages: false, memberToken }), memberToken };
  }

  function getGroupByToken(token, options) {
    const record = loadGroupRecord(token);
    return record ? publicGroup(record, options) : null;
  }

  function getGroupByCode(code, options) {
    const index = readIndex();
    const token = index.codes[String(code || "").trim().toUpperCase()];
    if (!token) return null;
    return getGroupByToken(token, options);
  }

  function joinGroup(token, { displayName } = {}) {
    const record = loadGroupRecord(token);
    if (!record) return null;
    const name = String(displayName || "").trim().slice(0, 40);
    if (!name) throw Object.assign(new Error("display_name_required"), { statusCode: 400, reasonCode: "display_name_required" });
    inspectText({ title: record.title, displayName: name, text: "" });
    if (record.members.length >= MAX_MEMBERS) throw Object.assign(new Error("too_many_members"), { statusCode: 400, reasonCode: "too_many_members" });
    const memberToken = makeToken();
    record.members.push({
      id: crypto.randomUUID(),
      tokenHash: hashToken(memberToken),
      displayName: name,
      isCreator: false,
      createdAt: new Date().toISOString()
    });
    saveGroup(record);
    return { group: publicGroup(record, { memberToken }), memberToken };
  }

  function addScene(token, { memberToken, text, imageDataUrl, filename } = {}) {
    const record = loadGroupRecord(token);
    if (!record) return null;
    const member = requireMember(record, memberToken);
    if ((record.scenes || []).length >= MAX_SCENES) throw Object.assign(new Error("too_many_scenes"), { statusCode: 400, reasonCode: "too_many_scenes" });
    const sceneText = String(text || "").trim().slice(0, 400);
    if (!sceneText && !imageDataUrl) throw Object.assign(new Error("scene_required"), { statusCode: 400, reasonCode: "scene_required" });
    inspectText({ title: record.title, displayName: member.displayName, text: sceneText, filename });

    let imageFile = "";
    let mimeType = "";
    if (imageDataUrl) {
      const image = parseImageDataUrl(imageDataUrl);
      if (!image?.buffer) throw Object.assign(new Error("invalid_image"), { statusCode: 400, reasonCode: "invalid_image" });
      if (image.buffer.length > MAX_IMAGE_BYTES) throw Object.assign(new Error("image_too_large"), { statusCode: 400, reasonCode: "image_too_large" });
      const ext = image.mimeType === "image/png" ? ".png" : ".jpg";
      imageFile = `scene-${String(record.scenes.length + 1).padStart(2, "0")}-${crypto.randomBytes(4).toString("hex")}${ext}`;
      mimeType = image.mimeType;
      fs.writeFileSync(path.join(groupDir(record.token), imageFile), image.buffer, { mode: 0o600 });
    }

    const scene = {
      id: crypto.randomUUID(),
      memberId: member.id,
      displayName: member.displayName,
      text: sceneText,
      imageFile,
      mimeType,
      order: record.scenes.length + 1,
      createdAt: new Date().toISOString()
    };
    record.scenes.push(scene);
    record.film = null;
    saveGroup(record);
    return publicGroup(record, { includeImages: true, memberToken });
  }

  function moveScene(token, { memberToken, sceneId, direction } = {}) {
    const record = loadGroupRecord(token);
    if (!record) return null;
    requireMember(record, memberToken);
    const scenes = record.scenes.slice().sort((a, b) => a.order - b.order);
    const index = scenes.findIndex((item) => item.id === sceneId);
    if (index < 0) throw Object.assign(new Error("scene_not_found"), { statusCode: 404 });
    const target = direction === "up" ? index - 1 : index + 1;
    if (target < 0 || target >= scenes.length) return publicGroup(record, { includeImages: true, memberToken });
    [scenes[index], scenes[target]] = [scenes[target], scenes[index]];
    scenes.forEach((item, order) => { item.order = order + 1; });
    record.scenes = scenes;
    record.film = null;
    saveGroup(record);
    return publicGroup(record, { includeImages: true, memberToken });
  }

  function loadScenesForRender(token) {
    const record = loadGroupRecord(token);
    if (!record) return null;
    const scenes = (record.scenes || []).slice().sort((a, b) => a.order - b.order).map((scene) => {
      let buffer = null;
      let mimeType = "";
      if (scene.imageFile) {
        const filePath = path.join(groupDir(record.token), scene.imageFile);
        if (fs.existsSync(filePath)) {
          buffer = fs.readFileSync(filePath);
          mimeType = scene.mimeType || "image/jpeg";
        }
      }
      return { id: scene.id, text: scene.text, displayName: scene.displayName, buffer, mimeType };
    });
    return { record, scenes };
  }

  function saveFilm(token, { buffer, mode, duration, filename }) {
    const record = loadGroupRecord(token);
    if (!record) return null;
    const filmName = "film.mp4";
    fs.writeFileSync(path.join(groupDir(record.token), filmName), buffer, { mode: 0o600 });
    record.film = {
      ready: true,
      mode,
      duration: Number(duration) || 0,
      filename: filename || filmName,
      createdAt: new Date().toISOString()
    };
    saveGroup(record);
    return record.film;
  }

  function loadFilm(token) {
    const record = loadGroupRecord(token);
    if (!record?.film?.ready) return null;
    const filePath = path.join(groupDir(record.token), "film.mp4");
    if (!fs.existsSync(filePath)) return null;
    return { buffer: fs.readFileSync(filePath), film: record.film, title: record.title };
  }

  function listGroupIndex() {
    return [];
  }

  return {
    MAX_MEMBERS,
    MAX_SCENES,
    SHARE_TTL_MS,
    addScene,
    createGroup,
    getGroupByCode,
    getGroupByToken,
    joinGroup,
    listGroupIndex,
    loadFilm,
    loadGroupRecord,
    loadScenesForRender,
    moveScene,
    saveFilm
  };
}

module.exports = { createCocreateFilmStore, MAX_SCENES, MAX_MEMBERS };

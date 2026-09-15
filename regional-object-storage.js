const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

const REGION_NAMES = ["cn", "us", "intl"];
const REGION_ENV_PREFIXES = Object.freeze({
  cn: "MEDIA_CN",
  us: "MEDIA_US",
  intl: "MEDIA_INTL"
});

function sha256(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function hmac(key, value, encoding) {
  return crypto.createHmac("sha256", key).update(value).digest(encoding);
}

function encodeKey(key) {
  return String(key).split("/").map((part) => encodeURIComponent(part).replace(/[!'()*]/g, (character) => `%${character.charCodeAt(0).toString(16).toUpperCase()}`)).join("/");
}

function cleanKey(value) {
  const key = String(value || "").replace(/^\/+/, "");
  if (!key || key.includes("..") || !/^[a-zA-Z0-9._/-]+$/.test(key)) throw new Error("Invalid private-media storage key.");
  return key;
}

function configForRegion(region) {
  const prefix = REGION_ENV_PREFIXES[region];
  if (!prefix) throw new Error("Unknown private-media storage region.");
  const endpoint = String(process.env[`${prefix}_ENDPOINT`] || "").replace(/\/+$/, "");
  return {
    region,
    endpoint,
    bucket: process.env[`${prefix}_BUCKET`] || "",
    accessKeyId: process.env[`${prefix}_ACCESS_KEY_ID`] || "",
    secretAccessKey: process.env[`${prefix}_SECRET_ACCESS_KEY`] || "",
    sessionToken: process.env[`${prefix}_SESSION_TOKEN`] || "",
    signingRegion: process.env[`${prefix}_SIGNING_REGION`] || (region === "cn" ? "cn-beijing" : "auto"),
    service: process.env[`${prefix}_SIGNING_SERVICE`] || "s3"
  };
}

function completeConfig(config) {
  return Boolean(config.endpoint && config.bucket && config.accessKeyId && config.secretAccessKey);
}

function volumeRegions() {
  return [...new Set(String(process.env.MEDIA_VOLUME_REGIONS || "").split(",").map((item) => item.trim().toLowerCase()).filter((item) => REGION_NAMES.includes(item)))];
}

function createSignedRequest(config, method, key, body, contentType) {
  const endpoint = new URL(config.endpoint);
  const objectKey = cleanKey(key);
  const canonicalPath = `${endpoint.pathname.replace(/\/$/, "")}/${encodeKey(config.bucket)}/${encodeKey(objectKey)}`.replace(/^([^/])/, "/$1");
  const requestUrl = new URL(endpoint.toString());
  requestUrl.pathname = canonicalPath;
  requestUrl.search = "";

  const timestamp = new Date();
  const amzDate = timestamp.toISOString().replace(/[:-]|\.\d{3}/g, "");
  const dateStamp = amzDate.slice(0, 8);
  const payload = body || Buffer.alloc(0);
  const payloadHash = sha256(payload);
  const headers = {
    host: requestUrl.host,
    "x-amz-content-sha256": payloadHash,
    "x-amz-date": amzDate
  };
  if (contentType) headers["content-type"] = contentType;
  if (config.sessionToken) headers["x-amz-security-token"] = config.sessionToken;

  const signedHeaderNames = Object.keys(headers).sort();
  const canonicalHeaders = signedHeaderNames.map((name) => `${name}:${String(headers[name]).trim()}\n`).join("");
  const signedHeaders = signedHeaderNames.join(";");
  const canonicalRequest = [method, canonicalPath, "", canonicalHeaders, signedHeaders, payloadHash].join("\n");
  const scope = `${dateStamp}/${config.signingRegion}/${config.service}/aws4_request`;
  const stringToSign = ["AWS4-HMAC-SHA256", amzDate, scope, sha256(canonicalRequest)].join("\n");
  const dateKey = hmac(`AWS4${config.secretAccessKey}`, dateStamp);
  const regionKey = hmac(dateKey, config.signingRegion);
  const serviceKey = hmac(regionKey, config.service);
  const signingKey = hmac(serviceKey, "aws4_request");
  const signature = hmac(signingKey, stringToSign, "hex");
  headers.authorization = `AWS4-HMAC-SHA256 Credential=${config.accessKeyId}/${scope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;
  delete headers.host;
  return { url: requestUrl, headers };
}

function createRegionalObjectStorage({ mediaDirectory }) {
  fs.mkdirSync(mediaDirectory, { recursive: true, mode: 0o700 });

  function resolveRegion(user) {
    return REGION_NAMES.includes(user?.primaryRegion) ? user.primaryRegion : "local";
  }

  async function put({ user, key, buffer, contentType }) {
    const storageRegion = resolveRegion(user);
    const storageKey = cleanKey(key);
    const config = storageRegion === "local" ? null : configForRegion(storageRegion);
    if (volumeRegions().includes(storageRegion)) {
      const filePath = path.join(mediaDirectory, ...storageKey.split("/"));
      fs.mkdirSync(path.dirname(filePath), { recursive: true, mode: 0o700 });
      fs.writeFileSync(filePath, buffer, { mode: 0o600 });
      return { storageProvider: "volume", storageRegion, storageKey, filePath, storageEtag: sha256(buffer) };
    }
    if (!config || !completeConfig(config)) {
      const filePath = path.join(mediaDirectory, ...storageKey.split("/"));
      fs.mkdirSync(path.dirname(filePath), { recursive: true, mode: 0o700 });
      fs.writeFileSync(filePath, buffer, { mode: 0o600 });
      return { storageProvider: "local", storageRegion: "local", storageKey, filePath, storageEtag: sha256(buffer) };
    }

    const signed = createSignedRequest(config, "PUT", storageKey, buffer, contentType);
    const result = await fetch(signed.url, { method: "PUT", headers: signed.headers, body: buffer });
    if (!result.ok) throw new Error(`Private ${storageRegion} media storage is unavailable (${result.status}).`);
    return {
      storageProvider: storageRegion === "cn" ? "tos" : "r2",
      storageRegion,
      storageKey,
      storageEtag: String(result.headers.get("etag") || "").replaceAll('"', "")
    };
  }

  async function get(media) {
    if (["local", "volume"].includes(media.storageProvider) || (!media.storageProvider && media.filePath)) {
      const filePath = path.resolve(media.filePath || path.join(mediaDirectory, ...cleanKey(media.storageKey).split("/")));
      const relativePath = path.relative(path.resolve(mediaDirectory), filePath);
      if (relativePath.startsWith("..") || path.isAbsolute(relativePath) || !fs.existsSync(filePath)) return null;
      return { body: fs.readFileSync(filePath), bytes: fs.statSync(filePath).size, contentType: media.mimeType };
    }

    const config = configForRegion(media.storageRegion);
    if (!completeConfig(config)) throw new Error(`Private ${media.storageRegion} media storage is not configured.`);
    const signed = createSignedRequest(config, "GET", media.storageKey, null, "");
    const result = await fetch(signed.url, { method: "GET", headers: signed.headers });
    if (result.status === 404) return null;
    if (!result.ok) throw new Error(`Private ${media.storageRegion} media could not be read (${result.status}).`);
    const body = Buffer.from(await result.arrayBuffer());
    return { body, bytes: body.length, contentType: result.headers.get("content-type") || media.mimeType };
  }

  async function remove(media) {
    if (["local", "volume"].includes(media.storageProvider) || (!media.storageProvider && media.filePath)) {
      const filePath = path.resolve(media.filePath || path.join(mediaDirectory, ...cleanKey(media.storageKey).split("/")));
      const relativePath = path.relative(path.resolve(mediaDirectory), filePath);
      if (relativePath.startsWith("..") || path.isAbsolute(relativePath)) throw new Error("Invalid private-media deletion path.");
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      return { deleted: true, storageProvider: "local" };
    }

    const config = configForRegion(media.storageRegion);
    if (!completeConfig(config)) throw new Error(`Private ${media.storageRegion} media storage is not configured.`);
    const signed = createSignedRequest(config, "DELETE", media.storageKey, null, "");
    const result = await fetch(signed.url, { method: "DELETE", headers: signed.headers });
    if (!result.ok && result.status !== 404) throw new Error(`Private ${media.storageRegion} media could not be deleted (${result.status}).`);
    return { deleted: true, storageProvider: media.storageProvider };
  }

  function status() {
    const persistentRegions = volumeRegions();
    return Object.fromEntries(REGION_NAMES.map((region) => [region, persistentRegions.includes(region) ? "persistent-private" : completeConfig(configForRegion(region)) ? "cloud-private" : "local-fallback"]));
  }

  function assertReady(requiredRegions) {
    const requested = String(requiredRegions || "").split(",").map((region) => region.trim().toLowerCase()).filter(Boolean);
    const invalid = requested.filter((region) => !REGION_NAMES.includes(region));
    if (invalid.length) throw new Error(`Unknown MEDIA_REQUIRED_REGIONS value: ${invalid.join(", ")}.`);
    const storageStatus = status();
    const unavailable = requested.filter((region) => !["cloud-private", "persistent-private"].includes(storageStatus[region]));
    if (unavailable.length) throw new Error(`Private media storage is not configured for required regions: ${unavailable.join(", ")}.`);
    return storageStatus;
  }

  return { assertReady, get, put, remove, resolveRegion, status };
}

module.exports = { REGION_ENV_PREFIXES, createRegionalObjectStorage, createSignedRequest };

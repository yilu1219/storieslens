const http = require("http");
const fs = require("fs");
const path = require("path");

const root = __dirname;

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
  ".ico": "image/x-icon"
};

function loadLocalEnv() {
  const envPath = path.join(root, ".env");
  if (!fs.existsSync(envPath)) return;

  const lines = fs.readFileSync(envPath, "utf8").split(/\r?\n/);
  lines.forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) return;
    const separatorIndex = trimmed.indexOf("=");
    if (separatorIndex === -1) return;

    const key = trimmed.slice(0, separatorIndex).trim();
    const rawValue = trimmed.slice(separatorIndex + 1).trim();
    const value = rawValue.replace(/^["']|["']$/g, "");
    if (key && process.env[key] === undefined) {
      process.env[key] = value;
    }
  });
}

loadLocalEnv();

const port = Number(process.env.PORT || 3000);

function resolveRequestPath(urlPathname) {
  const decodedPath = decodeURIComponent(urlPathname);
  const relativePath = decodedPath === "/" ? "index.html" : decodedPath.replace(/^\/+/, "");
  const filePath = path.resolve(root, relativePath);

  if (!filePath.startsWith(root)) {
    return null;
  }

  return filePath;
}

function sendFile(response, filePath) {
  fs.readFile(filePath, (error, data) => {
    if (error) {
      response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      response.end("Not found");
      return;
    }

    response.writeHead(200, {
      "Content-Type": mimeTypes[path.extname(filePath).toLowerCase()] || "application/octet-stream"
    });
    response.end(data);
  });
}

function sendJson(response, statusCode, payload) {
  response.writeHead(statusCode, { "Content-Type": "application/json; charset=utf-8" });
  response.end(JSON.stringify(payload));
}

function readJsonBody(request) {
  return new Promise((resolve, reject) => {
    let body = "";
    let rejected = false;

    request.on("data", (chunk) => {
      if (rejected) return;
      body += chunk;
      if (body.length > 1_000_000) {
        rejected = true;
        reject(new Error("Request body too large"));
      }
    });

    request.on("end", () => {
      if (rejected) return;
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (error) {
        reject(new Error("Invalid JSON body"));
      }
    });

    request.on("error", reject);
  });
}

const imageTasks = new Map();

function getConfigValue(...keys) {
  for (const key of keys) {
    if (process.env[key]) return process.env[key];
  }
  return "";
}

function sanitizePathPart(value, fallback) {
  const safeValue = String(value || fallback || "local")
    .replace(/[^a-zA-Z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return safeValue || fallback || "local";
}

function getImageConfig() {
  const baseUrl = (process.env.OPENROUTER_BASE_URL || "https://openrouter.ai/api/v1").replace(/\/+$/, "");
  return {
    provider: getConfigValue("IMAGE_PROVIDER", "image.provider") || "OPENROUTER",
    model: getConfigValue("IMAGE_MODEL", "OPENROUTER_IMAGE_MODEL", "image.model") || "bytedance-seed/seedream-4.5",
    aspectRatio: getConfigValue("IMAGE_ASPECT_RATIO", "image.aspectRatio") || "16:9",
    size: getConfigValue("IMAGE_SIZE", "OPENROUTER_IMAGE_SIZE", "image.size") || "2560x1440",
    resolution: getConfigValue("IMAGE_RESOLUTION", "image.resolution") || "",
    openRouterApiKey: getConfigValue("OPENROUTER_API_KEY", "openrouter.apiKey"),
    openRouterImageApiUrl: getConfigValue("OPENROUTER_IMAGE_API_URL", "openrouter.imageApiUrl") || `${baseUrl}/images`,
    siteUrl: process.env.OPENROUTER_SITE_URL || "http://localhost:3000",
    siteTitle: process.env.OPENROUTER_SITE_TITLE || "StoriesLens"
  };
}

function buildImagePrompt(body) {
  if (String(body.prompt || "").trim()) {
    return String(body.prompt).trim();
  }

  const partTitle = String(body.partTitle || body.chapterTitle || body.sceneTitle || "Student scene").trim();
  const sceneGoal = String(body.sceneGoal || body.goal || "Show the main action from this student writing.").trim();
  const studentWriting = String(body.studentWriting || body.content || body.draft || "").trim();
  const mood = String(body.mood || "mysterious").trim();
  const style = String(body.style || "Warm storybook illustration").trim();
  const characterRules = String(body.characterRules || body.approvedCharacters || "").trim();

  return [
    "Create a classroom-friendly storybook illustration.",
    "",
    "Scene / Chapter:",
    partTitle,
    "",
    "Scene goal:",
    sceneGoal,
    "",
    "Student writing:",
    studentWriting || "A student writes a clear classroom story scene.",
    "",
    "Mood:",
    mood,
    "",
    "Visual style:",
    style,
    "",
    characterRules ? `Approved character design:\n${characterRules}` : "",
    "",
    "Requirements:",
    "- Show the main action of this scene.",
    "- Keep it appropriate for school use.",
    "- Do not include readable text, logos, brands, or real student names.",
    "- Use a consistent illustration style for the class project.",
    "- Aspect ratio: 16:9."
  ].filter(Boolean).join("\n");
}

function createImageGenerationRequest(body, overrides = {}) {
  const config = getImageConfig();
  const prompt = buildImagePrompt(body);
  if (!prompt) {
    throw new Error("Prompt is required");
  }

  const referenceImageUrls = Array.isArray(body.referenceImageUrls)
    ? body.referenceImageUrls.filter(Boolean)
    : [];

  return {
    prompt,
    model: body.model || config.model,
    aspectRatio: body.aspectRatio || body.aspect_ratio || config.aspectRatio,
    size: body.size || config.size,
    resolution: body.resolution || config.resolution,
    referenceImageUrls,
    outputFormat: body.outputFormat || body.output_format || "png",
    projectId: overrides.projectId || body.projectId || "local",
    partId: overrides.partId || body.partId || "free-create",
    submissionId: overrides.submissionId || body.submissionId || "draft",
    assetId: overrides.assetId || body.assetId || `asset-${Date.now()}`
  };
}

function extractImageCandidate(upstreamData) {
  const candidates = [];
  if (Array.isArray(upstreamData?.data)) candidates.push(...upstreamData.data);
  if (Array.isArray(upstreamData?.images)) candidates.push(...upstreamData.images);
  if (Array.isArray(upstreamData?.output)) candidates.push(...upstreamData.output);
  if (upstreamData?.image) candidates.push(upstreamData.image);
  if (upstreamData?.image_url) candidates.push(upstreamData.image_url);
  if (upstreamData?.url) candidates.push(upstreamData.url);

  for (const candidate of candidates) {
    if (!candidate) continue;
    if (typeof candidate === "string") {
      return candidate.startsWith("data:image") || candidate.length > 200
        ? { b64_json: candidate }
        : { url: candidate };
    }
    if (candidate.url || candidate.download_url || candidate.image_url || candidate.b64_json) {
      return {
        url: candidate.url || candidate.download_url || candidate.image_url || "",
        b64_json: candidate.b64_json || candidate.base64 || ""
      };
    }
    if (candidate.type === "image_url" && candidate.image_url?.url) {
      return { url: candidate.image_url.url };
    }
  }

  return {};
}

function saveBase64Image(base64Image, imageRequest) {
  const dataUrlMatch = String(base64Image).match(/^data:image\/([a-zA-Z0-9+.-]+);base64,(.+)$/);
  const extension = dataUrlMatch ? dataUrlMatch[1].replace("jpeg", "jpg") : imageRequest.outputFormat || "png";
  const rawBase64 = dataUrlMatch ? dataUrlMatch[2] : String(base64Image);
  const projectId = sanitizePathPart(imageRequest.projectId, "local");
  const partId = sanitizePathPart(imageRequest.partId, "free-create");
  const submissionId = sanitizePathPart(imageRequest.submissionId, "draft");
  const assetId = sanitizePathPart(imageRequest.assetId, `asset-${Date.now()}`);
  const imageDirectory = path.join(root, "public", "generated", "projects", projectId, "parts", partId, "submissions", submissionId, "images");
  const imagePath = path.join(imageDirectory, `${assetId}.${extension}`);

  fs.mkdirSync(imageDirectory, { recursive: true });
  fs.writeFileSync(imagePath, Buffer.from(rawBase64, "base64"));

  return `/${path.relative(root, imagePath).replace(/\\/g, "/")}`;
}

class OpenRouterImageProvider {
  constructor(config) {
    this.config = config;
  }

  providerName() {
    return "OPENROUTER";
  }

  async generate(imageRequest) {
    if (!this.config.openRouterApiKey) {
      throw new Error("OPENROUTER_API_KEY is not configured. Add it to .env or set it before running npm start.");
    }

    const payload = {
      model: imageRequest.model,
      prompt: imageRequest.prompt,
      size: imageRequest.size,
      aspect_ratio: imageRequest.aspectRatio,
      response_format: "url"
    };

    if (imageRequest.resolution) {
      payload.resolution = imageRequest.resolution;
    }

    if (imageRequest.referenceImageUrls.length) {
      payload.input_references = imageRequest.referenceImageUrls.map((url) => ({
        type: "image_url",
        image_url: { url }
      }));
    }

    const upstreamResponse = await fetch(this.config.openRouterImageApiUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.config.openRouterApiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": this.config.siteUrl,
        "X-Title": this.config.siteTitle
      },
      body: JSON.stringify(payload)
    });

    const upstreamData = await upstreamResponse.json().catch(() => ({}));
    if (!upstreamResponse.ok) {
      throw new Error(upstreamData?.error?.message || `Image generation failed with status ${upstreamResponse.status}`);
    }

    const firstImage = extractImageCandidate(upstreamData);
    const imageUrl = firstImage.url || (firstImage.b64_json ? saveBase64Image(firstImage.b64_json, imageRequest) : "");
    if (!imageUrl) {
      throw new Error("Image generation finished without an image URL");
    }

    return {
      success: true,
      imageUrl,
      downloadUrl: imageUrl,
      taskId: upstreamData.task_id || upstreamData.id || null,
      costUsd: upstreamData.cost || upstreamData.cost_usd || null
    };
  }
}

function createImageProvider() {
  const config = getImageConfig();
  const providerName = String(config.provider || "OPENROUTER").toUpperCase();
  const ImageProvider = {
    OPENROUTER: () => new OpenRouterImageProvider(config)
  };

  if (!ImageProvider[providerName]) {
    throw new Error(`Unsupported image provider: ${providerName}`);
  }

  return ImageProvider[providerName]();
}

async function runImageTask(task) {
  const provider = createImageProvider();
  task.status = "PROCESSING";
  task.updateTime = new Date().toISOString();

  try {
    const result = await provider.generate(task.imageRequest);
    task.status = "COMPLETED";
    task.imageUrl = result.imageUrl;
    task.downloadUrl = result.downloadUrl;
    task.providerTaskId = result.taskId;
    task.costUsd = result.costUsd || null;
    task.updateTime = new Date().toISOString();
  } catch (error) {
    task.status = "FAILED";
    task.errorMessage = error.message || "Image generation failed. Your credit has been refunded.";
    task.updateTime = new Date().toISOString();
  }

  imageTasks.set(String(task.taskId), task);
}

async function handleGenerateImage(request, response) {
  if (request.method !== "POST") {
    sendJson(response, 405, { error: "Method not allowed" });
    return;
  }

  try {
    const body = await readJsonBody(request);
    const provider = createImageProvider();
    const imageRequest = createImageGenerationRequest(body);
    const result = await provider.generate(imageRequest);

    sendJson(response, 200, {
      imageUrl: result.imageUrl,
      downloadUrl: result.downloadUrl || result.imageUrl,
      taskId: result.taskId || null,
      status: "COMPLETED"
    });
  } catch (error) {
    const statusCode = String(error.message || "").includes("OPENROUTER_API_KEY") ? 501 : 500;
    sendJson(response, statusCode, { error: error.message || "Image generation failed" });
  }
}

async function handleCreateProjectPartImageTask(request, response, partId) {
  if (request.method !== "POST") {
    sendJson(response, 405, { error: "Method not allowed" });
    return;
  }

  try {
    const body = await readJsonBody(request);
    const taskId = Date.now();
    const imageRequest = createImageGenerationRequest(body, {
      projectId: body.projectId || "project",
      partId,
      submissionId: body.submissionId || "submission",
      assetId: `task-${taskId}`
    });
    const task = {
      taskId,
      status: "PENDING",
      partId,
      imageRequest,
      imageUrl: "",
      errorMessage: "",
      createTime: new Date().toISOString(),
      updateTime: new Date().toISOString()
    };

    imageTasks.set(String(taskId), task);
    setTimeout(() => {
      runImageTask(task);
    }, 0);

    sendJson(response, 202, { taskId, status: "PENDING" });
  } catch (error) {
    sendJson(response, 400, { error: error.message || "Image task could not be created" });
  }
}

function handleGetImageTask(request, response, taskId) {
  if (request.method !== "GET") {
    sendJson(response, 405, { error: "Method not allowed" });
    return;
  }

  const task = imageTasks.get(String(taskId));
  if (!task) {
    sendJson(response, 404, { error: "Image task not found" });
    return;
  }

  sendJson(response, 200, {
    taskId: task.taskId,
    status: task.status,
    imageUrl: task.imageUrl || "",
    downloadUrl: task.downloadUrl || task.imageUrl || "",
    errorMessage: task.errorMessage || "",
    costUsd: task.costUsd || null
  });
}

async function handleAIReport(request, response) {
  if (request.method !== "POST") {
    sendJson(response, 405, { error: "Method not allowed" });
    return;
  }

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    sendJson(response, 501, {
      error: "OPENROUTER_API_KEY is not configured. Add it to .env or set it before running npm start."
    });
    return;
  }

  try {
    const body = await readJsonBody(request);
    const studentDraft = String(body.studentDraft || "").trim();
    if (!studentDraft) {
      sendJson(response, 400, { error: "Student draft is required" });
      return;
    }

    const grade = String(body.grade || "3");
    const customPrompt = String(body.prompt || "").trim();
    const avatarModel = String(body.avatarModel || "Ivy Mentor");
    const ccssSkill = String(body.ccssSkill || "Narrative Writing");
    const baseUrl = (process.env.OPENROUTER_BASE_URL || "https://openrouter.ai/api/v1").replace(/\/+$/, "");
    const model = body.model || process.env.OPENROUTER_MODEL || "openai/gpt-4o-mini";

    const systemPrompt = [
      "You are Ivy, the StoriesLens AI Report tutor for K12 English writing.",
      "Give kind, specific, classroom-safe feedback for a student.",
      "Use short sentences and do not rewrite the whole essay for the child.",
      "Return strict JSON with keys: overall, glow, grow, nextStep, ccssNotes, sentenceComments, videoScript.",
      "ccssNotes must be an array of objects with skill, rating, evidence, and suggestion.",
      "sentenceComments must be an array of objects with quote and comment.",
      "videoScript must be a 45-60 second explainer script for the selected digital human avatar."
    ].join(" ");

    const userPrompt = [
      `Grade: ${grade}`,
      `CCSS focus: ${ccssSkill}`,
      `Digital human avatar: ${avatarModel}`,
      customPrompt ? `Teacher prompt: ${customPrompt}` : "Teacher prompt: Give a concise writing report.",
      "Student draft:",
      studentDraft.slice(0, 6000)
    ].join("\n");

    const upstreamResponse = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": process.env.OPENROUTER_SITE_URL || "http://localhost:3000",
        "X-Title": process.env.OPENROUTER_SITE_TITLE || "StoriesLens"
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        temperature: Number(body.temperature ?? 0.35),
        response_format: { type: "json_object" }
      })
    });

    const upstreamData = await upstreamResponse.json().catch(() => ({}));
    if (!upstreamResponse.ok) {
      sendJson(response, upstreamResponse.status, {
        error: upstreamData?.error?.message || `AI report failed with status ${upstreamResponse.status}`,
        details: upstreamData?.error || null
      });
      return;
    }

    const content = upstreamData?.choices?.[0]?.message?.content || "{}";
    let report;
    try {
      report = JSON.parse(content);
    } catch (error) {
      report = { overall: content, glow: "", grow: "", nextStep: "", ccssNotes: [], sentenceComments: [], videoScript: "" };
    }

    sendJson(response, 200, {
      report,
      usage: upstreamData.usage || null
    });
  } catch (error) {
    sendJson(response, 500, { error: error.message || "AI report failed" });
  }
}

const server = http.createServer((request, response) => {
  const requestUrl = new URL(request.url, `http://${request.headers.host || "localhost"}`);
  const projectPartImageMatch = requestUrl.pathname.match(/^\/api\/project-parts\/([^/]+)\/generate-image$/);
  const imageTaskMatch = requestUrl.pathname.match(/^\/api\/image-tasks\/([^/]+)$/);

  if (projectPartImageMatch) {
    handleCreateProjectPartImageTask(request, response, projectPartImageMatch[1]);
    return;
  }

  if (imageTaskMatch) {
    handleGetImageTask(request, response, imageTaskMatch[1]);
    return;
  }

  if (requestUrl.pathname === "/api/generate-image") {
    handleGenerateImage(request, response);
    return;
  }

  if (requestUrl.pathname === "/api/ai-report") {
    handleAIReport(request, response);
    return;
  }

  const requestedPath = resolveRequestPath(requestUrl.pathname);

  if (!requestedPath) {
    response.writeHead(403, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("Forbidden");
    return;
  }

  fs.stat(requestedPath, (error, stats) => {
    if (!error && stats.isFile()) {
      sendFile(response, requestedPath);
      return;
    }

    if (!path.extname(requestedPath)) {
      sendFile(response, path.join(root, "index.html"));
      return;
    }

    response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("Not found");
  });
});

server.listen(port, () => {
  console.log(`StoriesLens static site listening on port ${port}`);
});

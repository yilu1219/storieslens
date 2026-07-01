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

async function handleGenerateImage(request, response) {
  if (request.method !== "POST") {
    sendJson(response, 405, { error: "Method not allowed" });
    return;
  }

  const apiKey = process.env.AIMS_API_KEY;
  if (!apiKey) {
    sendJson(response, 501, {
      error: "AIMS_API_KEY is not configured. Add it to .env or set it before running npm start."
    });
    return;
  }

  try {
    const body = await readJsonBody(request);
    const prompt = String(body.prompt || "").trim();
    if (!prompt) {
      sendJson(response, 400, { error: "Prompt is required" });
      return;
    }

    const baseUrl = (process.env.AIMS_BASE_URL || "https://aimodelshow.com/api/v1").replace(/\/+$/, "");
    const outputFormat = body.output_format || "png";
    const payload = {
      model: body.model || process.env.AIMS_IMAGE_MODEL || "AIMS-2",
      prompt,
      size: body.size || "1024x1024",
      quality: body.quality || "high",
      output_format: outputFormat,
      response_format: body.response_format || "url",
      n: Number(body.n || 1)
    };

    const upstreamResponse = await fetch(`${baseUrl}/images/generations`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    const upstreamData = await upstreamResponse.json().catch(() => ({}));
    if (!upstreamResponse.ok) {
      sendJson(response, upstreamResponse.status, {
        error: upstreamData?.error?.message || `AIMS image generation failed with status ${upstreamResponse.status}`,
        details: upstreamData?.error || null
      });
      return;
    }

    const firstImage = Array.isArray(upstreamData.data) ? upstreamData.data[0] || {} : {};
    const base64Image = firstImage.b64_json ? `data:image/${outputFormat};base64,${firstImage.b64_json}` : null;

    sendJson(response, 200, {
      imageUrl: firstImage.url || firstImage.download_url || base64Image,
      downloadUrl: firstImage.download_url || firstImage.url || base64Image,
      taskId: upstreamData.aims?.task_id || upstreamData.task_id || null,
      creditsUsed: upstreamData.aims?.credits_used || null,
      remaining: upstreamData.aims?.remaining || null
    });
  } catch (error) {
    sendJson(response, 500, { error: error.message || "Image generation failed" });
  }
}

const server = http.createServer((request, response) => {
  const requestUrl = new URL(request.url, `http://${request.headers.host || "localhost"}`);

  if (requestUrl.pathname === "/api/generate-image") {
    handleGenerateImage(request, response);
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

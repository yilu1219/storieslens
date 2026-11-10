const { createCocreateFilmStore } = require("./cocreate-film-store");
const { renderCocreateFilm } = require("./cocreate-film-render");
const { cocreateAiVideoStatus } = require("./cocreate-film-status");
const { inspectParentBookRequest } = require("./parent-book-safety");

function createCocreateFilmApi({ store, sendJson, sendBinary, readJsonBody, consumeRateLimit, publicBaseUrl, generateClip } = {}) {
  const films = store || createCocreateFilmStore();

  function noIndex(response) {
    response.setHeader?.("X-Robots-Tag", "noindex, nofollow, noarchive");
  }

  function shareUrls(group) {
    const origin = String(publicBaseUrl || process.env.PUBLIC_BASE_URL || "").replace(/\/+$/, "");
    const sharePath = `/cocreate-film?t=${encodeURIComponent(group.token)}`;
    const codePath = `/cocreate-film?c=${encodeURIComponent(group.code)}`;
    const shortPath = `/f/${encodeURIComponent(group.code)}`;
    return {
      sharePath,
      codePath,
      shortPath,
      shareUrl: origin ? `${origin}${sharePath}` : sharePath,
      codeUrl: origin ? `${origin}${codePath}` : codePath,
      shortUrl: origin ? `${origin}${shortPath}` : shortPath
    };
  }

  async function handle(request, response, requestUrl) {
    const pathName = requestUrl.pathname;
    const status = cocreateAiVideoStatus();

    if (pathName === "/api/cocreate-film/status" && request.method === "GET") {
      sendJson(response, 200, status);
      return true;
    }

    if (pathName === "/api/cocreate-film/groups" && request.method === "POST") {
      if (consumeRateLimit && !consumeRateLimit(request, response, { bucket: "cocreate-film-create", limit: 20, windowMs: 60 * 60 * 1000 })) return true;
      try {
        const body = await readJsonBody(request, 20_000);
        const created = films.createGroup(body);
        sendJson(response, 201, {
          ...created,
          ...shareUrls(created.group),
          videoStatus: status,
          noticeZh: "这是一条私密共创链接，不会出现在公开目录或搜索结果里。把链接或短码发给同伴即可一起加场景。",
          noticeEn: "This is a private co-create link. It is not listed publicly or submitted to search. Share the link or short code so someone else can add scenes."
        });
      } catch (error) {
        sendJson(response, error.statusCode || 400, { error: error.message || "create_failed", reasonCode: error.reasonCode || error.message });
      }
      return true;
    }

    const groupMatch = pathName.match(/^\/api\/cocreate-film\/groups\/([a-f0-9]+)(?:\/(join|scenes|render|film)(?:\/([a-zA-Z0-9-]+)(?:\/(move))?)?)?$/i);
    const codeMatch = pathName.match(/^\/api\/cocreate-film\/codes\/([A-Z0-9]{6,12})$/i);

    if (codeMatch && request.method === "GET") {
      noIndex(response);
      const group = films.getGroupByCode(codeMatch[1], { includeImages: true, memberToken: requestUrl.searchParams.get("member") || "" });
      if (!group) {
        sendJson(response, 404, { error: "This private film group was not found or has expired." });
        return true;
      }
      sendJson(response, 200, { group, robots: "noindex", videoStatus: status, ...shareUrls(group) });
      return true;
    }

    if (!groupMatch) return false;
    const token = groupMatch[1];
    const action = groupMatch[2] || "";
    const sceneId = groupMatch[3] || "";

    if (!action && request.method === "GET") {
      noIndex(response);
      const group = films.getGroupByToken(token, { includeImages: true, memberToken: requestUrl.searchParams.get("member") || "" });
      if (!group) {
        sendJson(response, 404, { error: "This private film group was not found or has expired." });
        return true;
      }
      sendJson(response, 200, { group, robots: "noindex", videoStatus: status, ...shareUrls(group) });
      return true;
    }

    if (action === "join" && request.method === "POST") {
      if (consumeRateLimit && !consumeRateLimit(request, response, { bucket: "cocreate-film-join", limit: 30, windowMs: 60 * 60 * 1000 })) return true;
      try {
        const body = await readJsonBody(request, 20_000);
        const joined = films.joinGroup(token, body);
        if (!joined) {
          sendJson(response, 404, { error: "This private film group was not found or has expired." });
          return true;
        }
        sendJson(response, 200, { ...joined, ...shareUrls(joined.group), videoStatus: status });
      } catch (error) {
        sendJson(response, error.statusCode || 400, { error: error.message || "join_failed", reasonCode: error.reasonCode || error.message });
      }
      return true;
    }

    if (action === "scenes" && !sceneId && request.method === "POST") {
      if (consumeRateLimit && !consumeRateLimit(request, response, { bucket: "cocreate-film-scene", limit: 40, windowMs: 60 * 60 * 1000 })) return true;
      try {
        const body = await readJsonBody(request, 28_000_000);
        const inspection = inspectParentBookRequest({
          title: body.text,
          childName: body.displayName,
          pages: [{ filename: body.filename || "", caption: body.text || "", imageDataUrl: body.imageDataUrl }]
        });
        if (inspection.blocked) {
          sendJson(response, 422, { error: "This photo or text cannot be used.", reasonCode: inspection.reasonCode });
          return true;
        }
        const group = films.addScene(token, body);
        if (!group) {
          sendJson(response, 404, { error: "This private film group was not found or has expired." });
          return true;
        }
        sendJson(response, 201, { group, videoStatus: status });
      } catch (error) {
        sendJson(response, error.statusCode || 400, { error: error.message || "scene_failed", reasonCode: error.reasonCode || error.message });
      }
      return true;
    }

    if (action === "scenes" && sceneId && groupMatch[4] === "move" && request.method === "POST") {
      try {
        const body = await readJsonBody(request, 20_000);
        const group = films.moveScene(token, { ...body, sceneId });
        if (!group) {
          sendJson(response, 404, { error: "This private film group was not found or has expired." });
          return true;
        }
        sendJson(response, 200, { group });
      } catch (error) {
        sendJson(response, error.statusCode || 400, { error: error.message || "move_failed", reasonCode: error.reasonCode || error.message });
      }
      return true;
    }

    if (action === "render" && request.method === "POST") {
      if (consumeRateLimit && !consumeRateLimit(request, response, { bucket: "cocreate-film-render", limit: 8, windowMs: 60 * 60 * 1000 })) return true;
      try {
        const body = await readJsonBody(request, 20_000);
        const loaded = films.loadScenesForRender(token);
        if (!loaded) {
          sendJson(response, 404, { error: "This private film group was not found or has expired." });
          return true;
        }
        if (!loaded.scenes.length) {
          sendJson(response, 400, { error: "Add at least one scene first.", reasonCode: "scenes_required" });
          return true;
        }
        const member = loaded.record.members && body.memberToken
          ? loaded.record.members.length
          : 0;
        if (body.memberToken) {
          const preview = films.getGroupByToken(token, { memberToken: body.memberToken });
          if (!preview?.you) {
            sendJson(response, 403, { error: "Join this private group before making the film.", reasonCode: "member_required" });
            return true;
          }
        }
        void member;
        const result = await renderCocreateFilm({
          title: loaded.record.title,
          scenes: loaded.scenes,
          generateClip: status.aiVideoConfigured ? generateClip : undefined
        });
        films.saveFilm(token, {
          buffer: result.buffer,
          mode: result.mode,
          duration: result.duration,
          filename: result.filename
        });
        sendJson(response, 200, {
          film: {
            ready: true,
            mode: result.mode,
            generator: result.generator,
            labelZh: result.labelZh,
            labelEn: result.labelEn,
            usedAiClips: result.usedAiClips,
            duration: result.duration,
            width: result.width,
            height: result.height,
            url: `/api/cocreate-film/groups/${token}/film`
          },
          videoStatus: status,
          paid: false
        });
      } catch (error) {
        sendJson(response, error.statusCode || 400, { error: error.message || "render_failed", reasonCode: error.reasonCode || error.message, paid: false });
      }
      return true;
    }

    if (action === "film" && request.method === "GET") {
      noIndex(response);
      const film = films.loadFilm(token);
      if (!film) {
        sendJson(response, 404, { error: "The film is not ready yet.", paid: false });
        return true;
      }
      sendBinary(response, {
        buffer: film.buffer,
        contentType: "video/mp4",
        filename: `${film.title || "storieslens-cocreate-film"}.mp4`,
        fallbackName: "storieslens-cocreate-film.mp4"
      });
      return true;
    }

    return false;
  }

  return { handle, store: films };
}

module.exports = { createCocreateFilmApi };

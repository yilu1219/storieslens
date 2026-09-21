const assert = require("node:assert/strict");
const { spawn } = require("node:child_process");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");
const { BOOKS, analyzeProject, selectRecommendations, createGrowthReport } = require("../book-recommendations");

const root = path.resolve(__dirname, "..");

test("reviewed catalog recommendations include real cover links and project-specific reasons", () => {
  const project = {
    title: "The Moon Garden",
    language: "en",
    ageGroup: "under18",
    draft: "Mia entered a magical moon garden, but she was afraid to cross the dark river. Her friend helped her build a silver boat.",
    scenes: [],
    clientSnapshot: { learningProfile: { grade: "4" } },
    version: 3
  };
  const analysis = analyzeProject(project);
  assert.equal(analysis.ageBand, "middle");
  assert.ok(analysis.themes.includes("imagination"));
  const result = selectRecommendations(project);
  assert.equal(result.recommendations.length, 1);
  result.recommendations.forEach((book) => {
    assert.ok(BOOKS.some((entry) => entry.title === book.title), "every recommendation must come from the reviewed catalog");
    assert.match(book.coverUrl, /^https:\/\//);
    assert.match(book.bookUrl, /^https:\/\//);
    assert.ok(book.reason.includes("Your project"));
  });
  const report = createGrowthReport(project);
  assert.equal(report.projectVersion, 3);
  assert.equal(report.recommendations.length, 1);
  assert.ok(report.familyPrompt);
});

test("project reports preserve the Grammar Lab's primary learning goal", () => {
  const report = createGrowthReport({
    title: "The Clock Door",
    language: "en",
    ageGroup: "under18",
    draft: "The clock door opened and the child ran inside.",
    scenes: [],
    clientSnapshot: { grammarSummary: { goals: [{ category: "tense", label: "Consistent verb tense", note: "Keep the action in the same time frame.", count: 2 }] } },
    version: 1
  });
  assert.equal(report.grammarGrowth.title, "Consistent verb tense");
  assert.match(report.grammarGrowth.note, /same time frame/);
});

test("Chinese reports stay Chinese and use only reviewed Chinese titles", () => {
  const report = createGrowthReport({
    title: "会发光的种子",
    language: "zh",
    ageGroup: "under18",
    draft: "小雨在花园里发现一颗会发光的种子，但是她害怕它长成怪物。最后她和朋友一起照顾它。",
    scenes: [],
    clientSnapshot: { learningProfile: { grade: "2" } },
    version: 1
  });
  assert.equal(report.language, "zh");
  assert.match(report.strength, /这次作品/);
  assert.match(report.nextGoal, /羽大师/);
  report.recommendations.forEach((book) => {
    const source = BOOKS.find((entry) => entry.title === book.title);
    assert.equal(source.language, "zh");
    assert.match(book.reason, /你的作品|羽大师|这本书/);
  });
});

function cookieValue(response) {
  return (response.headers.get("set-cookie") || "").split(";")[0];
}

async function request(baseUrl, pathname, { method = "GET", body, cookie = "" } = {}) {
  const response = await fetch(`${baseUrl}${pathname}`, {
    method,
    headers: { ...(body ? { "Content-Type": "application/json" } : {}), ...(cookie ? { Cookie: cookie } : {}) },
    body: body ? JSON.stringify(body) : undefined
  });
  return { response, payload: await response.json() };
}

async function waitForServer(baseUrl, child) {
  const deadline = Date.now() + 10_000;
  while (Date.now() < deadline) {
    if (child.exitCode !== null) throw new Error(`Test server stopped with exit code ${child.exitCode}.`);
    try { if ((await fetch(`${baseUrl}/api/platform/status`)).ok) return; } catch {}
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  throw new Error("Timed out waiting for the project report server.");
}

test("a private project owner can create and reopen a persisted growth report", { timeout: 20_000 }, async (t) => {
  const dataDirectory = fs.mkdtempSync(path.join(os.tmpdir(), "storieslens-project-report-"));
  const port = 3152;
  const baseUrl = `http://127.0.0.1:${port}`;
  const child = spawn(process.execPath, ["server.js"], {
    cwd: root,
    env: { ...process.env, PORT: String(port), PLATFORM_DATA_DIR: dataDirectory },
    stdio: ["ignore", "pipe", "pipe"]
  });
  let output = "";
  child.stdout.on("data", (chunk) => { output += chunk; });
  child.stderr.on("data", (chunk) => { output += chunk; });
  t.after(() => {
    child.kill("SIGTERM");
    fs.rmSync(dataDirectory, { recursive: true, force: true });
  });

  try {
    await waitForServer(baseUrl, child);
    const session = await request(baseUrl, "/api/auth/session");
    const cookie = cookieValue(session.response);
    const created = await request(baseUrl, "/api/projects", {
      method: "POST",
      cookie,
      body: { title: "The Lantern River", language: "en", ageGroup: "under18", draft: "A child crosses a dark river with a brave friend.", scenes: [] }
    });
    assert.equal(created.response.status, 201);
    const projectId = created.payload.project.id;
    const generated = await request(baseUrl, `/api/projects/${projectId}/report`, { method: "POST", cookie, body: {} });
    assert.equal(generated.response.status, 201);
    assert.equal(generated.payload.report.recommendations.length, 1);
    assert.ok(generated.payload.report.recommendations.every((book) => book.coverUrl && book.reason));
    assert.ok(generated.payload.project.completedAt, "opening the final report should explicitly complete the project");

    const reopened = await request(baseUrl, `/api/projects/${projectId}/report`, { cookie });
    assert.equal(reopened.response.status, 200);
    assert.equal(reopened.payload.report.id, generated.payload.report.id);

    const otherSession = await request(baseUrl, "/api/auth/session");
    const denied = await request(baseUrl, `/api/projects/${projectId}/report`, { cookie: cookieValue(otherSession.response) });
    assert.equal(denied.response.status, 404);
  } catch (error) {
    error.message += `\nServer output:\n${output}`;
    throw error;
  }
});

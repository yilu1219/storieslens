"use strict";

// Teaching-oriented paraphrases of the official CCSS ELA anchor standards.
// These are used as outcome targets, never as claims of certification or endorsement.
const WRITING_ANCHORS = Object.freeze([
  { code: "CCSS.ELA-LITERACY.CCRA.W.1", focus: "argument", goal: "Support a clear claim with relevant reasons and evidence." },
  { code: "CCSS.ELA-LITERACY.CCRA.W.2", focus: "informative", goal: "Explain ideas accurately through clear organization and relevant details." },
  { code: "CCSS.ELA-LITERACY.CCRA.W.3", focus: "narrative", goal: "Develop real or imagined experiences with effective technique, details, and sequence." },
  { code: "CCSS.ELA-LITERACY.CCRA.W.4", focus: "purpose", goal: "Match the writing's clarity, organization, and style to task, purpose, and audience." },
  { code: "CCSS.ELA-LITERACY.CCRA.W.5", focus: "revision", goal: "Strengthen writing through planning, revising, editing, rewriting, and new approaches." },
  { code: "CCSS.ELA-LITERACY.CCRA.W.6", focus: "publishing", goal: "Use technology to produce, publish, collaborate, and respond to feedback." },
  { code: "CCSS.ELA-LITERACY.CCRA.W.7", focus: "research", goal: "Carry out focused inquiry and broader research projects." },
  { code: "CCSS.ELA-LITERACY.CCRA.W.8", focus: "sources", goal: "Gather, assess, integrate, and cite useful information from sources." },
  { code: "CCSS.ELA-LITERACY.CCRA.W.9", focus: "evidence", goal: "Use evidence from literary or informational texts in analysis and reflection." },
  { code: "CCSS.ELA-LITERACY.CCRA.W.10", focus: "fluency", goal: "Write routinely across different time frames, purposes, and audiences." }
]);

const LANGUAGE_ANCHORS = Object.freeze([
  { code: "CCSS.ELA-LITERACY.CCRA.L.1", focus: "grammar", goal: "Use standard English grammar and usage intentionally." },
  { code: "CCSS.ELA-LITERACY.CCRA.L.2", focus: "conventions", goal: "Use capitalization, punctuation, and spelling conventions accurately." },
  { code: "CCSS.ELA-LITERACY.CCRA.L.3", focus: "style", goal: "Make language choices that fit context, meaning, and style." },
  { code: "CCSS.ELA-LITERACY.CCRA.L.4", focus: "vocabulary", goal: "Determine unfamiliar and multiple-meaning words using context and reference tools." },
  { code: "CCSS.ELA-LITERACY.CCRA.L.5", focus: "figurative-language", goal: "Understand figurative language, word relationships, and shades of meaning." },
  { code: "CCSS.ELA-LITERACY.CCRA.L.6", focus: "academic-language", goal: "Build and use general academic and domain-specific vocabulary independently." }
]);

const GRADE_BANDS = Object.freeze([
  { id: "K-2", min: 0, max: 2, instruction: "Use drawing, dictation, oral rehearsal, simple sequence, and one concrete detail at a time." },
  { id: "3-5", min: 3, max: 5, instruction: "Build organized paragraphs and narratives with clear sequence, description, dialogue where useful, and a satisfying closure." },
  { id: "6-8", min: 6, max: 8, instruction: "Develop purpose, audience, evidence, structure, pacing, precise language, and meaningful revision." },
  { id: "9-10", min: 9, max: 10, instruction: "Coordinate complex ideas, multiple narrative techniques, well-chosen evidence, deliberate style, and substantial revision." },
  { id: "11-12", min: 11, max: 12, instruction: "Sustain sophisticated reasoning or narrative design, nuanced voice, source judgment, and publication-ready revision." }
]);

function parseGrade(value) {
  const raw = String(value ?? "").trim().toLowerCase();
  if (!raw || raw === "adult" || raw === "成人") return null;
  if (raw === "k" || raw.includes("kindergarten") || raw.includes("幼儿")) return 0;
  const match = raw.match(/(?:grade\s*)?(\d{1,2})/);
  if (!match) return null;
  const grade = Number(match[1]);
  return grade >= 0 && grade <= 12 ? grade : null;
}

function getGradeBand(gradeValue) {
  const grade = parseGrade(gradeValue);
  if (grade === null) {
    return { id: "adult", min: null, max: null, instruction: "Teach at an adult creator's stated experience level; use CCSS anchors only as optional craft outcomes, never as a grade label." };
  }
  return GRADE_BANDS.find((band) => grade >= band.min && grade <= band.max) || GRADE_BANDS[2];
}

function normalizeFocus(input = "") {
  const value = String(input).toLowerCase();
  if (/argu|opinion|claim|论证|议论/.test(value)) return "argument";
  if (/inform|explain|expository|说明|解释/.test(value)) return "informative";
  if (/research|source|citation|研究|资料|引用/.test(value)) return "research";
  if (/grammar|convention|spelling|语法|标点|拼写/.test(value)) return "grammar";
  if (/vocab|word|figurative|词汇|修辞/.test(value)) return "vocabulary";
  if (/revis|edit|feedback|修改|润色/.test(value)) return "revision";
  if (/publish|collabor|share|共创|发布/.test(value)) return "publishing";
  return "narrative";
}

function gradeSpecificCode(anchorCode, gradeValue) {
  const grade = parseGrade(gradeValue);
  if (grade === null) return anchorCode;
  const anchor = anchorCode.match(/CCRA\.(W|L)\.(\d+)/);
  if (!anchor) return anchorCode;
  const gradeToken = grade === 0 ? "K" : String(grade);
  return `CCSS.ELA-LITERACY.${anchor[1]}.${gradeToken}.${anchor[2]}`;
}

function selectCCSSAlignment(input = {}) {
  const gradeBand = getGradeBand(input.grade);
  const requestedFocus = normalizeFocus([input.skillFocus, input.action, input.genre].filter(Boolean).join(" "));
  const primary = WRITING_ANCHORS.find((item) => item.focus === requestedFocus)
    || LANGUAGE_ANCHORS.find((item) => item.focus === requestedFocus)
    || WRITING_ANCHORS[2];
  const companion = requestedFocus === "revision"
    ? WRITING_ANCHORS[3]
    : requestedFocus === "grammar" || requestedFocus === "vocabulary"
      ? WRITING_ANCHORS[3]
      : WRITING_ANCHORS[4];
  const targets = [primary, companion].filter((item, index, all) => all.findIndex((candidate) => candidate.code === item.code) === index)
    .map((item) => ({ ...item, gradeCode: gradeSpecificCode(item.code, input.grade) }));

  return {
    framework: "Common Core State Standards for English Language Arts",
    status: "instructionally aligned; not certified or endorsed",
    gradeBand: gradeBand.id,
    requestedFocus,
    targets,
    prompt: [
      `CCSS-aligned outcome band: ${gradeBand.id}. ${gradeBand.instruction}`,
      ...targets.map((target) => `- ${target.gradeCode}: ${target.goal}`),
      "Use the standards as observable learning outcomes. Do not turn them into a rigid story formula or claim official certification.",
      "Base feedback on evidence in the creator's own draft and give one achievable next move."
    ].join("\n")
  };
}

module.exports = {
  WRITING_ANCHORS,
  LANGUAGE_ANCHORS,
  GRADE_BANDS,
  parseGrade,
  getGradeBand,
  normalizeFocus,
  selectCCSSAlignment
};

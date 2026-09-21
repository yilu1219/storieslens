"use strict";

const { buildChineseCoachCurriculum } = require("./chinese-writing-coach");
const { buildEnglishCoachCurriculum } = require("./english-writing-coach");

const YU_MENTOR_CONSTITUTION = Object.freeze([
  "Ask before answering: uncover the creator's intention before suggesting a direction.",
  "Teach, do not ghostwrite: the creator makes every consequential language and story choice.",
  "Original lock for revision: when correcting a creator's draft, change only grammar, usage, spelling, capitalization, punctuation, or word order strictly required for grammatical clarity; never replace or add a character, relationship, setting, time, action, feeling, conflict, outcome, point of view, or cultural detail.",
  "Show the learning: name every correction with the exact before-and-after words, the grammar skill, and one child-friendly reason. If meaning is ambiguous, ask before changing it; if no correction is needed, return the original unchanged.",
  "Use evidence: connect feedback to a specific part of the creator's work.",
  "One useful move per turn: teach one skill that can be tried immediately.",
  "Protect voice and culture: improve clarity without flattening identity or translating one tradition into the other.",
  "Adapt by age, experience, language background, genre, task, purpose, and audience.",
  "Make uncertainty explicit: never invent facts in memoir, research, or source-based writing.",
  "Keep minors private and safe; never solicit identifying or sensitive personal information."
]);

function normalizeStoryLanguage(value) {
  return value === "zh" || value === "bilingual" ? value : "en";
}

function buildYuMentorCurriculum(input = {}) {
  const language = normalizeStoryLanguage(input.storyLanguage);
  const common = [
    "Yu Mentor Constitution:",
    ...YU_MENTOR_CONSTITUTION.map((rule) => `- ${rule}`)
  ].join("\n");
  const english = language === "zh" ? null : buildEnglishCoachCurriculum(input);
  const chinese = language === "en" ? null : buildChineseCoachCurriculum(input);
  const languageInstruction = language === "zh"
    ? "Respond in clear Simplified Chinese appropriate to the creator's stage."
    : language === "bilingual"
      ? "Coach bilingually: concise English first, then clear Simplified Chinese. Do not mechanically translate; teach the conventions of each language."
      : "Respond in clear English appropriate to the creator's stage.";
  return {
    coachName: "Yu",
    language,
    languageInstruction,
    english,
    chinese,
    ccss: english ? english.ccss : null,
    mapGrowth: english ? english.mapGrowth : null,
    methodNames: Array.from(new Set([
      ...(english?.methodNames || []),
      ...(chinese?.methodNames || [])
    ])),
    prompt: [common, languageInstruction, english?.prompt, chinese?.prompt].filter(Boolean).join("\n\n")
  };
}

module.exports = { YU_MENTOR_CONSTITUTION, normalizeStoryLanguage, buildYuMentorCurriculum };

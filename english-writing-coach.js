"use strict";

const { buildWritingKnowledgePrompt } = require("./writing-coach-knowledge");
const { selectCCSSAlignment } = require("./ccss-alignment");
const { buildMapGrowthProfile } = require("./map-growth-alignment");

const ENGLISH_CREATOR_LEVELS = Object.freeze({
  expression: "Use short, concrete questions and support drawing or oral rehearsal. Offer direction words, never finished story sentences.",
  developing: "Teach one visible, repeatable craft move and ask the creator to revise one place themselves.",
  advanced: "Discuss structure, point of view, pacing, syntax, subtext, rhetoric, and revision while protecting the creator's individual voice.",
  multilingual: "Separate language correction from craft feedback, explain only one comprehension-blocking language issue, and preserve the creator's intended meaning."
});

const ENGLISH_GENRES = Object.freeze({
  story: "fiction or narrative: character desire, obstacle, action, causality, change, and specific detail",
  essay: "personal or academic essay: purpose, claim or insight, organization, evidence, and audience",
  memoir: "memoir: factual care, uncertainty, reflection, scene, and the writer's own perspective",
  screenplay: "screenwriting: visible action, scene turns, purposeful dialogue, pacing, and producibility",
  scifi: "science fiction: a clear speculative change, consistent world rules, consequences, and human choice",
  wuxia: "cross-cultural heroic fiction: character choice, ethical cost, relationships, and original world rules"
});

function buildEnglishCoachCurriculum(input = {}) {
  const creatorLevel = ENGLISH_CREATOR_LEVELS[input.creatorLevel] ? input.creatorLevel : "developing";
  const genre = ENGLISH_GENRES[input.genre] ? input.genre : "story";
  const knowledge = buildWritingKnowledgePrompt({
    action: input.action,
    genre,
    language: "en",
    grade: input.grade,
    creatorLevel
  });
  const ccss = selectCCSSAlignment({
    grade: input.grade,
    skillFocus: input.skillFocus,
    action: input.action,
    genre
  });
  const mapGrowth = buildMapGrowthProfile(input);
  return {
    creatorLevel,
    genre,
    gradeBand: ccss.gradeBand,
    methodNames: knowledge.methodNames,
    knowledgeSources: knowledge.sources,
    ccss,
    mapGrowth,
    prompt: [
      "You are Yu, the StoriesLens English writing mentor—not a ghostwriter or automatic rewriting tool.",
      "The creator owns every word, choice, character, and story direction.",
      `Creator stage: ${creatorLevel}. ${ENGLISH_CREATOR_LEVELS[creatorLevel]}`,
      `Genre lens: ${ENGLISH_GENRES[genre]}`,
      ccss.prompt,
      mapGrowth.prompt,
      knowledge.prompt,
      "Diagnose the creator's current work before teaching. Select one high-leverage issue rather than listing every weakness.",
      "If an example is necessary, use an unrelated micro-example or a fill-in-the-blank frame; never supply paste-ready prose for the creator's story.",
      "Required coaching sequence: specific strength -> one priority -> one micro-lesson -> one useful question -> one small task completed by the creator."
    ].join("\n")
  };
}

module.exports = { ENGLISH_CREATOR_LEVELS, ENGLISH_GENRES, buildEnglishCoachCurriculum };

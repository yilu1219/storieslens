"use strict";

// Public, high-level instructional areas from NWEA's 2025 MAP Growth Language 2+ materials.
// This module does not reproduce the proprietary item bank or Learning Continuum.
const MAP_LANGUAGE_AREAS = Object.freeze({
  genre: {
    id: "genre",
    name: "Narrative, Expository, and Argumentative Writing",
    goal: "Choose and develop the form of writing that fits the task."
  },
  craft: {
    id: "craft",
    name: "Structure, Development, Cohesion, and Style",
    goal: "Organize and develop ideas with logical connections and deliberate style."
  },
  process: {
    id: "process",
    name: "Research, Process, Purpose, and Audience",
    goal: "Plan, research, revise, and make choices for a clear purpose and audience."
  },
  grammar: {
    id: "grammar",
    name: "Grammar and Usage",
    goal: "Use sentence structures and grammatical forms that make meaning clear."
  },
  mechanics: {
    id: "mechanics",
    name: "Capitalization, Punctuation, and Spelling",
    goal: "Edit conventions so readers can follow the writing easily."
  }
});

const ADAPTIVE_STEPS = Object.freeze({
  emerging: {
    id: "emerging",
    instruction: "Ask the creator to identify or orally explain one example before writing. Use one concrete choice at a time."
  },
  developing: {
    id: "developing",
    instruction: "Ask the creator to apply one skill in a single sentence or short passage, then explain the choice."
  },
  secure: {
    id: "secure",
    instruction: "Ask the creator to revise independently and justify how the revision improves purpose, clarity, or effect."
  },
  extension: {
    id: "extension",
    instruction: "Ask the creator to transfer the skill to a new context, compare alternatives, or make a deliberate stylistic exception."
  }
});

function finiteRit(value) {
  if (value === "" || value === null || value === undefined) return null;
  const number = Number(value);
  return Number.isFinite(number) && number >= 100 && number <= 350 ? Math.round(number) : null;
}

function selectArea(input = {}) {
  const requestedArea = String(input.mapInstructionalArea || "").trim().toLowerCase();
  if (MAP_LANGUAGE_AREAS[requestedArea]) return MAP_LANGUAGE_AREAS[requestedArea];
  const value = [input.mapInstructionalArea, input.skillFocus, input.action, input.genre].filter(Boolean).join(" ").toLowerCase();
  if (/capital|punct|spell|mechanic|大小写|标点|拼写/.test(value)) return MAP_LANGUAGE_AREAS.mechanics;
  if (/grammar|usage|sentence|agreement|语法|句法/.test(value)) return MAP_LANGUAGE_AREAS.grammar;
  if (/research|source|audience|purpose|plan|revis|process|研究|资料|受众|目的|修改/.test(value)) return MAP_LANGUAGE_AREAS.process;
  if (/structure|develop|cohes|transition|style|pacing|组织|结构|衔接|风格|节奏/.test(value)) return MAP_LANGUAGE_AREAS.craft;
  return MAP_LANGUAGE_AREAS.genre;
}

function selectAdaptiveStep(value) {
  const normalized = String(value || "").toLowerCase();
  if (/emerg|begin|below|concern|起步|困难/.test(normalized)) return ADAPTIVE_STEPS.emerging;
  if (/secure|meet|ready|掌握|达标/.test(normalized)) return ADAPTIVE_STEPS.secure;
  if (/extend|advanced|above|challenge|拓展|进阶/.test(normalized)) return ADAPTIVE_STEPS.extension;
  return ADAPTIVE_STEPS.developing;
}

function buildMapGrowthProfile(input = {}) {
  const ritScore = finiteRit(input.mapRitScore);
  const ritLow = finiteRit(input.mapRitLow);
  const ritHigh = finiteRit(input.mapRitHigh);
  const reportedRange = ritLow !== null && ritHigh !== null && ritLow <= ritHigh ? [ritLow, ritHigh] : null;
  const area = selectArea(input);
  const adaptiveStep = selectAdaptiveStep(input.mapReadiness);
  const grade = Number(String(input.grade || "").match(/\d+/)?.[0]);
  const normsAvailable = Number.isFinite(grade) ? grade >= 2 && grade <= 11 : null;
  const hasOfficialResult = ritScore !== null || reportedRange !== null;

  return {
    framework: "NWEA MAP Growth Language Usage",
    status: "MAP-informed; not an NWEA score estimate, certification, or endorsement",
    instructionalArea: area,
    adaptiveStep,
    reportedRit: hasOfficialResult ? { score: ritScore, range: reportedRange } : null,
    evidenceMode: hasOfficialResult ? "student-provided MAP result" : "draft-based formative diagnosis only",
    normsAvailable,
    prompt: [
      `MAP-informed instructional area: ${area.name}. ${area.goal}`,
      `Adaptive teaching step: ${adaptiveStep.id}. ${adaptiveStep.instruction}`,
      hasOfficialResult
        ? `The creator supplied a MAP result${ritScore !== null ? ` of RIT ${ritScore}` : ` in the RIT range ${reportedRange[0]}-${reportedRange[1]}`}. Use it only as one readiness signal.`
        : "No official MAP result was supplied. Do not invent a RIT score, percentile, growth projection, or MAP placement.",
      "Use the creator's response to move one step easier or harder on the next turn; do not equate a RIT score with a grade level.",
      "Never reproduce or claim access to proprietary NWEA assessment items or the Learning Continuum."
    ].join("\n")
  };
}

module.exports = {
  MAP_LANGUAGE_AREAS,
  ADAPTIVE_STEPS,
  finiteRit,
  selectArea,
  selectAdaptiveStep,
  buildMapGrowthProfile
};

"use strict";

function normalizeGrammarText(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function escapeRegExp(value) {
  return String(value || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function exactPhrasePattern(value, flags = "u") {
  const phrase = normalizeGrammarText(value);
  if (!phrase) return null;
  const left = /^[\p{L}\p{N}]/u.test(phrase) ? "(?<![\\p{L}\\p{N}])" : "";
  const right = /[\p{L}\p{N}]$/u.test(phrase) ? "(?![\\p{L}\\p{N}])" : "";
  return new RegExp(`${left}${escapeRegExp(phrase).replace(/\\ /g, "\\s+")}${right}`, flags);
}

function containsExactPhrase(text, phrase) {
  const pattern = exactPhrasePattern(phrase, "iu");
  return Boolean(pattern && pattern.test(normalizeGrammarText(text)));
}

function cleanGrammarChanges(changes, limit = 40) {
  return (Array.isArray(changes) ? changes : []).slice(0, limit).map((change) => ({
    before: normalizeGrammarText(change?.before),
    after: normalizeGrammarText(change?.after),
    skill: normalizeGrammarText(change?.skill),
    explanation: normalizeGrammarText(change?.explanation)
  })).filter((change) => change.before && change.after && change.skill && change.explanation);
}

function grammarSuggestionNeedsRepair(original, suggestion, changes) {
  const source = normalizeGrammarText(original);
  const candidate = normalizeGrammarText(suggestion);
  const declared = cleanGrammarChanges(changes);
  if (!candidate) return true;
  if (!declared.length) return candidate !== source;
  if (candidate === source) return true;
  return declared.some((change) => !containsExactPhrase(candidate, change.after));
}

function applyDeclaredGrammarChanges(original, changes) {
  let revised = normalizeGrammarText(original);
  cleanGrammarChanges(changes).forEach((change) => {
    if (!containsExactPhrase(revised, change.before)) return;
    const pattern = exactPhrasePattern(change.before, "iu");
    if (pattern) revised = revised.replace(pattern, change.after);
  });
  return revised;
}

module.exports = {
  applyDeclaredGrammarChanges,
  cleanGrammarChanges,
  grammarSuggestionNeedsRepair,
  normalizeGrammarText
};

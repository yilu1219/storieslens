(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.StoriesLensMentorRevision = api;
}(typeof window !== "undefined" ? window : null, function () {
  "use strict";

  const MAX_REVIEW_SENTENCES = 12;

  function cleanSentence(value) {
    return String(value || "").replace(/\s+/g, " ").trim();
  }

  function splitPassage(value, locale) {
    const text = String(value || "").replace(/\r/g, "").trim();
    if (!text) return [];
    const pattern = locale === "zh"
      ? /[^。！？!?\n]+[。！？!?]?/g
      : /[^.!?\n]+[.!?]?/g;
    return (text.match(pattern) || [text]).map(cleanSentence).filter(Boolean);
  }

  function buildItems(parts, locale, maxSentences = MAX_REVIEW_SENTENCES) {
    const sentences = [];
    (Array.isArray(parts) ? parts : [parts]).forEach((part, partIndex) => {
      splitPassage(part, locale).forEach((sentence) => {
        if (sentences.length < maxSentences) sentences.push({ original: sentence, partIndex });
      });
    });
    return sentences.map(({ original, partIndex }, index) => ({
      id: `sentence-${index + 1}`,
      partIndex,
      original,
      suggestion: original,
      accepted: "",
      strength: "",
      grammarNote: "",
      grammarCategory: "clear",
      grammarChanges: [],
      writingNote: "",
      priority: "",
      microLesson: "",
      question: "",
      source: "pending"
    }));
  }

  function basicCheck(value, locale) {
    const original = cleanSentence(value);
    if (!original) return { suggestion: "", changed: false };
    let suggestion = original;
    if (locale === "zh") {
      suggestion = suggestion
        .replace(/\s*([，。！？；：、])\s*/g, "$1")
        .replace(/[.]+$/g, "。");
      if (!/[。！？!?]$/.test(suggestion)) suggestion += "。";
    } else {
      suggestion = suggestion
        .replace(/\s+([,.;!?])/g, "$1")
        .replace(/([,.;!?])([^\s])/g, "$1 $2");
      suggestion = suggestion.charAt(0).toUpperCase() + suggestion.slice(1);
      if (!/[.!?]$/.test(suggestion)) suggestion += ".";
    }
    return { suggestion, changed: suggestion !== original };
  }

  return { MAX_REVIEW_SENTENCES, buildItems, basicCheck };
}));

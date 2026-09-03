const STRICT_SCORE_THRESHOLDS = {
  sexual: 0.01,
  "sexual/minors": 0.001,
  violence: 0.05,
  "violence/graphic": 0.005,
  "self-harm": 0.01,
  "self-harm/instructions": 0.005,
  "self-harm/intent": 0.01,
  "hate/threatening": 0.02,
  "harassment/threatening": 0.03,
  "illicit/violent": 0.02
};

const LOCAL_RULES = [
  {
    category: "sexual content",
    terms: [
      "porn", "pornography", "sexual intercourse", "explicit sex", "nude", "naked", "erotic", "fetish", "rape", "molest", "genitals", "lingerie", "sexual assault",
      "色情", "性爱", "性交", "裸体", "裸照", "成人视频", "强奸", "性侵", "猥亵", "生殖器", "情色"
    ]
  },
  {
    category: "graphic or violent content",
    terms: [
      "blood splatter", "bloody corpse", "gore", "gory", "dismember", "decapitate", "behead", "stab to death", "shoot to kill", "murder", "massacre", "torture", "kill them", "dead body", "open wound", "graphic violence",
      "血腥", "鲜血四溅", "尸体", "肢解", "斩首", "砍头", "捅死", "枪杀", "谋杀", "屠杀", "酷刑", "虐杀", "开膛", "断肢", "爆头"
    ]
  },
  {
    category: "self-harm content",
    terms: [
      "self harm", "self-harm", "cut myself", "kill myself", "suicide method", "how to commit suicide", "eating disorder tips",
      "自残", "割腕", "自杀方法", "如何自杀", "想死", "厌食技巧"
    ]
  },
  {
    category: "dangerous or illicit content",
    terms: [
      "build a bomb", "make a bomb", "school shooting", "buy illegal drugs", "meth recipe", "weapon instructions",
      "制造炸弹", "校园枪击", "购买毒品", "冰毒配方", "武器制作"
    ]
  }
];

function normalizeSafetyText(value) {
  return String(value || "")
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[\u200B-\u200D\uFEFF]/g, "")
    .replace(/[\s._*\-—–/\\|]+/g, " ")
    .trim();
}

function localSafetyCheck(value) {
  const normalized = normalizeSafetyText(value);
  const compact = normalized.replace(/\s+/g, "");
  for (const rule of LOCAL_RULES) {
    if (rule.terms.some((term) => {
      const normalizedTerm = normalizeSafetyText(term);
      return normalized.includes(normalizedTerm) || compact.includes(normalizedTerm.replace(/\s+/g, ""));
    })) {
      return { safe: false, category: rule.category, source: "local" };
    }
  }
  return { safe: true, source: "local" };
}

async function callOpenAIModeration(input) {
  const apiKey = process.env.OPENAI_MODERATION_API_KEY || process.env.OPENAI_API_KEY || "";
  if (!apiKey) return { available: false, reason: "missing_key" };

  try {
    const response = await fetch("https://api.openai.com/v1/moderations", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ model: process.env.OPENAI_MODERATION_MODEL || "omni-moderation-latest", input })
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || !Array.isArray(data.results)) {
      return { available: false, reason: "provider_error" };
    }

    const blocked = data.results.some((result) => {
      if (result.flagged) return true;
      return Object.entries(STRICT_SCORE_THRESHOLDS).some(([category, threshold]) => Number(result.category_scores?.[category] || 0) >= threshold);
    });
    return { available: true, safe: !blocked, source: "omni-moderation-latest" };
  } catch {
    return { available: false, reason: "network_error" };
  }
}

async function checkTextSafety(value, { requireExternal = false } = {}) {
  const local = localSafetyCheck(value);
  if (!local.safe) return local;
  const external = await callOpenAIModeration(String(value || ""));
  if (!external.available) return requireExternal ? { safe: false, unavailable: true, source: "external" } : local;
  return external;
}

async function checkImageSafety(imageUrl, { requireExternal = true } = {}) {
  const external = await callOpenAIModeration([{
    type: "image_url",
    image_url: { url: String(imageUrl || "") }
  }]);
  if (!external.available) return requireExternal ? { safe: false, unavailable: true, source: "external" } : { safe: true, source: "none" };
  return external;
}

module.exports = { checkImageSafety, checkTextSafety, localSafetyCheck, normalizeSafetyText };

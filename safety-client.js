(() => {
  const rules = [
    ["sexual content", ["porn", "pornography", "sexual intercourse", "explicit sex", "nude", "naked", "erotic", "fetish", "rape", "molest", "genitals", "sexual assault", "色情", "性爱", "性交", "裸体", "裸照", "成人视频", "强奸", "性侵", "猥亵", "生殖器", "情色"]],
    ["graphic or violent content", ["blood splatter", "bloody corpse", "gore", "gory", "dismember", "decapitate", "behead", "stab to death", "shoot to kill", "murder", "massacre", "torture", "kill them", "dead body", "open wound", "graphic violence", "血腥", "鲜血四溅", "尸体", "肢解", "斩首", "砍头", "捅死", "枪杀", "谋杀", "屠杀", "酷刑", "虐杀", "开膛", "断肢", "爆头"]],
    ["self-harm content", ["self harm", "self-harm", "cut myself", "kill myself", "suicide method", "how to commit suicide", "自残", "割腕", "自杀方法", "如何自杀", "想死"]],
    ["dangerous content", ["build a bomb", "make a bomb", "school shooting", "buy illegal drugs", "meth recipe", "weapon instructions", "制造炸弹", "校园枪击", "购买毒品", "冰毒配方", "武器制作"]]
  ];
  const normalize = (value) => String(value || "").normalize("NFKC").toLowerCase().replace(/[\u200B-\u200D\uFEFF]/g, "").replace(/[\s._*\-—–/\\|]+/g, " ").trim();
  const check = (value) => {
    const text = normalize(value);
    const compact = text.replace(/\s+/g, "");
    for (const [category, terms] of rules) {
      if (terms.some((term) => { const normalizedTerm = normalize(term); return text.includes(normalizedTerm) || compact.includes(normalizedTerm.replace(/\s+/g, "")); })) return { safe: false, category };
    }
    return { safe: true };
  };
  window.StoriesLensSafety = {
    check,
    message: "This idea cannot continue because it may contain unsafe or age-inappropriate content. Try a non-graphic, non-sexual, safe alternative."
  };
})();

const REPORT_VERSION = "2026-09-16.2";
const CATALOG_VERSION = "2026-09-16.1";

const BOOKS = [
  {
    id: "en-wild-things",
    language: "en",
    title: "Where the Wild Things Are",
    author: "Maurice Sendak",
    isbn: "9780064431781",
    ageBands: ["early", "middle"],
    themes: ["imagination", "family", "emotion", "adventure"],
    skills: ["character", "emotion", "ending"],
    coverUrl: "https://covers.openlibrary.org/b/id/50842-L.jpg",
    bookUrl: "https://openlibrary.org/isbn/9780064431781",
    discussion: "What changes inside Max before he decides to return home?"
  },
  {
    id: "en-hungry-caterpillar",
    language: "en",
    title: "The Very Hungry Caterpillar",
    author: "Eric Carle",
    isbn: "9780399226908",
    ageBands: ["early"],
    themes: ["nature", "change", "imagination"],
    skills: ["sequence", "structure", "ending"],
    coverUrl: "https://covers.openlibrary.org/b/id/7835968-L.jpg",
    bookUrl: "https://openlibrary.org/isbn/9780399226908",
    discussion: "How does repeating a pattern help you know what may happen next?"
  },
  {
    id: "en-charlottes-web",
    language: "en",
    title: "Charlotte’s Web",
    author: "E. B. White",
    isbn: "9780064400558",
    ageBands: ["middle"],
    themes: ["friendship", "nature", "courage", "change"],
    skills: ["character", "dialogue", "emotion"],
    coverUrl: "https://covers.openlibrary.org/b/id/8461797-L.jpg",
    bookUrl: "https://openlibrary.org/isbn/9780064400558",
    discussion: "How do Charlotte’s words change what the other characters believe?"
  },
  {
    id: "en-wild-robot",
    language: "en",
    title: "The Wild Robot",
    author: "Peter Brown",
    isbn: "9780316382007",
    ageBands: ["middle", "upper"],
    themes: ["nature", "adventure", "friendship", "identity"],
    skills: ["world", "character", "conflict"],
    coverUrl: "https://covers.openlibrary.org/b/id/15217589-L.jpg",
    bookUrl: "https://openlibrary.org/isbn/9780316382007",
    discussion: "Which details make the island feel like a world with its own rules?"
  },
  {
    id: "en-despereaux",
    language: "en",
    title: "The Tale of Despereaux",
    author: "Kate DiCamillo",
    isbn: "9780763680893",
    ageBands: ["middle", "upper"],
    themes: ["courage", "adventure", "friendship", "imagination"],
    skills: ["voice", "character", "conflict"],
    coverUrl: "https://covers.openlibrary.org/b/id/14620882-L.jpg",
    bookUrl: "https://openlibrary.org/isbn/9780763680893",
    discussion: "How does the narrator make you feel close to Despereaux?"
  },
  {
    id: "en-wonder",
    language: "en",
    title: "Wonder",
    author: "R. J. Palacio",
    isbn: "9780375869020",
    ageBands: ["upper"],
    themes: ["school", "friendship", "identity", "courage"],
    skills: ["voice", "perspective", "character"],
    coverUrl: "https://covers.openlibrary.org/b/id/14303762-L.jpg",
    bookUrl: "https://openlibrary.org/isbn/9780375869020",
    discussion: "What changes when the same event is told by a different character?"
  },
  {
    id: "en-wrinkle",
    language: "en",
    title: "A Wrinkle in Time",
    author: "Madeleine L’Engle",
    isbn: "9780312367541",
    ageBands: ["upper"],
    themes: ["family", "adventure", "courage", "imagination"],
    skills: ["world", "conflict", "description"],
    coverUrl: "https://covers.openlibrary.org/b/id/6424934-L.jpg",
    bookUrl: "https://openlibrary.org/isbn/9780312367541",
    discussion: "How does the author explain an unfamiliar world without explaining everything at once?"
  },
  {
    id: "en-hobbit",
    language: "en",
    title: "The Hobbit",
    author: "J. R. R. Tolkien",
    isbn: "9780547928227",
    ageBands: ["upper"],
    themes: ["adventure", "courage", "imagination", "friendship"],
    skills: ["world", "conflict", "sequence"],
    coverUrl: "https://covers.openlibrary.org/b/id/12003329-L.jpg",
    bookUrl: "https://openlibrary.org/isbn/9780547928227",
    discussion: "Which obstacle changes Bilbo the most, and why?"
  },
  {
    id: "zh-seed",
    language: "zh",
    title: "安的种子",
    author: "王早早 著 · 黄丽 绘",
    isbn: "9787535039200",
    ageBands: ["early", "middle"],
    themes: ["nature", "change", "emotion"],
    skills: ["sequence", "character", "ending"],
    coverUrl: "https://books.google.com/books/content?vid=ISBN9787535039200&printsec=frontcover&img=1&zoom=2&source=gbs_api",
    bookUrl: "https://books.google.com/books?vid=ISBN9787535039200",
    discussion: "三个小和尚面对同一颗种子时，性格是怎样通过行动表现出来的？"
  },
  {
    id: "zh-reunion",
    language: "zh",
    title: "团圆",
    author: "余丽琼 著 · 朱成梁 绘",
    isbn: "9789861617299",
    ageBands: ["early", "middle"],
    themes: ["family", "emotion", "memory"],
    skills: ["description", "emotion", "ending"],
    coverUrl: "https://books.google.com/books/content?vid=ISBN9789861617299&printsec=frontcover&img=1&zoom=2&source=gbs_api",
    bookUrl: "https://books.google.com/books?vid=ISBN9789861617299",
    discussion: "作者用了哪些生活里的小细节，让“团圆”变得可以看见？"
  },
  {
    id: "zh-magic-pen",
    language: "zh",
    title: "神笔马良",
    author: "洪汛涛",
    isbn: "9787514838251",
    ageBands: ["early", "middle"],
    themes: ["imagination", "courage", "adventure"],
    skills: ["conflict", "character", "sequence"],
    coverUrl: "https://books.google.com/books/content?id=v_nSwQEACAAJ&printsec=frontcover&img=1&zoom=2&source=gbs_api",
    bookUrl: "https://books.google.com/books?id=v_nSwQEACAAJ",
    discussion: "如果你也有一支神笔，你的选择会怎样表现你的性格？"
  },
  {
    id: "zh-gourd",
    language: "zh",
    title: "宝葫芦的秘密",
    author: "张天翼",
    isbn: "9787532956616",
    ageBands: ["middle", "upper"],
    themes: ["imagination", "school", "change"],
    skills: ["conflict", "consequence", "character"],
    coverUrl: "https://books.google.com/books/content?id=VCBizgEACAAJ&printsec=frontcover&img=1&zoom=2&source=gbs_api",
    bookUrl: "https://books.google.com/books?id=VCBizgEACAAJ",
    discussion: "王葆得到想要的一切以后，为什么反而遇到了更大的问题？"
  },
  {
    id: "zh-south-city",
    language: "zh",
    title: "城南旧事",
    author: "林海音",
    isbn: "9787500652045",
    ageBands: ["upper"],
    themes: ["memory", "family", "identity", "change"],
    skills: ["description", "perspective", "emotion"],
    coverUrl: "https://books.google.com/books/content?id=LJbQAAAACAAJ&printsec=frontcover&img=1&zoom=2&source=gbs_api",
    bookUrl: "https://books.google.com/books?id=LJbQAAAACAAJ",
    discussion: "英子的眼睛让普通的街巷和人物有了怎样不同的感觉？"
  },
  {
    id: "zh-thatched-house",
    language: "zh",
    title: "草房子",
    author: "曹文轩",
    isbn: "9787558418129",
    ageBands: ["middle", "upper"],
    themes: ["school", "friendship", "family", "change"],
    skills: ["character", "description", "emotion"],
    coverUrl: "https://books.google.com/books/content?id=hjZPzgEACAAJ&printsec=frontcover&img=1&zoom=2&source=gbs_api",
    bookUrl: "https://books.google.com/books?id=hjZPzgEACAAJ",
    discussion: "哪些环境描写不只是写景，也在悄悄表现人物的心情？"
  }
];

const THEME_PATTERNS = {
  imagination: /magic|magical|dragon|wizard|dream|moon|star|奇幻|魔法|龙|神奇|梦想|月亮|星星/i,
  family: /family|mother|father|mom|dad|grand|home|家人|妈妈|爸爸|奶奶|爷爷|家|团圆/i,
  friendship: /friend|together|help|team|朋友|一起|帮助|伙伴|同学/i,
  courage: /brave|courage|afraid|fear|save|勇敢|害怕|恐惧|拯救/i,
  adventure: /journey|adventure|quest|forest|island|旅行|冒险|寻找|森林|岛/i,
  nature: /animal|tree|garden|river|ocean|bird|动物|树|花园|河|海|鸟|种子/i,
  school: /school|class|teacher|student|学校|课堂|老师|学生|同学/i,
  memory: /remember|memory|once|小时候|记得|回忆|从前/i,
  identity: /belong|different|myself|自己|不同|属于|身份/i,
  emotion: /love|sad|happy|angry|miss|爱|难过|开心|生气|想念/i,
  change: /change|become|grow|turn into|变化|变成|成长|终于/i
};

function ageBandFor(project) {
  const grade = Number(project?.clientSnapshot?.learningProfile?.grade || project?.storyDna?.learningProfile?.grade);
  if (Number.isFinite(grade)) {
    if (grade <= 2) return "early";
    if (grade <= 5) return "middle";
    return "upper";
  }
  return project?.ageGroup === "under18" ? "middle" : "upper";
}

function analyzeProject(project) {
  const text = [project?.title, project?.sourceText, project?.draft, ...(project?.scenes || []).map((scene) => scene?.text)].filter(Boolean).join(" ");
  const themes = Object.entries(THEME_PATTERNS).filter(([, pattern]) => pattern.test(text)).map(([theme]) => theme);
  if (!themes.length) themes.push("imagination");
  const dialogue = /[“”"「」『』].{1,120}[“”"「」『』]/.test(text) || /\b(said|asked|replied)\b|说|问|回答/i.test(text);
  const sequence = /first|then|next|finally|首先|然后|接着|最后/i.test(text);
  const description = /see|saw|look|sound|smell|bright|dark|quiet|看见|声音|闻到|明亮|黑暗|安静/i.test(text);
  const conflict = /but|however|problem|couldn.?t|must|danger|但是|可是|困难|不能|危险|必须/i.test(text);
  const signals = { dialogue, sequence, description, conflict, character: text.length > 80, world: themes.includes("imagination") || themes.includes("adventure") };
  const nextSkill = ["dialogue", "description", "conflict", "sequence", "character", "world"].find((skill) => !signals[skill]) || "perspective";
  const strength = ["dialogue", "description", "conflict", "sequence", "character", "world"].find((skill) => signals[skill]) || "imagination";
  return { textLength: text.length, themes, signals, nextSkill, strength, ageBand: ageBandFor(project) };
}

function bookScore(book, analysis, slot) {
  let score = book.ageBands.includes(analysis.ageBand) ? 6 : 0;
  score += book.themes.filter((theme) => analysis.themes.includes(theme)).length * (slot === "mirror" ? 5 : 2);
  score += book.skills.includes(analysis.nextSkill) ? (slot === "craft" ? 7 : 4) : 0;
  if (slot === "stretch" && book.ageBands.indexOf(analysis.ageBand) === -1) score += 2;
  return score;
}

function labels(language, key) {
  const copy = {
    mirror: { en: "A story that mirrors yours", zh: "与你的故事相呼应" },
    craft: { en: "Learn one writer’s move", zh: "学习一种写作技巧" },
    stretch: { en: "Take one step further", zh: "向下一阶段挑战" },
    next: { en: "Yu’s one-book recommendation", zh: "羽大师本次首选" },
    dialogue: { en: "dialogue", zh: "人物对话" },
    description: { en: "description", zh: "场景描写" },
    conflict: { en: "story problems", zh: "故事冲突" },
    sequence: { en: "story sequence", zh: "情节顺序" },
    character: { en: "character building", zh: "人物塑造" },
    world: { en: "world building", zh: "世界设定" },
    perspective: { en: "point of view", zh: "叙述视角" },
    imagination: { en: "imagination", zh: "想象力" },
    family: { en: "family", zh: "家庭与亲情" },
    friendship: { en: "friendship", zh: "友情与合作" },
    courage: { en: "courage", zh: "勇气" },
    adventure: { en: "adventure", zh: "冒险" },
    nature: { en: "nature", zh: "自然" },
    school: { en: "school life", zh: "校园生活" },
    memory: { en: "memory", zh: "记忆与成长" },
    identity: { en: "identity", zh: "认识自己" },
    emotion: { en: "emotion", zh: "情感表达" },
    change: { en: "change", zh: "变化与成长" }
  };
  return copy[key]?.[language] || key;
}

function reasonFor(book, analysis, slot, language) {
  const sharedTheme = book.themes.find((theme) => analysis.themes.includes(theme));
  const themeName = labels(language, sharedTheme || "imagination");
  const skillName = labels(language, analysis.nextSkill);
  if (language === "zh") {
    if (slot === "next") return `你的作品里已经出现了${themeName}，下一步适合练习${skillName}。读这本书时，可以观察作者怎样用人物与行动推进相近的主题，再把方法带回自己的下一章。`;
    if (slot === "mirror") return `你的作品里已经出现了${themeName}。读这本书时，可以观察作者怎样把相近的主题变成具体人物与行动。`;
    if (slot === "craft") return `羽大师建议下一步练习${skillName}。这本书提供了清楚、适合模仿其方法但不复制文字的范例。`;
    return `这本书会把你带到更复杂的情节与表达。读完后，可以选一个方法带回自己的下一章。`;
  }
  if (slot === "next") return `Your project already explores ${themeName}, and your next useful craft move is ${skillName}. Notice how this author develops a related theme through character and action, then bring the technique—not the author’s words—into your next chapter.`;
  if (slot === "mirror") return `Your project already explores ${themeName}. Notice how this author turns a related theme into specific characters and actions.`;
  if (slot === "craft") return `Yu’s next goal for you is ${skillName}. This book offers a clear model of the craft move without asking you to copy its words.`;
  return "This book adds a little more complexity. Choose one move you notice and bring that technique—not the author’s words—into your next chapter.";
}

function selectRecommendations(project) {
  const language = project?.language === "zh" ? "zh" : "en";
  const analysis = analyzeProject(project);
  const candidates = BOOKS.filter((book) => book.language === language);
  const ranked = candidates
    .map((book) => ({
      book,
      score: bookScore(book, analysis, "mirror") + bookScore(book, analysis, "craft")
    }))
    .sort((a, b) => b.score - a.score || a.book.title.localeCompare(b.book.title));
  const chosen = ranked[0].book;
  const recommendations = [{
    slot: "next",
    slotLabel: labels(language, "next"),
    title: chosen.title,
    author: chosen.author,
    isbn: chosen.isbn,
    coverUrl: chosen.coverUrl,
    bookUrl: chosen.bookUrl,
    reason: reasonFor(chosen, analysis, "next", language),
    craftFocus: labels(language, analysis.nextSkill),
    discussionPrompt: chosen.discussion
  }];
  return { language, analysis, recommendations };
}

function createGrowthReport(project) {
  const selected = selectRecommendations(project);
  const zh = selected.language === "zh";
  const strengthName = labels(selected.language, selected.analysis.strength);
  const nextName = labels(selected.language, selected.analysis.nextSkill);
  const grammarGoals = Array.isArray(project?.clientSnapshot?.grammarSummary?.goals)
    ? project.clientSnapshot.grammarSummary.goals.slice(0, 3).map((goal) => ({ category: String(goal.category || "other"), label: String(goal.label || ""), note: String(goal.note || ""), count: Number(goal.count || 0) }))
    : [];
  return {
    reportVersion: REPORT_VERSION,
    catalogVersion: CATALOG_VERSION,
    projectVersion: Number(project?.version || 1),
    language: selected.language,
    title: zh ? `${project.title} · 项目成长报告` : `${project.title} · Project Growth Report`,
    celebration: zh ? "你完成了一次从灵感到作品的创作旅程。" : "You completed a creative journey from first spark to finished project.",
    strength: zh ? `这次作品最明显的优势是${strengthName}。` : `A clear strength in this project is ${strengthName}.`,
    nextGoal: zh ? `下一次创作，羽大师建议重点练习${nextName}。` : `For the next project, Yu recommends focusing on ${nextName}.`,
    grammarGrowth: grammarGoals.length ? {
      title: grammarGoals[0].label,
      note: grammarGoals[0].category === "clear"
        ? (zh ? "本次作品的基本语法已经清楚；继续保持，并在新章节中再次检查。" : "The basic grammar in this piece is clear; keep it going and check again in the next chapter.")
        : grammarGoals[0].note,
      goals: grammarGoals
    } : null,
    familyPrompt: zh ? "一起读这一本推荐书，只讨论一个你最喜欢的写作方法，再把这个方法用进新故事。" : "Read this one recommended book together, discuss one craft move you enjoyed, and try that move in a new story.",
    recommendationBasis: {
      ageBand: selected.analysis.ageBand,
      themes: selected.analysis.themes.slice(0, 4),
      nextSkill: selected.analysis.nextSkill
    },
    recommendations: selected.recommendations
  };
}

module.exports = { BOOKS, CATALOG_VERSION, REPORT_VERSION, analyzeProject, selectRecommendations, createGrowthReport };

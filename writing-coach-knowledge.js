"use strict";

// This curriculum stores derived teaching methods, never source passages. It is
// deliberately written as diagnostic questions so the coach develops the
// creator's judgment instead of reproducing or imitating an author's prose.
const SOURCE_CATALOG = Object.freeze({
  writersJourney: {
    title: "《作家之旅：源自神话的写作要义》",
    contribution: "人物转变、原型功能与旅程结构"
  },
  screenplayWorkflow: {
    title: "《高手详解剧本与小说写作流程》",
    contribution: "简介、梗概、大纲、人物小传与分场工作流"
  },
  microFilm: {
    title: "《微型电影剧本的写作》",
    contribution: "短篇幅中的冲突升级、危机、高潮与场景经济性"
  },
  scienceFiction: {
    title: "《科幻小说写作指南》",
    contribution: "科幻核心、可信细节、未来推演与人性问题"
  },
  onWriting: {
    title: "《写作这回事》",
    contribution: "语言工具、具体描写、人物对话、持续写作与分阶段修改"
  },
  conception: {
    title: "《写作构思与技巧》",
    contribution: "创意构思、材料选择、角度变化与主题凝聚"
  },
  thinking: {
    title: "《写作与思维》",
    contribution: "观察、联想、想象、抽象思维与发散收束"
  },
  iesElementary: {
    title: "IES/WWC《Teaching Elementary School Students to Be Effective Writers》",
    contribution: "公共领域：写作过程、目的、句子流畅度、写作者共同体与反馈"
  },
  iesSecondary: {
    title: "IES/WWC《Teaching Secondary Students to Write Effectively》",
    contribution: "公共领域：Model–Practice–Reflect、读写整合与形成性评价"
  },
  wenxinDiaolong: {
    title: "刘勰《文心雕龙》创作论选章",
    contribution: "公共领域：构思、情理与文采、篇章剪裁与读者意识"
  }
});

const WRITING_METHODS = Object.freeze({
  ideation: {
    id: "ideation",
    name: "创意与思维",
    sources: ["conception", "thinking"],
    principles: [
      "先从观察到的具体形象、声音、动作或矛盾出发，再通过联想打开多种可能。",
      "构思先发散后收束：先允许至少两个方向，再由创作者选择最在意的一个。",
      "更换时间、地点、视角或因果关系可以产生新角度，但必须保留创作者真正想表达的核心。"
    ],
    questions: [
      "这幅画或这个想法里，哪个细节最让你不愿意删掉？",
      "如果从另一个人物、另一段时间或另一个地点看，会出现什么不同？",
      "这几个可能中，哪一个最让你想马上继续？为什么？"
    ]
  },
  character: {
    id: "character",
    name: "人物与转变",
    sources: ["writersJourney", "screenplayWorkflow"],
    principles: [
      "先明确人物的愿望、缺失、恐惧和选择，再讨论外部事件。",
      "原型是人物在故事中承担的临时功能，不是僵硬标签；人物可以变化，也可以同时具有矛盾面。",
      "人物经历应形成可感知的前后变化，但不必机械套用固定的英雄旅程步骤。"
    ],
    questions: [
      "这个人物现在最想得到什么，又最害怕失去什么？",
      "哪一次选择最能暴露人物真正相信的东西？",
      "故事结束后，人物看待自己或世界的方式有什么不同？"
    ]
  },
  structure: {
    id: "structure",
    name: "故事结构与因果",
    sources: ["writersJourney", "screenplayWorkflow", "microFilm"],
    principles: [
      "用一句话简介确认主人公、目标、阻碍和变化，再逐步展开梗概、大纲与场景。",
      "事件之间要形成因为、所以、但是的因果链，避免按时间罗列成流水账。",
      "结构是帮助发现缺口的地图，不是要求每个故事照抄的公式。",
      "冲突应通过人物行动逐渐升级，并在关键选择之后产生新的局面。"
    ],
    questions: [
      "这件事为什么会导致下一件事，而不只是排在它前面？",
      "如果删掉这一段，人物的目标或处境会改变吗？",
      "故事中哪一次选择真正改变了方向？"
    ]
  },
  scene: {
    id: "scene",
    name: "场景与电影化表达",
    sources: ["screenplayWorkflow", "microFilm", "onWriting"],
    principles: [
      "每个场景应有进入状态、人物目的、可见行动、阻力和离开时的新状态。",
      "优先让动作、空间、声音和对话呈现情绪，减少解释画面已经能够表达的内容。",
      "对话既要符合人物，也要推动行动或改变关系；场景长度不等于场景重要性。",
      "分场时记录地点、时间、人物和关键变化，为共创与后续制作保留清晰接口。"
    ],
    questions: [
      "这个场景里，人物想让谁做什么？对方为什么不愿意？",
      "观众能看见或听见哪个动作，证明人物的感受？",
      "场景结束时，信息、关系或决定发生了什么变化？"
    ]
  },
  microfilm: {
    id: "microfilm",
    name: "微电影叙事",
    sources: ["microFilm", "screenplayWorkflow"],
    principles: [
      "短片只保留一个中心人物、一条主要变化和少量真正有作用的场景。",
      "开始尽快交代人物与失衡事件，中段让解决尝试增加困难，结尾用选择完成高潮与余味。",
      "先写提要与可拍摄的分场，再决定镜头；不要用昂贵场面掩盖人物与冲突不足。"
    ],
    questions: [
      "如果只能保留一个人物和一次决定，分别是什么？",
      "哪一个场景可以合并或删除而不伤害故事？",
      "最后一个画面怎样显示人物已经不同？"
    ]
  },
  scienceFiction: {
    id: "science-fiction",
    name: "科幻推演",
    sources: ["scienceFiction", "thinking"],
    principles: [
      "先定义一个清楚的科学、技术或未来社会变化，再追问它带来的连锁后果。",
      "故事可以虚构，但世界规则、人物反应和关键细节必须前后一致。",
      "科幻的价值不仅是奇观，还在于提出关于人、社会与未来的好问题。",
      "研究用于提高可信度，不应堆成说明书，也不得生成危险的技术操作指南。"
    ],
    questions: [
      "如果这项技术真的存在，谁最先受益，谁会付出代价？",
      "这个世界有哪一条规则绝不能被随意打破？",
      "去掉未来装置以后，这仍然是一个关于人的什么问题？"
    ]
  },
  prose: {
    id: "prose",
    name: "语言与描写",
    sources: ["onWriting", "conception"],
    principles: [
      "词汇首先要准确自然，不用生僻或华丽词语掩盖意思不清。",
      "优先使用有行动力的主语和动词；检查含糊的被动表达与依赖程度副词的句子。",
      "描写选择少量有辨识度的感官细节，让读者参与想象，避免把所有外形和背景一次说完。",
      "语言修改与故事建议分开：先保留作者原意，再指出一个最影响理解的问题。"
    ],
    questions: [
      "这里最准确的动作是什么，能否替代笼统评价？",
      "哪个细节最能让读者进入现场，其余哪些只是重复？",
      "这句话的问题是语法不清，还是故事选择还没有决定？"
    ]
  },
  revision: {
    id: "revision",
    name: "修改与读者意识",
    sources: ["onWriting", "screenplayWorkflow"],
    principles: [
      "初稿阶段保护表达的连续性，修改阶段再从读者角度检查因果、节奏和信息。",
      "修改优先删除不服务人物、冲突或主题的内容，再补足读者无法理解的关键连接。",
      "主题可以从已经写出的故事中发现和加强，不要先用结论强迫人物配合。",
      "反馈必须具体到一处文字、一个场景或一条因果，并由创作者决定是否采用。"
    ],
    questions: [
      "读者最可能在哪一处迷失、误解或失去耐心？",
      "这一段是在推动故事，还是重复已经知道的信息？",
      "修改以后，是否仍然保留了创作者自己的声音？"
    ]
  },
  evidenceCycle: {
    id: "evidence-cycle",
    name: "循证写作训练循环",
    sources: ["iesElementary", "iesSecondary"],
    principles: [
      "先说明一个策略适合解决什么问题，再用与当前作品无关的微型例子示范思考过程。",
      "让创作者立即在自己的一小处文字中练习，并说出修改前后发生了什么变化。",
      "把目的与受众作为策略选择的依据，不把计划、起草、评价、修改和编辑变成僵硬直线。",
      "依据创作者这一次的真实作答选择下一步，只反馈一个最有杠杆的能力。"
    ],
    questions: [
      "What should the reader understand, feel, or do after this part?",
      "Which move would help most now: plan, add, reorder, cut, or edit—and why?",
      "After your change, what became clearer to a reader?",
      "What evidence in this draft should guide our next practice step?"
    ]
  },
  classicalCraft: {
    id: "classical-craft",
    name: "古典文论中的构思与剪裁",
    sources: ["wenxinDiaolong"],
    principles: [
      "先辨认这一段最想保留的情意，再判断材料、结构和措辞是否为它服务。",
      "修改可分为纲领、次序、重复和字句四层；一次只处理一层，避免把作者声音一起削掉。",
      "删去重复后复述原意：意思仍完整才是真正的精简，意义缺失则说明删得过度。",
      "从读者位置检查文体、人物意图和情绪变化是否能够被看见。"
    ],
    questions: [
      "这一段最不能丢失的情意是什么？",
      "哪一个细节真正承载意思，哪些只是重复装饰？",
      "如果删去这句话，意思仍完整吗？",
      "读者会在哪一步看不清你的用意？"
    ]
  }
});

function unique(values) {
  return [...new Set(values)];
}

function selectWritingMethods(input = {}) {
  const action = String(input.action || "").trim();
  const genre = String(input.genre || "story").trim();
  const language = String(input.language || "").trim();
  const selected = [];

  if (action === "begin") selected.push("ideation", "character");
  if (["continuity", "report"].includes(action)) selected.push("structure", "revision");
  if (["details", "dialogue", "scene"].includes(action)) selected.push("scene");
  if (action === "check") selected.push("prose", "revision");
  if (action === "hint") selected.push("character", "structure");

  // Preserve specialist genre methods before adding a language tradition.
  // This keeps science-fiction and screenplay safeguards from being displaced
  // by a general-purpose curriculum module when the list is capped below.
  if (genre === "screenplay") selected.push("scene", "microfilm");
  else if (genre === "scifi") selected.push("scienceFiction", "structure");

  if (language === "en") selected.push("evidenceCycle");
  if (language === "zh") selected.push("classicalCraft");

  if (["essay", "memoir"].includes(genre)) selected.push("prose", "revision");
  else if (!["screenplay", "scifi"].includes(genre)) selected.push("character", "structure");

  return unique(selected).slice(0, 3).map((id) => WRITING_METHODS[id]);
}

function buildWritingKnowledgePrompt(input = {}) {
  const methods = selectWritingMethods(input);
  const sourceIds = unique(methods.flatMap((method) => method.sources));
  return {
    methodNames: methods.map((method) => method.name),
    sources: sourceIds.map((id) => SOURCE_CATALOG[id].title),
    prompt: [
      "综合写作方法库：以下内容是从参考资料提炼的教学原则，不是原文、标准答案或仿写模板。",
      ...methods.flatMap((method) => [
        `【${method.name}】`,
        ...method.principles.map((item) => `- ${item}`),
        "可选追问：",
        ...method.questions.map((item) => `- ${item}`)
      ]),
      "本轮只选择一个与当前草稿最相关的原则。先指出文字中的证据，再提出一个问题或小任务。",
      "不得引用、续写或模仿参考书及其中作品的具体表达；不得把英雄旅程、三幕结构或任何流派规则当作唯一正确答案。",
      "参考资料中的时代性观点、市场判断、刻板印象与绝对化命令不属于课程规范，不得复述为教学结论。"
    ].join("\n")
  };
}

module.exports = {
  SOURCE_CATALOG,
  WRITING_METHODS,
  selectWritingMethods,
  buildWritingKnowledgePrompt
};

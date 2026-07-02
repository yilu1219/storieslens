const canvas = document.getElementById("star-canvas");
const ctx = canvas.getContext("2d");
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

let stars = [];
let width = 0;
let height = 0;
let pointerX = 0;
let pointerY = 0;

function resizeCanvas() {
  const ratio = Math.min(window.devicePixelRatio || 1, 2);
  width = window.innerWidth;
  height = window.innerHeight;
  canvas.width = Math.floor(width * ratio);
  canvas.height = Math.floor(height * ratio);
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);

  const count = Math.min(150, Math.max(75, Math.floor((width * height) / 12500)));
  stars = Array.from({ length: count }, () => ({
    x: Math.random() * width,
    y: Math.random() * height,
    radius: Math.random() * 1.4 + 0.25,
    alpha: Math.random() * 0.7 + 0.25,
    speed: Math.random() * 0.012 + 0.004,
    drift: Math.random() * 0.18 + 0.04
  }));
}

function drawStars(time = 0) {
  ctx.clearRect(0, 0, width, height);

  stars.forEach((star, index) => {
    const twinkle = Math.sin(time * star.speed + index) * 0.32 + star.alpha;
    const x = star.x + pointerX * star.drift;
    const y = star.y + pointerY * star.drift;

    ctx.beginPath();
    ctx.arc(x, y, star.radius, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255, 255, 255, ${Math.max(0.12, Math.min(0.95, twinkle))})`;
    ctx.fill();
  });

  if (!reducedMotion) {
    requestAnimationFrame(drawStars);
  }
}

window.addEventListener("resize", () => {
  resizeCanvas();
  drawStars();
});

window.addEventListener("mousemove", (event) => {
  const centerX = width / 2;
  const centerY = height / 2;
  pointerX = (event.clientX - centerX) / centerX;
  pointerY = (event.clientY - centerY) / centerY;
  document.documentElement.style.setProperty("--tilt-x", pointerX.toFixed(2));
  document.documentElement.style.setProperty("--tilt-y", pointerY.toFixed(2));
});

document.querySelectorAll("a[href^='#']").forEach((link) => {
  link.addEventListener("click", (event) => {
    const target = document.querySelector(link.getAttribute("href"));
    if (!target) return;
    event.preventDefault();
    target.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth", block: "start" });
  });
});

const gradeProfiles = {
  K: {
    summary: "Kindergarten · Literature",
    standard: "CCSS.ELA-LITERACY.RL.K.1 · Ask and answer questions about key details in a text."
  },
  1: {
    summary: "Grade 1 · Literature",
    standard: "CCSS.ELA-LITERACY.RL.1.1 · Ask and answer questions about key details in a story."
  },
  2: {
    summary: "Grade 2 · Literature",
    standard: "CCSS.ELA-LITERACY.RL.2.1 · Use who, what, where, when, why, and how questions."
  },
  3: {
    summary: "Grade 3 · Literature",
    standard: "CCSS.ELA-LITERACY.RL.3.1 · Ask and answer questions using evidence from the text."
  },
  4: {
    summary: "Grade 4 · Literature",
    standard: "CCSS.ELA-LITERACY.RL.4.1 · Refer to details and examples when explaining the text."
  },
  5: {
    summary: "Grade 5 · Literature",
    standard: "CCSS.ELA-LITERACY.RL.5.1 · Quote accurately when explaining what the text says."
  },
  6: {
    summary: "Grade 6 · Literature",
    standard: "CCSS.ELA-LITERACY.RL.6.1 · Cite textual evidence to support analysis."
  },
  7: {
    summary: "Grade 7 · Literature",
    standard: "CCSS.ELA-LITERACY.RL.7.1 · Cite several pieces of evidence and analyze how story elements interact."
  },
  8: {
    summary: "Grade 8 · Literature",
    standard: "CCSS.ELA-LITERACY.RL.8.1 · Cite the strongest textual evidence and analyze craft choices."
  },
  9: {
    summary: "Grade 9 · Literature",
    standard: "CCSS.ELA-LITERACY.RL.9-10.1 · Cite strong and thorough evidence for literary analysis."
  },
  10: {
    summary: "Grade 10 · Literature",
    standard: "CCSS.ELA-LITERACY.RL.9-10.1 · Build stronger, more independent evidence-based analysis."
  },
  11: {
    summary: "Grade 11 · Literature",
    standard: "CCSS.ELA-LITERACY.RL.11-12.1 · Analyze complex texts, including ambiguity and uncertainty."
  },
  12: {
    summary: "Grade 12 · Literature",
    standard: "CCSS.ELA-LITERACY.RL.11-12.1 · Use strong evidence to support mature literary interpretation."
  }
};

const ccssSkillMap = {
  K: [
    ["Read Story", "Ask & Answer", "RL.K.1", "With prompting and support, ask and answer questions about key details.", "Tap a picture or sentence and answer: who, what, or where?"],
    ["CCSS Skill Card", "Retell Key Details", "RL.K.2", "Retell familiar stories, including key details.", "Put three story moments in order."],
    ["ELA Skill", "Characters & Setting", "RL.K.3", "Identify characters, settings, and major events in a story.", "Point to the character, place, and big event."],
    ["Guided Writing", "Draw, Tell, Write", "W.K.3", "Use drawing, dictating, and writing to narrate events in order.", "Draw one event and say what happened next."],
    ["Storybook Image", "Picture + Story", "RL.K.7", "Describe how an illustration connects to the story moment.", "Choose the moment the picture should show."]
  ],
  1: [
    ["Read Story", "Key Details", "RL.1.1", "Ask and answer questions about key details in a story.", "Answer with one detail from the sentence."],
    ["CCSS Skill Card", "Retell Lesson", "RL.1.2", "Retell stories and show the central message or lesson.", "Pick the event that teaches the lesson."],
    ["ELA Skill", "Describe Story Parts", "RL.1.3", "Describe characters, settings, and major events using key details.", "Complete a character-setting-event card."],
    ["Guided Writing", "Sequenced Narrative", "W.1.3", "Write two or more sequenced events with details and closure.", "Write: First..., Then..., At last..."],
    ["Storybook Image", "Illustration Details", "RL.1.7", "Use illustrations and details to describe characters, setting, or events.", "Name one detail the picture adds."]
  ],
  2: [
    ["Read Story", "5W1H Questions", "RL.2.1", "Ask and answer who, what, where, when, why, and how questions.", "Build one why/how answer from the text."],
    ["CCSS Skill Card", "Moral or Message", "RL.2.2", "Recount stories and determine the central message, lesson, or moral.", "Match the moral to two events."],
    ["ELA Skill", "Story Structure", "RL.2.5", "Describe the beginning, middle, and ending of a story.", "Label which event starts or concludes the action."],
    ["Guided Writing", "Thoughts & Feelings", "W.2.3", "Write a short sequence with actions, thoughts, feelings, temporal words, and closure.", "Write one sentence with a feeling and time word."],
    ["Storybook Image", "Image + Plot", "RL.2.7", "Use illustrations and words to understand character, setting, or plot.", "Choose what the image proves about the plot."]
  ],
  3: [
    ["Read Story", "Text Evidence", "RL.3.1", "Ask and answer questions by referring explicitly to the text.", "Tap one sentence that proves your answer."],
    ["CCSS Skill Card", "Central Message", "RL.3.2", "Recount the story and explain how key details convey the message.", "Choose three details that show the lesson."],
    ["ELA Skill", "Literal / Nonliteral", "RL.3.4", "Determine word meaning and distinguish literal from nonliteral language.", "Explain why the author chose the word."],
    ["Guided Writing", "Narrative Imitation", "W.3.3", "Write narratives with characters, event sequence, dialogue, descriptions, and closure.", "Write one sentence showing action and feeling."],
    ["Storybook Image", "Picture + Text", "RL.3.7", "Explain how illustrations contribute to mood, character, or setting.", "Pick the story detail the picture must show."]
  ],
  4: [
    ["Read Story", "Details & Examples", "RL.4.1", "Refer to details and examples when explaining explicit meaning or inferences.", "Quote one detail and explain what it proves."],
    ["CCSS Skill Card", "Theme + Summary", "RL.4.2", "Determine a theme from details and summarize the text.", "Write a one-line theme and two support details."],
    ["ELA Skill", "In-Depth Description", "RL.4.3", "Describe a character, setting, or event in depth using specific details.", "Build a trait card from words, thoughts, and actions."],
    ["Guided Writing", "Evidence-Based Response", "W.4.9", "Draw evidence from literary or informational texts to support analysis.", "Write a response using because and one quoted detail."],
    ["Storybook Image", "Text-to-Visual Link", "RL.4.7", "Connect a story to a visual or oral presentation of the text.", "Check whether the image reflects the exact description."]
  ],
  5: [
    ["Read Story", "Quote Accurately", "RL.5.1", "Quote accurately when explaining explicit meaning and inferences.", "Use quotation marks around the evidence."],
    ["CCSS Skill Card", "Theme & Challenge", "RL.5.2", "Determine theme, including how characters respond to challenges.", "Explain how the challenge reveals the theme."],
    ["ELA Skill", "Figurative Language", "RL.5.4", "Determine meanings of words and phrases, including metaphors and similes.", "Sort the phrase as literal, metaphor, or simile."],
    ["Guided Writing", "Evidence Paragraph", "W.5.9", "Draw evidence from texts to support analysis, reflection, and research.", "Write a short paragraph with claim, evidence, explanation."],
    ["Storybook Image", "Multimedia Meaning", "RL.5.7", "Analyze how visual and multimedia elements add meaning, tone, or beauty.", "Name the tone the image creates and why."]
  ],
  6: [
    ["Read Story", "Cite Evidence", "RL.6.1", "Cite textual evidence for explicit meaning and inferences.", "Choose the line that best supports your analysis."],
    ["CCSS Skill Card", "Theme Development", "RL.6.2", "Determine theme or central idea and summarize without personal judgment.", "Write an objective two-sentence summary."],
    ["ELA Skill", "Structure Builds Meaning", "RL.6.5", "Analyze how a sentence, chapter, scene, or stanza contributes to theme, setting, or plot.", "Explain what changes if this scene is removed."],
    ["Guided Writing", "Narrative Technique", "W.6.3", "Use dialogue, pacing, description, and precise words in a structured narrative.", "Revise one sentence to add pacing or sensory detail."],
    ["Storybook Image", "Read vs Watch", "RL.6.7", "Compare reading a text to viewing or listening to a version of it.", "Contrast what you imagined with what the image shows."]
  ],
  7: [
    ["Read Story", "Several Evidence Points", "RL.7.1", "Cite several pieces of evidence to support analysis.", "Collect two lines that support the same idea."],
    ["CCSS Skill Card", "Theme Over Time", "RL.7.2", "Analyze theme development over the course of the text.", "Track how the theme changes from beginning to end."],
    ["ELA Skill", "Elements Interact", "RL.7.3", "Analyze how story elements interact, such as setting shaping character or plot.", "Explain how the setting changes a character choice."],
    ["Guided Writing", "Point of View Narrative", "W.7.3", "Write narratives with point of view, pacing, description, and reflection.", "Rewrite a moment from another character's view."],
    ["Storybook Image", "Media Techniques", "RL.7.7", "Compare a written text to an audio, filmed, staged, or multimedia version.", "Identify how color, lighting, or focus changes meaning."]
  ],
  8: [
    ["Read Story", "Strongest Evidence", "RL.8.1", "Cite the evidence that most strongly supports analysis.", "Rank two evidence choices and defend the stronger one."],
    ["CCSS Skill Card", "Theme + Plot Relationship", "RL.8.2", "Analyze theme development and its relationship to characters, setting, and plot.", "Connect one plot event to the theme."],
    ["ELA Skill", "Dialogue & Incident", "RL.8.3", "Analyze how dialogue or incidents propel action, reveal character, or provoke decisions.", "Explain how one line causes the next action."],
    ["Guided Writing", "Reflection + Sequence", "W.8.3", "Use pacing, description, reflection, and transitions in a structured narrative.", "Add a reflection sentence after an action."],
    ["Storybook Image", "Faithful or Different", "RL.8.7", "Analyze how a filmed or live production stays faithful to or departs from the text.", "Mark what the image keeps, changes, or leaves out."]
  ],
  9: [
    ["Read Story", "Strong Evidence", "RL.9-10.1", "Cite strong and thorough evidence to support analysis.", "Use one explicit line and one inference."],
    ["CCSS Skill Card", "Theme Analysis", "RL.9-10.2", "Analyze theme development and how it is refined by details.", "Explain how a detail refines the theme."],
    ["ELA Skill", "Word Choice Impact", "RL.9-10.4", "Analyze figurative, connotative, and cumulative word-choice impact on meaning and tone.", "Replace one word and explain how tone changes."],
    ["Guided Writing", "Complex Narrative", "W.9-10.3", "Develop experiences with problem, point of view, pacing, reflection, and well-chosen details.", "Write a scene opening with a problem and tone."],
    ["Storybook Image", "Two Mediums", "RL.9-10.7", "Analyze representation of a subject or key scene in two artistic mediums.", "Compare what the text and image emphasize."]
  ],
  10: [
    ["Read Story", "Thorough Analysis", "RL.9-10.1", "Cite strong and thorough evidence with increasing independence.", "Build a claim with two connected evidence points."],
    ["CCSS Skill Card", "Theme Refined", "RL.9-10.2", "Analyze how theme emerges, is shaped, and is refined by details.", "Explain how the ending sharpens the theme."],
    ["ELA Skill", "Tone Through Craft", "RL.9-10.4", "Analyze cumulative impact of word choices on meaning and tone.", "Annotate three words that create tone."],
    ["Guided Writing", "Scene Craft", "W.9-10.3", "Use dialogue, pacing, description, reflection, and sequence to craft a coherent whole.", "Revise a scene to build suspense or growth."],
    ["Storybook Image", "Artistic Emphasis", "RL.9-10.7", "Compare how different mediums emphasize or omit details.", "Describe what the image adds that the text implies."]
  ],
  11: [
    ["Read Story", "Ambiguity & Evidence", "RL.11-12.1", "Cite strong evidence, including where the text leaves matters uncertain.", "State what is proven and what remains uncertain."],
    ["CCSS Skill Card", "Complex Theme", "RL.11-12.2", "Analyze how multiple themes interact and build on one another.", "Map two themes and where they intersect."],
    ["ELA Skill", "Fresh Language", "RL.11-12.4", "Analyze figurative and connotative meanings and the impact of fresh, engaging language.", "Explain why one phrase feels original or powerful."],
    ["Guided Writing", "Multiple-Plot Narrative", "W.11-12.3", "Use point of view, pacing, reflection, multiple plot lines, and tone.", "Write a short scene with two threads or perspectives."],
    ["Storybook Image", "Interpretation Choices", "RL.11-12.7", "Analyze multiple interpretations of a story, drama, or poem.", "Evaluate what interpretation the image chooses."]
  ],
  12: [
    ["Read Story", "Mature Interpretation", "RL.11-12.1", "Use strong and thorough evidence to support nuanced analysis.", "Defend an interpretation with evidence and uncertainty."],
    ["CCSS Skill Card", "Theme System", "RL.11-12.2", "Analyze how themes interact across the whole text.", "Explain how two themes build a complex account."],
    ["ELA Skill", "Style & Multiple Meaning", "RL.11-12.4", "Analyze multiple meanings, tone, and author style created by word choice.", "Annotate a phrase with two possible meanings."],
    ["Guided Writing", "Tone & Outcome", "W.11-12.3", "Use narrative techniques to build toward a particular tone and outcome.", "Revise one ending to create mystery, suspense, or resolution."],
    ["Storybook Image", "Evaluate Adaptation", "RL.11-12.7", "Evaluate how an adaptation interprets the source text.", "Judge whether the image's interpretation is faithful and why."]
  ]
};

const storyPacks = {
  K: {
    gradeLabel: "Grade K",
    sourceType: "Original",
    title: "The Lost Star",
    ccss: "RL.K.1",
    skill: "Key Details",
    skillNote: "Ask and answer questions about the most important who, what, and where details.",
    vocabulary: {
      word: "star",
      definition: "a bright point of light in the night sky",
      image: "assets/showcase-star-keeper.png"
    },
    passage: [
      "Mia saw one little star above the hill.",
      "The star looked small, but it was bright.",
      "Mia held up her hand and whispered, \"Come home.\"",
      "The star stayed in the sky, and Mia smiled at its light."
    ],
    quiz: [
      "What did Mia see above the hill?",
      "Where was the star?",
      "How did the star look?",
      "What did Mia say to the star?",
      "Which detail shows Mia felt gentle?"
    ],
    exampleSentence: "Mia saw one little star above the hill.",
    imitationTemplate: "I saw one ___ above the ___.",
    prompt: "A warm classic storybook image of a child watching one bright star above a quiet hill."
  },
  1: {
    gradeLabel: "Grade 1",
    sourceType: "Public Domain Adaptation",
    title: "The Lion and the Mouse",
    ccss: "RL.1.2",
    skill: "Retell Story",
    skillNote: "Retell the beginning, middle, and ending and name the lesson.",
    vocabulary: {
      word: "help",
      definition: "to make it easier for someone to do something",
      image: "assets/showcase-garden-door.png"
    },
    passage: [
      "A small mouse woke a sleepy lion.",
      "The lion let the mouse run away.",
      "Later, the lion was caught in a net.",
      "The mouse chewed the rope and helped the lion go free."
    ],
    quiz: [
      "Who woke the lion?",
      "What did the lion do first?",
      "What problem did the lion have later?",
      "How did the mouse help?",
      "What lesson can we retell from the story?"
    ],
    exampleSentence: "The mouse chewed the rope and helped the lion.",
    imitationTemplate: "The ___ helped the ___ by ___.",
    prompt: "A friendly storybook mouse helping a lion escape a soft golden net in a forest."
  },
  2: {
    gradeLabel: "Grade 2",
    sourceType: "Public Domain Adaptation",
    title: "The Tale of Peter Rabbit",
    ccss: "RL.2.3",
    skill: "Character Response",
    skillNote: "Describe how a character responds to a major event or challenge.",
    vocabulary: {
      word: "garden",
      definition: "a place where plants, fruits, or flowers grow",
      image: "assets/showcase-garden-door.png"
    },
    passage: [
      "Peter saw a green garden gate and slipped inside.",
      "He heard a loud step near the lettuce rows.",
      "Peter felt worried, so he ran under a watering can.",
      "When the path was quiet, he hurried home and rested."
    ],
    quiz: [
      "Where did Peter go?",
      "What sound made Peter worried?",
      "How did Peter respond to danger?",
      "Which detail shows Peter wanted to be safe?",
      "How did Peter change after the problem?"
    ],
    exampleSentence: "Peter felt worried, so he ran under a watering can.",
    imitationTemplate: "___ felt ___, so ___ ___.",
    prompt: "A gentle rabbit hiding under a watering can in a moonlit vegetable garden."
  },
  3: {
    gradeLabel: "Grade 3",
    sourceType: "Original",
    title: "The Fox and the Moonlit Bridge",
    ccss: "RL.3.1",
    skill: "Ask & Answer with Evidence",
    skillNote: "Answer questions by referring explicitly to details in the story.",
    vocabulary: {
      word: "bridge",
      definition: "a structure built over water or land so people can cross",
      image: "assets/showcase-ocean-lantern.png"
    },
    passage: [
      "One quiet night, a clever fox came to a river.",
      "The bridge was narrow, and the water below rushed quickly.",
      "The fox whispered, \"I will be brave and go slowly.\"",
      "He stepped carefully across the bridge and kept his promise."
    ],
    quiz: [
      "Where did the fox arrive?",
      "What made the bridge difficult to cross?",
      "Which sentence proves the fox chose to be careful?",
      "What did the fox promise himself?",
      "What evidence shows the fox was brave?"
    ],
    exampleSentence: "I will be brave and go slowly.",
    imitationTemplate: "I will be ___ and ___ slowly.",
    prompt: "A clever fox crossing a moonlit bridge over a shining river in classic storybook style."
  },
  4: {
    gradeLabel: "Grade 4",
    sourceType: "Public Domain Adaptation",
    title: "The Wonderful Wizard of Oz",
    ccss: "RL.4.3",
    skill: "Character / Setting / Event",
    skillNote: "Describe a character, setting, or event in depth using specific details.",
    vocabulary: {
      word: "key",
      definition: "a small tool used to open a lock",
      image: "assets/showcase-block-castle.png"
    },
    passage: [
      "Dorothy found a golden key beside a bright stone road.",
      "Ahead, a castle gate shimmered with green light.",
      "She held the key tightly because the road felt strange and new.",
      "When the gate opened, Dorothy saw a world of towers, trees, and singing birds."
    ],
    quiz: [
      "What object did Dorothy find?",
      "Which setting detail makes the gate feel magical?",
      "How did Dorothy act when the road felt strange?",
      "Name one detail that describes the world beyond the gate.",
      "How do the key and setting shape the event?"
    ],
    exampleSentence: "She held the key tightly because the road felt strange and new.",
    imitationTemplate: "___ held the ___ tightly because ___.",
    prompt: "A golden key opening a glowing castle gate on a bright stone road."
  },
  5: {
    gradeLabel: "Grade 5",
    sourceType: "Public Domain Adaptation",
    title: "The Brave Tin Soldier",
    ccss: "RL.5.2",
    skill: "Theme",
    skillNote: "Determine a theme and explain how a character responds to a challenge.",
    vocabulary: {
      word: "steadfast",
      definition: "firm, loyal, and not giving up",
      image: "assets/storybook-portal-book.png"
    },
    passage: [
      "The tiny soldier stood tall when the paper boat entered the dark drain.",
      "The water turned, but he did not bend or cry out.",
      "He remembered the bright room and the dancer by the window.",
      "Even in the dark, he stayed steadfast."
    ],
    quiz: [
      "What challenge does the soldier face?",
      "Which detail shows he does not give up?",
      "What does the soldier remember?",
      "What theme does steadfast support?",
      "Which quote would best support the theme?"
    ],
    exampleSentence: "Even in the dark, he stayed steadfast.",
    imitationTemplate: "Even in the ___, ___ stayed ___.",
    prompt: "A brave tiny soldier in a paper boat moving through glowing dark water."
  },
  6: {
    gradeLabel: "Grade 6",
    sourceType: "Public Domain Adaptation",
    title: "Alice in Wonderland",
    ccss: "RL.6.5",
    skill: "Plot Development",
    skillNote: "Analyze how one scene contributes to plot, setting, or theme.",
    vocabulary: {
      word: "door",
      definition: "a movable entrance that opens into another place",
      image: "assets/showcase-garden-door.png"
    },
    passage: [
      "Alice found a tiny door behind a curtain.",
      "The garden beyond it sparkled with silver leaves.",
      "She could not enter yet, so she searched the room for a key.",
      "That small door turned her curiosity into a quest."
    ],
    quiz: [
      "What does Alice find behind the curtain?",
      "Why can she not enter the garden yet?",
      "How does this scene move the plot forward?",
      "Which detail builds the magical setting?",
      "What would change if the tiny door were removed?"
    ],
    exampleSentence: "That small door turned her curiosity into a quest.",
    imitationTemplate: "That ___ turned ___ into a ___.",
    prompt: "A tiny glowing door behind a curtain opening toward a silver-leaf garden."
  },
  7: {
    gradeLabel: "Grade 7",
    sourceType: "Public Domain Adaptation",
    title: "The Happy Prince",
    ccss: "RL.7.2",
    skill: "Theme & Summary",
    skillNote: "Analyze how a theme develops over the course of the text.",
    vocabulary: {
      word: "kindness",
      definition: "caring about others and acting gently toward them",
      image: "assets/showcase-star-keeper.png"
    },
    passage: [
      "The golden statue watched the city from a high column.",
      "At first, he only saw shining roofs and lanterns.",
      "Then he noticed a child shivering near a dark doorway.",
      "His kindness grew when he asked the little bird to carry help below."
    ],
    quiz: [
      "Where does the statue stand?",
      "What does he notice after looking closely?",
      "How does his kindness grow?",
      "Which detail develops the theme?",
      "Summarize the passage without personal opinion."
    ],
    exampleSentence: "His kindness grew when he asked the little bird to carry help below.",
    imitationTemplate: "___ grew when ___ chose to ___.",
    prompt: "A golden statue above a city asking a little bird to carry a glowing gift."
  },
  8: {
    gradeLabel: "Grade 8",
    sourceType: "Public Domain Adaptation",
    title: "Sherlock Holmes: The Hidden Clue",
    ccss: "RL.8.1",
    skill: "Text Evidence",
    skillNote: "Choose the strongest evidence and explain why it matters.",
    vocabulary: {
      word: "clue",
      definition: "a detail that helps solve a question or mystery",
      image: "assets/showcase-garden-door.png"
    },
    passage: [
      "Holmes paused beside the locked garden door.",
      "A thin line of mud marked only the left side of the step.",
      "The visitor claimed he had never entered the garden.",
      "Holmes smiled because the mud told a stronger story."
    ],
    quiz: [
      "Where does Holmes pause?",
      "What detail does he notice?",
      "What does the visitor claim?",
      "Which evidence is strongest against the claim?",
      "Why is the mud more useful than a guess?"
    ],
    exampleSentence: "The mud told a stronger story.",
    imitationTemplate: "The ___ told a stronger story because ___.",
    prompt: "A detective noticing a thin line of mud beside a locked garden door."
  },
  9: {
    gradeLabel: "Grade 9",
    sourceType: "Public Domain Adaptation",
    title: "The Lantern Heart",
    ccss: "RL.9-10.2",
    skill: "Theme / Author Choice",
    skillNote: "Analyze how mood and detail shape an emerging theme.",
    vocabulary: {
      word: "lantern",
      definition: "a lamp with a cover that can be carried",
      image: "assets/showcase-ocean-lantern.png"
    },
    passage: [
      "The old lantern swung once in the silent hall.",
      "Its light touched every portrait except one.",
      "Mara wanted to run, yet she lifted the lantern higher.",
      "The hidden face appeared, and the house seemed to breathe."
    ],
    quiz: [
      "What moves in the silent hall?",
      "Which detail creates suspense?",
      "How does Mara respond to fear?",
      "What theme starts to emerge?",
      "How does the author use light as a choice?"
    ],
    exampleSentence: "Mara wanted to run, yet she lifted the lantern higher.",
    imitationTemplate: "___ wanted to ___, yet ___ ___.",
    prompt: "A mysterious lantern lighting one hidden portrait in a quiet old hall."
  },
  10: {
    gradeLabel: "Grade 10",
    sourceType: "Public Domain Adaptation",
    title: "The Gift of the Magi",
    ccss: "RL.9-10.4",
    skill: "Theme / Author Choice",
    skillNote: "Analyze how word choice and ending shape meaning and tone.",
    vocabulary: {
      word: "gift",
      definition: "something given to show care, love, or thanks",
      image: "assets/storybook-portal-book.png"
    },
    passage: [
      "Della wrapped the small gift with careful hands.",
      "The ribbon was plain, but her smile made it bright.",
      "She had given up what she loved to honor someone she loved more.",
      "The quiet package carried a larger meaning than gold."
    ],
    quiz: [
      "What does Della wrap?",
      "Which word choice makes the gift feel humble?",
      "What sacrifice does the passage imply?",
      "How does the ending shape the theme?",
      "Which detail creates a loving tone?"
    ],
    exampleSentence: "The quiet package carried a larger meaning than gold.",
    imitationTemplate: "The quiet ___ carried a larger meaning than ___.",
    prompt: "A carefully wrapped simple gift glowing softly on a winter table."
  },
  11: {
    gradeLabel: "Grade 11",
    sourceType: "Public Domain Adaptation",
    title: "The Scarlet Letter",
    ccss: "RL.11-12.3",
    skill: "Complex Character / Structure",
    skillNote: "Analyze how a complex character's choices develop over a structured scene.",
    vocabulary: {
      word: "secret",
      definition: "something kept hidden from others",
      image: "assets/showcase-time-train.png"
    },
    passage: [
      "Hester stood before the crowd and kept her voice steady.",
      "The letter on her dress burned brighter than any spoken accusation.",
      "She refused to name the person who shared her secret.",
      "Her silence made the scene both an answer and a question."
    ],
    quiz: [
      "Where does Hester stand?",
      "Which detail shows public pressure?",
      "What choice does Hester make?",
      "Why is her silence complex?",
      "How does the scene structure create ambiguity?"
    ],
    exampleSentence: "Her silence made the scene both an answer and a question.",
    imitationTemplate: "Her ___ made the scene both ___ and ___.",
    prompt: "A solemn public square scene focused on a strong character holding a secret."
  },
  12: {
    gradeLabel: "Grade 12",
    sourceType: "Teacher Upload",
    title: "Pride and Prejudice Seminar Passage",
    ccss: "RL.11-12.5",
    skill: "Complex Character / Structure",
    skillNote: "Evaluate how structure, irony, and character choices create interpretation.",
    vocabulary: {
      word: "judgment",
      definition: "an opinion or decision formed after thinking",
      image: "assets/showcase-robot-friend.png"
    },
    passage: [
      "The seminar passage opens with a polite remark that hides a sharper judgment.",
      "One character smiles, but the pause before the answer changes the scene.",
      "The class must decide whether the silence shows pride, doubt, or strategy.",
      "Strong evidence can support more than one mature interpretation."
    ],
    quiz: [
      "What hides inside the polite remark?",
      "Which structural detail changes the scene?",
      "What interpretations can the silence support?",
      "What evidence would make an answer stronger?",
      "Why can more than one interpretation be mature?"
    ],
    exampleSentence: "Strong evidence can support more than one mature interpretation.",
    imitationTemplate: "Strong evidence can support more than one ___.",
    prompt: "A thoughtful literature seminar with glowing notes about pride, doubt, and evidence."
  }
};

const storyPackGroups = [
  {
    id: "elementary",
    title: "Elementary K-5",
    grades: ["K", "1", "2", "3", "4", "5"]
  },
  {
    id: "middle",
    title: "Middle School 6-8",
    grades: ["6", "7", "8"]
  },
  {
    id: "high",
    title: "High School 9-12",
    grades: ["9", "10", "11", "12"]
  }
];

const writeGradeSkillMap = {
  K: {
    summary: "Kindergarten · Drawing, Telling, Writing",
    skills: [
      ["Narrative Sequence", "CCSS.ELA-LITERACY.W.K.3", "Use drawing, dictating, and writing to narrate a single event.", "I can tell what happened first and next."],
      ["Character & Setting", "CCSS.ELA-LITERACY.RL.K.3", "Name the characters, setting, and major events in a story.", "I can say who is in my story and where they are."],
      ["Dialogue", "CCSS.ELA-LITERACY.SL.K.6", "Speak audibly and express thoughts, feelings, and ideas clearly.", "I can make my character say one clear sentence."],
      ["Descriptive Details", "CCSS.ELA-LITERACY.L.K.5", "Explore word relationships and shades of meaning.", "I can choose one describing word for my picture."],
      ["Opinion + Reason", "CCSS.ELA-LITERACY.W.K.1", "Use drawing, dictating, and writing to state an opinion.", "I can say what I like and why."]
    ]
  },
  1: {
    summary: "Grade 1 · Sequenced Story Events",
    skills: [
      ["Narrative Sequence", "CCSS.ELA-LITERACY.W.1.3", "Recount two or more sequenced events with details and closure.", "I can use first, next, and last."],
      ["Character & Setting", "CCSS.ELA-LITERACY.RL.1.3", "Describe characters, settings, and major events using key details.", "I can add one character detail and one place detail."],
      ["Dialogue", "CCSS.ELA-LITERACY.SL.1.4", "Describe people, places, things, and events with relevant details.", "I can tell what a character says or feels."],
      ["Descriptive Details", "CCSS.ELA-LITERACY.L.1.5", "Sort words into categories and define words by attributes.", "I can choose words that fit the scene."],
      ["Opinion + Reason", "CCSS.ELA-LITERACY.W.1.1", "Write opinion pieces with a topic, opinion, reason, and closure.", "I can explain why I like my story ending."]
    ]
  },
  2: {
    summary: "Grade 2 · Actions, Thoughts, Feelings",
    skills: [
      ["Narrative Sequence", "CCSS.ELA-LITERACY.W.2.3", "Write a sequence of events with actions, thoughts, feelings, and closure.", "I can show what happened and how the character felt."],
      ["Character & Setting", "CCSS.ELA-LITERACY.RL.2.3", "Describe how characters respond to major events and challenges.", "I can explain what my character does when a problem appears."],
      ["Dialogue", "CCSS.ELA-LITERACY.SL.2.4", "Tell a story or recount an experience with appropriate facts and details.", "I can add a line that shows a character's voice."],
      ["Descriptive Details", "CCSS.ELA-LITERACY.L.2.5", "Use word relationships and nuances to describe meaning.", "I can make a sentence more vivid with one precise word."],
      ["Opinion + Reason", "CCSS.ELA-LITERACY.W.2.1", "Write an opinion with reasons and linking words.", "I can support my favorite scene with a reason."]
    ]
  },
  3: {
    summary: "Grade 3 · Narrative Writing",
    skills: [
      ["Narrative Sequence", "CCSS.ELA-LITERACY.W.3.3a", "Establish a situation and introduce a narrator or characters.", "I can order events with time words."],
      ["Character & Setting", "CCSS.ELA-LITERACY.W.3.3b", "Use dialogue and descriptions of actions, thoughts, and feelings.", "I can describe characters and setting in detail."],
      ["Dialogue", "CCSS.ELA-LITERACY.W.4.3b", "Use dialogue and description to develop experiences and events.", "I can add dialogue between characters."],
      ["Descriptive Details", "CCSS.ELA-LITERACY.W.3.3d", "Provide a sense of closure.", "I can use sensory details and a clear ending."],
      ["Opinion + Reason", "CCSS.ELA-LITERACY.W.3.1a", "Introduce an opinion and organize reasons.", "I can explain what my story teaches."]
    ]
  },
  4: {
    summary: "Grade 4 · Clear Narrative Technique",
    skills: [
      ["Narrative Sequence", "CCSS.ELA-LITERACY.W.4.3a", "Orient the reader by establishing a situation and introducing characters.", "I can make the reader understand who, where, and what problem."],
      ["Character & Setting", "CCSS.ELA-LITERACY.W.4.3b", "Use dialogue and description to develop experiences and events.", "I can show character through action and speech."],
      ["Dialogue", "CCSS.ELA-LITERACY.W.4.3b", "Use dialogue to move the story forward.", "I can make each line of dialogue do story work."],
      ["Descriptive Details", "CCSS.ELA-LITERACY.W.4.3d", "Use concrete words, phrases, and sensory details.", "I can add vivid details that guide the illustration."],
      ["Opinion + Reason", "CCSS.ELA-LITERACY.W.4.1a", "Introduce a topic or text clearly and state an opinion.", "I can write a reflection with a clear reason."]
    ]
  },
  5: {
    summary: "Grade 5 · Pacing and Development",
    skills: [
      ["Narrative Sequence", "CCSS.ELA-LITERACY.W.5.3a", "Orient the reader and organize an event sequence that unfolds naturally.", "I can build a beginning, turning point, and ending."],
      ["Character & Setting", "CCSS.ELA-LITERACY.W.5.3b", "Use narrative techniques such as dialogue, description, and pacing.", "I can slow down an important moment."],
      ["Dialogue", "CCSS.ELA-LITERACY.W.5.3b", "Use dialogue to develop experiences and events.", "I can make dialogue reveal character."],
      ["Descriptive Details", "CCSS.ELA-LITERACY.W.5.3d", "Use concrete words and sensory details to convey experiences precisely.", "I can choose details that help the AI scene stay consistent."],
      ["Opinion + Reason", "CCSS.ELA-LITERACY.W.5.1", "Write opinion pieces supporting a point of view with reasons and information.", "I can explain why my story ending works."]
    ]
  },
  6: {
    summary: "Grade 6 · Technique and Coherence",
    skills: [
      ["Narrative Sequence", "CCSS.ELA-LITERACY.W.6.3a", "Engage the reader and organize an event sequence that unfolds naturally.", "I can create a clear story arc."],
      ["Character & Setting", "CCSS.ELA-LITERACY.W.6.3b", "Use dialogue, pacing, and description to develop experiences and characters.", "I can balance action and description."],
      ["Dialogue", "CCSS.ELA-LITERACY.W.6.3b", "Use dialogue and pacing to develop events.", "I can revise a line so it changes the scene."],
      ["Descriptive Details", "CCSS.ELA-LITERACY.W.6.3d", "Use precise words, relevant details, and sensory language.", "I can write camera-ready detail."],
      ["Opinion + Reason", "CCSS.ELA-LITERACY.W.6.1", "Support claims with clear reasons and relevant evidence.", "I can justify my creative choices."]
    ]
  },
  7: {
    summary: "Grade 7 · Point of View and Reflection",
    skills: [
      ["Narrative Sequence", "CCSS.ELA-LITERACY.W.7.3a", "Engage the reader and establish point of view.", "I can write from a clear narrator's view."],
      ["Character & Setting", "CCSS.ELA-LITERACY.W.7.3b", "Use dialogue, pacing, and description to develop events and characters.", "I can show how setting shapes a choice."],
      ["Dialogue", "CCSS.ELA-LITERACY.W.7.3b", "Use dialogue to develop characters and events.", "I can make dialogue sound natural and useful."],
      ["Descriptive Details", "CCSS.ELA-LITERACY.W.7.3d", "Use precise words, sensory language, and transition words.", "I can control mood with details."],
      ["Opinion + Reason", "CCSS.ELA-LITERACY.W.7.1", "Support claims with logical reasoning and relevant evidence.", "I can explain why a scene should become a movie shot."]
    ]
  },
  8: {
    summary: "Grade 8 · Reflection and Structure",
    skills: [
      ["Narrative Sequence", "CCSS.ELA-LITERACY.W.8.3a", "Engage the reader and establish context, point of view, and conflict.", "I can set up a conflict clearly."],
      ["Character & Setting", "CCSS.ELA-LITERACY.W.8.3b", "Use narrative techniques to develop experiences and characters.", "I can reveal character through choices."],
      ["Dialogue", "CCSS.ELA-LITERACY.W.8.3b", "Use dialogue, pacing, and reflection to develop the story.", "I can add a reflective sentence after action."],
      ["Descriptive Details", "CCSS.ELA-LITERACY.W.8.3d", "Use precise words and sensory language to capture action.", "I can write details that shape the visual style."],
      ["Opinion + Reason", "CCSS.ELA-LITERACY.W.8.1", "Support claims with logical reasoning and relevant evidence.", "I can defend my artistic direction."]
    ]
  },
  9: {
    summary: "Grade 9 · Complex Narrative Craft",
    skills: [
      ["Narrative Sequence", "CCSS.ELA-LITERACY.W.9-10.3a", "Engage and orient the reader by setting out a problem or situation.", "I can open with a strong situation."],
      ["Character & Setting", "CCSS.ELA-LITERACY.W.9-10.3b", "Use narrative techniques to develop experiences, events, and characters.", "I can use pacing to build tension."],
      ["Dialogue", "CCSS.ELA-LITERACY.W.9-10.3b", "Use dialogue to develop characters and events.", "I can write dialogue with subtext."],
      ["Descriptive Details", "CCSS.ELA-LITERACY.W.9-10.3d", "Use precise words and sensory language to convey vivid experience.", "I can write scene details that match tone."],
      ["Opinion + Reason", "CCSS.ELA-LITERACY.W.9-10.1", "Write arguments with valid reasoning and relevant evidence.", "I can justify a creative decision with evidence."]
    ]
  },
  10: {
    summary: "Grade 10 · Tone and Outcome",
    skills: [
      ["Narrative Sequence", "CCSS.ELA-LITERACY.W.9-10.3a", "Engage the reader and establish point of view and conflict.", "I can build a scene toward an outcome."],
      ["Character & Setting", "CCSS.ELA-LITERACY.W.9-10.3b", "Use pacing, dialogue, and description to develop characters.", "I can reveal character growth."],
      ["Dialogue", "CCSS.ELA-LITERACY.W.9-10.3b", "Use dialogue to develop events and relationships.", "I can make dialogue carry tension."],
      ["Descriptive Details", "CCSS.ELA-LITERACY.W.9-10.3d", "Use precise details to convey tone and mood.", "I can guide the movie shot through language."],
      ["Opinion + Reason", "CCSS.ELA-LITERACY.W.9-10.2", "Develop a topic with significant and relevant facts or examples.", "I can explain the theme behind my video."]
    ]
  },
  11: {
    summary: "Grade 11 · Multi-Thread Narrative",
    skills: [
      ["Narrative Sequence", "CCSS.ELA-LITERACY.W.11-12.3a", "Engage the reader and establish multiple plot lines or experiences.", "I can introduce a complex situation."],
      ["Character & Setting", "CCSS.ELA-LITERACY.W.11-12.3b", "Use narrative techniques to develop characters and experiences.", "I can layer action, reflection, and setting."],
      ["Dialogue", "CCSS.ELA-LITERACY.W.11-12.3b", "Use dialogue and pacing to develop events and characters.", "I can write dialogue with implication."],
      ["Descriptive Details", "CCSS.ELA-LITERACY.W.11-12.3d", "Use precise words and sensory language to create a vivid picture.", "I can shape tone through exact detail."],
      ["Opinion + Reason", "CCSS.ELA-LITERACY.W.11-12.1", "Write arguments supporting claims with valid reasoning and evidence.", "I can defend an interpretation of my story."]
    ]
  },
  12: {
    summary: "Grade 12 · Mature Voice and Style",
    skills: [
      ["Narrative Sequence", "CCSS.ELA-LITERACY.W.11-12.3a", "Engage the reader with a complex narrative structure.", "I can manage a nuanced sequence of events."],
      ["Character & Setting", "CCSS.ELA-LITERACY.W.11-12.3b", "Use narrative techniques to build tone, outcome, and meaning.", "I can connect character choices to theme."],
      ["Dialogue", "CCSS.ELA-LITERACY.W.11-12.3b", "Use dialogue and pacing to reveal complexity.", "I can write concise dialogue with subtext."],
      ["Descriptive Details", "CCSS.ELA-LITERACY.W.11-12.3d", "Use precise words, sensory language, and style to convey experience.", "I can write a scene that directs image and motion."],
      ["Opinion + Reason", "CCSS.ELA-LITERACY.W.11-12.2", "Write informative texts that develop complex ideas clearly.", "I can explain the creative and literary purpose."]
    ]
  }
};

const readPanels = {
  story: {
    chip: "Step 1",
    title: "Read Story",
    body: "Students read the teacher-uploaded passage, tap highlighted words, listen aloud, and collect evidence from the text."
  },
  vocabulary: {
    chip: "Visual Vocabulary",
    title: "Vocabulary Card",
    body: "Tap a highlighted word to open its visual definition, Chinese meaning, pronunciation, word book action, and AI picture preview."
  },
  ccss: {
    chip: "CCSS",
    title: "CCSS Skill Card",
    body: "The page maps the reading passage to a grade-level CCSS skill, then turns that skill into a focused student task."
  },
  ela: {
    chip: "ELA",
    title: "ELA Skill",
    body: "Students practice a reading technique such as evidence, character traits, setting, theme, or sentence craft."
  },
  writing: {
    chip: "Guided Writing",
    title: "Guided Writing",
    body: "Students imitate one sentence pattern from the reading and receive quick feedback from Lobster AI Tutor."
  },
  storybook: {
    chip: "Visual Creation",
    title: "Storybook Image",
    body: "The final step generates one classic children's storybook illustration that matches the passage and grade level."
  }
};

function openReadModal(title, body, chip = "Visual Read") {
  const modal = document.getElementById("read-modal");
  if (!modal) return;

  const titleNode = modal.querySelector("[data-modal-title]");
  const bodyNode = modal.querySelector("[data-modal-body]");
  const chipNode = modal.querySelector("[data-modal-chip]");
  if (titleNode) titleNode.textContent = title;
  if (bodyNode) bodyNode.textContent = body;
  if (chipNode) chipNode.textContent = chip;

  modal.hidden = false;
  modal.classList.add("is-open");
  modal.querySelector(".read-modal-close")?.focus();
}

function closeReadModal() {
  const modal = document.getElementById("read-modal");
  if (!modal) return;
  modal.classList.remove("is-open");
  modal.hidden = true;
}

function showToast(message) {
  const toast = document.querySelector(".toast-message") || document.getElementById("read-toast");
  if (!toast) return;
  toast.textContent = message;
  toast.hidden = false;
  window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(() => {
    toast.hidden = true;
  }, 2400);
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function getStoryPack(grade) {
  return storyPacks[grade] || storyPacks[3];
}

function getActiveReadGrade(root = document) {
  return root.querySelector("[data-grade-selector] .grade-chip.active")?.dataset.grade || "3";
}

function highlightStoryVocabulary(sentence, pack, selected = false) {
  const word = pack.vocabulary.word;
  const escapedSentence = escapeHtml(sentence);
  const pattern = new RegExp(`\\b${escapeRegExp(escapeHtml(word))}\\b`, "i");
  if (!pattern.test(escapedSentence)) return escapedSentence;
  return escapedSentence.replace(pattern, `<button class="inline-word${selected ? " selected" : ""}" type="button" data-open-panel="vocabulary" data-word="${escapeHtml(word)}">${escapeHtml(word)}</button>`);
}

function updateStoryLibrarySummary(root = document, grade = getActiveReadGrade(root)) {
  const summary = root.querySelector("[data-story-library-summary]");
  if (!summary) return;

  const pack = getStoryPack(grade);
  summary.innerHTML = `
    <span>Currently loaded</span>
    <strong>${escapeHtml(pack.gradeLabel)} - ${escapeHtml(pack.title)}</strong>
    <small>Source Type: ${escapeHtml(pack.sourceType)} - ${escapeHtml(pack.skill)} - ${escapeHtml(pack.ccss)} - Reading Passage - 5-question Quiz - Vocabulary Card - Imitation Sentence</small>
  `;
}

function toggleStoryLibrary(root = document, forceOpen) {
  const panel = root.querySelector("[data-story-library-panel]");
  const body = root.querySelector("[data-story-library-body]");
  const toggle = root.querySelector("[data-story-library-toggle]");
  if (!body || !toggle) return;

  const shouldOpen = typeof forceOpen === "boolean" ? forceOpen : body.hidden;
  body.hidden = !shouldOpen;
  panel?.classList.toggle("is-open", shouldOpen);
  toggle.setAttribute("aria-expanded", shouldOpen ? "true" : "false");
  toggle.textContent = shouldOpen ? "Close Grade Library" : "Open Grade Library";
}

function renderStoryPackLibrary(root = document) {
  const grid = root.querySelector("[data-story-pack-grid]");
  if (!grid) return;

  const activeGrade = getActiveReadGrade(root);
  grid.innerHTML = storyPackGroups
    .map((group) => {
      const groupSummary = group.grades
        .map((grade) => {
          const pack = getStoryPack(grade);
          return `${pack.gradeLabel}: ${pack.skill}`;
        })
        .join(" / ");

      return `
      <section class="story-pack-group" data-story-pack-group="${escapeHtml(group.id)}">
        <div class="story-pack-group-heading">
          <h3>${escapeHtml(group.title)}</h3>
          <p>${escapeHtml(groupSummary)}</p>
        </div>
        <div class="story-pack-group-grid">
          ${group.grades
            .map((grade) => {
              const pack = getStoryPack(grade);
              return `
              <button class="story-pack-card${grade === activeGrade ? " active" : ""}" type="button" data-story-pack-card="${escapeHtml(grade)}">
                <img src="${escapeHtml(pack.vocabulary.image)}" alt="" />
                <span class="story-pack-meta" data-story-pack-source>${escapeHtml(pack.gradeLabel)} - Source Type: ${escapeHtml(pack.sourceType)}</span>
                <strong data-story-pack-title>${escapeHtml(pack.title)}</strong>
                <em data-story-pack-skill>${escapeHtml(pack.skill)} - ${escapeHtml(pack.ccss)}</em>
                <p class="story-pack-preview">${escapeHtml(pack.skillNote)}</p>
                <span class="story-pack-quiz-list" data-story-pack-quiz>Reading Passage - 5-question Quiz - Vocabulary Card - Imitation Sentence - Generate Image / Generate Video</span>
              </button>
            `;
            })
            .join("")}
        </div>
      </section>
      `;
    })
    .join("");

  updateStoryLibrarySummary(root, activeGrade);
}

function setImitationFlowFromStoryPack(root, pack) {
  const flow = root.querySelector("[data-imitation-flow]");
  if (!flow || !pack) return;

  const skillCode = flow.querySelector("[data-ccss-skill-code]");
  const skillNote = flow.querySelector("[data-ccss-skill-note]");
  const exampleNode = flow.querySelector("[data-example-sentence]");
  const templateNode = flow.querySelector("[data-imitation-template]");
  const feedback = flow.querySelector("[data-imitation-feedback]");
  const preview = flow.querySelector("[data-imitation-preview]");
  const transcript = flow.querySelector("[data-imitation-transcript]");

  if (skillCode) skillCode.textContent = `${pack.ccss} - ${pack.skill}`;
  if (skillNote) skillNote.textContent = pack.skillNote;
  if (exampleNode) exampleNode.textContent = pack.exampleSentence;
  if (templateNode) templateNode.textContent = pack.imitationTemplate;
  if (feedback) feedback.textContent = `Write an imitation sentence from ${pack.title}, then ask Lobster AI to check it.`;
  if (transcript) transcript.textContent = fillImitationTemplate(pack.imitationTemplate);
  setImitationSpeechStatus(root, `Say: ${fillImitationTemplate(pack.imitationTemplate)}`, false);
  resetVideoGate(root);
  updateTutorChecklist(root);
  if (preview) {
    preview.innerHTML = `
      <img src="${escapeHtml(pack.vocabulary.image)}" alt="${escapeHtml(pack.title)} output preview" />
      <div>
        <strong>Visual Proof</strong>
        <p>${escapeHtml(pack.prompt)}</p>
      </div>
    `;
  }
}

function applyStoryPack(grade, root = document) {
  const pack = getStoryPack(grade);
  root.dataset.activeStoryPack = String(grade);
  root.dataset.activeVocabulary = pack.vocabulary.word.toLowerCase();

  const storyTitle = root.querySelector(".story-title-row h3");
  const sourcePill = root.querySelector(".story-title-row .source-pill");
  const storyBody = root.querySelector(".story-reading-card .story-body");
  if (storyTitle) storyTitle.textContent = pack.title;
  if (sourcePill) sourcePill.textContent = `Source Type: ${pack.sourceType}`;
  if (storyBody) {
    let highlighted = false;
    storyBody.innerHTML = pack.passage
      .map((sentence) => {
        const shouldSelect = !highlighted && new RegExp(`\\b${escapeRegExp(pack.vocabulary.word)}\\b`, "i").test(sentence);
        if (shouldSelect) highlighted = true;
        return `<p>${highlightStoryVocabulary(sentence, pack, shouldSelect)}</p>`;
      })
      .join("");
  }

  root.querySelectorAll(".word-popover [data-word]").forEach((button) => {
    button.dataset.word = pack.vocabulary.word;
  });

  const currentWord = root.querySelector("[data-current-word]");
  if (currentWord) currentWord.textContent = pack.vocabulary.word;

  const vocabButton = root.querySelector(".visual-vocab-image-card");
  const vocabImage = root.querySelector(".visual-vocab-image-card img");
  if (vocabButton) {
    vocabButton.dataset.word = pack.vocabulary.word;
    vocabButton.setAttribute("aria-label", `Open generated visual vocabulary card for ${pack.vocabulary.word}`);
  }
  if (vocabImage) {
    vocabImage.src = pack.vocabulary.image;
    vocabImage.alt = `Generated visual vocabulary card for ${pack.vocabulary.word}`;
  }

  const quickVisual = root.querySelector(".quick-check-visual");
  const quickImage = root.querySelector(".quick-check-visual img");
  const quickLabel = root.querySelector(".quick-check-visual span");
  const quickQuestion = root.querySelector(".quick-check-row p");
  const quickInput = root.querySelector("#quick-check-input");
  if (quickVisual) {
    quickVisual.dataset.word = pack.vocabulary.word;
    quickVisual.setAttribute("aria-label", `Open ${pack.vocabulary.word} visual vocabulary preview`);
  }
  if (quickImage) {
    quickImage.src = pack.vocabulary.image;
    quickImage.alt = `${pack.vocabulary.word} quick check prompt`;
  }
  if (quickLabel) quickLabel.textContent = pack.vocabulary.word;
  if (quickQuestion) quickQuestion.textContent = `Look at the picture. What story word is it? Hint: ${pack.vocabulary.definition}.`;
  if (quickInput) quickInput.value = "";

  setImitationFlowFromStoryPack(root, pack);
}

function selectVisualReadGrade(root = document, grade = "3", announce = true) {
  const profile = gradeProfiles[grade];
  if (!profile) return;

  root.querySelectorAll("[data-grade-selector] .grade-chip").forEach((chip) => {
    const isActive = chip.dataset.grade === String(grade);
    chip.classList.toggle("active", isActive);
    chip.setAttribute("aria-pressed", isActive ? "true" : "false");
  });

  const summary = root.querySelector("[data-grade-summary]");
  const standard = root.querySelector("[data-ccss-standard]");
  if (summary) summary.textContent = profile.summary;
  if (standard) standard.textContent = profile.standard;

  renderGradeSkillCards(grade, root);
  applyStoryPack(grade, root);
  renderStoryPackLibrary(root);

  if (root.querySelector("[data-upload-text]")?.value.trim()) {
    renderUploadCcssMatches(root);
    renderImitationFlowFromCcss(root);
  }

  if (announce) showToast(`Grade ${grade} CCSS story pack selected`);
}

function renderGradeSkillCards(grade, root = document) {
  const grid = root.querySelector("[data-skill-card-grid]");
  const title = root.querySelector("[data-skill-board-title]");
  const note = root.querySelector("[data-skill-board-note]");
  const skills = ccssSkillMap[grade] || ccssSkillMap[3];
  const profile = gradeProfiles[grade] || gradeProfiles[3];

  if (title) title.textContent = `${profile.summary} Visual Read Framework`;
  if (note) note.textContent = "Five cards map the lesson flow to grade-level CCSS skills. Hover, focus, or click a card to see how the skill becomes a classroom task.";
  if (!grid) return;

  grid.innerHTML = skills
    .map(([framework, skill, code, explanation, task]) => `
      <button class="ccss-flip-card" type="button" data-open-panel="ccss" data-panel-title="${escapeHtml(`${code} · ${skill}`)}" data-panel-body="${escapeHtml(`${explanation} ${task}`)}">
        <span class="skill-card-inner">
          <span class="skill-card-front">
            <small>${escapeHtml(framework)}</small>
            <strong>${escapeHtml(skill)}</strong>
            <em>${escapeHtml(code)}</em>
          </span>
          <span class="skill-card-back">
            <strong>What it means</strong>
            <span>${escapeHtml(explanation)}</span>
            <small>Task: ${escapeHtml(task)}</small>
          </span>
        </span>
      </button>
    `)
    .join("");

  grid.querySelectorAll(".ccss-flip-card").forEach((card) => {
    card.addEventListener("click", () => {
      openReadModal(card.dataset.panelTitle, card.dataset.panelBody, "CCSS Skill");
    });
  });
}

function matchUploadedTextToCcss(text, grade) {
  const normalizedText = String(text || "").toLowerCase();
  const skills = ccssSkillMap[grade] || ccssSkillMap[3];
  const hasDialogue = /["“”]/.test(text) || /\bsaid|asked|whispered|replied\b/.test(normalizedText);
  const hasTheme = /\blesson|moral|promise|learned|because|why\b/.test(normalizedText);
  const hasVisualDetail = /\bmoon|light|color|picture|image|looked|saw|bright|dark|setting\b/.test(normalizedText);
  const hasSequence = /\bfirst|next|then|finally|last|after|before|at last\b/.test(normalizedText);
  const hasEvidence = normalizedText.length > 160;

  return skills
    .map(([framework, skill, code, explanation, task]) => {
      let score = 1;
      const searchable = `${framework} ${skill} ${code} ${explanation} ${task}`.toLowerCase();
      if (hasEvidence && /\bevidence|details|quote|answer|questions\b/.test(searchable)) score += 2;
      if (hasTheme && /\btheme|message|moral|lesson|central\b/.test(searchable)) score += 2;
      if (hasVisualDetail && /\billustration|visual|picture|image|setting|word\b/.test(searchable)) score += 2;
      if (hasSequence && /\bsequence|retell|beginning|middle|ending|narrative\b/.test(searchable)) score += 2;
      if (hasDialogue && /\bdialogue|description|writing|narrative|character\b/.test(searchable)) score += 2;

      const reason = score >= 4
        ? "Strong match: the passage contains cues this CCSS skill can turn into a focused lesson task."
        : "Useful support skill: this can become a follow-up card after the main reading activity.";

      return { framework, skill, code, explanation, task, score, reason };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);
}

function renderUploadCcssMatches(root = document) {
  const output = root.querySelector("[data-ccss-match-output]");
  const textArea = root.querySelector("[data-upload-text]");
  const gradeSelect = root.querySelector("[data-upload-grade-selector]");
  if (!output || !textArea || !gradeSelect) return;

  const matches = matchUploadedTextToCcss(textArea.value, gradeSelect.value);
  output.innerHTML = `
    <h3>Matched CCSS Skill Cards</h3>
    ${matches
      .map((match, index) => `
        <article class="matched-skill-card">
          <small>${index === 0 ? "Best match" : `Match ${index + 1}`} · ${escapeHtml(match.framework)}</small>
          <strong>${escapeHtml(match.code)} · ${escapeHtml(match.skill)}</strong>
          <p>${escapeHtml(match.explanation)}</p>
          <p>${escapeHtml(match.task)}</p>
          <small>${escapeHtml(match.reason)}</small>
        </article>
      `)
      .join("")}
  `;
}

function extractExampleSentenceLegacy(text) {
  const sentences = String(text || "")
    .replace(/\s+/g, " ")
    .match(/[^.!?。！？]+[.!?。！？"]/g) || String(text || "")
    .replace(/\s+/g, " ")
    .match(/[^.!?。！？]+[.!?。！？]/g) || [];
  const dialogueSentence = sentences.find((sentence) => /["“”]|said|asked|whispered|replied/i.test(sentence));
  const actionSentence = sentences.find((sentence) => /stepped|walked|moved|looked|reached|crossed|carried|held/i.test(sentence));
  return (dialogueSentence || actionSentence || sentences[0] || "I will be brave and go slowly.").trim();
}

function buildImitationTemplateLegacy(exampleSentence) {
  const lower = exampleSentence.toLowerCase();
  if (lower.includes("will")) return "I will be ___ and ___ slowly.";
  if (/said|asked|whispered|replied/.test(lower)) return '"___," the ___ whispered, feeling ___.';
  if (/stepped|walked|moved|crossed/.test(lower)) return "The ___ moved ___ toward the ___.";
  return "The ___ felt ___ because ___.";
}

function renderImitationFlowFromCcssLegacy(root = document) {
  const flow = root.querySelector("[data-imitation-flow]");
  if (!flow) return;

  const uploadText = root.querySelector("[data-upload-text]")?.value.trim();
  const storyText = getReadAloudText(root);
  const text = uploadText || storyText;
  const grade = root.querySelector("[data-upload-grade-selector]")?.value
    || root.querySelector("[data-grade-selector] .grade-chip.active")?.dataset.grade
    || "3";
  const bestMatch = matchUploadedTextToCcss(text, grade)[0];
  const example = extractExampleSentence(text);
  const template = buildImitationTemplate(example);

  const skillCode = flow.querySelector("[data-ccss-skill-code]");
  const skillNote = flow.querySelector("[data-ccss-skill-note]");
  const exampleNode = flow.querySelector("[data-example-sentence]");
  const templateNode = flow.querySelector("[data-imitation-template]");

  if (skillCode && bestMatch) skillCode.textContent = `${bestMatch.code} · ${bestMatch.skill}`;
  if (skillNote && bestMatch) skillNote.textContent = bestMatch.explanation;
  if (exampleNode) exampleNode.textContent = example;
  if (templateNode) templateNode.textContent = template;
}

function scoreImitationSentenceLegacy(sentence) {
  const value = sentence.trim();
  const hasAction = /\bwalked|moved|stepped|looked|held|ran|sailed|crossed|opened|found\b/i.test(value);
  const hasSetting = /\bbridge|lighthouse|river|sea|castle|door|garden|boat|mountain|forest|world\b/i.test(value);
  const hasFeeling = /\bbrave|afraid|happy|careful|slowly|quietly|excited|worried|curious\b/i.test(value);
  const details = [hasAction, hasSetting, hasFeeling].filter(Boolean).length;
  if (!value) return "Write one imitation sentence first.";
  if (details >= 3) return "Strong sentence: it has action, setting, and feeling. Ready for visual generation.";
  if (details === 2) return "Good start. Add one feeling or setting detail to make the image clearer.";
  return "Add a clear action, place, and feeling so the picture knows what to show.";
}

function generateImitationOutputLegacy(root = document, type = "image") {
  const input = root.querySelector("[data-imitation-input]");
  const feedback = root.querySelector("[data-imitation-feedback]");
  const preview = root.querySelector("[data-imitation-preview]");
  const sentence = input?.value.trim() || "";
  const outputLabel = type === "video" ? "Generate Video" : "Generate Image";
  const image = type === "video" ? "assets/movie-scene.png" : "assets/storybook-portal-book.png";
  const feedbackText = scoreImitationSentence(sentence);

  if (feedback) feedback.textContent = feedbackText;
  if (preview) {
    preview.innerHTML = `
      <img src="${image}" alt="${outputLabel} preview" />
      <div>
        <strong>Visual Proof · ${outputLabel}</strong>
        <p>${escapeHtml(sentence || "Use the example pattern to write a sentence, then generate a visual.")}</p>
        <small>${escapeHtml(feedbackText)}</small>
      </div>
    `;
  }

  showToast(`${outputLabel} preview generated from the imitation sentence`);
}

function extractExampleSentence(text) {
  const normalized = String(text || "").replace(/\s+/g, " ").trim();
  const sentences = normalized.match(/[^.!?]+[.!?]/g) || [];
  const dialogueSentence = sentences.find((sentence) => /["']|said|asked|whispered|replied/i.test(sentence));
  const actionSentence = sentences.find((sentence) => /stepped|walked|moved|looked|reached|crossed|carried|held|opened|found/i.test(sentence));
  return (dialogueSentence || actionSentence || sentences[0] || "I will be brave and go slowly.").trim();
}

function buildImitationTemplate(exampleSentence) {
  const lower = exampleSentence.toLowerCase();
  if (lower.includes("will")) return "I will be ___ and ___ slowly.";
  if (/said|asked|whispered|replied/.test(lower)) return "\"___,\" the ___ whispered, feeling ___.";
  if (/stepped|walked|moved|crossed|opened|found/.test(lower)) return "The ___ moved ___ toward the ___.";
  return "The ___ felt ___ because ___.";
}

function fillImitationTemplate(template) {
  return template
    .replace("___", "brave girl")
    .replace("___", "carefully")
    .replace("___", "glowing lighthouse");
}

function getImitationSentence(root = document) {
  return root.querySelector("[data-imitation-input]")?.value.trim() || "";
}

function buildImitationFromFillSlots(root = document) {
  const template = root.querySelector("[data-imitation-template]")?.textContent || "I will be ___ and ___ slowly.";
  const feeling = root.querySelector('[data-fill-slot="feeling"]')?.value.trim() || "careful";
  const action = root.querySelector('[data-fill-slot="action"]')?.value.trim() || "walk";
  const activeWord = root.dataset.activeVocabulary || root.querySelector("[data-current-word]")?.textContent.trim().toLowerCase() || "bridge";
  const blanks = (template.match(/___/g) || []).length;

  if (blanks >= 2) {
    return template
      .replace("___", feeling)
      .replace("___", action);
  }

  return `I will be ${feeling} and ${action} slowly across the ${activeWord}.`;
}

function setImitationSentence(root = document, sentence = "") {
  const input = root.querySelector("[data-imitation-input]");
  const feedback = root.querySelector("[data-imitation-feedback]");
  if (input) input.value = sentence;
  if (feedback) feedback.textContent = scoreImitationSentence(sentence);
  updateTutorChecklist(root);
}

function analyzeImitationSentence(sentence) {
  const value = sentence.trim();
  const checks = {
    subject: /\b(i|we|he|she|they|the|a|an|mia|peter|alice|dorothy|holmes|mara|della|hester)\b/i.test(value),
    action: /\bwalk|walked|move|moved|step|stepped|look|looked|hold|held|run|ran|sail|sailed|cross|crossed|open|opened|find|found|lift|lifted|carry|carried\b/i.test(value),
    place: /\bbridge|lighthouse|river|sea|castle|door|garden|boat|mountain|forest|world|hill|room|gate|road|hall|window|city\b/i.test(value),
    feeling: /\bbrave|afraid|happy|careful|carefully|slowly|quiet|quietly|excited|worried|curious|gentle|steadfast|kind\b/i.test(value)
  };
  checks.ready = checks.subject && checks.action && checks.place && checks.feeling;
  return checks;
}

function updateTutorChecklist(root = document) {
  const sentence = getImitationSentence(root);
  const checks = analyzeImitationSentence(sentence);
  Object.entries(checks).forEach(([key, ready]) => {
    const item = root.querySelector(`[data-tutor-check="${key}"]`);
    if (item) item.classList.toggle("is-ready", Boolean(ready));
  });
  return checks;
}

function setImitationSpeechStatus(root = document, message = "", isListening = false) {
  const panel = root.querySelector(".voice-imitation-panel");
  const status = root.querySelector("[data-speech-status]");
  if (panel) panel.classList.toggle("is-listening", isListening);
  if (status) status.textContent = message;
}

function applySpeechTranscript(root = document, transcript = "") {
  const transcriptNode = root.querySelector("[data-imitation-transcript]");
  const value = transcript.trim() || "I will be careful and walk slowly across the bridge.";
  if (transcriptNode) transcriptNode.textContent = value;
  setImitationSpeechStatus(root, "AI transcription is ready. Use it, try again, or edit the text.", false);
  return value;
}

let imitationSpeechRecognizer = null;

function startImitationSpeech(root = document) {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    applySpeechTranscript(root, "I will be careful and walk slowly across the bridge.");
    showToast("Speech recognition is not available here, so a sample transcript was added.");
    return;
  }

  if (imitationSpeechRecognizer) {
    imitationSpeechRecognizer.abort();
    imitationSpeechRecognizer = null;
  }

  const recognizer = new SpeechRecognition();
  imitationSpeechRecognizer = recognizer;
  recognizer.lang = "en-US";
  recognizer.interimResults = false;
  recognizer.maxAlternatives = 1;
  recognizer.addEventListener("start", () => {
    setImitationSpeechStatus(root, "Listening... say your imitation sentence.", true);
  });
  recognizer.addEventListener("result", (event) => {
    const transcript = event.results?.[0]?.[0]?.transcript || "";
    applySpeechTranscript(root, transcript);
  });
  recognizer.addEventListener("error", () => {
    setImitationSpeechStatus(root, "Speech recognition was not available. Try again or type your sentence.", false);
  });
  recognizer.addEventListener("end", () => {
    imitationSpeechRecognizer = null;
    const status = root.querySelector("[data-speech-status]");
    if (status?.textContent.includes("Listening")) {
      setImitationSpeechStatus(root, "No speech captured yet. Try Again or type your sentence.", false);
    }
  });
  recognizer.start();
}

function resetVideoGate(root = document) {
  const button = root.querySelector("[data-video-gate]");
  if (!button) return;
  button.disabled = true;
  button.classList.remove("is-ready");
}

function enableVideoGate(root = document) {
  const button = root.querySelector("[data-video-gate]");
  if (!button) return;
  button.disabled = false;
  button.classList.add("is-ready");
}

function renderImitationFlowFromCcss(root = document) {
  const flow = root.querySelector("[data-imitation-flow]");
  if (!flow) return;

  const uploadText = root.querySelector("[data-upload-text]")?.value.trim();
  const storyText = getReadAloudText(root);
  const text = uploadText || storyText;
  const grade = root.querySelector("[data-upload-grade-selector]")?.value
    || root.querySelector("[data-grade-selector] .grade-chip.active")?.dataset.grade
    || "3";
  const pack = uploadText ? null : getStoryPack(grade);
  const bestMatch = matchUploadedTextToCcss(text, grade)[0];
  const example = pack?.exampleSentence || extractExampleSentence(text);
  const template = pack?.imitationTemplate || buildImitationTemplate(example);

  const skillCode = flow.querySelector("[data-ccss-skill-code]");
  const skillNote = flow.querySelector("[data-ccss-skill-note]");
  const exampleNode = flow.querySelector("[data-example-sentence]");
  const templateNode = flow.querySelector("[data-imitation-template]");
  const transcriptNode = flow.querySelector("[data-imitation-transcript]");

  if (skillCode && (pack || bestMatch)) skillCode.textContent = pack ? `${pack.ccss} - ${pack.skill}` : `${bestMatch.code} - ${bestMatch.skill}`;
  if (skillNote && (pack || bestMatch)) skillNote.textContent = pack ? pack.skillNote : bestMatch.explanation;
  if (exampleNode) exampleNode.textContent = example;
  if (templateNode) templateNode.textContent = template;
  if (transcriptNode) transcriptNode.textContent = fillImitationTemplate(template);
  setImitationSpeechStatus(root, `Say: ${fillImitationTemplate(template)}`, false);
  resetVideoGate(root);
  updateTutorChecklist(root);
}

function scoreImitationSentence(sentence) {
  const value = sentence.trim();
  const checks = analyzeImitationSentence(value);
  const details = [checks.subject, checks.action, checks.place, checks.feeling].filter(Boolean).length;
  if (!value) return "Write one imitation sentence first.";
  if (checks.ready) return "Strong sentence: Lobster sees a subject, action, picture place, and feeling or manner. Ready for image/video.";
  if (details >= 3) return "Good start. Add the missing subject, action, place, or feeling so the visual is clearer.";
  if (details === 2) return "Almost there. Add a picture place and a feeling or manner word.";
  return "Add a clear subject, action, place, and feeling so the picture knows what to show.";
}

const visualDraftStorageKey = "storieslens_visual_read_drafts";

function loadVisualDrafts() {
  try {
    return JSON.parse(localStorage.getItem(visualDraftStorageKey) || "[]");
  } catch (error) {
    return [];
  }
}

function storeVisualDrafts(drafts) {
  try {
    localStorage.setItem(visualDraftStorageKey, JSON.stringify(drafts.slice(0, 6)));
  } catch (error) {
    // Local storage can be unavailable in strict privacy contexts.
  }
}

function createVisualDraft(root = document, type = "image") {
  const uploadText = root.querySelector("[data-upload-text]")?.value.trim();
  const originalArticle = uploadText || getReadAloudText(root);
  const sentence = root.querySelector("[data-imitation-input]")?.value.trim() || "";
  const outputType = type === "video" ? "Make Short Video" : "Generate Image";
  const image = type === "video" ? "assets/movie-scene.png" : "assets/storybook-portal-book.png";
  const draft = {
    id: `draft-${Date.now()}`,
    outputType,
    image,
    originalArticle,
    matchedCcss: root.querySelector("[data-ccss-skill-code]")?.textContent.trim() || "Matched CCSS Skill Card",
    exampleSentence: root.querySelector("[data-example-sentence]")?.textContent.trim() || "Article example sentence",
    studentSentence: sentence || "Use the example pattern to write a sentence.",
    generatedOutput: `${outputType} generated from the imitation sentence`,
    saved: false,
    version: 1
  };
  const drafts = [draft, ...loadVisualDrafts()].slice(0, 6);
  storeVisualDrafts(drafts);
  return draft;
}

function renderVisualDrafts(root = document) {
  const shelf = root.querySelector(".visual-drafts-shelf");
  const list = root.querySelector("[data-visual-drafts-list]");
  const empty = root.querySelector("[data-empty-drafts]");
  if (!shelf || !list) return;

  const drafts = loadVisualDrafts();
  shelf.classList.toggle("has-drafts", drafts.length > 0);
  if (empty) empty.hidden = drafts.length > 0;
  list.innerHTML = drafts
    .map((draft) => `
      <article class="visual-draft-card">
        <img src="${escapeHtml(draft.image)}" alt="${escapeHtml(draft.outputType)} draft preview" />
        <div>
          <h4>${escapeHtml(draft.outputType)} Draft${draft.saved ? " - Saved to Works" : ""}</h4>
          <p>${escapeHtml(draft.studentSentence)}</p>
          <div class="visual-draft-evidence" aria-label="Learning evidence">
            <span>Original Article</span>
            <span>Matched CCSS: ${escapeHtml(draft.matchedCcss)}</span>
            <span>Example Sentence</span>
            <span>Student Sentence</span>
            <span>Generated Output</span>
          </div>
        </div>
        <div class="draft-action-row">
          <button type="button" data-draft-action="save-visual-draft" data-draft-id="${escapeHtml(draft.id)}">${draft.saved ? "Saved to Works" : "Save to Works"}</button>
          <button type="button" data-draft-action="regenerate-visual-draft" data-draft-id="${escapeHtml(draft.id)}">Regenerate</button>
          <button type="button" data-draft-action="delete-visual-draft" data-draft-id="${escapeHtml(draft.id)}">Delete</button>
        </div>
      </article>
    `)
    .join("");
}

function updateVisualDraft(root = document, draftId, updater) {
  const drafts = loadVisualDrafts();
  const index = drafts.findIndex((draft) => draft.id === draftId);
  if (index < 0) return null;
  drafts[index] = updater(drafts[index]);
  storeVisualDrafts(drafts);
  renderVisualDrafts(root);
  return drafts[index];
}

function generateImitationOutput(root = document, type = "image") {
  const input = root.querySelector("[data-imitation-input]");
  const feedback = root.querySelector("[data-imitation-feedback]");
  const preview = root.querySelector("[data-imitation-preview]");
  const sentence = input?.value.trim() || "";
  const outputLabel = type === "video" ? "Make Short Video" : "Generate Image";
  const image = type === "video" ? "assets/movie-scene.png" : "assets/storybook-portal-book.png";
  const feedbackText = scoreImitationSentence(sentence);

  if (type === "video" && root.querySelector("[data-video-gate]")?.disabled) {
    showToast("Generate Image first, then make a short video from it.");
    return;
  }

  updateTutorChecklist(root);
  if (feedback) feedback.textContent = feedbackText;
  if (preview) {
    preview.innerHTML = `
      <img src="${image}" alt="${outputLabel} preview" />
      <div>
        <strong>Visual Proof - ${outputLabel}</strong>
        <p>${escapeHtml(sentence || "Use the example pattern to write a sentence, then generate a visual.")}</p>
        <small>${escapeHtml(type === "video" ? "Short video uses the generated image as its first-frame reference." : feedbackText)}</small>
      </div>
    `;
  }

  createVisualDraft(root, type);
  renderVisualDrafts(root);
  if (type === "image") enableVideoGate(root);
  showToast(`${outputLabel} draft added to My Visual Drafts`);
}

let currentReadUtterance = null;

function getReadAloudText(page = document) {
  const storyBody = page.querySelector(".story-reading-card .story-body");
  const uploadedText = page.querySelector("[data-upload-text]")?.value.trim();
  const storyText = storyBody?.textContent.replace(/\s+/g, " ").trim();
  return storyText || uploadedText || "";
}

function getReadAloudRate(page = document) {
  const speedText = page.querySelector('[data-read-action="speed"]')?.textContent.trim() || "1.0x";
  const parsed = Number(speedText.replace("x", ""));
  return Number.isFinite(parsed) ? parsed : 1;
}

function setReadAloudState(page, isReading, statusText = "") {
  const button = page.querySelector("[data-read-aloud-button]");
  const status = page.querySelector("[data-read-aloud-status]");
  if (button) {
    button.classList.toggle("is-reading", isReading);
    button.textContent = isReading ? "Stop Reading" : "Read Aloud";
  }
  if (status) status.textContent = statusText || (isReading ? "Reading aloud..." : "Ready to read");
}

function stopReadAloud(page = document, message = "Reading stopped") {
  if ("speechSynthesis" in window) {
    window.speechSynthesis.cancel();
  }
  currentReadUtterance = null;
  setReadAloudState(page, false, message);
}

function readCurrentStoryAloud(page = document) {
  if (!("speechSynthesis" in window) || typeof SpeechSynthesisUtterance === "undefined") {
    showToast("Read Aloud is not supported in this browser.");
    return;
  }

  if (currentReadUtterance) {
    stopReadAloud(page);
    return;
  }

  const text = getReadAloudText(page);
  if (!text) {
    showToast("Add or paste a story before reading aloud.");
    return;
  }

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "en-US";
  utterance.rate = getReadAloudRate(page);
  utterance.pitch = 1;

  const voices = window.speechSynthesis.getVoices?.() || [];
  const englishVoice = voices.find((voice) => /en(-|_)?US/i.test(voice.lang)) || voices.find((voice) => /^en/i.test(voice.lang));
  if (englishVoice) utterance.voice = englishVoice;

  utterance.onstart = () => setReadAloudState(page, true, `Reading aloud at ${utterance.rate.toFixed(1)}x`);
  utterance.onend = () => stopReadAloud(page, "Finished reading");
  utterance.onerror = () => stopReadAloud(page, "Read aloud stopped");

  currentReadUtterance = utterance;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utterance);
}

const readingRecordingStorageKey = "storieslens_reading_recordings";
let currentReadingRecorder = null;
let currentReadingRecording = null;

function getReadingRecordingControls(page = document) {
  return {
    panel: page.querySelector(".reading-recording-panel"),
    status: page.querySelector("[data-recording-status]"),
    playback: page.querySelector("[data-recording-playback]"),
    feedback: page.querySelector("[data-recording-feedback]"),
    start: page.querySelector('[data-record-action="start-recording"]'),
    stop: page.querySelector('[data-record-action="stop-recording"]'),
    replay: page.querySelector('[data-record-action="replay-recording"]'),
    save: page.querySelector('[data-record-action="save-recording"]'),
    ai: page.querySelector('[data-record-action="ai-fluency-feedback"]')
  };
}

function setRecordingControls(page = document, state = "idle", message = "") {
  const controls = getReadingRecordingControls(page);
  if (controls.status) controls.status.textContent = message;
  controls.panel?.classList.toggle("is-recording", state === "recording");
  if (controls.start) controls.start.disabled = state === "recording";
  if (controls.stop) controls.stop.disabled = state !== "recording";
  if (controls.replay) controls.replay.disabled = !currentReadingRecording;
  if (controls.save) controls.save.disabled = !currentReadingRecording;
  if (controls.ai) controls.ai.disabled = !currentReadingRecording;
}

function loadReadingRecordings() {
  try {
    return JSON.parse(localStorage.getItem(readingRecordingStorageKey) || "[]");
  } catch (error) {
    return [];
  }
}

function storeReadingRecordings(recordings) {
  try {
    localStorage.setItem(readingRecordingStorageKey, JSON.stringify(recordings.slice(0, 5)));
  } catch (error) {
    showToast("Recording is too large for local browser storage. Try a shorter reading.");
  }
}

function renderReadingRecordings(page = document) {
  const list = page.querySelector("[data-recording-list]");
  if (!list) return;
  const recordings = loadReadingRecordings();
  list.innerHTML = recordings.length
    ? recordings.map((recording) => `
      <article class="recording-history-card">
        <strong>${escapeHtml(recording.title)}</strong>
        <p>${escapeHtml(recording.feedback)}</p>
        <audio src="${escapeHtml(recording.audioDataUrl)}" controls></audio>
      </article>
    `).join("")
    : '<p class="recording-empty">Saved recordings stay local until you choose to share them with a teacher.</p>';
}

async function startReadingRecording(page = document) {
  if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
    setRecordingControls(page, "idle", "Recording needs a browser with microphone permission.");
    showToast("MediaRecorder is not supported in this browser.");
    return;
  }

  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  const chunks = [];
  const recorder = new MediaRecorder(stream);
  currentReadingRecording = null;
  currentReadingRecorder = { recorder, stream, chunks, startedAt: Date.now() };

  recorder.addEventListener("dataavailable", (event) => {
    if (event.data?.size) chunks.push(event.data);
  });

  recorder.addEventListener("stop", () => {
    stream.getTracks().forEach((track) => track.stop());
    const blob = new Blob(chunks, { type: recorder.mimeType || "audio/webm" });
    const audioUrl = URL.createObjectURL(blob);
    const durationSeconds = Math.max(1, Math.round((Date.now() - currentReadingRecorder.startedAt) / 1000));
    currentReadingRecording = {
      blob,
      audioUrl,
      durationSeconds,
      storyText: getReadAloudText(page)
    };
    const controls = getReadingRecordingControls(page);
    if (controls.playback) {
      controls.playback.src = audioUrl;
      controls.playback.hidden = false;
    }
    setRecordingControls(page, "ready", `Recorded ${durationSeconds}s locally. Replay or ask for feedback.`);
    currentReadingRecorder = null;
  });

  recorder.start();
  setRecordingControls(page, "recording", "Recording... read the passage aloud.");
}

function stopReadingRecording(page = document) {
  if (!currentReadingRecorder?.recorder) return;
  currentReadingRecorder.recorder.stop();
}

function replayReadingRecording(page = document) {
  const playback = getReadingRecordingControls(page).playback;
  if (!playback?.src) return;
  playback.currentTime = 0;
  playback.play();
}

function buildFluencyFeedback(page = document) {
  const wordCount = getReadAloudText(page).split(/\s+/).filter(Boolean).length;
  const seconds = currentReadingRecording?.durationSeconds || 1;
  const wordsPerMinute = Math.round((wordCount / seconds) * 60);
  if (wordsPerMinute < 80) return `Careful reading. Try a slightly smoother pace next time. Estimated pace: ${wordsPerMinute} WPM.`;
  if (wordsPerMinute > 170) return `Energetic reading. Slow down a little so every story detail is clear. Estimated pace: ${wordsPerMinute} WPM.`;
  return `Nice fluency. Your pace is clear for this passage. Estimated pace: ${wordsPerMinute} WPM.`;
}

function showFluencyFeedback(page = document) {
  const feedback = page.querySelector("[data-recording-feedback]");
  if (!feedback || !currentReadingRecording) return;
  const message = buildFluencyFeedback(page);
  feedback.innerHTML = `
    <strong>AI Fluency Feedback</strong>
    <p>${escapeHtml(message)} Future API step: upload audio to the backend, transcribe it, compare it with the original story, then return pronunciation and missed-word feedback.</p>
  `;
  showToast("Lobster AI fluency feedback ready");
}

function saveReadingRecording(page = document) {
  if (!currentReadingRecording?.blob) return;
  const reader = new FileReader();
  reader.addEventListener("load", () => {
    const feedback = buildFluencyFeedback(page);
    const recording = {
      id: `recording-${Date.now()}`,
      title: `Reading Practice - ${new Date().toLocaleDateString()}`,
      feedback,
      audioDataUrl: String(reader.result || "")
    };
    storeReadingRecordings([recording, ...loadReadingRecordings()]);
    renderReadingRecordings(page);
    setRecordingControls(page, "saved", "Saved locally. Teacher Mode can read completion status later.");
    showToast("Recording saved locally");
  });
  reader.readAsDataURL(currentReadingRecording.blob);
}

function initVisualReadInteractions() {
  const page = document.querySelector(".visual-read-page");
  if (!page) return;

  page.querySelectorAll("[data-grade-selector] .grade-chip").forEach((button) => {
    button.addEventListener("click", () => {
      selectVisualReadGrade(page, button.dataset.grade || "3");
    });
  });

  page.querySelector("[data-story-library-toggle]")?.addEventListener("click", () => {
    toggleStoryLibrary(page);
  });

  page.querySelectorAll("[data-open-panel]").forEach((trigger) => {
    trigger.addEventListener("click", () => {
      const word = trigger.dataset.word;
      if (word) {
        page.querySelectorAll(".inline-word").forEach((item) => item.classList.toggle("selected", item === trigger));
        const currentWord = page.querySelector("[data-current-word]");
        if (currentWord) currentWord.textContent = word;
        openReadModal(`Vocabulary: ${word}`, `Open the visual card for "${word}", add it to Word Book, or generate an AI picture that explains the word.`, "Word Study");
        return;
      }

      const panel = readPanels[trigger.dataset.openPanel] || readPanels.story;
      openReadModal(trigger.dataset.panelTitle || panel.title, trigger.dataset.panelBody || panel.body, panel.chip);
    });
  });

  page.querySelectorAll("[data-read-action]").forEach((control) => {
    control.addEventListener("click", (event) => {
      const action = control.dataset.readAction;
      const word = control.dataset.word || page.querySelector("[data-current-word]")?.textContent || "bridge";

      if (action === "close-modal") {
        event.preventDefault();
        closeReadModal();
        return;
      }

      if (action === "word-book") {
        showToast(`${word} added to Word Book`);
        return;
      }

      if (action === "ai-picture") {
        openReadModal("AI Picture Preview", `A picture prompt for "${word}" would be generated here, matching the story's classic illustration style.`, "AI Picture");
        return;
      }

      if (action === "quick-check") {
        const answer = document.getElementById("quick-check-input")?.value.trim().toLowerCase();
        const expected = page.dataset.activeVocabulary || "bridge";
        showToast(answer === expected ? `Correct: ${expected}.` : `Try again: it is "${expected}".`);
        return;
      }

      if (action === "upload-preview") {
        openReadModal("Teacher Upload Preview", "This prototype will turn uploaded teacher or parent text into a Visual Read flow with vocabulary, CCSS skills, guided writing, and a storybook image.", "Upload");
        return;
      }

      if (action === "match-ccss") {
        renderUploadCcssMatches(page);
        renderImitationFlowFromCcss(page);
        showToast("CCSS skill cards matched to the uploaded passage");
        return;
      }

      if (action === "use-example-sentence") {
        const input = page.querySelector("[data-imitation-input]");
        const template = page.querySelector("[data-imitation-template]")?.textContent || "The ___ moved ___ toward the ___.";
        setImitationSentence(page, fillImitationTemplate(template));
        showToast("Example pattern copied into the imitation box");
        return;
      }

      if (action === "build-fill-sentence") {
        setImitationSentence(page, buildImitationFromFillSlots(page));
        showToast("Fill pattern turned into a sentence");
        return;
      }

      if (action === "start-imitation-speech") {
        startImitationSpeech(page);
        return;
      }

      if (action === "use-transcript-sentence") {
        const transcript = page.querySelector("[data-imitation-transcript]")?.textContent.trim() || "";
        setImitationSentence(page, transcript);
        showToast("AI transcription copied into your sentence");
        return;
      }

      if (action === "try-speech-again") {
        applySpeechTranscript(page, "");
        startImitationSpeech(page);
        return;
      }

      if (action === "edit-transcript") {
        const transcript = page.querySelector("[data-imitation-transcript]")?.textContent.trim() || "";
        setImitationSentence(page, transcript);
        page.querySelector("[data-imitation-input]")?.focus();
        showToast("Edit the transcript in the sentence box");
        return;
      }

      if (action === "check-imitation") {
        const input = page.querySelector("[data-imitation-input]");
        const feedback = page.querySelector("[data-imitation-feedback]");
        if (feedback) feedback.textContent = scoreImitationSentence(input?.value || "");
        updateTutorChecklist(page);
        return;
      }

      if (action === "generate-imitation-image") {
        generateImitationOutput(page, "image");
        return;
      }

      if (action === "make-imitation-video") {
        generateImitationOutput(page, "video");
        return;
      }

      if (action === "read-aloud") {
        readCurrentStoryAloud(page);
        return;
      }

      if (action === "speed") {
        const speeds = ["1.0x", "1.2x", "0.8x"];
        const next = speeds[(speeds.indexOf(control.textContent.trim()) + 1) % speeds.length];
        control.textContent = next;
        if (currentReadUtterance) {
          stopReadAloud(page, `Speed set to ${next}. Press Read Aloud to restart.`);
        }
        showToast(`Reading speed set to ${next}`);
        return;
      }

      if (action === "pronounce") {
        showToast(`Pronunciation preview: ${word}`);
        return;
      }

      if (action === "lobster-tutor") {
        openReadModal("Lobster AI Tutor", "Lobster AI Tutor will give quick feedback on answers, sentence imitation, and CCSS skill practice.", "Tutor");
      }
    });
  });

  page.querySelectorAll("[data-record-action]").forEach((control) => {
    control.addEventListener("click", async () => {
      const action = control.dataset.recordAction;
      try {
        if (action === "start-recording") {
          await startReadingRecording(page);
          return;
        }

        if (action === "stop-recording") {
          stopReadingRecording(page);
          return;
        }

        if (action === "replay-recording") {
          replayReadingRecording(page);
          return;
        }

        if (action === "save-recording") {
          saveReadingRecording(page);
          return;
        }

        if (action === "ai-fluency-feedback") {
          showFluencyFeedback(page);
        }
      } catch (error) {
        setRecordingControls(page, "idle", "Microphone access was not available.");
        showToast("Recording permission was blocked or unavailable.");
      }
    });
  });

  page.addEventListener("click", (event) => {
    const storyPackCard = event.target.closest("[data-story-pack-card]");
    if (storyPackCard && page.querySelector("[data-story-pack-grid]")?.contains(storyPackCard)) {
      selectVisualReadGrade(page, storyPackCard.dataset.storyPackCard || "3");
      return;
    }

    const dynamicWord = event.target.closest(".story-body [data-open-panel][data-word]");
    if (dynamicWord && page.contains(dynamicWord)) {
      const word = dynamicWord.dataset.word;
      page.querySelectorAll(".inline-word").forEach((item) => item.classList.toggle("selected", item === dynamicWord));
      const currentWord = page.querySelector("[data-current-word]");
      if (currentWord) currentWord.textContent = word;
      openReadModal(`Vocabulary: ${word}`, `Open the visual card for "${word}", add it to Word Book, or generate an AI picture that explains the word.`, "Word Study");
      return;
    }

    const wordChip = event.target.closest("[data-word-chip]");
    if (wordChip && page.contains(wordChip)) {
      const target = wordChip.dataset.fillTarget || "feeling";
      const slot = page.querySelector(`[data-fill-slot="${target}"]`);
      if (slot) slot.value = wordChip.dataset.wordChip || wordChip.textContent.trim();
      return;
    }

    const draftButton = event.target.closest("[data-draft-action]");
    if (!draftButton || !page.contains(draftButton)) return;
    const draftId = draftButton.dataset.draftId;
    const action = draftButton.dataset.draftAction;

    if (action === "save-visual-draft") {
      updateVisualDraft(page, draftId, (draft) => ({ ...draft, saved: true }));
      showToast("Draft saved to Works");
      return;
    }

    if (action === "regenerate-visual-draft") {
      updateVisualDraft(page, draftId, (draft) => ({
        ...draft,
        studentSentence: page.querySelector("[data-imitation-input]")?.value.trim() || draft.studentSentence,
        generatedOutput: `${draft.outputType} regenerated from the latest imitation sentence`,
        version: (draft.version || 1) + 1
      }));
      showToast("Draft regenerated");
      return;
    }

    if (action === "delete-visual-draft") {
      storeVisualDrafts(loadVisualDrafts().filter((draft) => draft.id !== draftId));
      renderVisualDrafts(page);
      showToast("Draft deleted");
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeReadModal();
      stopReadAloud(page, "Reading stopped");
    }
  });

  const uploadFile = page.querySelector("[data-upload-file]");
  const uploadText = page.querySelector("[data-upload-text]");
  uploadFile?.addEventListener("change", () => {
    const file = uploadFile.files?.[0];
    if (!file || !uploadText) return;
    if (!file.name.toLowerCase().match(/\.(txt|md)$/)) {
      showToast("Prototype reads .txt or .md directly. Paste PDF/DOC text into the passage box.");
      return;
    }

    const reader = new FileReader();
    reader.addEventListener("load", () => {
      uploadText.value = String(reader.result || "");
      renderUploadCcssMatches(page);
      renderImitationFlowFromCcss(page);
      showToast("Article loaded and matched to CCSS skills");
    });
    reader.readAsText(file);
  });

  page.querySelector("[data-upload-grade-selector]")?.addEventListener("change", () => {
    renderUploadCcssMatches(page);
    renderImitationFlowFromCcss(page);
  });

  page.querySelector("[data-upload-text]")?.addEventListener("input", () => {
    renderImitationFlowFromCcss(page);
  });

  page.querySelector("[data-imitation-input]")?.addEventListener("input", () => {
    const input = page.querySelector("[data-imitation-input]");
    const feedback = page.querySelector("[data-imitation-feedback]");
    if (feedback) feedback.textContent = scoreImitationSentence(input?.value || "");
    updateTutorChecklist(page);
  });

  selectVisualReadGrade(page, page.querySelector("[data-grade-selector] .grade-chip.active")?.dataset.grade || "3", false);
  renderUploadCcssMatches(page);
  renderImitationFlowFromCcss(page);
  renderVisualDrafts(page);
  renderReadingRecordings(page);
  setRecordingControls(page, "idle", "Local only until you save.");
}

const identityStorageKey = "storieslens_identity_mode";

function getStoredIdentityMode() {
  try {
    return localStorage.getItem(identityStorageKey) || "student";
  } catch (error) {
    return "student";
  }
}

function applyIdentityMode(mode) {
  const activeMode = mode === "teacher" ? "teacher" : "student";
  document.body.dataset.identityMode = activeMode;
  document.querySelectorAll("[data-mode-toggle]").forEach((button) => {
    const isActive = button.dataset.modeToggle === activeMode;
    button.classList.toggle("active", isActive);
    button.setAttribute("aria-pressed", isActive ? "true" : "false");
  });

  document.querySelectorAll("[data-mode-scope]").forEach((element) => {
    const isTeacherOnly = element.dataset.modeScope === "teacher";
    element.setAttribute("aria-hidden", isTeacherOnly && activeMode !== "teacher" ? "true" : "false");
  });

  document.querySelectorAll("[data-mode-label]").forEach((label) => {
    label.textContent = activeMode === "teacher" ? "Teacher Mode" : "Student Mode";
  });
}

function initIdentityMode() {
  applyIdentityMode(getStoredIdentityMode());

  document.querySelectorAll("[data-mode-toggle]").forEach((button) => {
    button.addEventListener("click", () => {
      const nextMode = button.dataset.modeToggle === "teacher" ? "teacher" : "student";
      try {
        localStorage.setItem(identityStorageKey, nextMode);
      } catch (error) {
        // Local storage can be unavailable in strict privacy contexts.
      }
      applyIdentityMode(nextMode);
      showWriteToast?.(`${nextMode === "teacher" ? "Teacher" : "Student"} Mode enabled`);
    });
  });

  document.querySelectorAll("[data-user-menu-toggle]").forEach((button) => {
    button.addEventListener("click", () => {
      button.closest(".user-avatar-menu")?.classList.toggle("is-open");
    });
  });
}

const writeActions = {
  "hero-preview": ["Visual Write Preview", "Students write a CCSS-aligned story, choose an art direction, generate images or a short movie, then refine it in the simple video studio.", "Overview"],
  keyboard: ["Keyboard Input", "Keyboard mode is ready. Students can type directly in the story draft editor.", "Input"],
  voice: ["Voice Input", "Voice input will capture student narration and place it into the draft as editable text.", "Input"],
  "read-aloud": ["Read Aloud", "The story draft can be read aloud so students hear rhythm, pacing, and sentence clarity.", "Audio"],
  "generate-illustration": ["Generate Illustration", "The current draft, grade-level skill focus, and selected art style will become a consistent story illustration.", "AI Picture"],
  "generate-movie": ["Generate 10-15s Movie", "The draft can be converted into a short animated movie with a cover shot, three scene beats, and simple motion.", "AI Movie"],
  "start-group-writing": ["Start Group Co-Writing", "Create a temporary co-writing room, assign CCSS roles, lock character consistency, and show student contribution colors in the shared draft.", "Co-Writing"],
  "switch-style": ["Switch Art Style", "Choose Storybook, Watercolor, Comic, or Block World to update the visual direction.", "Art Direction"],
  "save-draft": ["Draft Saved", "The current text, selected grade, selected style, and media choices are stored locally for this prototype.", "Save"],
  "final-save": ["Final Save + Poster", "This action packages the story, illustration, movie preview, and a shareable poster for class presentation.", "Publish"],
  "clear-text": ["Clear Text", "This will clear the draft editor in the prototype. Use it when starting a new story.", "Draft"],
  "open-illustration": ["Illustration Preview", "This image card opens a larger preview area in the full product, including prompt notes and regenerate controls.", "Preview"],
  "play-movie": ["Movie Preview", "A generated 10-15 second movie preview would play here with simple classroom-safe controls.", "Preview"],
  "media-select": ["Recent Media", "Selected media can be reused as a cover, timeline clip, or illustration reference.", "Media"],
  "personal-settings": ["Personal Settings", "Student and teacher profile settings will live here, including language, privacy, and local storage preferences.", "Account"],
  "log-out": ["Log Out", "This prototype keeps the logout action as a visible account affordance for the future auth flow.", "Account"],
  "skill-detail": ["CCSS Writing Skill", "This card explains the selected grade-level writing skill and shows how the student's draft can practice it.", "CCSS"],
  "lobster-tutor": ["Lobster AI Tutor", "Lobster AI Tutor checks writing against CCSS skills, suggests next edits, and gives feedback in seconds.", "Tutor"]
};

function openWriteModal(title, body, chip = "Visual Write") {
  const modal = document.getElementById("write-modal");
  if (!modal) return;

  const titleNode = modal.querySelector("[data-write-modal-title]");
  const bodyNode = modal.querySelector("[data-write-modal-body]");
  const chipNode = modal.querySelector("[data-write-modal-chip]");
  if (titleNode) titleNode.textContent = title;
  if (bodyNode) bodyNode.textContent = body;
  if (chipNode) chipNode.textContent = chip;

  modal.hidden = false;
  modal.classList.add("is-open");
  modal.querySelector(".write-modal-close")?.focus();
}

function closeWriteModal() {
  const modal = document.getElementById("write-modal");
  if (!modal) return;
  modal.classList.remove("is-open");
  modal.hidden = true;
}

function openTeacherPromptModal() {
  const modal = document.getElementById("teacher-prompt-modal");
  if (!modal) return;
  modal.hidden = false;
  modal.classList.add("is-open");
  modal.querySelector(".write-modal-close")?.focus();
}

function closeTeacherPromptModal() {
  const modal = document.getElementById("teacher-prompt-modal");
  if (!modal) return;
  modal.classList.remove("is-open");
  modal.hidden = true;
}

function showWriteToast(message) {
  const toast = document.querySelector(".write-toast");
  if (!toast) return;
  toast.textContent = message;
  toast.hidden = false;
  window.clearTimeout(showWriteToast.timer);
  showWriteToast.timer = window.setTimeout(() => {
    toast.hidden = true;
  }, 2400);
}

function analyzeWritingDraft(page = document) {
  const draft = page.querySelector("[data-story-draft]")?.value || "";
  const lower = draft.toLowerCase();
  const hasSequence = /\b(first|next|then|after|finally|at last|suddenly|when)\b/.test(lower) || draft.split(/\n+/).filter(Boolean).length >= 4;
  const hasCharacter = /\b(louis|max|boy|girl|friend|dad|mom|teacher|fox|dragon|robot|puppy)\b/.test(lower);
  const hasSetting = /\b(lake|boat|island|forest|castle|bridge|school|room|sky|sea|garden)\b/.test(lower);
  const hasDialogue = /["“”]/.test(draft) || /\b(said|asked|whispered|replied|shouted)\b/.test(lower);
  const hasDetails = /\b(soft|bright|dark|sparkling|tiny|golden|blue|slowly|carefully|warm|cold|quiet|loudly)\b/.test(lower);
  const hasOpinion = /\b(learned|because|reason|promise|think|favorite|better|important)\b/.test(lower);

  return [
    {
      skill: "Narrative Sequence",
      status: hasSequence ? "Strong" : "Needs Work",
      feedback: hasSequence ? "Events move from beginning to ending." : "Add first, then, after, or at last to show order.",
      suggestion: "Then the story moved to one clear next moment."
    },
    {
      skill: "Character & Setting",
      status: hasCharacter && hasSetting ? "Strong" : hasCharacter || hasSetting ? "Needs Work" : "Missing",
      feedback: hasCharacter && hasSetting ? "The reader can see who is there and where it happens." : "Add a character and a picture place.",
      suggestion: "Louis stood beside the lake under the blue morning sky."
    },
    {
      skill: "Dialogue",
      status: hasDialogue ? "Strong" : "Missing",
      feedback: hasDialogue ? "A character voice is already in the story." : "Add one sentence a character says.",
      suggestion: 'Max barked, "Let\'s keep going!"'
    },
    {
      skill: "Descriptive Details",
      status: hasDetails ? "Strong" : "Needs Work",
      feedback: hasDetails ? "The draft has visual words that can guide image/video generation." : "Add color, sound, feeling, or movement words.",
      suggestion: "The soft wind moved slowly across the sparkling water."
    },
    {
      skill: "Opinion + Reason",
      status: hasOpinion ? "Strong" : "Needs Work",
      feedback: hasOpinion ? "The ending explains why the story matters." : "Add one sentence that tells what the character learned and why.",
      suggestion: "Louis learned that courage feels easier when a friend stays beside you."
    }
  ];
}

function renderWritingDiagnostics(page = document) {
  const grid = page.querySelector("[data-ccss-diagnostic-grid]");
  if (!grid) return;
  const diagnostics = analyzeWritingDraft(page);
  grid.innerHTML = diagnostics
    .map((item) => `
      <article class="ccss-diagnostic-card ${escapeHtml(item.status.toLowerCase().replace(/\s+/g, "-"))}">
        <span>${escapeHtml(item.skill)}</span>
        <strong>${escapeHtml(item.status)}</strong>
        <p>${escapeHtml(item.feedback)}</p>
      </article>
    `)
    .join("");
}

function renderOpenClawFeedback(page = document) {
  const diagnostics = analyzeWritingDraft(page);
  const growItem = diagnostics.find((item) => item.status === "Missing") || diagnostics.find((item) => item.status === "Needs Work") || diagnostics[0];
  const glow = page.querySelector("[data-feedback-glow]");
  const grow = page.querySelector("[data-feedback-grow]");
  const next = page.querySelector("[data-feedback-next]");

  if (glow) glow.textContent = "Your story has a clear draft and enough language for Open Claw to review.";
  if (grow) grow.textContent = `${growItem.skill}: ${growItem.feedback}`;
  if (next) next.textContent = growItem.suggestion;

  renderWritingDiagnostics(page);
  showWriteToast("Open Claw feedback is ready");
}

function applyOpenClawSuggestion(page = document) {
  const draft = page.querySelector("[data-story-draft]");
  const next = page.querySelector("[data-feedback-next]");
  if (!draft || !next) return;

  const suggestion = next.textContent.trim();
  if (!suggestion) return;
  draft.value = `${draft.value.trim()}\n\n${suggestion}`;
  updateDraftCount(page);
  renderWritingDiagnostics(page);
  showWriteToast("Suggestion added to the draft");
}

const writeVoiceState = {
  recognition: null,
  recorder: null,
  stream: null,
  chunks: [],
  audioUrl: "",
  isRecording: false
};

let writeReadUtterance = null;

function setWriteInputStatus(page = document, message = "") {
  const status = page.querySelector("[data-input-status]");
  if (status) status.textContent = message;
}

function setDraftToolActive(page = document, action = "", active = false) {
  page.querySelectorAll(".draft-tools [data-write-action]").forEach((button) => {
    button.classList.toggle("is-active", button.dataset.writeAction === action && active);
    if (button.dataset.writeAction === action) {
      button.setAttribute("aria-pressed", active ? "true" : "false");
    }
  });
}

function focusDraftEditor(page = document) {
  const draft = page.querySelector("[data-story-draft]");
  if (!draft) return;
  draft.focus();
  const end = draft.value.length;
  draft.setSelectionRange?.(end, end);
  setDraftToolActive(page, "keyboard", true);
  window.setTimeout(() => setDraftToolActive(page, "keyboard", false), 900);
  setWriteInputStatus(page, "Keyboard ready. Type directly in the Story Draft.");
  showWriteToast("Keyboard input ready");
}

function appendDictationToDraft(page = document, transcript = "") {
  const draft = page.querySelector("[data-story-draft]");
  const cleanTranscript = transcript.trim();
  if (!draft || !cleanTranscript) return;

  const spacer = draft.value.trim() ? " " : "";
  draft.value = `${draft.value.trim()}${spacer}${cleanTranscript}`;
  updateDraftCount(page);
  renderWritingDiagnostics(page);
  draft.focus();
}

function stopWriteVoiceInput(page = document) {
  if (writeVoiceState.recognition) {
    writeVoiceState.recognition.onend = null;
    writeVoiceState.recognition.stop();
    writeVoiceState.recognition = null;
  }

  if (writeVoiceState.recorder && writeVoiceState.recorder.state !== "inactive") {
    writeVoiceState.recorder.stop();
  }

  if (writeVoiceState.stream) {
    writeVoiceState.stream.getTracks().forEach((track) => track.stop());
    writeVoiceState.stream = null;
  }

  writeVoiceState.isRecording = false;
  setDraftToolActive(page, "voice", false);
  setWriteInputStatus(page, "Voice input stopped. You can edit the transcript in the Story Draft.");
}

async function startWriteVoiceInput(page = document) {
  if (writeVoiceState.isRecording) {
    stopWriteVoiceInput(page);
    return;
  }

  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const audio = page.querySelector("[data-voice-playback]");
  writeVoiceState.chunks = [];
  writeVoiceState.isRecording = true;
  setDraftToolActive(page, "voice", true);
  setWriteInputStatus(page, "Listening... speak your story in English.");

  if (navigator.mediaDevices?.getUserMedia && window.MediaRecorder) {
    try {
      writeVoiceState.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      writeVoiceState.recorder = new MediaRecorder(writeVoiceState.stream);
      writeVoiceState.recorder.addEventListener("dataavailable", (event) => {
        if (event.data.size > 0) writeVoiceState.chunks.push(event.data);
      });
      writeVoiceState.recorder.addEventListener("stop", () => {
        if (!audio || !writeVoiceState.chunks.length) return;
        if (writeVoiceState.audioUrl) URL.revokeObjectURL(writeVoiceState.audioUrl);
        const blob = new Blob(writeVoiceState.chunks, { type: writeVoiceState.recorder?.mimeType || "audio/webm" });
        writeVoiceState.audioUrl = URL.createObjectURL(blob);
        audio.src = writeVoiceState.audioUrl;
        audio.hidden = false;
      });
      writeVoiceState.recorder.start();
    } catch (error) {
      setWriteInputStatus(page, "Microphone permission was blocked. You can still type with Keyboard.");
      writeVoiceState.isRecording = false;
      setDraftToolActive(page, "voice", false);
      return;
    }
  }

  if (!SpeechRecognition) {
    setWriteInputStatus(page, "Recording audio. Speech-to-text is not supported in this browser, so use the playback to listen again.");
    showWriteToast("Recording audio only");
    return;
  }

  const recognition = new SpeechRecognition();
  writeVoiceState.recognition = recognition;
  recognition.lang = "en-US";
  recognition.continuous = true;
  recognition.interimResults = true;

  recognition.onresult = (event) => {
    let finalTranscript = "";
    let interimTranscript = "";
    for (let index = event.resultIndex; index < event.results.length; index += 1) {
      const text = event.results[index][0].transcript;
      if (event.results[index].isFinal) {
        finalTranscript += text;
      } else {
        interimTranscript += text;
      }
    }

    if (finalTranscript) {
      appendDictationToDraft(page, finalTranscript);
      setWriteInputStatus(page, `Added voice text: ${finalTranscript.trim()}`);
    } else if (interimTranscript) {
      setWriteInputStatus(page, `Listening: ${interimTranscript.trim()}`);
    }
  };

  recognition.onerror = () => {
    setWriteInputStatus(page, "Speech recognition stopped. Try Voice Input again or use Keyboard.");
    stopWriteVoiceInput(page);
  };

  recognition.onend = () => {
    stopWriteVoiceInput(page);
  };

  recognition.start();
}

function readWriteDraftAloud(page = document) {
  const draft = page.querySelector("[data-story-draft]");
  const text = draft?.value.trim() || "";

  if (!window.speechSynthesis || !window.SpeechSynthesisUtterance) {
    openWriteModal("Read Aloud", "This browser does not support built-in text-to-speech. Try Chrome or Edge from localhost.", "Audio");
    return;
  }

  if (speechSynthesis.speaking || speechSynthesis.pending) {
    speechSynthesis.cancel();
    setDraftToolActive(page, "read-aloud", false);
    setWriteInputStatus(page, "Read aloud stopped.");
    return;
  }

  if (!text) {
    setWriteInputStatus(page, "Write a story first, then use Read Aloud.");
    return;
  }

  writeReadUtterance = new SpeechSynthesisUtterance(text);
  writeReadUtterance.lang = "en-US";
  writeReadUtterance.rate = 0.92;
  writeReadUtterance.pitch = 1;
  writeReadUtterance.onend = () => {
    setDraftToolActive(page, "read-aloud", false);
    setWriteInputStatus(page, "Read aloud finished.");
  };
  writeReadUtterance.onerror = () => {
    setDraftToolActive(page, "read-aloud", false);
    setWriteInputStatus(page, "Read aloud stopped by the browser.");
  };

  setDraftToolActive(page, "read-aloud", true);
  setWriteInputStatus(page, "Reading your story aloud...");
  speechSynthesis.speak(writeReadUtterance);
}

function setIvyReportStatus(page = document, message = "") {
  const status = page.querySelector("[data-ai-report-status]");
  if (status) status.textContent = message;
}

function buildIvyReportPrompt(page = document) {
  const prompt = page.querySelector("[data-ivy-prompt]")?.value.trim() || "";
  const grade = page.querySelector("[data-write-grade-selector]")?.value || "3";
  const avatarModel = page.querySelector("[data-ivy-avatar-model]")?.value || "Ivy Mentor";
  const gradeProfile = writeGradeSkillMap[grade] || writeGradeSkillMap[3];
  return {
    prompt,
    grade,
    avatarModel,
    ccssSkill: gradeProfile?.summary || "Narrative Writing"
  };
}

function renderIvyAIReport(page = document, report = {}) {
  const output = page.querySelector("[data-ai-report-output]");
  if (!output) return;

  const ccssNotes = Array.isArray(report.ccssNotes) ? report.ccssNotes : [];
  const sentenceComments = Array.isArray(report.sentenceComments) ? report.sentenceComments : [];
  const noteMarkup = ccssNotes.length
    ? `<ul>${ccssNotes.slice(0, 3).map((note) => `<li><strong>${escapeHtml(note.skill || "Skill")}</strong>: ${escapeHtml(note.rating || "")} - ${escapeHtml(note.suggestion || note.evidence || "")}</li>`).join("")}</ul>`
    : "";
  const sentenceMarkup = sentenceComments.length
    ? `<ul>${sentenceComments.slice(0, 2).map((item) => `<li>"${escapeHtml(item.quote || "")}" - ${escapeHtml(item.comment || "")}</li>`).join("")}</ul>`
    : "";

  output.innerHTML = `
    <article>
      <strong>Glow</strong>
      <p>${escapeHtml(report.glow || report.overall || "Ivy sees a clear student draft.")}</p>
      ${sentenceMarkup}
    </article>
    <article>
      <strong>Grow</strong>
      <p>${escapeHtml(report.grow || "Add one stronger detail so the story is easier to picture.")}</p>
      ${noteMarkup}
    </article>
    <article>
      <strong>Next Step</strong>
      <p>${escapeHtml(report.nextStep || "Choose one sentence and add a vivid action, place, or feeling word.")}</p>
    </article>
  `;

  const videoScript = page.querySelector("[data-report-video-script]");
  if (videoScript) {
    videoScript.textContent = report.videoScript || "Generate an explainer video script after Ivy writes the report.";
  }
}

async function generateIvyAIReport(page = document) {
  const draft = page.querySelector("[data-story-draft]")?.value.trim() || "";
  if (!draft) {
    openWriteModal("Ivy AI Report", "Write or paste a student story first. Ivy needs the draft to create feedback.", "AI Report");
    return;
  }

  if (window.location.protocol === "file:") {
    openWriteModal(
      "Start Local Server",
      "Ivy AI Report needs the local backend proxy. Run npm start, then open http://localhost:3000/visual-write.html.",
      "OpenRouter"
    );
    setIvyReportStatus(page, "Open this page through http://localhost:3000 to call OpenRouter safely.");
    return;
  }

  const trigger = page.querySelector('[data-write-action="generate-ai-report"]');
  const reportRequest = buildIvyReportPrompt(page);
  try {
    if (trigger) trigger.disabled = true;
    setIvyReportStatus(page, "Ivy is reading the draft with OpenRouter...");
    showWriteToast("Generating Ivy AI Report...");

    const response = await fetch("/api/ai-report", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        studentDraft: draft,
        ...reportRequest
      })
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(result.error || "Ivy AI Report failed");
    }

    renderIvyAIReport(page, result.report || {});
    setIvyReportStatus(page, `Ivy report ready via ${result.model || "OpenRouter"}.`);
    showWriteToast("Ivy AI Report ready");
  } catch (error) {
    const message = error.message || "Ivy AI Report failed";
    setIvyReportStatus(page, message);
    openWriteModal("Ivy AI Report Failed", message, "OpenRouter");
  } finally {
    if (trigger) trigger.disabled = false;
  }
}

function generateIvyReportVideoScript(page = document) {
  const draft = page.querySelector("[data-story-draft]")?.value.trim() || "";
  const avatarModel = page.querySelector("[data-ivy-avatar-model]")?.value || "Ivy Mentor";
  const scriptNode = page.querySelector("[data-report-video-script]");
  if (!scriptNode) return;

  const reportText = page.querySelector("[data-ai-report-output]")?.textContent.trim() || "";
  const fallbackScript = [
    `${avatarModel}: Hi, I am Ivy from StoriesLens.`,
    "Today I will explain your story report.",
    draft ? "Your story has a clear beginning and a friendly main character." : "Write a draft first so I can explain your report.",
    reportText ? "One strong point and one next step are shown in the report cards." : "After you generate an Ivy Report, I can turn it into a short video explanation.",
    "For the next revision, improve one sentence with a clearer action, picture place, or feeling word."
  ].join("\n");

  scriptNode.textContent = fallbackScript;
  setIvyReportStatus(page, "Digital human explainer script prepared. Later this can feed Mastra + avatar video API.");
  showWriteToast("Explainer video script ready");
}

function setImageGenerationStatus(page = document, message = "") {
  const status = page.querySelector("[data-image-status]");
  if (status) status.textContent = message;
}

function buildFreeCreateImagePrompt(page = document) {
  const draft = page.querySelector("[data-story-draft]")?.value.trim() || "";
  const grade = page.querySelector("[data-write-grade-selector]")?.value || "3";
  const styleButton = page.querySelector(".art-style-card.active");
  const style = styleButton?.dataset.writeStyle || "Watercolor";
  const gradeProfile = writeGradeSkillMap[grade] || writeGradeSkillMap[3];
  const skillFocus = gradeProfile?.summary || `Grade ${grade} narrative writing`;

  return [
    "Create one classroom-safe illustration for a K12 English story product called StoriesLens.",
    `Grade level: Grade ${grade}.`,
    `Writing skill focus: ${skillFocus}.`,
    `Art style: ${style}.`,
    "Use a warm children's storybook composition with consistent characters and clear action.",
    "Do not include readable text, logos, watermarks, scary violence, or unsafe content.",
    "Student story draft:",
    draft.slice(0, 1400)
  ].join("\n");
}

function setGeneratedImageActions(page = document, imageUrl = "") {
  const saveButton = page.querySelector("[data-generated-image-save]");
  const downloadLink = page.querySelector("[data-generated-image-download]");

  if (saveButton) {
    saveButton.disabled = !imageUrl;
    saveButton.dataset.generatedImageUrl = imageUrl;
  }

  if (downloadLink) {
    downloadLink.href = imageUrl || "#";
    downloadLink.setAttribute("aria-disabled", imageUrl ? "false" : "true");
  }
}

function saveGeneratedImageToWorks(page = document) {
  const saveButton = page.querySelector("[data-generated-image-save]");
  const imageUrl = saveButton?.dataset.generatedImageUrl || "";
  if (!imageUrl) {
    showWriteToast("Generate an image first");
    return;
  }

  const draft = page.querySelector("[data-story-draft]")?.value.trim() || "";
  const grade = page.querySelector("[data-write-grade-selector]")?.value || "3";
  const style = page.querySelector(".art-style-card.active")?.dataset.writeStyle || "Watercolor";
  const storageKey = "storieslens_write_generated_images";
  const imageRecord = {
    id: `work-${Date.now()}`,
    imageUrl,
    draft,
    grade,
    style,
    createdAt: new Date().toISOString()
  };

  try {
    const existing = JSON.parse(localStorage.getItem(storageKey) || "[]");
    localStorage.setItem(storageKey, JSON.stringify([imageRecord, ...existing].slice(0, 24)));
    showWriteToast("Image saved to Works");
  } catch (error) {
    openWriteModal("Save Image", "Local storage is unavailable, so this image could not be saved on this device.", "Save");
  }
}

async function generateFreeCreateImage(page = document) {
  const draft = page.querySelector("[data-story-draft]")?.value.trim() || "";
  if (!draft) {
    openWriteModal("Generate Image", "Write a few story sentences first. StoriesLens uses the student draft to create the image prompt.", "AI Picture");
    return;
  }

  if (window.location.protocol === "file:") {
    openWriteModal(
      "Start Local Server",
      "Image generation needs the local backend. Run npm start, then open http://localhost:3000/visual-write.html before generating.",
      "API"
    );
    setImageGenerationStatus(page, "Open this page through http://localhost:3000 to use the AIMS image API.");
    return;
  }

  const trigger = page.querySelector('[data-write-action="generate-illustration"]');
  const prompt = buildFreeCreateImagePrompt(page);

  try {
    if (trigger) trigger.disabled = true;
    setImageGenerationStatus(page, "Generating image with AIMS...");
    showWriteToast("Generating image...");

    const response = await fetch("/api/generate-image", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt })
    });

    const result = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(result.error || "Image generation failed");
    }

    const imageUrl = result.imageUrl || result.downloadUrl;
    if (!imageUrl) {
      throw new Error("AIMS returned no image URL");
    }

    const preview = page.querySelector("[data-illustration-preview]");
    if (preview) {
      preview.src = imageUrl;
      preview.alt = "Generated StoriesLens illustration from the student draft";
    }

    setGeneratedImageActions(page, imageUrl);
    const creditText = result.remaining === null || result.remaining === undefined ? "" : ` Credits left: ${result.remaining}.`;
    setImageGenerationStatus(page, `Image ready.${creditText}`);
    showWriteToast("Image generated");
  } catch (error) {
    const message = error.message || "Image generation failed";
    setImageGenerationStatus(page, message);
    openWriteModal("Image Generation Failed", message, "AIMS API");
  } finally {
    if (trigger) trigger.disabled = false;
  }
}

function renderWriteSkillCards(grade, root = document) {
  const grid = root.querySelector("[data-write-skill-card-grid]");
  const profile = writeGradeSkillMap[grade] || writeGradeSkillMap[3];
  root.querySelectorAll("[data-write-grade-summary]").forEach((summary) => {
    summary.textContent = profile.summary;
  });
  if (!grid) return;

  grid.innerHTML = profile.skills
    .map(([title, code, standard, task], index) => `
      <button class="write-skill-card${index === 0 ? " active" : ""}" type="button" data-write-action="skill-detail" data-skill-title="${escapeHtml(title)}" data-skill-body="${escapeHtml(`${code}: ${standard} ${task}`)}">
        <span class="skill-number">${index + 1}</span>
        <span class="skill-copy">
          <strong>${escapeHtml(title)} <em>${index === 0 ? "叙事顺序" : index === 1 ? "人物与场景" : index === 2 ? "角色对话" : index === 3 ? "感官细节" : "观点与理由"}</em></strong>
          <small>CCSS Code: ${escapeHtml(code)}</small>
          <span>Standard: ${escapeHtml(standard)}</span>
          <b>${escapeHtml(task)}</b>
        </span>
        <span class="skill-check" aria-hidden="true">✓</span>
      </button>
    `)
    .join("");

  grid.querySelectorAll(".write-skill-card").forEach((card) => {
    card.addEventListener("click", () => {
      grid.querySelectorAll(".write-skill-card").forEach((item) => item.classList.toggle("active", item === card));
      openWriteModal(card.dataset.skillTitle, card.dataset.skillBody, "CCSS Writing Skill");
    });
  });
}

function renderWriteSkillCards(grade, root = document) {
  const grid = root.querySelector("[data-write-skill-card-grid]");
  const profile = writeGradeSkillMap[grade] || writeGradeSkillMap[3];
  const writeSkillChineseLabels = ["叙事顺序", "人物与场景", "角色对话", "感官细节", "观点与理由"];
  root.querySelectorAll("[data-write-grade-summary]").forEach((summary) => {
    summary.textContent = profile.summary;
  });
  if (!grid) return;

  grid.innerHTML = profile.skills
    .map(([title, code, standard, task], index) => `
      <button class="write-skill-card${index === 0 ? " active" : ""}" type="button" data-write-action="skill-detail" data-skill-title="${escapeHtml(title)}" data-skill-body="${escapeHtml(`${code}: ${standard} ${task}`)}">
        <span class="skill-number">${index + 1}</span>
        <span class="skill-copy">
          <strong>${escapeHtml(title)} <em>${escapeHtml(writeSkillChineseLabels[index] || "")}</em></strong>
          <small>CCSS Code: ${escapeHtml(code)}</small>
          <span>Standard: ${escapeHtml(standard)}</span>
          <b>${escapeHtml(task)}</b>
        </span>
        <span class="skill-check" aria-hidden="true">&#10003;</span>
      </button>
    `)
    .join("");

  grid.querySelectorAll(".write-skill-card").forEach((card) => {
    card.addEventListener("click", () => {
      grid.querySelectorAll(".write-skill-card").forEach((item) => item.classList.toggle("active", item === card));
      openWriteModal(card.dataset.skillTitle, card.dataset.skillBody, "CCSS Writing Skill");
    });
  });
}

const TEACHER_LOGIN_STORE = {
  wxTeacherUser: "sl_wx_teacher_user",
  googleTeacherUser: "sl_google_teacher_user",
  envMode: "sl_env_mode"
};

const WX_CONFIG = {
  appId: "REPLACE_YOUR_WX_WEBSITE_APPID",
  redirectUri: "https://shturl.cc/ETMDfEJyXSVr8i6bCsKluJQbq0fX1T",
  scope: "snsapi_login",
  apiBase: "https://your-backend-api.com"
};

const GOOGLE_OAUTH_CONFIG = {
  clientId: "REPLACE_GOOGLE_CLIENT_ID"
};

const GROUP_STORE = {
  groupNovel: "storiesLens_group_novel",
  groupMember: "storiesLens_group_member",
  groupChatMsg: "storiesLens_group_chat"
};

let groupSyncChannel = null;
let groupEditorSaveTimer = null;
let groupVoiceRecognition = null;

try {
  if ("BroadcastChannel" in window) {
    groupSyncChannel = new BroadcastChannel("group_sync");
  }
} catch (error) {
  groupSyncChannel = null;
}

function readStore(key, fallback = null) {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch (error) {
    return fallback;
  }
}

function writeStore(key, value) {
  try {
    if (value === null || value === undefined) {
      localStorage.removeItem(key);
      return true;
    }
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    return false;
  }
}

function getTeacherEnvMode() {
  return readStore(TEACHER_LOGIN_STORE.envMode, "china_demo");
}

function getActiveTeacherLogin() {
  const googleUser = readStore(TEACHER_LOGIN_STORE.googleTeacherUser, null);
  const wxUser = readStore(TEACHER_LOGIN_STORE.wxTeacherUser, null);
  if (googleUser) return { type: "google", user: googleUser };
  if (wxUser) return { type: "wechat", user: wxUser };
  return null;
}

function getTeacherDistributionCopy(type) {
  if (type === "google") {
    return "Google Classroom branch: create a room code and push the group writing task to Google Classroom assignments.";
  }
  if (type === "wechat") {
    return "WeChat branch: create a room code, copy it to the WeChat class group, and reserve /api/wx/sendTaskNotify for production push.";
  }
  return "Choose Google Classroom or WeChat teacher login before creating a group book.";
}

function googleOAuthLogin() {
  return Promise.resolve({
    id: `google_mock_${Date.now()}`,
    email: "teacher@storieslens.demo",
    name: "Google Classroom Teacher",
    isTeacher: true,
    source: "google",
    classroomList: ["Grade 3 Writing", "Grade 4 Stories"],
    clientId: GOOGLE_OAUTH_CONFIG.clientId
  });
}

function loadWechatLoginSdk() {
  return new Promise((resolve, reject) => {
    if (window.WxLogin) {
      resolve(window.WxLogin);
      return;
    }
    const existing = document.querySelector('script[data-wx-login-sdk="true"]');
    if (existing) {
      existing.addEventListener("load", () => resolve(window.WxLogin));
      existing.addEventListener("error", reject);
      return;
    }
    const script = document.createElement("script");
    script.src = "https://res.wx.qq.com/connect/zh_CN/htmledition/js/wxLogin.js";
    script.dataset.wxLoginSdk = "true";
    script.onload = () => resolve(window.WxLogin);
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

function closeWxModal() {
  const modal = document.getElementById("wxQrModal");
  if (modal) modal.hidden = true;
}

function renderLoginStatus(type, userInfo) {
  const statusBox = document.getElementById("loginStatusBox");
  if (!statusBox || !userInfo) return;

  const displayName = type === "google"
    ? userInfo.email || userInfo.name || "Google teacher"
    : userInfo.nickname || userInfo.name || "WeChat teacher";
  const roster = userInfo.studentList || userInfo.classroomList || [];
  statusBox.hidden = false;
  statusBox.innerHTML = `
    <strong>${type === "google" ? "Google Classroom teacher logged in" : "WeChat teacher logged in"}:</strong>
    ${escapeHtml(displayName)}
    <span>${escapeHtml(getTeacherDistributionCopy(type))}</span>
    ${roster.length ? `<small>Class list: ${escapeHtml(roster.join(", "))}</small>` : ""}
    <button type="button" data-teacher-logout="${escapeHtml(type)}">Log out</button>
  `;
  statusBox.querySelector("button")?.addEventListener("click", () => logoutTeacher(type));
}

function logoutTeacher(type) {
  if (type === "google") writeStore(TEACHER_LOGIN_STORE.googleTeacherUser, null);
  if (type === "wechat") writeStore(TEACHER_LOGIN_STORE.wxTeacherUser, null);
  const statusBox = document.getElementById("loginStatusBox");
  if (statusBox) statusBox.hidden = true;
  showGroupToast("Teacher login removed");
}

function mockWechatTeacherLogin() {
  const mockUser = {
    openid: `wx_mock_${Date.now()}`,
    nickname: "Wang Teacher",
    avatar: "",
    isTeacher: true,
    source: "wechat",
    studentList: ["Tom", "Lily", "Louis", "Max"]
  };
  writeStore(TEACHER_LOGIN_STORE.wxTeacherUser, mockUser);
  writeStore(TEACHER_LOGIN_STORE.envMode, "china_demo");
  closeWxModal();
  renderLoginStatus("wechat", mockUser);
  showGroupToast("WeChat teacher demo login ready");
}

function openWechatLoginModal() {
  const modal = document.getElementById("wxQrModal");
  const container = document.getElementById("wxQrContainer");
  if (!modal || !container) return;
  container.innerHTML = "";
  modal.hidden = false;

  const env = getTeacherEnvMode();
  if (env === "china_demo") {
    container.innerHTML = `
      <div class="wx-demo-card">
        <strong>Demo mode</strong>
        <p>No external WeChat API request is sent. Click below to simulate teacher scan authorization.</p>
        <button id="mockWxLogin" type="button">Mock WeChat scan success</button>
      </div>
    `;
    document.getElementById("mockWxLogin")?.addEventListener("click", mockWechatTeacherLogin);
    return;
  }

  container.innerHTML = "<p>Loading WeChat Open Platform QR code...</p>";
  loadWechatLoginSdk()
    .then((WxLogin) => {
      if (!WxLogin) throw new Error("WxLogin SDK unavailable");
      container.innerHTML = "";
      new WxLogin({
        id: "wxQrContainer",
        appid: WX_CONFIG.appId,
        scope: WX_CONFIG.scope,
        redirect_uri: encodeURIComponent(WX_CONFIG.redirectUri),
        state: Date.now().toString(),
        style: "black",
        self_redirect: true
      });
    })
    .catch(() => {
      container.innerHTML = "<p>WeChat SDK could not load. Check HTTPS domain, AppID, and network access.</p>";
    });
}

function handleWxCallback() {
  const statusBox = document.getElementById("loginStatusBox");
  const urlParams = new URLSearchParams(window.location.search);
  const code = urlParams.get("code");
  const state = urlParams.get("state");
  if (!code) {
    if (statusBox) statusBox.textContent = "No WeChat authorization code found.";
    return;
  }

  if (statusBox) statusBox.textContent = "Exchanging WeChat code with backend...";
  fetch(`${WX_CONFIG.apiBase}/api/wx/getUserInfo?code=${encodeURIComponent(code)}&state=${encodeURIComponent(state || "")}`)
    .then((response) => response.json())
    .then((data) => {
      const teacherInfo = {
        openid: data.openid,
        nickname: data.nickname,
        avatar: data.avatar,
        isTeacher: true,
        source: "wechat"
      };
      writeStore(TEACHER_LOGIN_STORE.wxTeacherUser, teacherInfo);
      window.location.href = "group-write.html";
    })
    .catch(() => {
      if (statusBox) statusBox.textContent = "WeChat backend exchange failed. Check /api/wx/getUserInfo.";
    });
}

function fetchWechatClassList(openid) {
  return fetch(`${WX_CONFIG.apiBase}/api/wx/classList?openid=${encodeURIComponent(openid)}`)
    .then((response) => response.json());
}

function sendWechatTaskNotify(openid, roomCode, bookTitle) {
  return fetch(`${WX_CONFIG.apiBase}/api/wx/sendTaskNotify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ openid, roomCode, bookTitle })
  }).then((response) => response.json());
}

function requireTeacherLoginForGroupCreation(page = document) {
  const login = getActiveTeacherLogin();
  if (login) return login;
  showGroupToast("Please log in as a Google or WeChat teacher before creating a group book");
  page.querySelector(".teacher-login-bar")?.scrollIntoView({ behavior: "smooth", block: "start" });
  return null;
}

function readGroupNovel() {
  return readStore(GROUP_STORE.groupNovel, null);
}

function writeGroupNovel(novel, shouldBroadcast = true) {
  const saved = writeStore(GROUP_STORE.groupNovel, novel);
  if (saved && shouldBroadcast) {
    groupSyncChannel?.postMessage({ type: "novel-updated", at: Date.now() });
  }
  return saved;
}

function readGroupMember() {
  return readStore(GROUP_STORE.groupMember, null);
}

function writeGroupMember(member) {
  writeStore(GROUP_STORE.groupMember, member);
  return member;
}

function readGroupChat() {
  return readStore(GROUP_STORE.groupChatMsg, []);
}

function writeGroupChat(messages, shouldBroadcast = true) {
  writeStore(GROUP_STORE.groupChatMsg, messages.slice(-50));
  if (shouldBroadcast) {
    groupSyncChannel?.postMessage({ type: "chat-updated", at: Date.now() });
  }
}

function showGroupToast(message) {
  const toast = document.querySelector("[data-group-toast]");
  if (!toast) return;
  toast.textContent = message;
  toast.hidden = false;
  window.clearTimeout(showGroupToast.timer);
  showGroupToast.timer = window.setTimeout(() => {
    toast.hidden = true;
  }, 2400);
}

function getGroupMemberFromInputs(page = document, requireName = false) {
  const stored = readGroupMember();
  const nameInput = page.querySelector("[data-group-student-name]");
  const creatorToggle = page.querySelector("[data-group-creator-toggle]");
  const inputName = nameInput?.value.trim();
  const studentName = inputName || stored?.studentName || "";

  if (requireName && !studentName) {
    showGroupToast("Enter the student signature name first");
    nameInput?.focus();
    return null;
  }

  if (!studentName && !stored && !requireName) {
    return null;
  }

  const member = {
    uid: stored?.uid || `u-${Date.now()}-${Math.random().toString(16).slice(2, 7)}`,
    studentName,
    isCreator: Boolean(creatorToggle?.checked ?? stored?.isCreator)
  };

  if (nameInput && !inputName && stored?.studentName) nameInput.value = stored.studentName;
  if (creatorToggle && stored) creatorToggle.checked = member.isCreator;
  return writeGroupMember(member);
}

function syncGroupMemberFields(page = document) {
  const member = readGroupMember();
  if (!member) return;
  const nameInput = page.querySelector("[data-group-student-name]");
  const creatorToggle = page.querySelector("[data-group-creator-toggle]");
  if (nameInput) nameInput.value = member.studentName || "";
  if (creatorToggle) creatorToggle.checked = Boolean(member.isCreator);
}

function createGroupNovelProject(page = document) {
  const teacherLogin = requireTeacherLoginForGroupCreation(page);
  if (!teacherLogin) return;

  const creatorToggle = page.querySelector("[data-group-creator-toggle]");
  if (creatorToggle) creatorToggle.checked = true;
  const member = getGroupMemberFromInputs(page, true);
  if (!member) return;

  const title = page.querySelector("[data-group-book-title]")?.value.trim() || "StoriesLens Group Book";
  const count = Number(page.querySelector("[data-group-chapter-count]")?.value || 5);
  const novel = {
    bookId: `group-${Date.now()}`,
    title,
    globalCover: "",
    createTime: new Date().toISOString(),
    teacherLoginType: teacherLogin.type,
    teacherName: teacherLogin.user.email || teacherLogin.user.nickname || teacherLogin.user.name || "Teacher",
    distributionNote: getTeacherDistributionCopy(teacherLogin.type),
    chapters: Array.from({ length: count }, (_, index) => ({
      chapterId: `ch${index + 1}`,
      chapterTitle: `Chapter ${index + 1}`,
      writerId: null,
      writerName: "",
      status: "unassigned",
      content: "",
      chapterCoverImg: ""
    })),
    fullMergedText: ""
  };

  writeGroupNovel(novel);
  renderGroupWrite(page);
  showGroupToast(`Group book created for ${teacherLogin.type === "google" ? "Google Classroom" : "WeChat"} distribution`);
}

function getGroupChapter(novel, chapterId) {
  return novel?.chapters?.find((chapter) => chapter.chapterId === chapterId) || null;
}

function getChapterPermission(chapter, member) {
  const isCreator = Boolean(member?.isCreator);
  const isOwn = Boolean(chapter?.writerId && member?.uid && chapter.writerId === member.uid);
  return {
    isCreator,
    isOwn,
    canEdit: isCreator || isOwn,
    canClaim: Boolean(member?.uid && chapter?.status === "unassigned")
  };
}

function renderGroupChapters(page = document) {
  const grid = page.querySelector("[data-group-chapter-grid]");
  const summary = page.querySelector("[data-group-summary]");
  if (!grid) return;

  const novel = readGroupNovel();
  const member = getGroupMemberFromInputs(page, false) || readGroupMember();
  if (!novel) {
    if (summary) summary.textContent = "No group book loaded yet.";
    grid.innerHTML = `
      <article class="chapter-empty-state">
        <strong>Create or load a group book</strong>
        <p>Teachers create chapters first. Students enter their classroom name, then claim one open chapter.</p>
      </article>
    `;
    return;
  }

  const finishedCount = novel.chapters.filter((chapter) => chapter.status === "finished").length;
  if (summary) {
    summary.textContent = `${novel.title} - ${finishedCount}/${novel.chapters.length} chapters finished`;
  }

  grid.innerHTML = novel.chapters
    .map((chapter) => {
      const permission = getChapterPermission(chapter, member);
      const writer = chapter.writerName || "Unassigned";
      const previewImage = chapter.chapterCoverImg || "assets/showcase-star-keeper.png";
      const previewText = chapter.content ? escapeHtml(chapter.content.slice(0, 140)) : "No chapter text yet.";
      const buttons = [];
      if (permission.canClaim) {
        buttons.push(`<button type="button" data-group-action="claim-chapter" data-chapter-id="${escapeHtml(chapter.chapterId)}">Claim Chapter</button>`);
      }
      if (chapter.status !== "unassigned") {
        buttons.push(`<button type="button" data-group-action="open-chapter" data-chapter-id="${escapeHtml(chapter.chapterId)}">${permission.canEdit ? "Enter Editor" : "Preview Chapter"}</button>`);
      }
      if (permission.canEdit && chapter.status !== "unassigned") {
        buttons.push(`<button type="button" data-group-action="finish-chapter" data-chapter-id="${escapeHtml(chapter.chapterId)}">Mark Finished</button>`);
      }
      if (permission.isCreator && chapter.status !== "unassigned") {
        buttons.push(`<button type="button" data-group-action="recall-chapter" data-chapter-id="${escapeHtml(chapter.chapterId)}">Recall Chapter</button>`);
      }

      return `
        <article class="chapter-card ${escapeHtml(chapter.status)}">
          <img src="${escapeHtml(previewImage)}" alt="" />
          <div>
            <span class="chapter-status">${escapeHtml(chapter.status)}</span>
            <h3>${escapeHtml(chapter.chapterTitle)}</h3>
            <p class="chapter-writer">Writer: ${escapeHtml(writer)}</p>
            <p>${previewText}${chapter.content.length > 140 ? "..." : ""}</p>
          </div>
          <div class="chapter-card-actions">${buttons.join("")}</div>
        </article>
      `;
    })
    .join("");
}

function claimGroupChapter(page = document, chapterId) {
  const member = getGroupMemberFromInputs(page, true);
  const novel = readGroupNovel();
  const chapter = getGroupChapter(novel, chapterId);
  if (!member || !novel || !chapter) return;
  if (chapter.status !== "unassigned") {
    showGroupToast("This chapter is already claimed");
    return;
  }

  chapter.writerId = member.uid;
  chapter.writerName = member.studentName;
  chapter.status = "writing";
  writeGroupNovel(novel);
  renderGroupWrite(page);
  showGroupToast(`${chapter.chapterTitle} claimed by ${member.studentName}`);
}

function recallGroupChapter(page = document, chapterId) {
  const member = getGroupMemberFromInputs(page, false);
  const novel = readGroupNovel();
  const chapter = getGroupChapter(novel, chapterId);
  if (!member?.isCreator || !novel || !chapter) {
    showGroupToast("Only the teacher / leader can recall chapters");
    return;
  }

  chapter.writerId = null;
  chapter.writerName = "";
  chapter.status = "unassigned";
  chapter.content = "";
  chapter.chapterCoverImg = "";
  writeGroupNovel(novel);
  renderGroupWrite(page);
  showGroupToast(`${chapter.chapterTitle} recalled`);
}

function openGroupChapterEditor(page = document, chapterId) {
  const editor = page.querySelector("[data-group-editor]");
  const novel = readGroupNovel();
  const member = getGroupMemberFromInputs(page, false);
  const chapter = getGroupChapter(novel, chapterId);
  if (!editor || !chapter) return;

  const permission = getChapterPermission(chapter, member);
  page.dataset.activeChapterId = chapterId;
  editor.hidden = false;
  editor.querySelector("[data-group-editor-title]").textContent = `${chapter.chapterTitle} - ${permission.canEdit ? "Editor" : "Preview"}`;
  editor.querySelector("[data-group-editor-writer]").textContent = `Writer: ${chapter.writerName || "Unassigned"}`;
  editor.querySelector("[data-group-author-lock]").textContent = chapter.writerName || "Unassigned";
  const textArea = editor.querySelector("[data-group-editor-text]");
  if (textArea) {
    textArea.value = chapter.content || "";
    textArea.readOnly = !permission.canEdit;
  }
  const image = editor.querySelector("[data-group-chapter-image]");
  if (image) image.src = chapter.chapterCoverImg || "assets/showcase-star-keeper.png";
  const status = editor.querySelector("[data-group-image-status]");
  if (status) status.textContent = chapter.chapterCoverImg ? "Chapter illustration saved." : "Generate a chapter illustration after writing.";

  editor.querySelectorAll("[data-group-action='voice-chapter'], [data-group-action='generate-chapter-image'], [data-group-action='save-chapter'], [data-group-action='finish-chapter']").forEach((button) => {
    button.disabled = !permission.canEdit;
  });
  editor.scrollIntoView({ behavior: "smooth", block: "start" });
}

function saveGroupChapterDraft(page = document, silent = false) {
  const chapterId = page.dataset.activeChapterId;
  const novel = readGroupNovel();
  const member = getGroupMemberFromInputs(page, false);
  const chapter = getGroupChapter(novel, chapterId);
  if (!novel || !chapter) return;

  const permission = getChapterPermission(chapter, member);
  if (!permission.canEdit) {
    showGroupToast("You can only edit your own chapter");
    return;
  }

  chapter.content = page.querySelector("[data-group-editor-text]")?.value.trim() || "";
  if (chapter.status === "unassigned") chapter.status = "writing";
  writeGroupNovel(novel);
  renderGroupChapters(page);
  if (!silent) showGroupToast("Chapter draft saved");
}

function markGroupChapterFinished(page = document, chapterId = page.dataset.activeChapterId) {
  saveGroupChapterDraft(page);
  const novel = readGroupNovel();
  const member = getGroupMemberFromInputs(page, false);
  const chapter = getGroupChapter(novel, chapterId);
  if (!novel || !chapter) return;

  const permission = getChapterPermission(chapter, member);
  if (!permission.canEdit) return;
  chapter.status = "finished";
  writeGroupNovel(novel);
  renderGroupWrite(page);
  if (chapterId) openGroupChapterEditor(page, chapterId);
  showGroupToast(`${chapter.chapterTitle} marked finished`);
}

function getActiveGroupStyle(page = document) {
  return page.querySelector("[data-group-style].active")?.dataset.groupStyle || "Storybook";
}

function drawWrappedText(context, text, x, y, maxWidth, lineHeight, maxLines = 6) {
  const words = String(text || "").split(/\s+/).filter(Boolean);
  let line = "";
  let lines = 0;
  words.forEach((word) => {
    const next = line ? `${line} ${word}` : word;
    if (context.measureText(next).width > maxWidth && line) {
      if (lines < maxLines) context.fillText(line, x, y + lines * lineHeight);
      line = word;
      lines += 1;
    } else {
      line = next;
    }
  });
  if (line && lines < maxLines) context.fillText(line, x, y + lines * lineHeight);
}

function makeMediaArt({ title, body, writerName, style }) {
  const artCanvas = document.createElement("canvas");
  artCanvas.width = 1200;
  artCanvas.height = 820;
  const art = artCanvas.getContext("2d");
  const palettes = {
    Storybook: ["#0b1534", "#253b86", "#f8d88f"],
    Watercolor: ["#09213b", "#245f93", "#9ee2ff"],
    Comic: ["#1b1738", "#692e9f", "#ffd166"],
    "Block World": ["#102819", "#3c8b54", "#ffe38d"]
  };
  const [dark, mid, light] = palettes[style] || palettes.Storybook;
  const gradient = art.createLinearGradient(0, 0, 1200, 820);
  gradient.addColorStop(0, dark);
  gradient.addColorStop(0.55, mid);
  gradient.addColorStop(1, "#080d21");
  art.fillStyle = gradient;
  art.fillRect(0, 0, 1200, 820);

  for (let index = 0; index < 90; index += 1) {
    art.fillStyle = `rgba(255,255,255,${0.18 + Math.random() * 0.4})`;
    art.beginPath();
    art.arc(Math.random() * 1200, Math.random() * 520, Math.random() * 2.4 + 0.8, 0, Math.PI * 2);
    art.fill();
  }

  art.fillStyle = "rgba(255, 255, 255, 0.12)";
  art.fillRect(88, 92, 1024, 626);
  art.strokeStyle = light;
  art.lineWidth = 8;
  art.strokeRect(88, 92, 1024, 626);

  art.fillStyle = light;
  art.font = "900 56px Arial";
  art.fillText(title || "Chapter", 134, 178);
  art.fillStyle = "rgba(255,255,255,0.92)";
  art.font = "34px Georgia";
  drawWrappedText(art, body || "A student chapter is ready for illustration.", 134, 254, 760, 48, 6);

  art.fillStyle = "rgba(0,0,0,0.36)";
  art.fillRect(774, 238, 250, 250);
  art.fillStyle = light;
  art.font = "120px Arial";
  art.fillText(style === "Comic" ? "!" : style === "Block World" ? "#" : "*", 858, 408);

  art.fillStyle = "rgba(255,255,255,0.88)";
  art.font = "800 28px Arial";
  art.fillText(`Writer: ${writerName || "Student"}`, 134, 660);
  return artCanvas.toDataURL("image/png");
}

function generateGroupChapterIllustration(page = document) {
  const chapterId = page.dataset.activeChapterId;
  const novel = readGroupNovel();
  const member = getGroupMemberFromInputs(page, false);
  const chapter = getGroupChapter(novel, chapterId);
  if (!novel || !chapter) return;
  const permission = getChapterPermission(chapter, member);
  if (!permission.canEdit) {
    showGroupToast("Only the chapter writer can generate this illustration");
    return;
  }

  chapter.content = page.querySelector("[data-group-editor-text]")?.value.trim() || chapter.content;
  chapter.chapterCoverImg = makeMediaArt({
    title: chapter.chapterTitle,
    body: chapter.content,
    writerName: chapter.writerName,
    style: getActiveGroupStyle(page)
  });
  const image = page.querySelector("[data-group-chapter-image]");
  if (image) image.src = chapter.chapterCoverImg;
  const status = page.querySelector("[data-group-image-status]");
  if (status) status.textContent = "Chapter illustration generated and saved to this chapter.";
  writeGroupNovel(novel);
  renderGroupChapters(page);
  showGroupToast("Chapter illustration generated");
}

function mergeGroupNovelText(novel = readGroupNovel()) {
  if (!novel) return "";
  const merged = [
    novel.title,
    `Created: ${new Date(novel.createTime || Date.now()).toLocaleString()}`,
    ""
  ];
  novel.chapters.forEach((chapter, index) => {
    merged.push(chapter.chapterTitle || `Chapter ${index + 1}`);
    merged.push(chapter.content?.trim() || "[This chapter is not written yet.]");
    merged.push(`Writer: ${chapter.writerName || "Unassigned"}`);
    merged.push("");
  });
  return merged.join("\n");
}

function renderGroupFullPreview(page = document, novel = readGroupNovel()) {
  const preview = page.querySelector("[data-group-full-preview]");
  if (!preview) return;
  preview.textContent = novel?.fullMergedText || mergeGroupNovelText(novel) || "No merged book yet.";
}

function mergeGroupBook(page = document) {
  const novel = readGroupNovel();
  if (!novel) {
    showGroupToast("Create a group book first");
    return null;
  }
  novel.fullMergedText = mergeGroupNovelText(novel);
  writeGroupNovel(novel);
  renderGroupFullPreview(page, novel);
  showGroupToast("Full book merged with Writer signatures");
  return novel;
}

function exportGroupNovelTxt(page = document) {
  const novel = mergeGroupBook(page);
  if (!novel?.fullMergedText) return;
  const blob = new Blob([novel.fullMergedText], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${novel.title.replace(/[^\w-]+/g, "-").replace(/-+/g, "-") || "group-book"}-signed.txt`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
  showGroupToast("Signed TXT exported");
}

function makePoster(novel = readGroupNovel()) {
  const posterCanvas = document.createElement("canvas");
  posterCanvas.width = 1200;
  posterCanvas.height = 1600;
  const poster = posterCanvas.getContext("2d");
  const gradient = poster.createLinearGradient(0, 0, 1200, 1600);
  gradient.addColorStop(0, "#080f28");
  gradient.addColorStop(0.55, "#1f2f73");
  gradient.addColorStop(1, "#060a18");
  poster.fillStyle = gradient;
  poster.fillRect(0, 0, 1200, 1600);

  poster.fillStyle = "#ffe5a6";
  poster.font = "900 76px Arial";
  drawWrappedText(poster, novel?.title || "Group Storybook", 90, 140, 980, 84, 2);
  poster.fillStyle = "rgba(255,255,255,0.78)";
  poster.font = "28px Arial";
  poster.fillText("StoriesLens Group Novel Studio", 94, 316);

  const chapters = novel?.chapters || [];
  chapters.slice(0, 10).forEach((chapter, index) => {
    const col = index % 2;
    const row = Math.floor(index / 2);
    const x = 90 + col * 520;
    const y = 390 + row * 205;
    poster.fillStyle = "rgba(255,255,255,0.10)";
    poster.fillRect(x, y, 460, 160);
    poster.strokeStyle = "rgba(255,229,166,0.68)";
    poster.strokeRect(x, y, 460, 160);
    poster.fillStyle = "#fff";
    poster.font = "800 30px Arial";
    poster.fillText(chapter.chapterTitle, x + 24, y + 48);
    poster.fillStyle = "rgba(230,238,255,0.82)";
    poster.font = "24px Arial";
    poster.fillText(`Writer: ${chapter.writerName || "Unassigned"}`, x + 24, y + 92);
    poster.fillStyle = chapter.status === "finished" ? "#74e391" : "#ffd87c";
    poster.fillText(chapter.status, x + 24, y + 132);
  });

  poster.fillStyle = "rgba(255,255,255,0.86)";
  poster.font = "30px Arial";
  poster.fillText("Chapter signatures are included in the exported class assignment.", 90, 1490);
  return posterCanvas.toDataURL("image/png");
}

function generateGroupBookPoster(page = document) {
  const novel = mergeGroupBook(page);
  if (!novel) return;
  novel.globalCover = makePoster(novel);
  writeGroupNovel(novel);
  const preview = page.querySelector("[data-group-poster-preview]");
  if (preview) preview.src = novel.globalCover;
  const status = page.querySelector("[data-group-poster-status]");
  if (status) status.textContent = "Cover poster generated with all chapter signatures.";
  showGroupToast("Group book poster generated");
}

function saveGroupBookToWorks(page = document) {
  const novel = mergeGroupBook(page);
  if (!novel) return;
  const books = readStore("storieslens_group_books", []);
  const record = {
    type: "creative",
    savedAt: new Date().toISOString(),
    ...novel
  };
  writeStore("storieslens_group_books", [record, ...books.filter((book) => book.bookId !== novel.bookId)].slice(0, 12));
  showGroupToast("Group book saved to Works");
}

function renderGroupChat(page = document) {
  const log = page.querySelector("[data-group-chat-log]");
  if (!log) return;
  const messages = readGroupChat();
  log.innerHTML = messages.length
    ? messages.map((message) => `
      <p>
        <strong>${escapeHtml(message.name)}</strong>
        <span>${escapeHtml(message.text)}</span>
      </p>
    `).join("")
    : "<p><strong>StoriesLens</strong><span>Use chat to coordinate chapter claims and story details.</span></p>";
  log.scrollTop = log.scrollHeight;
}

function sendGroupChat(page = document) {
  const input = page.querySelector("[data-group-chat-input]");
  const text = input?.value.trim() || "";
  if (!text) return;
  const member = getGroupMemberFromInputs(page, true);
  if (!member) return;
  const messages = readGroupChat();
  messages.push({
    id: `msg-${Date.now()}`,
    name: member.studentName,
    text,
    at: new Date().toISOString()
  });
  writeGroupChat(messages);
  if (input) input.value = "";
  renderGroupChat(page);
}

function renderGroupWrite(page = document) {
  syncGroupMemberFields(page);
  renderGroupChapters(page);
  renderGroupChat(page);
  renderGroupFullPreview(page);
  const novel = readGroupNovel();
  if (novel?.globalCover) {
    const preview = page.querySelector("[data-group-poster-preview]");
    if (preview) preview.src = novel.globalCover;
  }
}

function startGroupChapterVoiceInput(page = document) {
  const textArea = page.querySelector("[data-group-editor-text]");
  if (!textArea || textArea.readOnly) return;
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    textArea.value = `${textArea.value.trim()} The brave friends opened the glowing door together.`.trim();
    saveGroupChapterDraft(page);
    showGroupToast("Speech recognition unavailable; sample sentence added");
    return;
  }
  if (groupVoiceRecognition) {
    groupVoiceRecognition.stop();
    groupVoiceRecognition = null;
    showGroupToast("Voice input stopped");
    return;
  }
  groupVoiceRecognition = new SpeechRecognition();
  groupVoiceRecognition.lang = "en-US";
  groupVoiceRecognition.interimResults = false;
  groupVoiceRecognition.onresult = (event) => {
    const transcript = Array.from(event.results).map((result) => result[0].transcript).join(" ");
    textArea.value = `${textArea.value.trim()} ${transcript}`.trim();
    saveGroupChapterDraft(page);
  };
  groupVoiceRecognition.onend = () => {
    groupVoiceRecognition = null;
  };
  groupVoiceRecognition.start();
  showGroupToast("Listening for chapter text");
}

function readGroupChapterAloud(page = document) {
  const text = page.querySelector("[data-group-editor-text]")?.value.trim() || "";
  if (!text) {
    showGroupToast("Write chapter text first");
    return;
  }
  if (!window.speechSynthesis || !window.SpeechSynthesisUtterance) {
    showGroupToast("Read aloud is not supported in this browser");
    return;
  }
  if (speechSynthesis.speaking) {
    speechSynthesis.cancel();
    return;
  }
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "en-US";
  utterance.rate = 0.92;
  speechSynthesis.speak(utterance);
  showGroupToast("Reading chapter aloud");
}

function initGroupWrite() {
  const page = document.querySelector(".group-write-page");
  if (!page) return;

  renderGroupWrite(page);
  const googleBtn = document.getElementById("googleClassLoginBtn");
  const wechatBtn = document.getElementById("wechatWebLoginBtn");
  const closeModal = page.parentElement?.querySelector(".close-modal") || document.querySelector(".close-modal");

  googleBtn?.addEventListener("click", () => {
    googleOAuthLogin().then((user) => {
      writeStore(TEACHER_LOGIN_STORE.googleTeacherUser, user);
      writeStore(TEACHER_LOGIN_STORE.envMode, "oversea");
      renderLoginStatus("google", user);
      showGroupToast("Google Classroom teacher login ready");
    });
  });
  wechatBtn?.addEventListener("click", openWechatLoginModal);
  closeModal?.addEventListener("click", closeWxModal);

  const googleUser = readStore(TEACHER_LOGIN_STORE.googleTeacherUser, null);
  const wxUser = readStore(TEACHER_LOGIN_STORE.wxTeacherUser, null);
  if (googleUser) renderLoginStatus("google", googleUser);
  if (wxUser) renderLoginStatus("wechat", wxUser);

  groupSyncChannel?.addEventListener("message", () => {
    renderGroupWrite(page);
  });

  page.querySelectorAll("[data-group-style]").forEach((button) => {
    button.addEventListener("click", () => {
      page.querySelectorAll("[data-group-style]").forEach((item) => item.classList.toggle("active", item === button));
      showGroupToast(`${button.dataset.groupStyle} style selected`);
    });
  });

  page.querySelector("[data-group-editor-text]")?.addEventListener("input", () => {
    window.clearTimeout(groupEditorSaveTimer);
    groupEditorSaveTimer = window.setTimeout(() => saveGroupChapterDraft(page, true), 500);
  });

  page.addEventListener("click", (event) => {
    const control = event.target.closest("[data-group-action]");
    if (!control) return;
    const action = control.dataset.groupAction;
    const chapterId = control.dataset.chapterId || page.dataset.activeChapterId;

    if (action === "create-project") createGroupNovelProject(page);
    if (action === "load-project") {
      renderGroupWrite(page);
      showGroupToast(readGroupNovel() ? "Existing group book loaded" : "No saved group book found");
    }
    if (action === "save-member") {
      getGroupMemberFromInputs(page, true);
      renderGroupWrite(page);
      showGroupToast("Student signature saved");
    }
    if (action === "send-chat") sendGroupChat(page);
    if (action === "claim-chapter") claimGroupChapter(page, chapterId);
    if (action === "recall-chapter") recallGroupChapter(page, chapterId);
    if (action === "open-chapter") openGroupChapterEditor(page, chapterId);
    if (action === "save-chapter") saveGroupChapterDraft(page);
    if (action === "finish-chapter") markGroupChapterFinished(page, chapterId);
    if (action === "generate-chapter-image") generateGroupChapterIllustration(page);
    if (action === "voice-chapter") startGroupChapterVoiceInput(page);
    if (action === "read-chapter") readGroupChapterAloud(page);
    if (action === "exit-editor") {
      page.querySelector("[data-group-editor]").hidden = true;
      page.dataset.activeChapterId = "";
    }
    if (action === "merge-book") mergeGroupBook(page);
    if (action === "export-book") exportGroupNovelTxt(page);
    if (action === "generate-poster") generateGroupBookPoster(page);
    if (action === "save-book") saveGroupBookToWorks(page);
  });

  page.querySelector("[data-group-chat-input]")?.addEventListener("keydown", (event) => {
    if (event.key === "Enter") sendGroupChat(page);
  });
}

function updateDraftCount(page) {
  const draft = page.querySelector("[data-story-draft]");
  const counter = page.querySelector("[data-draft-count]");
  if (!draft || !counter) return;
  counter.textContent = `${draft.value.length} / 2000`;
}

function initVisualWriteInteractions() {
  const page = document.querySelector(".visual-write-page");
  if (!page) return;

  const gradeSelector = page.querySelector("[data-write-grade-selector]");
  if (gradeSelector) {
    gradeSelector.addEventListener("change", () => {
      renderWriteSkillCards(gradeSelector.value, page);
      renderWritingDiagnostics(page);
      showWriteToast(`Grade ${gradeSelector.value} CCSS writing prompts loaded`);
    });
    renderWriteSkillCards(gradeSelector.value, page);
  }

  updateDraftCount(page);
  renderWritingDiagnostics(page);
  setGeneratedImageActions(page, "");
  const draft = page.querySelector("[data-story-draft]");
  draft?.addEventListener("input", () => {
    updateDraftCount(page);
    renderWritingDiagnostics(page);
    const autosave = page.querySelector(".story-draft-panel .write-panel-title small");
    if (autosave) autosave.innerHTML = "<i></i> Auto-saved just now · storieslens_writeDraft";
  });

  page.querySelectorAll(".art-style-card").forEach((button) => {
    button.addEventListener("click", () => {
      page.querySelectorAll(".art-style-card").forEach((item) => item.classList.toggle("active", item === button));
      const preview = page.querySelector("[data-illustration-preview]");
      if (preview && button.dataset.preview) preview.src = button.dataset.preview;
      const status = page.querySelector("[data-style-status]");
      if (status) status.textContent = `${button.dataset.writeStyle} selected`;
      showWriteToast(`${button.dataset.writeStyle} art style selected`);
    });
  });

  page.querySelector("[data-generated-image-save]")?.addEventListener("click", () => {
    saveGeneratedImageToWorks(page);
  });

  page.querySelectorAll("[data-write-action]").forEach((control) => {
    control.addEventListener("click", (event) => {
      const action = control.dataset.writeAction;
      if (action === "close-modal") {
        event.preventDefault();
        closeWriteModal();
        return;
      }

      if (action === "close-teacher-prompt") {
        event.preventDefault();
        closeTeacherPromptModal();
        return;
      }

      if (action === "upload-class-prompt") {
        openTeacherPromptModal();
        return;
      }

      if (action === "teacher-prompt-demo") {
        showWriteToast("Class writing prompt workflow previewed");
        return;
      }

      if (action === "keyboard") {
        focusDraftEditor(page);
        return;
      }

      if (action === "voice") {
        startWriteVoiceInput(page);
        return;
      }

      if (action === "read-aloud") {
        readWriteDraftAloud(page);
        return;
      }

      if (action === "generate-ai-report") {
        generateIvyAIReport(page);
        return;
      }

      if (action === "generate-report-video") {
        generateIvyReportVideoScript(page);
        return;
      }

      if (action === "check-story") {
        renderOpenClawFeedback(page);
        return;
      }

      if (action === "apply-suggestion") {
        applyOpenClawSuggestion(page);
        return;
      }

      if (action === "generate-illustration") {
        generateFreeCreateImage(page);
        return;
      }

      if (action === "start-group-writing") {
        window.location.href = "group-write.html";
        return;
      }

      if (action === "clear-text") {
        const draftBox = page.querySelector("[data-story-draft]");
        if (draftBox) draftBox.value = "";
        updateDraftCount(page);
        renderWritingDiagnostics(page);
        showWriteToast("Draft cleared");
        return;
      }

      if (action === "skill-detail") {
        return;
      }

      const [title, body, chip] = writeActions[action] || writeActions["hero-preview"];
      openWriteModal(title, body, chip);
    });
  });

  page.querySelectorAll("[data-video-action]").forEach((control) => {
    control.addEventListener("click", () => {
      const action = control.dataset.videoAction;
      const status = page.querySelector("[data-video-status]");

      if (action === "select-clip") {
        page.querySelectorAll(".timeline-clip").forEach((clip) => clip.classList.toggle("active", clip === control));
        showWriteToast("Timeline clip selected");
        return;
      }

      if (action === "split") {
        const timeline = page.querySelector(".video-timeline");
        const clips = page.querySelectorAll(".timeline-clip");
        const lastClip = clips[clips.length - 1];
        if (timeline && lastClip) {
          const clone = lastClip.cloneNode(true);
          clone.querySelector("span").textContent = `Scene ${clips.length + 1}`;
          clone.classList.remove("active");
          timeline.insertBefore(clone, timeline.querySelector(".timeline-audio"));
          clone.addEventListener("click", () => {
            page.querySelectorAll(".timeline-clip").forEach((clip) => clip.classList.toggle("active", clip === clone));
            showWriteToast("Timeline clip selected");
          });
        }
        showWriteToast("Scene split added to the timeline");
        return;
      }

      if (action === "play") {
        if (status) status.textContent = status.textContent.includes("Playing") ? "Paused · 12s" : "Playing · 12s";
        showWriteToast(status?.textContent || "Video preview toggled");
        return;
      }

      if (action === "trim") {
        page.querySelector(".timeline-clip.active")?.classList.toggle("is-trimming");
        showWriteToast("Trim handles enabled on the selected clip");
        return;
      }

      if (action === "caption") {
        openWriteModal("Add Caption", "Caption mode will place student-friendly English subtitles over the selected clip.", "Video Editor");
        return;
      }

      if (action === "export") {
        openWriteModal("Export Video", "The edited 10-15s movie can be exported for class sharing or saved with the student's illustrated book.", "Export");
      }
    });
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeWriteModal();
      closeTeacherPromptModal();
    }
  });
}

function initTeacherDashboardInteractions() {
  const page = document.querySelector(".teacher-dashboard-page");
  if (!page) return;

  page.querySelectorAll("[data-dashboard-action]").forEach((button) => {
    button.addEventListener("click", () => {
      const label = button.textContent.trim();
      showWriteToast(`${label} prototype action is ready for backend integration`);
    });
  });
}

resizeCanvas();
drawStars();
initIdentityMode();
initVisualReadInteractions();
initVisualWriteInteractions();
initTeacherDashboardInteractions();
initGroupWrite();

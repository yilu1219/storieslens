(function () {
  const thread = document.querySelector('[data-story-thread]');
  const input = document.querySelector('[data-answer]');
  const send = document.querySelector('[data-send]');
  const sendLabel = document.querySelector('[data-send-label]');
  const hint = document.querySelector('[data-composer-hint]');
  const quickIdeas = document.querySelector('[data-quick-ideas]');
  const hear = document.querySelector('[data-hear-current]');
  const speak = document.querySelector('[data-speak]');
  const speakTime = document.querySelector('[data-speak-time]');
  const upload = document.querySelector('[data-upload]');
  const parentPanel = document.querySelector('[data-parent-panel]');
  const learningCount = document.querySelector('[data-learning-count]');
  const parentEvidence = document.querySelector('[data-parent-evidence]');
  const parentNote = document.querySelector('[data-parent-note]');
  const reportButton = document.querySelector('.report-button');
  const giftCount = document.querySelector('[data-gift-count]');
  const starCount = document.querySelector('[data-star-count]');
  const celebration = document.querySelector('[data-celebration]');
  const toast = document.querySelector('[data-toast]');
  const composer = document.querySelector('[data-composer]');
  const creatorName = document.querySelector('[data-creator-name]');
  const namePrompt = document.querySelector('[data-name-prompt]');
  const uploadEntry = document.querySelector('[data-upload-entry]');
  const characterMaker = document.querySelector('[data-character-maker]');
  const characterDescribe = document.querySelector('[data-character-describe]');
  const characterDescription = document.querySelector('[data-character-description]');
  const characterGenerate = document.querySelector('[data-character-generate]');
  const uploadRecovery = document.querySelector('[data-upload-recovery]');
  const heicAutoConvert = document.querySelector('[data-heic-auto-convert]');

  const state = {
    step: 0,
    answers: [],
    speaking: false,
    speakStarted: 0,
    timer: null,
    recognition: null,
    currentPrompt: 'Show or tell me one tiny idea. It can be a drawing, a photo, or just a few words.',
    voiceMood: 'theatrical',
    imageUrl: '',
    referenceImages: [],
    userUploadedReference: false,
    uploadContainsRealPerson: false,
    uploadConvertedFromHeic: false,
    projectId: '',
    personalPhotoConsentId: '',
    characterImageUrl: '',
    characterPreviewIndex: 0,
    characterPreviewMade: false,
    editMode: '',
    pictureChangeRequest: '',
    outputType: '',
    selectedStyle: '',
    stars: 0,
    originalScene: '',
    revisedScene: '',
    revisionReason: '',
    storyTitle: '',
    resultImage: 'assets/original-garden-door-hd-v2.png',
    session: null,
    wallet: null,
    imageCredits: 0,
    betaUnlimitedCreation: false,
    readingConfirmed: false,
    pictureConsentPanel: null,
    refreshStyleReferenceChoice: null,
    resumedGuestCreation: false,
    postSignupAction: '',
    creationStage: '',
    targetPages: 10,
    bookScenes: [],
    currentPageDraft: '',
    currentPageOriginal: '',
    restoredProject: false,
    coverImageUrl: '',
    authorProfile: { name: '', bio: '', photoUrl: '' }
  };
  let pendingHeicFiles = [];

  function creatorLabel() {
    return state.name || 'Story creator';
  }

  function possessiveName() {
    return state.name ? state.name + (state.name.endsWith('s') ? '’' : '’s') : 'the creator’s';
  }

  function captureName() {
    state.name = creatorName.value.trim();
    if (state.name) {
      try { localStorage.setItem('storieslens-preview-creator-name', state.name); } catch (error) { /* device storage unavailable */ }
      document.querySelector('[data-child-name]').textContent = state.name;
    }
  }

  const creationStages = {
    'picture-voice': {
      title: 'Picture & Voice', ages: 'Ages 5–6', icon: '🎙️', targetPages: 6, minPages: 4, maxPages: 6,
      promise: 'Tell a tiny story with pictures and your voice.',
      guidance: 'Yu asks one very short question at a time. Complete grammar is not required.',
      voiceGuide: 'Pick Picture and Voice if you want to show a picture or tell a tiny story out loud. I will ask only one short question at a time. You do not need perfect grammar.',
      questions: [
        { title: 'Who is here?', copy: 'Say a name, or show me a picture.', placeholder: 'This is Niko the moon fox…', fallback: 'This is Niko the moon fox.', skill: 'character', reward: ['Character finder', 'You chose who is in the story.'] },
        { title: 'Where are they?', copy: 'Tell me one place.', placeholder: 'In a glowing forest…', fallback: 'They are in a glowing forest.', skill: 'challenge', reward: ['World builder', 'You gave your character a place.'] },
        { title: 'What happens?', copy: 'Say one thing we can see.', placeholder: 'A star falls into the pond…', fallback: 'A star falls into the pond.', skill: 'sequence', reward: ['Scene starter', 'You made something happen.'] }
      ],
      pagePrompts: ['Who do we meet?', 'Where do they go?', 'What do they find?', 'What feels hard?', 'Who helps?', 'How does it end?']
    },
    'first-book': {
      title: 'My First Book', ages: 'Ages 7–9', icon: '📖', targetPages: 10, minPages: 10, maxPages: 10,
      promise: 'Make a complete 10-page illustrated book.',
      guidance: 'Yu uses Who, Where, What, Why, and When. Write or say 1–3 sentences per page.',
      voiceGuide: 'Pick My First Book if you want to make a ten page picture book. You can talk or type one to three sentences at a time. I will help you with who, where, when, what, and why.',
      questions: [
        { title: 'Who is in your story?', copy: 'Who are they, where are they, and what do they want?', placeholder: 'Maya is 8. She is in a moon garden and wants to find her way home…', fallback: 'Maya is 8. She is in a moon garden and wants to find her way home.', skill: 'character', reward: ['Character builder', 'You gave your hero a place and a wish.'] },
        { title: 'What is hard right now?', copy: 'What problem makes their journey difficult?', placeholder: 'The moon bridge has disappeared…', fallback: 'The moon bridge has disappeared.', skill: 'challenge', reward: ['Challenge finder', 'Now your reader wants to know what happens.'] },
        { title: 'What happens first?', copy: 'When does it begin, and what do we see or hear?', placeholder: 'At midnight, a silver fox brings Maya a glowing key…', fallback: 'At midnight, a silver fox brings Maya a glowing key.', skill: 'sequence', reward: ['Scene starter', 'You used when and what to begin the action.'] }
      ],
      pagePrompts: ['Meet the hero: who and where?', 'What does your hero really want?', 'What problem appears?', 'What do they try first?', 'How does the problem get harder?', 'What helper, clue, or surprise appears?', 'What hard choice must they make?', 'How do they solve the problem?', 'What changes because of their choice?', 'How do they feel at the end?']
    },
    'story-builder': {
      title: 'Story Builder', ages: 'Ages 10–12', icon: '✍️', targetPages: 12, minPages: 10, maxPages: 16,
      promise: 'Build a 10–16 page story with strong paragraphs.',
      guidance: 'Yu develops motivation, conflict, dialogue, paragraph structure, and complete grammar.',
      voiceGuide: 'Pick Story Builder if you want to write a longer story with paragraphs. I will help with characters, problems, dialogue, and grammar while keeping every idea yours.',
      questions: [
        { title: 'Who is the protagonist?', copy: 'Describe what they want, why it matters, and where the story begins.', placeholder: 'Amara wants to win the robotics trial because…', fallback: 'Amara wants to win the robotics trial because it could save her school club.', skill: 'character', reward: ['Motivation builder', 'You connected a character to a meaningful goal.'] },
        { title: 'What blocks that goal?', copy: 'Describe the main conflict and what might be lost.', placeholder: 'Her closest teammate hides the final power cell…', fallback: 'Her closest teammate hides the final power cell.', skill: 'challenge', reward: ['Conflict builder', 'You created pressure and a reason to act.'] },
        { title: 'How does the first scene unfold?', copy: 'Use action, detail, or dialogue to begin the story.', placeholder: '“We have ten minutes,” Amara whispered as the lights went out…', fallback: '“We have ten minutes,” Amara whispered as the lights went out.', skill: 'sequence', reward: ['Scene builder', 'You opened with action, detail, or dialogue.'] }
      ],
      pagePrompts: ['Establish the protagonist and setting.', 'Reveal the goal and why it matters.', 'Introduce the central conflict.', 'Show the first attempt with action or dialogue.', 'Escalate the consequences.', 'Reveal a clue, ally, or reversal.', 'Force a difficult decision.', 'Build toward the decisive action.', 'Show the result and its cost.', 'Deepen the character change.', 'Resolve the main relationship.', 'End with a memorable image or line.']
    },
    'author-film': {
      title: 'Author & Film Studio', ages: 'Ages 13–16', icon: '🎬', targetPages: 12, minPages: 12, maxPages: 24,
      promise: 'Create chapters or a 12–24 scene film.',
      guidance: 'Yu coaches point of view, theme, pacing, scene direction, deep revision, and screenplay form.',
      voiceGuide: 'Pick Author and Film Studio if you want to write chapters or build a film. I will coach point of view, theme, pacing, scenes, and screenplay form without taking over your story.',
      questions: [
        { title: 'Whose story is this?', copy: 'Choose the point of view, desire, setting, and thematic question.', placeholder: 'From Leo’s point of view, the city rewards perfect memories—but he wants to forget…', fallback: 'From Leo’s point of view, the city rewards perfect memories, but he wants to forget.', skill: 'character', reward: ['Story architect', 'You connected point of view, desire, and theme.'] },
        { title: 'What forces a choice?', copy: 'Define the conflict, stakes, and decision the protagonist cannot avoid.', placeholder: 'If Leo erases the evidence, his sister is safe—but the city stays controlled…', fallback: 'Leo must choose between protecting his sister and revealing the truth.', skill: 'challenge', reward: ['Dramatic pressure', 'You built conflict with real stakes.'] },
        { title: 'How does the opening play?', copy: 'Write the first beat using action, image, sound, or dialogue.', placeholder: 'INT. MEMORY ARCHIVE — NIGHT. Blue light flickers across Leo’s face…', fallback: 'INT. MEMORY ARCHIVE — NIGHT. Blue light flickers across Leo’s face.', skill: 'sequence', reward: ['Opening director', 'You staged an opening beat for the reader or camera.'] }
      ],
      pagePrompts: ['Opening image and point of view.', 'Theme question and character desire.', 'Inciting incident.', 'First irreversible choice.', 'Rising action and opposition.', 'Relationship turn or revelation.', 'Midpoint reversal.', 'Consequences close in.', 'Lowest point and inner decision.', 'Climactic action.', 'Emotional resolution.', 'Final image that echoes the opening.']
    }
  };

  let questions = creationStages['first-book'].questions;

  const yuAvatar = '<span class="avatar"><img src="assets/yu-mascot-logo-v2.png" alt="Yu the story mentor" /></span>';
  function userAvatar() {
    const initial = state.name ? state.name.charAt(0).toUpperCase() : '✦';
    return '<span class="avatar user-avatar">' + escapeHtml(initial) + '</span>';
  }

  function yuMessage(content, extraClass) {
    const item = document.createElement('article');
    item.className = 'message yu';
    item.innerHTML = yuAvatar + '<div class="bubble ' + (extraClass || '') + '">' + content + '</div>';
    thread.appendChild(item);
    item.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    return item;
  }

  function userMessage(text, imageUrl, label) {
    const item = document.createElement('article');
    const pictureUrls = (Array.isArray(imageUrl) ? imageUrl : [imageUrl]).filter(Boolean);
    const pictureHtml = pictureUrls.length
      ? '<div class="inline-picture-grid count-' + Math.min(3, pictureUrls.length) + '">' + pictureUrls.map(function (url, index) { return '<img class="inline-picture" src="' + escapeHtml(url) + '" alt="Uploaded story character ' + (index + 1) + '" />'; }).join('') + '</div>'
      : '';
    item.className = 'message user';
    item.innerHTML = userAvatar() + '<div class="bubble"><small>' + escapeHtml(label || (possessiveName().toUpperCase() + ' IDEA')) + '</small><p>' + escapeHtml(text) + '</p>' + pictureHtml + '</div>';
    thread.appendChild(item);
    item.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  function escapeHtml(value) {
    return String(value).replace(/[&<>'"]/g, function (char) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[char];
    });
  }

  async function apiJson(path, options) {
    const requestOptions = options || {};
    const response = await fetch(path, {
      ...requestOptions,
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json', ...(requestOptions.headers || {}) }
    });
    const result = await response.json().catch(function () { return {}; });
    if (!response.ok) {
      const error = new Error(result.error || 'StoriesLens could not finish this step.');
      error.code = result.code || '';
      error.status = response.status;
      throw error;
    }
    return result;
  }

  function walletImageCredits(wallet) {
    return Math.max(0, Number(wallet?.resources?.imageGenerations?.remaining) || 0);
  }

  function hasPictureAllowance() {
    return state.betaUnlimitedCreation || state.imageCredits > 0;
  }

  function updatePictureAllowance(wallet, unlimited) {
    state.wallet = wallet || state.wallet;
    if (typeof unlimited === 'boolean') state.betaUnlimitedCreation = unlimited;
    state.imageCredits = walletImageCredits(state.wallet);
    giftCount.textContent = state.betaUnlimitedCreation ? '∞' : String(state.imageCredits);
  }

  function hasAccount() {
    return Boolean(state.session?.authenticated && state.session.user?.kind === 'account');
  }

  async function refreshAccountState() {
    try {
      state.session = await apiJson('/api/auth/session');
      if (!state.session.user) {
        state.wallet = null;
        state.imageCredits = 0;
        state.betaUnlimitedCreation = false;
        giftCount.textContent = '0';
        return state.session;
      }
      const credits = await apiJson('/api/credits');
      updatePictureAllowance(credits.wallet, credits.betaUnlimitedCreation === true);
      return state.session;
    } catch (_error) {
      state.session = null;
      state.wallet = null;
      state.imageCredits = 0;
      state.betaUnlimitedCreation = false;
      giftCount.textContent = '0';
      return null;
    }
  }

  async function requireAccount() {
    const session = state.session?.authenticated ? state.session : await refreshAccountState();
    if (!session?.authenticated || session.user?.kind !== 'account') {
      const error = new Error('Sign in first to save this story and use your free picture.');
      error.code = 'AUTH_REQUIRED';
      throw error;
    }
    return session.user;
  }

  function projectPayload(extraSnapshot) {
    const params = new URLSearchParams(location.search);
    const language = ['zh', 'bilingual'].includes(params.get('storyLang')) ? params.get('storyLang') : 'en';
    const liveScene = state.revisedScene ? {
      id: 'scene-' + (state.bookScenes.length + 1),
      title: 'Page ' + (state.bookScenes.length + 1),
      text: state.revisedScene,
      caption: state.revisedScene.slice(0, 500),
      imageUrl: /^\/api\/media\//.test(state.resultImage || '') ? state.resultImage : '',
      duration: 6,
      transition: 'fade'
    } : null;
    const savedScenes = state.bookScenes.length ? state.bookScenes.slice() : (liveScene ? [liveScene] : []);
    return {
      title: state.storyTitle || state.answers[0]?.slice(0, 80) || 'My StoriesLens story',
      language,
      ageGroup: 'under18',
      mode: 'solo',
      visibility: 'private',
      sourceType: state.userUploadedReference ? 'personal-photo' : 'text',
      sourceText: state.answers[0] || '',
      draft: savedScenes.map(function (scene) { return scene.text; }).join('\n\n') || state.revisedScene || state.originalScene || state.answers.join(' '),
      coverImageUrl: state.coverImageUrl || savedScenes[0]?.imageUrl || (/^\/api\/media\//.test(state.resultImage || '') ? state.resultImage : ''),
      scenes: savedScenes,
      storyDna: {
        source: 'solo-story',
        answers: state.answers.slice(0, 4),
        outputType: state.outputType,
        selectedStyle: state.selectedStyle,
        creationStage: state.creationStage,
        targetPages: state.targetPages,
        lockedCharacters: state.answers[1] || state.answers[0] || '',
        characterReferenceCount: uploadedReferenceUrls().length
      },
      clientSnapshot: {
        from: 'solo-story',
        mentorRevisionCompleted: Boolean(state.revisedScene),
        readingConfirmed: state.readingConfirmed,
        stars: state.stars,
        outputType: state.outputType,
        selectedStyle: state.selectedStyle,
        creationStage: state.creationStage,
        targetPages: state.targetPages,
        completedPages: state.bookScenes.length,
        personalPhotoConsentId: state.personalPhotoConsentId,
        authorProfile: state.authorProfile,
        ...(extraSnapshot || {})
      }
    };
  }

  async function saveProject(extraSnapshot) {
    let result;
    try {
      const creationKey = localStorage.getItem('storieslens_solo_project_creation_key') || ('solo-project-' + Date.now() + '-' + Math.random().toString(36).slice(2));
      localStorage.setItem('storieslens_solo_project_creation_key', creationKey);
      result = await apiJson(state.projectId ? '/api/projects/' + encodeURIComponent(state.projectId) : '/api/projects', {
        method: state.projectId ? 'PATCH' : 'POST',
        headers: state.projectId ? {} : { 'Idempotency-Key': creationKey },
        body: JSON.stringify(projectPayload(extraSnapshot))
      });
    } catch (error) {
      if (!state.projectId || error.status !== 404) throw error;
      state.projectId = '';
      localStorage.removeItem('storieslens_cloud_project_id');
      localStorage.removeItem('storieslens_solo_story_project_id');
      return saveProject(extraSnapshot);
    }
    state.projectId = result.project.id;
    try {
      localStorage.setItem('storieslens_solo_story_project_id', state.projectId);
      localStorage.setItem('storieslens_cloud_project_id', state.projectId);
    } catch (_error) { /* no-op */ }
    return result.project;
  }

  async function restoreIncomingCreation() {
    const params = new URLSearchParams(location.search);
    try {
      const shouldResume = params.has('project') || params.get('from') === 'h5' || params.get('resume') === '1';
      state.projectId = params.get('project') || (shouldResume ? (localStorage.getItem('storieslens_cloud_project_id') || localStorage.getItem('storieslens_solo_story_project_id') || '') : '');
      if (!shouldResume) localStorage.removeItem('storieslens_solo_project_creation_key');
      const setup = JSON.parse(localStorage.getItem('storieslens_creator_setup') || 'null');
      const draft = JSON.parse(localStorage.getItem('storieslens_student_visual_write') || 'null');
      const dna = JSON.parse(localStorage.getItem('storieslens_story_dna') || 'null');
      state.name = setup?.displayName || draft?.creatorName || localStorage.getItem('storieslens-preview-creator-name') || '';
      if (draft?.outputFormat === 'film' || setup?.outputFormat === 'film') state.outputType = 'film';
      const incomingWords = String(draft?.draft || dna?.seed || setup?.seed || '').trim();
      if (incomingWords) input.value = incomingWords.slice(0, Number(input.maxLength) || 7000);
      if (params.get('resumeGuest') === '1') {
        const pending = JSON.parse(localStorage.getItem('storieslens_pending_guest_creation') || 'null');
        if (pending?.projectId && pending?.resultImage && pending?.revisedScene) {
          state.projectId = String(pending.projectId);
          state.name = String(pending.name || state.name || '').slice(0, 80);
          state.answers = Array.isArray(pending.answers) ? pending.answers.map(String).slice(0, 4) : [];
          state.originalScene = String(pending.originalScene || '');
          state.revisedScene = String(pending.revisedScene);
          state.storyTitle = String(pending.storyTitle || 'My Story');
          state.resultImage = String(pending.resultImage);
          state.outputType = pending.outputType === 'film' ? 'film' : 'book';
          state.selectedStyle = String(pending.selectedStyle || 'Storybook watercolor');
          state.creationStage = creationStages[pending.creationStage] ? pending.creationStage : 'first-book';
          state.targetPages = creationStages[state.creationStage].targetPages;
          questions = creationStages[state.creationStage].questions;
          state.resumedGuestCreation = true;
          state.postSignupAction = String(params.get('postSignup') || pending.action || 'continue');
        }
      }
    } catch (_error) {
      state.projectId = '';
      state.name = '';
    }

    if (state.projectId && params.has('project')) {
      try {
        const saved = await apiJson('/api/projects/' + encodeURIComponent(state.projectId));
        const project = saved.project || {};
        state.bookScenes = Array.isArray(project.scenes) ? project.scenes.filter(function (scene) { return scene && scene.text; }) : [];
        state.storyTitle = String(project.title || state.storyTitle || 'My Story');
        state.outputType = project.storyDna?.outputType === 'film' ? 'film' : (project.storyDna?.outputType || state.outputType || 'book');
        state.selectedStyle = String(project.storyDna?.selectedStyle || state.selectedStyle || 'Storybook watercolor');
        state.personalPhotoConsentId = String(project.clientSnapshot?.personalPhotoConsentId || '');
        state.coverImageUrl = String(project.coverImageUrl || '');
        state.authorProfile = {
          name: String(project.clientSnapshot?.authorProfile?.name || state.name || ''),
          bio: String(project.clientSnapshot?.authorProfile?.bio || ''),
          photoUrl: String(project.clientSnapshot?.authorProfile?.photoUrl || '')
        };
        state.userUploadedReference = project.sourceType === 'personal-photo';
        state.uploadContainsRealPerson = project.sourceType === 'personal-photo';
        state.creationStage = creationStages[project.storyDna?.creationStage] ? project.storyDna.creationStage : 'first-book';
        state.targetPages = Math.max(creationStages[state.creationStage].minPages, Math.min(creationStages[state.creationStage].maxPages, Number(project.storyDna?.targetPages) || creationStages[state.creationStage].targetPages));
        questions = creationStages[state.creationStage].questions;
        state.answers = Array.isArray(project.storyDna?.answers) ? project.storyDna.answers.map(String).slice(0, 4) : state.answers;
        if (state.bookScenes.length) {
          const lastScene = state.bookScenes[state.bookScenes.length - 1];
          state.originalScene = lastScene.text;
          state.revisedScene = lastScene.text;
          state.resultImage = lastScene.imageUrl || project.coverImageUrl || state.resultImage;
          if (state.userUploadedReference) state.characterImageUrl = project.coverImageUrl || state.bookScenes[0]?.imageUrl || '';
          state.restoredProject = true;
        }
      } catch (_error) { /* A new story can still begin if the saved project is unavailable. */ }
    }

    try {
      const spark = window.StoriesLensSparkHandoff ? await window.StoriesLensSparkHandoff.load() : null;
      if (!spark) return;
      if (spark.seed && !input.value.trim()) input.value = String(spark.seed).slice(0, Number(input.maxLength) || 7000);
      if (spark.creatorName && !state.name) state.name = String(spark.creatorName).slice(0, 40);
      if (spark.dataUrl && /^data:image\/(?:webp|png|jpeg);base64,/.test(spark.dataUrl)) {
        state.referenceImages = [{
          dataUrl: spark.dataUrl,
          name: String(spark.name || 'story-reference.webp').slice(0, 180),
          containsRealPerson: spark.personalPhoto === true,
          convertedFromHeic: spark.convertedFromHeic === true,
          convertedOnServer: spark.convertedOnServer === true
        }];
        state.imageUrl = spark.dataUrl;
        state.resultImage = spark.dataUrl;
        state.userUploadedReference = true;
        state.uploadContainsRealPerson = spark.personalPhoto === true;
        state.uploadConvertedFromHeic = spark.convertedFromHeic === true;
        uploadEntry.querySelector('strong').textContent = 'Your uploaded picture is ready';
        uploadEntry.querySelector('small').textContent = 'Carried safely into the new Story Studio—no second upload needed.';
      }
    } catch (_error) { /* The child can still begin directly in the new studio. */ }
  }

  async function requestYuRevision(original) {
    const stageProfiles = {
      'picture-voice': { grade: 'K', level: 'emergent', focus: 'oral storytelling clarity; preserve child voice; do not require complete grammar' },
      'first-book': { grade: '3', level: 'expression', focus: '1–3 clear sentences, 5W story detail, age-appropriate grammar and punctuation' },
      'story-builder': { grade: '6', level: 'paragraph', focus: 'paragraph structure, motivation, conflict, dialogue, complete grammar and precise verbs' },
      'author-film': { grade: '10', level: 'advanced', focus: 'point of view, theme, pacing, scene construction, screenplay format and deep revision' }
    };
    const profile = stageProfiles[state.creationStage] || stageProfiles['first-book'];
    const result = await apiJson('/api/writing-assistant', {
      method: 'POST',
      body: JSON.stringify({
        action: 'check',
        mode: 'free',
        storyLanguage: 'en',
        grade: profile.grade,
        creatorLevel: profile.level,
        skillFocus: profile.focus,
        inspiration: state.answers[0] || '',
        storyDnaContext: state.answers.map(function (answer, index) { return (index + 1) + '. ' + answer; }).join('\n'),
        selectedText: original,
        studentDraft: original
      })
    });
    const assistant = result.result || {};
    const changes = Array.isArray(assistant.grammarChanges) ? assistant.grammarChanges : [];
    const revised = String(assistant.suggestion || original).trim() || original;
    const firstChange = changes[0];
    return {
      text: revised,
      reason: assistant.grammarNote || assistant.reply || 'Yu kept every story fact and checked only the grammar.',
      changes,
      lesson: {
        title: firstChange?.skill || (assistant.grammarCategory === 'clear' ? 'Your sentence is already clear' : 'One useful grammar check'),
        explanation: firstChange?.explanation || assistant.microLesson || assistant.writingNote || 'Read the sentence aloud and check that it begins clearly and ends with punctuation.',
        example: firstChange ? firstChange.before + ' → ' + firstChange.after : revised
      },
      title: revised.split(/[.!?。！？\n]/)[0].trim().slice(0, 56) || 'My Story',
      image: state.characterImageUrl || state.imageUrl || 'assets/original-garden-door-hd-v2.png'
    };
  }

  function selectedStylePrompt() {
    const styles = {
      'Storybook watercolor': 'premium luminous watercolor storybook illustration',
      'Graphic novel': 'polished graphic-novel illustration with clean readable staging',
      'Block world': 'original colorful voxel block-world story art with cubic environments and friendly block-built characters',
      'Cyber future': 'ultra-modern optimistic future-world cinematic concept art with luminous architecture, floating transit, sky gardens, and child-friendly wonder',
      'Cinematic fantasy': 'high-end family-friendly cinematic blockbuster key art with epic scale, sophisticated production design, photorealistic depth, dramatic golden-and-teal theatrical lighting, volumetric atmosphere, and a clear adventurous focal point',
      'Real-life story': 'photorealistic, family-friendly cinematic story scene that preserves the exact people in the approved personal photo'
    };
    return styles[state.selectedStyle] || 'premium child-friendly story illustration';
  }

  function uploadedReferenceUrls() {
    const urls = state.referenceImages.map(function (item) { return item.dataUrl; }).filter(Boolean);
    if (urls.length) return urls;
    return [state.characterImageUrl || state.imageUrl].filter(Boolean);
  }

  function uploadedReferencePreview() {
    const urls = uploadedReferenceUrls();
    if (!urls.length) return '<div class="real-life-example"><img src="assets/real-life-block-world-poster-v1.jpg" alt="Two real children entering a cinematic block-built fantasy world" /><b>Movie-style example</b></div>';
    return '<div class="real-life-photo-grid count-' + Math.min(3, urls.length) + '">' + urls.map(function (url, index) {
      return '<img src="' + escapeHtml(url) + '" alt="Uploaded protagonist ' + (index + 1) + '" />';
    }).join('') + '</div>';
  }

  async function ensurePersonalPhotoConsent(consentPanel) {
    if (state.personalPhotoConsentId && state.projectId) return state.personalPhotoConsentId;
    await saveProject({ personalPhotoDraft: true });
    const adultName = consentPanel.querySelector('[data-photo-adult-name]').value.trim();
    const relationship = consentPanel.querySelector('[data-photo-relationship]').value;
    const consentResult = await apiJson('/api/projects/' + encodeURIComponent(state.projectId) + '/photo-consent', {
      method: 'POST',
      body: JSON.stringify({
        confirmedAdult: true,
        approvedPrivateMedia: true,
        approvedPersonalPhoto: true,
        acknowledgedRegionalProcessing: true,
        guardianName: adultName,
        relationship: relationship
      })
    });
    state.personalPhotoConsentId = consentResult.consent.id;
    return state.personalPhotoConsentId;
  }

  async function generateStoryPicture(consentPanel) {
    await saveProject({ pictureGenerationRequested: true });
    const guestPersonalPhotoHeld = !hasAccount() && state.uploadContainsRealPerson;
    const identityReferences = guestPersonalPhotoHeld ? [] : uploadedReferenceUrls().slice(0, 3);
    const firstPageAnchor = state.bookScenes[0]?.imageUrl || '';
    const referenceImages = identityReferences.slice();
    if (firstPageAnchor && referenceImages.length < 3 && !referenceImages.includes(firstPageAnchor)) referenceImages.push(firstPageAnchor);
    const needsPersonalPhotoConsent = referenceImages.length > 0 && (state.selectedStyle === 'Real-life story' || state.uploadContainsRealPerson);
    const consentId = needsPersonalPhotoConsent ? await ensurePersonalPhotoConsent(consentPanel) : '';
    const visualDirection = guestPersonalPhotoHeld
      ? 'family-friendly cinematic story art based only on the child’s words; do not reproduce or infer the identity in the held private photo'
      : selectedStylePrompt();
    const storyPrompt = [
      'Create one finished square story scene from the child’s own writing.',
      'Story: ' + state.revisedScene,
      'Visual direction: ' + visualDirection + '.',
      state.bookScenes.length ? 'This is Page ' + (state.bookScenes.length + 1) + ' of the same story. Keep the exact same recurring characters, clothing, proportions, visual style, color language, and world design established on Page 1.' : '',
      state.bookScenes.length && firstPageAnchor ? 'The final attached image is the approved Page 1 world-and-style anchor. Match its visual continuity while illustrating the new action.' : '',
      state.answers[1] ? 'Locked character description from the child: ' + state.answers[1] : '',
      state.pictureChangeRequest ? 'Change only this requested detail: ' + state.pictureChangeRequest + '.' : '',
      identityReferences.length ? 'Use the first ' + identityReferences.length + ' attached approved identity reference ' + (identityReferences.length === 1 ? 'image' : 'images') + '. Each identity reference is a separate protagonist. Preserve each person’s own face, age, skin tone, hairstyle, clothing, and body proportions. Keep the identities separate: do not blend or swap faces, do not omit anyone, and do not add extra people.' : '',
      'Do not add text, captions, logos, watermarks, UI, arrows, or play icons.'
    ].filter(Boolean).join('\n');
    const result = await apiJson('/api/generate-image', {
      method: 'POST',
      headers: { 'Idempotency-Key': 'solo-' + Date.now() + '-' + Math.random().toString(36).slice(2) },
      body: JSON.stringify({
        projectId: state.projectId || 'solo-preview',
        partId: 'page-' + (state.bookScenes.length + 1),
        submissionId: 'solo-' + Date.now(),
        prompt: storyPrompt,
        studentWriting: state.revisedScene,
        style: visualDirection,
        aspectRatio: '1:1',
        referenceImageUrls: referenceImages,
        personalPhoto: needsPersonalPhotoConsent,
        personalPhotoConsentId: consentId
      })
    });
    if (!result.imageUrl) throw new Error('Yu finished drawing, but the new picture did not arrive. Please try again.');
    state.resultImage = result.imageUrl;
    updatePictureAllowance(result.wallet || state.wallet);
    await saveProject({ pictureGenerated: true });
    return result.imageUrl;
  }

  function setJourney(active) {
    const order = ['idea', 'ask', 'polish', 'picture'];
    document.querySelectorAll('[data-step-dot]').forEach(function (dot) {
      const index = order.indexOf(dot.dataset.stepDot);
      const current = order.indexOf(active);
      dot.classList.toggle('is-active', index === current);
      dot.classList.toggle('is-done', index < current);
      if (index < current) dot.querySelector('span').textContent = '✓';
    });
  }

  function setComposer(label, placeholder, buttonText) {
    hint.textContent = label;
    input.placeholder = placeholder;
    sendLabel.textContent = buttonText || 'Next';
    input.value = '';
    input.focus({ preventScroll: true });
  }

  function setLearning(skill, evidence, note) {
    const card = document.querySelector('[data-learning="' + skill + '"]');
    if (card && !card.classList.contains('is-earned')) {
      card.classList.add('is-earned');
      card.querySelector('span').textContent = '✓';
    }
    const total = document.querySelectorAll('.learning-list .is-earned').length;
    learningCount.textContent = String(total);
    document.querySelector('.learning-ring').style.setProperty('--progress', Math.min(360, total * 72) + 'deg');
    parentEvidence.textContent = '“' + evidence + '”';
    parentNote.textContent = note;
  }

  function addStars(points) {
    state.stars += points;
    starCount.textContent = String(state.stars);
    const pill = starCount.closest('.star-pill');
    pill.classList.add('is-earning');
    setTimeout(function () { pill.classList.remove('is-earning'); }, 420);
  }

  function reward(title, copy, points) {
    addStars(points || 0);
    const pop = document.createElement('div');
    pop.className = 'learning-pop';
    pop.innerHTML = '<span>✦</span><div><strong>' + title + ' unlocked! +' + (points || 0) + ' ★</strong><small>' + copy + '</small></div>';
    thread.appendChild(pop);
    pop.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  function voiceProfile(mood) {
    const profiles = {
      theatrical: { rate: .94, pitch: 1.02 },
      question: { rate: .91, pitch: 1.04 },
      story: { rate: .88, pitch: .98 },
      lesson: { rate: .84, pitch: .95 },
      celebration: { rate: .98, pitch: 1.05 }
    };
    return profiles[mood] || profiles.theatrical;
  }

  function performanceChunks(text) {
    const chunks = String(text || '').match(/[^.!?。！？]+[.!?。！？]?/g) || [];
    return chunks.map(function (chunk) { return chunk.trim(); }).filter(Boolean).slice(0, 6);
  }

  function speakText(text, mood) {
    if (!('speechSynthesis' in window)) {
      showToast('Voice will play on supported devices.');
      return;
    }
    window.speechSynthesis.cancel();
    const chosenMood = mood || state.voiceMood || 'theatrical';
    const chunks = performanceChunks(text);
    const spokenChunks = chunks.length ? chunks : [String(text || '')];
    hear.classList.add('is-performing');
    spokenChunks.forEach(function (chunk, index) {
      const utterance = new SpeechSynthesisUtterance(chunk);
      if (window.StoriesLensNaturalVoice) {
        window.StoriesLensNaturalVoice.configureUtterance(utterance, 'en-US', chosenMood);
      } else {
        const profile = voiceProfile(chosenMood);
        utterance.lang = 'en-US';
        utterance.rate = profile.rate;
        utterance.pitch = profile.pitch;
        const voices = window.speechSynthesis.getVoices();
        utterance.voice = voices.find(function (voice) { return /Natural|Neural|Premium|Enhanced|Andrew|Brian|Daniel|Arthur|Aaron|Guy|Ryan|Male/i.test(voice.name + ' ' + voice.voiceURI) && /^en/i.test(voice.lang); }) || voices.find(function (voice) { return /^en/i.test(voice.lang); }) || null;
      }
      if (index === spokenChunks.length - 1) {
        utterance.onend = utterance.onerror = function () { hear.classList.remove('is-performing'); };
      }
      window.speechSynthesis.speak(utterance);
    });
  }

  function showToast(message) {
    toast.textContent = message;
    toast.hidden = false;
    clearTimeout(showToast.timer);
    showToast.timer = setTimeout(function () { toast.hidden = true; }, 2400);
  }

  function celebrate(anchor) {
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    clearTimeout(celebrate.timer);
    celebration.hidden = false;
    celebration.innerHTML = '';
    const colors = ['#087a54','#f3c767','#d98d73','#9e80bd','#72b6d8'];
    const anchorRect = anchor && typeof anchor.getBoundingClientRect === 'function'
      ? anchor.getBoundingClientRect()
      : null;
    const burstCount = anchorRect ? 28 : 0;
    for (let i = 0; i < 54; i += 1) {
      const bit = document.createElement('i');
      const isBurst = i < burstCount;
      bit.className = 'confetti' + (isBurst ? ' confetti-burst' : '');
      bit.style.background = colors[i % colors.length];
      bit.style.width = (7 + Math.random() * 7) + 'px';
      bit.style.height = (10 + Math.random() * 12) + 'px';
      bit.style.borderRadius = i % 3 === 0 ? '50%' : (i % 3 === 1 ? '2px' : '999px');
      if (isBurst) {
        const startX = anchorRect.left + anchorRect.width * (.08 + Math.random() * .84);
        const startY = anchorRect.top + anchorRect.height * (.28 + Math.random() * .42);
        const direction = startX < anchorRect.left + anchorRect.width / 2 ? -1 : 1;
        const burstX = direction * (70 + Math.random() * 180);
        bit.style.left = startX + 'px';
        bit.style.top = startY + 'px';
        bit.style.animationDelay = Math.random() * .16 + 's';
        bit.style.setProperty('--burst-mid-x', burstX * .58 + 'px');
        bit.style.setProperty('--burst-x', burstX + 'px');
        bit.style.setProperty('--burst-peak', -(70 + Math.random() * 150) + 'px');
        bit.style.setProperty('--burst-fall', (170 + Math.random() * 250) + 'px');
        bit.style.setProperty('--burst-rotate', (direction * (420 + Math.random() * 520)) + 'deg');
      } else {
        bit.style.left = Math.random() * 100 + '%';
        bit.style.animationDelay = Math.random() * .45 + 's';
        bit.style.setProperty('--drift', (Math.random() * 210 - 105) + 'px');
      }
      celebration.appendChild(bit);
    }
    celebrate.timer = setTimeout(function () {
      celebration.hidden = true;
      celebration.innerHTML = '';
    }, 2600);
  }

  function activeStage() {
    return creationStages[state.creationStage] || creationStages['first-book'];
  }

  function setParentStageSnapshot() {
    const maps = {
      'picture-voice': {
        character: ['Character naming', 'Who is in the picture or story?'],
        challenge: ['Place & feeling', 'Where are they, and how does it feel?'],
        sequence: ['Visible action', 'What happens that we can see or hear?'],
        revision: ['Voice confirmation', 'Can the creator hear and approve their words?']
      },
      'first-book': {
        character: ['Who & where', 'Who is here, where are they, and what do they want?'],
        challenge: ['What & why', 'What is hard, and why does it matter?'],
        sequence: ['When & sequence', 'When does it begin, and what happens first?'],
        revision: ['Grammar decision', 'Understands and approves a clearer sentence.']
      },
      'story-builder': {
        character: ['Character motivation', 'What does the protagonist want and why?'],
        challenge: ['Conflict & stakes', 'What blocks the goal, and what may be lost?'],
        sequence: ['Paragraph & dialogue', 'How do action, detail, and dialogue build the scene?'],
        revision: ['Complete revision', 'Improves structure and grammar without losing voice.']
      },
      'author-film': {
        character: ['Point of view & theme', 'Whose story is this, and what question drives it?'],
        challenge: ['Choice & stakes', 'What decision cannot be avoided?'],
        sequence: ['Pacing & staging', 'How do image, sound, action, and dialogue shape the beat?'],
        revision: ['Deep craft revision', 'Refines form, rhythm, and meaning while retaining authorship.']
      }
    };
    const selected = maps[state.creationStage] || maps['first-book'];
    Object.keys(selected).forEach(function (skill) {
      const card = document.querySelector('[data-learning="' + skill + '"]');
      if (!card) return;
      card.querySelector('strong').textContent = selected[skill][0];
      card.querySelector('p').textContent = selected[skill][1];
    });
  }

  function chooseCreationStage(stageId) {
    const stage = creationStages[stageId] || creationStages['first-book'];
    state.creationStage = stageId in creationStages ? stageId : 'first-book';
    state.targetPages = stage.targetPages;
    questions = stage.questions;
    setParentStageSnapshot();
    try { localStorage.setItem('storieslens_creation_stage', state.creationStage); } catch (_error) { /* optional preference */ }
    document.querySelectorAll('[data-creation-stage]').forEach(function (button) {
      const card = button.closest('.creation-stage-card');
      if (card) card.classList.toggle('is-selected', button.dataset.creationStage === state.creationStage);
    });
    composer.hidden = false;
    showGreeting();
    composer.scrollIntoView({ behavior: 'smooth', block: 'end' });
    speakText(stage.title + ' selected. ' + stage.promise, 'celebration');
  }

  function showCreationStageChooser() {
    composer.hidden = true;
    setJourney('idea');
    state.currentPrompt = 'How would you like to create today? Choose pictures and voice, a first book, a bigger story, or an author and film studio.';
    const cards = Object.keys(creationStages).map(function (key) {
      const stage = creationStages[key];
      const recommended = key === 'first-book' ? '<em>RECOMMENDED FIRST</em>' : '';
      return '<article class="creation-stage-card"><button class="creation-stage-select" type="button" data-creation-stage="' + key + '"><span class="creation-stage-icon" aria-hidden="true">' + stage.icon + '</span><span><small>' + stage.ages + '</small><strong>' + stage.title + '</strong><b>' + stage.promise + '</b><i>' + stage.guidance + '</i></span></button><button class="creation-stage-hear" type="button" data-hear-stage="' + key + '" aria-label="Hear Yu explain ' + escapeHtml(stage.title) + '">▶ Hear Yu</button>' + recommended + '</article>';
    }).join('');
    const picker = yuMessage('<small>CHOOSE YOUR CREATION PATH</small><h1>How would you like to tell your story?</h1><p>There is no test. Pick the way that feels fun today—a grown-up can help choose.</p><button class="stage-overview-hear" type="button" data-hear-stage-overview>▶ Hear Yu explain how to choose</button><div class="creation-stage-grid">' + cards + '</div><p class="tiny-note">Age is only a guide. Yu follows the creator’s confidence and can switch paths for the next story.</p>', 'stage-picker');
    picker.querySelector('[data-hear-stage-overview]').addEventListener('click', function () {
      speakText('There is no test, and you cannot choose wrong. Pick pictures and voice for a tiny spoken story, My First Book for a ten page picture book, Story Builder for longer paragraphs, or Author and Film Studio for chapters and movies. You can always choose a different path for your next story.', 'question');
    });
    picker.querySelectorAll('[data-hear-stage]').forEach(function (button) {
      button.addEventListener('click', function () {
        const stage = creationStages[button.dataset.hearStage];
        if (stage) speakText(stage.voiceGuide, 'lesson');
      });
    });
    picker.querySelectorAll('[data-creation-stage]').forEach(function (button) {
      button.addEventListener('click', function () { chooseCreationStage(button.dataset.creationStage); });
    });
  }

  function showGreeting() {
    setJourney('idea');
    const stage = activeStage();
    const accountNote = hasAccount()
      ? '<p class="tiny-note">✓ Signed in · your private story and picture balance will save automatically.</p>'
      : '<p class="tiny-note"><strong>Your first picture is free—no sign-up needed.</strong> Make it first. Create an account only when you want to continue or download it.</p>';
    yuMessage('<small>' + escapeHtml(stage.title.toUpperCase()) + ' · ' + escapeHtml(stage.ages.toUpperCase()) + '</small><h1>Hi! What shall we imagine today?</h1><p>Upload a drawing, photo, or portrait—or tell me one idea. I’ll help you make ' + state.targetPages + ' story ' + (state.outputType === 'film' ? 'scenes' : 'pages') + ' at your pace.</p><p class="stage-guidance-note">' + escapeHtml(stage.guidance) + '</p><p class="tiny-note">You make every story choice. I help you find the words.</p>' + accountNote, 'yu-greeting');
    state.currentPrompt = 'Welcome to ' + stage.title + '. Upload a drawing, photo, or portrait—or tell me one idea. ' + stage.guidance;
    state.voiceMood = 'theatrical';
  }

  function showQuestion(index) {
    const question = questions[index];
    setJourney('ask');
    state.currentPrompt = question.title + ' ' + question.copy + (index === 0 ? ' You can add up to two helpers later.' : '');
    state.voiceMood = 'question';
    yuMessage('<small>QUESTION ' + (index + 1) + ' OF 3</small><h2>' + question.title + '</h2><p>' + question.copy + '</p>' + (index === 0 ? '<p class="tiny-note">Begin with one hero. You can add up to two helpers later—and you can describe, speak, upload a drawing or photo, or make a character picture from your words.</p>' : ''));
    setComposer(index === 0 ? 'Type or speak about your character—or use one of the picture choices below.' : 'Answer any way you like.', question.placeholder, index === 2 ? 'Build my scene' : 'Next');
    characterMaker.hidden = index !== 0;
    quickIdeas.hidden = true;
    setTimeout(function () { speakText(state.currentPrompt, 'question'); }, 360);
  }

  function handleAnswer() {
    const typed = input.value.trim();
    if (state.editMode === 'next-page') {
      if (!typed) {
        showToast('Tell Yu what happens on this page, or hold the green button to speak.');
        input.focus();
        return;
      }
      state.editMode = '';
      state.currentPageOriginal = typed;
      input.value = '';
      composer.hidden = true;
      userMessage(typed, '', 'PAGE ' + (state.bookScenes.length + 1));
      reviewNextPage(typed);
      return;
    }
    if (state.editMode === 'picture-change') {
      if (!typed) {
        showToast('Tell Yu one thing to change, or hold the green button to say it.');
        input.focus();
        return;
      }
      input.value = '';
      state.editMode = '';
      composer.hidden = true;
      userMessage(typed, '', 'ONE PICTURE CHANGE');
      reviewPictureChange(typed);
      return;
    }
    if (state.step === 0) {
      captureName();
      const first = typed || 'A tiny dragon is lost in a giant library.';
      state.answers.push(first);
      userMessage(first, uploadedReferenceUrls());
      reward('Story spark', 'You began with your own idea.', 1);
      input.value = '';
      namePrompt.hidden = true;
      uploadEntry.hidden = true;
      state.step = 1;
      setTimeout(function () { showQuestion(0); }, 300);
      return;
    }
    if (state.step >= 1 && state.step <= 3) {
      const qIndex = state.step - 1;
      const answer = typed || (qIndex === 0 && (state.characterImageUrl || state.imageUrl) ? 'This picture shows who is in my story.' : questions[qIndex].fallback);
      state.answers.push(answer);
      userMessage(answer, qIndex === 0 ? uploadedReferenceUrls() : '');
      setLearning(questions[qIndex].skill, answer, questions[qIndex].reward[1]);
      reward(questions[qIndex].reward[0], questions[qIndex].reward[1], 2);
      input.value = '';
      characterMaker.hidden = true;
      state.step += 1;
      if (state.step <= 3) setTimeout(function () { showQuestion(state.step - 1); }, 520);
      else setTimeout(showRevision, 700);
    }
  }

  async function showRevision() {
    setJourney('polish');
    composer.hidden = true;
    const original = state.answers.slice(0,4).join(' ');
    const checking = yuMessage('<div class="yu-checking" role="status" aria-live="polite"><div class="yu-checking-orbit" aria-hidden="true"><img src="assets/yu-mascot-logo-v2.png" alt="" /></div><div><small>YU IS CHECKING EACH SENTENCE</small><h2>I am checking only the grammar—not changing your story.</h2><p data-yu-checking-status>First, I am reading every sentence carefully…</p><span>Your characters, places, problem, and ideas stay locked.</span></div></div>');
    const checkingStatus = checking.querySelector('[data-yu-checking-status]');
    const checkingSteps = [
      'Now I am finding spelling and punctuation clues…',
      'Now I am checking verbs, pronouns, and sentence order…',
      'Almost ready—I am preparing one explanation for every change…'
    ];
    let checkingStep = 0;
    const checkingTimer = window.setInterval(function () {
      checkingStatus.textContent = checkingSteps[Math.min(checkingStep, checkingSteps.length - 1)];
      checkingStep += 1;
    }, 1500);
    let revision;
    if (state.creationStage === 'picture-voice') {
      revision = {
        text: original,
        reason: 'Yu kept the creator’s spoken words. At this stage, telling the idea matters more than complete grammar.',
        changes: [],
        lesson: { title: 'Stories can begin with your voice', explanation: 'Say who is there, where they are, and what happens. Yu can read your words back so you can decide.', example: original },
        title: original.split(/[.!?。！？\n]/)[0].trim().slice(0, 56) || 'My Story',
        image: state.characterImageUrl || state.imageUrl || 'assets/original-garden-door-hd-v2.png'
      };
    } else {
      try {
        revision = await requestYuRevision(original);
      } catch (error) {
        revision = buildRevision(original);
        showToast('Yu used the safe on-device grammar check this time: ' + error.message);
      }
    }
    window.clearInterval(checkingTimer);
    checking.remove();
    const revised = revision.text;
    const lesson = revision.lesson;
    const changeCount = revision.changes.length;
    state.originalScene = original;
    state.revisedScene = revised;
    state.revisionReason = revision.reason;
    state.storyTitle = revision.title;
    state.resultImage = state.characterImageUrl || state.imageUrl || revision.image;
    state.currentPrompt = 'Listen to your first scene. I kept every idea and only fixed grammar. I listed every correction and can explain them one by one. Is this still what you meant?';
    const revisionIntro = state.creationStage === 'picture-voice'
      ? '<p>I kept your spoken words. At this stage, sharing the idea matters more than perfect grammar.</p><p class="grammar-change-count">✓ Listen and tell Yu whether this is what you meant.</p>'
      : '<p>I did not rewrite it. I only fixed the grammar, spelling, capitals, and punctuation.</p><p class="grammar-change-count">✓ Yu found ' + changeCount + ' grammar ' + (changeCount === 1 ? 'change' : 'changes') + (changeCount ? ' and explains every one below.' : '. Your grammar is already clear.') + '</p>';
    const suggestionLabel = state.creationStage === 'picture-voice' ? 'YU READS YOUR WORDS BACK' : 'YU’S GRAMMAR-ONLY VERSION';
    const lessonHeading = state.creationStage === 'picture-voice' ? 'VOICE &amp; STORY TIP' : 'START HERE · FIRST GRAMMAR POINT';
    yuMessage('<small>YOUR FIRST SCENE</small><h2>Your story is still your story.</h2>' + revisionIntro +
      '<div class="revision-card">' +
        '<div class="revision-section"><small>YOU SAID</small><blockquote>' + escapeHtml(original) + '</blockquote></div>' +
        '<div class="revision-section suggestion"><small>' + suggestionLabel + '</small><blockquote>' + escapeHtml(revised) + '</blockquote><button class="why-button" type="button" data-why>▼ ' + (state.creationStage === 'picture-voice' ? 'Why Yu kept my words' : 'All grammar changes · explained one by one') + '</button><div class="grammar-change-panel" data-why-copy><p>' + escapeHtml(revision.reason) + '</p>' + (changeCount ? '<ol>' + revision.changes.map(function (change, index) { return '<li><b class="grammar-change-number">' + (index + 1) + '</b><strong>' + escapeHtml(change.before) + ' → ' + escapeHtml(change.after) + '</strong><span><b>' + escapeHtml(change.skill) + '</b>: ' + escapeHtml(change.explanation) + '</span><button type="button" data-hear-change="' + index + '">▶ Hear Yu explain #' + (index + 1) + '</button></li>'; }).join('') + '</ol>' : '<div class="grammar-all-clear">✓ Yu kept the meaning and the creator’s own voice.</div>') + '</div></div>' +
        '<div class="yu-grammar-lesson"><div class="yu-lesson-heading"><span aria-hidden="true">✦</span><div><small>' + lessonHeading + '</small><h3>' + escapeHtml(lesson.title) + '</h3></div></div><p>' + escapeHtml(lesson.explanation) + '</p><blockquote>' + escapeHtml(lesson.example) + '</blockquote><button type="button" data-hear-grammar>▶ Hear Yu teach this first point</button></div>' +
        '<div class="revision-actions"><button class="change-button" type="button" data-revise-change>Let me change it</button><button class="keep-button" type="button" data-revise-keep>Yes—that is my story</button></div>' +
      '</div>');
    state.voiceMood = 'story';
    setTimeout(function () { speakText('Listen to your first scene. ' + revised + ' Is this what you mean?', 'story'); }, 450);
    const latest = thread.lastElementChild;
    latest.querySelector('[data-why]').addEventListener('click', function () {
      const whyCopy = latest.querySelector('[data-why-copy]');
      whyCopy.hidden = !whyCopy.hidden;
      latest.querySelector('[data-why]').textContent = whyCopy.hidden ? '▶ Show every grammar change' : '▼ Hide grammar changes';
      if (!whyCopy.hidden) speakText(revision.reason, 'lesson');
    });
    latest.querySelectorAll('[data-hear-change]').forEach(function (button) {
      button.addEventListener('click', function () {
        const index = Number(button.dataset.hearChange);
        const change = revision.changes[index];
        if (!change) return;
        speakText('Grammar change ' + (index + 1) + '. ' + change.before + ' becomes ' + change.after + '. ' + change.skill + '. ' + change.explanation, 'lesson');
      });
    });
    latest.querySelector('[data-hear-grammar]').addEventListener('click', function () {
      speakText('Yu’s grammar tip. ' + lesson.title + '. ' + lesson.explanation + ' Try it with your sentence: ' + lesson.example, 'lesson');
    });
    latest.querySelector('[data-revise-change]').addEventListener('click', function () {
      composer.hidden = false;
      input.value = revised;
      setComposer('Change any words you want. Yu will never lock your sentence.', revised, 'Use my version');
      showToast('Your story stays editable.');
    });
    latest.querySelector('[data-revise-keep]').addEventListener('click', function () {
      finishRevision(revised);
    });
  }

  async function reviewNextPage(original) {
    const pageNumber = state.bookScenes.length + 1;
    const checking = yuMessage('<div class="yu-checking" role="status" aria-live="polite"><div class="yu-checking-orbit" aria-hidden="true"><img src="assets/yu-mascot-logo-v2.png" alt="" /></div><div><small>YU IS CHECKING PAGE ' + pageNumber + '</small><h2>Your story facts stay exactly the same.</h2><p>Checking grammar and making sure this page follows the last one…</p><span>' + escapeHtml(activeStage().guidance) + '</span></div></div>');
    let revision;
    if (state.creationStage === 'picture-voice') {
      revision = {
        text: original,
        reason: 'Yu kept the creator’s spoken words.',
        changes: [],
        lesson: { title: 'One clear story action', explanation: 'A page can show one thing happening.', example: original }
      };
    } else {
      try {
        revision = await requestYuRevision(original);
      } catch (error) {
        revision = buildRevision(original);
        showToast('Yu used the safe on-device grammar check this time.');
      }
    }
    checking.remove();
    state.currentPageDraft = revision.text;
    const changeCount = revision.changes.length;
    state.currentPrompt = 'I kept your idea and checked page ' + pageNumber + '. Listen, then choose whether it still sounds like you.';
    const review = yuMessage('<small>PAGE ' + pageNumber + ' · YU’S CHECK</small><h2>Does this still sound like your story?</h2><div class="revision-card compact"><div class="revision-section"><small>YOU SAID</small><blockquote>' + escapeHtml(original) + '</blockquote></div><div class="revision-section suggestion"><small>GRAMMAR-CHECKED VERSION</small><blockquote>' + escapeHtml(revision.text) + '</blockquote></div>' + (changeCount ? '<details class="page-grammar-details"><summary>' + changeCount + ' grammar ' + (changeCount === 1 ? 'change' : 'changes') + ' · explained</summary><ol>' + revision.changes.map(function (change, index) { return '<li><b>' + (index + 1) + '. ' + escapeHtml(change.skill) + '</b><span>' + escapeHtml(change.before) + ' → ' + escapeHtml(change.after) + '</span><p>' + escapeHtml(change.explanation) + '</p></li>'; }).join('') + '</ol></details>' : '<p class="grammar-all-clear">✓ Yu found no grammar errors on this page.</p>') + '<div class="revision-actions"><button class="change-button" type="button" data-page-change>Let me change it</button><button class="keep-button" type="button" data-page-keep>Yes—make Page ' + pageNumber + '</button></div></div>');
    review.querySelector('[data-page-change]').addEventListener('click', function () {
      state.editMode = 'next-page';
      composer.hidden = false;
      setComposer('Change any words you want.', revision.text, 'Check my page');
      input.value = revision.text;
      input.focus();
    });
    review.querySelector('[data-page-keep]').addEventListener('click', function () {
      state.originalScene = original;
      state.revisedScene = revision.text;
      state.revisionReason = revision.reason;
      state.pictureChangeRequest = '';
      composer.hidden = true;
      showDrawing(state.pictureConsentPanel, null, null);
    });
    setTimeout(function () { speakText('Page ' + pageNumber + '. ' + revision.text + ' Does this still sound like your story?', 'story'); }, 320);
  }

  function cleanSentence(text) {
    let sentence = String(text || '').replace(/\s+/g, ' ').trim();
    if (!sentence) return '';
    sentence = sentence.charAt(0).toUpperCase() + sentence.slice(1);
    sentence = sentence
      .replace(/\bi\b/g, 'I')
      .replace(/\bcant\b/gi, "can't")
      .replace(/\bancient egypt\b/gi, 'ancient Egypt')
      .replace(/\bmetropolitan museum\b/gi, 'Metropolitan Museum')
      .replace(/\bnew york city\b/gi, 'New York City');
    if (!/[.!?…]$/.test(sentence)) sentence += '.';
    return sentence;
  }

  function buildRevision(original) {
    const lower = original.toLowerCase();
    if (lower.includes('ancient egypt') && lower.includes('metropolitan museum')) {
      return {
        text: "I am travelling back to ancient Egypt. My mom, my brother Leo, and I can't find our way back. We are touring the Metropolitan Museum in New York City.",
        reason: "I kept every person, place, action, and problem from your original. I did not add a new plot or change the tense.",
        changes: [
          { before: 'i', after: 'I', skill: 'Capital letter', explanation: 'The word “I” is always a capital letter.' },
          { before: 'the ancient egypt time', after: 'ancient Egypt', skill: 'Proper noun and article', explanation: '“Egypt” is a place name, so it needs a capital letter; we do not need “the” here.' },
          { before: 'My mom and me and my brother Leo we', after: 'My mom, my brother Leo, and I', skill: 'Pronoun and subject', explanation: 'When you are part of the group doing the action, use “I,” and say the subject only once.' },
          { before: 'cant', after: "can't", skill: 'Apostrophe', explanation: 'The apostrophe shows that “cannot” has been shortened.' },
          { before: 'metropolitan museum in New York city', after: 'Metropolitan Museum in New York City', skill: 'Capital letters', explanation: 'Names of a museum and a city begin with capital letters.' },
          { before: 'one long line', after: 'three sentences', skill: 'Sentence punctuation', explanation: 'Full stops help the reader hear where each complete idea ends.' }
        ],
        lesson: {
          title: 'Use “I” when you are doing the action',
          explanation: '“Me” is used when something happens to you. “I” is used when you are one of the people doing the action.',
          example: 'My mom, my brother Leo, and I can’t find our way back.'
        },
        title: 'Lost in Ancient Egypt',
        image: 'assets/outcome-film-hd-v2.png'
      };
    }
    const sourceSentences = state.currentPageOriginal === original
      ? String(original).split(/(?<=[.!?。！？])\s+/).filter(Boolean)
      : state.answers.slice(0,4);
    const sentences = sourceSentences.map(cleanSentence).filter(Boolean);
    const revised = sentences.join(' ');
    const first = sentences[0] || 'My story begins';
    return {
      text: revised,
      reason: 'I kept every story idea exactly as you gave it. I only checked sentence beginnings and endings.',
      changes: revised === original ? [] : [
        { before: 'your original sentence', after: 'the same sentence with a clear beginning and ending', skill: 'Capital letters and punctuation', explanation: 'A sentence begins with a capital letter and ends with a full stop, question mark, or exclamation mark.' }
      ],
      lesson: {
        title: 'Give every sentence a beginning and an ending',
        explanation: 'Begin with a capital letter. At the end, choose a full stop, question mark, or exclamation mark so the reader knows how your voice sounds.',
        example: revised || original
      },
      title: first.replace(/[.!?…]$/, '').slice(0,56),
      image: lower.includes('time') || lower.includes('travel') ? 'assets/outcome-film-hd-v2.png' : 'assets/original-garden-door-hd-v2.png'
    };
  }

  async function finishRevision(revised) {
    state.readingConfirmed = true;
    setLearning('revision', revised, creatorLabel() + ' compared the original wording with a clearer version and confirmed the meaning.');
    reward('Story editor', 'You checked that the clearer sentence still means what you wanted.', 3);
    try {
      await saveProject({ mentorRevisionCompleted: true, readingConfirmed: true });
      if (hasAccount()) {
        const gift = await apiJson('/api/credits/unlock-learning-gift', {
          method: 'POST',
          body: JSON.stringify({ projectId: state.projectId })
        });
        updatePictureAllowance(gift.wallet || state.wallet);
      }
    } catch (error) {
      showToast('Your scene is kept privately. Yu will retry the save before drawing.');
    }
    celebrate();
    showToast(state.betaUnlimitedCreation ? 'Surprise! Your founder beta picture access is unlimited.' : 'Surprise! Your careful revision is complete. Your picture balance is now ' + state.imageCredits + '.');
    setTimeout(showStyles, 900);
  }

  function showStyles() {
    setJourney('picture');
    composer.hidden = true;
    state.currentPrompt = 'First choose what you want to make: an illustrated book or a story film. Then choose how your story world should look.';
    state.voiceMood = 'theatrical';
    const realLifePreview = uploadedReferencePreview();
    const referenceCount = uploadedReferenceUrls().length;
    const message = yuMessage('<small>PICTURE SURPRISE</small><h2>What shall your story become?</h2><p>Choose a book or a film first. Then pick the look of your story world.</p>' +
      '<div class="output-choice-grid" role="group" aria-label="Choose a book or film">' +
        '<button class="output-choice" type="button" data-output-type="book"><img src="assets/storybook-image.png" alt="An illustrated storybook" /><span><strong>Illustrated book</strong><small>Pages to read and print</small></span></button>' +
        '<button class="output-choice" type="button" data-output-type="film"><img src="assets/outcome-film-hd-v2.png" alt="A cinematic story film" /><span><strong>Story film</strong><small>Scenes that can move and speak</small></span></button>' +
      '</div>' +
      '<section class="style-choice-stage" data-style-stage hidden><div class="style-choice-heading"><small>STEP 2</small><h3 data-style-title>Choose a picture style</h3><p>Tap a reference picture. Your characters and story stay the same.</p></div>' +
      '<div class="style-grid" role="group" aria-label="Picture styles">' +
        '<button class="style-card" type="button" data-style="Storybook watercolor"><img src="assets/portal-solo-watercolor-v4.jpg" alt="Soft storybook watercolor example" /><span><b>Watercolor</b><small>Soft painted storybook</small></span></button>' +
        '<button class="style-card" type="button" data-style="Graphic novel"><img src="assets/outcome-comic-hd-v2.png" alt="Graphic novel example" /><span><b>Comic</b><small>Bold panels and ink</small></span></button>' +
        '<button class="style-card" type="button" data-style="Block world"><img src="assets/showcase-block-castle.png" alt="A colorful block-built adventure world" /><span><b>Block world</b><small>Colorful cubic adventure</small></span></button>' +
        '<button class="style-card" type="button" data-style="Cyber future"><img src="assets/style-cyber-future-ultramodern-v1.png" alt="An ultra-modern future city with floating transit, luminous towers, and sky gardens" /><span><b>Future world</b><small>Ultra-modern city adventure</small></span></button>' +
        '<button class="style-card" type="button" data-style="Cinematic fantasy"><img src="assets/style-movie-magic-blockbuster-v2.webp" alt="Epic family blockbuster adventure with a glowing time portal" /><span><b>Blockbuster</b><small>Big-screen cinematic adventure</small></span></button>' +
        '<button class="style-card real-life-style" type="button" data-style="Real-life story" data-real-life="true" aria-disabled="false">' + realLifePreview + '<span><b>Real-life story</b><small>' + (state.userUploadedReference ? 'Uses all ' + referenceCount + ' uploaded ' + (referenceCount === 1 ? 'character' : 'characters') : 'Tap to upload 1–3 characters') + '</small></span></button>' +
      '</div>' +
      '<div class="style-photo-upload"><div><strong>Want the real people in your story?</strong><small data-style-upload-note>' + (state.userUploadedReference ? referenceCount + ' character ' + (referenceCount === 1 ? 'photo is' : 'photos are') + ' ready. You can replace them here.' : 'Upload 1–3 photos here, then Yu will select Real-life story for you.') + '</small></div><button type="button" data-style-upload>＋ ' + (state.userUploadedReference ? 'Replace character photos' : 'Upload character photos') + '</button></div>' +
      '<section class="real-life-consent" data-real-life-consent hidden><div><small>GROWN-UP PERMISSION · COMPLETE HERE</small><h3>Use a real-person photo in this story</h3><p>No handwritten signature is needed. Type the adult’s name, choose their relationship, and tick both permission boxes below. <span data-consent-photo-summary>The prepared photos are sent only when you press the green create button.</span> They stay private and can be permanently deleted with the project.</p></div><label><span>1 · Adult name</span><input type="text" maxlength="100" autocomplete="name" data-photo-adult-name placeholder="Type the parent, guardian, or pictured adult’s name" /></label><label><span>2 · Relationship</span><select data-photo-relationship><option value="">Choose one</option><option value="Self">I am the adult pictured</option><option value="Parent">Parent</option><option value="Legal guardian">Legal guardian</option></select></label><label class="consent-check"><input type="checkbox" data-photo-permission /><span>3 · I am 18 or older and I am pictured or have permission for every person shown from their parent/legal guardian.</span></label><label class="consent-check"><input type="checkbox" data-photo-processing /><span>4 · I agree that these prepared copies may be processed by the regional image model to create this private story scene.</span></label></section>' +
      '<button class="make-picture-button" type="button" data-make-picture disabled>Choose a style first</button>' +
      '<section class="picture-reveal-slot" data-picture-reveal hidden aria-live="polite"></section></section>');
    const styleStage = message.querySelector('[data-style-stage]');
    const makeButton = message.querySelector('[data-make-picture]');
    const consentPanel = message.querySelector('[data-real-life-consent]');
    const revealSlot = message.querySelector('[data-picture-reveal]');
    const realLifeCard = message.querySelector('[data-real-life]');
    const styleUploadButton = message.querySelector('[data-style-upload]');
    const styleUploadNote = message.querySelector('[data-style-upload-note]');
    const consentPhotoSummary = message.querySelector('[data-consent-photo-summary]');
    let selectRealLifeAfterUpload = false;
    function personalPhotoConsentRequired() {
      return hasAccount()
        && uploadedReferenceUrls().length > 0
        && (state.uploadContainsRealPerson || state.selectedStyle === 'Real-life story');
    }
    function personalPhotoConsentReady() {
      if (!personalPhotoConsentRequired()) return true;
      return Boolean(consentPanel.querySelector('[data-photo-adult-name]').value.trim())
        && Boolean(consentPanel.querySelector('[data-photo-relationship]').value)
        && consentPanel.querySelector('[data-photo-permission]').checked
        && consentPanel.querySelector('[data-photo-processing]').checked;
    }
    function refreshMakeButton() {
      if (!state.selectedStyle) {
        makeButton.disabled = true;
        makeButton.textContent = 'Choose a style first';
        return;
      }
      makeButton.disabled = !personalPhotoConsentReady();
      if (personalPhotoConsentRequired() && !personalPhotoConsentReady()) {
        makeButton.textContent = 'Complete the grown-up permission above';
        return;
      }
      makeButton.textContent = state.selectedStyle === 'Real-life story'
        ? (state.outputType === 'film' ? '✦ Put me in my first movie frame' : '✦ Put me in my story picture')
        : (state.outputType === 'film' ? '✦ Make my free first movie frame' : '✦ Make my free first picture · no sign-up');
    }
    message.querySelectorAll('[data-output-type]').forEach(function (card) {
      card.addEventListener('click', function () {
        message.querySelectorAll('[data-output-type]').forEach(function (item) { item.classList.remove('is-selected'); });
        card.classList.add('is-selected');
        state.outputType = card.dataset.outputType;
        state.selectedStyle = '';
        consentPanel.hidden = true;
        message.querySelectorAll('[data-style]').forEach(function (item) { item.classList.remove('is-selected'); });
        styleStage.hidden = false;
        message.querySelector('[data-style-title]').textContent = state.outputType === 'film' ? 'Choose the look of your film' : 'Choose the look of your book';
        makeButton.disabled = true;
        makeButton.textContent = 'Choose a style first';
        speakText(state.outputType === 'film' ? 'Story film selected! Now choose its visual style.' : 'Illustrated book selected! Now choose its picture style.', 'celebration');
        styleStage.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      });
    });
    function selectStyleCard(card) {
        if (card.dataset.realLife === 'true' && !state.userUploadedReference) {
          selectRealLifeAfterUpload = true;
          showToast('Choose 1–3 character photos. Yu will return you to Real-life story when they are ready.');
          upload.click();
          return;
        }
        message.querySelectorAll('[data-style]').forEach(function (item) { item.classList.remove('is-selected'); });
        card.classList.add('is-selected');
        state.selectedStyle = card.dataset.style;
        consentPanel.hidden = !personalPhotoConsentRequired();
        refreshMakeButton();
        if (!consentPanel.hidden) consentPanel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        speakText(card.dataset.style + ' selected!', 'celebration');
    }
    message.querySelectorAll('[data-style]').forEach(function (card) {
      card.addEventListener('click', function () { selectStyleCard(card); });
    });
    styleUploadButton.addEventListener('click', function () {
      selectRealLifeAfterUpload = true;
      upload.click();
    });
    state.refreshStyleReferenceChoice = function () {
      const urls = uploadedReferenceUrls();
      const count = urls.length;
      realLifeCard.setAttribute('aria-disabled', count ? 'false' : 'true');
      realLifeCard.innerHTML = uploadedReferencePreview() + '<span><b>Real-life story</b><small>' + (count ? 'Uses all ' + count + ' uploaded ' + (count === 1 ? 'character' : 'characters') : 'Upload 1–3 characters first') + '</small></span>';
      styleUploadButton.textContent = count ? '＋ Replace character photos' : '＋ Upload character photos';
      styleUploadNote.textContent = count ? count + ' character ' + (count === 1 ? 'photo is' : 'photos are') + ' ready. You can replace them here.' : 'Upload 1–3 photos here, then Yu will select Real-life story for you.';
      consentPhotoSummary.textContent = count === 1
        ? 'The prepared photo is sent only when you press the green create button.'
        : 'The ' + count + ' prepared photos are sent only when you press the green create button.';
      if (count && selectRealLifeAfterUpload) {
        selectRealLifeAfterUpload = false;
        selectStyleCard(realLifeCard);
      }
    };
    consentPanel.querySelectorAll('input,select').forEach(function (field) {
      field.addEventListener('input', refreshMakeButton);
      field.addEventListener('change', refreshMakeButton);
    });
    makeButton.addEventListener('click', function () {
      makeButton.disabled = true;
      makeButton.textContent = '✦ Yu is making your free picture…';
      showDrawing(consentPanel, revealSlot, makeButton);
    });
  }

  async function showDrawing(consentPanel, revealSlot, makeButton) {
    state.pictureConsentPanel = consentPanel || state.pictureConsentPanel;
    if (makeButton) {
      makeButton.disabled = true;
      makeButton.textContent = '✦ Yu is making your free picture…';
    }
    const hasReference = uploadedReferenceUrls().length > 0;
    const guestPersonalPhotoHeld = !hasAccount() && state.uploadContainsRealPerson;
    const realLifeMode = state.selectedStyle === 'Real-life story';
    const referenceNotice = guestPersonalPhotoHeld
      ? '<div class="reference-lock-note is-words"><span>✦</span><div><strong>Your first free picture uses your story words</strong><small>Your real-person photo stays private. After a grown-up creates the account, Yu can use it with consent and permanent-delete controls.</small></div></div>'
      : realLifeMode
      ? '<div class="reference-lock-note"><span>✓</span><div><strong>Real-life version uses your uploaded photo</strong><small>Yu keeps the same face, age, hairstyle, clothes, and number of people while placing them inside the story scene.</small></div></div>'
      : (hasReference ? '<div class="reference-lock-note"><span>✓</span><div><strong>Your uploaded picture is the main reference</strong><small>Yu keeps the same person or character identity and changes only the story scene and chosen style.</small></div></div>' : '<div class="reference-lock-note is-words"><span>✦</span><div><strong>Building from your words</strong><small>No picture was uploaded, so Yu follows the character details you described.</small></div></div>');
    const changeNotice = state.pictureChangeRequest ? '<div class="change-lock-note"><strong>Changing only:</strong> “' + escapeHtml(state.pictureChangeRequest) + '”<small>Everything else stays locked.</small></div>' : '';
    const pageNumber = state.bookScenes.length + 1;
    const drawingMarkup = '<div class="inline-drawing"><small>PAGE ' + pageNumber + ' OF ' + state.targetPages + ' · YU IS CREATING WITH YOUR WORDS</small><h2>Watch your ' + (pageNumber === 1 ? 'first ' : 'next ') + (state.outputType === 'film' ? 'movie frame' : 'story picture') + ' appear…</h2><p class="tiny-note">Format: ' + escapeHtml(state.outputType === 'film' ? 'Story film' : 'Illustrated book') + ' · Style: ' + escapeHtml(state.selectedStyle) + '</p>' + referenceNotice + changeNotice + '<div class="drawing-stage"><img src="' + escapeHtml(state.resultImage) + '" alt="A picture forming from the creator’s story" /><span class="wand">✦</span></div><div class="drawing-status"><div class="progress-track"><i data-draw-progress></i></div><b data-draw-title>' + (state.pictureChangeRequest ? 'Changing only the detail you named' : 'Keeping your characters and story details') + '</b><span data-draw-subtitle>Stay right here—the surprise will appear below this button.</span></div></div>';
    let drawing;
    if (revealSlot) {
      revealSlot.hidden = false;
      revealSlot.className = 'picture-reveal-slot is-drawing';
      revealSlot.innerHTML = drawingMarkup;
      drawing = revealSlot;
      window.requestAnimationFrame(function () { revealSlot.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); });
    } else {
      drawing = yuMessage(drawingMarkup, 'drawing-card');
    }
    const progress = drawing.querySelector('[data-draw-progress]');
    const title = drawing.querySelector('[data-draw-title]');
    const stages = [
      [34, 'Building the place from your words'],
      [62, 'Adding the people and story problem'],
      [86, 'Painting the last little details']
    ];
    let stageIndex = 0;
    const progressTimer = setInterval(function () {
      if (stageIndex < stages.length) {
        const stage = stages[stageIndex];
        progress.style.width = stage[0] + '%';
        title.textContent = stage[1];
        stageIndex += 1;
      }
    }, 900);
    try {
      await generateStoryPicture(state.pictureConsentPanel);
      clearInterval(progressTimer);
      progress.style.width = '100%';
      title.textContent = 'Your picture is ready!';
      setTimeout(function () { showResult(drawing, makeButton); }, 220);
    } catch (error) {
      clearInterval(progressTimer);
      const message = error.code === 'PERSONAL_PHOTO_CONSENT_REQUIRED'
        ? 'A grown-up needs to confirm the private photo permission again.'
        : error.message;
      const signIn = error.code === 'AUTH_REQUIRED' || error.status === 401
        ? '<a class="why-button" href="login.html?returnTo=%2Fsolo-story">Sign in to save &amp; create</a>'
        : '';
      const errorMarkup = '<div class="inline-picture-error"><small>YU KEPT YOUR WORK SAFE</small><h2>The new picture was not charged.</h2><p>' + escapeHtml(message) + '</p>' + signIn + '<button class="why-button" type="button" data-picture-retry>Try my free picture again</button></div>';
      if (revealSlot) {
        revealSlot.className = 'picture-reveal-slot has-error';
        revealSlot.innerHTML = errorMarkup;
      } else {
        drawing.remove();
        yuMessage(errorMarkup);
      }
      if (makeButton) {
        makeButton.disabled = false;
        makeButton.textContent = state.outputType === 'film' ? '✦ Make my first movie frame' : '✦ Make my free first picture';
      }
      showToast(message);
      const retry = (revealSlot || thread.lastElementChild).querySelector('[data-picture-retry]');
      if (retry) retry.addEventListener('click', function () { showDrawing(state.pictureConsentPanel, revealSlot, makeButton); });
    }
  }

  function preserveGuestCreation(action) {
    try {
      localStorage.setItem('storieslens_pending_guest_creation', JSON.stringify({
        action,
        projectId: state.projectId,
        name: state.name || '',
        answers: state.answers.slice(0, 4),
        originalScene: state.originalScene,
        revisedScene: state.revisedScene,
        storyTitle: state.storyTitle,
        resultImage: state.resultImage,
        outputType: state.outputType,
        selectedStyle: state.selectedStyle,
        creationStage: state.creationStage || 'first-book'
      }));
    } catch (_error) { /* The guest project still remains in the private server session. */ }
  }

  function registerAfterFirstPicture(action) {
    preserveGuestCreation(action);
    const returnTo = 'solo-story?resumeGuest=1&postSignup=' + encodeURIComponent(action);
    location.href = 'login.html?returnTo=' + encodeURIComponent(returnTo);
  }

  async function downloadFinishedPicture() {
    try {
      const response = await fetch(state.resultImage, { credentials: 'same-origin' });
      if (!response.ok) throw new Error('The picture download is not ready yet.');
      const blobUrl = URL.createObjectURL(await response.blob());
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = (state.storyTitle || 'my-storieslens-picture').replace(/[^a-z0-9_-]+/gi, '-').replace(/^-|-$/g, '') + '.png';
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(function () { URL.revokeObjectURL(blobUrl); }, 1000);
      showToast('Your picture is downloading. It is also saved in your private library.');
    } catch (error) {
      showToast(error.message || 'Open My Stories to download this picture.');
    }
  }

  function commitCurrentPage() {
    const pageNumber = state.bookScenes.length + 1;
    const scene = {
      id: 'scene-' + pageNumber,
      title: (state.outputType === 'film' ? 'Scene ' : 'Page ') + pageNumber,
      text: state.revisedScene,
      caption: state.revisedScene.slice(0, 500),
      imageUrl: /^\/api\/media\//.test(state.resultImage || '') ? state.resultImage : '',
      duration: 6,
      transition: 'fade'
    };
    state.bookScenes.push(scene);
    state.currentPageDraft = '';
    state.currentPageOriginal = '';
    return scene;
  }

  function openBookStudio() {
    if (!state.projectId) {
      showToast('Yu is still saving your book. Try again in a moment.');
      return;
    }
    location.href = 'movie-studio.html?project=' + encodeURIComponent(state.projectId);
  }

  function startNextPage() {
    const stage = activeStage();
    const pageNumber = state.bookScenes.length + 1;
    const prompt = stage.pagePrompts[Math.min(pageNumber - 1, stage.pagePrompts.length - 1)] || 'What happens next?';
    state.editMode = 'next-page';
    state.currentPrompt = 'Page ' + pageNumber + '. ' + prompt + ' ' + stage.guidance;
    state.voiceMood = 'question';
    composer.hidden = false;
    namePrompt.hidden = true;
    uploadEntry.hidden = false;
    characterMaker.hidden = true;
    quickIdeas.hidden = true;
    uploadEntry.querySelector('strong').textContent = state.userUploadedReference ? 'Your locked character pictures stay with this book' : 'Add or replace a character picture · optional';
    uploadEntry.querySelector('small').textContent = state.userUploadedReference ? 'Yu will keep the same people and style on every page.' : 'You may add up to three character references at any time.';
    setComposer('PAGE ' + pageNumber + ' OF ' + state.targetPages + ' · ' + prompt, stage.title === 'Picture & Voice' ? 'Say or type one tiny thing…' : 'Write or say what happens on this page…', 'Let Yu check');
    const next = yuMessage('<small>' + escapeHtml(stage.title.toUpperCase()) + ' · PAGE ' + pageNumber + ' OF ' + state.targetPages + '</small><h2>' + escapeHtml(prompt) + '</h2><p>' + escapeHtml(stage.guidance) + '</p><div class="continuity-lock"><span>🔒</span><div><strong>Your characters and picture style are locked</strong><small>Yu will use the approved first page as the visual anchor for the whole book.</small></div></div>');
    next.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    speakText(state.currentPrompt, 'question');
  }

  function dictateInto(target, language) {
    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Recognition) {
      showToast('Voice typing is not available on this device. You can type here instead.');
      target.focus();
      return;
    }
    const recognition = new Recognition();
    recognition.lang = language || 'en-US';
    recognition.interimResults = true;
    recognition.continuous = false;
    recognition.onresult = function (event) {
      let words = '';
      for (let index = 0; index < event.results.length; index += 1) words += event.results[index][0].transcript;
      target.value = words.trim();
      target.dispatchEvent(new Event('input', { bubbles: true }));
    };
    recognition.onerror = function () { showToast('Yu could not hear that. Try again or type your words.'); };
    try { recognition.start(); showToast('Yu is listening…'); } catch (_error) { target.focus(); }
  }

  async function generateBookCover(finisher) {
    const titleInput = finisher.querySelector('[data-book-title]');
    const authorInput = finisher.querySelector('[data-author-name]');
    const button = finisher.querySelector('[data-generate-cover]');
    const preview = finisher.querySelector('[data-cover-preview]');
    state.storyTitle = titleInput.value.trim() || state.storyTitle || 'My Story';
    state.authorProfile.name = authorInput?.value.trim() || state.authorProfile.name || state.name || 'Young Storymaker';
    titleInput.value = state.storyTitle;
    button.disabled = true;
    button.textContent = '✦ Yu is reading the whole story…';
    try {
      await requireAccount();
      if (!hasPictureAllowance()) throw new Error('No picture credits remain. Your book is still saved and exportable.');
      await saveProject({ coverGenerationRequested: true });
      const storyText = state.bookScenes.map(function (scene, index) { return 'Page ' + (index + 1) + ': ' + scene.text; }).join('\n').slice(0, 9000);
      const identityReferences = uploadedReferenceUrls().slice(0, 3);
      const firstPage = state.bookScenes[0]?.imageUrl || '';
      const references = identityReferences.slice();
      if (firstPage && !references.includes(firstPage)) references.push(firstPage);
      const personalPhoto = identityReferences.length > 0 && state.uploadContainsRealPerson;
      const result = await apiJson('/api/generate-image', {
        method: 'POST',
        headers: { 'Idempotency-Key': 'solo-cover-' + state.projectId + '-' + Date.now() },
        body: JSON.stringify({
          projectId: state.projectId,
          partId: 'book-cover',
          submissionId: 'cover-' + Date.now(),
          prompt: [
            'Create a polished vertical children’s book cover illustration for this complete story.',
            'Book title for context only: ' + state.storyTitle + '.',
            'Story pages:\n' + storyText,
            'Visual direction: ' + selectedStylePrompt() + '.',
            firstPage ? 'Match the approved first page’s recurring characters, clothing, visual style, color language, and world design.' : '',
            identityReferences.length ? 'Preserve the exact approved protagonist identities from the attached character references.' : '',
            'Compose one strong central image with two deliberate calm layout zones: generous quiet space near the top for the real editable book title, and a smaller uncluttered band near the bottom for the real editable writer name.',
            'Do not draw any words, letters, captions, logos, watermarks, UI, arrows, or play icons.'
          ].filter(Boolean).join('\n'),
          studentWriting: storyText,
          style: selectedStylePrompt(),
          aspectRatio: '4:5',
          referenceImageUrls: references.slice(0, 3),
          personalPhoto,
          personalPhotoConsentId: personalPhoto ? state.personalPhotoConsentId : ''
        })
      });
      if (!result.imageUrl) throw new Error('Yu finished the cover, but it did not arrive. Please try again.');
      state.coverImageUrl = result.imageUrl;
      updatePictureAllowance(result.wallet || state.wallet);
      await saveProject({ coverGenerated: true });
      preview.innerHTML = '<img src="' + escapeHtml(state.coverImageUrl) + '" alt="Generated cover for ' + escapeHtml(state.storyTitle) + '" /><div class="cover-title-lockup"><small>MY BOOK</small><strong data-cover-title-text>' + escapeHtml(state.storyTitle) + '</strong></div><span class="cover-byline" data-cover-author-text>Written by ' + escapeHtml(state.authorProfile.name) + '</span>';
      preview.classList.add('has-cover');
      button.textContent = '✓ Cover saved · make another for 1 credit';
      button.disabled = false;
      celebrate();
      speakText('Your cover is ready! The title stays editable and clear.', 'celebration');
    } catch (error) {
      button.disabled = false;
      button.textContent = '✦ Try making my cover again';
      showToast(error.message);
    }
  }

  function authorBioFromAnswers(name, answers) {
    const authorName = name || state.name || 'This young author';
    const interests = answers[0] || 'making stories and discovering new ideas';
    const inspiration = answers[1] || 'their imagination and the world around them';
    const hope = answers[2] || 'feel curious about what could happen next';
    return authorName + ' is a young storyteller who loves ' + interests.replace(/[.!?]+$/, '') + '. The idea for “' + (state.storyTitle || 'this story') + '” came from ' + inspiration.replace(/[.!?]+$/, '') + '. ' + authorName + ' hopes readers will ' + hope.replace(/[.!?]+$/, '') + '.';
  }

  function showBookFinisher() {
    const existing = document.querySelector('[data-book-finisher]');
    if (existing) {
      existing.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }
    composer.hidden = true;
    const existingCover = state.coverImageUrl || state.bookScenes[0]?.imageUrl || '';
    const currentAuthor = state.authorProfile || {};
    const finisher = yuMessage('<small>FINISH MY BOOK · 3 EASY STEPS</small><h2>Now let’s make it feel like a real book.</h2><p>Write or say the title, let Yu design a cover from the whole story, then make your first inside page: <i>About the Author</i>.</p>' +
      '<section class="book-finisher" data-book-finisher>' +
        '<div class="finisher-step"><b>1</b><div><small>NAME YOUR BOOK</small><h3>What should we call your story?</h3><div class="title-voice-row"><input type="text" maxlength="160" data-book-title value="' + escapeHtml(state.storyTitle || '') + '" placeholder="My Amazing Story" /><button type="button" data-say-title>● Say my title</button></div><p>The title remains editable text—it will stay crisp in Word, PDF, and print.</p></div></div>' +
        '<div class="finisher-step"><b>2</b><div><small>DESIGN THE COVER</small><h3>Yu reads the whole story and illustrates its big idea.</h3><div class="cover-builder-preview' + (existingCover ? ' has-cover' : '') + '" data-cover-preview>' + (existingCover ? '<img src="' + escapeHtml(existingCover) + '" alt="Current book cover" /><div class="cover-title-lockup"><small>MY BOOK</small><strong data-cover-title-text>' + escapeHtml(state.storyTitle || 'My Story') + '</strong></div><span class="cover-byline" data-cover-author-text>Written by ' + escapeHtml(currentAuthor.name || state.name || 'Young Storymaker') + '</span>' : '<span>✦</span><p>Your cover surprise will appear here.<br />The title goes at the top and the writer’s name goes at the bottom.</p>') + '</div><button class="generate-cover-button" type="button" data-generate-cover>✦ Generate my cover from the story · 1 picture credit</button><p>Yu reserves a clear title area and a separate “Written by” area. The illustration contains no fake text or logos.</p></div></div>' +
        '<div class="finisher-step"><b>3</b><div><small>FIRST INSIDE PAGE · ABOUT THE AUTHOR</small><h3>Tell your readers a little about you.</h3><p>Yu asks three tiny questions. Type or use the microphone beside each answer.</p>' +
          '<div class="author-about-grid"><label><span>What do you love making or learning?</span><div><input type="text" data-author-answer="0" placeholder="drawing dragons, building robots…" /><button type="button" data-dictate-author="0">● Speak</button></div></label><label><span>What gave you the idea for this story?</span><div><input type="text" data-author-answer="1" placeholder="a museum trip, my little brother…" /><button type="button" data-dictate-author="1">● Speak</button></div></label><label><span>What do you hope readers feel?</span><div><input type="text" data-author-answer="2" placeholder="brave, curious, excited…" /><button type="button" data-dictate-author="2">● Speak</button></div></label></div>' +
          '<label class="author-name-field"><span>Author name</span><input type="text" maxlength="80" data-author-name value="' + escapeHtml(currentAuthor.name || state.name || '') + '" placeholder="First name, nickname, or pen name" /></label>' +
          '<button class="yu-build-bio" type="button" data-build-bio>✦ Yu, help me build my introduction</button>' +
          '<label class="author-bio-field"><span>My editable introduction</span><textarea rows="5" maxlength="1200" data-author-bio placeholder="Yu will build a short introduction from your answers. You can change every word.">' + escapeHtml(currentAuthor.bio || '') + '</textarea></label>' +
          '<div class="author-photo-builder"><div class="author-photo-preview" data-about-photo>' + (currentAuthor.photoUrl ? '<img src="' + escapeHtml(currentAuthor.photoUrl) + '" alt="Author" />' : '<span>＋</span><small>Author photo · optional</small>') + '</div><div><strong>Add my author photo</strong><small>It becomes part of the private About the Author page.</small><input type="file" accept="image/*,.heic,.heif,.avif" data-about-photo-input hidden /><input type="file" accept="image/*" capture="user" data-about-camera-input hidden /><div class="about-photo-actions"><button type="button" data-about-upload>＋ Upload a photo</button><button type="button" data-about-camera>◉ Take a photo</button></div></div></div>' +
          '<section class="author-photo-consent" data-author-photo-consent hidden><strong>Grown-up permission for the author photo</strong><label><span>Adult name</span><input type="text" maxlength="100" data-photo-adult-name /></label><label><span>Relationship</span><select data-photo-relationship><option value="">Choose one</option><option value="Self">I am the adult pictured</option><option value="Parent">Parent</option><option value="Legal guardian">Legal guardian</option></select></label><label><input type="checkbox" data-photo-permission /> I am 18 or older and have permission to use this photo.</label><label><input type="checkbox" data-photo-processing /> I agree to private regional processing and storage for this book.</label></section>' +
          '<button class="save-author-page" type="button" data-save-author>Save my cover &amp; About the Author page</button>' +
        '</div></div>' +
      '</section>');
    let preparedAuthorPhoto = null;
    finisher.querySelector('[data-say-title]').addEventListener('click', function () { dictateInto(finisher.querySelector('[data-book-title]'), 'en-US'); });
    function refreshCoverWords() {
      const titleNode = finisher.querySelector('[data-cover-title-text]');
      const authorNode = finisher.querySelector('[data-cover-author-text]');
      if (titleNode) titleNode.textContent = finisher.querySelector('[data-book-title]').value.trim() || 'My Story';
      if (authorNode) authorNode.textContent = 'Written by ' + (finisher.querySelector('[data-author-name]').value.trim() || state.name || 'Young Storymaker');
    }
    finisher.querySelector('[data-book-title]').addEventListener('input', refreshCoverWords);
    finisher.querySelector('[data-author-name]').addEventListener('input', refreshCoverWords);
    finisher.querySelector('[data-generate-cover]').addEventListener('click', function () { generateBookCover(finisher); });
    finisher.querySelectorAll('[data-dictate-author]').forEach(function (button) {
      button.addEventListener('click', function () { dictateInto(finisher.querySelector('[data-author-answer="' + button.dataset.dictateAuthor + '"]'), 'en-US'); });
    });
    finisher.querySelector('[data-build-bio]').addEventListener('click', function () {
      const name = finisher.querySelector('[data-author-name]').value.trim();
      const answers = Array.from(finisher.querySelectorAll('[data-author-answer]')).map(function (field) { return field.value.trim(); });
      const bio = authorBioFromAnswers(name, answers);
      finisher.querySelector('[data-author-bio]').value = bio;
      speakText(bio, 'story');
      showToast('Yu built a short introduction. Every word remains editable.');
    });
    const photoInput = finisher.querySelector('[data-about-photo-input]');
    const cameraInput = finisher.querySelector('[data-about-camera-input]');
    finisher.querySelector('[data-about-upload]').addEventListener('click', function () { photoInput.click(); });
    finisher.querySelector('[data-about-camera]').addEventListener('click', function () { cameraInput.click(); });
    async function prepareAboutAuthorPhoto(file) {
      if (!file) return;
      try {
        if (!window.StoriesLensArtworkSafety) throw new Error('The private photo tool did not load. Refresh and try again.');
        preparedAuthorPhoto = await window.StoriesLensArtworkSafety.processArtworkWithServerFallback(file);
        finisher.querySelector('[data-about-photo]').innerHTML = '<img src="' + preparedAuthorPhoto.dataUrl + '" alt="Prepared author photo" />';
        finisher.querySelector('[data-author-photo-consent]').hidden = false;
        showToast('Author photo prepared privately. Save the page when ready.');
      } catch (error) { showToast(error.message); }
    }
    photoInput.addEventListener('change', function () { prepareAboutAuthorPhoto(photoInput.files?.[0]); });
    cameraInput.addEventListener('change', function () { prepareAboutAuthorPhoto(cameraInput.files?.[0]); });
    finisher.querySelector('[data-save-author]').addEventListener('click', async function () {
      const button = finisher.querySelector('[data-save-author]');
      button.disabled = true;
      button.textContent = 'Saving the finished pages…';
      try {
        await requireAccount();
        state.storyTitle = finisher.querySelector('[data-book-title]').value.trim() || state.storyTitle || 'My Story';
        const authorName = finisher.querySelector('[data-author-name]').value.trim() || state.name || 'Young Storymaker';
        const bio = finisher.querySelector('[data-author-bio]').value.trim();
        if (!bio) throw new Error('Answer the three tiny questions, then ask Yu to build your introduction.');
        await saveProject({ finishingBook: true });
        let photoUrl = state.authorProfile.photoUrl || '';
        if (preparedAuthorPhoto) {
          const consentId = await ensurePersonalPhotoConsent(finisher.querySelector('[data-author-photo-consent]'));
          const uploaded = await apiJson('/api/media', {
            method: 'POST',
            body: JSON.stringify({ projectId: state.projectId, dataUrl: preparedAuthorPhoto.dataUrl, metadataRemoved: true, purpose: 'author-photo', personalPhotoConsentId: consentId })
          });
          photoUrl = uploaded.media.url;
        }
        state.authorProfile = { name: authorName, bio, photoUrl };
        await saveProject({ bookFinished: true, aboutAuthorCompleted: true });
        button.textContent = '✓ About the Author saved';
        const done = yuMessage('<small>YOUR BOOK PACKAGE IS READY</small><h2>Cover, story pages, and author page—saved together.</h2><p>Your About the Author page comes first inside the book. Open Book Studio to preview, or export the editable A5 edition now.</p><div class="book-export-actions"><a href="/api/projects/' + encodeURIComponent(state.projectId) + '/export/docx">Download Word</a><a href="/api/projects/' + encodeURIComponent(state.projectId) + '/export/pdf">Download PDF</a><button type="button" data-open-finished-book>Open Book Studio</button></div>');
        done.querySelector('[data-open-finished-book]').addEventListener('click', openBookStudio);
        celebrate();
      } catch (error) {
        button.disabled = false;
        button.textContent = 'Save my cover & About the Author page';
        showToast(error.message);
      }
    });
    finisher.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function showBookContinuation() {
    const pageCount = state.bookScenes.length;
    const stage = activeStage();
    const isComplete = pageCount >= state.targetPages;
    const progress = Array.from({ length: state.targetPages }, function (_, index) {
      return '<i class="' + (index < pageCount ? 'is-done' : (index === pageCount ? 'is-next' : '')) + '">' + (index < pageCount ? '✓' : index + 1) + '</i>';
    }).join('');
    const extendAction = isComplete && stage.maxPages > state.targetPages
      ? '<button class="book-next" type="button" data-extend-story>Keep building to ' + stage.maxPages + ' ' + (state.outputType === 'film' ? 'scenes' : 'pages') + '</button>'
      : '';
    const actions = isComplete
      ? '<button class="book-next primary" type="button" data-finish-book>Design my cover &amp; author page</button><button class="book-next" type="button" data-open-book>Open my ' + (state.outputType === 'film' ? 'story' : 'e-book') + ' now</button>' + extendAction + '<button class="book-next" type="button" data-author-finish>Make my author card</button>'
      : '<button class="book-next primary" type="button" data-next-page>Continue to ' + (state.outputType === 'film' ? 'Scene ' : 'Page ') + (pageCount + 1) + ' with Yu</button><button class="book-next" type="button" data-open-book>See my ' + pageCount + ' ' + (pageCount === 1 ? 'page' : 'pages') + ' so far</button><button class="book-next quiet" type="button" data-author-finish>Finish for today</button>';
    const card = yuMessage('<small>' + (isComplete ? 'YOUR FIRST BOOK IS READY' : 'KEEP YOUR STORY GROWING') + '</small><h2>' + (isComplete ? 'You made all ' + state.targetPages + ' pages!' : 'Page ' + pageCount + ' is safely inside your book.') + '</h2><p>' + (isComplete ? 'Open Book Studio to preview the whole story and export Word or PDF.' : 'Next, Yu asks one clear question. Your characters, uploaded photos, and chosen style stay the same.') + '</p><div class="book-progress" aria-label="' + pageCount + ' of ' + state.targetPages + ' pages complete"><div><b>' + pageCount + '</b><span>of ' + state.targetPages + ' ' + (state.outputType === 'film' ? 'scenes' : 'pages') + '</span></div><section>' + progress + '</section></div><div class="book-next-actions">' + actions + '</div><p class="stage-guidance-note"><strong>' + escapeHtml(stage.title) + ':</strong> ' + escapeHtml(stage.guidance) + '</p>');
    const nextButton = card.querySelector('[data-next-page]');
    if (nextButton) nextButton.addEventListener('click', startNextPage);
    const finishButton = card.querySelector('[data-finish-book]');
    if (finishButton) finishButton.addEventListener('click', showBookFinisher);
    const extendButton = card.querySelector('[data-extend-story]');
    if (extendButton) extendButton.addEventListener('click', function () {
      state.targetPages = stage.maxPages;
      startNextPage();
    });
    card.querySelector('[data-open-book]').addEventListener('click', openBookStudio);
    card.querySelector('[data-author-finish]').addEventListener('click', showAuthorCard);
    if (isComplete) celebrate();
  }

  function showResult(progressMessage, makeButton) {
    const pageNumber = state.bookScenes.length + 1;
    const pictureStep = document.querySelector('[data-step-dot="picture"]');
    pictureStep.classList.remove('is-active');
    pictureStep.classList.add('is-done');
    pictureStep.querySelector('span').textContent = '✓';
    const resultImage = state.resultImage || (state.selectedStyle === 'Real-life story' && state.imageUrl ? state.imageUrl : 'assets/original-garden-door-hd-v2.png');
    const resultActions = hasAccount()
      ? '<div class="result-actions"><button class="result-action primary" type="button" data-result="keep">I love it</button><button class="result-action" type="button" data-result="change">Change something</button><button class="result-action" type="button" data-result="again">' + (state.betaUnlimitedCreation ? 'Try again · beta access' : 'Try again · 1 gift') + '</button></div>'
      : '<div class="guest-next-step"><small>YOUR FREE PICTURE IS READY</small><h3>What would you like to do next?</h3><p>Create a free grown-up account now so this picture and story move with you—nothing needs to be entered again.</p><div class="result-actions"><button class="result-action primary" type="button" data-result="signup-continue">Continue creating with Yu</button><button class="result-action" type="button" data-result="signup-download">Download my picture</button></div><span>Free account · private library · your work stays yours</span></div>';
    const resultPageLabel = pageNumber === 1
      ? (state.outputType === 'film' ? 'YOUR FIRST MOVIE FRAME' : 'YOUR FIRST STORY PAGE') + ' · 1 OF ' + state.targetPages
      : (state.outputType === 'film' ? 'MOVIE SCENE ' : 'STORY PAGE ') + pageNumber + ' OF ' + state.targetPages;
    const resultMarkup = '<div class="wow-reveal" aria-hidden="true"><span>✦</span><b>WOW!</b><span>✦</span></div><div class="result-card"><div class="result-picture-wrap"><img class="result-picture" data-result-image src="' + escapeHtml(resultImage) + '" alt="' + (state.selectedStyle === 'Real-life story' ? 'Real-life story preview made from the uploaded photo' : 'Illustration preview based on the creator’s story') + '" /></div><div class="result-copy"><span class="result-origin">✦ MADE FROM ' + escapeHtml(possessiveName().toUpperCase()) + (state.selectedStyle === 'Real-life story' ? ' PHOTO &amp; WORDS' : ' WORDS') + '</span><small>' + resultPageLabel + '</small><h2>Your story just became a picture!</h2><h3 class="result-story-title">' + escapeHtml(state.storyTitle || 'My Story') + '</h3><p>' + escapeHtml(state.revisedScene) + '</p>' + resultActions + '</div></div>';
    let result;
    if (progressMessage && progressMessage.matches('[data-picture-reveal]')) {
      progressMessage.className = 'picture-reveal-slot is-ready';
      progressMessage.innerHTML = resultMarkup;
      result = progressMessage;
    } else {
      result = yuMessage(resultMarkup);
      if (progressMessage) progressMessage.remove();
    }
    if (makeButton) {
      makeButton.textContent = '✓ My free first picture is ready below';
      makeButton.disabled = true;
    }
    const image = result.querySelector('[data-result-image]');
    image.addEventListener('error', function handleResultImageError() {
      image.removeEventListener('error', handleResultImageError);
      image.src = state.selectedStyle === 'Real-life story' && state.imageUrl ? state.imageUrl : 'assets/original-garden-door-hd-v2.png';
      showToast(state.selectedStyle === 'Real-life story' ? 'Yu restored your prepared photo. Your story is still saved.' : 'Yu restored the picture preview. Your story is still saved.');
    });
    window.requestAnimationFrame(function () {
      result.scrollIntoView({ behavior: 'smooth', block: 'start' });
      celebrate(result.querySelector('.wow-reveal'));
    });
    setTimeout(function () { speakText((state.name ? state.name + ', ' : '') + 'page ' + pageNumber + ' is ready! You imagined it, revised it, and made it visible!', 'celebration'); }, 350);
    result.querySelectorAll('[data-result]').forEach(function (button) {
      button.addEventListener('click', async function () {
        if (button.dataset.result === 'signup-continue') {
          registerAfterFirstPicture('continue');
        } else if (button.dataset.result === 'signup-download') {
          registerAfterFirstPicture('download');
        } else if (button.dataset.result === 'keep') {
          button.disabled = true;
          button.textContent = 'Saving…';
          try {
            commitCurrentPage();
            await saveProject({ completedFirstScene: state.bookScenes.length >= 1, acceptedPicture: true, completedPages: state.bookScenes.length });
            showToast('Saved! Page ' + state.bookScenes.length + ' is inside your book.');
            reportButton.disabled = false;
            reportButton.textContent = 'Open ' + (state.name ? state.name + '’s' : 'the creator’s') + ' full learning report';
            button.textContent = '✓ Saved';
            setTimeout(showBookContinuation, 420);
          } catch (error) {
            if (state.bookScenes.length && state.bookScenes[state.bookScenes.length - 1].text === state.revisedScene) state.bookScenes.pop();
            button.disabled = false;
            button.textContent = 'I love it';
            showToast(error.message);
          }
        } else if (button.dataset.result === 'change') {
          startPictureChange();
        } else {
          if (!hasPictureAllowance()) {
            showToast('No picture gifts left. Your current picture is still saved.');
            return;
          }
          state.pictureChangeRequest = '';
          showDrawing(state.pictureConsentPanel, result.matches('[data-picture-reveal]') ? result : null, makeButton);
        }
      });
    });
  }

  function startPictureChange() {
    state.editMode = 'picture-change';
    state.currentPrompt = 'Tell me one thing you want to change in the picture. You can type it or hold the green button to speak. I will keep everything else the same.';
    state.voiceMood = 'question';
    input.value = '';
    namePrompt.hidden = true;
    uploadEntry.hidden = true;
    characterMaker.hidden = true;
    quickIdeas.hidden = true;
    composer.hidden = false;
    setComposer('Tell Yu one picture change. Everything else stays locked.', 'For example: Make the sky brighter, move Leo closer to Mom, or add the museum behind us…', 'Review my change');
    composer.scrollIntoView({ behavior: 'smooth', block: 'end' });
    setTimeout(function () { input.focus(); }, 250);
    speakText(state.currentPrompt);
    showToast('Type your change or hold the green button to say it.');
  }

  function reviewPictureChange(request) {
    const review = yuMessage('<small>YU CHECKS YOUR CHANGE</small><h2>I will change only this:</h2><blockquote class="change-request">“' + escapeHtml(request) + '”</blockquote><p>I will keep the same characters, faces, clothes, story facts, and selected style. ' + (state.betaUnlimitedCreation ? 'Your founder beta access covers this regeneration.' : 'Regenerating uses 1 picture gift.') + '</p><div class="picture-change-review"><button type="button" data-confirm-picture-change' + (!hasPictureAllowance() ? ' disabled' : '') + '>' + (state.betaUnlimitedCreation ? 'Update with beta access' : 'Use 1 gift &amp; update') + '</button><button type="button" data-cancel-picture-change>Keep my current picture</button></div>');
    review.querySelector('[data-confirm-picture-change]').addEventListener('click', function () {
      if (!hasPictureAllowance()) {
        showToast('No picture gifts left. Your current picture is still saved.');
        return;
      }
      state.pictureChangeRequest = request;
      showToast('Yu is changing only the part you named.');
      setTimeout(function () {
        showDrawing(
          state.pictureConsentPanel,
          document.querySelector('[data-picture-reveal]'),
          document.querySelector('[data-make-picture]')
        );
      }, 350);
    });
    review.querySelector('[data-cancel-picture-change]').addEventListener('click', function () {
      showToast('Kept the current picture. No gift was used.');
    });
  }

  function showAuthorCard() {
    if (document.querySelector('[data-author-card]')) return;
    const displayName = state.name || 'Young Storymaker';
    const initial = state.name ? state.name.charAt(0).toUpperCase() : '✦';
    const card = yuMessage('<small>AUTHOR UNLOCKED</small><h2>You did not just make a picture—you became an author.</h2><p>Add your own photo if you want, then choose how to spend the stars you earned by writing.</p>' +
      '<div class="author-card" data-author-card><div class="author-card-top"><div class="author-photo" data-author-photo-preview>' + escapeHtml(initial) + '</div><div class="author-info"><small>STORIESLENS YOUNG AUTHOR</small><h2>' + escapeHtml(displayName) + '</h2><p>Author of <i>' + escapeHtml(state.storyTitle) + '</i></p></div></div><input type="file" accept="image/*,.heic,.heif,.avif" data-author-photo hidden /><input type="file" accept="image/*" capture="user" data-author-camera hidden /><div class="author-photo-actions"><button class="author-photo-action" type="button" data-author-upload>＋ Upload a photo</button><button class="author-photo-action camera" type="button" data-author-take-photo>◉ Take a photo</button></div><p class="author-photo-note">Optional · upload from your library or open the front camera · private by default · a grown-up controls sharing.</p><div class="author-badges"><span>✦ Original Voice</span><span>✦ Character Builder</span><span>✦ Story Editor</span></div></div>' +
      '<section class="star-bank"><div class="star-bank-head"><h3>My star bank</h3><span class="star-balance" data-star-balance>★ ' + state.stars + '</span></div><p>Stars come from real creating—not screen time.</p><div class="reward-shop"><button type="button" data-redeem="5"><span>Choose a special book-cover frame</span><b>5 ★</b></button><button type="button" data-redeem="10"><span>Add a gold author seal</span><b>10 ★</b></button><button type="button" data-redeem="20" disabled><span>Unlock one extra illustration</span><b>20 ★</b></button></div><p class="reward-principle">Learning stars stay private. No public ranking and no lost streaks.</p></section>' +
      '<section class="showcase-box"><div class="showcase-head"><div><small>MONTHLY YOUNG AUTHORS FESTIVAL</small><h3>Secret Worlds</h3></div><span class="private-chip">PRIVATE UNTIL APPROVED</span></div><p>A grown-up can submit this story to the monthly showcase. Readers respond with encouragement, not dislikes.</p><div class="warm-reactions"><span>❤️ I love this character</span><span>✨ So imaginative</span><span>📖 What happens next?</span><span>🎨 Beautiful story world</span></div><div class="showcase-rules"><span><b>✓</b> No live popularity ranking</span><span><b>✓</b> Reader’s Choice announced after the month ends</span><span><b>✓</b> Learning stars never depend on votes</span></div><button class="showcase-request" type="button" data-showcase-request>Ask a grown-up to enter my story</button></section>');

    const photoInput = card.querySelector('[data-author-photo]');
    const cameraInput = card.querySelector('[data-author-camera]');
    card.querySelector('[data-author-upload]').addEventListener('click', function () { photoInput.click(); });
    card.querySelector('[data-author-take-photo]').addEventListener('click', function () { cameraInput.click(); });
    async function previewAuthorPhoto(file) {
      if (!file) return;
      try {
        if (!window.StoriesLensArtworkSafety) throw new Error('The private photo tool did not load. Refresh and try again.');
        const prepared = await window.StoriesLensArtworkSafety.processArtworkWithServerFallback(file);
        card.querySelector('[data-author-photo-preview]').innerHTML = '<img src="' + prepared.dataUrl + '" alt="Author photo preview" />';
        showToast('Author photo prepared privately. Location and camera details were removed.');
      } catch (error) { showToast(error.message); }
    }
    photoInput.addEventListener('change', function () { previewAuthorPhoto(photoInput.files?.[0]); });
    cameraInput.addEventListener('change', function () { previewAuthorPhoto(cameraInput.files?.[0]); });
    card.querySelectorAll('[data-redeem]').forEach(function (rewardButton) {
      const cost = Number(rewardButton.dataset.redeem);
      rewardButton.disabled = state.stars < cost;
      rewardButton.addEventListener('click', function () {
        if (state.stars < cost) return;
        state.stars -= cost;
        starCount.textContent = String(state.stars);
        card.querySelector('[data-star-balance]').textContent = '★ ' + state.stars;
        rewardButton.disabled = true;
        rewardButton.querySelector('b').textContent = 'Unlocked ✓';
        showToast(rewardButton.querySelector('span').textContent + ' unlocked!');
        card.querySelectorAll('[data-redeem]').forEach(function (other) {
          if (!other.querySelector('b').textContent.includes('Unlocked')) other.disabled = state.stars < Number(other.dataset.redeem);
        });
      });
    });
    card.querySelector('[data-showcase-request]').addEventListener('click', showParentShowcaseReview);
  }

  function showParentShowcaseReview() {
    parentPanel.classList.add('is-open');
    let review = parentPanel.querySelector('[data-showcase-review]');
    if (!review) {
      review = document.createElement('section');
      review.className = 'parent-showcase-review';
      review.dataset.showcaseReview = '';
      review.innerHTML = '<small>GROWN-UP REVIEW</small><h3>Monthly showcase permission</h3><p>The story stays private until you review its public version. Publishing is never automatic.</p><label><input type="checkbox" checked disabled /> Use a pen name only; do not show school, location, email, or age.</label><label><input type="checkbox" checked disabled /> Show the illustrated cover—not the child’s author photo or live voice.</label><label><input type="checkbox" data-showcase-consent /> I am the parent or legal guardian and want to preview this submission.</label><button type="button" data-showcase-preview disabled>Preview the safe public entry</button>';
      parentPanel.appendChild(review);
      const consent = review.querySelector('[data-showcase-consent]');
      const preview = review.querySelector('[data-showcase-preview]');
      consent.addEventListener('change', function () { preview.disabled = !consent.checked; });
      preview.addEventListener('click', function () {
        showToast('Safe showcase preview ready. Nothing has been published.');
        preview.textContent = 'Preview ready · still private';
      });
    }
    review.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    showToast('A grown-up must review before anything becomes public.');
  }

  async function showCharacterPreview() {
    const words = input.value.trim();
    if (!words) {
      showToast('First tell Yu who the character is—even three words are enough.');
      input.focus();
      return;
    }
    if (!hasPictureAllowance()) {
      showToast('No picture gifts left. You can describe the character or upload your own picture.');
      return;
    }
    characterGenerate.classList.add('is-making');
    characterGenerate.disabled = true;
    characterGenerate.innerHTML = '<span aria-hidden="true">✦</span> Sketching your character…';
    try {
      await saveProject({ characterPreviewRequested: true });
      const generated = await apiJson('/api/generate-image', {
        method: 'POST',
        headers: { 'Idempotency-Key': 'solo-character-' + Date.now() + '-' + Math.random().toString(36).slice(2) },
        body: JSON.stringify({
          projectId: state.projectId,
          partId: 'character-reference',
          submissionId: 'solo-character-' + Date.now(),
          prompt: [
            'Create one clean square character reference for a child-authored story.',
            'The child described the character this way: ' + words,
            'Preserve every stated age, appearance, clothing, personality, and goal.',
            'One clear full-body character, warm neutral background, child-friendly, no readable text, no logo, no watermark, no interface, no play icon.'
          ].join('\n'),
          studentWriting: words,
          style: 'premium luminous storybook character design',
          aspectRatio: '1:1',
          referenceImageUrls: []
        })
      });
      const previewUrl = generated.imageUrl;
      if (!previewUrl) throw new Error('The character picture did not arrive. Your credit was not charged.');
      updatePictureAllowance(generated.wallet || state.wallet);
      state.characterPreviewMade = true;
      const card = yuMessage('<small>YOUR CHARACTER PICTURE</small><h2>Is this how you imagine them?</h2><p>Yu made this from your own description. ' + (state.betaUnlimitedCreation ? 'Founder beta access covered this picture.' : 'One picture credit was used.') + '</p><div class="character-preview"><img src="' + escapeHtml(previewUrl) + '" alt="Character preview based on the child’s words" /><div class="character-preview-actions"><button type="button" data-keep-character>Yes, keep this character</button><button type="button" data-try-character>Try another look</button></div></div>');
      card.querySelector('[data-keep-character]').addEventListener('click', function () {
        state.characterImageUrl = previewUrl;
        showToast('Character look saved for this story.');
        card.querySelector('[data-keep-character]').textContent = '✓ Character saved';
      });
      const retry = card.querySelector('[data-try-character]');
      retry.textContent = state.betaUnlimitedCreation ? 'Try another · beta access' : 'Try another · 1 credit';
      retry.addEventListener('click', showCharacterPreview);
    } catch (error) {
      showToast(error.message);
    } finally {
      characterGenerate.disabled = false;
      characterGenerate.classList.remove('is-making');
      characterGenerate.innerHTML = '<span aria-hidden="true">✦</span> Make a character picture · 1 credit';
    }
  }

  document.querySelectorAll('[data-quick]').forEach(function (button) {
    button.addEventListener('click', function () { input.value = button.dataset.quick; input.focus(); });
  });
  document.querySelectorAll('[data-character-clue]').forEach(function (button) {
    button.addEventListener('click', function () {
      const clue = button.dataset.characterClue;
      const current = input.value.trim();
      input.value = current ? current + (/[.!?]$/.test(current) ? ' ' : '. ') + clue : clue;
      input.focus();
      input.setSelectionRange(input.value.length, input.value.length);
    });
  });
  send.addEventListener('click', handleAnswer);
  input.addEventListener('keydown', function (event) {
    if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') handleAnswer();
  });
  hear.addEventListener('click', function () { speakText(state.currentPrompt); });
  characterDescribe.addEventListener('click', function () {
    characterDescription.hidden = false;
    characterDescribe.classList.add('is-selected');
    input.placeholder = 'Their name is… They are about… They look… They want…';
    input.focus();
    characterDescription.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  });
  characterGenerate.addEventListener('click', showCharacterPreview);
  reportButton.addEventListener('click', function () {
    if (!state.projectId) return;
    location.href = 'project-report.html?project=' + encodeURIComponent(state.projectId);
  });
  document.querySelector('[data-parent-toggle]').addEventListener('click', function () { parentPanel.classList.add('is-open'); });
  document.querySelector('[data-parent-close]').addEventListener('click', function () { parentPanel.classList.remove('is-open'); });

  function applyPreparedPictures(files, preparedImages) {
    if (state.imageUrl && state.imageUrl.startsWith('blob:')) URL.revokeObjectURL(state.imageUrl);
    state.referenceImages = preparedImages.map(function (prepared, index) {
      return { dataUrl: prepared.dataUrl, name: files[index].name, containsRealPerson: Boolean(prepared.review?.checks?.realPerson), convertedFromHeic: Boolean(prepared.convertedFromHeic), convertedOnServer: Boolean(prepared.convertedOnServer) };
    });
    state.imageUrl = state.referenceImages[0].dataUrl;
    state.resultImage = state.imageUrl;
    state.userUploadedReference = true;
    state.uploadContainsRealPerson = state.referenceImages.some(function (item) { return item.containsRealPerson; });
    state.uploadConvertedFromHeic = state.referenceImages.some(function (item) { return item.convertedFromHeic; });
    state.personalPhotoConsentId = '';
    if (state.step === 1) state.characterImageUrl = state.imageUrl;
    if (!input.value && state.step === 0) input.value = 'This picture gave me a story idea.';
    uploadEntry.querySelector('strong').textContent = files.length + ' ' + (files.length === 1 ? 'character picture is' : 'character pictures are') + ' ready';
    uploadEntry.querySelector('small').textContent = state.uploadConvertedFromHeic
      ? 'HEIC converted privately—Yu will keep all ' + files.length + ' prepared characters separate.'
      : 'Private preparation complete—Yu will keep all ' + files.length + ' characters separate.';
    uploadRecovery.hidden = true;
    pendingHeicFiles = [];
    if (typeof state.refreshStyleReferenceChoice === 'function') state.refreshStyleReferenceChoice();
    showToast(files.length + ' ' + (files.length === 1 ? 'character is' : 'characters are') + ' ready for this story.');
  }

  async function preparePictures(files, serverFallback) {
    uploadEntry.querySelector('strong').textContent = 'Preparing ' + files.length + ' ' + (files.length === 1 ? 'picture' : 'pictures') + ' privately…';
    uploadEntry.querySelector('small').textContent = serverFallback
      ? 'Securely converting the HEIC in memory. The original is not saved.'
      : 'Removing location and camera information from every picture on this device.';
    try {
      if (!window.StoriesLensArtworkSafety) throw new Error('The private picture preparation tool did not load. Refresh and try again.');
      const preparedImages = await Promise.all(files.map(function (file) {
        if (serverFallback && window.StoriesLensArtworkSafety.isHeicFile(file)) {
          return window.StoriesLensArtworkSafety.processArtworkWithServerFallback(file);
        }
        return serverFallback
          ? window.StoriesLensArtworkSafety.processArtwork(file)
          : window.StoriesLensArtworkSafety.processArtworkLocalOnly(file);
      }));
      applyPreparedPictures(files, preparedImages);
    } catch (error) {
      state.imageUrl = '';
      state.referenceImages = [];
      state.userUploadedReference = false;
      uploadEntry.querySelector('strong').textContent = 'This picture could not be prepared';
      const heicFailure = !serverFallback && files.some(function (file) { return window.StoriesLensArtworkSafety?.isHeicFile(file); }) && /heic_(?:conversion_failed|conversion_unavailable)/.test(String(error.message || ''));
      if (heicFailure) {
        pendingHeicFiles = files;
        uploadRecovery.hidden = false;
        uploadEntry.querySelector('small').textContent = 'This iPhone HEIC needs secure auto-conversion.';
        showToast('This iPhone HEIC needs auto-conversion. Use the button below.');
      } else {
        uploadEntry.querySelector('small').textContent = serverFallback
          ? 'The secure converter could not read this HEIC. Please choose JPG or PNG.'
          : (error.message || 'Try a JPG, PNG, WEBP, HEIC, or HEIF photo.');
        showToast(uploadEntry.querySelector('small').textContent);
      }
    } finally {
      if (serverFallback) {
        heicAutoConvert.disabled = false;
        heicAutoConvert.textContent = 'Secure auto-convert · 安全自动转换';
      }
    }
  }

  upload.addEventListener('change', async function () {
    const files = Array.from(upload.files || []);
    if (!files.length) return;
    if (files.length > 3) {
      upload.value = '';
      showToast('Choose up to three character pictures at one time.');
      return;
    }
    uploadRecovery.hidden = true;
    pendingHeicFiles = [];
    await preparePictures(files, false);
  });

  heicAutoConvert.addEventListener('click', async function () {
    if (!pendingHeicFiles.length) return;
    heicAutoConvert.disabled = true;
    heicAutoConvert.textContent = 'Converting securely…';
    await preparePictures(pendingHeicFiles, true);
  });

  function beginSpeech() {
    if (state.speaking) return;
    state.speaking = true;
    state.speakStarted = Date.now();
    speak.classList.add('is-recording');
    speak.querySelector('b').textContent = 'Release when done';
    state.timer = setInterval(function () {
      const seconds = Math.floor((Date.now() - state.speakStarted) / 1000);
      speakTime.textContent = Math.floor(seconds / 60) + ':' + String(seconds % 60).padStart(2,'0');
      if (seconds >= 90) endSpeech();
    }, 250);
    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (Recognition) {
      state.recognition = new Recognition();
      state.recognition.lang = 'en-US';
      state.recognition.interimResults = true;
      state.recognition.continuous = true;
      state.recognition.onresult = function (event) {
        let words = '';
        for (let i = 0; i < event.results.length; i += 1) words += event.results[i][0].transcript;
        input.value = words.trim();
      };
      try { state.recognition.start(); } catch (error) { /* already started */ }
    } else {
      showToast('Keep holding. On supported phones, speech becomes text here.');
    }
  }

  function endSpeech() {
    if (!state.speaking) return;
    state.speaking = false;
    clearInterval(state.timer);
    speak.classList.remove('is-recording');
    speak.querySelector('b').textContent = 'Hold to talk';
    if (state.recognition) {
      try { state.recognition.stop(); } catch (error) { /* already stopped */ }
      state.recognition = null;
    }
    if (!input.value.trim() && (state.editMode === 'picture-change' || state.editMode === 'next-page')) {
      showToast('I could not hear that. Hold the button and try again, or type your change.');
      return;
    }
    if (!input.value.trim()) input.value = state.step === 0 ? 'A tiny dragon is lost in a giant library.' : questions[Math.max(0,state.step - 1)].fallback;
    showToast('Your voice is now editable text.');
  }

  speak.addEventListener('pointerdown', function (event) { event.preventDefault(); speak.setPointerCapture(event.pointerId); beginSpeech(); });
  speak.addEventListener('pointerup', endSpeech);
  speak.addEventListener('pointercancel', endSpeech);
  speak.addEventListener('keydown', function (event) {
    if ((event.key === ' ' || event.key === 'Enter') && !event.repeat) { event.preventDefault(); beginSpeech(); }
  });
  speak.addEventListener('keyup', function (event) {
    if (event.key === ' ' || event.key === 'Enter') { event.preventDefault(); endSpeech(); }
  });

  restoreIncomingCreation().finally(function () {
    creatorName.value = state.name;
    if (state.name) document.querySelector('[data-child-name]').textContent = state.name;
    refreshAccountState().finally(function () {
      if (state.restoredProject && hasAccount()) {
        setParentStageSnapshot();
        composer.hidden = true;
        setJourney('picture');
        yuMessage('<small>WELCOME BACK</small><h1>Your story is right where you left it.</h1><p>Yu restored ' + state.bookScenes.length + ' of ' + state.targetPages + ' ' + (state.outputType === 'film' ? 'scenes' : 'pages') + ', including your locked visual style.</p>');
        showBookContinuation();
        return;
      }
      if (!state.resumedGuestCreation || !hasAccount()) {
        showCreationStageChooser();
        return;
      }
      setJourney('picture');
      composer.hidden = true;
      setTimeout(function () {
        showResult(null, null);
        if (state.postSignupAction === 'download') setTimeout(downloadFinishedPicture, 500);
        else showToast('Welcome back—your picture and story are here. Keep creating with Yu!');
        try { localStorage.removeItem('storieslens_pending_guest_creation'); } catch (_error) { /* no-op */ }
      }, 350);
    });
  });
}());

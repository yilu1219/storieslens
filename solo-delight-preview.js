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
    resultImage: 'assets/original-garden-door-hd-v2.png'
  };

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

  const questions = [
    {
      title: 'Who is in your story?',
      copy: 'Start with one main character. What is their name, about how old are they, what do they look like, and what do they really want?',
      placeholder: 'Maya is about 8. She has short black hair, wears a yellow coat, and wants to find her way home…',
      fallback: 'Maya is about 8. She wears a yellow coat and wants to find her way home.',
      skill: 'character',
      reward: ['Character builder', 'You gave your hero a reason to act.']
    },
    {
      title: 'What is hard right now?',
      copy: 'Tell me one thing making the adventure tricky.',
      placeholder: 'The books are too tall, and he cannot see the door…',
      fallback: 'The books are too tall, and he cannot see the door.',
      skill: 'challenge',
      reward: ['Challenge finder', 'Now your reader has a reason to keep going.']
    },
    {
      title: 'What happens first?',
      copy: 'What would we see or hear in the very first scene?',
      placeholder: 'He sneezes a little flame and a hidden map glows…',
      fallback: 'He sneezes a little flame and a hidden map glows.',
      skill: 'sequence',
      reward: ['Scene starter', 'You turned an idea into something we can see.']
    }
  ];

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

  function selectedStylePrompt() {
    const styles = {
      'Storybook watercolor': 'premium luminous watercolor storybook illustration',
      'Graphic novel': 'polished graphic-novel illustration with clean readable staging',
      'Block world': 'original colorful voxel block-world story art with cubic environments and friendly block-built characters',
      'Cyber future': 'ultra-modern optimistic future-world cinematic concept art with luminous architecture, floating transit, sky gardens, and child-friendly wonder',
      'Cinematic fantasy': 'cinematic fantasy story art with dramatic magical light',
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
    if (!urls.length) return '<div class="real-life-empty" aria-hidden="true"><span>＋</span><b>Your photos</b></div>';
    return '<div class="real-life-photo-grid count-' + Math.min(3, urls.length) + '">' + urls.map(function (url, index) {
      return '<img src="' + escapeHtml(url) + '" alt="Uploaded protagonist ' + (index + 1) + '" />';
    }).join('') + '</div>';
  }

  async function ensurePersonalPhotoConsent(consentPanel) {
    if (state.personalPhotoConsentId && state.projectId) return state.personalPhotoConsentId;
    const session = await apiJson('/api/auth/session');
    if (!session.authenticated || session.user?.kind !== 'account') {
      throw new Error('Please sign in with an adult-owned account before sending a real-person photo to Yu.');
    }
    if (!state.projectId) {
      const projectResult = await apiJson('/api/projects', {
        method: 'POST',
        body: JSON.stringify({
          title: state.storyTitle || 'My first StoriesLens scene',
          language: 'en',
          ageGroup: 'under18',
          mode: 'solo',
          visibility: 'private',
          sourceType: 'personal-photo',
          sourceText: state.originalScene,
          draft: state.revisedScene,
          storyDna: { source: 'solo-delight', createdAt: new Date().toISOString() },
          scenes: [],
          clientSnapshot: { from: 'solo-delight', personalPhotoDraft: true }
        })
      });
      state.projectId = projectResult.project.id;
    }
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
    const referenceImages = uploadedReferenceUrls().slice(0, 3);
    const needsPersonalPhotoConsent = referenceImages.length > 0 && (state.selectedStyle === 'Real-life story' || state.uploadContainsRealPerson);
    const consentId = needsPersonalPhotoConsent ? await ensurePersonalPhotoConsent(consentPanel) : '';
    const storyPrompt = [
      'Create one finished square story scene from the child’s own writing.',
      'Story: ' + state.revisedScene,
      'Visual direction: ' + selectedStylePrompt() + '.',
      state.pictureChangeRequest ? 'Change only this requested detail: ' + state.pictureChangeRequest + '.' : '',
      referenceImages.length ? 'Use all ' + referenceImages.length + ' attached approved reference ' + (referenceImages.length === 1 ? 'image' : 'images') + '. Each reference is a separate protagonist. Preserve each person’s own face, age, skin tone, hairstyle, clothing, and body proportions. Keep the identities separate: do not blend or swap faces, do not omit anyone, include each protagonist exactly once, and do not add extra people.' : '',
      'Do not add text, captions, logos, watermarks, UI, arrows, or play icons.'
    ].filter(Boolean).join('\n');
    const result = await apiJson('/api/generate-image', {
      method: 'POST',
      headers: { 'Idempotency-Key': 'solo-' + Date.now() + '-' + Math.random().toString(36).slice(2) },
      body: JSON.stringify({
        projectId: state.projectId || 'solo-preview',
        partId: 'first-scene',
        submissionId: 'solo-' + Date.now(),
        prompt: storyPrompt,
        studentWriting: state.revisedScene,
        style: selectedStylePrompt(),
        aspectRatio: '1:1',
        referenceImageUrls: referenceImages,
        personalPhoto: needsPersonalPhotoConsent,
        personalPhotoConsentId: consentId
      })
    });
    if (!result.imageUrl) throw new Error('Yu finished drawing, but the new picture did not arrive. Please try again.');
    state.resultImage = result.imageUrl;
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

  function celebrate() {
    celebration.hidden = false;
    celebration.innerHTML = '';
    const colors = ['#087a54','#f3c767','#d98d73','#9e80bd','#72b6d8'];
    for (let i = 0; i < 42; i += 1) {
      const bit = document.createElement('i');
      bit.className = 'confetti';
      bit.style.left = Math.random() * 100 + '%';
      bit.style.background = colors[i % colors.length];
      bit.style.animationDelay = Math.random() * .35 + 's';
      bit.style.setProperty('--drift', (Math.random() * 180 - 90) + 'px');
      celebration.appendChild(bit);
    }
    setTimeout(function () { celebration.hidden = true; }, 2200);
  }

  function showGreeting() {
    setJourney('idea');
    yuMessage('<small>YU · YOUR STORY MENTOR</small><h1>Hi! What shall we imagine today?</h1><p>Upload a drawing, photo, or portrait—or tell me one idea. I’ll help with the next step.</p><p class="tiny-note">You make every story choice. I help you find the words.</p>', 'yu-greeting');
    state.currentPrompt = 'Hi! Upload a drawing, photo, or portrait—or tell me one tiny idea. Just three words can be enough.';
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

  function showRevision() {
    setJourney('polish');
    composer.hidden = true;
    const original = state.answers.slice(0,4).join(' ');
    const revision = buildRevision(original);
    const revised = revision.text;
    const lesson = revision.lesson;
    const changeCount = revision.changes.length;
    state.originalScene = original;
    state.revisedScene = revised;
    state.revisionReason = revision.reason;
    state.storyTitle = revision.title;
    state.resultImage = state.characterImageUrl || state.imageUrl || revision.image;
    state.currentPrompt = 'Listen to your first scene. I kept every idea and only fixed grammar. Then I will show you each change. Is this still what you meant?';
    yuMessage('<small>YOUR FIRST SCENE</small><h2>Your story is still your story.</h2><p>I did not rewrite it. I only fixed the grammar, spelling, capitals, and punctuation.</p><p class="grammar-change-count">✓ Yu found ' + changeCount + ' grammar ' + (changeCount === 1 ? 'change' : 'changes') + ' and will teach you one useful rule.</p>' +
      '<div class="revision-card">' +
        '<div class="revision-section"><small>YOU SAID</small><blockquote>' + escapeHtml(original) + '</blockquote></div>' +
        '<div class="revision-section suggestion"><small>YU’S GRAMMAR-ONLY VERSION</small><blockquote>' + escapeHtml(revised) + '</blockquote><button class="why-button" type="button" data-why>▶ What grammar changed?</button><div class="grammar-change-panel" data-why-copy hidden><p>' + escapeHtml(revision.reason) + '</p><ol>' + revision.changes.map(function (change) { return '<li><strong>' + escapeHtml(change.before) + ' → ' + escapeHtml(change.after) + '</strong><span>' + escapeHtml(change.skill + ': ' + change.explanation) + '</span></li>'; }).join('') + '</ol></div></div>' +
        '<div class="yu-grammar-lesson"><div class="yu-lesson-heading"><span aria-hidden="true">✦</span><div><small>YU TEACHES ONE GRAMMAR POINT</small><h3>' + escapeHtml(lesson.title) + '</h3></div></div><p>' + escapeHtml(lesson.explanation) + '</p><blockquote>' + escapeHtml(lesson.example) + '</blockquote><button type="button" data-hear-grammar>▶ Hear Yu teach me</button></div>' +
        '<div class="revision-actions"><button class="change-button" type="button" data-revise-change>Let me change it</button><button class="keep-button" type="button" data-revise-keep>Yes—that is my story</button></div>' +
      '</div>');
    state.voiceMood = 'story';
    setTimeout(function () { speakText('Listen to your first scene. ' + revised + ' Is this what you mean?', 'story'); }, 450);
    const latest = thread.lastElementChild;
    latest.querySelector('[data-why]').addEventListener('click', function () {
      const whyCopy = latest.querySelector('[data-why-copy]');
      whyCopy.hidden = !whyCopy.hidden;
      speakText(revision.reason, 'lesson');
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
    const sentences = state.answers.slice(0,4).map(cleanSentence).filter(Boolean);
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

  function finishRevision(revised) {
    setLearning('revision', revised, creatorLabel() + ' compared the original wording with a clearer version and confirmed the meaning.');
    reward('Story editor', 'You checked that the clearer sentence still means what you wanted.', 3);
    giftCount.textContent = String(Number(giftCount.textContent || 0) + 1);
    celebrate();
    showToast('Surprise! Your careful revision unlocked picture #2.');
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
        '<button class="style-card" type="button" data-style="Cinematic fantasy"><img src="assets/original-garden-door-hd-v2.png" alt="Cinematic fantasy example" /><span><b>Movie magic</b><small>Dramatic cinematic light</small></span></button>' +
        '<button class="style-card real-life-style" type="button" data-style="Real-life story" data-real-life="true" aria-disabled="' + (state.userUploadedReference ? 'false' : 'true') + '">' + realLifePreview + '<span><b>Real-life story</b><small>' + (state.userUploadedReference ? 'Uses all ' + referenceCount + ' uploaded ' + (referenceCount === 1 ? 'character' : 'characters') : 'Upload 1–3 characters first') + '</small></span></button>' +
      '</div>' +
      '<section class="real-life-consent" data-real-life-consent hidden><div><small>PRIVATE REAL-PERSON PHOTOS</small><h3>A grown-up confirms before Yu creates</h3><p>The ' + referenceCount + ' prepared ' + (referenceCount === 1 ? 'photo is' : 'photos are') + ' sent only when you press the green create button. They stay private and can be permanently deleted with the project.</p></div><label><span>Adult name</span><input type="text" maxlength="100" autocomplete="name" data-photo-adult-name placeholder="Parent, guardian, or adult with permission" /></label><label><span>Relationship</span><select data-photo-relationship><option value="">Choose one</option><option value="Self">I am the adult pictured</option><option value="Parent">Parent</option><option value="Legal guardian">Legal guardian</option></select></label><label class="consent-check"><input type="checkbox" data-photo-permission /><span>I am 18 or older and I am pictured or have permission for every person shown from their parent/legal guardian.</span></label><label class="consent-check"><input type="checkbox" data-photo-processing /><span>I agree that these prepared copies may be processed by the regional image model to create this private story scene.</span></label></section>' +
      '<button class="make-picture-button" type="button" data-make-picture disabled>Choose a style first</button></section>');
    const styleStage = message.querySelector('[data-style-stage]');
    const makeButton = message.querySelector('[data-make-picture]');
    const consentPanel = message.querySelector('[data-real-life-consent]');
    function realLifeConsentReady() {
      if (state.selectedStyle !== 'Real-life story') return true;
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
      makeButton.disabled = !realLifeConsentReady();
      if (state.selectedStyle === 'Real-life story' && !realLifeConsentReady()) {
        makeButton.textContent = 'Complete the grown-up confirmation';
        return;
      }
      makeButton.textContent = state.selectedStyle === 'Real-life story'
        ? (state.outputType === 'film' ? '✦ Put me in my first movie frame' : '✦ Put me in my story picture')
        : (state.outputType === 'film' ? '✦ Make my first movie frame' : '✦ Make my free first picture');
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
    message.querySelectorAll('[data-style]').forEach(function (card) {
      card.addEventListener('click', function () {
        if (card.dataset.realLife === 'true' && !state.userUploadedReference) {
          showToast('Upload a photo first so Yu can keep the real person as the main character.');
          return;
        }
        message.querySelectorAll('[data-style]').forEach(function (item) { item.classList.remove('is-selected'); });
        card.classList.add('is-selected');
        state.selectedStyle = card.dataset.style;
        consentPanel.hidden = state.selectedStyle !== 'Real-life story';
        refreshMakeButton();
        if (!consentPanel.hidden) consentPanel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        speakText(card.dataset.style + ' selected!', 'celebration');
      });
    });
    consentPanel.querySelectorAll('input,select').forEach(function (field) {
      field.addEventListener('input', refreshMakeButton);
      field.addEventListener('change', refreshMakeButton);
    });
    makeButton.addEventListener('click', function () { showDrawing(consentPanel); });
  }

  async function showDrawing(consentPanel) {
    const hasReference = uploadedReferenceUrls().length > 0;
    const realLifeMode = state.selectedStyle === 'Real-life story';
    const referenceNotice = realLifeMode
      ? '<div class="reference-lock-note"><span>✓</span><div><strong>Real-life version uses your uploaded photo</strong><small>Yu keeps the same face, age, hairstyle, clothes, and number of people while placing them inside the story scene.</small></div></div>'
      : (hasReference ? '<div class="reference-lock-note"><span>✓</span><div><strong>Your uploaded picture is the main reference</strong><small>Yu keeps the same person or character identity and changes only the story scene and chosen style.</small></div></div>' : '<div class="reference-lock-note is-words"><span>✦</span><div><strong>Building from your words</strong><small>No picture was uploaded, so Yu follows the character details you described.</small></div></div>');
    const changeNotice = state.pictureChangeRequest ? '<div class="change-lock-note"><strong>Changing only:</strong> “' + escapeHtml(state.pictureChangeRequest) + '”<small>Everything else stays locked.</small></div>' : '';
    const drawing = yuMessage('<small>YU IS CREATING WITH YOUR WORDS</small><h2>Watch your first ' + (state.outputType === 'film' ? 'movie frame' : 'story picture') + ' appear…</h2><p class="tiny-note">Format: ' + escapeHtml(state.outputType === 'film' ? 'Story film' : 'Illustrated book') + ' · Style: ' + escapeHtml(state.selectedStyle) + '</p>' + referenceNotice + changeNotice + '<div class="drawing-stage"><img src="' + escapeHtml(state.resultImage) + '" alt="A picture forming from the creator’s story" /><span class="wand">✦</span></div><div class="drawing-status"><div class="progress-track"><i data-draw-progress></i></div><b data-draw-title>' + (state.pictureChangeRequest ? 'Changing only the detail you named' : 'Keeping your characters and story details') + '</b><span data-draw-subtitle>No need to stay here—your story is already saved.</span></div>', 'drawing-card');
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
      await generateStoryPicture(consentPanel);
      clearInterval(progressTimer);
      progress.style.width = '100%';
      title.textContent = 'Your picture is ready!';
      setTimeout(function () { showResult(drawing); }, 220);
    } catch (error) {
      clearInterval(progressTimer);
      drawing.remove();
      const message = error.code === 'PERSONAL_PHOTO_CONSENT_REQUIRED'
        ? 'A grown-up needs to confirm the private photo permission again.'
        : error.message;
      yuMessage('<small>YU KEPT YOUR WORK SAFE</small><h2>The new picture was not charged.</h2><p>' + escapeHtml(message) + '</p><button class="why-button" type="button" data-picture-retry>← Return to picture choices</button>');
      showToast(message);
      thread.lastElementChild.querySelector('[data-picture-retry]').addEventListener('click', showStyles);
    }
  }

  function showResult(progressMessage) {
    const pictureStep = document.querySelector('[data-step-dot="picture"]');
    pictureStep.classList.remove('is-active');
    pictureStep.classList.add('is-done');
    pictureStep.querySelector('span').textContent = '✓';
    celebrate();
    const resultImage = state.resultImage || (state.selectedStyle === 'Real-life story' && state.imageUrl ? state.imageUrl : 'assets/original-garden-door-hd-v2.png');
    const result = yuMessage('<div class="result-card"><div class="result-picture-wrap"><img class="result-picture" data-result-image src="' + escapeHtml(resultImage) + '" alt="' + (state.selectedStyle === 'Real-life story' ? 'Real-life story preview made from the uploaded photo' : 'Illustration preview based on the creator’s story') + '" /></div><div class="result-copy"><span class="result-origin">✦ MADE FROM ' + escapeHtml(possessiveName().toUpperCase()) + (state.selectedStyle === 'Real-life story' ? ' PHOTO &amp; WORDS' : ' WORDS') + '</span><small>' + (state.outputType === 'film' ? 'YOUR FIRST MOVIE FRAME' : 'YOUR FIRST STORY PAGE') + '</small><h2>' + escapeHtml(state.storyTitle) + '</h2><p>' + escapeHtml(state.revisedScene) + '</p><div class="result-actions"><button class="result-action primary" type="button" data-result="keep">I love it</button><button class="result-action" type="button" data-result="change">Change something</button><button class="result-action" type="button" data-result="again">Try again · 1 gift</button></div></div></div>');
    if (progressMessage) progressMessage.remove();
    const image = result.querySelector('[data-result-image]');
    image.addEventListener('error', function handleResultImageError() {
      image.removeEventListener('error', handleResultImageError);
      image.src = state.selectedStyle === 'Real-life story' && state.imageUrl ? state.imageUrl : 'assets/original-garden-door-hd-v2.png';
      showToast(state.selectedStyle === 'Real-life story' ? 'Yu restored your prepared photo. Your story is still saved.' : 'Yu restored the picture preview. Your story is still saved.');
    });
    window.requestAnimationFrame(function () { result.scrollIntoView({ behavior: 'smooth', block: 'start' }); });
    setTimeout(function () { speakText((state.name ? state.name + ', ' : '') + 'your first story page is ready! You imagined it, revised it, and made it visible!', 'celebration'); }, 350);
    result.querySelectorAll('[data-result]').forEach(function (button) {
      button.addEventListener('click', function () {
        if (button.dataset.result === 'keep') {
          showToast('Saved! Chapter 1 is ready for the next adventure.');
          reportButton.disabled = false;
          reportButton.textContent = 'Open ' + (state.name ? state.name + '’s' : 'the creator’s') + ' full learning report';
          setTimeout(showAuthorCard, 420);
        } else if (button.dataset.result === 'change') {
          startPictureChange();
        } else {
          showToast('Preview only: a real retry would confirm the gift before drawing.');
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
    const remaining = Number(giftCount.textContent || 0);
    const review = yuMessage('<small>YU CHECKS YOUR CHANGE</small><h2>I will change only this:</h2><blockquote class="change-request">“' + escapeHtml(request) + '”</blockquote><p>I will keep the same characters, faces, clothes, story facts, and selected style. Regenerating uses 1 picture gift.</p><div class="picture-change-review"><button type="button" data-confirm-picture-change' + (remaining < 1 ? ' disabled' : '') + '>Use 1 gift &amp; update</button><button type="button" data-cancel-picture-change>Keep my current picture</button></div>');
    review.querySelector('[data-confirm-picture-change]').addEventListener('click', function () {
      const gifts = Number(giftCount.textContent || 0);
      if (gifts < 1) {
        showToast('No picture gifts left. Your current picture is still saved.');
        return;
      }
      giftCount.textContent = String(gifts - 1);
      state.pictureChangeRequest = request;
      showToast('Yu is changing only the part you named.');
      setTimeout(showDrawing, 350);
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
      '<div class="author-card" data-author-card><div class="author-card-top"><div class="author-photo" data-author-photo-preview>' + escapeHtml(initial) + '</div><div class="author-info"><small>STORIESLENS YOUNG AUTHOR</small><h2>' + escapeHtml(displayName) + '</h2><p>Author of <i>' + escapeHtml(state.storyTitle) + '</i></p></div></div><input type="file" accept="image/jpeg,image/png,image/webp,image/heic,image/heif" data-author-photo hidden /><label class="author-photo-action">＋ Add my author photo</label><p class="author-photo-note">Optional · private by default · a grown-up controls sharing.</p><div class="author-badges"><span>✦ Original Voice</span><span>✦ Character Builder</span><span>✦ Story Editor</span></div></div>' +
      '<section class="star-bank"><div class="star-bank-head"><h3>My star bank</h3><span class="star-balance" data-star-balance>★ ' + state.stars + '</span></div><p>Stars come from real creating—not screen time.</p><div class="reward-shop"><button type="button" data-redeem="5"><span>Choose a special book-cover frame</span><b>5 ★</b></button><button type="button" data-redeem="10"><span>Add a gold author seal</span><b>10 ★</b></button><button type="button" data-redeem="20" disabled><span>Unlock one extra illustration</span><b>20 ★</b></button></div><p class="reward-principle">Learning stars stay private. No public ranking and no lost streaks.</p></section>' +
      '<section class="showcase-box"><div class="showcase-head"><div><small>MONTHLY YOUNG AUTHORS FESTIVAL</small><h3>Secret Worlds</h3></div><span class="private-chip">PRIVATE UNTIL APPROVED</span></div><p>A grown-up can submit this story to the monthly showcase. Readers respond with encouragement, not dislikes.</p><div class="warm-reactions"><span>❤️ I love this character</span><span>✨ So imaginative</span><span>📖 What happens next?</span><span>🎨 Beautiful story world</span></div><div class="showcase-rules"><span><b>✓</b> No live popularity ranking</span><span><b>✓</b> Reader’s Choice announced after the month ends</span><span><b>✓</b> Learning stars never depend on votes</span></div><button class="showcase-request" type="button" data-showcase-request>Ask a grown-up to enter my story</button></section>');

    const photoInput = card.querySelector('[data-author-photo]');
    const photoLabel = card.querySelector('.author-photo-action');
    photoLabel.addEventListener('click', function () { photoInput.click(); });
    photoInput.addEventListener('change', function () {
      const file = photoInput.files && photoInput.files[0];
      if (!file) return;
      const photoUrl = URL.createObjectURL(file);
      card.querySelector('[data-author-photo-preview]').innerHTML = '<img src="' + photoUrl + '" alt="Author photo preview" />';
      showToast('Author photo added privately.');
    });
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

  function characterPreviewAsset(words) {
    const lower = String(words || '').toLowerCase();
    if (lower.includes('egypt') || lower.includes('time')) return 'assets/outcome-film-hd-v2.png';
    if (lower.includes('fox') || lower.includes('wing')) return 'assets/portal-solo-watercolor-v4.jpg';
    const choices = ['assets/original-garden-door-hd-v2.png', 'assets/outcome-comic-hd-v2.png', 'assets/portal-solo-watercolor-v4.jpg'];
    const selected = choices[state.characterPreviewIndex % choices.length];
    state.characterPreviewIndex += 1;
    return selected;
  }

  function showCharacterPreview(chargeRetry) {
    const words = input.value.trim();
    if (!words) {
      showToast('First tell Yu who the character is—even three words are enough.');
      input.focus();
      return;
    }
    if (chargeRetry === true) {
      const remaining = Number(giftCount.textContent || 0);
      if (remaining < 1) {
        showToast('No picture gifts left. You can keep the current look or upload your own picture.');
        return;
      }
      giftCount.textContent = String(remaining - 1);
    }
    characterGenerate.classList.add('is-making');
    characterGenerate.innerHTML = '<span aria-hidden="true">✦</span> Sketching your character…';
    setTimeout(function () {
      const previewUrl = characterPreviewAsset(words);
      state.characterPreviewMade = true;
      const card = yuMessage('<small>FREE CHARACTER PREVIEW</small><h2>Is this how you imagine them?</h2><p>This is only a look-check. It does not use a picture credit.</p><div class="character-preview"><img src="' + previewUrl + '" alt="Character preview based on the child’s words" /><div class="character-preview-actions"><button type="button" data-keep-character>Yes, keep this character</button><button type="button" data-try-character>Try another look</button></div></div>');
      card.querySelector('[data-keep-character]').addEventListener('click', function () {
        state.characterImageUrl = previewUrl;
        showToast('Character look saved for this story.');
        card.querySelector('[data-keep-character]').textContent = '✓ Character saved';
      });
      const retry = card.querySelector('[data-try-character]');
      retry.textContent = 'Try another · 1 credit';
      retry.addEventListener('click', function () { showCharacterPreview(true); });
      characterGenerate.classList.remove('is-making');
      characterGenerate.innerHTML = '<span aria-hidden="true">✦</span> Make another · 1 credit';
    }, 650);
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
  characterGenerate.addEventListener('click', function () { showCharacterPreview(state.characterPreviewMade); });
  document.querySelector('[data-parent-toggle]').addEventListener('click', function () { parentPanel.classList.add('is-open'); });
  document.querySelector('[data-parent-close]').addEventListener('click', function () { parentPanel.classList.remove('is-open'); });

  upload.addEventListener('change', async function () {
    const files = Array.from(upload.files || []);
    if (!files.length) return;
    if (files.length > 3) {
      upload.value = '';
      showToast('Choose up to three character pictures at one time.');
      return;
    }
    uploadEntry.querySelector('strong').textContent = 'Preparing ' + files.length + ' ' + (files.length === 1 ? 'picture' : 'pictures') + ' privately…';
    uploadEntry.querySelector('small').textContent = 'Removing location and camera information from every picture on this device.';
    try {
      if (!window.StoriesLensArtworkSafety) throw new Error('The private picture preparation tool did not load. Refresh and try again.');
      const preparedImages = await Promise.all(files.map(function (file) { return window.StoriesLensArtworkSafety.processArtwork(file); }));
      if (state.imageUrl && state.imageUrl.startsWith('blob:')) URL.revokeObjectURL(state.imageUrl);
      state.referenceImages = preparedImages.map(function (prepared, index) {
        return { dataUrl: prepared.dataUrl, name: files[index].name, containsRealPerson: Boolean(prepared.review?.checks?.realPerson), convertedFromHeic: Boolean(prepared.convertedFromHeic) };
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
      showToast(files.length + ' ' + (files.length === 1 ? 'character is' : 'characters are') + ' ready for this story.');
    } catch (error) {
      state.imageUrl = '';
      state.referenceImages = [];
      state.userUploadedReference = false;
      uploadEntry.querySelector('strong').textContent = 'This picture could not be prepared';
      uploadEntry.querySelector('small').textContent = error.message || 'Try a JPG, PNG, WEBP, HEIC, or HEIF photo.';
      showToast(uploadEntry.querySelector('small').textContent);
    }
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
    if (!input.value.trim() && state.editMode === 'picture-change') {
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

  try {
    state.name = localStorage.getItem('storieslens-preview-creator-name') || '';
  } catch (error) {
    state.name = '';
  }
  creatorName.value = state.name;
  if (state.name) document.querySelector('[data-child-name]').textContent = state.name;
  showGreeting();
}());

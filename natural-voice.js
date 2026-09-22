(() => {
  const synth = window.speechSynthesis;
  const voiceCache = { en: null, zh: null };

  const languagePrefix = (lang = "en-US") => String(lang).toLowerCase().startsWith("zh") ? "zh" : "en";

  const performanceProfiles = {
    en: {
      warm: { rate: 0.92, pitch: 0.98 },
      guide: { rate: 0.93, pitch: 0.99 },
      theatrical: { rate: 0.93, pitch: 0.99 },
      question: { rate: 0.9, pitch: 0.99 },
      story: { rate: 0.89, pitch: 0.98 },
      lesson: { rate: 0.87, pitch: 0.97 },
      celebration: { rate: 0.95, pitch: 1 }
    },
    zh: {
      warm: { rate: 0.9, pitch: 0.98 },
      guide: { rate: 0.92, pitch: 0.99 },
      theatrical: { rate: 0.92, pitch: 0.99 },
      question: { rate: 0.89, pitch: 0.99 },
      story: { rate: 0.88, pitch: 0.98 },
      lesson: { rate: 0.86, pitch: 0.97 },
      celebration: { rate: 0.94, pitch: 1 }
    }
  };

  const profileFor = (lang = "en-US", mood = "warm") => {
    const prefix = languagePrefix(lang);
    const performance = performanceProfiles[prefix][mood] || performanceProfiles[prefix].warm;
    return { lang: prefix === "zh" ? "zh-CN" : "en-US", rate: performance.rate, pitch: performance.pitch, volume: 1 };
  };

  function voiceScore(voice, lang) {
    const prefix = languagePrefix(lang);
    const haystack = `${voice.name || ""} ${voice.voiceURI || ""}`;
    const voiceLang = String(voice.lang || "").toLowerCase();
    if (!voiceLang.startsWith(prefix)) return -1000;

    let score = voiceLang === profileFor(lang).lang.toLowerCase() ? 20 : 8;
    if (/natural|neural|online/i.test(haystack)) score += 120;
    if (/premium|enhanced|high.?quality/i.test(haystack)) score += 90;

    const clearNarrator = prefix === "zh"
      ? /yunxi|yunjian|yunyang|xiaobei|tingting|meijia|kangkang|普通话.*(?:男|女)/i
      : /google us english|microsoft (?:andrew|brian|guy)|daniel|alex|aaron|arthur|christopher|eric|samantha/i;
    if (clearNarrator.test(haystack)) score += 75;

    const warmMale = prefix === "zh"
      ? /yunxi|yunjian|yunyang|xiaobei|kangkang|yong|li-mu|male|普通话.*男/i
      : /andrew|brian|guy|ryan|christopher|eric|daniel|aaron|arthur|reed|evan|lee|rishi|male/i;
    if (warmMale.test(haystack)) score += 45;
    if (/compact|espeak|festival|novelty|whisper|zarvox|bells|bad news|good news|eddy|rocko|grandma|grandpa|flo|sandy|shelley|boing|organ|superstar/i.test(haystack)) score -= 180;
    if (voice.default) score += 3;
    return score;
  }

  function preferredVoice(lang = "en-US") {
    if (!synth?.getVoices) return null;
    const prefix = languagePrefix(lang);
    if (voiceCache[prefix]) return voiceCache[prefix];
    const candidates = synth.getVoices()
      .filter((voice) => String(voice.lang || "").toLowerCase().startsWith(prefix))
      .sort((left, right) => voiceScore(right, lang) - voiceScore(left, lang));
    voiceCache[prefix] = candidates[0] || null;
    return voiceCache[prefix];
  }

  function configureUtterance(utterance, lang = "en-US", mood = "warm") {
    const profile = profileFor(lang, mood);
    utterance.lang = profile.lang;
    utterance.rate = profile.rate;
    utterance.pitch = profile.pitch;
    utterance.volume = profile.volume;
    const voice = preferredVoice(profile.lang);
    if (voice) utterance.voice = voice;
    return utterance;
  }

  function refreshVoices() {
    voiceCache.en = null;
    voiceCache.zh = null;
    preferredVoice("en-US");
    preferredVoice("zh-CN");
  }

  if (synth?.getVoices) {
    synth.getVoices();
    synth.addEventListener?.("voiceschanged", refreshVoices);
    window.setTimeout(refreshVoices, 0);
  }

  window.StoriesLensNaturalVoice = { configureUtterance, preferredVoice, profileFor, refreshVoices };
})();

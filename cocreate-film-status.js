function hasSecret(value) {
  return Boolean(String(value || "").trim());
}

function cocreateAiVideoStatus(env = process.env) {
  const safetyEnabled = env.SAFE_VIDEO_GENERATION_ENABLED === "true";
  const openRouterReady = hasSecret(env.OPENROUTER_API_KEY);
  const chinaReady = env.CHINA_ARK_VIDEO_ENABLED === "true" && hasSecret(env.CHINA_ARK_API_KEY) && hasSecret(env.CHINA_ARK_VIDEO_MODEL || "doubao-seedance-2-0-mini-260615");
  const providerReady = openRouterReady || chinaReady;
  const configured = safetyEnabled && providerReady;
  return {
    aiVideoConfigured: configured,
    safetyEnabled,
    providerReady,
    fallbackAvailable: true,
    noticeZh: configured
      ? "已接通 AI 视频生成。将先尝试为有画面的场景生成镜头，再用 FFmpeg 拼接成 MP4。若某一镜失败，会改用这部共创短片的画面运动（Ken Burns / 翻页），不会把备选短片说成 Seedance 生成。"
      : "当前没有接通可用的 AI 视频（Seedance / 方舟）。你仍然可以共创并一键生成可播放的 H.264 MP4：这是根据场景照片和文字做成的画面运动短片，不是 Seedance 生成的 AI 镜头。预览和这部短片今天免费。",
    noticeEn: configured
      ? "AI video generation is connected. We will try to generate a clip for scenes that have a picture, then stitch them with FFmpeg. If a clip cannot be made, that scene uses a motion slideshow instead, and we will not label the fallback as a Seedance-generated clip."
      : "AI video generation (Seedance / Ark) is not connected here. You can still co-create and make a playable H.264 MP4 in one tap. That film is a motion slideshow made from your scenes and text, not a Seedance-generated AI clip. Preview and this film are free today."
  };
}

module.exports = { cocreateAiVideoStatus };

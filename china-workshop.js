(async function () {
  const gates = document.querySelector("[data-online-gates]");
  const title = document.querySelector("[data-online-title]");
  const row = (ready, heading, text) => `<div class="check ${ready ? "" : "warn"}"><i>${ready ? "✓" : "!"}</i><div><b>${heading}</b><span>${text}</span></div></div>`;
  try {
    const status = await fetch("/api/platform/status", { cache: "no-store" }).then((response) => response.json());
    const chinaStorage = status.mediaStorage?.cn === "cloud-private";
    const auth = Boolean(status.features?.emailPhoneAuth) && status.dataMode === "production";
    const safety = Boolean(status.features?.safetyReview);
    title.textContent = chinaStorage && auth && safety ? "中国邀请制内测线路已就绪" : "现场可用；线上邀请仍被闸门保护";
    gates.innerHTML = [
      row(chinaStorage, "中国私密存储", chinaStorage ? "TOS 私密桶已连接。" : "上线前连接中国境内 TOS 私密桶。"),
      row(auth, "中国登录验证码", auth ? "生产短信/邮件投递已连接。" : "现场无需注册；线上版仍需短信或邮件服务。"),
      row(safety, "外部内容安全审核", safety ? "安全审核服务已连接。" : "生成式功能上线前必须接入并失败关闭。")
    ].join("");
  } catch {
    title.textContent = "现场工作坊可用；线上状态暂不可读";
    gates.innerHTML = row(false, "线上服务", "请通过 StoriesLens 服务器打开本页。");
  }

  const copy = async (path, label) => {
    const url = new URL(path, location.href).href;
    await navigator.clipboard.writeText(url);
    window.alert(`${label}已复制：\n${url}`);
  };
  document.querySelector("[data-copy-student]").addEventListener("click", () => copy("chinese-studio.html?workshop=cn&from=workshop", "学员入口"));
  document.querySelector("[data-copy-teacher]").addEventListener("click", () => copy("classroom-archive.html?new=1&workshop=cn", "教师入口"));
}());

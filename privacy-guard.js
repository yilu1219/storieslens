(() => {
  "use strict";

  const guardedActions = "[data-share], [data-public-share], [data-publish-public]";
  const approvedOnce = new WeakSet();

  const readSetup = () => {
    try { return JSON.parse(localStorage.getItem("storieslens_creator_setup") || "null"); }
    catch { return null; }
  };

  const localeIsChinese = () => document.documentElement.lang?.toLowerCase().startsWith("zh");
  const copy = (en, zh) => localeIsChinese() ? zh : en;

  function requestGuardianApproval(target) {
    const backdrop = document.createElement("div");
    backdrop.className = "guardian-gate-backdrop";
    backdrop.innerHTML = `
      <section class="guardian-gate" role="dialog" aria-modal="true" aria-labelledby="guardian-gate-title">
        <button class="guardian-gate-close" type="button" aria-label="${copy("Close", "关闭")}">×</button>
        <span class="guardian-gate-kicker">${copy("Guardian approval", "监护人确认")}</span>
        <h2 id="guardian-gate-title">${copy("An adult must approve this share.", "公开或分享前，需要监护人确认。")}</h2>
        <p>${copy("This project is private by default. A parent or legal guardian must review the work and approve each sharing action.", "该作品默认私密。家长或法定监护人需要先查看作品，并对本次分享单独确认。")}</p>
        <label><input type="checkbox" /> <span>${copy("I am the parent or legal guardian, and I approve sharing this project.", "我是家长或法定监护人，并同意本次分享。")}</span></label>
        <button class="guardian-gate-approve" type="button" disabled>${copy("Approve this share", "同意本次分享")}</button>
      </section>`;
    const style = document.createElement("style");
    style.textContent = ".guardian-gate-backdrop{position:fixed;z-index:10000;inset:0;display:grid;place-items:center;padding:20px;background:rgba(0,0,0,.72);backdrop-filter:blur(8px)}.guardian-gate{position:relative;width:min(520px,100%);padding:30px;border:1px solid rgba(255,255,255,.2);border-radius:18px;color:#161616;background:#fff;box-shadow:0 30px 90px rgba(0,0,0,.5);font-family:Inter,Arial,sans-serif}.guardian-gate h2{margin:10px 0;font-size:28px;line-height:1.12}.guardian-gate p{color:#5f626b;line-height:1.55}.guardian-gate label{display:flex;gap:10px;margin:20px 0;padding:14px;border:1px solid #d8d9df;border-radius:10px;line-height:1.4}.guardian-gate input{width:20px;height:20px;flex:0 0 auto}.guardian-gate-kicker{color:#8e382d;font-size:13px;font-weight:900;letter-spacing:.1em;text-transform:uppercase}.guardian-gate-close{position:absolute;top:12px;right:14px;border:0;background:transparent;font-size:28px;cursor:pointer}.guardian-gate-approve{width:100%;min-height:48px;border:0;border-radius:9px;color:#fff;background:#a83e32;font:inherit;font-weight:900;cursor:pointer}.guardian-gate-approve:disabled{opacity:.4;cursor:not-allowed}";
    backdrop.append(style);
    document.body.append(backdrop);
    const checkbox = backdrop.querySelector("input");
    const approve = backdrop.querySelector(".guardian-gate-approve");
    const close = () => backdrop.remove();
    backdrop.querySelector(".guardian-gate-close").addEventListener("click", close);
    backdrop.addEventListener("click", (event) => { if (event.target === backdrop) close(); });
    checkbox.addEventListener("change", () => { approve.disabled = !checkbox.checked; });
    approve.addEventListener("click", () => {
      approvedOnce.add(target);
      close();
      target.click();
    });
    checkbox.focus();
  }

  document.addEventListener("click", (event) => {
    const target = event.target.closest?.(guardedActions);
    if (!target) return;
    if (approvedOnce.has(target)) {
      approvedOnce.delete(target);
      return;
    }
    const setup = readSetup();
    if (setup?.ageGroup !== "under18") return;
    event.preventDefault();
    event.stopImmediatePropagation();
    requestGuardianApproval(target);
  }, true);
})();

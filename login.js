(function () {
  "use strict";

  const platform = window.StoriesLensPlatform;
  const pageParams = new URLSearchParams(location.search);
  const requestedReturn = pageParams.get("return") || "";
  const referralCode = (pageParams.get("ref") || "").replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 100);
  const returnAfterLogin = /^(?:squad-board|my-stories|app|chinese-studio)\.html(?:[?#].*)?$/.test(requestedReturn) ? requestedReturn : "my-stories.html";
  const $ = (selector) => document.querySelector(selector);
  const startForm = $("[data-email-start]");
  const verifyForm = $("[data-email-verify]");
  const notice = $("[data-login-notice]");
  let challenge = null;
  let platformStatus = null;

  function selectedRegion() {
    return document.querySelector('input[name="login-region"]:checked')?.value || "";
  }

  function countryCode() {
    const region = selectedRegion();
    if (region === "cn") return "CN";
    if (region === "us") return "US";
    return $("[data-country-code]").value;
  }

  function showNotice(message, error) {
    notice.hidden = false;
    notice.textContent = message;
    notice.classList.toggle("is-error", Boolean(error));
  }

  function setBusy(form, busy) {
    form.querySelectorAll("button,input,select").forEach((element) => {
      if (element.matches('[data-change-email]')) return;
      if (busy) {
        element.dataset.loginWasDisabled = element.disabled ? "1" : "0";
        element.disabled = true;
        return;
      }
      if (element.dataset.loginWasDisabled === "0") element.disabled = false;
      delete element.dataset.loginWasDisabled;
    });
  }

  function populateCountries(status) {
    const select = $("[data-country-code]");
    const codes = Array.isArray(status.allowedInternationalCountries) ? status.allowedInternationalCountries : [];
    const names = typeof Intl.DisplayNames === "function" ? new Intl.DisplayNames([navigator.language || "en"], { type: "region" }) : null;
    select.replaceChildren();
    const placeholder = document.createElement("option");
    placeholder.value = "";
    placeholder.textContent = codes.length ? "Choose country · 请选择" : "International beta opening soon · 国际区域即将开放";
    select.append(placeholder);
    codes.forEach((code) => {
      const option = document.createElement("option");
      option.value = code;
      option.textContent = `${names?.of(code) || code} · ${code}`;
      select.append(option);
    });
    const international = document.querySelector('input[name="login-region"][value="intl"]');
    if (!codes.length && status.dataMode === "production") international.disabled = true;
  }

  function updateRegion() {
    const international = selectedRegion() === "intl";
    $("[data-country-field]").hidden = !international;
    $("[data-country-code]").disabled = !international;
    $("[data-country-code]").required = international;
  }

  async function loadStatus() {
    platformStatus = await platform.api("/api/platform/status");
    const openRegions = Array.isArray(platformStatus.registrationRegions) ? platformStatus.registrationRegions : ["cn", "us", "intl"];
    document.querySelectorAll('input[name="login-region"]').forEach((input) => {
      input.disabled = !openRegions.includes(input.value);
    });
    populateCountries(platformStatus);
    const inviteField = $("[data-beta-invite]");
    const inviteInput = $("[data-beta-invite-code]");
    inviteField.hidden = !platformStatus.beta?.inviteOnly;
    // Returning accounts already carry beta access. The server asks only a new
    // account for an invitation, so the browser must not block returning users.
    inviteInput.required = false;
  }

  document.querySelectorAll('input[name="login-region"]').forEach((input) => input.addEventListener("change", updateRegion));

  startForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const region = selectedRegion();
    const email = $("[data-email]").value.trim();
    if (!region) {
      showNotice("Choose where you will use StoriesLens. · 请先选择使用地区。", true);
      return;
    }
    if (region === "intl" && !countryCode()) {
      showNotice("Choose an available country or region. · 请选择具体国家或地区。", true);
      return;
    }
    if (!$("[data-email]").checkValidity()) {
      showNotice("Enter a valid email address. · 请输入正确的邮箱地址。", true);
      return;
    }
    setBusy(startForm, true);
    showNotice("Sending your private sign-in code… · 正在发送验证码……");
    try {
      challenge = await platform.api("/api/auth/start", { method: "POST", body: JSON.stringify({ method: "email", destination: email }) });
      $("[data-masked-email]").textContent = challenge.maskedDestination;
      $("[data-code-delivery-lead]").textContent = challenge.devCode
        ? "Local preview only—no email was sent to"
        : "A six-digit code was sent to";
      $("[data-code-delivery-zh]").textContent = challenge.devCode
        ? "本地预览模式：没有向此邮箱发送真实邮件。"
        : "请输入收到的6位验证码。";
      startForm.hidden = true;
      verifyForm.hidden = false;
      $("[data-code]").focus();
      showNotice(challenge.devCode
        ? `Local preview code: ${challenge.devCode} · 本地测试验证码：${challenge.devCode}`
        : "Code sent. It expires in 10 minutes. · 验证码已发送，10分钟内有效。"
      );
    } catch (error) {
      showNotice(`${error.message} · 暂时无法发送验证码，请稍后重试。`, true);
    } finally {
      setBusy(startForm, false);
    }
  });

  $("[data-change-email]").addEventListener("click", () => {
    challenge = null;
    verifyForm.hidden = true;
    startForm.hidden = false;
    $("[data-code]").value = "";
    notice.hidden = true;
    $("[data-email]").focus();
  });

  verifyForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!challenge) return;
    const verificationCode = $("[data-code]").value.replace(/\D/g, "");
    const adultConfirmed = $("[data-adult-confirm]").checked;
    if (!/^\d{6}$/.test(verificationCode) || !adultConfirmed) {
      showNotice("Enter the six-digit code and confirm the adult account owner. · 请输入验证码并确认成年人账户。", true);
      return;
    }
    setBusy(verifyForm, true);
    showNotice("Verifying securely… · 正在安全验证……");
    try {
      const result = await platform.api("/api/auth/verify", {
        method: "POST",
        body: JSON.stringify({
          challengeId: challenge.challengeId,
          code: verificationCode,
          method: "email",
          destination: $("[data-email]").value.trim(),
          displayName: $("[data-display-name]").value.trim() || "Creator",
          ageGroup: "adult",
          primaryRegion: selectedRegion(),
          countryCode: countryCode(),
          betaInviteCode: $("[data-beta-invite-code]").value.trim(),
          referralCode,
          locale: selectedRegion() === "cn" ? "zh" : "en"
        })
      });
      $("[data-login-form-wrap]").hidden = true;
      $("[data-login-success]").hidden = false;
      $("[data-success-copy]").textContent = `${result.user.displayName}, your private library is ready. · 私人作品库已经准备好。`;
      const successLink = $("[data-login-success] a");
      if (successLink) successLink.href = returnAfterLogin;
      window.setTimeout(() => { location.href = returnAfterLogin; }, 900);
    } catch (error) {
      showNotice(error.message, true);
      setBusy(verifyForm, false);
    }
  });

  Promise.all([platform.getSession(), loadStatus()]).then(([session]) => {
    if (!session.authenticated) return;
    $("[data-login-form-wrap]").hidden = true;
    $("[data-login-success]").hidden = false;
    $("[data-success-copy]").textContent = `${session.user.displayName}, you are already signed in. · 你已经登录。`;
  }).catch((error) => showNotice(error.message, true));
}());

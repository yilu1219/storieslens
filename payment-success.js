(() => {
  const params = new URLSearchParams(location.search);
  const sessionId = params.get("session_id") || "";
  const icon = document.querySelector("[data-payment-icon]");
  const title = document.querySelector("[data-payment-title]");
  const copy = document.querySelector("[data-payment-copy]");
  const action = document.querySelector("[data-payment-action]");
  const note = document.querySelector("[data-payment-note]");
  const wait = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

  function showPaid(order) {
    icon.textContent = "✓";
    title.textContent = "Your allowance is ready.";
    copy.textContent = `${order.name} has been verified and added to your private account.`;
    note.textContent = "Stripe will send the purchaser a receipt. StoriesLens does not store card details.";
    window.StoriesLensAnalytics?.track("payment_verified", { offer: order.offerId });
  }

  function showPending() {
    icon.textContent = "…";
    title.textContent = "Payment confirmation is still arriving.";
    copy.textContent = "Some payment methods take a little longer. You can safely open your library; the allowance will appear after Stripe confirms payment.";
    note.textContent = "Do not pay again while this purchase is processing.";
  }

  function showNotFound(message) {
    icon.textContent = "!";
    title.textContent = "We could not verify this return link.";
    copy.textContent = message || "Sign in with the purchasing account and check your allowance history.";
    action.textContent = "Sign in or open my library →";
    note.textContent = "No allowance is granted from this page without a signed Stripe payment event.";
  }

  async function verify() {
    window.StoriesLensAnalytics?.track("payment_return_viewed", { provider: "stripe" });
    if (!/^cs_(?:test|live)_/.test(sessionId)) {
      showNotFound("This page does not contain a valid Stripe checkout reference.");
      return;
    }
    for (let attempt = 0; attempt < 8; attempt += 1) {
      const response = await fetch(`/api/payments/checkout-status?session_id=${encodeURIComponent(sessionId)}`, { headers: { Accept: "application/json" } });
      const result = await response.json().catch(() => ({}));
      if (response.status === 401) {
        action.href = `/login.html?returnTo=${encodeURIComponent(`${location.pathname}${location.search}`)}`;
        showNotFound("Sign in with the adult account that completed this purchase.");
        return;
      }
      if (response.ok && result.order?.status === "paid") {
        showPaid(result.order);
        return;
      }
      if (response.ok && ["payment_verification_failed", "payment_failed", "expired", "refunded_review"].includes(result.order?.status)) {
        showNotFound("This purchase needs review. Please contact support@storieslens.com and include the Stripe receipt number.");
        return;
      }
      if (attempt < 7) await wait(1500);
    }
    showPending();
  }

  verify().catch(() => showPending());
})();

(() => {
  const offers = {
    "story-pass": {
      name: "Story Pass",
      price: "$19",
      total: "$19 USD",
      description: "Turn one finished story into a book or comic your family can keep.",
      features: [
        "Full Story Coach for one project",
        "Invite up to 5 collaborators",
        "12 visual scene generations",
        "Illustrated layout and downloadable edition"
      ]
    },
    "guided-squad": {
      name: "Guided Story Squad",
      price: "$49",
      total: "$49 USD",
      description: "Reserve one founding-cohort seat. Your deposit applies to the $129 total.",
      features: [
        "3 guided creation sessions",
        "A 5–6 creator cohort",
        "Shared story world and full coaching",
        "Digital book plus a 30–60 second trailer"
      ]
    },
    "movie-30": {
      name: "30-second Movie Pack",
      price: "$29",
      total: "$29 USD",
      description: "Turn a finished storyboard into a 30-second family premiere.",
      features: ["Finished 30-second film", "Creator credits", "Private download", "One production revision"]
    },
    "movie-60": {
      name: "60-second Movie Pack",
      price: "$49",
      total: "$49 USD",
      description: "Turn a finished storyboard into a 60-second family premiere.",
      features: ["Finished 60-second film", "Creator credits", "Private download", "One production revision"]
    }
  };

  const params = new URLSearchParams(window.location.search);
  const offerId = offers[params.get("offer")] ? params.get("offer") : "story-pass";
  const offer = offers[offerId];
  const t = (value) => window.StoriesLensI18n?.t(value) || value;
  const setText = (selector, value) => {
    const node = document.querySelector(selector);
    if (node) node.textContent = value;
  };

  setText("[data-offer-name]", offer.name);
  setText("[data-offer-price]", offer.price);
  setText("[data-total-price]", offer.total);
  setText("[data-offer-description]", offer.description);
  const featureList = document.querySelector("[data-offer-features]");
  featureList.replaceChildren(...offer.features.map((feature) => {
    const item = document.createElement("li");
    item.textContent = feature;
    return item;
  }));
  window.StoriesLensI18n?.setLocale(window.StoriesLensI18n.locale);

  const fallback = document.querySelector("[data-fallback]");
  fallback.href = `beta-interest.html?offer=${encodeURIComponent(offerId)}`;

  const checkoutButton = document.querySelector("[data-checkout]");
  const status = document.querySelector("[data-checkout-status]");
  checkoutButton.addEventListener("click", async () => {
    checkoutButton.disabled = true;
    status.textContent = t("Opening secure checkout…");
    fallback.hidden = true;
    window.StoriesLensAnalytics?.track("checkout_started", { offer: offerId, price: offer.price });

    try {
      const response = await fetch("/api/checkout-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ offer: offerId })
      });
      const result = await response.json();
      if (!response.ok || !result.checkoutUrl) throw Object.assign(new Error(result.error || "Checkout is unavailable."), { fallbackUrl: result.fallbackUrl });
      window.location.assign(result.checkoutUrl);
    } catch (error) {
      status.textContent = t(error.message || "Checkout is unavailable.");
      fallback.hidden = false;
      if (error.fallbackUrl) fallback.href = error.fallbackUrl;
      checkoutButton.disabled = false;
      window.StoriesLensAnalytics?.track("checkout_unavailable", { offer: offerId });
    }
  });

  window.StoriesLensAnalytics?.track("checkout_viewed", { offer: offerId, price: offer.price });
})();

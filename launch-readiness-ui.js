(async function () {
  const root = document.querySelector("[data-report]");
  const escape = (value) => String(value ?? "").replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[character]);
  const renderGate = (item) => `<article class="card gate ${item.ready ? "pass" : "fail"}"><span class="icon" aria-label="${item.ready ? "Passed" : "Blocked"}">${item.ready ? "✓" : "!"}</span><h3>${escape(item.label)}</h3><p>${escape(item.ready ? "Ready." : item.action)}</p></article>`;
  try {
    const response = await fetch("/api/launch-readiness", { headers: { Accept: "application/json" }, cache: "no-store" });
    if (!response.ok) throw new Error(`Readiness API returned ${response.status}.`);
    const report = await response.json();
    const regions = report.allowedRegions?.length ? report.allowedRegions.map((region) => `<span class="pill">${escape(region.toUpperCase())}</span>`).join("") : '<span class="pill">NO REGION OPEN</span>';
    const countries = report.intlCountries?.length ? report.intlCountries.join(", ") : "none";
    root.innerHTML = `
      <section class="summary">
        <article class="card verdict ${report.ready ? "ready" : "blocked"}"><i class="lamp"></i><div><strong>${report.ready ? "READY FOR INVITED BETA" : "LAUNCH BLOCKED"}</strong><span>${escape(report.mode)} · checked ${new Date(report.checkedAt).toLocaleString()}</span></div></article>
        <article class="card"><span>Required</span><strong>${report.summary.requiredPassed}/${report.summary.requiredTotal}</strong></article>
        <article class="card"><span>Advisory</span><strong>${report.summary.advisoryPassed}/${report.summary.advisoryTotal}</strong></article>
      </section>
      <div class="regions">${regions}<span class="pill">INTL: ${escape(countries)}</span></div>
      <section class="section"><div class="section-head"><div><span class="kicker">Must pass</span><h2>Required gates</h2></div><span>Any red item blocks production startup when enforcement is enabled.</span></div><div class="gates">${report.required.map(renderGate).join("")}</div></section>
      <section class="section"><div class="section-head"><div><span class="kicker">May follow</span><h2>Advisory gates</h2></div><span>These do not block the verified early release.</span></div><div class="gates">${report.advisory.map(renderGate).join("")}</div></section>`;
  } catch (error) {
    root.innerHTML = `<div class="card loading"><strong>The launch gate could not be read.</strong><br>${escape(error.message)}<br>Open this page through the StoriesLens server, not as a local file.</div>`;
  }
}());

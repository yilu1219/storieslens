(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.StoriesLensFamilyBookCatalog = factory();
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const FAMILY_BOOK_OFFERS = Object.freeze({
    "family-digital": Object.freeze({
      id: "family-digital",
      kind: "digital",
      nameZh: "家庭绘本电子版 A5 PDF",
      nameEn: "Family book digital A5 PDF",
      descriptionZh: "购买后可下载正式 A5 电子版 PDF。预览和短片仍免费。",
      descriptionEn: "After a confirmed payment, download the official A5 digital PDF. Preview and the short film stay free.",
      priceCny: 19.9,
      priceUsd: 2.99,
      amountMinorCny: 1990,
      amountMinorUsd: 299,
      displayZh: "¥19.9（约 $2.99）",
      displayEn: "¥19.9 (about $2.99)",
      priceEnv: "STRIPE_PRICE_FAMILY_DIGITAL"
    }),
    "family-print": Object.freeze({
      id: "family-print",
      kind: "print",
      nameZh: "家庭绘本印刷版",
      nameEn: "Family book printed edition",
      descriptionZh: "付款后由我们人工安排首批印刷和寄送。目前没有自动物流跟踪，也不假装已对接印刷厂。",
      descriptionEn: "After a confirmed payment, the first batch will be arranged and fulfilled manually. There is no automated tracking yet, and no print partner is claimed.",
      priceCny: 129,
      priceUsd: 17.99,
      amountMinorCny: 12900,
      amountMinorUsd: 1799,
      displayZh: "¥129（约 $17.99）",
      displayEn: "¥129 (about $17.99)",
      priceEnv: "STRIPE_PRICE_FAMILY_PRINT"
    })
  });

  function offerPublicView(offer) {
    return {
      id: offer.id,
      kind: offer.kind,
      nameZh: offer.nameZh,
      nameEn: offer.nameEn,
      descriptionZh: offer.descriptionZh,
      descriptionEn: offer.descriptionEn,
      priceCny: offer.priceCny,
      priceUsd: offer.priceUsd,
      displayZh: offer.displayZh,
      displayEn: offer.displayEn
    };
  }

  function listFamilyBookOffers() {
    return Object.values(FAMILY_BOOK_OFFERS).map(offerPublicView);
  }

  function getFamilyBookOffer(id) {
    return FAMILY_BOOK_OFFERS[id] || null;
  }

  return { FAMILY_BOOK_OFFERS, getFamilyBookOffer, listFamilyBookOffers, offerPublicView };
});

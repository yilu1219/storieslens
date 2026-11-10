(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.StoriesLensFamilyBookCatalog = factory();
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const FAMILY_BOOK_OFFERS = Object.freeze({
    "family-digital": Object.freeze({
      id: "family-digital",
      kind: "digital",
      cover: "",
      nameZh: "家庭绘本电子版 A5 PDF",
      nameEn: "Family book digital A5 PDF",
      descriptionZh: "服务器确认付款后，买家确认接收邮箱，正式 A5 PDF 会发到该邮箱。成功页或链接参数不会发信。预览和短片仍免费。",
      descriptionEn: "After the server confirms payment, the buyer confirms a delivery email and the official A5 PDF is sent there. A success page or query string never sends the file. Preview and the short film stay free.",
      priceCny: 19.9,
      priceUsd: 2.99,
      amountMinorCny: 1990,
      amountMinorUsd: 299,
      displayZh: "¥19.9（约 $2.99）",
      displayEn: "¥19.9 (about $2.99)",
      priceEnv: "STRIPE_PRICE_FAMILY_DIGITAL"
    }),
    "family-print-softcover": Object.freeze({
      id: "family-print-softcover",
      kind: "print",
      cover: "softcover",
      nameZh: "家庭绘本印刷版 · 软壳",
      nameEn: "Family book printed edition · softcover",
      descriptionZh: "付款确认后，首批软壳由我们人工安排印刷和寄送。目前没有自动物流跟踪，也没有对接印刷厂。",
      descriptionEn: "After a confirmed payment, the first softcover batch is printed and shipped by hand. There is no automated tracking, and no print partner is claimed.",
      priceCny: 129,
      priceUsd: 17.99,
      amountMinorCny: 12900,
      amountMinorUsd: 1799,
      displayZh: "¥129（约 $17.99）",
      displayEn: "¥129 (about $17.99)",
      priceEnv: "STRIPE_PRICE_FAMILY_PRINT_SOFTCOVER",
      priceEnvFallback: "STRIPE_PRICE_FAMILY_PRINT"
    }),
    "family-print-hardcover": Object.freeze({
      id: "family-print-hardcover",
      kind: "print",
      cover: "hardcover",
      nameZh: "家庭绘本印刷版 · 精美硬壳",
      nameEn: "Family book printed edition · premium hardcover",
      descriptionZh: "付款确认后，首批精美硬壳由我们人工安排印刷和寄送。目前没有自动物流跟踪，也没有对接印刷厂。",
      descriptionEn: "After a confirmed payment, the first premium hardcover batch is printed and shipped by hand. There is no automated tracking, and no print partner is claimed.",
      priceCny: 199,
      priceUsd: 27.99,
      amountMinorCny: 19900,
      amountMinorUsd: 2799,
      displayZh: "¥199（约 $27.99）",
      displayEn: "¥199 (about $27.99)",
      priceEnv: "STRIPE_PRICE_FAMILY_PRINT_HARDCOVER"
    })
  });

  function offerPublicView(offer) {
    return {
      id: offer.id,
      kind: offer.kind,
      cover: offer.cover || "",
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

(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.StoriesLensFamilyBookReview = factory();
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const AUTHOR_INTRO_TEMPLATES = Object.freeze({
    zh: Object.freeze([
      "我喜欢画画和写故事。这本书里的画和文字，都是我自己完成的。",
      "这是我用眼睛看到的世界。每一页都来自我的画或作文。",
      "我还在学习用自己的话把故事说清楚。谢谢你读我的书。"
    ]),
    en: Object.freeze([
      "I love to draw and write. The pictures and words in this book are my own.",
      "This is the world as I see it. Every page started as my drawing or writing.",
      "I am still learning to tell my story in my own words. Thank you for reading my book."
    ])
  });

  const FILENAME_TITLE = /^(?:img[_\-\s]?\d|dsc[_\-\s]?\d|dcim|screenshot|mmexport|微信图片|photo[_\-\s]?\d)/i;

  function authorIntroTemplates(locale) {
    return AUTHOR_INTRO_TEMPLATES[locale === "en" ? "en" : "zh"].slice();
  }

  function looksLikeFilenameTitle(value) {
    const text = String(value || "").trim();
    if (!text) return false;
    if (/\.(?:jpe?g|png|webp|heic|heif|gif)$/i.test(text)) return true;
    return FILENAME_TITLE.test(text.replace(/\s+/g, ""));
  }

  function looksLikeFullLegalName(value) {
    const text = String(value || "").trim();
    if (!text) return false;
    if (/[A-Za-z]{2,}.+[A-Za-z]{2,}.+[A-Za-z]{2,}/.test(text)) return true;
    if (/[\u4e00-\u9fff]{4,}/.test(text) && /\s/.test(text) === false && text.length >= 4) return true;
    return false;
  }

  function suggestFamilyBook(input = {}) {
    const locale = input.locale === "en" ? "en" : "zh";
    const title = String(input.title || "").trim();
    const authorName = String(input.authorName || "").trim();
    const authorIntro = String(input.authorIntro || "").trim();
    const childName = String(input.childName || "").trim();
    const defaultTitle = String(input.defaultTitle || (locale === "en" ? "Our Family Book" : "我们的家庭绘本"));
    const photoCount = Number(input.photoCount) || 0;
    const firstFileName = String(input.firstFileName || "");
    const suggestions = [];

    if (!title || title === defaultTitle) {
      suggestions.push({
        id: "missing-title",
        field: "title",
        reversible: true,
        proposedValue: defaultTitle,
        message: {
          zh: "封面还没有一个特别的书名。你可以用默认书名，也可以自己写一个。我们不会改孩子的画或作文。",
          en: "The cover does not have a distinctive title yet. You can keep the default or write your own. We will not change the child’s artwork or writing."
        }
      });
    } else if (looksLikeFilenameTitle(title) || looksLikeFilenameTitle(firstFileName) && title === firstFileName) {
      suggestions.push({
        id: "filename-title",
        field: "title",
        reversible: true,
        proposedValue: defaultTitle,
        message: {
          zh: "现在的书名看起来像文件名。建议换成一句更适合封面的名字。接受后仍可再改。",
          en: "The current title looks like a file name. Consider a clearer cover title. You can still edit it after accepting."
        }
      });
    }

    if (!authorName) {
      suggestions.push({
        id: "missing-author",
        field: "authorName",
        reversible: false,
        proposedValue: "",
        message: {
          zh: "还没有填写作者姓名。建议写上作者怎么署名，这样封面和作者简介会更完整。",
          en: "The author name is still empty. Adding how the author should be credited will complete the cover and the author intro."
        }
      });
    }

    if (!authorIntro || authorIntro.length < 12) {
      const template = authorIntroTemplates(locale)[0];
      suggestions.push({
        id: "short-intro",
        field: "authorIntro",
        reversible: true,
        proposedValue: template,
        message: {
          zh: "作者简介还比较短。可以用一段模板再改成孩子自己的话。我们不会改画或作文，只会补这段介绍。",
          en: "The author intro is still very short. You can start from a short template and edit it in the child’s own words. We will not rewrite the artwork or writing."
        }
      });
    }

    if (photoCount >= 2) {
      suggestions.push({
        id: "page-order",
        field: "pageOrder",
        reversible: false,
        proposedValue: "",
        message: {
          zh: "第一张照片会自动做成封面。请看一下页序是否合适；如需调整，请用照片上的箭头调整，我们不会自动改顺序。",
          en: "The first photo becomes the cover automatically. Please check the page order. If you want a different cover, move that photo first — we will not reorder pages on our own."
        }
      });
    }

    if (!childName) {
      suggestions.push({
        id: "missing-child-name",
        field: "childName",
        reversible: false,
        proposedValue: "",
        message: {
          zh: "孩子的署名是选填的。如果想在封面另外写上孩子的名字，现在就可以补上。",
          en: "The child’s display name is optional. Add it if you want that name to appear on the cover as well."
        }
      });
    }

    if (childName && looksLikeFullLegalName(childName)) {
      suggestions.push({
        id: "legal-name-warning",
        field: "childName",
        reversible: false,
        proposedValue: "",
        message: {
          zh: "署名看起来可能是完整法定姓名。建议只用名字或首字母，不要写姓氏全名或学号。",
          en: "That display name may be a full legal name. Consider a first name or initials, and avoid a legal name or school ID."
        }
      });
    }

    return suggestions;
  }

  return {
    AUTHOR_INTRO_TEMPLATES,
    authorIntroTemplates,
    looksLikeFilenameTitle,
    looksLikeFullLegalName,
    suggestFamilyBook
  };
});

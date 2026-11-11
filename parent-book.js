(() => {
  "use strict";

  const printSpec = () => window.StoriesLensArtworkPrepare;
  const PAGE_WIDTH = printSpec().PAGE_WIDTH_PX;
  const PAGE_HEIGHT = printSpec().PAGE_HEIGHT_PX;
  const MAX_PHOTOS = 20;
  const PROGRESS_RING_LENGTH = 2 * Math.PI * 52;
  const META_KEY = "storieslens_parent_book_meta";
  const LOCALE_KEY = "storieslens_locale";

  const copy = {
    zh: {
      "brand-sub": "家长出书",
      kicker: "FOR PARENTS · 家长出书",
      title: "用手机照片，几分钟做成一本 A5 书",
      lede: "上传孩子的画、手工或作文照片，几分钟预览成一本 A5 书，也可以生成短片。",
      "details-kicker": "书籍信息",
      "title-label": "书名",
      "name-label": "孩子的署名（选填）",
      "author-label": "作者姓名",
      "author-hint": "会印在封面和作者简介页。",
      "author-placeholder": "例如：小羽",
      "name-hint": "如果和作者姓名不同，可以另外写在封面上。保存在这台设备上。",
      "intro-label": "作者简介",
      "intro-hint": "先选一段短模板，再改成孩子自己的话。我们不会改孩子的画或作文。",
      "intro-placeholder": "写一段短短的作者简介，或先选用下面的模板。",
      "suggest-kicker": "检查建议",
      "suggest-accept": "接受这条",
      "suggest-skip": "跳过",
      "suggest-undo": "撤销上一步",
      "suggest-progress": "第 {current} 条，共 {total} 条。每条都可以跳过或撤销。",
      "suggest-done": "检查已结束。你可以继续预览、做短片，或查看价格。",
      "reading-kicker": "认读确认",
      "reading-copy": "请把这一版读一遍。如果觉得可以，点接受。也可以请语大师点评、改写和检查。接受不会改孩子的画或原文。",
      "reading-accept": "接受",
      "reading-yu": "请语大师点评改写检查",
      "reading-approved": "已记下：学生认读并接受了这一版。画和原文都没有被改写。",
      "reading-empty": "还没有可检查的文字。画面保持原样。",
      "yu-working": "正在请语大师点评、改写和检查…",
      "yu-unavailable": "语大师还没有接通。原文和画面都保持不变。",
      "yu-ready": "语大师只提出检查意见。原文还没改，除非你采用检查稿。",
      "yu-apply": "采用语大师的检查稿",
      "yu-keep": "保留原文",
      "yu-kept": "已保留原文。",
      "yu-applied": "已采用语大师的检查稿。画面没有改。",
      "price-free-tag": "FREE · 免费",
      "price-free-title": "预览成书和短片",
      "price-free-copy": "翻页预览带有 StoriesLens 标志，短片可以免费使用。画面上的预览不是已付款的正式文件。",
      "price-digital": "电子版 A5 PDF · ¥19.9（约 $2.99）",
      "price-digital-copy": "正式无水印 PDF 的顺序是：先付款，再确认接收邮箱，服务器确认付款后我们才发送。成功页或链接参数不会发信，也不会解锁下载。",
      "buy-digital": "购买电子版",
      "price-print": "印刷成书",
      "price-print-copy": "请先选择精美硬壳或软壳。确认付款后，我们按你留下的成人联系方式和地址人工安排首批印刷和寄送。目前没有自动物流跟踪，也不假装已经对接印刷厂。",
      "cover-legend": "先选择封面",
      "cover-hardcover": "精美硬壳 · ¥199（约 $27.99）",
      "cover-softcover": "软壳 · ¥129（约 $17.99）",
      "cover-required": "请先选择精美硬壳或软壳。",
      "buy-print": "申请印刷并支付",
      "contact-name": "成人姓名",
      "contact-email": "成人邮箱",
      "contact-phone": "成人电话",
      "ship-line1": "街道地址",
      "ship-line2": "地址补充（选填）",
      "ship-city": "城市",
      "ship-region": "省/州",
      "ship-postal": "邮编",
      "ship-country": "国家/地区",
      "adult-confirm": "我是家长或成年人，孩子不会在此填写付款信息。",
      "checkout-working": "正在连接安全结账…",
      "adult-required": "请先确认你是家长或成年人，并留下成人邮箱。",
      "shipping-required": "印刷订单需要姓名、电话、国家/地区、省/州、城市、街道和邮编。",
      "pay-unlocked-digital": "服务器已确认电子版付款。请确认接收邮箱，我们才会发送正式 A5 PDF。成功页不会自动发信。",
      "pay-unlocked-print": "服务器已确认印刷付款。首批由我们按你留下的地址人工安排，暂时没有自动物流跟踪，也没有印刷厂对接。",
      "pay-unlocked-hardcover": "服务器已确认精美硬壳付款。首批由我们人工安排印刷和寄送，暂时没有自动物流跟踪，也没有印刷厂对接。",
      "pay-unlocked-softcover": "服务器已确认软壳付款。首批由我们人工安排印刷和寄送，暂时没有自动物流跟踪，也没有印刷厂对接。",
      "delivery-email": "接收正式 PDF 的邮箱",
      "delivery-email-copy": "请确认这个邮箱。我们只在服务器确认付款之后，把正式 A5 PDF 发到这里。成功页不会自动发信。",
      "delivery-email-required": "请填写有效的接收邮箱。付款确认后需要你确认，我们才会发送正式 PDF。",
      "send-book-email": "确认邮箱并发送正式 PDF",
      "resend-book-email": "再次发送到这个邮箱",
      "email-working": "正在把正式 A5 PDF 发到你确认的邮箱…",
      "email-sent": "正式 A5 PDF 已发到你确认的邮箱。你也可以在这里下载。",
      "email-saved-unsent": "付款已确认，邮箱已保存，但这次没有把 PDF 发出。",
      "page-label-author": "作者简介",
      "about-author": "作者简介",
      "credit-line": "作者 · {name}",
      "title-placeholder": "例如：小羽的画",
      "name-placeholder": "例如：小羽",
      album: "从相册选择照片",
      camera: "拍照上传",
      "upload-start": "这里开始上传照片",
      "edit-kicker": "修改内容",
      "edit-hint": "改书名、作者和每张作品的文字层。画面层只在你接受助手建议后才会更换。预览只在你修改之后更新。我们不会自动改孩子的画或原文。",
      "edit-piece": "第 {n} 张的文字层",
      "safety-notice": "请上传孩子的画、作文或手工作品照片。不要上传身份证、学生证、校园卡，也不要拍到电话、地址、邮箱或二维码。位置和拍摄信息会在本机删除。",
      "adult-note": "这条出书线是给家长或成年人使用的。孩子不必、也不应进入任何付款页面。",
      "preview-kicker": "预览成书",
      prev: "上一页",
      next: "下一页",
      "download-pdf": "下载已购买的 A5 PDF",
      print: "打印 A5",
      "print-pdf": "下载印刷版 A5 PDF",
      "make-film": "一键生成短片（免费）",
      "print-shop": "印刷版是标准 A5 PDF，可以拿到附近打印店做成书。我们暂时不提供邮寄成书，也不会在这里收费。",
      "open-pdf": "打开 PDF",
      "share-pdf": "分享 PDF",
      "save-film": "保存短片",
      "share-film": "分享短片",
      "trust-meta": "本机删除位置和拍摄信息",
      "trust-private": "默认保存在这台手机上",
      "trust-free": "预览和短片免费",
      "default-title": "我们的家庭绘本",
      "byline": "作者 · {name}",
      "page-of": "第 {current} 页，共 {total} 页",
      "added": "已加入 {count} 张照片，正在生成预览…",
      "ready": "书已经准备好。可以翻页、查看建议、免费生成短片，或按价格购买电子版和印刷版。",
      "processing": "正在本机处理照片并删除拍摄信息…",
      "blocked": "这张照片不能使用。请不要上传证件、学生证，或带有电话、地址、邮箱、二维码的画面。",
      "unsupported": "请选择 JPG、PNG、WEBP、HEIC 或 HEIF 图片。",
      "too-many": "一次最多 20 张照片。",
      "need-photos": "请先从相册选择或拍摄至少一张照片。",
      "pdf-working": "正在生成 A5 PDF…",
      "pdf-ready": "已购买的 A5 PDF 已准备好，可以下载。",
      "pdf-failed": "还不能下载正式 PDF。需要服务器确认付款；成功页本身不会解锁。",
      "film-working": "正在把书页做成短片，请稍候…",
      "film-ready": "短片已生成，可直接播放、保存或分享。",
      "film-failed": "短片暂时无法生成，请再试一次。",
      "share-unavailable": "当前浏览器不支持系统分享，请使用打开或保存。",
      "wechat-pdf": "在微信里，请先预览或点击“打开 PDF”。如需保存，可点击右上角 ···，选择“在浏览器中打开”，再下载到手机。",
      "wechat-film": "短片可在本页直接播放。微信 iOS 往往无法直接下载文件：请长按视频尝试保存，或点击右上角 ···，选择“在浏览器中打开”后再保存。",
      "cover-kicker": "STORIESLENS · 家长出书",
      "page-label-cover": "封面",
      "cover-style-legend": "封面样式",
      "cover-style-full": "重排封面",
      "cover-style-type": "文字封面",
      "interior-legend": "内页样式",
      "interior-original": "原画摆正",
      "interior-polished": "精修插画",
      "interior-hint": "默认是原画摆正：画在安全框里，孩子的话单独排成文字层。精修插画只换画面层，文字仍是排版，不会画进图里。两种最后都保留手稿。",
      "assistant-kicker": "排版助手",
      "assistant-hint": "可以建议间距、换行、图文比例、画面整理，以及校对。每条建议都会先对照显示。只有你点接受，才会写进这本书。",
      "assistant-type": "整理间距和换行",
      "assistant-layout": "调整图文比例",
      "assistant-art": "整理画面",
      "assistant-proof": "校对文字",
      "assistant-accept": "接受",
      "assistant-reject": "不采用",
      "assistant-pending": "这是建议，还没有写进书里。",
      "assistant-accepted": "已写入这一页。",
      "assistant-dismissed": "未采用。文字层和画面层保持原样。",
      "assistant-unchanged": "这条建议不会改孩子的话或画。",
      "assistant-working": "正在准备画面建议…",
      "assistant-art-failed": "画面没有整理成功。原画仍在。",
      "assistant-type-label": "间距和换行。不改用词。",
      "assistant-layout-label": "图文比例",
      "assistant-art-label": "画面整理。接受之后才替换画面层。",
      "assistant-proof-layout": "校对：间距和换行。不改用词。",
      "assistant-proof-punctuation": "校对：标点。不改孩子的用词。",
      "assistant-proof-wording": "校对：这是改词建议。",
      "assistant-proof-confirm": "校对：请确认这处文字。系统没有猜一句新的。",
      "assistant-wording-note": "这会改动孩子的用词，不是只改标点或空格。不接受就不会写入。",
      "assistant-confirm-note": "识别不确定，或需要你确认。这里没有改成另一套说法。",
      "assistant-before": "现在的文字",
      "assistant-after": "建议写成",
      "assistant-empty": "（空，没有猜词）",
      "assistant-share": "文字层约占 {n}%",
      "assistant-proof-clear": "没有要校对的问题。孩子的话保持原样。",
      "assistant-proof-done": "校对建议已看完。未接受的内容没有写入。",
      "set-cover": "设为封面",
      "rotate-photo": "旋转 90°",
      "manuscript-toggle": "手稿",
      "restore-original": "原图",
      "retry-cutout": "重新提取",
      "undo-split": "撤销拆分",
      "text-label": "识别出的文字",
      "progress-prepare": "小羽正在这台设备上准备照片（第 {current} 张，共 {count} 张）",
      "progress-extract": "小羽正在提取这张作品的画和文字（第 {current} 张，共 {count} 张）",
      "progress-layout": "小羽正在把作品排到 A5 书页上",
      "progress-illustrate": "小羽正在按原画准备精修插画（第 {current} 张，共 {count} 张）",
      "polish-fallback": "精修插画这次没有生成，这一页仍使用摆正后的原画。这句话只出现在屏幕上。",
      "yu-name": "小羽",
      "official-kicker": "正式文件",
      "official-steps": "想下载没有标志的正式 A5 PDF：先付款，再填写接收邮箱，我们在服务器确认付款之后才会发送。成功页或链接不会解锁下载。",
      "official-step-pay": "先付款",
      "official-step-email": "再确认接收邮箱",
      "official-step-send": "服务器确认付款后，我们发送正式无水印 PDF",
      "official-go": "去付款并发送正式 PDF",
      "follow-kicker": "后续服务",
      "follow-copy": "正式 PDF 已经发到你确认的邮箱。接下来可以选这些后续服务。",
      "follow-film": "免费短片可以在预览里生成。",
      "follow-print": "印刷可以选精美硬壳或软壳。付款确认后，我们按你留下的成人地址人工安排。目前没有自动物流跟踪，也没有印刷厂对接。",
      "follow-contact": "售后由成人联系。可以发邮件到 support@storieslens.com，或查看退款规则。",
      "follow-film-btn": "生成免费短片",
      "follow-print-btn": "查看印刷选项",
      "follow-email": "联系售后",
      "follow-refund": "退款规则",
      "extract-done": "画作和文字已经分开，排到米色 A5 页上。文字没有改写。",
      "extract-uncertain": "文字没有把握，所以没有编造句子。原有笔迹还留在页面上，可以自己改正。",
      "scan-not-isolated": "没有把作品从桌面上分开，所以这一页没有用带桌面的原图。请把纸拍完整、尽量摊平后再试。",
      "extract-unavailable": "远程文字识别还没接通，没有识别文字。原图还在，可以恢复或稍后重试。",
      "extract-table": "手稿四周的桌子没能完全去掉，页面仍保留原稿笔迹。",
      "split-done": "这张照片左右各有一幅作品，已分成两页，并分别提取。可以撤销拆分。",
      restored: "已恢复原图。这不是提取后的重排页。",
      "download-preview": "下载预览 PDF",
      "preview-pdf-note": "这是带 StoriesLens 标志的免费预览，不需要付款。没有标志的正式 PDF 要先付款，再确认邮箱，服务器确认后才会发送。",
      "preview-pdf-working": "正在生成预览 PDF…",
      "preview-pdf-ready": "预览 PDF 已准备好，可以下载。这不是已付款的正式文件。",
      "preview-pdf-failed": "预览 PDF 暂时无法生成，请再试一次。",
      "page-label-manuscript": "手稿",
      "avatar-label": "作者头像",
      "avatar-upload": "上传头像",
      "avatar-photo": "真实照片",
      "avatar-illustrated": "动画头像",
      "avatar-under18": "这是未满 18 岁的真人照片",
      "avatar-hint": "可以选择真实照片，或在本机做成动画头像。未满 18 岁的真人照片需要家长签名后才会用在作者简介页。动画头像不需要签名。",
      "consent-copy": "我是家长或监护人，同意把这张未满 18 岁的真人照片用作本书作者简介页的头像。",
      "consent-name": "家长姓名",
      "consent-sign": "请在框里签名",
      "consent-clear": "清除签名",
      "consent-save": "确认签名",
      "consent-needed": "未满 18 岁的真人照片需要家长签名后才会放上作者简介页。",
      "consent-saved": "已记下家长签名。这张真人头像可以用在作者简介页。",
      "consent-missing": "请写上家长姓名，并在框里签名。",
      "avatar-blocked": "这张头像不能使用。请不要上传证件，或带有电话、地址、邮箱、二维码的画面。",
      docTitle: "家长出书 · StoriesLens"
    },
    en: {
      "brand-sub": "Parent book",
      kicker: "FOR PARENTS",
      title: "Turn phone photos into an A5 book in minutes",
      lede: "Upload photos of your child’s drawings, crafts, or writing. Preview an A5 book in minutes and make a short film.",
      "details-kicker": "BOOK DETAILS",
      "title-label": "Book title",
      "name-label": "Child’s display name (optional)",
      "author-label": "Author name",
      "author-hint": "This is printed on the cover and the author-intro page.",
      "author-placeholder": "For example: Mia",
      "name-hint": "If this is different from the author name, it can also appear on the cover. It stays on this device.",
      "intro-label": "Author intro",
      "intro-hint": "Start with a short template, then edit it in the child’s own words. We will not change the artwork or writing.",
      "intro-placeholder": "Write a short author intro, or start from a template below.",
      "suggest-kicker": "Review suggestions",
      "suggest-accept": "Accept this",
      "suggest-skip": "Skip",
      "suggest-undo": "Undo last step",
      "suggest-progress": "Suggestion {current} of {total}. Every suggestion is optional and can be undone.",
      "suggest-done": "The check is finished. You can keep previewing, make a film, or look at the prices.",
      "reading-kicker": "Approve reading",
      "reading-copy": "Read this version. If it is ready, choose Accept. You can also ask Yu to review, comment, and check it. Accept does not change the artwork or the original words.",
      "reading-accept": "Accept",
      "reading-yu": "Ask Yu to review and check",
      "reading-approved": "Saved: the student read this version and accepted it. The artwork and original words were not rewritten.",
      "reading-empty": "There is no writing to check yet. The pictures stay as they are.",
      "yu-working": "Asking Yu to review and check…",
      "yu-unavailable": "Yu is not connected yet. The original words and pictures stay unchanged.",
      "yu-ready": "Yu offered a check. The original stays until you adopt that check.",
      "yu-apply": "Use Yu’s checked text",
      "yu-keep": "Keep the original",
      "yu-kept": "The original was kept.",
      "yu-applied": "Yu’s checked text is now the author intro. The pictures were not changed.",
      "price-free-tag": "FREE",
      "price-free-title": "Book preview and short film",
      "price-free-copy": "The page preview carries the StoriesLens logo, and the short film is free. The on-screen preview is not a paid file.",
      "price-digital": "Digital A5 PDF · ¥19.9 (about $2.99)",
      "price-digital-copy": "The official PDF without the logo follows this order: pay, confirm the delivery email, then we send it after the server confirms payment. A success page or query string never sends the file or unlocks the download.",
      "buy-digital": "Buy the digital edition",
      "price-print": "Printed book",
      "price-print-copy": "Choose premium hardcover or softcover first. After a confirmed payment, we use the adult contact and shipping address to arrange the first batch by hand. There is no automated tracking yet, and we do not claim a print factory is already connected.",
      "cover-legend": "Choose a cover first",
      "cover-hardcover": "Premium hardcover · ¥199 (about $27.99)",
      "cover-softcover": "Softcover · ¥129 (about $17.99)",
      "cover-required": "Choose premium hardcover or softcover before checkout.",
      "buy-print": "Request print and pay",
      "contact-name": "Adult name",
      "contact-email": "Adult email",
      "contact-phone": "Adult phone",
      "ship-line1": "Street address",
      "ship-line2": "Address line 2 (optional)",
      "ship-city": "City",
      "ship-region": "State / province",
      "ship-postal": "Postal code",
      "ship-country": "Country / region",
      "adult-confirm": "I am a parent or another adult. A child will not enter payment details here.",
      "checkout-working": "Opening secure checkout…",
      "adult-required": "Please confirm you are a parent or adult, and leave an adult email address.",
      "shipping-required": "A print order needs a name, phone, country, region, city, street, and postal code.",
      "pay-unlocked-digital": "The server has confirmed the digital payment. Confirm the delivery email and we will send the official A5 PDF. A success page does not send it.",
      "pay-unlocked-print": "The server has confirmed the print payment. The first batch is arranged by hand from the address you left. There is no automated tracking, and no print partner is claimed.",
      "pay-unlocked-hardcover": "The server has confirmed the premium hardcover payment. The first batch is arranged by hand. There is no automated tracking, and no print partner is claimed.",
      "pay-unlocked-softcover": "The server has confirmed the softcover payment. The first batch is arranged by hand. There is no automated tracking, and no print partner is claimed.",
      "delivery-email": "Email for the official PDF",
      "delivery-email-copy": "Confirm this address. We email the official A5 PDF only after the server has confirmed payment. A success page does not send it.",
      "delivery-email-required": "Enter a valid delivery email. We send the official PDF only after you confirm it.",
      "send-book-email": "Confirm email and send the official PDF",
      "resend-book-email": "Send again to this email",
      "email-working": "Sending the official A5 PDF to the email you confirmed…",
      "email-sent": "The official A5 PDF was sent to the email you confirmed. You can also download it here.",
      "email-saved-unsent": "Payment is confirmed and the email is saved, but the PDF was not sent.",
      "page-label-author": "About the author",
      "about-author": "About the author",
      "credit-line": "By {name}",
      "title-placeholder": "For example: Mia’s Drawings",
      "name-placeholder": "For example: Mia",
      album: "Choose from camera roll",
      camera: "Take a photo",
      "upload-start": "Start uploading photos here",
      "edit-kicker": "Edit this book",
      "edit-hint": "Edit the title, the author, and the text layer on each piece. The art layer changes only after you accept an assistant suggestion. The preview updates after you make a change. We do not rewrite the child’s pictures or words on our own.",
      "edit-piece": "Text layer on piece {n}",
      "safety-notice": "Upload photos of your child’s artwork or writing. Do not upload identity documents, student or school IDs, or images that show a phone number, address, email, or QR code. Location and camera details are removed on this device.",
      "adult-note": "This flow is for a parent or another adult. A child should not enter a checkout page.",
      "preview-kicker": "BOOK PREVIEW",
      prev: "Previous",
      next: "Next",
      "download-pdf": "Download the purchased A5 PDF",
      print: "Print A5",
      "print-pdf": "Download print-ready A5 PDF",
      "make-film": "Make a short film (free)",
      "print-shop": "The print-ready file is a standard A5 PDF you can take to a local print shop. We do not ship printed books yet, and nothing is charged here.",
      "open-pdf": "Open PDF",
      "share-pdf": "Share PDF",
      "save-film": "Save film",
      "share-film": "Share film",
      "trust-meta": "Location and camera details removed on this device",
      "trust-private": "Kept on this phone by default",
      "trust-free": "Preview and the short film are free",
      "default-title": "Our Family Book",
      "byline": "By {name}",
      "page-of": "Page {current} of {total}",
      "added": "{count} photos added. Building your preview…",
      "ready": "Your book is ready. Flip through it, review optional suggestions, make a free short film, or see the prices for the digital and printed editions.",
      "processing": "Preparing photos on this device and removing camera details…",
      "blocked": "That photo cannot be used. Please do not upload identity documents, school IDs, or images with a phone number, address, email, or QR code.",
      "unsupported": "Please choose a JPG, PNG, WEBP, HEIC, or HEIF image.",
      "too-many": "You can add up to 20 photos at a time.",
      "need-photos": "Please choose or take at least one photo first.",
      "pdf-working": "Creating the A5 PDF…",
      "pdf-ready": "Your purchased A5 PDF is ready to download.",
      "pdf-failed": "The official PDF is not unlocked yet. The server must confirm payment; a success page is not enough.",
      "film-working": "Turning your pages into a short film…",
      "film-ready": "Your short film is ready to play, save, or share.",
      "film-failed": "The short film could not be created. Please try again.",
      "share-unavailable": "Sharing is not available in this browser. Use Open or Save instead.",
      "wechat-pdf": "In WeChat, preview the PDF or tap Open PDF. To save it, tap the ··· menu and choose Open in Browser, then download it there.",
      "wechat-film": "You can play the film on this page. WeChat on iOS often blocks file downloads: try a long press on the video, or tap ··· and choose Open in Browser to save it.",
      "cover-kicker": "STORIESLENS · PARENT BOOK",
      "page-label-cover": "Cover",
      "cover-style-legend": "Cover style",
      "cover-style-full": "Rebuilt page",
      "cover-style-type": "Typographic cover",
      "interior-legend": "Interior style",
      "interior-original": "Original artwork",
      "interior-polished": "Polished illustrations",
      "interior-hint": "Original artwork is the default: the drawing sits in a print-safe frame and the child’s words are a separate text layer. Polished illustrations replace only the art layer. The words stay typeset and are not drawn into the picture. Both end with the manuscript.",
      "assistant-kicker": "Editing assistant",
      "assistant-hint": "It can suggest spacing, line breaks, the picture-and-text balance, art cleanup, and proofreading. Each suggestion is shown first. Nothing enters the book until you accept it.",
      "assistant-type": "Tidy spacing and line breaks",
      "assistant-layout": "Adjust the picture and text",
      "assistant-art": "Clean up the picture",
      "assistant-proof": "Proofread the words",
      "assistant-accept": "Accept",
      "assistant-reject": "Don’t use this",
      "assistant-pending": "This is a suggestion. It is not in the book yet.",
      "assistant-accepted": "Accepted and placed on this page.",
      "assistant-dismissed": "Dismissed. The text layer and the art layer stay as they are.",
      "assistant-unchanged": "This suggestion does not change the child’s words or picture.",
      "assistant-working": "Preparing a picture suggestion…",
      "assistant-art-failed": "The picture was not cleaned up. The original art is still here.",
      "assistant-type-label": "Spacing and line breaks. The words stay the same.",
      "assistant-layout-label": "Picture and text balance",
      "assistant-art-label": "Picture cleanup. The art layer changes only if you accept.",
      "assistant-proof-layout": "Proofreading: spacing and line breaks. The wording stays the same.",
      "assistant-proof-punctuation": "Proofreading: punctuation. The child’s words stay the same.",
      "assistant-proof-wording": "Proofreading: this suggestion changes wording.",
      "assistant-proof-confirm": "Proofreading: please confirm this reading. Nothing new was guessed.",
      "assistant-wording-note": "This would change the child’s words, not only punctuation or spacing. It stays out of the book unless you accept it.",
      "assistant-confirm-note": "This reading is uncertain or needs your confirmation. No other wording was guessed.",
      "assistant-before": "Current text",
      "assistant-after": "Suggested text",
      "assistant-empty": "(empty — nothing was guessed)",
      "assistant-share": "The text layer is about {n}% of the page",
      "assistant-proof-clear": "Nothing to proofread. The child’s words stay as they are.",
      "assistant-proof-done": "Those proofreading suggestions are finished. Anything you did not accept was left out.",
      "set-cover": "Set cover",
      "rotate-photo": "Rotate 90°",
      "manuscript-toggle": "Manuscript",
      "restore-original": "Original",
      "retry-cutout": "Extract again",
      "undo-split": "Undo split",
      "text-label": "Extracted words",
      "progress-prepare": "Yu is preparing the photo on this device ({current} of {count})",
      "progress-extract": "Yu is reading the drawing and the words ({current} of {count})",
      "progress-layout": "Yu is placing the work on A5 pages",
      "progress-illustrate": "Yu is preparing a polished illustration from the original drawing ({current} of {count})",
      "polish-fallback": "A polished illustration was not created, so this page keeps the straightened original artwork. This note stays on screen.",
      "yu-name": "Yu",
      "official-kicker": "Official file",
      "official-steps": "To download the official A5 PDF without the logo: pay first, then enter the delivery email. We send it only after the server confirms payment. A success page or link does not unlock the download.",
      "official-step-pay": "Pay first",
      "official-step-email": "Then confirm the delivery email",
      "official-step-send": "After the server confirms payment, we send the official PDF without the logo",
      "official-go": "Pay and send the official PDF",
      "follow-kicker": "What you can do next",
      "follow-copy": "The official PDF was sent to the email you confirmed. You can use these next.",
      "follow-film": "The short film is free and can be made from the preview.",
      "follow-print": "Printing can be premium hardcover or softcover. After payment is confirmed, we arrange the first batch by hand from the adult address you left. There is no automated tracking, and no print factory is connected.",
      "follow-contact": "After-sales contact is for an adult. Email support@storieslens.com, or read the refund policy.",
      "follow-film-btn": "Make the free short film",
      "follow-print-btn": "See print options",
      "follow-email": "Contact support",
      "follow-refund": "Refund policy",
      "extract-done": "The drawing and the words were separated, then placed on a cream A5 page. The words were not rewritten.",
      "extract-uncertain": "The words were not read confidently, so nothing was invented. The original marks stay on the page and can be corrected.",
      "scan-not-isolated": "The sheet could not be separated from the table, so the tabletop photo was not used. Retake it with the whole page visible and as flat as you can.",
      "extract-unavailable": "Remote text recognition is not connected, so no words were recognized. The original photo is still here.",
      "extract-table": "The table around this manuscript could not be fully removed. The handwritten marks stay on the page.",
      "split-done": "This photo has a piece on the left and a piece on the right, so each side was extracted into its own page. You can undo the split.",
      restored: "The original photo is restored. This is not an extracted page.",
      "download-preview": "Download preview PDF",
      "preview-pdf-note": "This free preview carries the StoriesLens logo and does not require payment. The official PDF without the logo is sent only after you pay and confirm an email, and the server confirms payment.",
      "preview-pdf-working": "Creating the preview PDF…",
      "preview-pdf-ready": "The preview PDF is ready. It is not the paid official file.",
      "preview-pdf-failed": "The preview PDF could not be created. Please try again.",
      "page-label-manuscript": "Manuscript",
      "avatar-label": "Author portrait",
      "avatar-upload": "Upload a portrait",
      "avatar-photo": "Real photo",
      "avatar-illustrated": "Illustrated avatar",
      "avatar-under18": "This is a real photo of someone under 18",
      "avatar-hint": "Use a real photo, or make an illustrated avatar on this device. A real photo of someone under 18 is used only after a parent signs. An illustrated avatar does not need that signature.",
      "consent-copy": "I am the parent or guardian and I agree to use this real photo of a person under 18 as the author portrait in this book.",
      "consent-name": "Parent name",
      "consent-sign": "Sign in the box",
      "consent-clear": "Clear signature",
      "consent-save": "Confirm signature",
      "consent-needed": "A real photo of someone under 18 stays off the author page until a parent signs.",
      "consent-saved": "The parent signature is saved. This real portrait can appear on the author page.",
      "consent-missing": "Enter the parent’s name and sign in the box.",
      "avatar-blocked": "This portrait cannot be used. Do not upload an identity document or an image with a phone number, address, email, or QR code.",
      docTitle: "Parent book · StoriesLens"
    }
  };

  const els = {
    title: document.querySelector("[data-title]"),
    childName: document.querySelector("[data-child-name]"),
    authorName: document.querySelector("[data-author-name]"),
    authorIntro: document.querySelector("[data-author-intro]"),
    introTemplates: document.querySelector("[data-intro-templates]"),
    suggestCard: document.querySelector("[data-suggest-card]"),
    suggestText: document.querySelector("[data-suggest-text]"),
    suggestAccept: document.querySelector("[data-suggest-accept]"),
    suggestSkip: document.querySelector("[data-suggest-skip]"),
    suggestUndo: document.querySelector("[data-suggest-undo]"),
    suggestMeta: document.querySelector("[data-suggest-meta]"),
    bookAssistant: document.querySelector("[data-book-assistant]"),
    readingCard: document.querySelector("[data-reading-card]"),
    readingText: document.querySelector("[data-reading-text]"),
    readingAccept: document.querySelector("[data-reading-accept]"),
    readingYu: document.querySelector("[data-reading-yu]"),
    readingStatus: document.querySelector("[data-reading-status]"),
    yuResult: document.querySelector("[data-yu-result]"),
    yuComment: document.querySelector("[data-yu-comment]"),
    yuSuggestion: document.querySelector("[data-yu-suggestion]"),
    yuApply: document.querySelector("[data-yu-apply]"),
    yuKeep: document.querySelector("[data-yu-keep]"),
    priceBox: document.querySelector("[data-price-box]"),
    payNote: document.querySelector("[data-pay-note]"),
    payUnlocked: document.querySelector("[data-pay-unlocked]"),
    paidActions: document.querySelector("[data-paid-actions]"),
    buyDigital: document.querySelector("[data-buy-digital]"),
    buyPrint: document.querySelector("[data-buy-print]"),
    printPrice: document.querySelector("[data-print-price]"),
    deliveryBox: document.querySelector("[data-delivery-box]"),
    deliveryEmail: document.querySelector("[data-delivery-email]"),
    sendBookEmail: document.querySelector("[data-send-book-email]"),
    adultConfirm: document.querySelector("[data-adult-confirm]"),
    contactName: document.querySelector("[data-contact-name]"),
    contactEmail: document.querySelector("[data-contact-email]"),
    contactPhone: document.querySelector("[data-contact-phone]"),
    shipLine1: document.querySelector("[data-ship-line1]"),
    shipLine2: document.querySelector("[data-ship-line2]"),
    shipCity: document.querySelector("[data-ship-city]"),
    shipRegion: document.querySelector("[data-ship-region]"),
    shipPostal: document.querySelector("[data-ship-postal]"),
    shipCountry: document.querySelector("[data-ship-country]"),
    album: document.querySelector("[data-album]"),
    camera: document.querySelector("[data-camera]"),
    thumbs: document.querySelector("[data-thumbs]"),
    yuProgress: document.querySelector("[data-yu-progress]"),
    yuMark: document.querySelector("[data-yu-mark]"),
    progressDial: document.querySelector("[data-progress-dial]"),
    progressArc: document.querySelector("[data-progress-arc]"),
    progressPercent: document.querySelector("[data-progress-percent]"),
    progressLabel: document.querySelector("[data-progress-label]"),
    followUp: document.querySelector("[data-follow-up]"),
    scrollOfficial: document.querySelector("[data-scroll-official]"),
    followFilm: document.querySelector("[data-follow-film]"),
    followPrint: document.querySelector("[data-follow-print]"),
    status: document.querySelector("[data-status]"),
    previewCard: document.querySelector("[data-preview-card]"),
    bookEditFields: document.querySelector("[data-book-edit-fields]"),
    pageImage: document.querySelector("[data-page-image]"),
    pageLabel: document.querySelector("[data-page-label]"),
    prev: document.querySelector("[data-prev]"),
    next: document.querySelector("[data-next]"),
    downloadPdf: document.querySelector("[data-download-pdf]"),
    print: document.querySelector("[data-print]"),
    printPdf: document.querySelector("[data-print-pdf]"),
    makeFilm: document.querySelector("[data-make-film]"),
    downloadPreview: document.querySelector("[data-download-preview]"),
    avatarFile: document.querySelector("[data-avatar-file]"),
    under18Row: document.querySelector("[data-under18-row]"),
    under18: document.querySelector("[data-avatar-under18]"),
    consentBox: document.querySelector("[data-consent-box]"),
    consentName: document.querySelector("[data-consent-name]"),
    signature: document.querySelector("[data-signature]"),
    signatureClear: document.querySelector("[data-signature-clear]"),
    signatureSave: document.querySelector("[data-signature-save]"),
    pdfBox: document.querySelector("[data-pdf-box]"),
    pdfFrame: document.querySelector("[data-pdf-frame]"),
    pdfHelp: document.querySelector("[data-pdf-help]"),
    openPdf: document.querySelector("[data-open-pdf]"),
    sharePdf: document.querySelector("[data-share-pdf]"),
    filmBox: document.querySelector("[data-film-box]"),
    filmPlayer: document.querySelector("[data-film-player]"),
    filmHelp: document.querySelector("[data-film-help]"),
    saveFilm: document.querySelector("[data-save-film]"),
    shareFilm: document.querySelector("[data-share-film]"),
    printRoot: document.querySelector("[data-print-root]")
  };

  const state = {
    locale: "zh",
    photos: [],
    pages: [],
    previewPages: [],
    pageIndex: 0,
    pdfBlob: null,
    pdfUrl: "",
    filmBlob: null,
    filmUrl: "",
    filmName: "storieslens-book.mp4",
    busy: false,
    suggestions: [],
    suggestionIndex: 0,
    suggestionHistory: [],
    pricing: null,
    entitlement: { paid: false, kind: "" },
    pageKinds: [],
    coverId: "",
    coverStyle: "rebuilt",
    interiorStyle: "original",
    rebuildStamp: 0,
    noticeKey: "",
    announcePrepare: false,
    avatar: { originalDataUrl: "", illustratedDataUrl: "", mode: "", under18: true, consent: null },
    readingApproval: null,
    yuOffer: null
  };

  const t = (key, vars) => {
    const table = copy[state.locale] || copy.zh;
    let value = table[key] || copy.en[key] || key;
    if (vars) {
      Object.keys(vars).forEach((name) => {
        value = value.replaceAll(`{${name}}`, String(vars[name]));
      });
    }
    return value;
  };

  const isWeChat = () => /MicroMessenger/i.test(navigator.userAgent || "");

  function detectLocale() {
    try {
      const stored = localStorage.getItem(LOCALE_KEY);
      if (stored === "zh" || stored === "en") return stored;
    } catch (_error) {}
    const ua = navigator.userAgent || "";
    const wechatLang = ua.match(/Language\/([a-zA-Z0-9_-]+)/i);
    if (wechatLang) return /^zh/i.test(wechatLang[1]) ? "zh" : "en";
    const languages = [navigator.language, ...(navigator.languages || [])]
      .filter(Boolean)
      .map((item) => String(item).toLowerCase());
    if (languages.some((item) => item.startsWith("zh"))) return "zh";
    try {
      const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || "";
      if (/Shanghai|Chongqing|Urumqi|Hong_Kong|Taipei|Macau/i.test(timeZone)) return "zh";
    } catch (_error) {}
    return "en";
  }

  function setStatus(message, isError = false) {
    els.status.textContent = message || "";
    els.status.classList.toggle("is-error", Boolean(isError));
  }

  let progressState = null;

  function showProgress(done, total, key, vars) {
    progressState = { done, total, key, vars: vars || {} };
    const percent = total > 0 ? Math.max(0, Math.min(100, Math.round((done / total) * 100))) : 0;
    if (els.yuProgress) {
      els.yuProgress.hidden = false;
      els.yuProgress.style.setProperty("--extract-progress", String(percent));
      els.yuProgress.dataset.extractProgress = String(percent);
    }
    if (els.progressPercent) els.progressPercent.textContent = `${percent}%`;
    if (els.progressArc) {
      els.progressArc.style.strokeDasharray = String(PROGRESS_RING_LENGTH);
      els.progressArc.style.strokeDashoffset = String(PROGRESS_RING_LENGTH * (1 - percent / 100));
      els.progressArc.style.strokeLinecap = percent > 0 && percent < 100 ? "round" : "butt";
    }
    if (els.progressDial) {
      els.progressDial.setAttribute("aria-valuenow", String(percent));
      els.progressDial.setAttribute("aria-valuetext", `${percent}%`);
    }
    if (els.progressLabel) els.progressLabel.textContent = t(key, vars || {});
    if (els.status) {
      els.status.textContent = "";
      els.status.classList.remove("is-error");
    }
  }

  function hideProgress() {
    progressState = null;
    if (els.yuProgress) els.yuProgress.hidden = true;
  }

  function syncFollowUp() {
    if (!els.followUp) return;
    const sent = state.entitlement?.paid === true && state.entitlement.kind === "digital" && state.entitlement.emailSent === true;
    els.followUp.hidden = !sent;
  }

  function bookTitle() {
    return els.title.value.trim() || t("default-title");
  }

  function childName() {
    return els.childName.value.trim();
  }

  function authorName() {
    return (els.authorName?.value || "").trim();
  }

  function authorIntro() {
    return (els.authorIntro?.value || "").trim();
  }

  function displayAuthor() {
    return authorName() || childName();
  }

  function saveMeta() {
    try {
      localStorage.setItem(META_KEY, JSON.stringify({
        title: els.title.value,
        childName: els.childName.value,
        authorName: els.authorName?.value || "",
        authorIntro: els.authorIntro?.value || "",
        coverStyle: state.coverStyle,
        interiorStyle: state.interiorStyle,
        avatarConsent: state.avatar.consent,
        readingApproval: state.readingApproval
      }));
      localStorage.setItem(LOCALE_KEY, state.locale);
    } catch (_error) {}
  }

  function loadMeta() {
    try {
      const raw = localStorage.getItem(META_KEY);
      if (!raw) return;
      const meta = JSON.parse(raw);
      if (typeof meta.title === "string") els.title.value = meta.title;
      if (typeof meta.childName === "string") els.childName.value = meta.childName;
      if (els.authorName && typeof meta.authorName === "string") els.authorName.value = meta.authorName;
      if (els.authorIntro && typeof meta.authorIntro === "string") els.authorIntro.value = meta.authorIntro;
      if (meta.coverStyle === "typographic") state.coverStyle = "typographic";
      else if (meta.coverStyle === "rebuilt" || meta.coverStyle === "fullbleed") state.coverStyle = "rebuilt";
      if (state.coverStyle === "typographic" || state.coverStyle === "rebuilt") {
        const selected = document.querySelector(`[data-cover-style][value="${state.coverStyle}"]`);
        if (selected) selected.checked = true;
      }
      state.interiorStyle = meta.interiorStyle === "polished" ? "polished" : "original";
      const interior = document.querySelector(`[data-interior-style][value="${state.interiorStyle}"]`);
      if (interior) interior.checked = true;
      if (meta.avatarConsent && typeof meta.avatarConsent === "object") state.avatar.consent = meta.avatarConsent;
      if (meta.readingApproval && meta.readingApproval.approved === true) state.readingApproval = meta.readingApproval;
    } catch (_error) {}
  }

  function applyLocale(next) {
    state.locale = next === "en" ? "en" : "zh";
    document.documentElement.lang = state.locale === "zh" ? "zh-CN" : "en";
    document.title = t("docTitle");
    document.querySelectorAll("[data-i18n]").forEach((node) => {
      node.textContent = t(node.dataset.i18n);
    });
    els.title.placeholder = t("title-placeholder");
    els.childName.placeholder = t("name-placeholder");
    if (els.yuMark) els.yuMark.alt = t("yu-name");
    document.querySelectorAll("[data-locale]").forEach((button) => {
      const active = button.dataset.locale === state.locale;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-pressed", String(active));
    });
    saveMeta();
    renderIntroTemplates();
    renderThumbs();
    syncCoverPrice();
    syncDeliveryUi();
    if (progressState && els.yuProgress && !els.yuProgress.hidden) {
      const current = progressState;
      showProgress(current.done, current.total, current.key, current.vars);
    }
    if (state.photos.length) void rebuildBook();
  }

  function inspectUpload(file) {
    const safety = window.StoriesLensParentBookSafety;
    if (!safety?.inspectParentBookUpload) return { blocked: false, reasonCode: "approved" };
    return safety.inspectParentBookUpload({
      filename: file?.name,
      title: els.title.value,
      childName: els.childName.value
    });
  }

  function loadHtmlImage(src) {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error("invalid_image"));
      image.src = src;
    });
  }

  function canvasToJpeg(canvas, quality = 0.92) {
    return canvas.toDataURL("image/jpeg", quality);
  }

  function ptToPx(pt) {
    return Math.max(1, Math.round(pt * PAGE_HEIGHT / printSpec().PAGE_HEIGHT_MM * 25.4 / 72));
  }

  function bodyFont() {
    return getComputedStyle(document.body).fontFamily;
  }

  function serifFont() {
    return state.locale === "zh" ? '"Songti SC","STSong","SimSun","Times New Roman",serif' : '"Times New Roman",Times,serif';
  }

  function addPrintPdfPage(pdf, image) {
    const spec = printSpec();
    const page = pdf.addPage([spec.BLEED_WIDTH_PT, spec.BLEED_HEIGHT_PT]);
    page.setMediaBox(0, 0, spec.BLEED_WIDTH_PT, spec.BLEED_HEIGHT_PT);
    page.setBleedBox(0, 0, spec.BLEED_WIDTH_PT, spec.BLEED_HEIGHT_PT);
    page.setTrimBox(spec.BLEED_PT, spec.BLEED_PT, spec.TRIM_WIDTH_PT, spec.TRIM_HEIGHT_PT);
    page.drawImage(image, {
      x: 0,
      y: 0,
      width: spec.BLEED_WIDTH_PT,
      height: spec.BLEED_HEIGHT_PT
    });
    return page;
  }

  let brandMarkPromise = null;
  function loadBrandMark() {
    if (!brandMarkPromise) {
      brandMarkPromise = loadHtmlImage("assets/storieslens-logo.png").catch((error) => {
        brandMarkPromise = null;
        throw error;
      });
    }
    return brandMarkPromise;
  }

  async function watermarkPage(dataUrl) {
    const page = await loadHtmlImage(dataUrl);
    const logo = await loadBrandMark();
    const width = page.naturalWidth || page.width || PAGE_WIDTH;
    const height = page.naturalHeight || page.height || PAGE_HEIGHT;
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");
    context.drawImage(page, 0, 0, width, height);
    const mark = Math.round(width * 0.16);
    const margin = Math.round(width * 0.045);
    context.save();
    context.globalAlpha = 0.62;
    context.drawImage(logo, width - mark - margin, margin, mark, mark);
    context.restore();
    return canvasToJpeg(canvas, 0.92);
  }

  function prepareApi() {
    return window.StoriesLensArtworkPrepare;
  }

  async function pixelsFromDataUrl(dataUrl) {
    const image = await loadHtmlImage(dataUrl);
    const canvas = document.createElement("canvas");
    canvas.width = image.naturalWidth || image.width;
    canvas.height = image.naturalHeight || image.height;
    const context = canvas.getContext("2d", { alpha: true });
    if (!context) throw new Error("processing_unavailable");
    context.drawImage(image, 0, 0);
    const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
    return { rgba: imageData.data, width: canvas.width, height: canvas.height };
  }

  async function sanitizeToPng(file) {
    const artwork = window.StoriesLensArtworkSafety;
    if (artwork?.removeMetadata) {
      const sanitized = await artwork.removeMetadata(file, { preserveAlpha: true });
      return sanitized.dataUrl;
    }
    const url = URL.createObjectURL(file);
    try {
      const image = await loadHtmlImage(url);
      const canvas = document.createElement("canvas");
      canvas.width = image.naturalWidth || image.width;
      canvas.height = image.naturalHeight || image.height;
      const context = canvas.getContext("2d", { alpha: true });
      if (!context) throw new Error("processing_unavailable");
      context.drawImage(image, 0, 0);
      return canvas.toDataURL("image/png");
    } finally {
      URL.revokeObjectURL(url);
    }
  }

  function pngFromRgba(rgba, width, height) {
    return prepareApi().rgbaToPngDataUrl(rgba, width, height);
  }

  function newPhotoId(index) {
    return `photo-${Date.now().toString(36)}-${index}-${Math.random().toString(36).slice(2, 6)}`;
  }

  function noteExtract(pages) {
    const rank = { unavailable: 6, scan: 5, split: 4, uncertain: 3, extracted: 2, restored: 1 };
    pages.forEach((page) => {
      const key = page.extractReason === "scan_not_isolated" || page.scanIsolated === false
        ? "scan"
        : page.textStatus === "unavailable" ? "unavailable" : page.textStatus === "uncertain" ? "uncertain" : page.groupId ? "split" : "extracted";
      if ((rank[key] || 0) >= (rank[state.noticeKey] || 0)) state.noticeKey = key;
    });
  }

  function prepareNotice() {
    const keys = {
      split: "split-done",
      uncertain: "extract-uncertain",
      scan: "scan-not-isolated",
      unavailable: "extract-unavailable",
      extracted: "extract-done",
      restored: "restored"
    };
    return state.noticeKey && keys[state.noticeKey] ? t(keys[state.noticeKey]) : "";
  }

  async function photosFromScan(originalDataUrl, fileName, manuscript, options) {
    const pixels = await pixelsFromDataUrl(originalDataUrl);
    const built = await prepareApi().pagesFromPhonePhoto({
      rgba: pixels.rgba,
      width: pixels.width,
      height: pixels.height,
      allowSplit: !options || options.allowSplit !== false,
      manuscript: Boolean(manuscript),
      extract: (dataUrl) => prepareApi().requestPdfCraftExtraction(dataUrl),
      toPng: pngFromRgba
    });
    const groupId = built.split ? `split-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}` : "";
    const photos = built.pages.map((page, index) => ({
      id: newPhotoId(index),
      dataUrl: page.dataUrl || (page.artworks[0] && page.artworks[0].dataUrl) || page.marksDataUrl || page.scanDataUrl,
      originalDataUrl,
      scanDataUrl: page.scanDataUrl,
      marksDataUrl: page.marksDataUrl,
      sheetCleaned: page.sheetCleaned === true,
      scanIsolated: page.scanIsolated !== false,
      artworks: page.artworks,
      lines: Array.isArray(page.lines) ? page.lines : [],
      layersSeparated: page.layersSeparated === true,
      layoutTextShare: 0,
      artOverrideUrl: "",
      artSource: "",
      assistantLog: [],
      text: page.text,
      textStatus: page.textStatus,
      textEdited: false,
      name: fileName || "",
      manuscript: Boolean(manuscript),
      groupId,
      groupIndex: index,
      extractEngine: "pdf-craft",
      extractReason: page.extractReason
    }));
    noteExtract(photos);
    return photos;
  }

  function ensureCover() {
    if (state.photos.some((photo) => photo.id === state.coverId)) return;
    state.coverId = state.photos[0] ? state.photos[0].id : "";
  }

  function replacePhotoGroup(photo, replacements) {
    const index = state.photos.findIndex((item) => (photo.groupId && item.groupId === photo.groupId) || item === photo);
    const coverPiece = state.photos.find((item) => item.id === state.coverId && (photo.groupId ? item.groupId === photo.groupId : item === photo));
    state.photos = state.photos.filter((item) => photo.groupId ? item.groupId !== photo.groupId : item !== photo);
    state.photos.splice(Math.max(0, index), 0, ...replacements);
    if (coverPiece) state.coverId = (replacements[coverPiece.groupIndex] || replacements[0])?.id || "";
    else if (!state.photos.some((item) => item.id === state.coverId)) state.coverId = state.photos[0]?.id || "";
  }

  async function rotateDataUrl(dataUrl) {
    const pixels = await pixelsFromDataUrl(dataUrl);
    const turned = prepareApi().rotateQuarter(pixels.rgba, pixels.width, pixels.height, 1);
    return pngFromRgba(turned.rgba, turned.width, turned.height);
  }

  async function rotatePhoto(photo) {
    if (state.busy || !photo?.originalDataUrl) return;
    state.busy = true;
    showProgress(0, 3, "progress-prepare", { current: 1, count: 1 });
    try {
      const rotated = await rotateDataUrl(photo.originalDataUrl);
      showProgress(1, 3, "progress-extract", { current: 1, count: 1 });
      const photos = await photosFromScan(rotated, photo.name, photo.manuscript);
      replacePhotoGroup(photo, photos);
      showProgress(2, 3, "progress-layout", { current: 1, count: 1 });
      renderThumbs();
      await rebuildBook();
    } finally {
      state.busy = false;
      hideProgress();
    }
  }

  function roundedRect(context, x, y, width, height, radius) {
    const r = Math.min(radius, width / 2, height / 2);
    context.beginPath();
    context.moveTo(x + r, y);
    context.arcTo(x + width, y, x + width, y + height, r);
    context.arcTo(x + width, y + height, x, y + height, r);
    context.arcTo(x, y + height, x, y, r);
    context.arcTo(x, y, x + width, y, r);
    context.closePath();
  }

  function wrapText(context, text, maxWidth) {
    const value = String(text || "");
    if (!value) return [];
    const characters = /[\u3400-\u9fff]/.test(value) ? Array.from(value) : value.split(/\s+/);
    const lines = [];
    let current = "";
    characters.forEach((part, index) => {
      const chunk = /[\u3400-\u9fff]/.test(value) ? `${current}${part}` : current ? `${current} ${part}` : part;
      if (context.measureText(chunk).width <= maxWidth || !current) current = chunk;
      else {
        lines.push(current);
        current = part;
      }
      if (index === characters.length - 1 && current) lines.push(current);
    });
    return lines.slice(0, 4);
  }

  function drawImageContained(context, image, x, y, width, height) {
    const scale = Math.min(width / image.naturalWidth, height / image.naturalHeight);
    const drawWidth = image.naturalWidth * scale;
    const drawHeight = image.naturalHeight * scale;
    const dx = x + (width - drawWidth) / 2;
    const dy = y + (height - drawHeight) / 2;
    context.drawImage(image, dx, dy, drawWidth, drawHeight);
    return { dx, dy, drawWidth, drawHeight };
  }

  function pageCanvas() {
    const canvas = document.createElement("canvas");
    canvas.width = PAGE_WIDTH;
    canvas.height = PAGE_HEIGHT;
    const context = canvas.getContext("2d", { alpha: false });
    context.fillStyle = "#f6f0e4";
    context.fillRect(0, 0, PAGE_WIDTH, PAGE_HEIGHT);
    return { canvas, context };
  }

  function overlayCaption(context, text, y, size = 42) {
    context.save();
    context.textAlign = "center";
    context.font = `700 ${size}px ${getComputedStyle(document.body).fontFamily}`;
    context.lineWidth = 10;
    context.strokeStyle = "rgba(246,240,228,0.88)";
    context.strokeText(text, PAGE_WIDTH / 2, y);
    context.fillStyle = "#1c2420";
    context.fillText(text, PAGE_WIDTH / 2, y);
    context.restore();
  }

  function avatarDecision() {
    return prepareApi().avatarUseDecision({
      mode: state.avatar.mode,
      under18: state.avatar.under18 === true,
      adultName: state.avatar.consent?.adultName,
      signature: state.avatar.consent
    });
  }

  function coverHeroUrl(photo) {
    return prepareApi().coverHeroSource(photo, state.interiorStyle);
  }

  function drawTypographicCover(context, pageNumber) {
    const frame = prepareApi().printSafeFrame(PAGE_WIDTH, PAGE_HEIGHT, pageNumber);
    const center = frame.x + frame.w / 2;
    context.textAlign = "center";
    context.fillStyle = "#0f6244";
    context.font = `700 ${ptToPx(12)}px ${bodyFont()}`;
    context.fillText(t("cover-kicker"), center, frame.y + ptToPx(18));
    context.fillStyle = "#101817";
    context.font = `700 ${ptToPx(28)}px ${serifFont()}`;
    const lines = wrapText(context, bookTitle(), frame.w);
    const titleTop = frame.y + frame.h * 0.38;
    lines.forEach((line, index) => {
      context.fillText(line, center, titleTop + index * ptToPx(34));
    });
    if (displayAuthor()) {
      context.fillStyle = "#3d4a44";
      context.font = `600 ${ptToPx(12)}px ${bodyFont()}`;
      context.fillText(t("byline", { name: displayAuthor() }), center, frame.y + frame.h - ptToPx(8));
    }
  }

  async function renderCoverPage(photo, pageNumber = 1) {
    const { canvas, context } = pageCanvas();
    const heroUrl = state.coverStyle === "typographic" ? "" : coverHeroUrl(photo);
    if (!heroUrl) {
      drawTypographicCover(context, pageNumber);
      return canvasToJpeg(canvas, 0.92);
    }
    const image = await loadHtmlImage(heroUrl);
    prepareApi().drawCoverPage(context, {
      pageWidth: PAGE_WIDTH,
      pageHeight: PAGE_HEIGHT,
      pageNumber,
      image,
      title: bookTitle(),
      subtitle: displayAuthor() ? t("byline", { name: displayAuthor() }) : "",
      paper: "#f6f0e4",
      fontFamily: bodyFont(),
      titleFont: `700 ${ptToPx(22)}px ${serifFont()}`,
      subtitleFont: `600 ${ptToPx(12)}px ${bodyFont()}`
    });
    return canvasToJpeg(canvas, 0.92);
  }

  async function renderAuthorPage(pageNumber = 2) {
    const { canvas, context } = pageCanvas();
    const frame = prepareApi().printSafeFrame(PAGE_WIDTH, PAGE_HEIGHT, pageNumber);
    const center = frame.x + frame.w / 2;
    const decision = avatarDecision();
    const avatarUrl = state.avatar.mode === "illustrated" ? state.avatar.illustratedDataUrl : state.avatar.originalDataUrl;
    let textTop = frame.y + ptToPx(8);
    if (decision.allowed && avatarUrl) {
      const image = await loadHtmlImage(avatarUrl);
      const size = Math.min(frame.w * 0.62, frame.h * 0.42);
      const x = frame.x + (frame.w - size) / 2;
      const y = frame.y;
      context.save();
      roundedRect(context, x, y, size, size, Math.round(size * 0.08));
      context.clip();
      const scale = Math.max(size / image.naturalWidth, size / image.naturalHeight);
      const drawWidth = image.naturalWidth * scale;
      const drawHeight = image.naturalHeight * scale;
      context.drawImage(image, x + (size - drawWidth) / 2, y + (size - drawHeight) / 2, drawWidth, drawHeight);
      context.restore();
      textTop = y + size + ptToPx(16);
    }
    context.fillStyle = "#0f6244";
    context.textAlign = "center";
    context.font = `700 ${ptToPx(12)}px ${bodyFont()}`;
    context.fillText(t("about-author"), center, textTop);
    context.fillStyle = "#101817";
    context.font = `700 ${ptToPx(22)}px ${serifFont()}`;
    context.fillText(displayAuthor() || bookTitle(), center, textTop + ptToPx(28));
    context.fillStyle = "#3d4a44";
    context.font = `500 ${ptToPx(13)}px ${bodyFont()}`;
    wrapText(context, authorIntro(), frame.w).forEach((line, index) => {
      context.fillText(line, center, textTop + ptToPx(48) + index * ptToPx(18));
    });
    if (childName() && childName() !== authorName()) {
      context.fillStyle = "#7a756b";
      context.font = `600 ${ptToPx(11)}px ${bodyFont()}`;
      context.fillText(t("credit-line", { name: childName() }), center, frame.y + frame.h - ptToPx(4));
    }
    return canvasToJpeg(canvas, 0.92);
  }

  async function renderWorkPage(photo, extras = {}) {
    const { canvas, context } = pageCanvas();
    const manuscript = extras.manuscript === true || photo.manuscript === true;
    const sources = prepareApi().storyArtSources({
      manuscript,
      treatment: manuscript ? "original" : (extras.treatment || state.interiorStyle),
      scanUrl: photo.scanIsolated === false ? "" : (photo.scanDataUrl || photo.marksDataUrl || ""),
      polishedUrl: photo.polishedDataUrl || "",
      polishOk: photo.polishStatus === "ok",
      artOverrideUrl: photo.artOverrideUrl || "",
      artSource: photo.artSource || "",
      artworks: photo.artworks,
      layersSeparated: photo.layersSeparated === true
    });
    const artworks = [];
    for (const url of sources.urls) artworks.push(await loadHtmlImage(url));
    const marks = sources.marksUrl ? await loadHtmlImage(sources.marksUrl) : null;
    prepareApi().drawRebuiltPage(context, {
      pageWidth: PAGE_WIDTH,
      pageHeight: PAGE_HEIGHT,
      pageNumber: extras.pageNumber || 1,
      artworks,
      marks,
      text: photo.text || "",
      status: photo.textStatus,
      edited: photo.textEdited === true,
      manuscript,
      treatment: sources.treatment,
      separated: sources.separated,
      textShare: photo.layoutTextShare || 0,
      title: extras.title || "",
      subtitle: extras.subtitle || "",
      paper: "#f6f0e4",
      fontFamily: serifFont()
    });
    return canvasToJpeg(canvas, 0.92);
  }

  async function renderPhotoPage(photo, pageNumber) {
    return renderWorkPage(photo, { pageNumber });
  }

  function showAuthorPage() {
    return Boolean(authorName() || authorIntro() || state.avatar.originalDataUrl || state.avatar.illustratedDataUrl);
  }

  async function rebuildBook() {
    if (!state.photos.length) {
      state.pages = [];
      state.previewPages = [];
      els.previewCard.hidden = true;
      if (els.bookAssistant) els.bookAssistant.hidden = true;
      if (els.bookEditFields) els.bookEditFields.replaceChildren();
      return;
    }
    const stamp = (state.rebuildStamp += 1);
    ensureCover();
    if (state.interiorStyle === "polished") {
      const illustrated = await prepareApi().illustratePhotos(state.photos, {
        style: "polished",
        textFor: shownPhotoText,
        onProgress: (index, total) => showProgress(index, Math.max(total, 1), "progress-illustrate", { current: index + 1, count: total })
      });
      if (stamp !== state.rebuildStamp) return;
      if (illustrated.fallback) state.noticeKey = "polish-fallback";
      else if (state.noticeKey === "polish-fallback") state.noticeKey = "";
    }
    const plan = prepareApi().planBookPages({
      photos: state.photos,
      coverId: state.coverId,
      includeAuthor: showAuthorPage()
    });
    state.pagePhotoIds = plan.map((item) => item.photoId || "");
    const pages = [];
    const kinds = [];
    for (let index = 0; index < plan.length; index += 1) {
      const item = plan[index];
      const pageNumber = index + 1;
      const photo = state.photos.find((entry) => entry.id === item.photoId);
      if (item.kind === "cover") pages.push(await renderCoverPage(photo, pageNumber));
      else if (item.kind === "author") pages.push(await renderAuthorPage(pageNumber));
      else if (item.kind === "manuscript") pages.push(await renderWorkPage(photo, { pageNumber, manuscript: true, title: t("page-label-manuscript") }));
      else pages.push(await renderPhotoPage(photo, pageNumber));
      kinds.push(item.kind);
    }
    if (stamp !== state.rebuildStamp) return;
    const previewPages = [];
    for (const page of pages) previewPages.push(await watermarkPage(page));
    state.pages = pages;
    state.previewPages = previewPages;
    state.pageKinds = kinds;
    state.pageIndex = Math.min(state.pageIndex, pages.length - 1);
    state.pdfBlob = null;
    if (state.pdfUrl) URL.revokeObjectURL(state.pdfUrl);
    state.pdfUrl = "";
    if (els.pdfBox) els.pdfBox.hidden = true;
    renderPreview();
    renderBookEditor();
    els.previewCard.hidden = false;
    if (els.bookAssistant) els.bookAssistant.hidden = false;
    if (els.priceBox) els.priceBox.hidden = false;
    startSuggestions();
    showReadingCheck();
    void refreshPricing();
    hideProgress();
    if (state.noticeKey === "polish-fallback") setStatus(t("polish-fallback"));
    else setStatus(state.announcePrepare ? (prepareNotice() || t("ready")) : t("ready"));
    state.announcePrepare = false;
  }

  function renderPreview() {
    const shown = state.previewPages[state.pageIndex];
    if (!shown) return;
    els.pageImage.src = shown;
    const kind = state.pageKinds[state.pageIndex];
    const label = kind === "cover" ? t("page-label-cover") : kind === "author" ? t("page-label-author") : kind === "manuscript" ? t("page-label-manuscript") : t("page-of", { current: state.pageIndex + 1, total: state.pages.length });
    els.pageImage.alt = label;
    els.pageLabel.textContent = label;
    els.prev.disabled = state.pageIndex === 0;
    els.next.disabled = state.pageIndex >= state.pages.length - 1;
  }

  function assistantPhoto() {
    const kind = state.pageKinds[state.pageIndex];
    const id = state.pagePhotoIds && state.pagePhotoIds[state.pageIndex];
    if (kind === "photo" && id) {
      const current = state.photos.find((photo) => photo.id === id);
      if (current) return current;
    }
    return state.photos.find((photo) => photo.manuscript !== true) || state.photos[0] || null;
  }

  function assistantLabel(proposal) {
    if (!proposal) return "";
    if (proposal.kind === "proofread") {
      if (proposal.category === "wording") return t("assistant-proof-wording");
      if (proposal.category === "punctuation") return t("assistant-proof-punctuation");
      if (proposal.category === "confirm") return t("assistant-proof-confirm");
      return t("assistant-proof-layout");
    }
    if (proposal.kind === "layout") return t("assistant-layout-label");
    if (proposal.kind === "art") return t("assistant-art-label");
    return t("assistant-type-label");
  }

  function commitAssistantPhoto(photo) {
    const index = state.photos.findIndex((item) => item.id === photo.id);
    if (index < 0) return;
    state.photos[index] = photo;
    renderThumbs();
    void rebuildBook();
  }

  function shownPhotoText(photo) {
    return photo.textStatus === "ok" || photo.textStatus === "parent" || photo.textEdited ? (photo.text || "") : "";
  }

  function photoTextPlaceholder(photo) {
    if (photo.textStatus === "unavailable") return t("extract-unavailable");
    if (photo.textStatus === "uncertain") return t("extract-uncertain");
    return t("text-label");
  }

  function commitPhotoText(photo, value) {
    photo.text = value;
    photo.textEdited = true;
    photo.textStatus = "parent";
    renderThumbs();
    void rebuildBook();
  }

  function renderBookEditor() {
    const root = els.bookEditFields;
    if (!root) return;
    root.replaceChildren();
    if (!state.photos.length) return;
    const bindField = (labelKey, source, options = {}) => {
      if (!source) return;
      const label = document.createElement("label");
      label.className = "field";
      const span = document.createElement("span");
      span.textContent = t(labelKey);
      const control = document.createElement(options.multiline ? "textarea" : "input");
      if (!options.multiline) control.type = "text";
      control.maxLength = options.maxLength;
      if (options.rows) control.rows = options.rows;
      control.value = source.value;
      if (source.placeholder) control.placeholder = source.placeholder;
      control.addEventListener("change", () => {
        source.value = control.value;
        saveMeta();
        if (options.after) options.after();
        if (state.photos.length) void rebuildBook();
      });
      label.append(span, control);
      root.append(label);
    };
    bindField("title-label", els.title, { maxLength: 80 });
    bindField("author-label", els.authorName, { maxLength: 40 });
    bindField("name-label", els.childName, { maxLength: 40 });
    bindField("intro-label", els.authorIntro, { multiline: true, maxLength: 800, rows: 4, after: renderIntroTemplates });
    state.photos.forEach((photo, index) => {
      const piece = document.createElement("div");
      piece.className = "piece-edit";
      const rotate = document.createElement("button");
      rotate.type = "button";
      rotate.className = "secondary";
      rotate.textContent = t("rotate-photo");
      rotate.addEventListener("click", () => { void rotatePhoto(photo); });
      const label = document.createElement("label");
      label.className = "field";
      const span = document.createElement("span");
      span.textContent = t("edit-piece", { n: index + 1 });
      const writing = document.createElement("textarea");
      writing.maxLength = 4000;
      writing.rows = 4;
      writing.value = shownPhotoText(photo);
      writing.placeholder = photoTextPlaceholder(photo);
      writing.setAttribute("aria-label", t("edit-piece", { n: index + 1 }));
      writing.addEventListener("change", () => commitPhotoText(photo, writing.value));
      label.append(span, writing);
      piece.append(rotate, label);
      root.append(piece);
    });
  }

  function renderThumbs() {
    if (!els.thumbs) return;
    els.thumbs.innerHTML = "";
    state.photos.forEach((photo, index) => {
      const item = document.createElement("div");
      item.className = "thumb";
      const frame = document.createElement("div");
      frame.className = "thumb-frame";
      const image = document.createElement("img");
      image.src = photo.dataUrl;
      image.alt = photo.name || `${index + 1}`;
      const remove = document.createElement("button");
      remove.className = "thumb-remove";
      remove.type = "button";
      remove.textContent = "×";
      remove.addEventListener("click", () => {
        const removeIds = photo.groupId ? state.photos.filter((item) => item.groupId === photo.groupId).map((item) => item.id) : [photo.id];
        state.photos = state.photos.filter((item) => !removeIds.includes(item.id));
        ensureCover();
        renderThumbs();
        void rebuildBook();
      });
      frame.append(image, remove);
      const tools = document.createElement("div");
      tools.className = "thumb-tools";
      const rotate = document.createElement("button");
      rotate.type = "button";
      rotate.textContent = t("rotate-photo");
      rotate.addEventListener("click", () => { void rotatePhoto(photo); });
      const cover = document.createElement("button");
      cover.type = "button";
      cover.textContent = t("set-cover");
      cover.classList.toggle("is-on", photo.id === state.coverId);
      cover.addEventListener("click", () => {
        state.coverId = photo.id;
        renderThumbs();
        void rebuildBook();
      });
      const manuscript = document.createElement("button");
      manuscript.type = "button";
      manuscript.textContent = t("manuscript-toggle");
      manuscript.classList.toggle("is-on", photo.manuscript === true);
      manuscript.addEventListener("click", () => {
        photo.manuscript = !photo.manuscript;
        renderThumbs();
        void rebuildBook();
      });
      const restore = document.createElement("button");
      restore.type = "button";
      restore.textContent = t("restore-original");
      restore.addEventListener("click", () => { void restoreOriginal(photo); });
      const retry = document.createElement("button");
      retry.type = "button";
      retry.textContent = t("retry-cutout");
      retry.addEventListener("click", () => { void retryCutout(photo); });
      tools.append(rotate, cover, manuscript, restore, retry);
      const writing = document.createElement("textarea");
      writing.className = "thumb-text";
      writing.maxLength = 4000;
      writing.value = shownPhotoText(photo);
      writing.placeholder = photoTextPlaceholder(photo);
      writing.setAttribute("aria-label", t("text-label"));
      writing.addEventListener("change", () => commitPhotoText(photo, writing.value));
      if (photo.groupId) {
        const undo = document.createElement("button");
        undo.type = "button";
        undo.textContent = t("undo-split");
        undo.addEventListener("click", () => { void undoSplit(photo); });
        tools.append(undo);
      }
      const actions = document.createElement("div");
      actions.className = "thumb-actions";
      const up = document.createElement("button");
      up.type = "button";
      up.textContent = "↑";
      up.disabled = index === 0;
      up.addEventListener("click", () => {
        const [moved] = state.photos.splice(index, 1);
        state.photos.splice(index - 1, 0, moved);
        renderThumbs();
        void rebuildBook();
      });
      const down = document.createElement("button");
      down.type = "button";
      down.textContent = "↓";
      down.disabled = index === state.photos.length - 1;
      down.addEventListener("click", () => {
        const [moved] = state.photos.splice(index, 1);
        state.photos.splice(index + 1, 0, moved);
        renderThumbs();
        void rebuildBook();
      });
      actions.append(up, down);
      item.append(frame, tools, writing, actions);
      els.thumbs.append(item);
    });
  }

  async function restoreOriginal(photo) {
    const single = {
      id: newPhotoId(0),
      dataUrl: photo.originalDataUrl,
      originalDataUrl: photo.originalDataUrl,
      scanDataUrl: photo.originalDataUrl,
      marksDataUrl: photo.originalDataUrl,
      artworks: [],
      text: "",
      textStatus: "restored",
      textEdited: false,
      name: photo.name,
      manuscript: photo.manuscript,
      groupId: "",
      groupIndex: 0,
      extractEngine: "pdf-craft",
      extractReason: "restored"
    };
    replacePhotoGroup(photo, [single]);
    state.noticeKey = "restored";
    renderThumbs();
    await rebuildBook();
    setStatus(t("restored"));
  }

  async function retryCutout(photo) {
    showProgress(0, 2, "progress-extract", { current: 1, count: 1 });
    try {
      const photos = await photosFromScan(photo.originalDataUrl, photo.name, photo.manuscript, { allowSplit: true });
      if (state.photos.length - (photo.groupId ? state.photos.filter((item) => item.groupId === photo.groupId).length : 1) + photos.length > MAX_PHOTOS) {
        setStatus(t("too-many"), true);
        return;
      }
      replacePhotoGroup(photo, photos);
      state.announcePrepare = true;
      showProgress(1, 2, "progress-layout", { current: 1, count: 1 });
      renderThumbs();
      await rebuildBook();
    } finally {
      hideProgress();
    }
  }

  async function undoSplit(photo) {
    showProgress(0, 2, "progress-extract", { current: 1, count: 1 });
    try {
      const photos = await photosFromScan(photo.originalDataUrl, photo.name, photo.manuscript, { allowSplit: false });
      replacePhotoGroup(photo, photos);
      showProgress(1, 2, "progress-layout", { current: 1, count: 1 });
      renderThumbs();
      await rebuildBook();
    } finally {
      hideProgress();
    }
  }

  async function addFiles(fileList) {
    const files = Array.from(fileList || []).filter(Boolean);
    if (!files.length) return;
    if (state.photos.length + files.length > MAX_PHOTOS) {
      setStatus(t("too-many"), true);
      return;
    }
    state.busy = true;
    state.noticeKey = "";
    const total = files.length * 2 + 1;
    showProgress(0, total, "progress-prepare", { current: 1, count: files.length });
    try {
      for (let index = 0; index < files.length; index += 1) {
        const file = files[index];
        const current = index + 1;
        showProgress(index * 2, total, "progress-prepare", { current, count: files.length });
        const inspection = inspectUpload(file);
        if (inspection.blocked) {
          setStatus(t("blocked"), true);
          continue;
        }
        const supported = window.StoriesLensArtworkSafety?.isSupportedImage
          ? window.StoriesLensArtworkSafety.isSupportedImage(file)
          : /image\//.test(file.type || "") || /\.(jpe?g|png|webp|gif|heic|heif|avif)$/i.test(file.name || "");
        if (!supported) {
          setStatus(t("unsupported"), true);
          continue;
        }
        showProgress(index * 2 + 1, total, "progress-extract", { current, count: files.length });
        try {
          const originalDataUrl = await sanitizeToPng(file);
          const manuscript = prepareApi().looksLikeManuscript(file.name);
          const photos = await photosFromScan(originalDataUrl, file.name || "", manuscript);
          if (state.photos.length + photos.length > MAX_PHOTOS) {
            setStatus(t("too-many"), true);
            break;
          }
          state.photos.push(...photos);
          if (!state.coverId) state.coverId = photos[0].id;
        } catch (_error) {
          setStatus(t("unsupported"), true);
        }
      }
      renderThumbs();
      if (state.photos.length) {
        state.announcePrepare = true;
        showProgress(files.length * 2, total, "progress-layout", { current: files.length, count: files.length });
        await rebuildBook();
      } else {
        setStatus(t("need-photos"), true);
      }
    } finally {
      state.busy = false;
      hideProgress();
    }
  }


  function renderIntroTemplates() {
    if (!els.introTemplates) return;
    const review = window.StoriesLensFamilyBookReview;
    const templates = review?.authorIntroTemplates(state.locale) || [];
    els.introTemplates.innerHTML = "";
    templates.forEach((text) => {
      const button = document.createElement("button");
      button.type = "button";
      button.textContent = text;
      button.classList.toggle("is-selected", authorIntro() === text);
      button.addEventListener("click", () => {
        state.suggestionHistory.push({ field: "authorIntro", previous: authorIntro() });
        els.authorIntro.value = text;
        saveMeta();
        renderIntroTemplates();
        if (state.photos.length) void rebuildBook();
      });
      els.introTemplates.append(button);
    });
    if (els.authorIntro) els.authorIntro.placeholder = t("intro-placeholder");
    if (els.authorName) els.authorName.placeholder = t("author-placeholder");
  }

  function readingBook() {
    return {
      title: els.title.value.trim(),
      authorName: authorName(),
      authorIntro: authorIntro(),
      childName: childName(),
      locale: state.locale,
      notes: state.photos.map((photo) => (photo.textStatus === "ok" || photo.textStatus === "parent" || photo.textEdited) ? photo.text : "").filter(Boolean),
      photos: state.photos.map((photo) => photo.dataUrl)
    };
  }

  function showReadingCheck() {
    if (!els.readingCard) return;
    const review = window.StoriesLensFamilyBookReview;
    els.readingCard.hidden = !state.photos.length;
    if (els.readingText && review) els.readingText.textContent = review.bookReadingText(readingBook());
    if (els.readingStatus && state.readingApproval?.approved) els.readingStatus.textContent = t("reading-approved");
  }

  function acceptReading() {
    const review = window.StoriesLensFamilyBookReview;
    const before = readingBook();
    state.readingApproval = review.approveReading(before);
    saveMeta();
    if (els.readingStatus) els.readingStatus.textContent = t("reading-approved");
    if (els.yuResult) els.yuResult.hidden = true;
    setStatus(t("reading-approved"));
  }

  async function askYuToReview() {
    const review = window.StoriesLensFamilyBookReview;
    const book = readingBook();
    const request = review.yuMentorReviewRequest(book);
    if (!request.original) {
      if (els.readingStatus) els.readingStatus.textContent = t("reading-empty");
      setStatus(t("reading-empty"), true);
      return;
    }
    if (els.readingYu) els.readingYu.disabled = true;
    setStatus(t("yu-working"));
    try {
      const response = await fetch(request.path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(request.body)
      });
      const payload = await response.json().catch(() => ({}));
      const outcome = review.yuReviewOutcome({
        original: request.original,
        status: response.ok ? response.status : response.status,
        result: response.ok ? (payload.result || payload) : null
      });
      if (!outcome.configured) {
        if (els.yuResult) els.yuResult.hidden = true;
        if (els.readingStatus) els.readingStatus.textContent = t("yu-unavailable");
        setStatus(t("yu-unavailable"), true);
        return;
      }
      state.yuOffer = outcome;
      if (els.yuComment) els.yuComment.textContent = outcome.comment;
      if (els.yuSuggestion) els.yuSuggestion.textContent = outcome.suggestion;
      if (els.yuResult) els.yuResult.hidden = false;
      if (els.readingStatus) els.readingStatus.textContent = t("yu-ready");
      setStatus(t("yu-ready"));
    } catch (_error) {
      if (els.yuResult) els.yuResult.hidden = true;
      if (els.readingStatus) els.readingStatus.textContent = t("yu-unavailable");
      setStatus(t("yu-unavailable"), true);
    } finally {
      if (els.readingYu) els.readingYu.disabled = false;
    }
  }

  function applyYuOffer() {
    const review = window.StoriesLensFamilyBookReview;
    const book = readingBook();
    const applied = review.applyYuSuggestion(book, state.yuOffer?.suggestion || "");
    if (!applied.applied) {
      if (els.readingStatus) els.readingStatus.textContent = t("yu-kept");
      return;
    }
    if (String(book.authorIntro || "").trim()) els.authorIntro.value = applied.authorIntro;
    else els.title.value = applied.title;
    saveMeta();
    renderIntroTemplates();
    if (els.readingStatus) els.readingStatus.textContent = t("yu-applied");
    if (state.photos.length) void rebuildBook();
  }

  function keepOriginalAfterYu() {
    state.yuOffer = null;
    if (els.yuResult) els.yuResult.hidden = true;
    if (els.readingStatus) els.readingStatus.textContent = t("yu-kept");
    setStatus(t("yu-kept"));
  }

  function startSuggestions() {
    const review = window.StoriesLensFamilyBookReview;
    state.suggestions = review?.suggestFamilyBook({
      title: els.title.value.trim(),
      authorName: authorName(),
      authorIntro: authorIntro(),
      childName: childName(),
      defaultTitle: t("default-title"),
      photoCount: state.photos.length,
      firstFileName: state.photos[0]?.name || "",
      locale: state.locale
    }) || [];
    state.suggestionIndex = 0;
    renderSuggestion();
  }

  function renderSuggestion() {
    if (!els.suggestCard) return;
    if (!state.suggestions.length || state.suggestionIndex >= state.suggestions.length) {
      els.suggestCard.hidden = !state.suggestions.length;
      if (state.suggestions.length) {
        els.suggestText.textContent = t("suggest-done");
        els.suggestAccept.hidden = true;
        els.suggestSkip.hidden = true;
        els.suggestMeta.textContent = "";
      } else {
        els.suggestCard.hidden = true;
      }
      if (els.suggestUndo) els.suggestUndo.hidden = !state.suggestionHistory.length;
      return;
    }
    const item = state.suggestions[state.suggestionIndex];
    els.suggestCard.hidden = false;
    els.suggestAccept.hidden = false;
    els.suggestSkip.hidden = false;
    els.suggestText.textContent = item.message?.[state.locale] || item.message?.zh || "";
    els.suggestMeta.textContent = t("suggest-progress", { current: state.suggestionIndex + 1, total: state.suggestions.length });
    if (els.suggestUndo) els.suggestUndo.hidden = !state.suggestionHistory.length;
  }

  function applySuggestion(item) {
    const fieldMap = { title: els.title, authorName: els.authorName, authorIntro: els.authorIntro, childName: els.childName };
    const field = fieldMap[item.field];
    if (item.reversible && field && item.proposedValue) {
      state.suggestionHistory.push({ field: item.field, previous: field.value });
      field.value = item.proposedValue;
      saveMeta();
      renderIntroTemplates();
      return true;
    }
    if (field) field.focus();
    if (item.field === "pageOrder") els.thumbs?.scrollIntoView({ behavior: "smooth", block: "center" });
    return Boolean(item.reversible && item.proposedValue);
  }

  function acceptSuggestion() {
    const item = state.suggestions[state.suggestionIndex];
    if (!item) return;
    const changed = applySuggestion(item);
    state.suggestionIndex += 1;
    renderSuggestion();
    if (changed && state.photos.length) void rebuildBook();
  }

  function skipSuggestion() {
    state.suggestionIndex += 1;
    renderSuggestion();
  }

  function undoSuggestion() {
    const last = state.suggestionHistory.pop();
    if (!last) return renderSuggestion();
    const fieldMap = { title: els.title, authorName: els.authorName, authorIntro: els.authorIntro, childName: els.childName };
    const field = fieldMap[last.field];
    if (field) field.value = last.previous;
    saveMeta();
    renderIntroTemplates();
    if (state.suggestionIndex > 0) state.suggestionIndex -= 1;
    renderSuggestion();
    if (state.photos.length) void rebuildBook();
  }

  async function refreshPricing() {
    try {
      const response = await fetch("/api/family-book/pricing");
      state.pricing = await response.json();
    } catch (_error) {
      state.pricing = { checkoutConfigured: false, noticeZh: t("price-digital-copy"), noticeEn: t("price-digital-copy") };
    }
    if (els.payNote) {
      els.payNote.textContent = state.locale === "zh" ? (state.pricing.noticeZh || "") : (state.pricing.noticeEn || "");
      els.payNote.hidden = false;
    }
    const configured = state.pricing?.checkoutConfigured === true;
    if (els.buyDigital) els.buyDigital.disabled = !configured;
    if (els.buyPrint) els.buyPrint.disabled = !configured;
    await refreshEntitlement();
  }

  function contactPayload() {
    return {
      name: els.contactName?.value.trim() || "",
      email: els.contactEmail?.value.trim() || "",
      phone: els.contactPhone?.value.trim() || ""
    };
  }

  function shippingPayload() {
    return {
      name: els.contactName?.value.trim() || "",
      phone: els.contactPhone?.value.trim() || "",
      line1: els.shipLine1?.value.trim() || "",
      line2: els.shipLine2?.value.trim() || "",
      city: els.shipCity?.value.trim() || "",
      region: els.shipRegion?.value.trim() || "",
      postal: els.shipPostal?.value.trim() || "",
      country: els.shipCountry?.value.trim() || ""
    };
  }

  function selectedPrintOfferId() {
    return document.querySelector("[data-cover-option]:checked")?.value || "";
  }

  function syncCoverPrice() {
    if (!els.printPrice) return;
    const selected = selectedPrintOfferId();
    if (selected === "family-print-hardcover") els.printPrice.textContent = t("cover-hardcover");
    else if (selected === "family-print-softcover") els.printPrice.textContent = t("cover-softcover");
    else els.printPrice.textContent = t("cover-required");
  }

  function syncDeliveryUi() {
    if (els.sendBookEmail) els.sendBookEmail.textContent = state.entitlement.emailSent ? t("resend-book-email") : t("send-book-email");
  }

  function printStatusCopy(cover) {
    if (cover === "hardcover") return t("pay-unlocked-hardcover");
    if (cover === "softcover") return t("pay-unlocked-softcover");
    return t("pay-unlocked-print");
  }

  function validEmail(value) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || "").trim());
  }

  async function startCheckout(offerId) {
    const isPrint = offerId === "print";
    const selectedOffer = isPrint ? selectedPrintOfferId() : offerId;
    if (!state.pages.length) return setStatus(t("need-photos"), true);
    if (els.adultConfirm && !els.adultConfirm.checked) return setStatus(t("adult-required"), true);
    if (!contactPayload().email) return setStatus(t("adult-required"), true);
    if (isPrint && !selectedOffer) return setStatus(t("cover-required"), true);
    if (isPrint) {
      const shipping = shippingPayload();
      if (!shipping.name || !shipping.phone || !shipping.line1 || !shipping.city || !shipping.region || !shipping.postal || !shipping.country) {
        return setStatus(t("shipping-required"), true);
      }
    }
    setStatus(t("checkout-working"));
    try {
      const response = await fetch("/api/family-book/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          offerId: selectedOffer,
          adultConfirmed: els.adultConfirm?.checked === true,
          contact: contactPayload(),
          shipping: isPrint ? shippingPayload() : undefined,
          locale: state.locale,
          returnPath: "/parent-book",
          cancelPath: "/parent-book"
        })
      });
      const result = await response.json().catch(() => ({}));
      if (result.checkoutUrl && result.paid !== true) {
        window.location.assign(result.checkoutUrl);
        return;
      }
      setStatus(result.errorZh && state.locale === "zh" ? result.errorZh : (result.error || t("pdf-failed")), true);
      if (els.payNote) els.payNote.textContent = state.locale === "zh" ? (result.errorZh || result.error || state.pricing?.noticeZh || "") : (result.error || state.pricing?.noticeEn || "");
    } catch (error) {
      setStatus(t("pdf-failed"), true);
    }
  }

  async function refreshEntitlement() {
    const params = new URLSearchParams(window.location.search);
    const query = params.toString() ? `?${params.toString()}` : "";
    try {
      const response = await fetch(`/api/family-book/entitlement${query}`);
      const result = await response.json();
      const paid = result.paid === true && result.reason === "server_confirmed";
      state.entitlement = {
        paid,
        kind: result.order?.kind || "",
        cover: result.order?.cover || "",
        orderId: result.order?.id || "",
        grantToken: result.order?.grantToken || "",
        deliveryEmail: result.order?.deliveryEmail || "",
        emailSent: result.order?.emailSent === true
      };
      const digitalPaid = paid && state.entitlement.kind === "digital";
      if (els.deliveryBox) els.deliveryBox.hidden = !digitalPaid;
      if (els.deliveryEmail && digitalPaid && !els.deliveryEmail.value.trim()) {
        els.deliveryEmail.value = state.entitlement.deliveryEmail || result.order?.contactEmail || "";
      }
      if (els.paidActions) els.paidActions.hidden = !(digitalPaid && state.entitlement.deliveryEmail);
      syncDeliveryUi();
      if (els.payUnlocked) {
        els.payUnlocked.hidden = !paid;
        if (paid) els.payUnlocked.textContent = state.entitlement.kind === "print" ? printStatusCopy(state.entitlement.cover) : t("pay-unlocked-digital");
      }
      if (paid) setStatus(state.entitlement.kind === "print" ? printStatusCopy(state.entitlement.cover) : t("pay-unlocked-digital"));
      syncFollowUp();
    } catch (_error) {
      state.entitlement = { paid: false, kind: "" };
      syncFollowUp();
    }
  }

  function suggestedPdfName() {
    const base = bookTitle().replace(/[\\/:*?"<>|]+/g, "-").replace(/\s+/g, "-").slice(0, 60) || "storieslens-book";
    return `${base}.pdf`;
  }

  function paidPagePayload() {
    return state.pages.map((imageDataUrl) => ({ imageDataUrl }));
  }

  async function sendPaidBookEmail() {
    if (!(state.entitlement?.paid && state.entitlement.kind === "digital")) return setStatus(t("pdf-failed"), true);
    const email = els.deliveryEmail?.value.trim() || "";
    if (!validEmail(email)) return setStatus(t("delivery-email-required"), true);
    setStatus(t("email-working"));
    try {
      const response = await fetch("/api/family-book/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: state.entitlement.orderId,
          grantToken: state.entitlement.grantToken,
          email,
          title: bookTitle(),
          authorName: authorName(),
          childName: childName(),
          language: state.locale,
          pages: paidPagePayload()
        })
      });
      const result = await response.json().catch(() => ({}));
      if (result.emailSaved) {
        state.entitlement.deliveryEmail = result.deliveryEmail || email;
        if (els.paidActions) els.paidActions.hidden = false;
      }
      if (result.sent === true) {
        state.entitlement.emailSent = true;
        syncDeliveryUi();
        syncFollowUp();
        setStatus(t("email-sent"));
        return;
      }
      syncDeliveryUi();
      const message = state.locale === "zh" ? (result.errorZh || result.error || t("email-saved-unsent")) : (result.error || t("email-saved-unsent"));
      setStatus(message, true);
    } catch (_error) {
      setStatus(t("email-saved-unsent"), true);
    }
  }

  async function ensurePdf() {
    if (!(state.entitlement?.paid && state.entitlement.kind === "digital" && state.entitlement.deliveryEmail)) {
      setStatus(state.entitlement?.paid ? t("delivery-email-required") : t("pdf-failed"), true);
      throw new Error("unpaid");
    }
    if (state.pdfBlob) return state.pdfBlob;
    setStatus(t("pdf-working"));
    try {
      const response = await fetch("/api/family-book/download", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: state.entitlement.orderId,
          grantToken: state.entitlement.grantToken,
          title: bookTitle(),
          authorName: authorName(),
          childName: childName(),
          language: state.locale,
          pages: paidPagePayload()
        })
      });
      if (response.status === 402 || response.status === 401 || response.status === 403 || response.status === 409) {
        throw new Error("unpaid");
      }
      if (!response.ok) throw new Error("pdf_failed");
      const blob = await response.blob();
      state.pdfBlob = blob;
      if (state.pdfUrl) URL.revokeObjectURL(state.pdfUrl);
      state.pdfUrl = URL.createObjectURL(blob);
      els.pdfFrame.src = state.pdfUrl;
      els.pdfBox.hidden = false;
      els.pdfHelp.textContent = isWeChat() ? t("wechat-pdf") : "";
      setStatus(t("pdf-ready"));
      return blob;
    } catch (error) {
      setStatus(t("pdf-failed"), true);
      throw error;
    }
  }

  function triggerDownload(blob, filename) {
    const url = blob === state.pdfBlob ? state.pdfUrl : (blob === state.filmBlob ? state.filmUrl : URL.createObjectURL(blob));
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.rel = "noopener";
    document.body.append(link);
    link.click();
    link.remove();
  }

  async function shareBlob(blob, filename, title) {
    const file = new File([blob], filename, { type: blob.type });
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share({ files: [file], title });
      return true;
    }
    if (navigator.share) {
      const url = blob === state.pdfBlob ? state.pdfUrl : state.filmUrl;
      if (url) {
        await navigator.share({ title, url });
        return true;
      }
    }
    return false;
  }

  function officialPrintUnlocked() {
    return state.entitlement?.paid === true
      && state.entitlement.kind === "digital"
      && Boolean(state.entitlement.deliveryEmail);
  }

  function fillPrintRoot() {
    els.printRoot.replaceChildren();
    if (!officialPrintUnlocked()) return;
    state.pages.forEach((page, index) => {
      const image = document.createElement("img");
      image.src = page;
      image.alt = t("page-of", { current: index + 1, total: state.pages.length });
      els.printRoot.append(image);
    });
  }

  async function requestFilmFromServer() {
    const response = await fetch("/api/parent-book/film", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: bookTitle(),
        language: state.locale,
        secondsPerPage: 3,
        pages: state.pages.map((imageDataUrl) => ({ imageDataUrl }))
      })
    });
    if (!response.ok) throw new Error("film_failed");
    const blob = await response.blob();
    if (!blob.size || !(blob.type.includes("mp4") || blob.type.includes("octet-stream") || blob.type === "")) {
      if (blob.size < 1024) throw new Error("film_failed");
    }
    return new Blob([blob], { type: "video/mp4" });
  }

  function pickRecorderMime() {
    const candidates = [
      "video/mp4;codecs=avc1.42E01E,mp4a.40.2",
      "video/mp4;codecs=avc1",
      "video/mp4",
      "video/webm;codecs=vp8,opus",
      "video/webm"
    ];
    if (typeof MediaRecorder === "undefined" || typeof MediaRecorder.isTypeSupported !== "function") return "";
    return candidates.find((type) => MediaRecorder.isTypeSupported(type)) || "";
  }

  async function recordFilmClient() {
    if (typeof HTMLCanvasElement === "undefined" || !HTMLCanvasElement.prototype.captureStream) {
      throw new Error("film_unavailable");
    }
    const width = 1080;
    const height = 1530;
    const seconds = 3;
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d", { alpha: false });
    const images = [];
    for (const page of state.pages) images.push(await loadHtmlImage(page));

    const mime = pickRecorderMime();
    const stream = canvas.captureStream(30);
    const recorder = mime ? new MediaRecorder(stream, { mimeType: mime }) : new MediaRecorder(stream);
    const chunks = [];
    recorder.ondataavailable = (event) => {
      if (event.data && event.data.size) chunks.push(event.data);
    };
    const stopped = new Promise((resolve, reject) => {
      recorder.onstop = resolve;
      recorder.onerror = () => reject(new Error("film_failed"));
    });
    recorder.start();

    const start = performance.now();
    const total = images.length * seconds * 1000;
    await new Promise((resolve) => {
      const tick = (now) => {
        const elapsed = now - start;
        const index = Math.min(images.length - 1, Math.floor(elapsed / (seconds * 1000)));
        const image = images[index];
        context.fillStyle = "#f4efe6";
        context.fillRect(0, 0, width, height);
        const scale = Math.min(width / image.naturalWidth, height / image.naturalHeight);
        const dw = image.naturalWidth * scale;
        const dh = image.naturalHeight * scale;
        context.drawImage(image, (width - dw) / 2, (height - dh) / 2, dw, dh);
        if (elapsed >= total) resolve();
        else requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
    recorder.stop();
    await stopped;
    stream.getTracks().forEach((track) => track.stop());
    const type = recorder.mimeType || mime || "video/webm";
    return new Blob(chunks, { type });
  }

  function showFilm(blob) {
    state.filmBlob = blob;
    if (state.filmUrl) URL.revokeObjectURL(state.filmUrl);
    state.filmUrl = URL.createObjectURL(blob);
    const extension = /mp4/i.test(blob.type) ? "mp4" : "webm";
    state.filmName = suggestedPdfName().replace(/\.pdf$/i, `.${extension}`);
    els.filmPlayer.src = state.filmUrl;
    els.filmBox.hidden = false;
    els.filmHelp.textContent = isWeChat() ? t("wechat-film") : "";
  }

  async function makeFilm() {
    if (!state.pages.length || state.busy) return;
    state.busy = true;
    els.makeFilm.disabled = true;
    setStatus(t("film-working"));
    try {
      let blob;
      try {
        blob = await requestFilmFromServer();
      } catch (_error) {
        blob = await recordFilmClient();
      }
      showFilm(blob);
      setStatus(t("film-ready"));
    } catch (error) {
      setStatus(t("film-failed"), true);
    } finally {
      state.busy = false;
      els.makeFilm.disabled = false;
    }
  }

  function dataUrlToBytes(dataUrl) {
    const match = String(dataUrl || "").match(/^data:image\/(?:jpeg|jpg|png);base64,([a-zA-Z0-9+/=\s]+)$/i);
    if (!match) throw new Error("invalid_image");
    const binary = atob(match[1].replace(/\s+/g, ""));
    const bytes = new Uint8Array(binary.length);
    for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
    return bytes;
  }

  async function downloadPreviewPdf() {
    if (!state.pages.length) return setStatus(t("need-photos"), true);
    if (!window.PDFLib?.PDFDocument) return setStatus(t("preview-pdf-failed"), true);
    if (state.previewPages.length !== state.pages.length) return setStatus(t("preview-pdf-failed"), true);
    setStatus(t("preview-pdf-working"));
    try {
      const pdf = await window.PDFLib.PDFDocument.create();
      pdf.setTitle(bookTitle());
      pdf.setSubject("StoriesLens watermarked informal preview. Not an official paid PDF. 带标志的非正式预览");
      pdf.setCreator("StoriesLens Informal Preview");
      pdf.setKeywords(["preview", "watermark", "informal", "预览"]);
      for (const pageDataUrl of state.previewPages) {
        const bytes = dataUrlToBytes(pageDataUrl);
        const image = /^data:image\/png/i.test(pageDataUrl) ? await pdf.embedPng(bytes) : await pdf.embedJpg(bytes);
        addPrintPdfPage(pdf, image);
      }
      const bytes = await pdf.save();
      triggerDownload(new Blob([bytes], { type: "application/pdf" }), suggestedPdfName().replace(/\.pdf$/i, "-preview.pdf"));
      setStatus(t("preview-pdf-ready"));
    } catch (_error) {
      setStatus(t("preview-pdf-failed"), true);
    }
  }

  function syncAvatarUi() {
    const photoMode = state.avatar.mode === "photo";
    if (els.under18Row) els.under18Row.hidden = !photoMode;
    if (els.under18) els.under18.checked = state.avatar.under18 !== false;
    if (els.consentBox) els.consentBox.hidden = !(photoMode && state.avatar.under18 !== false);
    document.querySelectorAll("[data-avatar-mode]").forEach((input) => {
      input.checked = input.value === state.avatar.mode;
    });
    if (els.consentName && state.avatar.consent?.adultName && !els.consentName.value) {
      els.consentName.value = state.avatar.consent.adultName;
    }
  }

  async function illustrateCurrentAvatar() {
    if (!state.avatar.originalDataUrl) return;
    const pixels = await pixelsFromDataUrl(state.avatar.originalDataUrl);
    const art = prepareApi().illustrateAvatar(pixels.rgba, pixels.width, pixels.height);
    state.avatar.illustratedDataUrl = pngFromRgba(art, pixels.width, pixels.height);
  }

  function signatureHasInk(canvas) {
    const context = canvas.getContext("2d", { willReadFrequently: true });
    const data = context.getImageData(0, 0, canvas.width, canvas.height).data;
    let ink = 0;
    for (let index = 0; index < data.length; index += 16) {
      if (data[index] < 90 && data[index + 1] < 90 && data[index + 2] < 90 && data[index + 3] > 40) ink += 1;
    }
    return ink > 8;
  }

  function prepareSignaturePad(canvas) {
    const context = canvas.getContext("2d");
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.lineWidth = 4;
    context.lineCap = "round";
    context.strokeStyle = "#102824";
    let drawing = false;
    const point = (event) => {
      const rect = canvas.getBoundingClientRect();
      const source = event.touches ? event.touches[0] : event;
      return {
        x: (source.clientX - rect.left) * canvas.width / rect.width,
        y: (source.clientY - rect.top) * canvas.height / rect.height
      };
    };
    canvas.addEventListener("pointerdown", (event) => {
      drawing = true;
      const next = point(event);
      context.beginPath();
      context.moveTo(next.x, next.y);
      event.preventDefault();
    });
    canvas.addEventListener("pointermove", (event) => {
      if (!drawing) return;
      const next = point(event);
      context.lineTo(next.x, next.y);
      context.stroke();
      event.preventDefault();
    });
    const stop = () => { drawing = false; };
    canvas.addEventListener("pointerup", stop);
    canvas.addEventListener("pointerleave", stop);
  }

  if (els.signature) prepareSignaturePad(els.signature);

  els.album.addEventListener("change", (event) => {
    void addFiles(event.target.files);
    event.target.value = "";
  });
  els.camera.addEventListener("change", (event) => {
    void addFiles(event.target.files);
    event.target.value = "";
  });
  els.title.addEventListener("change", () => { saveMeta(); if (state.photos.length) void rebuildBook(); });
  els.childName.addEventListener("change", () => { saveMeta(); if (state.photos.length) void rebuildBook(); });
  els.authorName?.addEventListener("change", () => { saveMeta(); if (state.photos.length) void rebuildBook(); });
  els.authorIntro?.addEventListener("change", () => { saveMeta(); renderIntroTemplates(); if (state.photos.length) void rebuildBook(); });
  prepareApi().bindBookAssistant(els.bookAssistant, {
    photo: assistantPhoto,
    photoById: (id) => state.photos.find((photo) => photo.id === id) || null,
    text: shownPhotoText,
    illustrate: (photo) => prepareApi().requestBookIllustration(photo.scanDataUrl || photo.marksDataUrl || "", shownPhotoText(photo)),
    commit: commitAssistantPhoto,
    label: assistantLabel,
    shareLabel: (share) => t("assistant-share", { n: Math.round(Number(share) * 100) }),
    beforeLabel: () => t("assistant-before"),
    afterLabel: () => t("assistant-after"),
    emptyLabel: () => t("assistant-empty"),
    wordingNote: () => t("assistant-wording-note"),
    confirmNote: () => t("assistant-confirm-note"),
    pendingLabel: () => t("assistant-pending"),
    acceptedLabel: () => t("assistant-accepted"),
    dismissedLabel: () => t("assistant-dismissed"),
    unchangedLabel: () => t("assistant-unchanged"),
    workingLabel: () => t("assistant-working"),
    artFailedLabel: () => t("assistant-art-failed"),
    proofClearLabel: () => t("assistant-proof-clear"),
    proofDoneLabel: () => t("assistant-proof-done")
  });
  els.suggestAccept?.addEventListener("click", () => acceptSuggestion());
  els.suggestSkip?.addEventListener("click", () => skipSuggestion());
  els.suggestUndo?.addEventListener("click", () => undoSuggestion());
  els.readingAccept?.addEventListener("click", () => acceptReading());
  els.readingYu?.addEventListener("click", () => void askYuToReview());
  els.yuApply?.addEventListener("click", () => applyYuOffer());
  els.yuKeep?.addEventListener("click", () => keepOriginalAfterYu());
  els.buyDigital?.addEventListener("click", () => void startCheckout("family-digital"));
  els.buyPrint?.addEventListener("click", () => void startCheckout("print"));
  document.querySelectorAll("[data-cover-option]").forEach((input) => {
    input.addEventListener("change", () => syncCoverPrice());
  });
  els.sendBookEmail?.addEventListener("click", () => void sendPaidBookEmail());
  els.prev.addEventListener("click", () => {
    if (state.pageIndex > 0) {
      state.pageIndex -= 1;
      renderPreview();
    }
  });
  els.next.addEventListener("click", () => {
    if (state.pageIndex < state.pages.length - 1) {
      state.pageIndex += 1;
      renderPreview();
    }
  });
  els.downloadPdf?.addEventListener("click", async () => {
    if (!state.pages.length) return setStatus(t("need-photos"), true);
    const blob = await ensurePdf();
    triggerDownload(blob, suggestedPdfName());
  });
  els.printPdf?.addEventListener("click", async () => {
    if (!state.pages.length) return setStatus(t("need-photos"), true);
    const blob = await ensurePdf();
    triggerDownload(blob, suggestedPdfName().replace(/\.pdf$/i, "-print.pdf"));
  });
  els.openPdf?.addEventListener("click", async () => {
    const blob = await ensurePdf();
    const url = state.pdfUrl || URL.createObjectURL(blob);
    window.open(url, "_blank", "noopener");
  });
  els.sharePdf?.addEventListener("click", async () => {
    const blob = await ensurePdf();
    const shared = await shareBlob(blob, suggestedPdfName(), bookTitle()).catch(() => false);
    if (!shared) setStatus(t("share-unavailable"));
  });
  els.print?.addEventListener("click", () => {
    if (!state.pages.length) return setStatus(t("need-photos"), true);
    if (!officialPrintUnlocked()) return setStatus(t("pdf-failed"), true);
    fillPrintRoot();
    window.print();
  });
  window.addEventListener("beforeprint", () => {
    if (!officialPrintUnlocked()) {
      els.printRoot?.replaceChildren();
      return;
    }
    fillPrintRoot();
  });
  els.makeFilm.addEventListener("click", () => void makeFilm());
  els.downloadPreview?.addEventListener("click", () => void downloadPreviewPdf());
  els.scrollOfficial?.addEventListener("click", () => {
    document.getElementById("official-download")?.scrollIntoView({ behavior: "smooth", block: "center" });
  });
  els.followFilm?.addEventListener("click", () => { void makeFilm(); });
  els.followPrint?.addEventListener("click", () => {
    document.querySelector("[data-buy-print]")?.scrollIntoView({ behavior: "smooth", block: "center" });
  });
  document.querySelectorAll("[data-cover-style]").forEach((input) => {
    input.addEventListener("change", () => {
      if (!input.checked) return;
      state.coverStyle = input.value === "typographic" ? "typographic" : "rebuilt";
      saveMeta();
      if (state.photos.length) void rebuildBook();
    });
  });
  document.querySelectorAll("[data-interior-style]").forEach((input) => {
    input.addEventListener("change", () => {
      if (!input.checked) return;
      const kept = prepareApi().retainBookEdits({
        title: els.title.value,
        author: els.authorName?.value || "",
        coverId: state.coverId,
        coverStyle: state.coverStyle,
        photos: state.photos
      }, input.value);
      state.interiorStyle = kept.interiorStyle;
      state.coverStyle = kept.coverStyle;
      state.coverId = kept.coverId;
      state.photos.forEach((photo) => { photo.artSource = "style"; });
      saveMeta();
      if (state.photos.length) void rebuildBook();
    });
  });
  document.querySelectorAll("[data-avatar-mode]").forEach((input) => {
    input.addEventListener("change", () => {
      if (!input.checked) return;
      state.avatar.mode = input.value === "illustrated" ? "illustrated" : "photo";
      if (state.avatar.mode === "photo" && state.avatar.under18 !== false && !avatarDecision().allowed) setStatus(t("consent-needed"), true);
      const refresh = async () => {
        if (state.avatar.mode === "illustrated") await illustrateCurrentAvatar();
        syncAvatarUi();
        if (state.photos.length) await rebuildBook();
      };
      void refresh();
    });
  });
  els.avatarFile?.addEventListener("change", (event) => {
    const file = event.target.files && event.target.files[0];
    event.target.value = "";
    if (!file) return;
    void (async () => {
      if (inspectUpload(file).blocked) return setStatus(t("avatar-blocked"), true);
      try {
        state.avatar.originalDataUrl = await sanitizeToPng(file);
        state.avatar.illustratedDataUrl = "";
        if (!state.avatar.mode) state.avatar.mode = "photo";
        if (state.avatar.mode === "illustrated") await illustrateCurrentAvatar();
        syncAvatarUi();
        if (state.avatar.mode === "photo" && state.avatar.under18 !== false && !avatarDecision().allowed) setStatus(t("consent-needed"), true);
        if (state.photos.length) await rebuildBook();
      } catch (_error) {
        setStatus(t("unsupported"), true);
      }
    })();
  });
  els.under18?.addEventListener("change", () => {
    state.avatar.under18 = els.under18.checked;
    syncAvatarUi();
    if (state.avatar.under18 && state.avatar.mode === "photo" && !avatarDecision().allowed) setStatus(t("consent-needed"), true);
    if (state.photos.length) void rebuildBook();
  });
  els.signatureClear?.addEventListener("click", () => {
    if (!els.signature) return;
    const context = els.signature.getContext("2d");
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, els.signature.width, els.signature.height);
    state.avatar.consent = null;
    saveMeta();
    if (state.photos.length) void rebuildBook();
  });
  els.signatureSave?.addEventListener("click", () => {
    const adultName = els.consentName?.value.trim() || "";
    if (!adultName || !els.signature || !signatureHasInk(els.signature)) return setStatus(t("consent-missing"), true);
    state.avatar.consent = {
      adultName,
      ink: true,
      dataUrl: els.signature.toDataURL("image/png"),
      signedAt: new Date().toISOString(),
      statement: t("consent-copy")
    };
    saveMeta();
    setStatus(t("consent-saved"));
    if (state.photos.length) void rebuildBook();
  });
  els.saveFilm.addEventListener("click", () => {
    if (state.filmBlob) triggerDownload(state.filmBlob, state.filmName);
  });
  els.shareFilm.addEventListener("click", async () => {
    if (!state.filmBlob) return;
    const shared = await shareBlob(state.filmBlob, state.filmName, bookTitle()).catch(() => false);
    if (!shared) setStatus(t("share-unavailable"));
  });
  document.querySelectorAll("[data-locale]").forEach((button) => {
    button.addEventListener("click", () => applyLocale(button.dataset.locale));
  });

  loadMeta();
  syncAvatarUi();
  applyLocale(detectLocale());
  renderIntroTemplates();
  void refreshPricing();
})();

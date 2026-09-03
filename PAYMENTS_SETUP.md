# StoriesLens 收款上线手册

## 当前结论

首发采用 Stripe Payment Links，不在 StoriesLens 页面里处理银行卡信息。网站已经具备安全的跳转接口；在环境变量为空时，系统会明确提示“结账尚未接通”，不会假装成交或误收款。

首发只卖两个核心商品：

1. **Story Pass — $19，一次性**：孩子先免费写，家长看到成品预览后购买一个项目的完整制作与下载。
2. **Guided Story Squad — $49 席位订金**：订金抵扣 $129 总价。确定开班日期和最低人数后，再收剩余 $80。

Movie Pack 暂时保留为完成故事后的加购，不放在第一个结账决策里。

## 为什么先用 Payment Links

- 不需要先开发完整购物车或保存银行卡资料。
- Stripe 托管支付页面、收据和常见付款方式。
- 每个商品只有一个受控链接，当前服务器只允许跳转到 `buy.stripe.com` 或 `checkout.stripe.com`，避免开放重定向。
- 先验证真实付款，再决定是否开发账户、订阅、优惠券与自动授权。

## Stripe 中需要创建的商品

### 1. Story Pass

- 商品名：`StoriesLens Story Pass`
- 类型：一次性付款
- 价格：`USD 19`
- 描述：`One finished story project: full Story Coach, up to 5 invited collaborators, 12 visual scene generations, illustrated layout, and downloadable edition.`
- 收集：家长姓名、家长邮箱
- 不要收集：孩子真实姓名、生日、学校或其他不必要的儿童个人信息
- 成功页：正式域名上线后指向 `https://storieslens.com/payment-success.html?offer=story-pass`

### 2. Guided Story Squad deposit

- 商品名：`StoriesLens Guided Story Squad — Seat Deposit`
- 类型：一次性付款
- 价格：`USD 49`
- 描述：`Seat deposit applied to the $129 founding-cohort total. Remaining balance: $80 after the cohort date is confirmed.`
- 自定义字段（可选）：`Parent’s preferred session time`
- 成功页：`https://storieslens.com/payment-success.html?offer=guided-squad`
- 在实际启用前，把延期、最低开班人数及退款规则写进购买条款，并与页面承诺保持一致

## 把链接接入网站

将 Stripe 生成的 `https://buy.stripe.com/...` 链接写入部署环境变量：

```text
STRIPE_STORY_PASS_URL=https://buy.stripe.com/...
STRIPE_GUIDED_SQUAD_URL=https://buy.stripe.com/...
STRIPE_MOVIE_30_URL=https://buy.stripe.com/...
STRIPE_MOVIE_60_URL=https://buy.stripe.com/...
```

本地测试时，也可以复制 `.env.example` 为 `.env` 后填写。不要把密钥、后台登录信息或真实付款数据提交进 Git。

## 上线收款前的硬门槛

- 写清交付物、交付时间、退款条件、取消条件和联系方式。
- 由家长或法定监护人完成购买；儿童不输入付款资料。
- 用 Stripe 测试模式完整跑通一次：成功、取消、失败、退款、收据。
- 确认你可以人工履行前 10 个订单，再开放真实付款。
- 付款成功只代表 Stripe 已收款；后续自动解锁必须使用服务端 webhook 验签，不能只相信成功页 URL。

## 最小成交实验

不要以注册数或口头喜欢为成功。14 天内向 20 位符合目标的家长展示同一个完整流程：

`孩子免费写出第一幕 → 家长看到带署名的成品预览 → $19 一次性购买`

判断标准：

- **5 位及以上真实付款**：保持价格，再优化完成率与转介绍。
- **2–4 位真实付款**：只改一个变量，优先改成果展示或交付承诺，不立刻降价。
- **少于 2 位真实付款**：暂停新增功能，访谈拒付原因，确认问题在目标人群、成果价值还是信任。

口头“愿意买”、点击按钮和填写表单都不是收入。只有已到账且未退款的付款才算验证。

## 下一阶段，而不是现在

- 10–20 个真实家庭完成 Story Pass 后，再测试 `$12/月 Creator` 或 `$20/月 Family`。
- 有稳定复购后再建设登录账户、项目权益、webhook 自动解锁与订阅管理。
- 学校端用现有学校做独立实验，不把 CCSS、教师管理和家庭购买同时塞进 To C 首页。

本手册是产品与经营设计，不替代你所在地的法律、税务或儿童隐私合规意见。

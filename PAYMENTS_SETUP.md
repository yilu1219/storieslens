# StoriesLens 收款上线手册

## 当前结论

首发采用 Stripe 官方 Checkout Sessions API，不在 StoriesLens 页面里处理银行卡信息。网站服务器为每位已登录的成人账户创建独立订单和 Stripe Checkout Session；只有 Stripe 官方 webhook 通过原始请求签名验证，且账户、套餐、金额、币种和运行模式全部匹配后，才自动发放额度。成功页本身永远不能发额度。

首发将自助产品保持为按项目付费，不做无限量订阅：

1. **Story Pass — $19，一次性**：孩子先免费写，家长看到成品预览后购买一个项目的完整制作与下载。
2. **Invited Co-creation Pack — $39，一次性**：一本私密共创故事、最多5位受邀家人或朋友、18次插图生成。
3. **Teacher Classroom Project — $79，一次性**：一个班级出版项目，最多收录30份学生作品。
4. **Guided Story Squad — $49 席位订金**：订金抵扣 $129 总价。确定开班日期和最低人数后，再收剩余 $80。

Movie Pack 暂时保留为完成故事后的加购，不放在第一个结账决策里。

## 为什么使用官方 Checkout API

- StoriesLens 不接触或保存银行卡资料，Stripe 托管收款页面、收据和符合条件的付款方式。
- 每笔 Checkout Session 都绑定内部订单号、成人账户、地区、套餐和精确金额。
- `checkout.session.completed` 与延迟支付成功通知只有通过 `Stripe-Signature` 原始请求验签后才履约。
- Stripe 重复发送同一个 event 或用户反复刷新成功页，都不会重复加额度。
- 退款事件会标记到后台等待人工审核，不会静默删除已经使用的创作成果。

## Stripe 中需要创建的商品

### 1. Story Pass

- 商品名：`StoriesLens Story Pass`
- 类型：一次性付款
- 价格：`USD 19`
- 描述：`One finished story project: full Story Coach, 12 visual scene generations, illustrated layout, private library, and downloadable edition.`
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

### 3. Invited Co-creation Pack

- 商品名：`StoriesLens Invited Co-creation Pack`
- 类型：一次性付款
- 价格：`USD 39`
- 描述：`One private shared story project, up to 5 approved collaborators, 18 visual scene generations, creator credits, and revision history.`
- 成功页：`https://storieslens.com/payment-success.html?offer=cocreate-pack`

### 4. Teacher Classroom Project

- 商品名：`StoriesLens Teacher Classroom Project`
- 类型：一次性付款
- 价格：`USD 79`
- 描述：`One teacher-controlled publishing project for up to 30 student works, with a dated cover and digital class-book layout.`
- 成功页：`https://storieslens.com/payment-success.html?offer=teacher-classroom`

## 把官方 API 接入网站

在 Stripe Dashboard 的测试模式取得 Secret key，并创建 webhook endpoint：

`https://www.storieslens.com/api/stripe/webhook`

订阅至少以下事件：

- `checkout.session.completed`
- `checkout.session.async_payment_succeeded`
- `checkout.session.async_payment_failed`
- `checkout.session.expired`
- `charge.refunded`

然后把 Secret key 与 webhook signing secret 写入 Railway：

```text
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_LIVE_MODE=false
STRIPE_API_BASE_URL=https://api.stripe.com
```

先保持 `STRIPE_LIVE_MODE=false` 跑完测试卡、重复 webhook、延迟付款、失败、取消、退款和收据。正式开放时再同时切换到 `sk_live_...`、正式 webhook 的 `whsec_...`，并把 `STRIPE_LIVE_MODE=true`。不要把密钥、后台登录信息或真实付款数据提交进 Git。

## 上线收款前的硬门槛

- 写清交付物、交付时间、退款条件、取消条件和联系方式。
- 由家长或法定监护人完成购买；儿童不输入付款资料。
- 用 Stripe 测试模式完整跑通一次：成功、取消、失败、退款、收据。
- 确认你可以人工履行前 10 个订单，再开放真实付款。
- 确认 Railway 的持久化卷正常；订单、webhook 幂等记录、额度流水不能存入临时文件系统。

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

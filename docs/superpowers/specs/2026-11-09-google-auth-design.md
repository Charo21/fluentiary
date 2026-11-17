# Fluentiary Google 登录设计

日期：2026-11-09

## 已确认的目标

- 仅使用 Google 登录；首次成功登录时自动注册应用用户。
- 使用 JWT Session，通过框架管理的 HttpOnly Cookie 传输，不建 Session 表。
- User 不保存 image、emailVerified 或密码，不提供额外邮件验证流程。
- 新用户只看到自己的日记；每个用户每天最多一篇。
- 用户已明确允许删除现有无归属日记。
- 提供统一公共状态读取入口，包含当前 UTC 时间、登录状态和当前账户。

## 接入方式

沿用讨论中确定的 Auth.js / NextAuth，接入现有 Next.js 14 Pages Router，不切换路由框架。

备选方式：手写 Google OAuth/OIDC 与会话需要自行维护回调、CSRF 和令牌校验；托管认证服务引入额外账号体系。现有项目已使用 Prisma，采用 NextAuth 的 Google Provider、Prisma 持久化用户和账号关联最贴合现有代码。具体兼容版本在安装前核对。

## 数据模型

User：id（cuid 主键）、name（可空）、email（必填唯一）、createdAt、updatedAt；关联 Account[]、Record[]。

Account：id、userId 外键、type、provider、providerAccountId，以及 Adapter 所需的可空 OAuth 字段 access_token、refresh_token、expires_at、token_type、scope、id_token、session_state。provider + providerAccountId 唯一，并为 userId 建索引。Google 凭据不返回浏览器。

Record：保留既有业务字段，新增必填 userId 外键；删除 date 的全局唯一约束，新增 userId + date 复合唯一约束。历史无归属 Record 在迁移中删除，之后强制用户关联。User 删除策略使用 Restrict 保留日记，Account 关联可级联删除。

不建 Session、VerificationToken 表。Adapter 显式读写精简 User 字段，过滤 image、emailVerified；按认证库所需返回兼容的运行时用户对象，避免未知字段写入 Prisma。身份关联使用 Google providerAccountId，不按前端传入邮箱自动合并账号。缺失邮箱或账号信息时拒绝注册。

## 认证流程与界面

- /login 显示 Google 登录按钮，沿用现有英文界面与样式；支持登录失败提示和重试，不在页面暴露服务端错误细节。
- 已登录用户访问 /login 返回日历。
- 日历和日记页面通过服务端会话检查；未登录跳转 /login，保存站内返回路径，登录后回到原页面。拒绝外站返回地址。
- 已登录页面显示用户名称或邮箱及退出按钮。退出后回到登录页，清理客户端日记界面。
- JWT 写入内部 User.id，session 回调仅公开必要的用户字段。会话有效期采用明确配置的 30 天。
- API 日记读取、保存、日期列表及润色都在服务端验证会话，未登录返回 401；日记接口只使用会话 userId。
- 按日期 upsert 和日期列表均限定 userId。忽略请求中试图指定其他用户的 userId。
- 保留 cron keepalive 的现有 CRON_SECRET 机制，不使定时任务依赖用户 Cookie。

## 现有编辑逻辑的配合

登录失效时，界面返回登录页并停止待执行保存。编辑器必须在当前用户的记录加载成功后才启用自动保存；切换日期时清理旧表单状态并取消过期加载结果，避免旧用户或旧日期的数据进入新记录。保留自动保存延迟和既有润色行为。

## 公共状态管理（新增需求）

提供 CommonStatusProvider 与 useCommonStatus()，挂载在 _app.tsx 的 SessionProvider 内。使用 React Context + Hook，无需新增状态库。

对外接口：

```ts
type CommonStatus = {
  utcNow: string | null // ISO 8601 UTC，例如 2026-11-10T03:04:05.000Z
  utcDate: string | null // 从 utcNow 派生的 YYYY-MM-DD
} & (
  | { authStatus: 'loading'; account: null }
  | { authStatus: 'unauthenticated'; account: null }
  | {
      authStatus: 'authenticated'
      account: { id: string; name: string | null; email: string }
    }
)
```

- UTC 时间在客户端挂载后初始化，每秒重新读取 Date.now()，不通过累加秒数计时。标签页恢复可见时立即刷新，卸载清理定时器与事件监听。
- 服务端渲染与客户端首次渲染的 utcNow、utcDate 均为 null，组件显示占位，避免时间变化造成 hydration 不一致。
- 账户和 authStatus 从 useSession 派生，不复制到另一份可写状态，不暴露 setAccount，不持久化至 localStorage。
- 内部将账户状态和时钟 Context 分开，额外提供 useCurrentAccount()、useUtcClock()；账户操作组件不订阅每秒变化的时钟。useCommonStatus() 组合两者，供确实需要两项数据的组件使用。
- 登录、退出、会话重新获取或失效后，账户信息随 Session 更新。Session 返回不完整账户字段时，不向业务代码暴露 authenticated 账户。
- 公共状态仅供客户端展示；服务端接口继续独立验证 Session。utcNow 基于设备时钟，用于展示而非服务器校时或安全校验。本次不额外改变日历的日期时区语义。
- 备选方案为 Zustand 等额外状态库；当前只有 Session 派生状态和时钟，React Context 已足够。未来新增复杂跨页面业务状态时再评估。

新增 src/common/status/，包含 Provider、Hooks、types 与相邻测试。测试覆盖：首次渲染空时间、UTC 格式、跨 UTC 午夜 utcDate 更新、标签页恢复、定时器清理，以及 loading / authenticated / unauthenticated 的账户数据。

## 目录与文件范围

- 新增 src/common/status/：公共状态 Provider、Hooks、类型及测试。
- 新增 src/features/auth/：认证配置、Adapter、服务端会话辅助函数、登录界面/账号操作、类型声明及测试。
- 新增 src/pages/api/auth/[...nextauth].ts、src/pages/login.tsx。
- 更新 src/pages/_app.tsx、日历/日记路由以接入 Provider 与服务端保护。
- 更新 features/records、features/calendar、features/refinement 的会话处理、查询条件和测试。
- 更新 prisma/schema.prisma 并新增 SQL migration。
- 新增 .env.example，更新 README 的 Google Console、数据库迁移和验证说明。
- 保留此前目录重构和用户原有文档删除，不加入其他功能。

## 配置与迁移

环境变量：GOOGLE_CLIENT_ID、GOOGLE_CLIENT_SECRET、NEXTAUTH_SECRET、NEXTAUTH_URL，以及现有 DATABASE_URL。

本地 Google 回调：http://localhost:3000/api/auth/callback/google。部署环境使用对应 HTTPS 域名。Google Console 中配置 Web application OAuth Client；测试状态下需要登记测试用户。

提供 migration 和部署步骤。现有 npm run build 会执行 prisma db push --accept-data-loss，应改为仅 prisma generate 与 next build，将数据库变更通过明确的 prisma migrate deploy 执行，避免构建时自动改表。

实现期间不索取或输出 Secret。若环境尚未配置 Google OAuth，测试使用 mock 验证认证路径，实际浏览器端 Google 回调列为待配置后验证项。

## 验证标准

- Prisma schema 校验、生成客户端、TypeScript、ESLint、Next.js 生产构建。
- 单元测试覆盖：自动注册/重复登录、精简 User 写入、JWT 内部用户 ID、未登录 API 401、用户之间的日期列表/读取/保存隔离、相同日期允许不同用户各写一篇、伪造 userId 无效。
- 页面测试覆盖：登录按钮、退出、会话加载/失效、原页面返回与外站地址拒绝、原有日历和日记功能。
- 自动保存测试覆盖：加载完成前不保存、切换日期不写入旧内容、会话失效后不保存。
- 数据库集成验证仅在隔离测试库执行；不得复用会清空非测试数据库的测试流程。
- 现有真实 Gemini 网络测试与 Google OAuth 人工联调分别报告，不把 mock 测试称为真实第三方登录通过。

## 执行边界

本设计审批仅确认上述行为和实现范围，不要求提交、推送或部署。实际数据库 migration 是否已应用、Google 凭据是否已配置及人工登录是否通过，完成报告中分别说明。

## 用户后续变更：本地时间

公共状态改为浏览器本地时区的 localNow（带时区偏移的 ISO 时间）、localDate 与 useLocalClock()。不再导出 UTC 名称。日记当天可编辑判断采用本地日期，与日历保持一致；数据库 DATE 字段仍按日期字符串处理。

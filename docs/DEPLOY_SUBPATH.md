# 在现有主站下发布 MD Atlas

目标地址：**https://reiinoki.dpdns.org/md-atlas/**。
`https://reiinoki.dpdns.org/` 和其他路径仍由原网站提供；不要把整个域名改绑到 MD Atlas。

若已部署旧拼写版本，先阅读[项目改名指南](RENAME_PROJECT.md)，完成仓库和 Worker 构建连接的安全切换。
本文描述正确名称的目标配置，不表示外部资源已随本地文件自动改名。

## 发布结构

`site.config.js` 定义基础路径 `/md-atlas/`。Vite 仍构建到 `dist/`，用于普通本地预览；
随后 `scripts/prepare-workers-assets.mjs` 只复制构建输出，生成 Cloudflare 的独立静态发布包：

```text
.wrangler/assets/
  _headers
  index.html                 # SPA 回退入口，引用 /md-atlas/ 下的资源
  md-atlas/
    index.html
    favicon.svg
    city-name-credits.html
    assets/
    data/
```

`wrangler.jsonc` 的 `assets.directory` 指向 `./.wrangler/assets`。
目录结构与请求路径一致，不需要 Worker 后端脚本、ASSETS 绑定、反向代理或数据库。
根部的 `index.html` 是 Cloudflare 固定的 SPA 回退入口，并可供 `workers.dev` 预览使用；
它不会替换原主站，因为域名根路径不在这个 Worker 的路由范围内。

构建不会改写 `public/data/` 或维护工具的数据；两个输出目录均不提交 Git。
打包只重建 `.wrangler/assets/`，保留其他 `.wrangler/` 本地状态。
若构建失败，不要跳过构建步骤直接部署旧的或未完成的输出；构建与预览验收请顺序进行。

## 上线前确认

1. DNS zone 与 `md-atlas` Worker 位于同一个 Cloudflare 账户，zone 已激活。
2. 配置中的 zone 名称为 `reiinoki.dpdns.org`；若控制台显示不同，请先核对实际 zone，不要猜测 ID。
3. **保留主站当前 A / AAAA / CNAME 的目标值，以及所有邮箱记录。**
   Workers Routes 要求对应 DNS 记录已启用 Cloudflare 代理（橙云）。仅将 DNS 托管在 Cloudflare 并不等于已代理。
   若当前是灰云，先评估原主站的 HTTPS、托管平台和代理兼容性，再决定是否切换；不要盲目修改 SSL 模式。
4. 查看原主站和 `md-atlas` 现有的 Workers Routes / Custom Domains，记录截图，确认下面两个路径没有需要保留的其他用途。
5. **不要新增 `reiinoki.dpdns.org` 的 Custom Domain 绑定给 `md-atlas`；不要设置 `reiinoki.dpdns.org/*`。**
   原主站已有的整站路由或自定义域名绑定应保留。更具体的子路径路由优先匹配。

子路径和主站共享同源的 Cookie / localStorage 等，不是安全隔离边界。
当前语言偏好沿用 `mission-day-language` 键；不要让其他应用复用该键。

## 1. 发布新代码和窄路由

Cloudflare Workers Builds 设置：

| 设置 | 值 |
| --- | --- |
| Worker 名称 | `md-atlas` |
| 分支 | `main` |
| 仓库根目录 | 留空 |
| 构建命令 | `npm run check` |
| 部署命令 | `npx wrangler deploy --no-autoconfig` |
| 构建环境变量 | `NODE_VERSION=22` |

本次配置明确包含这两条 **Route**，没有 `custom_domain: true`：

```text
reiinoki.dpdns.org/md-atlas
reiinoki.dpdns.org/md-atlas/*
```

**提交并推送该配置可能立即触发实际部署和路由更新**，因此先完成上面的核对。
Wrangler 根据配置管理路由；不要一边在 Git 配置中使用这两个范围，一边在控制台加入更宽的范围。

若需要在控制台核对或添加：
**Workers 和 Pages → md-atlas → Settings → Domains & Routes → Add → Route**，选择正确的 zone。
不要选择 Custom Domain，也不要修改主站 DNS 的目标。

构建所用的 Cloudflare 凭据需要有目标 zone 的读取及 Workers Routes 编辑权限。
如果部署报路由权限错误，请检查 Workers Builds 的 Cloudflare 构建凭据，不要修改 GitHub PAT，
更不要把任何令牌写入仓库或部署命令。

## 2. 仅给入口补斜杠

Cloudflare Route 会匹配包含查询字符串的完整 URL。精确路由 `/md-atlas` 可以覆盖无查询字符串的入口，
但 `/md-atlas?from=bookmark` 不匹配它；已有斜杠的 `/md-atlas/?from=bookmark` 则匹配 `/md-atlas/*`。

**不要改成 `/md-atlas*`**：它还会匹配 `/md-atlas-other`、`/md-atlas2` 等主站路径。
正确补充方式是在这个 zone 的 **Rules → Overview → Create rule → Redirect Rule** 中创建一条精确规则。
规则可先保存为草稿，待子路径部署成功后再启用：

- 名称：`MD Atlas trailing slash`
- 匹配方式：Custom filter expression（自定义筛选表达式）
- 表达式：

```text
(http.host eq "reiinoki.dpdns.org" and http.request.uri.path eq "/md-atlas")
```

- 跳转类型：Static（静态）
- 目标：`https://reiinoki.dpdns.org/md-atlas/`
- 状态码：初次验证可用 `302`；确认后可改为 `308`
- **Preserve query string：开启**

这条规则只处理不带末尾斜杠的入口，不会循环匹配目标地址，也不改变其他路径。
它属于 zone Redirect Rule，**不在 `wrangler.jsonc` 中管理**；需要在控制台单独配置。
不要选择“All incoming requests”，不要创建整个域名的跳转。

## 3. 验收与回退

先检查 Workers 默认预览地址的 `/md-atlas/`，再检查正式域名：

- `/md-atlas/`：四视图、地图 Worker、语言切换、详情、窄屏布局。
- `/md-atlas/data/archive.json`：返回 JSON，而不是 SPA HTML。
- `/md-atlas/city-name-credits.html`：规范化跳转留在 `/md-atlas/` 内，返回链接仍指向 MD Atlas。
- `/md-atlas`、`/md-atlas?from=test`：跳转到带斜杠的入口，保留查询参数。
- `/`、原主站常用页面和静态资源：仍是原网站；同时检查其他现有子路径应用。

本地 Wrangler 预览接受整个 localhost 的请求，不能证明线上 DNS、路由优先级或 Redirect Rule 已生效。
不要把本地根路径显示 MD Atlas 误认为正式域名根路径会被替换。

需要回退时，只撤销本次新增的两条 MD Atlas 路由及这条精确重定向，并同步撤销 Git 中的路由配置，
避免下次推送重新建立它们。**不要删除主站 DNS、原主站 Worker 或其他规则。**

## 本地校验

```bash
npm run check                 # 单元测试、Vite 构建、静态发布包生成
npm run test:workers          # 本地 Workers HTTP / MIME / 缓存 / 重定向 / SPA
npm run deploy:check          # 不上传的部署校验
npm run test:browser          # Vite 生产预览
npm run test:browser:dev      # Vite 开发服务器
npm run test:browser:workers  # Workers 本地预览中的实际浏览器回归
```

浏览器测试只启动和关闭自身的临时浏览器、服务；地图使用受控瓦片，不能代替正式域名的真实网络验收。
单元测试固定检查路由白名单及不应匹配的主站路径，但不会修改或模拟完整 Cloudflare zone。

## 官方参考

- [Workers Routes：前置条件、优先级和查询字符串匹配](https://developers.cloudflare.com/workers/configuration/routing/routes/)
- [Static Assets：按子目录提供资源](https://developers.cloudflare.com/workers/static-assets/routing/advanced/serving-a-subdirectory/)
- [SPA 回退入口](https://developers.cloudflare.com/workers/static-assets/routing/single-page-application/)
- [创建 Redirect Rule](https://developers.cloudflare.com/rules/url-forwarding/single-redirects/create-dashboard/)
- [Vite Public Base Path](https://vite.dev/guide/build.html#public-base-path)

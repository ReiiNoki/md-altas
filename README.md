# MD Atlas

**Ingress Mission Day Archive** — 用地图、档案、日历和统计视图浏览 Mission Day 活动与任务。

[![CI](https://github.com/ReiiNoki/md-altas/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/ReiiNoki/md-altas/actions/workflows/ci.yml)

MD Atlas 是一个独立的 React 单页应用，读取仓库随附的静态 JSON 档案，无需单独的应用后端或数据库。
界面支持中文和英文，适配桌面及窄屏设备。

## 功能

- **地图**：浏览活动分布，通过标记和弹窗查看活动，联动活动详情。
- **档案**：搜索城市、国家或地区、任务标题，组合筛选并浏览任务信息。
- **日历**：按日期查看活动安排，快速打开对应活动。
- **统计**：查看活动、任务、地域分布及相关排行。
- **双语地名**：中文界面使用已核对的译名，英文保留原名；未收录的地名回退原文。
- **兼容降级**：地图需要 WebGL2；不支持时显示提示，档案、日历和统计仍可使用。

## 技术栈

- React 19、JavaScript / JSX
- Vite 6
- MapLibre GL JS 6、OpenFreeMap
- CSS、Lucide 图标与自托管字体资源
- ESLint、Node.js 内置测试、可选 Chromium 浏览器检查

## 快速开始

需要 **Node.js 22+** 和 npm。以下命令在克隆后的仓库目录内执行：

```bash
git clone https://github.com/ReiiNoki/md-altas.git
cd md-altas
npm ci
npm run dev
```

打开终端显示的本地地址，当前入口为 `/md-altas/`。端口被占用时，Vite 会选择下一个可用端口。

### 常用命令

| 命令 | 用途 |
| --- | --- |
| `npm run dev` | 启动开发服务器 |
| `npm run lint` | 检查应用、配置和测试代码 |
| `npm test` | 运行 JavaScript 测试 |
| `npm run build` | 构建到 `dist/`，再生成 `.wrangler/assets/` 静态发布包 |
| `npm run check` | 依次执行代码检查、测试和构建 |
| `npm run test:workers` | 检查已有发布包的 Workers 本地 HTTP 行为 |
| `npm run preview` | 用 Vite 本地预览已有的生产构建 |
| `npm run preview:cloudflare` | 用 Workers 本地运行时预览已有构建，不连接远程绑定 |
| `npm run deploy:check` | 校验 Workers 配置和已有构建，不上传或部署 |

生产构建预览：

```bash
npm run build
npm run preview
```

`preview` 用于 Vite 本地验收；Cloudflare 部署 `.wrangler/assets/` 中按子路径组织的静态文件。
两者来自同一次构建，不依赖维护工具或真实数据重生成。

## 项目结构

```text
src/
  components/       页面与交互组件
  data/             地图样式、中文地名词典
  i18n/             界面文案与格式化
  styles/           布局、组件和各视图样式
  utils/            档案处理、筛选与地名显示
public/
  data/             随网站发布的 JSON 档案
  city-name-credits.html
  _headers          静态资源缓存与安全响应头
scripts/            静态发布包生成、Workers HTTP 与可选浏览器回归检查
tests-js/           JavaScript 测试
docs/data/          地名来源、核对规则与许可
docs/DEPLOY_SUBPATH.md  保留现有主站的子路径部署指南
.github/workflows/  持续集成
site.config.js      共享基础路径与发布目录
wrangler.jsonc      Workers 静态资源与窄路由配置
```

## 数据与外部资源

应用使用以下静态资源，安装和构建不会重新生成它们：

- `public/data/archive.json`：活动摘要与任务标题搜索索引。
- `public/data/events/*.json`：按需加载的活动和任务详情。
- `public/data/analytics.json`：统计视图数据。

这些文件需要随源码保留。页面展示的是档案快照，不代表实时活动状态。
地图瓦片与 Banner 图片仍来自第三方服务，加载情况取决于相应服务和用户网络。

`public/` 的全部内容都会进入部署产物，不能放入凭据或私密资料。
地名本地化仅影响显示和搜索，不修改原始活动名称、坐标或地理分类；
具体规则见 [地名显示与来源](docs/data/CITY_NAMES.md)。

## 浏览器检查

安装 Chrome / Chromium 后可运行，或用 `CHROME_PATH` 指定浏览器可执行文件：

```bash
npm run test:browser      # 构建并检查生产版本
npm run test:browser:dev  # 检查开发版本
npm run test:browser:workers  # 构建并检查 Workers 本地版本
```

检查覆盖地图 Worker、实际绘制的双语标签、快速语言切换、弹窗、活动详情、四视图、
窄屏布局和 WebGL2 降级。

测试使用独立临时浏览器配置和端口，日志及截图保存在系统临时目录。
地图使用可控双语瓦片，图片请求被阻断，因此不能替代真实网络和实体设备验收。

## 部署到 Cloudflare Workers

使用 **Workers Static Assets + Git 自动部署**，目标地址为 **https://reiinoki.dpdns.org/md-altas/**。
这是纯静态前端：不需要 Worker 后端脚本、数据库、运行时绑定或 Cloudflare Vite 插件。
Wrangler 作为开发依赖固定版本，安装依赖后即可使用。

**保留域名根部的现有网站，只添加窄 Route，不要把整个域名绑定给本 Worker。**
配置中包含路由，推送可能触发线上路由更新；部署前请按[子路径部署指南](docs/DEPLOY_SUBPATH.md)
核对同账户 zone、橙云代理、原站路由，以及仅给 `/md-altas` 补斜杠的 Redirect Rule。

在 Cloudflare 的 **Workers 和 Pages** 页面创建应用，连接 GitHub 仓库 `ReiiNoki/md-altas`，
按 Workers 的构建和部署流程填写：

| 设置 | 值 |
| --- | --- |
| Worker 名称 | `md-altas`，与 `wrangler.jsonc` 的 `name` 一致 |
| 生产分支 | `main` |
| 项目根目录 | **留空，使用仓库根目录** |
| 构建命令 | `npm run check` |
| 部署命令 | `npx wrangler deploy --no-autoconfig` |
| 非生产分支部署命令（若启用） | `npx wrangler versions upload` |
| 构建环境变量 | `NODE_VERSION=22` |

部署前须将 `wrangler.jsonc`、`package.json` 和锁文件提交推送，并确认构建使用新提交。
`--no-autoconfig` 与本地部署校验保持一致，明确使用已有静态资源配置，避免自动分析或改造 Vite 项目。
仅重试不含配置的旧提交，不能解决 `Error parsing file: .../vite.config.js` 错误。

如果已经在控制台使用其他 Worker 名称，请同步修改 `wrangler.jsonc` 的 `name`，不要保留不一致的名称。
通过 GitHub 应用授权仓库即可，不要把 GitHub PAT 或 Cloudflare 密钥写入命令或提交到仓库。

此流程没有 Pages 的“框架预设”和“输出目录”字段。`wrangler.jsonc` 显式指定：

- `assets.directory: "./.wrangler/assets"`：只发布生成的静态包；资源位于包内 `md-altas/`，不能改为整个仓库、整个 `.wrangler/` 或直接发布 `public/`。
- `assets.not_found_handling: "single-page-application"`：通过包根部的 `index.html` 提供 SPA 回退。
- `routes`：仅匹配 `reiinoki.dpdns.org/md-altas` 和 `reiinoki.dpdns.org/md-altas/*`，不匹配主站根部。
- `workers_dev: true`：保留默认预览域名，可访问其 `/md-altas/`。
- `compatibility_date`：固定运行时兼容行为，后续更新时需重新验证。

Cloudflare 会安装依赖，然后构建、部署。`npm run build` 只构建；`npm run check` 在构建前先运行
ESLint 和 JavaScript 测试，失败时中止。`check` 不包含浏览器测试，不会抓取或重生成数据。

`public/_headers` 会复制到静态发布包根部，缓存规则已适配 `/md-altas/` 前缀。
部署完成后先通过控制台返回的 `*.workers.dev/md-altas/` 地址验收，再检查正式域名子路径及原主站。
不应通过添加整个域名的 Custom Domain 来替代路径路由。
本地验证不能代替线上 DNS、路径规则、第三方地图与图片网络的验收。

### 本地部署校验

以下命令不需要 Cloudflare 登录，也不会发布网站：

```bash
npm run check
npm run test:workers
npm run deploy:check
```

如需检查 Workers 的本地静态资源路由及响应头，在构建后运行：

```bash
npm run preview:cloudflare
```

打开终端显示的本地地址，结束时按 Ctrl+C。端口冲突时可加 `-- --port 8788`，不要停止其他项目。
本地缓存 `.wrangler/` 和本地变量文件 `.dev.vars*` 不参与版本控制。

GitHub Actions 运行检查、构建、Workers 本地 HTTP 测试及部署 dry-run，**不会上传到 Cloudflare，也不需要部署密钥**。
Workers Builds 才负责实际发布；它不会默认等待 GitHub CI，因此构建命令仍采用 `npm run check`。
后续推送 `main` 会触发生产部署，其他分支仅在启用相应构建后生成预览版本。

其他静态托管平台可将 `dist/` 挂载到 `/md-altas/`，并按对应平台配置 SPA 回退、缓存和安全响应头；
发布到其他路径时需同步修改 `site.config.js` 和相应路径配置后重新构建。

[Workers Builds 配置](https://developers.cloudflare.com/workers/ci-cd/builds/configuration/) ·
[Workers SPA 静态资源配置](https://developers.cloudflare.com/workers/static-assets/routing/single-page-application/)

## 许可与署名

- 项目代码采用 [MIT License](LICENSE)。
- 中文地名词典及其来源清单按 **CC BY-SA 4.0** 提供，来源包括 GeoNames 和 Wikipedia；详见 [来源说明](docs/data/CITY_NAMES.md) 与网站的[地名署名页面](public/city-name-credits.html)。
- 地图、活动、任务及图片内容保留各自的权利与署名，项目代码许可不重新许可这些第三方内容。

MD Atlas 是非官方社区项目，与 Niantic 或 Ingress 官方没有隶属关系。

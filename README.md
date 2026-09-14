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

打开终端显示的本地地址。端口被占用时，Vite 会选择下一个可用端口。

### 常用命令

| 命令 | 用途 |
| --- | --- |
| `npm run dev` | 启动开发服务器 |
| `npm run lint` | 检查应用、配置和测试代码 |
| `npm test` | 运行 JavaScript 测试 |
| `npm run build` | 构建到 `dist/` |
| `npm run check` | 依次执行代码检查、测试和构建 |
| `npm run preview` | 本地预览已有的生产构建 |

生产构建预览：

```bash
npm run build
npm run preview
```

`preview` 用于本地验收，线上只需托管 `dist/` 中的静态文件。

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
scripts/            可选浏览器回归检查
tests-js/           JavaScript 测试
docs/data/          地名来源、核对规则与许可
.github/workflows/  持续集成
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
```

检查覆盖地图 Worker、实际绘制的双语标签、快速语言切换、弹窗、活动详情、四视图、
窄屏布局和 WebGL2 降级。

测试使用独立临时浏览器配置和端口，日志及截图保存在系统临时目录。
地图使用可控双语瓦片，图片请求被阻断，因此不能替代真实网络和实体设备验收。

## 部署到 Cloudflare Pages

在 Cloudflare 创建 **Pages** 项目，连接本 GitHub 仓库：

| 设置 | 值 |
| --- | --- |
| 生产分支 | `main` |
| 框架预设 | React（Vite） |
| 项目根目录 | **留空，使用仓库根目录** |
| 构建命令 | `npm run check` |
| 输出目录 | `dist` |
| 环境变量 | `NODE_VERSION=22` |

Cloudflare 会安装依赖并运行上述命令。`check` 已包含构建，检查或测试失败时不会发布。
`public/_headers` 会随构建复制，用于 Pages 的缓存与安全响应头。
先通过 `*.pages.dev` 地址验收，再在项目的 Custom domains 中绑定域名。

后续推送到 `main` 会触发自动部署。GitHub Actions 只负责检查和构建，不是 Cloudflare 部署脚本；
Pages 不会默认等待 GitHub CI 结束，因此这里也在部署前执行 `npm run check`。

其他静态托管平台同样可以部署 `dist/`，但需按对应平台配置缓存和安全响应头。

[Cloudflare Pages Git 接入指南](https://developers.cloudflare.com/pages/get-started/git-integration/)

## 许可与署名

- 项目代码采用 [MIT License](LICENSE)。
- 中文地名词典及其来源清单按 **CC BY-SA 4.0** 提供，来源包括 GeoNames 和 Wikipedia；详见 [来源说明](docs/data/CITY_NAMES.md) 与网站的[地名署名页面](public/city-name-credits.html)。
- 地图、活动、任务及图片内容保留各自的权利与署名，项目代码许可不重新许可这些第三方内容。

MD Atlas 是非官方社区项目，与 Niantic 或 Ingress 官方没有隶属关系。

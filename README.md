# MD Atlas

Ingress Mission Day Archive · Ingress Mission Day 活动档案

项目在同一个工作目录内分为两部分：

- **`frontend/`**：独立的 React / Vite / MapLibre 静态网站，包含已生成的发布数据。
- **`data-tools/`**：本地抓取、合并、校验和数据发布工具，保留原始数据，不纳入网站仓库。

本地历史设计资料保留在根目录 `docs/`，不参与网站运行或提交。
克隆网站仓库不需要也不会获得本地维护目录；只需要 Node.js 22+ 即可构建。

## 启动网站

在本项目根目录执行：

```bash
npm --prefix frontend ci
npm --prefix frontend run dev
```

检查与生产构建：

```bash
npm --prefix frontend run check
npm --prefix frontend run preview
```

完整说明见 [前端 README](frontend/README.md)。根目录不再有 `package.json`；
也可以先 `cd frontend`，再使用通常的 npm 命令。

## 提交与数据边界

提交 `frontend/`、`.github/`、根 README 和 `.gitignore`。
**`frontend/public/data/`、`frontend/src/data/`、`frontend/docs/data/` 必须保留在 Git 中。**

不提交 `data-tools/`、根 `docs/`、依赖、构建产物、缓存或凭据。
本地维护资料不再由网站仓库备份，需要另行保留本地备份。
前端 `public/` 中的所有内容部署后都会公开，即使 GitHub 仓库是私有的。

数据只从工具侧单向同步到网站：

```text
本地原始数据 → 合并/校验 → 工具侧输出 → 人工确认并显式同步 → frontend/public/data/
```

本地维护目录存在时，在 `data-tools/README.md` 中查看操作说明。
前端构建和 GitHub CI 不抓取、不合并、不生成业务数据，不需要 Python。

注意：忽略目录或在新提交中移除文件不会清除旧 Git 历史。
如需远端历史也不包含维护工具，必须在首次推送前另外确认并处理；不要直接推送未经检查的旧历史。

## Cloudflare Pages

| 设置 | 值 |
| --- | --- |
| 项目根目录 | `frontend` |
| 构建命令 | `npm run build` |
| 输出目录 | `dist` |
| 环境变量 | `NODE_VERSION=22` |

`.github/workflows/ci.yml` 只安装前端依赖、执行前端测试和构建。
Pages 的 Git 自动部署与 GitHub CI 是独立流程，不会默认等待 GitHub 检查通过。
先验收 Pages 测试地址，再绑定自定义域名；详细步骤见 [前端部署说明](frontend/README.md#cloudflare-pages)。

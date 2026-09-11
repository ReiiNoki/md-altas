# MD Atlas 前端

Ingress Mission Day Archive · 地图、档案、日历与数据统计。

这是一个可以独立检出、安装和部署的 React / Vite 静态网站，只读取自身的 `public/data/`。
不需要 Python、原始抓取数据或旁边的 `data-tools/`。

## 本地开发

需要 Node.js 22+。以下命令在 `frontend/` 内执行：

```bash
npm ci
npm run dev
```

地图使用 MapLibre 6，需要 WebGL2；不支持时会显示提示，其他视图仍可使用。
端口被占用时，Vite 会选择下一空闲端口，以终端输出为准。

```bash
npm run check         # ESLint、JS 测试、生产构建
npm run build
npm run preview
```

生产产物在 `dist/`，不提交 Git。`public/` 中所有文件都会作为公开资源发布，不能放入凭据或私密资料。

## 发布数据

以下数据必须随源码提交，普通构建不会重新生成它们：

```text
public/data/archive.json       # 活动摘要、Mission 标题搜索索引
public/data/events/*.json      # 按活动延迟加载的详情
public/data/analytics.json     # Data 视图延迟加载的统计数据
```

维护工具在本地单独生成并校验数据，人工确认后显式同步到这里。
前端没有抓取、合并或发布数据命令，云端 CI 也不运行维护工具。

## 代码与地名

入口 `src/App.jsx` 管理状态、请求和视图协调；组件与统计面板位于 `src/components/`。
国际化 Provider 位于 `src/i18n.jsx`，消息和格式化函数位于 `src/i18n/`。

地名随界面语言切换。国家或地区名称使用 `Intl.DisplayNames` 与项目约定覆写；
城市名称使用 `src/data/cityNames.zh.js` 的离线词典。英文保留原名，未核实的地名回退原文。
中文、原名和收录的异译都能搜索。底图使用 OpenFreeMap 的中文/英文字段，语言切换不重建地图。
文字图层使用独立的矢量数据源，切换语言只重排文字，不重新计算道路、建筑等底图几何。
MapLibre 6 在浏览器本地生成字形，不等待外部字形下载；标签关闭渐变以及时显示新语言。
字形使用可用的 Noto 字体或系统 sans-serif 回退，因此不同操作系统的字体外观可能略有差异。
词典来源和许可见 [docs/data/CITY_NAMES.md](docs/data/CITY_NAMES.md)，网站页脚保留来源入口。

## 可选浏览器检查

需要 Chrome/Chromium（可用 `CHROME_PATH` 指定可执行文件）：

```bash
npm run test:browser
npm run test:browser:dev
```

检查使用独立临时浏览器配置和端口，验证地图 Worker、标记、弹窗、中英文、四视图、移动布局及 WebGL2 降级。
使用带中英文字段的合成矢量瓦片，直接比较地图画面在中→英→中及快速切换后的像素变化；
同时验证只有文字数据源触发重排、canvas 实例与视野保持不变，不依赖外部字体请求。
瓦片与图片请求仍被拦截；不代表真实网络、地图服务或实体移动设备验收。
日志和截图写入系统临时目录，不会关闭用户的浏览器或开发服务器。

## Cloudflare Pages

连接 GitHub 仓库后设置：

| 项目 | 值 |
| --- | --- |
| 项目根目录 | `frontend` |
| 构建命令 | `npm run build` |
| 输出目录（相对上述根目录） | `dist` |
| 环境变量 | `NODE_VERSION=22` |

如果单独把本目录作为一个仓库，则项目根目录留空。
`public/_headers` 随 Vite 构建复制，用于缓存与安全响应头。
先在 `*.pages.dev` 上验收，再按 Pages 控制台提示绑定自定义域名和 HTTPS。
地图瓦片与 Banner 图片仍来自第三方，Cloudflare 不会自动加速这些外部请求。

[Cloudflare Vite 部署指南](https://developers.cloudflare.com/pages/framework-guides/deploy-a-vite3-project/)

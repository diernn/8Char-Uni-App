[根目录](../../CLAUDE.md) > [src](../) > **api**

# api 模块

## 模块职责
`src/api` 是后端接口声明层，当前只有 `default.js` 一个入口文件，但它承接了应用所有远程调用。页面与业务 store 不直接拼接 URL，而是通过这里统一调用 `/8char/*` 接口。

## 入口与启动
- 入口文件：`src/api/default.js`
- 被以下链路直接使用：
  - 首页录入页：`GetInfo()`、`GetBook()`
  - 在线批命页：`GetPrediction()`
  - 启动初始化：`GetTips()`、`GetVersion()`

## 对外接口
| 导出 | 请求 | 用途 |
| --- | --- | --- |
| `GetTips()` | `GET /8char/get-tips` | 预热 tips 数据并写入 `tips` store |
| `GetVersion()` | `GET /8char/get-version` | 对比本地/线上版本，决定是否提示或清理缓存 |
| `GetInfo(data)` | `POST /8char/get-info` | 拉取命盘主体数据，写入 `detail` store |
| `GetBook(data)` | `POST /8char/get-book` | 拉取古籍与称骨等辅助数据，写入 `book` store |
| `GetPrediction(data)` | `POST /8char/get-prediction` | 在线批命内容，按需懒加载 |

## 关键依赖与配置
- API host 不是在本模块内硬编码，而是来自 `src/utils/request.js` 的 `APP_API`：
  - `APP_API = (import.meta.env.VITE_API_URL || "https://api.app.yxbug.cn") + "/api"`
- 生产与开发环境可分别通过：
  - `.env.development`
  - `.env.production`
  调整 `VITE_API_URL`
- 所有接口都经由 `src/utils/request.js` 的 `Get` / `Post` / `Request` 包装，统一调用 `uni.request`。

## 数据模型
从调用点可确认的核心请求载荷是 `detailStore.defaultPayload`，字段包括：
- `datetime`
- `gender`
- `sect`

响应模型未单独声明 TypeScript 类型，但使用场景可以推断：
- `GetInfo()` 返回适配 `detail` store 的命盘主体结构
- `GetBook()` 返回 `{ weigh_bone, books }` 风格数据
- `GetPrediction()` 返回可迭代的分析段落列表
- `GetVersion()` 至少包含 `app` 与 `api` 版本字段

## 测试与质量
- 未发现接口单测、Mock、契约测试或错误码枚举。
- 当前错误处理主要依赖 `src/utils/request.js` 的 toast 提示与 Promise reject。

## 常见问题 (FAQ)
### 如何切换 API 地址？
优先修改 `.env.development` 或 `.env.production` 中的 `VITE_API_URL`，不要在 `default.js` 中直接写死地址。

### 为什么页面里看不到完整请求实现？
因为请求细节被收敛在 `src/utils/request.js`，本模块只声明业务 API 名称与路径。

### 新增接口应该放在哪里？
优先延续当前模式，在 `default.js` 中声明一个语义化函数，再复用 `Get` / `Post` 调用。

## 相关文件清单
- `src/api/default.js`
- `src/utils/request.js`
- `src/pages/home/components/index/sheet/sheet.vue`
- `src/pages/detail/components/index/live/live.vue`
- `src/utils/version.js`
- `src/utils/tips.js`

## 变更记录 (Changelog)
- 2026-04-05 21:09:37：初始化模块文档，补充接口列表、配置来源与响应用途说明。

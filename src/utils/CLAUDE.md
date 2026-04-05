[根目录](../../CLAUDE.md) > [src](../) > **utils**

# utils 模块

## 模块职责
`src/utils` 提供请求、缓存、路由、启动初始化、版本检查、tips 预热、静态资源地址拼接与命理展示转换等基础能力，是页面层与底层平台 API 之间的胶水层。

## 入口与启动
没有单一入口文件，但启动阶段最关键的是：
- `src/utils/launch.js`：应用启动时调用 `checkVersion()` 与 `setTipsToStore()`
- `src/utils/version.js`：版本检查与缓存周期清理
- `src/utils/request.js`：统一远程请求入口

## 对外接口
| 文件 | 核心导出 | 用途 |
| --- | --- | --- |
| `request.js` | `APP_API`、`Get`、`Post`、`Request` | 统一 HTTP 请求封装 |
| `launch.js` | `init()` | 应用启动初始化 |
| `router.js` | `toHome()`、`toDetail()` | 首页/结果页跳转 |
| `version.js` | `checkVersion()` | 比较线上版本、清缓存、提示更新 |
| `tips.js` | `setTipsToStore()` | 拉取/缓存 tips 数据并写入 tips store |
| `cache.js` | `getLocalStorage()`、`setLocalStorage()`、`clearLocalStorage()` 等 | 本地缓存命名空间管理 |
| `file.js` | `getUrl()` | 拼接静态资源地址 |
| `transform.js` | 五行、十神、时间格式等转换函数 | 结果页显示辅助 |

## 关键依赖与配置
- `request.js` 读取 `import.meta.env.VITE_API_URL`
- `file.js` 读取 `src/config/index.js` 导出的 `BASE_URL`
- `cache.js` 读取 `CACHE_PREFIX`
- `version.js` 读取：
  - `APP_VERSION`
  - `API_VERSION`
  - `CACHE_CLEAR_CYCLE`
  - `GIT_URL`
- 多数工具依赖 `uni` 与 `uni.$u` 提供的平台 API 与 UI 提示

## 数据模型
### 缓存键位
从代码中可确认常用本地缓存键包括：
- `info`
- `version`
- `last-time`
- `tips-data`

这些键位最终都会被 `CACHE_PREFIX` 加前缀后再写入本地存储。

### tips 预热逻辑
`tips.js` 的 `setTipsToStore()` 只有一条主路径：
- 先从本地读取 `tips-data`
- 若 `uni.$u.test.isEmpty(data)` 成立，则调用 `GetTips()` 远端拉取
- 无论数据来自缓存还是远端，都会执行 `store.set(data)`
- 最后再次写回 `tips-data`

这意味着：
- `tips` store 的数据结构完全信任缓存/接口返回值，不做字段校验
- 若缓存结构损坏但未被 `isEmpty` 判空识别，错误数据也会直接进入 store
- `yx-book-tips`、结果页 tips 说明与专业细盘弹层都依赖这条预热链先成功完成

### 版本检查逻辑
`version.js` 的 `checkVersion()` 采用两层本地状态：
- `version`：仅用于判断当前缓存是否仍适用于本地 `APP_VERSION`，不一致时直接清空业务缓存
- `last-time`：记录上次检查时间；超过 `CACHE_CLEAR_CYCLE`（当前为 2 天）后会再次清缓存并调用 `GetVersion()`

线上版本比较由 `compareVersion()` 返回差异级别：
- `0`：无更新提示，仅 console 输出
- `1`：大版本差异，H5 下会直接 `window.open(GIT_URL)`
- `2`：中版本差异，toast 提示用户去仓库更新
- `3`：小版本差异，仅 console 提示

### 转换辅助
`transform.js` 主要负责：
- 五行属性与颜色/类型映射
- 日期格式化
- 十神关系转换
- 数组与字符串小工具

## 测试与质量
- 未发现 `utils` 层的单元测试。
- `version.js` 和 `request.js` 属于高影响范围：前者涉及缓存清理，后者影响所有远程请求的错误提示行为。
- `version.js` 当前还存在额外风险：
  - `compareVersion()` 只按 `currentVersion.length` 遍历，若线上版本段数更多，新增段不会参与比较
  - 大版本更新在 H5 下会直接打开 `GIT_URL`，但非 H5 平台没有等价跳转兜底
  - 整个 `checkVersion()` 被 `try/catch` 包裹，异常会静默吞掉，排查版本逻辑问题时可观测性较弱

## 常见问题 (FAQ)
### 如何修改首页/结果页跳转方式？
优先调整 `src/utils/router.js`，不要在页面内部散写路由对象。

### 如何统一清理业务缓存？
通过 `clearLocalStorage()`，它只会删除带 `CACHE_PREFIX` 前缀的键。

### 静态资源为什么不直接使用相对路径？
因为 `file.js` 会基于 `VITE_APP_BASE_URL` 拼接完整路径，便于未来切到 CDN 托管。

## 相关文件清单
- `src/utils/request.js`
- `src/utils/launch.js`
- `src/utils/router.js`
- `src/utils/version.js`
- `src/utils/tips.js`
- `src/utils/cache.js`
- `src/utils/file.js`
- `src/utils/transform.js`
- `src/config/index.js`

## 变更记录 (Changelog)
- 2026-04-05 21:09:37：初始化模块文档，补充请求/缓存/版本检查/启动逻辑说明。

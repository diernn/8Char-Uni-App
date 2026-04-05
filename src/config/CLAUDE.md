[根目录](../../CLAUDE.md) > [src](../) > **config**

# config 模块

## 模块职责
`src/config` 负责集中维护应用常量、展示映射与命理相关偏移表。它既承担运行配置的导出，也为结果页、流运页、颜色/五行展示提供基础元数据。

## 入口与启动
- 入口文件：`src/config/index.js`
- 辅助映射：`src/config/map.js`、`src/config/offset.js`
- 被 `pages`、`store`、`utils`、本地组件广泛复用。

## 对外接口
### `index.js`
- `APP_AUTHOR`
- `APP_NAME`
- `APP_SUB_NAME`
- `APP_DESCRIPTION`
- `APP_VERSION`
- `API_VERSION`
- `CACHE_PREFIX`
- `CACHE_CLEAR_CYCLE`
- `BASE_URL`
- `GIT_URL`

### `map.js`
- `TEND_STORE_FIELD`：定义大运/小运/流月/流日/流时的字段结构
- `PILLAR_FIELD`：`year/month/day/time`
- `ELEMENT`：五行标签、对应主题色和 uView 类型

### `offset.js`
- `CHANG_SHENG_OFFSET`
- `SHI_SHEN_ZHI`
- `SHI_SHEN_SIMPLIFIE`
- `TAISUI_RELATION`

## 关键依赖与配置
- `BASE_URL` 读取 `import.meta.env.VITE_APP_BASE_URL`，决定静态资源拼接基址。
- `APP_VERSION` 与 `API_VERSION` 是手工常量，不会自动与 `package.json` 的 `version` 同步。
- `CACHE_PREFIX` 被 `src/utils/cache.js` 统一用于本地存储命名空间。

## 数据模型
本模块主要导出配置对象与映射表，而不是运行时状态：
- `ELEMENT` 决定结果页五行颜色、类型与图标索引
- `TEND_STORE_FIELD` 决定 `tend` store 以及滚动视图的层级顺序
- `SHI_SHEN_*`、`TAISUI_RELATION` 为命理展示层提供字符串映射，不直接发请求

## 测试与质量
- 未发现针对映射表正确性的自动化校验。
- 如果新增命理规则，当前只能依靠页面联调与人工校验结果正确性。

## 常见问题 (FAQ)
### 静态资源 CDN 基址在哪里控制？
在 `.env.*` 中维护 `VITE_APP_BASE_URL`，`src/config/index.js` 只负责读取并导出 `BASE_URL`。

### 版本号为什么不只维护一份？
因为 `APP_VERSION` / `API_VERSION` 被运行时逻辑直接读取，而代码中没有将其与 `package.json` 自动联动。

### 新的五行或流运展示字段应该放哪里？
优先放在 `map.js` 或 `offset.js`，避免把展示映射散落到组件里。

## 相关文件清单
- `src/config/index.js`
- `src/config/map.js`
- `src/config/offset.js`
- `src/utils/cache.js`
- `src/utils/file.js`
- `src/store/tend.js`
- `src/pages/detail/components/index/major/components/scroll/map.js`

## 变更记录 (Changelog)
- 2026-04-05 21:09:37：初始化模块文档，整理常量、映射表与运行配置来源。

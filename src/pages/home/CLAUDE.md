[根目录](../../../CLAUDE.md) > [src](../../) > [pages](../) > **home**

# home 模块

## 模块职责
`src/pages/home` 是应用的首页与排盘入口，负责收集用户输入、切换排盘模式、发起首轮命盘请求，并在成功后把必要数据写入 store 再跳转到结果页。

## 入口与启动
- 路由：`pages/home/home`（定义于 `src/pages.json`）
- 页面入口：`src/pages/home/home.vue`
- 页面拼装：
  - `components/index/head/head.vue`：头部品牌与产品定位
  - `components/index/sheet/sheet.vue`：核心录入与提交逻辑
  - `components/index/bottom/bottom.vue`：项目外链、清缓存、版权入口；点击行为由同目录 `config.js` 驱动

## 对外接口
本模块不直接暴露函数给外部模块，但承担以下用户可见交互：
- 姓名输入
- 性别选择
- 公历时间选择
- 四柱反查时间
- 晚子时流派切换（`sect`）
- 提交排盘
- 跳转结果页
- 打开 GitHub / Gitee / 博客
- 清理缓存并重新初始化

核心请求与跳转链路位于 `components/index/sheet/sheet.vue`：
1. 组装 payload：`realname`、`timestamp`、`gender`、`sect`
2. 写入 `detailStore`
3. 调用 `GetInfo(detailStore.defaultPayload)`
4. 调用 `GetBook(detailStore.defaultPayload)`
5. 调用 `tendStore.pull(payload)` 做本地流运推导
6. 通过 `toDetail()` 跳转 `pages/detail/index`

## 关键依赖与配置
- `lunar-javascript`：用于公历/阴历转换和四柱反查时间
- `Pinia`：写入 `detail`、`book`、`tend` store
- `src/api/default.js`：`GetInfo`、`GetBook`
- `src/utils/cache.js`：缓存最近一次输入信息到 `info`
- `src/utils/router.js`：结果页跳转
- `src/utils/file.js`：首页头图、底部图标静态资源地址拼接
- `src/utils/launch.js`：清缓存后重新初始化版本检查与 tips 预热
- `src/config/map.js`：`PILLAR_FIELD`
- `src/pages.json`：页面注册与 `yx-*` easycom 自动组件映射

## 数据模型
首页表单状态由 `reactive(form)` 管理，关键字段包括：
- `realname`
- `gender`
- `model`：0 为时间模式，1 为四柱模式
- `sect`
- `timestamp`
- `defaultTime`
- `datetimeLabel`
- `lunarLabel`

首页头部 `components/index/head/head.vue` 不参与表单状态，只读取：
- `APP_SUB_NAME`
- `APP_DESCRIPTION`
- 以及 `getUrl('static/icon/site/logo.svg')` 拼出的品牌 logo 地址

提交后形成的主 payload：
- `realname`
- `timestamp`
- `gender`
- `sect`

另外，本模块会把该 payload 序列化后缓存到本地 `info` 键位，便于下次进入页面回填。

## 测试与质量
- 未发现首页表单单测、交互测试或接口 Mock。
- 关键验证只能通过真实链路人工确认：
  - 时间选择是否正确转成 timestamp
  - 四柱反查是否能命中可选时间
  - 提交失败时 toast 是否提示准确
  - 成功后 `detail/book/tend` 三个 store 是否都已准备好

## 常见问题 (FAQ)
### 首页为什么既能选时间又能选四柱？
`model` 控制两种录入模式；四柱模式通过 `yx-pillar-picker` 调用 `Solar.fromBaZi()` 做反查。

### 为什么结果页依赖首页先写 store？
结果页会检查 `detailStore.timestamp`，如果为空会直接跳回首页，因此首页是整个结果链路的必要前置。

### 清理缓存后会发生什么？
`bottom.vue` 会调用 `clearLocalStorage()`，随后再次执行 `init()`，重新进行版本检查与 tips 预热。

## 相关文件清单
- `src/pages/home/home.vue`
- `src/pages/home/components/index/head/head.vue`
- `src/pages/home/components/index/sheet/sheet.vue`
- `src/pages/home/components/index/bottom/bottom.vue`
- `src/pages/home/components/index/bottom/config.js`
- `src/api/default.js`
- `src/store/detail.js`
- `src/store/book.js`
- `src/store/tend.js`

## 变更记录 (Changelog)
- 2026-04-05 21:09:37：初始化模块文档，整理首页录入流、缓存行为与提交流程。

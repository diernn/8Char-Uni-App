[根目录](../../CLAUDE.md) > [src](../) > **store**

# store 模块

## 模块职责
`src/store` 维护应用运行期状态。这里既承接后端返回的数据，也负责基于 `lunar-javascript` 推导流运，因此它是首页输入、结果页展示和本地命理计算之间的核心中枢。

## 入口与启动
- `src/main.js` 中 `createPinia()` 完成注册
- 主要 store：
  - `detail.js`
  - `book.js`
  - `tend.js`
  - `tips.js`

## 对外接口
| Store | 主要职责 |
| --- | --- |
| `useDetailStore` | 承载命主资料、主命盘字段、五行/神煞/起运等主体数据，并提供 `defaultPayload` 给 API 调用 |
| `useBookStore` | 保存称骨与古籍内容 |
| `useTendStore` | 本地计算大运、流年、流月、流日、流时，并维护当前选中索引 |
| `useTipsStore` | 保存 tips、纳音、关系、趋势等辅助说明，用于弹层解释 |

## 关键依赖与配置
- `useDetailStore` 依赖 `src/utils/transform.js` 的 `timeFormat`
- `useTendStore` 依赖：
  - `lunar-javascript`
  - `src/config/map.js`
  - `src/utils/transform.js`
- `useTipsStore` 由 `src/utils/tips.js` 负责填充
- `useBookStore` 与 `useDetailStore` 均通过统一 `set(data)` 模式做字段覆盖

## 数据模型
### `detail` store
核心字段包括：
- 命主基础信息：`realname`、`gender`、`timestamp`、`sect`
- 日期信息：`datetime`、`festival`、`constellation`、`zodiac`
- 四柱结构：`top`、`bottom`、`bottom_hide`
- 展示字段：`empty`、`start`、`trend`、`nayin`、`element`、`selfsit`、`gods`、`start_tend`
- 其他结构：
  - `embryo`：结果页命主信息区会按 `胎元/胎息/命宫/身宫` 读取 `embryo[0..3]`
  - `tb_relation`：上下两组关系图数据
- getter：
  - `dayGan`
  - `startTendDate`
  - `defaultPayload`
- 关键动作：
  - `set(data)`：按 key 直接覆盖现有 state，不做字段白名单与深拷贝保护

### `book` store
- `weigh_bone`
- `books`

### `tips` store
- `gods`
- `nayin`
- `relation`
- `trend`

### `tend` store
- 原始命理服务对象：`service.lunar` / `service.solar` / `service.bazi`
- 多级列表：`original`、`dayunList`、`yearList`、`monthList`、`dayList`、`timeList`
- 当前索引：`currentIndex`、`yearIndex`、`monthIndex`、`dayIndex`、`timeIndex`
- getter：
  - `rowNum`：按已展开层级动态决定结果页专业细盘列数
  - `currentLunar`：根据当前时间粒度反推当前选中的 `Lunar` 对象
  - `currentDate`：把当前选择格式化成结果页顶部日期文案
- 关键动作：
  - `pull()`：首页提交后入口，基于 `timestamp/gender/sect` 初始化 `solar/lunar/bazi`
  - `resolveYun()` / `resolveDaYun()` / `resolveLiuYear()` / `resolveLiuMonth()`：逐级展开大运到流月
  - `resolveLiuDay()` / `resolveLiuTime()`：按需展开流日与流时
  - `SkipCurrentTime()`：把当前系统时间映射到五层索引并驱动结果页滚动联动
- 关键实现细节：
  - 流月按节气表切分，最后一个月依赖 `XIAO_HAN` 特殊键
  - 流日通过节气区间逐日迭代生成
  - 流时从前一小时开始每两小时生成一柱，匹配 12 时辰列
  - `SkipCurrentTime()` 当前存在 `monthList[i]` / `dayList[i]` 与循环变量混用迹象，属于潜在定位 bug 热点
  - 大量 `new Date('yyyy/m/d')` 解析可能受平台与时区差异影响
- 关键调用方：
  - 首页 `src/pages/home/components/index/sheet/sheet.vue`
  - 结果页 `src/pages/detail/components/index/major/components/scroll/scroll.vue`
  - 专业细盘 `src/pages/detail/components/index/major/components/detail/detail.vue`。

## 测试与质量
- 未发现 store 单测或命理计算回归测试。
- `detail.js` 也值得补最基础的状态回归，因为多个结果页组件直接消费其嵌套结构，不经过额外适配层。
- `tend.js` 是当前最需要回归测试的文件，因为它包含多级时间推导、日期比较和索引推进逻辑。
- 特别值得回归的点：
  - `pull()` 后默认展开链是否稳定到流月层
  - `rowNum` 与结果页列数是否一致
  - `currentLunar/currentDate` 在 year / month / day / time 四种粒度下是否输出正确
  - `SkipCurrentTime()` 是否会因索引混用导致跳错月份、日期或时辰
  - 节气边界（月切换）与时区差异是否造成流日/流时错位
  - `童限` 分支是否影响后续行列对齐与日期反推

## 常见问题 (FAQ)
### `tendStore` 的数据来自后端吗？
不是。首页只把 `timestamp/gender/sect` 传入 `pull()`，后续大运到流时的绝大多数数据都由 `lunar-javascript` 在前端本地推导。

### 为什么结果页不同区域都依赖 `tendStore`？
滚动轴、专业细盘、当前日期文案都共享同一组列表与索引；任何一层索引推进错误，多个展示区会同时错位。 

### `SkipCurrentTime()` 为什么危险？
它跨五层循环串联重算索引，当前实现里已有 `monthList[i]`、`dayList[i]` 这类可疑写法，后续维护必须优先验证当前时间跳转路径。 

## 常见问题 (FAQ)
### API 请求为什么总是传 `datetime/gender/sect`？
因为 `useDetailStore.defaultPayload` 统一把首页输入转换成后端期望的载荷格式，首页与在线批命都依赖它。

### 流运为什么在前端计算？
`useTendStore` 直接调用 `lunar-javascript` 的 `EightChar` / `Yun` 能力，因此大运与更细粒度流运不必完全依赖后端接口。

### 为什么多个 store 都有 `set(data)`？
这是当前仓库统一的轻量更新模式，用于把接口返回值直接合并到 store 状态中。

## 相关文件清单
- `src/store/detail.js`
- `src/store/book.js`
- `src/store/tend.js`
- `src/store/tips.js`
- `src/main.js`
- `src/pages/home/components/index/sheet/sheet.vue`
- `src/pages/detail/index.vue`

## 变更记录 (Changelog)
- 2026-04-05 21:09:37：初始化模块文档，汇总 Pinia store 结构与本地流运计算职责。
- 2026-04-05 21:09:37：补充 `tend` store 的多级展开链、getter 语义与 `SkipCurrentTime()` 风险点。

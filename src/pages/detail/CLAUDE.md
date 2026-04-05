[根目录](../../../CLAUDE.md) > [src](../../) > [pages](../) > **detail**

# detail 模块

## 模块职责
`src/pages/detail` 是排盘结果总览页，负责把首页预先拉取的命盘、古籍、流运与提示数据组织成四个标签视图：命主信息、基本命盘、专业细盘、在线批命。

## 入口与启动
- 路由：`pages/detail/index`（定义于 `src/pages.json`）
- 页面入口：`src/pages/detail/index.vue`
- 首屏守卫：`onMounted()` 检查 `detailStore.timestamp`，若为空则通过 `toHome()` 回到首页
- 四个主标签：
  - `detail`：命主信息与总览
  - `basic`：基本命盘、藏干关系、古籍内容
  - `major`：流运、太岁状态、专业细盘明细
  - `live`：在线批命

## 对外接口
本模块主要表现为页面 UI 与 store 读操作，但内部有几个关键交互：
- 读取 `detailStore` 展示命盘主体
- 读取 `bookStore` 展示古籍与称骨内容
- 读取/推进 `tendStore` 展示大运/流年/流月/流日/流时
- 通过 `GetPrediction()` 按需获取在线批命结果
- 通过 `yx-book-tips`、`yx-pillar-relation` 展示弹层解释与四柱关系图

## 关键依赖与配置
- `src/store/detail.js`：命主资料、命盘结果、五行、神煞等主数据
- `src/store/book.js`：古籍与称骨数据
- `src/store/tend.js`：流运链路与当前选择状态
- `src/api/default.js`：在线批命请求 `GetPrediction()`
- `src/config/map.js` / `offset.js`：流运字段与太岁/十神映射
- `src/utils/file.js` / `transform.js`：图标、颜色、时间与关系转换

## 数据模型
### 页面层
`src/pages/detail/index.vue` 维护：
- `tabsOption.list`：四个标签页名称
- `tabsOption.current`：当前标签索引
- `headerHeight` / `contentHeight`：固定头部下的滚动区域尺寸

### 业务层
页面依赖以下 store 结构：
- `detailStore`：命主信息、四柱、十神、纳音、五行、自坐、神煞、节令等
- `bookStore`：`weigh_bone` 与 `books`
- `tendStore`：`dayunList`、`yearList`、`monthList`、`dayList`、`timeList` 与对应索引

### 深层组件补充
- `components/index/common/header/header.vue`：直接读取 `detailStore.datetime / zodiac / gender / realname`，本地 `isHide` 控制姓名掩码显示；头像通过 `GetChineseZodiac()` 把生肖映射到 `static/icon/zodiac/*.svg`，匹配失败时回退到 `/site/logo.svg`。
- `components/index/common/pro-decl/pro-decl.vue`：读取 `detailStore.element.pro_decl` 渲染五行旺衰条；当 `auto=true` 时，会取每项首字到 `ELEMENT` 映射表反查颜色类型，因此字段格式与映射标签必须保持一致。
- `components/index/detail/detail.vue`：只是详情区装配层，固定串联 `detail/detail.vue`、`elements.vue`、`weigh-bone.vue` 三块，不承载业务状态。
- `components/index/detail/components/detail/detail.vue`：命主信息明细卡，直接把 `detailStore` 格式化成 5 行二维文本数组，覆盖生肖/性别、星座/日空、胎元/胎息、命宫/身宫、节气前后节点；强依赖 `embryo[0..3]` 和 `festival.pre/next` 结构完整。
- `components/index/detail/components/detail/detail-item.vue`：纯行渲染组件，依据当前行项目数动态生成 `u-flex-*` 类；如果传入数组长度异常，布局比例会直接受影响。
- `components/index/detail/components/elements/elements.vue`：五行数据卡，切换 `isInclude` 时会在 `detailStore.element.include.list` 与 `detailStore.element.ninclude.list` 之间切换；进度条颜色来自 `ELEMENT.colors`，说明文案来自 `detailStore.element.relation`，并复用 `pro-decl` 展示旺衰条。当前代码直接读取 `item.sacle`，后端若改成更正后的 `scale` 字段会直接失效。
- `components/index/detail/components/weigh-bone/weigh-bone.vue`：纯展示组件，不接收 props，直接读取 `bookStore.weigh_bone.total / poetry / explain / title`；以 `poetry` 为整块显隐开关，因此后端若只返回重量而无歌诀会导致整卡不显示。
- `components/index/basic/components/tabel/tabel.vue`：基础命盘主表，按固定 10 行配置把 `detailStore.start/top/bottom/bottom_hide/trend/selfsit/nayin/empty/gods` 组装成二维表；`showTips()` 只对白名单字段触发 `yx-book-tips`，其中 `main/assiste` 被映射到 `relation` 类型，`selfsit` 被映射到 `trend` 类型。该表强依赖 `detailStore` 的多组嵌套对象 shape 稳定。
- `components/index/basic/components/relation/relation.vue`：关系摘要区，基于 `detailStore.tb_relation.top/bottom` 去重后显示“天干留意/地支留意”，并通过 `ref.showPopup()` 打开 `yx-pillar-relation`。如果 `tb_relation` 为空结构，会退化为“无合冲关系”。
- `components/index/major/components/detail/detail.vue`：专业细盘核心表格，不走 props，直接组合 `detailStore` 与 `tendStore`。列头由 `tendStore.rowNum` 动态裁剪，列内容依赖 `PILLAR_FIELD`、`TEND_STORE_FIELD`、`CHANG_SHENG_OFFSET`、`SHI_SHEN_SIMPLIFIE` 等映射；`童限` 分支与字段顺序变化都会影响整表正确性。
- `components/index/major/components/scroll/map.js`：滚动轴字段映射配置，`tendItemMapList` 规定大运到流时每列的字段顺序与单位后缀，`storeIndexList` / `storeMethodsList` 则把 `TEND_STORE_FIELD` 映射成索引 key 与逐级展开方法名；该文件与 `tendStore` 的字段命名强耦合。
- `components/index/major/components/scroll/scroll-list.vue`：多层横向滚动轴主体，按 `TEND_STORE_FIELD` 逐层渲染大运到流时列表；点击某层项目会重置下一层索引并调用 `storeMethodsList` 对应方法继续展开。H5 下通过 `scrollLeft` 双向记录位置，`pullScrollLeft()` 则用 `uni.$u.getRect()` 按选中项宽度回推滚动定位。当前实现假设每个 `.scroll-view-item` 宽度近似一致。 

### 结果页内部子模块分工
- `components/index/common/header/header.vue`：命主头像、阴历/阳历摘要、姓名隐藏切换；姓名隐藏状态仅存在组件本地，不会持久化。
- `components/index/basic/*`：基础命盘表格、合冲关系、古籍内容；其中 `book.vue` 直接把 `bookStore.books` 映射成 `u-tabs` 与正文，不做排序、分组和空态兜底
- `components/index/detail/*`：命盘详情、五行比例、称骨说明；`detail.vue` 只负责装配，真正的数据拼装在其下层 `components/detail/detail.vue` 中完成
- `components/index/major/*`：起运信息、流运滚动轴、专业细盘详情
- `components/index/live/live.vue`：在线批命请求与展示；仅在用户点击按钮后调用 `GetPrediction(detailStore.defaultPayload)`，结果缓存在本地 `option.list`，失败仅 toast 提示，不写 store 也无重试流程持久化
- `yx-book-tips`：由基础表格与专业细盘通过 `ref.setDetail(type, label)` 触发，内部从 `tips` store 按 `label` 查找说明并映射 `tip/formula/func/seek/books` 字段为弹层内容列表；若 store 未预热或字段缺失则不会弹出内容

## 测试与质量
- 未发现结果页组件单测、store 集成测试或快照测试。
- 当前高风险区域：
  - `tendStore` 层级切换与滚动位置同步
  - `detailStore` 数据缺失时的空渲染
  - 在线批命网络失败后的恢复与重试体验
  - 多层嵌套组件中 tips 弹层与图示弹层的交互一致性
  - `weigh_bone` 字段缺失导致称骨整块不渲染
  - `bookStore.books[current]` 越界或返回空结构时古籍页会直接空白
  - `tabel.vue` 直接改写 `data.data.label` 并混合多种 cell 结构，后端字段 shape 漂移后最容易出现局部空列
  - `relation.vue` 与 `yx-pillar-relation` 共同假设 `tb_relation` 的 `title/index` 结构稳定，一旦接口换字段，摘要和图示会同时异常
  - `scroll-list.vue` 依赖 `storeMethodsList` 与 `TEND_STORE_FIELD` 顺序一致，且 `pullScrollLeft()` 默认按统一项宽推算滚动位置
  - `TEND_STORE_FIELD` 顺序、`rowNum` 或 `童限` 规则变更后专业细盘列错位
  - `tendStore.SkipCurrentTime()` 内部存在多层循环索引混用（`monthList[i]` / `dayList[i]`），后续若修复逻辑需重点回归当前时间跳转链路
  - `resolveLiuMonth()` 依赖 `XIAO_HAN` 特殊键名和本地 `Date` 解析，存在库升级与时区差异风险
  - `yx-book-tips` 强依赖 `tips` store 已预热且 `label` 唯一匹配，否则弹层静默无内容，难以定位数据问题

## 常见问题 (FAQ)
### 为什么古籍页签切换后有时会看到空白内容？
`book.vue` 直接读取 `bookStore.books[current]?.content`。如果接口返回结构不完整，或数据刷新后 `current` 指向了不存在的页签，组件只会静默显示空白。

### 在线批命的数据会缓存到 store 吗？
不会。`live.vue` 只把 `GetPrediction()` 返回值写入组件内 `option.list`，页面销毁后不会保留。 

### 流运“跳转到当前时间”为什么值得重点关注？
按钮最终调用 `tendStore.SkipCurrentTime()`，它会串联大运、流年、流月、流日、流时五层索引推进；当前实现里有循环索引混用迹象，最容易出现定位错列。 

### 为什么 tips 弹层有时点了没反应？
`yx-book-tips` 是按 `label` 从 `tips` store 查找详情；如果预热数据未到位、标签名不一致，`setDetail()` 不会报错，只是不会打开弹层。

## 常见问题 (FAQ)
### 为什么进入结果页后可能被立刻重定向到首页？
因为页面初始化时会检查 `detailStore.timestamp`；如果用户没有先经过首页提交流程，结果页不会单独自举数据。

### 在线批命为什么不是首屏就请求？
`live.vue` 只有用户主动点击后才调用 `GetPrediction()`，这是一个按需加载的远程分析区。

### 流运是后端返回的吗？
不是。`tendStore.pull()` 基于 `lunar-javascript` 在前端本地计算大运、流年、流月、流日、流时，结果页只负责展示与切换。

## 相关文件清单
- `src/pages/detail/index.vue`
- `src/pages/detail/components/index/common/header/header.vue`
- `src/pages/detail/components/index/common/pro-decl/pro-decl.vue`
- `src/pages/detail/components/index/basic/basic.vue`
- `src/pages/detail/components/index/basic/components/tabel/tabel.vue`
- `src/pages/detail/components/index/basic/components/relation/relation.vue`
- `src/pages/detail/components/index/basic/components/book/book.vue`
- `src/pages/detail/components/index/detail/detail.vue`
- `src/pages/detail/components/index/detail/components/detail/detail.vue`
- `src/pages/detail/components/index/detail/components/detail/detail-item.vue`
- `src/pages/detail/components/index/detail/components/elements/elements.vue`
- `src/pages/detail/components/index/detail/components/weigh-bone/weigh-bone.vue`
- `src/pages/detail/components/index/major/major.vue`
- `src/pages/detail/components/index/major/components/detail/detail.vue`
- `src/pages/detail/components/index/major/components/scroll/scroll.vue`
- `src/pages/detail/components/index/major/components/scroll/scroll-list.vue`
- `src/pages/detail/components/index/live/live.vue`

## 变更记录 (Changelog)
- 2026-04-05 21:09:37：初始化模块文档，整理结果页标签结构、store 依赖与在线批命/流运链路。
- 2026-04-05 21:09:37：补充专业细盘详情与称骨组件的数据来源、动态列规则与风险点。
- 2026-04-05 21:09:37：补充古籍展示、在线批命、tips 弹层与 `SkipCurrentTime()` 风险说明。

# Basic Relation Refactor Design

## Context

`src/pages/detail/components/index/basic/components/relation/relation.vue` 当前同时承担了 store 读取、关系摘要去重、弹层数据组装、空态文案判断、点击打开弹层和列表渲染等多种职责。它虽然体量不大，但边界已经开始变模糊，不利于继续沿着 basic 模块最近的收口方向推进。

本次设计目标是做一次低风险、高收益的最小整理，保持结果页基础模块的外部行为、交互文案和 `yx-pillar-relation` 接口完全不变，只解决以下问题：

- 命名不够语义化
- 摘要展示与数据准备耦合
- 去重与空态逻辑散落在组件内
- 关键职责缺少最小必要注释

## Goals

1. 保持外部行为不变，包括：
   - 点击“智能四柱图示”区域仍然打开原有弹层
   - “天干留意 / 地支留意”摘要顺序不变
   - 空态文案仍为 `无合冲关系`
   - `yx-pillar-relation` 接收的 `top` / `bottom` 数据结构不变
2. 让 `relation.vue` 回归装配层角色，只负责：
   - 连接 store
   - 绑定点击事件
   - 把准备好的数据传给展示子组件和弹层组件
3. 把非渲染逻辑下沉到极小 helper，避免重复与内联表达式扩散。
4. 新增一个极小展示子组件，统一摘要行的标题、空态和内容展示。

## Non-Goals

- 不改 `detailStore` 数据结构
- 不改 `yx-pillar-relation` 内部实现或外部接口
- 不引入新的 store、组合式函数或跨模块公共抽象
- 不调整视觉样式、交互路径或文案
- 不做与本文件无关的 basic 模块联动重构

## Current Problems

### 1. 职责混杂

当前 `relation.vue` 既要读取 `detailStore.tb_relation`，又要做摘要去重、组装弹层数据、控制点击弹出，还要直接渲染摘要列表。数据准备和视图展示没有边界。

### 2. 命名不够清晰

当前变量名 `list`、`detail`、`relation`、`showRelation` 都偏泛化。对于维护者来说，很难第一眼区分它们分别代表“摘要列表”“弹层数据”“弹层 ref”“打开弹层动作”。

### 3. 空态表达分散

`item.content.length > 0 ? item.content.join(';') : '无合冲关系'` 直接写在模板里，渲染规则和空态策略耦合在一起。后续一旦同类摘要项变多，模板可读性会继续下降。

### 4. 重复逻辑缺少收口

“按 title 去重后生成摘要项”和“按固定四柱顺序组装弹层数据”都属于数据准备逻辑，更适合放到 helper，而不是持续留在页面组件内部。

## Approaches Considered

### 方案 A：只在 `relation.vue` 单文件内整理

做法：只重命名变量、加注释、把内联表达式拆成 computed 或局部函数，但不新增文件。

优点：改动最少。

缺点：组件仍然同时承担装配、数据准备和摘要展示三类职责，边界改善有限。

### 方案 B：仅新增 helper

做法：把去重与弹层数据组装放到 helper，但模板仍直接渲染摘要项。

优点：逻辑下沉，成本较低。

缺点：摘要展示和空态表达仍然留在 `relation.vue`，模板职责仍偏重。

### 方案 C：装配层 + 极小 helper + 极小展示子组件

做法：
- `relation.vue` 只做装配与点击转发
- `relation-helpers.js` 负责摘要列表和弹层数据组装
- `relation-summary-item.vue` 负责单条摘要展示与空态文案渲染

优点：
- 职责边界最清晰
- 改动仍然很小，适合本次“低风险收口”目标
- 和 basic 模块刚完成的 `table` 区域收口风格一致

缺点：相比单文件整理多出两个极小文件

### Recommendation

采用方案 C。它在不改变外部行为的前提下，能以最小增量把 `relation.vue` 收成装配层，同时把数据准备和摘要展示边界清晰化，最符合当前 basic 模块的演进方向。

## Proposed Design

## File Changes

### Modify
- `src/pages/detail/components/index/basic/components/relation/relation.vue`

### Create
- `src/pages/detail/components/index/basic/components/relation/relation-helpers.js`
- `src/pages/detail/components/index/basic/components/relation/relation-summary-item.vue`

## Component Responsibilities

### `relation.vue`

保留为结果页 basic 模块关系区装配层，只负责：

- 读取 `detailStore`
- 调用 helper 生成 `summaryList`
- 调用 helper 生成 `relationDetail`
- 响应点击并打开 `yx-pillar-relation`
- 把单条摘要数据传给 `relation-summary-item`

它不再直接承担：

- 摘要去重细节
- 空态文案判断
- 弹层数据组装细节

### `relation-summary-item.vue`

这是一个极小纯展示组件，只负责渲染一条摘要项。输入保持简单：

- `title`
- `contentList`
- `emptyText`

组件内部统一决定显示：

- 有内容时：`contentList.join(';')`
- 无内容时：`emptyText`

这样可以把空态表达从 `relation.vue` 模板中移除。

### `relation-helpers.js`

这是一个极小 helper 文件，只负责两类纯数据准备：

1. 从 `detailStore.tb_relation.top/bottom` 生成摘要列表
2. 从 `detailStore.top/bottom` + `PILLAR_FIELD` 生成 `yx-pillar-relation` 需要的弹层数据

helper 不引入副作用，不直接依赖组件实例。

## Data Flow

数据流保持单向：

1. `relation.vue` 从 `detailStore` 读取原始数据
2. `relation-helpers.js` 生成：
   - `summaryList`
   - `relationDetail`
3. `relation.vue` 将：
   - `summaryList` 逐项传给 `relation-summary-item`
   - `relationDetail.top / relationDetail.bottom` 传给 `yx-pillar-relation`
4. 用户点击卡片区域后，由 `relation.vue` 调用弹层 ref 的 `showPopup()`

这样保持组件通信最小化，不增加新的状态源。

## Naming Cleanup

为提升语义清晰度，推荐以下命名收口：

- `list` -> `summaryList`
- `detail` -> `relationDetail`
- `relation` -> `relationPopupRef`
- `showRelation` -> `openRelationPopup`

这些命名只改变可读性，不改变逻辑。

## Empty State Strategy

空态策略保持现有行为不变：

- 摘要标题仍为：`天干留意`、`地支留意`
- 当摘要内容为空数组时，显示：`无合冲关系`
- 拼接分隔符仍为英文分号 `;`

空态文案不在多个地方重复书写，由展示子组件统一消费 `emptyText`。

## Interface Compatibility

### `yx-pillar-relation`

继续接收原有结构：

- `top: { list, mark }`
- `bottom: { list, mark }`

不会调整字段名，也不会改 `showPopup()` 的调用方式。

### Store Usage

继续直接读取：

- `detailStore.tb_relation.top`
- `detailStore.tb_relation.bottom`
- `detailStore.top`
- `detailStore.bottom`

不新增 store 中间层，也不改字段 shape。

## Error Handling

本次不新增复杂错误处理，只保持当前组件已有的容错风格：

- 摘要列表为空时，用现有空态文案兜底
- helper 仅做轻量数据组装，不抛出额外业务错误
- 不新增 toast、日志或埋点逻辑

这是一次最小结构整理，不扩大行为面。

## Testing Plan

### Static Checks

- `npm run lint -- --format unix`
- `npm run check:utf8`
- `npm run build:h5`
- `npx prettier --check "src/pages/detail/components/index/basic/components/relation/relation.vue" "src/pages/detail/components/index/basic/components/relation/relation-summary-item.vue" "src/pages/detail/components/index/basic/components/relation/relation-helpers.js"`

### Manual Regression

1. 打开结果页 basic 模块
2. 确认“智能四柱图示”区域仍可点击
3. 确认点击后原有 `yx-pillar-relation` 弹层仍正常打开
4. 确认“天干留意 / 地支留意”顺序不变
5. 确认有数据时仍使用 `;` 拼接展示
6. 确认无数据时仍显示 `无合冲关系`

## Why This Design

这个设计的核心是用最小增量建立清晰边界：

- `relation.vue` 只做装配，不再混写数据准备和空态表达
- helper 只做纯数据组装，方便理解和复用
- 展示子组件只做摘要项渲染，模板语义更直观

它不会引入新的抽象层级或未来性设计，符合 KISS、YAGNI 和“低风险高收益收口”的目标。

## Implementation Readiness

该设计已经具备进入实施计划的条件：

- 范围聚焦在 relation 区域
- 文件改动面小
- 外部接口保持兼容
- 回归点明确
- 不依赖其他未完成重构任务

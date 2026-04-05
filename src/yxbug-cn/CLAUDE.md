[根目录](../../CLAUDE.md) > [src](../) > **yxbug-cn**

# yxbug-cn 模块

## 模块职责
`src/yxbug-cn` 是本仓库的本地通用组件集合，用来补足 `vk-uview-ui` 之外的产品化封装。它承担统一布局、品牌导航、弹层说明、四柱选择器、关系图示和版权区块等职责。

## 入口与启动
- 模块目录：`src/yxbug-cn`
- 自动注册来源：`src/pages.json`
  - `^yx-(.*)` -> `@/yxbug-cn/yx-$1/yx-$1.vue`
- 这意味着大部分 `yx-*` 组件可以直接在页面模板中使用，无需显式 import。

## 对外接口
已识别到的组件包括：
- `yx-sheet`：统一卡片容器
- `yx-input`：输入包装组件
- `yx-nav-header`：导航标题
- `yx-pillar-picker`：四柱/时间双模式选择器
- `yx-book-tips`：tips 详情弹层
- `yx-pillar-relation`：四柱关系图示弹层
- `yx-coding`：占位/开发中提示组件
- `yx-copyright`：底部版权区块

## 关键依赖与配置
- 依赖 `src/pages.json` 的 easycom 自动映射
- 大量封装建立在 `vk-uview-ui` 之上
- `yx-pillar-picker` 依赖 `lunar-javascript` 进行四柱反查时间
- 多个组件依赖 `src/config` 与 `src/utils` 输出的颜色、路径和格式化方法

## 数据模型
这是展示层组件模块，主要以 props / emits 为主：
- `yx-sheet`：包装 margin、padding、round、bgColor 等布局参数
- `yx-input`：包装 `modelValue`、placeholder、disabled、focus 等输入参数
- `yx-pillar-picker`：接收 `defaultValue`，通过 `confirm` 事件返回匹配时间
- `yx-book-tips`：通过暴露的 `setDetail(type, label)` 方法，从 `tips` store 中按 `label` 查找详情；再把 `tip/formula/func/seek/books` 字段映射成弹层段落列表
- `yx-pillar-relation`：接收 `top` / `bottom` 两组对象；中段展示年/月/日/时柱及流运列标题，上下两段依据 `mark[].index` 计算连线跨度与圆点位置，并通过 `getElAttr()` 映射五行配色
- `yx-coding`：接收 `title`，展示“功能调试中”占位卡片，不提供业务交互

## 测试与质量
- 未发现组件单测或视觉回归测试。
- 已深入扫描的高价值组件：`yx-sheet`、`yx-input`、`yx-nav-header`、`yx-pillar-picker`、`yx-book-tips`、`yx-copyright`、`yx-pillar-relation`、`yx-coding`
- 风险点：
  - `yx-book-tips` 强依赖 `tips` store 已预热且 `label` 唯一匹配；查不到详情时会静默不弹窗
  - `yx-book-tips` 的内容组装逻辑只认 `tip/formula/func/seek/books`，后端新增字段不会自动展示
  - `yx-pillar-relation` 假定 `props.top.list.length` 与 `mark[].index` 一致，索引越界会直接导致连线与圆点错位
  - `yx-coding` 是真实使用中的占位组件，当前在流运神煞区域落地，后续若补全功能需同步替换页面引用，不只是删除组件文件

## 常见问题 (FAQ)
### 为什么模板里直接写 `yx-sheet` / `yx-input` 也能用？
因为 `src/pages.json` 已通过 easycom 配置了 `yx-*` 到本目录的自动映射。

### 四柱关系图示在哪里触发？
由 `src/pages/detail/components/index/basic/components/relation/relation.vue` 通过 `ref` 调用 `yx-pillar-relation` 弹层显示；该组件不是纯静态图，而是基于上下两组关系数据动态绘制连线和圆点。

### `yx-coding` 是死代码吗？
不是。它当前被 `src/pages/detail/components/index/major/major.vue` 用作“流运神煞”区域占位，因此删除或替换前要先处理页面落点。

### 四柱反查逻辑在哪里？
主要在 `yx-pillar-picker.vue` 内，通过 `Solar.fromBaZi()` 把年/月/日/时柱组合反查为可选时间列表。

### 自定义通用组件应该继续放这里吗？
是。只要它不是某个单一页面的私有组件，就优先放在 `src/yxbug-cn` 并保持 `yx-*` 命名风格。

## 相关文件清单
- `src/yxbug-cn/yx-sheet/yx-sheet.vue`
- `src/yxbug-cn/yx-input/yx-input.vue`
- `src/yxbug-cn/yx-nav-header/yx-nav-header.vue`
- `src/yxbug-cn/yx-pillar-picker/yx-pillar-picker.vue`
- `src/yxbug-cn/yx-book-tips/yx-book-tips.vue`
- `src/yxbug-cn/yx-pillar-relation/yx-pillar-relation.vue`
- `src/yxbug-cn/yx-coding/yx-coding.vue`
- `src/yxbug-cn/yx-copyright/yx-copyright.vue`

## 变更记录 (Changelog)
- 2026-04-05 21:09:37：初始化模块文档，补充 easycom 注册方式与核心通用组件职责。
- 2026-04-05 21:09:37：补充 `yx-pillar-relation` 的输入/绘制逻辑、`yx-coding` 的真实使用位置与风险点。
- 2026-04-05 21:09:37：补充 `yx-book-tips` 的 `tips` store 依赖、字段映射规则与静默失败风险。

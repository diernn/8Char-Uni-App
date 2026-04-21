# Basic Table Refactor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将 `src/pages/detail/components/index/basic/components/table/table.vue` 拆成装配层 + helper + cell 组件，在不改变行为的前提下降低模板与脚本复杂度。

**Architecture:** 保留 `table.vue` 作为页面级装配入口，只负责循环渲染、tips 弹层引用与点击转发。把表格行数据组装下沉到 `table-helpers.js`，把单元格分支渲染下沉到 `table-cell.vue`，确保“数据准备”和“视图分支”边界清晰。

**Tech Stack:** Vue 3 `<script setup>`、Uni-App、Pinia、ESLint、Prettier、npm scripts

---

## File Structure

- Modify: `src/pages/detail/components/index/basic/components/table/table.vue`
  - 保留表格外层循环、`yx-book-tips` 挂载、`handleShowTips` 事件转发
- Create: `src/pages/detail/components/index/basic/components/table/table-helpers.js`
  - 定义表头字段、行配置、tips 类型映射、表格数据组装函数
- Create: `src/pages/detail/components/index/basic/components/table/table-cell.vue`
  - 负责 `default / pillar / list` 三类单元格渲染

## Task 1: 抽离基础命盘表格 helper

**Files:**

- Create: `src/pages/detail/components/index/basic/components/table/table-helpers.js`
- Modify: `src/pages/detail/components/index/basic/components/table/table.vue:44-135`
- Test: `src/pages/detail/components/index/basic/components/table/table.vue`

- [ ] **Step 1: 先写失败形态的导入与调用点**

```js
// table.vue
import {
  TABLE_COLUMN_KEYS,
  buildTableRows,
  resolveTipsType,
} from '@/pages/detail/components/index/basic/components/table/table-helpers';

const detail = computed(() => buildTableRows(detailStore));

function handleShowTips(type, label) {
  const tipsType = resolveTipsType(type, label);

  if (tipsType) {
    tips.value.setDetail(tipsType, label);
  }
}
```

- [ ] **Step 2: 运行 lint，确认因为 helper 尚不存在而失败**

Run: `npm run lint -- --format unix`
Expected: FAIL，包含 `table-helpers` import not found 或未定义错误

- [ ] **Step 3: 写最小 helper 实现**

```js
// src/pages/detail/components/index/basic/components/table/table-helpers.js
export const TABLE_COLUMN_KEYS = ['label', 'year', 'month', 'day', 'time'];

export const TABLE_ROW_MAP = [
  { label: '主星', key: 'main' },
  { label: '天干', key: 'top' },
  { label: '地支', key: 'bottom' },
  { label: '藏干', key: 'bottom_hide' },
  { label: '副星', key: 'assiste' },
  { label: '星运', key: 'trend' },
  { label: '自坐', key: 'selfsit' },
  { label: '纳音', key: 'nayin' },
  { label: '空亡', key: 'empty' },
  { label: '神煞', key: 'gods' },
];

export const TABLE_HEADER_ROW = {
  key: 'header',
  type: 'default',
  data: {
    label: '\\',
    year: '年柱',
    month: '月柱',
    day: '日柱',
    time: '时柱',
  },
};

export const TABLE_TIPS_TYPE_MAP = {
  main: 'relation',
  trend: 'trend',
  selfsit: 'trend',
  assiste: 'relation',
  nayin: 'nayin',
  gods: 'gods',
};

const createEmptyRowData = () => ({
  label: '',
  year: '',
  month: '',
  day: '',
  time: '',
});

const resolveRowType = (key) => {
  if (['top', 'bottom'].includes(key)) {
    return 'pillar';
  }

  if (['bottom_hide', 'gods', 'assiste'].includes(key)) {
    return 'list';
  }

  return 'default';
};

const resolveRowSource = (store, key) => {
  if (['main', 'assiste'].includes(key)) {
    return store.start[key];
  }

  return store[key];
};

export const buildTableRows = (detailStore) => {
  const list = [TABLE_HEADER_ROW];

  for (const item of TABLE_ROW_MAP) {
    const data = resolveRowSource(detailStore, item.key) || createEmptyRowData();
    data.label = item.label;

    list.push({
      key: item.key,
      type: resolveRowType(item.key),
      data,
    });
  }

  return list;
};

export const resolveTipsType = (type, label) => {
  if (['元男', '元女'].includes(label)) {
    return '';
  }

  return TABLE_TIPS_TYPE_MAP[type] || '';
};
```

- [ ] **Step 4: 把 `table.vue` 改成使用 helper**

```js
<script setup>
import { computed, ref } from 'vue';
import { useDetailStore } from '@/store/detail';
import {
  TABLE_COLUMN_KEYS,
  buildTableRows,
  resolveTipsType,
} from '@/pages/detail/components/index/basic/components/table/table-helpers';

const detailStore = useDetailStore();
const tips = ref();

const detail = computed(() => buildTableRows(detailStore));

function handleShowTips(type, label) {
  const tipsType = resolveTipsType(type, label);

  if (tipsType) {
    tips.value.setDetail(tipsType, label);
  }
}
</script>
```

- [ ] **Step 5: 运行 lint，确认 helper 拆分通过**

Run: `npm run lint -- --format unix`
Expected: PASS

- [ ] **Step 6: 提交这一小步**

```bash
git add src/pages/detail/components/index/basic/components/table/table.vue src/pages/detail/components/index/basic/components/table/table-helpers.js
git commit -m "refactor: extract basic table helpers"
```

## Task 2: 抽离单元格渲染组件

**Files:**

- Create: `src/pages/detail/components/index/basic/components/table/table-cell.vue`
- Modify: `src/pages/detail/components/index/basic/components/table/table.vue:1-42`
- Test: `src/pages/detail/components/index/basic/components/table/table-cell.vue`

- [ ] **Step 1: 先在模板中替换为新组件引用**

```vue
<template>
  <view>
    <template v-for="(ditem, dindex) in detail" :key="ditem.key || dindex">
      <view class="u-flex u-col-top u-p-y-16" :class="{ 'bg-white': dindex % 2 === 0 }">
        <table-cell
          v-for="(kitem, kindex) in TABLE_COLUMN_KEYS"
          :key="`${ditem.key || dindex}-${kitem}`"
          :cell-key="kitem"
          :cell-index="kindex"
          :row="ditem"
          @show-tips="handleShowTips"
        ></table-cell>
      </view>
    </template>
    <yx-book-tips ref="tips"></yx-book-tips>
  </view>
</template>
```

- [ ] **Step 2: 运行 lint，确认因为 `table-cell.vue` 尚不存在而失败**

Run: `npm run lint -- --format unix`
Expected: FAIL，包含组件解析失败或 import not found

- [ ] **Step 3: 写最小单元格组件实现**

```vue
<template>
  <view :class="[{ left: cellIndex === 0 }, 'item']">
    <text
      v-if="cellIndex === 0 || row.type === 'default'"
      class="yx-text-weight-b"
      @click="emit('show-tips', row.key, row.data[cellKey])"
    >
      {{ row.data[cellKey] }}
    </text>

    <view v-else-if="row.type === 'pillar'" class="u-flex u-row-center u-col-center">
      <view :class="pillarColor" class="yx-text-weight-b u-font-44">
        {{ row.data[cellKey] }}
      </view>
      <view class="u-m-l-4">
        <u-icon :name="iconUrl" :size="40"></u-icon>
      </view>
    </view>

    <view
      v-for="(item, index) in cellList"
      v-else
      :key="`${row.key}-${cellKey}-${item}-${index}`"
      class="yx-text-weight-b u-m-b-8"
      :class="cellClassList(item)"
      @click="emit('show-tips', row.key, item)"
    >
      {{ cellText(item) }}
    </view>
  </view>
</template>

<script setup>
import { computed } from 'vue';
import { getElAttr } from '@/utils/transform';
import { getUrl } from '@/utils/file';

const props = defineProps({
  row: {
    type: Object,
    required: true,
  },
  cellKey: {
    type: String,
    required: true,
  },
  cellIndex: {
    type: Number,
    required: true,
  },
});

const emit = defineEmits(['show-tips']);

const pillarValue = computed(() => props.row.data[props.cellKey]);
const pillarColor = computed(() => [`u-type-${getElAttr(pillarValue.value)}`]);
const iconUrl = computed(() =>
  getUrl(`static/icon/element/${getElAttr(pillarValue.value, 'index')}.svg`)
);
const cellList = computed(() =>
  props.row.type === 'list' ? props.row.data[props.cellKey] || [] : []
);

const cellClassList = (value) => [
  props.row.key === 'bottom_hide' ? `u-type-${getElAttr(value)}` : '',
  props.row.key === 'gods' ? 'u-type-primary' : '',
];

const cellText = (value) => {
  if (props.row.key === 'bottom_hide') {
    return `${value}${getElAttr(value, 'label')}`;
  }

  return value;
};
</script>

<style lang="scss" scoped>
.item {
  width: 22%;
  text-align: center;
}

.left {
  width: 12%;
  text-align: center;
}
</style>
```

- [ ] **Step 4: 清理 `table.vue` 中已下沉的渲染分支和样式**

```vue
<script setup>
import { computed, ref } from 'vue';
import { useDetailStore } from '@/store/detail';
import TableCell from '@/pages/detail/components/index/basic/components/table/table-cell.vue';
import {
  TABLE_COLUMN_KEYS,
  buildTableRows,
  resolveTipsType,
} from '@/pages/detail/components/index/basic/components/table/table-helpers';

const detailStore = useDetailStore();
const tips = ref();

const detail = computed(() => buildTableRows(detailStore));

function handleShowTips(type, label) {
  const tipsType = resolveTipsType(type, label);

  if (tipsType) {
    tips.value.setDetail(tipsType, label);
  }
}
</script>

<style lang="scss" scoped>
.bg-white {
  //background: #ffffff;
  //border: 0px solid rgb(230, 230, 230);
  //box-shadow: rgba(51, 51, 51, 0.07) 0px 0.15625rem 0.375rem;
}
</style>
```

- [ ] **Step 5: 运行 lint 和格式化检查**

Run: `npm run lint -- --format unix && npm run format:check`
Expected: PASS；Prettier 输出 `All matched files use Prettier code style!`

- [ ] **Step 6: 提交这一小步**

```bash
git add src/pages/detail/components/index/basic/components/table/table.vue src/pages/detail/components/index/basic/components/table/table-cell.vue src/pages/detail/components/index/basic/components/table/table-helpers.js
git commit -m "refactor: split basic table cell renderer"
```

## Task 3: 回归验证与编码约束检查

**Files:**

- Modify: `src/pages/detail/components/index/basic/components/table/table.vue`
- Modify: `src/pages/detail/components/index/basic/components/table/table-cell.vue`
- Modify: `src/pages/detail/components/index/basic/components/table/table-helpers.js`
- Test: `package.json`

- [ ] **Step 1: 检查 helper 是否避免直接改写 store 原对象**

```js
// table-helpers.js
const createRowData = (source = {}, label) => ({
  label,
  year: source.year || '',
  month: source.month || '',
  day: source.day || '',
  time: source.time || '',
});

const createListRowData = (source = {}, label) => ({
  label,
  year: source.year || [],
  month: source.month || [],
  day: source.day || [],
  time: source.time || [],
});
```

- [ ] **Step 2: 如果 Task 1 使用了 `data.label = item.label`，改成无副作用版本**

```js
const resolveRowData = (store, item) => {
  const source = resolveRowSource(store, item.key) || {};

  if (resolveRowType(item.key) === 'list') {
    return createListRowData(source, item.label);
  }

  return createRowData(source, item.label);
};

export const buildTableRows = (detailStore) => {
  return [
    TABLE_HEADER_ROW,
    ...TABLE_ROW_MAP.map((item) => ({
      key: item.key,
      type: resolveRowType(item.key),
      data: resolveRowData(detailStore, item),
    })),
  ];
};
```

- [ ] **Step 3: 运行完整验证命令**

Run: `npm run lint -- --format unix && npm run format:check && npm run check:utf8 && npm run build:h5`
Expected: 全部 PASS；`build:h5` 输出 `DONE  Build complete.`

- [ ] **Step 4: 做人工回归检查**

```text
1. 打开结果页 -> 基本命盘 tab
2. 确认“主星 / 天干 / 地支 / 藏干 / 副星 / 星运 / 自坐 / 纳音 / 空亡 / 神煞”顺序不变
3. 确认天干地支彩色字与五行图标仍正常显示
4. 点击 主星 / 副星 / 星运 / 自坐 / 纳音 / 神煞，确认 tips 仍可打开
5. 点击“元男 / 元女”时确认不弹 tips
6. 确认藏干附加五行简称文本仍正常
```

- [ ] **Step 5: 提交最终结果**

```bash
git add src/pages/detail/components/index/basic/components/table/table.vue src/pages/detail/components/index/basic/components/table/table-cell.vue src/pages/detail/components/index/basic/components/table/table-helpers.js
git commit -m "refactor: modularize basic chart table"
```

## Self-Review

- Spec coverage: 已覆盖“helper 下沉、cell 组件拆分、`table.vue` 装配化、行为不变、lint/build/utf8 校验”。
- Placeholder scan: 已移除 TBD/TODO 类占位，所有代码步骤都给出明确文件与代码片段。
- Type consistency: 统一使用 `TABLE_COLUMN_KEYS`、`buildTableRows`、`resolveTipsType`、`handleShowTips`、`TableCell` 命名。

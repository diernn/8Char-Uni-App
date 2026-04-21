# Basic Relation Refactor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将 `src/pages/detail/components/index/basic/components/relation/relation.vue` 拆成装配层 + helper + 摘要子组件，在不改变行为的前提下降低职责耦合与模板复杂度。

**Architecture:** 保留 `relation.vue` 作为结果页 basic 模块关系区装配入口，只负责读取 store、打开 `yx-pillar-relation` 弹层，以及把准备好的摘要数据传给子组件。把摘要去重与弹层数据组装下沉到 `relation-helpers.js`，把单条摘要展示与空态文案下沉到 `relation-summary-item.vue`，确保“数据准备”和“视图展示”边界清晰。

**Tech Stack:** Vue 3 `<script setup>`、Uni-App、Pinia、ESLint、Prettier、npm scripts

---

## File Structure

- Modify: `src/pages/detail/components/index/basic/components/relation/relation.vue`
  - 保留 `yx-sheet`、`yx-pillar-relation`、点击打开弹层的交互
  - 改为只负责 `summaryList` / `relationDetail` 装配与事件转发
- Create: `src/pages/detail/components/index/basic/components/relation/relation-helpers.js`
  - 定义空态文案常量、摘要列表生成函数、弹层数据组装函数
- Create: `src/pages/detail/components/index/basic/components/relation/relation-summary-item.vue`
  - 负责单条“标题 + 内容/空态文案”的纯展示渲染

## Task 1: 抽离关系摘要与弹层数据 helper

**Files:**

- Create: `src/pages/detail/components/index/basic/components/relation/relation-helpers.js`
- Modify: `src/pages/detail/components/index/basic/components/relation/relation.vue:26-69`
- Test: `src/pages/detail/components/index/basic/components/relation/relation.vue`

- [ ] **Step 1: 先写失败形态的导入与调用点**

```vue
<script setup>
import { computed, ref } from 'vue';
import { useDetailStore } from '@/store/detail';
import {
  buildRelationDetail,
  buildRelationSummaryList,
} from '@/pages/detail/components/index/basic/components/relation/relation-helpers';

const detailStore = useDetailStore();
const relationPopupRef = ref();

const summaryList = computed(() => buildRelationSummaryList(detailStore.tb_relation));
const relationDetail = computed(() => buildRelationDetail(detailStore));

const openRelationPopup = () => {
  relationPopupRef.value.showPopup();
};
</script>
```

- [ ] **Step 2: 运行 lint，确认因为 helper 尚不存在而失败**

Run: `npm run lint -- --format unix`
Expected: FAIL，包含 `relation-helpers` import not found 或未定义错误

- [ ] **Step 3: 写最小 helper 实现**

```js
// src/pages/detail/components/index/basic/components/relation/relation-helpers.js
import { PILLAR_FIELD } from '@/config/map';

export const RELATION_EMPTY_TEXT = '无合冲关系';

export const RELATION_SUMMARY_CONFIG = [
  { key: 'top', title: '天干留意' },
  { key: 'bottom', title: '地支留意' },
];

const resolveUniqueTitles = (list = []) => [...new Set(list.map((item) => item.title))];

const buildPillarList = (pillar = {}) => PILLAR_FIELD.map((key) => pillar[key]);

export const buildRelationSummaryList = (tbRelation = {}) => {
  return RELATION_SUMMARY_CONFIG.map((item) => ({
    key: item.key,
    title: item.title,
    contentList: resolveUniqueTitles(tbRelation[item.key] || []),
  }));
};

export const buildRelationDetail = (detailStore) => {
  return {
    top: {
      list: buildPillarList(detailStore.top),
      mark: detailStore.tb_relation.top || [],
    },
    bottom: {
      list: buildPillarList(detailStore.bottom),
      mark: detailStore.tb_relation.bottom || [],
    },
  };
};
```

- [ ] **Step 4: 把 `relation.vue` 改成使用 helper 与语义化命名**

```vue
<script setup>
import { computed, ref } from 'vue';
import { useDetailStore } from '@/store/detail';
import {
  buildRelationDetail,
  buildRelationSummaryList,
} from '@/pages/detail/components/index/basic/components/relation/relation-helpers';

const detailStore = useDetailStore();
const relationPopupRef = ref();

/**
 * 关系区装配层只负责连接 store、准备摘要数据并打开弹层。
 */
const summaryList = computed(() => buildRelationSummaryList(detailStore.tb_relation));
const relationDetail = computed(() => buildRelationDetail(detailStore));

const openRelationPopup = () => {
  relationPopupRef.value.showPopup();
};
</script>
```

- [ ] **Step 5: 运行 lint，确认 helper 拆分通过**

Run: `npm run lint -- --format unix`
Expected: PASS

- [ ] **Step 6: 提交这一小步**

```bash
git add src/pages/detail/components/index/basic/components/relation/relation.vue src/pages/detail/components/index/basic/components/relation/relation-helpers.js
git commit -m "refactor: extract relation helpers"
```

## Task 2: 抽离关系摘要展示子组件

**Files:**

- Create: `src/pages/detail/components/index/basic/components/relation/relation-summary-item.vue`
- Modify: `src/pages/detail/components/index/basic/components/relation/relation.vue:1-25`
- Test: `src/pages/detail/components/index/basic/components/relation/relation-summary-item.vue`

- [ ] **Step 1: 先在模板中替换为新组件引用**

```vue
<template>
  <view>
    <view @click="openRelationPopup">
      <yx-sheet :margin="[30, 20]" :padding="[0, 20]" :round="3" :shadow="2">
        <view class="yx-text-weight-b u-text-center">智能四柱图示</view>
      </yx-sheet>

      <relation-summary-item
        v-for="item in summaryList"
        :key="item.key"
        :title="item.title"
        :content-list="item.contentList"
        :empty-text="RELATION_EMPTY_TEXT"
      ></relation-summary-item>
    </view>

    <yx-pillar-relation
      ref="relationPopupRef"
      :top="relationDetail.top"
      :bottom="relationDetail.bottom"
    ></yx-pillar-relation>
  </view>
</template>
```

- [ ] **Step 2: 运行 lint，确认因为 `relation-summary-item.vue` 尚不存在而失败**

Run: `npm run lint -- --format unix`
Expected: FAIL，包含组件解析失败或 import not found

- [ ] **Step 3: 写最小摘要展示组件实现**

```vue
<template>
  <view class="u-flex u-col-top u-m-x-30 u-m-y-20 box">
    <view class="u-p-y-10 yx-text-weight-b u-text-center left">
      {{ title }}
    </view>
    <view class="u-p-l-10 u-p-r-20 right">
      <text>{{ displayContent }}</text>
    </view>
  </view>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  title: {
    type: String,
    required: true,
  },
  contentList: {
    type: Array,
    default: () => [],
  },
  emptyText: {
    type: String,
    default: '',
  },
});

const displayContent = computed(() => {
  return props.contentList.length > 0 ? props.contentList.join(';') : props.emptyText;
});
</script>

<style lang="scss" scoped>
.box {
  width: 100%;

  .left {
    background: #ffffff;
    border-radius: 6px;
    width: 12%;
    min-width: 6em;
  }

  .right {
    width: 73%;
  }
}
</style>
```

- [ ] **Step 4: 清理 `relation.vue` 中已下沉的摘要模板与样式**

```vue
<script setup>
import { computed, ref } from 'vue';
import { useDetailStore } from '@/store/detail';
import RelationSummaryItem from '@/pages/detail/components/index/basic/components/relation/relation-summary-item.vue';
import {
  buildRelationDetail,
  buildRelationSummaryList,
  RELATION_EMPTY_TEXT,
} from '@/pages/detail/components/index/basic/components/relation/relation-helpers';

const detailStore = useDetailStore();
const relationPopupRef = ref();

/**
 * 关系区装配层只负责连接 store、准备摘要数据并打开弹层。
 */
const summaryList = computed(() => buildRelationSummaryList(detailStore.tb_relation));
const relationDetail = computed(() => buildRelationDetail(detailStore));

const openRelationPopup = () => {
  relationPopupRef.value.showPopup();
};
</script>
```

```vue
<style lang="scss" scoped></style>
```

- [ ] **Step 5: 运行 lint 和格式检查**

Run: `npm run lint -- --format unix && npx prettier --check "src/pages/detail/components/index/basic/components/relation/relation.vue" "src/pages/detail/components/index/basic/components/relation/relation-summary-item.vue" "src/pages/detail/components/index/basic/components/relation/relation-helpers.js"`
Expected: PASS；Prettier 输出 `All matched files use Prettier code style!`

- [ ] **Step 6: 提交这一小步**

```bash
git add src/pages/detail/components/index/basic/components/relation/relation.vue src/pages/detail/components/index/basic/components/relation/relation-summary-item.vue src/pages/detail/components/index/basic/components/relation/relation-helpers.js
git commit -m "refactor: split relation summary renderer"
```

## Task 3: 回归验证与编码约束检查

**Files:**

- Modify: `src/pages/detail/components/index/basic/components/relation/relation.vue`
- Modify: `src/pages/detail/components/index/basic/components/relation/relation-summary-item.vue`
- Modify: `src/pages/detail/components/index/basic/components/relation/relation-helpers.js`
- Test: `package.json`

- [ ] **Step 1: 检查 helper 是否保持纯函数与接口兼容**

```js
// relation-helpers.js
export const buildRelationSummaryList = (tbRelation = {}) => {
  return RELATION_SUMMARY_CONFIG.map((item) => ({
    key: item.key,
    title: item.title,
    contentList: resolveUniqueTitles(tbRelation[item.key] || []),
  }));
};

export const buildRelationDetail = (detailStore) => {
  return {
    top: {
      list: buildPillarList(detailStore.top),
      mark: detailStore.tb_relation.top || [],
    },
    bottom: {
      list: buildPillarList(detailStore.bottom),
      mark: detailStore.tb_relation.bottom || [],
    },
  };
};
```

检查点：
- 不直接改写 `detailStore`、`tb_relation`、`top`、`bottom`
- `yx-pillar-relation` 继续接收 `top: { list, mark } / bottom: { list, mark }`
- 摘要项继续输出 `title` + `contentList`

- [ ] **Step 2: 确认空态文案与拼接规则未变化**

```vue
<!-- relation-summary-item.vue -->
<script setup>
import { computed } from 'vue';

const props = defineProps({
  title: {
    type: String,
    required: true,
  },
  contentList: {
    type: Array,
    default: () => [],
  },
  emptyText: {
    type: String,
    default: '',
  },
});

const displayContent = computed(() => {
  return props.contentList.length > 0 ? props.contentList.join(';') : props.emptyText;
});
</script>
```

检查点：
- 仍使用英文分号 `;`
- `emptyText` 传入值仍为 `无合冲关系`
- “天干留意 / 地支留意”显示顺序由 `RELATION_SUMMARY_CONFIG` 固定

- [ ] **Step 3: 运行完整验证命令**

Run: `npm run lint -- --format unix && npm run check:utf8 && npm run build:h5 && npx prettier --check "src/pages/detail/components/index/basic/components/relation/relation.vue" "src/pages/detail/components/index/basic/components/relation/relation-summary-item.vue" "src/pages/detail/components/index/basic/components/relation/relation-helpers.js"`
Expected: 全部 PASS；`build:h5` 输出 `DONE  Build complete.`；Prettier 输出 `All matched files use Prettier code style!`

- [ ] **Step 4: 做人工回归检查**

```text
1. 打开结果页 -> basic 模块
2. 点击“智能四柱图示”区域，确认 `yx-pillar-relation` 弹层仍能打开
3. 确认摘要区仍显示“天干留意 / 地支留意”两行，顺序不变
4. 当存在关系标题时，确认内容仍按 `;` 拼接显示
5. 当关系标题为空时，确认仍显示“无合冲关系”
6. 确认样式宽度、圆角和原有排版无明显变化
```

- [ ] **Step 5: 提交最终结果**

```bash
git add src/pages/detail/components/index/basic/components/relation/relation.vue src/pages/detail/components/index/basic/components/relation/relation-summary-item.vue src/pages/detail/components/index/basic/components/relation/relation-helpers.js
git commit -m "refactor: modularize basic relation section"
```

## Self-Review

- Spec coverage: 已覆盖“装配层 + helper + 摘要子组件、语义化命名、空态文案保持不变、`yx-pillar-relation` 接口兼容、lint/utf8/build/prettier/人工回归”全部要求。
- Placeholder scan: 已移除 TBD/TODO 类占位，所有代码步骤都给出明确文件、代码片段与验证命令。
- Type consistency: 统一使用 `summaryList`、`relationDetail`、`relationPopupRef`、`openRelationPopup`、`buildRelationSummaryList`、`buildRelationDetail`、`RELATION_EMPTY_TEXT`、`RelationSummaryItem` 命名。

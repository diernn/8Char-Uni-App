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
      :class="getCellClassList(item)"
      @click="emit('show-tips', row.key, item)"
    >
      {{ getCellText(item) }}
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

/**
 * 当前单元格的渲染值由行类型决定：普通文本、干支图标或多值列表。
 */
const pillarValue = computed(() => props.row.data[props.cellKey]);
const pillarColor = computed(() => [`u-type-${getElAttr(pillarValue.value)}`]);
const iconUrl = computed(() =>
  getUrl(`static/icon/element/${getElAttr(pillarValue.value, 'index')}.svg`)
);
const cellList = computed(() =>
  props.row.type === 'list' ? props.row.data[props.cellKey] || [] : []
);

const getCellClassList = (value) => [
  props.row.key === 'bottom_hide' ? `u-type-${getElAttr(value)}` : '',
  props.row.key === 'gods' ? 'u-type-primary' : '',
];

const getCellText = (value) => {
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

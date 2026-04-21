<template>
  <view>
    <template v-for="(ditem, dindex) in detail" :key="ditem.key || dindex">
      <view class="u-flex u-col-top u-p-y-16" :class="{ 'bg-white': dindex % 2 === 0 }">
        <table-cell
          v-for="(cellKey, cellIndex) in TABLE_COLUMN_KEYS"
          :key="`${ditem.key || dindex}-${cellKey}`"
          :row="ditem"
          :cell-key="cellKey"
          :cell-index="cellIndex"
          @show-tips="showTips"
        />
      </view>
    </template>
    <yx-book-tips ref="tips"></yx-book-tips>
  </view>
</template>

<script setup>
import { computed, ref } from 'vue';
import { useDetailStore } from '@/store/detail';
import TableCell from '@/pages/detail/components/index/basic/components/table/table-cell.vue';
import {
  buildTableRows,
  resolveTipsType,
  TABLE_COLUMN_KEYS,
} from '@/pages/detail/components/index/basic/components/table/table-helpers';

const detailStore = useDetailStore();
const tips = ref();

/**
 * 基础命盘主表只负责装配行列数据与 tips 事件分发。
 */
const detail = computed(() => buildTableRows(detailStore));

function showTips(type, label) {
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

<template>
  <view>
    <yx-sheet :margin="[0, 0, 0, 10]" :padding="[20, 0]">
      <view v-for="(item, itemIndex) in topDetail" :key="`top-${item.type}-${itemIndex}`">
        <view class="u-flex" style="width: 100%; align-items: stretch">
          <view
            v-for="(ditem, dindex) in item.data"
            :key="`top-${item.type}-${ditem}-${dindex}`"
            class="u-text-center"
            :class="[
              dindex === 4 ? 'yx-border-left' : '',
              item.type === 'title' ? 'u-p-y-10' : 'u-p-y-5',
            ]"
            :style="{ width: cellItemWidth }"
          >
            <view
              class="u-col-center u-row-center yx-text-weight-b"
              :class="[
                item.type === 'title' ? 'u-tips-color' : '',
                item.type === 'pillar' ? 'u-font-40' : '',
                item.type === 'pillar' ? `u-type-${getElAttr(ditem)}` : '',
              ]"
              @click="showTips(item.type, ditem)"
              >{{ ditem }}</view
            >
          </view>
        </view>
      </view>
    </yx-sheet>

    <view class="u-m-y-10 u-m-x-20">
      <view class="u-flex u-flex-1 u-col-top">
        <view
          v-for="(item, itemIndex) in hideList"
          :key="`hide-${itemIndex}`"
          :style="{ width: cellItemWidth }"
          class="u-text-center"
        >
          <view
            v-for="(zitem, zindex) in item"
            :key="`hide-${itemIndex}-${zitem.label[0]}-${zindex}`"
            :class="['u-m-y-8', `u-font-${cellHideTopWidth}`, `u-type-${zitem.type}`]"
            class="yx-text-weight-b"
            @click="showTips('relation', zitem.label[1])"
            >{{ zitem.label[0] }}</view
          >
        </view>
      </view>
    </view>

    <yx-sheet :margin="[0, 0]" :padding="[20, 0]">
      <view v-for="(item, index) in bottomDetail" :key="`bottom-${item.type}-${index}`">
        <view class="u-flex" style="align-items: stretch">
          <view
            v-for="(ditem, dindex) in item.data"
            :key="`bottom-${item.type}-${ditem}-${dindex}`"
            :class="[
              index === 0 ? 'u-p-t-20' : '',
              index === 3 ? 'u-p-b-20' : '',
              dindex === 4 ? 'yx-border-left' : '',
            ]"
            :style="{ width: cellItemWidth }"
            class="u-text-center u-p-y-8"
          >
            <view
              class="u-font-20 u-col-center u-row-center yx-text-weight-b"
              @click="showTips(item.type, ditem)"
            >
              {{ ditem }}
            </view>
          </view>
        </view>
      </view>
    </yx-sheet>
    <yx-book-tips ref="tips"></yx-book-tips>
  </view>
</template>

<script setup>
import { computed, ref } from 'vue';
import { getElAttr, getRelation } from '@/utils/transform';
import { useDetailStore } from '@/store/detail';
import { PILLAR_FIELD, TEND_STORE_FIELD } from '@/config/map';
import { useTendStore } from '@/store/tend';
import {
  buildBottomDetail,
  buildHideList,
  buildTopDetail,
  createCellHideTopWidth,
} from './detail-helpers';

const tips = ref();
const tendStore = useTendStore();
const detailStore = useDetailStore();

const fieldListKey = TEND_STORE_FIELD.map((item) => item.list);
const fieldIndexKey = TEND_STORE_FIELD.map((item) => item.index);

const getListByLevel = (level) => tendStore[fieldListKey[level]];
const getIndexByLevel = (level) => tendStore[fieldIndexKey[level]];
const getPillarFieldValue = (index) => {
  const key = PILLAR_FIELD[index];
  return key.charAt(0).toUpperCase() + key.slice(1);
};

const cellItemWidth = computed(() => `${100 / tendStore.rowNum}%`);
const cellHideTopWidth = computed(() => createCellHideTopWidth(tendStore.rowNum));

const topDetail = computed(() => {
  return buildTopDetail({
    PILLAR_FIELD,
    rowNum: tendStore.rowNum,
    detailStore,
    getListByLevel,
    getIndexByLevel,
    getRelation,
  });
});

const hideList = computed(() => {
  return buildHideList({
    PILLAR_FIELD,
    detailStore,
    rowNum: tendStore.rowNum,
    getListByLevel,
    getIndexByLevel,
    getRelation,
    getElAttr,
  });
});

const bottomDetail = computed(() => {
  return buildBottomDetail({
    PILLAR_FIELD,
    detailStore,
    tendStore,
    rowNum: tendStore.rowNum,
    getListByLevel,
    getIndexByLevel,
    getPillarFieldValue,
  });
});

function showTips(type, label) {
  const white = ['trend', 'relation', 'nayin'];
  if (white.includes(type) && !['元男', '元女'].includes(label)) {
    tips.value.setDetail(type, label);
  }
}
</script>

<style lang="scss" scoped>
.yx-border-left {
  border-left: solid 0.125rem #f5f5f5;
}
</style>

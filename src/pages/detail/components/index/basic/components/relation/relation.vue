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
      />
    </view>

    <yx-pillar-relation
      ref="relationPopupRef"
      :top="relationDetail.top"
      :bottom="relationDetail.bottom"
    />
  </view>
</template>

<script setup>
import { computed, ref } from 'vue';
import { useDetailStore } from '@/store/detail';
import RelationSummaryItem from './relation-summary-item.vue';
import {
  buildRelationDetail,
  buildRelationSummaryList,
  RELATION_EMPTY_TEXT,
} from './relation-helpers';

const detailStore = useDetailStore();
const relationPopupRef = ref();

const summaryList = computed(() => buildRelationSummaryList(detailStore.tb_relation));
const relationDetail = computed(() =>
  buildRelationDetail({
    topPillar: detailStore.top,
    bottomPillar: detailStore.bottom,
    topRelation: detailStore.tb_relation?.top,
    bottomRelation: detailStore.tb_relation?.bottom,
  })
);

const openRelationPopup = () => {
  relationPopupRef.value?.showPopup();
};
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

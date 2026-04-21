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

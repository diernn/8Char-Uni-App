<template>
  <view class="u-flex">
    <view
      v-for="(item, index) in props.detail"
      :key="`${item}-${index}`"
      :class="className"
      class="u-m-b-10"
    >
      <text class="yx-text-weight-b u-font-24">{{ item }}</text>
    </view>
  </view>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  detail: {
    type: Array,
    default: () => [],
  },
});

const className = computed(() => {
  const num = props.detail.length ? Math.floor(12 / props.detail.length) : 1;
  return [`u-flex-${num}`];
});
</script>

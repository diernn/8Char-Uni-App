<template>
  <yx-sheet v-if="state.resultText" :margin="[32, 0, 32, 32]" :round="3">
    <view class="ai-page__result-head">
      <view class="ai-page__header ai-page__header--result">
        <text class="ai-page__title ai-page__title--small">解读结果</text>
        <text class="ai-page__desc">以下内容由 AI 基于当前排盘数据生成，仅供学习研究参考。</text>
      </view>
      <view class="ai-page__flag">AI 生成</view>
    </view>

    <view class="ai-page__toolbar">
      <u-button plain size="mini" type="primary" @click="$emit('copy')">复制全文</u-button>
      <u-button :loading="state.loading" size="mini" type="primary" @click="$emit('regenerate')"
        >重新生成</u-button
      >
    </view>

    <view class="ai-page__summary">
      <text class="ai-page__summary-label">解读摘要</text>
      <text class="ai-page__summary-content">{{ state.summaryText }}</text>
    </view>

    <view class="ai-page__meta">
      <view class="ai-page__meta-item">
        <text class="ai-page__meta-label">命主</text>
        <text class="ai-page__meta-value">{{ form.realname || '不知名网友' }}</text>
      </view>
      <view class="ai-page__meta-item">
        <text class="ai-page__meta-label">性别</text>
        <text class="ai-page__meta-value">{{ form.gender === 1 ? '男' : '女' }}</text>
      </view>
      <view class="ai-page__meta-item ai-page__meta-item--full">
        <text class="ai-page__meta-label">出生地</text>
        <text class="ai-page__meta-value">{{ form.birthRegionLabel }}</text>
      </view>
      <view class="ai-page__meta-item ai-page__meta-item--full">
        <text class="ai-page__meta-label">出生时间</text>
        <text class="ai-page__meta-value">{{ form.datetimeLabel }}</text>
      </view>
    </view>

    <view
      v-for="(item, index) in state.resultSections"
      :key="item.title + item.content + index"
      class="ai-page__section"
    >
      <view class="ai-page__section-head">
        <view class="ai-page__section-index">{{ index + 1 }}</view>
        <text class="ai-page__section-title">{{ item.title }}</text>
      </view>
      <text class="ai-page__section-content" decode>{{ item.content }}</text>
    </view>

    <view class="ai-page__notice">
      <text class="ai-page__notice-text"
        >提示：AI 结果会受模型能力、出生地信息完整度和排盘数据影响，请结合实际情况理性参考。</text
      >
    </view>
  </yx-sheet>
</template>

<script setup>
/**
 * AI 解读结果卡片。
 * 这里只负责结果展示与复制/重新生成事件分发，不直接参与请求和数据组装。
 */
defineProps({
  form: {
    type: Object,
    required: true,
  },
  state: {
    type: Object,
    required: true,
  },
});

defineEmits(['copy', 'regenerate']);
</script>

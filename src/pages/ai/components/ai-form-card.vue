<template>
  <yx-sheet :margin="[32, 24]" :round="3">
    <view class="ai-page__header">
      <text class="ai-page__title">AI 命理解读</text>
      <text class="ai-page__desc"
        >结合排盘、流运、古籍与出生地信息，生成更具体的佩戴、颜色与近期建议。</text
      >
    </view>

    <u-form :model="form">
      <u-form-item :border-bottom="false">
        <yx-input v-model="realname" border placeholder="请输入姓名（可空）">
          <template #icon>
            <u-icon name="account-fill"></u-icon>
          </template>
        </yx-input>
      </u-form-item>

      <u-form-item :border-bottom="false">
        <u-radio-group v-model="gender">
          <u-radio v-for="item in options.gender" :key="item.value" :name="item.value">{{
            item.label
          }}</u-radio>
        </u-radio-group>
      </u-form-item>

      <u-form-item :border-bottom="false">
        <yx-input
          :model-value="form.datetimeLabel"
          margin="12"
          disabled
          placeholder="请选择阳历出生时间"
          @click="$emit('select-time')"
        >
          <template #icon>
            <u-icon name="calendar-fill"></u-icon>
          </template>
        </yx-input>
      </u-form-item>

      <u-form-item v-if="form.lunarLabel" :border-bottom="false">
        <yx-input :model-value="form.lunarLabel" margin="12" disabled>
          <template #icon>
            <u-icon name="tags-fill"></u-icon>
          </template>
        </yx-input>
      </u-form-item>

      <u-form-item :border-bottom="false">
        <u-radio-group v-model="sect">
          <u-radio v-for="item in options.sect" :key="item.value" :name="item.value">{{
            item.label
          }}</u-radio>
        </u-radio-group>
      </u-form-item>

      <u-form-item :border-bottom="false">
        <yx-input
          :model-value="form.birthRegionLabel"
          border
          disabled
          placeholder="请选择出生地（省/市/区）"
          @click="$emit('select-region')"
        >
          <template #icon>
            <u-icon name="map-fill"></u-icon>
          </template>
        </yx-input>
      </u-form-item>

      <u-button :loading="loading" class="u-m-t-10" type="primary" @click="$emit('submit')"
        >生成 AI 解读</u-button
      >
    </u-form>
  </yx-sheet>
</template>

<script setup>
import { computed } from 'vue';

/**
 * AI 解读页表单卡片。
 * 只负责展示输入项与派发表单事件，真实状态统一交给页面装配层维护。
 */
const props = defineProps({
  form: {
    type: Object,
    required: true,
  },
  options: {
    type: Object,
    required: true,
  },
  loading: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits([
  'select-time',
  'select-region',
  'submit',
  'update:realname',
  'update:gender',
  'update:sect',
]);

const realname = computed({
  get: () => props.form.realname,
  set: (value) => emit('update:realname', value),
});

const gender = computed({
  get: () => props.form.gender,
  set: (value) => emit('update:gender', value),
});

const sect = computed({
  get: () => props.form.sect,
  set: (value) => emit('update:sect', value),
});
</script>

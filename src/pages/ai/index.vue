<template>
  <view class="ai-page">
    <u-navbar :is-back="true" title="AI 命理解读" title-bold title-color="#333333"></u-navbar>

    <view class="ai-page__body">
      <ai-form-card
        :form="form"
        :loading="state.loading"
        :options="options"
        @select-time="SelectTime"
        @select-region="SelectRegion"
        @submit="Submit"
        @update:realname="form.realname = $event"
        @update:gender="form.gender = $event"
        @update:sect="form.sect = $event"
      ></ai-form-card>

      <ai-result-card
        :form="form"
        :state="state"
        @copy="CopyResult"
        @regenerate="Regenerate"
      ></ai-result-card>
    </view>

    <u-picker
      v-model="solarSelectShow"
      :params="options.timePicker"
      :default-time="form.defaultTime"
      mode="time"
      start-year="1900"
      end-year="2100"
      @confirm="SolarConfirm"
    ></u-picker>

    <u-picker
      v-model="regionSelectShow"
      :params="options.regionPicker"
      :default-region="form.defaultRegion"
      mode="region"
      title="请选择出生地"
      @confirm="RegionConfirm"
    ></u-picker>
  </view>
</template>

<script setup>
import { reactive, ref } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import { GetAIInterpretation } from '@/api/ai';
import { getLocalStorage, setLocalStorage } from '@/utils/cache';
import { prepareChart } from '@/utils/chart';
import { useBookStore } from '@/store/book';
import { useDetailStore } from '@/store/detail';
import { useTendStore } from '@/store/tend';
import AiFormCard from './components/ai-form-card.vue';
import AiResultCard from './components/ai-result-card.vue';
import {
  AI_REGION_CACHE_KEY,
  applyRegion,
  buildInstruction,
  createAIForm,
  createAIOptions,
  createAIState,
  fillBaseForm,
  getErrorMessage,
  getSummaryText,
  parseResultSections,
  updateDatetimeLabel,
} from './ai-helpers';

const options = reactive(createAIOptions());
const form = reactive(createAIForm());
const state = reactive(createAIState());

const solarSelectShow = ref(false);
const regionSelectShow = ref(false);

const detailStore = useDetailStore();
const bookStore = useBookStore();
const tendStore = useTendStore();

const loadRegionCache = () => {
  const raw = getLocalStorage(AI_REGION_CACHE_KEY);
  if (!raw) {
    return;
  }

  try {
    applyRegion(form, JSON.parse(raw));
  } catch (error) {
    applyRegion(form, null);
  }
};

const saveRegionCache = () => {
  setLocalStorage(
    AI_REGION_CACHE_KEY,
    JSON.stringify({
      birthProvince: form.birthProvince,
      birthCity: form.birthCity,
      birthDistrict: form.birthDistrict,
    })
  );
};

const buildProfile = () => {
  return {
    姓名: form.realname || '不知名网友',
    性别: form.gender === 1 ? '男' : '女',
    阳历出生时间: form.datetimeLabel,
    阴历出生时间: form.lunarLabel,
    出生地: form.birthRegionLabel,
    晚子时流派: form.sect === 1 ? '晚子时日柱算明天' : '晚子时日柱算当天',
  };
};

const buildChart = () => {
  return {
    阳历: detailStore.datetime?.solar || form.datetimeLabel,
    阴历: detailStore.datetime?.lunar || form.lunarLabel,
    四柱天干: detailStore.top,
    四柱地支: detailStore.bottom,
    十神: detailStore.start,
    藏干: detailStore.bottom_hide,
    纳音: detailStore.nayin,
    星运: detailStore.trend,
    空亡: detailStore.empty,
    神煞: detailStore.gods,
    五行: detailStore.element,
    起运: {
      文案: detailStore.startTendDate,
      数据: detailStore.start_tend,
    },
    大运: tendStore.dayunList,
    流年: tendStore.yearList,
    流月: tendStore.monthList,
    称骨: bookStore.weigh_bone,
    古籍参考: bookStore.books,
    出生地拆分: {
      省: form.birthProvince,
      市: form.birthCity,
      区县: form.birthDistrict,
    },
  };
};

onLoad((query) => {
  let cache = null;
  const raw = getLocalStorage('info');
  if (raw) {
    try {
      cache = JSON.parse(raw);
    } catch (error) {
      cache = null;
    }
  }

  const fallback = detailStore.timestamp
    ? {
        realname: detailStore.realname,
        gender: detailStore.gender,
        sect: detailStore.sect,
        timestamp: detailStore.timestamp,
      }
    : cache;

  const nextPayload = fallback ? { ...fallback } : {};

  if (query.time) {
    nextPayload.timestamp = Number(query.time);
  }

  if (query.gender) {
    nextPayload.gender = Number(query.gender) === 1 ? 1 : 2;
  }

  fillBaseForm(form, nextPayload);
  loadRegionCache();
});

function SelectTime() {
  solarSelectShow.value = true;
}

function SelectRegion() {
  regionSelectShow.value = true;
}

function SolarConfirm(params) {
  const { year, month, day, hour, minute } = params;
  const time = `${year}/${month}/${day} ${hour}:${minute}`;
  form.timestamp = new Date(time).getTime();
  updateDatetimeLabel(form);
}

function RegionConfirm(params) {
  applyRegion(form, {
    birthProvince: params.province?.name || '',
    birthCity: params.city?.name || '',
    birthDistrict: params.area?.name || '',
  });
  saveRegionCache();
}

async function RunAIInterpretation() {
  await prepareChart({
    realname: form.realname,
    timestamp: form.timestamp,
    gender: form.gender,
    sect: form.sect,
  });

  const result = await GetAIInterpretation({
    profile: buildProfile(),
    chart: buildChart(),
    instruction: buildInstruction(),
  });

  const sections = parseResultSections(result.content);
  state.resultText = result.content;
  state.resultSections = sections;
  state.summaryText = getSummaryText(result.content, sections);
}

async function Submit() {
  if (!form.timestamp) {
    SelectTime();
    return;
  }

  if (!form.birthRegionLabel.trim()) {
    uni.$u.toast('请选择出生地');
    return;
  }

  state.loading = true;
  uni.showLoading({
    title: 'AI 解读中！',
  });

  try {
    await RunAIInterpretation();
  } catch (error) {
    setTimeout(() => {
      uni.$u.toast(getErrorMessage(error), 3000);
    }, 300);
  } finally {
    state.loading = false;
    uni.hideLoading();
  }
}

function Regenerate() {
  Submit();
}

function CopyResult() {
  if (!state.resultText) {
    uni.$u.toast('暂无可复制内容');
    return;
  }

  uni.setClipboardData({
    data: state.resultText,
    success() {
      uni.$u.toast('解读内容已复制');
    },
  });
}
</script>

<style scoped>
.ai-page {
  min-height: 100vh;
  background: linear-gradient(180deg, #f5f7ff 0%, #f7f8fb 100%);
}

.ai-page__body {
  padding-bottom: 32rpx;
}

.ai-page__header {
  display: flex;
  flex-direction: column;
}

.ai-page__header--result {
  flex: 1;
}

.ai-page__title {
  font-size: 34rpx;
  font-weight: 700;
  color: #1f2937;
}

.ai-page__title--small {
  font-size: 30rpx;
}

.ai-page__desc {
  margin-top: 12rpx;
  font-size: 24rpx;
  line-height: 1.7;
  color: #6b7280;
}

.ai-page__result-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 20rpx;
}

.ai-page__flag {
  flex-shrink: 0;
  padding: 8rpx 18rpx;
  border-radius: 999rpx;
  background: rgba(41, 121, 255, 0.12);
  font-size: 22rpx;
  color: #2979ff;
}

.ai-page__toolbar {
  display: flex;
  justify-content: flex-end;
  gap: 16rpx;
  margin-top: 20rpx;
}

.ai-page__summary {
  margin-top: 24rpx;
  padding: 24rpx;
  border-radius: 20rpx;
  background: linear-gradient(135deg, rgba(41, 121, 255, 0.08), rgba(80, 160, 255, 0.14));
}

.ai-page__summary-label {
  display: block;
  font-size: 24rpx;
  font-weight: 700;
  color: #2979ff;
}

.ai-page__summary-content {
  display: block;
  margin-top: 12rpx;
  font-size: 26rpx;
  line-height: 1.85;
  color: #1f2937;
}

.ai-page__meta {
  display: flex;
  flex-wrap: wrap;
  gap: 16rpx;
  margin-top: 24rpx;
}

.ai-page__meta-item {
  width: calc(50% - 8rpx);
  padding: 20rpx;
  border-radius: 18rpx;
  background: #f8fafc;
}

.ai-page__meta-item--full {
  width: 100%;
}

.ai-page__meta-label {
  display: block;
  font-size: 22rpx;
  color: #6b7280;
}

.ai-page__meta-value {
  display: block;
  margin-top: 8rpx;
  font-size: 25rpx;
  line-height: 1.7;
  color: #111827;
}

.ai-page__section {
  margin-top: 24rpx;
  padding: 24rpx;
  border: 1px solid #eef2f7;
  border-radius: 20rpx;
  background: #ffffff;
}

.ai-page__section-head {
  display: flex;
  align-items: center;
  gap: 16rpx;
}

.ai-page__section-index {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40rpx;
  height: 40rpx;
  border-radius: 50%;
  background: #2979ff;
  font-size: 22rpx;
  font-weight: 700;
  color: #ffffff;
}

.ai-page__section-title {
  flex: 1;
  font-size: 28rpx;
  font-weight: 700;
  color: #111827;
}

.ai-page__section-content {
  display: block;
  margin-top: 16rpx;
  font-size: 26rpx;
  line-height: 1.9;
  color: #374151;
  white-space: pre-wrap;
}

.ai-page__notice {
  margin-top: 24rpx;
  padding: 20rpx 24rpx;
  border-radius: 18rpx;
  background: #fff8e8;
}

.ai-page__notice-text {
  font-size: 24rpx;
  line-height: 1.8;
  color: #9a6700;
}

.u-form-item {
  padding: 12rpx 0;
}
</style>

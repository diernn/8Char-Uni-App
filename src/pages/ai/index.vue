<template>
  <view class="ai-page">
    <u-navbar :is-back="true" title="AI 命理解读" title-bold title-color="#333333"></u-navbar>

    <view class="ai-page__body">
      <yx-sheet :margin="[32, 24]" :round="3">
        <view class="ai-page__header">
          <text class="ai-page__title">AI 命理解读</text>
          <text class="ai-page__desc">结合排盘、流运、古籍与出生地信息，生成更具体的佩戴、颜色与近期建议。</text>
        </view>

        <u-form :model="form">
          <u-form-item :border-bottom="false">
            <yx-input v-model="form.realname" border placeholder="请输入姓名（可空）">
              <template #icon>
                <u-icon name="account-fill"></u-icon>
              </template>
            </yx-input>
          </u-form-item>

          <u-form-item :border-bottom="false">
            <u-radio-group v-model="form.gender">
              <u-radio v-for="item in options.gender" :key="item.value" :name="item.value">{{ item.label }}</u-radio>
            </u-radio-group>
          </u-form-item>

          <u-form-item :border-bottom="false">
            <yx-input v-model="form.datetimeLabel" margin="12" disabled placeholder="请选择阳历出生时间" @click="SelectTime">
              <template #icon>
                <u-icon name="calendar-fill"></u-icon>
              </template>
            </yx-input>
          </u-form-item>

          <u-form-item v-if="form.lunarLabel" :border-bottom="false">
            <yx-input v-model="form.lunarLabel" margin="12" disabled>
              <template #icon>
                <u-icon name="tags-fill"></u-icon>
              </template>
            </yx-input>
          </u-form-item>

          <u-form-item :border-bottom="false">
            <u-radio-group v-model="form.sect">
              <u-radio v-for="item in options.sect" :key="item.value" :name="item.value">{{ item.label }}</u-radio>
            </u-radio-group>
          </u-form-item>

          <u-form-item :border-bottom="false">
            <yx-input v-model="form.birthRegionLabel" border disabled placeholder="请选择出生地（省/市/区）" @click="SelectRegion">
              <template #icon>
                <u-icon name="map-fill"></u-icon>
              </template>
            </yx-input>
          </u-form-item>

          <u-button :loading="state.loading" class="u-m-t-10" type="primary" @click="Submit">生成 AI 解读</u-button>
        </u-form>
      </yx-sheet>

      <yx-sheet v-if="state.resultText" :margin="[32, 0, 32, 32]" :round="3">
        <view class="ai-page__result-head">
          <view class="ai-page__header ai-page__header--result">
            <text class="ai-page__title ai-page__title--small">解读结果</text>
            <text class="ai-page__desc">以下内容由 AI 基于当前排盘数据生成，仅供学习研究参考。</text>
          </view>
          <view class="ai-page__flag">AI 生成</view>
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

        <view v-for="(item, index) in state.resultSections" :key="item.title + item.content + index" class="ai-page__section">
          <view class="ai-page__section-head">
            <view class="ai-page__section-index">{{ index + 1 }}</view>
            <text class="ai-page__section-title">{{ item.title }}</text>
          </view>
          <text class="ai-page__section-content" decode>{{ item.content }}</text>
        </view>

        <view class="ai-page__notice">
          <text class="ai-page__notice-text">提示：AI 结果会受模型能力、出生地信息完整度和排盘数据影响，请结合实际情况理性参考。</text>
        </view>
      </yx-sheet>
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
import { Solar } from 'lunar-javascript';
import { GetAIInterpretation } from '@/api/ai';
import { getLocalStorage } from '@/utils/cache';
import { CHART_PREPARE_ERROR, prepareChart } from '@/utils/chart';
import { timeFormat } from '@/utils/transform';
import { useBookStore } from '@/store/book';
import { useDetailStore } from '@/store/detail';
import { useTendStore } from '@/store/tend';

const options = ref({
  gender: [{ value: 1, label: '男' }, { value: 2, label: '女' }],
  sect: [{ value: 1, label: '晚子时日柱算明天' }, { value: 2, label: '晚子时日柱算当天' }],
  timePicker: {
    year: true,
    month: true,
    day: true,
    hour: true,
    minute: true,
    second: false,
  },
  regionPicker: {
    province: true,
    city: true,
    area: true,
  },
});

const form = reactive({
  realname: '',
  gender: 1,
  sect: 1,
  timestamp: null,
  defaultTime: '2001-01-01 00:00:00',
  datetimeLabel: '',
  lunarLabel: '',
  birthProvince: '',
  birthCity: '',
  birthDistrict: '',
  birthRegionLabel: '',
  defaultRegion: [],
});

const state = reactive({
  loading: false,
  resultText: '',
  summaryText: '',
  resultSections: [],
});

const solarSelectShow = ref(false);
const regionSelectShow = ref(false);

const detailStore = useDetailStore();
const bookStore = useBookStore();
const tendStore = useTendStore();

const headingRegExp = /^(#{1,6}\s*.+|(?:\d+[、.]|[一二三四五六七八九十]+[、.]|（[一二三四五六七八九十]+）).+)$/;

const buildInstruction = () => {
  return [
    '请根据以下结构化排盘数据，给出中文、专业、具体、可执行的命理解读。',
    '输出时请至少覆盖以下主题：',
    '1. 五行属性与整体格局判断',
    '2. 日主、身强身弱、喜用神、忌用神',
    '3. 适合佩戴的首饰材质、颜色、数量、珠子尺寸、搭配建议',
    '4. 左手、右手、胸前分别适合佩戴什么，以及原因',
    '5. 适合的颜色、忌用颜色，以及日常穿搭建议',
    '6. 结合大运流年给出近期需要注意的方向',
    '7. 补充你认为重要但用户未主动提及的建议',
    '请尽量按标题分节输出，每节给出明确结论和原因，避免空泛表述。',
  ].join('\n');
};

const getErrorMessage = error => {
  const map = {
    [CHART_PREPARE_ERROR.GET_INFO]: '获取命盘信息失败！',
    [CHART_PREPARE_ERROR.GET_BOOK]: '获取命盘古籍失败！',
    LLM_API_URL_MISSING: '请先配置 VITE_LLM_API_URL',
    LLM_API_KEY_MISSING: '请先配置 VITE_LLM_API_KEY',
    LLM_MODEL_MISSING: '请先配置 VITE_LLM_MODEL',
    LLM_RESPONSE_EMPTY: 'AI 暂未返回有效内容，请稍后重试',
  };

  return map[error?.message] || error?.msg || 'AI 解读生成失败，请稍后重试';
};

const cleanHeadingText = text => {
  return text
    .replace(/^#{1,6}\s*/, '')
    .replace(/^\d+[、.]\s*/, '')
    .replace(/^[一二三四五六七八九十]+[、.]\s*/, '')
    .replace(/^（[一二三四五六七八九十]+）\s*/, '')
    .trim();
};

const parseResultSections = content => {
  const lines = content
    .replace(/\r/g, '')
    .split('\n')
    .map(item => item.trim());

  const sections = [];
  let current = null;

  const pushCurrent = () => {
    if (!current) {
      return;
    }

    const contentText = current.lines.join('\n').replace(/\n{3,}/g, '\n\n').trim();
    if (!contentText) {
      return;
    }

    sections.push({
      title: current.title || `解读 ${sections.length + 1}`,
      content: contentText,
    });
  };

  lines.forEach(line => {
    if (!line) {
      if (current?.lines?.length) {
        current.lines.push('');
      }
      return;
    }

    if (headingRegExp.test(line)) {
      pushCurrent();
      current = {
        title: cleanHeadingText(line),
        lines: [],
      };
      return;
    }

    if (!current) {
      current = {
        title: '综合解读',
        lines: [],
      };
    }

    current.lines.push(line.replace(/^[-*•]\s*/, '• '));
  });

  pushCurrent();

  if (sections.length) {
    return sections;
  }

  const blocks = content
    .replace(/\r/g, '')
    .split(/\n\s*\n/)
    .map(item => item.trim())
    .filter(Boolean);

  return blocks.map((item, index) => ({
    title: `解读 ${index + 1}`,
    content: item,
  }));
};

const getSummaryText = (content, sections) => {
  const summarySource = sections[0]?.content || content || '';
  return summarySource.replace(/\s+/g, ' ').slice(0, 120);
};

const updateDatetimeLabel = () => {
  if (!form.timestamp) {
    form.datetimeLabel = '';
    form.lunarLabel = '';
    return;
  }

  const solar = Solar.fromDate(new Date(form.timestamp));
  const lunar = solar.getLunar();
  form.datetimeLabel = timeFormat(form.timestamp);
  form.lunarLabel = `${lunar.toString()} ${lunar.getTimeZhi()}时`;
  form.defaultTime = uni.$u.date(form.timestamp, 'yyyy-mm-dd hh:MM:ss');
};

const fillBaseForm = payload => {
  if (!payload) {
    updateDatetimeLabel();
    return;
  }

  form.realname = payload.realname || '';
  form.gender = Number(payload.gender) === 1 ? 1 : 2;
  form.sect = payload.sect ?? 1;
  form.timestamp = payload.timestamp ? Number(payload.timestamp) : null;
  updateDatetimeLabel();
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

  const fallback = detailStore.timestamp ? {
    realname: detailStore.realname,
    gender: detailStore.gender,
    sect: detailStore.sect,
    timestamp: detailStore.timestamp,
  } : cache;

  const nextPayload = fallback ? {
    ...fallback,
  } : {};

  if (query.time) {
    nextPayload.timestamp = Number(query.time);
  }

  if (query.gender) {
    nextPayload.gender = Number(query.gender) === 1 ? 1 : 2;
  }

  fillBaseForm(nextPayload);
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
  updateDatetimeLabel();
}

function RegionConfirm(params) {
  form.birthProvince = params.province?.name || '';
  form.birthCity = params.city?.name || '';
  form.birthDistrict = params.area?.name || '';
  form.defaultRegion = [form.birthProvince, form.birthCity, form.birthDistrict].filter(Boolean);
  form.birthRegionLabel = form.defaultRegion.join(' ');
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
  } catch (error) {
    setTimeout(() => {
      uni.$u.toast(getErrorMessage(error), 3000);
    }, 300);
  } finally {
    state.loading = false;
    uni.hideLoading();
  }
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

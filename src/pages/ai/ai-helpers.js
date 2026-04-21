import { Solar } from 'lunar-javascript';
import { timeFormat } from '@/utils/transform';
import { CHART_PREPARE_ERROR } from '@/utils/chart';

/**
 * AI 页面出生地缓存键。
 * 只缓存地区拆分结果，避免每次进入页面都重新选择省/市/区。
 */
export const AI_REGION_CACHE_KEY = 'ai-region';

const headingRegExp =
  /^(#{1,6}\s*.+|(?:\d+[、.]|[一二三四五六七八九十]+[、.]|（[一二三四五六七八九十]+）).+)$/;

/**
 * 创建 AI 页面固定选项配置。
 * 保持页面层只负责装配，不在 index.vue 中散落静态表单配置。
 */
export const createAIOptions = () => ({
  gender: [
    { value: 1, label: '男' },
    { value: 2, label: '女' },
  ],
  sect: [
    { value: 1, label: '晚子时日柱算明天' },
    { value: 2, label: '晚子时日柱算当天' },
  ],
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

/**
 * 创建 AI 页面表单初始值。
 * 返回新对象，避免多次进入页面时共享引用状态。
 */
export const createAIForm = () => ({
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

/**
 * 创建 AI 结果区运行时状态。
 * loading / 原文 / 摘要 / 分节展示统一由页面层管理。
 */
export const createAIState = () => ({
  loading: false,
  resultText: '',
  summaryText: '',
  resultSections: [],
});

export const buildInstruction = () => {
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

export const getErrorMessage = (error) => {
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

export const cleanHeadingText = (text) => {
  return text
    .replace(/^#{1,6}\s*/, '')
    .replace(/^\d+[、.]\s*/, '')
    .replace(/^[一二三四五六七八九十]+[、.]\s*/, '')
    .replace(/^（[一二三四五六七八九十]+）\s*/, '')
    .trim();
};

/**
 * 把模型返回的长文本切成可展示的分节结构。
 * 优先识别 Markdown / 数字标题；若识别失败，则按空行兜底分段。
 */
export const parseResultSections = (content) => {
  const lines = content
    .replace(/\r/g, '')
    .split('\n')
    .map((item) => item.trim());

  const sections = [];
  let current = null;

  const pushCurrent = () => {
    if (!current) {
      return;
    }

    const contentText = current.lines
      .join('\n')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
    if (!contentText) {
      return;
    }

    sections.push({
      title: current.title || `解读 ${sections.length + 1}`,
      content: contentText,
    });
  };

  lines.forEach((line) => {
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

  return content
    .replace(/\r/g, '')
    .split(/\n\s*\n/)
    .map((item) => item.trim())
    .filter(Boolean)
    .map((item, index) => ({
      title: `解读 ${index + 1}`,
      content: item,
    }));
};

export const getSummaryText = (content, sections) => {
  const summarySource = sections[0]?.content || content || '';
  return summarySource.replace(/\s+/g, ' ').slice(0, 120);
};

/**
 * 根据 timestamp 回填阳历、阴历和 picker 默认时间文案。
 * 该函数会直接写入传入的 reactive form。
 */
export const updateDatetimeLabel = (form) => {
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

/**
 * 把首页、结果页或本地缓存传入的基础命主信息写回 AI 表单。
 * 这里只处理基础字段，不负责出生地区缓存。
 */
export const fillBaseForm = (form, payload) => {
  if (!payload) {
    updateDatetimeLabel(form);
    return;
  }

  form.realname = payload.realname || '';
  form.gender = Number(payload.gender) === 1 ? 1 : 2;
  form.sect = payload.sect ?? 1;
  form.timestamp = payload.timestamp ? Number(payload.timestamp) : null;
  updateDatetimeLabel(form);
};

/**
 * 应用出生地区选择结果，并同步生成展示文案与 picker 默认值。
 */
export const applyRegion = (form, region) => {
  form.birthProvince = region?.birthProvince || '';
  form.birthCity = region?.birthCity || '';
  form.birthDistrict = region?.birthDistrict || '';
  form.defaultRegion = [form.birthProvince, form.birthCity, form.birthDistrict].filter(Boolean);
  form.birthRegionLabel = form.defaultRegion.join(' ');
};

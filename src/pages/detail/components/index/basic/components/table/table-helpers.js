/**
 * 基础命盘表的固定列顺序。
 */
export const TABLE_COLUMN_KEYS = ['label', 'year', 'month', 'day', 'time'];

/**
 * 基础命盘表的固定行配置。
 */
export const TABLE_ROW_MAP = [
  { label: '主星', key: 'main' },
  { label: '天干', key: 'top' },
  { label: '地支', key: 'bottom' },
  { label: '藏干', key: 'bottom_hide' },
  { label: '副星', key: 'assiste' },
  { label: '星运', key: 'trend' },
  { label: '自坐', key: 'selfsit' },
  { label: '纳音', key: 'nayin' },
  { label: '空亡', key: 'empty' },
  { label: '神煞', key: 'gods' },
];

/**
 * 基础命盘表头行。
 */
export const TABLE_HEADER_ROW = {
  key: 'header',
  type: 'default',
  data: {
    label: '\\',
    year: '年柱',
    month: '月柱',
    day: '日柱',
    time: '时柱',
  },
};

/**
 * 可触发 tips 的字段映射。
 */
export const TABLE_TIPS_TYPE_MAP = {
  main: 'relation',
  trend: 'trend',
  selfsit: 'trend',
  assiste: 'relation',
  nayin: 'nayin',
  gods: 'gods',
};

const createDefaultRowData = (source = {}, label) => ({
  label,
  year: source.year || '',
  month: source.month || '',
  day: source.day || '',
  time: source.time || '',
});

const createListRowData = (source = {}, label) => ({
  label,
  year: source.year || [],
  month: source.month || [],
  day: source.day || [],
  time: source.time || [],
});

export const resolveRowType = (key) => {
  if (['top', 'bottom'].includes(key)) {
    return 'pillar';
  }

  if (['bottom_hide', 'gods', 'assiste'].includes(key)) {
    return 'list';
  }

  return 'default';
};

const resolveRowSource = (detailStore, key) => {
  if (['main', 'assiste'].includes(key)) {
    return detailStore.start[key];
  }

  return detailStore[key];
};

const resolveRowData = (detailStore, item) => {
  const source = resolveRowSource(detailStore, item.key) || {};

  if (resolveRowType(item.key) === 'list') {
    return createListRowData(source, item.label);
  }

  return createDefaultRowData(source, item.label);
};

/**
 * 组装基础命盘表的展示数据。
 */
export const buildTableRows = (detailStore) => {
  return [
    TABLE_HEADER_ROW,
    ...TABLE_ROW_MAP.map((item) => ({
      key: item.key,
      type: resolveRowType(item.key),
      data: resolveRowData(detailStore, item),
    })),
  ];
};

/**
 * 解析当前单元格点击后对应的 tips 类型。
 */
export const resolveTipsType = (type, label) => {
  if (['元男', '元女'].includes(label)) {
    return '';
  }

  return TABLE_TIPS_TYPE_MAP[type] || '';
};

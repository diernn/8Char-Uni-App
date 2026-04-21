import { EightChar, LunarUtil } from 'lunar-javascript';
import { CHANG_SHENG_OFFSET, SHI_SHEN_SIMPLIFIE } from '@/config/offset';

/**
 * 专业细盘详情表的固定列头顺序。
 * 前四列始终对应原局四柱，后续列由流运层级按 rowNum 截断。
 */
export const DETAIL_TITLE_LIST = [
  '年柱',
  '月柱',
  '日柱',
  '时柱',
  '大运',
  '流年',
  '流月',
  '流日',
  '流时',
];

/**
 * 根据当前展示列数计算藏干区首列宽度。
 * 这里只做样式辅助换算，避免模板里散落魔法数字。
 */
export const createCellHideTopWidth = (rowNum) => {
  const map = {
    7: 22,
    8: 21,
    9: 20,
  };
  return map[rowNum] ?? 21;
};

/**
 * 依据天干、阴阳顺逆和地支索引计算长生十二运。
 * 该计算同时服务原局与流运列，保持细盘表格规则一致。
 */
export const getChangSheng = (top, topIndex, bottomIndex) => {
  const offset = CHANG_SHENG_OFFSET[top];
  let index = offset + (topIndex % 2 === 0 ? bottomIndex : -bottomIndex);

  if (index >= 12) {
    index -= 12;
  }

  if (index < 0) {
    index += 12;
  }

  return EightChar.CHANG_SHENG[index];
};

/**
 * 统一提取流运列参与下游计算所需的干支索引信息。
 * level 0/1 分别兼容大运和流年的特殊取值，其余层级走 lunar 动态方法。
 */
export const getTrendPillarMeta = ({ level, lunar, pillar, getPillarFieldValue }) => {
  if (level === 0) {
    const bottomIndex = LunarUtil.ZHI.includes(pillar[1])
      ? LunarUtil.ZHI.indexOf(pillar[1]) - 1
      : null;
    return {
      bottomIndex,
      top: pillar[0],
      topIndex: LunarUtil.GAN.includes(pillar[0]) ? LunarUtil.ZHI.indexOf(pillar[1]) - 1 : null,
    };
  }

  if (level === 1) {
    return {
      bottomIndex: lunar.getYearZhiIndexByLiChun(),
      top: lunar.getYearGanByLiChun(),
      topIndex: lunar.getYearGanIndexByLiChun(),
    };
  }

  const type = getPillarFieldValue(level - 1);
  return {
    bottomIndex: lunar[`get${type}ZhiIndex`](),
    top: lunar[`get${type}Gan`](),
    topIndex: lunar[`get${type}GanIndex`](),
  };
};

/**
 * 生成专业细盘顶部三行：十神关系、天干、地支。
 * 前四列取自原局，后续列按当前选中的流运层级逐列补齐。
 */
export const buildTopDetail = ({
  PILLAR_FIELD,
  rowNum,
  detailStore,
  getListByLevel,
  getIndexByLevel,
  getRelation,
}) => {
  const start = [];
  const top = [];
  const bottom = [];

  for (const key of PILLAR_FIELD) {
    start.push(detailStore.start.main[key]);
    top.push(detailStore.top[key]);
    bottom.push(detailStore.bottom[key]);
  }

  for (let i = 0; i < rowNum - 4; i += 1) {
    const diff = new Array(3).fill('');
    const list = getListByLevel(i);
    const index = getIndexByLevel(i);

    if (list[index]?.pillar !== '童限') {
      diff[0] = getRelation(list[index]?.pillar[0]);
      diff[1] = list[index]?.pillar[0];
      diff[2] = list[index]?.pillar[1];
    }

    start.push(diff[0]);
    top.push(diff[1]);
    bottom.push(diff[2]);
  }

  return [
    {
      type: 'title',
      data: DETAIL_TITLE_LIST.slice(0, rowNum),
    },
    {
      type: 'relation',
      data: start,
    },
    {
      type: 'pillar',
      data: top,
    },
    {
      type: 'pillar',
      data: bottom,
    },
  ];
};

/**
 * 生成藏干区二维数据。
 * 原局直接取 detailStore.bottom_hide，流运列则根据当前柱的地支反查藏干。
 */
export const buildHideList = ({
  PILLAR_FIELD,
  detailStore,
  rowNum,
  getListByLevel,
  getIndexByLevel,
  getRelation,
  getElAttr,
}) => {
  const transform = (labels = []) => {
    return labels.map((label) => {
      const relation = getRelation(label);
      return {
        type: getElAttr(label),
        label: [label + SHI_SHEN_SIMPLIFIE[getRelation(label)], relation],
      };
    });
  };

  const list = [];

  for (const key of PILLAR_FIELD) {
    list.push(transform(detailStore.bottom_hide[key]));
  }

  for (let i = 0; i < rowNum - 4; i += 1) {
    const currentList = getListByLevel(i);
    const currentIndex = getIndexByLevel(i);
    const hideTop = LunarUtil.ZHI_HIDE_GAN[currentList[currentIndex]?.pillar[1]] ?? [];
    list.push(transform(hideTop));
  }

  return list;
};

/**
 * 生成专业细盘底部四行：日主十二运、自坐十二运、旬空、纳音。
 * 这里会复用 tendStore 当前 lunar/bazi 上下文，确保流运列与滚动轴选中状态同步。
 */
export const buildBottomDetail = ({
  PILLAR_FIELD,
  detailStore,
  tendStore,
  rowNum,
  getListByLevel,
  getIndexByLevel,
  getPillarFieldValue,
}) => {
  const trend = [];
  const selfsit = [];
  const empty = [];
  const nayin = [];

  for (const key of PILLAR_FIELD) {
    trend.push(detailStore.trend[key]);
    selfsit.push(detailStore.selfsit[key]);
    empty.push(detailStore.empty[key]);
    nayin.push(detailStore.nayin[key]);
  }

  for (let i = 0; i < rowNum - 4; i += 1) {
    const currentList = getListByLevel(i);
    const currentIndex = getIndexByLevel(i);
    const pillar = currentList[currentIndex]?.pillar;
    const diff = new Array(4).fill('');

    if (pillar && pillar !== '童限') {
      const { lunar } = tendStore.currentLunar;
      const meta = getTrendPillarMeta({
        level: i,
        lunar,
        pillar,
        getPillarFieldValue,
      });
      const { bazi } = tendStore.service;

      diff[0] =
        meta.bottomIndex !== null
          ? getChangSheng(bazi.getDayGan(), bazi.getDayGanIndex(), meta.bottomIndex)
          : '';
      diff[1] =
        meta.bottomIndex !== null ? getChangSheng(meta.top, meta.topIndex, meta.bottomIndex) : '';
      diff[2] = LunarUtil.XUN_KONG[LunarUtil.getXunIndex(pillar)] ?? '';
      diff[3] = LunarUtil.NAYIN[pillar] ?? '';
    }

    trend.push(diff[0]);
    selfsit.push(diff[1]);
    empty.push(diff[2]);
    nayin.push(diff[3]);
  }

  return [
    {
      type: 'trend',
      data: trend,
    },
    {
      type: 'trend',
      data: selfsit,
    },
    {
      type: 'default',
      data: empty,
    },
    {
      type: 'nayin',
      data: nayin,
    },
  ];
};

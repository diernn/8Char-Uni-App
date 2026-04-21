import { PILLAR_FIELD } from '@/config/map';

export const RELATION_EMPTY_TEXT = '无合冲关系';

const RELATION_SUMMARY_CONFIG = [
  { key: 'top', title: '天干留意' },
  { key: 'bottom', title: '地支留意' },
];

const resolveUniqueTitles = (list = []) => [...new Set(list.map((item) => item?.title).filter(Boolean))];

const buildPillarList = (pillar = {}) => PILLAR_FIELD.map((key) => pillar?.[key] || '');

export const buildRelationSummaryList = (tbRelation = {}) => {
  return RELATION_SUMMARY_CONFIG.map((item) => ({
    key: item.key,
    title: item.title,
    contentList: resolveUniqueTitles(tbRelation?.[item.key] || []),
  }));
};

export const buildRelationDetail = ({
  topPillar = {},
  bottomPillar = {},
  topRelation = [],
  bottomRelation = [],
} = {}) => {
  return {
    top: {
      list: buildPillarList(topPillar),
      mark: topRelation || [],
    },
    bottom: {
      list: buildPillarList(bottomPillar),
      mark: bottomRelation || [],
    },
  };
};

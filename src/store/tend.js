import { defineStore } from 'pinia';
import { Lunar, LunarUtil, Solar } from 'lunar-javascript';
import { deleteFirstElement, getRelationByPillar, timeFormat } from '@/utils/transform';
import { TEND_STORE_FIELD } from '@/config/map';

const MONTH_JIEQI_KEYS = [
  '立春',
  '惊蛰',
  '清明',
  '立夏',
  '芒种',
  '小暑',
  '立秋',
  '白露',
  '寒露',
  '立冬',
  '大雪',
  'XIAO_HAN',
];
const DEFAULT_INDEX_STATE = {
  currentIndex: 0,
  yearIndex: 0,
  monthIndex: 0,
  dayIndex: 0,
  timeIndex: 0,
};

const createEmptyService = () => ({
  lunar: null,
  solar: null,
  bazi: null,
});

const resetIndexes = (store) => {
  Object.assign(store, DEFAULT_INDEX_STATE);
};

const resetTrendLists = (
  store,
  keys = ['dayunList', 'yearList', 'monthList', 'dayList', 'timeList']
) => {
  keys.forEach((key) => {
    store[key] = [];
  });
};

const getMonthDayLabel = (solar) => `${Math.abs(solar.getMonth())}/${solar.getDay()}`;

const getMonthBoundary = (year, monthIndex, monthItem) => {
  const startYear = monthIndex < 11 ? year : year + 1;
  const endYear = monthIndex < 10 ? year : year + 1;

  return {
    startDate: `${startYear}/${monthItem.date}`,
    endDate: `${endYear}/${monthItem.nextJieqiDate}`,
  };
};

const buildDaYunList = (original = []) => {
  return original.map((item) => {
    const pillar = item.getGanZhi() || '童限';
    return {
      startYear: item.getStartYear(),
      startAge: item.getStartAge(),
      pillar,
      shishen: pillar === '童限' ? '童限' : getRelationByPillar(pillar),
    };
  });
};

const buildLiuYearList = (dayun) => {
  if (!dayun) {
    return [];
  }

  return dayun.getLiuNian().map((item) => {
    const pillar = item.getGanZhi();
    return {
      year: item.getYear(),
      pillar,
      age: item.getAge(),
      shishen: getRelationByPillar(pillar),
    };
  });
};

const buildLiuMonthList = (yearItem) => {
  if (!yearItem) {
    return [];
  }

  const jieqi = yearItem.getLunar().getJieQiTable();
  const months = yearItem.getLiuYue();

  return months.map((item, index) => {
    const currentJieqi = jieqi[MONTH_JIEQI_KEYS[index]];
    const nextJieqi =
      index === 11 ? jieqi[MONTH_JIEQI_KEYS[0]] : jieqi[MONTH_JIEQI_KEYS[index + 1]];
    const pillar = item.getGanZhi();

    return {
      original: currentJieqi,
      year: yearItem.getYear(),
      jieqi: index === 11 ? '小寒' : MONTH_JIEQI_KEYS[index],
      nextJieqiDate: getMonthDayLabel(nextJieqi),
      date: getMonthDayLabel(currentJieqi),
      pillar,
      shishen: getRelationByPillar(pillar),
    };
  });
};

const buildLiuDayList = (year, monthIndex, monthItem) => {
  if (!monthItem) {
    return [];
  }

  const { startDate, endDate } = getMonthBoundary(year, monthIndex, monthItem);
  const dayList = [];
  let currentDate = new Date(startDate);
  const nextDate = new Date(endDate);

  while (currentDate < nextDate) {
    const solar = Solar.fromDate(new Date(currentDate));
    currentDate = new Date(solar.next(1).toYmd().replace(/-/g, '/'));

    const lunar = solar.getLunar();
    const pillar = lunar.getDayInGanZhi();
    dayList.push({
      date: solar.toYmd().replace(/-/g, '/'),
      nongli: lunar.getDayInChinese(),
      top: lunar.getDayGan(),
      bottom: lunar.getDayZhi(),
      pillar,
      shishen: getRelationByPillar(pillar),
    });
  }

  return dayList;
};

const buildLiuTimeList = (dayItem) => {
  if (!dayItem) {
    return [];
  }

  const startTime = new Date(`${dayItem.date} 00:00:00`).getTime() - 60 * 60 * 1000;

  return new Array(12).fill(null).map((_, index) => {
    const date = new Date(startTime + index * 2 * 60 * 60 * 1000);
    const lunar = Lunar.fromDate(date);
    const pillar = lunar.getTimeInGanZhi();

    return {
      top: lunar.getTimeGan(),
      bottom: lunar.getTimeZhi(),
      pillar,
      time: `${lunar.getHour()}:00`,
      shishen: getRelationByPillar(pillar),
    };
  });
};

const getCurrentLunarSelection = (state) => {
  if (state.timeList.length) {
    const day = state.dayList[state.dayIndex];
    return {
      accurate: 'time',
      lunar: Solar.fromDate(
        new Date(`${day.date} ${state.timeList[state.timeIndex].time}`)
      ).getLunar(),
    };
  }

  if (state.dayList.length) {
    return {
      accurate: 'day',
      lunar: Solar.fromDate(new Date(`${state.dayList[state.dayIndex].date} 23:30`)).getLunar(),
    };
  }

  if (state.monthList.length) {
    const month = state.monthList[state.monthIndex];
    return {
      accurate: 'month',
      lunar: Solar.fromDate(new Date(`${month.year}/${month.date} 23:30`)).getLunar(),
    };
  }

  if (state.dayunList.length) {
    const dayun = state.dayunList[state.currentIndex];
    return {
      accurate: 'year',
      lunar: Solar.fromDate(new Date(`${dayun.startYear}/01/01 23:30`)).getLunar(),
    };
  }

  return {
    accurate: 'year',
    lunar: state.service.solar
      ? state.service.solar.getLunar()
      : Solar.fromDate(new Date()).getLunar(),
  };
};

const getCurrentDateLabel = (currentLunar) => {
  const { accurate, lunar } = currentLunar;
  if (!['day', 'time'].includes(accurate)) {
    return null;
  }

  const solar = lunar.getSolar();
  const date = timeFormat(solar.toYmdHms(), 'yyyy年mm月dd日');
  let label = `已选日期：${date} 星期${solar.getWeekInChinese()}`;

  if (accurate === 'time') {
    label += ` ${lunar.getTimeZhi()}时 `;
  }

  label += `（阴历${lunar.getYear()}年${lunar.getMonthInChinese()}月${lunar.getDayInChinese()}日）`;
  return label;
};

const findCurrentDaYunIndex = (original, currentYear) => {
  return original.findIndex(
    (item) => currentYear >= item.getStartYear() && currentYear <= item.getEndYear()
  );
};

const findCurrentYearIndex = (yearList, currentYear) => {
  return yearList.findIndex((item) => item.year === currentYear);
};

const findCurrentMonthIndex = (monthList, currentTimestamp) => {
  return monthList.findIndex((item, index) => {
    const { startDate, endDate } = getMonthBoundary(item.year, index, item);
    const startTimestamp = new Date(startDate).getTime();
    const endTimestamp = new Date(endDate).getTime();
    return startTimestamp <= currentTimestamp && currentTimestamp < endTimestamp;
  });
};

const findCurrentDayIndex = (dayList, currentDate) => {
  return dayList.findIndex((item) => item.date === currentDate);
};

const getCurrentTimeIndex = (date) => {
  const timeZhi = Solar.fromDate(date).getLunar().getTimeZhi();
  const index = deleteFirstElement(LunarUtil.ZHI).indexOf(timeZhi);
  return index >= 0 ? index : 0;
};

export const useTendStore = defineStore('tend', {
  state: () => {
    return {
      service: createEmptyService(),
      // 列表
      original: [],
      dayunList: [],
      yearList: [],
      monthList: [],
      dayList: [],
      timeList: [],
      // 索引
      ...DEFAULT_INDEX_STATE,
    };
  },
  getters: {
    rowNum(state) {
      const liuKeyList = TEND_STORE_FIELD.map((item) => item.list);
      let num = 4;

      for (const key of liuKeyList) {
        if (state[key].length) {
          num += 1;
        } else {
          break;
        }
      }

      return num;
    },
    currentLunar(state) {
      return getCurrentLunarSelection(state);
    },
    currentDate(state) {
      return getCurrentDateLabel(state.currentLunar);
    },
  },
  actions: {
    /**
     * 根据首页传入的出生时间、性别和流派初始化本地流运服务。
     * 后续大运到流时的展开全部依赖这里缓存下来的 lunar-javascript 对象。
     */
    pull({ timestamp, gender, sect }) {
      const solar = Solar.fromDate(new Date(timestamp));
      const lunar = solar.getLunar();
      const bazi = lunar.getEightChar();
      const yun = bazi.getYun(gender, sect);

      this.service = {
        lunar,
        solar,
        bazi,
      };
      this.resolveYun(yun.getDaYun());
    },

    /**
     * 重置整条流运链路，并默认展开到大运 -> 流年 -> 流月。
     */
    resolveYun(original) {
      this.original = original;
      resetIndexes(this);
      resetTrendLists(this);
      this.resolveDaYun();
    },

    /**
     * 生成大运列表，并清空后续更细粒度的索引与列表。
     */
    resolveDaYun() {
      this.dayunList = buildDaYunList(this.original);
      this.yearIndex = 0;
      this.monthIndex = 0;
      this.dayIndex = 0;
      this.timeIndex = 0;
      resetTrendLists(this, ['yearList', 'monthList', 'dayList', 'timeList']);
      this.resolveLiuYear();
    },

    /**
     * 根据当前大运索引展开流年列表。
     */
    resolveLiuYear() {
      const dayun = this.original[this.currentIndex];
      this.yearList = buildLiuYearList(dayun);
      this.monthIndex = 0;
      this.dayIndex = 0;
      this.timeIndex = 0;
      resetTrendLists(this, ['monthList', 'dayList', 'timeList']);
      this.resolveLiuMonth();
    },

    /**
     * 根据当前流年索引展开流月列表。
     * 流月边界基于节气表切分，最后一个月使用下一年的立春作为上界。
     */
    resolveLiuMonth() {
      const dayun = this.original[this.currentIndex];
      const year = dayun?.getLiuNian() || [];
      const yearItem = year[this.yearIndex];

      this.monthList = buildLiuMonthList(yearItem);
      this.dayIndex = 0;
      this.timeIndex = 0;
      resetTrendLists(this, ['dayList', 'timeList']);
    },

    /**
     * 根据当前流月索引生成对应节气区间内的流日列表。
     */
    resolveLiuDay() {
      const yearItem = this.yearList[this.yearIndex];
      const monthItem = this.monthList[this.monthIndex];
      this.dayList = buildLiuDayList(yearItem?.year, this.monthIndex, monthItem);
      this.timeIndex = 0;
      resetTrendLists(this, ['timeList']);
    },

    /**
     * 根据当前流日索引生成 12 个时辰的流时列表。
     */
    resolveLiuTime() {
      this.timeList = buildLiuTimeList(this.dayList[this.dayIndex]);
    },

    /**
     * 将系统当前时间映射到大运/流年/流月/流日/流时五层索引。
     * 这里只负责索引定位，不改动外部字段结构，供结果页“一键跳到当前时间”复用。
     */
    SkipCurrentTime() {
      const now = new Date();
      const currentYear = now.getFullYear();
      const currentTimestamp = now.getTime();

      const dayunIndex = findCurrentDaYunIndex(this.original, currentYear);
      if (dayunIndex < 0) {
        return;
      }

      this.currentIndex = dayunIndex;
      this.resolveDaYun();

      const yearIndex = findCurrentYearIndex(this.yearList, currentYear);
      if (yearIndex < 0) {
        return;
      }

      this.yearIndex = yearIndex;
      this.resolveLiuYear();

      const monthIndex = findCurrentMonthIndex(this.monthList, currentTimestamp);
      if (monthIndex < 0) {
        return;
      }

      this.monthIndex = monthIndex;
      this.resolveLiuDay();

      const currentDate = Solar.fromDate(now).toYmd().replace(/-/g, '/');
      const dayIndex = findCurrentDayIndex(this.dayList, currentDate);
      if (dayIndex < 0) {
        return;
      }

      this.dayIndex = dayIndex;
      this.resolveLiuTime();
      this.timeIndex = getCurrentTimeIndex(now);
    },
  },
});

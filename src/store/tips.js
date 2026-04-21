import { defineStore } from 'pinia';
import { patchStoreState } from '@/store/shared';

export const useTipsStore = defineStore('tips', {
  state: () => {
    return {
      gods: [],
      nayin: [],
      relation: [],
      trend: [],
    };
  },
  actions: {
    /**
     * tips 数据来源于接口或缓存，沿用浅层覆盖模式即可。
     */
    set(data) {
      patchStoreState(this, data);
    },
  },
});

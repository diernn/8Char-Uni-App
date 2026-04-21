import { defineStore } from 'pinia';
import { patchStoreState } from '@/store/shared';

export const useBookStore = defineStore('book', {
  state: () => {
    return {
      weigh_bone: {
        poetry: null,
        title: null,
        explain: null,
        total: null,
      },
      books: [],
    };
  },
  actions: {
    /**
     * 浅层覆盖古籍与称骨数据，保持现有接口回写方式不变。
     */
    set(data) {
      patchStoreState(this, data);
    },
  },
});

/**
 * 统一处理 store 的浅层字段回写。
 * 当前仓库多个 store 都采用“接口返回什么字段，就覆盖什么字段”的轻量模式，
 * 先收口到一个公共 helper，避免重复样板代码继续扩散。
 */
export const patchStoreState = (store, payload = {}) => {
  Object.keys(payload).forEach((key) => {
    store[key] = payload[key];
  });
};

export default patchStoreState;

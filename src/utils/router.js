const { route } = uni.$u;

/**
 * 统一页面跳转出口，避免在页面组件里散落路由对象。
 * 约定：
 * - 主页、结果页使用 redirect，避免重复堆栈；
 * - AI 页使用 navigateTo，保留返回路径。
 */
const routeTo = (type, url) => {
  route({
    type,
    url,
  });
};

const buildQuery = (params) => {
  const query = Object.entries(params || {})
    .filter(([, value]) => value !== undefined && value !== null && value !== '')
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
    .join('&');

  return query ? `?${query}` : '';
};
const appendQuery = (url, params) => `${url}${buildQuery(params)}`;

export const redirectTo = (url) => {
  routeTo('redirect', url);
};

export const navigateTo = (url) => {
  routeTo('navigateTo', url);
};

export const toHome = () => {
  redirectTo('/pages/home/home');
};

export const toDetail = () => {
  redirectTo('/pages/detail/index');
};

export const toAI = () => {
  navigateTo('/pages/ai/index');
};

export const toHomeWithTime = (params) => {
  redirectTo(appendQuery('/pages/home/home', params));
};

export const toAIWithTime = (params) => {
  navigateTo(appendQuery('/pages/ai/index', params));
};

export const back = () => {
  uni.navigateBack();
};

export const replaceTo = redirectTo;

export default {
  toHome,
  toDetail,
  toAI,
  toHomeWithTime,
  toAIWithTime,
  back,
  redirectTo,
  navigateTo,
  replaceTo,
};

export { route };

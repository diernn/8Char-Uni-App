import { createSSRApp } from 'vue';
import { createPinia } from 'pinia';
import uView from 'vk-uview-ui';
import App from './App.vue';

/**
 * Uni-App 应用入口。
 * 这里只负责装配全局依赖，业务初始化统一放在 App.vue / utils/launch.js。
 */
export function createApp() {
  const app = createSSRApp(App);
  const pinia = createPinia();

  app.use(pinia);
  app.use(uView);

  return {
    app,
    pinia,
  };
}

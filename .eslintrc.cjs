module.exports = {
  root: true,
  env: {
    browser: true,
    node: true,
    es2021: true,
  },
  globals: {
    uni: 'readonly',
  },
  parser: 'vue-eslint-parser',
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  plugins: ['vue'],
  extends: ['eslint:recommended', 'plugin:vue/vue3-essential'],
  rules: {
    'no-dupe-keys': 'error',
    'no-unreachable': 'error',
    'vue/multi-word-component-names': 'off',
    'vue/no-mutating-props': 'error',
  },
};

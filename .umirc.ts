import { defineConfig } from '@umijs/max';

export default defineConfig({
  antd: {},
  access: {},
  model: {},
  initialState: {},
  request: {},
  electron: {},
  plugins: ['@liangskyli/umijs-plugin-electron'],
  layout: {
    title: 'frp-ui',
  },
  routes: [
    {
      path: '/',
      redirect: '/home',
    },
    {
      name: '首页',
      path: '/home',
      component: './Home',
    },
    {
      name: '权限演示',
      path: '/access',
      component: './Access',
    },
    {
      name: ' CRUD 示例',
      path: '/table',
      component: './Table',
    },
    {
      name: ' 检查更新',
      path: '/check-update',
      component: './CheckUpdate',
    },
  ],
  npmClient: 'pnpm',
});


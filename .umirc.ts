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
    title: 'frp-electron',
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
      name: '服务端配置',
      path: '/frps-config',
      component: './FrpsConfig',
    },
    {
      name: '客户端配置',
      path: '/frpc-config',
      component: './FrpcConfig',
    },
    {
      name: '代理列表',
      path: '/frpc-proxy',
      component: './FrpcProxy',
    },
    {
      name: '检查更新',
      path: '/check-update',
      component: './CheckUpdate',
    },
  ],
  npmClient: 'pnpm',
});

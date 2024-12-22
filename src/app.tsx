import { MenuModeEnum } from './constants';
import { MenuModeSwitch } from './components/MenuModeSwitch';

export const layout = () => {
  return {
    logo: 'https://img.alicdn.com/tfs/TB1YHEpwUT1gK0jSZFhXXaAtVXa-28-27.svg',
    menu: {
      locale: false,
      request: async () => {
        const menuMode = localStorage.getItem('menuMode') || MenuModeEnum.SERVER;
        if (menuMode === MenuModeEnum.SERVER) {
          return [
            {
              path: '/home',
              name: '首页',
            },
            {
              path: '/frps-config',
              name: '服务端配置',
            },
            {
              path: '/check-update',
              name: '检查更新',
            },
          ];
        } else {
          return [
            {
              path: '/home',
              name: '首页',
            },
            {
              path: '/frpc-proxy',
              name: '代理列表',
            },
            {
              path: '/frpc-config',
              name: '客户端配置',
            },
            {
              path: '/check-update',
              name: '检查更新',
            },
          ];
        }
      },
    },
    layout: 'top',
    rightContentRender: () => <MenuModeSwitch />,
  };
}; 
import { createMainWindow } from '@/main-window';
import { app, protocol } from 'electron';
import { ensureConfigDir, setupFrpsConfigHandlers } from './frps-config';
import { setupHomeHandlers } from './home';
import { updateFrp } from './update-frp';

protocol.registerSchemesAsPrivileged([
  {
    scheme: 'app',
    privileges: {
      secure: true,
      standard: true,
      supportFetchAPI: true,
      allowServiceWorkers: true,
    },
  },
]);

// 确保在应用准备好时初始化配置
app.whenReady().then(async () => {
  try {
    // 首先确保配置目录和文件存在
    await ensureConfigDir();
    
    // 然后设置其他处理程序
    setupHomeHandlers();
    setupFrpsConfigHandlers();
    createMainWindow();
    updateFrp();
  } catch (error) {
    console.error('应用初始化失败:', error);
  }
});

import { createMainWindow } from '@/main-window';
import { app, ipcMain, protocol } from 'electron';
import downloadFile from './download';

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

app.whenReady().then(() => {
  createMainWindow();

  ipcMain.on('download-release', (event, url) => {
    downloadFile(url, 'frp.tar.gz');
  });
});

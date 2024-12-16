import { createMainWindow } from '@/main-window';
import { app, protocol } from 'electron';
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

app.whenReady().then(() => {
  setupHomeHandlers();
  createMainWindow();
  updateFrp();
});

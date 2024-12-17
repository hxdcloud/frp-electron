import { app, BrowserWindow, ipcMain } from 'electron';
import { CancelError, download } from 'electron-dl';
import fs from 'fs';
import path from 'path';
import * as tar from 'tar';
import extract from 'extract-zip';

async function extractTarGz(
  filePath: string,
  destPath: string,
  onProgress: (progress: number) => void,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const fileSize = fs.statSync(filePath).size;
    let processedSize = 0;

    const extract = tar.extract({
      cwd: destPath,
      onentry: (entry) => {
        processedSize += entry.size;
        const progress = processedSize / fileSize;
        onProgress(progress);
      },
    });

    const readStream = fs.createReadStream(filePath);

    readStream
      .pipe(extract)
      .on('end', () => {
        onProgress(1);
        resolve();
      })
      .on('error', (err) => {
        console.error('[extractTarGz] 解压失败:', err);
        reject(err);
      });
  });
}

async function extractZip(
  filePath: string,
  destPath: string,
  onProgress: (progress: number) => void,
): Promise<void> {
  return new Promise((resolve, reject) => {
    extract(filePath, { dir: destPath, onEntry: (entry: any) => {
      const progress = entry.index / entry.total;
      onProgress(progress);
    }})
      .then(() => {
        onProgress(1);
        resolve();
      })
      .catch((err) => {
        console.error('[extractZip] ZIP解压失败:', err);
        reject(err);
      });
  });
}

function updateVersionFile(versionFile: string, newVersion: string) {
  let versions: string[] = [];

  if (fs.existsSync(versionFile)) {
    versions = fs.readFileSync(versionFile, 'utf8').split('\n').filter(Boolean);
  }

  if (!versions.includes(newVersion)) {
    versions.push(newVersion);
  }

  versions.sort((a, b) => {
    const versionA = a.match(/v(\d+)\.(\d+)\.(\d+)/);
    const versionB = b.match(/v(\d+)\.(\d+)\.(\d+)/);
    if (versionA && versionB) {
      return (
        parseInt(versionB[1]) - parseInt(versionA[1]) ||
        parseInt(versionB[2]) - parseInt(versionA[2]) ||
        parseInt(versionB[3]) - parseInt(versionA[3])
      );
    }
    return 0;
  });

  fs.writeFileSync(versionFile, versions.join('\n'), 'utf8');
}

export const updateFrp = () => {
  ipcMain.handle('download-file', async (event, url) => {
    const releasePath = path.join(
      app.getPath('home'),
      '.frp-electron/frp-release',
    );
    const versionFile = path.join(releasePath, 'frp-version');

    if (!fs.existsSync(releasePath)) {
      fs.mkdirSync(releasePath, { recursive: true });
    }

    const win = BrowserWindow.getFocusedWindow();
    if (!win) {
      throw new Error('No focused window available for download');
    }

    try {
      const downloadItem = await download(win, url, {
        directory: releasePath,
        onProgress: (progress) => {
          event.sender.send('download-progress', progress);
        },
      });

      const filePath = downloadItem.getSavePath();

      const versionMatch = url.match(/v\d+\.\d+\.\d+/);
      if (!versionMatch) {
        throw new Error('无法从URL中提取版本号');
      }
      const version = versionMatch[0];

      const fileExtension = path.extname(filePath);

      if (fileExtension === '.gz') {
        await extractTarGz(filePath, releasePath, (progress) => {
          event.sender.send('extract-progress', progress);
        });
      } else if (fileExtension === '.zip') {
        await extractZip(filePath, releasePath, (progress) => {
          event.sender.send('extract-progress', progress);
        });
      } else {
        throw new Error('不支持的文件类型');
      }

      fs.unlinkSync(filePath);

      const extractedDirs = fs
        .readdirSync(releasePath)
        .filter(
          (name) =>
            name.startsWith('frp_') &&
            fs.statSync(path.join(releasePath, name)).isDirectory(),
        );

      if (extractedDirs.length > 0) {
        const oldPath = path.join(releasePath, extractedDirs[0]);
        const newPath = path.join(releasePath, version);

        if (fs.existsSync(newPath)) {
          fs.rmSync(newPath, { recursive: true, force: true });
        }

        fs.renameSync(oldPath, newPath);
      }

      updateVersionFile(versionFile, version);

      const currentVersionFile = path.join(releasePath, 'current-version');
      fs.writeFileSync(currentVersionFile, version, 'utf8');

      return {
        downloadPath: filePath,
        extractPath: releasePath,
      };
    } catch (error) {
      if (error instanceof CancelError) {
        throw new Error('下载已取消');
      }
      throw error;
    }
  });

  ipcMain.handle('show-download-path', () => {
    const downloadPath = path.join(app.getPath('home'), '.frp-electron/frp-release');
    return downloadPath;
  });

  ipcMain.handle('get-frp-version', () => {
    const releasePath = path.join(
      app.getPath('home'),
      '.frp-electron/frp-release',
    );
    const versionFile = path.join(releasePath, 'frp-version');
    const currentVersionFile = path.join(releasePath, 'current-version');

    try {
      let versions = null;
      let currentVersion = null;

      if (fs.existsSync(versionFile)) {
        versions = fs.readFileSync(versionFile, 'utf8');
      }

      if (fs.existsSync(currentVersionFile)) {
        currentVersion = fs.readFileSync(currentVersionFile, 'utf8').trim();
      }

      return {
        versions,
        currentVersion,
      };
    } catch (error) {
      console.error('[get-frp-version] 读取版本文件失败:', error);
      return {
        versions: null,
        currentVersion: null,
      };
    }
  });

  ipcMain.handle('set-current-version', async (_event, version: string) => {
    const releasePath = path.join(
      app.getPath('home'),
      '.frp-electron/frp-release',
    );
    const currentVersionFile = path.join(releasePath, 'current-version');

    try {
      fs.writeFileSync(currentVersionFile, version, 'utf8');
      return true;
    } catch (error) {
      console.error('[set-current-version] 写入当前版本失败:', error);
      throw error;
    }
  });
};

import { app, BrowserWindow, ipcMain } from 'electron';
import { CancelError, download } from 'electron-dl';
import fs from 'fs';
import path from 'path';
import * as tar from 'tar';

// 解压缩函数
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
        reject(err);
      });
  });
}

// 更新版本文件，保持版本号的排序
function updateVersionFile(versionFile: string, newVersion: string) {
  let versions: string[] = [];

  // 读取现有版本
  if (fs.existsSync(versionFile)) {
    versions = fs.readFileSync(versionFile, 'utf8').split('\n').filter(Boolean);
  }

  // 添加新版本并去重
  if (!versions.includes(newVersion)) {
    versions.push(newVersion);
  }

  // 按照版本号排序（最新到最旧）
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

  // 写入版本信息到文件
  fs.writeFileSync(versionFile, versions.join('\n'), 'utf8');
}

export const updateFrp = () => {
  ipcMain.handle('download-file', async (event, url) => {
    console.log('download-file', url);
    const releasePath = path.join(
      app.getPath('home'),
      '.frp-electron/frp-release',
    );
    const versionFile = path.join(releasePath, 'frp-version');

    // 确保目录存在
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

      // 从下载URL中提取版本号
      const versionMatch = url.match(/v\d+\.\d+\.\d+/);
      if (!versionMatch) {
        throw new Error('无法从URL中提取版本号');
      }
      const version = versionMatch[0];

      // 开始解压缩
      await extractTarGz(filePath, releasePath, (progress) => {
        event.sender.send('extract-progress', progress);
      });

      // 删除下载的tar.gz文件
      fs.unlinkSync(filePath);

      // 获取解压后的文件夹名称（通常是 frp_x.x.x_platform）
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

        // 如果目标文件夹已存在，先删除
        if (fs.existsSync(newPath)) {
          fs.rmSync(newPath, { recursive: true, force: true });
        }

        // 重命名文件夹
        fs.renameSync(oldPath, newPath);
      }

      // 写入版本信息到文件，保持版本号的排序
      updateVersionFile(versionFile, version);

      // 更新 current-version 文件
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
    return path.join(app.getPath('home'), '.frp-electron/frp-release');
  });

  // 新增：获取当前使用的frp版本
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
      console.error('读取版本文件失败:', error);
      return {
        versions: null,
        currentVersion: null,
      };
    }
  });

  // 添加设置当前版本的处理函数
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
      console.error('写入当前版本失败:', error);
      throw error;
    }
  });
};

import { app } from 'electron';
import fs from 'fs';
import path from 'path';

// 获取FRP发布目录路径
export const getFrpReleasePath = () => {
  return path.join(app.getPath('home'), '.frp-electron', 'frp-release');
};

// 获取当前版本文件路径
export const getCurrentVersionFilePath = () => {
  return path.join(getFrpReleasePath(), 'current-version');
};

// 获取指定版本的可执行文件路径
export const getExecutablePath = (version: string, executable: 'frps' | 'frpc') => {
  const platform = process.platform;
  const extension = platform === 'win32' ? '.exe' : '';
  return path.join(getFrpReleasePath(), version, `${executable}${extension}`);
};

// 检查版本号是否合法
const isValidVersion = (version: string): boolean => {
  // 版本号格式：v0.0.0 或 0.0.0
  const versionPattern = /^v?\d+\.\d+\.\d+$/;
  return versionPattern.test(version);
};

// 检查当前版本和可执行文件是否存在
export const checkCurrentVersion = (): {
  hasVersion: boolean;
  version: string | null;
  hasFrps: boolean;
  hasFrpc: boolean;
} => {
  try {
    // 检查版本文件是否存在
    const versionFilePath = getCurrentVersionFilePath();
    if (!fs.existsSync(versionFilePath)) {
      return {
        hasVersion: false,
        version: null,
        hasFrps: false,
        hasFrpc: false,
      };
    }

    // 读取版本号
    const version = fs.readFileSync(versionFilePath, 'utf-8').trim();
    if (!isValidVersion(version)) {
      return {
        hasVersion: false,
        version: null,
        hasFrps: false,
        hasFrpc: false,
      };
    }

    // 检查可执行文件是否存在
    const frpsPath = getExecutablePath(version, 'frps');
    const frpcPath = getExecutablePath(version, 'frpc');

    return {
      hasVersion: true,
      version,
      hasFrps: fs.existsSync(frpsPath),
      hasFrpc: fs.existsSync(frpcPath),
    };
  } catch (error) {
    console.error('检查FRP版本时出错:', error);
    return {
      hasVersion: false,
      version: null,
      hasFrps: false,
      hasFrpc: false,
    };
  }
}; 
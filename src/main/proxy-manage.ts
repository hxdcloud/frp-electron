import { ipcMain } from 'electron';
import fs from 'fs';
import toml from 'toml';
import { getFrpcConfigPath } from './frpc-config';

// 将值转换为TOML格式字符串
function valueToTomlString(value: any): string {
  if (value === undefined || value === null) {
    return '';
  }
  if (typeof value === 'string') {
    return `"${value}"`;
  }
  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }
  if (Array.isArray(value)) {
    if (value.length === 0) return '[]';
    return `[${value.map(v => valueToTomlString(v)).join(', ')}]`;
  }
  if (typeof value === 'object') {
    const entries = Object.entries(value).filter(([_, v]) => v !== undefined && v !== null);
    if (entries.length === 0) return '';
    return entries.map(([k, v]) => `${k} = ${valueToTomlString(v)}`).join('\n');
  }
  return '';
}

// 格式化代理配置为TOML字符串
function formatProxyToToml(config: Record<string, any>): string {
  const lines: string[] = [];
  
  // 处理所有字段
  for (const [key, value] of Object.entries(config)) {
    if (value === undefined || value === null) continue;
    
    if (typeof value === 'object' && !Array.isArray(value)) {
      // 处理嵌套对象的每个字段
      const subFields = Object.entries(value)
        .filter(([_, v]) => v !== undefined && v !== null)
        .map(([k, v]) => `${key}.${k} = ${valueToTomlString(v)}`);
      lines.push(...subFields);
    } else {
      // 处理基本字段
      const formattedValue = valueToTomlString(value);
      if (formattedValue) {
        lines.push(`${key} = ${formattedValue}`);
      }
    }
  }

  return lines.join('\n');
}

// 读取代理配置列表
export const getProxyList = async () => {
  try {
    const { configPath } = getFrpcConfigPath();
    const content = fs.readFileSync(configPath, 'utf-8');
    
    // 使用正则表达式匹配所有[[proxies]]配置块
    const proxyBlockRegex = /\[\[proxies\]\]([\s\S]*?)(?=\[\[proxies\]\]|$)/g;
    const matches = content.matchAll(proxyBlockRegex);
    const proxies = [];

    // 处理每个匹配到的代理配置块
    for (const match of matches) {
      try {
        const proxyContent = match[1].trim();
        if (proxyContent) {
          // 将配置内容转换为TOML格式
          const configStr = proxyContent.split('\n')
            .map(line => line.trim())
            .filter(line => line && !line.startsWith('['))
            .join('\n');
          const proxyConfig = toml.parse(configStr) as Record<string, any>;
          proxies.push(proxyConfig);
        }
      } catch (err) {
        console.error('解析代理配置块失败:', err);
      }
    }

    return proxies;
  } catch (error) {
    console.error('读取代理配置列表失败:', error);
    return [];
  }
};

// 获取单个代理配置
export const getProxyConfig = async (name: string) => {
  try {
    const { configPath } = getFrpcConfigPath();
    const content = fs.readFileSync(configPath, 'utf-8');
    
    // 使用正则表达式匹配指定名称的代理配置块
    const proxyBlockRegex = new RegExp(`\\[\\[proxies\\]\\]([\\s\\S]*?)(?=\\[\\[proxies\\]\\]|$)`, 'g');
    const matches = content.matchAll(proxyBlockRegex);

    for (const match of matches) {
      try {
        const proxyContent = match[1].trim();
        if (proxyContent) {
          // 将配置内容转换为TOML格式
          const configStr = proxyContent.split('\n')
            .map(line => line.trim())
            .filter(line => line && !line.startsWith('['))
            .join('\n');
          const proxyConfig = toml.parse(configStr) as Record<string, any>;
          if (proxyConfig.name === name) {
            return proxyConfig;
          }
        }
      } catch (err) {
        console.error('解析代理配置块失败:', err);
      }
    }
    return null;
  } catch (error) {
    console.error('读取代理配置失败:', error);
    return null;
  }
};

// 添加代理配置
export const addProxy = async (proxyConfig: Record<string, any>) => {
  try {
    const { configPath } = getFrpcConfigPath();
    const content = fs.readFileSync(configPath, 'utf-8');

    // 检查名称是否已存在
    const existingProxy = await getProxyConfig(proxyConfig.name);
    if (existingProxy) {
      throw new Error('代理名称已存在');
    }

    // 格式化为TOML格式
    const proxyToml = formatProxyToToml(proxyConfig);

    // 添加新的代理配置块
    const newContent = `${content.trim()}\n\n[[proxies]]\n${proxyToml}\n`;
    fs.writeFileSync(configPath, newContent);
    
    return true;
  } catch (error) {
    console.error('添加代理配置失败:', error);
    throw error;
  }
};

// 更新代理配置
export const updateProxy = async (name: string, proxyConfig: Record<string, any>) => {
  try {
    const { configPath } = getFrpcConfigPath();
    const content = fs.readFileSync(configPath, 'utf-8');

    // 使用正则表达式匹配所有代理配置块
    const proxyBlockRegex = /\[\[proxies\]\]([\s\S]*?)(?=\[\[proxies\]\]|$)/g;
    let updatedContent = content;
    let found = false;

    // 查找并替换指定名称的代理配置
    const matches = content.matchAll(proxyBlockRegex);
    for (const match of matches) {
      try {
        const proxyContent = match[1].trim();
        if (proxyContent) {
          // 将配置内容转换为TOML格式
          const configStr = proxyContent.split('\n')
            .map(line => line.trim())
            .filter(line => line && !line.startsWith('['))
            .join('\n');
          const existingConfig = toml.parse(configStr) as Record<string, any>;
          if (existingConfig.name === name) {
            // 格式化为TOML格式
            const newProxyToml = formatProxyToToml(proxyConfig);
            
            // 替换原有配置块
            updatedContent = updatedContent.replace(
              match[0],
              `[[proxies]]\n${newProxyToml}`
            );
            found = true;
            break;
          }
        }
      } catch (err) {
        console.error('解析代理配置块失败:', err);
      }
    }

    if (!found) {
      throw new Error('代理不存在');
    }

    fs.writeFileSync(configPath, updatedContent);
    return true;
  } catch (error) {
    console.error('更新代理配置失败:', error);
    throw error;
  }
};

// 删除代理配置
export const deleteProxy = async (name: string) => {
  try {
    const { configPath } = getFrpcConfigPath();
    const content = fs.readFileSync(configPath, 'utf-8');

    // 使用正则表达式匹配所有代理配置块
    const proxyBlockRegex = /\[\[proxies\]\]([\s\S]*?)(?=\[\[proxies\]\]|$)/g;
    let updatedContent = content;
    let found = false;

    // 查找并删除指定名称的代理配置
    const matches = content.matchAll(proxyBlockRegex);
    for (const match of matches) {
      try {
        const proxyContent = match[1].trim();
        if (proxyContent) {
          const existingConfig = toml.parse(`${proxyContent}`) as Record<string, any>;
          if (existingConfig.name === name) {
            // 删除整个配置块
            updatedContent = updatedContent.replace(match[0], '');
            found = true;
            break;
          }
        }
      } catch (err) {
        console.error('解析代理配置块失败:', err);
      }
    }

    if (!found) {
      throw new Error('代理不存在');
    }

    // 清理多余的空行
    updatedContent = updatedContent.replace(/\n{3,}/g, '\n\n');
    fs.writeFileSync(configPath, updatedContent);
    return true;
  } catch (error) {
    console.error('删除代理配置失败:', error);
    throw error;
  }
};

// 设置IPC处理程序
export const setupProxyManageHandlers = () => {
  // 获取代理列表
  ipcMain.handle('get-proxy-list', async () => {
    return getProxyList();
  });

  // 获取代理配置
  ipcMain.handle('get-proxy-config', async (_event, name) => {
    return getProxyConfig(name);
  });

  // 添加代理
  ipcMain.handle('add-proxy', async (_event, config) => {
    return addProxy(config);
  });

  // 更新代理
  ipcMain.handle('update-proxy', async (_event, name, config) => {
    return updateProxy(name, config);
  });

  // 删除代理
  ipcMain.handle('delete-proxy', async (_event, name) => {
    return deleteProxy(name);
  });
}; 
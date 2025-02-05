import { app } from 'electron';
import fs from 'fs';
import path from 'path';
import toml from 'toml';

// 定义配置文件接口
export interface FrpsConfig {
    auth?: {
        method?: string;
        additionalScopes?: string[];
        token?: string;
        oidc?: {
            issuer?: string;
            audience?: string;
            skipExpiryCheck?: boolean;
            skipIssuerCheck?: boolean;
        };
    };
    bindAddr?: string;
    bindPort?: number;
    kcpBindPort?: number;
    quicBindPort?: number;
    proxyBindAddr?: string;
    vhostHTTPPort?: number;
    vhostHTTPTimeout?: number;
    vhostHTTPSPort?: number;
    tcpmuxHTTPConnectPort?: number;
    tcpmuxPassthrough?: boolean;
    subDomainHost?: string;
    custom404Page?: string;
    sshTunnelGateway?: {
        bindPort?: number;
        privateKeyFile?: string;
        autoGenPrivateKeyPath?: string;
        authorizedKeysFile?: string;
    };
    webServer?: {
        addr?: string;
        port?: number;
        user?: string;
        password?: string;
        assetsDir?: string;
        tls?: {
            certFile?: string;
            keyFile?: string;
            trustedCaFile?: string;
        };
    };
    enablePrometheus?: boolean;
    transport?: {
        tcpMuxKeepaliveInterval?: number;
        tcpKeepalive?: number;
        maxPoolCount?: number;
        heartbeatTimeout?: number;
        quic?: {
            keepalivePeriod?: string;
            maxIdleTimeout?: string;
            maxIncomingStreams?: number;
        };
        tls?: {
            force?: boolean;
            certFile?: string;
            keyFile?: string;
            trustedCaFile?: string;
        };
    };
    detailedErrorsToClient?: boolean;
    maxPortsPerClient?: number;
    userConnTimeout?: number;
    udpPacketSize?: number;
    natholeAnalysisDataReserveHours?: number;
    allowPorts?: Array<{
        start?: number;
        end?: number;
    }>;
    httpPlugins?: Array<{
        name: string;
        addr: string;
        path: string;
        ops: string[];
        tlsVerify?: boolean;
    }>;
}
// 将值转换为TOML兼容的格式
const valueToToml = (value: any): string => {
    if (value === undefined || value === null) {
        return '""';
    }
    if (typeof value === 'string') {
        return `"${value}"`;
    }
    if (typeof value === 'boolean' || typeof value === 'number') {
        return String(value);
    }
    if (Array.isArray(value)) {
        return `[${value.map(item => valueToToml(item)).join(', ')}]`;
    }
    if (typeof value === 'object') {
        return `{${Object.entries(value)
            .map(([k, v]) => `${k} = ${valueToToml(v)}`)
            .join(', ')}}`;
    }
    return '""';
};

// 递归处理嵌套对象，生成TOML格式
const objectToToml = (obj: any, prefix?: string): string[] => {
    const lines: string[] = [];
    const simpleProps: string[] = [];
    const complexProps: [string, any][] = [];

    Object.entries(obj).forEach(([key, value]) => {
        if (
            value === null ||
            value === undefined ||
            value === '' ||
            (Array.isArray(value) && value.length === 0) ||
            (typeof value === 'object' && Object.keys(value).length === 0)
        ) {
            return;
        }

        if (typeof value === 'object' && !Array.isArray(value)) {
            complexProps.push([key, value]);
        } else {
            simpleProps.push(`${key} = ${valueToToml(value)}`);
        }
    });

    if (prefix && simpleProps.length > 0) {
        lines.push(`[${prefix}]`);
    }
    lines.push(...simpleProps);

    complexProps.forEach(([key, value]) => {
        const newPrefix = prefix ? `${prefix}.${key}` : key;
        lines.push('', ...objectToToml(value, newPrefix));
    });

    return lines;
};

// 获取配置文件路径
export const getFrpsConfigPath = () => {
    const homeDir = app.getPath('home');
    const configDir = path.join(homeDir, '.frp-electron', 'frps-config');
    const configPath = path.join(configDir, 'frps.toml');
    return { configDir, configPath };
};

// 初始化默认配置
const defaultConfig: FrpsConfig = {
    bindAddr: "0.0.0.0",
    bindPort: 7000,
    auth: {
        method: "token",
        token: "",
    },
    transport: {
        tcpMuxKeepaliveInterval: 60,
        tcpKeepalive: 7200,
        maxPoolCount: 5,
        heartbeatTimeout: 90,
    },
    webServer: {
        addr: "0.0.0.0",
        port: 7500,
        user: "admin",
        password: "admin",
    },
    log: {
        level: "info",
        maxDays: 3,
    },
};

// 获取默认配置的 TOML 格式字符串
const getDefaultConfigToml = (): string => {
    return objectToToml(defaultConfig).join('\n');
};

// 确保配置目录存在
export const ensureConfigDir = () => {
    const { configDir, configPath } = getFrpsConfigPath();
    try {
        if (!fs.existsSync(configDir)) {
            fs.mkdirSync(configDir, { recursive: true });
            console.log('创建配置目录:', configDir);
        }

        if (!fs.existsSync(configPath)) {
            fs.writeFileSync(configPath, getDefaultConfigToml(), 'utf-8');
            console.log('创建默认配置文件:', configPath);
        }
    } catch (error) {
        console.error('创建配置目录或文件失败:', error);
        throw error;
    }
};

// 读取配置文件
export const readFrpsConfig = (): FrpsConfig => {
    const { configPath } = getFrpsConfigPath();
    try {
        if (!fs.existsSync(configPath)) {
            console.log('配置文件不存在，创建默认配置');
            fs.writeFileSync(configPath, getDefaultConfigToml(), 'utf-8');
            return defaultConfig;
        }

        const content = fs.readFileSync(configPath, 'utf-8');
        if (!content.trim()) {
            console.log('配置文件为空，写入默认配置');
            fs.writeFileSync(configPath, getDefaultConfigToml(), 'utf-8');
            return defaultConfig;
        }

        const config = toml.parse(content);
        return config || defaultConfig;
    } catch (error) {
        console.error('读取配置文件失败:', error);
        // 如果解析失败，写入默认配置
        try {
            fs.writeFileSync(configPath, getDefaultConfigToml(), 'utf-8');
        } catch (writeError) {
            console.error('写入默认配置失败:', writeError);
        }
        return defaultConfig;
    }
};

// 读取原始配置文件内容
export const readFrpsConfigFile = (): string => {
    const { configPath } = getFrpsConfigPath();
    try {
        if (!fs.existsSync(configPath)) {
            console.log('配置文件不存在，创建默认配置');
            const defaultToml = getDefaultConfigToml();
            fs.writeFileSync(configPath, defaultToml, 'utf-8');
            return defaultToml;
        }

        const content = fs.readFileSync(configPath, 'utf-8');
        if (!content.trim()) {
            console.log('配置文件为空，写入默认配置');
            const defaultToml = getDefaultConfigToml();
            fs.writeFileSync(configPath, defaultToml, 'utf-8');
            return defaultToml;
        }

        return content;
    } catch (error) {
        console.error('读取配置文件失败:', error);
        const defaultToml = getDefaultConfigToml();
        fs.writeFileSync(configPath, defaultToml, 'utf-8');
        return defaultToml;
    }
};

// 保存配置文件
export const saveFrpsConfig = async (config: FrpsConfig): Promise<void> => {
    const { configPath } = getFrpsConfigPath();
    try {
        // 转换配置对象为TOML格式
        const tomlContent = objectToToml(config).join('\n');

        // 写入文件
        await fs.promises.writeFile(configPath, tomlContent, 'utf-8');

        console.log('配置已保存到:', configPath);
        console.log('配置内容:', tomlContent);
    } catch (error) {
        console.error('保存配置文件失败:', error);
        throw error;
    }
};

// 在主进程中设置IPC处理程序
export const setupFrpsConfigHandlers = () => {
    const { ipcMain } = require('electron');

    // 读取配置
    ipcMain.handle('read-frps-config', async () => {
        return readFrpsConfig();
    });

    // 读取配置文件原始内容
    ipcMain.handle('read-frps-config-file', async () => {
        return readFrpsConfigFile();
    });

    // 保存配置
    ipcMain.handle('save-frps-config', async (_event, config: FrpsConfig) => {
        await saveFrpsConfig(config);
    });
};

// 添加 createReleaseFolder 函数
export const createReleaseFolder = () => {
  const releasePath = path.join(app.getPath('home'), '.frp-electron/frp-release');
  if (!fs.existsSync(releasePath)) {
    fs.mkdirSync(releasePath, { recursive: true });
  }
};

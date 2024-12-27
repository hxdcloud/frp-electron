import { app } from 'electron';
import fs from 'fs';
import path from 'path';
import toml from 'toml';

// 定义配置文件接口
export interface AuthOIDCClientConfig {
    clientID?: string;
    clientSecret?: string;
    audience?: string;
    scope?: string;
    tokenEndpointURL?: string;
    additionalEndpointParams?: { [key: string]: string };
}

export interface AuthClientConfig {
    method?: string;
    additionalScopes?: string[];
    token?: string;
    oidc?: AuthOIDCClientConfig;
}

export interface TLSClientConfig {
    enable?: boolean;
    disableCustomTLSFirstByte?: boolean;
    certFile?: string;
    keyFile?: string;
    trustedCaFile?: string;
}

export interface ClientTransportConfig {
    protocol?: string;
    dialServerTimeout?: number;
    dialServerKeepalive?: number;
    connectServerLocalIP?: string;
    proxyURL?: string;
    poolCount?: number;
    tcpMux?: boolean;
    tcpMuxKeepaliveInterval?: number;
    quic?: {
        keepalivePeriod?: string;
        maxIdleTimeout?: string;
        maxIncomingStreams?: number;
    };
    heartbeatInterval?: number;
    heartbeatTimeout?: number;
    tls?: TLSClientConfig;
}

export interface LogConfig {
    to?: string;
    level?: string;
    maxDays?: number;
    disablePrintColor?: boolean;
}

export interface WebServerConfig {
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
}

export interface ClientCommonConfig {
    auth?: AuthClientConfig;
    user?: string;
    serverAddr?: string;
    serverPort?: number;
    natHoleStunServer?: string;
    dnsServer?: string;
    loginFailExit?: boolean;
    start?: string[];
    log?: LogConfig;
    webServer?: WebServerConfig;
    transport?: ClientTransportConfig;
    udpPacketSize?: number;
    metadatas?: { [key: string]: string };
    includes?: string[];
}

export interface FrpcConfig extends ClientCommonConfig {
    proxies?: any[];
    visitors?: any[];
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
export const getFrpcConfigPath = () => {
    const homeDir = app.getPath('home');
    const configDir = path.join(homeDir, '.frp-electron', 'frpc-config');
    const configPath = path.join(configDir, 'frpc.toml');
    return { configDir, configPath };
};

// 初始化默认配置
const defaultConfig: FrpcConfig = {
    serverAddr: "127.0.0.1",
    serverPort: 7000,
    auth: {
        method: "token",
        token: "",
    },
    transport: {
        tcpMux: true,
        heartbeatInterval: 30,
        heartbeatTimeout: 90,
    },
    log: {
        level: "info",
        maxDays: 3,
        disablePrintColor: false,
    },
};

// 获取默认配置的 TOML 格式字符串
const getDefaultConfigToml = (): string => {
    return objectToToml(defaultConfig).join('\n');
};

// 确保配置目录存在
export const ensureConfigDir = () => {
    const { configDir, configPath } = getFrpcConfigPath();
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
export const readFrpcConfig = (): FrpcConfig => {
    const { configPath } = getFrpcConfigPath();
    try {
        if (!fs.existsSync(configPath)) {
            console.log('配置文件不存在，创建默认配置');
            const defaultToml = getDefaultConfigToml();
            fs.writeFileSync(configPath, defaultToml, 'utf-8');
            return defaultConfig;
        }

        const content = fs.readFileSync(configPath, 'utf-8');
        if (!content.trim()) {
            console.log('配置文件为空，写入默认配置');
            const defaultToml = getDefaultConfigToml();
            fs.writeFileSync(configPath, defaultToml, 'utf-8');
            return defaultConfig;
        }

        try {
            const config = toml.parse(content);
            console.log('成功读取配置文件:', config);
            return config;
        } catch (parseError) {
            console.error('解析TOML配置文件失败:', parseError);
            // 如果解析失败，写入默认配置
            const defaultToml = getDefaultConfigToml();
            fs.writeFileSync(configPath, defaultToml, 'utf-8');
            return defaultConfig;
        }
    } catch (error) {
        console.error('读取配置文件失败:', error);
        return defaultConfig;
    }
};

// 读取原始配置文件内容
export const readFrpcConfigFile = (): string => {
    const { configPath } = getFrpcConfigPath();
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
export const saveFrpcConfig = async (config: FrpcConfig): Promise<void> => {
    const { configPath } = getFrpcConfigPath();
    try {
        // 读取现有文件内容
        let existingContent = '';
        try {
            existingContent = fs.readFileSync(configPath, 'utf-8');
        } catch (error) {
            console.log('配置文件不存在，将创建新文件');
        }

        // 提取现有的代理配置
        const proxyConfigs: string[] = [];
        const proxyBlockRegex = /\[\[proxies\]\]([\s\S]*?)(?=\[\[proxies\]\]|$)/g;
        const matches = existingContent.matchAll(proxyBlockRegex);
        for (const match of matches) {
            if (match[0].trim()) {
                proxyConfigs.push(match[0].trim());
            }
        }

        // 移除config中的proxies字段，因为我们会单独处理代理配置
        const { proxies, ...globalConfig } = config;

        // 转换全局配置为TOML格式
        const globalConfigContent = objectToToml(globalConfig).join('\n');

        // 组合新的配置内容
        let newContent = globalConfigContent;
        
        // 如果有代理配置，添加到文件末尾
        if (proxyConfigs.length > 0) {
            newContent += '\n\n' + proxyConfigs.join('\n\n');
        }

        // 写入文件
        await fs.promises.writeFile(configPath, newContent, 'utf-8');

        console.log('配置已保存到:', configPath);
    } catch (error) {
        console.error('保存配置文件失败:', error);
        throw error;
    }
};

// 在主进程中设置IPC处理程序
export const setupFrpcConfigHandlers = () => {
    const { ipcMain } = require('electron');

    // 读取配置
    ipcMain.handle('read-frpc-config', async () => {
        return readFrpcConfig();
    });

    // 读取配置文件原始内容
    ipcMain.handle('read-frpc-config-file', async () => {
        return readFrpcConfigFile();
    });

    // 保存配置
    ipcMain.handle('save-frpc-config', async (_event, config: FrpcConfig) => {
        await saveFrpcConfig(config);
    });
};

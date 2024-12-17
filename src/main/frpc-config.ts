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
    serverAddr: '127.0.0.1',
    serverPort: 7000,
    auth: {
        method: 'token',
        token: '',
    },
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
            const defaultToml = objectToToml(defaultConfig).join('\n');
            fs.writeFileSync(configPath, defaultToml, 'utf-8');
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
        const content = fs.readFileSync(configPath, 'utf-8');
        if (!content.trim()) {
            console.log('配置文件为空，使用默认配置');
            return defaultConfig;
        }
        const config = toml.parse(content);
        return config || defaultConfig;
    } catch (error) {
        console.error('读取配置文件失败:', error);
        return defaultConfig;
    }
};

// 保存配置文件
export const saveFrpcConfig = async (config: FrpcConfig): Promise<void> => {
    const { configPath } = getFrpcConfigPath();
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
export const setupFrpcConfigHandlers = () => {
    const { ipcMain } = require('electron');

    // 读取配置
    ipcMain.handle('read-frpc-config', async () => {
        return readFrpcConfig();
    });

    // 保存配置
    ipcMain.handle('save-frpc-config', async (_event, config: FrpcConfig) => {
        await saveFrpcConfig(config);
    });
};

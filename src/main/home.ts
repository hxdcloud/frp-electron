import { ipcMain, BrowserWindow } from 'electron';
import os from 'os';
import { networkInterfaces } from 'os';

declare global {
    var mainWindow: BrowserWindow | null;
}

let systemInfoInterval: NodeJS.Timeout | null = null;

export function setupHomeHandlers() {
    // 获取系统信息
    ipcMain.handle('get-system-info', async () => {
        return getSystemInfo();
    });

    // 开始定期发送系统信息更新
    startSystemInfoBroadcast();
}

function startSystemInfoBroadcast() {
    if (systemInfoInterval) {
        clearInterval(systemInfoInterval);
    }

    systemInfoInterval = setInterval(async () => {
        const systemInfo = await getSystemInfo();
        // 广播系统信息到所有窗口
        global.mainWindow?.webContents.send('system-info-update', systemInfo);
    }, 1000); // 每秒更新一次
}

async function getSystemInfo() {
    const cpus = os.cpus();
    const totalMemory = os.totalmem();
    const freeMemory = os.freemem();
    const usedMemory = totalMemory - freeMemory;

    // 计算CPU使用率
    const cpuUsage = cpus.reduce((acc, cpu) => {
        const total = Object.values(cpu.times).reduce((a, b) => a + b);
        const idle = cpu.times.idle;
        return acc + ((total - idle) / total);
    }, 0) / cpus.length;

    // 获取系统负载
    const loadAvg = os.loadavg();

    // 获取网络接口信息
    const nets = networkInterfaces();
    let rx_bytes = 0;
    let tx_bytes = 0;
    Object.values(nets).forEach(net => {
        if (net) {
            net.forEach(interface_ => {
                if (interface_.family === 'IPv4') {
                    // 这里只是示例，实际的网络流量统计需要更复杂的实现
                    rx_bytes += 0;
                    tx_bytes += 0;
                }
            });
        }
    });

    return {
        cpu: cpuUsage * 100,
        memory: {
            total: totalMemory,
            used: usedMemory,
            free: freeMemory,
        },
        load: loadAvg,
        network: {
            rx_bytes,
            tx_bytes,
        },
        connections: {
            tcp: 0, // 需要更复杂的实现来获取实际的连接数
            udp: 0,
        },
    };
}

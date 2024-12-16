import { PageContainer } from '@ant-design/pro-components';
import { Card, Col, Progress, Row, Statistic } from 'antd';
import React, { useEffect, useState } from 'react';
import './index.less';

interface SystemInfo {
  cpu: number;
  memory: {
    total: number;
    used: number;
    free: number;
  };
  load: number[];
  network: {
    rx_bytes: number;
    tx_bytes: number;
  };
  connections: {
    tcp: number;
    udp: number;
  };
}

const HomePage: React.FC = () => {
  const [systemInfo, setSystemInfo] = useState<SystemInfo | null>(null);

  useEffect(() => {
    // 初始获取系统信息
    (window as any).electronAPI.getSystemInfo().then((info: SystemInfo) => {
      setSystemInfo(info);
    });

    // 订阅系统信息更新
    const unsubscribe = (window as any).electronAPI.subscribeSystemInfo(
      (info: SystemInfo) => {
        setSystemInfo(info);
      },
    );

    return () => {
      unsubscribe();
    };
  }, []);

  const formatBytes = (bytes: number) => {
    const sizes = ['B', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 B';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`;
  };

  const memoryUsagePercent = systemInfo
    ? (systemInfo.memory.used / systemInfo.memory.total) * 100
    : 0;

  return (
    <PageContainer>
      <Row gutter={[16, 16]}>
        <Col span={12}>
          <Card title="CPU 使用率">
            <Progress
              type="dashboard"
              percent={Number(systemInfo?.cpu.toFixed(1))}
              format={(percent) => `${percent}%`}
            />
          </Card>
        </Col>
        <Col span={12}>
          <Card title="内存使用率">
            <Progress
              type="dashboard"
              percent={Number(memoryUsagePercent.toFixed(1))}
              format={(percent) => `${percent}%`}
            />
            <div style={{ marginTop: 16 }}>
              <Statistic
                title="已用内存"
                value={systemInfo ? formatBytes(systemInfo.memory.used) : '0 B'}
              />
              <Statistic
                title="总内存"
                value={
                  systemInfo ? formatBytes(systemInfo.memory.total) : '0 B'
                }
              />
            </div>
          </Card>
        </Col>
      </Row>
    </PageContainer>
  );
};

export default HomePage;

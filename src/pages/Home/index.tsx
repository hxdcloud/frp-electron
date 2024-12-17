import React, { useEffect, useState } from 'react';
import { PageContainer } from '@ant-design/pro-components';
import { Card, Typography, Space, Tag } from 'antd';

const { Text } = Typography;

const HomePage: React.FC = () => {
  const [versionInfo, setVersionInfo] = useState<{
    hasVersion: boolean;
    version: string | null;
    hasFrps: boolean;
    hasFrpc: boolean;
  }>({
    hasVersion: false,
    version: null,
    hasFrps: false,
    hasFrpc: false,
  });

  useEffect(() => {
    const checkVersion = async () => {
      try {
        const info = await window.electronAPI.checkFrpVersion();
        setVersionInfo(info);
      } catch (error) {
        console.error('检查FRP版本失败:', error);
      }
    };
    checkVersion();
  }, []);

  return (
    <PageContainer>
      <Card title="FRP 状态">
        <Space direction="vertical" size="middle" style={{ display: 'flex' }}>
          <div>
            <Text strong>当前版本：</Text>
            {versionInfo.hasVersion ? (
              <Tag color="blue">{versionInfo.version}</Tag>
            ) : (
              <Tag color="red">未安装</Tag>
            )}
          </div>
          <div>
            <Text strong>组件状态：</Text>
            <Space>
              <Tag color={versionInfo.hasFrps ? 'success' : 'error'}>
                FRPS {versionInfo.hasFrps ? '已安装' : '未安装'}
              </Tag>
              <Tag color={versionInfo.hasFrpc ? 'success' : 'error'}>
                FRPC {versionInfo.hasFrpc ? '已安装' : '未安装'}
              </Tag>
            </Space>
          </div>
        </Space>
      </Card>
    </PageContainer>
  );
};

export default HomePage;

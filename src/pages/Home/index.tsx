import React, { useEffect, useState, useRef } from 'react';
import {
  PageContainer,
  ProCard,
  ProDescriptions,
} from '@ant-design/pro-components';
import { Button, Modal, Space, Tag, Typography, message } from 'antd';
import { ReloadOutlined, WarningOutlined } from '@ant-design/icons';
import { history } from '@umijs/max';

const { Text, Link } = Typography;

interface FrpStatus {
  running: boolean;
  exitCode: number | null;
}

interface FrpLog {
  type: 'info' | 'error';
  message: string;
  timestamp: string;
}

interface FrpVersionInfo {
  hasVersion: boolean;
  version: string | null;
  hasFrps: boolean;
  hasFrpc: boolean;
}

const Home: React.FC = () => {
  // 状态管理
  const [frpsStatus, setFrpsStatus] = useState<boolean>(false);
  const [frpcStatus, setFrpcStatus] = useState<boolean>(false);
  const [frpsLogs, setFrpsLogs] = useState<FrpLog[]>([]);
  const [frpcLogs, setFrpcLogs] = useState<FrpLog[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [logModalVisible, setLogModalVisible] = useState<boolean>(false);
  const [currentLogType, setCurrentLogType] = useState<'frps' | 'frpc'>('frps');
  const [versionInfo, setVersionInfo] = useState<FrpVersionInfo>({
    hasVersion: false,
    version: null,
    hasFrps: false,
    hasFrpc: false,
  });

  // 日志容器的引用
  const logContainerRef = useRef<HTMLDivElement>(null);

  // 添加日志自动滚动到底部的效果
  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [frpsLogs, frpcLogs]);

  // 格式化日志时间
  const formatTimestamp = () => {
    const now = new Date();
    return now.toLocaleTimeString('zh-CN', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      fractionalSecondDigits: 3,
    });
  };

  // 初始化状态和事件监听
  useEffect(() => {
    const init = async () => {
      try {
        // 检查FRP版本和安装状态
        const version = await window.electronAPI.checkFrpVersion();
        setVersionInfo(version);

        // 获取运行状态
        const frpsRunning = await window.electronAPI.getFrpsStatus();
        const frpcRunning = await window.electronAPI.getFrpcStatus();
        setFrpsStatus(frpsRunning);
        setFrpcStatus(frpcRunning);
      } catch (error) {
        console.error('获取FRP状态失败:', error);
      }
    };

    // 注册日志监听器
    const frpsLogCleanup = window.electronAPI.onFrpsLog((log) => {
      setFrpsLogs((prev) => [
        ...prev,
        { ...log, timestamp: formatTimestamp() },
      ].slice(-1000)); // 保留最新的1000条日志
    });

    const frpcLogCleanup = window.electronAPI.onFrpcLog((log) => {
      setFrpcLogs((prev) => [
        ...prev,
        { ...log, timestamp: formatTimestamp() },
      ].slice(-1000)); // 保留最新的1000条日志
    });

    // 注册状态监听器
    const frpsStatusCleanup = window.electronAPI.onFrpsStatus((status) => {
      console.log('收到FRPS状态更新:', status);
      setFrpsStatus(status.running);
      if (!status.running && status.exitCode !== null) {
        if (status.exitCode !== 0) {
          message.error(`FRPS已停止，退出代码: ${status.exitCode}`);
        }
      }
    });

    const frpcStatusCleanup = window.electronAPI.onFrpcStatus((status) => {
      console.log('收到FRPC状态更新:', status);
      setFrpcStatus(status.running);
      if (!status.running && status.exitCode !== null) {
        if (status.exitCode !== 0) {
          message.error(`FRPC已停止，退出代码: ${status.exitCode}`);
        }
      }
    });

    init();

    // 清理监听器
    return () => {
      frpsLogCleanup();
      frpcLogCleanup();
      frpsStatusCleanup();
      frpcStatusCleanup();
    };
  }, []);

  // 刷新状态
  const refreshStatus = async () => {
    setIsLoading(true);
    try {
      // 检查FRP版本和安装状态
      const version = await window.electronAPI.checkFrpVersion();
      setVersionInfo(version);

      // 获取运行状态
      const frpsRunning = await window.electronAPI.getFrpsStatus();
      const frpcRunning = await window.electronAPI.getFrpcStatus();
      setFrpsStatus(frpsRunning);
      setFrpcStatus(frpcRunning);
      message.success('状态已刷新');
    } catch (error) {
      message.error('刷新状态失败');
    } finally {
      setIsLoading(false);
    }
  };

  // 跳转到更新页面
  const goToUpdate = () => {
    history.push('/update');
  };

  // 启动FRPS
  const handleStartFrps = async () => {
    setIsLoading(true);
    try {
      const success = await window.electronAPI.startFrps();
      if (!success) {
        message.error('FRPS启动失败');
        setFrpsStatus(false);
      } else {
        message.success('FRPS启动成功');
        setFrpsStatus(true);
      }
    } catch (error) {
      message.error('FRPS启动失败: ' + (error as Error).message);
      setFrpsStatus(false);
    } finally {
      setIsLoading(false);
    }
  };

  // 启动FRPC
  const handleStartFrpc = async () => {
    setIsLoading(true);
    try {
      const success = await window.electronAPI.startFrpc();
      if (!success) {
        message.error('FRPC启动失败');
        setFrpcStatus(false);
      } else {
        message.success('FRPC启动成功');
        setFrpcStatus(true);
      }
    } catch (error) {
      message.error('FRPC���动失败: ' + (error as Error).message);
      setFrpcStatus(false);
    } finally {
      setIsLoading(false);
    }
  };

  // 停止FRPS
  const handleStopFrps = async () => {
    setIsLoading(true);
    try {
      const success = await window.electronAPI.stopFrps();
      if (!success) {
        message.error('停止FRPS失败');
      } else {
        message.success('FRPS已停止');
        setFrpsStatus(false);
      }
    } catch (error) {
      message.error('停止FRPS失败: ' + (error as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  // 停止FRPC
  const handleStopFrpc = async () => {
    setIsLoading(true);
    try {
      const success = await window.electronAPI.stopFrpc();
      if (!success) {
        message.error('停止FRPC失败');
      } else {
        message.success('FRPC已停止');
        setFrpcStatus(false);
      }
    } catch (error) {
      message.error('停止FRPC失败: ' + (error as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  // 清除日志
  const clearLogs = () => {
    if (currentLogType === 'frps') {
      setFrpsLogs([]);
    } else {
      setFrpcLogs([]);
    }
  };

  // 复制日志
  const copyLogs = () => {
    const logs = currentLogType === 'frps' ? frpsLogs : frpcLogs;
    const logText = logs
      .map((log) => `[${log.timestamp}] ${log.type.toUpperCase()}: ${log.message}`)
      .join('\n');
    navigator.clipboard.writeText(logText).then(
      () => {
        message.success('日志已复制到剪贴板');
      },
      () => {
        message.error('复制日志失败');
      },
    );
  };

  // 显示日志
  const showLogs = (type: 'frps' | 'frpc') => {
    setCurrentLogType(type);
    setLogModalVisible(true);
  };

  // 渲染日志内容
  const renderLogContent = (log: FrpLog) => {
    const style = {
      padding: '4px 8px',
      borderRadius: '4px',
      marginBottom: '4px',
      backgroundColor: log.type === 'error' ? '#fff2f0' : '#f6ffed',
      border: `1px solid ${log.type === 'error' ? '#ffccc7' : '#b7eb8f'}`,
    };

    return (
      <div style={style}>
        <span style={{ color: '#8c8c8c', marginRight: '8px' }}>[{log.timestamp}]</span>
        <Text type={log.type === 'error' ? 'danger' : undefined}>{log.message}</Text>
      </div>
    );
  };

  return (
    <PageContainer
      extra={[
        <Button
          key="refresh"
          icon={<ReloadOutlined />}
          onClick={refreshStatus}
          loading={isLoading}
        >
          刷新状态
        </Button>,
      ]}
    >
      <Space direction="vertical" style={{ width: '100%' }} size="middle">
        {/* 版本信息卡片 */}
        <ProCard title="FRP版本信息" headerBordered>
          <ProDescriptions column={2}>
            <ProDescriptions.Item label="当前版本">
              {versionInfo.hasVersion ? (
                <Tag color="blue">{versionInfo.version}</Tag>
              ) : (
                <Tag color="red">未安装</Tag>
              )}
            </ProDescriptions.Item>
            <ProDescriptions.Item>
              {!versionInfo.hasVersion && (
                <Space>
                  <WarningOutlined style={{ color: '#faad14' }} />
                  <Text type="warning">
                    FRP未安装，请先
                    <Link onClick={goToUpdate}>安装或更新FRP</Link>
                  </Text>
                </Space>
              )}
            </ProDescriptions.Item>
          </ProDescriptions>
        </ProCard>

        {/* FRPS状态卡片 */}
        <ProCard title="FRPS服务" headerBordered>
          <ProDescriptions column={2}>
            <ProDescriptions.Item label="安装状态">
              <Tag color={versionInfo.hasFrps ? 'success' : 'error'}>
                {versionInfo.hasFrps ? '已安装' : '未安装'}
              </Tag>
            </ProDescriptions.Item>
            <ProDescriptions.Item label="运行状态">
              <Tag color={frpsStatus ? 'success' : 'error'}>
                {frpsStatus ? '运行中' : '已停止'}
              </Tag>
            </ProDescriptions.Item>
            <ProDescriptions.Item>
              <Space>
                <Button
                  type="primary"
                  onClick={handleStartFrps}
                  disabled={!versionInfo.hasFrps || frpsStatus || isLoading}
                >
                  启动
                </Button>
                <Button
                  danger
                  onClick={handleStopFrps}
                  disabled={!versionInfo.hasFrps || !frpsStatus || isLoading}
                >
                  停止
                </Button>
                <Button
                  onClick={() => showLogs('frps')}
                  disabled={!versionInfo.hasFrps}
                >
                  查看日志
                </Button>
              </Space>
            </ProDescriptions.Item>
          </ProDescriptions>
        </ProCard>

        {/* FRPC状态卡片 */}
        <ProCard title="FRPC服务" headerBordered>
          <ProDescriptions column={2}>
            <ProDescriptions.Item label="安装状态">
              <Tag color={versionInfo.hasFrpc ? 'success' : 'error'}>
                {versionInfo.hasFrpc ? '已安装' : '未安装'}
              </Tag>
            </ProDescriptions.Item>
            <ProDescriptions.Item label="运行状态">
              <Tag color={frpcStatus ? 'success' : 'error'}>
                {frpcStatus ? '运行中' : '已停止'}
              </Tag>
            </ProDescriptions.Item>
            <ProDescriptions.Item>
              <Space>
                <Button
                  type="primary"
                  onClick={handleStartFrpc}
                  disabled={!versionInfo.hasFrpc || frpcStatus || isLoading}
                >
                  启动
                </Button>
                <Button
                  danger
                  onClick={handleStopFrpc}
                  disabled={!versionInfo.hasFrpc || !frpcStatus || isLoading}
                >
                  停止
                </Button>
                <Button
                  onClick={() => showLogs('frpc')}
                  disabled={!versionInfo.hasFrpc}
                >
                  查看日志
                </Button>
              </Space>
            </ProDescriptions.Item>
          </ProDescriptions>
        </ProCard>
      </Space>

      {/* 日志查看模态框 */}
      <Modal
        title={`${currentLogType.toUpperCase()} 日志`}
        open={logModalVisible}
        onCancel={() => setLogModalVisible(false)}
        width={800}
        footer={[
          <Button key="clear" onClick={clearLogs}>
            清除日志
          </Button>,
          <Button key="copy" type="primary" onClick={copyLogs}>
            复制日志
          </Button>,
          <Button key="close" onClick={() => setLogModalVisible(false)}>
            关闭
          </Button>,
        ]}
      >
        <div
          ref={logContainerRef}
          style={{
            height: '500px',
            overflow: 'auto',
            backgroundColor: '#fafafa',
            padding: '16px',
            borderRadius: '4px',
          }}
        >
          {(currentLogType === 'frps' ? frpsLogs : frpcLogs).map((log, index) => (
            <div key={`${log.timestamp}-${index}`}>{renderLogContent(log)}</div>
          ))}
        </div>
      </Modal>
    </PageContainer>
  );
};

export default Home;

import { request } from '@@/plugin-request';
import { CheckOutlined, CloudDownloadOutlined, GithubOutlined, ReloadOutlined } from '@ant-design/icons';
import { PageContainer, ProList } from '@ant-design/pro-components';
import {
  Button,
  Card,
  Progress,
  Space,
  Tag,
  Typography,
  message,
  Tooltip,
  Popconfirm,
  Alert,
  Spin,
  Result,
} from 'antd';
import React, { useEffect, useState } from 'react';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

interface ReleaseInfo {
  tag_name: string;
  name: string;
  published_at: string;
  assets: Array<{
    name: string;
    download_count: number;
    size: number;
    browser_download_url: string;
  }>;
  body: string;
}

const SystemInfoPage: React.FC = () => {
  const [downloadProgress, setDownloadProgress] = useState<number>(0);
  const [extractProgress, setExtractProgress] = useState<number>(0);
  const [isDownloading, setIsDownloading] = useState<boolean>(false);
  const [isExtracting, setIsExtracting] = useState<boolean>(false);
  const [currentVersion, setCurrentVersion] = useState<string | null>(null);
  const [existingVersions, setExistingVersions] = useState<string[]>([]);
  const [releases, setReleases] = useState<ReleaseInfo[]>([]);
  const [downloadingVersion, setDownloadingVersion] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const platform = (window as any).electronAPI.platform;
  const arch = (window as any).electronAPI.arch;

  // 获取适合当前系统的文件扩展名和平台标识
  const getSystemInfo = () => {
    let fileExtension = 'tar.gz';
    let osPlatform = '';
    let chipArchitecture = '';

    if (platform === 'win32') {
      osPlatform = 'windows';
      fileExtension = 'zip';
    } else if (platform === 'darwin') {
      osPlatform = 'darwin';
    } else if (platform === 'linux') {
      osPlatform = 'linux';
    } else if (platform === 'freebsd') {
      osPlatform = 'freebsd';
    } else if (platform === 'android') {
      osPlatform = 'android';
    }

    if (arch === 'x64' || arch === 'amd64') {
      chipArchitecture = 'amd64';
    } else if (arch === 'arm64') {
      chipArchitecture = 'arm64';
    } else if (arch === 'arm') {
      chipArchitecture = 'arm';
    } else if (arch === 'riscv64') {
      chipArchitecture = 'riscv64';
    }

    return { fileExtension, osPlatform, chipArchitecture };
  };

  // 格式化文件大小
  const formatFileSize = (bytes: number): string => {
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;
    
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }
    
    return `${size.toFixed(2)} ${units[unitIndex]}`;
  };

  const fetchReleaseData = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await request<ReleaseInfo[]>(
        'https://api.github.com/repos/fatedier/frp/releases',
        {
          timeout: 10000, // 10秒超时
        }
      );
      setReleases(result);
    } catch (err) {
      const errorMessage = (err as Error).message;
      if (errorMessage.includes('timeout') || errorMessage.includes('network')) {
        setError('无法连接到GitHub，请检查您的网络连接');
      } else if (errorMessage.includes('403')) {
        setError('GitHub API 访问受限，请稍后再试');
      } else {
        setError('获取版本信息失败，请稍后重试');
      }
      console.error('获取版本信息失败:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReleaseData();

    (window as any).electronAPI.onDownloadProgress(
      ({ percent }: { percent: number }) => {
        setDownloadProgress(Number((percent * 100).toFixed(2)));
      },
    );

    (window as any).electronAPI.onExtractProgress((progress: number) => {
      setIsExtracting(true);
      setExtractProgress(Number((progress * 100).toFixed(2)));
    });

    (window as any).electronAPI
      .getFrpVersion()
      .then(
        ({
          versions,
          currentVersion,
        }: {
          versions: string;
          currentVersion: string | null;
        }) => {
          if (versions) {
            const versionList = versions.split('\n').filter(Boolean);
            setExistingVersions(versionList);
            setCurrentVersion(currentVersion || versionList[0] || null);
          }
        },
      );
  }, []);

  const handleDownload = async (version: string) => {
    const { fileExtension, osPlatform, chipArchitecture } = getSystemInfo();
    
    if (!osPlatform || !chipArchitecture) {
      message.error('不支持的系统或架构');
      return;
    }

    const versionNumber = version.substring(1);
    const downloadUrl = `https://github.com/fatedier/frp/releases/download/${version}/frp_${versionNumber}_${osPlatform}_${chipArchitecture}.${fileExtension}`;
    
    setDownloadProgress(0);
    setExtractProgress(0);
    setIsDownloading(true);
    setIsExtracting(false);
    setDownloadingVersion(version);

    try {
      const result = await (window as any).electronAPI.downloadFile(downloadUrl);
      if (result) {
        message.success('下载和解压完成！');
        const { versions } = await (window as any).electronAPI.getFrpVersion();
        if (versions) {
          const versionList = versions.split('\n').filter(Boolean);
          setExistingVersions(versionList);
        }
      }
    } catch (err) {
      message.error('下载失败：' + (err as Error).message);
    } finally {
      setIsDownloading(false);
      setIsExtracting(false);
      setDownloadingVersion('');
    }
  };

  const handleVersionSelect = async (version: string) => {
    try {
      await (window as any).electronAPI.setCurrentVersion(version);
      setCurrentVersion(version);
      message.success('版本切换成功');
    } catch (err) {
      message.error('版本切换失败');
    }
  };

  const getCompatibleAsset = (release: ReleaseInfo) => {
    const { fileExtension, osPlatform, chipArchitecture } = getSystemInfo();
    const versionNumber = release.tag_name.substring(1);
    const expectedFileName = `frp_${versionNumber}_${osPlatform}_${chipArchitecture}.${fileExtension}`;
    return release.assets.find(asset => asset.name === expectedFileName);
  };

  const renderContent = () => {
    if (loading) {
      return (
        <div style={{ textAlign: 'center', padding: '50px 0' }}>
          <Spin size="large" />
          <div style={{ marginTop: 16 }}>正在获取版本信息...</div>
        </div>
      );
    }

    if (error) {
      return (
        <Result
          status="warning"
          title="获取版本信息失败"
          subTitle={error}
          extra={[
            <Button
              key="retry"
              type="primary"
              icon={<ReloadOutlined />}
              onClick={fetchReleaseData}
            >
              重试
            </Button>,
            <Button
              key="manual"
              href="https://github.com/fatedier/frp/releases"
              target="_blank"
              icon={<GithubOutlined />}
            >
              手动下载
            </Button>,
          ]}
        >
          <Alert
            type="info"
            showIcon
            message="手动下载说明"
            description={
              <div>
                1. 点击"手动下载"按钮访问 GitHub Releases 页面<br />
                2. 下载对应系统的压缩包：
                   {platform === 'win32' ? 'windows' : platform}_{arch === 'x64' ? 'amd64' : arch}<br />
                3. 解压下载的文件到 {(window as any).electronAPI.showDownloadPath()}<br />
                4. 重启应用后即可使用新版本
              </div>
            }
          />
        </Result>
      );
    }

    return (
      <ProList<ReleaseInfo>
        rowKey="tag_name"
        dataSource={releases}
        split={true}
        pagination={{
          pageSize: 10,
        }}
        cardProps={{
          bodyStyle: {
            padding: '16px 24px',
          },
        }}
        style={{
          background: '#fff',
          borderRadius: '8px',
        }}
        metas={{
          title: {
            dataIndex: 'tag_name',
            render: (_, record) => (
              <Space size="middle" style={{ padding: '8px 0' }}>
                <Text strong style={{ fontSize: '16px' }}>{record.tag_name}</Text>
                {record.tag_name === currentVersion && (
                  <Tag color="success" icon={<CheckOutlined />}>
                    当前使用
                  </Tag>
                )}
                {existingVersions.includes(record.tag_name) && 
                  record.tag_name !== currentVersion && (
                  <Tag color="blue">已下载</Tag>
                )}
              </Space>
            ),
          },
          description: {
            render: (_, record) => (
              <Space style={{ padding: '4px 0' }}>
                <Text type="secondary">
                  发布时间: {dayjs(record.published_at).format('YYYY-MM-DD HH:mm:ss')}
                </Text>
                {getCompatibleAsset(record) && (
                  <>
                    <Text type="secondary">
                      文件大小: {formatFileSize(getCompatibleAsset(record)!.size)}
                    </Text>
                    <Text type="secondary">
                      下载次数: {getCompatibleAsset(record)!.download_count}
                    </Text>
                  </>
                )}
              </Space>
            ),
          },
          actions: {
            render: (_, record) => {
              const isCurrentVersion = record.tag_name === currentVersion;
              const isDownloaded = existingVersions.includes(record.tag_name);
              const compatibleAsset = getCompatibleAsset(record);

              return [
                <Space key="actions" size="middle" style={{ padding: '8px 0' }}>
                  {compatibleAsset ? (
                    isDownloaded ? (
                      <Popconfirm
                        title="切换版本"
                        description="确定要切换到这个版本吗？"
                        onConfirm={() => handleVersionSelect(record.tag_name)}
                        disabled={isCurrentVersion}
                      >
                        <Button 
                          type={isCurrentVersion ? 'primary' : 'default'}
                          disabled={isCurrentVersion}
                        >
                          {isCurrentVersion ? '使用中' : '切换到此版本'}
                        </Button>
                      </Popconfirm>
                    ) : (
                      <Button
                        type="primary"
                        icon={<CloudDownloadOutlined />}
                        onClick={() => handleDownload(record.tag_name)}
                        loading={isDownloading && downloadingVersion === record.tag_name}
                        disabled={isDownloading}
                      >
                        下载
                      </Button>
                    )
                  ) : (
                    <Tooltip title="当前系统不支持此版本">
                      <Button disabled>不支持的版本</Button>
                    </Tooltip>
                  )}
                  <Button
                    icon={<GithubOutlined />}
                    href={`https://github.com/fatedier/frp/releases/tag/${record.tag_name}`}
                    target="_blank"
                  >
                    查看详情
                  </Button>
                </Space>
              ];
            },
          },
        }}
      />
    );
  };

  return (
    <PageContainer>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <Card>
          <Title level={4}>系统信息</Title>
          <Space direction="vertical" style={{ width: '100%' }}>
            <Text strong>
              操作系统: <Tag color="blue">{platform}</Tag>
            </Text>
            <Text strong>
              处理器架构: <Tag color="green">{arch}</Tag>
            </Text>
            <Text strong>
              当前版本:  
              {currentVersion ? (
                <Tag color="processing">
                  {currentVersion}
                </Tag>
              ) : (
                <Tag color="warning">未安装</Tag>
              )}
            </Text>
          </Space>
        </Card>

        {(isDownloading || isExtracting) && (
          <Card>
            <Space direction="vertical" style={{ width: '100%' }}>
              {isDownloading && (
                <div>
                  <Text strong>下载进度 ({downloadingVersion}):</Text>
                  <Progress percent={downloadProgress} status="active" />
                </div>
              )}
              {isExtracting && (
                <div>
                  <Text strong>解压进度:</Text>
                  <Progress percent={extractProgress} status="active" />
                </div>
              )}
            </Space>
          </Card>
        )}

        {renderContent()}
      </Space>
    </PageContainer>
  );
};

export default SystemInfoPage;

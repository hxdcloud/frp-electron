import { request } from '@@/plugin-request';
import { CheckOutlined, CloudDownloadOutlined } from '@ant-design/icons';
import { PageContainer } from '@ant-design/pro-components';
import {
  Button,
  Card,
  List,
  message,
  Progress,
  Select,
  Space,
  Tag,
  Typography,
} from 'antd';
import React, { useEffect, useState } from 'react';

const { Option } = Select;
const { Title, Text } = Typography;

const SystemInfoPage: React.FC = () => {
  const [downloadProgress, setDownloadProgress] = useState<number>(0);
  const [extractProgress, setExtractProgress] = useState<number>(0);
  const [isDownloading, setIsDownloading] = useState<boolean>(false);
  const [isExtracting, setIsExtracting] = useState<boolean>(false);
  const [currentVersion, setCurrentVersion] = useState<string | null>(null);
  const [existingVersions, setExistingVersions] = useState<string[]>([]);
  const [selectedVersion, setSelectedVersion] = useState<string | null>(null);
  const [availableReleases, setAvailableReleases] = useState<string[]>([]);
  const [downloadVersion, setDownloadVersion] = useState<string>('');
  const platform = (window as any).electronAPI.platform;
  const arch = (window as any).electronAPI.arch;

  useEffect(() => {
    const fetchReleaseData = async () => {
      try {
        const result = await request(
          'https://api.github.com/repos/fatedier/frp/releases',
        );
        const versions = result.map((release: any) => release.tag_name);
        setAvailableReleases(versions);
        setDownloadVersion(versions[0]);
      } catch (err) {
        message.error('获取版本信息失败');
      }
    };

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
            setSelectedVersion(currentVersion || versionList[0] || null);
            setCurrentVersion(currentVersion || versionList[0] || null);
          }
        },
      );
  }, []);

  const handleDownload = async () => {
    if (downloadVersion) {
      const downloadUrl = `https://github.com/fatedier/frp/releases/download/${downloadVersion}/frp_${downloadVersion.substring(
        1,
      )}_${platform}_${arch}.tar.gz`;
      setDownloadProgress(0);
      setExtractProgress(0);
      setIsDownloading(true);
      setIsExtracting(false);

      message.loading('开始下载...', 1);
      try {
        const result = await (window as any).electronAPI.downloadFile(
          downloadUrl,
        );
        if (result) {
          message.success('下载和解压完成！');
          const { versions } = await (
            window as any
          ).electronAPI.getFrpVersion();
          if (versions) {
            const versionList = versions.split('\n').filter(Boolean);
            setExistingVersions(versionList);
          }
        }
      } catch (err) {
        message.error('操作失败：' + (err as Error).message);
      } finally {
        setIsDownloading(false);
        setIsExtracting(false);
      }
    }
  };

  const handleVersionSelect = async (version: string) => {
    setSelectedVersion(version);
    try {
      await (window as any).electronAPI.setCurrentVersion(version);
      setCurrentVersion(version);
      message.success('版本切换成功');
    } catch (err) {
      message.error('版本切换失败');
    }
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
                <Tag color="processing" icon={<CheckOutlined />}>
                  {currentVersion}
                </Tag>
              ) : (
                <Tag color="warning">未安装</Tag>
              )}
            </Text>
          </Space>
        </Card>

        <Card>
          <Title level={4}>版本管理</Title>
          <Space direction="vertical" style={{ width: '100%' }}>
            <div>
              <Text strong>下载新版本</Text>
              <div
                style={{
                  marginTop: 16,
                  display: 'flex',
                  gap: '10px',
                  alignItems: 'center',
                }}
              >
                <Select
                  style={{ width: 200 }}
                  value={downloadVersion}
                  onChange={(value) => setDownloadVersion(value)}
                  placeholder="选择版本"
                >
                  {availableReleases.map((version) => (
                    <Option key={version} value={version}>
                      {version}
                    </Option>
                  ))}
                </Select>
                <Button
                  type="primary"
                  icon={<CloudDownloadOutlined />}
                  onClick={handleDownload}
                  disabled={isDownloading || !downloadVersion}
                  loading={isDownloading}
                >
                  {isDownloading ? '下载中' : '下载'}
                </Button>
              </div>
            </div>

            {isDownloading && (
              <div style={{ marginTop: 16 }}>
                <Text strong>下载进度:</Text>
                <Progress percent={downloadProgress} status="active" />
              </div>
            )}

            {isExtracting && (
              <div style={{ marginTop: 16 }}>
                <Text strong>解压进度:</Text>
                <Progress percent={extractProgress} status="active" />
              </div>
            )}
          </Space>
        </Card>

        <Card>
          <Title level={4}>已安装版本</Title>
          <List
            dataSource={existingVersions}
            renderItem={(version) => (
              <List.Item
                key={version}
                style={{ cursor: 'pointer' }}
                onClick={() => handleVersionSelect(version)}
              >
                <List.Item.Meta
                  title={
                    <Space>
                      <Text>{version}</Text>
                      {version === currentVersion && (
                        <Tag color="success" icon={<CheckOutlined />}>
                          当前使用
                        </Tag>
                      )}
                      {version === selectedVersion &&
                        version !== currentVersion && (
                          <Tag color="processing">已选择</Tag>
                        )}
                    </Space>
                  }
                />
                <Button
                  type={version === currentVersion ? 'primary' : 'default'}
                  disabled={version === currentVersion}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleVersionSelect(version);
                  }}
                >
                  {version === currentVersion ? '使用中' : '切换到此版本'}
                </Button>
              </List.Item>
            )}
          />
        </Card>
      </Space>
    </PageContainer>
  );
};

export default SystemInfoPage;

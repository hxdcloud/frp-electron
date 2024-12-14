import React, { useEffect, useState } from 'react';
import { PageContainer } from '@ant-design/pro-components';
import { request } from '@@/plugin-request';

const SystemInfoPage: React.FC = () => {
  const [releaseData, setReleaseData] = useState<any>(null);
  const [error, setError] = useState<any>(null);
  const platform = (window as any).electronAPI.platform;
  const arch = (window as any).electronAPI.arch;

  useEffect(() => {
    const fetchReleaseData = async () => {
      try {
        const result = await request('https://api.github.com/repos/fatedier/frp/releases');
        setReleaseData(result[0]); // 设置最新的 release 数据
      } catch (err) {
        setError(err); // 捕获并设置错误信息
      }
    };

    fetchReleaseData();
  }, []); // 只在组件挂载时运行

  if (error) {
    return <div>获取 release 信息失败: {error.message}</div>;
  }

  const downloadUrl = releaseData
    ? `https://github.com/fatedier/frp/releases/download/${releaseData.tag_name}/frp_${releaseData.tag_name.substring(1)}_${platform}_${arch}.tar.gz`
    : '';

  const handleDownload = () => {
    if (releaseData) {
      (window as any).electronAPI.downloadFile(downloadUrl);
    }
  };
  return (
    <PageContainer>
      <div>
        <h2>当前操作系统及架构信息</h2>
        <p>操作系统: {platform}</p>
        <p>处理器架构: {arch}</p>
        {releaseData && (
          <>
            <p>最新版本: {releaseData.tag_name}</p>
            <a href={downloadUrl} target="_blank" rel="noopener noreferrer">
              下载最新版本
            </a>
            <button onClick={handleDownload}>
              下载并保存
            </button>
          </>
        )}
      </div>
    </PageContainer>
  );
};

export default SystemInfoPage;
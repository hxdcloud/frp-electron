import { PageContainer } from '@ant-design/pro-components';
import { Row, Col, Button, message } from 'antd';
import React, { useState } from 'react';
import './index.less';

const HomePage: React.FC = () => {
  const [isFrpsRunning, setIsFrpsRunning] = useState(false);

  const handleStartFrps = async () => {
    try {
      await window.electronAPI.startFrps();
      setIsFrpsRunning(true);
    } catch (error) {
      message.error('启动 FRPS 失败：' + (error as Error).message);
    }
  };

  const handleStopFrps = async () => {
    try {
      await window.electronAPI.stopFrps();
      setIsFrpsRunning(false);
    } catch (error) {
      message.error('停止 FRPS 失败：' + (error as Error).message);
    }
  };

  return (
    <PageContainer>
      <Row gutter={[16, 16]}>
        <Col>
          <Button 
            type="primary"
            onClick={handleStartFrps}
            disabled={isFrpsRunning}
          >
            启动 FRPS
          </Button>
        </Col>
        <Col>
          <Button 
            danger
            onClick={handleStopFrps}
            disabled={!isFrpsRunning}
          >
            停止 FRPS
          </Button>
        </Col>
      </Row>
    </PageContainer>
  );
};

export default HomePage;

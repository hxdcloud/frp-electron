import {
  PageContainer,
  ProForm,
  ProFormDigit,
  ProFormGroup,
  ProFormList,
  ProFormSelect,
  ProFormSwitch,
  ProFormText,
} from '@ant-design/pro-components';
import { Card, message } from 'antd';
import React, { useEffect, useState } from 'react';

const { electronAPI } = window;

const FrpsConfig: React.FC = () => {
  const [initialValues, setInitialValues] = useState<any>({});

  // 加载初始配置
  useEffect(() => {
    const loadConfig = async () => {
      try {
        const config = await electronAPI.readFrpsConfig();
        setInitialValues(config);
      } catch (error) {
        message.error('加载配置失败');
      }
    };
    loadConfig();
  }, []);

  // 处理表单提交
  const handleSubmit = async (values: any) => {
    try {
      await electronAPI.saveFrpsConfig(values);
      message.success('配置保存成功');
    } catch (error) {
      message.error('配置保存失败');
    }
  };

  return (
    <PageContainer>
      <Card title="FRP 服务端配置">
        <ProForm
          initialValues={initialValues}
          onFinish={handleSubmit}
          grid={true}
          rowProps={{
            gutter: [16, 16],
          }}
        >
          {/* 基础配置 */}
          <ProFormGroup title="基础配置" collapsible>
            <ProFormText
              name="bindAddr"
              label="监听地址"
              tooltip="服务端监听地址，默认为0.0.0.0"
              placeholder="请输入监听地址"
              colProps={{ span: 12 }}
            />
            <ProFormDigit
              name="bindPort"
              label="监听端口"
              tooltip="服务端监听端口，默认为7000"
              placeholder="请输入监听端口"
              colProps={{ span: 12 }}
            />
          </ProFormGroup>

          {/* 认证配置 */}
          <ProFormGroup title="认证配置" collapsible>
            <ProFormSelect
              name={['auth', 'method']}
              label="认证方式"
              options={[
                { label: 'Token认证', value: 'token' },
                { label: 'OIDC认证', value: 'oidc' },
              ]}
              colProps={{ span: 12 }}
            />
            <ProFormText
              name={['auth', 'token']}
              label="Token"
              tooltip="认证token"
              placeholder="请输入认证token"
              colProps={{ span: 12 }}
            />
          </ProFormGroup>

          {/* 代理配置 */}
          <ProFormGroup title="代理配置" collapsible>
            <ProFormDigit
              name="vhostHTTPPort"
              label="HTTP代理端口"
              tooltip="HTTP类型代理监听的端口"
              colProps={{ span: 8 }}
            />
            <ProFormDigit
              name="vhostHTTPSPort"
              label="HTTPS代理端口"
              tooltip="HTTPS类型代理监听的端口"
              colProps={{ span: 8 }}
            />
            <ProFormDigit
              name="vhostHTTPTimeout"
              label="HTTP超时时间"
              tooltip="HTTP类型代理超时时间(秒)"
              colProps={{ span: 8 }}
            />
          </ProFormGroup>

          {/* 高级配置 */}
          <ProFormGroup title="高级配置" collapsible>
            <ProFormSwitch
              name="detailedErrorsToClient"
              label="详细错误信息"
              tooltip="是否向客户端返回详细错误信息"
              colProps={{ span: 8 }}
            />
            <ProFormDigit
              name="maxPortsPerClient"
              label="最大端口数"
              tooltip="限制单个客户端最大同时存在的代理数"
              colProps={{ span: 8 }}
            />
            <ProFormDigit
              name="userConnTimeout"
              label="连接超时时间"
              tooltip="用户建立连接后等待客户端响应的超时时间(秒)"
              colProps={{ span: 8 }}
            />
          </ProFormGroup>

          {/* 端口范围配置 */}
          <ProFormGroup title="端口范围配置" collapsible>
            <ProFormList
              name="allowPorts"
              label="允许的端口范围"
              creatorButtonProps={{
                creatorButtonText: '添加端口范围',
              }}
            >
              <ProFormGroup>
                <ProFormDigit
                  name="start"
                  label="起始端口"
                  colProps={{ span: 12 }}
                />
                <ProFormDigit
                  name="end"
                  label="结束端口"
                  colProps={{ span: 12 }}
                />
              </ProFormGroup>
            </ProFormList>
          </ProFormGroup>

          {/* Web服务器配置 */}
          <ProFormGroup title="Web服务器配置" collapsible>
            <ProFormSwitch
              name="enablePrometheus"
              label="启用Prometheus"
              tooltip="是否提供Prometheus监控接口"
              colProps={{ span: 24 }}
            />
            <ProFormText
              name={['webServer', 'addr']}
              label="Web服务地址"
              colProps={{ span: 12 }}
            />
            <ProFormDigit
              name={['webServer', 'port']}
              label="Web服务端口"
              colProps={{ span: 12 }}
            />
          </ProFormGroup>
        </ProForm>
      </Card>
    </PageContainer>
  );
};

export default FrpsConfig;

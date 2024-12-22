import {
  PageContainer,
  ProForm,
  ProFormDigit,
  ProFormGroup,
  ProFormSelect,
  ProFormSwitch,
  ProFormText,
} from '@ant-design/pro-components';
import { Card, message } from 'antd';
import React, { useEffect, useState } from 'react';

const FrpcConfig: React.FC = () => {
  const [initialValues, setInitialValues] = useState<any>({});
  const [form] = ProForm.useForm();
  const [authMethod, setAuthMethod] = useState<string>('token');

  // 加载初始配置
  useEffect(() => {
    const loadConfig = async () => {
      try {
        const config = await window.electronAPI.readFrpcConfig();
        setInitialValues(config);
        form.setFieldsValue(config);
        setAuthMethod(config.auth?.method || 'token');
      } catch (error) {
        console.error('加载配置失败:', error);
        message.error('加载配置失败: ' + (error as Error).message);
      }
    };
    loadConfig();
  }, [form]);

  // 处理表单提交
  const handleSubmit = async (values: any) => {
    try {
      await window.electronAPI.saveFrpcConfig(values);
      message.success('配置保存成功');
      const newConfig = await window.electronAPI.readFrpcConfig();
      setInitialValues(newConfig);
      form.setFieldsValue(newConfig);
      setAuthMethod(newConfig.auth?.method || 'token');
    } catch (error) {
      message.error('配置保存失败');
    }
  };

  // 处理认证方式变化
  const handleAuthMethodChange = (value: string) => {
    setAuthMethod(value);
  };

  // IP 地址验证规则
  const ipAddressRule = {
    validator: (_: any, value: string) => {
      const ipRegex = /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
      if (!value || ipRegex.test(value)) {
        return Promise.resolve();
      }
      return Promise.reject(new Error('请输入有效的IP地址'));
    },
  };

  return (
    <PageContainer>
      <Card title="FRP 客户端配置">
        <ProForm
          form={form}
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
              name="serverAddr"
              label="服务器地址"
              tooltip="FRP服务器地址"
              placeholder="请输入服务器地址"
              colProps={{ span: 8 }}
              rules={[{ required: true, message: '请输入服务器地址' }, ipAddressRule]}
            />
            <ProFormDigit
              name="serverPort"
              label="服务器端口"
              tooltip="FRP服务器端口，默认为7000"
              placeholder="请输入服务器端口"
              colProps={{ span: 8 }}
              rules={[{ required: true, message: '请输入服务器端口' }, { type: 'number', min: 1, max: 65535, message: '端口范围应在 1 到 65535 之间' }]}
            />
            <ProFormText
              name="user"
              label="用户名"
              tooltip="用户名，设置此参数后，代理名称会被修改为 {user}.{proxyName}"
              placeholder="请输入用户名"
              colProps={{ span: 8 }}
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
              onChange={handleAuthMethodChange}
            />
            <ProFormText
              name={['auth', 'token']}
              label="Token"
              tooltip="认证token"
              placeholder="请输入认证token"
              colProps={{ span: 12 }}
              hidden={authMethod !== 'token'}
            />
            {authMethod === 'oidc' && (
              <>
                <ProFormText
                  name={['auth', 'oidc', 'clientID']}
                  label="Client ID"
                  tooltip="OIDC客户端ID"
                  placeholder="请输入Client ID"
                  colProps={{ span: 12 }}
                />
                <ProFormText
                  name={['auth', 'oidc', 'clientSecret']}
                  label="Client Secret"
                  tooltip="OIDC客户端密钥"
                  placeholder="请输入Client Secret"
                  colProps={{ span: 12 }}
                />
                <ProFormText
                  name={['auth', 'oidc', 'audience']}
                  label="Audience"
                  tooltip="OIDC认证的Audience"
                  placeholder="请输入Audience"
                  colProps={{ span: 12 }}
                />
                <ProFormText
                  name={['auth', 'oidc', 'tokenEndpointURL']}
                  label="Token Endpoint URL"
                  tooltip="OIDC Token端点URL"
                  placeholder="请输入Token Endpoint URL"
                  colProps={{ span: 12 }}
                />
              </>
            )}
          </ProFormGroup>

          {/* 网络配置 */}
          <ProFormGroup title="网络配置" collapsible>
            <ProFormSelect
              name={['transport', 'protocol']}
              label="传输协议"
              tooltip="与服务器之间的通信协议"
              options={[
                { label: 'TCP', value: 'tcp' },
                { label: 'KCP', value: 'kcp' },
                { label: 'QUIC', value: 'quic' },
                { label: 'WebSocket', value: 'websocket' },
                { label: 'WSS', value: 'wss' },
              ]}
              colProps={{ span: 8 }}
            />
            <ProFormDigit
              name={['transport', 'poolCount']}
              label="连接池大小"
              tooltip="连接池大小"
              colProps={{ span: 8 }}
              rules={[{ type: 'number', min: 1, message: '连接池大小必须大于0' }]}
            />
            <ProFormDigit
              name={['transport', 'heartbeatInterval']}
              label="心跳间隔"
              tooltip="向服务端发送心跳包的间隔时间(秒)"
              colProps={{ span: 8 }}
              rules={[{ type: 'number', min: 1, message: '心跳间隔必须大于0' }]}
            />
          </ProFormGroup>

          {/* TLS配置 */}
          <ProFormGroup title="TLS配置" collapsible>
            <ProFormSwitch
              name={['transport', 'tls', 'enable']}
              label="启用TLS"
              tooltip="是否启用TLS加密传输"
              colProps={{ span: 8 }}
            />
            <ProFormSwitch
              name={['transport', 'tls', 'disableCustomTLSFirstByte']}
              label="禁用自定义TLS首字节"
              tooltip="禁用自定义TLS首字节，可能影响与vhostHTTPSPort端口的复用"
              colProps={{ span: 8 }}
            />
          </ProFormGroup>

          {/* 日志配置 */}
          <ProFormGroup title="日志配置" collapsible>
            <ProFormSelect
              name={['log', 'level']}
              label="日志级别"
              options={[
                { label: 'Trace', value: 'trace' },
                { label: 'Debug', value: 'debug' },
                { label: 'Info', value: 'info' },
                { label: 'Warning', value: 'warning' },
                { label: 'Error', value: 'error' },
              ]}
              colProps={{ span: 8 }}
            />
            <ProFormDigit
              name={['log', 'maxDays']}
              label="日志保留天数"
              tooltip="日志文件保留天数"
              colProps={{ span: 8 }}
              rules={[{ type: 'number', min: 1, message: '日志保留天数必须大于0' }]}
            />
            <ProFormSwitch
              name={['log', 'disablePrintColor']}
              label="禁用彩色输出"
              tooltip="是否禁用日志的彩色输出"
              colProps={{ span: 8 }}
            />
          </ProFormGroup>
        </ProForm>
      </Card>
    </PageContainer>
  );
};

export default FrpcConfig;

import { ProForm, ProFormText, ProFormDigit, ProFormSwitch, ProFormGroup } from '@ant-design/pro-components';
import type { ProFormInstance } from '@ant-design/pro-components';
import { useEffect, useRef, useState } from 'react';
import type { ProxyConfig, ProxyType } from '../types';
import ProxyTypeFields from './ProxyTypeFields';
import { Radio } from 'antd';

interface ProxyFormProps {
  initialValues?: ProxyConfig;
  onFinish?: (values: ProxyConfig) => Promise<void>;
}

const ProxyForm: React.FC<ProxyFormProps> = ({ initialValues, onFinish }) => {
  const formRef = useRef<ProFormInstance>();
  const [proxyType, setProxyType] = useState<ProxyType>('tcp');

  useEffect(() => {
    if (initialValues) {
      formRef.current?.setFieldsValue(initialValues);
      setProxyType(initialValues.type);
    }
  }, [initialValues]);

  const proxyTypes: { label: string; value: ProxyType }[] = [
    { label: 'TCP', value: 'tcp' },
    { label: 'UDP', value: 'udp' },
    { label: 'HTTP', value: 'http' },
    { label: 'HTTPS', value: 'https' },
    { label: 'TCPMux', value: 'tcpmux' },
    { label: 'STCP', value: 'stcp' },
    { label: 'SUDP', value: 'sudp' },
    { label: 'XTCP', value: 'xtcp' },
  ];

  return (
    <ProForm<ProxyConfig>
      formRef={formRef}
      onFinish={onFinish}
      initialValues={{ type: 'tcp', localIP: '127.0.0.1' }}
      onValuesChange={(changedValues) => {
        if (changedValues.type) {
          setProxyType(changedValues.type);
        }
      }}
      submitter={{
        searchConfig: {
          submitText: initialValues ? '更新' : '创建',
        },
      }}
    >
      <ProFormGroup title="基础配置">
        <ProFormText
          name="name"
          label="代理名称"
          rules={[{ required: true, message: '请输入代理名称' }]}
          width="md"
        />
        <ProForm.Item
          name="type"
          label="代理类型"
          rules={[{ required: true, message: '请选择代理类型' }]}
        >
          <Radio.Group buttonStyle="solid">
            {proxyTypes.map(type => (
              <Radio.Button key={type.value} value={type.value}>
                {type.label}
              </Radio.Button>
            ))}
          </Radio.Group>
        </ProForm.Item>
      </ProFormGroup>

      <ProFormGroup title="后端服务配置">
        <ProFormText
          name="localIP"
          label="本地IP"
          initialValue="127.0.0.1"
          width="md"
        />
        <ProFormDigit
          name="localPort"
          label="本地端口"
          rules={[{ required: true, message: '请输入本地端口' }]}
          width="md"
          min={1}
          max={65535}
        />
      </ProFormGroup>

      <ProxyTypeFields type={proxyType} />

      <ProFormGroup title="传输配置">
        <ProFormSwitch
          name="useEncryption"
          label="启用加密"
        />
        <ProFormSwitch
          name="useCompression"
          label="启用压缩"
        />
      </ProFormGroup>
    </ProForm>
  );
};

export default ProxyForm; 
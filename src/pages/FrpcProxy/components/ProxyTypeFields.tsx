import { ProFormGroup, ProFormText, ProFormDigit, ProFormSelect } from '@ant-design/pro-components';
import type { ProxyType } from '../types';

interface ProxyTypeFieldsProps {
  type: ProxyType;
}

const ProxyTypeFields: React.FC<ProxyTypeFieldsProps> = ({ type }) => {
  const renderTCPFields = () => (
    <ProFormGroup title="TCP配置">
      <ProFormDigit
        name="remotePort"
        label="远程端口"
        tooltip="服务端绑定的端口，用户访问服务端此端口的流量会被转发到对应的本地服务"
        rules={[{ required: true, message: '请输入远程端口' }]}
        min={1}
        max={65535}
        width="md"
      />
    </ProFormGroup>
  );

  const renderUDPFields = () => (
    <ProFormGroup title="UDP配置">
      <ProFormDigit
        name="remotePort"
        label="远程端口"
        tooltip="服务端绑定的端口，用户访问服务端此端口的流量会被转发到对应的本地服务"
        rules={[{ required: true, message: '请输入远程端口' }]}
        min={1}
        max={65535}
        width="md"
      />
    </ProFormGroup>
  );

  const renderHTTPFields = () => (
    <ProFormGroup title="HTTP配置">
      <ProFormText
        name="customDomains"
        label="自定义域名"
        tooltip="自定义域名列表，多个域名用逗号分隔"
        width="md"
        rules={[{ required: true, message: '请输入自定义域名' }]}
      />
      <ProFormText
        name="subdomain"
        label="子域名"
        width="md"
      />
      <ProFormText
        name="locations"
        label="URL路由"
        tooltip="URL路由配置，多个路由用逗号分隔"
        width="md"
      />
      <ProFormText
        name="httpUser"
        label="HTTP用户名"
        tooltip="HTTP Basic Auth用户名"
        width="md"
      />
      <ProFormText
        name="httpPassword"
        label="HTTP密码"
        tooltip="HTTP Basic Auth密码"
        width="md"
      />
      <ProFormText
        name="hostHeaderRewrite"
        label="Host头重写"
        tooltip="替换Host Header"
        width="md"
      />
    </ProFormGroup>
  );

  const renderHTTPSFields = () => (
    <ProFormGroup title="HTTPS配置">
      <ProFormText
        name="customDomains"
        label="自定义域名"
        tooltip="自定义域名列表，多个域名用逗号分隔"
        width="md"
        rules={[{ required: true, message: '请输入自定义域名' }]}
      />
      <ProFormText
        name="subdomain"
        label="子域名"
        width="md"
      />
    </ProFormGroup>
  );

  const renderTCPMuxFields = () => (
    <ProFormGroup title="TCPMux配置">
      <ProFormText
        name="customDomains"
        label="自定义域名"
        tooltip="自定义域名列表，多个域名用逗号分隔"
        width="md"
        rules={[{ required: true, message: '请输入自定义域名' }]}
      />
      <ProFormText
        name="subdomain"
        label="子域名"
        width="md"
      />
      <ProFormText
        name="httpUser"
        label="HTTP用户名"
        tooltip="HTTP Basic Auth用户名"
        width="md"
      />
      <ProFormText
        name="httpPassword"
        label="HTTP密码"
        tooltip="HTTP Basic Auth密码"
        width="md"
      />
      <ProFormSelect
        name="multiplexer"
        label="复用器类型"
        tooltip="复用器类型，目前仅支持httpconnect"
        options={[{ label: 'HTTP Connect', value: 'httpconnect' }]}
        width="md"
      />
    </ProFormGroup>
  );

  const renderSTCPFields = () => (
    <ProFormGroup title="STCP配置">
      <ProFormText
        name="secretKey"
        label="密钥"
        tooltip="密钥，服务端和访问端的密钥需要一致，访问端才能访问到服务端"
        width="md"
      />
      <ProFormText
        name="allowUsers"
        label="允许访问用户"
        tooltip="允许访问的visitor用户列表，多个用户用逗号分隔，配置为*则允许任何visitor访问"
        width="md"
      />
    </ProFormGroup>
  );

  const renderXTCPFields = () => (
    <ProFormGroup title="XTCP配置">
      <ProFormText
        name="secretKey"
        label="密钥"
        tooltip="密钥，服务端和访问端的密钥需要一致，访问端才能访问到服务端"
        width="md"
      />
      <ProFormText
        name="allowUsers"
        label="允许访问用户"
        tooltip="允许访问的visitor用户列表，多个用户用逗号分隔，配置为*则允许任何visitor访问"
        width="md"
      />
    </ProFormGroup>
  );

  const renderSUDPFields = () => (
    <ProFormGroup title="SUDP配置">
      <ProFormText
        name="secretKey"
        label="密钥"
        tooltip="密钥，服务端和访问端的密钥需要一致，访问端才能访问到服务端"
        width="md"
      />
      <ProFormText
        name="allowUsers"
        label="允许访问用户"
        tooltip="允许访问的visitor用户列表，多个用户用逗号分隔，配置为*则允许任何visitor访问"
        width="md"
      />
    </ProFormGroup>
  );

  const renderFields = () => {
    switch (type) {
      case 'tcp':
        return renderTCPFields();
      case 'udp':
        return renderUDPFields();
      case 'http':
        return renderHTTPFields();
      case 'https':
        return renderHTTPSFields();
      case 'tcpmux':
        return renderTCPMuxFields();
      case 'stcp':
        return renderSTCPFields();
      case 'xtcp':
        return renderXTCPFields();
      case 'sudp':
        return renderSUDPFields();
      default:
        return null;
    }
  };

  return renderFields();
};

export default ProxyTypeFields; 
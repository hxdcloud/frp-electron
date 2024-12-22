import { PageContainer } from '@ant-design/pro-components';
import { Button, Card, Modal, Space, Table, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useEffect, useState } from 'react';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import ProxyForm from './components/ProxyForm';
import type { ProxyConfig } from './types';

const ProxyListPage: React.FC = () => {
  const [proxyList, setProxyList] = useState<ProxyConfig[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [currentProxy, setCurrentProxy] = useState<ProxyConfig | null>(null);

  // 加载代理列表
  const loadProxyList = async () => {
    try {
      setLoading(true);
      const list = await window.electronAPI.getProxyList();
      setProxyList(list);
    } catch (error) {
      message.error('加载代理列表失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProxyList();
  }, []);

  // 处理添加代理
  const handleAdd = () => {
    setCurrentProxy(null);
    setModalVisible(true);
  };

  // 处理编辑代理
  const handleEdit = async (record: ProxyConfig) => {
    try {
      const config = await window.electronAPI.getProxyConfig(record.name);
      setCurrentProxy(config);
      setModalVisible(true);
    } catch (error) {
      message.error('加载代理配置失败');
    }
  };

  // 处理删除代理
  const handleDelete = async (record: ProxyConfig) => {
    Modal.confirm({
      title: '确认删除',
      content: `确定要删除代理 ${record.name} 吗？`,
      onOk: async () => {
        try {
          await window.electronAPI.deleteProxy(record.name);
          message.success('删除成功');
          loadProxyList();
        } catch (error) {
          message.error('删除失败');
        }
      },
    });
  };

  // 处理表单提交
  const handleFormSubmit = async (values: ProxyConfig) => {
    try {
      if (currentProxy) {
        await window.electronAPI.updateProxy(currentProxy.name, values);
        message.success('更新成功');
      } else {
        await window.electronAPI.addProxy(values);
        message.success('添加成功');
      }
      setModalVisible(false);
      loadProxyList();
    } catch (error) {
      message.error(currentProxy ? '更新失败' : '添加失败');
    }
  };

  const columns: ColumnsType<ProxyConfig> = [
    {
      title: '代理名称',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '代理类型',
      dataIndex: 'type',
      key: 'type',
    },
    {
      title: '本地端口',
      dataIndex: ['backend', 'localPort'],
      key: 'localPort',
    },
    {
      title: '远程端口',
      dataIndex: 'remotePort',
      key: 'remotePort',
      render: (text: string, record: ProxyConfig) => {
        if (['tcp', 'udp'].includes(record.type)) {
          return text;
        }
        return '-';
      },
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Space size="middle">
          <Button
            type="text"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>
          <Button
            type="text"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(record)}
          >
            删除
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <PageContainer>
      <Card>
        <div style={{ marginBottom: 16 }}>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleAdd}
          >
            添加代理
          </Button>
        </div>
        <Table<ProxyConfig>
          columns={columns}
          dataSource={proxyList}
          loading={loading}
          rowKey="name"
          pagination={{
            defaultPageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
          }}
        />
      </Card>

      <Modal
        title={currentProxy ? '编辑代理' : '添加代理'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={800}
      >
        <ProxyForm
          initialValues={currentProxy || undefined}
          onFinish={handleFormSubmit}
        />
      </Modal>
    </PageContainer>
  );
};

export default ProxyListPage; 
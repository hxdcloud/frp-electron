import { PageContainer } from '@ant-design/pro-components';
import { Card, Table } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useRequest } from '@umijs/max';

interface RuleItem {
  id: string;
  name: string;
  type: string;
  localPort: number;
  remotePort: number;
  status: 'active' | 'inactive';
}

const RulesPage: React.FC = () => {
  const { data: rulesList, loading } = useRequest<{ data: RuleItem[] }>('/api/rules');

  const columns: ColumnsType<RuleItem> = [
    {
      title: '规则名称',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '规则类型',
      dataIndex: 'type',
      key: 'type',
    },
    {
      title: '本地端口',
      dataIndex: 'localPort',
      key: 'localPort',
    },
    {
      title: '远程端口',
      dataIndex: 'remotePort',
      key: 'remotePort',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <span style={{ color: status === 'active' ? '#52c41a' : '#ff4d4f' }}>
          {status === 'active' ? '活跃' : '未活跃'}
        </span>
      ),
    },
  ];

  return (
    <PageContainer>
      <Card>
        <Table<RuleItem>
          columns={columns}
          dataSource={rulesList?.data}
          loading={loading}
          rowKey="id"
          pagination={{
            defaultPageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
          }}
        />
      </Card>
    </PageContainer>
  );
};

export default RulesPage; 
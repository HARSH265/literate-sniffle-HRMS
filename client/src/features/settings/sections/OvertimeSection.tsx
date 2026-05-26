import { Table, Button, Popconfirm, Tag, message } from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import { overtimeRuleService, OvertimeRule } from '../../overtime-rules/services/overtimeRuleService';
import { useQuery, useMutation } from '@tanstack/react-query';

export function OvertimeSection({ onAdd }: { onAdd: () => void }) {
  const { data, isLoading } = useQuery({
    queryKey: ['overtime-rules'],
    queryFn: () => overtimeRuleService.list({ limit: 100 }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => overtimeRuleService.delete(id),
    onSuccess: () => { message.success('Rule deleted'); },
    onError: (err: any) => message.error(err?.response?.data?.message || 'Failed to delete'),
  });

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ margin: 0 }}>Overtime Rules</h3>
        <Button type="primary" icon={<PlusOutlined />} onClick={onAdd}>
          Add Rule
        </Button>
      </div>
      <Table
        size="small"
        dataSource={data?.data}
        loading={isLoading}
        rowKey="id"
        pagination={false}
        locale={{ emptyText: 'No overtime rules configured.' }}
        columns={[
          { title: 'Name', dataIndex: 'name', key: 'name' },
          { title: 'Category', dataIndex: 'applicableTo', key: 'applicableTo', render: (c: string) => <Tag color={c === 'worker' ? 'blue' : c === 'office-staff' ? 'purple' : 'green'}>{c === 'all' ? 'All' : c}</Tag> },
          { title: 'Max Hours/Day', dataIndex: 'maxHoursPerDay', key: 'maxHoursPerDay', render: (v: number) => `${v}h` },
          { title: 'Max Hours/Month', dataIndex: 'maxHoursPerMonth', key: 'maxHoursPerMonth', render: (v: number) => `${v}h` },
          { title: 'Multiplier', dataIndex: 'multiplier', key: 'multiplier' },
          { title: 'Status', dataIndex: 'isActive', key: 'isActive', render: (s: boolean) => <Tag color={s ? 'green' : 'red'}>{s ? 'Active' : 'Inactive'}</Tag> },
          { title: '', key: 'actions', width: 60, render: (_: any, r: OvertimeRule) => (
            <Popconfirm title="Delete this rule?" onConfirm={() => deleteMutation.mutate(r.id)}>
              <Button type="text" size="small" danger icon={<DeleteOutlined />} />
            </Popconfirm>
          )},
        ]}
      />
    </div>
  );
}

import { Button, Popconfirm, Tag, message, Alert } from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import { DataTable } from '../../../core/components/DataTable';
import { weeklyOffRuleService, WeeklyOffRule } from '../../weekly-off-rules/services/weeklyOffRuleService';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export function WeeklyOffSection({ onAdd }: { onAdd: () => void }) {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ['weekly-off-rules'],
    queryFn: () => weeklyOffRuleService.list({ limit: 100 }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => weeklyOffRuleService.delete(id),
    onSuccess: () => { message.success('Rule deleted'); queryClient.invalidateQueries({ queryKey: ['weekly-off-rules'] }); },
    onError: (err: any) => message.error(err?.response?.data?.message || 'Failed to delete'),
  });

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ margin: 0 }}>Weekly Off Rules</h3>
        <Button type="primary" icon={<PlusOutlined />} onClick={onAdd}>
          Add Rule
        </Button>
      </div>
      <DataTable
        dataSource={data?.data}
        loading={isLoading}
        rowKey="id"
        hidePagination
        noCard
        disableRowClick
        columns={[
          { title: 'Name', dataIndex: 'name', key: 'name' },
          { title: 'Category', dataIndex: 'category', key: 'category', render: (c: string) => <Tag>{c === 'all' ? 'All' : c === 'worker' ? 'Worker' : 'Office Staff'}</Tag> },
          { title: 'Off Days', dataIndex: 'offDays', key: 'offDays', render: (days: number[]) => days?.map(d => ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][d]).join(', ') },
          { title: 'Status', dataIndex: 'isActive', key: 'isActive', render: (s: boolean) => <Tag color={s ? 'green' : 'red'}>{s ? 'Active' : 'Inactive'}</Tag> },
          { title: '', key: 'actions', width: 60, render: (_: any, r: WeeklyOffRule) => (
            <Popconfirm title="Delete this rule?" onConfirm={() => deleteMutation.mutate(r.id)}>
              <Button type="text" size="small" danger icon={<DeleteOutlined />} />
            </Popconfirm>
          )},
        ]}
       />
        <Alert
          message="Weekly Off Rules define recurring non‑working days for employee categories, affecting attendance and payroll calculations."
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
        />
    </div>
  );
}

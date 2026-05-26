import { Table, Button, Popconfirm, Tag, message } from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import { holidayService, Holiday } from '../../holidays/services/holidayService';
import { useQuery, useMutation } from '@tanstack/react-query';
import dayjs from 'dayjs';

export function HolidaysSection({ onAdd }: { onAdd: () => void }) {
  const { data, isLoading } = useQuery({
    queryKey: ['holidays'],
    queryFn: () => holidayService.list({ limit: 100 }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => holidayService.delete(id),
    onSuccess: () => { message.success('Holiday deleted'); },
    onError: (err: any) => message.error(err?.response?.data?.message || 'Failed to delete'),
  });

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ margin: 0 }}>Holidays</h3>
        <Button type="primary" icon={<PlusOutlined />} onClick={onAdd}>
          Add Holiday
        </Button>
      </div>
      <Table
        size="small"
        dataSource={data?.data}
        loading={isLoading}
        rowKey="id"
        pagination={false}
        locale={{ emptyText: 'No holidays configured.' }}
        columns={[
          { title: 'Date', dataIndex: 'date', key: 'date', render: (d: string) => d ? dayjs(d).format('DD MMM YYYY') : '-' },
          { title: 'Name', dataIndex: 'name', key: 'name' },
          { title: 'Type', dataIndex: 'category', key: 'category', render: (t: string) => <Tag color={t === 'national' ? 'red' : t === 'festival' ? 'purple' : 'orange'}>{t}</Tag> },
          { title: 'Year', dataIndex: 'year', key: 'year' },
          { title: 'Paid', dataIndex: 'isPaid', key: 'isPaid', render: (s: boolean) => s ? 'Yes' : 'No' },
          { title: '', key: 'actions', width: 60, render: (_: any, r: Holiday) => (
            <Popconfirm title="Delete this holiday?" onConfirm={() => deleteMutation.mutate(r.id)}>
              <Button type="text" size="small" danger icon={<DeleteOutlined />} />
            </Popconfirm>
          )},
        ]}
      />
    </div>
  );
}

import { Button, Popconfirm, Tag } from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import { DataTable } from '../../../core/components/DataTable';

export function AllowancesSection({ form, onAdd }: { form: any; onAdd: () => void }) {
  const allowances = form.getFieldValue('allowanceConfig') || [];

  const handleDeleteAllowance = (index: number) => {
    const current = form.getFieldValue('allowanceConfig') || [];
    form.setFieldValue('allowanceConfig', current.filter((_: any, i: number) => i !== index));
  };

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ margin: 0 }}>Allowances</h3>
        <Button type="primary" icon={<PlusOutlined />} onClick={onAdd}>
          Add Allowance
        </Button>
      </div>

      <DataTable
        dataSource={allowances}
        rowKey="key"
        hidePagination
        noCard
        disableRowClick
        columns={[
          { title: 'Name', dataIndex: 'name', key: 'name' },
          { title: 'Type', dataIndex: 'type', key: 'type', render: (t: string) => <Tag>{t}</Tag> },
          { title: 'Value', dataIndex: 'value', key: 'value', render: (v: number, r: any) => r.type === 'percentage' ? `${v}%` : `₹${v}` },
          { title: 'Applicable To', dataIndex: 'applicableTo', key: 'applicableTo', render: (v: string) => v === 'all' ? 'All' : v },
          { title: 'Status', dataIndex: 'isActive', key: 'isActive', render: (s: boolean) => <Tag color={s ? 'green' : 'red'}>{s ? 'Active' : 'Inactive'}</Tag> },
          { title: '', key: 'actions', width: 60, render: (_: any, _r: any, index: number) => (
            <Popconfirm title="Delete this allowance?" onConfirm={() => handleDeleteAllowance(index)}>
              <Button type="text" size="small" danger icon={<DeleteOutlined />} />
            </Popconfirm>
          )},
        ]}
      />
    </div>
  );
}

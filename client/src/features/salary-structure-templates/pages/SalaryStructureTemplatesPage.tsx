import { useState, useEffect } from 'react';
import { Button, Modal, Form, Input, Switch, Tag, message, Spin } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { PageHeader } from '../../../core/components/PageHeader';
import { PageContainer } from '../../../core/components/PageContainer';
import { DataTable } from '../../../core/components/DataTable';
import { salaryStructureTemplateService, SalaryStructureTemplate } from '../services/salaryStructureTemplateService';

export function SalaryStructureTemplatesPage() {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<SalaryStructureTemplate[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<SalaryStructureTemplate | null>(null);
  const [form] = Form.useForm();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await salaryStructureTemplateService.list();
      setData(res.data);
    } catch {
      message.error('Failed to load templates');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (values: any) => {
    try {
      if (editing) {
        await salaryStructureTemplateService.update(editing.id, values);
        message.success('Template updated');
      } else {
        await salaryStructureTemplateService.create(values);
        message.success('Template created');
      }
      setModalOpen(false);
      setEditing(null);
      form.resetFields();
      loadData();
    } catch {
      message.error('Operation failed');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await salaryStructureTemplateService.delete(id);
      message.success('Template deleted');
      loadData();
    } catch {
      message.error('Delete failed');
    }
  };

  if (loading) return <Spin size="large" style={{ display: 'block', margin: '100px auto' }} />;

  const columns = [
    { title: 'Name', dataIndex: 'name', key: 'name' },
    { title: 'Description', dataIndex: 'description', key: 'description' },
    { title: 'Components', dataIndex: 'components', key: 'components', render: (c: any[]) => c?.length || 0 },
    { title: 'Active', dataIndex: 'isActive', key: 'active', render: (v: boolean) => <Tag color={v ? 'green' : 'red'}>{v ? 'Yes' : 'No'}</Tag> },
    {
      title: 'Actions', key: 'actions',
      render: (_: any, record: SalaryStructureTemplate) => (
        <Button type="link" danger onClick={() => handleDelete(record.id)}>Delete</Button>
      ),
    },
  ];

  return (
    <PageContainer>
      <PageHeader title="Salary Structure Templates" actions={<Button type="primary" icon={<PlusOutlined />} onClick={() => { setEditing(null); form.resetFields(); setModalOpen(true); }}>New Template</Button>} />
      <DataTable columns={columns} dataSource={data} rowKey="id" />
      <Modal title={editing ? 'Edit Template' : 'New Template'} open={modalOpen} onOk={form.submit} onCancel={() => { setModalOpen(false); setEditing(null); }}>
        <Form form={form} layout="vertical" onFinish={handleSubmit} initialValues={editing || { isActive: true }}>
          <Form.Item name="name" label="Name" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="description" label="Description"><Input.TextArea /></Form.Item>
          <Form.Item name="isActive" label="Active" valuePropName="checked"><Switch /></Form.Item>
        </Form>
      </Modal>
    </PageContainer>
  );
}

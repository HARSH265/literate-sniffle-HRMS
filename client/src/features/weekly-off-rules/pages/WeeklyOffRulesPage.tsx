import { useState } from 'react';
import { Button, Modal, Form, Input, Select, message, Popconfirm, Tag, Tooltip, Row, Col } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { PageContainer } from '../../../core/components/PageContainer';
import { PageHeader } from '../../../core/components/PageHeader';
import { DataTable } from '../../../core/components/DataTable';
import { weeklyOffRuleService, WeeklyOffRule, CreateWeeklyOffRule } from '../services/weeklyOffRuleService';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const DAY_OPTIONS = [
  { label: 'Sunday', value: 0 },
  { label: 'Monday', value: 1 },
  { label: 'Tuesday', value: 2 },
  { label: 'Wednesday', value: 3 },
  { label: 'Thursday', value: 4 },
  { label: 'Friday', value: 5 },
  { label: 'Saturday', value: 6 },
];

const CATEGORY_OPTIONS = [
  { label: 'All Employees', value: 'all' },
  { label: 'Workers Only', value: 'worker' },
  { label: 'Office Staff Only', value: 'office-staff' },
];

const categoryColors: Record<string, string> = {
  all: 'blue',
  worker: 'cyan',
  'office-staff': 'purple',
};

const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export function WeeklyOffRulesPage() {
  const [form] = Form.useForm();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['weekly-off-rules', page, limit, categoryFilter],
    queryFn: () => weeklyOffRuleService.list({ page, limit, category: categoryFilter || undefined }),
    refetchOnWindowFocus: false,
  });

  const createMutation = useMutation({
    mutationFn: (payload: CreateWeeklyOffRule) => weeklyOffRuleService.create(payload),
    onSuccess: () => {
      message.success('Weekly off rule created successfully');
      setIsModalOpen(false);
      form.resetFields();
      queryClient.invalidateQueries({ queryKey: ['weekly-off-rules'] });
    },
    onError: (err: any) => message.error(err?.response?.data?.message || 'Failed to create'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<CreateWeeklyOffRule> }) =>
      weeklyOffRuleService.update(id, payload),
    onSuccess: () => {
      message.success('Weekly off rule updated successfully');
      setIsModalOpen(false);
      form.resetFields();
      setEditingId(null);
      queryClient.invalidateQueries({ queryKey: ['weekly-off-rules'] });
    },
    onError: (err: any) => message.error(err?.response?.data?.message || 'Failed to update'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => weeklyOffRuleService.delete(id),
    onSuccess: () => {
      message.success('Weekly off rule deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['weekly-off-rules'] });
    },
    onError: (err: any) => message.error(err?.response?.data?.message || 'Failed to delete'),
  });

  const handleEdit = (record: WeeklyOffRule) => {
    setEditingId(record.id);
    form.setFieldsValue({
      name: record.name,
      category: record.category,
      offDays: record.offDays,
      isActive: record.isActive,
    });
    setIsModalOpen(true);
  };

  const handleModalOk = () => {
    form.validateFields().then((values) => {
      if (editingId) updateMutation.mutate({ id: editingId, payload: values });
      else createMutation.mutate(values as CreateWeeklyOffRule);
    });
  };

  const columns: ColumnsType<WeeklyOffRule> = [
    {
      title: 'Rule Name',
      dataIndex: 'name',
      key: 'name',
      render: (name: string, record: WeeklyOffRule) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontWeight: 600 }}>{name}</span>
          {!record.isActive && <Tag color="red">Inactive</Tag>}
        </div>
      ),
    },
    {
      title: 'Category',
      dataIndex: 'category',
      key: 'category',
      width: 150,
      render: (cat: string) => (
        <Tag color={categoryColors[cat]}>
          {cat === 'all' ? 'All' : cat === 'worker' ? 'Workers' : 'Office Staff'}
        </Tag>
      ),
    },
    {
      title: 'Off Days',
      dataIndex: 'offDays',
      key: 'offDays',
      render: (days: number[]) => (
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          {days.map((d) => (
            <Tag key={d} color="default">{dayNames[d]}</Tag>
          ))}
        </div>
      ),
    },
    {
      title: '',
      key: 'actions',
      width: 100,
      fixed: 'right' as const,
      render: (_: unknown, record: WeeklyOffRule) => (
        <div className="action-group">
          <Tooltip title="Edit">
            <Button type="text" icon={<EditOutlined />} onClick={() => handleEdit(record)} />
          </Tooltip>
          <Popconfirm title="Delete this rule?" onConfirm={() => deleteMutation.mutate(record.id)}>
            <Tooltip title="Delete">
              <Button type="text" danger icon={<DeleteOutlined />} />
            </Tooltip>
          </Popconfirm>
        </div>
      ),
    },
  ];

  return (
    <PageContainer>
      <PageHeader
        title="Weekly Off Rules"
        subtitle="Configure weekly off days for employees"
        actions={
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsModalOpen(true)}>
            Add Rule
          </Button>
        }
      />

      <DataTable
        columns={columns}
        dataSource={data?.data}
        rowKey="id"
        loading={isLoading}
        total={data?.meta?.total ?? 0}
        page={page}
        onPaginationChange={(p, size) => { setPage(p); setLimit(size ?? 10); }}
        filterContent={
          <Select
            placeholder="Filter by category"
            allowClear
            style={{ width: 180 }}
            value={categoryFilter || undefined}
            onChange={(val) => { setCategoryFilter(val || ''); setPage(1); }}
            options={CATEGORY_OPTIONS}
          />
        }
        toolbarRight={
          <span style={{ fontSize: 13, color: 'var(--hrms-text-muted)' }}>
            {data?.meta?.total ?? 0} rules
          </span>
        }
      />

      <Modal
        title={editingId ? 'Edit Rule' : 'Add Weekly Off Rule'}
        open={isModalOpen}
        onOk={handleModalOk}
        onCancel={() => { setIsModalOpen(false); form.resetFields(); setEditingId(null); }}
        confirmLoading={createMutation.isPending || updateMutation.isPending}
        okText={editingId ? 'Update' : 'Create'}
        okButtonProps={{ style: { borderRadius: 8 } }}
        cancelButtonProps={{ style: { borderRadius: 8 } }}
        width={480}
      >
        <Form form={form} layout="vertical" style={{ marginTop: 8 }}>
          <Row gutter={12}>
            <Col span={16}>
              <Form.Item name="name" label="Rule Name" rules={[{ required: true }]}>
                <Input placeholder="e.g., Standard Week Off" style={{ height: 36 }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="category" label="Category" initialValue="all">
                <Select options={CATEGORY_OPTIONS} style={{ height: 36 }} />
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item name="offDays" label="Select Off Days" rules={[{ required: true, message: 'Select at least one day' }]}>
                <Select
                  mode="multiple"
                  options={DAY_OPTIONS}
                  placeholder="Select days"
                  style={{ minHeight: 36 }}
                />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </PageContainer>
  );
}
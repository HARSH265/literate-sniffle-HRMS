import { useState } from 'react';
import { Table, Button, Modal, Form, Input, Select, InputNumber, message, Popconfirm, Tag, Tooltip, Row, Col, Statistic, Card } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { PlusOutlined, EditOutlined, DeleteOutlined, InfoCircleOutlined } from '@ant-design/icons';
import { PageHeader } from '../../../core/components/PageHeader';
import { overtimeRuleService, OvertimeRule, CreateOvertimeRule } from '../services/overtimeRuleService';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

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

export function OvertimeRulesPage() {
  const [form] = Form.useForm();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['overtime-rules', page, limit],
    queryFn: () => overtimeRuleService.list({ page, limit }),
    refetchOnWindowFocus: false,
  });

  const activeRules = data?.data?.filter((r: OvertimeRule) => r.isActive) || [];
  const totalMaxDay = activeRules.length > 0 ? Math.max(...activeRules.map((r: OvertimeRule) => r.maxHoursPerDay || 0)) : 0;
  const totalMaxMonth = activeRules.length > 0 ? Math.max(...activeRules.map((r: OvertimeRule) => r.maxHoursPerMonth || 0)) : 0;

  const createMutation = useMutation({
    mutationFn: (payload: CreateOvertimeRule) => overtimeRuleService.create(payload),
    onSuccess: () => {
      message.success('Overtime rule created successfully');
      setIsModalOpen(false);
      form.resetFields();
      queryClient.invalidateQueries({ queryKey: ['overtime-rules'] });
    },
    onError: (err: any) => message.error(err?.response?.data?.message || 'Failed to create'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<CreateOvertimeRule> }) =>
      overtimeRuleService.update(id, payload),
    onSuccess: () => {
      message.success('Overtime rule updated successfully');
      setIsModalOpen(false);
      form.resetFields();
      setEditingId(null);
      queryClient.invalidateQueries({ queryKey: ['overtime-rules'] });
    },
    onError: (err: any) => message.error(err?.response?.data?.message || 'Failed to update'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => overtimeRuleService.delete(id),
    onSuccess: () => {
      message.success('Overtime rule deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['overtime-rules'] });
    },
    onError: (err: any) => message.error(err?.response?.data?.message || 'Failed to delete'),
  });

  const handleEdit = (record: OvertimeRule) => {
    setEditingId(record.id);
    form.setFieldsValue(record);
    setIsModalOpen(true);
  };

  const handleModalOk = () => {
    form.validateFields().then((values) => {
      if (editingId) updateMutation.mutate({ id: editingId, payload: values });
      else createMutation.mutate(values as CreateOvertimeRule);
    });
  };

  const columns: ColumnsType<OvertimeRule> = [
    {
      title: 'Rule Name',
      dataIndex: 'name',
      key: 'name',
      render: (name: string, record: OvertimeRule) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontWeight: 600 }}>{name}</span>
          {!record.isActive && <Tag color="red">Inactive</Tag>}
        </div>
      ),
    },
    {
      title: 'Category',
      dataIndex: 'applicableTo',
      key: 'applicableTo',
      width: 140,
      render: (cat: string) => (
        <Tag color={categoryColors[cat]}>
          {cat === 'all' ? 'All' : cat === 'worker' ? 'Workers' : 'Office Staff'}
        </Tag>
      ),
    },
    {
      title: 'Multiplier',
      dataIndex: 'multiplier',
      key: 'multiplier',
      width: 100,
      render: (v: number) => <Tag color="orange">{v}x</Tag>,
    },
    {
      title: 'Max/Day',
      dataIndex: 'maxHoursPerDay',
      key: 'maxHoursPerDay',
      width: 90,
      render: (v: number) => `${v}h`,
    },
    {
      title: 'Max/Month',
      dataIndex: 'maxHoursPerMonth',
      key: 'maxHoursPerMonth',
      width: 100,
      render: (v: number) => `${v}h`,
    },
    {
      title: '',
      key: 'actions',
      width: 100,
      render: (_: unknown, record: OvertimeRule) => (
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
    <div style={{ padding: '0 4px' }}>
      <PageHeader title="Overtime Rules" subtitle="Configure overtime policies and limits" />

      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card>
            <Statistic title="Active Rules" value={activeRules.length} prefix={<InfoCircleOutlined />} />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="Max Hours/Day" value={totalMaxDay} suffix="hrs" />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="Max Hours/Month" value={totalMaxMonth} suffix="hrs" />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="Default Multiplier" value={activeRules[0]?.multiplier || 1} suffix="x" />
          </Card>
        </Col>
      </Row>

      <div className="hrms-table-card">
        <div className="hrms-table-toolbar">
          <div className="hrms-table-toolbar-left">
            <span style={{ fontSize: 13, color: 'var(--hrms-text-muted)' }}>
              {data?.meta?.total ?? 0} rules
            </span>
          </div>
          <div className="hrms-table-toolbar-right">
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsModalOpen(true)}>
              Add Rule
            </Button>
          </div>
        </div>

        <Table
          columns={columns}
          dataSource={data?.data}
          rowKey="id"
          loading={isLoading}
          pagination={{
            current: page,
            defaultPageSize: 20,
            pageSize: limit,
            total: data?.meta?.total ?? 0,
            onChange: (p, size) => { setPage(p); setLimit(size ?? 20); },
            showSizeChanger: true,
            pageSizeOptions: ['10', '20', '50'],
          }}
        />
      </div>

      <Modal
        title={editingId ? 'Edit Rule' : 'Add Overtime Rule'}
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
                <Input placeholder="e.g., Standard Overtime" style={{ height: 36 }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="applicableTo" label="Category" initialValue="all">
                <Select options={CATEGORY_OPTIONS} style={{ height: 36 }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="multiplier" label="Multiplier (x)" rules={[{ required: true }]}>
                <InputNumber min={1} style={{ width: '100%', height: 36 }} placeholder="1.5" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="maxHoursPerDay" label="Max Hours/Day" rules={[{ required: true }]}>
                <InputNumber min={0} style={{ width: '100%', height: 36 }} placeholder="4" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="maxHoursPerMonth" label="Max Hours/Month" rules={[{ required: true }]}>
                <InputNumber min={0} style={{ width: '100%', height: 36 }} placeholder="50" />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </div>
  );
}
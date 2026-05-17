import { useState } from 'react';
import { Table, Button, Modal, Form, Input, Select, DatePicker, message, Popconfirm, Tag, Tooltip, Row, Col } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined } from '@ant-design/icons';
import { PageHeader } from '../../../core/components/PageHeader';
import { holidayService, Holiday, CreateHoliday } from '../services/holidayService';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';

const TYPE_OPTIONS = [
  { label: 'National', value: 'national' },
  { label: 'State', value: 'state' },
  { label: 'Company', value: 'company' },
  { label: 'Festival', value: 'festival' },
];

const APPLICABLE_TO_OPTIONS = [
  { label: 'All', value: 'all' },
  { label: 'Workers', value: 'worker' },
  { label: 'Office Staff', value: 'office-staff' },
];

const typeColors: Record<string, string> = {
  national: 'blue',
  state: 'cyan',
  company: 'green',
  festival: 'orange',
};

export function HolidaysPage() {
  const [form] = Form.useForm();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [search, setSearch] = useState('');
  const [yearFilter, setYearFilter] = useState<number | undefined>(undefined);
  const queryClient = useQueryClient();

const { data, isLoading, isFetching } = useQuery({
    queryKey: ['holidays', page, limit, search, yearFilter],
    queryFn: () => holidayService.list({ page, limit, search, year: yearFilter }),
    staleTime: 5 * 60 * 1000,
  });

  const createMutation = useMutation({
    mutationFn: (payload: CreateHoliday) => holidayService.create(payload),
    onSuccess: () => {
      message.success('Holiday created successfully');
      setIsModalOpen(false);
      form.resetFields();
      queryClient.invalidateQueries({ queryKey: ['holidays'] });
    },
    onError: (err: any) => message.error(err?.response?.data?.message || 'Failed to create holiday'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<CreateHoliday> }) =>
      holidayService.update(id, payload),
    onSuccess: () => {
      message.success('Holiday updated successfully');
      setIsModalOpen(false);
      form.resetFields();
      setEditingId(null);
      queryClient.invalidateQueries({ queryKey: ['holidays'] });
    },
    onError: (err: any) => message.error(err?.response?.data?.message || 'Failed to update holiday'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => holidayService.delete(id),
    onSuccess: () => {
      message.success('Holiday deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['holidays'] });
    },
    onError: (err: any) => message.error(err?.response?.data?.message || 'Failed to delete holiday'),
  });

  const handleEdit = (record: Holiday) => {
    setEditingId(record.id);
    form.setFieldsValue({
      name: record.name,
      date: dayjs(record.date),
      type: record.type,
      applicableTo: record.applicableTo,
      isPaid: record.isPaid,
    });
    setIsModalOpen(true);
  };

  const handleModalOk = () => {
    form.validateFields().then((values) => {
      const payload = { ...values, date: values.date?.format('YYYY-MM-DD'), year: yearFilter };
      if (editingId) updateMutation.mutate({ id: editingId, payload });
      else createMutation.mutate(payload as CreateHoliday);
    });
  };

  const columns: ColumnsType<Holiday> = [
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
      width: 120,
      render: (date: string) => (
        <span style={{ fontWeight: 500, color: 'var(--hrms-text-primary)' }}>
          {dayjs(date).format('DD MMM')}
        </span>
      ),
      sorter: (a, b) => dayjs(a.date).unix() - dayjs(b.date).unix(),
    },
    {
      title: 'Holiday Name',
      dataIndex: 'name',
      key: 'name',
      render: (name: string) => <span style={{ fontWeight: 500 }}>{name}</span>,
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      width: 120,
      render: (type: string) => (
        <Tag color={typeColors[type] || 'default'} style={{ textTransform: 'capitalize' }}>
          {type}
        </Tag>
      ),
    },
    {
      title: 'Applicable To',
      dataIndex: 'applicableTo',
      key: 'applicableTo',
      width: 130,
      render: (val: string) => (
        <span style={{ color: 'var(--hrms-text-secondary)', fontSize: 13 }}>
          {val === 'all' ? 'All' : val === 'worker' ? 'Workers' : 'Office Staff'}
        </span>
      ),
    },
    {
      title: 'Paid',
      dataIndex: 'isPaid',
      key: 'isPaid',
      width: 80,
      render: (isPaid: boolean) => (
        <span className={`status-badge ${isPaid ? 'status-active' : 'status-inactive'}`}>
          {isPaid ? 'Paid' : 'Unpaid'}
        </span>
      ),
    },
    {
      title: '',
      key: 'actions',
      width: 100,
      fixed: 'right',
      render: (_: unknown, record: Holiday) => (
        <div className="action-group">
          <Tooltip title="Edit">
            <Button type="text" icon={<EditOutlined />} onClick={() => handleEdit(record)} />
          </Tooltip>
          <Popconfirm title="Delete this holiday?" onConfirm={() => deleteMutation.mutate(record.id)}>
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
      <PageHeader title="Holidays" subtitle="Manage company holidays and festivals" />

      <div className="hrms-table-card">
        <div className="hrms-table-toolbar">
          <div className="hrms-table-toolbar-left">
            <Input.Search
              placeholder="Search holidays..."
              onSearch={(val) => { setSearch(val); setPage(1); }}
              style={{ width: 240 }}
              allowClear
              prefix={<SearchOutlined style={{ color: 'var(--hrms-text-muted)' }} />}
              enterButton={false}
              loading={isFetching}
            />
            <Select
              value={yearFilter}
              onChange={(val) => { setYearFilter(val); setPage(1); }}
              style={{ width: 120 }}
              allowClear
              placeholder="All Years"
              options={[
                { label: '2024', value: 2024 },
                { label: '2025', value: 2025 },
                { label: '2026', value: 2026 },
                { label: '2027', value: 2027 },
                { label: '2028', value: 2028 },
              ]}
            />
          </div>
          <div className="hrms-table-toolbar-right">
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsModalOpen(true)}>
              Add Holiday
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
            defaultPageSize: 10,
            pageSize: limit,
            total: data?.meta?.total ?? 0,
            onChange: (p, size) => { setPage(p); setLimit(size ?? 10); },
            showSizeChanger: true,
            pageSizeOptions: ['10', '20', '50', '100'],
            showTotal: (total, range) => `${range[0]}–${range[1]} of ${total}`,
          }}
        />
      </div>

      <Modal
        title={editingId ? 'Edit Holiday' : 'Add Holiday'}
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
              <Form.Item name="name" label="Holiday Name" rules={[{ required: true }]}>
                <Input placeholder="e.g., Republic Day" style={{ height: 36 }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="type" label="Type" initialValue="national">
                <Select options={TYPE_OPTIONS} style={{ height: 36 }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="date" label="Date" rules={[{ required: true }]}>
                <DatePicker style={{ width: '100%', height: 36 }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="applicableTo" label="Applicable To" initialValue="all">
                <Select options={APPLICABLE_TO_OPTIONS} style={{ height: 36 }} />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </div>
  );
}
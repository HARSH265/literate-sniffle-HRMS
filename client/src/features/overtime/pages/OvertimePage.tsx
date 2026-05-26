import { useState } from 'react';
import { Button, Modal, Form, Select, DatePicker, InputNumber, message, Popconfirm, Tag, Input } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined } from '@ant-design/icons';
import { PageHeader } from '../../../core/components/PageHeader';
import { DataTable } from '../../../core/components/DataTable';
import { overtimeEntryService, OvertimeEntry, CreateOvertimeEntry } from '../services/overtimeEntryService';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';

export function OvertimePage() {
  const [form] = Form.useForm();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [search, setSearch] = useState('');
  const [monthFilter, setMonthFilter] = useState<number>(dayjs().month() + 1);
  const [yearFilter, setYearFilter] = useState<number>(dayjs().year());
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['overtime-entries', page, limit, search, monthFilter, yearFilter],
    queryFn: () => {
      const startDate = new Date(yearFilter, monthFilter - 1, 1);
      const endDate = new Date(yearFilter, monthFilter, 0);
      return overtimeEntryService.list({
        page,
        limit,
        search,
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
      });
    },
    staleTime: 5 * 60 * 1000,
  });

  const createMutation = useMutation({
    mutationFn: (payload: CreateOvertimeEntry) => overtimeEntryService.create(payload),
    onSuccess: () => {
      message.success('Overtime entry created successfully');
      setIsModalOpen(false);
      form.resetFields();
      queryClient.invalidateQueries({ queryKey: ['overtime-entries'] });
    },
    onError: (err: any) => message.error(err?.response?.data?.message || 'Failed to create overtime entry'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<CreateOvertimeEntry> }) =>
      overtimeEntryService.update(id, payload),
    onSuccess: () => {
      message.success('Overtime entry updated successfully');
      setIsModalOpen(false);
      form.resetFields();
      setEditingId(null);
      queryClient.invalidateQueries({ queryKey: ['overtime-entries'] });
    },
    onError: (err: any) => message.error(err?.response?.data?.message || 'Failed to update overtime entry'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => overtimeEntryService.delete(id),
    onSuccess: () => {
      message.success('Overtime entry deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['overtime-entries'] });
    },
    onError: (err: any) => message.error(err?.response?.data?.message || 'Failed to delete overtime entry'),
  });

  const handleSubmit = (values: any) => {
    const payload = {
      ...values,
      date: values.date.format('YYYY-MM-DD'),
    };
    if (editingId) {
      updateMutation.mutate({ id: editingId, payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const handleEdit = (record: OvertimeEntry) => {
    setEditingId(record.id);
    form.setFieldsValue({
      employee: record.employee?.id,
      date: dayjs(record.date),
      hours: record.hours,
      overtimeRule: record.overtimeRule?.id,
      remarks: record.remarks,
    });
    setIsModalOpen(true);
  };

  const columns: ColumnsType<OvertimeEntry> = [
    {
      title: 'Employee',
      dataIndex: ['employee', 'fullName'],
      key: 'employee',
      render: (_text, record) => record.employee ? (
        <div>
          <div style={{ fontWeight: 500 }}>{record.employee.fullName}</div>
          <div style={{ fontSize: 12, color: 'var(--hrms-text-muted)' }}>{record.employee.employeeCode}</div>
        </div>
      ) : '-',
    },
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
      render: (date) => dayjs(date).format('DD MMM YYYY'),
    },
    {
      title: 'Hours',
      dataIndex: 'hours',
      key: 'hours',
      render: (hours) => <Tag color="blue">{hours} hrs</Tag>,
    },
    {
      title: 'Rate',
      dataIndex: ['overtimeRule', 'multiplier'],
      key: 'multiplier',
      render: (_, record) => record.overtimeRule ? (
        <Tag color="purple">{record.overtimeRule.multiplier}x</Tag>
      ) : '-',
    },
    {
      title: 'Remarks',
      dataIndex: 'remarks',
      key: 'remarks',
      render: (remarks) => remarks || '-',
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 100,
      fixed: 'right' as const,
      render: (_, record) => (
        <div style={{ display: 'flex', gap: 8 }}>
          <Button type="text" icon={<EditOutlined />} onClick={() => handleEdit(record)} />
          <Popconfirm
            title="Delete this overtime entry?"
            onConfirm={() => deleteMutation.mutate(record.id)}
            okText="Yes"
            cancelText="No"
          >
            <Button type="text" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </div>
      ),
    },
  ];

  const { data: employeesData } = useQuery({
    queryKey: ['employees-select'],
    queryFn: async () => {
      const module = await import('../../employees/services/employeeService');
      return module.employeeService.list({ limit: 1000, status: 'active' });
    },
    staleTime: 10 * 60 * 1000,
  });

  const { data: rulesData } = useQuery({
    queryKey: ['overtime-rules-select'],
    queryFn: async () => {
      const module = await import('../../overtime-rules/services/overtimeRuleService');
      return module.overtimeRuleService.list({ limit: 100, isActive: 'true' });
    },
    staleTime: 10 * 60 * 1000,
  });

  const employeeOptions = employeesData?.data?.map((emp: any) => ({
    value: emp.id,
    label: `${emp.fullName} (${emp.employeeCode})`,
  })) || [];

  const ruleOptions = rulesData?.data?.map((rule: any) => ({
    value: rule.id,
    label: `${rule.name} (${rule.multiplier}x)`,
  })) || [];

  return (
    <div>
      <PageHeader
        title="Overtime Entries"
        subtitle="Track and manage employee overtime hours"
        actions={
          <Button type="primary" icon={<PlusOutlined />} onClick={() => { setEditingId(null); form.resetFields(); setIsModalOpen(true); }}>
            Add Overtime
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
        pageSize={limit}
        onPaginationChange={(p, l) => { setPage(p); setLimit(l); }}
        toolbarLeft={
          <>
            <Select
              value={monthFilter}
              onChange={setMonthFilter}
              style={{ width: 120 }}
              options={Array.from({ length: 12 }, (_, i) => ({
                value: i + 1,
                label: dayjs().month(i).format('MMMM'),
              }))}
            />
            <Select
              value={yearFilter}
              onChange={setYearFilter}
              style={{ width: 100 }}
              options={Array.from({ length: 5 }, (_, i) => ({
                value: dayjs().year() - 2 + i,
                label: String(dayjs().year() - 2 + i),
              }))}
            />
            <Input.Search
              placeholder="Search employee..."
              onSearch={(val) => { setSearch(val); setPage(1); }}
              style={{ width: 200 }}
              allowClear
              prefix={<SearchOutlined style={{ color: 'var(--hrms-text-muted)' }} />}
              enterButton={false}
              loading={isLoading}
            />
          </>
        }
        toolbarRight={
          <span style={{ fontSize: 13, color: 'var(--hrms-text-muted)' }}>
            {data?.meta?.total ?? 0} entries
          </span>
        }
      />

      <Modal
        title={editingId ? 'Edit Overtime Entry' : 'Add Overtime Entry'}
        open={isModalOpen}
        onCancel={() => { setIsModalOpen(false); setEditingId(null); form.resetFields(); }}
        footer={null}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{
            date: dayjs(),
            hours: 1,
          }}
        >
          <Form.Item name="employee" label="Employee" rules={[{ required: true, message: 'Select employee' }]}>
            <Select
              showSearch
              placeholder="Select employee"
              options={employeeOptions}
              filterOption={(input, option) => (option?.label ?? '').toLowerCase().includes(input.toLowerCase())}
            />
          </Form.Item>

          <Form.Item name="date" label="Date" rules={[{ required: true, message: 'Select date' }]}>
            <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
          </Form.Item>

          <Form.Item name="hours" label="Hours" rules={[{ required: true, message: 'Enter hours' }]}>
            <InputNumber min={0.5} max={24} step={0.5} style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item name="overtimeRule" label="Overtime Rule (Optional)">
            <Select
              placeholder="Select overtime rule"
              allowClear
              options={ruleOptions}
            />
          </Form.Item>

          <Form.Item name="remarks" label="Remarks">
            <Input.TextArea rows={2} placeholder="Any remarks..." />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" block loading={createMutation.isPending || updateMutation.isPending}>
              {editingId ? 'Update' : 'Create'}
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
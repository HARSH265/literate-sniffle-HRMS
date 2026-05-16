import { useState } from 'react';
import { Table, Button, Modal, Form, Input, Select, InputNumber, DatePicker, message, Popconfirm, Row, Col, Avatar, Tooltip } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { PlusOutlined, EditOutlined, DeleteOutlined, EyeOutlined, SearchOutlined, UserOutlined } from '@ant-design/icons';
import { PageHeader } from '../../../core/components/PageHeader';
import { employeeService, Employee, CreateEmployee } from '../services/employeeService';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';

const CATEGORY_OPTIONS = [
  { label: 'Manufacturing Worker', value: 'worker' },
  { label: 'Office Staff', value: 'office-staff' },
];

const EMPLOYMENT_TYPE_OPTIONS = [
  { label: 'Permanent', value: 'permanent' },
  { label: 'Contract', value: 'contract' },
  { label: 'Temporary', value: 'temporary' },
  { label: 'Trainee', value: 'trainee' },
];

const SALARY_TYPE_OPTIONS = [
  { label: 'Monthly', value: 'monthly' },
  { label: 'Daily', value: 'daily' },
];

const STATUS_OPTIONS = [
  { label: 'Active', value: 'active' },
  { label: 'Inactive', value: 'inactive' },
  { label: 'Terminated', value: 'terminated' },
];

const StatusBadge = ({ status }: { status: string }) => {
  const map: Record<string, string> = {
    active: 'status-active', inactive: 'status-inactive', terminated: 'status-terminated'
  };
  return <span className={`status-badge ${map[status] || 'status-inactive'}`}>{status}</span>;
};

const CatTag = ({ cat }: { cat: string }) => (
  <span className="cat-tag" style={{ background: cat === 'worker' ? '#eff6ff' : '#faf5ff', color: cat === 'worker' ? '#2563eb' : '#7c3aed' }}>
    {cat === 'worker' ? 'Worker' : 'Office Staff'}
  </span>
);

export function EmployeesPage() {
  const [form] = Form.useForm();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [detailEmployee, setDetailEmployee] = useState<Employee | null>(null);
  const queryClient = useQueryClient();

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['employees', page, limit, search, statusFilter, categoryFilter],
    queryFn: () => employeeService.list({ page, limit, search, status: statusFilter || undefined, category: categoryFilter || undefined }),
    refetchOnWindowFocus: false,
  });

  const { data: deptData } = useQuery({
    queryKey: ['departments'],
    queryFn: () => import('../../departments/services/departmentService').then(m => m.departmentService.list({ limit: 100 })),
    staleTime: 5 * 60 * 1000,
  });

  const { data: desigData } = useQuery({
    queryKey: ['designations'],
    queryFn: () => import('../../designations/services/designationService').then(m => m.designationService.list({ limit: 100 })),
    staleTime: 5 * 60 * 1000,
  });

  const { data: shiftData } = useQuery({
    queryKey: ['shifts'],
    queryFn: () => import('../../shifts/services/shiftService').then(m => m.shiftService.list({ limit: 100 })),
    staleTime: 5 * 60 * 1000,
  });

  const createMutation = useMutation({
    mutationFn: (payload: CreateEmployee) => employeeService.create(payload),
    onSuccess: () => {
      message.success('Employee created successfully');
      setIsModalOpen(false);
      form.resetFields();
      queryClient.invalidateQueries({ queryKey: ['employees'] });
    },
    onError: (err: any) => message.error(err?.response?.data?.message || 'Failed to create employee'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<CreateEmployee> }) =>
      employeeService.update(id, payload),
    onSuccess: () => {
      message.success('Employee updated successfully');
      setIsModalOpen(false);
      form.resetFields();
      setEditingId(null);
      queryClient.invalidateQueries({ queryKey: ['employees'] });
    },
    onError: (err: any) => message.error(err?.response?.data?.message || 'Failed to update employee'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => employeeService.delete(id),
    onSuccess: () => {
      message.success('Employee deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['employees'] });
    },
    onError: (err: any) => message.error(err?.response?.data?.message || 'Failed to delete employee'),
  });

  const handleEdit = (record: Employee) => {
    setEditingId(record.id);
    form.setFieldsValue({
      ...record,
      department: record.department?.id,
      designation: record.designation?.id,
      shift: record.shift?.id,
      joiningDate: dayjs(record.joiningDate),
    });
    setIsModalOpen(true);
  };

  const handleView = async (record: Employee) => {
    const result = await employeeService.getById(record.id);
    setDetailEmployee(result.data);
    setIsDetailOpen(true);
  };

  const handleDelete = (id: string) => deleteMutation.mutate(id);

  const handleModalOk = () => {
    form.validateFields().then((values) => {
      const payload = { ...values, joiningDate: values.joiningDate?.format('YYYY-MM-DD') };
      if (editingId) updateMutation.mutate({ id: editingId, payload });
      else createMutation.mutate(payload as CreateEmployee);
    });
  };

  const EmpAvatar = ({ photo }: { name: string; photo?: string }) => (
    <Avatar
      src={photo}
      icon={<UserOutlined />}
      style={{ background: 'linear-gradient(135deg, #4f46e5, #7c3aed)', flexShrink: 0 }}
    />
  );

  const columns: ColumnsType<Employee> = [
    {
      title: 'Employee',
      key: 'employee',
      width: 280,
      render: (_: unknown, record: Employee) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <EmpAvatar name={record.fullName} photo={record.photo} />
          <div>
            <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--hrms-text-primary)' }}>{record.fullName}</div>
            <div style={{ fontSize: 12, color: 'var(--hrms-text-muted)' }}>{record.employeeCode}</div>
          </div>
        </div>
      ),
    },
    { title: 'Father Name', dataIndex: 'fatherName', key: 'fatherName', width: 150, render: (v: string) => <span style={{ color: 'var(--hrms-text-secondary)' }}>{v}</span> },
    {
      title: 'Category',
      dataIndex: 'category',
      key: 'category',
      width: 140,
      render: (cat: string) => <CatTag cat={cat} />,
    },
    {
      title: 'Department',
      key: 'department',
      width: 150,
      render: (_: unknown, record: Employee) => (
        <span style={{ color: 'var(--hrms-text-secondary)', fontSize: 13 }}>{record.department?.name || '—'}</span>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 110,
      render: (s: string) => <StatusBadge status={s} />,
    },
    {
      title: 'Salary',
      key: 'salary',
      width: 130,
      render: (_: unknown, record: Employee) => (
        <span style={{ fontWeight: 600, fontSize: 13 }}>
          {record.salaryType === 'monthly'
            ? <span style={{ color: 'var(--hrms-success)' }}>₹{(record.baseSalary / 1000).toFixed(1)}k<small style={{ fontWeight: 400, color: 'var(--hrms-text-muted)' }}>/mo</small></span>
            : <span style={{ color: 'var(--hrms-text-secondary)' }}>₹{record.dailyWage}<small style={{ fontWeight: 400 }}>/day</small></span>
          }
        </span>
      ),
    },
    {
      title: '',
      key: 'actions',
      width: 120,
      render: (_: unknown, record: Employee) => (
        <div className="action-group">
          <Tooltip title="View">
            <Button type="text" size="small" icon={<EyeOutlined />} onClick={() => handleView(record)} style={{ color: 'var(--hrms-text-muted)', borderRadius: 6 }} />
          </Tooltip>
          <Tooltip title="Edit">
            <Button type="text" size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)} style={{ color: 'var(--hrms-text-muted)', borderRadius: 6 }} />
          </Tooltip>
          <Popconfirm title="Delete this employee?" description="This action cannot be undone." onConfirm={() => handleDelete(record.id)} okText="Delete" okButtonProps={{ danger: true }}>
            <Tooltip title="Delete">
              <Button type="text" size="small" icon={<DeleteOutlined />} style={{ color: '#ef4444', borderRadius: 6 }} />
            </Tooltip>
          </Popconfirm>
        </div>
      ),
    },
  ];

  return (
    <div style={{ padding: '0 4px' }}>
      <PageHeader
        title="Employees"
        subtitle="Manage employee records and information"
        actions={
          <Button type="primary" icon={<PlusOutlined />} onClick={() => { setEditingId(null); form.resetFields(); setIsModalOpen(true); }}>
            Add Employee
          </Button>
        }
      />

      <div className="hrms-table-card">
        <div className="hrms-table-toolbar">
          <div className="hrms-table-toolbar-left">
            <Input.Search
              placeholder="Search by code or name..."
              onSearch={(val) => { setSearch(val); setPage(1); }}
              style={{ width: 260 }}
              allowClear
              prefix={<SearchOutlined style={{ color: 'var(--hrms-text-muted)' }} />}
              enterButton={false}
              loading={isFetching}
            />
            <Select
              placeholder="Status"
              allowClear
              style={{ width: 120 }}
              onChange={(val) => { setStatusFilter(val || ''); setPage(1); }}
              options={STATUS_OPTIONS}
            />
            <Select
              placeholder="Category"
              allowClear
              style={{ width: 150 }}
              onChange={(val) => { setCategoryFilter(val || ''); setPage(1); }}
              options={CATEGORY_OPTIONS}
            />
          </div>
          <div className="hrms-table-toolbar-right">
            <span style={{ fontSize: 13, color: 'var(--hrms-text-muted)' }}>{data?.meta?.total ?? 0} employees</span>
          </div>
        </div>

        <Table
          columns={columns}
          dataSource={data?.data}
          rowKey="id"
          loading={isLoading}
          scroll={{ x: 1100 }}
          pagination={{
            current: page,
            defaultPageSize: 20,
            pageSize: limit,
            total: data?.meta?.total ?? 0,
            onChange: (p, size) => { setPage(p); setLimit(size ?? 20); },
            showSizeChanger: true,
            pageSizeOptions: ['10', '20', '50', '100'],
            showTotal: (total, range) => `${range[0]}–${range[1]} of ${total}`,
          }}
        />
      </div>

      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--hrms-primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              👤
            </div>
            {editingId ? 'Edit Employee' : 'New Employee'}
          </div>
        }
        open={isModalOpen}
        onOk={handleModalOk}
        onCancel={() => { setIsModalOpen(false); form.resetFields(); }}
        confirmLoading={createMutation.isPending || updateMutation.isPending}
        okText={editingId ? 'Update' : 'Create'}
        okButtonProps={{ style: { borderRadius: 8 } }}
        cancelButtonProps={{ style: { borderRadius: 8 } }}
        width={760}
      >
        <div style={{ padding: '8px 0 0' }}>
          <Form form={form} layout="vertical">
            <Row gutter={16}>
              <Col span={8}>
                <Form.Item name="employeeCode" label="Employee Code" rules={[{ required: true }]}>
                  <Input placeholder="EMP001" style={{ height: 40 }} />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item name="fullName" label="Full Name" rules={[{ required: true }]}>
                  <Input placeholder="John Doe" style={{ height: 40 }} />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item name="fatherName" label="Father's Name" rules={[{ required: true }]}>
                  <Input placeholder="Father Name" style={{ height: 40 }} />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={16}>
              <Col span={8}>
                <Form.Item name="category" label="Category" rules={[{ required: true }]}>
                  <Select options={CATEGORY_OPTIONS} placeholder="Select category" style={{ height: 40 }} />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item name="employmentType" label="Employment Type" rules={[{ required: true }]}>
                  <Select options={EMPLOYMENT_TYPE_OPTIONS} placeholder="Select type" style={{ height: 40 }} />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item name="joiningDate" label="Joining Date" rules={[{ required: true }]}>
                  <DatePicker style={{ width: '100%', height: 40 }} />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={16}>
              <Col span={8}>
                <Form.Item name="department" label="Department" rules={[{ required: true }]}>
                  <Select placeholder="Select department" options={deptData?.data.map((d: any) => ({ label: d.name, value: d.id }))} style={{ height: 40 }} />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item name="designation" label="Designation" rules={[{ required: true }]}>
                  <Select placeholder="Select designation" options={desigData?.data.map((d: any) => ({ label: d.name, value: d.id }))} style={{ height: 40 }} />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item name="shift" label="Shift" rules={[{ required: true }]}>
                  <Select placeholder="Select shift" options={shiftData?.data.map((s: any) => ({ label: s.name, value: s.id }))} style={{ height: 40 }} />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={16}>
              <Col span={8}>
                <Form.Item name="salaryType" label="Salary Type" rules={[{ required: true }]}>
                  <Select options={SALARY_TYPE_OPTIONS} placeholder="Select type" style={{ height: 40 }} />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item name="baseSalary" label="Base Salary (₹/month)" rules={[{ required: true }]}>
                  <InputNumber style={{ width: '100%', height: 40 }} min={0} placeholder="25000" />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item name="dailyWage" label="Daily Wage (₹)">
                  <InputNumber style={{ width: '100%', height: 40 }} min={0} placeholder="800" />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={16}>
              <Col span={8}>
                <Form.Item name="contactNumber" label="Contact Number">
                  <Input placeholder="+91 98765 43210" style={{ height: 40 }} />
                </Form.Item>
              </Col>
              <Col span={16}>
                <Form.Item name="address" label="Address">
                  <Input.TextArea placeholder="Full address..." rows={1} />
                </Form.Item>
              </Col>
            </Row>
          </Form>
        </div>
      </Modal>

      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--hrms-primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>👤</div>
            Employee Details
          </div>
        }
        open={isDetailOpen}
        onCancel={() => setIsDetailOpen(false)}
        footer={[
          <Button key="close" onClick={() => setIsDetailOpen(false)} style={{ borderRadius: 8 }}>Close</Button>,
          detailEmployee && <Button key="edit" type="primary" onClick={() => { setIsDetailOpen(false); handleEdit(detailEmployee); }} style={{ borderRadius: 8 }}>Edit</Button>,
        ]}
        width={600}
      >
        {detailEmployee && (
          <div>
            <div style={{ display: 'flex', gap: 16, marginBottom: 24, padding: '16px 20px', background: '#f8fafc', borderRadius: 12 }}>
              <Avatar size={56} icon={<UserOutlined />} style={{ background: 'linear-gradient(135deg, #4f46e5, #7c3aed)' }} />
              <div>
                <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--hrms-text-primary)' }}>{detailEmployee.fullName}</div>
                <div style={{ fontSize: 13, color: 'var(--hrms-text-muted)' }}>{detailEmployee.employeeCode}</div>
                <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
                  <StatusBadge status={detailEmployee.status} />
                  <CatTag cat={detailEmployee.category} />
                </div>
              </div>
            </div>

            <Row gutter={[24, 16]}>
              {[
                ['Father Name', detailEmployee.fatherName],
                ['Employment', detailEmployee.employmentType],
                ['Joining Date', dayjs(detailEmployee.joiningDate).format('DD MMM YYYY')],
                ['Department', detailEmployee.department?.name],
                ['Designation', detailEmployee.designation?.name],
                ['Shift', detailEmployee.shift?.name],
                ['Salary Type', detailEmployee.salaryType],
                ['Base Salary', `₹${detailEmployee.baseSalary.toLocaleString()}/month`],
                ['Contact', detailEmployee.contactNumber || '—'],
                ['Address', detailEmployee.address || '—'],
              ].map(([label, value]) => (
                <Col span={12} key={label}>
                  <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--hrms-text-muted)', marginBottom: 4 }}>{label}</div>
                  <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--hrms-text-primary)' }}>{value}</div>
                </Col>
              ))}
            </Row>
          </div>
        )}
      </Modal>
    </div>
  );
}
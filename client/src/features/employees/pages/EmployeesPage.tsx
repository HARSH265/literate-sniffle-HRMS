import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, message, Popconfirm, Avatar, Tooltip, Select, Input, Upload } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { PlusOutlined, EditOutlined, DeleteOutlined, EyeOutlined, SearchOutlined, UserOutlined, DownloadOutlined, UploadOutlined } from '@ant-design/icons';
import { PageHeader } from '../../../core/components/PageHeader';
import { DataTable } from '../../../core/components/DataTable';
import { employeeService, Employee } from '../services/employeeService';
import { departmentService } from '../../departments/services/departmentService';
import { designationService } from '../../designations/services/designationService';
import { CATEGORY_OPTIONS, STATUS_OPTIONS } from '../../../core/constants/employee';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

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
  const navigate = useNavigate();
  const fileInputRef = useRef<any>(null);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [departmentFilter, setDepartmentFilter] = useState<string>('');
  const [designationFilter, setDesignationFilter] = useState<string>('');
  const queryClient = useQueryClient();

  const { data: deptData } = useQuery({
    queryKey: ['departments-filter'],
    queryFn: () => departmentService.list({ limit: 1000 }),
  });

  const { data: desigData } = useQuery({
    queryKey: ['designations-filter', departmentFilter],
    queryFn: () => designationService.list({ limit: 1000, department: departmentFilter || undefined }),
  });

  const importMutation = useMutation({
    mutationFn: (file: File) => employeeService.import(file),
    onSuccess: (data) => {
      const failed = data.failed ?? 0;
      message.success(`Import completed: ${data.success} successful, ${failed} failed`);
      if (data.success > 0) {
        queryClient.invalidateQueries({ queryKey: ['employees'] });
      }
    },
    onError: (err: any) => message.error(err?.response?.data?.message || 'Import failed'),
  });

  const handleExport = async () => {
    try {
      const blob = await employeeService.export();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `employees_${new Date().toISOString().split('T')[0]}.xlsx`;
      a.click();
      window.URL.revokeObjectURL(url);
      message.success('Export completed');
    } catch {
      message.error('Export failed');
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      const blob = await employeeService.downloadTemplate();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'employee_template.xlsx';
      a.click();
      window.URL.revokeObjectURL(url);
    } catch {
      message.error('Failed to download template');
    }
  };

  const handleImport = (file: File) => {
    importMutation.mutate(file);
    return false;
  };

const { data, isLoading, isFetching } = useQuery({
    queryKey: ['employees', page, limit, search, statusFilter, categoryFilter, departmentFilter, designationFilter],
    queryFn: () => employeeService.list({ page, limit, search, status: statusFilter, category: categoryFilter, department: departmentFilter, designation: designationFilter }),
    staleTime: 5 * 60 * 1000,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => employeeService.delete(id),
    onSuccess: () => {
      message.success('Employee deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['employees'] });
    },
    onError: (err: any) => message.error(err?.response?.data?.message || 'Failed to delete employee'),
  });

  const handleDelete = (id: string) => deleteMutation.mutate(id);

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
      fixed: 'right' as const,
      render: (_: unknown, record: Employee) => (
        <div className="action-group" onClick={(e) => e.stopPropagation()}>
          <Tooltip title="View">
            <Button type="text" size="small" icon={<EyeOutlined />} onClick={() => navigate(`/employees/${record.id}`)} style={{ color: 'var(--hrms-text-muted)', borderRadius: 6 }} />
          </Tooltip>
          <Tooltip title="Edit">
            <Button type="text" size="small" icon={<EditOutlined />} onClick={() => navigate(`/employees/${record.id}/edit`)} style={{ color: 'var(--hrms-text-muted)', borderRadius: 6 }} />
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
          <div style={{ display: 'flex', gap: 8 }}>
            <Button icon={<DownloadOutlined />} onClick={handleDownloadTemplate}>
              Template
            </Button>
            <Button icon={<UploadOutlined />} onClick={() => fileInputRef.current?.click()}>
              Import
            </Button>
            <Upload beforeUpload={handleImport} showUploadList={false} accept=".xlsx,.xls">
              <Button ref={fileInputRef} style={{ display: 'none' }} />
            </Upload>
            <Button icon={<DownloadOutlined />} onClick={handleExport}>
              Export
            </Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/employees/new')}>
              Add Employee
            </Button>
          </div>
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
        onPaginationChange={(p, size) => { setPage(p); setLimit(size ?? 10); }}
        onRowClick={(record) => navigate(`/employees/${record.id}`)}
        toolbarLeft={
          <Input.Search
            placeholder="Search by code, name, or father's name..."
            onSearch={(val) => { setSearch(val); setPage(1); }}
            style={{ width: 280 }}
            allowClear
            prefix={<SearchOutlined style={{ color: 'var(--hrms-text-muted)' }} />}
            enterButton={false}
            loading={isFetching}
          />
        }
        filterContent={
          <>
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
            <Select
              placeholder="Department"
              allowClear
              style={{ width: 150 }}
              onChange={(val) => { setDepartmentFilter(val || ''); setDesignationFilter(''); setPage(1); }}
              options={deptData?.data?.map((d: any) => ({ label: d.name, value: d.id })) || []}
            />
            <Select
              placeholder="Designation"
              allowClear
              style={{ width: 150 }}
              onChange={(val) => { setDesignationFilter(val || ''); setPage(1); }}
              options={desigData?.data?.map((d: any) => ({ label: d.name, value: d.id })) || []}
              disabled={!departmentFilter}
            />
          </>
        }
        toolbarRight={
          <span style={{ fontSize: 13, color: 'var(--hrms-text-muted)' }}>{data?.meta?.total ?? 0} employees</span>
        }
      />
    </div>
  );
}
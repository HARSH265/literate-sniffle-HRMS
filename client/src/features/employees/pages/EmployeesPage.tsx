import { useState, useRef, memo, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, message, Popconfirm, Avatar, Tooltip, Select, Input, Upload, Alert } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { PlusOutlined, EditOutlined, EyeOutlined, SearchOutlined, UserOutlined, DownloadOutlined, UploadOutlined, ReloadOutlined, InboxOutlined } from '@ant-design/icons';
import { PageHeader } from '../../../core/components/PageHeader';
import { DataTable } from '../../../core/components/DataTable';
import { employeeService, Employee } from '../services/employeeService';
import { departmentService } from '../../departments/services/departmentService';
import { designationService } from '../../designations/services/designationService';
import { formatCurrency } from '../../../core/constants/currency';
import { CATEGORY_OPTIONS, STATUS_OPTIONS } from '../../../core/constants/employee';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import styles from '../employees.module.css';

const StatusBadge = ({ status }: { status: string }) => {
  const map: Record<'active' | 'inactive' | 'terminated' | 'archived', string> = {
    active: 'status-active', inactive: 'status-inactive', terminated: 'status-terminated', archived: 'status-inactive'
  };
  return <span className={`status-badge ${map[status as keyof typeof map] || 'status-inactive'}`}>{status}</span>;
};

const CatTag = ({ cat }: { cat: string }) => (
  <span className="cat-tag" style={{ background: cat === 'worker' ? '#eff6ff' : '#faf5ff', color: cat === 'worker' ? '#2563eb' : '#7c3aed' }}>
    {cat === 'worker' ? 'Worker' : 'Office Staff'}
  </span>
);

const EmpAvatar = memo(({ name, photo }: { name: string; photo?: string }) => (
  <Avatar
    src={photo}
    icon={<UserOutlined />}
    alt={name}
    className={styles.avatarGradient}
  />
));

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

  const handleExport = useCallback(async () => {
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
  }, []);

  const handleDownloadTemplate = useCallback(async () => {
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
  }, []);

  const IMPORT_MAX_SIZE = 10 * 1024 * 1024;

  const handleImport = (file: File) => {
    if (file.size > IMPORT_MAX_SIZE) {
      message.error(`File size exceeds 10MB limit (${(file.size / 1024 / 1024).toFixed(1)}MB)`);
      return false;
    }
    importMutation.mutate(file);
    return false;
  };

  const { data, isLoading, isFetching, error } = useQuery({
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

  const handleDelete = useCallback((id: string) => deleteMutation.mutate(id), [deleteMutation]);

  const columns = useMemo<ColumnsType<Employee>>(() => [
    {
      title: 'Employee',
      key: 'employee',
      width: 280,
      render: (_: unknown, record: Employee) => (
        <div className={styles.employeeRow}>
          <EmpAvatar name={record.fullName} photo={record.photo} />
          <div>
            <div className={styles.employeeName}>{record.fullName}</div>
            <div className={styles.employeeCode}>{record.employeeCode}</div>
          </div>
        </div>
      ),
    },
    { title: 'Father Name', dataIndex: 'fatherName', key: 'fatherName', width: 150, render: (v: string) => <span className={styles.secondaryText}>{v}</span> },
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
        <span className={styles.deptText}>{record.department?.name || '—'}</span>
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
        <span className={styles.salaryCell}>
          {record.salaryType === 'monthly'
            ? record.baseSalary
              ? <span className={styles.salaryMonthly}>{formatCurrency(record.baseSalary / 1000)}k<small className={styles.salaryUnit}>/mo</small></span>
              : <span className={styles.mutedText}>—</span>
            : record.dailyWage
              ? <span className={styles.secondaryText}>{formatCurrency(record.dailyWage)}<small className={styles.salaryUnit}>/day</small></span>
              : <span className={styles.mutedText}>—</span>
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
            <Button type="text" size="small" icon={<EyeOutlined />} onClick={() => navigate(`/employees/${record.id}`)} className={styles.actionBtn} aria-label="View employee" />
          </Tooltip>
          <Tooltip title="Edit">
            <Button type="text" size="small" icon={<EditOutlined />} onClick={() => navigate(`/employees/${record.id}/edit`)} className={styles.actionBtn} aria-label="Edit employee" />
          </Tooltip>
          <Popconfirm title="Archive this employee?" description="This will archive the employee. They can be restored later." onConfirm={() => handleDelete(record.id)} okText="Archive" okButtonProps={{ danger: true }}>
            <Button type="text" size="small" icon={<InboxOutlined />} className={styles.actionBtnDanger} aria-label="Archive employee" />
          </Popconfirm>
        </div>
      ),
    },
  ], [navigate, handleDelete]);

  return (
    <div className={styles.pageWrap}>
      <PageHeader
        title="Employees"
        subtitle="Manage employee records and information"
        actions={
          <div className={styles.actionGroup}>
            <Button icon={<DownloadOutlined />} onClick={handleDownloadTemplate}>
              Template
            </Button>
            <Button icon={<UploadOutlined />} onClick={() => fileInputRef.current?.click()}>
              Import
            </Button>
            <Upload beforeUpload={handleImport} showUploadList={false} accept=".xlsx,.xls">
              <Button ref={fileInputRef} className={styles.hiddenInput} />
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

      {error && (
        <Alert
          type="error"
          message="Failed to load employees"
          description="An error occurred while fetching employee data. Please try again."
          action={
            <Button size="small" icon={<ReloadOutlined />} onClick={() => queryClient.invalidateQueries({ queryKey: ['employees'] })}>
              Retry
            </Button>
          }
          className={styles.errorMargin}
          showIcon
        />
      )}

      <DataTable
        columns={columns}
        dataSource={data?.data}
        rowKey="id"
        loading={isLoading}
        total={data?.meta?.total ?? 0}
        page={page}
        onPaginationChange={(p, size) => { setPage(p); setLimit(size ?? 10); }}
        onRowClick={(record) => navigate(`/employees/${record.id}`)}
        toolbarLeft={
          <Input.Search
            placeholder="Search by code, name, or father's name..."
            onSearch={(val) => { setSearch(val); setPage(1); }}
            className={styles.filterSearch}
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
              className={styles.filterStatus}
              onChange={(val) => { setStatusFilter(val || ''); setPage(1); }}
              options={STATUS_OPTIONS}
            />
            <Select
              placeholder="Category"
              allowClear
              className={styles.filterMedium}
              onChange={(val) => { setCategoryFilter(val || ''); setPage(1); }}
              options={CATEGORY_OPTIONS}
            />
            <Select
              placeholder="Department"
              allowClear
              className={styles.filterMedium}
              onChange={(val) => { setDepartmentFilter(val || ''); setDesignationFilter(''); setPage(1); }}
              options={deptData?.data?.map((d: any) => ({ label: d.name, value: d.id })) || []}
            />
            <Select
              placeholder="Designation"
              allowClear
              className={styles.filterMedium}
              onChange={(val) => { setDesignationFilter(val || ''); setPage(1); }}
              options={desigData?.data?.map((d: any) => ({ label: d.name, value: d.id })) || []}
              disabled={!departmentFilter}
            />
          </>
        }
        toolbarRight={
          <span className={styles.countText}>{data?.meta?.total ?? 0} employees</span>
        }
      />
    </div>
  );
}

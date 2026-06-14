import { useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button, message, Spin } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { PageHeader } from '../../../core/components/PageHeader';
import { EmployeeForm } from '../components/EmployeeForm';
import { employeeService, CreateEmployee } from '../services/employeeService';
import { useQuery, useMutation } from '@tanstack/react-query';
import dayjs from 'dayjs';
import styles from '../employees.module.css';

export function EmployeeEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const hasRedirected = useRef(false);

  const { data: employeeData, isLoading: empLoading, isError } = useQuery({
    queryKey: ['employee', id],
    queryFn: () => employeeService.getById(id!),
    enabled: !!id,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<CreateEmployee> }) => employeeService.update(id, payload),
    onSuccess: () => {
      message.success('Employee updated successfully');
      navigate(`/employees/${id}`);
    },
    onError: (err: any) => {
      message.error(err?.response?.data?.message || 'Failed to update employee');
    },
  });

  useEffect(() => {
    if (!empLoading && isError && !hasRedirected.current) {
      hasRedirected.current = true;
      message.error('Employee not found');
      navigate('/employees');
    }
  }, [empLoading, isError, navigate]);

  if (empLoading) {
    return (
      <div className={styles.loadingCenter}>
        <Spin size="large" />
      </div>
    );
  }

  if (!employeeData?.data) {
    return null;
  }

  const employee = employeeData.data;

  return (
    <div className={styles.pageWrap}>
      <PageHeader
        title="Edit Employee"
        breadcrumbs={[
          { label: 'Employees', path: '/employees' },
          { label: employee.employeeCode, path: `/employees/${id}` },
          { label: 'Edit' },
        ]}
        actions={
          <Button type="text" icon={<ArrowLeftOutlined />} onClick={() => navigate(`/employees/${id}`)}>
            Back to Details
          </Button>
        }
      />

      <div style={{ maxWidth: 1400, margin: '0 auto' }}>
        <EmployeeForm
          mode="edit"
          initialValues={{
            ...employee,
            department: employee.department?.id,
            designation: employee.designation?.id,
            shift: employee.shift?.id,
            joiningDate: employee.joiningDate ? dayjs(employee.joiningDate) : undefined,
            dateOfBirth: employee.dateOfBirth ? dayjs(employee.dateOfBirth) : undefined,
          }}
          onSubmit={(values) => updateMutation.mutate({ id: id!, payload: values })}
          isPending={updateMutation.isPending}
          onCancel={() => navigate(`/employees/${id}`)}
        />
      </div>
    </div>
  );
}

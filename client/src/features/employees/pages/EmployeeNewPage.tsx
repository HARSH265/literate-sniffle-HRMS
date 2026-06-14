import { useNavigate } from 'react-router-dom';
import { Button, message } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { PageHeader } from '../../../core/components/PageHeader';
import { EmployeeForm } from '../components/EmployeeForm';
import { employeeService, CreateEmployee } from '../services/employeeService';
import { useMutation } from '@tanstack/react-query';
import styles from '../employees.module.css';

export function EmployeeNewPage() {
  const navigate = useNavigate();

  const createMutation = useMutation({
    mutationFn: (payload: CreateEmployee) => employeeService.create(payload),
    onSuccess: () => {
      message.success('Employee created successfully');
      navigate('/employees');
    },
    onError: (err: any) => {
      message.error(err?.response?.data?.message || 'Failed to create employee');
    },
  });

  return (
    <div className={styles.pageWrap}>
      <PageHeader
        title="Add Employee"
        breadcrumbs={[{ label: 'Employees', path: '/employees' }, { label: 'New' }]}
        actions={
          <Button type="text" icon={<ArrowLeftOutlined />} onClick={() => navigate('/employees')}>
            Back to List
          </Button>
        }
      />

      <div style={{ maxWidth: 1400, margin: '0 auto' }}>
        <EmployeeForm
          mode="create"
          onSubmit={(values) => createMutation.mutate(values)}
          isPending={createMutation.isPending}
          onCancel={() => navigate('/employees')}
        />
      </div>
    </div>
  );
}

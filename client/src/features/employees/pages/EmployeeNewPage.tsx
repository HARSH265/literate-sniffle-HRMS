import { useNavigate } from 'react-router-dom';
import { Button, message } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { PageHeader } from '../../../core/components/PageHeader';
import { PageContainer } from '../../../core/components/PageContainer';
import { EmployeeForm } from '../components/EmployeeForm';
import { employeeService, CreateEmployee } from '../services/employeeService';
import { useMutation } from '@tanstack/react-query';

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
    <PageContainer>
      <PageHeader
        title="Add Employee"
        breadcrumbs={[{ label: 'Employees', path: '/employees' }, { label: 'New' }]}
        actions={
          <Button type="text" icon={<ArrowLeftOutlined />} onClick={() => navigate('/employees')}>
            Back to List
          </Button>
        }
      />

      <EmployeeForm
        mode="create"
        onSubmit={(values) => createMutation.mutate(values)}
        isPending={createMutation.isPending}
        onCancel={() => navigate('/employees')}
      />
    </PageContainer>
  );
}

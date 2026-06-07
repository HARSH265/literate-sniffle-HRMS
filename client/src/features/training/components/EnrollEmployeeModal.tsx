import { useState } from 'react';
import { Modal, Form, Select, Typography } from 'antd';
import { UserAddOutlined } from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import { useEnrollEmployee } from '../hooks/useTraining';
import { employeeService } from '../../employees/services/employeeService';

const { Text } = Typography;

const getId = (record: any) => record?.id || record?._id;

interface EnrollEmployeeModalProps {
  open: boolean;
  trainingId: string;
  onClose: () => void;
}

export function EnrollEmployeeModal({ open, trainingId, onClose }: EnrollEmployeeModalProps) {
  const [employeeId, setEmployeeId] = useState<string>('');
  const enrollMutation = useEnrollEmployee();

  const { data: employees } = useQuery({
    queryKey: ['employees', 'active'],
    queryFn: () => employeeService.list({ limit: 500, status: 'active' }),
  });

  const handleOk = () => {
    if (!employeeId) return;
    enrollMutation.mutate(
      { trainingId, employeeId },
      { onSuccess: () => { setEmployeeId(''); onClose(); } },
    );
  };

  const handleCancel = () => {
    setEmployeeId('');
    onClose();
  };

  return (
    <Modal
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--hrms-primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--hrms-primary)' }}>
            <UserAddOutlined />
          </div>
          <span>Enroll Employee</span>
        </div>
      }
      open={open}
      onOk={handleOk}
      onCancel={handleCancel}
      okText="Enroll"
      okButtonProps={{ disabled: !employeeId, loading: enrollMutation.isPending, icon: <UserAddOutlined /> }}
      cancelButtonProps={{ style: { borderRadius: 6 } }}
      destroyOnClose
      width={480}
    >
      <Form layout="vertical">
        <Form.Item label={<Text style={{ fontWeight: 500, fontSize: 13 }}>Select Employee</Text>} required>
          <Select
            showSearch
            placeholder="Search employee by name or code"
            value={employeeId || undefined}
            onChange={setEmployeeId}
            filterOption={(input, option) => (option?.label as string || '').toLowerCase().includes(input.toLowerCase())}
            options={(employees?.data || []).map((emp: any) => ({ label: `${emp.fullName} (${emp.employeeCode})`, value: getId(emp) })).filter((option: any) => Boolean(option.value))}
            size="large"
            style={{ borderRadius: 6 }}
          />
        </Form.Item>
      </Form>
    </Modal>
  );
}

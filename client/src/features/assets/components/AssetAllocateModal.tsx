import { useState } from 'react';
import { Modal, Form, Select, Input } from 'antd';
import { useQuery } from '@tanstack/react-query';
import { employeeService } from '../../employees/services/employeeService';

interface AssetAllocateModalProps {
  open: boolean;
  onCancel: () => void;
  onAllocate: (employeeId: string, notes?: string) => void;
  loading?: boolean;
}

export function AssetAllocateModal({ open, onCancel, onAllocate, loading }: AssetAllocateModalProps) {
  const [employeeId, setEmployeeId] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  const { data: employees } = useQuery({
    queryKey: ['employees', 'active'],
    queryFn: () => employeeService.list({ limit: 500, status: 'active' }),
  });

  const handleOk = () => {
    if (!employeeId) return;
    onAllocate(employeeId, notes || undefined);
    setEmployeeId('');
    setNotes('');
  };

  const handleCancel = () => {
    setEmployeeId('');
    setNotes('');
    onCancel();
  };

  return (
    <Modal
      title="Allocate Asset"
      open={open}
      onOk={handleOk}
      onCancel={handleCancel}
      okText="Allocate"
      okButtonProps={{ disabled: !employeeId, loading }}
      destroyOnClose
    >
      <Form layout="vertical">
        <Form.Item label="Employee" required>
          <Select
            showSearch
            placeholder="Search employee by name or code"
            value={employeeId || undefined}
            onChange={setEmployeeId}
            filterOption={(input, option) =>
              (option?.label as string || '').toLowerCase().includes(input.toLowerCase())
            }
            options={(employees?.data || []).map((emp: any) => ({
              label: `${emp.fullName} (${emp.employeeCode})`,
              value: emp._id || emp.id,
            }))}
            size="large"
          />
        </Form.Item>
        <Form.Item label="Notes">
          <Input.TextArea
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Optional notes about this allocation"
          />
        </Form.Item>
      </Form>
    </Modal>
  );
}

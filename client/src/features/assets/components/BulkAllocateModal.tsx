import { useState } from 'react';
import { Modal, Form, Select, Input, message } from 'antd';
import { useQuery } from '@tanstack/react-query';
import { employeeService } from '../../employees/services/employeeService';
import { assetService } from '../services/assetService';

interface BulkAllocateModalProps {
  open: boolean;
  onCancel: () => void;
  onDone: () => void;
}

export function BulkAllocateModal({ open, onCancel, onDone }: BulkAllocateModalProps) {
  const [assetIds, setAssetIds] = useState<string[]>([]);
  const [employeeId, setEmployeeId] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const { data: employees } = useQuery({
    queryKey: ['employees', 'active'],
    queryFn: () => employeeService.list({ limit: 500, status: 'active' }),
  });

  const { data: assets } = useQuery({
    queryKey: ['assets', 'available'],
    queryFn: () => assetService.list({ limit: 500, status: 'available' }),
  });

  const handleOk = async () => {
    if (!assetIds.length || !employeeId) return;
    setLoading(true);
    try {
      await Promise.all(
        assetIds.map((assetId) => assetService.allocate(assetId, employeeId, notes || undefined))
      );
      message.success(`${assetIds.length} asset(s) allocated successfully`);
      setAssetIds([]);
      setEmployeeId('');
      setNotes('');
      onDone();
    } catch (err: any) {
      message.error(err?.response?.data?.message || 'Bulk allocation failed');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setAssetIds([]);
    setEmployeeId('');
    setNotes('');
    onCancel();
  };

  return (
    <Modal
      title="Bulk Allocate Assets"
      open={open}
      onOk={handleOk}
      onCancel={handleCancel}
      okText="Allocate All"
      okButtonProps={{ disabled: !assetIds.length || !employeeId, loading }}
      destroyOnClose
      width={520}
    >
      <Form layout="vertical">
        <Form.Item label="Select Assets" required>
          <Select
            mode="multiple"
            placeholder="Choose available assets"
            value={assetIds}
            onChange={setAssetIds}
            filterOption={(input, option) =>
              (option?.label as string || '').toLowerCase().includes(input.toLowerCase())
            }
            options={(assets?.data || [])
              .filter((a: any) => a.status === 'available')
              .map((a: any) => ({
                label: `${a.assetCode} - ${a.name}`,
                value: a._id || a.id,
              }))}
            size="large"
          />
        </Form.Item>
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

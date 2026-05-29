import { useState } from 'react';
import { Modal, Form, Select, Input } from 'antd';

interface AssetReturnModalProps {
  open: boolean;
  onCancel: () => void;
  onReturn: (condition?: string, notes?: string) => void;
  loading?: boolean;
}

const CONDITIONS = ['New', 'Good', 'Fair', 'Damaged'];

export function AssetReturnModal({ open, onCancel, onReturn, loading }: AssetReturnModalProps) {
  const [condition, setCondition] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  const handleOk = () => {
    onReturn(condition || undefined, notes || undefined);
    setCondition('');
    setNotes('');
  };

  const handleCancel = () => {
    setCondition('');
    setNotes('');
    onCancel();
  };

  return (
    <Modal
      title="Return Asset"
      open={open}
      onOk={handleOk}
      onCancel={handleCancel}
      okText="Return"
      okButtonProps={{ loading }}
      destroyOnClose
    >
      <Form layout="vertical">
        <Form.Item label="Condition">
          <Select
            placeholder="Select condition"
            value={condition || undefined}
            onChange={setCondition}
            allowClear
            options={CONDITIONS.map((c) => ({ label: c, value: c }))}
            size="large"
          />
        </Form.Item>
        <Form.Item label="Notes">
          <Input.TextArea
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Optional notes about this return"
          />
        </Form.Item>
      </Form>
    </Modal>
  );
}

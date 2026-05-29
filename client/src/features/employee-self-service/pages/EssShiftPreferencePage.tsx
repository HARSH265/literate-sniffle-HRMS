import { useEffect } from 'react';
import { Card, Form, Select, DatePicker, InputNumber, Button, Spin, Alert } from 'antd';
import { SaveOutlined } from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import { useSwapPreference, useEssSetSwapPreference } from '../hooks/useEssShiftSwaps';
import { shiftService } from '../../shifts/services/shiftService';
import dayjs from 'dayjs';

const cardStyle = { borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' };
const { TextArea } = Input;

export function EssShiftPreferencePage() {
  const [form] = Form.useForm();
  const { data, isLoading } = useSwapPreference();
  const setPreference = useEssSetSwapPreference();

  const { data: shiftsData } = useQuery({
    queryKey: ['shifts'],
    queryFn: () => shiftService.list(),
  });
  const shiftOptions = (shiftsData?.data || []).map((s: any) => ({ label: s.name, value: s.id || s._id }));

  useEffect(() => {
    if (data?.data) {
      form.setFieldsValue({
        preferredShift: data.data.preferredShift?._id || data.data.preferredShift?.id,
        effectiveFrom: data.data.effectiveFrom ? dayjs(data.data.effectiveFrom) : undefined,
        effectiveTo: data.data.effectiveTo ? dayjs(data.data.effectiveTo) : undefined,
        priority: data.data.priority || 1,
        reason: data.data.reason || '',
      });
    }
  }, [data, form]);

  const handleFinish = (values: any) => {
    setPreference.mutate({
      preferredShift: values.preferredShift,
      effectiveFrom: values.effectiveFrom.toISOString(),
      effectiveTo: values.effectiveTo?.toISOString(),
      priority: values.priority || 1,
      reason: values.reason,
    });
  };

  if (isLoading) {
    return <Spin size="large" style={{ display: 'block', margin: '40px auto' }} />;
  }

  return (
    <div>
      <Card
        title={<span style={{ fontSize: 15 }}>Shift Preference</span>}
        headStyle={{ borderBottom: '1px solid #f0f0f0' }}
        style={cardStyle}
      >
        <Form form={form} layout="vertical" onFinish={handleFinish}>
          <Form.Item name="preferredShift" label="Preferred Shift" rules={[{ required: true, message: 'Select a shift' }]}>
            <Select placeholder="Select shift" options={shiftOptions} />
          </Form.Item>
          <Form.Item name="priority" label="Priority (1-10)">
            <InputNumber min={1} max={10} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="effectiveFrom" label="Effective From" rules={[{ required: true, message: 'Select date' }]}>
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="effectiveTo" label="Effective To (optional)">
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="reason" label="Reason">
            <TextArea rows={3} maxLength={500} placeholder="Why do you prefer this shift?" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" icon={<SaveOutlined />} loading={setPreference.isPending} block>
              Save Preference
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}

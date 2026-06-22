import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Form, Select, DatePicker, InputNumber, Row, Col, Button, Input } from 'antd';
import { SettingOutlined, ArrowLeftOutlined, SaveOutlined } from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import { PageContainer } from '../../../core/components/PageContainer';
import { PageHeader } from '../../../core/components/PageHeader';
import { FormSection } from '../../../core/components/FormSection';
import { FORM_LAYOUT } from '../../../core/constants/employee';
import { useShiftPreference, useSetShiftPreference } from '../hooks/useShiftSwaps';
import { shiftService } from '../../shifts/services/shiftService';
import dayjs from 'dayjs';

const { TextArea } = Input;
const { rowGutter, inputHeight } = FORM_LAYOUT;

export function ShiftPreferencesPage() {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const { data } = useShiftPreference();
  const setPreference = useSetShiftPreference();

  const { data: shiftsData } = useQuery({
    queryKey: ['shifts'],
    queryFn: () => shiftService.list(),
  });
  const shiftOptions = (shiftsData?.data || []).map((s: any) => ({ label: s.name, value: s.id || s._id }));

  useEffect(() => {
    if (data?.data) {
      form.setFieldsValue({
        preferredShift: data.data.preferredShift?._id,
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

  return (
    <PageContainer>
      <PageHeader
        title="Shift Preferences"
        subtitle="Set your preferred shift schedule"
        breadcrumbs={[{ label: 'Shift Swaps', path: '/shift-swaps' }, { label: 'Preferences' }]}
        actions={
          <Button type="text" icon={<ArrowLeftOutlined />} onClick={() => navigate('/shift-swaps')}>
            Back to Swaps
          </Button>
        }
      />

      <div style={{ maxWidth: 1000, margin: '0 auto' }}>
        <Form form={form} layout="vertical" onFinish={handleFinish}>
          <Row gutter={24} justify="center">
            <Col xs={24} lg={20}>
              <FormSection title="Preference Details" icon={<SettingOutlined />}>
                <Row gutter={rowGutter}>
                  <Col span={12}>
                    <Form.Item name="preferredShift" label="Preferred Shift" rules={[{ required: true, message: 'Select a shift' }]}>
                      <Select placeholder="Select shift" options={shiftOptions} style={{ height: inputHeight }} />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item name="priority" label="Priority (1-10)">
                      <InputNumber min={1} max={10} style={{ width: '100%', height: inputHeight }} />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item name="effectiveFrom" label="Effective From" rules={[{ required: true, message: 'Select date' }]}>
                      <DatePicker style={{ width: '100%', height: inputHeight }} />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item name="effectiveTo" label="Effective To (optional)">
                      <DatePicker style={{ width: '100%', height: inputHeight }} />
                    </Form.Item>
                  </Col>
                  <Col span={24}>
                    <Form.Item name="reason" label="Reason">
                      <TextArea rows={3} maxLength={500} placeholder="Why do you prefer this shift?" />
                    </Form.Item>
                  </Col>
                </Row>
              </FormSection>
            </Col>
          </Row>

          <div style={{
            display: 'flex', justifyContent: 'flex-end', gap: 12,
            position: 'sticky', bottom: 0, zIndex: 100,
            background: 'var(--hrms-bg)', padding: '16px 0',
            borderTop: '1px solid var(--hrms-border-light)',
          }}>
            <Button size="large" onClick={() => navigate('/shift-swaps')}>Cancel</Button>
            <Button type="primary" htmlType="submit" icon={<SaveOutlined />} loading={setPreference.isPending} size="large">
              Save Preference
            </Button>
          </div>
        </Form>
      </div>
    </PageContainer>
  );
}

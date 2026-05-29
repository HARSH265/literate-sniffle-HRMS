import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Form, Input, Select, InputNumber, DatePicker, Button, Row, Col, Switch } from 'antd';
import { ArrowLeftOutlined, SaveOutlined, ReadOutlined, CalendarOutlined, EnvironmentOutlined, SafetyCertificateOutlined } from '@ant-design/icons';
import { PageHeader } from '../../../core/components/PageHeader';
import { FormSection } from '../../../core/components/FormSection';
import { useCreateTrainingProgram } from '../hooks/useTraining';
import { FORM_GRID } from '../../../core/constants/layout';

const { rowGutter, inputHeight } = FORM_GRID;

const CATEGORIES = ['Technical', 'Soft Skills', 'Compliance', 'Leadership', 'Onboarding', 'Other'];
const MODES = [
  { label: 'Online', value: 'online' },
  { label: 'Offline', value: 'offline' },
  { label: 'Hybrid', value: 'hybrid' },
];

export function TrainingProgramFormPage() {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const createMutation = useCreateTrainingProgram();

  const handleSubmit = async (values: any) => {
    setIsSubmitting(true);
    createMutation.mutate(
      {
        title: values.title,
        description: values.description,
        category: values.category,
        mode: values.mode,
        duration: { value: values.durationValue, unit: values.durationUnit },
        maxParticipants: values.maxParticipants,
        startDate: values.startDate.toISOString(),
        endDate: values.endDate.toISOString(),
        trainer: values.trainer,
        location: values.location,
        cost: values.cost,
        certificationOffered: values.certificationOffered,
        certificationValidForDays: values.certificationValidForDays,
        prerequisites: values.prerequisites?.split(',').map((s: string) => s.trim()).filter(Boolean),
        tags: values.tags?.split(',').map((s: string) => s.trim()).filter(Boolean),
      },
      {
        onSuccess: () => {
          navigate('/training');
        },
        onError: () => {
          setIsSubmitting(false);
        },
      },
    );
  };

  return (
    <div style={{ padding: '0 4px' }}>
      <PageHeader
        title="New Training Program"
        breadcrumbs={[{ label: 'Training', path: '/training' }, { label: 'New Program' }]}
        actions={
          <Button type="text" icon={<ArrowLeftOutlined />} onClick={() => navigate('/training')}>
            Back to Programs
          </Button>
        }
      />

      <div style={{ maxWidth: 1400, margin: '0 auto' }}>
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{ mode: 'online', certificationOffered: false }}
        >
          <Row gutter={24}>
            <Col xs={24} lg={16}>
              <FormSection title="Basic Information" icon={<ReadOutlined />}>
                <Row gutter={rowGutter}>
                  <Col span={12}>
                    <Form.Item name="title" label="Program Title" rules={[{ required: true, message: 'Required' }]}>
                      <Input placeholder="e.g. Advanced React Workshop" style={{ height: inputHeight }} />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item name="category" label="Category" rules={[{ required: true, message: 'Required' }]}>
                      <Select placeholder="Select category" options={CATEGORIES.map(c => ({ label: c, value: c }))} style={{ height: inputHeight }} />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item name="mode" label="Mode" rules={[{ required: true, message: 'Required' }]}>
                      <Select placeholder="Select mode" options={MODES} style={{ height: inputHeight }} />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item name="description" label="Description">
                      <Input.TextArea rows={3} placeholder="Program description" />
                    </Form.Item>
                  </Col>
                </Row>
              </FormSection>

              <FormSection title="Schedule & Duration" icon={<CalendarOutlined />}>
                <Row gutter={rowGutter}>
                  <Col span={12}>
                    <Form.Item name="startDate" label="Start Date" rules={[{ required: true, message: 'Required' }]}>
                      <DatePicker style={{ width: '100%', height: inputHeight }} />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item name="endDate" label="End Date" rules={[{ required: true, message: 'Required' }]}>
                      <DatePicker style={{ width: '100%', height: inputHeight }} />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item name="durationValue" label="Duration" rules={[{ required: true, message: 'Required' }]}>
                      <InputNumber min={1} placeholder="Value" style={{ width: '100%', height: inputHeight }} />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item name="durationUnit" label="Duration Unit" rules={[{ required: true, message: 'Required' }]}>
                      <Select placeholder="Select unit" options={[{ label: 'Hours', value: 'hours' }, { label: 'Days', value: 'days' }, { label: 'Weeks', value: 'weeks' }]} style={{ height: inputHeight }} />
                    </Form.Item>
                  </Col>
                </Row>
              </FormSection>

              <FormSection title="Logistics" icon={<EnvironmentOutlined />}>
                <Row gutter={rowGutter}>
                  <Col span={8}>
                    <Form.Item name="trainer" label="Trainer">
                      <Input placeholder="Trainer name" style={{ height: inputHeight }} />
                    </Form.Item>
                  </Col>
                  <Col span={8}>
                    <Form.Item name="location" label="Location">
                      <Input placeholder="Room / Link" style={{ height: inputHeight }} />
                    </Form.Item>
                  </Col>
                  <Col span={8}>
                    <Form.Item name="maxParticipants" label="Max Participants">
                      <InputNumber min={1} style={{ width: '100%', height: inputHeight }} placeholder="Unlimited if empty" />
                    </Form.Item>
                  </Col>
                  <Col span={8}>
                    <Form.Item name="cost" label="Cost (₹)">
                      <InputNumber min={0} style={{ width: '100%', height: inputHeight }} placeholder="0" />
                    </Form.Item>
                  </Col>
                </Row>
              </FormSection>
            </Col>

            <Col xs={24} lg={8}>
              <FormSection title="Certification & Requirements" icon={<SafetyCertificateOutlined />}>
                <Row gutter={rowGutter}>
                  <Col span={24}>
                    <Form.Item name="certificationOffered" label="Certification Offered" valuePropName="checked">
                      <Switch />
                    </Form.Item>
                  </Col>
                  <Col span={24}>
                    <Form.Item name="certificationValidForDays" label="Valid For (Days)">
                      <InputNumber min={1} style={{ width: '100%', height: inputHeight }} placeholder="e.g. 365" />
                    </Form.Item>
                  </Col>
                  <Col span={24}>
                    <Form.Item name="prerequisites" label="Prerequisites (comma separated)">
                      <Input placeholder="e.g. Basic JavaScript, HTML" style={{ height: inputHeight }} />
                    </Form.Item>
                  </Col>
                  <Col span={24}>
                    <Form.Item name="tags" label="Tags (comma separated)">
                      <Input placeholder="e.g. frontend, react, beginner" style={{ height: inputHeight }} />
                    </Form.Item>
                  </Col>
                </Row>
              </FormSection>
            </Col>
          </Row>

          <div style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: 12,
            position: 'sticky',
            bottom: 0,
            zIndex: 100,
            background: 'var(--hrms-bg)',
            padding: '16px 0',
            borderTop: '1px solid var(--hrms-border-light)',
          }}>
            <Button size="large" onClick={() => navigate('/training')}>Cancel</Button>
            <Button type="primary" htmlType="submit" icon={<SaveOutlined />} loading={isSubmitting} size="large">
              Create Program
            </Button>
          </div>
        </Form>
      </div>
    </div>
  );
}

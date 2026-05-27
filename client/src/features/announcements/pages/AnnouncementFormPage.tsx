import { useNavigate, useParams } from 'react-router-dom';
import { Card, Form, Input, Select, Button, Space, DatePicker, Switch, Spin } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { PageHeader } from '../../../core/components/PageHeader';
import { useCreateAnnouncement, useUpdateAnnouncement, useAnnouncement } from '../hooks/useAnnouncements';
import dayjs from 'dayjs';

const { TextArea } = Input;

export function AnnouncementFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const createMutation = useCreateAnnouncement();
  const updateMutation = useUpdateAnnouncement();
  const { data, isLoading: loadingAnnouncement } = useAnnouncement(id!);

  const isEdit = !!id;

  if (loadingAnnouncement) {
    return <Spin size="large" style={{ display: 'block', margin: '40px auto' }} />;
  }

  const handleFinish = (values: any) => {
    const payload = {
      title: values.title,
      content: values.content,
      priority: values.priority || 'normal',
      targetAudience: values.targetAudience || 'all',
      targetIds: values.targetIds || [],
      scheduledAt: values.scheduledAt?.toISOString(),
      expiresAt: values.expiresAt?.toISOString(),
    };

    if (isEdit) {
      updateMutation.mutate(
        { id: id!, payload },
        { onSuccess: () => navigate('/announcements') },
      );
    } else {
      createMutation.mutate(payload, { onSuccess: () => navigate('/announcements') });
    }
  };

  return (
    <div>
      <PageHeader
        title={isEdit ? 'Edit Announcement' : 'New Announcement'}
        subtitle={isEdit ? 'Update the announcement details' : 'Create a company-wide announcement'}
        actions={
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/announcements')}>
            Back
          </Button>
        }
      />

      <Card style={{ borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.06)', maxWidth: 800 }}>
        <Form
          form={form}
          layout="vertical"
          onFinish={handleFinish}
          initialValues={data?.data ? {
            title: data.data.title,
            content: data.data.content,
            priority: data.data.priority,
            targetAudience: data.data.targetAudience,
            scheduledAt: data.data.scheduledAt ? dayjs(data.data.scheduledAt) : undefined,
            expiresAt: data.data.expiresAt ? dayjs(data.data.expiresAt) : undefined,
          } : {
            priority: 'normal',
            targetAudience: 'all',
          }}
        >
          <Form.Item name="title" label="Title" rules={[{ required: true, message: 'Title is required' }]}>
            <Input placeholder="Enter announcement title" maxLength={300} />
          </Form.Item>

          <Form.Item name="content" label="Content" rules={[{ required: true, message: 'Content is required' }]}>
            <TextArea rows={8} placeholder="Write your announcement content here..." maxLength={5000} showCount />
          </Form.Item>

          <Space style={{ display: 'flex', gap: 16 }} wrap>
            <Form.Item name="priority" label="Priority">
              <Select style={{ width: 160 }} options={[
                { label: 'Low', value: 'low' },
                { label: 'Normal', value: 'normal' },
                { label: 'High', value: 'high' },
                { label: 'Urgent', value: 'urgent' },
              ]} />
            </Form.Item>

            <Form.Item name="targetAudience" label="Target Audience">
              <Select style={{ width: 200 }} options={[
                { label: 'All Employees', value: 'all' },
                { label: 'Department', value: 'department' },
                { label: 'Designation', value: 'designation' },
                { label: 'Specific Employees', value: 'specificEmployees' },
              ]} />
            </Form.Item>
          </Space>

          <Space style={{ display: 'flex', gap: 16 }} wrap>
            <Form.Item name="scheduledAt" label="Schedule At">
              <DatePicker showTime style={{ width: 200 }} />
            </Form.Item>

            <Form.Item name="expiresAt" label="Expires At">
              <DatePicker showTime style={{ width: 200 }} />
            </Form.Item>
          </Space>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" loading={createMutation.isPending || updateMutation.isPending}>
                {isEdit ? 'Update Announcement' : 'Create Announcement'}
              </Button>
              <Button onClick={() => navigate('/announcements')}>Cancel</Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}

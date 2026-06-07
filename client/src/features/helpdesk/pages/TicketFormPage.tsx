import { useNavigate, useParams } from 'react-router-dom';
import { Card, Form, Input, Select, Button, Typography } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { useCreateTicket, useTicket, useUpdateTicket } from '../hooks/useHelpdesk';

const { TextArea } = Input;
const { Text } = Typography;

export function TicketFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const isEdit = !!id;

  const { data: ticketData } = useTicket(id || '');
  const createMutation = useCreateTicket();
  const updateMutation = useUpdateTicket();

  const handleSubmit = (values: any) => {
    if (isEdit) {
      updateMutation.mutate({ id: id!, payload: values }, {
        onSuccess: () => navigate('/helpdesk'),
      });
    } else {
      createMutation.mutate(values, {
        onSuccess: (res: any) => navigate(`/helpdesk/${res.data._id}`),
      });
    }
  };

  if (isEdit && ticketData?.data) {
    const ticket = ticketData.data;
    if (!form.isFieldsTouched()) {
      form.setFieldsValue({
        subject: ticket.subject,
        description: ticket.description,
        category: ticket.category,
        priority: ticket.priority,
        status: ticket.status,
      });
    }
  }

  return (
    <div style={{ maxWidth: 700, margin: '0 auto', padding: '0 4px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <Button type="text" icon={<ArrowLeftOutlined />} onClick={() => navigate('/helpdesk')} />
        <Text strong style={{ fontSize: 18 }}>{isEdit ? 'Edit Ticket' : 'New Ticket'}</Text>
      </div>

      <Card>
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{ category: 'other', priority: 'medium' }}
        >
          <Form.Item name="subject" label="Subject" rules={[{ required: true, message: 'Subject is required' }]}>
            <Input placeholder="e.g. Keyboard not working" style={{ height: 40 }} />
          </Form.Item>

          <Form.Item name="description" label="Description" rules={[{ required: true, message: 'Description is required' }]}>
            <TextArea rows={5} placeholder="Describe the issue in detail..." />
          </Form.Item>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Form.Item name="category" label="Category">
              <Select
                options={[
                  { value: 'it', label: 'IT' },
                  { value: 'hr', label: 'HR' },
                  { value: 'facilities', label: 'Facilities' },
                  { value: 'payroll', label: 'Payroll' },
                  { value: 'other', label: 'Other' },
                ]}
                style={{ height: 40 }}
              />
            </Form.Item>
            <Form.Item name="priority" label="Priority">
              <Select
                options={[
                  { value: 'low', label: 'Low' },
                  { value: 'medium', label: 'Medium' },
                  { value: 'high', label: 'High' },
                  { value: 'urgent', label: 'Urgent' },
                ]}
                style={{ height: 40 }}
              />
            </Form.Item>
          </div>

          {isEdit && (
            <Form.Item name="status" label="Status">
              <Select
                options={[
                  { value: 'open', label: 'Open' },
                  { value: 'in-progress', label: 'In Progress' },
                  { value: 'resolved', label: 'Resolved' },
                  { value: 'closed', label: 'Closed' },
                ]}
                style={{ height: 40 }}
              />
            </Form.Item>
          )}

          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 8 }}>
            <Button onClick={() => navigate('/helpdesk')} style={{ borderRadius: 8 }}>Cancel</Button>
            <Button type="primary" htmlType="submit" loading={createMutation.isPending || updateMutation.isPending} style={{ borderRadius: 8 }}>
              {isEdit ? 'Update Ticket' : 'Create Ticket'}
            </Button>
          </div>
        </Form>
      </Card>
    </div>
  );
}

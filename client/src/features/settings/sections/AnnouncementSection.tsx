import { Card, Form, Switch, InputNumber } from 'antd';

interface AnnouncementSectionProps {
  form: any;
  onSave: (values: any) => void;
}

export function AnnouncementSection({ form, onSave }: AnnouncementSectionProps) {
  return (
    <Card title="Announcements Configuration" style={{ borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
      <Form
        form={form}
        layout="vertical"
        onValuesChange={() => {
          setTimeout(() => {
            form.validateFields().then(() => {
              const values = form.getFieldsValue();
              onSave({ announcementConfig: values.announcementConfig });
            }).catch(() => {});
          }, 100);
        }}
      >
        <Form.Item
          name={['announcementConfig', 'announcementsEnabled']}
          label="Enable Announcements"
          valuePropName="checked"
        >
          <Switch />
        </Form.Item>

        <Form.Item
          name={['announcementConfig', 'allowAttachments']}
          label="Allow Attachments"
          valuePropName="checked"
        >
          <Switch />
        </Form.Item>

        <Form.Item
          name={['announcementConfig', 'allowScheduling']}
          label="Allow Scheduling"
          valuePropName="checked"
        >
          <Switch />
        </Form.Item>

        <Form.Item
          name={['announcementConfig', 'maxAnnouncementLength']}
          label="Max Announcement Length (characters)"
        >
          <InputNumber min={100} max={50000} style={{ width: 200 }} />
        </Form.Item>

        <Form.Item
          name={['announcementConfig', 'maxAttachmentSizeMb']}
          label="Max Attachment Size (MB)"
        >
          <InputNumber min={1} max={50} style={{ width: 200 }} />
        </Form.Item>

        <Form.Item
          name={['announcementConfig', 'autoExpireDays']}
          label="Auto Expire After (days)"
        >
          <InputNumber min={1} max={365} style={{ width: 200 }} />
        </Form.Item>
      </Form>
    </Card>
  );
}

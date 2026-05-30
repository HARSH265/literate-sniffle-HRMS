import { Form, Switch, InputNumber, Button, Row, Col } from 'antd';
import { SaveOutlined } from '@ant-design/icons';

interface AnnouncementSectionProps {
  form: any;
  onSave: (values: any) => void;
}

export function AnnouncementSection({ form, onSave }: AnnouncementSectionProps) {
  return (
    <Form form={form} layout="vertical" onFinish={onSave}>
      <h3 style={{ marginBottom: 16 }}>Announcements Configuration</h3>
      <p style={{ marginBottom: 24, color: '#666' }}>
        Configure how announcements are published, including attachment limits, scheduling, and expiry rules.
      </p>

      <h4 style={{ margin: '16px 0 8px' }}>General Settings</h4>
      <Row gutter={16}>
        <Col span={8}>
          <Form.Item name={['announcementConfig', 'announcementsEnabled']} label="Enable Announcements" valuePropName="checked">
            <Switch />
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item name={['announcementConfig', 'allowAttachments']} label="Allow Attachments" valuePropName="checked">
            <Switch />
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item name={['announcementConfig', 'allowScheduling']} label="Allow Scheduling" valuePropName="checked">
            <Switch />
          </Form.Item>
        </Col>
      </Row>

      <div style={{ marginTop: 16, padding: 16, background: '#f0f5ff', borderRadius: 8, border: '1px solid #d9e6ff' }}>
        <h4 style={{ marginBottom: 12 }}>Limits & Expiry</h4>
        <p style={{ marginBottom: 16, color: '#666', fontSize: 13 }}>
          Set character limits, attachment size constraints, and auto-expiry duration for announcements.
        </p>
        <Row gutter={16}>
          <Col span={8}>
            <Form.Item name={['announcementConfig', 'maxAnnouncementLength']} label="Max Announcement Length (characters)">
              <InputNumber style={{ width: '100%', height: 40 }} min={100} max={50000} />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item name={['announcementConfig', 'maxAttachmentSizeMb']} label="Max Attachment Size (MB)">
              <InputNumber style={{ width: '100%', height: 40 }} min={1} max={50} />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item name={['announcementConfig', 'autoExpireDays']} label="Auto Expire After (days)">
              <InputNumber style={{ width: '100%', height: 40 }} min={1} max={365} />
            </Form.Item>
          </Col>
        </Row>
      </div>

      <Button type="primary" icon={<SaveOutlined />} htmlType="submit" style={{ marginTop: 16 }}>
        Save Announcement Settings
      </Button>
    </Form>
  );
}

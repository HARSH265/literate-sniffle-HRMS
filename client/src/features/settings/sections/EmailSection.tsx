import { useState } from 'react';
import { Form, Input, InputNumber, Switch, Button, Row, Col, message } from 'antd';
import { SaveOutlined, MailOutlined, BellOutlined } from '@ant-design/icons';

export function EmailSection({ form, onSave, onTestEmail, isTesting }: { form: any; onSave: (values: any) => void; onTestEmail: (email: string) => void; isTesting: boolean }) {
  const [testEmail, setTestEmail] = useState('');

  const handleTest = () => {
    if (testEmail) {
      onTestEmail(testEmail);
    } else {
      message.warning('Please enter an email address to test');
    }
  };

  return (
    <Form form={form} layout="vertical" onFinish={onSave}>
      <h3 style={{ marginBottom: 16 }}>Email Configuration (SMTP)</h3>
      <Row gutter={16}>
        <Col span={12}>
          <Form.Item name={['emailConfig', 'host']} label="SMTP Host">
            <Input style={{ height: 40 }} placeholder="smtp.gmail.com" />
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item name={['emailConfig', 'port']} label="Port">
            <InputNumber style={{ width: '100%', height: 40 }} placeholder="587" />
          </Form.Item>
        </Col>
        <Col span={4}>
          <Form.Item name={['emailConfig', 'secure']} label="SSL" valuePropName="checked">
            <Switch />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item name={['emailConfig', 'user']} label="Username">
            <Input style={{ height: 40 }} placeholder="email@example.com" />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item name={['emailConfig', 'password']} label="Password">
            <Input.Password style={{ height: 40 }} placeholder="App password or password" />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item name={['emailConfig', 'fromEmail']} label="From Email">
            <Input style={{ height: 40 }} placeholder="noreply@company.com" />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item name={['emailConfig', 'fromName']} label="From Name">
            <Input style={{ height: 40 }} placeholder="Orian System" />
          </Form.Item>
        </Col>
      </Row>

      <div style={{ marginTop: 16, padding: 16, background: 'var(--hrms-info-light)', borderRadius: 8, border: '1px solid var(--hrms-info)' }}>
        <h4 style={{ marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
          <BellOutlined /> Notification Preferences
        </h4>
        <Row gutter={16}>
          <Col span={24}>
            <Form.Item name={['notificationConfig', 'emailEnabled']} valuePropName="checked" style={{ marginBottom: 12 }}>
              <Switch /> <span style={{ marginLeft: 8, fontWeight: 500 }}>Enable email notifications</span>
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name={['notificationConfig', 'notifyOnPayrollRun']} valuePropName="checked" style={{ marginBottom: 8 }}>
              <Switch /> <span style={{ marginLeft: 8, fontSize: 13 }}>Notify on payroll run/finalize</span>
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name={['notificationConfig', 'notifyOnEmployeeAdded']} valuePropName="checked" style={{ marginBottom: 8 }}>
              <Switch /> <span style={{ marginLeft: 8, fontSize: 13 }}>Notify on new employee added</span>
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name={['notificationConfig', 'notifyOnUserCreated']} valuePropName="checked" style={{ marginBottom: 8 }}>
              <Switch /> <span style={{ marginLeft: 8, fontSize: 13 }}>Notify on new user created</span>
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name={['notificationConfig', 'notifyOnAttendanceEntry']} valuePropName="checked" style={{ marginBottom: 8 }}>
              <Switch /> <span style={{ marginLeft: 8, fontSize: 13 }}>Notify on attendance entry</span>
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name={['notificationConfig', 'notifyOnLeaveApplied']} valuePropName="checked" style={{ marginBottom: 8 }}>
              <Switch /> <span style={{ marginLeft: 8, fontSize: 13 }}>Notify on leave applied</span>
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name={['notificationConfig', 'notifyOnLeaveApproved']} valuePropName="checked" style={{ marginBottom: 8 }}>
              <Switch /> <span style={{ marginLeft: 8, fontSize: 13 }}>Notify on leave approved</span>
            </Form.Item>
          </Col>
        </Row>
      </div>

      <div style={{ marginTop: 24, padding: 16, background: 'var(--hrms-bg)', borderRadius: 8 }}>
        <h4 style={{ marginBottom: 12 }}>Test Email Configuration</h4>
        <Row gutter={12} align="middle">
          <Col flex="auto">
            <Input
              placeholder="Enter email address to test"
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
              style={{ height: 40 }}
            />
          </Col>
          <Col>
            <Button
              type="primary"
              icon={<MailOutlined />}
              onClick={handleTest}
              loading={isTesting}
            >
              Send Test
            </Button>
          </Col>
        </Row>
      </div>

      <Button type="primary" icon={<SaveOutlined />} htmlType="submit" style={{ marginTop: 16 }}>
        Save Email Settings
      </Button>
    </Form>
  );
}

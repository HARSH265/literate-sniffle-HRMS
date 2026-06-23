import { Form, Switch, InputNumber, Button, Row, Col } from 'antd';
import { SaveOutlined } from '@ant-design/icons';

interface EssSectionProps {
  form: any;
  onSave: (values: any) => void;
}

export function EssSection({ form, onSave }: EssSectionProps) {
  return (
    <Form form={form} layout="vertical" onFinish={onSave}>
      <h3 style={{ marginBottom: 16 }}>Employee Self-Service Configuration</h3>
      <p style={{ marginBottom: 24, color: 'var(--hrms-text-secondary)' }}>
        Configure which profile fields employees can update themselves and set approval rules for those changes.
      </p>

      <h4 style={{ margin: '16px 0 8px' }}>General Settings</h4>
      <Row gutter={16}>
        <Col span={8}>
          <Form.Item name={['employeeSelfService', 'essEnabled']} label="Enable Employee Self-Service" valuePropName="checked">
            <Switch />
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item name={['employeeSelfService', 'changeRequiresApproval']} label="Require Approval for Changes" valuePropName="checked">
            <Switch />
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item name={['employeeSelfService', 'maxChangesPerMonth']} label="Max Changes Per Month">
            <InputNumber style={{ width: '100%', height: 40 }} min={1} max={50} />
          </Form.Item>
        </Col>
      </Row>

      <div style={{ marginTop: 16, padding: 16, background: 'var(--hrms-info-light)', borderRadius: 8, border: '1px solid var(--hrms-info)' }}>
        <h4 style={{ marginBottom: 12 }}>Editable Fields</h4>
        <p style={{ marginBottom: 16, color: 'var(--hrms-text-secondary)', fontSize: 13 }}>
          Select which profile fields employees are allowed to update through the self-service portal.
        </p>
        <Row gutter={16}>
          <Col span={6}>
            <Form.Item name={['employeeSelfService', 'allowPhoneUpdate']} label="Allow Phone Number Update" valuePropName="checked">
              <Switch />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item name={['employeeSelfService', 'allowAddressUpdate']} label="Allow Address Update" valuePropName="checked">
              <Switch />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item name={['employeeSelfService', 'allowBankUpdate']} label="Allow Bank Details Update" valuePropName="checked">
              <Switch />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item name={['employeeSelfService', 'allowEmergencyContactUpdate']} label="Allow Emergency Contact Update" valuePropName="checked">
              <Switch />
            </Form.Item>
          </Col>
        </Row>
      </div>

      <Button type="primary" icon={<SaveOutlined />} htmlType="submit" style={{ marginTop: 16 }}>
        Save ESS Settings
      </Button>
    </Form>
  );
}

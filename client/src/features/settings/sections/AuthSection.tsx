import { Form, Input, InputNumber, Switch, Button, Row, Col } from 'antd';
import { SaveOutlined } from '@ant-design/icons';

export function AuthSection({ form, onSave }: { form: any; onSave: (values: any) => void }) {
  return (
    <Form form={form} layout="vertical" onFinish={onSave}>
      <h3 style={{ marginBottom: 16 }}>Authentication Settings</h3>

      <div style={{ marginBottom: 24, padding: 16, background: '#f8f9fa', borderRadius: 8 }}>
        <h4 style={{ marginBottom: 12 }}>Token Configuration</h4>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name={['authConfig', 'tokenExpiry']} label="Token Expiry">
              <Input style={{ height: 40 }} placeholder="e.g. 24h, 8h, 30m" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name={['authConfig', 'refreshTokenExpiry']} label="Refresh Token Expiry">
              <Input style={{ height: 40 }} placeholder="e.g. 7d, 30d" />
            </Form.Item>
          </Col>
        </Row>
      </div>

      <div style={{ marginBottom: 24, padding: 16, background: '#f8f9fa', borderRadius: 8 }}>
        <h4 style={{ marginBottom: 12 }}>Password Requirements</h4>
        <Row gutter={16}>
          <Col span={8}>
            <Form.Item name={['authConfig', 'passwordMinLength']} label="Minimum Length">
              <InputNumber style={{ width: '100%', height: 40 }} min={6} max={32} />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item name={['authConfig', 'passwordHistoryCount']} label="Password History (count)">
              <InputNumber style={{ width: '100%', height: 40 }} min={0} max={10} />
            </Form.Item>
          </Col>
        </Row>
        <Row gutter={16}>
          <Col span={6}>
            <Form.Item name={['authConfig', 'requireUppercase']} label="Require Uppercase" valuePropName="checked">
              <Switch />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item name={['authConfig', 'requireLowercase']} label="Require Lowercase" valuePropName="checked">
              <Switch />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item name={['authConfig', 'requireNumber']} label="Require Number" valuePropName="checked">
              <Switch />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item name={['authConfig', 'requireSpecialChar']} label="Require Special Char" valuePropName="checked">
              <Switch />
            </Form.Item>
          </Col>
        </Row>
      </div>

      <Button type="primary" icon={<SaveOutlined />} htmlType="submit">
        Save Auth Settings
      </Button>
    </Form>
  );
}

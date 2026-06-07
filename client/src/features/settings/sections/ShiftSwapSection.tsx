import { Form, InputNumber, Switch, Button, Row, Col } from 'antd';
import { SaveOutlined } from '@ant-design/icons';

export function ShiftSwapSection({ form, onSave }: { form: any; onSave: (values: any) => void }) {
  return (
    <Form form={form} layout="vertical" onFinish={onSave}>
      <h3 style={{ marginBottom: 16 }}>Shift Swap Configuration</h3>
      <p style={{ marginBottom: 24, color: '#666' }}>
        Configure shift swap rules including approval workflows, matching, and deadlines.
      </p>

      <h4 style={{ margin: '16px 0 8px' }}>General Rules</h4>
      <Row gutter={16}>
        <Col span={8}>
          <Form.Item name={['shiftSwapConfig', 'shiftSwapEnabled']} label="Enable Shift Swaps" valuePropName="checked">
            <Switch />
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item name={['shiftSwapConfig', 'requireManagerApproval']} label="Require Manager Approval" valuePropName="checked">
            <Switch />
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item name={['shiftSwapConfig', 'maxSwapsPerMonth']} label="Max Swaps Per Month">
            <InputNumber min={1} max={30} style={{ width: '100%', height: 40 }} />
          </Form.Item>
        </Col>
      </Row>

      <div style={{ marginTop: 16, padding: 16, background: '#f0f5ff', borderRadius: 8, border: '1px solid #d9e6ff' }}>
        <h4 style={{ marginBottom: 12 }}>Matching & Preferences</h4>
        <p style={{ marginBottom: 16, color: '#666', fontSize: 13 }}>
          Control how shift swaps are matched and whether employees can set recurring preferences.
        </p>
        <Row gutter={16}>
          <Col span={8}>
            <Form.Item name={['shiftSwapConfig', 'allowRecurringSwaps']} label="Allow Recurring Swaps" valuePropName="checked">
              <Switch />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item name={['shiftSwapConfig', 'notifyOnMatch']} label="Notify on Match" valuePropName="checked">
              <Switch />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item name={['shiftSwapConfig', 'shiftPreferenceEnabled']} label="Enable Shift Preferences" valuePropName="checked">
              <Switch />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item name={['shiftSwapConfig', 'swapDeadlineHours']} label="Swap Deadline (hours before shift)">
              <InputNumber min={1} max={168} style={{ width: '100%', height: 40 }} />
            </Form.Item>
          </Col>
        </Row>
      </div>

      <Button type="primary" icon={<SaveOutlined />} htmlType="submit" style={{ marginTop: 16 }}>
        Save Shift Swap Settings
      </Button>
    </Form>
  );
}

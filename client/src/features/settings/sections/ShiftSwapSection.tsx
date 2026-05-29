import { Form, InputNumber, Switch, Button, Row, Col } from 'antd';
import { SaveOutlined } from '@ant-design/icons';

export function ShiftSwapSection({ form, onSave }: { form: any; onSave: (values: any) => void }) {
  return (
    <Form form={form} layout="vertical" onFinish={onSave}>
      <h3 style={{ marginBottom: 16 }}>Shift Swap Configuration</h3>
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
          <Form.Item name={['shiftSwapConfig', 'maxSwapsPerMonth']} label="Max Swaps Per Month">
            <InputNumber min={1} max={30} style={{ width: '100%', height: 40 }} />
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item name={['shiftSwapConfig', 'swapDeadlineHours']} label="Swap Deadline (hours before shift)">
            <InputNumber min={1} max={168} style={{ width: '100%', height: 40 }} />
          </Form.Item>
        </Col>
      </Row>
      <Button type="primary" icon={<SaveOutlined />} htmlType="submit" style={{ marginTop: 16 }}>
        Save Shift Swap Settings
      </Button>
    </Form>
  );
}

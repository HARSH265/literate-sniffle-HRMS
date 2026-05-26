import { Form, Input, InputNumber, Select, Switch, Button, Row, Col } from 'antd';
import { SaveOutlined } from '@ant-design/icons';

export function ReportsSection({ form, onSave }: { form: any; onSave: (values: any) => void }) {
  return (
    <Form form={form} layout="vertical" onFinish={onSave}>
      <h3 style={{ marginBottom: 16 }}>Scheduled Report Export Configuration</h3>
      <p style={{ marginBottom: 20, color: '#666', fontSize: 13 }}>
        Configure automated report exports to be sent via email on a schedule.
      </p>
      <Row gutter={16}>
        <Col span={8}>
          <Form.Item name={['reportsConfig', 'scheduledExportEnabled']} label="Enable Scheduled Exports" valuePropName="checked">
            <Switch />
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item name={['reportsConfig', 'scheduledExportFrequency']} label="Export Frequency">
            <Select options={[
              { label: 'Daily', value: 'daily' },
              { label: 'Weekly', value: 'weekly' },
              { label: 'Monthly', value: 'monthly' },
            ]} />
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item name={['reportsConfig', 'scheduledExportDay']} label="Day (1-31 / 0=Sun 1=Mon)">
            <InputNumber style={{ width: '100%', height: 40 }} min={0} max={31} />
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item name={['reportsConfig', 'scheduledExportFormat']} label="Export Format">
            <Select options={[
              { label: 'Excel (xlsx)', value: 'xlsx' },
              { label: 'CSV', value: 'csv' },
            ]} />
          </Form.Item>
        </Col>
        <Col span={16}>
          <Form.Item name={['reportsConfig', 'scheduledExportRecipients']} label="Recipient Emails (comma separated)">
            <Input placeholder="admin@company.com, hr@company.com" />
          </Form.Item>
        </Col>
        <Col span={24}>
          <Form.Item name={['reportsConfig', 'scheduledExportReports']} label="Reports to Export (comma separated)">
            <Input placeholder="attendance, payroll, overtime, employees" />
          </Form.Item>
        </Col>
      </Row>
      <Button type="primary" icon={<SaveOutlined />} htmlType="submit" style={{ marginTop: 16 }}>
        Save Reports Settings
      </Button>
    </Form>
  );
}

import { Form, Input, InputNumber, Button, Row, Col } from 'antd';
import { SaveOutlined } from '@ant-design/icons';

export function CompanySection({ form, onSave }: { form: any; onSave: (values: any) => void }) {
  return (
    <Form form={form} layout="vertical" onFinish={onSave}>
      <h3 style={{ marginBottom: 16 }}>Company Information</h3>
      <Row gutter={16}>
        <Col span={12}>
          <Form.Item name={['companyInfo', 'name']} label="Company Name">
            <Input style={{ height: 40 }} />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item name={['companyInfo', 'financialYearStart']} label="Financial Year Start (Month)">
            <InputNumber style={{ width: '100%', height: 40 }} min={1} max={12} />
          </Form.Item>
        </Col>
        <Col span={24}>
          <Form.Item name={['companyInfo', 'address']} label="Address">
            <Input.TextArea rows={2} />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item name={['companyInfo', 'phone']} label="Phone">
            <Input style={{ height: 40 }} />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item name={['companyInfo', 'email']} label="Email">
            <Input style={{ height: 40 }} />
          </Form.Item>
        </Col>
      </Row>
      <Button type="primary" icon={<SaveOutlined />} htmlType="submit">
        Save Company Info
      </Button>
    </Form>
  );
}

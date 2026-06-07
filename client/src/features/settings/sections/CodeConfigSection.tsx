import { useState } from 'react';
import { Form, Input, InputNumber, Switch, Button, Row, Col, Tag } from 'antd';
import { SaveOutlined, IdcardOutlined, BankOutlined } from '@ant-design/icons';

export function CodeConfigSection({ form, onSave }: { form: any; onSave: (values: any) => void }) {
  const [activeTab, setActiveTab] = useState<'employee' | 'department'>('employee');

  return (
    <Form form={form} layout="vertical" onFinish={onSave}>
      <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
        <Button
          type={activeTab === 'employee' ? 'primary' : 'default'}
          onClick={() => setActiveTab('employee')}
          icon={<IdcardOutlined />}
        >
          Employee Code
        </Button>
        <Button
          type={activeTab === 'department' ? 'primary' : 'default'}
          onClick={() => setActiveTab('department')}
          icon={<BankOutlined />}
        >
          Department Code
        </Button>
      </div>

      {activeTab === 'employee' && (
        <>
          <h3 style={{ marginBottom: 16 }}>Employee Code Configuration</h3>
          <p style={{ marginBottom: 20, color: '#666', fontSize: 13 }}>
            Configure how employee codes are auto-generated when adding new employees.
          </p>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name={['employeeCodeConfig', 'prefix']} label="Code Prefix">
                <Input style={{ height: 40 }} placeholder="e.g. EMP" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name={['employeeCodeConfig', 'startNumber']} label="Starting Number">
                <InputNumber style={{ width: '100%', height: 40 }} min={1} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name={['employeeCodeConfig', 'padding']} label="Zero Padding">
                <InputNumber style={{ width: '100%', height: 40 }} min={0} max={10} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name={['employeeCodeConfig', 'isAutoGenerate']} label="Auto Generate" valuePropName="checked">
                <Switch />
              </Form.Item>
            </Col>
          </Row>
          <div style={{ marginTop: 12, padding: 12, background: '#f6f8fa', borderRadius: 8, fontSize: 13, color: '#555' }}>
            Preview: <Tag color="blue">{form.getFieldValue(['employeeCodeConfig', 'prefix']) || 'EMP'}{String(form.getFieldValue(['employeeCodeConfig', 'startNumber']) || 1).padStart(form.getFieldValue(['employeeCodeConfig', 'padding']) || 3, '0')}</Tag>
          </div>
        </>
      )}

      {activeTab === 'department' && (
        <>
          <h3 style={{ marginBottom: 16 }}>Department Code Configuration</h3>
          <p style={{ marginBottom: 20, color: '#666', fontSize: 13 }}>
            Configure how department codes are auto-generated when creating new departments.
          </p>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name={['departmentCodeConfig', 'prefix']} label="Code Prefix">
                <Input style={{ height: 40 }} placeholder="e.g. DEPT" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name={['departmentCodeConfig', 'startNumber']} label="Starting Number">
                <InputNumber style={{ width: '100%', height: 40 }} min={1} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name={['departmentCodeConfig', 'padding']} label="Zero Padding">
                <InputNumber style={{ width: '100%', height: 40 }} min={0} max={10} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name={['departmentCodeConfig', 'isAutoGenerate']} label="Auto Generate" valuePropName="checked">
                <Switch />
              </Form.Item>
            </Col>
          </Row>
          <div style={{ marginTop: 12, padding: 12, background: '#f6f8fa', borderRadius: 8, fontSize: 13, color: '#555' }}>
            Preview: <Tag color="blue">{form.getFieldValue(['departmentCodeConfig', 'prefix']) || 'DEPT'}{String(form.getFieldValue(['departmentCodeConfig', 'startNumber']) || 1).padStart(form.getFieldValue(['departmentCodeConfig', 'padding']) || 3, '0')}</Tag>
          </div>
        </>
      )}

      <Button type="primary" icon={<SaveOutlined />} htmlType="submit" style={{ marginTop: 16 }}>
        Save Code Settings
      </Button>
    </Form>
  );
}

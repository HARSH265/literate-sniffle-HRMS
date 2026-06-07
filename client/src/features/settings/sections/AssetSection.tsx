import { useState } from 'react';
import { Form, Switch, InputNumber, Input, Button, Tag, Space, Row, Col } from 'antd';
import { SaveOutlined, PlusOutlined } from '@ant-design/icons';

interface AssetSectionProps {
  form: any;
  onSave: (values: any) => void;
}

function TagManager({ form, fieldPath, placeholder }: { form: any; fieldPath: string[]; placeholder: string }) {
  const [value, setValue] = useState('');

  const add = () => {
    const v = value.trim();
    if (!v) return;
    const current: string[] = form.getFieldValue(fieldPath) || [];
    if (current.includes(v)) return;
    form.setFieldValue(fieldPath, [...current, v]);
    setValue('');
  };

  const remove = (item: string) => {
    const current: string[] = form.getFieldValue(fieldPath) || [];
    form.setFieldValue(fieldPath, current.filter((t) => t !== item));
  };

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        <Input
          placeholder={placeholder}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onPressEnter={add}
          style={{ width: 240, height: 40 }}
        />
        <Button type="primary" icon={<PlusOutlined />} onClick={add} disabled={!value.trim()} style={{ height: 40 }}>
          Add
        </Button>
      </div>
      <Form.Item name={fieldPath} noStyle>
        <div style={{ minHeight: 32 }}>
          {(form.getFieldValue(fieldPath) || []).length > 0 ? (
            <Space wrap>
              {(form.getFieldValue(fieldPath) || []).map((item: string) => (
                <Tag key={item} closable onClose={() => remove(item)} style={{ fontSize: 13, padding: '4px 10px', borderRadius: 4, marginBottom: 4 }}>
                  {item}
                </Tag>
              ))}
            </Space>
          ) : (
            <span style={{ color: '#999', fontSize: 13 }}>None configured</span>
          )}
        </div>
      </Form.Item>
    </div>
  );
}

export function AssetSection({ form, onSave }: AssetSectionProps) {
  return (
    <Form form={form} layout="vertical" onFinish={onSave}>
      <h3 style={{ marginBottom: 16 }}>Asset Management Configuration</h3>
      <p style={{ marginBottom: 24, color: '#666' }}>
        Configure asset tracking, code generation, allocation rules, and maintenance reminders.
      </p>

      <h4 style={{ margin: '16px 0 8px' }}>General Settings</h4>
      <Row gutter={16}>
        <Col span={8}>
          <Form.Item name={['assetConfig', 'assetManagementEnabled']} label="Enable Asset Management" valuePropName="checked">
            <Switch />
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item name={['assetConfig', 'autoGenerateAssetCode']} label="Auto-Generate Asset Code" valuePropName="checked">
            <Switch />
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item name={['assetConfig', 'allowMultipleAllocation']} label="Allow Multiple Allocation" valuePropName="checked">
            <Switch />
          </Form.Item>
        </Col>
      </Row>

      <div style={{ marginTop: 16, padding: 16, background: '#f0f5ff', borderRadius: 8, border: '1px solid #d9e6ff' }}>
        <h4 style={{ marginBottom: 12 }}>Asset Code & Maintenance</h4>
        <p style={{ marginBottom: 16, color: '#666', fontSize: 13 }}>
          Define the asset code format and set maintenance reminder intervals.
        </p>
        <Row gutter={16}>
          <Col span={8}>
            <Form.Item name={['assetConfig', 'assetCodePrefix']} label="Asset Code Prefix">
              <Input placeholder="AST" style={{ width: '100%', height: 40 }} />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item name={['assetConfig', 'assetCodePadding']} label="Asset Code Padding">
              <InputNumber min={1} max={10} style={{ width: '100%', height: 40 }} />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item name={['assetConfig', 'maintenanceReminderDays']} label="Maintenance Reminder (days)">
              <InputNumber min={1} max={365} style={{ width: '100%', height: 40 }} />
            </Form.Item>
          </Col>
        </Row>
      </div>

      <div style={{ marginTop: 16, padding: 16, background: '#fff7e6', borderRadius: 8, border: '1px solid #ffe7ba' }}>
        <h4 style={{ marginBottom: 12 }}>Categories & Conditions</h4>
        <p style={{ marginBottom: 16, color: '#666', fontSize: 13 }}>
          Define asset categories and condition labels used for tracking.
        </p>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item label="Asset Categories">
              <TagManager form={form} fieldPath={['assetConfig', 'categories']} placeholder="Enter category name" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="Asset Conditions">
              <TagManager form={form} fieldPath={['assetConfig', 'conditions']} placeholder="Enter condition name" />
            </Form.Item>
          </Col>
        </Row>
      </div>

      <Button type="primary" htmlType="submit" icon={<SaveOutlined />} style={{ marginTop: 16 }}>
        Save Asset Settings
      </Button>
    </Form>
  );
}

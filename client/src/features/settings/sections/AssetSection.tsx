import { useState } from 'react';
import { Card, Form, Switch, InputNumber, Input, Button, Tag, Space } from 'antd';
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
    <Card title="Asset Management Configuration" style={{ borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
      <Form form={form} layout="vertical" onFinish={onSave}>
        <Form.Item
          name={['assetConfig', 'assetManagementEnabled']}
          label="Enable Asset Management"
          valuePropName="checked"
        >
          <Switch />
        </Form.Item>

        <Form.Item
          name={['assetConfig', 'autoGenerateAssetCode']}
          label="Auto-Generate Asset Code"
          valuePropName="checked"
        >
          <Switch />
        </Form.Item>

        <Form.Item
          name={['assetConfig', 'assetCodePrefix']}
          label="Asset Code Prefix"
        >
          <Input placeholder="AST" style={{ width: 200 }} />
        </Form.Item>

        <Form.Item
          name={['assetConfig', 'assetCodePadding']}
          label="Asset Code Padding"
        >
          <InputNumber min={1} max={10} style={{ width: 200 }} />
        </Form.Item>

        <Form.Item
          name={['assetConfig', 'allowMultipleAllocation']}
          label="Allow Multiple Allocation"
          valuePropName="checked"
        >
          <Switch />
        </Form.Item>

        <Form.Item
          name={['assetConfig', 'maintenanceReminderDays']}
          label="Maintenance Reminder (days)"
        >
          <InputNumber min={1} max={365} style={{ width: 200 }} />
        </Form.Item>

        <Form.Item label="Asset Categories">
          <TagManager form={form} fieldPath={['assetConfig', 'categories']} placeholder="Enter category name" />
        </Form.Item>

        <Form.Item label="Asset Conditions">
          <TagManager form={form} fieldPath={['assetConfig', 'conditions']} placeholder="Enter condition name" />
        </Form.Item>

        <Button type="primary" htmlType="submit" icon={<SaveOutlined />} style={{ marginTop: 8 }}>
          Save Asset Settings
        </Button>
      </Form>
    </Card>
  );
}

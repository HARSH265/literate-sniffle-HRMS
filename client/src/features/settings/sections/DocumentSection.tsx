import { useState } from 'react';
import { Card, Form, Switch, InputNumber, Input, Button, Tag, Space } from 'antd';
import { PlusOutlined, SaveOutlined } from '@ant-design/icons';

interface DocumentSectionProps {
  form: any;
  onSave: (values: any) => void;
}

export function DocumentSection({ form, onSave }: DocumentSectionProps) {
  const [newTag, setNewTag] = useState('');

  const addTag = () => {
    const tag = newTag.trim();
    if (!tag) return;
    const currentTags: string[] = form.getFieldValue(['documentConfig', 'tags']) || [];
    if (currentTags.includes(tag)) return;
    form.setFieldValue(['documentConfig', 'tags'], [...currentTags, tag]);
    setNewTag('');
  };

  const removeTag = (tag: string) => {
    const currentTags: string[] = form.getFieldValue(['documentConfig', 'tags']) || [];
    form.setFieldValue(['documentConfig', 'tags'], currentTags.filter((t) => t !== tag));
  };

  const inputHeight = 40;

  return (
    <Card title="Document Repository Configuration" style={{ borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
      <Form form={form} layout="vertical" onFinish={onSave}>
        <Form.Item
          name={['documentConfig', 'documentRepoEnabled']}
          label="Enable Document Repository"
          valuePropName="checked"
        >
          <Switch />
        </Form.Item>

        <Form.Item
          name={['documentConfig', 'enableVersioning']}
          label="Enable Versioning"
          valuePropName="checked"
        >
          <Switch />
        </Form.Item>

        <Form.Item
          name={['documentConfig', 'maxFileSizeMb']}
          label="Max File Size (MB)"
        >
          <InputNumber min={1} max={100} style={{ width: 200 }} />
        </Form.Item>

        <Form.Item
          name={['documentConfig', 'maxVersions']}
          label="Max Versions"
        >
          <InputNumber min={1} max={50} style={{ width: 200 }} />
        </Form.Item>

        <Form.Item
          name={['documentConfig', 'autoExpireReminderDays']}
          label="Expiry Reminder (days before)"
        >
          <InputNumber min={1} max={365} style={{ width: 200 }} />
        </Form.Item>

        <Form.Item label="Document Tags">
          <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
            <Input
              placeholder="Enter tag name"
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              onPressEnter={addTag}
              style={{ width: 240, height: inputHeight }}
            />
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={addTag}
              disabled={!newTag.trim()}
              style={{ height: inputHeight }}
            >
              Add Tag
            </Button>
          </div>
          <Form.Item name={['documentConfig', 'tags']} noStyle>
            <div style={{ minHeight: 32 }}>
              {(form.getFieldValue(['documentConfig', 'tags']) || []).length > 0 ? (
                <Space wrap>
                  {(form.getFieldValue(['documentConfig', 'tags']) || []).map((tag: string) => (
                    <Tag
                      key={tag}
                      closable
                      onClose={() => removeTag(tag)}
                      style={{ fontSize: 13, padding: '4px 10px', borderRadius: 4, marginBottom: 4 }}
                    >
                      {tag}
                    </Tag>
                  ))}
                </Space>
              ) : (
                <span style={{ color: '#999', fontSize: 13 }}>No tags configured. Add one above.</span>
              )}
            </div>
          </Form.Item>
        </Form.Item>

        <Button type="primary" htmlType="submit" icon={<SaveOutlined />} style={{ marginTop: 8 }}>
          Save Document Settings
        </Button>
      </Form>
    </Card>
  );
}

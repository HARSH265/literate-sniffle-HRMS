import { useState } from 'react';
import { Form, Switch, InputNumber, Input, Button, Tag, Space, Row, Col } from 'antd';
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

  return (
    <Form form={form} layout="vertical" onFinish={onSave}>
      <h3 style={{ marginBottom: 16 }}>Document Repository Configuration</h3>
      <p style={{ marginBottom: 24, color: '#666' }}>
        Configure document storage, versioning, file size limits, and expiry reminders.
      </p>

      <h4 style={{ margin: '16px 0 8px' }}>General Settings</h4>
      <Row gutter={16}>
        <Col span={8}>
          <Form.Item name={['documentConfig', 'documentRepoEnabled']} label="Enable Document Repository" valuePropName="checked">
            <Switch />
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item name={['documentConfig', 'enableVersioning']} label="Enable Versioning" valuePropName="checked">
            <Switch />
          </Form.Item>
        </Col>
      </Row>

      <div style={{ marginTop: 16, padding: 16, background: '#f0f5ff', borderRadius: 8, border: '1px solid #d9e6ff' }}>
        <h4 style={{ marginBottom: 12 }}>File Limits & Versioning</h4>
        <p style={{ marginBottom: 16, color: '#666', fontSize: 13 }}>
          Set maximum file size, version retention, and expiry reminder thresholds.
        </p>
        <Row gutter={16}>
          <Col span={8}>
            <Form.Item name={['documentConfig', 'maxFileSizeMb']} label="Max File Size (MB)">
              <InputNumber min={1} max={100} style={{ width: '100%', height: 40 }} />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item name={['documentConfig', 'maxVersions']} label="Max Versions">
              <InputNumber min={1} max={50} style={{ width: '100%', height: 40 }} />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item name={['documentConfig', 'autoExpireReminderDays']} label="Expiry Reminder (days before)">
              <InputNumber min={1} max={365} style={{ width: '100%', height: 40 }} />
            </Form.Item>
          </Col>
        </Row>
      </div>

      <div style={{ marginTop: 16, padding: 16, background: '#fff7e6', borderRadius: 8, border: '1px solid #ffe7ba' }}>
        <h4 style={{ marginBottom: 12 }}>Document Tags</h4>
        <p style={{ marginBottom: 16, color: '#666', fontSize: 13 }}>
          Create tags to categorize and organize documents in the repository.
        </p>
        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          <Input
            placeholder="Enter tag name"
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
            onPressEnter={addTag}
            style={{ width: 240, height: 40 }}
          />
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={addTag}
            disabled={!newTag.trim()}
            style={{ height: 40 }}
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
      </div>

      <Button type="primary" htmlType="submit" icon={<SaveOutlined />} style={{ marginTop: 16 }}>
        Save Document Settings
      </Button>
    </Form>
  );
}

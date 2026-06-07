import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Form, Input, Select, Button, DatePicker, Row, Col, Upload, message, Tag, Space,
} from 'antd';
import { InboxOutlined, ArrowLeftOutlined, SaveOutlined, FileTextOutlined, SettingOutlined, UploadOutlined, PlusOutlined } from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import { PageHeader } from '../../../core/components/PageHeader';
import { FormSection } from '../../../core/components/FormSection';
import { FORM_LAYOUT } from '../../../core/constants/employee';
import { settingsService } from '../../settings/services/settingsService';
import { employeeService } from '../../employees/services/employeeService';
import { useUploadDocument } from '../hooks/useDocuments';

const { rowGutter, inputHeight } = FORM_LAYOUT;
const { Dragger } = Upload;
const { TextArea } = Input;

const CATEGORIES = ['Policy', 'Contract', 'Certificate', 'ID Proof', 'Payslip', 'Other'];

export function DocumentUploadPage() {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [file, setFile] = useState<File | null>(null);
  const uploadMutation = useUploadDocument();

  const { data: settings } = useQuery({
    queryKey: ['settings'],
    queryFn: () => settingsService.get(),
  });
  const tagSuggestions = (settings?.data?.documentConfig?.tags || []).map((t: string) => ({ label: t, value: t }));

  const [newTag, setNewTag] = useState('');
  const [empSearch, setEmpSearch] = useState('');
  const isCompanyDoc = Form.useWatch('isCompanyDocument', form);

  const { data: employeesData } = useQuery({
    queryKey: ['employees-select', empSearch],
    queryFn: () => employeeService.list({ limit: 50, search: empSearch, status: 'active' }),
    enabled: isCompanyDoc === false,
  });
  const employeeOptions = (employeesData?.data || []).map((e: any) => ({
    label: `${e.fullName} (${e.employeeCode})`,
    value: e._id || e.id,
  }));

  const addTag = () => {
    const tag = newTag.trim();
    if (!tag) return;
    const currentTags: string[] = form.getFieldValue('tags') || [];
    if (currentTags.includes(tag)) return;
    form.setFieldValue('tags', [...currentTags, tag]);
    setNewTag('');
  };

  const removeTag = (tag: string) => {
    const currentTags: string[] = form.getFieldValue('tags') || [];
    form.setFieldValue('tags', currentTags.filter((t) => t !== tag));
  };

  const handleFinish = (values: any) => {
    if (!file) {
      message.warning('Please select a file to upload');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('title', values.title);
    formData.append('category', values.category);
    if (values.description) formData.append('description', values.description);
    if (values.tags) formData.append('tags', JSON.stringify(values.tags));
    if (values.isCompanyDocument) formData.append('isCompanyDocument', 'true');
    if (values.employee) formData.append('employee', values.employee);
    if (values.expiryDate) formData.append('expiryDate', values.expiryDate.toISOString());
    if (values.accessRoles) formData.append('accessRoles', JSON.stringify(values.accessRoles));

    uploadMutation.mutate(formData, {
      onSuccess: (res) => navigate(`/documents/${res.data._id}`),
    });
  };

  const uploadProps = {
    onRemove: () => setFile(null),
    beforeUpload: (f: File) => {
      setFile(f);
      return false;
    },
    fileList: file ? [{ uid: '-1', name: file.name, status: 'done' as const }] : [],
    maxCount: 1,
  };

  return (
    <div style={{ padding: '0 4px' }}>
      <PageHeader
        title="Upload Document"
        breadcrumbs={[{ label: 'Documents', path: '/documents' }, { label: 'Upload' }]}
        actions={
          <Button type="text" icon={<ArrowLeftOutlined />} onClick={() => navigate('/documents')}>
            Back to List
          </Button>
        }
      />

      <div style={{ maxWidth: 1400, margin: '0 auto' }}>
        <Form form={form} layout="vertical" onFinish={handleFinish}>
          <Row gutter={24}>
            <Col xs={24} lg={16}>
              <FormSection title="Document Information" icon={<FileTextOutlined />}>
                <Row gutter={rowGutter}>
                  <Col span={12}>
                    <Form.Item name="title" label="Document Title" rules={[{ required: true, message: 'Required' }]}>
                      <Input placeholder="e.g. Employee Handbook 2026" style={{ height: inputHeight }} />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item name="category" label="Category" rules={[{ required: true, message: 'Required' }]}>
                      <Select placeholder="Select category" style={{ height: inputHeight }} options={CATEGORIES.map((c) => ({ label: c, value: c }))} />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item name="isCompanyDocument" label="Document Type" initialValue={true}>
                      <Select style={{ height: inputHeight }} options={[
                        { label: 'Company Document', value: true },
                        { label: 'Employee Document', value: false },
                      ]} />
                    </Form.Item>
                  </Col>
                  {isCompanyDoc === false && (
                    <Col span={12}>
                      <Form.Item name="employee" label="Employee" rules={[{ required: true, message: 'Select an employee' }]}>
                        <Select
                          showSearch
                          placeholder="Search employee..."
                          style={{ height: inputHeight }}
                          options={employeeOptions}
                          onSearch={setEmpSearch}
                          filterOption={false}
                          notFoundContent={null}
                        />
                      </Form.Item>
                    </Col>
                  )}
                  </Row>
                </FormSection>

              <FormSection title="File Upload" icon={<UploadOutlined />}>
                <Row gutter={rowGutter}>
                  <Col span={24}>
                    <Form.Item label="Select File" required>
                      <Dragger {...uploadProps}>
                        <p className="ant-upload-drag-icon"><InboxOutlined /></p>
                        <p className="ant-upload-text">Click or drag file to upload</p>
                        <p className="ant-upload-hint">PDF, DOC, DOCX, XLSX, JPG, PNG — max 20MB</p>
                      </Dragger>
                    </Form.Item>
                  </Col>
                </Row>
              </FormSection>
            </Col>

            <Col xs={24} lg={8}>
              <FormSection title="Additional Details" icon={<SettingOutlined />}>
                <Row gutter={rowGutter}>
                  <Col span={24}>
                    <Form.Item name="description" label="Description">
                      <TextArea rows={3} placeholder="Optional description" />
                    </Form.Item>
                  </Col>
                  <Col span={24}>
                    <Form.Item label="Tags">
                      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                        <Input
                          placeholder="Type or select a tag"
                          value={newTag}
                          onChange={(e) => setNewTag(e.target.value)}
                          onPressEnter={addTag}
                          style={{ width: '100%', height: inputHeight }}
                          list="tag-suggestions"
                        />
                        <datalist id="tag-suggestions">
                          {tagSuggestions.map((opt: any) => (
                            <option key={opt.value} value={opt.value} />
                          ))}
                        </datalist>
                        <Button type="primary" icon={<PlusOutlined />} onClick={addTag} disabled={!newTag.trim()} style={{ height: inputHeight }}>
                          Add
                        </Button>
                      </div>
                      <Form.Item name="tags" noStyle>
                        <div style={{ minHeight: 32 }}>
                          {(form.getFieldValue('tags') || []).length > 0 ? (
                            <Space wrap>
                              {(form.getFieldValue('tags') || []).map((tag: string) => (
                                <Tag key={tag} closable onClose={() => removeTag(tag)} style={{ fontSize: 13, padding: '4px 10px', borderRadius: 4, marginBottom: 4 }}>
                                  {tag}
                                </Tag>
                              ))}
                            </Space>
                          ) : (
                            <span style={{ color: '#999', fontSize: 13 }}>No tags added</span>
                          )}
                        </div>
                      </Form.Item>
                    </Form.Item>
                  </Col>
                  <Col span={24}>
                    <Form.Item name="expiryDate" label="Expiry Date">
                      <DatePicker style={{ width: '100%', height: inputHeight }} />
                    </Form.Item>
                  </Col>
                </Row>
              </FormSection>
            </Col>
          </Row>

          <div style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: 12,
            position: 'sticky',
            bottom: 0,
            zIndex: 100,
            background: 'var(--hrms-bg)',
            padding: '16px 0',
            borderTop: '1px solid var(--hrms-border-light)',
          }}>
            <Button size="large" onClick={() => navigate('/documents')}>Cancel</Button>
            <Button type="primary" htmlType="submit" icon={<SaveOutlined />} loading={uploadMutation.isPending} size="large">
              Upload Document
            </Button>
          </div>
        </Form>
      </div>
    </div>
  );
}

import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Form, Input, InputNumber, Select, Button, DatePicker, Spin, Row, Col } from 'antd';
import { ArrowLeftOutlined, SaveOutlined, ToolOutlined, InfoCircleOutlined, FileTextOutlined, BarcodeOutlined } from '@ant-design/icons';
import { PageContainer } from '../../../core/components/PageContainer';
import { PageHeader } from '../../../core/components/PageHeader';
import { FormSection } from '../../../core/components/FormSection';
import { FORM_LAYOUT } from '../../../core/constants/employee';
import { useAsset, useCreateAsset, useUpdateAsset } from '../hooks/useAssets';

const { rowGutter, colSpan, inputHeight } = FORM_LAYOUT;

const CATEGORIES = ['Laptop', 'Monitor', 'Keyboard', 'Mobile', 'Tool', 'Uniform', 'Vehicle', 'Other'];
const CONDITIONS = ['New', 'Good', 'Fair', 'Damaged'];

export function AssetFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const isEdit = !!id;

  const { data, isLoading: loadingAsset } = useAsset(id || '');
  const createMutation = useCreateAsset();
  const updateMutation = useUpdateAsset();

  useEffect(() => {
    if (data?.data) {
      const asset = data.data;
      form.setFieldsValue({
        ...asset,
        purchaseDate: asset.purchaseDate ? undefined : undefined,
      });
    }
  }, [data, form]);

  const handleFinish = (values: any) => {
    const payload = {
      ...values,
      purchaseDate: values.purchaseDate?.toISOString(),
    };

    if (isEdit) {
      updateMutation.mutate(
        { id: id!, payload },
        { onSuccess: () => navigate(`/assets/${id}`) },
      );
    } else {
      createMutation.mutate(payload, {
        onSuccess: (res) => navigate(`/assets/${res.data._id}`),
      });
    }
  };

  if (isEdit && loadingAsset) {
    return <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}><Spin size="large" /></div>;
  }

  return (
    <PageContainer>
      <PageHeader
        title={isEdit ? 'Edit Asset' : 'Add New Asset'}
        breadcrumbs={[{ label: 'Assets', path: '/assets' }, { label: isEdit ? 'Edit' : 'New' }]}
        actions={
          <Button type="text" icon={<ArrowLeftOutlined />} onClick={() => navigate(isEdit ? `/assets/${id}` : '/assets')}>
            Back to List
          </Button>
        }
      />

      <div style={{ maxWidth: 1400, margin: '0 auto' }}>
        <Form
          form={form}
          layout="vertical"
          onFinish={handleFinish}
          initialValues={{ condition: 'New' }}
        >
          <Row gutter={24}>
            <Col xs={24} lg={16}>
              <FormSection title="Asset Information" icon={<ToolOutlined />}>
                <Row gutter={rowGutter}>
                  <Col span={12}>
                    <Form.Item name="name" label="Asset Name" rules={[{ required: true, message: 'Required' }]}>
                      <Input placeholder="e.g. Dell Latitude 3420" style={{ height: inputHeight }} />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item name="category" label="Category" rules={[{ required: true, message: 'Required' }]}>
                      <Select placeholder="Select category" style={{ height: inputHeight }} options={CATEGORIES.map((c) => ({ label: c, value: c }))} />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item name="brand" label="Brand">
                      <Input placeholder="e.g. Dell, HP, Lenovo" style={{ height: inputHeight }} />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item name="assetModel" label="Model">
                      <Input placeholder="Model number" style={{ height: inputHeight }} />
                    </Form.Item>
                  </Col>
                </Row>
              </FormSection>

              <FormSection title="Identification & Tracking" icon={<BarcodeOutlined />}>
                <Row gutter={rowGutter}>
                  <Col span={colSpan}>
                    <Form.Item name="serialNumber" label="Serial Number">
                      <Input placeholder="Serial number" style={{ height: inputHeight }} />
                    </Form.Item>
                  </Col>
                  <Col span={colSpan}>
                    <Form.Item name="condition" label="Condition">
                      <Select style={{ height: inputHeight }} options={CONDITIONS.map((c) => ({ label: c, value: c }))} />
                    </Form.Item>
                  </Col>
                  <Col span={colSpan}>
                    <Form.Item name="location" label="Location">
                      <Input placeholder="e.g. Head Office, Floor 3" style={{ height: inputHeight }} />
                    </Form.Item>
                  </Col>
                </Row>
              </FormSection>

              <FormSection title="Purchase Details" icon={<InfoCircleOutlined />}>
                <Row gutter={rowGutter}>
                  <Col span={colSpan}>
                    <Form.Item name="purchaseDate" label="Purchase Date">
                      <DatePicker style={{ width: '100%', height: inputHeight }} />
                    </Form.Item>
                  </Col>
                  <Col span={colSpan}>
                    <Form.Item name="purchasePrice" label="Purchase Price (₹)">
                      <InputNumber style={{ width: '100%', height: inputHeight }} min={0} prefix="₹" placeholder="25000" />
                    </Form.Item>
                  </Col>
                </Row>
              </FormSection>
            </Col>

            <Col xs={24} lg={8}>
              <FormSection title="Additional Notes" icon={<FileTextOutlined />}>
                <Row gutter={rowGutter}>
                  <Col span={24}>
                    <Form.Item name="description" label="Description">
                      <Input.TextArea rows={3} placeholder="Optional description" />
                    </Form.Item>
                  </Col>
                  <Col span={24}>
                    <Form.Item name="notes" label="Notes">
                      <Input.TextArea rows={3} placeholder="Additional notes" />
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
            <Button size="large" onClick={() => navigate(isEdit ? `/assets/${id}` : '/assets')}>Cancel</Button>
            <Button type="primary" htmlType="submit" icon={<SaveOutlined />} loading={createMutation.isPending || updateMutation.isPending} size="large">
              {isEdit ? 'Update Asset' : 'Create Asset'}
            </Button>
          </div>
        </Form>
      </div>
    </PageContainer>
  );
}

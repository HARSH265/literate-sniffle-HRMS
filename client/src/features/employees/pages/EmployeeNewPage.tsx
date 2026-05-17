import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Form, Input, Select, InputNumber, DatePicker, Button, Row, Col, message, Card, Upload } from 'antd';
import { ArrowLeftOutlined, SaveOutlined, UploadOutlined } from '@ant-design/icons';
import { PageHeader } from '../../../core/components/PageHeader';
import { employeeService, CreateEmployee } from '../services/employeeService';
import { useQuery, useMutation } from '@tanstack/react-query';

const CATEGORY_OPTIONS = [
  { label: 'Manufacturing Worker', value: 'worker' },
  { label: 'Office Staff', value: 'office-staff' },
];

const EMPLOYMENT_TYPE_OPTIONS = [
  { label: 'Permanent', value: 'permanent' },
  { label: 'Contract', value: 'contract' },
  { label: 'Temporary', value: 'temporary' },
  { label: 'Trainee', value: 'trainee' },
];

const SALARY_TYPE_OPTIONS = [
  { label: 'Monthly', value: 'monthly' },
  { label: 'Daily', value: 'daily' },
];

export function EmployeeNewPage() {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: deptData, isLoading: deptLoading } = useQuery({
    queryKey: ['departments'],
    queryFn: () => import('../../departments/services/departmentService').then(m => m.departmentService.list({ limit: 100 })),
  });

  const { data: desigData, isLoading: desigLoading } = useQuery({
    queryKey: ['designations'],
    queryFn: () => import('../../designations/services/designationService').then(m => m.designationService.list({ limit: 100 })),
  });

  const { data: shiftData, isLoading: shiftLoading } = useQuery({
    queryKey: ['shifts'],
    queryFn: () => import('../../shifts/services/shiftService').then(m => m.shiftService.list({ limit: 100 })),
  });

  const createMutation = useMutation({
    mutationFn: (payload: CreateEmployee) => employeeService.create(payload),
    onSuccess: () => {
      message.success('Employee created successfully');
      navigate('/employees');
    },
    onError: (err: any) => {
      message.error(err?.response?.data?.message || 'Failed to create employee');
      setIsSubmitting(false);
    },
  });

  const handleSubmit = (values: any) => {
    setIsSubmitting(true);
    const payload = {
      ...values,
      joiningDate: values.joiningDate?.format('YYYY-MM-DD'),
    };
    createMutation.mutate(payload as CreateEmployee);
  };

  const SectionCard = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <Card size="small" style={{ marginBottom: 16, borderRadius: 8 }}>
      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--hrms-primary)', marginBottom: 16 }}>{title}</div>
      {children}
    </Card>
  );

  return (
    <div style={{ padding: '0 4px' }}>
      <PageHeader 
        title="Add Employee" 
        breadcrumbs={[{ label: 'Employees', path: '/employees' }, { label: 'New' }]}
        actions={
          <Button type="text" icon={<ArrowLeftOutlined />} onClick={() => navigate('/employees')}>
            Back to List
          </Button>
        }
      />

      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{ salaryType: 'monthly', overtimeEligible: false }}
        >
          <Row gutter={16}>
            <Col xs={24} lg={12}>
              <SectionCard title="Basic Information">
                <Row gutter={12}>
                  <Col span={24}>
                    <Form.Item name="photo" label="Photo">
                      <Upload
                        accept="image/*"
                        maxCount={1}
                        showUploadList={false}
                        beforeUpload={(file) => {
                          const reader = new FileReader();
                          reader.onload = () => {
                            form.setFieldValue('photo', reader.result as string);
                          };
                          reader.readAsDataURL(file);
                          return false;
                        }}
                      >
                        <Button icon={<UploadOutlined />}>Upload Photo</Button>
                      </Upload>
                    </Form.Item>
                  </Col>
                  <Col span={24}>
                    <Form.Item name="employeeCode" label="Employee Code" rules={[{ required: true }]}>
                      <Input placeholder="EMP001" style={{ height: 36 }} />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item name="fullName" label="Full Name" rules={[{ required: true }]}>
                      <Input placeholder="John Doe" style={{ height: 36 }} />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item name="fatherName" label="Father's Name" rules={[{ required: true }]}>
                      <Input placeholder="Father Name" style={{ height: 36 }} />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item name="category" label="Category" rules={[{ required: true }]}>
                      <Select options={CATEGORY_OPTIONS} placeholder="Select" style={{ height: 36 }} />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item name="employmentType" label="Employment Type" rules={[{ required: true }]}>
                      <Select options={EMPLOYMENT_TYPE_OPTIONS} placeholder="Select" style={{ height: 36 }} />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item name="joiningDate" label="Joining Date" rules={[{ required: true }]}>
                      <DatePicker style={{ width: '100%', height: 36 }} />
                    </Form.Item>
                  </Col>
                </Row>
              </SectionCard>

              <SectionCard title="Organization">
                <Row gutter={12}>
                  <Col span={8}>
                    <Form.Item name="department" label="Department" rules={[{ required: true }]}>
                      <Select 
                        placeholder="Select" 
                        options={deptData?.data.map((d: any) => ({ label: d.name, value: d.id }))} 
                        style={{ height: 36 }}
                        loading={deptLoading}
                      />
                    </Form.Item>
                  </Col>
                  <Col span={8}>
                    <Form.Item name="designation" label="Designation" rules={[{ required: true }]}>
                      <Select 
                        placeholder="Select" 
                        options={desigData?.data.map((d: any) => ({ label: d.name, value: d.id }))} 
                        style={{ height: 36 }}
                        loading={desigLoading}
                      />
                    </Form.Item>
                  </Col>
                  <Col span={8}>
                    <Form.Item name="shift" label="Shift" rules={[{ required: true }]}>
                      <Select 
                        placeholder="Select" 
                        options={shiftData?.data.map((s: any) => ({ label: s.name, value: s.id }))} 
                        style={{ height: 36 }}
                        loading={shiftLoading}
                      />
                    </Form.Item>
                  </Col>
                </Row>
              </SectionCard>
            </Col>

            <Col xs={24} lg={12}>
              <SectionCard title="Salary Details">
                <Row gutter={12}>
                  <Col span={8}>
                    <Form.Item name="salaryType" label="Salary Type" rules={[{ required: true }]}>
                      <Select options={SALARY_TYPE_OPTIONS} placeholder="Select" style={{ height: 36 }} />
                    </Form.Item>
                  </Col>
                  <Col span={8}>
                    <Form.Item name="baseSalary" label="Base Salary (₹/month)">
                      <InputNumber style={{ width: '100%', height: 36 }} min={0} placeholder="25000" />
                    </Form.Item>
                  </Col>
                  <Col span={8}>
                    <Form.Item name="dailyWage" label="Daily Wage (₹)">
                      <InputNumber style={{ width: '100%', height: 36 }} min={0} placeholder="800" />
                    </Form.Item>
                  </Col>
                </Row>
              </SectionCard>

              <SectionCard title="Contact & Address">
                <Row gutter={12}>
                  <Col span={12}>
                    <Form.Item name="contactNumber" label="Contact Number">
                      <Input placeholder="+91 98765 43210" style={{ height: 36 }} />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item name="email" label="Email">
                      <Input placeholder="email@example.com" style={{ height: 36 }} />
                    </Form.Item>
                  </Col>
                  <Col span={24}>
                    <Form.Item name="address" label="Address">
                      <Input.TextArea placeholder="Full address..." rows={2} />
                    </Form.Item>
                  </Col>
                </Row>
              </SectionCard>

              <SectionCard title="Bank Details (Optional)">
                <Row gutter={12}>
                  <Col span={8}>
                    <Form.Item name={['bankDetails', 'bankName']} label="Bank Name">
                      <Input placeholder="Bank Name" style={{ height: 36 }} />
                    </Form.Item>
                  </Col>
                  <Col span={8}>
                    <Form.Item name={['bankDetails', 'accountNumber']} label="Account Number">
                      <Input placeholder="Account Number" style={{ height: 36 }} />
                    </Form.Item>
                  </Col>
                  <Col span={8}>
                    <Form.Item name={['bankDetails', 'ifscCode']} label="IFSC Code">
                      <Input placeholder="IFSC Code" style={{ height: 36 }} />
                    </Form.Item>
                  </Col>
                </Row>
              </SectionCard>

              <SectionCard title="Documents">
                <Row gutter={12}>
                  <Col span={8}>
                    <Form.Item name={['documents', 'aadhar']} label="Aadhar Card">
                      <Upload
                        accept="image/*,.pdf"
                        maxCount={1}
                        beforeUpload={(file) => {
                          const reader = new FileReader();
                          reader.onload = () => {
                            form.setFieldValue(['documents', 'aadhar'], { name: file.name, data: reader.result });
                          };
                          reader.readAsDataURL(file);
                          return false;
                        }}
                      >
                        <Button icon={<UploadOutlined />}>Upload</Button>
                      </Upload>
                    </Form.Item>
                  </Col>
                  <Col span={8}>
                    <Form.Item name={['documents', 'pan']} label="PAN Card">
                      <Upload
                        accept="image/*,.pdf"
                        maxCount={1}
                        beforeUpload={(file) => {
                          const reader = new FileReader();
                          reader.onload = () => {
                            form.setFieldValue(['documents', 'pan'], { name: file.name, data: reader.result });
                          };
                          reader.readAsDataURL(file);
                          return false;
                        }}
                      >
                        <Button icon={<UploadOutlined />}>Upload</Button>
                      </Upload>
                    </Form.Item>
                  </Col>
                  <Col span={8}>
                    <Form.Item name={['documents', 'voter']} label="Voter ID">
                      <Upload
                        accept="image/*,.pdf"
                        maxCount={1}
                        beforeUpload={(file) => {
                          const reader = new FileReader();
                          reader.onload = () => {
                            form.setFieldValue(['documents', 'voter'], { name: file.name, data: reader.result });
                          };
                          reader.readAsDataURL(file);
                          return false;
                        }}
                      >
                        <Button icon={<UploadOutlined />}>Upload</Button>
                      </Upload>
                    </Form.Item>
                  </Col>
                </Row>
              </SectionCard>
            </Col>
          </Row>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--hrms-border-light)' }}>
            <Button onClick={() => navigate('/employees')}>Cancel</Button>
            <Button type="primary" htmlType="submit" icon={<SaveOutlined />} loading={isSubmitting}>
              Create Employee
            </Button>
          </div>
        </Form>
      </div>
    </div>
  );
}
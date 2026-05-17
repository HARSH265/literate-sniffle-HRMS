import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Form, Input, Select, InputNumber, DatePicker, Button, Row, Col, message, Card, Spin, Upload } from 'antd';
import { ArrowLeftOutlined, SaveOutlined, UploadOutlined } from '@ant-design/icons';
import { PageHeader } from '../../../core/components/PageHeader';
import { employeeService, CreateEmployee } from '../services/employeeService';
import { useQuery, useMutation } from '@tanstack/react-query';
import dayjs from 'dayjs';

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

const STATUS_OPTIONS = [
  { label: 'Active', value: 'active' },
  { label: 'Inactive', value: 'inactive' },
  { label: 'Terminated', value: 'terminated' },
  { label: 'Archived', value: 'archived' },
];

export function EmployeeEditPage() {
  const { id } = useParams<{ id: string }>();
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: employeeData, isLoading: empLoading } = useQuery({
    queryKey: ['employee', id],
    queryFn: () => employeeService.getById(id!),
    enabled: !!id,
  });

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

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<CreateEmployee> }) => employeeService.update(id, payload),
    onSuccess: () => {
      message.success('Employee updated successfully');
      navigate(`/employees/${id}`);
    },
    onError: (err: any) => {
      message.error(err?.response?.data?.message || 'Failed to update employee');
      setIsSubmitting(false);
    },
  });

  const handleSubmit = (values: any) => {
    setIsSubmitting(true);
    const payload = {
      ...values,
      joiningDate: values.joiningDate?.format('YYYY-MM-DD'),
    };
    updateMutation.mutate({ id: id!, payload });
  };

  if (empLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!employeeData?.data) {
    message.error('Employee not found');
    navigate('/employees');
    return null;
  }

  const employee = employeeData.data;

  const SectionCard = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <Card size="small" style={{ marginBottom: 16, borderRadius: 8 }}>
      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--hrms-primary)', marginBottom: 16 }}>{title}</div>
      {children}
    </Card>
  );

  return (
    <div style={{ padding: '0 4px' }}>
      <PageHeader 
        title="Edit Employee" 
        breadcrumbs={[
          { label: 'Employees', path: '/employees' },
          { label: employee.employeeCode, path: `/employees/${id}` },
          { label: 'Edit' },
        ]}
        actions={
          <Button type="text" icon={<ArrowLeftOutlined />} onClick={() => navigate(`/employees/${id}`)}>
            Back to Details
          </Button>
        }
      />

      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{
            ...employee,
            department: employee.department?.id,
            designation: employee.designation?.id,
            shift: employee.shift?.id,
            joiningDate: employee.joiningDate ? dayjs(employee.joiningDate) : undefined,
          }}
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
                        <Button icon={<UploadOutlined />}>Change Photo</Button>
                      </Upload>
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item name="employeeCode" label="Employee Code">
                      <Input disabled style={{ height: 36 }} />
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
                    <Form.Item name="status" label="Status">
                      <Select options={STATUS_OPTIONS} placeholder="Select" style={{ height: 36 }} />
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
                <Row gutter={12}>
                  <Col span={12}>
                    <Form.Item name="overtimeEligible" valuePropName="checked">
                      <Input type="checkbox" style={{ marginTop: 28 }} />
                      <span style={{ marginLeft: 8 }}>Overtime Eligible</span>
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
            </Col>
          </Row>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--hrms-border-light)' }}>
            <Button onClick={() => navigate(`/employees/${id}`)}>Cancel</Button>
            <Button type="primary" htmlType="submit" icon={<SaveOutlined />} loading={isSubmitting}>
              Update Employee
            </Button>
          </div>
        </Form>
      </div>
    </div>
  );
}
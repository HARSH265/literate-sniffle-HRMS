import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Form, Input, Select, InputNumber, DatePicker, Button, Row, Col, message, Switch, Tag } from 'antd';
import { ArrowLeftOutlined, SaveOutlined, UserOutlined, BankOutlined, DollarOutlined, HomeOutlined, IdcardOutlined, SettingOutlined, SafetyCertificateOutlined } from '@ant-design/icons';
import { PageHeader } from '../../../core/components/PageHeader';
import { FormSection } from '../../../core/components/FormSection';
import { employeeService, CreateEmployee } from '../services/employeeService';
import {
  CATEGORY_OPTIONS, GENDER_OPTIONS, EMPLOYMENT_TYPE_OPTIONS,
  SALARY_TYPE_OPTIONS, BLOOD_GROUP_OPTIONS, MARITAL_STATUS_OPTIONS, FORM_LAYOUT,
} from '../../../core/constants/employee';
import { useQuery, useMutation } from '@tanstack/react-query';

const { rowGutter, colSpan, inputHeight } = FORM_LAYOUT;

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

  const { data: settings } = useQuery({
    queryKey: ['settings'],
    queryFn: () => import('../../settings/services/settingsService').then(m => m.settingsService.get()),
  });
  const isAutoGenerate = settings?.data?.employeeCodeConfig?.isAutoGenerate !== false;

  const { data: nextCode } = useQuery({
    queryKey: ['next-employee-code'],
    queryFn: () => employeeService.getNextCode(),
    enabled: isAutoGenerate,
  });

  useEffect(() => {
    if (nextCode) {
      form.setFieldValue('employeeCode', nextCode);
    }
  }, [nextCode, form]);

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

  const salaryType = Form.useWatch('salaryType', form);
  const baseSalary = Form.useWatch('baseSalary', form);
  const dailyWage = Form.useWatch('dailyWage', form);

  useEffect(() => {
    if (salaryType === 'monthly' && baseSalary && baseSalary > 0 && (!dailyWage || dailyWage === 0)) {
      form.setFieldValue('dailyWage', Math.round((baseSalary / 26) * 100) / 100);
    }
  }, [salaryType, baseSalary]);

  useEffect(() => {
    if (salaryType === 'daily' && dailyWage && dailyWage > 0 && (!baseSalary || baseSalary === 0)) {
      form.setFieldValue('baseSalary', Math.round(dailyWage * 26));
    }
  }, [salaryType, dailyWage]);

  const handleSubmit = (values: any) => {
    setIsSubmitting(true);
    const payload = {
      ...values,
      joiningDate: values.joiningDate?.format('YYYY-MM-DD'),
    };
    createMutation.mutate(payload as CreateEmployee);
  };

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

      <div style={{ maxWidth: 1400, margin: '0 auto' }}>
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{ salaryType: 'monthly', overtimeEligible: false }}
        >
          <Row gutter={24}>
            <Col xs={24} lg={16}>
              <FormSection title="Personal Information" icon={<UserOutlined />}>
                <Row gutter={rowGutter}>
                  <Col span={12}>
                    <Form.Item name="fullName" label="Full Name" rules={[{ required: true, message: 'Required' }]}>
                      <Input placeholder="Enter full name" style={{ height: inputHeight }} />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item name="fatherName" label="Father's Name" rules={[{ required: true, message: 'Required' }]}>
                      <Input placeholder="Enter father's name" style={{ height: inputHeight }} />
                    </Form.Item>
                  </Col>
                  <Col span={8}>
                    <Form.Item name="dateOfBirth" label="Date of Birth">
                      <DatePicker style={{ width: '100%', height: inputHeight }} />
                    </Form.Item>
                  </Col>
                  <Col span={8}>
                    <Form.Item name="gender" label="Gender">
                      <Select options={GENDER_OPTIONS} placeholder="Select" style={{ height: inputHeight }} />
                    </Form.Item>
                  </Col>
                  <Col span={8}>
                    <Form.Item name="bloodGroup" label="Blood Group">
                      <Select options={BLOOD_GROUP_OPTIONS} placeholder="Select" style={{ height: inputHeight }} />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item name="category" label="Category" rules={[{ required: true, message: 'Required' }]}>
                      <Select options={CATEGORY_OPTIONS} placeholder="Select category" style={{ height: inputHeight }} />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item name="maritalStatus" label="Marital Status">
                      <Select 
                        options={MARITAL_STATUS_OPTIONS} 
                        placeholder="Select" 
                        style={{ height: inputHeight }} 
                      />
                    </Form.Item>
                  </Col>
                </Row>
              </FormSection>

              <FormSection title="Employment Details" icon={<IdcardOutlined />}>
                <Row gutter={rowGutter}>
                  <Col span={8}>
                    <Form.Item name="employeeCode" label="Employee Code" rules={isAutoGenerate ? [] : [{ required: true, message: 'Required' }]}>
                      <div style={{ display: 'flex', gap: 4 }}>
                        {isAutoGenerate ? (
                          <Input
                            placeholder="Auto-generated"
                            style={{ height: inputHeight, flex: 1 }}
                            disabled
                            suffix={<Tag color="blue" style={{ marginRight: 0, fontSize: 11, lineHeight: '18px' }}>Auto</Tag>}
                          />
                        ) : (
                          <Input placeholder="Enter employee code" style={{ height: inputHeight, flex: 1 }} />
                        )}
                        <Button
                          type="default"
                          icon={<SettingOutlined />}
                          style={{ height: inputHeight, width: inputHeight }}
                          onClick={() => navigate('/settings', { state: { section: 'codeConfig' } })}
                        />
                      </div>
                    </Form.Item>
                  </Col>
                  <Col span={8}>
                    <Form.Item name="joiningDate" label="Joining Date" rules={[{ required: true, message: 'Required' }]}>
                      <DatePicker style={{ width: '100%', height: inputHeight }} />
                    </Form.Item>
                  </Col>
                  <Col span={8}>
                    <Form.Item name="employmentType" label="Employment Type" rules={[{ required: true, message: 'Required' }]}>
                      <Select options={EMPLOYMENT_TYPE_OPTIONS} placeholder="Select" style={{ height: inputHeight }} />
                    </Form.Item>
                  </Col>
                </Row>
              </FormSection>

              <FormSection title="Organization" icon={<BankOutlined />}>
                <Row gutter={rowGutter}>
                  <Col span={colSpan}>
                    <Form.Item name="department" label="Department" rules={[{ required: true, message: 'Required' }]}>
                      <Select 
                        placeholder="Select" 
                        options={deptData?.data.map((d: any) => ({ label: d.name, value: d.id }))} 
                        style={{ height: inputHeight }}
                        loading={deptLoading}
                      />
                    </Form.Item>
                  </Col>
                  <Col span={colSpan}>
                    <Form.Item name="designation" label="Designation" rules={[{ required: true, message: 'Required' }]}>
                      <Select 
                        placeholder="Select" 
                        options={desigData?.data.map((d: any) => ({ label: d.name, value: d.id }))} 
                        style={{ height: inputHeight }}
                        loading={desigLoading}
                      />
                    </Form.Item>
                  </Col>
                  <Col span={colSpan}>
                    <Form.Item name="shift" label="Shift" rules={[{ required: true, message: 'Required' }]}>
                      <Select 
                        placeholder="Select" 
                        options={shiftData?.data.map((s: any) => ({ label: s.name, value: s.id }))} 
                        style={{ height: inputHeight }}
                        loading={shiftLoading}
                      />
                    </Form.Item>
                  </Col>
                </Row>
              </FormSection>

              <FormSection title="Contact Information" icon={<HomeOutlined />}>
                <Row gutter={rowGutter}>
                  <Col span={8}>
                    <Form.Item name="contactNumber" label="Phone Number">
                      <Input placeholder="+91 98765 43210" style={{ height: inputHeight }} />
                    </Form.Item>
                  </Col>
                  <Col span={8}>
                    <Form.Item name="email" label="Email Address">
                      <Input placeholder="email@example.com" style={{ height: inputHeight }} />
                    </Form.Item>
                  </Col>
                  <Col span={8}>
                    <Form.Item name="emergencyContact" label="Emergency Contact">
                      <Input placeholder="+91 98765 43210" style={{ height: inputHeight }} />
                    </Form.Item>
                  </Col>
                  <Col span={24}>
                    <Form.Item name="address" label="Present Address">
                      <Input.TextArea placeholder="Enter full address..." rows={2} />
                    </Form.Item>
                  </Col>
                  <Col span={24}>
                    <Form.Item name="permanentAddress" label="Permanent Address">
                      <Input.TextArea placeholder="Enter permanent address..." rows={2} />
                    </Form.Item>
                  </Col>
                </Row>
              </FormSection>
            </Col>

            <Col xs={24} lg={8}>
              <FormSection title="Salary & Benefits" icon={<DollarOutlined />}>
                <Row gutter={rowGutter}>
                  <Col span={12}>
                    <Form.Item name="salaryType" label="Salary Type" rules={[{ required: true, message: 'Required' }]}>
                      <Select options={SALARY_TYPE_OPTIONS} placeholder="Select" style={{ height: inputHeight }} />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item name="overtimeEligible" valuePropName="checked">
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                        <Switch size="small" />
                        <span style={{ fontSize: 13, color: 'var(--hrms-text-secondary)' }}>Overtime Eligible</span>
                      </div>
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item name="baseSalary" label="Monthly Salary (₹)">
                      <InputNumber style={{ width: '100%', height: inputHeight }} min={0} placeholder="25000" />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item name="dailyWage" label="Daily Wage (₹)">
                      <InputNumber style={{ width: '100%', height: inputHeight }} min={0} placeholder="800" />
                    </Form.Item>
                  </Col>
                </Row>
              </FormSection>

              <FormSection title="Bank Details" icon={<BankOutlined />}>
                <Row gutter={rowGutter}>
                  <Col span={24}>
                    <Form.Item name={['bankDetails', 'bankName']} label="Bank Name">
                      <Input placeholder="Enter bank name" style={{ height: inputHeight }} />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item name={['bankDetails', 'accountNumber']} label="Account Number">
                      <Input placeholder="Enter account number" style={{ height: inputHeight }} />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item name={['bankDetails', 'ifscCode']} label="IFSC Code">
                      <Input placeholder="Enter IFSC code" style={{ height: inputHeight }} />
                    </Form.Item>
                  </Col>
                  <Col span={24}>
                    <Form.Item name={['bankDetails', 'accountHolderName']} label="Account Holder Name">
                      <Input placeholder="Enter name as per bank" style={{ height: inputHeight }} />
                    </Form.Item>
                  </Col>
                </Row>
              </FormSection>

              <FormSection title="Statutory Compliance" icon={<SafetyCertificateOutlined />}>
                <Row gutter={rowGutter}>
                  <Col span={12}>
                    <Form.Item name="pfUAN" label="PF UAN">
                      <Input placeholder="e.g. IN/UAN/123456789" style={{ height: inputHeight }} />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item name="esiNumber" label="ESI Number">
                      <Input placeholder="e.g. 1234567890" style={{ height: inputHeight }} />
                    </Form.Item>
                  </Col>
                  <Col span={8}>
                    <Form.Item name="pfJoiningDate" label="PF Joining Date">
                      <DatePicker style={{ width: '100%', height: inputHeight }} format="YYYY-MM-DD" />
                    </Form.Item>
                  </Col>
                  <Col span={4}>
                    <Form.Item name="pfExempted" label="PF Exempted" valuePropName="checked">
                      <Switch />
                    </Form.Item>
                  </Col>
                  <Col span={4}>
                    <Form.Item name="esiExempted" label="ESI Exempted" valuePropName="checked">
                      <Switch />
                    </Form.Item>
                  </Col>
                  <Col span={4}>
                    <Form.Item name="ptExempted" label="PT Exempted" valuePropName="checked">
                      <Switch />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item name="ptState" label="Professional Tax State">
                      <Select placeholder="Select state" allowClear style={{ height: inputHeight }}>
                        <Select.Option value="Andhra Pradesh">Andhra Pradesh</Select.Option>
                        <Select.Option value="Karnataka">Karnataka</Select.Option>
                        <Select.Option value="Kerala">Kerala</Select.Option>
                        <Select.Option value="Maharashtra">Maharashtra</Select.Option>
                        <Select.Option value="Tamil Nadu">Tamil Nadu</Select.Option>
                        <Select.Option value="Telangana">Telangana</Select.Option>
                        <Select.Option value="West Bengal">West Bengal</Select.Option>
                        <Select.Option value="Other">Other</Select.Option>
                      </Select>
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
            <Button size="large" onClick={() => navigate('/employees')}>Cancel</Button>
            <Button type="primary" htmlType="submit" icon={<SaveOutlined />} loading={isSubmitting} size="large">
              Create Employee
            </Button>
          </div>
        </Form>
      </div>
    </div>
  );
}
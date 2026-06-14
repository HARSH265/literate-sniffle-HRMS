import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Form, Input, Select, InputNumber, DatePicker, Button, Row, Col, Switch, Tag, Tooltip } from 'antd';
import { SaveOutlined, UserOutlined, BankOutlined, DollarOutlined, HomeOutlined, IdcardOutlined, SettingOutlined, SafetyCertificateOutlined } from '@ant-design/icons';
import { FormSection } from '../../../core/components/FormSection';
import { CreateEmployee } from '../services/employeeService';
import {
  CATEGORY_OPTIONS, GENDER_OPTIONS, EMPLOYMENT_TYPE_OPTIONS,
  SALARY_TYPE_OPTIONS, BLOOD_GROUP_OPTIONS, MARITAL_STATUS_OPTIONS,
  PT_STATE_OPTIONS, FORM_LAYOUT,
} from '../../../core/constants/employee';
import { useQuery } from '@tanstack/react-query';
import styles from '../employees.module.css';

const { rowGutter, colSpan } = FORM_LAYOUT;

interface EmployeeFormProps {
  mode: 'create' | 'edit';
  initialValues?: Record<string, any>;
  onSubmit: (values: CreateEmployee) => void;
  isPending: boolean;
  onCancel: () => void;
}

export function EmployeeForm({ mode, initialValues, onSubmit, isPending, onCancel }: EmployeeFormProps) {
  const [form] = Form.useForm();
  const navigate = useNavigate();

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
    enabled: mode === 'create',
  });
  const isAutoGenerate = settings?.data?.employeeCodeConfig?.isAutoGenerate !== false;

  const { data: nextCode } = useQuery({
    queryKey: ['next-employee-code'],
    queryFn: () => import('../services/employeeService').then(m => m.employeeService.getNextCode()),
    enabled: mode === 'create' && isAutoGenerate,
  });

  useEffect(() => {
    if (mode === 'create' && nextCode) {
      form.setFieldValue('employeeCode', nextCode);
    }
  }, [nextCode, form, mode]);

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
      form.setFieldValue('baseSalary', Math.round(dailyWage * 30));
    }
  }, [salaryType, dailyWage]);

  const handleSubmit = (values: CreateEmployee) => {
    const payload = {
      ...values,
      joiningDate: typeof values.joiningDate === 'object' && values.joiningDate !== null && 'format' in values.joiningDate
        ? (values.joiningDate as any).format('YYYY-MM-DD')
        : values.joiningDate,
    };
    onSubmit(payload);
  };

  const defaultValues = mode === 'create'
    ? { salaryType: 'monthly', overtimeEligible: false }
    : initialValues;

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={handleSubmit}
      initialValues={defaultValues}
    >
      <Row gutter={24}>
        <Col xs={24} lg={16}>
          <FormSection title="Personal Information" icon={<UserOutlined />}>
            <Row gutter={rowGutter}>
              <Col span={12}>
                <Form.Item name="fullName" label="Full Name" rules={[{ required: true, message: 'Required' }]}>
                  <Input placeholder="Enter full name" className={styles.inputHeight} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="fatherName" label="Father's Name" rules={[{ required: true, message: 'Required' }]}>
                  <Input placeholder="Enter father's name" className={styles.inputHeight} />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item name="dateOfBirth" label="Date of Birth">
                  <DatePicker className={styles.dateWidth} />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item name="gender" label="Gender">
                  <Select options={GENDER_OPTIONS} placeholder="Select" className={styles.inputHeight} />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item name="bloodGroup" label="Blood Group">
                  <Select options={BLOOD_GROUP_OPTIONS} placeholder="Select" className={styles.inputHeight} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="category" label="Category" rules={[{ required: true, message: 'Required' }]}>
                  <Select options={CATEGORY_OPTIONS} placeholder="Select category" className={styles.inputHeight} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="maritalStatus" label="Marital Status">
                  <Select options={MARITAL_STATUS_OPTIONS} placeholder="Select" className={styles.inputHeight} />
                </Form.Item>
              </Col>
            </Row>
          </FormSection>

          <FormSection title="Employment Details" icon={<IdcardOutlined />}>
            <Row gutter={rowGutter}>
              <Col span={8}>
                {mode === 'create' ? (
                  <Form.Item name="employeeCode" label="Employee Code" rules={isAutoGenerate ? [] : [{ required: true, message: 'Required' }]}>
                    <div className={styles.codeRow}>
                      {isAutoGenerate ? (
                        <Input
                          placeholder="Auto-generated"
                          className={styles.codeInput}
                          disabled
                          suffix={<Tag color="blue" className={styles.autoTag}>Auto</Tag>}
                        />
                      ) : (
                        <Input placeholder="Enter employee code" className={styles.codeInput} />
                      )}
                      <Button
                        type="default"
                        icon={<SettingOutlined />}
                        className={styles.codeBtn}
                        onClick={() => navigate('/settings', { state: { section: 'codeConfig' } })}
                      />
                    </div>
                  </Form.Item>
                ) : (
                  <Form.Item name="employeeCode" label="Employee Code">
                    <Tooltip title="Employee code cannot be changed after creation">
                      <Input disabled className={styles.disabledInput} />
                    </Tooltip>
                  </Form.Item>
                )}
              </Col>
              <Col span={8}>
                <Form.Item name="joiningDate" label="Joining Date" rules={[{ required: true, message: 'Required' }]}>
                  <DatePicker className={styles.dateWidth} />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item name="employmentType" label="Employment Type" rules={[{ required: true, message: 'Required' }]}>
                  <Select options={EMPLOYMENT_TYPE_OPTIONS} placeholder="Select" className={styles.inputHeight} />
                </Form.Item>
              </Col>
              {mode === 'edit' && (
                <Col span={8}>
                  <Form.Item name="status" label="Status">
                    <Select options={[{ value: 'active', label: 'Active' }, { value: 'inactive', label: 'Inactive' }, { value: 'terminated', label: 'Terminated' }]} placeholder="Select" className={styles.inputHeight} />
                  </Form.Item>
                </Col>
              )}
            </Row>
          </FormSection>

          <FormSection title="Organization" icon={<BankOutlined />}>
            <Row gutter={rowGutter}>
              <Col span={colSpan}>
                <Form.Item name="department" label="Department" rules={[{ required: true, message: 'Required' }]}>
                  <Select
                    placeholder="Select"
                    options={deptData?.data.map((d: any) => ({ label: d.name, value: d.id }))}
                    className={styles.inputHeight}
                    loading={deptLoading}
                  />
                </Form.Item>
              </Col>
              <Col span={colSpan}>
                <Form.Item name="designation" label="Designation" rules={[{ required: true, message: 'Required' }]}>
                  <Select
                    placeholder="Select"
                    options={desigData?.data.map((d: any) => ({ label: d.name, value: d.id }))}
                    className={styles.inputHeight}
                    loading={desigLoading}
                  />
                </Form.Item>
              </Col>
              <Col span={colSpan}>
                <Form.Item name="shift" label="Shift" rules={[{ required: true, message: 'Required' }]}>
                  <Select
                    placeholder="Select"
                    options={shiftData?.data.map((s: any) => ({ label: s.name, value: s.id }))}
                    className={styles.inputHeight}
                    loading={shiftLoading}
                  />
                </Form.Item>
              </Col>
            </Row>
          </FormSection>

          <FormSection title="Contact Information" icon={<HomeOutlined />}>
            <Row gutter={rowGutter}>
              <Col span={8}>
                <Form.Item name="contactNumber" label="Phone Number" rules={[
                  { pattern: /^[6-9][0-9]{9}$/, message: 'Enter a valid 10-digit Indian mobile number' },
                ]}>
                  <Input placeholder="9876543210" className={styles.inputHeight} />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item name="email" label="Email Address" rules={[
                  { type: 'email', message: 'Enter a valid email address' },
                ]}>
                  <Input placeholder="email@example.com" className={styles.inputHeight} />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item name="emergencyContact" label="Emergency Contact" rules={[
                  { pattern: /^[6-9][0-9]{9}$/, message: 'Enter a valid 10-digit Indian mobile number' },
                ]}>
                  <Input placeholder="9876543210" className={styles.inputHeight} />
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
                  <Select options={SALARY_TYPE_OPTIONS} placeholder="Select" className={styles.inputHeight} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="overtimeEligible" valuePropName="checked">
                  <div className={styles.overtimeRow}>
                    <Switch size="small" />
                    <span className={styles.overtimeLabel}>Overtime Eligible</span>
                  </div>
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="baseSalary" label="Monthly Salary">
                  <InputNumber style={{ width: '100%' }} className={styles.inputHeight} min={0} placeholder="25000" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="dailyWage" label="Daily Wage">
                  <InputNumber style={{ width: '100%' }} className={styles.inputHeight} min={0} placeholder="800" />
                </Form.Item>
              </Col>
            </Row>
          </FormSection>

          <FormSection title="Bank Details" icon={<BankOutlined />}>
            <Row gutter={rowGutter}>
              <Col span={24}>
                <Form.Item name={['bankDetails', 'bankName']} label="Bank Name">
                  <Input placeholder="Enter bank name" className={styles.inputHeight} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name={['bankDetails', 'accountNumber']} label="Account Number">
                  <Input placeholder="Enter account number" className={styles.inputHeight} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name={['bankDetails', 'ifscCode']} label="IFSC Code">
                  <Input placeholder="Enter IFSC code" className={styles.inputHeight} />
                </Form.Item>
              </Col>
              <Col span={24}>
                <Form.Item name={['bankDetails', 'accountHolderName']} label="Account Holder Name">
                  <Input placeholder="Enter name as per bank" className={styles.inputHeight} />
                </Form.Item>
              </Col>
            </Row>
          </FormSection>

          <FormSection title="Statutory Compliance" icon={<SafetyCertificateOutlined />}>
            <Row gutter={rowGutter}>
              <Col span={12}>
                <Form.Item name="pfUAN" label="PF UAN">
                  <Input placeholder="e.g. IN/UAN/123456789" className={styles.inputHeight} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="esiNumber" label="ESI Number">
                  <Input placeholder="e.g. 1234567890" className={styles.inputHeight} />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item name="pfJoiningDate" label="PF Joining Date">
                  <DatePicker className={styles.dateWidth} format="YYYY-MM-DD" />
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
                  <Select placeholder="Select state" allowClear options={PT_STATE_OPTIONS} className={styles.inputHeight} />
                </Form.Item>
              </Col>
            </Row>
          </FormSection>
        </Col>
      </Row>

      <div className={styles.formFooter}>
        <Button size="large" onClick={onCancel}>Cancel</Button>
        <Button type="primary" htmlType="submit" icon={<SaveOutlined />} loading={isPending} size="large">
          {mode === 'create' ? 'Create Employee' : 'Update Employee'}
        </Button>
      </div>
    </Form>
  );
}

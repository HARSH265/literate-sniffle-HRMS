import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { PageHeader } from '../../../core/components/PageHeader';
import { Form, Input, InputNumber, Switch, Button, Card, Row, Col, message, Table, Tag, Select, Popconfirm, Modal, DatePicker, Avatar, Upload } from 'antd';
import { SaveOutlined, PlusOutlined, DeleteOutlined, UserOutlined, BankOutlined, DollarOutlined, CalendarOutlined, GiftOutlined, ClockCircleOutlined, MailOutlined, BellOutlined, IdcardOutlined, CodeOutlined } from '@ant-design/icons';
import { settingsService, CompanySettings } from '../services/settingsService';
import { overtimeRuleService, OvertimeRule, CreateOvertimeRule } from '../../overtime-rules/services/overtimeRuleService';
import { weeklyOffRuleService, WeeklyOffRule, CreateWeeklyOffRule } from '../../weekly-off-rules/services/weeklyOffRuleService';
import { holidayService, Holiday, CreateHoliday } from '../../holidays/services/holidayService';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../../core/api/apiClient';
import { useAuthStore } from '../../../core/stores/authStore';
import dayjs from 'dayjs';

const SETTINGS_MENU = [
  { key: 'profile', label: 'My Profile', icon: <UserOutlined /> },
  { key: 'company', label: 'Company', icon: <BankOutlined /> },
  { key: 'auth', label: 'Auth Settings', icon: <UserOutlined /> },
  { key: 'email', label: 'Email Settings', icon: <MailOutlined /> },
  { key: 'payroll', label: 'Payroll', icon: <DollarOutlined /> },
  { key: 'attendance', label: 'Attendance', icon: <CalendarOutlined /> },
  { key: 'allowances', label: 'Allowances', icon: <GiftOutlined /> },
  { key: 'overtime', label: 'Overtime Rules', icon: <ClockCircleOutlined /> },
  { key: 'weeklyoff', label: 'Weekly Off', icon: <CalendarOutlined /> },
  { key: 'holidays', label: 'Holidays', icon: <GiftOutlined /> },
  { key: 'codeConfig', label: 'Code Configuration', icon: <CodeOutlined /> },
  { key: 'leave', label: 'Leave Config', icon: <CalendarOutlined /> },
];

export function SettingsPage() {
  const location = useLocation();
  const [activeSection, setActiveSection] = useState((location.state as any)?.section || 'profile');
  const [otModalOpen, setOtModalOpen] = useState(false);
  const [woModalOpen, setWoModalOpen] = useState(false);
  const [holidayModalOpen, setHolidayModalOpen] = useState(false);
  const [allowanceModalOpen, setAllowanceModalOpen] = useState(false);
  const [otForm] = Form.useForm();
  const [woForm] = Form.useForm();
  const [holidayForm] = Form.useForm();
  const [allowanceForm] = Form.useForm();
  const [profileForm] = Form.useForm();
  const queryClient = useQueryClient();

  const { data } = useQuery({
    queryKey: ['settings'],
    queryFn: () => settingsService.get(),
  });

  const updateMutation = useMutation({
    mutationFn: (payload: Partial<CompanySettings>) => settingsService.update(payload),
    onSuccess: () => {
      message.success('Settings saved successfully');
      queryClient.invalidateQueries({ queryKey: ['settings'] });
    },
    onError: (err: any) => message.error(err?.response?.data?.message || 'Failed to save settings'),
  });

  const otCreateMutation = useMutation({
    mutationFn: (payload: CreateOvertimeRule) => overtimeRuleService.create(payload),
    onSuccess: () => { message.success('Rule created'); setOtModalOpen(false); otForm.resetFields(); queryClient.invalidateQueries({ queryKey: ['overtime-rules'] }); },
    onError: (err: any) => message.error(err?.response?.data?.message || 'Failed to create'),
  });

  const woCreateMutation = useMutation({
    mutationFn: (payload: CreateWeeklyOffRule) => weeklyOffRuleService.create(payload),
    onSuccess: () => { message.success('Rule created'); setWoModalOpen(false); woForm.resetFields(); queryClient.invalidateQueries({ queryKey: ['weekly-off-rules'] }); },
    onError: (err: any) => message.error(err?.response?.data?.message || 'Failed to create'),
  });

  const holidayCreateMutation = useMutation({
    mutationFn: (payload: CreateHoliday) => holidayService.create(payload),
    onSuccess: () => { message.success('Holiday created'); setHolidayModalOpen(false); holidayForm.resetFields(); queryClient.invalidateQueries({ queryKey: ['holidays'] }); },
    onError: (err: any) => message.error(err?.response?.data?.message || 'Failed to create'),
  });

  const testEmailMutation = useMutation({
    mutationFn: (email: string) => settingsService.testEmail(email),
    onSuccess: (res: any) => {
      if (res.success) {
        message.success('Test email sent successfully!');
      } else {
        message.error(res.message || 'Failed to send test email');
      }
    },
    onError: (err: any) => message.error(err?.response?.data?.message || 'Failed to send test email'),
  });

  const [companyForm] = Form.useForm();

  useEffect(() => {
    if (data?.data) {
      companyForm.setFieldsValue(data.data);
    }
  }, [data, companyForm]);

  const handleSaveCompany = (values: any) => {
    updateMutation.mutate(values);
  };

  const renderContent = () => {
    switch (activeSection) {
      case 'profile':
        return <ProfileSection form={profileForm} />;
      case 'company':
        return <CompanySection form={companyForm} onSave={handleSaveCompany} />;
      case 'auth':
        return <AuthSection form={companyForm} onSave={handleSaveCompany} />;
      case 'email':
        return <EmailSection form={companyForm} onSave={handleSaveCompany} onTestEmail={(email) => testEmailMutation.mutate(email)} isTesting={testEmailMutation.isPending} />;
      case 'payroll':
        return <PayrollSection form={companyForm} onSave={handleSaveCompany} />;
      case 'attendance':
        return <AttendanceSection form={companyForm} onSave={handleSaveCompany} />;
      case 'allowances':
        return <AllowancesSection form={companyForm} onAdd={() => setAllowanceModalOpen(true)} />;
      case 'overtime':
        return <OvertimeSection onAdd={() => setOtModalOpen(true)} />;
      case 'weeklyoff':
        return <WeeklyOffSection onAdd={() => setWoModalOpen(true)} />;
      case 'holidays':
        return <HolidaysSection onAdd={() => setHolidayModalOpen(true)} />;
      case 'codeConfig':
        return <CodeConfigSection form={companyForm} onSave={handleSaveCompany} />;
      case 'leave':
        return <LeaveSection form={companyForm} onSave={handleSaveCompany} />;
      default:
        return null;
    }
  };

  return (
    <div>
      <PageHeader title="Settings" subtitle="Manage your profile and system configurations" />
      
      <Row gutter={24}>
        <Col xs={24} md={5}>
          <Card 
            bodyStyle={{ padding: '12px' }}
            style={{ borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}
          >
            <div style={{ padding: '4px 8px', marginBottom: 8 }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--hrms-text-muted)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                Settings Menu
              </span>
            </div>
{SETTINGS_MENU.map((item) => {
                const isActive = activeSection === item.key;
                return (
                  <div
                    key={item.key}
                    onClick={() => setActiveSection(item.key)}
                    style={{
                      padding: '14px 16px',
                      cursor: 'pointer',
                      borderRadius: 8,
                      marginBottom: 4,
                      background: isActive ? '#f5f5f5' : 'transparent',
                      color: 'var(--hrms-text-primary)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      transition: 'all 0.15s ease',
                      fontWeight: isActive ? 600 : 400,
                      fontSize: 14,
                      borderLeft: isActive ? '3px solid #1890ff' : '3px solid transparent',
                    }}
                  >
                    <span style={{ fontSize: 16, color: isActive ? '#1890ff' : 'inherit' }}>{item.icon}</span>
                    <span>{item.label}</span>
                  </div>
                );
              })}
          </Card>
        </Col>
        
        <Col xs={24} md={19}>
          <Card 
            bodyStyle={{ padding: 24 }}
            style={{ borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}
          >
            {renderContent()}
          </Card>
        </Col>
      </Row>

      <Modal title="Add Overtime Rule" open={otModalOpen} onCancel={() => { setOtModalOpen(false); otForm.resetFields(); }} onOk={otForm.submit} okText="Create">
        <Form form={otForm} layout="vertical" onFinish={(values) => otCreateMutation.mutate(values)}>
          <Form.Item name="name" label="Rule Name" rules={[{ required: true, message: 'Enter rule name' }]}>
            <Input placeholder="e.g. Standard OT Rule" />
          </Form.Item>
          <Form.Item name="applicableTo" label="Applicable To" rules={[{ required: true }]}>
            <Select placeholder="Select category">
              <Select.Option value="all">All</Select.Option>
              <Select.Option value="worker">Worker</Select.Option>
              <Select.Option value="office-staff">Office Staff</Select.Option>
            </Select>
          </Form.Item>
          <Row gutter={12}>
            <Col span={12}>
              <Form.Item name="maxHoursPerDay" label="Max Hours/Day" rules={[{ required: true }]}>
                <InputNumber style={{ width: '100%' }} min={0} max={24} placeholder="4" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="maxHoursPerMonth" label="Max Hours/Month" rules={[{ required: true }]}>
                <InputNumber style={{ width: '100%' }} min={0} max={744} placeholder="48" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="multiplier" label="OT Multiplier" rules={[{ required: true }]}>
            <InputNumber style={{ width: '100%' }} min={0.5} max={3} step={0.5} placeholder="1.5" />
          </Form.Item>
          <Form.Item name="isActive" label="Active" valuePropName="checked">
            <Switch defaultChecked />
          </Form.Item>
        </Form>
      </Modal>

      <Modal title="Add Weekly Off Rule" open={woModalOpen} onCancel={() => { setWoModalOpen(false); woForm.resetFields(); }} onOk={woForm.submit} okText="Create">
        <Form form={woForm} layout="vertical" onFinish={(values) => woCreateMutation.mutate({ ...values, offDays: [Number(values.offDay)] })}>
          <Form.Item name="name" label="Rule Name" rules={[{ required: true, message: 'Enter rule name' }]}>
            <Input placeholder="e.g. Standard Weekly Off" />
          </Form.Item>
          <Form.Item name="offDay" label="Day of Week" rules={[{ required: true }]}>
            <Select placeholder="Select day">
              <Select.Option value={0}>Sunday</Select.Option>
              <Select.Option value={1}>Monday</Select.Option>
              <Select.Option value={2}>Tuesday</Select.Option>
              <Select.Option value={3}>Wednesday</Select.Option>
              <Select.Option value={4}>Thursday</Select.Option>
              <Select.Option value={5}>Friday</Select.Option>
              <Select.Option value={6}>Saturday</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="applicableTo" label="Applicable To">
            <Select placeholder="Select category">
              <Select.Option value="all">All</Select.Option>
              <Select.Option value="worker">Worker</Select.Option>
              <Select.Option value="office-staff">Office Staff</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="isActive" label="Active" valuePropName="checked">
            <Switch defaultChecked />
          </Form.Item>
        </Form>
      </Modal>

      <Modal title="Add Holiday" open={holidayModalOpen} onCancel={() => { setHolidayModalOpen(false); holidayForm.resetFields(); }} onOk={holidayForm.submit} okText="Create">
        <Form form={holidayForm} layout="vertical" onFinish={(values) => holidayCreateMutation.mutate({ 
          name: values.name,
          date: values.date.format('YYYY-MM-DD'),
          type: values.type,
          year: values.date.year(),
          isPaid: values.isPaid ?? true,
          applicableTo: 'all'
        })}>
          <Form.Item name="name" label="Holiday Name" rules={[{ required: true, message: 'Enter holiday name' }]}>
            <Input placeholder="e.g. Independence Day" />
          </Form.Item>
          <Form.Item name="date" label="Date" rules={[{ required: true }]}>
            <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
          </Form.Item>
          <Form.Item name="type" label="Type">
            <Select placeholder="Select type">
              <Select.Option value="national">National</Select.Option>
              <Select.Option value="festival">Festival</Select.Option>
              <Select.Option value="company">Company</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="isPaid" label="Paid Holiday" valuePropName="checked">
            <Switch defaultChecked />
          </Form.Item>
        </Form>
      </Modal>

      <Modal 
        title="Add Allowance" 
        open={allowanceModalOpen} 
        onCancel={() => { setAllowanceModalOpen(false); allowanceForm.resetFields(); }} 
        onOk={() => {
          allowanceForm.validateFields().then(values => {
            const current = companyForm.getFieldValue('allowanceConfig') || [];
            companyForm.setFieldValue('allowanceConfig', [...current, { ...values, key: Date.now() }]);
            setAllowanceModalOpen(false);
            allowanceForm.resetFields();
          });
        }}
        okText="Add"
      >
        <Form form={allowanceForm} layout="vertical">
          <Form.Item name="name" label="Allowance Name" rules={[{ required: true, message: 'Enter name' }]}>
            <Input placeholder="e.g. HRA, Conveyance" />
          </Form.Item>
          <Row gutter={12}>
            <Col span={12}>
              <Form.Item name="type" label="Type" rules={[{ required: true }]}>
                <Select placeholder="Select type">
                  <Select.Option value="fixed">Fixed Amount</Select.Option>
                  <Select.Option value="percentage">Percentage</Select.Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="value" label="Value" rules={[{ required: true }]}>
                <InputNumber style={{ width: '100%' }} min={0} placeholder="500 or 10" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="applicableTo" label="Applicable To">
            <Select placeholder="Select category">
              <Select.Option value="all">All</Select.Option>
              <Select.Option value="worker">Worker</Select.Option>
              <Select.Option value="office-staff">Office Staff</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="isActive" label="Active" valuePropName="checked">
            <Switch defaultChecked />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

function ProfileSection({ form }: { form: any }) {
  const [logoutLoading, setLogoutLoading] = useState(false);
  const logout = useAuthStore((state) => state.logout);
  const navigate = useNavigate();

  const handleLogoutAll = async () => {
    setLogoutLoading(true);
    try {
      await apiClient.post('/auth/logout-all-devices');
      logout();
      message.success('Logged out from all devices');
      navigate('/login');
    } catch {
      message.error('Failed to logout from all devices');
    } finally {
      setLogoutLoading(false);
    }
  };

  return (
    <div>
      <div style={{ 
        textAlign: 'center', 
        marginBottom: 32,
        padding: 24,
        background: 'linear-gradient(135deg, #f0f7ff 0%, #e6f4ff 100%)',
        borderRadius: 12,
      }}>
        <Avatar 
          size={100} 
          icon={<UserOutlined />} 
          style={{ 
            backgroundColor: 'var(--hrms-primary-color)',
            boxShadow: '0 4px 12px rgba(24, 144, 255, 0.3)',
          }} 
        />
        <div style={{ marginTop: 12 }}>
          <Upload showUploadList={false}>
            <Button type="link" icon={<PlusOutlined />}>Change Photo</Button>
          </Upload>
        </div>
      </div>
      
      <div style={{ marginBottom: 24 }}>
        <h3 style={{ 
          marginBottom: 16, 
          paddingBottom: 8, 
          borderBottom: '2px solid #f0f0f0',
          color: 'var(--hrms-text-primary)',
        }}>
          Personal Information
        </h3>
      </div>
      
      <Form form={form} layout="vertical">
        <Row gutter={20}>
          <Col span={12}>
            <Form.Item name="fullName" label="Full Name">
              <Input style={{ height: 44 }} placeholder="Your name" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="email" label="Email">
              <Input style={{ height: 44 }} placeholder="your.email@company.com" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="phone" label="Phone">
              <Input style={{ height: 44 }} placeholder="+91 9876543210" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="department" label="Department">
              <Input style={{ height: 44 }} placeholder="Your department" />
            </Form.Item>
          </Col>
          <Col span={24}>
            <Form.Item name="address" label="Address">
              <Input.TextArea rows={2} placeholder="Your address" style={{ borderRadius: 8 }} />
            </Form.Item>
          </Col>
        </Row>
        
        <div style={{ 
          margin: '32px 0 24px', 
          paddingTop: 24,
          borderTop: '1px dashed #e0e0e0',
        }}>
          <h3 style={{ 
            marginBottom: 16, 
            color: 'var(--hrms-text-primary)',
          }}>
            Change Password
          </h3>
        </div>
        
        <Row gutter={20}>
          <Col span={8}>
            <Form.Item name="currentPassword" label="Current Password">
              <Input.Password style={{ height: 44 }} placeholder="Enter current password" />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item name="newPassword" label="New Password">
              <Input.Password style={{ height: 44 }} placeholder="Enter new password" />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item name="confirmPassword" label="Confirm Password">
              <Input.Password style={{ height: 44 }} placeholder="Confirm new password" />
            </Form.Item>
          </Col>
        </Row>
        
        <div style={{ marginTop: 24, display: 'flex', gap: 12 }}>
          <Button type="primary" size="large" icon={<SaveOutlined />}>
            Save Profile
          </Button>
          <Popconfirm
            title="Logout from all devices?"
            description="This will end all active sessions on other devices."
            onConfirm={handleLogoutAll}
            okText="Yes, logout all"
            cancelText="Cancel"
          >
            <Button size="large" danger loading={logoutLoading}>
              Logout All Devices
            </Button>
          </Popconfirm>
        </div>
      </Form>
    </div>
  );
}

function CompanySection({ form, onSave }: { form: any; onSave: (values: any) => void }) {
  return (
    <Form form={form} layout="vertical" onFinish={onSave}>
      <h3 style={{ marginBottom: 16 }}>Company Information</h3>
      <Row gutter={16}>
        <Col span={12}>
          <Form.Item name={['companyInfo', 'name']} label="Company Name">
            <Input style={{ height: 40 }} />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item name={['companyInfo', 'financialYearStart']} label="Financial Year Start (Month)">
            <InputNumber style={{ width: '100%', height: 40 }} min={1} max={12} />
          </Form.Item>
        </Col>
        <Col span={24}>
          <Form.Item name={['companyInfo', 'address']} label="Address">
            <Input.TextArea rows={2} />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item name={['companyInfo', 'phone']} label="Phone">
            <Input style={{ height: 40 }} />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item name={['companyInfo', 'email']} label="Email">
            <Input style={{ height: 40 }} />
          </Form.Item>
        </Col>
      </Row>
      <Button type="primary" icon={<SaveOutlined />} htmlType="submit">
        Save Company Info
      </Button>
    </Form>
  );
}

function AuthSection({ form, onSave }: { form: any; onSave: (values: any) => void }) {
  return (
    <Form form={form} layout="vertical" onFinish={onSave}>
      <h3 style={{ marginBottom: 16 }}>Authentication Settings</h3>
      
      <div style={{ marginBottom: 24, padding: 16, background: '#f8f9fa', borderRadius: 8 }}>
        <h4 style={{ marginBottom: 12 }}>Token Configuration</h4>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name={['authConfig', 'tokenExpiry']} label="Token Expiry">
              <Input style={{ height: 40 }} placeholder="e.g. 24h, 8h, 30m" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name={['authConfig', 'refreshTokenExpiry']} label="Refresh Token Expiry">
              <Input style={{ height: 40 }} placeholder="e.g. 7d, 30d" />
            </Form.Item>
          </Col>
        </Row>
      </div>

      <div style={{ marginBottom: 24, padding: 16, background: '#f8f9fa', borderRadius: 8 }}>
        <h4 style={{ marginBottom: 12 }}>Password Requirements</h4>
        <Row gutter={16}>
          <Col span={8}>
            <Form.Item name={['authConfig', 'passwordMinLength']} label="Minimum Length">
              <InputNumber style={{ width: '100%', height: 40 }} min={6} max={32} />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item name={['authConfig', 'passwordHistoryCount']} label="Password History (count)">
              <InputNumber style={{ width: '100%', height: 40 }} min={0} max={10} />
            </Form.Item>
          </Col>
        </Row>
        <Row gutter={16}>
          <Col span={6}>
            <Form.Item name={['authConfig', 'requireUppercase']} label="Require Uppercase" valuePropName="checked">
              <Switch />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item name={['authConfig', 'requireLowercase']} label="Require Lowercase" valuePropName="checked">
              <Switch />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item name={['authConfig', 'requireNumber']} label="Require Number" valuePropName="checked">
              <Switch />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item name={['authConfig', 'requireSpecialChar']} label="Require Special Char" valuePropName="checked">
              <Switch />
            </Form.Item>
          </Col>
        </Row>
      </div>

      <Button type="primary" icon={<SaveOutlined />} htmlType="submit">
        Save Auth Settings
      </Button>
    </Form>
  );
}

function EmailSection({ form, onSave, onTestEmail, isTesting }: { form: any; onSave: (values: any) => void; onTestEmail: (email: string) => void; isTesting: boolean }) {
  const [testEmail, setTestEmail] = useState('');

  const handleTest = () => {
    if (testEmail) {
      onTestEmail(testEmail);
    } else {
      message.warning('Please enter an email address to test');
    }
  };

  return (
    <Form form={form} layout="vertical" onFinish={onSave}>
      <h3 style={{ marginBottom: 16 }}>Email Configuration (SMTP)</h3>
      <Row gutter={16}>
        <Col span={12}>
          <Form.Item name={['emailConfig', 'host']} label="SMTP Host">
            <Input style={{ height: 40 }} placeholder="smtp.gmail.com" />
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item name={['emailConfig', 'port']} label="Port">
            <InputNumber style={{ width: '100%', height: 40 }} placeholder="587" />
          </Form.Item>
        </Col>
        <Col span={4}>
          <Form.Item name={['emailConfig', 'secure']} label="SSL" valuePropName="checked">
            <Switch />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item name={['emailConfig', 'user']} label="Username">
            <Input style={{ height: 40 }} placeholder="email@example.com" />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item name={['emailConfig', 'password']} label="Password">
            <Input.Password style={{ height: 40 }} placeholder="App password or password" />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item name={['emailConfig', 'fromEmail']} label="From Email">
            <Input style={{ height: 40 }} placeholder="noreply@company.com" />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item name={['emailConfig', 'fromName']} label="From Name">
            <Input style={{ height: 40 }} placeholder="Orian System" />
          </Form.Item>
        </Col>
      </Row>

      <div style={{ marginTop: 16, padding: 16, background: '#f0f5ff', borderRadius: 8, border: '1px solid #d9e6ff' }}>
        <h4 style={{ marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
          <BellOutlined /> Notification Preferences
        </h4>
        <Row gutter={16}>
          <Col span={24}>
            <Form.Item name={['notificationConfig', 'emailEnabled']} valuePropName="checked" style={{ marginBottom: 12 }}>
              <Switch /> <span style={{ marginLeft: 8, fontWeight: 500 }}>Enable email notifications</span>
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name={['notificationConfig', 'notifyOnPayrollRun']} valuePropName="checked" style={{ marginBottom: 8 }}>
              <Switch /> <span style={{ marginLeft: 8, fontSize: 13 }}>Notify on payroll run/finalize</span>
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name={['notificationConfig', 'notifyOnEmployeeAdded']} valuePropName="checked" style={{ marginBottom: 8 }}>
              <Switch /> <span style={{ marginLeft: 8, fontSize: 13 }}>Notify on new employee added</span>
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name={['notificationConfig', 'notifyOnUserCreated']} valuePropName="checked" style={{ marginBottom: 8 }}>
              <Switch /> <span style={{ marginLeft: 8, fontSize: 13 }}>Notify on new user created</span>
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name={['notificationConfig', 'notifyOnAttendanceEntry']} valuePropName="checked" style={{ marginBottom: 8 }}>
              <Switch /> <span style={{ marginLeft: 8, fontSize: 13 }}>Notify on attendance entry</span>
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name={['notificationConfig', 'notifyOnLeaveApplied']} valuePropName="checked" style={{ marginBottom: 8 }}>
              <Switch /> <span style={{ marginLeft: 8, fontSize: 13 }}>Notify on leave applied</span>
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name={['notificationConfig', 'notifyOnLeaveApproved']} valuePropName="checked" style={{ marginBottom: 8 }}>
              <Switch /> <span style={{ marginLeft: 8, fontSize: 13 }}>Notify on leave approved</span>
            </Form.Item>
          </Col>
        </Row>
      </div>

      <div style={{ marginTop: 24, padding: 16, background: '#f5f5f5', borderRadius: 8 }}>
        <h4 style={{ marginBottom: 12 }}>Test Email Configuration</h4>
        <Row gutter={12} align="middle">
          <Col flex="auto">
            <Input
              placeholder="Enter email address to test"
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
              style={{ height: 40 }}
            />
          </Col>
          <Col>
            <Button
              type="primary"
              icon={<MailOutlined />}
              onClick={handleTest}
              loading={isTesting}
            >
              Send Test
            </Button>
          </Col>
        </Row>
      </div>

      <Button type="primary" icon={<SaveOutlined />} htmlType="submit" style={{ marginTop: 16 }}>
        Save Email Settings
      </Button>
    </Form>
  );
}

function PayrollSection({ form, onSave }: { form: any; onSave: (values: any) => void }) {
  return (
    <Form form={form} layout="vertical" onFinish={onSave}>
      <h3 style={{ marginBottom: 16 }}>Payroll Configuration</h3>
      <Row gutter={16}>
        <Col span={8}>
          <Form.Item name={['payrollConfig', 'overtimeBase']} label="Overtime Base">
            <Select 
              style={{ width: '100%', height: 40 }}
              options={[
                { label: 'Basic Salary', value: 'basic' },
                { label: 'Basic + Allowances', value: 'basicPlusAllowances' },
              ]} 
            />
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item name={['payrollConfig', 'overtimeMultiplier']} label="Overtime Multiplier">
            <InputNumber style={{ width: '100%', height: 40 }} min={0} step={0.5} />
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item name={['payrollConfig', 'halfDayDeductionPercent']} label="Half Day Deduction (%)">
            <InputNumber style={{ width: '100%', height: 40 }} min={0} max={100} />
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item name={['payrollConfig', 'lateDeductionPerDay']} label="Late Deduction/Day (₹)">
            <InputNumber style={{ width: '100%', height: 40 }} min={0} />
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item name={['payrollConfig', 'defaultWorkingDays']} label="Default Working Days">
            <InputNumber style={{ width: '100%', height: 40 }} min={1} max={31} />
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item name={['payrollConfig', 'standardHoursPerDay']} label="Standard Hours/Day">
            <InputNumber style={{ width: '100%', height: 40 }} min={1} max={24} />
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item name={['payrollConfig', 'paidWeeklyOff']} label="Paid Weekly Off" valuePropName="checked">
            <Switch />
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item name={['payrollConfig', 'paidHolidays']} label="Paid Holidays" valuePropName="checked">
            <Switch />
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item name={['payrollConfig', 'payrollLockDays']} label="Payroll Lock Days">
            <InputNumber style={{ width: '100%', height: 40 }} min={0} />
          </Form.Item>
        </Col>
      </Row>

      <div style={{ marginTop: 24, padding: 16, background: '#fff7e6', borderRadius: 8, border: '1px solid #ffd591' }}>
        <h4 style={{ marginBottom: 12 }}>OT Tricks (Cost Optimization)</h4>
        <p style={{ fontSize: 12, color: '#888', marginBottom: 12 }}>
          When enabled, these rules optimize payroll costs by rounding OT and applying multiplier to basic only.
        </p>
        <Row gutter={16}>
          <Col span={8}>
            <Form.Item name={['payrollConfig', 'otTricksEnabled']} label="Enable OT Tricks" valuePropName="checked">
              <Switch />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item name={['payrollConfig', 'otRoundingMinutes']} label="OT Round Unit (Min)">
              <InputNumber style={{ width: '100%', height: 40 }} min={1} max={480} />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item name={['payrollConfig', 'otRoundingMethod']} label="OT Round Method">
              <Select style={{ width: '100%', height: 40 }} options={[
                { label: 'Floor (down)', value: 'floor' },
                { label: 'Ceil (up)', value: 'ceil' },
                { label: 'Round', value: 'round' },
              ]} />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item name={['payrollConfig', 'otMultiplierBasicOnly']} label="OT Multiplier Basic Only" valuePropName="checked">
              <Switch />
            </Form.Item>
          </Col>
        </Row>
      </div>

      <Button type="primary" icon={<SaveOutlined />} htmlType="submit" style={{ marginTop: 16 }}>
        Save Payroll Settings
      </Button>
    </Form>
  );
}

function AttendanceSection({ form, onSave }: { form: any; onSave: (values: any) => void }) {
  return (
    <Form form={form} layout="vertical" onFinish={onSave}>
      <h3 style={{ marginBottom: 16 }}>Attendance Configuration</h3>

      <h4 style={{ margin: '16px 0 8px' }}>General Rules</h4>
      <Row gutter={16}>
        <Col span={8}>
          <Form.Item name={['attendanceConfig', 'pastEntryLimitDays']} label="Past Entry Limit (Days)">
            <InputNumber style={{ width: '100%', height: 40 }} min={0} />
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item name={['attendanceConfig', 'lateMarkEnabled']} label="Late Mark Enabled" valuePropName="checked">
            <Switch />
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item name={['attendanceConfig', 'lateMarkThresholdMinutes']} label="Late Threshold (Min)">
            <InputNumber style={{ width: '100%', height: 40 }} min={0} />
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item name={['attendanceConfig', 'lateToHalfDayAfterOccurrences']} label="Late to Half Day After">
            <InputNumber style={{ width: '100%', height: 40 }} min={0} />
          </Form.Item>
        </Col>
      </Row>

      <h4 style={{ margin: '16px 0 8px' }}>Shift & Grace Rules</h4>
      <Row gutter={16}>
        <Col span={6}>
          <Form.Item name={['attendanceConfig', 'shiftStartTime']} label="Shift Start Time">
            <Input style={{ width: '100%', height: 40 }} placeholder="09:00" />
          </Form.Item>
        </Col>
        <Col span={6}>
          <Form.Item name={['attendanceConfig', 'shiftEndTime']} label="Shift End Time">
            <Input style={{ width: '100%', height: 40 }} placeholder="18:00" />
          </Form.Item>
        </Col>
        <Col span={6}>
          <Form.Item name={['attendanceConfig', 'gracePeriodMinutes']} label="Grace Period (Min)">
            <InputNumber style={{ width: '100%', height: 40 }} min={0} />
          </Form.Item>
        </Col>
        <Col span={6}>
          <Form.Item name={['attendanceConfig', 'lateMarkAsAbsent']} label="Late = Absent" valuePropName="checked">
            <Switch />
          </Form.Item>
        </Col>
        <Col span={6}>
          <Form.Item name={['attendanceConfig', 'lateTreatWorkAsOT']} label="Late Work = OT" valuePropName="checked">
            <Switch />
          </Form.Item>
        </Col>
      </Row>

      <div style={{ marginTop: 24, padding: 16, background: '#f0f5ff', borderRadius: 8, border: '1px solid #d9e6ff' }}>
        <h4 style={{ marginBottom: 12 }}>QR Kiosk System</h4>
        <Row gutter={16}>
          <Col span={6}>
            <Form.Item name={['attendanceConfig', 'qrKioskEnabled']} label="Enable QR Kiosk" valuePropName="checked">
              <Switch />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item name={['attendanceConfig', 'qrRefreshIntervalSeconds']} label="QR Refresh Interval (s)">
              <InputNumber style={{ width: '100%', height: 40 }} min={5} max={60} />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item name={['attendanceConfig', 'qrTokenExpirySeconds']} label="QR Token Expiry (s)">
              <InputNumber style={{ width: '100%', height: 40 }} min={5} max={60} />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item name={['attendanceConfig', 'totpEnabled']} label="Enable TOTP" valuePropName="checked">
              <Switch />
            </Form.Item>
          </Col>
        </Row>
        <Row gutter={16}>
          <Col span={6}>
            <Form.Item name={['attendanceConfig', 'geofencingEnabled']} label="Enable Geofencing" valuePropName="checked">
              <Switch />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item name={['attendanceConfig', 'geofenceLatitude']} label="Gate Latitude">
              <InputNumber style={{ width: '100%', height: 40 }} min={-90} max={90} step={0.0001} />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item name={['attendanceConfig', 'geofenceLongitude']} label="Gate Longitude">
              <InputNumber style={{ width: '100%', height: 40 }} min={-180} max={180} step={0.0001} />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item name={['attendanceConfig', 'geofenceRadiusMeters']} label="Geofence Radius (m)">
              <InputNumber style={{ width: '100%', height: 40 }} min={10} max={1000} />
            </Form.Item>
          </Col>
        </Row>
        <Row gutter={16}>
          <Col span={6}>
            <Form.Item name={['attendanceConfig', 'supervisorOverrideEnabled']} label="Supervisor Override" valuePropName="checked">
              <Switch />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item name={['attendanceConfig', 'deviceBindingEnabled']} label="Device Binding" valuePropName="checked">
              <Switch />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item name={['attendanceConfig', 'maxDevicesPerEmployee']} label="Max Devices / Employee">
              <InputNumber style={{ width: '100%', height: 40 }} min={1} max={5} />
            </Form.Item>
          </Col>
        </Row>
      </div>

      <Button type="primary" icon={<SaveOutlined />} htmlType="submit" style={{ marginTop: 16 }}>
        Save Attendance Settings
      </Button>
    </Form>
  );
}

function AllowancesSection({ form, onAdd }: { form: any; onAdd: () => void }) {
  const allowances = form.getFieldValue('allowanceConfig') || [];
  
  const handleDeleteAllowance = (index: number) => {
    const current = form.getFieldValue('allowanceConfig') || [];
    form.setFieldValue('allowanceConfig', current.filter((_: any, i: number) => i !== index));
  };

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ margin: 0 }}>Allowances</h3>
        <Button type="primary" icon={<PlusOutlined />} onClick={onAdd}>
          Add Allowance
        </Button>
      </div>
      
      <Table
        size="small"
        dataSource={allowances}
        rowKey="key"
        pagination={false}
        locale={{ emptyText: 'No allowances configured. Add one to get started.' }}
        columns={[
          { title: 'Name', dataIndex: 'name', key: 'name' },
          { title: 'Type', dataIndex: 'type', key: 'type', render: (t: string) => <Tag>{t}</Tag> },
          { title: 'Value', dataIndex: 'value', key: 'value', render: (v: number, r: any) => r.type === 'percentage' ? `${v}%` : `₹${v}` },
          { title: 'Applicable To', dataIndex: 'applicableTo', key: 'applicableTo', render: (v: string) => v === 'all' ? 'All' : v },
          { title: 'Status', dataIndex: 'isActive', key: 'isActive', render: (s: boolean) => <Tag color={s ? 'green' : 'red'}>{s ? 'Active' : 'Inactive'}</Tag> },
          { title: '', key: 'actions', width: 60, render: (_: any, _r: any, index: number) => (
            <Popconfirm title="Delete this allowance?" onConfirm={() => handleDeleteAllowance(index)}>
              <Button type="text" size="small" danger icon={<DeleteOutlined />} />
            </Popconfirm>
          )},
        ]}
      />
    </div>
  );
}

function OvertimeSection({ onAdd }: { onAdd: () => void }) {
  const { data, isLoading } = useQuery({
    queryKey: ['overtime-rules'],
    queryFn: () => overtimeRuleService.list({ limit: 100 }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => overtimeRuleService.delete(id),
    onSuccess: () => { message.success('Rule deleted'); },
    onError: (err: any) => message.error(err?.response?.data?.message || 'Failed to delete'),
  });

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ margin: 0 }}>Overtime Rules</h3>
        <Button type="primary" icon={<PlusOutlined />} onClick={onAdd}>
          Add Rule
        </Button>
      </div>
      <Table
        size="small"
        dataSource={data?.data}
        loading={isLoading}
        rowKey="id"
        pagination={false}
        locale={{ emptyText: 'No overtime rules configured.' }}
        columns={[
          { title: 'Name', dataIndex: 'name', key: 'name' },
          { title: 'Category', dataIndex: 'applicableTo', key: 'applicableTo', render: (c: string) => <Tag color={c === 'worker' ? 'blue' : c === 'office-staff' ? 'purple' : 'green'}>{c === 'all' ? 'All' : c}</Tag> },
          { title: 'Max Hours/Day', dataIndex: 'maxHoursPerDay', key: 'maxHoursPerDay', render: (v: number) => `${v}h` },
          { title: 'Max Hours/Month', dataIndex: 'maxHoursPerMonth', key: 'maxHoursPerMonth', render: (v: number) => `${v}h` },
          { title: 'Multiplier', dataIndex: 'multiplier', key: 'multiplier' },
          { title: 'Status', dataIndex: 'isActive', key: 'isActive', render: (s: boolean) => <Tag color={s ? 'green' : 'red'}>{s ? 'Active' : 'Inactive'}</Tag> },
          { title: '', key: 'actions', width: 60, render: (_: any, r: OvertimeRule) => (
            <Popconfirm title="Delete this rule?" onConfirm={() => deleteMutation.mutate(r.id)}>
              <Button type="text" size="small" danger icon={<DeleteOutlined />} />
            </Popconfirm>
          )},
        ]}
      />
    </div>
  );
}

function WeeklyOffSection({ onAdd }: { onAdd: () => void }) {
  const { data, isLoading } = useQuery({
    queryKey: ['weekly-off-rules'],
    queryFn: () => weeklyOffRuleService.list({ limit: 100 }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => weeklyOffRuleService.delete(id),
    onSuccess: () => { message.success('Rule deleted'); },
    onError: (err: any) => message.error(err?.response?.data?.message || 'Failed to delete'),
  });

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ margin: 0 }}>Weekly Off Rules</h3>
        <Button type="primary" icon={<PlusOutlined />} onClick={onAdd}>
          Add Rule
        </Button>
      </div>
      <Table
        size="small"
        dataSource={data?.data}
        loading={isLoading}
        rowKey="id"
        pagination={false}
        locale={{ emptyText: 'No weekly off rules configured.' }}
        columns={[
          { title: 'Name', dataIndex: 'name', key: 'name' },
          { title: 'Category', dataIndex: 'category', key: 'category', render: (c: string) => <Tag>{c === 'all' ? 'All' : c === 'worker' ? 'Worker' : 'Office Staff'}</Tag> },
          { title: 'Off Days', dataIndex: 'offDays', key: 'offDays', render: (days: number[]) => days?.map(d => ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][d]).join(', ') },
          { title: 'Status', dataIndex: 'isActive', key: 'isActive', render: (s: boolean) => <Tag color={s ? 'green' : 'red'}>{s ? 'Active' : 'Inactive'}</Tag> },
          { title: '', key: 'actions', width: 60, render: (_: any, r: WeeklyOffRule) => (
            <Popconfirm title="Delete this rule?" onConfirm={() => deleteMutation.mutate(r.id)}>
              <Button type="text" size="small" danger icon={<DeleteOutlined />} />
            </Popconfirm>
          )},
        ]}
      />
    </div>
  );
}

function LeaveSection({ form, onSave }: { form: any; onSave: (values: any) => void }) {
  return (
    <Form form={form} layout="vertical" onFinish={onSave}>
      <h3 style={{ marginBottom: 16 }}>Leave Configuration</h3>
      <Row gutter={16}>
        <Col span={8}>
          <Form.Item name={['leaveConfig', 'financialYearStartMonth']} label="FY Start Month">
            <InputNumber style={{ width: '100%', height: 40 }} min={1} max={12} />
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item name={['leaveConfig', 'accrualDayOfMonth']} label="Accrual Day of Month">
            <InputNumber style={{ width: '100%', height: 40 }} min={1} max={28} />
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item name={['leaveConfig', 'defaultApprovalLevels']} label="Default Approval Levels">
            <InputNumber style={{ width: '100%', height: 40 }} min={1} max={3} />
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item name={['leaveConfig', 'allowCancelAfterApproval']} label="Cancel After Approval" valuePropName="checked">
            <Switch />
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item name={['leaveConfig', 'cancelAfterApprovalDaysLimit']} label="Cancel After Days Limit">
            <InputNumber style={{ width: '100%', height: 40 }} min={0} />
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item name={['leaveConfig', 'deductionPriority']} label="Deduction Priority">
            <Select options={[
              { label: 'Unpaid First', value: 'unpaid-first' },
              { label: 'Pro-rata', value: 'pro-rata' },
            ]} />
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item name={['leaveConfig', 'allowanceProRateMode']} label="Allowance Pro-rate Mode">
            <Select options={[
              { label: 'None', value: 'none' },
              { label: 'Days', value: 'days' },
              { label: 'Calendar', value: 'calendar' },
            ]} />
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item name={['leaveConfig', 'deductionProRateMode']} label="Deduction Pro-rate Mode">
            <Select options={[
              { label: 'None', value: 'none' },
              { label: 'Days', value: 'days' },
              { label: 'Calendar', value: 'calendar' },
            ]} />
          </Form.Item>
        </Col>
      </Row>
      <Button type="primary" icon={<SaveOutlined />} htmlType="submit">
        Save Leave Settings
      </Button>
    </Form>
  );
}

function CodeConfigSection({ form, onSave }: { form: any; onSave: (values: any) => void }) {
  const [activeTab, setActiveTab] = useState<'employee' | 'department'>('employee');

  return (
    <Form form={form} layout="vertical" onFinish={onSave}>
      <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
        <Button
          type={activeTab === 'employee' ? 'primary' : 'default'}
          onClick={() => setActiveTab('employee')}
          icon={<IdcardOutlined />}
        >
          Employee Code
        </Button>
        <Button
          type={activeTab === 'department' ? 'primary' : 'default'}
          onClick={() => setActiveTab('department')}
          icon={<BankOutlined />}
        >
          Department Code
        </Button>
      </div>

      {activeTab === 'employee' && (
        <>
          <h3 style={{ marginBottom: 16 }}>Employee Code Configuration</h3>
          <p style={{ marginBottom: 20, color: '#666', fontSize: 13 }}>
            Configure how employee codes are auto-generated when adding new employees.
          </p>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name={['employeeCodeConfig', 'prefix']} label="Code Prefix">
                <Input style={{ height: 40 }} placeholder="e.g. EMP" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name={['employeeCodeConfig', 'startNumber']} label="Starting Number">
                <InputNumber style={{ width: '100%', height: 40 }} min={1} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name={['employeeCodeConfig', 'padding']} label="Zero Padding">
                <InputNumber style={{ width: '100%', height: 40 }} min={0} max={10} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name={['employeeCodeConfig', 'isAutoGenerate']} label="Auto Generate" valuePropName="checked">
                <Switch />
              </Form.Item>
            </Col>
          </Row>
          <div style={{ marginTop: 12, padding: 12, background: '#f6f8fa', borderRadius: 8, fontSize: 13, color: '#555' }}>
            Preview: <Tag color="blue">{form.getFieldValue(['employeeCodeConfig', 'prefix']) || 'EMP'}{String(form.getFieldValue(['employeeCodeConfig', 'startNumber']) || 1).padStart(form.getFieldValue(['employeeCodeConfig', 'padding']) || 3, '0')}</Tag>
          </div>
        </>
      )}

      {activeTab === 'department' && (
        <>
          <h3 style={{ marginBottom: 16 }}>Department Code Configuration</h3>
          <p style={{ marginBottom: 20, color: '#666', fontSize: 13 }}>
            Configure how department codes are auto-generated when creating new departments.
          </p>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name={['departmentCodeConfig', 'prefix']} label="Code Prefix">
                <Input style={{ height: 40 }} placeholder="e.g. DEPT" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name={['departmentCodeConfig', 'startNumber']} label="Starting Number">
                <InputNumber style={{ width: '100%', height: 40 }} min={1} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name={['departmentCodeConfig', 'padding']} label="Zero Padding">
                <InputNumber style={{ width: '100%', height: 40 }} min={0} max={10} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name={['departmentCodeConfig', 'isAutoGenerate']} label="Auto Generate" valuePropName="checked">
                <Switch />
              </Form.Item>
            </Col>
          </Row>
          <div style={{ marginTop: 12, padding: 12, background: '#f6f8fa', borderRadius: 8, fontSize: 13, color: '#555' }}>
            Preview: <Tag color="blue">{form.getFieldValue(['departmentCodeConfig', 'prefix']) || 'DEPT'}{String(form.getFieldValue(['departmentCodeConfig', 'startNumber']) || 1).padStart(form.getFieldValue(['departmentCodeConfig', 'padding']) || 3, '0')}</Tag>
          </div>
        </>
      )}

      <Button type="primary" icon={<SaveOutlined />} htmlType="submit" style={{ marginTop: 16 }}>
        Save Code Settings
      </Button>
    </Form>
  );
}

function HolidaysSection({ onAdd }: { onAdd: () => void }) {
  const { data, isLoading } = useQuery({
    queryKey: ['holidays'],
    queryFn: () => holidayService.list({ limit: 100 }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => holidayService.delete(id),
    onSuccess: () => { message.success('Holiday deleted'); },
    onError: (err: any) => message.error(err?.response?.data?.message || 'Failed to delete'),
  });

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ margin: 0 }}>Holidays</h3>
        <Button type="primary" icon={<PlusOutlined />} onClick={onAdd}>
          Add Holiday
        </Button>
      </div>
      <Table
        size="small"
        dataSource={data?.data}
        loading={isLoading}
        rowKey="id"
        pagination={false}
        locale={{ emptyText: 'No holidays configured.' }}
        columns={[
          { title: 'Date', dataIndex: 'date', key: 'date', render: (d: string) => d ? dayjs(d).format('DD MMM YYYY') : '-' },
          { title: 'Name', dataIndex: 'name', key: 'name' },
          { title: 'Type', dataIndex: 'category', key: 'category', render: (t: string) => <Tag color={t === 'national' ? 'red' : t === 'festival' ? 'purple' : 'orange'}>{t}</Tag> },
          { title: 'Year', dataIndex: 'year', key: 'year' },
          { title: 'Paid', dataIndex: 'isPaid', key: 'isPaid', render: (s: boolean) => s ? 'Yes' : 'No' },
          { title: '', key: 'actions', width: 60, render: (_: any, r: Holiday) => (
            <Popconfirm title="Delete this holiday?" onConfirm={() => deleteMutation.mutate(r.id)}>
              <Button type="text" size="small" danger icon={<DeleteOutlined />} />
            </Popconfirm>
          )},
        ]}
      />
    </div>
  );
}


import { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import {
  Card, Button, Form, Input, InputNumber, Select, Switch,
  message, Typography, Alert, Modal,
  Row, Col, DatePicker,
} from 'antd';
import {
  SafetyCertificateOutlined, UserOutlined, ClockCircleOutlined,
  BankOutlined, MailOutlined, DollarOutlined, CalendarOutlined,
  GiftOutlined, CodeOutlined, BarChartOutlined, BellOutlined,
  SwapOutlined, LaptopOutlined, FolderOutlined,
} from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { settingsService, CompanySettings } from '../services/settingsService';
import { employeeService } from '../../employees/services/employeeService';
import { totpService } from '../../attendance-qr/services/attendanceQRService';
import { overtimeRuleService } from '../../overtime-rules/services/overtimeRuleService';
import { weeklyOffRuleService } from '../../weekly-off-rules/services/weeklyOffRuleService';
import { holidayService } from '../../holidays/services/holidayService';
import { PageHeader } from '../../../core/components/PageHeader';
import QRCode from 'qrcode-generator';
import {
  ProfileSection, CompanySection, AuthSection, EmailSection, PayrollSection,
  AttendanceSection, AllowancesSection, OvertimeSection, WeeklyOffSection,
  HolidaysSection, CodeConfigSection, LeaveSection, ReportsSection,
  LoanConfigSection, StatutoryConfigSection, EssSection, AnnouncementSection,
  ShiftSwapSection, AssetSection, DocumentSection,
} from '../sections';

const { Text, Paragraph } = Typography;

const SETTINGS_MENU = [
  { key: 'profile', label: 'My Profile', icon: <UserOutlined />, group: 'profile' },
  { key: 'company', label: 'Company', icon: <BankOutlined />, group: 'organization' },
  { key: 'auth', label: 'Auth Settings', icon: <UserOutlined />, group: 'organization' },
  { key: 'email', label: 'Email Settings', icon: <MailOutlined />, group: 'organization' },
  { key: 'payroll', label: 'Payroll', icon: <DollarOutlined />, group: 'hr' },
  { key: 'attendance', label: 'Attendance', icon: <CalendarOutlined />, group: 'hr' },
  { key: 'allowances', label: 'Allowances', icon: <GiftOutlined />, group: 'hr' },
  { key: 'overtime', label: 'Overtime Rules', icon: <ClockCircleOutlined />, group: 'hr' },
  { key: 'weeklyoff', label: 'Weekly Off', icon: <CalendarOutlined />, group: 'hr' },
  { key: 'holidays', label: 'Holidays', icon: <GiftOutlined />, group: 'hr' },
  { key: 'codeConfig', label: 'Code Configuration', icon: <CodeOutlined />, group: 'system' },
  { key: 'leave', label: 'Leave Config', icon: <CalendarOutlined />, group: 'system' },
  { key: 'reports', label: 'Reports', icon: <BarChartOutlined />, group: 'system' },
  { key: 'loans', label: 'Loans', icon: <DollarOutlined />, group: 'system' },
  { key: 'statutory', label: 'Statutory', icon: <SafetyCertificateOutlined />, group: 'system' },
  { key: 'ess', label: 'Employee Self-Service', icon: <UserOutlined />, group: 'features' },
  { key: 'announcements', label: 'Announcements', icon: <BellOutlined />, group: 'features' },
  { key: 'shiftSwap', label: 'Shift Swap', icon: <SwapOutlined />, group: 'features' },
  { key: 'assets', label: 'Asset Management', icon: <LaptopOutlined />, group: 'features' },
  { key: 'documents', label: 'Document Repository', icon: <FolderOutlined />, group: 'features' },
  { key: 'totp', label: 'TOTP Enrollment', icon: <SafetyCertificateOutlined />, group: 'security' },
];

const MENU_GROUPS = [
  { key: 'profile', label: '' },
  { key: 'organization', label: 'Organization' },
  { key: 'hr', label: 'HR & Payroll' },
  { key: 'system', label: 'System' },
  { key: 'features', label: 'Features' },
  { key: 'security', label: 'Security' },
];

export function SettingsPage() {
  const location = useLocation();
  const [activeSection, setActiveSection] = useState((location.state as any)?.section || 'profile');
  const initialSectionRef = useRef((location.state as any)?.section);
  const [otModalOpen, setOtModalOpen] = useState(false);
  const [woModalOpen, setWoModalOpen] = useState(false);
  const [holidayModalOpen, setHolidayModalOpen] = useState(false);
  const [allowanceModalOpen, setAllowanceModalOpen] = useState(false);
  const [totpEmployee, setTotpEmployee] = useState<string>('');
  const [totpQrUrl, setTotpQrUrl] = useState<string>('');
  const [totpSecret, setTotpSecret] = useState<string>('');
  const [totpLoading, setTotpLoading] = useState(false);
  const totpCanvasRef = useRef<HTMLCanvasElement>(null);

  const drawTotpQR = useCallback(() => {
    if (!totpCanvasRef.current || !totpQrUrl) return;
    const qr = QRCode(0, 'M');
    qr.addData(totpQrUrl);
    qr.make();
    const ctx = totpCanvasRef.current.getContext('2d');
    if (!ctx) return;
    const cellSize = 6;
    const margin = 4;
    const size = qr.getModuleCount();
    const canvasSize = (size + margin * 2) * cellSize;
    totpCanvasRef.current.width = canvasSize;
    totpCanvasRef.current.height = canvasSize;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvasSize, canvasSize);
    ctx.fillStyle = '#1a1a2e';
    for (let row = 0; row < size; row++) {
      for (let col = 0; col < size; col++) {
        if (qr.isDark(row, col)) {
          ctx.fillRect((col + margin) * cellSize, (row + margin) * cellSize, cellSize, cellSize);
        }
      }
    }
  }, [totpQrUrl]);
  const [otForm] = Form.useForm();
  const [woForm] = Form.useForm();
  const [holidayForm] = Form.useForm();
  const [allowanceForm] = Form.useForm();
  const [profileForm] = Form.useForm();
  const [companyForm] = Form.useForm();
  const queryClient = useQueryClient();

  const { data } = useQuery({
    queryKey: ['settings'],
    queryFn: () => settingsService.get(),
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

  const handleSaveCompany = (values: any) => {
    updateMutation.mutate(values);
  };

  const updateMutation = useMutation({
    mutationFn: (payload: Partial<CompanySettings>) => settingsService.update(payload),
    onSuccess: () => {
      message.success('Settings saved successfully');
      queryClient.invalidateQueries({ queryKey: ['settings'] });
    },
    onError: (err: any) => message.error(err?.response?.data?.message || 'Failed to save settings'),
  });

  const otCreateMutation = useMutation({
    mutationFn: (payload: any) => overtimeRuleService.create(payload),
    onSuccess: () => { message.success('Rule created'); setOtModalOpen(false); otForm.resetFields(); queryClient.invalidateQueries({ queryKey: ['overtime-rules'] }); },
    onError: (err: any) => message.error(err?.response?.data?.message || 'Failed to create'),
  });

  const woCreateMutation = useMutation({
    mutationFn: (payload: any) => weeklyOffRuleService.create(payload),
    onSuccess: () => { message.success('Rule created'); setWoModalOpen(false); woForm.resetFields(); queryClient.invalidateQueries({ queryKey: ['weekly-off-rules'] }); },
    onError: (err: any) => message.error(err?.response?.data?.message || 'Failed to create'),
  });

  const holidayCreateMutation = useMutation({
    mutationFn: (payload: any) => holidayService.create(payload),
    onSuccess: () => { message.success('Holiday created'); setHolidayModalOpen(false); holidayForm.resetFields(); queryClient.invalidateQueries({ queryKey: ['holidays'] }); },
    onError: (err: any) => message.error(err?.response?.data?.message || 'Failed to create'),
  });

  useEffect(() => {
    if (!data?.data) return;
    try {
      companyForm.setFieldsValue(data.data);
    } catch { /* form not yet mounted */ }
  }, [data, companyForm]);

  useEffect(() => {
    if (initialSectionRef.current === 'totp') {
      setActiveSection('totp');
      initialSectionRef.current = null;
    }
  }, []);

  const { data: employees } = useQuery({
    queryKey: ['employees'],
    queryFn: () => employeeService.list({ limit: 500, status: 'active' }),
    enabled: true,
  });

  useEffect(() => {
    if (totpQrUrl) setTimeout(drawTotpQR, 100);
  }, [totpQrUrl, drawTotpQR]);

  const handleTotpEnroll = async () => {
    if (!totpEmployee) { message.warning('Select an employee'); return; }
    setTotpLoading(true);
    try {
      const res = await totpService.enroll(totpEmployee);
      setTotpQrUrl(res.data.qrUrl);
      setTotpSecret(res.data.secret);
      message.success('TOTP enrolled successfully');
    } catch (err: any) {
      message.error(err?.response?.data?.message || 'Failed to enroll TOTP');
    } finally {
      setTotpLoading(false);
    }
  };

  const handleTotpDisable = async () => {
    if (!totpEmployee) return;
    try {
      await totpService.disable(totpEmployee);
      setTotpQrUrl('');
      setTotpSecret('');
      message.success('TOTP disabled');
    } catch (err: any) {
      message.error(err?.response?.data?.message || 'Failed to disable');
    }
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
      case 'reports':
        return <ReportsSection form={companyForm} />;
      case 'loans':
        return <LoanConfigSection form={companyForm} onSave={handleSaveCompany} />;
      case 'ess':
        return <EssSection form={companyForm} onSave={handleSaveCompany} />;
      case 'announcements':
        return <AnnouncementSection form={companyForm} onSave={handleSaveCompany} />;
      case 'shiftSwap':
        return <ShiftSwapSection form={companyForm} onSave={handleSaveCompany} />;
      case 'assets':
        return <AssetSection form={companyForm} onSave={handleSaveCompany} />;
      case 'documents':
        return <DocumentSection form={companyForm} onSave={handleSaveCompany} />;
      case 'statutory':
        return <StatutoryConfigSection form={companyForm} onSave={handleSaveCompany} />;
      case 'totp':
        return (
          <Card title="TOTP Enrollment" style={{ borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
            <div style={{ paddingTop: 8 }}>
              <div style={{ marginBottom: 24 }}>
                <div style={{ marginBottom: 8, fontWeight: 500 }}>Select Employee</div>
                <Select
                  showSearch
                  style={{ width: '100%' }}
                  placeholder="Search employee by name or code"
                  value={totpEmployee || undefined}
                  onChange={(val) => { setTotpEmployee(val); setTotpQrUrl(''); setTotpSecret(''); }}
                  filterOption={(input, option) =>
                    (option?.label as string || '').toLowerCase().includes(input.toLowerCase())
                  }
                  options={(employees?.data || []).map((emp: any) => ({
                    label: `${emp.fullName} (${emp.employeeCode})`,
                    value: emp.id,
                  }))}
                  size="large"
                />
              </div>

              <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
                <Button type="primary" icon={<SafetyCertificateOutlined />} onClick={handleTotpEnroll} loading={totpLoading} size="large">
                  Generate TOTP Secret
                </Button>
                <Button danger icon={<SafetyCertificateOutlined />} onClick={handleTotpDisable} size="large">
                  Disable TOTP
                </Button>
              </div>

              {totpQrUrl && (
                <Alert
                  type="success"
                  showIcon
                  message="TOTP Enrolled Successfully"
                  description={
                    <div>
                      <Paragraph>
                        Ask the employee to scan this QR code with their authenticator app
                        (Google Authenticator, Microsoft Authenticator, or Authy).
                      </Paragraph>
                      <div style={{ textAlign: 'center', margin: '16px 0' }}>
                        <canvas ref={totpCanvasRef} style={{ display: 'inline-block', borderRadius: 8 }} />
                      </div>
                      <Paragraph copyable={{ text: totpQrUrl }}>
                        <Text type="secondary" style={{ fontSize: 12, wordBreak: 'break-all' }}>
                          OTPAuth URI: {totpQrUrl}
                        </Text>
                      </Paragraph>
                      <Paragraph copyable={{ text: totpSecret }}>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          Secret: {totpSecret}
                        </Text>
                      </Paragraph>
                    </div>
                  }
                />
              )}

              {!totpQrUrl && (
                <div style={{ textAlign: 'center', padding: 40, color: '#888' }}>
                  <SafetyCertificateOutlined style={{ fontSize: 48, marginBottom: 12 }} />
                  <div>Select an employee and click "Generate TOTP Secret" to enroll</div>
                </div>
              )}
            </div>
          </Card>
        );
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
            styles={{ body: { padding: '8px 0' } }}
            style={{ borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.06)', position: 'sticky', top: 24, maxHeight: 'calc(100vh - 120px)', overflow: 'auto' }}
          >
            <div style={{ padding: '4px 12px', marginBottom: 4 }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--hrms-text-muted)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                Settings
              </span>
            </div>
            {MENU_GROUPS.map((group) => {
              const items = SETTINGS_MENU.filter((item) => item.group === group.key);
              if (items.length === 0) return null;
              return (
                <div key={group.key} style={{ marginBottom: 4 }}>
                  {group.label && (
                    <div style={{ padding: '8px 12px 4px', fontSize: 11, fontWeight: 600, color: '#999', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                      {group.label}
                    </div>
                  )}
                  {items.map((item) => {
                    const isActive = activeSection === item.key;
                    return (
                      <div
                        key={item.key}
                        onClick={() => setActiveSection(item.key)}
                        style={{
                          padding: '10px 12px',
                          cursor: 'pointer',
                          borderRadius: 6,
                          margin: '0 6px',
                          background: isActive ? '#f5f5f5' : 'transparent',
                          color: 'var(--hrms-text-primary)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 10,
                          transition: 'all 0.15s ease',
                          fontWeight: isActive ? 600 : 400,
                          fontSize: 13,
                          borderLeft: isActive ? '3px solid #1890ff' : '3px solid transparent',
                        }}
                      >
                        <span style={{ fontSize: 14, color: isActive ? '#1890ff' : 'inherit' }}>{item.icon}</span>
                        <span>{item.label}</span>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </Card>
        </Col>

        <Col xs={24} md={19}>
          <Card
            styles={{ body: { padding: 24 } }}
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
          <Form.Item name="category" label="Applicable To">
            <Select placeholder="Select category">
              <Select.Option value="all">All</Select.Option>
              <Select.Option value="worker">Worker</Select.Option>
              <Select.Option value="office-staff">Office Staff</Select.Option>
            </Select>
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

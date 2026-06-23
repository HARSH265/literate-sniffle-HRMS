import { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import {
  Card, Form, Row, Col, message,
} from 'antd';
import {
  SafetyCertificateOutlined, UserOutlined, ClockCircleOutlined,
  BankOutlined, MailOutlined, DollarOutlined, CalendarOutlined,
  GiftOutlined, CodeOutlined, BarChartOutlined, BellOutlined,
  SwapOutlined, LaptopOutlined, FolderOutlined, LockOutlined,
  KeyOutlined,
} from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { settingsService, CompanySettings } from '../services/settingsService';
import type { LocationState } from '../../../types/shared';
import { employeeService } from '../../employees/services/employeeService';
import { overtimeRuleService } from '../../overtime-rules/services/overtimeRuleService';
import { weeklyOffRuleService } from '../../weekly-off-rules/services/weeklyOffRuleService';
import { holidayService } from '../../holidays/services/holidayService';
import { PageHeader } from '../../../core/components/PageHeader';
import { PageContainer } from '../../../core/components/PageContainer';
import {
  ProfileSection, CompanySection, AuthSection, EmailSection, PayrollSection,
  AttendanceSection, AllowancesSection, OvertimeSection, WeeklyOffSection,
  HolidaysSection, CodeConfigSection, LeaveSection, ReportsSection,
  LoanConfigSection, StatutoryConfigSection, EssSection, AnnouncementSection,
  ShiftSwapSection, AssetSection, DocumentSection, ComponentMasterSection, SalaryStructureSection, PermissionsSection,
  ApiKeysSection,
} from '../sections';
import { TotpSection } from '../sections/TotpSection';
import { SettingsModals } from '../components/SettingsModals';

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
  { key: 'componentMaster', label: 'Component Master', icon: <CodeOutlined />, group: 'system' },
  { key: 'leave', label: 'Leave Config', icon: <CalendarOutlined />, group: 'system' },
  { key: 'reports', label: 'Reports', icon: <BarChartOutlined />, group: 'system' },
  { key: 'loans', label: 'Loans', icon: <DollarOutlined />, group: 'system' },
  { key: 'salaryStructure', label: 'Salary Structures', icon: <CodeOutlined />, group: 'system' },
  { key: 'statutory', label: 'Statutory', icon: <SafetyCertificateOutlined />, group: 'system' },
  { key: 'ess', label: 'Employee Self-Service', icon: <UserOutlined />, group: 'features' },
  { key: 'announcements', label: 'Announcements', icon: <BellOutlined />, group: 'features' },
  { key: 'shiftSwap', label: 'Shift Swap', icon: <SwapOutlined />, group: 'features' },
  { key: 'assets', label: 'Asset Management', icon: <LaptopOutlined />, group: 'features' },
  { key: 'documents', label: 'Document Repository', icon: <FolderOutlined />, group: 'features' },
  { key: 'totp', label: 'TOTP Enrollment', icon: <SafetyCertificateOutlined />, group: 'security' },
  { key: 'permissions', label: 'Role Permissions', icon: <LockOutlined />, group: 'security' },
  { key: 'apiKeys', label: 'API Keys', icon: <KeyOutlined />, group: 'security' },
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
  const [activeSection, setActiveSection] = useState((location.state as LocationState)?.section || 'profile');
  const initialSectionRef = useRef((location.state as LocationState)?.section);
  const [otModalOpen, setOtModalOpen] = useState(false);
  const [woModalOpen, setWoModalOpen] = useState(false);
  const [holidayModalOpen, setHolidayModalOpen] = useState(false);
  const [allowanceModalOpen, setAllowanceModalOpen] = useState(false);

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
      initialSectionRef.current = undefined;
    }
  }, []);

  const { data: employees } = useQuery({
    queryKey: ['employees'],
    queryFn: () => employeeService.list({ limit: 500, status: 'active' }),
    enabled: true,
  });

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
case 'componentMaster':
  return <ComponentMasterSection />;
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
case 'salaryStructure':
  return <SalaryStructureSection />;
case 'statutory':
  return <StatutoryConfigSection form={companyForm} onSave={handleSaveCompany} />;
      case 'totp':
        return <TotpSection employees={employees?.data || []} />;
      case 'permissions':
        return <PermissionsSection form={companyForm} onSave={handleSaveCompany} />;
      case 'apiKeys':
        return <ApiKeysSection />;
      default:
        return null;
    }
  };

  return (
    <PageContainer>
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
                    <div style={{ padding: '8px 12px 4px', fontSize: 11, fontWeight: 600, color: 'var(--hrms-text-muted)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
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
                          background: isActive ? 'var(--hrms-bg)' : 'transparent',
                          color: 'var(--hrms-text-primary)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 10,
                          transition: 'all 0.15s ease',
                          fontWeight: isActive ? 600 : 400,
                          fontSize: 13,
                          borderLeft: isActive ? '3px solid var(--hrms-info)' : '3px solid transparent',
                        }}
                      >
                        <span style={{ fontSize: 14, color: isActive ? 'var(--hrms-info)' : 'inherit' }}>{item.icon}</span>
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

      <SettingsModals
        otModalOpen={otModalOpen} setOtModalOpen={setOtModalOpen}
        woModalOpen={woModalOpen} setWoModalOpen={setWoModalOpen}
        holidayModalOpen={holidayModalOpen} setHolidayModalOpen={setHolidayModalOpen}
        allowanceModalOpen={allowanceModalOpen} setAllowanceModalOpen={setAllowanceModalOpen}
        otForm={otForm} woForm={woForm} holidayForm={holidayForm}
        allowanceForm={allowanceForm} companyForm={companyForm}
        otCreateMutation={otCreateMutation} woCreateMutation={woCreateMutation}
        holidayCreateMutation={holidayCreateMutation}
      />
    </div>
    </PageContainer>
  );
}

import { useState, useEffect } from 'react';
import { PageHeader } from '../../../core/components/PageHeader';
import { Tabs, Form, Input, InputNumber, Switch, Button, Card, Row, Col, message, Table, Tag, Select } from 'antd';
import { SaveOutlined } from '@ant-design/icons';
import { settingsService, CompanySettings } from '../services/settingsService';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const SectionCard = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <Card size="small" title={title} style={{ marginBottom: 16 }}>
    {children}
  </Card>
);

export function SettingsPage() {
  const [form] = Form.useForm();
  const [activeTab, setActiveTab] = useState('company');
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

  useEffect(() => {
    if (data?.data) {
      form.setFieldsValue(data.data);
    }
  }, [data, form]);

  const handleSave = (values: any) => {
    updateMutation.mutate(values);
  };

  const CompanyTab = () => (
    <SectionCard title="Company Information">
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
    </SectionCard>
  );

  const PayrollTab = () => (
    <>
      <SectionCard title="Payroll Configuration">
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
      </SectionCard>
    </>
  );

  const AttendanceTab = () => (
    <SectionCard title="Attendance Configuration">
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
    </SectionCard>
  );

  const AllowancesTab = () => {
    const allowances = form.getFieldValue('allowanceConfig') || [];
    
    return (
      <SectionCard title="Allowances">
        <Table
          size="small"
          dataSource={allowances}
          rowKey="name"
          pagination={false}
          columns={[
            { title: 'Name', dataIndex: 'name', key: 'name' },
            { title: 'Type', dataIndex: 'type', key: 'type', render: (t: string) => <Tag>{t}</Tag> },
            { title: 'Value', dataIndex: 'value', key: 'value', render: (v: number, r: any) => r.type === 'percentage' ? `${v}%` : `₹${v}` },
            { title: 'Applicable To', dataIndex: 'applicableTo', key: 'applicableTo' },
            { title: 'Status', dataIndex: 'isActive', key: 'isActive', render: (s: boolean) => <Tag color={s ? 'green' : 'red'}>{s ? 'Active' : 'Inactive'}</Tag> },
          ]}
        />
      </SectionCard>
    );
  };

  const tabItems = [
    { key: 'company', label: 'Company', children: <CompanyTab /> },
    { key: 'payroll', label: 'Payroll', children: <PayrollTab /> },
    { key: 'attendance', label: 'Attendance', children: <AttendanceTab /> },
    { key: 'allowances', label: 'Allowances', children: <AllowancesTab /> },
  ];

  return (
    <div style={{ padding: '0 4px' }}>
      <PageHeader title="Settings" subtitle="Configure company and payroll settings" />
      
      <Form form={form} layout="vertical" onFinish={handleSave}>
        <Tabs 
          activeKey={activeTab} 
          onChange={setActiveTab} 
          items={tabItems}
        />
        
        <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--hrms-border-light)' }}>
          <Button 
            type="primary" 
            htmlType="submit" 
            icon={<SaveOutlined />} 
            loading={updateMutation.isPending}
          >
            Save Settings
          </Button>
        </div>
      </Form>
    </div>
  );
}
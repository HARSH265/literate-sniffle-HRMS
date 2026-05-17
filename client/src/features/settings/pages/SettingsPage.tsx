import { useState, useEffect } from 'react';
import { PageHeader } from '../../../core/components/PageHeader';
import { Tabs, Form, Input, InputNumber, Switch, Button, Card, Row, Col, message, Table, Tag, Select, Popconfirm, Modal, DatePicker } from 'antd';
import { SaveOutlined, PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import { settingsService, CompanySettings } from '../services/settingsService';
import { overtimeRuleService, OvertimeRule, CreateOvertimeRule } from '../../overtime-rules/services/overtimeRuleService';
import { weeklyOffRuleService, WeeklyOffRule, CreateWeeklyOffRule } from '../../weekly-off-rules/services/weeklyOffRuleService';
import { holidayService, Holiday, CreateHoliday } from '../../holidays/services/holidayService';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';

const SectionCard = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <Card size="small" title={title} style={{ marginBottom: 16 }}>
    {children}
  </Card>
);

export function SettingsPage() {
  const [form] = Form.useForm();
  const [activeTab, setActiveTab] = useState('company');
  const [otModalOpen, setOtModalOpen] = useState(false);
  const [woModalOpen, setWoModalOpen] = useState(false);
  const [holidayModalOpen, setHolidayModalOpen] = useState(false);
  const [allowanceModalOpen, setAllowanceModalOpen] = useState(false);
  const [otForm] = Form.useForm();
  const [woForm] = Form.useForm();
  const [holidayForm] = Form.useForm();
  const [allowanceForm] = Form.useForm();
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
    
    const handleAddAllowance = (values: any) => {
      const current = form.getFieldValue('allowanceConfig') || [];
      form.setFieldValue('allowanceConfig', [...current, { ...values, key: Date.now() }]);
      setAllowanceModalOpen(false);
      allowanceForm.resetFields();
    };

    const handleDeleteAllowance = (key: number) => {
      const current = form.getFieldValue('allowanceConfig') || [];
      form.setFieldValue('allowanceConfig', current.filter((_: any, i: number) => i !== key));
    };

    return (
      <SectionCard title="Allowances">
        <div style={{ marginBottom: 16 }}>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setAllowanceModalOpen(true)}>
            Add Allowance
          </Button>
        </div>
        <Table
          size="small"
          dataSource={allowances}
          rowKey="key"
          pagination={false}
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

        <Modal title="Add Allowance" open={allowanceModalOpen} onCancel={() => { setAllowanceModalOpen(false); allowanceForm.resetFields(); }} onOk={allowanceForm.submit} okText="Add">
          <Form form={allowanceForm} layout="vertical" onFinish={handleAddAllowance}>
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
      </SectionCard>
    );
  };

  const OvertimeRulesTab = () => {
    const { data, isLoading } = useQuery({
      queryKey: ['overtime-rules'],
      queryFn: () => overtimeRuleService.list({ limit: 100 }),
    });

    const deleteMutation = useMutation({
      mutationFn: (id: string) => overtimeRuleService.delete(id),
      onSuccess: () => { message.success('Rule deleted'); queryClient.invalidateQueries({ queryKey: ['overtime-rules'] }); },
      onError: (err: any) => message.error(err?.response?.data?.message || 'Failed to delete'),
    });

    return (
      <SectionCard title="Overtime Rules">
        <div style={{ marginBottom: 16 }}>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setOtModalOpen(true)}>
            Add Rule
          </Button>
        </div>
        <Table
          size="small"
          dataSource={data?.data}
          loading={isLoading}
          rowKey="id"
          pagination={false}
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
      </SectionCard>
    );
  };

  const WeeklyOffTab = () => {
    const { data, isLoading } = useQuery({
      queryKey: ['weekly-off-rules'],
      queryFn: () => weeklyOffRuleService.list({ limit: 100 }),
    });

    const deleteMutation = useMutation({
      mutationFn: (id: string) => weeklyOffRuleService.delete(id),
      onSuccess: () => { message.success('Rule deleted'); queryClient.invalidateQueries({ queryKey: ['weekly-off-rules'] }); },
      onError: (err: any) => message.error(err?.response?.data?.message || 'Failed to delete'),
    });

    return (
      <SectionCard title="Weekly Off Rules">
        <div style={{ marginBottom: 16 }}>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setWoModalOpen(true)}>
            Add Rule
          </Button>
        </div>
        <Table
          size="small"
          dataSource={data?.data}
          loading={isLoading}
          rowKey="id"
          pagination={false}
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
      </SectionCard>
    );
  };

  const HolidaysTab = () => {
    const { data, isLoading } = useQuery({
      queryKey: ['holidays'],
      queryFn: () => holidayService.list({ limit: 100 }),
    });

    const deleteMutation = useMutation({
      mutationFn: (id: string) => holidayService.delete(id),
      onSuccess: () => { message.success('Holiday deleted'); queryClient.invalidateQueries({ queryKey: ['holidays'] }); },
      onError: (err: any) => message.error(err?.response?.data?.message || 'Failed to delete'),
    });

    return (
      <SectionCard title="Holidays">
        <div style={{ marginBottom: 16 }}>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setHolidayModalOpen(true)}>
            Add Holiday
          </Button>
        </div>
        <Table
          size="small"
          dataSource={data?.data}
          loading={isLoading}
          rowKey="id"
          pagination={false}
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
      </SectionCard>
    );
  };

  const tabItems = [
    { key: 'company', label: 'Company', children: <CompanyTab /> },
    { key: 'payroll', label: 'Payroll', children: <PayrollTab /> },
    { key: 'attendance', label: 'Attendance', children: <AttendanceTab /> },
    { key: 'allowances', label: 'Allowances', children: <AllowancesTab /> },
    { key: 'overtime', label: 'Overtime Rules', children: <OvertimeRulesTab /> },
    { key: 'weeklyoff', label: 'Weekly Off', children: <WeeklyOffTab /> },
    { key: 'holidays', label: 'Holidays', children: <HolidaysTab /> },
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
        
        {!['overtime', 'weeklyoff', 'holidays', 'allowances'].includes(activeTab) && (
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
        )}
      </Form>

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
    </div>
  );
}
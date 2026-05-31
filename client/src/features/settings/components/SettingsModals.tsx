import { Modal, Form, Input, InputNumber, Select, Switch, Row, Col, DatePicker } from 'antd';
import type { FormInstance } from 'antd/es/form';

interface SettingsModalsProps {
  otModalOpen: boolean;
  setOtModalOpen: (open: boolean) => void;
  woModalOpen: boolean;
  setWoModalOpen: (open: boolean) => void;
  holidayModalOpen: boolean;
  setHolidayModalOpen: (open: boolean) => void;
  allowanceModalOpen: boolean;
  setAllowanceModalOpen: (open: boolean) => void;
  otForm: FormInstance;
  woForm: FormInstance;
  holidayForm: FormInstance;
  allowanceForm: FormInstance;
  companyForm: FormInstance;
  otCreateMutation: { mutate: (values: any) => void; isPending: boolean };
  woCreateMutation: { mutate: (values: any) => void; isPending: boolean };
  holidayCreateMutation: { mutate: (values: any) => void; isPending: boolean };
}

export function SettingsModals({
  otModalOpen, setOtModalOpen,
  woModalOpen, setWoModalOpen,
  holidayModalOpen, setHolidayModalOpen,
  allowanceModalOpen, setAllowanceModalOpen,
  otForm, woForm, holidayForm, allowanceForm, companyForm,
  otCreateMutation, woCreateMutation, holidayCreateMutation,
}: SettingsModalsProps) {
  return (
    <>
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
    </>
  );
}

import { Card, Form, Switch, InputNumber } from 'antd';

interface EssSectionProps {
  form: any;
  onSave: (values: any) => void;
}

export function EssSection({ form, onSave }: EssSectionProps) {
  return (
    <Card title="Employee Self-Service Configuration" style={{ borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
      <Form
        form={form}
        layout="vertical"
        onValuesChange={() => {
          setTimeout(() => {
            form.validateFields().then(() => {
              const values = form.getFieldsValue();
              onSave({ employeeSelfService: values.employeeSelfService });
            }).catch(() => {});
          }, 100);
        }}
      >
        <Form.Item
          name={['employeeSelfService', 'essEnabled']}
          label="Enable Employee Self-Service"
          valuePropName="checked"
        >
          <Switch />
        </Form.Item>

        <Form.Item
          name={['employeeSelfService', 'allowPhoneUpdate']}
          label="Allow Phone Number Update"
          valuePropName="checked"
        >
          <Switch />
        </Form.Item>

        <Form.Item
          name={['employeeSelfService', 'allowAddressUpdate']}
          label="Allow Address Update"
          valuePropName="checked"
        >
          <Switch />
        </Form.Item>

        <Form.Item
          name={['employeeSelfService', 'allowBankUpdate']}
          label="Allow Bank Details Update"
          valuePropName="checked"
        >
          <Switch />
        </Form.Item>

        <Form.Item
          name={['employeeSelfService', 'allowEmergencyContactUpdate']}
          label="Allow Emergency Contact Update"
          valuePropName="checked"
        >
          <Switch />
        </Form.Item>

        <Form.Item
          name={['employeeSelfService', 'changeRequiresApproval']}
          label="Require Approval for Changes"
          valuePropName="checked"
        >
          <Switch />
        </Form.Item>

        <Form.Item
          name={['employeeSelfService', 'maxChangesPerMonth']}
          label="Max Changes Per Month"
        >
          <InputNumber min={1} max={50} style={{ width: 200 }} />
        </Form.Item>
      </Form>
    </Card>
  );
}

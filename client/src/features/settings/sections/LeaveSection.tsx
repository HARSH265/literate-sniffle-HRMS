import { Form, InputNumber, Select, Switch, Button, Row, Col } from 'antd';
import { SaveOutlined } from '@ant-design/icons';

import { Form, InputNumber, Select, Switch, Button, Row, Col } from 'antd';
import { SaveOutlined, SettingOutlined, DollarOutlined } from '@ant-design/icons';
import { LeaveTypesSection } from './LeaveTypesSection';

export function LeaveSection({ form, onSave }: { form: any; onSave: (values: any) => void }) {
  const [activeTab, setActiveTab] = useState<'config' | 'types'>('config');

  return (
    <div>
      <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
        <Button type={activeTab === 'config' ? 'primary' : 'default'} onClick={() => setActiveTab('config')} icon={<SettingOutlined />}>
          Leave Configuration
        </Button>
        <Button type={activeTab === 'types' ? 'primary' : 'default'} onClick={() => setActiveTab('types')} icon={<DollarOutlined />}>
          Leave Types
        </Button>
      </div>

      {activeTab === 'config' && (
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
      )}
      
      {activeTab === 'types' && <LeaveTypesSection />}
    </div>
  );
}

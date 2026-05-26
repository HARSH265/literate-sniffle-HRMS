import { useState } from 'react';
import { Form, InputNumber, Select, Button, Row, Col } from 'antd';
import { SaveOutlined, SettingOutlined, DollarOutlined } from '@ant-design/icons';
import { LoanTypesSection } from './LoanTypesSection';

export function LoanConfigSection({ form, onSave }: { form: any; onSave: (values: any) => void }) {
  const [activeTab, setActiveTab] = useState<'config' | 'types'>('config');

  return (
    <div>
      <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
        <Button type={activeTab === 'config' ? 'primary' : 'default'} onClick={() => setActiveTab('config')} icon={<SettingOutlined />}>
          Loan Configuration
        </Button>
        <Button type={activeTab === 'types' ? 'primary' : 'default'} onClick={() => setActiveTab('types')} icon={<DollarOutlined />}>
          Loan Types
        </Button>
      </div>

      {activeTab === 'config' && (
        <Form form={form} layout="vertical" onFinish={onSave}>
          <h3 style={{ marginBottom: 16 }}>Loan Configuration</h3>
          <p style={{ marginBottom: 20, color: '#666', fontSize: 13 }}>
            Configure default loan rules for the organization.
          </p>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name={['loanConfig', 'defaultApprovalLevels']} label="Default Approval Levels">
                <InputNumber style={{ width: '100%', height: 40 }} min={1} max={3} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name={['loanConfig', 'maxLoanPercentageOfSalary']} label="Max Loan % of Salary">
                <InputNumber style={{ width: '100%', height: 40 }} min={1} max={100} addonAfter="%" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name={['loanConfig', 'deductionPriority']} label="EMI Deduction Priority">
                <Select options={[
                  { label: 'Before Tax', value: 'before-tax' },
                  { label: 'After Tax', value: 'after-tax' },
                ]} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name={['loanConfig', 'minRepaymentPeriodMonths']} label="Min Repayment Period (months)">
                <InputNumber style={{ width: '100%', height: 40 }} min={1} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name={['loanConfig', 'maxRepaymentPeriodMonths']} label="Max Repayment Period (months)">
                <InputNumber style={{ width: '100%', height: 40 }} min={1} max={120} />
              </Form.Item>
            </Col>
          </Row>
          <Button type="primary" icon={<SaveOutlined />} htmlType="submit" style={{ marginTop: 16 }}>
            Save Loan Settings
          </Button>
        </Form>
      )}

      {activeTab === 'types' && <LoanTypesSection />}
    </div>
  );
}

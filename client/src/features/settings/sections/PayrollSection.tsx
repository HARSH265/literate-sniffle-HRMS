import { Form, InputNumber, Select, Switch, Button, Row, Col } from 'antd';
import { SaveOutlined } from '@ant-design/icons';

export function PayrollSection({ form, onSave }: { form: any; onSave: (values: any) => void }) {
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

       {/* Advanced Payroll Settings */}
       <div style={{ marginTop: 24, padding: 16, background: '#f0f5ff', borderRadius: 8, border: '1px solid #91d5ff' }}>
         <h4 style={{ marginBottom: 12 }}>Advanced Payroll Settings</h4>
         <Row gutter={16}>
           <Col span={8}>
             <Form.Item name={['payrollConfig', 'perDayCalcMethod']} label="Per Day Calc Method">
               <Select style={{ width: '100%', height: 40 }} options={[
                 { label: '30', value: '30' },
                 { label: 'Actual', value: 'actual' },
                 { label: '26', value: '26' },
               ]} />
             </Form.Item>
           </Col>
           <Col span={8}>
             <Form.Item name={['payrollConfig', 'lopCalcMethod']} label="LOP Calc Method">
               <Select style={{ width: '100%', height: 40 }} options={[
                 { label: '30', value: '30' },
                 { label: 'Actual', value: 'actual' },
                 { label: '26', value: '26' },
               ]} />
             </Form.Item>
           </Col>
           <Col span={8}>
             <Form.Item name={['payrollConfig', 'roundingFinalSalary']} label="Final Salary Rounding">
               <Select style={{ width: '100%', height: 40 }} options={[
                 { label: 'Floor', value: 'floor' },
                 { label: 'Ceil', value: 'ceil' },
                 { label: 'Nearest', value: 'nearest' },
               ]} />
             </Form.Item>
           </Col>
           <Col span={8}>
             <Form.Item name={['payrollConfig', 'roundingPrecision']} label="Rounding Precision">
               <InputNumber style={{ width: '100%', height: 40 }} min={0} max={2} />
             </Form.Item>
           </Col>
           <Col span={8}>
             <Form.Item name={['payrollConfig', 'negativeNetPayAllow']} label="Allow Negative Net Pay" valuePropName="checked">
               <Switch />
             </Form.Item>
           </Col>
           <Col span={8}>
             <Form.Item name={['payrollConfig', 'arrearsAutoCalculate']} label="Arrears Auto‑Calculate" valuePropName="checked">
               <Switch />
             </Form.Item>
           </Col>
           <Col span={8}>
             <Form.Item name={['payrollConfig', 'multiBankSplit']} label="Multi‑Bank Split" valuePropName="checked">
               <Switch />
             </Form.Item>
           </Col>
           <Col span={8}>
             <Form.Item name={['payrollConfig', 'makerCheckerEnabled']} label="Maker‑Checker" valuePropName="checked">
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

import { useState } from 'react';
import { Form, Input, InputNumber, Select, Switch, Button, Row, Col, Card } from 'antd';
import { SaveOutlined, DeleteOutlined, PlusOutlined, BankOutlined, SafetyCertificateOutlined, DollarOutlined } from '@ant-design/icons';

export function StatutoryConfigSection({ form, onSave }: { form: any; onSave: (values: any) => void }) {
  const [activeTab, setActiveTab] = useState<'pf' | 'esi' | 'pt'>('pf');

  return (
    <div>
      <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
        <Button type={activeTab === 'pf' ? 'primary' : 'default'} onClick={() => setActiveTab('pf')} icon={<BankOutlined />}>PF Configuration</Button>
        <Button type={activeTab === 'esi' ? 'primary' : 'default'} onClick={() => setActiveTab('esi')} icon={<SafetyCertificateOutlined />}>ESI Configuration</Button>
        <Button type={activeTab === 'pt' ? 'primary' : 'default'} onClick={() => setActiveTab('pt')} icon={<DollarOutlined />}>Professional Tax</Button>
      </div>

      <Form form={form} layout="vertical" onFinish={onSave}>
        {activeTab === 'pf' && (
          <>
            <h3 style={{ marginBottom: 16 }}>PF Configuration</h3>
            <p style={{ marginBottom: 20, color: 'var(--hrms-text-secondary)', fontSize: 13 }}>Configure Provident Fund rates and wage ceiling for statutory compliance.</p>
            <Row gutter={16}>
              <Col span={8}>
                <Form.Item name={['statutoryConfig', 'pfEnabled']} label="Enable PF" valuePropName="checked"><Switch /></Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item name={['statutoryConfig', 'pfWageCeiling']} label="Wage Ceiling (₹)">
                  <InputNumber style={{ width: '100%', height: 40 }} min={0} />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item name={['statutoryConfig', 'pfEmployeeRate']} label="Employee PF Rate (%)">
                  <InputNumber style={{ width: '100%', height: 40 }} min={0} max={100} step={0.01} />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item name={['statutoryConfig', 'pfEmployerRate']} label="Employer PF Rate (%)">
                  <InputNumber style={{ width: '100%', height: 40 }} min={0} max={100} step={0.01} />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item name={['statutoryConfig', 'epsRate']} label="EPS Rate (%)">
                  <InputNumber style={{ width: '100%', height: 40 }} min={0} max={100} step={0.01} />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item name={['statutoryConfig', 'edliRate']} label="EDLI Rate (%)">
                  <InputNumber style={{ width: '100%', height: 40 }} min={0} max={100} step={0.01} />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item name={['statutoryConfig', 'pfAdminCharges']} label="PF Admin Charges (%)">
                  <InputNumber style={{ width: '100%', height: 40 }} min={0} max={100} step={0.01} />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item name={['statutoryConfig', 'edliAdminCharges']} label="EDLI Admin Charges (%)">
                  <InputNumber style={{ width: '100%', height: 40 }} min={0} max={100} step={0.01} />
                </Form.Item>
              </Col>
            </Row>
          </>
        )}

        {activeTab === 'esi' && (
          <>
            <h3 style={{ marginBottom: 16 }}>ESI Configuration</h3>
            <p style={{ marginBottom: 20, color: 'var(--hrms-text-secondary)', fontSize: 13 }}>Configure Employee State Insurance rates and threshold.</p>
            <Row gutter={16}>
              <Col span={8}>
                <Form.Item name={['statutoryConfig', 'esiEnabled']} label="Enable ESI" valuePropName="checked"><Switch /></Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item name={['statutoryConfig', 'esiThreshold']} label="Threshold (₹)">
                  <InputNumber style={{ width: '100%', height: 40 }} min={0} />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item name={['statutoryConfig', 'esiEmployeeRate']} label="Employee ESI Rate (%)">
                  <InputNumber style={{ width: '100%', height: 40 }} min={0} max={100} step={0.01} />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item name={['statutoryConfig', 'esiEmployerRate']} label="Employer ESI Rate (%)">
                  <InputNumber style={{ width: '100%', height: 40 }} min={0} max={100} step={0.01} />
                </Form.Item>
              </Col>
            </Row>
          </>
        )}

        {activeTab === 'pt' && (
          <>
            <h3 style={{ marginBottom: 16 }}>Professional Tax Configuration</h3>
            <p style={{ marginBottom: 20, color: 'var(--hrms-text-secondary)', fontSize: 13 }}>Configure state-wise Professional Tax slabs. Employees can be assigned a state in their profile.</p>
            <Row gutter={16}>
              <Col span={8}>
                <Form.Item name={['statutoryConfig', 'ptEnabled']} label="Enable Professional Tax" valuePropName="checked"><Switch /></Form.Item>
              </Col>
            </Row>
            <Form.List name={['statutoryConfig', 'ptSlabs']}>
              {(fields, { add, remove }) => (
                <>
                  {fields.map(({ key, name, ...rest }) => (
                    <Card key={key} size="small" title={`State #${name + 1}`} style={{ marginBottom: 12 }} extra={<Button type="text" danger icon={<DeleteOutlined />} onClick={() => remove(name)} />}>
                      <Form.Item {...rest} name={[name, 'state']} label="State" rules={[{ required: true }]}>
                        <Input style={{ width: 200 }} placeholder="e.g. Karnataka" />
                      </Form.Item>
                      <Form.List {...rest} name={[name, 'slabs']}>
                        {(slabFields, { add: addSlab, remove: removeSlab }) => (
                          <>
                            {slabFields.map(({ key: slabKey, name: slabName, ...slabRest }) => (
                              <Row key={slabKey} gutter={8} align="middle" style={{ marginBottom: 8 }}>
                                <Col span={5}>
                                  <Form.Item {...slabRest} name={[slabName, 'minSalary']} rules={[{ required: true }]} style={{ marginBottom: 0 }}>
                                    <InputNumber style={{ width: '100%' }} placeholder="Min" min={0} />
                                  </Form.Item>
                                </Col>
                                <Col span={5}>
                                  <Form.Item {...slabRest} name={[slabName, 'maxSalary']} rules={[{ required: true }]} style={{ marginBottom: 0 }}>
                                    <InputNumber style={{ width: '100%' }} placeholder="Max" min={0} />
                                  </Form.Item>
                                </Col>
                                <Col span={4}>
                                  <Form.Item {...slabRest} name={[slabName, 'amount']} rules={[{ required: true }]} style={{ marginBottom: 0 }}>
                                    <InputNumber style={{ width: '100%' }} placeholder="Amount" min={0} />
                                  </Form.Item>
                                </Col>
                                <Col span={6}>
                                  <Form.Item {...slabRest} name={[slabName, 'frequency']} rules={[{ required: true }]} style={{ marginBottom: 0 }}>
                                    <Select placeholder="Frequency">
                                      <Select.Option value="monthly">Monthly</Select.Option>
                                      <Select.Option value="half-yearly">Half-Yearly</Select.Option>
                                      <Select.Option value="yearly">Yearly</Select.Option>
                                    </Select>
                                  </Form.Item>
                                </Col>
                                <Col span={2}>
                                  <Button type="text" danger icon={<DeleteOutlined />} onClick={() => removeSlab(slabName)} />
                                </Col>
                              </Row>
                            ))}
                            <Button type="dashed" size="small" icon={<PlusOutlined />} onClick={() => addSlab({ minSalary: 0, maxSalary: 0, amount: 0, frequency: 'monthly' })} style={{ marginBottom: 12 }}>
                              Add Slab
                            </Button>
                          </>
                        )}
                      </Form.List>
                    </Card>
                  ))}
                  <Button type="dashed" icon={<PlusOutlined />} onClick={() => add({ state: '', slabs: [{ minSalary: 0, maxSalary: 999999, amount: 0, frequency: 'monthly' }] })} block>
                    Add State
                  </Button>
                </>
              )}
            </Form.List>
          </>
        )}

        <Button type="primary" icon={<SaveOutlined />} htmlType="submit" style={{ marginTop: 16 }}>
          Save Statutory Settings
        </Button>
      </Form>
    </div>
  );
}

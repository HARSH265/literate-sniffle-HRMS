import { useState } from 'react';
import { Form, Select, InputNumber, Input, Button, Row, Col, message, Descriptions } from 'antd';
import { ArrowLeftOutlined, SaveOutlined, UserOutlined, CreditCardOutlined, CalculatorOutlined } from '@ant-design/icons';
import { PageHeader } from '../../../core/components/PageHeader';
import { PageContainer } from '../../../core/components/PageContainer';
import { FormSection } from '../../../core/components/FormSection';
import { loanService, LoanType } from '../services/loanService';
import { employeeService } from '../../employees/services/employeeService';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { FORM_LAYOUT } from '../../../core/constants/employee';

const { rowGutter, inputHeight } = FORM_LAYOUT;

export function LoanApplyPage() {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const [selectedType, setSelectedType] = useState<LoanType | null>(null);
  const [calculatedEMI, setCalculatedEMI] = useState<{ emi: number; totalInterest: number; totalPayable: number } | null>(null);

  const { data: loanTypes } = useQuery({
    queryKey: ['loan-types-apply'],
    queryFn: () => loanService.getLoanTypes(),
  });

  const { data: employees } = useQuery({
    queryKey: ['employees-loan'],
    queryFn: () => employeeService.list({ limit: 1000, status: 'active' }),
  });

  const applyMutation = useMutation({
    mutationFn: (payload: { employee: string; loanType: string; amount: number; tenure: number; purpose?: string }) => loanService.applyLoan(payload),
    onSuccess: () => { message.success('Loan application submitted'); navigate('/loans'); },
    onError: (err: any) => message.error(err?.response?.data?.message || 'Failed to apply'),
  });

  const handleTypeChange = (typeId: string) => {
    const lt = loanTypes?.data?.loanTypes?.find((t: any) => t.id === typeId) || null;
    setSelectedType(lt);
    setCalculatedEMI(null);
    form.setFieldValue('amount', undefined);
    form.setFieldValue('tenure', undefined);
  };

  const calculateEMI = () => {
    const amount = form.getFieldValue('amount');
    const tenure = form.getFieldValue('tenure');
    if (!amount || !tenure || !selectedType) return;
    const monthlyRate = selectedType.interestRate / 100 / 12;
    if (monthlyRate === 0) {
      const emi = amount / tenure;
      setCalculatedEMI({ emi: Math.round(emi * 100) / 100, totalInterest: 0, totalPayable: amount });
    } else {
      const factor = Math.pow(1 + monthlyRate, tenure);
      const emi = amount * monthlyRate * factor / (factor - 1);
      setCalculatedEMI({
        emi: Math.round(emi * 100) / 100,
        totalInterest: Math.round((emi * tenure - amount) * 100) / 100,
        totalPayable: Math.round(emi * tenure * 100) / 100,
      });
    }
  };

  const handleSubmit = (values: any) => {
    applyMutation.mutate(values);
  };

  const activeTypes = loanTypes?.data?.loanTypes?.filter((t: any) => t.isActive) || [];

  return (
    <PageContainer>
      <PageHeader
        title="Apply for Loan"
        subtitle="Submit a new loan application"
        breadcrumbs={[{ label: 'Loans', path: '/loans' }, { label: 'Apply' }]}
        actions={
          <Button type="text" icon={<ArrowLeftOutlined />} onClick={() => navigate('/loans')}>
            Back to List
          </Button>
        }
      />

      <div style={{ maxWidth: 1400, margin: '0 auto' }}>
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Row gutter={24}>
            <Col xs={24} lg={16}>
              <FormSection title="Employee & Loan Type" icon={<UserOutlined />}>
                <Row gutter={rowGutter}>
                  <Col span={12}>
                    <Form.Item name="employee" label="Employee" rules={[{ required: true, message: 'Select employee' }]}>
                      <Select
                        showSearch
                        placeholder="Select employee"
                        style={{ height: inputHeight }}
                        filterOption={(input, option) => (option?.label as string || '').toLowerCase().includes(input.toLowerCase())}
                        options={employees?.data?.map((e: any) => ({ label: `${e.fullName} (${e.employeeCode})`, value: e.id })) || []}
                      />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item name="loanType" label="Loan Type" rules={[{ required: true, message: 'Select loan type' }]}>
                      <Select
                        placeholder="Select loan type"
                        style={{ height: inputHeight }}
                        onChange={handleTypeChange}
                        options={activeTypes.map((t: any) => ({ label: `${t.name} (${t.interestRate}% p.a.)`, value: t.id }))}
                      />
                    </Form.Item>
                  </Col>
                  {selectedType && (
                    <Col span={24}>
                      <Descriptions size="small" column={4} bordered style={{ marginTop: 4 }}>
                        <Descriptions.Item label="Min Amount">₹{selectedType.minAmount.toLocaleString()}</Descriptions.Item>
                        <Descriptions.Item label="Max Amount">₹{selectedType.maxAmount.toLocaleString()}</Descriptions.Item>
                        <Descriptions.Item label="Interest Rate">{selectedType.interestRate}% p.a.</Descriptions.Item>
                        <Descriptions.Item label="Max Tenure">{selectedType.maxTenure} months</Descriptions.Item>
                      </Descriptions>
                    </Col>
                  )}
                </Row>
              </FormSection>

              <FormSection title="Loan Details" icon={<CreditCardOutlined />}>
                <Row gutter={rowGutter}>
                  <Col span={8}>
                    <Form.Item name="amount" label="Loan Amount (₹)" rules={[{ required: true, message: 'Enter amount' }]}>
                      <InputNumber
                        style={{ width: '100%', height: inputHeight }}
                        min={selectedType?.minAmount || 0}
                        max={selectedType?.maxAmount || 1000000}
                        placeholder="Enter amount"
                        onChange={calculateEMI}
                        formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                      />
                    </Form.Item>
                  </Col>
                  <Col span={8}>
                    <Form.Item name="tenure" label="Tenure (months)" rules={[{ required: true, message: 'Enter tenure' }]}>
                      <InputNumber
                        style={{ width: '100%', height: inputHeight }}
                        min={selectedType?.minTenure || 1}
                        max={selectedType?.maxTenure || 120}
                        placeholder="Enter tenure"
                        onChange={calculateEMI}
                      />
                    </Form.Item>
                  </Col>
                  <Col span={8}>
                    {selectedType && (
                      <div style={{ paddingTop: 30 }}>
                        <Descriptions size="small" column={1}>
                          <Descriptions.Item label="Interest Rate">{selectedType.interestRate}% p.a.</Descriptions.Item>
                        </Descriptions>
                      </div>
                    )}
                  </Col>
                  <Col span={24}>
                    <Form.Item name="purpose" label="Purpose of Loan">
                      <Input.TextArea rows={2} placeholder="Reason for loan" />
                    </Form.Item>
                  </Col>
                </Row>
              </FormSection>
            </Col>

            <Col xs={24} lg={8}>
              <FormSection title="EMI Calculation" icon={<CalculatorOutlined />}>
                {calculatedEMI ? (
                  <Descriptions column={1} bordered size="small">
                    <Descriptions.Item label="Monthly EMI">₹{calculatedEMI.emi.toLocaleString()}</Descriptions.Item>
                    <Descriptions.Item label="Total Interest">₹{calculatedEMI.totalInterest.toLocaleString()}</Descriptions.Item>
                    <Descriptions.Item label="Total Payable">₹{calculatedEMI.totalPayable.toLocaleString()}</Descriptions.Item>
                  </Descriptions>
                ) : (
                  <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--hrms-text-secondary)' }}>
                    Select loan type, enter amount and tenure to calculate EMI
                  </div>
                )}
              </FormSection>
            </Col>
          </Row>

          <div style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: 12,
            position: 'sticky',
            bottom: 0,
            zIndex: 100,
            background: 'var(--hrms-bg)',
            padding: '16px 0',
            borderTop: '1px solid var(--hrms-border-light)',
          }}>
            <Button size="large" onClick={() => navigate('/loans')}>Cancel</Button>
            <Button type="primary" htmlType="submit" icon={<SaveOutlined />} loading={applyMutation.isPending} size="large">
              Submit Application
            </Button>
          </div>
        </Form>
      </div>
    </PageContainer>
  );
}

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Form, Select, InputNumber, Input, Button, Descriptions, Spin } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { useLoanTypes, useEssApplyLoan } from '../hooks/useEssLoans';

const cardStyle = { borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' };

export function EssLoanApplyPage() {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const { data: loanTypesData, isLoading: typesLoading } = useLoanTypes();
  const applyMutation = useEssApplyLoan();
  const [selectedType, setSelectedType] = useState<any>(null);
  const [calculatedEMI, setCalculatedEMI] = useState<{ emi: number; totalInterest: number; totalPayable: number } | null>(null);

  const loanTypes = loanTypesData?.data || [];

  const handleTypeChange = (typeId: string) => {
    const lt = loanTypes.find((t: any) => t.id === typeId) || null;
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
    applyMutation.mutate(values, {
      onSuccess: () => navigate('/ess/loans'),
    });
  };

  if (typesLoading) {
    return <Spin size="large" style={{ display: 'block', margin: '40px auto' }} />;
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <Button
          type="text"
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate('/ess/loans')}
          style={{ padding: '4px 8px' }}
        />
        <span style={{ fontSize: 18, fontWeight: 600 }}>Apply for Loan</span>
      </div>

      <Form form={form} layout="vertical" onFinish={handleSubmit}>
        <Card style={{ ...cardStyle, marginBottom: 12 }} bodyStyle={{ padding: '16px' }}>
          <Form.Item name="loanType" label="Loan Type" rules={[{ required: true, message: 'Select loan type' }]}>
            <Select
              placeholder="Select loan type"
              onChange={handleTypeChange}
              options={loanTypes.map((t: any) => ({
                label: `${t.name} (${t.interestRate}% p.a.)`,
                value: t.id,
              }))}
            />
          </Form.Item>

          {selectedType && (
            <Descriptions size="small" column={2} bordered style={{ marginBottom: 16 }}>
              <Descriptions.Item label="Min Amount">₹{selectedType.minAmount?.toLocaleString()}</Descriptions.Item>
              <Descriptions.Item label="Max Amount">₹{selectedType.maxAmount?.toLocaleString()}</Descriptions.Item>
              <Descriptions.Item label="Interest">{selectedType.interestRate}% p.a.</Descriptions.Item>
              <Descriptions.Item label="Max Tenure">{selectedType.maxTenure} mo</Descriptions.Item>
            </Descriptions>
          )}
        </Card>

        <Card style={{ ...cardStyle, marginBottom: 12 }} bodyStyle={{ padding: '16px' }}>
          <Form.Item name="amount" label="Loan Amount (₹)" rules={[{ required: true, message: 'Enter amount' }]}>
            <InputNumber
              style={{ width: '100%' }}
              min={selectedType?.minAmount || 0}
              max={selectedType?.maxAmount || 1000000}
              placeholder="Enter amount"
              onChange={calculateEMI}
              formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
            />
          </Form.Item>

          <Form.Item name="tenure" label="Tenure (months)" rules={[{ required: true, message: 'Enter tenure' }]}>
            <InputNumber
              style={{ width: '100%' }}
              min={selectedType?.minTenure || 1}
              max={selectedType?.maxTenure || 120}
              placeholder="Enter tenure"
              onChange={calculateEMI}
            />
          </Form.Item>

          <Form.Item name="purpose" label="Purpose">
            <Input.TextArea rows={2} placeholder="Reason for loan (optional)" />
          </Form.Item>
        </Card>

        {calculatedEMI && (
          <Card style={{ ...cardStyle, marginBottom: 12 }} bodyStyle={{ padding: '16px' }}>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>EMI Calculation</div>
            <Descriptions column={1} bordered size="small">
              <Descriptions.Item label="Monthly EMI">₹{calculatedEMI.emi.toLocaleString()}</Descriptions.Item>
              <Descriptions.Item label="Total Interest">₹{calculatedEMI.totalInterest.toLocaleString()}</Descriptions.Item>
              <Descriptions.Item label="Total Payable">₹{calculatedEMI.totalPayable.toLocaleString()}</Descriptions.Item>
            </Descriptions>
          </Card>
        )}

        <Button
          type="primary"
          htmlType="submit"
          block
          size="large"
          loading={applyMutation.isPending}
          style={{ borderRadius: 8, height: 44 }}
        >
          Submit Application
        </Button>
      </Form>
    </div>
  );
}

import { useState } from 'react';
import { Card, Form, Select, InputNumber, Input, Button, message, Descriptions, Divider } from 'antd';
import { PageHeader } from '../../../core/components/PageHeader';
import { loanService, LoanType } from '../services/loanService';
import { employeeService } from '../../employees/services/employeeService';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';

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
    <div>
      <PageHeader title="Apply for Loan" subtitle="Submit a new loan application" />
      <Card style={{ maxWidth: 700 }}>
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item name="employee" label="Employee" rules={[{ required: true, message: 'Select employee' }]}>
            <Select showSearch placeholder="Select employee" filterOption={(input, option) => (option?.label as string || '').toLowerCase().includes(input.toLowerCase())}
              options={employees?.data?.map((e: any) => ({ label: `${e.fullName} (${e.employeeCode})`, value: e.id })) || []} />
          </Form.Item>
          <Form.Item name="loanType" label="Loan Type" rules={[{ required: true, message: 'Select loan type' }]}>
            <Select placeholder="Select loan type" onChange={handleTypeChange}
              options={activeTypes.map((t: any) => ({ label: `${t.name} (${t.interestRate}% p.a.)`, value: t.id }))} />
          </Form.Item>
          {selectedType && (
            <Descriptions size="small" column={2} bordered style={{ marginBottom: 16 }}>
              <Descriptions.Item label="Min Amount">₹{selectedType.minAmount.toLocaleString()}</Descriptions.Item>
              <Descriptions.Item label="Max Amount">₹{selectedType.maxAmount.toLocaleString()}</Descriptions.Item>
              <Descriptions.Item label="Interest Rate">{selectedType.interestRate}% p.a.</Descriptions.Item>
              <Descriptions.Item label="Max Tenure">{selectedType.maxTenure} months</Descriptions.Item>
            </Descriptions>
          )}
          <Form.Item name="amount" label="Loan Amount" rules={[{ required: true, message: 'Enter amount' }]}>
            <InputNumber style={{ width: '100%' }} min={selectedType?.minAmount || 0} max={selectedType?.maxAmount || 1000000} placeholder="Enter amount" onChange={calculateEMI} />
          </Form.Item>
          <Form.Item name="tenure" label="Tenure (months)" rules={[{ required: true, message: 'Enter tenure' }]}>
            <InputNumber style={{ width: '100%' }} min={selectedType?.minTenure || 1} max={selectedType?.maxTenure || 120} placeholder="Enter tenure in months" onChange={calculateEMI} />
          </Form.Item>
          <Form.Item name="purpose" label="Purpose">
            <Input.TextArea rows={2} placeholder="Reason for loan" />
          </Form.Item>

          {calculatedEMI && (
            <>
              <Divider />
              <Descriptions title="Calculated EMI" column={3} bordered size="small">
                <Descriptions.Item label="Monthly EMI">₹{calculatedEMI.emi.toLocaleString()}</Descriptions.Item>
                <Descriptions.Item label="Total Interest">₹{calculatedEMI.totalInterest.toLocaleString()}</Descriptions.Item>
                <Descriptions.Item label="Total Payable">₹{calculatedEMI.totalPayable.toLocaleString()}</Descriptions.Item>
              </Descriptions>
            </>
          )}

          <Button type="primary" htmlType="submit" block size="large" style={{ marginTop: 16 }} loading={applyMutation.isPending}>
            Submit Application
          </Button>
        </Form>
      </Card>
    </div>
  );
}

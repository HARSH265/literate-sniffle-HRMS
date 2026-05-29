import { useState, useMemo } from 'react';
import { Modal, Form, Input, DatePicker, Select, Row, Col } from 'antd';
import { useQuery } from '@tanstack/react-query';
import { useCreatePerformanceCycle } from '../hooks/usePerformance';
import { employeeService } from '../../employees/services/employeeService';
import { designationService } from '../../designations/services/designationService';

const { Item } = Form;

interface CreateCycleModalProps {
  open: boolean;
  onClose: () => void;
}

export function CreateCycleModal({ open, onClose }: CreateCycleModalProps) {
  const [form] = Form.useForm();
  const [selectedDesignation, setSelectedDesignation] = useState<string | undefined>();
  const createMutation = useCreatePerformanceCycle();

  const { data: employeesData } = useQuery({
    queryKey: ['employees', 'active-list'],
    queryFn: () => employeeService.list({ limit: 500, status: 'active' }),
    staleTime: 5 * 60 * 1000,
  });

  const { data: designationsData } = useQuery({
    queryKey: ['designations', 'all'],
    queryFn: () => designationService.list({ limit: 100 }),
    staleTime: 5 * 60 * 1000,
  });

  const employees = employeesData?.data || [];
  const designations = designationsData?.data || [];

  const employeeOptions = useMemo(() => {
    return employees
      .filter((e: any) => !selectedDesignation || e.designation?.id === selectedDesignation || e.designation?._id === selectedDesignation || e.designation === selectedDesignation)
      .map((e: any) => ({
          label: `${e.fullName} (${e.employeeCode})`,
          value: e.id || e._id,
      }))
      .filter((option: { value?: string }) => Boolean(option.value));
  }, [employees, selectedDesignation]);

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      const startDate = values.startDate;
      const endDate = values.endDate;
      createMutation.mutate(
        {
          year: startDate.year(),
          quarter: Math.floor(startDate.month() / 3) + 1,
          label: values.title,
          startDate: startDate.toISOString(),
          goalDeadline: startDate.add(15, 'day').toISOString(),
          selfReviewDeadline: startDate.add(30, 'day').toISOString(),
          managerReviewDeadline: startDate.add(45, 'day').toISOString(),
          closureDate: endDate.toISOString(),
          participants: values.participantIds || [],
        },
        {
          onSuccess: () => {
            form.resetFields();
            setSelectedDesignation(undefined);
            onClose();
          },
        },
      );
    } catch {
      // validation failed
    }
  };

  const handleCancel = () => {
    form.resetFields();
    setSelectedDesignation(undefined);
    onClose();
  };

  return (
    <Modal
      title="New Performance Cycle"
      open={open}
      onOk={handleOk}
      onCancel={handleCancel}
      okText="Create Cycle"
      confirmLoading={createMutation.isPending}
      destroyOnClose
      width={600}
    >
      <Form form={form} layout="vertical" style={{ paddingTop: 8 }} initialValues={{ participantIds: [] }}>
        <Row gutter={16}>
          <Col span={12}>
            <Item name="title" label="Cycle Title" rules={[{ required: true, message: 'Required' }]}>
              <Input placeholder="e.g. Q1 2026 Review" />
            </Item>
          </Col>
          <Col span={12}>
            <Item name="endDate" label="End Date" rules={[{ required: true, message: 'Required' }]}>
              <DatePicker style={{ width: '100%' }} />
            </Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Item name="startDate" label="Start Date" rules={[{ required: true, message: 'Required' }]}>
              <DatePicker style={{ width: '100%' }} />
            </Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={8}>
            <Item name="designationId" label="Filter by Designation">
              <Select
                placeholder="Designation"
                allowClear
                showSearch
                optionFilterProp="label"
                onChange={(val) => {
                  setSelectedDesignation(val as string | undefined);
                  form.setFieldValue('participantIds', []);
                }}
                options={designations.map((d: any) => ({ label: d.name, value: d.id || d._id }))}
              />
            </Item>
          </Col>
          <Col span={16}>
            <Item name="participantIds" label="Participants">
              <Select
                mode="multiple"
                placeholder="Select employees"
                showSearch
                filterOption={(input, option) =>
                  (option?.label as string || '').toLowerCase().includes(input.toLowerCase())
                }
                options={employeeOptions}
              />
            </Item>
          </Col>
        </Row>
      </Form>
    </Modal>
  );
}

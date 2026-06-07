import { Button, Modal, Form, Select, InputNumber, DatePicker, Popconfirm, message, Row, Col, Tag, Alert } from 'antd';
import { PlusOutlined, DeleteOutlined, EditOutlined } from '@ant-design/icons';
import { DataTable } from '../../../core/components/DataTable';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { salaryStructureService, SalaryStructure, CreateSalaryStructure, UpdateSalaryStructure } from '../../salary-structures/services/salaryStructureService';
import { componentMasterService, ComponentMaster } from '../../component-master/services/componentMasterService';
import { employeeService, Employee } from '../../employees/services/employeeService';
import { useState } from 'react';

export function SalaryStructureSection() {
  const queryClient = useQueryClient();
  const { data: structuresData, isLoading: structuresLoading } = useQuery({
    queryKey: ['salaryStructures'],
    queryFn: () => salaryStructureService.list(),
  });

  const { data: componentsData, isLoading: componentsLoading } = useQuery({
    queryKey: ['componentMasters'],
    queryFn: () => componentMasterService.list({ limit: 1000 }),
  });

  const { data: employeesData, isLoading: employeesLoading } = useQuery({
    queryKey: ['employeesSimple'],
    queryFn: () => employeeService.list({ limit: 1000, status: 'active' }),
  });

  const createMutation = useMutation({
    mutationFn: (payload: CreateSalaryStructure) => salaryStructureService.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['salaryStructures'] });
      setModalOpen(false);
      form.resetFields();
      message.success('Salary Structure created');
    },
    onError: (err: any) => message.error(err?.response?.data?.message || 'Failed to create')
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateSalaryStructure }) => salaryStructureService.update(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['salaryStructures'] });
      setEditRecord(undefined);
      setModalOpen(false);
      form.resetFields();
      message.success('Salary Structure updated');
    },
    onError: (err: any) => message.error(err?.response?.data?.message || 'Failed to update')
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => salaryStructureService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['salaryStructures'] });
      message.success('Salary Structure deleted');
    },
    onError: (err: any) => message.error(err?.response?.data?.message || 'Failed to delete')
  });

  const [modalOpen, setModalOpen] = useState(false);
  const [editRecord, setEditRecord] = useState<SalaryStructure | undefined>(undefined);
  const [form] = Form.useForm();

  const openCreate = () => {
    setEditRecord(undefined);
    form.resetFields();
    setModalOpen(true);
  };

const openEdit = (record: SalaryStructure) => {
  setEditRecord(record);
  form.setFieldsValue({
    employee: record.employee,
    effectiveFrom: record.effectiveFrom ? record.effectiveFrom.slice(0, 10) : undefined,
    effectiveTo: record.effectiveTo ? record.effectiveTo.slice(0, 10) : undefined,
    components: record.components?.map(comp => ({
      component: comp.component,
      calcValue: comp.calcValue,
      monthlyAmount: comp.monthlyAmount,
    })),
  });
  setModalOpen(true);
};

  const handleFinish = (values: any) => {
    if (editRecord) {
      updateMutation.mutate({ id: editRecord.id, payload: values });
    } else {
      createMutation.mutate(values);
    }
  };

  const columns = [
    { title: 'Employee', dataIndex: 'employee', key: 'employee' },
    { title: 'Effective From', dataIndex: 'effectiveFrom', key: 'effectiveFrom' },
    { title: 'Effective To', dataIndex: 'effectiveTo', key: 'effectiveTo' },
    { title: 'Active', dataIndex: 'isCurrent', key: 'isCurrent', render: (v: boolean) => <Tag color={v ? 'green' : 'red'}>{v ? 'Current' : 'Past'}</Tag> },
    {
      title: 'Actions',
      key: 'actions',
      width: 80,
      render: (_: any, record: SalaryStructure) => (
        <span>
          <Button type="text" icon={<EditOutlined />} size="small" onClick={() => openEdit(record)} />
          <Popconfirm title="Delete this salary structure?" onConfirm={() => deleteMutation.mutate(record.id)}>
            <Button type="text" icon={<DeleteOutlined />} danger size="small" />
          </Popconfirm>
        </span>
      ),
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ margin: 0 }}>Salary Structures</h3>
        <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>Add Structure</Button>
      </div>
          <Alert
          message="Salary Structure links employees to Component Master entries, defining which components apply and for which period. These structures drive payroll calculations."
          type="info"
          showIcon
          style={{ marginBottom: 16, marginTop: 16}}
        />
      <DataTable dataSource={structuresData?.data} rowKey="id" loading={structuresLoading} columns={columns} hidePagination noCard disableRowClick />
    

      <Modal title={editRecord ? 'Edit Salary Structure' : 'Add Salary Structure'} open={modalOpen} onCancel={() => setModalOpen(false)} footer={null} destroyOnClose>
        <Form form={form} layout="vertical" onFinish={handleFinish}>
<Form.Item name="employee" label="Employee" rules={[{ required: true }]}> 
  <Select 
    placeholder="Select employee" 
    loading={employeesLoading} 
    options={employeesData?.data?.map((e: Employee) => ({
      label: `${e.fullName} (${e.employeeCode})`,
      value: e.id,
    }))}
  />
</Form.Item>
<Form.Item name="effectiveFrom" label="Effective From" rules={[{ required: true }]}> 
  <DatePicker style={{ width: '100%' }} /> 
</Form.Item>
<Form.Item name="effectiveTo" label="Effective To"> 
  <DatePicker style={{ width: '100%' }} /> 
</Form.Item>

{/* Components selection */}
<Form.List name="components">
  {(fields, { add, remove }) => (
    <>
      {fields.map(field => (
        <Row gutter={16} key={field.key} align="middle">
          <Col span={8}>
            <Form.Item
              {...field}
              name={[field.name, 'component']}
              label="Component"
              rules={[{ required: true, message: 'Select component' }]}
            >
              <Select
                placeholder="Select component"
                loading={componentsLoading}
                options={componentsData?.data?.map((c: ComponentMaster) => ({
                  label: `${c.code} – ${c.name}`,
                  value: c.id,
                }))}
              />
            </Form.Item>
          </Col>
          <Col span={5}>
            <Form.Item
              {...field}
              name={[field.name, 'calcValue']}
              label="Calc Value"
            >
              <InputNumber style={{ width: '100%' }} min={0} />
            </Form.Item>
          </Col>
          <Col span={5}>
            <Form.Item
              {...field}
              name={[field.name, 'monthlyAmount']}
              label="Monthly Amount"
            >
              <InputNumber style={{ width: '100%' }} min={0} />
            </Form.Item>
          </Col>
          <Col span={2}>
            <Button type="text" danger icon={<DeleteOutlined />} onClick={() => remove(field.name)} />
          </Col>
        </Row>
      ))}
      <Form.Item>
        <Button type="dashed" block icon={<PlusOutlined />} onClick={() => add()}>
          Add Component
        </Button>
      </Form.Item>
    </>
  )}
</Form.List>

<Form.Item>
  <Button type="primary" htmlType="submit">{editRecord ? 'Update' : 'Create'}</Button>
</Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

import { useState, useMemo } from 'react';
import { Tag, Button, Select, DatePicker, Modal, Form, Input, Switch, Row, Col } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import { useShiftSwaps, useRequestSwap } from '../hooks/useShiftSwaps';
import { shiftService } from '../../shifts/services/shiftService';
import { employeeService } from '../../employees/services/employeeService';
import { DataTable } from '../../../core/components/DataTable';
import { PageHeader } from '../../../core/components/PageHeader';
import dayjs from 'dayjs';
import type { ShiftSwapPopulated, RequestSwapPayload } from '../types/shiftSwapTypes';
import type { ColumnsType } from 'antd/es/table';

export function ShiftSwapsPage() {
  const [filters, setFilters] = useState<Record<string, any>>({});
  const [modalOpen, setModalOpen] = useState(false);
  const [form] = Form.useForm();
  const { data, isLoading } = useShiftSwaps(filters);
  const requestSwap = useRequestSwap();
  const [isRecurring, setIsRecurring] = useState(false);

  const { data: shiftsData } = useQuery({
    queryKey: ['shifts'],
    queryFn: () => shiftService.list(),
  });
  const shiftOptions = (shiftsData?.data || []).map((s: any) => ({ label: s.name, value: s.id || s._id }));

  const { data: employeesData } = useQuery({
    queryKey: ['employees', 'list', 'active'],
    queryFn: () => employeeService.list({ limit: 500, status: 'active' }),
  });
  const employeeOptions = (employeesData?.data || []).map((e: any) => ({ label: `${e.fullName} (${e.employeeCode})`, value: e.id || e._id }));

  const columns: ColumnsType<ShiftSwapPopulated> = useMemo(() => [
    { title: 'Requestor', dataIndex: ['requestor', 'fullName'], key: 'requestor', render: (_text, record) => record.requestor?.fullName || 'N/A' },
    { title: 'Target', dataIndex: ['targetEmployee', 'fullName'], key: 'targetEmployee', render: (text) => text || '—' },
    { title: 'From Shift', dataIndex: ['fromShift', 'name'], key: 'fromShift', render: (_text, record) => record.fromShift?.name || 'N/A' },
    { title: 'To Shift', dataIndex: ['toShift', 'name'], key: 'toShift', render: (_text, record) => record.toShift?.name || 'N/A' },
    { title: 'From Date', dataIndex: 'fromDate', key: 'fromDate', render: (d) => dayjs(d).format('DD/MM/YYYY') },
    { title: 'To Date', dataIndex: 'toDate', key: 'toDate', render: (d) => dayjs(d).format('DD/MM/YYYY') },
    {
      title: 'Status', dataIndex: 'status', key: 'status',
      render: (status) => {
        const colors: Record<string, string> = { pending: 'orange', approved: 'green', rejected: 'red', cancelled: 'default' };
        return <Tag color={colors[status] || 'default'}>{status?.toUpperCase()}</Tag>;
      },
    },
    {
      title: 'Type', dataIndex: 'swapType', key: 'swapType',
      render: (type) => type ? <Tag>{type}</Tag> : '—',
    },
  ], []);

  return (
    <div>
      <PageHeader title="Shift Swaps" subtitle="Manage shift swap requests" actions={
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalOpen(true)}>Request Swap</Button>
      } />
      <DataTable
        columns={columns}
        dataSource={data?.data || []}
        rowKey="_id"
        loading={isLoading}
        pageSize={20}
        toolbarLeft={
          <Select placeholder="Status" allowClear style={{ width: 140 }} onChange={(v) => setFilters(p => ({ ...p, status: v }))}>
            <Select.Option value="pending">Pending</Select.Option>
            <Select.Option value="approved">Approved</Select.Option>
            <Select.Option value="rejected">Rejected</Select.Option>
            <Select.Option value="cancelled">Cancelled</Select.Option>
          </Select>
        }
      />

      <Modal title="Request Shift Swap" open={modalOpen} width={700} onCancel={() => { setModalOpen(false); form.resetFields(); }} onOk={form.submit} okText="Submit" confirmLoading={requestSwap.isPending} destroyOnClose>
        <Form form={form} layout="vertical" onFinish={(values) => {
          const payload: RequestSwapPayload = {
            ...values,
            fromDate: values.fromDate.toISOString(),
            toDate: values.toDate.toISOString(),
          };
          if (values.recurringUntil) payload.recurringUntil = values.recurringUntil.toISOString();
          requestSwap.mutate(payload, {
            onSuccess: () => { setModalOpen(false); form.resetFields(); },
          });
        }}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="targetEmployee" label="Target Employee (optional)">
                <Select placeholder="Select employee" allowClear showSearch filterOption={(input, option) => (option?.label as string || '').toLowerCase().includes(input.toLowerCase())} options={employeeOptions} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Recurring" valuePropName="checked" style={{ marginTop: 28 }}>
                <Switch checked={isRecurring} onChange={setIsRecurring} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="fromShift" label="From Shift" rules={[{ required: true }]}>
                <Select placeholder="Select shift" options={shiftOptions} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="toShift" label="To Shift" rules={[{ required: true }]}>
                <Select placeholder="Select shift" options={shiftOptions} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="fromDate" label="From Date" rules={[{ required: true }]}>
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="toDate" label="To Date" rules={[{ required: true }]}>
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            {isRecurring && (
              <Col span={12}>
                <Form.Item name="recurringUntil" label="Recurring Until" rules={[{ required: true, message: 'Select recurring end date' }]}>
                  <DatePicker style={{ width: '100%' }} />
                </Form.Item>
              </Col>
            )}
            <Col span={24}>
              <Form.Item name="reason" label="Reason">
                <Input.TextArea rows={2} maxLength={500} />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </div>
  );
}

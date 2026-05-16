import { useState } from 'react';
import { Table, Button, Modal, Form, Input, Select, DatePicker, message, Tag, Row, Col, Tabs, Card } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { SaveOutlined, CalendarOutlined } from '@ant-design/icons';
import { PageHeader } from '../../../core/components/PageHeader';
import { attendanceService, AttendanceEntry, BulkAttendanceEntry } from '../services/attendanceService';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';

const STATUS_OPTIONS = [
  { label: 'Present', value: 'present' },
  { label: 'Absent', value: 'absent' },
  { label: 'Half Day', value: 'half-day' },
  { label: 'Leave', value: 'leave' },
  { label: 'Weekly Off', value: 'weekly-off' },
  { label: 'Holiday', value: 'holiday' },
];

const STATUS_COLORS: Record<string, string> = {
  present: 'success',
  absent: 'error',
  'half-day': 'warning',
  leave: 'processing',
  'weekly-off': 'default',
  holiday: 'purple',
};

export function AttendancePage() {
  const [form] = Form.useForm();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(dayjs());
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const queryClient = useQueryClient();

  const dateStr = selectedDate.format('YYYY-MM-DD');

  const { data, isLoading } = useQuery({
    queryKey: ['attendance', page, limit, dateStr],
    queryFn: () => attendanceService.list({ page, limit, date: dateStr }),
    refetchOnWindowFocus: false,
  });

  const { data: employeeData } = useQuery({
    queryKey: ['employees-active'],
    queryFn: () => import('../../employees/services/employeeService').then(m => m.employeeService.list({ limit: 500, status: 'active' })),
  });

  const bulkMutation = useMutation({
    mutationFn: (payload: BulkAttendanceEntry) => attendanceService.bulkCreate(payload),
    onSuccess: () => {
      message.success('Attendance saved successfully');
      setIsModalOpen(false);
      form.resetFields();
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
    },
    onError: (err: any) => message.error(err?.response?.data?.message || 'Failed to save attendance'),
  });

  const handleBulkSave = () => {
    const values = form.getFieldsValue();
    const entries = values.employees?.map((emp: any) => ({
      employee: emp.id,
      status: emp.status || 'present',
      inTime: emp.inTime,
      outTime: emp.outTime,
      overtimeHours: emp.overtimeHours || 0,
      remarks: emp.remarks,
    })) || [];

    bulkMutation.mutate({ date: dateStr, entries });
  };

  const columns: ColumnsType<AttendanceEntry> = [
    {
      title: 'Employee',
      key: 'employee',
      render: (_: unknown, record: AttendanceEntry) => (
        <div>
          <div style={{ fontWeight: 600 }}>{record.employee?.fullName || 'N/A'}</div>
          <div style={{ fontSize: 12, color: 'var(--hrms-text-muted)' }}>{record.employee?.employeeCode}</div>
        </div>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status: string) => (
        <Tag color={STATUS_COLORS[status]} style={{ textTransform: 'capitalize' }}>
          {status.replace('-', ' ')}
        </Tag>
      ),
    },
    {
      title: 'In Time',
      dataIndex: 'inTime',
      key: 'inTime',
      width: 100,
      render: (v: string) => v || '-',
    },
    {
      title: 'Out Time',
      dataIndex: 'outTime',
      key: 'outTime',
      width: 100,
      render: (v: string) => v || '-',
    },
    {
      title: 'Overtime',
      dataIndex: 'overtimeHours',
      key: 'overtimeHours',
      width: 100,
      render: (v: number) => v > 0 ? <Tag color="orange">{v}h</Tag> : '-',
    },
    {
      title: 'Remarks',
      dataIndex: 'remarks',
      key: 'remarks',
      render: (v: string) => v || '-',
    },
  ];

  return (
    <div style={{ padding: '0 4px' }}>
      <PageHeader title="Attendance" subtitle="Mark and manage employee attendance" />

      <Tabs 
        defaultActiveKey="mark" 
        items={[
          {
            key: 'mark',
            label: <span><SaveOutlined /> Mark Attendance</span>,
            children: (
              <Card>
                <Row gutter={16} style={{ marginBottom: 16 }}>
                  <Col>
                    <DatePicker 
                      value={selectedDate} 
                      onChange={(date) => setSelectedDate(date || dayjs())}
                      format="DD MMMM YYYY"
                    />
                  </Col>
                  <Col>
                    <Button type="primary" onClick={() => setIsModalOpen(true)}>
                      Mark Attendance for {selectedDate.format('DD MMM')}
                    </Button>
                  </Col>
                </Row>
              </Card>
            ),
          },
          {
            key: 'records',
            label: <span><CalendarOutlined /> Records</span>,
            children: (
              <div className="hrms-table-card">
                <div className="hrms-table-toolbar">
                  <div className="hrms-table-toolbar-left">
                    <DatePicker 
                      value={selectedDate} 
                      onChange={(date) => setSelectedDate(date || dayjs())}
                      style={{ width: 150 }}
                    />
                  </div>
                  <div className="hrms-table-toolbar-right">
                    <span style={{ fontSize: 13, color: 'var(--hrms-text-muted)' }}>
                      {data?.meta?.total ?? 0} records
                    </span>
                  </div>
                </div>
                <Table
                  columns={columns}
                  dataSource={data?.data}
                  rowKey="id"
                  loading={isLoading}
                  pagination={{
                    current: page,
                    defaultPageSize: 20,
                    pageSize: limit,
                    total: data?.meta?.total ?? 0,
                    onChange: (p, size) => { setPage(p); setLimit(size ?? 20); },
                    showSizeChanger: true,
                  }}
                />
              </div>
            ),
          },
        ]}
      />

      <Modal
        title={`Mark Attendance - ${selectedDate.format('DD MMMM YYYY')}`}
        open={isModalOpen}
        onCancel={() => { setIsModalOpen(false); form.resetFields(); }}
        width={900}
        footer={[
          <Button key="cancel" onClick={() => setIsModalOpen(false)}>Cancel</Button>,
          <Button key="save" type="primary" icon={<SaveOutlined />} onClick={handleBulkSave} loading={bulkMutation.isPending}>
            Save Attendance
          </Button>,
        ]}
      >
        <Form form={form} layout="vertical">
          <div style={{ maxHeight: 400, overflowY: 'auto' }}>
            <Table
              dataSource={employeeData?.data || []}
              rowKey="id"
              pagination={false}
              size="small"
              columns={[
                {
                  title: 'Employee',
                  dataIndex: 'fullName',
                  key: 'fullName',
                  render: (name: string, record: any) => (
                    <div>
                      <div style={{ fontWeight: 500 }}>{name}</div>
                      <div style={{ fontSize: 11, color: 'var(--hrms-text-muted)' }}>{record.employeeCode}</div>
                    </div>
                  ),
                },
                {
                  title: 'Status',
                  key: 'status',
                  width: 140,
                  render: (_: unknown, _record: any, index: number) => (
                    <Form.Item name={['employees', index, 'status']} initialValue="present" noStyle>
                      <Select 
                        options={STATUS_OPTIONS} 
                        style={{ width: '100%' }}
                        placeholder="Select status"
                      />
                    </Form.Item>
                  ),
                },
                {
                  title: 'In Time',
                  key: 'inTime',
                  width: 100,
                  render: (_: unknown, _record: any, index: number) => (
                    <Form.Item name={['employees', index, 'inTime']} noStyle>
                      <Input placeholder="09:00" style={{ width: '100%' }} />
                    </Form.Item>
                  ),
                },
                {
                  title: 'Out Time',
                  key: 'outTime',
                  width: 100,
                  render: (_: unknown, _record: any, index: number) => (
                    <Form.Item name={['employees', index, 'outTime']} noStyle>
                      <Input placeholder="18:00" style={{ width: '100%' }} />
                    </Form.Item>
                  ),
                },
                {
                  title: 'OT (hrs)',
                  key: 'overtimeHours',
                  width: 80,
                  render: (_: unknown, _record: any, index: number) => (
                    <Form.Item name={['employees', index, 'overtimeHours']} noStyle>
                      <Input type="number" min={0} placeholder="0" style={{ width: '100%' }} />
                    </Form.Item>
                  ),
                },
              ]}
            />
          </div>
        </Form>
      </Modal>
    </div>
  );
}
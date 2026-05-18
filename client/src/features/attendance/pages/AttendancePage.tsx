import { useState } from 'react';
import { Table, Button, Modal, Form, Input, Select, DatePicker, message, Tag, Row, Col, Tabs, Card, Badge } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { SaveOutlined, CalendarOutlined, LeftOutlined, RightOutlined } from '@ant-design/icons';
import { PageHeader } from '../../../core/components/PageHeader';
import { attendanceService, AttendanceEntry, MonthlyAttendanceView } from '../services/attendanceService';
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
  const [departmentFilter, setDepartmentFilter] = useState<string>('');
  const [selectedMonth, setSelectedMonth] = useState(dayjs());
  const queryClient = useQueryClient();

  const dateStr = selectedDate.format('YYYY-MM-DD');
  const monthYear = { month: selectedMonth.month() + 1, year: selectedMonth.year() };

  const { data, isLoading } = useQuery({
    queryKey: ['attendance', page, limit, dateStr, departmentFilter],
    queryFn: () => attendanceService.list({ page, limit, date: dateStr, department: departmentFilter || undefined }),
    refetchOnWindowFocus: false,
  });

  const { data: monthlyData, isLoading: monthlyLoading } = useQuery({
    queryKey: ['attendance-monthly', monthYear.month, monthYear.year, departmentFilter],
    queryFn: () => attendanceService.monthlyView({ ...monthYear, department: departmentFilter || undefined }),
    refetchOnWindowFocus: false,
  });

  const { data: employeeData } = useQuery({
    queryKey: ['employees-active-with-shift'],
    queryFn: () => import('../../employees/services/employeeService').then(m => m.employeeService.list({ limit: 500, status: 'active' })),
  });

  const { data: deptData } = useQuery({
    queryKey: ['departments-attendance'],
    queryFn: async () => {
      const module = await import('../../departments/services/departmentService');
      return module.departmentService.list({ limit: 100 });
    },
  });

  const bulkMutation = useMutation({
    mutationFn: (payload: Parameters<typeof attendanceService.bulkCreate>[0]) => attendanceService.bulkCreate(payload),
    onSuccess: (res) => {
      message.success(`Attendance saved: ${res.data.filter((r: any) => r.status === 'created').length} created, ${res.data.filter((r: any) => r.status === 'updated').length} updated`);
      setIsModalOpen(false);
      form.resetFields();
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
      queryClient.invalidateQueries({ queryKey: ['attendance-monthly'] });
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
      remarks: emp.remarks,
    })) || [];

    bulkMutation.mutate({ date: dateStr, entries });
  };

  const getShiftDisplay = (shift: any) => {
    if (!shift?.startTime || !shift?.endTime) return null;
    return `${shift.startTime} - ${shift.endTime}`;
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
      title: 'Shift',
      key: 'shift',
      width: 120,
      render: (_: unknown, record: AttendanceEntry) => (
        <span style={{ fontSize: 12, color: 'var(--hrms-text-secondary)' }}>
          {getShiftDisplay(record.shift) || '-'}
        </span>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status: string, record: AttendanceEntry) => (
        <div>
          <Tag color={STATUS_COLORS[status]} style={{ textTransform: 'capitalize' }}>
            {status.replace('-', ' ')}
          </Tag>
          {record.isLate && <Tag color="error" style={{ marginLeft: 4 }}>Late</Tag>}
        </div>
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
      title: 'Remarks',
      dataIndex: 'remarks',
      key: 'remarks',
      render: (v: string) => v || '-',
    },
  ];

  const MonthlyView = () => {
    const daysInMonth = selectedMonth.daysInMonth();
    const dayHeaders = Array.from({ length: daysInMonth }, (_, i) => i + 1);

    const monthlyColumns: ColumnsType<MonthlyAttendanceView> = [
      {
        title: 'Employee',
        key: 'employee',
        fixed: 'left',
        width: 180,
        render: (_: unknown, record: MonthlyAttendanceView) => (
          <div>
            <div style={{ fontWeight: 600 }}>{record.employee?.fullName}</div>
            <div style={{ fontSize: 11, color: 'var(--hrms-text-muted)' }}>{record.employee?.employeeCode}</div>
          </div>
        ),
      },
      ...dayHeaders.map((day) => ({
        title: String(day),
        key: `day-${day}`,
        width: 45,
        align: 'center' as const,
        render: (_: unknown, record: MonthlyAttendanceView) => {
          const dayData = record.days?.[day];
          if (!dayData) return <span style={{ color: '#ccc' }}>-</span>;
          return (
            <Badge 
              color={STATUS_COLORS[dayData.status] || 'default'} 
              text=""
              style={{ fontSize: 8 }}
            />
          );
        },
      })),
    ];

    return (
      <div className="hrms-table-card">
        <div className="hrms-table-toolbar">
          <div className="hrms-table-toolbar-left" style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <Button 
              icon={<LeftOutlined />} 
              size="small" 
              onClick={() => setSelectedMonth(selectedMonth.subtract(1, 'month'))}
            />
            <span style={{ fontWeight: 600, minWidth: 120, textAlign: 'center' }}>
              {selectedMonth.format('MMMM YYYY')}
            </span>
            <Button 
              icon={<RightOutlined />} 
              size="small" 
              onClick={() => setSelectedMonth(selectedMonth.add(1, 'month'))}
              disabled={selectedMonth.isAfter(dayjs(), 'month')}
            />
          </div>
          <div className="hrms-table-toolbar-right">
            <span style={{ fontSize: 13, color: 'var(--hrms-text-muted)' }}>
              {monthlyData?.length ?? 0} employees
            </span>
          </div>
        </div>
        <Table
          columns={monthlyColumns}
          dataSource={monthlyData}
          rowKey={(record) => record.employee?.id || ''}
          loading={monthlyLoading}
          scroll={{ x: daysInMonth * 45 + 180 }}
          size="small"
          pagination={false}
        />
      </div>
    );
  };

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
                      disabledDate={(current) => current && current > dayjs().endOf('day')}
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
                  <div className="hrms-table-toolbar-left" style={{ display: 'flex', gap: 8 }}>
                    <DatePicker 
                      value={selectedDate} 
                      onChange={(date) => setSelectedDate(date || dayjs())}
                      style={{ width: 150 }}
                      disabledDate={(current) => current && current > dayjs().endOf('day')}
                    />
                    <Select
                      placeholder="Department"
                      allowClear
                      style={{ width: 150 }}
                      value={departmentFilter || undefined}
                      onChange={(val) => { setDepartmentFilter(val || ''); setPage(1); }}
                      options={deptData?.data?.map((d: any) => ({ label: d.name, value: d.id })) || []}
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
          {
            key: 'monthly',
            label: <span><CalendarOutlined /> Monthly View</span>,
            children: (
              <div className="hrms-table-card">
                <div className="hrms-table-toolbar">
                  <div className="hrms-table-toolbar-left" style={{ display: 'flex', gap: 8 }}>
                    <Select
                      placeholder="Department"
                      allowClear
                      style={{ width: 150 }}
                      value={departmentFilter || undefined}
                      onChange={(val) => setDepartmentFilter(val || '')}
                      options={deptData?.data?.map((d: any) => ({ label: d.name, value: d.id })) || []}
                    />
                  </div>
                </div>
                <MonthlyView />
              </div>
            ),
          },
        ]}
      />

      <Modal
        title={`Mark Attendance - ${selectedDate.format('DD MMMM YYYY')}`}
        open={isModalOpen}
        onCancel={() => { setIsModalOpen(false); form.resetFields(); }}
        width={1000}
        footer={[
          <Button key="cancel" onClick={() => setIsModalOpen(false)}>Cancel</Button>,
          <Button key="save" type="primary" icon={<SaveOutlined />} onClick={handleBulkSave} loading={bulkMutation.isPending}>
            Save Attendance
          </Button>,
        ]}
      >
        <Form form={form} layout="vertical">
          <div style={{ maxHeight: 500, overflowY: 'auto' }}>
            <Table
              dataSource={employeeData?.data || []}
              rowKey="id"
              pagination={false}
              size="small"
              scroll={{ y: 400 }}
              columns={[
                {
                  title: 'Employee',
                  dataIndex: 'fullName',
                  key: 'fullName',
                  width: 160,
                  render: (name: string, record: any) => (
                    <div>
                      <div style={{ fontWeight: 500 }}>{name}</div>
                      <div style={{ fontSize: 11, color: 'var(--hrms-text-muted)' }}>{record.employeeCode}</div>
                    </div>
                  ),
                },
                {
                  title: 'Shift',
                  key: 'shift',
                  width: 120,
                  render: (_: unknown, record: any) => (
                    <span style={{ fontSize: 11, color: 'var(--hrms-text-secondary)' }}>
                      {record.shift?.startTime && record.shift?.endTime 
                        ? `${record.shift.startTime} - ${record.shift.endTime}` 
                        : 'No shift'}
                    </span>
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
                  title: 'Remarks',
                  key: 'remarks',
                  width: 150,
                  render: (_: unknown, _record: any, index: number) => (
                    <Form.Item name={['employees', index, 'remarks']} noStyle>
                      <Input placeholder="Optional remarks" style={{ width: '100%' }} />
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
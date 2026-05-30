import { useState, useMemo, memo } from 'react';
import { Button, Modal, Form, Input, Select, DatePicker, message, Tag, Row, Col, Tabs, Card, Badge, Table } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { SaveOutlined, CalendarOutlined, LeftOutlined, RightOutlined } from '@ant-design/icons';
import { PageHeader } from '../../../core/components/PageHeader';
import { DataTable } from '../../../core/components/DataTable';
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
  const [bulkForm] = Form.useForm();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isBulkUpdateOpen, setIsBulkUpdateOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(dayjs());
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [departmentFilter, setDepartmentFilter] = useState<string>('');
  const [selectedMonth, setSelectedMonth] = useState(dayjs());
  const queryClient = useQueryClient();

  const dateStr = selectedDate.format('YYYY-MM-DD');
  const monthYear = { month: selectedMonth.month() + 1, year: selectedMonth.year() };

  const { data, isLoading, error: listError } = useQuery({
    queryKey: ['attendance', page, limit, dateStr, departmentFilter],
    queryFn: () => attendanceService.list({ page, limit, date: dateStr, department: departmentFilter || undefined }),
    refetchOnWindowFocus: false,
  });

  const { data: monthlyData, isLoading: monthlyLoading, error: monthlyError } = useQuery({
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

  const bulkUpdateMutation = useMutation({
    mutationFn: (entries: Array<{ id: string; status?: string; inTime?: string; outTime?: string; remarks?: string }>) => attendanceService.bulkUpdate(entries),
    onSuccess: (res) => {
      message.success(`Bulk update completed: ${res.updated} updated, ${res.failed} failed`);
      setIsBulkUpdateOpen(false);
      bulkForm.resetFields();
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
      queryClient.invalidateQueries({ queryKey: ['attendance-monthly'] });
    },
    onError: (err: any) => message.error(err?.response?.data?.message || 'Failed to bulk update attendance'),
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

  const handleBulkUpdate = () => {
    const values = bulkForm.getFieldsValue();
    const entries = values.bulkEntries?.map((entry: any) => ({
      id: entry.id,
      status: entry.status,
      inTime: entry.inTime || undefined,
      outTime: entry.outTime || undefined,
      remarks: entry.remarks || undefined,
    })) || [];
    bulkUpdateMutation.mutate(entries);
  };

  const getShiftDisplay = (shift: any) => {
    if (!shift?.startTime || !shift?.endTime) return null;
    return `${shift.startTime} - ${shift.endTime}`;
  };

  const columns = useMemo<ColumnsType<AttendanceEntry>>(() => [
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
  ], []);

  const MonthlyView = memo(() => {
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
  });

  return (
    <div style={{ padding: '0 4px' }}>
      <PageHeader title="Attendance" subtitle="Mark and manage employee attendance" />

      {listError && <Card style={{ marginBottom: 16, borderColor: '#ff4d4f' }}><span style={{ color: '#ff4d4f' }}>Failed to load attendance records. Please try again.</span></Card>}
      {monthlyError && <Card style={{ marginBottom: 16, borderColor: '#ff4d4f' }}><span style={{ color: '#ff4d4f' }}>Failed to load monthly view. Please try again.</span></Card>}

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
              <DataTable
                columns={columns}
                dataSource={data?.data}
                rowKey="id"
                loading={isLoading}
                total={data?.meta?.total ?? 0}
                page={page}
                pageSize={limit}
                onPaginationChange={(p, size) => { setPage(p); setLimit(size ?? 10); }}
                toolbarLeft={
                  <div style={{ display: 'flex', gap: 8 }}>
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
                    <Button onClick={() => setIsBulkUpdateOpen(true)}>
                      Bulk Update
                    </Button>
                  </div>
                }
                toolbarRight={
                  <span style={{ fontSize: 13, color: 'var(--hrms-text-muted)' }}>
                    {data?.meta?.total ?? 0} records
                  </span>
                }
              />
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

      <Modal
        title="Bulk Update Attendance"
        open={isBulkUpdateOpen}
        onCancel={() => { setIsBulkUpdateOpen(false); bulkForm.resetFields(); }}
        width={1000}
        footer={[
          <Button key="cancel" onClick={() => setIsBulkUpdateOpen(false)}>Cancel</Button>,
          <Button key="update" type="primary" onClick={handleBulkUpdate} loading={bulkUpdateMutation.isPending}>
            Update Selected
          </Button>,
        ]}
      >
        <Form form={bulkForm} layout="vertical">
          <div style={{ maxHeight: 500, overflowY: 'auto' }}>
            <Table
              dataSource={data?.data || []}
              rowKey="id"
              pagination={false}
              size="small"
              scroll={{ y: 400 }}
              columns={[
                {
                  title: 'Employee',
                  key: 'employee',
                  width: 160,
                  render: (_: unknown, record: any, index: number) => (
                    <div>
                      <Form.Item name={['bulkEntries', index, 'id']} initialValue={record.id} noStyle>
                        <input type="hidden" />
                      </Form.Item>
                      <div style={{ fontWeight: 500 }}>{record.employee?.fullName || 'N/A'}</div>
                      <div style={{ fontSize: 11, color: 'var(--hrms-text-muted)' }}>{record.employee?.employeeCode}</div>
                    </div>
                  ),
                },
                {
                  title: 'Status',
                  key: 'status',
                  width: 140,
                  render: (_: unknown, record: any, index: number) => (
                    <Form.Item name={['bulkEntries', index, 'status']} initialValue={record.status} noStyle>
                      <Select
                        options={STATUS_OPTIONS}
                        style={{ width: '100%' }}
                        placeholder="Select status"
                        allowClear
                      />
                    </Form.Item>
                  ),
                },
                {
                  title: 'In Time',
                  key: 'inTime',
                  width: 100,
                  render: (_: unknown, record: any, index: number) => (
                    <Form.Item name={['bulkEntries', index, 'inTime']} initialValue={record.inTime} noStyle>
                      <Input placeholder="09:00" style={{ width: '100%' }} />
                    </Form.Item>
                  ),
                },
                {
                  title: 'Out Time',
                  key: 'outTime',
                  width: 100,
                  render: (_: unknown, record: any, index: number) => (
                    <Form.Item name={['bulkEntries', index, 'outTime']} initialValue={record.outTime} noStyle>
                      <Input placeholder="18:00" style={{ width: '100%' }} />
                    </Form.Item>
                  ),
                },
                {
                  title: 'Remarks',
                  key: 'remarks',
                  width: 150,
                  render: (_: unknown, record: any, index: number) => (
                    <Form.Item name={['bulkEntries', index, 'remarks']} initialValue={record.remarks} noStyle>
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
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Table, Tag, DatePicker, Spin, Empty, Button, Space } from 'antd';
import { QrcodeOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { useEssAttendance } from '../hooks/useEssAttendance';
import { useEssProfile } from '../hooks/useEssProfile';

const { MonthPicker } = DatePicker;

const cardStyle = { borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' };

export function EssAttendancePage() {
  const navigate = useNavigate();
  const [selectedMonth, setSelectedMonth] = useState(dayjs().format('YYYY-MM'));
  const { data, isLoading } = useEssAttendance(selectedMonth);
  const { data: profileData } = useEssProfile();

  const records = data?.data || [];

  const columns = [
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
      width: 120,
      render: (date: string) => dayjs(date).format('DD MMM YYYY'),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => {
        const colors: Record<string, string> = {
          present: 'green',
          absent: 'red',
          'half-day': 'orange',
          leave: 'blue',
          'weekly-off': 'default',
          holiday: 'purple',
        };
        return <Tag color={colors[status] || 'default'} style={{ fontSize: 11 }}>{status?.toUpperCase()}</Tag>;
      },
    },
    {
      title: 'In',
      dataIndex: 'checkIn',
      key: 'checkIn',
      width: 80,
    },
    {
      title: 'Out',
      dataIndex: 'checkOut',
      key: 'checkOut',
      width: 80,
    },
    {
      title: 'OT',
      dataIndex: 'otHours',
      key: 'otHours',
      width: 60,
    },
  ];

  const profile = profileData?.data as any;
  const empCode = profile?.employeeCode || '';

  return (
    <div>
      <Card
        title={<span style={{ fontSize: 15 }}>My Attendance</span>}
        headStyle={{ borderBottom: '1px solid #f0f0f0' }}
        style={cardStyle}
        extra={
          <Space size={8}>
            <Button
              type="primary"
              size="small"
              icon={<QrcodeOutlined />}
              onClick={() => navigate(`/m/scan${empCode ? `?employeeId=${empCode}` : ''}`)}
              style={{ borderRadius: 8 }}
            >
              Check In / Out
            </Button>
            <MonthPicker
              value={dayjs(selectedMonth)}
              onChange={(date) => setSelectedMonth(date ? date.format('YYYY-MM') : dayjs().format('YYYY-MM'))}
              allowClear={false}
              size="small"
              style={{ width: 130 }}
            />
          </Space>
        }
      >
      {isLoading ? (
        <div style={{ textAlign: 'center', padding: 24 }}><Spin /></div>
      ) : records.length === 0 ? (
        <Empty description="No attendance records found" image={Empty.PRESENTED_IMAGE_SIMPLE} />
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <Table
            dataSource={records}
            columns={columns}
            rowKey={(r: any) => r._id || r.id}
            pagination={{ pageSize: 15, size: 'small', showSizeChanger: false }}
            size="small"
            scroll={{ x: 'max-content' }}
            bordered
          />
        </div>
      )}
    </Card>
    </div>
  );
}
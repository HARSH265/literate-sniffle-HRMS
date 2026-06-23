import { Descriptions, Tag, Space, Timeline, Empty } from 'antd';
import dayjs from 'dayjs';
import type { LeaveApplication } from '../services/leaveService';

interface Props {
  record: LeaveApplication;
}

const statusColors: Record<string, string> = {
  pending: 'orange', approved: 'green', rejected: 'red', cancelled: 'default',
};

export function LeaveDetailDrawer({ record }: Props) {
  return (
    <div style={{ padding: 24 }}>
      <Descriptions column={1} bordered size="small">
        <Descriptions.Item label="Employee">
          {record.employee ? (
            <Space>
              <span style={{ fontWeight: 500 }}>{record.employee.fullName}</span>
              <Tag>{record.employee.employeeCode}</Tag>
              {record.employee.department && <Tag color="blue">{record.employee.department}</Tag>}
            </Space>
          ) : <span style={{ color: 'var(--hrms-text-muted)' }}>—</span>}
        </Descriptions.Item>

        <Descriptions.Item label="Leave Type">
          {record.leaveType ? (
            <Space>
              <span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: 2, background: record.leaveType.color }} />
              <span>{record.leaveType.name}</span>
              <Tag>{record.leaveType.isPaid ? 'Paid' : 'Unpaid'}</Tag>
              <Tag color="blue">{record.leaveType.code}</Tag>
            </Space>
          ) : <span style={{ color: 'var(--hrms-text-muted)' }}>—</span>}
        </Descriptions.Item>

        <Descriptions.Item label="Date Range">
          {dayjs(record.startDate).format('DD-MMM-YYYY')} → {dayjs(record.endDate).format('DD-MMM-YYYY')}
        </Descriptions.Item>

        <Descriptions.Item label="Total Days">
          <Tag color="geekblue" style={{ fontSize: 14 }}>{record.totalDays}</Tag>
        </Descriptions.Item>

        <Descriptions.Item label="Status">
          <Tag color={statusColors[record.status] || 'default'} style={{ fontSize: 14, fontWeight: 600 }}>
            {record.status?.toUpperCase()}
          </Tag>
        </Descriptions.Item>

        {record.reason && (
          <Descriptions.Item label="Reason">
            <div style={{ whiteSpace: 'pre-wrap', maxHeight: 120, overflow: 'auto', background: 'var(--hrms-bg)', padding: 8, borderRadius: 4 }}>
              {record.reason}
            </div>
          </Descriptions.Item>
        )}

        {record.documentUrl && (
          <Descriptions.Item label="Document">
            <a href={record.documentUrl} target="_blank" rel="noopener noreferrer">View Document</a>
          </Descriptions.Item>
        )}

        <Descriptions.Item label="Applied On">
          {record.createdAt ? dayjs(record.createdAt).format('DD-MMM-YYYY HH:mm') : '—'}
        </Descriptions.Item>

        <Descriptions.Item label="Last Updated">
          {record.updatedAt ? dayjs(record.updatedAt).format('DD-MMM-YYYY HH:mm') : '—'}
        </Descriptions.Item>
      </Descriptions>

      {record.approvers && record.approvers.length > 0 && (
        <div style={{ marginTop: 24 }}>
          <h4 style={{ marginBottom: 12 }}>Approval Timeline</h4>
          <Timeline
            items={record.approvers
              .filter(a => a.status !== 'pending')
              .sort((a, b) => new Date(a.decidedAt || 0).getTime() - new Date(b.decidedAt || 0).getTime())
              .map(a => ({
                color: a.status === 'approved' ? 'green' : a.status === 'rejected' ? 'red' : 'gray',
                children: (
                  <div>
                    <div style={{ fontWeight: 500 }}>
                      {a.approver?.name || 'Unknown'} — Level {a.level}
                    </div>
                    <Tag color={statusColors[a.status] || 'default'}>{a.status}</Tag>
                    {a.remarks && <div style={{ color: 'var(--hrms-text-secondary)', fontSize: 12, marginTop: 2 }}>"{a.remarks}"</div>}
                    {a.decidedAt && <div style={{ color: 'var(--hrms-text-muted)', fontSize: 11 }}>{dayjs(a.decidedAt).format('DD-MMM-YYYY HH:mm')}</div>}
                  </div>
                ),
              }))}
          />
          {record.approvers.filter(a => a.status === 'pending').length > 0 && (
            <div style={{ marginTop: 8, color: 'var(--hrms-text-muted)', fontSize: 12 }}>
              {record.approvers.filter(a => a.status === 'pending').length} approval(s) pending
            </div>
          )}
          {record.approvers.every(a => a.status === 'pending') && (
            <Empty description="No approvals yet" image={Empty.PRESENTED_IMAGE_SIMPLE} />
          )}
        </div>
      )}
    </div>
  );
}

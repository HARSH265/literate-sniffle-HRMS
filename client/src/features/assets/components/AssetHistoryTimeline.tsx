import { Timeline, Typography } from 'antd';
import {
  CheckCircleOutlined,
  SwapRightOutlined,
  ToolOutlined,
  StopOutlined,
} from '@ant-design/icons';

const { Text } = Typography;

interface HistoryEntry {
  employee?: { _id: string; fullName: string; employeeCode: string };
  action: 'allocated' | 'returned' | 'maintenance' | 'retired';
  date: string;
  notes?: string;
}

const actionConfig: Record<string, { color: string; icon: React.ReactNode; label: string }> = {
  allocated: { color: 'blue', icon: <SwapRightOutlined />, label: 'Allocated' },
  returned: { color: 'green', icon: <CheckCircleOutlined />, label: 'Returned' },
  maintenance: { color: 'orange', icon: <ToolOutlined />, label: 'Maintenance' },
  retired: { color: 'red', icon: <StopOutlined />, label: 'Retired' },
};

export function AssetHistoryTimeline({ history }: { history: HistoryEntry[] }) {
  if (!history || history.length === 0) {
    return <Text type="secondary">No history recorded</Text>;
  }

  const sorted = [...history].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <Timeline
      items={sorted.map((entry) => {
        const config = actionConfig[entry.action] || { color: 'gray', icon: null, label: entry.action };
        return {
          color: config.color,
          dot: config.icon,
          children: (
            <div>
              <Text strong>{config.label}</Text>
              {entry.employee && (
                <Text> — {entry.employee.fullName} ({entry.employee.employeeCode})</Text>
              )}
              <br />
              <Text type="secondary" style={{ fontSize: 12 }}>
                {new Date(entry.date).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </Text>
              {entry.notes && (
                <div>
                  <Text type="secondary" style={{ fontSize: 12 }}>{entry.notes}</Text>
                </div>
              )}
            </div>
          ),
        };
      })}
    />
  );
}

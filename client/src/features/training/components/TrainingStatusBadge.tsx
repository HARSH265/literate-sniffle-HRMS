import { Tag } from 'antd';

const PROGRAM_COLORS: Record<string, string> = {
  planned: 'default', 'in-progress': 'processing', completed: 'success', cancelled: 'error',
};

const ENROLLMENT_COLORS: Record<string, string> = {
  enrolled: 'blue', 'in-progress': 'processing', completed: 'success', dropped: 'error', certified: 'purple',
};

export function ProgramStatusBadge({ status }: { status: string }) {
  const color = PROGRAM_COLORS[status] || 'default';
  return <Tag color={color}>{status}</Tag>;
}

export function EnrollmentStatusBadge({ status }: { status: string }) {
  const color = ENROLLMENT_COLORS[status] || 'default';
  return <Tag color={color}>{status}</Tag>;
}

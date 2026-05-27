import { Descriptions, Tag } from 'antd';

interface ProfileFieldProps {
  label: string;
  value: React.ReactNode;
  editable?: boolean;
}

export function ProfileField({ label, value, editable }: ProfileFieldProps) {
  return (
    <Descriptions.Item label={label}>
      <span>{value}</span>
      {editable && (
        <Tag color="blue" style={{ marginLeft: 8, fontSize: 10 }}>
          Editable
        </Tag>
      )}
    </Descriptions.Item>
  );
}

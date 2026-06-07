import { Card } from 'antd';

interface FormSectionProps {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}

export const FormSection = ({ title, icon, children }: FormSectionProps) => (
  <Card
    size="small"
    style={{ marginBottom: 16, borderRadius: 8, border: '1px solid var(--hrms-border-light)' }}
    styles={{ body: { padding: '20px 24px' } }}
  >
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
      <div style={{
        width: 32,
        height: 32,
        borderRadius: 8,
        background: 'var(--hrms-primary-light)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'var(--hrms-primary)',
      }}>
        {icon}
      </div>
      <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--hrms-text-primary)' }}>{title}</span>
    </div>
    {children}
  </Card>
);

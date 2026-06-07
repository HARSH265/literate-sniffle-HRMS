import { Link } from 'react-router-dom';
import { Breadcrumb } from 'antd';
import type { BreadcrumbProps } from 'antd';

interface BreadcrumbItem {
  label: string;
  path?: string;
}

interface PageHeaderProps {
  title: string;
  subtitle?: React.ReactNode;
  breadcrumbs?: BreadcrumbItem[];
  actions?: React.ReactNode;
}

export function PageHeader({ title, subtitle, breadcrumbs, actions }: PageHeaderProps) {
  const items: BreadcrumbProps['items'] = breadcrumbs?.map((b) => ({
    title: b.path ? <Link to={b.path}>{b.label}</Link> : b.label,
  }));

  return (
    <div style={{ marginBottom: 28 }}>
      {items && items.length > 0 && (
        <Breadcrumb style={{ marginBottom: 10 }} items={items} />
      )}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: 'var(--hrms-text-primary)', letterSpacing: '-0.02em' }}>{title}</h1>
          {subtitle && <p style={{ margin: '4px 0 0', fontSize: 14, color: 'var(--hrms-text-muted)' }}>{subtitle}</p>}
        </div>
        {actions && <div style={{ flexShrink: 0 }}>{actions}</div>}
      </div>
    </div>
  );
}
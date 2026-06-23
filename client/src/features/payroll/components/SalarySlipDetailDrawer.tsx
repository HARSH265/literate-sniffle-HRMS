import { Card, Row, Col, Divider } from 'antd';
import { UserOutlined, CheckCircleOutlined } from '@ant-design/icons';

interface SalarySlipRecord {
  name?: string;
  employeeCode?: string;
  department?: string;
  designation?: string;
  basicSalary?: number;
  totalEarnings?: number;
  totalDeductions?: number;
  netPay?: number;
  allowances?: Array<{ name: string; type: string; value: number; calculatedValue: number }>;
  deductions?: Array<{ name: string; type: string; value: number; calculatedValue: number }>;
  presentDays?: number;
  absentDays?: number;
  halfDays?: number;
  workingDays?: number;
  weeklyOffs?: number;
  holidays?: number;
  overtimeHours?: number;
  overtimeAmount?: number;
}

const fmt = (v: number) => `₹${(v || 0).toLocaleString('en-IN')}`;

const borderStyle: React.CSSProperties = {
  borderRadius: 8,
  border: '1px solid var(--hrms-border)',
  marginBottom: 16,
};

const labelStyle: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 600,
  color: 'var(--hrms-text-muted)',
  textTransform: 'uppercase' as const,
  letterSpacing: 0.5,
};

const valueStyle: React.CSSProperties = {
  fontSize: 14,
  fontWeight: 600,
  color: 'var(--hrms-text-primary)',
};

export function SalarySlipDetailDrawer({ record }: { record: SalarySlipRecord }) {
  const allowances = record.allowances || [];
  const deductions = record.deductions || [];

  return (
    <div style={{ padding: 24, background: 'var(--hrms-bg)', minHeight: '100%' }}>

      {/* Employee Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 }}>
        <div style={{
          width: 44, height: 44, borderRadius: 8,
          background: 'var(--hrms-bg)', display: 'flex',
          alignItems: 'center', justifyContent: 'center',
        }}>
          <UserOutlined style={{ fontSize: 18, color: 'var(--hrms-text-secondary)' }} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--hrms-text-primary)' }}>{record.name || '—'}</div>
          <div style={{ fontSize: 12, color: 'var(--hrms-text-muted)', marginTop: 1 }}>
            {record.employeeCode} &nbsp;·&nbsp; {record.department} &nbsp;·&nbsp; {record.designation}
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={labelStyle}>Net Pay</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--hrms-text-primary)' }}>{fmt(record.netPay || 0)}</div>
        </div>
      </div>

      <Divider style={{ margin: '0 0 16px', borderColor: 'var(--hrms-border)' }} />

      {/* Attendance */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ ...labelStyle, marginBottom: 10 }}>Attendance</div>
        <Row gutter={16}>
          {[
            { label: 'Present', val: record.presentDays },
            { label: 'Half Days', val: record.halfDays },
            { label: 'Absent', val: record.absentDays },
            { label: 'Weekly Off', val: record.weeklyOffs },
            { label: 'Holidays', val: record.holidays },
            { label: 'Effective Days', val: record.workingDays },
          ].map((item) => (
            <Col span={4} key={item.label}>
              <div style={{ background: 'var(--hrms-surface)', border: '1px solid var(--hrms-border)', borderRadius: 6, padding: '10px 8px', textAlign: 'center' }}>
                <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--hrms-text-primary)' }}>{item.val ?? 0}</div>
                <div style={{ fontSize: 10, color: 'var(--hrms-text-muted)', marginTop: 2 }}>{item.label}</div>
              </div>
            </Col>
          ))}
        </Row>
      </div>

      {/* Earnings & Deductions */}
      <Row gutter={16}>
        <Col span={14}>
          <Card size="small" style={borderStyle} styles={{ body: { padding: 16 } }}>
            <div style={{ ...labelStyle, marginBottom: 12 }}>Earnings</div>

            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0' }}>
              <span style={{ fontSize: 13, color: 'var(--hrms-text-secondary)' }}>Basic Salary</span>
              <span style={valueStyle}>{fmt(record.basicSalary || 0)}</span>
            </div>

            {allowances.map((a, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
                <span style={{ fontSize: 13, color: 'var(--hrms-text-secondary)' }}>{a.name}</span>
                <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--hrms-text-primary)' }}>{fmt(a.calculatedValue || a.value || 0)}</span>
              </div>
            ))}

            {(record.overtimeHours ?? 0) > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
                <span style={{ fontSize: 13, color: 'var(--hrms-text-secondary)' }}>Overtime ({record.overtimeHours} hrs)</span>
                <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--hrms-text-primary)' }}>{fmt(record.overtimeAmount || 0)}</span>
              </div>
            )}

            <Divider style={{ margin: '8px 0' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--hrms-text-primary)' }}>Total Earnings</span>
              <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--hrms-text-primary)' }}>{fmt(record.totalEarnings || 0)}</span>
            </div>
          </Card>
        </Col>

        <Col span={10}>
          <Card size="small" style={borderStyle} styles={{ body: { padding: 16 } }}>
            <div style={{ ...labelStyle, marginBottom: 12 }}>Deductions</div>

            {deductions.length > 0 ? deductions.map((d, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
                <span style={{ fontSize: 13, color: 'var(--hrms-text-secondary)' }}>{d.name}</span>
                <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--hrms-text-primary)' }}>{fmt(d.calculatedValue || d.value || 0)}</span>
              </div>
            )) : (
              <div style={{ fontSize: 13, color: 'var(--hrms-border)', padding: '4px 0' }}>No deductions</div>
            )}

            <Divider style={{ margin: '8px 0' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--hrms-text-primary)' }}>Total Deductions</span>
              <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--hrms-text-primary)' }}>{fmt(record.totalDeductions || 0)}</span>
            </div>
          </Card>
        </Col>
      </Row>

      {/* Net Pay */}
      <div style={{
        background: 'var(--hrms-surface)',
  border: '1px solid var(--hrms-border)',
        borderRadius: 8,
        padding: '16px 20px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <div>
          <div style={labelStyle}>Net Payable</div>
          <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--hrms-text-primary)', marginTop: 2 }}>{fmt(record.netPay || 0)}</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--hrms-success)', fontSize: 13, fontWeight: 500 }}>
          <CheckCircleOutlined /> Processed
        </div>
      </div>
    </div>
  );
}

import { Card, Row, Col, Tag, Divider } from 'antd';
import {
  UserOutlined,
  CalendarOutlined,
  CheckCircleOutlined,
  DollarOutlined, SafetyCertificateOutlined,
} from '@ant-design/icons';

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
  paidLeaveDays?: number;
  unpaidLeaveDays?: number;
}

const fmt = (v: number) => `₹${(v || 0).toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

const cardStyle: React.CSSProperties = {
  borderRadius: 12,
  marginBottom: 16,
  border: '1px solid #f0f0f0',
};

const sectionTitle: React.CSSProperties = {
  fontSize: 13,
  fontWeight: 700,
  textTransform: 'uppercase',
  letterSpacing: 0.5,
  color: '#8c8c8c',
  marginBottom: 12,
};

export function SalarySlipDetailDrawer({ record }: { record: SalarySlipRecord }) {
  const allowances = record.allowances || [];
  const deductions = record.deductions || [];

  return (
    <div style={{ padding: 24, background: '#fafafa', minHeight: '100%' }}>
      {/* Employee Header */}
      <Card style={{ ...cardStyle, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', border: 'none' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{
            width: 56, height: 56, borderRadius: '50%',
            background: 'rgba(255,255,255,0.2)', display: 'flex',
            alignItems: 'center', justifyContent: 'center',
          }}>
            <UserOutlined style={{ fontSize: 24, color: '#fff' }} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#fff' }}>{record.name || '—'}</div>
            <div style={{ color: 'rgba(255,255,255,0.85)', fontSize: 13, marginTop: 2 }}>
              {record.employeeCode} &nbsp;·&nbsp; {record.department} &nbsp;·&nbsp; {record.designation}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ color: 'rgba(255,255,255,0.65)', fontSize: 12 }}>NET PAY</div>
            <div style={{ fontSize: 24, fontWeight: 800, color: '#fff' }}>{fmt(record.netPay || 0)}</div>
          </div>
        </div>
      </Card>

      {/* Attendance Summary */}
      <Card title={<span><CalendarOutlined /> Attendance Summary</span>} style={cardStyle} size="small">
        <Row gutter={[12, 12]}>
          <Col span={8}>
            <div style={{ textAlign: 'center', padding: 8, background: '#f6ffed', borderRadius: 8 }}>
              <div style={{ fontSize: 22, fontWeight: 700, color: '#52c41a' }}>{record.presentDays || 0}</div>
              <div style={{ fontSize: 11, color: '#8c8c8c' }}>Present</div>
            </div>
          </Col>
          <Col span={8}>
            <div style={{ textAlign: 'center', padding: 8, background: '#fff7e6', borderRadius: 8 }}>
              <div style={{ fontSize: 22, fontWeight: 700, color: '#fa8c16' }}>{record.halfDays || 0}</div>
              <div style={{ fontSize: 11, color: '#8c8c8c' }}>Half Days</div>
            </div>
          </Col>
          <Col span={8}>
            <div style={{ textAlign: 'center', padding: 8, background: '#fff1f0', borderRadius: 8 }}>
              <div style={{ fontSize: 22, fontWeight: 700, color: '#ff4d4f' }}>{record.absentDays || 0}</div>
              <div style={{ fontSize: 11, color: '#8c8c8c' }}>Absent</div>
            </div>
          </Col>
          <Col span={8}>
            <div style={{ textAlign: 'center', padding: 8, background: '#e6f7ff', borderRadius: 8 }}>
              <div style={{ fontSize: 22, fontWeight: 700, color: '#1890ff' }}>{record.weeklyOffs || 0}</div>
              <div style={{ fontSize: 11, color: '#8c8c8c' }}>Weekly Off</div>
            </div>
          </Col>
          <Col span={8}>
            <div style={{ textAlign: 'center', padding: 8, background: '#f9f0ff', borderRadius: 8 }}>
              <div style={{ fontSize: 22, fontWeight: 700, color: '#722ed1' }}>{record.holidays || 0}</div>
              <div style={{ fontSize: 11, color: '#8c8c8c' }}>Holidays</div>
            </div>
          </Col>
          <Col span={8}>
            <div style={{ textAlign: 'center', padding: 8, background: '#f0f0f0', borderRadius: 8 }}>
              <div style={{ fontSize: 22, fontWeight: 700, color: '#262626' }}>{record.workingDays || 0}</div>
              <div style={{ fontSize: 11, color: '#8c8c8c' }}>Effective Days</div>
            </div>
          </Col>
        </Row>
      </Card>

      {/* Earnings & Deductions Side by Side */}
      <Row gutter={16}>
        <Col span={12}>
          <Card
            title={<span style={{ color: '#52c41a' }}><DollarOutlined /> Earnings</span>}
            style={{ ...cardStyle, borderTop: '3px solid #52c41a' }}
            size="small"
          >
            <div style={sectionTitle}>Basic Salary</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: '#262626', marginBottom: 12 }}>
              {fmt(record.basicSalary || 0)}
            </div>

            {allowances.length > 0 && (
              <>
                <Divider style={{ margin: '8px 0' }} />
                <div style={sectionTitle}>Allowances</div>
                {allowances.map((a, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: 13 }}>
                    <span>{a.name}</span>
                    <span style={{ fontWeight: 600 }}>{fmt(a.calculatedValue || a.value || 0)}</span>
                  </div>
                ))}
              </>
            )}

            <Divider style={{ margin: '8px 0' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: 14 }}>
              <span>Total Earnings</span>
              <span style={{ color: '#52c41a' }}>{fmt(record.totalEarnings || 0)}</span>
            </div>
          </Card>
        </Col>

        <Col span={12}>
          <Card
            title={<span style={{ color: '#ff4d4f' }}><SafetyCertificateOutlined /> Deductions</span>}
            style={{ ...cardStyle, borderTop: '3px solid #ff4d4f' }}
            size="small"
          >
            {deductions.length > 0 ? (
              deductions.map((d, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: 13 }}>
                  <span>{d.name}</span>
                  <span style={{ fontWeight: 600, color: '#ff4d4f' }}>-{fmt(d.calculatedValue || d.value || 0)}</span>
                </div>
              ))
            ) : (
              <div style={{ color: '#8c8c8c', fontSize: 13, padding: '8px 0' }}>No deductions</div>
            )}

            <Divider style={{ margin: '8px 0' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: 14 }}>
              <span>Total Deductions</span>
              <span style={{ color: '#ff4d4f' }}>-{fmt(record.totalDeductions || 0)}</span>
            </div>
          </Card>
        </Col>
      </Row>

      {/* Net Pay */}
      <Card style={{ ...cardStyle, background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)', border: 'none' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: 13 }}>NET PAYABLE</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: '#fff' }}>{fmt(record.netPay || 0)}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <Tag color="success" style={{ fontSize: 13, padding: '4px 12px' }}>
              <CheckCircleOutlined /> Salary Processed
            </Tag>
          </div>
        </div>
      </Card>
    </div>
  );
}

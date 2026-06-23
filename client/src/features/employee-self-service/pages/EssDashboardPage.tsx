import { useNavigate } from 'react-router-dom';
import { Row, Col, Card, Statistic, Spin, Alert } from 'antd';
import { UserOutlined, FileTextOutlined, CheckCircleOutlined, QrcodeOutlined, InfoCircleOutlined, AppstoreOutlined, SwapOutlined, LaptopOutlined, BookOutlined } from '@ant-design/icons';
import { useEssProfile, useChangeRequests } from '../hooks/useEssProfile';
import { AnnouncementWidget } from '../../announcements/components/AnnouncementWidget';

const cardStyle = { borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' };
const headerStyle: React.CSSProperties = {
  background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
  margin: -16,
  marginBottom: 16,
  padding: '24px 20px',
  color: 'var(--hrms-surface)',
};

export function EssDashboardPage() {
  const navigate = useNavigate();
  const { data: profileData, isLoading: profileLoading } = useEssProfile();
  const { data: requestsData, isLoading: requestsLoading } = useChangeRequests();

  if (profileLoading) return <Spin size="large" style={{ display: 'block', margin: '40px auto' }} />;

  const profile = profileData?.data;
  const profileMessage = profile === null ? 'Employee profile not linked' : undefined;
  const pendingRequests = requestsData?.data?.filter((r) => r.status === 'pending')?.length || 0;

  if (profileMessage) {
    return (
      <div>
        <Alert
          message="Employee profile not linked"
          description={profileMessage}
          type="info"
          showIcon
          icon={<InfoCircleOutlined />}
          style={{ marginBottom: 16, borderRadius: 12 }}
        />
        <Card style={cardStyle}>
          <div style={{ textAlign: 'center', padding: '32px 16px' }}>
            <p style={{ fontSize: 15, color: 'var(--hrms-text-muted)', margin: 0 }}>
              ESS features will be available once your account is linked to an employee record.
            </p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <div style={headerStyle}>
        <div style={{ fontSize: 13, opacity: 0.7, marginBottom: 4 }}>Welcome back,</div>
        <div style={{ fontSize: 20, fontWeight: 700 }}>{profile?.fullName || 'Employee'}</div>
        <div style={{ fontSize: 13, opacity: 0.6, marginTop: 4 }}>
          <AppstoreOutlined style={{ marginRight: 6 }} />Employee Dashboard
        </div>
      </div>

      <Row gutter={[12, 12]}>
        <Col xs={12}>
          <Card style={cardStyle} bodyStyle={{ padding: '14px 12px' }}>
            <Statistic
              title={<span style={{ fontSize: 12, color: 'var(--hrms-text-muted)' }}>Employee Code</span>}
              value={profile?.employeeCode || '-'}
              valueStyle={{ fontSize: 16, fontWeight: 600 }}
            />
          </Card>
        </Col>
        <Col xs={12}>
          <Card style={cardStyle} bodyStyle={{ padding: '14px 12px' }}>
            <Statistic
              title={<span style={{ fontSize: 12, color: 'var(--hrms-text-muted)' }}>Department</span>}
              value={profile?.department?.name || '-'}
              valueStyle={{ fontSize: 16, fontWeight: 600 }}
            />
          </Card>
        </Col>
        <Col xs={12}>
          <Card style={cardStyle} bodyStyle={{ padding: '14px 12px' }}>
            <Statistic
              title={<span style={{ fontSize: 12, color: 'var(--hrms-text-muted)' }}>Designation</span>}
              value={profile?.designation?.name || '-'}
              valueStyle={{ fontSize: 16, fontWeight: 600 }}
            />
          </Card>
        </Col>
        <Col xs={12}>
          <Card style={cardStyle} bodyStyle={{ padding: '14px 12px' }}>
            <Statistic
              title={<span style={{ fontSize: 12, color: 'var(--hrms-text-muted)' }}>Shift</span>}
              value={profile?.shift?.name || '-'}
              valueStyle={{ fontSize: 16, fontWeight: 600 }}
            />
          </Card>
        </Col>
      </Row>

      <Card
        title={<span style={{ fontSize: 14, fontWeight: 600 }}>Quick Links</span>}
        headStyle={{ borderBottom: '1px solid #f0f0f0' }}
        style={{ ...cardStyle, marginTop: 12 }}
      >
        <Row gutter={[12, 12]}>
          <Col span={12}>
            <Card size="small" hoverable bodyStyle={{ padding: '14px 8px', textAlign: 'center' }} onClick={() => navigate('/ess/profile')}>
              <UserOutlined style={{ fontSize: 20, color: 'var(--hrms-primary)', marginBottom: 4 }} />
              <div style={{ fontSize: 12, fontWeight: 600 }}>Profile</div>
              <div style={{ fontSize: 11, color: 'var(--hrms-text-muted)' }}>View & Edit</div>
            </Card>
          </Col>
          <Col span={12}>
            <Card size="small" hoverable bodyStyle={{ padding: '14px 8px', textAlign: 'center' }} onClick={() => navigate(`/m/scan?employeeId=${profile?.id || ''}`)}>
              <QrcodeOutlined style={{ fontSize: 20, color: 'var(--hrms-info)', marginBottom: 4 }} />
              <div style={{ fontSize: 12, fontWeight: 600 }}>Check In / Out</div>
              <div style={{ fontSize: 11, color: 'var(--hrms-text-muted)' }}>Scan QR</div>
            </Card>
          </Col>
          <Col span={12}>
            <Card size="small" hoverable bodyStyle={{ padding: '14px 8px', textAlign: 'center' }} onClick={() => navigate('/ess/leave')}>
              <FileTextOutlined style={{ fontSize: 20, color: 'var(--hrms-success)', marginBottom: 4 }} />
              <div style={{ fontSize: 12, fontWeight: 600 }}>Leave</div>
              <div style={{ fontSize: 11, color: 'var(--hrms-text-muted)' }}>Apply / View</div>
            </Card>
          </Col>
          <Col span={12}>
            <Card size="small" hoverable bodyStyle={{ padding: '14px 8px', textAlign: 'center' }} onClick={() => navigate('/ess/payslips')}>
              <CheckCircleOutlined style={{ fontSize: 20, color: 'var(--hrms-warning)', marginBottom: 4 }} />
              <div style={{ fontSize: 12, fontWeight: 600 }}>Payslips</div>
              <div style={{ fontSize: 11, color: 'var(--hrms-text-muted)' }}>Download</div>
            </Card>
          </Col>
          <Col span={12}>
            <Card size="small" hoverable bodyStyle={{ padding: '14px 8px', textAlign: 'center' }} onClick={() => navigate('/ess/assets')}>
              <LaptopOutlined style={{ fontSize: 20, color: 'var(--hrms-success)', marginBottom: 4 }} />
              <div style={{ fontSize: 12, fontWeight: 600 }}>Assets</div>
              <div style={{ fontSize: 11, color: 'var(--hrms-text-muted)' }}>View Allocated</div>
            </Card>
          </Col>
          <Col span={12}>
            <Card size="small" hoverable bodyStyle={{ padding: '14px 8px', textAlign: 'center' }} onClick={() => navigate('/ess/shift-swaps')}>
              <SwapOutlined style={{ fontSize: 20, color: 'var(--hrms-primary)', marginBottom: 4 }} />
              <div style={{ fontSize: 12, fontWeight: 600 }}>Shift Swap</div>
              <div style={{ fontSize: 11, color: 'var(--hrms-text-muted)' }}>Request / View</div>
            </Card>
          </Col>
          <Col span={12}>
            <Card size="small" hoverable bodyStyle={{ padding: '14px 8px', textAlign: 'center' }} onClick={() => navigate('/ess/training')}>
              <BookOutlined style={{ fontSize: 20, color: 'var(--hrms-info)', marginBottom: 4 }} />
              <div style={{ fontSize: 12, fontWeight: 600 }}>Training</div>
              <div style={{ fontSize: 11, color: 'var(--hrms-text-muted)' }}>View Programs</div>
            </Card>
          </Col>
        </Row>
      </Card>

      <div style={{ marginTop: 12 }}>
        <AnnouncementWidget />
      </div>

      <Card
        title={<span style={{ fontSize: 14, fontWeight: 600 }}>Pending Change Requests</span>}
        headStyle={{ borderBottom: '1px solid #f0f0f0' }}
        style={{ ...cardStyle, marginTop: 12 }}
      >
        {requestsLoading ? (
          <Spin style={{ display: 'block', margin: '12px auto' }} />
        ) : pendingRequests > 0 ? (
          <div style={{ textAlign: 'center', padding: '16px' }}>
            <span style={{ fontSize: 28, fontWeight: 700, color: 'var(--hrms-warning)' }}>{pendingRequests}</span>
            <div style={{ marginTop: 4, fontSize: 13, color: 'var(--hrms-text-muted)' }}>
              pending request{pendingRequests > 1 ? 's' : ''} awaiting approval
            </div>
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '16px', fontSize: 13, color: 'var(--hrms-text-muted)' }}>
            No pending requests
          </div>
        )}
      </Card>
    </div>
  );
}
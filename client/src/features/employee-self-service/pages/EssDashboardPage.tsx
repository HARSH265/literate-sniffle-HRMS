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
  color: '#fff',
};

export function EssDashboardPage() {
  const navigate = useNavigate();
  const { data: profileData, isLoading: profileLoading } = useEssProfile();
  const { data: requestsData, isLoading: requestsLoading } = useChangeRequests();

  if (profileLoading) return <Spin size="large" style={{ display: 'block', margin: '40px auto' }} />;

  const profile = profileData?.data as any;
  const profileMessage = profile?.message;
  const pendingRequests = requestsData?.data?.filter((r: any) => r.status === 'pending')?.length || 0;

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
            <p style={{ fontSize: 15, color: '#888', margin: 0 }}>
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
              title={<span style={{ fontSize: 12, color: '#888' }}>Employee Code</span>}
              value={profile?.employeeCode || '-'}
              valueStyle={{ fontSize: 16, fontWeight: 600 }}
            />
          </Card>
        </Col>
        <Col xs={12}>
          <Card style={cardStyle} bodyStyle={{ padding: '14px 12px' }}>
            <Statistic
              title={<span style={{ fontSize: 12, color: '#888' }}>Department</span>}
              value={(profile?.department as any)?.name || '-'}
              valueStyle={{ fontSize: 16, fontWeight: 600 }}
            />
          </Card>
        </Col>
        <Col xs={12}>
          <Card style={cardStyle} bodyStyle={{ padding: '14px 12px' }}>
            <Statistic
              title={<span style={{ fontSize: 12, color: '#888' }}>Designation</span>}
              value={(profile?.designation as any)?.name || '-'}
              valueStyle={{ fontSize: 16, fontWeight: 600 }}
            />
          </Card>
        </Col>
        <Col xs={12}>
          <Card style={cardStyle} bodyStyle={{ padding: '14px 12px' }}>
            <Statistic
              title={<span style={{ fontSize: 12, color: '#888' }}>Shift</span>}
              value={(profile?.shift as any)?.name || '-'}
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
              <UserOutlined style={{ fontSize: 20, color: '#4f46e5', marginBottom: 4 }} />
              <div style={{ fontSize: 12, fontWeight: 600 }}>Profile</div>
              <div style={{ fontSize: 11, color: '#888' }}>View & Edit</div>
            </Card>
          </Col>
          <Col span={12}>
            <Card size="small" hoverable bodyStyle={{ padding: '14px 8px', textAlign: 'center' }} onClick={() => navigate(`/m/scan?employeeId=${profile?._id || ''}`)}>
              <QrcodeOutlined style={{ fontSize: 20, color: '#0891b2', marginBottom: 4 }} />
              <div style={{ fontSize: 12, fontWeight: 600 }}>Check In / Out</div>
              <div style={{ fontSize: 11, color: '#888' }}>Scan QR</div>
            </Card>
          </Col>
          <Col span={12}>
            <Card size="small" hoverable bodyStyle={{ padding: '14px 8px', textAlign: 'center' }} onClick={() => navigate('/ess/leave')}>
              <FileTextOutlined style={{ fontSize: 20, color: '#059669', marginBottom: 4 }} />
              <div style={{ fontSize: 12, fontWeight: 600 }}>Leave</div>
              <div style={{ fontSize: 11, color: '#888' }}>Apply / View</div>
            </Card>
          </Col>
          <Col span={12}>
            <Card size="small" hoverable bodyStyle={{ padding: '14px 8px', textAlign: 'center' }} onClick={() => navigate('/ess/payslips')}>
              <CheckCircleOutlined style={{ fontSize: 20, color: '#d97706', marginBottom: 4 }} />
              <div style={{ fontSize: 12, fontWeight: 600 }}>Payslips</div>
              <div style={{ fontSize: 11, color: '#888' }}>Download</div>
            </Card>
          </Col>
          <Col span={12}>
            <Card size="small" hoverable bodyStyle={{ padding: '14px 8px', textAlign: 'center' }} onClick={() => navigate('/ess/assets')}>
              <LaptopOutlined style={{ fontSize: 20, color: '#0d9488', marginBottom: 4 }} />
              <div style={{ fontSize: 12, fontWeight: 600 }}>Assets</div>
              <div style={{ fontSize: 11, color: '#888' }}>View Allocated</div>
            </Card>
          </Col>
          <Col span={12}>
            <Card size="small" hoverable bodyStyle={{ padding: '14px 8px', textAlign: 'center' }} onClick={() => navigate('/ess/shift-swaps')}>
              <SwapOutlined style={{ fontSize: 20, color: '#7c3aed', marginBottom: 4 }} />
              <div style={{ fontSize: 12, fontWeight: 600 }}>Shift Swap</div>
              <div style={{ fontSize: 11, color: '#888' }}>Request / View</div>
            </Card>
          </Col>
          <Col span={12}>
            <Card size="small" hoverable bodyStyle={{ padding: '14px 8px', textAlign: 'center' }} onClick={() => navigate('/ess/training')}>
              <BookOutlined style={{ fontSize: 20, color: '#0891b2', marginBottom: 4 }} />
              <div style={{ fontSize: 12, fontWeight: 600 }}>Training</div>
              <div style={{ fontSize: 11, color: '#888' }}>View Programs</div>
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
            <span style={{ fontSize: 28, fontWeight: 700, color: '#faad14' }}>{pendingRequests}</span>
            <div style={{ marginTop: 4, fontSize: 13, color: '#888' }}>
              pending request{pendingRequests > 1 ? 's' : ''} awaiting approval
            </div>
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '16px', fontSize: 13, color: '#888' }}>
            No pending requests
          </div>
        )}
      </Card>
    </div>
  );
}
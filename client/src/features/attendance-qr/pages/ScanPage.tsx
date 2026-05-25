import { useState, useCallback } from 'react';
import { Button, Input, message, Spin, Result, Typography } from 'antd';
import { CameraOutlined, ScanOutlined, CheckCircleOutlined, QrcodeOutlined } from '@ant-design/icons';
import { attendanceQRService } from '../services/attendanceQRService';
import { useSearchParams } from 'react-router-dom';

type ScanStep = 'scan' | 'totp' | 'confirm';

export function ScanPage() {
  const [searchParams] = useSearchParams();
  const [step, setStep] = useState<ScanStep>('scan');
  const [qrToken, setQrToken] = useState(searchParams.get('token') || '');
  const [employeeId, setEmployeeId] = useState(searchParams.get('employeeId') || '');
  const [totpCode, setTotpCode] = useState('');
  const [mode, setMode] = useState<'checkin' | 'checkout'>('checkin');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ message: string; isLate?: boolean } | null>(null);
  const [deviceId, setDeviceId] = useState('');

  const { Title, Text } = Typography;

  const handleProcess = useCallback(async () => {
    if (!qrToken || !totpCode || !employeeId) {
      message.warning('Please fill all fields');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        token: qrToken,
        totpCode,
        employeeId,
        deviceId: deviceId || undefined,
      };

      const res = mode === 'checkin'
        ? await attendanceQRService.checkIn(payload)
        : await attendanceQRService.checkOut(payload);

      setResult({ message: res.data.message, isLate: (res.data as any).isLate });
      setStep('confirm');
    } catch (err: any) {
      message.error(err?.response?.data?.message || 'Failed to process');
    } finally {
      setLoading(false);
    }
  }, [qrToken, totpCode, employeeId, deviceId, mode]);

  const handleManualEntry = () => {
    setStep('totp');
  };

  const handleReset = () => {
    setStep('scan');
    setQrToken('');
    setTotpCode('');
    setResult(null);
    setEmployeeId('');
  };

  if (step === 'confirm' && result) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f5f5', padding: 20 }}>
        <Result
          status={result.isLate ? 'warning' : 'success'}
          icon={result.isLate ? undefined : <CheckCircleOutlined style={{ color: '#52c41a', fontSize: 64 }} />}
          title={result.isLate ? 'Checked in Late' : mode === 'checkin' ? 'Check-in Successful' : 'Check-out Successful'}
          subTitle={result.message}
          extra={[
            <Button type="primary" key="done" onClick={handleReset} size="large">Done</Button>,
          ]}
        />
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      background: '#f5f5f5', padding: 24, fontFamily: 'system-ui, sans-serif',
    }}>
      <div style={{
        background: '#fff', borderRadius: 16, padding: 32,
        width: '100%', maxWidth: 400, boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
      }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <QrcodeOutlined style={{ fontSize: 48, color: '#1a1a2e', marginBottom: 12 }} />
          <Title level={4} style={{ margin: 0 }}>Orian Attendance</Title>
          <Text type="secondary">{mode === 'checkin' ? 'Check In' : 'Check Out'}</Text>
        </div>

        {step === 'scan' && (
          <div style={{ textAlign: 'center' }}>
            <div style={{
              border: '2px dashed #d9d9d9', borderRadius: 12,
              padding: 40, marginBottom: 16, cursor: 'pointer',
            }}>
              <ScanOutlined style={{ fontSize: 56, color: '#1677ff' }} />
            </div>
            <Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>
              Scan the QR code displayed on the kiosk
            </Text>

            <div style={{ marginBottom: 12 }}>
              <Input placeholder="Or paste QR token here" value={qrToken} onChange={e => setQrToken(e.target.value)} size="large" />
            </div>
            <div style={{ marginBottom: 16 }}>
              <Input placeholder="Employee ID" value={employeeId} onChange={e => setEmployeeId(e.target.value)} size="large" />
            </div>

            <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
              <Button type="primary" size="large" block onClick={handleManualEntry} icon={<CameraOutlined />}>
                Continue
              </Button>
            </div>

            <Button type="link" size="small" onClick={() => setMode(mode === 'checkin' ? 'checkout' : 'checkin')}>
              Switch to {mode === 'checkin' ? 'Check Out' : 'Check In'}
            </Button>
          </div>
        )}

        {step === 'totp' && (
          <div style={{ textAlign: 'center' }}>
            <Title level={5}>Enter TOTP Code</Title>
            <Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>
              Open your authenticator app and enter the 6-digit code
            </Text>

            <Input.OTP
              length={6}
              value={totpCode}
              onChange={(val) => setTotpCode(val)}
              size="large"
              style={{ marginBottom: 16 }}
            />

            <Input
              placeholder="Device ID (optional)"
              value={deviceId}
              onChange={e => setDeviceId(e.target.value)}
              size="large"
              style={{ marginBottom: 16 }}
            />

            <Button
              type="primary"
              size="large"
              block
              onClick={handleProcess}
              loading={loading}
              icon={<CheckCircleOutlined />}
            >
              {mode === 'checkin' ? 'Check In' : 'Check Out'}
            </Button>

            <Button type="link" size="small" onClick={() => setStep('scan')} style={{ marginTop: 8 }}>
              Back
            </Button>
          </div>
        )}

        {loading && (
          <div style={{ textAlign: 'center', marginTop: 16 }}>
            <Spin />
            <Text type="secondary" style={{ display: 'block', marginTop: 8 }}>Processing...</Text>
          </div>
        )}
      </div>
    </div>
  );
}

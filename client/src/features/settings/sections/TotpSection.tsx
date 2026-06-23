import { Card, Button, Select, Alert, Typography } from 'antd';
import { SafetyCertificateOutlined } from '@ant-design/icons';
import { useState, useRef, useCallback, useEffect } from 'react';
import QRCode from 'qrcode-generator';
import type { Employee } from '../../employees/services/employeeService';

const { Text, Paragraph } = Typography;

interface TotpSectionProps {
  employees: Employee[];
}

export function TotpSection({ employees }: TotpSectionProps) {
  const [totpEmployee, setTotpEmployee] = useState<string>('');
  const [totpQrUrl, setTotpQrUrl] = useState<string>('');
  const [totpSecret, setTotpSecret] = useState<string>('');
  const [totpLoading, setTotpLoading] = useState(false);
  const totpCanvasRef = useRef<HTMLCanvasElement>(null);

  const drawTotpQR = useCallback(() => {
    if (!totpCanvasRef.current || !totpQrUrl) return;
    const qr = QRCode(0, 'M');
    qr.addData(totpQrUrl);
    qr.make();
    const ctx = totpCanvasRef.current.getContext('2d');
    if (!ctx) return;
    const cellSize = 6;
    const margin = 4;
    const size = qr.getModuleCount();
    const canvasSize = (size + margin * 2) * cellSize;
    totpCanvasRef.current.width = canvasSize;
    totpCanvasRef.current.height = canvasSize;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvasSize, canvasSize);
    ctx.fillStyle = '#1a1a2e';
    for (let row = 0; row < size; row++) {
      for (let col = 0; col < size; col++) {
        if (qr.isDark(row, col)) {
          ctx.fillRect((col + margin) * cellSize, (row + margin) * cellSize, cellSize, cellSize);
        }
      }
    }
  }, [totpQrUrl]);

  useEffect(() => {
    if (totpQrUrl) setTimeout(drawTotpQR, 100);
  }, [totpQrUrl, drawTotpQR]);

  const handleTotpEnroll = async () => {
    if (!totpEmployee) { return; }
    setTotpLoading(true);
    try {
      const { totpService } = await import('../../attendance-qr/services/attendanceQRService');
      const res = await totpService.enroll(totpEmployee);
      setTotpQrUrl(res.data.qrUrl);
      setTotpSecret(res.data.secret);
    } catch {
      // error handled by service
    } finally {
      setTotpLoading(false);
    }
  };

  const handleTotpDisable = async () => {
    if (!totpEmployee) return;
    try {
      const { totpService } = await import('../../attendance-qr/services/attendanceQRService');
      await totpService.disable(totpEmployee);
      setTotpQrUrl('');
      setTotpSecret('');
    } catch {
      // error handled by service
    }
  };

  return (
    <Card title="TOTP Enrollment" style={{ borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
      <div style={{ paddingTop: 8 }}>
        <div style={{ marginBottom: 24 }}>
          <div style={{ marginBottom: 8, fontWeight: 500 }}>Select Employee</div>
          <Select
            showSearch
            style={{ width: '100%' }}
            placeholder="Search employee by name or code"
            value={totpEmployee || undefined}
            onChange={(val) => { setTotpEmployee(val); setTotpQrUrl(''); setTotpSecret(''); }}
            filterOption={(input, option) =>
              (option?.label as string || '').toLowerCase().includes(input.toLowerCase())
            }
            options={employees.map((emp) => ({
              label: `${emp.fullName} (${emp.employeeCode})`,
              value: emp.id,
            }))}
            size="large"
          />
        </div>

        <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
          <Button type="primary" icon={<SafetyCertificateOutlined />} onClick={handleTotpEnroll} loading={totpLoading} size="large">
            Generate TOTP Secret
          </Button>
          <Button danger icon={<SafetyCertificateOutlined />} onClick={handleTotpDisable} size="large">
            Disable TOTP
          </Button>
        </div>

        {totpQrUrl && (
          <Alert
            type="success"
            showIcon
            message="TOTP Enrolled Successfully"
            description={
              <div>
                <Paragraph>
                  Ask the employee to scan this QR code with their authenticator app
                  (Google Authenticator, Microsoft Authenticator, or Authy).
                </Paragraph>
                <div style={{ textAlign: 'center', margin: '16px 0' }}>
                  <canvas ref={totpCanvasRef} style={{ display: 'inline-block', borderRadius: 8 }} />
                </div>
                <Paragraph copyable={{ text: totpQrUrl }}>
                  <Text type="secondary" style={{ fontSize: 12, wordBreak: 'break-all' }}>
                    OTPAuth URI: {totpQrUrl}
                  </Text>
                </Paragraph>
                <Paragraph copyable={{ text: totpSecret }}>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    Secret: {totpSecret}
                  </Text>
                </Paragraph>
              </div>
            }
          />
        )}

        {!totpQrUrl && (
          <div style={{ textAlign: 'center', padding: 40, color: 'var(--hrms-text-muted)' }}>
            <SafetyCertificateOutlined style={{ fontSize: 48, marginBottom: 12 }} />
            <div>Select an employee and click "Generate TOTP Secret" to enroll</div>
          </div>
        )}
      </div>
    </Card>
  );
}

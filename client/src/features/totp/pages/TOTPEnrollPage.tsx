import { useState, useEffect } from 'react';
import { Card, Button, Select, message, Alert, Typography } from 'antd';
import { SafetyCertificateOutlined, QrcodeOutlined } from '@ant-design/icons';
import { PageHeader } from '../../../core/components/PageHeader';
import { totpService } from '../../attendance-qr/services/attendanceQRService';

const { Title, Text, Paragraph } = Typography;

export function TOTPEnrollPage() {
  const [employees, setEmployees] = useState<any[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<string>('');
  const [qrUrl, setQrUrl] = useState<string>('');
  const [secret, setSecret] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [employeesLoading, setEmployeesLoading] = useState(false);

  useEffect(() => {
    loadEmployees();
  }, []);

  const loadEmployees = async () => {
    setEmployeesLoading(true);
    try {
      const mod = await import('../../employees/services/employeeService');
      const res = await mod.employeeService.list({ limit: 500, status: 'active' });
      setEmployees(res.data || []);
    } catch {
      message.error('Failed to load employees');
    } finally {
      setEmployeesLoading(false);
    }
  };

  const handleEnroll = async () => {
    if (!selectedEmployee) {
      message.warning('Select an employee');
      return;
    }

    setLoading(true);
    try {
      const res = await totpService.enroll(selectedEmployee);
      setQrUrl(res.data.qrUrl);
      setSecret(res.data.qrUrl);
      message.success('TOTP enrolled successfully');
    } catch (err: any) {
      message.error(err?.response?.data?.message || 'Failed to enroll TOTP');
    } finally {
      setLoading(false);
    }
  };

  const handleDisable = async () => {
    if (!selectedEmployee) return;
    try {
      await totpService.disable(selectedEmployee);
      setQrUrl('');
      setSecret('');
      message.success('TOTP disabled');
    } catch (err: any) {
      message.error(err?.response?.data?.message || 'Failed to disable');
    }
  };

  return (
    <div style={{ padding: '0 4px' }}>
      <PageHeader
        title="TOTP Enrollment"
        subtitle="Configure authenticator app for employees"
      />

      <Card style={{ maxWidth: 600 }}>
        <div style={{ marginBottom: 24 }}>
          <Title level={5}>Select Employee</Title>
          <Select
            showSearch
            style={{ width: '100%' }}
            placeholder="Search employee by name or code"
            loading={employeesLoading}
            value={selectedEmployee || undefined}
            onChange={(val) => { setSelectedEmployee(val); setQrUrl(''); setSecret(''); }}
            filterOption={(input, option) =>
              (option?.label as string || '').toLowerCase().includes(input.toLowerCase())
            }
            options={employees.map((emp: any) => ({
              label: `${emp.fullName} (${emp.employeeCode})`,
              value: emp.id,
            }))}
            size="large"
          />
        </div>

        <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
          <Button type="primary" icon={<SafetyCertificateOutlined />} onClick={handleEnroll} loading={loading} size="large">
            Generate TOTP Secret
          </Button>
          <Button danger icon={<QrcodeOutlined />} onClick={handleDisable} size="large">
            Disable TOTP
          </Button>
        </div>

        {qrUrl && (
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
                  <img src={qrUrl} alt="TOTP QR Code" style={{ width: 200, height: 200 }} />
                </div>
                <Paragraph copyable={{ text: secret }}>
                  <Text type="secondary">OTPAuth URI: {secret}</Text>
                </Paragraph>
              </div>
            }
          />
        )}

        {!qrUrl && (
          <div style={{ textAlign: 'center', padding: 40, color: '#888' }}>
            <QrcodeOutlined style={{ fontSize: 48, marginBottom: 12 }} />
            <div>Select an employee and click "Generate TOTP Secret" to enroll</div>
          </div>
        )}
      </Card>
    </div>
  );
}

import { Form, Input, InputNumber, Switch, Button, Row, Col } from 'antd';
import { SaveOutlined } from '@ant-design/icons';

export function AttendanceSection({ form, onSave }: { form: any; onSave: (values: any) => void }) {
  return (
    <Form form={form} layout="vertical" onFinish={onSave}>
      <h3 style={{ marginBottom: 16 }}>Attendance Configuration</h3>

      <h4 style={{ margin: '16px 0 8px' }}>General Rules</h4>
      <Row gutter={16}>
        <Col span={8}>
          <Form.Item name={['attendanceConfig', 'pastEntryLimitDays']} label="Past Entry Limit (Days)">
            <InputNumber style={{ width: '100%', height: 40 }} min={0} />
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item name={['attendanceConfig', 'lateMarkEnabled']} label="Late Mark Enabled" valuePropName="checked">
            <Switch />
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item name={['attendanceConfig', 'lateMarkThresholdMinutes']} label="Late Threshold (Min)">
            <InputNumber style={{ width: '100%', height: 40 }} min={0} />
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item name={['attendanceConfig', 'lateToHalfDayAfterOccurrences']} label="Late to Half Day After">
            <InputNumber style={{ width: '100%', height: 40 }} min={0} />
          </Form.Item>
        </Col>
      </Row>

      <h4 style={{ margin: '16px 0 8px' }}>Shift & Grace Rules</h4>
      <Row gutter={16}>
        <Col span={6}>
          <Form.Item name={['attendanceConfig', 'shiftStartTime']} label="Shift Start Time">
            <Input style={{ width: '100%', height: 40 }} placeholder="09:00" />
          </Form.Item>
        </Col>
        <Col span={6}>
          <Form.Item name={['attendanceConfig', 'shiftEndTime']} label="Shift End Time">
            <Input style={{ width: '100%', height: 40 }} placeholder="18:00" />
          </Form.Item>
        </Col>
        <Col span={6}>
          <Form.Item name={['attendanceConfig', 'gracePeriodMinutes']} label="Grace Period (Min)">
            <InputNumber style={{ width: '100%', height: 40 }} min={0} />
          </Form.Item>
        </Col>
        <Col span={6}>
          <Form.Item name={['attendanceConfig', 'lateMarkAsAbsent']} label="Late = Absent" valuePropName="checked">
            <Switch />
          </Form.Item>
        </Col>
        <Col span={6}>
          <Form.Item name={['attendanceConfig', 'lateTreatWorkAsOT']} label="Late Work = OT" valuePropName="checked">
            <Switch />
          </Form.Item>
        </Col>
      </Row>

      <div style={{ marginTop: 24, padding: 16, background: '#f0f5ff', borderRadius: 8, border: '1px solid #d9e6ff' }}>
        <h4 style={{ marginBottom: 12 }}>QR Kiosk System</h4>
        <Row gutter={16}>
          <Col span={6}>
            <Form.Item name={['attendanceConfig', 'qrKioskEnabled']} label="Enable QR Kiosk" valuePropName="checked">
              <Switch />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item name={['attendanceConfig', 'qrRefreshIntervalSeconds']} label="QR Refresh Interval (s)">
              <InputNumber style={{ width: '100%', height: 40 }} min={5} max={60} />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item name={['attendanceConfig', 'qrTokenExpirySeconds']} label="QR Token Expiry (s)">
              <InputNumber style={{ width: '100%', height: 40 }} min={5} max={60} />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item name={['attendanceConfig', 'totpEnabled']} label="Enable TOTP" valuePropName="checked">
              <Switch />
            </Form.Item>
          </Col>
        </Row>
        <Row gutter={16}>
          <Col span={6}>
            <Form.Item name={['attendanceConfig', 'geofencingEnabled']} label="Enable Geofencing" valuePropName="checked">
              <Switch />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item name={['attendanceConfig', 'geofenceLatitude']} label="Gate Latitude">
              <InputNumber style={{ width: '100%', height: 40 }} min={-90} max={90} step={0.0001} />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item name={['attendanceConfig', 'geofenceLongitude']} label="Gate Longitude">
              <InputNumber style={{ width: '100%', height: 40 }} min={-180} max={180} step={0.0001} />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item name={['attendanceConfig', 'geofenceRadiusMeters']} label="Geofence Radius (m)">
              <InputNumber style={{ width: '100%', height: 40 }} min={10} max={1000} />
            </Form.Item>
          </Col>
        </Row>
        <Row gutter={16}>
          <Col span={6}>
            <Form.Item name={['attendanceConfig', 'supervisorOverrideEnabled']} label="Supervisor Override" valuePropName="checked">
              <Switch />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item name={['attendanceConfig', 'deviceBindingEnabled']} label="Device Binding" valuePropName="checked">
              <Switch />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item name={['attendanceConfig', 'maxDevicesPerEmployee']} label="Max Devices / Employee">
              <InputNumber style={{ width: '100%', height: 40 }} min={1} max={5} />
            </Form.Item>
          </Col>
        </Row>
      </div>

      <Button type="primary" icon={<SaveOutlined />} htmlType="submit" style={{ marginTop: 16 }}>
        Save Attendance Settings
      </Button>
    </Form>
  );
}

import { useState, useCallback, useEffect, useRef } from 'react';
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
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [hasBarcodeDetector, setHasBarcodeDetector] = useState(true);

  const { Title, Text } = Typography;
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const jsqrRef = useRef<any>(null);

  const getJsqr = useCallback(async () => {
    if (!jsqrRef.current) {
      jsqrRef.current = await import('jsqr');
    }
    return jsqrRef.current;
  }, []);

  const stopCamera = useCallback(() => {
    if (scanTimerRef.current) {
      clearInterval(scanTimerRef.current);
      scanTimerRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
  }, []);

  const decodeQR = useCallback(async (video: HTMLVideoElement, canvas: HTMLCanvasElement): Promise<string | null> => {
    const width = video.videoWidth;
    const height = video.videoHeight;
    if (!width || !height) return null;

    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    ctx.drawImage(video, 0, 0, width, height);
    const imageData = ctx.getImageData(0, 0, width, height);

    if ('BarcodeDetector' in window && window.BarcodeDetector) {
      try {
        const detector = new window.BarcodeDetector({ formats: ['qr_code'] });
        const barcodes = await detector.detect(canvas);
        if (barcodes.length > 0) return barcodes[0].rawValue;
      } catch {
        // BarcodeDetector failed, fall through to jsQR
      }
    }

    const jsqrModule = await getJsqr();
    const result = jsqrModule.default(imageData.data, width, height);
    return result?.data || null;
  }, [getJsqr]);

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 640 }, height: { ideal: 480 } },
      });
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();

        setCameraActive(true);
        setCameraError('');

        // Check if BarcodeDetector is available
        setHasBarcodeDetector('BarcodeDetector' in window);

        // Start scanning frames
        scanTimerRef.current = setInterval(async () => {
          const video = videoRef.current;
          const canvas = canvasRef.current;
          if (!video || !canvas) return;

          const token = await decodeQR(video, canvas);
          if (token) {
            stopCamera();
            setQrToken(token);
            message.success('QR scanned successfully');
            setStep('totp');
          }
        }, 500);
      }
    } catch (err: any) {
      const msg = err?.message || '';
      if (msg.includes('NotAllowed') || msg.includes('Permission')) {
        setCameraError('Camera permission denied. Please allow camera access in your browser settings.');
      } else if (msg.includes('NotFound')) {
        setCameraError('No camera found on this device.');
      } else if (msg.includes('NotReadable')) {
        setCameraError('Camera is being used by another app.');
      } else if (msg.includes('Security') || msg.includes('HTTP')) {
        setCameraError('Camera access requires HTTPS. Use https:// or localhost.');
      } else {
        setCameraError('Camera unavailable — paste the QR token below.');
      }
      setCameraActive(false);
    }
  }, [stopCamera, decodeQR]);

  useEffect(() => {
    if (step === 'scan') {
      startCamera();
    } else {
      stopCamera();
    }
    return stopCamera;
  }, [step, startCamera, stopCamera]);

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

      setResult({ message: res.data.message, isLate: 'isLate' in res.data ? res.data.isLate : false });
      setStep('confirm');
    } catch (err: any) {
      message.error(err?.response?.data?.message || 'Failed to process');
    } finally {
      setLoading(false);
    }
  }, [qrToken, totpCode, employeeId, deviceId, mode]);

  const handleContinue = () => {
    if (!qrToken) {
      message.warning('Please paste the QR token');
      return;
    }
    setStep('totp');
  };

  const handleReset = () => {
    setStep('scan');
    setQrToken('');
    setTotpCode('');
    setResult(null);
    setEmployeeId('');
    setCameraActive(false);
    setCameraError('');
  };

  if (step === 'confirm' && result) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--hrms-bg)', padding: 20 }}>
        <Result
          status={result.isLate ? 'warning' : 'success'}
          icon={result.isLate ? undefined : <CheckCircleOutlined style={{ color: 'var(--hrms-success)', fontSize: 64 }} />}
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
      background: 'var(--hrms-bg)', padding: 24, fontFamily: 'system-ui, sans-serif',
    }}>
      <div style={{
        background: 'var(--hrms-surface)', borderRadius: 16, padding: 32,
        width: '100%', maxWidth: 400, boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
      }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <QrcodeOutlined style={{ fontSize: 48, color: 'var(--hrms-text-primary)', marginBottom: 12 }} />
          <Title level={4} style={{ margin: 0 }}>Orian Attendance</Title>
          <Text type="secondary">{mode === 'checkin' ? 'Check In' : 'Check Out'}</Text>
        </div>

        {step === 'scan' && (
          <div style={{ textAlign: 'center' }}>
            <div style={{
              border: '2px dashed #d9d9d9', borderRadius: 12,
              marginBottom: 16, overflow: 'hidden', position: 'relative',
              minHeight: 220, background: cameraActive ? 'var(--hrms-text-primary)' : 'transparent',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {cameraActive ? (
                <>
                  <video ref={videoRef} playsInline style={{ width: '100%', display: 'block' }} />
                  <canvas ref={canvasRef} style={{ display: 'none' }} />
                </>
              ) : (
                <ScanOutlined style={{ fontSize: 56, color: 'var(--hrms-info)' }} />
              )}
            </div>

            {cameraActive ? (
              <Text type="success" style={{ display: 'block', marginBottom: 16 }}>
                Camera active — point at kiosk QR code
                {!hasBarcodeDetector && <span style={{ color: 'var(--hrms-text-muted)', fontSize: 12 }}> (loading decoder...)</span>}
              </Text>
            ) : (
              <Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>
                {cameraError || 'Starting camera...'}
              </Text>
            )}

            <div style={{ marginBottom: 12 }}>
              <Input placeholder="Or paste QR token here" value={qrToken} onChange={e => setQrToken(e.target.value)} size="large" />
            </div>
            <div style={{ marginBottom: 16 }}>
              <Input placeholder="Employee ID" value={employeeId} onChange={e => setEmployeeId(e.target.value)} size="large" />
            </div>

            <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
              <Button type="primary" size="large" block onClick={handleContinue} icon={<CameraOutlined />}>
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

import { useEffect, useState, useRef, useCallback } from 'react';
import QRCode from 'qrcode-generator';
import { connectKiosk, disconnectKiosk } from '../../../core/socket/socketClient';
import apiClient from '../../../core/api/apiClient';
import { message } from 'antd';
import { PageContainer } from '../../../core/components/PageContainer';

const POLL_INTERVAL = 30_000;

function drawQR(canvas: HTMLCanvasElement, qrData: string) {
  const qr = QRCode(0, 'M');
  qr.addData(qrData);
  qr.make();

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const cellSize = 6;
  const margin = 4;
  const size = qr.getModuleCount();
  const canvasSize = (size + margin * 2) * cellSize;
  canvas.width = canvasSize;
  canvas.height = canvasSize;

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
}

async function fetchQR(kioskId: string): Promise<string | null> {
  try {
    const res = await apiClient.get(`/api/v1/kiosk/${kioskId}/qr/public`);
    return res.data?.data?.qrToken ?? null;
  } catch {
    return null;
  }
}

export function KioskPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [time, setTime] = useState(new Date());
  const [kioskId] = useState(() => new URLSearchParams(window.location.search).get('kioskId') || 'main-gate');
  const [connected, setConnected] = useState(false);
  const [usingSocket, setUsingSocket] = useState(false);
  const [rawToken, setRawToken] = useState('');
  const pollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const updateQR = useCallback((qrData: string) => {
    setConnected(true);
    setRawToken(qrData);
    if (canvasRef.current) {
      drawQR(canvasRef.current, qrData);
    }
  }, []);

  const startPolling = useCallback(() => {
    setUsingSocket(false);
    if (pollTimerRef.current) clearInterval(pollTimerRef.current);

    const poll = async () => {
      const qrData = await fetchQR(kioskId);
      if (qrData) {
        updateQR(qrData);
      } else {
        setConnected(false);
      }
    };

    poll();
    pollTimerRef.current = setInterval(poll, POLL_INTERVAL);
  }, [kioskId, updateQR]);

  useEffect(() => {
    const socket = connectKiosk(kioskId);

    socket.on('qr-update', ({ qrData }: { qrData: string }) => {
      setUsingSocket(true);
      updateQR(qrData);
    });

    socket.on('connect', () => {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    });

    socket.on('disconnect', () => {
      startPolling();
    });

    setTimeout(() => {
      if (!usingSocket) {
        startPolling();
      }
    }, 5000);

    return () => {
      disconnectKiosk();
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    };
  }, [kioskId, startPolling, updateQR, usingSocket]);

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <PageContainer>
    <div style={{
      width: '100vw', height: '100vh',
      background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      color: 'var(--hrms-surface)', fontFamily: 'system-ui, sans-serif',
      overflow: 'hidden',
    }}>
      <div style={{ fontSize: 64, fontWeight: 700, marginBottom: 8, letterSpacing: 2 }}>
        {time.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}
      </div>
      <div style={{ fontSize: 16, color: '#8899aa', marginBottom: 40 }}>
        {time.toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
      </div>

      <div style={{
        background: 'var(--hrms-surface)', borderRadius: 16, padding: 24,
        boxShadow: '0 8px 32px rgba(0,0,0,0.3)', marginBottom: 32,
      }}>
        <canvas ref={canvasRef} style={{ display: 'block' }} />
      </div>

      {rawToken && (
        <div style={{ marginBottom: 24, maxWidth: 400, width: '100%' }}>
          <div style={{ fontSize: 11, color: '#556677', marginBottom: 4 }}>
            Raw Token (copy for manual entry):
            <span
              onClick={() => {
                navigator.clipboard.writeText(rawToken);
                message.success('Token copied');
              }}
              style={{ marginLeft: 8, cursor: 'pointer', color: 'var(--hrms-info)', textDecoration: 'underline' }}
            >
              Copy
            </span>
          </div>
          <div style={{
            fontSize: 10, color: '#8899aa', wordBreak: 'break-all',
            background: 'rgba(255,255,255,0.05)', padding: '8px 12px',
            borderRadius: 8, fontFamily: 'monospace', maxHeight: 60, overflowY: 'auto',
          }}>
            {rawToken}
          </div>
        </div>
      )}

      <div style={{ fontSize: 20, fontWeight: 600, marginBottom: 8 }}>Scan to Check In / Out</div>
      <div style={{ fontSize: 14, color: '#8899aa', textAlign: 'center', maxWidth: 400, lineHeight: 1.6 }}>
        {rawToken ? (
          <>
            1. Click <strong>Copy</strong> above to copy the token<br />
            2. Open the scan page in another tab<br />
            3. Paste the token and enter your TOTP code
          </>
        ) : (
          <>
            1. Open your Orian app on your phone<br />
            2. Scan this QR code<br />
            3. Enter your TOTP code from authenticator app
          </>
        )}
      </div>

      <div style={{ position: 'absolute', bottom: 24, fontSize: 12, color: '#556677' }}>
        Orian HRMS — Kiosk: {kioskId}
        <span style={{ marginLeft: 8 }}>
          {connected ? '🟢 Connected' : '🔴 Disconnected'}
        </span>
        <span style={{ marginLeft: 8, opacity: 0.5 }}>
          {usingSocket ? '(realtime)' : '(polling)'}
        </span>
      </div>
    </div>
    </PageContainer>
  );
}

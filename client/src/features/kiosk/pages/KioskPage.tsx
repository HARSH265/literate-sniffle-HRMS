import { useEffect, useState, useRef } from 'react';
import { qrcode as QRCode } from 'qrcode-generator';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

async function fetchQR(kioskId: string): Promise<string | null> {
  try {
    const res = await fetch(`${API_URL}/api/v1/kiosk/${kioskId}/qr/public`);
    if (!res.ok) return null;
    const body = await res.json();
    return body?.data?.qrToken ?? null;
  } catch {
    return null;
  }
}

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

export function KioskPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [time, setTime] = useState(new Date());
  const [kioskId] = useState(() => new URLSearchParams(window.location.search).get('kioskId') || 'main-gate');
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const poll = async () => {
      const qrData = await fetchQR(kioskId);
      if (cancelled) return;
      setConnected(qrData !== null);
      if (qrData && canvasRef.current) {
        drawQR(canvasRef.current, qrData);
      }
    };

    poll();
    const interval = setInterval(poll, 15_000);
    return () => { cancelled = true; clearInterval(interval); };
  }, [kioskId]);

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div style={{
      width: '100vw', height: '100vh',
      background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      color: '#fff', fontFamily: 'system-ui, sans-serif',
      overflow: 'hidden',
    }}>
      <div style={{ fontSize: 64, fontWeight: 700, marginBottom: 8, letterSpacing: 2 }}>
        {time.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}
      </div>
      <div style={{ fontSize: 16, color: '#8899aa', marginBottom: 40 }}>
        {time.toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
      </div>

      <div style={{
        background: '#fff', borderRadius: 16, padding: 24,
        boxShadow: '0 8px 32px rgba(0,0,0,0.3)', marginBottom: 32,
      }}>
        <canvas ref={canvasRef} style={{ display: 'block' }} />
      </div>

      <div style={{ fontSize: 20, fontWeight: 600, marginBottom: 8 }}>Scan to Check In / Out</div>
      <div style={{ fontSize: 14, color: '#8899aa', textAlign: 'center', maxWidth: 400, lineHeight: 1.6 }}>
        1. Open your Orian app on your phone<br />
        2. Scan this QR code<br />
        3. Enter your TOTP code from authenticator app
      </div>

      <div style={{ position: 'absolute', bottom: 24, fontSize: 12, color: '#556677' }}>
        Orian HRMS — Kiosk: {kioskId} {connected ? '🟢 Connected' : '🔴 Disconnected'}
      </div>
    </div>
  );
}
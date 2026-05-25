import { useEffect, useRef } from 'react';
import QRCodeGenerator from 'qrcode-generator';

interface KioskQRProps {
  qrData: string;
  size?: number;
}

export function KioskQR({ qrData, size = 300 }: KioskQRProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !qrData) return;

    const qr = QRCodeGenerator(0, 'M');
    qr.addData(qrData);
    qr.make();

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const cellSize = Math.floor(size / (qr.getModuleCount() + 8));
    const margin = 4;
    const modules = qr.getModuleCount();
    const canvasSize = modules * cellSize + margin * 2 * cellSize;
    canvas.width = canvasSize;
    canvas.height = canvasSize;

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvasSize, canvasSize);
    ctx.fillStyle = '#1a1a2e';
    for (let row = 0; row < modules; row++) {
      for (let col = 0; col < modules; col++) {
        if (qr.isDark(row, col)) {
          ctx.fillRect((col + margin) * cellSize, (row + margin) * cellSize, cellSize, cellSize);
        }
      }
    }
  }, [qrData, size]);

  return <canvas ref={canvasRef} style={{ display: 'block' }} />;
}
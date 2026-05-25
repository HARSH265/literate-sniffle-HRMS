import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import KioskDevice from '../../models/KioskDevice.model.js';
import CompanySettings from '../../models/CompanySettings.model.js';
import { emitQR } from '../../core/socket/socket.js';
import { AppError } from '../../core/errors/AppError.js';
import { AuditService } from '../../core/audit/AuditService.js';

const QR_SECRET = process.env.QR_SECRET || crypto.randomBytes(64).toString('hex');

interface QRTokenPayload {
  kioskId: string;
  nonce: string;
  iat: number;
  exp: number;
}

export class KioskService {
  static async registerDevice(data: { name: string; latitude: number; longitude: number; address?: string }, userId: string): Promise<Record<string, unknown>> {
    const device = await KioskDevice.create({
      name: data.name,
      location: { latitude: data.latitude, longitude: data.longitude, address: data.address },
      registeredBy: userId,
    });

    await AuditService.log({
      action: 'kiosk-register',
      module: 'attendance',
      userId,
      targetId: String(device._id),
      details: { name: data.name },
    });

    return { id: String(device._id), name: device.name };
  }

  static async listDevices(): Promise<unknown[]> {
    return KioskDevice.find({}).lean();
  }

  static async generateQR(kioskId: string): Promise<{ qrToken: string; expiresAt: number }> {
    const device = await KioskDevice.findById(kioskId);
    if (!device) throw new AppError('Kiosk device not found', 404);
    if (!device.isActive) throw new AppError('Kiosk device is inactive', 400);

    const settings = await CompanySettings.findOne().lean();
    const config = (settings?.attendanceConfig as any) || {};
    const expirySeconds = config.qrTokenExpirySeconds || 15;

    const nonce = crypto.randomBytes(16).toString('hex');
    const now = Math.floor(Date.now() / 1000);
    const payload: QRTokenPayload = {
      kioskId,
      nonce,
      iat: now,
      exp: now + expirySeconds,
    };

    const qrToken = jwt.sign(payload, QR_SECRET, { algorithm: 'HS256' });

    await device.updateOne({ lastSeenAt: new Date() });

    return { qrToken, expiresAt: (now + expirySeconds) * 1000 };
  }

  static async validateQRToken(token: string): Promise<{ kioskId: string; nonce: string }> {
    try {
      const payload = jwt.verify(token, QR_SECRET, { algorithms: ['HS256'] }) as QRTokenPayload;
      if (payload.exp < Math.floor(Date.now() / 1000)) {
        throw new AppError('QR token expired', 401);
      }
      return { kioskId: payload.kioskId, nonce: payload.nonce };
    } catch (err: any) {
      if (err instanceof AppError) throw err;
      throw new AppError('Invalid QR token', 401);
    }
  }

  static async startQRBroadcast(kioskId: string): Promise<void> {
    const device = await KioskDevice.findById(kioskId);
    if (!device) throw new AppError('Kiosk device not found', 404);

    const settings = await CompanySettings.findOne().lean();
    const config = (settings?.attendanceConfig as any) || {};
    const refreshInterval = (config.qrRefreshIntervalSeconds || 15) * 1000;

    const generateAndEmit = async () => {
      try {
        const { qrToken, expiresAt } = await KioskService.generateQR(kioskId);
        emitQR(kioskId, qrToken, expiresAt);
      } catch {
        // silent fail for broadcast
      }
    };

    await generateAndEmit();
    setInterval(generateAndEmit, refreshInterval);
  }
}

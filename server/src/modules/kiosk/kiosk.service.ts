import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import mongoose from 'mongoose';
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
  private static toApiResponse(device: any) {
    return {
      id: String(device._id),
      name: device.name,
      deviceCode: device.deviceCode,
      latitude: device.location?.latitude,
      longitude: device.location?.longitude,
      address: device.location?.address,
      isActive: device.isActive,
      lastSeenAt: device.lastSeenAt?.toISOString?.() || device.lastSeenAt,
      createdAt: device.createdAt?.toISOString?.() || device.createdAt,
      updatedAt: device.updatedAt?.toISOString?.() || device.updatedAt,
    };
  }

  private static async generateDeviceCode(name: string): Promise<string> {
    const base = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 30);

    const existing = await KioskDevice.findOne({ deviceCode: base }).lean();
    if (!existing) return base;

    for (let i = 1; i < 1000; i++) {
      const candidate = `${base}-${i}`;
      const conflict = await KioskDevice.findOne({ deviceCode: candidate }).lean();
      if (!conflict) return candidate;
    }

    return `${base}-${crypto.randomBytes(3).toString('hex')}`;
  }

  private static async findByKioskId(kioskId: string) {
    const isObjectId = mongoose.Types.ObjectId.isValid(kioskId);
    const device = isObjectId
      ? await KioskDevice.findById(kioskId)
      : await KioskDevice.findOne({ deviceCode: kioskId });
    if (!device) throw new AppError('Kiosk device not found', 404);
    return device;
  }

  static async registerDevice(data: { name: string; latitude: number; longitude: number; address?: string }, userId: string) {
    const deviceCode = await KioskService.generateDeviceCode(data.name);

    const device = await KioskDevice.create({
      name: data.name,
      deviceCode,
      location: { latitude: data.latitude, longitude: data.longitude, address: data.address },
      registeredBy: userId,
    });

    await AuditService.log({
      action: 'kiosk-register',
      module: 'attendance',
      userId,
      targetId: String(device._id),
      details: { name: data.name, deviceCode },
    });

    KioskService.startQRBroadcast(String(device._id));

    return KioskService.toApiResponse(device);
  }

  static async listDevices() {
    const devices = await KioskDevice.find({}).sort({ createdAt: -1 }).lean();
    return devices.map(KioskService.toApiResponse);
  }

  static async updateDevice(id: string, data: { name?: string; latitude?: number; longitude?: number; address?: string; isActive?: boolean }, userId: string) {
    const device = await KioskDevice.findById(id);
    if (!device) throw new AppError('Kiosk device not found', 404);

    if (data.name !== undefined) {
      device.name = data.name;
      device.deviceCode = await KioskService.generateDeviceCode(data.name);
    }
    if (data.latitude !== undefined) device.location.latitude = data.latitude;
    if (data.longitude !== undefined) device.location.longitude = data.longitude;
    if (data.address !== undefined) device.location.address = data.address;
    if (data.isActive !== undefined) device.isActive = data.isActive;

    await device.save();

    await AuditService.log({
      action: 'update',
      module: 'attendance',
      userId,
      targetId: id,
      details: { name: data.name },
    });

    return KioskService.toApiResponse(device);
  }

  static async deleteDevice(id: string, userId: string) {
    const device = await KioskDevice.findById(id);
    if (!device) throw new AppError('Kiosk device not found', 404);

    await device.deleteOne();

    await AuditService.log({
      action: 'delete',
      module: 'attendance',
      userId,
      targetId: id,
      details: { name: device.name },
    });
  }

  static async generateQR(kioskId: string): Promise<{ qrToken: string; expiresAt: number }> {
    const device = await KioskService.findByKioskId(kioskId);
    if (!device.isActive) throw new AppError('Kiosk device is inactive', 400);

    const settings = await CompanySettings.findOne().lean();
    const config = (settings?.attendanceConfig as any) || {};
    const expirySeconds = config.qrTokenExpirySeconds || 15;

    const nonce = crypto.randomBytes(16).toString('hex');
    const now = Math.floor(Date.now() / 1000);
    const payload: QRTokenPayload = {
      kioskId: String(device._id),
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
    const device = await KioskService.findByKioskId(kioskId);
    void device;
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

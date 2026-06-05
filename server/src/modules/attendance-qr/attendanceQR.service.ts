import AttendanceEntry from '../../models/AttendanceEntry.model.js';
import Employee from '../../models/Employee.model.js';
import CompanySettings from '../../models/CompanySettings.model.js';
import OvertimeEntry from '../../models/OvertimeEntry.model.js';
import OvertimeRule from '../../models/OvertimeRule.model.js';
import { KioskService } from '../kiosk/kiosk.service.js';
import { TOTPService } from '../totp/totp.service.js';
import { AppError } from '../../core/errors/AppError.js';
import { AuditService } from '../../core/audit/AuditService.js';
import { AttendanceService } from '../attendance/attendance.service.js';
import { RedisService } from '../../core/redis/redis.service.js';
import dayjs from 'dayjs';

const TOTP_LOCKOUT_THRESHOLD = 5;
const TOTP_LOCKOUT_DURATION_MS = 30 * 60 * 1000;
const TOTP_ATTEMPT_WINDOW_MS = 30 * 60 * 1000;

async function checkTOTPLockout(employeeId: string): Promise<void> {
  const redis = await RedisService.getClient();
  const lockKey = `totp:lockout:${employeeId}`;
  const locked = await redis.get(lockKey);
  if (locked) {
    const ttl = await redis.ttl(lockKey);
    throw new AppError(`Account locked due to too many failed TOTP attempts. Try again in ${Math.ceil(ttl / 60)} minutes.`, 429);
  }
}

async function recordFailedTOTPAttempt(employeeId: string): Promise<void> {
  const redis = await RedisService.getClient();
  const attemptKey = `totp:attempts:${employeeId}`;
  const current = await redis.incr(attemptKey);
  if (current === 1) {
    await redis.pExpire(attemptKey, TOTP_ATTEMPT_WINDOW_MS);
  }
  if (current >= TOTP_LOCKOUT_THRESHOLD) {
    const lockKey = `totp:lockout:${employeeId}`;
    await redis.set(lockKey, '1', { PX: TOTP_LOCKOUT_DURATION_MS });
    await redis.del(attemptKey);
  }
}

async function clearTOTPAttempts(employeeId: string): Promise<void> {
  const redis = await RedisService.getClient();
  await redis.del(`totp:attempts:${employeeId}`);
  await redis.del(`totp:lockout:${employeeId}`);
}

export class AttendanceQRService {
  static async checkIn(data: {
    token: string;
    totpCode: string;
    employeeId: string;
    deviceId?: string;
    latitude?: number;
    longitude?: number;
    gpsAccuracy?: number;
    selfieUrl?: string;
  }): Promise<Record<string, unknown>> {
    const settings = await CompanySettings.findOne().lean();
    const config = (settings?.attendanceConfig as any) || {};

    if (!config.qrKioskEnabled) throw new AppError('QR kiosk attendance is disabled', 400);

    const { nonce } = await KioskService.validateQRToken(data.token);

    const employee = await Employee.findById(data.employeeId).select('+totpSecret');
    if (!employee) throw new AppError('Employee not found', 400);
    if (!employee.totpSecret || !employee.totpEnabled) throw new AppError('TOTP not enrolled for this employee', 400);

    await checkTOTPLockout(data.employeeId);

    const totpValid = TOTPService.verifyCode(employee.totpSecret, data.totpCode);
    if (!totpValid) {
      await recordFailedTOTPAttempt(data.employeeId);
      throw new AppError('Invalid TOTP code', 401);
    }
    await clearTOTPAttempts(data.employeeId);

    if (config.deviceBindingEnabled && data.deviceId) {
      if (employee.registeredDeviceId && employee.registeredDeviceId !== data.deviceId) {
        throw new AppError('Device not registered for this employee', 403);
      }
    }

    if (config.geofencingEnabled && data.latitude && data.longitude) {
      const dist = getDistanceFromLatLng(
        config.geofenceLatitude, config.geofenceLongitude,
        data.latitude, data.longitude,
      );
      if (dist > (config.geofenceRadiusMeters || 50)) {
        throw new AppError(`You are outside the allowed geofence (${dist.toFixed(0)}m away)`, 403);
      }
    }

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const existingEntry = await AttendanceEntry.findOne({
      employee: employee._id,
      date: { $gte: todayStart, $lte: todayEnd },
    });

    if (existingEntry) throw new AppError('Attendance already marked for today', 400);

    const now = dayjs();
    const inTime = now.format('HH:mm');
    const shiftStart = config.shiftStartTime || '09:00';
    const graceEnd = dayjs(now.format('YYYY-MM-DD') + ' ' + shiftStart)
      .add(config.gracePeriodMinutes || 5, 'minute');
    const isLate = now.isAfter(graceEnd);
    const status = (config.lateMarkAsAbsent && isLate) ? 'absent' : 'present';

    const entry = await AttendanceEntry.create({
      employee: employee._id,
      date: now.toDate(),
      status,
      inTime,
      source: 'qr-kiosk',
      enteredBy: employee._id,
      checkInMethod: 'qr-totp',
      checkInDeviceId: data.deviceId,
      checkInGPS: data.latitude && data.longitude
        ? { latitude: data.latitude, longitude: data.longitude, accuracy: data.gpsAccuracy }
        : undefined,
      checkInSelfieUrl: data.selfieUrl,
      checkInTokenNonce: nonce,
      totpVerified: true,
      isLatePresent: isLate && config.lateMarkAsAbsent,
      isLate,
    });

    await AuditService.log({
      action: 'attendance-checkin',
      module: 'attendance',
      userId: String(employee._id),
      targetId: String(entry._id),
      details: { method: 'qr-totp', status, isLate },
    });

    return {
      id: String(entry._id),
      status: entry.status,
      inTime: entry.inTime,
      isLate,
      message: isLate
        ? `Checked in late. Status set to absent. All hours will be treated as OT.`
        : 'Check-in successful',
    };
  }

  static async checkOut(data: {
    token: string;
    totpCode: string;
    employeeId: string;
    deviceId?: string;
    latitude?: number;
    longitude?: number;
    gpsAccuracy?: number;
  }): Promise<Record<string, unknown>> {
    const settings = await CompanySettings.findOne().lean();
    const config = (settings?.attendanceConfig as any) || {};

    if (!config.qrKioskEnabled) throw new AppError('QR kiosk attendance is disabled', 400);

    const { nonce } = await KioskService.validateQRToken(data.token);

    const employee = await Employee.findById(data.employeeId).select('+totpSecret');
    if (!employee || !employee.totpSecret || !employee.totpEnabled) throw new AppError('TOTP not enrolled', 400);

    await checkTOTPLockout(data.employeeId);

    const totpValid = TOTPService.verifyCode(employee.totpSecret, data.totpCode);
    if (!totpValid) {
      await recordFailedTOTPAttempt(data.employeeId);
      throw new AppError('Invalid TOTP code', 401);
    }
    await clearTOTPAttempts(data.employeeId);

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const entry = await AttendanceEntry.findOne({
      employee: employee._id,
      date: { $gte: todayStart, $lte: todayEnd },
      outTime: { $exists: false },
    });

    if (!entry) throw new AppError('No active check-in found for today', 400);

    const now = dayjs();
    const outTime = now.format('HH:mm');

    entry.outTime = outTime;
    entry.checkOutMethod = 'qr-totp';
    entry.checkOutDeviceId = data.deviceId;
    entry.checkOutGPS = data.latitude && data.longitude
      ? { latitude: data.latitude, longitude: data.longitude, accuracy: data.gpsAccuracy }
      : undefined;
    entry.checkOutTokenNonce = nonce;

    const shift = await entry.populate('shift', 'startTime endTime');
    const shiftRecord = shift.shift as unknown as { startTime: string; endTime: string } | null;
    const shiftEndTime = config.shiftEndTime || shiftRecord?.endTime || '18:00';

    const overtimeRule = await OvertimeRule.findOne({ isActive: true, applicableTo: 'all' }).lean();
    const maxOTHours = overtimeRule?.maxHoursPerDay || 4;

    const { totalHours, otHours } = AttendanceService.calculateOTHours(
      entry.inTime!,
      outTime,
      entry.isLatePresent,
      {
        ...config,
        shiftStartTime: config.shiftStartTime || shiftRecord?.startTime || '09:00',
        shiftEndTime,
        gracePeriodMinutes: config.gracePeriodMinutes || 5,
        lateMarkAsAbsent: config.lateMarkAsAbsent !== false,
        lateTreatWorkAsOT: config.lateTreatWorkAsOT !== false,
        autoCheckoutEnabled: config.autoCheckoutEnabled !== false,
        autoCheckoutGraceMinutes: config.autoCheckoutGraceMinutes || 30,
        breakMinutes: config.breakMinutes || 30,
      },
      maxOTHours,
    );

    entry.totalHours = totalHours;
    await entry.save();

    if (otHours > 0) {
      const existingOT = await OvertimeEntry.findOne({
        employee: employee._id,
        date: { $gte: todayStart, $lte: todayEnd },
      });

      if (existingOT) {
        existingOT.hours = otHours;
        existingOT.remarks = 'Auto-calculated from QR check-out';
        await existingOT.save();
      } else {
        await OvertimeEntry.create({
          employee: employee._id,
          date: now.toDate(),
          hours: otHours,
          remarks: 'Auto-calculated from QR check-out',
          enteredBy: employee._id,
        });
      }
    }

    await AuditService.log({
      action: 'attendance-checkout',
      module: 'attendance',
      userId: String(employee._id),
      targetId: String(entry._id),
      details: { method: 'qr-totp', outTime },
    });

    return {
      id: String(entry._id),
      outTime,
      totalHours,
      otHours,
      message: 'Check-out successful',
    };
  }
}

function getDistanceFromLatLng(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
    + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180)
    * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

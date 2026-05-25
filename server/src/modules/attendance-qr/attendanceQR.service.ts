import AttendanceEntry from '../../models/AttendanceEntry.model.js';
import Employee from '../../models/Employee.model.js';
import CompanySettings from '../../models/CompanySettings.model.js';
import OvertimeEntry from '../../models/OvertimeEntry.model.js';
import { KioskService } from '../kiosk/kiosk.service.js';
import { TOTPService } from '../totp/totp.service.js';
import { AppError } from '../../core/errors/AppError.js';
import { AuditService } from '../../core/audit/AuditService.js';
import dayjs from 'dayjs';

function parseTimeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

function getMinutesDiff(inTime: string, outTime: string): number {
  return parseTimeToMinutes(outTime) - parseTimeToMinutes(inTime);
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

    const totpValid = TOTPService.verifyCode(employee.totpSecret, data.totpCode);
    if (!totpValid) throw new AppError('Invalid TOTP code', 401);

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

    const totpValid = TOTPService.verifyCode(employee.totpSecret, data.totpCode);
    if (!totpValid) throw new AppError('Invalid TOTP code', 401);

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
    await entry.save();

    if (entry.isLatePresent && config.lateTreatWorkAsOT) {
      const workMinutes = getMinutesDiff(entry.inTime!, outTime);
      const breakMinutes = 30;
      const otMinutes = Math.max(0, workMinutes - breakMinutes);

      const payrollSettings = (settings?.payrollConfig as any) || {};
      let otHours: number;
      if (payrollSettings.otTricksEnabled) {
        const roundingMinutes = payrollSettings.otRoundingMinutes || 60;
        if (payrollSettings.otRoundingMethod === 'floor') {
          otHours = Math.floor(otMinutes / roundingMinutes) * (roundingMinutes / 60);
        } else if (payrollSettings.otRoundingMethod === 'ceil') {
          otHours = Math.ceil(otMinutes / roundingMinutes) * (roundingMinutes / 60);
        } else {
          otHours = Math.round(otMinutes / roundingMinutes) * (roundingMinutes / 60);
        }
      } else {
        otHours = otMinutes / 60;
      }

      if (otHours > 0) {
        const existingOT = await OvertimeEntry.findOne({
          employee: employee._id,
          date: { $gte: todayStart, $lte: todayEnd },
        });

        if (existingOT) {
          existingOT.hours = otHours;
          existingOT.remarks = 'Auto-calculated from QR check-out (late present)';
          await existingOT.save();
        } else {
          await OvertimeEntry.create({
            employee: employee._id,
            date: now.toDate(),
            hours: otHours,
            remarks: 'Auto-calculated from QR check-out (late present)',
            enteredBy: employee._id,
          });
        }
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

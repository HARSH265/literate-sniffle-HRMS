import { generateSecret, generateURI, verify } from 'otplib';
import Employee from '../../models/Employee.model.js';
import { AppError } from '../../core/errors/AppError.js';
import { AuditService } from '../../core/audit/AuditService.js';

export class TOTPService {
  static generateSecret(): string {
    return generateSecret();
  }

  static generateQRUrl(employeeCode: string, secret: string): string {
    return generateURI({ issuer: 'OrianHRMS', label: employeeCode, secret });
  }

  static verifyCode(secret: string, token: string): boolean {
    try {
      return verify({ token, secret }) as unknown as boolean;
    } catch {
      return false;
    }
  }

  static async enrollEmployee(employeeId: string, userId: string): Promise<{ qrUrl: string; secret: string }> {
    const employee = await Employee.findById(employeeId);
    if (!employee) throw new AppError('Employee not found', 404);

    const secret = generateSecret();
    const qrUrl = TOTPService.generateQRUrl(employee.employeeCode, secret);

    employee.totpSecret = secret;
    employee.totpEnabled = true;
    await employee.save();

    await AuditService.log({
      action: 'totp-enroll',
      module: 'attendance',
      userId,
      targetId: employeeId,
      details: { employeeCode: employee.employeeCode },
    });

    return { qrUrl, secret };
  }

  static async verifyEmployeeCode(employeeId: string, token: string): Promise<boolean> {
    const employee = await Employee.findById(employeeId).select('+totpSecret');
    if (!employee || !employee.totpSecret) return false;
    return TOTPService.verifyCode(employee.totpSecret, token);
  }

  static generateTOTPQRUrl(employeeCode: string, secret: string): string {
    return generateURI({ issuer: 'OrianHRMS', label: employeeCode, secret });
  }

  static async disableTOTP(employeeId: string, userId: string): Promise<void> {
    const employee = await Employee.findById(employeeId);
    if (!employee) throw new AppError('Employee not found', 404);

    employee.totpSecret = undefined;
    employee.totpEnabled = false;
    await employee.save();

    await AuditService.log({
      action: 'totp-disable',
      module: 'attendance',
      userId,
      targetId: employeeId,
    });
  }
}

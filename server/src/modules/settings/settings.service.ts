import CompanySettings from '../../models/CompanySettings.model.js';
import { AuditService } from '../../core/audit/AuditService.js';

export class SettingsService {
  static async get(): Promise<Record<string, unknown>> {
    let settings = await CompanySettings.findOne().lean() as any;
    
    if (!settings) {
      settings = await CompanySettings.create({}) as any;
    }
    
    return { ...settings, id: String(settings._id), _id: undefined };
  }

  static async update(data: Record<string, unknown>, userId: string): Promise<Record<string, unknown>> {
    let settings = await CompanySettings.findOne() as any;
    
    if (!settings) {
      settings = await CompanySettings.create({});
    }

    if (data.companyInfo) {
      (settings as any).companyInfo = { ...(settings as any).companyInfo.toObject(), ...data.companyInfo };
    }
    if (data.payrollConfig) {
      (settings as any).payrollConfig = { ...(settings as any).payrollConfig.toObject(), ...data.payrollConfig };
    }
    if (data.attendanceConfig) {
      (settings as any).attendanceConfig = { ...(settings as any).attendanceConfig.toObject(), ...data.attendanceConfig };
    }
    if (data.allowanceConfig) {
      (settings as any).allowanceConfig = data.allowanceConfig;
    }
    if (data.deductionConfig) {
      (settings as any).deductionConfig = data.deductionConfig;
    }
    if (data.emailConfig) {
      (settings as any).emailConfig = { ...(settings as any).emailConfig?.toObject(), ...data.emailConfig };
    }

    (settings as any).updatedBy = userId;
    await (settings as any).save();

    await AuditService.log({
      action: 'update',
      module: 'settings',
      userId,
      details: { sections: Object.keys(data) },
    });

    return { ...(settings as any).toObject(), id: String(settings._id), _id: undefined };
  }
}
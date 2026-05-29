import CompanySettings from '../../models/CompanySettings.model.js';
import { AuditService } from '../../core/audit/AuditService.js';

function getChangedFields(oldObj: any, newObj: any, prefix = ''): Record<string, { old: any; new: any }> {
  const changes: Record<string, { old: any; new: any }> = {};
  
  if (!oldObj) oldObj = {};
  if (!newObj) newObj = {};
  
  const allKeys = new Set([...Object.keys(oldObj || {}), ...Object.keys(newObj || {})]);
  
  for (const key of allKeys) {
    const oldVal = oldObj[key];
    const newVal = newObj[key];
    
    if (JSON.stringify(oldVal) !== JSON.stringify(newVal)) {
      const fieldName = prefix ? `${prefix}.${key}` : key;
      changes[fieldName] = { old: oldVal, new: newVal };
    }
  }
  
  return changes;
}

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

    const oldSettings = settings.toObject();
    const changes: Record<string, { old: any; new: any }> = {};

    if (data.companyInfo) {
      const companyChanges = getChangedFields(oldSettings.companyInfo, data.companyInfo, 'companyInfo');
      Object.assign(changes, companyChanges);
      (settings as any).companyInfo = { ...(settings as any).companyInfo?.toObject?.() || {}, ...data.companyInfo };
    }
    if (data.payrollConfig) {
      const payrollChanges = getChangedFields(oldSettings.payrollConfig, data.payrollConfig, 'payrollConfig');
      Object.assign(changes, payrollChanges);
      (settings as any).payrollConfig = { ...(settings as any).payrollConfig?.toObject?.() || {}, ...data.payrollConfig };
    }
    if (data.attendanceConfig) {
      const attendanceChanges = getChangedFields(oldSettings.attendanceConfig, data.attendanceConfig, 'attendanceConfig');
      Object.assign(changes, attendanceChanges);
      (settings as any).attendanceConfig = { ...(settings as any).attendanceConfig?.toObject?.() || {}, ...data.attendanceConfig };
    }
    if (data.allowanceConfig) {
      const allowanceChanges = getChangedFields(oldSettings.allowanceConfig, data.allowanceConfig, 'allowanceConfig');
      Object.assign(changes, allowanceChanges);
      (settings as any).allowanceConfig = data.allowanceConfig;
    }
    if (data.deductionConfig) {
      const deductionChanges = getChangedFields(oldSettings.deductionConfig, data.deductionConfig, 'deductionConfig');
      Object.assign(changes, deductionChanges);
      (settings as any).deductionConfig = data.deductionConfig;
    }
    if (data.emailConfig) {
      const emailChanges = getChangedFields(oldSettings.emailConfig, data.emailConfig, 'emailConfig');
      Object.assign(changes, emailChanges);
      (settings as any).emailConfig = { ...(settings as any).emailConfig?.toObject?.() || {}, ...data.emailConfig };
    }
    if (data.employeeCodeConfig) {
      const codeChanges = getChangedFields(oldSettings.employeeCodeConfig, data.employeeCodeConfig, 'employeeCodeConfig');
      Object.assign(changes, codeChanges);
      (settings as any).employeeCodeConfig = { ...((settings as any).employeeCodeConfig?.toObject?.() || {}), ...data.employeeCodeConfig };
    }
    if (data.departmentCodeConfig) {
      const deptChanges = getChangedFields(oldSettings.departmentCodeConfig, data.departmentCodeConfig, 'departmentCodeConfig');
      Object.assign(changes, deptChanges);
      (settings as any).departmentCodeConfig = { ...((settings as any).departmentCodeConfig?.toObject?.() || {}), ...data.departmentCodeConfig };
    }
    if (data.employeeDefaults) {
      const defaultsChanges = getChangedFields(oldSettings.employeeDefaults, data.employeeDefaults, 'employeeDefaults');
      Object.assign(changes, defaultsChanges);
      (settings as any).employeeDefaults = { ...((settings as any).employeeDefaults?.toObject?.() || {}), ...data.employeeDefaults };
    }
    if (data.leaveConfig) {
      const sectionChanges = getChangedFields(oldSettings.leaveConfig, data.leaveConfig, 'leaveConfig');
      Object.assign(changes, sectionChanges);
      (settings as any).leaveConfig = { ...((settings as any).leaveConfig?.toObject?.() || {}), ...data.leaveConfig };
    }
    if (data.reportsConfig) {
      const sectionChanges = getChangedFields(oldSettings.reportsConfig, data.reportsConfig, 'reportsConfig');
      Object.assign(changes, sectionChanges);
      (settings as any).reportsConfig = { ...((settings as any).reportsConfig?.toObject?.() || {}), ...data.reportsConfig };
    }
    if (data.loanConfig) {
      const sectionChanges = getChangedFields(oldSettings.loanConfig, data.loanConfig, 'loanConfig');
      Object.assign(changes, sectionChanges);
      (settings as any).loanConfig = { ...((settings as any).loanConfig?.toObject?.() || {}), ...data.loanConfig };
    }
    if (data.statutoryConfig) {
      const sectionChanges = getChangedFields(oldSettings.statutoryConfig, data.statutoryConfig, 'statutoryConfig');
      Object.assign(changes, sectionChanges);
      (settings as any).statutoryConfig = { ...((settings as any).statutoryConfig?.toObject?.() || {}), ...data.statutoryConfig };
    }
    if (data.employeeSelfService) {
      const sectionChanges = getChangedFields(oldSettings.employeeSelfService, data.employeeSelfService, 'employeeSelfService');
      Object.assign(changes, sectionChanges);
      (settings as any).employeeSelfService = { ...((settings as any).employeeSelfService?.toObject?.() || {}), ...data.employeeSelfService };
    }
    if (data.announcementConfig) {
      const sectionChanges = getChangedFields(oldSettings.announcementConfig, data.announcementConfig, 'announcementConfig');
      Object.assign(changes, sectionChanges);
      (settings as any).announcementConfig = { ...((settings as any).announcementConfig?.toObject?.() || {}), ...data.announcementConfig };
    }
    if (data.helpdeskConfig) {
      const sectionChanges = getChangedFields(oldSettings.helpdeskConfig, data.helpdeskConfig, 'helpdeskConfig');
      Object.assign(changes, sectionChanges);
      (settings as any).helpdeskConfig = { ...((settings as any).helpdeskConfig?.toObject?.() || {}), ...data.helpdeskConfig };
    }
    if (data.assetConfig) {
      const sectionChanges = getChangedFields(oldSettings.assetConfig, data.assetConfig, 'assetConfig');
      Object.assign(changes, sectionChanges);
      (settings as any).assetConfig = { ...((settings as any).assetConfig?.toObject?.() || {}), ...data.assetConfig };
    }
    if (data.documentConfig) {
      const sectionChanges = getChangedFields(oldSettings.documentConfig, data.documentConfig, 'documentConfig');
      Object.assign(changes, sectionChanges);
      (settings as any).documentConfig = { ...((settings as any).documentConfig?.toObject?.() || {}), ...data.documentConfig };
    }
    if (data.shiftSwapConfig) {
      const sectionChanges = getChangedFields(oldSettings.shiftSwapConfig, data.shiftSwapConfig, 'shiftSwapConfig');
      Object.assign(changes, sectionChanges);
      (settings as any).shiftSwapConfig = { ...((settings as any).shiftSwapConfig?.toObject?.() || {}), ...data.shiftSwapConfig };
    }

    (settings as any).updatedBy = userId;
    await (settings as any).save();

    const changedFields = Object.keys(changes);
    const changeSummary = changedFields.length > 0 
      ? changedFields.join(', ') 
      : 'No changes';

    await AuditService.log({
      action: 'update',
      module: 'settings',
      userId,
      details: { 
        sections: Object.keys(data),
        changedFields: changes,
        summary: changeSummary,
      },
    });

    return { ...(settings as any).toObject(), id: String(settings._id), _id: undefined };
  }

  static async testEmail(toEmail: string): Promise<{ success: boolean; message?: string }> {
    const settings = await CompanySettings.findOne().lean() as any;
    const emailConfig = settings?.emailConfig;
    
    if (!emailConfig?.host || !emailConfig?.fromEmail) {
      return { success: false, message: 'Email not configured. Please configure SMTP settings first.' };
    }
    
    try {
      const nodemailer = await import('nodemailer');
      
      const transporter = nodemailer.createTransport({
        host: emailConfig.host,
        port: emailConfig.port || 587,
        secure: emailConfig.secure || false,
        auth: emailConfig.user ? {
          user: emailConfig.user,
          pass: emailConfig.password,
        } : undefined,
      });
      
      await transporter.sendMail({
        from: emailConfig.fromEmail,
        to: toEmail,
        subject: 'HRMS - Test Email',
        text: 'This is a test email from HRMS. If you received this, your email configuration is working correctly.',
        html: '<p>This is a test email from <strong>HRMS</strong>.</p><p>If you received this, your email configuration is working correctly.</p>',
      });
      
      return { success: true };
    } catch (error: any) {
      return { success: false, message: error.message || 'Failed to send test email' };
    }
  }

  static async uploadLogo(file: any, userId: string): Promise<{ success: boolean; logoUrl?: string; message?: string }> {
    if (!file) {
      return { success: false, message: 'No file uploaded' };
    }
    
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.mimetype)) {
      return { success: false, message: 'Invalid file type. Allowed: JPG, PNG, GIF, WebP' };
    }
    
    const maxSize = 2 * 1024 * 1024;
    if (file.size > maxSize) {
      return { success: false, message: 'File too large. Maximum size: 2MB' };
    }
    
    const settings = await CompanySettings.findOne() as any;
    const logoUrl = `/uploads/logos/${file.filename}`;
    
    (settings as any).companyInfo = settings.companyInfo || {};
    (settings as any).companyInfo.logo = logoUrl;
    (settings as any).updatedBy = userId;
    await (settings as any).save();
    
    await AuditService.log({
      action: 'upload-logo',
      module: 'settings',
      userId,
      details: { logoUrl, originalName: file.originalname },
    });
    
    return { success: true, logoUrl };
  }
}
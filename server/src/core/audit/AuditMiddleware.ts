import { Request, Response, NextFunction } from 'express';
import { AuditService, AuditAction } from './AuditService.js';
import { getClientIp } from './AuditUtils.js';

export function auditMiddleware(req: Request, res: Response, next: NextFunction) {
  const startTime = Date.now();

  const originalSend = res.send.bind(res);
  res.send = function (body) {
    const responseTime = Date.now() - startTime;
    const user = (req as any).user;

    if (user && res.statusCode < 500) {
      const action = getActionFromMethod(req.method, req.path);
      const module = getModuleFromPath(req.path);

      if (action && module) {
        AuditService.logRequest({
          userId: user._id.toString(),
          action,
          module,
          ipAddress: getClientIp(req),
          userAgent: req.headers['user-agent'],
          method: req.method,
          path: req.path,
          statusCode: res.statusCode,
          responseTime,
          details: {
            query: req.query,
            statusCode: res.statusCode,
          },
        }).catch((err) => console.error('Audit middleware error:', err));
      }
    }

    return originalSend(body);
  };

  next();
}

function getActionFromMethod(method: string, path: string): AuditAction | null {
  if (path.includes('/auth/login')) return 'login';
  if (path.includes('/auth/logout')) return 'logout';
  if (path.includes('/auth/logout-all')) return 'logout-all-devices';

  const postMatch = path.match(/\/(employees|users|departments|designations|shifts|holidays|notifications)(\/\w+)?$/);
  if (postMatch) {
    if (path.includes('/bulk')) return 'bulk-create';
    return 'create';
  }

  const patchMatch = path.match(/\/(employees|users|departments|designations|shifts|holidays|notifications)\/[\w-]+$/);
  if (patchMatch) return 'update';

  const deleteMatch = path.match(/\/(employees|users|departments|designations|shifts|holidays|notifications)\/[\w-]+$/);
  if (deleteMatch && method === 'DELETE') return 'delete';

  if (path.includes('/payroll') && path.includes('/finalize')) return 'finalize';
  if (path.includes('/payroll') && path.includes('/unfinalize')) return 'unfinalize';
  if (path.includes('/settings/logo')) return 'upload-logo';
  if (path.includes('/settings/test-email')) return 'test-email';
  if (path.includes('/reports/employees')) return 'export-employees';
  if (path.includes('/reports/attendance') || path.includes('/reports/payroll') || path.includes('/reports/overtime')) return 'export-report';
  if (path.includes('/audit-logs/export')) return 'export-audit';
  if (path.includes('/notifications/mark-all-read')) return 'mark-all-read';
  if (path.includes('/notifications/') && path.includes('/read')) return 'mark-read';

  return null;
}

function getModuleFromPath(path: string): string | null {
  if (path.includes('/employees')) return 'employees';
  if (path.includes('/users')) return 'users';
  if (path.includes('/departments')) return 'departments';
  if (path.includes('/designations')) return 'designations';
  if (path.includes('/shifts')) return 'shifts';
  if (path.includes('/holidays')) return 'holidays';
  if (path.includes('/payroll')) return 'payroll';
  if (path.includes('/attendance')) return 'attendance';
  if (path.includes('/overtime')) return 'overtime';
  if (path.includes('/reports')) return 'reports';
  if (path.includes('/settings')) return 'settings';
  if (path.includes('/auth')) return 'auth';
  if (path.includes('/notifications')) return 'notifications';
  if (path.includes('/audit-logs')) return 'audit';
  if (path.includes('/weekly-off-rules') || path.includes('/weeklyoff')) return 'weekly-off';
  if (path.includes('/overtime-rules')) return 'overtime-rules';
  return null;
}
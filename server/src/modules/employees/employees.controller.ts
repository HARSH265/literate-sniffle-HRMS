import { Request, Response } from 'express';
import { EmployeesService } from './employees.service.js';
import { ResponseHandler } from '../../core/response/ResponseHandler.js';
import { asyncHandler } from '../../core/errors/asyncHandler.js';
import { AppError } from '../../core/errors/AppError.js';
import { AuditService } from '../../core/audit/AuditService.js';
import { PaginationMeta } from '../../core/utils/PaginationUtil.js';
import { ExcelGeneratorService } from '../../core/excel/ExcelGeneratorService.js';
import Employee from '../../models/Employee.model.js';
import CompanySettings from '../../models/CompanySettings.model.js';
import { refToIdName } from '../../core/utils/PopulateUtil.js';

const list = asyncHandler(async (req: Request, res: Response) => {
  const userRole = req.user!.role;
  const result = await EmployeesService.list(req.query as Record<string, unknown>, userRole);
  ResponseHandler.paginated(res, result.data, result.meta as PaginationMeta, 'Employees fetched successfully');
});

const getById = asyncHandler(async (req: Request, res: Response) => {
  const userRole = req.user!.role;
  const result = await EmployeesService.getById(req.params.id, userRole);
  ResponseHandler.success(res, result, 'Employee fetched successfully');
});

const create = asyncHandler(async (req: Request, res: Response) => {
  const userRole = req.user!.role;
  const result = await EmployeesService.create(req.body, req.user!.id, userRole);
  ResponseHandler.created(res, result, 'Employee created successfully');
});

const update = asyncHandler(async (req: Request, res: Response) => {
  const userRole = req.user!.role;
  const result = await EmployeesService.update(req.params.id, req.body, req.user!.id, userRole);
  ResponseHandler.success(res, result, 'Employee updated successfully');
});

const uploadDocument = asyncHandler(async (req: Request, res: Response) => {
  if (!req.file) {
    throw new AppError('No file uploaded', 400);
  }
  const result = await EmployeesService.uploadDocument(req.params.id, req.file, req.body.documentType, req.user!.id);
  ResponseHandler.success(res, result, 'Document uploaded successfully');
});

const uploadPhoto = asyncHandler(async (req: Request, res: Response) => {
  if (!req.file) {
    throw new AppError('Please upload a photo file', 400);
  }
  const { FileUploadService } = await import('../../core/file/FileUploadService.js');
  const filePath = await FileUploadService.uploadFromBuffer(req.file.buffer, `employees/${req.params.id}/photo`);
  const result = await EmployeesService.updatePhoto(req.params.id, filePath, req.user!.id, req.user!.role);
  ResponseHandler.success(res, result, 'Employee photo uploaded successfully');
});

const removeDocument = asyncHandler(async (req: Request, res: Response) => {
  const result = await EmployeesService.removeDocument(req.params.id, req.params.docId, req.user!.id);
  ResponseHandler.success(res, result, 'Document deleted successfully');
});

const downloadDocument = asyncHandler(async (req: Request, res: Response) => {
  const filePath = await EmployeesService.getDocumentUrl(req.params.id, req.params.docId, req.user!.role);
  res.redirect(filePath);
});

const remove = asyncHandler(async (req: Request, res: Response) => {
  await EmployeesService.archive(req.params.id, req.user!.id, req.user!.role);
  ResponseHandler.noContent(res);
});

const restore = asyncHandler(async (req: Request, res: Response) => {
  const result = await EmployeesService.restore(req.params.id, req.user!.id, req.user!.role);
  ResponseHandler.success(res, result, 'Employee restored successfully');
});

const exportEmployees = asyncHandler(async (req: Request, res: Response) => {
  const filter: Record<string, unknown> = {};
  if (req.query.status) {
    filter.status = req.query.status;
  } else {
    filter.status = { $ne: 'archived' };
  }

  const columns = [
    { header: 'Employee Code', key: 'EmployeeCode', width: 15 },
    { header: 'Full Name', key: 'FullName', width: 20 },
    { header: "Father's Name", key: 'FatherName', width: 20 },
    { header: 'Category', key: 'Category', width: 15 },
    { header: 'Employment Type', key: 'EmploymentType', width: 15 },
    { header: 'Department', key: 'Department', width: 15 },
    { header: 'Designation', key: 'Designation', width: 15 },
    { header: 'Shift', key: 'Shift', width: 12 },
    { header: 'Joining Date', key: 'JoiningDate', width: 12 },
    { header: 'Salary Type', key: 'SalaryType', width: 12 },
    { header: 'Base Salary', key: 'BaseSalary', width: 12 },
    { header: 'Daily Wage', key: 'DailyWage', width: 12 },
    { header: 'OT Eligible', key: 'OvertimeEligible', width: 12 },
    { header: 'Status', key: 'Status', width: 10 },
    { header: 'Contact', key: 'ContactNumber', width: 15 },
    { header: 'Address', key: 'Address', width: 30 },
  ];

  const cursor = Employee.find(filter)
    .populate('department', 'name')
    .populate('designation', 'name')
    .populate('shift', 'name')
    .sort({ employeeCode: 1 })
    .lean()
    .cursor();

  let exportCount = 0;

  async function* exportRows() {
    for await (const emp of cursor) {
      const { _id, ...rest } = emp as Record<string, unknown>;
      const row = {
        ...rest,
        id: String(_id),
        department: refToIdName((emp as Record<string, unknown>).department),
        designation: refToIdName((emp as Record<string, unknown>).designation),
        shift: refToIdName((emp as Record<string, unknown>).shift),
      };
      exportCount++;
      const r = row as Record<string, unknown>;
      yield {
        EmployeeCode: String(r.employeeCode ?? ''),
        FullName: String(r.fullName ?? ''),
        FatherName: String(r.fatherName ?? ''),
        Category: String(r.category ?? ''),
        EmploymentType: String(r.employmentType ?? ''),
        Department: (r.department as { name?: string })?.name ?? '',
        Designation: (r.designation as { name?: string })?.name ?? '',
        Shift: (r.shift as { name?: string })?.name ?? '',
        JoiningDate: r.joiningDate ? new Date(r.joiningDate as string).toISOString().split('T')[0] : '',
        SalaryType: String(r.salaryType ?? ''),
        BaseSalary: r.baseSalary ?? '',
        DailyWage: String(r.dailyWage ?? ''),
        OvertimeEligible: r.overtimeEligible ? 'Yes' : 'No',
        Status: String(r.status ?? ''),
        ContactNumber: String(r.contactNumber ?? ''),
        Address: String(r.address ?? ''),
      };
    }
  }

  await ExcelGeneratorService.generateStreaming(
    res,
    `employees_${new Date().toISOString().split('T')[0]}.xlsx`,
    'Employees',
    columns,
    exportRows(),
  );

  await AuditService.log({
    action: 'export',
    module: 'employees',
    userId: req.user!.id,
    targetId: 'employees-export',
    targetName: `Exported ${exportCount} employees`,
  });
});

const downloadTemplate = asyncHandler(async (req: Request, res: Response) => {
  // Audit log for template download
  await AuditService.log({
    action: 'export',
    module: 'employees',
    userId: req.user!.id,
    targetId: 'employee-template',
    targetName: 'Employee import template downloaded',
  });

  // Read sample defaults from CompanySettings
  const settings = await CompanySettings.findOne().lean();
  const defaults = (settings as Record<string, unknown>)?.employeeDefaults as Record<string, unknown> | undefined;

  const data = [{
    EmployeeCode: 'EMP001',
    FullName: 'John Doe',
    FatherName: 'Mark Doe',
    Category: String(defaults?.defaultCategory || 'worker'),
    EmploymentType: String(defaults?.defaultEmploymentType || 'permanent'),
    DepartmentName: 'Production',
    DesignationName: 'Operator',
    ShiftName: 'General',
    JoiningDate: '2024-01-01',
    SalaryType: String(defaults?.defaultSalaryType || 'monthly'),
    BaseSalary: '25000',
    DailyWage: '',
    OvertimeEligible: 'Yes',
    Status: 'active',
    ContactNumber: '9876543210',
    Address: 'Address here',
  }];

  await ExcelGeneratorService.generate(
    res,
    'employee_template.xlsx',
    'Template',
    [
      { header: 'Employee Code', key: 'EmployeeCode', width: 15 },
      { header: 'Full Name', key: 'FullName', width: 20 },
      { header: "Father's Name", key: 'FatherName', width: 20 },
      { header: 'Category', key: 'Category', width: 15 },
      { header: 'Employment Type', key: 'EmploymentType', width: 15 },
      { header: 'Department Name', key: 'DepartmentName', width: 15 },
      { header: 'Designation Name', key: 'DesignationName', width: 15 },
      { header: 'Shift Name', key: 'ShiftName', width: 12 },
      { header: 'Joining Date (YYYY-MM-DD)', key: 'JoiningDate', width: 15 },
      { header: 'Salary Type', key: 'SalaryType', width: 12 },
      { header: 'Base Salary', key: 'BaseSalary', width: 12 },
      { header: 'Daily Wage', key: 'DailyWage', width: 12 },
      { header: 'Overtime Eligible (Yes/No)', key: 'OvertimeEligible', width: 15 },
      { header: 'Status', key: 'Status', width: 10 },
      { header: 'Contact Number', key: 'ContactNumber', width: 15 },
      { header: 'Address', key: 'Address', width: 30 },
    ],
    data,
  );
});

const importEmployees = asyncHandler(async (req: Request, res: Response) => {
  if (!req.file) {
    throw new AppError('Please upload an Excel file', 400);
  }

  const ExcelJS = (await import('exceljs')).default;
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(req.file.buffer as any);

  const worksheet = workbook.getWorksheet(1);
  if (!worksheet) {
    throw new AppError('Worksheet not found', 400);
  }
  const rows = worksheet.getRows(2, worksheet.rowCount - 1);

  if (!rows || rows.length === 0) {
    throw new AppError('No data found in the file', 400);
  }

  const results = await EmployeesService.importEmployees(rows, req.user!.id);
  ResponseHandler.success(res, {
    message: `Import completed: ${results.success} successful, ${results.failed} failed`,
    success: results.success,
    failed: results.failed,
    errors: results.errors,
  });
});

const generateNextCode = asyncHandler(async (_req: Request, res: Response) => {
  const result = await EmployeesService.getNextEmployeeCodePreview();
  ResponseHandler.success(res, { employeeCode: result }, 'Employee code generated');
});

const bulkAssignShift = asyncHandler(async (req: Request, res: Response) => {
  const { employeeIds, shiftId } = req.body;
  const result = await EmployeesService.bulkAssignShift(employeeIds, shiftId, req.user!.id, req.user!.role);
  ResponseHandler.success(res, result, `${result.modifiedCount} employee(s) updated`);
});

export const employeesController = { list, getById, create, update, remove, restore, export: exportEmployees, downloadTemplate, import: importEmployees, uploadDocument, removeDocument, downloadDocument, uploadPhoto, generateNextCode, bulkAssignShift };
import { Request, Response } from 'express';
import { EmployeesService } from './employees.service.js';
import mongoose from 'mongoose';
import { ResponseHandler } from '../../core/response/ResponseHandler.js';
import { asyncHandler } from '../../core/errors/asyncHandler.js';
import { AppError } from '../../core/errors/AppError.js';
import { PaginationMeta } from '../../core/utils/PaginationUtil.js';
import { ExcelGeneratorService } from '../../core/excel/ExcelGeneratorService.js';
import { FileUploadService } from '../../core/file/FileUploadService.js';
import Employee from '../../models/Employee.model.js';
import Department from '../../models/Department.model.js';
import Designation from '../../models/Designation.model.js';
import Shift from '../../models/Shift.model.js';

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
  const { id } = req.params;
  const { documentType } = req.body;
  
  if (!req.file) {
    ResponseHandler.error(res, 'No file uploaded', 400);
    return;
  }

  const employee = await Employee.findById(id);
  if (!employee) {
    ResponseHandler.error(res, 'Employee not found', 404);
    return;
  }

  const filePath = await FileUploadService.uploadFromBuffer(req.file.buffer, `employees/${id}/documents`);

  const newDoc = {
    type: documentType || 'other',
    fileName: req.file.originalname,
    filePath,
    uploadedAt: new Date(),
  };

  if (!employee.documents) {
    employee.documents = [];
  }
  employee.documents.push(newDoc as any);
  await employee.save();

  ResponseHandler.success(res, employee.documents, 'Document uploaded successfully');
});

const uploadPhoto = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  if (!req.file) {
    throw new AppError('Please upload a photo file', 400);
  }

  const employee = await Employee.findById(id);
  if (!employee) {
    ResponseHandler.error(res, 'Employee not found', 404);
    return;
  }

  const filePath = await FileUploadService.uploadFromBuffer(req.file.buffer, `employees/${id}/photo`);

  const result = await EmployeesService.updatePhoto(id, filePath, req.user!.id);
  ResponseHandler.success(res, result, 'Employee photo uploaded successfully');
});

const removeDocument = asyncHandler(async (req: Request, res: Response) => {
  const { id, docId } = req.params;
  
  const employee = await Employee.findById(id);
  if (!employee) {
    ResponseHandler.error(res, 'Employee not found', 404);
    return;
  }

  const doc = (employee.documents || []).find((d: any) => d._id?.toString() === docId);
  if (doc?.filePath) {
    try {
      const publicId = FileUploadService.getPublicIdFromUrl(doc.filePath);
      await FileUploadService.delete(publicId);
    } catch {
      // Log but don't fail if Cloudinary deletion fails
    }
  }

  employee.documents = (employee.documents || []).filter((doc: any) => doc._id?.toString() !== docId);
  await employee.save();

  ResponseHandler.success(res, employee.documents, 'Document deleted successfully');
});

const downloadDocument = asyncHandler(async (req: Request, res: Response) => {
  const { id, docId } = req.params;
  const userRole = req.user!.role;
  
  const employee = await Employee.findById(id);
  if (!employee) {
    ResponseHandler.error(res, 'Employee not found', 404);
    return;
  }

  if (employee.status === 'archived' && !['super-admin', 'hr-admin'].includes(userRole)) {
    ResponseHandler.error(res, 'Access denied', 403);
    return;
  }

  const doc = (employee.documents || []).find((d: any) => d._id?.toString() === docId);
  if (!doc) {
    ResponseHandler.error(res, 'Document not found', 404);
    return;
  }

  res.redirect(doc.filePath);
});

const remove = asyncHandler(async (req: Request, res: Response) => {
  await EmployeesService.delete(req.params.id, req.user!.id, req.user!.role);
  ResponseHandler.noContent(res);
});

const restore = asyncHandler(async (req: Request, res: Response) => {
  const result = await EmployeesService.restore(req.params.id, req.user!.id, req.user!.role);
  ResponseHandler.success(res, result, 'Employee restored successfully');
});

const exportEmployees = asyncHandler(async (_req: Request, res: Response) => {
  const employees = await Employee.find({ status: { $ne: 'archived' } })
    .populate('department', 'name')
    .populate('designation', 'name')
    .populate('shift', 'name')
    .lean();

  const data = employees.map((e: any) => ({
    EmployeeCode: e.employeeCode,
    FullName: e.fullName,
    FatherName: e.fatherName,
    Category: e.category,
    EmploymentType: e.employmentType,
    Department: e.department?.name || '',
    Designation: e.designation?.name || '',
    Shift: e.shift?.name || '',
    JoiningDate: e.joiningDate ? new Date(e.joiningDate).toISOString().split('T')[0] : '',
    SalaryType: e.salaryType,
    BaseSalary: e.baseSalary,
    DailyWage: e.dailyWage || '',
    OvertimeEligible: e.overtimeEligible ? 'Yes' : 'No',
    Status: e.status,
    ContactNumber: e.contactNumber || '',
    Address: e.address || '',
  }));

  await ExcelGeneratorService.generate(
    res,
    `employees_${new Date().toISOString().split('T')[0]}.xlsx`,
    'Employees',
    [
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
    ],
    data,
  );
});

const downloadTemplate = asyncHandler(async (_req: Request, res: Response) => {
  const data = [{
    EmployeeCode: 'EMP001',
    FullName: 'John Doe',
    FatherName: 'Mark Doe',
    Category: 'worker',
    EmploymentType: 'permanent',
    DepartmentName: 'Production',
    DesignationName: 'Operator',
    ShiftName: 'General',
    JoiningDate: '2024-01-01',
    SalaryType: 'monthly',
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
  
  // Use buffer for memory storage
  await workbook.xlsx.load(req.file.buffer as any);

  const worksheet = workbook.getWorksheet(1);
  if (!worksheet) {
    throw new AppError('Worksheet not found', 400);
  }
  const rows = worksheet.getRows(2, worksheet.rowCount - 1);

  if (!rows || rows.length === 0) {
    throw new AppError('No data found in the file', 400);
  }

  // Begin atomic import with transaction
  const session = await mongoose.startSession();
  session.startTransaction();

  const results = { success: 0, failed: 0, errors: [] as string[] };

  // Batch: collect all unique names first, then do single queries
  const allDeptNames = new Set<string>();
  const allDesigNames = new Set<string>();
  const allShiftNames = new Set<string>();
  const allEmpCodes = new Set<string>();
  const rowData: any[] = [];

  for (const row of rows) {
    const values = row.values as any[];
    const data = Array.from(values).slice(1);
    const departmentName = data[5] ? String(data[5]).trim() : '';
    const designationName = data[6] ? String(data[6]).trim() : '';
    const shiftName = data[7] ? String(data[7]).trim() : '';
    const employeeCode = data[0] ? String(data[0]).trim() : '';
    if (departmentName) allDeptNames.add(departmentName);
    if (designationName) allDesigNames.add(designationName);
    if (shiftName) allShiftNames.add(shiftName);
    if (employeeCode) allEmpCodes.add(employeeCode.toUpperCase());
    rowData.push({ row, data });
  }

  const [departments, designations, shifts, existingEmployees] = await Promise.all([
    allDeptNames.size > 0 ? Department.find({ name: { $in: Array.from(allDeptNames).map(n => new RegExp(`^${n}$`, 'i')) } }) : [],
    allDesigNames.size > 0 ? Designation.find({ name: { $in: Array.from(allDesigNames).map(n => new RegExp(`^${n}$`, 'i')) } }) : [],
    allShiftNames.size > 0 ? Shift.find({ name: { $in: Array.from(allShiftNames).map(n => new RegExp(`^${n}$`, 'i')) } }) : [],
    allEmpCodes.size > 0 ? Employee.find({ employeeCode: { $in: Array.from(allEmpCodes) } }).select('employeeCode') : [],
  ]);

  const deptMap = new Map(departments.map((d: any) => [d.name.toLowerCase(), d]));
  const desigMap = new Map(designations.map((d: any) => [d.name.toLowerCase(), d]));
  const shiftMap = new Map(shifts.map((s: any) => [s.name.toLowerCase(), s]));
  const empCodeSet = new Set(existingEmployees.map((e: any) => e.employeeCode.toUpperCase()));

  try {
    for (const { row, data } of rowData) {
      const employeeCode = data[0] ? String(data[0]).trim() : '';
      const fullName = data[1] ? String(data[1]).trim() : '';
      const fatherName = data[2] ? String(data[2]).trim() : '';
      
      const rawCategory = data[3] ? String(data[3]).trim().toLowerCase() : '';
      const category = rawCategory.includes('manufacturing') || rawCategory.includes('worker') ? 'worker' : 
                       rawCategory.includes('office') ? 'office-staff' : 'worker';
      
      const employmentType = data[4] ? String(data[4]).trim().toLowerCase() : '';
      const departmentName = data[5] ? String(data[5]).trim() : '';
      const designationName = data[6] ? String(data[6]).trim() : '';
      const shiftName = data[7] ? String(data[7]).trim() : '';
      const joiningDate = data[8] ? String(data[8]).trim() : '';
      
      const rawSalaryType = data[9] ? String(data[9]).trim().toLowerCase() : '';
      const salaryType = rawSalaryType.includes('daily') ? 'daily' : 'monthly';
      
      const baseSalary = parseFloat(data[10] ? String(data[10]).trim() : '0');
      const dailyWage = parseFloat(data[11] ? String(data[11]).trim() : '0');
      const overtimeEligible = data[12] ? String(data[12]).trim().toLowerCase() === 'yes' : false;
      const status = data[13] ? String(data[13]).trim().toLowerCase() : 'active';
      const contactNumber = data[14] ? String(data[14]).trim() : '';
      const address = data[15] ? String(data[15]).trim() : '';

      if (!employeeCode || !fullName || !fatherName) {
        throw new AppError(`Row ${row.number}: Missing required fields`, 400);
      }

      const department = departmentName ? deptMap.get(departmentName.toLowerCase()) : null;
      const designation = designationName ? desigMap.get(designationName.toLowerCase()) : null;
      const shift = shiftName ? shiftMap.get(shiftName.toLowerCase()) : null;

      if (empCodeSet.has(employeeCode.toUpperCase())) {
        throw new AppError(`Row ${row.number}: Employee code ${employeeCode} already exists`, 400);
      }

      await Employee.create({
        employeeCode: employeeCode.toUpperCase(),
        fullName,
        fatherName,
        category,
        employmentType,
        department: department?._id,
        designation: designation?._id,
        shift: shift?._id,
        joiningDate: joiningDate ? new Date(joiningDate) : new Date(),
        salaryType,
        baseSalary,
        dailyWage,
        overtimeEligible,
        status,
        contactNumber,
        address,
        createdBy: req.user!.id as any,
      }, { session });

      results.success++;
    }
    await session.commitTransaction();
    session.endSession();
    ResponseHandler.success(res, {
      message: `Import completed: ${results.success} successful, 0 failed`,
      success: results.success,
      failed: 0,
      errors: [],
    });
  } catch (err: any) {
    await session.abortTransaction();
    session.endSession();
    // If any error during import, respond with failure details
    const errorMessage = err instanceof AppError ? err.message : err.message || 'Import failed';
    throw new AppError(errorMessage, err.status || 500);
  }
});

const generateNextCode = asyncHandler(async (_req: Request, res: Response) => {
  const result = await EmployeesService.generateNextEmployeeCode();
  ResponseHandler.success(res, { employeeCode: result }, 'Employee code generated');
});

const bulkAssignShift = asyncHandler(async (req: Request, res: Response) => {
  const { employeeIds, shiftId } = req.body;
  const result = await EmployeesService.bulkAssignShift(employeeIds, shiftId, req.user!.id, req.user!.role);
  ResponseHandler.success(res, result, `${result.modifiedCount} employee(s) updated`);
});

export const employeesController = { list, getById, create, update, remove, restore, export: exportEmployees, downloadTemplate, import: importEmployees, uploadDocument, removeDocument, downloadDocument, uploadPhoto, generateNextCode, bulkAssignShift };
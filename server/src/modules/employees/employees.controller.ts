import { Request, Response } from 'express';
import { EmployeesService } from './employees.service.js';
import { ResponseHandler } from '../../core/response/ResponseHandler.js';
import { asyncHandler } from '../../core/errors/asyncHandler.js';
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
    res.status(400).json({ success: false, message: 'No file uploaded' });
    return;
  }

  const employee = await Employee.findById(id);
  if (!employee) {
    res.status(404).json({ success: false, message: 'Employee not found' });
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

const removeDocument = asyncHandler(async (req: Request, res: Response) => {
  const { id, docId } = req.params;
  
  const employee = await Employee.findById(id);
  if (!employee) {
    res.status(404).json({ success: false, message: 'Employee not found' });
    return;
  }

  employee.documents = (employee.documents || []).filter((doc: any) => doc._id?.toString() !== docId);
  await employee.save();

  ResponseHandler.success(res, employee.documents, 'Document deleted successfully');
});

const downloadDocument = asyncHandler(async (req: Request, res: Response) => {
  const { id, docId } = req.params;
  
  const employee = await Employee.findById(id);
  if (!employee) {
    res.status(404).json({ success: false, message: 'Employee not found' });
    return;
  }

  const doc = (employee.documents || []).find((d: any) => d._id?.toString() === docId);
  if (!doc) {
    res.status(404).json({ success: false, message: 'Document not found' });
    return;
  }

  res.redirect(doc.filePath);
});

const remove = asyncHandler(async (req: Request, res: Response) => {
  await EmployeesService.delete(req.params.id, req.user!.id);
  ResponseHandler.noContent(res);
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
    throw new Error('Please upload an Excel file');
  }

  const ExcelJS = (await import('exceljs')).default;
  const workbook = new ExcelJS.Workbook();
  
  // Use buffer for memory storage
  await workbook.xlsx.load(req.file.buffer as any);

  const worksheet = workbook.getWorksheet(1);
  if (!worksheet) {
    throw new Error('Worksheet not found');
  }
  const rows = worksheet.getRows(2, worksheet.rowCount - 1);

  if (!rows || rows.length === 0) {
    throw new Error('No data found in the file');
  }

  const results = { success: 0, failed: 0, errors: [] as string[] };

  for (const row of rows) {
    try {
      const values = row.values as any[];
      
      // Get values as array, skip first element (row number in ExcelJS)
      const data = Array.from(values).slice(1);
      
      const employeeCode = data[0] ? String(data[0]).trim() : '';
      const fullName = data[1] ? String(data[1]).trim() : '';
      const fatherName = data[2] ? String(data[2]).trim() : '';
      
      // Map category: "manufacturing worker" -> "worker", "office staff" -> "office-staff"
      const rawCategory = data[3] ? String(data[3]).trim().toLowerCase() : '';
      const category = rawCategory.includes('manufacturing') || rawCategory.includes('worker') ? 'worker' : 
                       rawCategory.includes('office') ? 'office-staff' : 'worker';
      
      const employmentType = data[4] ? String(data[4]).trim().toLowerCase() : '';
      const departmentName = data[5] ? String(data[5]).trim() : '';
      const designationName = data[6] ? String(data[6]).trim() : '';
      const shiftName = data[7] ? String(data[7]).trim() : '';
      const joiningDate = data[8] ? String(data[8]).trim() : '';
      
      // Map salary type
      const rawSalaryType = data[9] ? String(data[9]).trim().toLowerCase() : '';
      const salaryType = rawSalaryType.includes('daily') ? 'daily' : 'monthly';
      
      const baseSalary = parseFloat(data[10] ? String(data[10]).trim() : '0');
      const dailyWage = parseFloat(data[11] ? String(data[11]).trim() : '0');
      const overtimeEligible = data[12] ? String(data[12]).trim().toLowerCase() === 'yes' : false;
      const status = data[13] ? String(data[13]).trim().toLowerCase() : 'active';
      const contactNumber = data[14] ? String(data[14]).trim() : '';
      const address = data[15] ? String(data[15]).trim() : '';

      if (!employeeCode || !fullName || !fatherName) {
        results.failed++;
        results.errors.push(`Row ${row.number}: Missing required fields`);
        continue;
      }

      let department: any, designation: any, shift: any;
      if (departmentName) {
        department = await Department.findOne({ name: { $regex: new RegExp(`^${departmentName}$`, 'i') } });
      }
      if (designationName) {
        designation = await Designation.findOne({ name: { $regex: new RegExp(`^${designationName}$`, 'i') } });
      }
      if (shiftName) {
        shift = await Shift.findOne({ name: { $regex: new RegExp(`^${shiftName}$`, 'i') } });
      }

      const existing = await Employee.findOne({ employeeCode: employeeCode.toUpperCase() });
      if (existing) {
        results.failed++;
        results.errors.push(`Row ${row.number}: Employee code ${employeeCode} already exists`);
        continue;
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
      });

      results.success++;
    } catch (rowError: any) {
      results.failed++;
      results.errors.push(`Row ${row.number}: ${rowError.message}`);
    }
  }

  ResponseHandler.success(res, {
    message: `Import completed: ${results.success} successful, ${results.failed} failed`,
    success: results.success,
    failed: results.failed,
    errors: results.errors.slice(0, 10),
  });
});

const generateNextCode = asyncHandler(async (_req: Request, res: Response) => {
  const result = await EmployeesService.generateNextEmployeeCode();
  ResponseHandler.success(res, { employeeCode: result }, 'Employee code generated');
});

const bulkAssignShift = asyncHandler(async (req: Request, res: Response) => {
  const { employeeIds, shiftId } = req.body;
  const result = await EmployeesService.bulkAssignShift(employeeIds, shiftId, req.user!.id);
  ResponseHandler.success(res, result, `${result.modifiedCount} employee(s) updated`);
});

export const employeesController = { list, getById, create, update, remove, export: exportEmployees, downloadTemplate, import: importEmployees, uploadDocument, removeDocument, downloadDocument, generateNextCode, bulkAssignShift };
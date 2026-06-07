import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import mongoose from 'mongoose';
import Loan from '../../../models/Loan.model.js';
import LoanType from '../../../models/LoanType.model.js';
import LoanRepayment from '../../../models/LoanRepayment.model.js';
import Employee from '../../../models/Employee.model.js';
import User from '../../../models/User.model.js';
import { LoansService } from '../loans.service.js';
import { AppError } from '../../../core/errors/AppError.js';

let userId: string;
let empId: string;
let loanTypeId: string;
let loanId: string;

beforeAll(async () => {
  const user = await User.create({ name: 'Admin', email: 'loans@test.com', password: 'TestPass1!', role: 'super-admin' });
  userId = user._id.toString();
  const emp = await Employee.create({
    employeeCode: 'LN001', fullName: 'Loan Employee', fatherName: 'Parent',
    category: 'worker', employmentType: 'permanent',
    department: new mongoose.Types.ObjectId(), designation: new mongoose.Types.ObjectId(),
    shift: new mongoose.Types.ObjectId(), joiningDate: new Date('2024-01-01'),
    salaryType: 'monthly', baseSalary: 25000, status: 'active',
  });
  empId = emp._id.toString();
});

beforeEach(async () => {
  await LoanType.deleteMany({});
  await Loan.deleteMany({});
  await LoanRepayment.deleteMany({});
  const lt = await LoanType.create({
    name: 'Personal Loan', code: 'PL', maxAmount: 500000, minAmount: 1000,
    interestRate: 10, maxTenure: 60, minTenure: 1, isActive: true,
    applicableTo: 'all', applicableEmploymentTypes: [], maxActiveLoans: 2,
  });
  loanTypeId = lt._id.toString();
  const loan = await Loan.create({
    employee: empId, loanType: lt._id, amount: 50000, interestRate: 10,
    tenure: 12, emiAmount: 4395.81, totalPayable: 52749.72, totalInterest: 2749.72,
    status: 'applied', createdBy: userId,
  });
  loanId = loan._id.toString();
});

describe('LoansService', () => {
  describe('createLoanType', () => {
    it('creates a loan type', async () => {
      const result = await LoansService.createLoanType({
        name: 'Home Loan', code: 'HL', maxAmount: 1000000, minAmount: 50000,
        interestRate: 8, maxTenure: 120,
      }, userId);
      expect(result.name).toBe('Home Loan');
    });

    it('throws on duplicate code', async () => {
      await expect(LoansService.createLoanType({
        name: 'Personal', code: 'PL', maxAmount: 100000, minAmount: 1000,
        interestRate: 10, maxTenure: 60,
      }, userId)).rejects.toThrow(AppError);
    });
  });

  describe('listLoanTypes', () => {
    it('returns loan types', async () => {
      const result = await LoansService.listLoanTypes({});
      expect(result.loanTypes.length).toBeGreaterThan(0);
    });
  });

  describe('getLoanType', () => {
    it('returns loan type by id', async () => {
      const result = await LoansService.getLoanType(loanTypeId);
      expect(result.name).toBe('Personal Loan');
    });

    it('throws on non-existent id', async () => {
      await expect(LoansService.getLoanType(new mongoose.Types.ObjectId().toString())).rejects.toThrow(AppError);
    });
  });

  describe('updateLoanType', () => {
    it('updates loan type', async () => {
      const result = await LoansService.updateLoanType(loanTypeId, { maxAmount: 600000 }, userId);
      expect(result.maxAmount).toBe(600000);
    });
  });

  describe('deleteLoanType', () => {
    it('throws on loan type with active loans', async () => {
      await expect(LoansService.deleteLoanType(loanTypeId, userId)).rejects.toThrow(AppError);
    });
  });

  describe('applyLoan', () => {
    it('applies a loan', async () => {
      const result = await LoansService.applyLoan({
        employee: empId, loanType: loanTypeId, amount: 25000, tenure: 6,
      }, userId);
      expect(result.loan.status).toBe('applied');
      expect(result.repayments.length).toBeGreaterThan(0);
    });

    it('throws on inactive loan type', async () => {
      await LoanType.findByIdAndUpdate(loanTypeId, { isActive: false });
      await expect(LoansService.applyLoan({
        employee: empId, loanType: loanTypeId, amount: 25000, tenure: 6,
      }, userId)).rejects.toThrow(AppError);
    });

    it('throws on non-existent employee', async () => {
      await expect(LoansService.applyLoan({
        employee: new mongoose.Types.ObjectId().toString(), loanType: loanTypeId, amount: 25000, tenure: 6,
      }, userId)).rejects.toThrow(AppError);
    });

    it('throws on amount below minimum', async () => {
      await expect(LoansService.applyLoan({
        employee: empId, loanType: loanTypeId, amount: 100, tenure: 6,
      }, userId)).rejects.toThrow(AppError);
    });
  });

  describe('approveLoan', () => {
    it('approves a loan', async () => {
      const result = await LoansService.approveLoan(loanId, { approve: true, remarks: 'Approved' }, userId) as any;
      expect(result.status).toBe('approved');
    });

    it('rejects a loan', async () => {
      const result = await LoansService.approveLoan(loanId, { approve: false, remarks: 'Not eligible' }, userId) as any;
      expect(result.status).toBe('rejected');
    });

    it('throws on already approved loan', async () => {
      await LoansService.approveLoan(loanId, { approve: true }, userId);
      await expect(LoansService.approveLoan(loanId, { approve: true }, userId)).rejects.toThrow(AppError);
    });
  });

  describe('disburseLoan', () => {
    it('disburses an approved loan', async () => {
      await LoansService.approveLoan(loanId, { approve: true }, userId);
      const result = await LoansService.disburseLoan(loanId, userId) as any;
      expect(result.status).toBe('active');
      expect(result.disbursedDate).toBeTruthy();
    });

    it('throws on non-approved loan', async () => {
      await expect(LoansService.disburseLoan(loanId, userId)).rejects.toThrow(AppError);
    });
  });

  describe('cancelLoan', () => {
    it('cancels an applied loan', async () => {
      const result = await LoansService.cancelLoan(loanId, userId) as any;
      expect(result.status).toBe('cancelled');
    });
  });

  describe('listLoans', () => {
    it('returns paginated loans', async () => {
      const result = await LoansService.listLoans({});
      expect(result.loans.length).toBeGreaterThan(0);
    });

    it('filters by status', async () => {
      const result = await LoansService.listLoans({ status: 'applied' });
      expect(result.loans.length).toBeGreaterThan(0);
    });
  });

  describe('getLoan', () => {
    it('returns loan with repayments', async () => {
      const result = await LoansService.getLoan(loanId) as any;
      expect(result.status).toBe('applied');
    });

    it('throws on non-existent id', async () => {
      await expect(LoansService.getLoan(new mongoose.Types.ObjectId().toString())).rejects.toThrow(AppError);
    });
  });

  describe('getEmployeeLoanSummary', () => {
    it('returns employee loan summary', async () => {
      const result = await LoansService.getEmployeeLoanSummary(empId);
      expect(result.totalLoans).toBeGreaterThan(0);
    });
  });
});

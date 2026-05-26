import Loan from '../../models/Loan.model.js';
import LoanType from '../../models/LoanType.model.js';
import LoanRepayment from '../../models/LoanRepayment.model.js';
import Employee from '../../models/Employee.model.js';
import { AppError } from '../../core/errors/AppError.js';
import { AuditService } from '../../core/audit/AuditService.js';

function calculateEMI(principal: number, annualRate: number, tenureMonths: number): {
  emi: number;
  totalInterest: number;
  totalPayable: number;
} {
  const monthlyRate = annualRate / 100 / 12;
  if (monthlyRate === 0) {
    const emi = principal / tenureMonths;
    return { emi: Math.round(emi * 100) / 100, totalInterest: 0, totalPayable: principal };
  }
  const factor = Math.pow(1 + monthlyRate, tenureMonths);
  const emi = principal * monthlyRate * factor / (factor - 1);
  const totalPayable = emi * tenureMonths;
  const totalInterest = totalPayable - principal;
  return {
    emi: Math.round(emi * 100) / 100,
    totalInterest: Math.round(totalInterest * 100) / 100,
    totalPayable: Math.round(totalPayable * 100) / 100,
  };
}

export class LoansService {
  static async createLoanType(data: Record<string, unknown>, userId: string): Promise<any> {
    const existing = await LoanType.findOne({ code: String(data.code).toUpperCase() });
    if (existing) throw new AppError('Loan type with this code already exists', 400);
    const loanType = await LoanType.create({ ...data } as any);
    await AuditService.log({ action: 'create', module: 'loans', userId, targetId: loanType._id.toString(), targetName: loanType.name, details: data as any });
    return loanType.toObject();
  }

  static async updateLoanType(id: string, data: Record<string, unknown>, userId: string): Promise<any> {
    const loanType = await LoanType.findByIdAndUpdate(id, { $set: data }, { new: true, runValidators: true });
    if (!loanType) throw new AppError('Loan type not found', 404);
    await AuditService.log({ action: 'update', module: 'loans', userId, targetId: id, targetName: loanType.name, details: data as any });
    return loanType.toObject();
  }

  static async listLoanTypes(query: Record<string, unknown>): Promise<{ loanTypes: any[]; total: number }> {
    const filter: Record<string, unknown> = {};
    if (query.isActive !== undefined) filter.isActive = query.isActive === 'true';
    const [loanTypes, total] = await Promise.all([
      LoanType.find(filter).sort({ name: 1 }).lean(),
      LoanType.countDocuments(filter),
    ]);
    return { loanTypes: loanTypes.map((lt: any) => ({ ...lt, id: lt._id.toString() })), total };
  }

  static async getLoanType(id: string): Promise<any> {
    const loanType = await LoanType.findById(id).lean();
    if (!loanType) throw new AppError('Loan type not found', 404);
    return { ...loanType, id: loanType._id.toString() };
  }

  static async deleteLoanType(id: string, userId: string): Promise<void> {
    const activeLoans = await Loan.countDocuments({ loanType: id, status: { $in: ['applied', 'approved', 'active'] } });
    if (activeLoans > 0) throw new AppError('Cannot delete loan type with active loans', 400);
    const loanType = await LoanType.findByIdAndDelete(id);
    if (!loanType) throw new AppError('Loan type not found', 404);
    await AuditService.log({ action: 'delete', module: 'loans', userId, targetId: id, targetName: loanType.name });
  }

  static async applyLoan(data: Record<string, unknown>, userId: string): Promise<any> {
    const { loanType: loanTypeId, amount, tenure, purpose } = data as any;

    const loanType = await LoanType.findById(loanTypeId);
    if (!loanType) throw new AppError('Loan type not found', 404);
    if (!loanType.isActive) throw new AppError('Loan type is not active', 400);

    const employee = await Employee.findById(data.employee || data.employeeId);
    if (!employee) throw new AppError('Employee not found', 404);

    if (employee.status !== 'active') throw new AppError('Employee is not active', 400);

    const amt = Number(amount);
    if (amt < loanType.minAmount) throw new AppError(`Minimum loan amount is ${loanType.minAmount}`, 400);
    if (amt > loanType.maxAmount) throw new AppError(`Maximum loan amount is ${loanType.maxAmount}`, 400);
    if (Number(tenure) < loanType.minTenure) throw new AppError(`Minimum tenure is ${loanType.minTenure} months`, 400);
    if (Number(tenure) > loanType.maxTenure) throw new AppError(`Maximum tenure is ${loanType.maxTenure} months`, 400);

    const activeLoans = await Loan.countDocuments({ employee: employee._id, status: { $in: ['active', 'approved'] } });
    if (activeLoans >= loanType.maxActiveLoans) throw new AppError(`Employee already has ${activeLoans} active loan(s). Max allowed: ${loanType.maxActiveLoans}`, 400);

    const { emi, totalInterest, totalPayable } = calculateEMI(amt, loanType.interestRate, Number(tenure));

    const loan = await Loan.create({
      employee: employee._id,
      loanType: loanType._id,
      amount: amt,
      interestRate: loanType.interestRate,
      tenure: Number(tenure),
      emiAmount: emi,
      totalPayable,
      totalInterest,
      purpose,
      createdBy: userId,
    });

    const repayments = [];
    let outstanding = totalPayable;
    for (let i = 0; i < Number(tenure); i++) {
      const d = new Date();
      d.setMonth(d.getMonth() + i + 1);
      const monthStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;

      const interestPart = outstanding * (loanType.interestRate / 100 / 12);
      const principalPart = emi - interestPart;
      outstanding -= principalPart;
      if (outstanding < 0) outstanding = 0;

      await LoanRepayment.create({
        loan: loan._id,
        employee: employee._id,
        month: monthStr,
        amount: emi,
        principal: Math.round(principalPart * 100) / 100,
        interest: Math.round(interestPart * 100) / 100,
        outstandingBefore: Math.round((outstanding + principalPart) * 100) / 100,
        outstandingAfter: Math.round(outstanding * 100) / 100,
        status: 'pending',
      });
      repayments.push({ month: monthStr, amount: emi });
    }

    await AuditService.log({ action: 'create', module: 'loans', userId, targetId: loan._id.toString(), details: { employee: employee.employeeCode, amount: amt, loanType: loanType.code } });

    return { loan: { ...loan.toObject(), id: loan._id.toString() }, repayments: repayments.slice(0, 12) };
  }

  static async approveLoan(id: string, data: Record<string, unknown>, userId: string, level = 1): Promise<any> {
    const loan = await Loan.findById(id);
    if (!loan) throw new AppError('Loan not found', 404);
    if (loan.status !== 'applied') throw new AppError('Loan is not in applied status', 400);

    const { approve, remarks } = data as any;

    if (approve) {
      loan.approvalLevels.push({ approvedBy: userId as any, approvedAt: new Date(), level, remarks } as any);

      const settings = await import('../../models/CompanySettings.model.js').then(m => m.default.findOne().lean());
      const approvalLevels = (settings as any)?.loanConfig?.defaultApprovalLevels || 1;

      if (level >= approvalLevels) {
        loan.status = 'approved';
      }
    } else {
      loan.status = 'rejected';
      loan.remarks = remarks || 'Rejected';
    }

    loan.updatedBy = userId as any;
    await loan.save();

    await AuditService.log({ action: approve ? 'approve' : 'reject', module: 'loans', userId, targetId: id, details: { level, remarks } });

    return loan.toObject();
  }

  static async disburseLoan(id: string, userId: string, remarks?: string): Promise<any> {
    const loan = await Loan.findById(id);
    if (!loan) throw new AppError('Loan not found', 404);
    if (loan.status !== 'approved') throw new AppError('Loan must be approved before disbursement', 400);

    loan.status = 'active';
    loan.disbursedDate = new Date();
    loan.disbursedBy = userId as any;
    if (remarks) loan.remarks = remarks;
    loan.updatedBy = userId as any;
    await loan.save();

    await AuditService.log({ action: 'update', module: 'loans', userId, targetId: id, details: { status: 'active', disbursed: true } });

    return loan.toObject();
  }

  static async cancelLoan(id: string, userId: string): Promise<any> {
    const loan = await Loan.findById(id);
    if (!loan) throw new AppError('Loan not found', 404);
    if (!['applied', 'approved'].includes(loan.status)) throw new AppError('Only applied or approved loans can be cancelled', 400);

    await LoanRepayment.deleteMany({ loan: loan._id });

    loan.status = 'cancelled';
    loan.updatedBy = userId as any;
    await loan.save();

    await AuditService.log({ action: 'update', module: 'loans', userId, targetId: id, details: { status: 'cancelled' } });

    return loan.toObject();
  }

  static async listLoans(query: Record<string, unknown>): Promise<{ loans: any[]; total: number; pagination: any }> {
    const filter: Record<string, unknown> = {};
    if (query.employee) filter.employee = query.employee;
    if (query.status) filter.status = query.status;
    if (query.loanType) filter.loanType = query.loanType;

    const page = parseInt(String(query.page || '1'));
    const limit = parseInt(String(query.limit || '10'));
    const skip = (page - 1) * limit;

    const [loans, total] = await Promise.all([
      Loan.find(filter)
        .populate('employee', 'fullName employeeCode department')
        .populate('loanType', 'name code')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Loan.countDocuments(filter),
    ]);

    return {
      loans: loans.map((l: any) => ({ ...l, id: l._id.toString() })),
      total,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    };
  }

  static async getLoan(id: string): Promise<Record<string, unknown>> {
    const loan = await Loan.findById(id)
      .populate('employee', 'fullName employeeCode department category salaryType baseSalary')
      .populate('loanType', 'name code interestRate')
      .lean();
    if (!loan) throw new AppError('Loan not found', 404);

    const repayments = await LoanRepayment.find({ loan: loan._id }).sort({ month: 1 }).lean();

    return { ...loan, id: loan._id.toString(), repayments: repayments.map((r: any) => ({ ...r, id: r._id.toString() })) };
  }

  static async getEmployeeLoanSummary(employeeId: string): Promise<any> {
    const loans = await Loan.find({ employee: employeeId })
      .populate('loanType', 'name code')
      .sort({ createdAt: -1 })
      .lean();

    const activeLoan = loans.find((l: any) => l.status === 'active');
    let outstandingBalance = 0;

    if (activeLoan) {
      const lastRepayment = await LoanRepayment.findOne({ loan: activeLoan._id, status: { $ne: 'pending' } }).sort({ month: -1 }).lean();
      outstandingBalance = (lastRepayment as any)?.outstandingAfter || activeLoan.totalPayable;
    }

    return {
      totalLoans: loans.length,
      activeLoans: loans.filter((l: any) => ['active', 'approved'].includes(l.status)).length,
      outstandingBalance,
      loans: loans.map((l: any) => ({ ...l, id: l._id.toString() })),
    };
  }

  static async getScheduledRepaymentsForMonth(month: string): Promise<any[]> {
    return LoanRepayment.find({ month, status: 'pending' })
      .populate('loan', 'amount interestRate tenure')
      .populate('employee', 'fullName employeeCode department baseSalary dailyWage')
      .lean();
  }

  static async markRepaymentDeducted(repaymentId: string, payrollRunId: string): Promise<void> {
    await LoanRepayment.findByIdAndUpdate(repaymentId, {
      status: 'deducted',
      payrollRun: payrollRunId as any,
      repaidAt: new Date(),
    });
  }
}

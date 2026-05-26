import CompanySettings from '../../models/CompanySettings.model.js';
import Employee from '../../models/Employee.model.js';
import PayrollItem from '../../models/PayrollItem.model.js';
import StatutoryReport from '../../models/StatutoryReport.model.js';
import PFChallan from '../../models/PFChallan.model.js';
import mongoose from 'mongoose';

interface StatutoryDeductions {
  employeePf: number;
  employerPf: number;
  eps: number;
  edli: number;
  pfAdminCharges: number;
  edliAdminCharges: number;
  esiEmployee: number;
  esiEmployer: number;
  professionalTax: number;
}

export async function getStatutoryDefaults(): Promise<{
  pfEnabled: boolean;
  pfWageCeiling: number;
  pfEmployeeRate: number;
  pfEmployerRate: number;
  epsRate: number;
  edliRate: number;
  pfAdminCharges: number;
  edliAdminCharges: number;
  esiEnabled: boolean;
  esiThreshold: number;
  esiEmployeeRate: number;
  esiEmployerRate: number;
  ptEnabled: boolean;
  ptSlabs: { state: string; slabs: { minSalary: number; maxSalary: number; amount: number; frequency: string }[] }[];
}> {
  const settings = await CompanySettings.findOne().lean();
  const config = (settings?.statutoryConfig as any) || {};
  return {
    pfEnabled: config.pfEnabled ?? true,
    pfWageCeiling: config.pfWageCeiling ?? 15000,
    pfEmployeeRate: config.pfEmployeeRate ?? 12,
    pfEmployerRate: config.pfEmployerRate ?? 13.61,
    epsRate: config.epsRate ?? 8.33,
    edliRate: config.edliRate ?? 0.5,
    pfAdminCharges: config.pfAdminCharges ?? 1.1,
    edliAdminCharges: config.edliAdminCharges ?? 0.01,
    esiEnabled: config.esiEnabled ?? true,
    esiThreshold: config.esiThreshold ?? 21000,
    esiEmployeeRate: config.esiEmployeeRate ?? 0.75,
    esiEmployerRate: config.esiEmployerRate ?? 3.25,
    ptEnabled: config.ptEnabled ?? true,
    ptSlabs: config.ptSlabs ?? [],
  };
}

export async function calculateStatutoryForEmployee(
  employeeId: string,
  grossPay: number,
  month: string
): Promise<StatutoryDeductions & { pfApplicableWages: number; esiApplicable: boolean }> {
  const [employee, defaults] = await Promise.all([
    Employee.findById(employeeId).lean(),
    getStatutoryDefaults(),
  ]);

  if (!employee) throw new Error('Employee not found');

  const result: StatutoryDeductions & { pfApplicableWages: number; esiApplicable: boolean } = {
    employeePf: 0,
    employerPf: 0,
    eps: 0,
    edli: 0,
    pfAdminCharges: 0,
    edliAdminCharges: 0,
    esiEmployee: 0,
    esiEmployer: 0,
    professionalTax: 0,
    pfApplicableWages: 0,
    esiApplicable: false,
  };

  const pfApplicableWages = Math.min(grossPay, defaults.pfWageCeiling);
  result.pfApplicableWages = pfApplicableWages;

  if (defaults.pfEnabled && !employee.pfExempted && pfApplicableWages > 0) {
    result.employeePf = Math.round(pfApplicableWages * (defaults.pfEmployeeRate / 100));
    const epsAmount = Math.round(Math.min(pfApplicableWages, 15000) * (defaults.epsRate / 100));
    result.eps = epsAmount;
    result.employerPf = Math.round(pfApplicableWages * (defaults.pfEmployerRate / 100)) - epsAmount;
    result.edli = Math.round(pfApplicableWages * (defaults.edliRate / 100));
    result.pfAdminCharges = Math.round(pfApplicableWages * (defaults.pfAdminCharges / 100));
    result.edliAdminCharges = Math.round(pfApplicableWages * (defaults.edliAdminCharges / 100));
  }

  const esiApplicable = defaults.esiEnabled && !employee.esiExempted && grossPay <= defaults.esiThreshold;
  result.esiApplicable = esiApplicable;

  if (esiApplicable) {
    result.esiEmployee = Math.round(grossPay * (defaults.esiEmployeeRate / 100));
    result.esiEmployer = Math.round(grossPay * (defaults.esiEmployerRate / 100));
  }

  if (defaults.ptEnabled && !employee.ptExempted) {
    const state = employee.ptState || 'Karnataka';
    const stateSlabs = defaults.ptSlabs.find((s) => s.state === state);
    if (stateSlabs) {
      const slab = stateSlabs.slabs.find(
        (s) => grossPay >= s.minSalary && grossPay <= s.maxSalary
      );
      if (slab) {
        if (slab.frequency === 'monthly') {
          result.professionalTax = slab.amount;
        } else if (slab.frequency === 'half-yearly') {
          const monthIndex = parseInt(month.split('-')[1], 10);
          const halfYearStartMonths = [3, 9];
          const isHalfYearStart = halfYearStartMonths.includes(monthIndex);
          result.professionalTax = isHalfYearStart ? slab.amount : 0;
        } else if (slab.frequency === 'yearly') {
          const monthIndex = parseInt(month.split('-')[1], 10);
          result.professionalTax = monthIndex === 3 ? slab.amount : 0;
        }
      }
    }
  }

  return result;
}

export async function generatePFChallan(month: string, userId: string) {
  const payrollItems = await PayrollItem.find({
    month,
    status: { $in: ['submitted', 'approved', 'finalized'] },
  }).populate('employee', 'pfExempted pfUAN').lean();

  const defaults = await getStatutoryDefaults();
  let totalWages = 0;
  let employeeCount = 0;
  let totalEmployeePf = 0;
  let totalEmployerPf = 0;
  let totalEps = 0;
  let totalEdli = 0;
  let totalPfAdmin = 0;
  let totalEdliAdmin = 0;

  for (const item of payrollItems) {
    const emp = item.employee as any;
    if (emp?.pfExempted) continue;

    const pfWages = Math.min(item.grossEarnings, defaults.pfWageCeiling);
    if (pfWages <= 0) continue;

    totalWages += pfWages;
    employeeCount++;
    totalEmployeePf += Math.round(pfWages * (defaults.pfEmployeeRate / 100));
    const epsAmt = Math.round(Math.min(pfWages, 15000) * (defaults.epsRate / 100));
    totalEps += epsAmt;
    totalEmployerPf += Math.round(pfWages * (defaults.pfEmployerRate / 100)) - epsAmt;
    totalEdli += Math.round(pfWages * (defaults.edliRate / 100));
    totalPfAdmin += Math.round(pfWages * (defaults.pfAdminCharges / 100));
    totalEdliAdmin += Math.round(pfWages * (defaults.edliAdminCharges / 100));
  }

  const totalAmount =
    totalEmployeePf + totalEmployerPf + totalEps + totalEdli + totalPfAdmin + totalEdliAdmin;

  const [year, mon] = month.split('-');
  const financialYear = parseInt(mon, 10) >= 4
    ? `${year}-${parseInt(year) + 1}`
    : `${parseInt(year) - 1}-${year}`;

  const challan = await PFChallan.create({
    month,
    financialYear,
    totalWages: Math.round(totalWages),
    employeeCount,
    employeePfContribution: Math.round(totalEmployeePf),
    employerPfContribution: Math.round(totalEmployerPf),
    epsContribution: Math.round(totalEps),
    edliContribution: Math.round(totalEdli),
    pfAdminCharges: Math.round(totalPfAdmin),
    edliAdminCharges: Math.round(totalEdliAdmin),
    totalAmount: Math.round(totalAmount),
    status: 'generated',
    generatedBy: new mongoose.Types.ObjectId(userId),
  });

  return challan;
}

export async function getChallans(filters: { month?: string; status?: string; financialYear?: string }) {
  const query: any = {};
  if (filters.month) query.month = filters.month;
  if (filters.status) query.status = filters.status;
  if (filters.financialYear) query.financialYear = filters.financialYear;

  return PFChallan.find(query)
    .populate('generatedBy', 'name')
    .sort({ generationDate: -1 })
    .lean();
}

export async function getChallanById(id: string) {
  return PFChallan.findById(id)
    .populate('generatedBy', 'name')
    .lean();
}

export async function updateChallan(id: string, data: any, userId?: string) {
  const updateData = userId ? { ...data, updatedBy: userId } : data;
  return PFChallan.findByIdAndUpdate(id, { $set: updateData }, { new: true }).lean();
}

export async function generateStatutoryReport(
  reportType: string,
  month: string,
  userId: string
) {
  const payrollItems = await PayrollItem.find({
    month,
    status: { $in: ['submitted', 'approved', 'finalized'] },
  })
    .populate('employee', 'employeeCode fullName pfUAN esiNumber department pfExempted esiExempted ptState ptExempted')
    .lean();

  const [year, mon] = month.split('-');
  const financialYear = parseInt(mon, 10) >= 4
    ? `${year}-${parseInt(year) + 1}`
    : `${parseInt(year) - 1}-${year}`;

  let reportData: any = {};

  switch (reportType) {
    case 'pf-ecr': {
      reportData = {
        month,
        financialYear,
        totalEmployees: payrollItems.length,
        records: payrollItems.map((item) => {
          const emp = item.employee as any;
          return {
            employeeCode: emp?.employeeCode || '',
            employeeName: emp?.fullName || '',
            uan: emp?.pfUAN || '',
            grossWages: item.grossEarnings,
            employeePf: item.deductions.find((d) => d.name.toUpperCase() === 'PF')?.calculatedValue || 0,
            employerPf: 0,
            eps: 0,
            daysWorked: item.presentDays,
          };
        }),
      };
      break;
    }
    case 'esi-return': {
      reportData = {
        month,
        financialYear,
        totalEmployees: payrollItems.length,
        records: payrollItems.map((item) => {
          const emp = item.employee as any;
          return {
            employeeCode: emp?.employeeCode || '',
            employeeName: emp?.fullName || '',
            esiNumber: emp?.esiNumber || '',
            grossWages: item.grossEarnings,
            employeeEsi: item.deductions.find((d) => d.name.toUpperCase() === 'ESI')?.calculatedValue || 0,
            employerEsi: 0,
            daysWorked: item.presentDays,
          };
        }),
      };
      break;
    }
    case 'pf-form-5':
    case 'pf-form-10': {
      reportData = {
        month,
        financialYear,
        reportType,
        records: payrollItems.map((item) => {
          const emp = item.employee as any;
          return {
            employeeCode: emp?.employeeCode || '',
            employeeName: emp?.fullName || '',
            uan: emp?.pfUAN || '',
            joiningDate: emp?.joiningDate || '',
            grossWages: item.grossEarnings,
            employeePf: item.deductions.find((d) => d.name.toUpperCase() === 'PF')?.calculatedValue || 0,
          };
        }),
      };
      break;
    }
    case 'pt-return': {
      reportData = {
        month,
        financialYear,
        records: payrollItems.map((item) => {
          const emp = item.employee as any;
          return {
            employeeCode: emp?.employeeCode || '',
            employeeName: emp?.fullName || '',
            state: emp?.ptState || '',
            grossWages: item.grossEarnings,
            professionalTax: item.deductions.find((d) => d.name.toUpperCase() === 'PT')?.calculatedValue || 0,
          };
        }),
      };
      break;
    }
    default:
      reportData = {
        month,
        financialYear,
        records: payrollItems,
      };
  }

  const report = await StatutoryReport.create({
    reportType,
    month,
    financialYear,
    status: 'generated',
    generatedAt: new Date(),
    generatedBy: new mongoose.Types.ObjectId(userId),
    data: reportData,
    fileName: `${reportType}-${month}.json`,
  });

  return report;
}

export async function getReports(filters: { reportType?: string; month?: string; financialYear?: string }) {
  const query: any = {};
  if (filters.reportType) query.reportType = filters.reportType;
  if (filters.month) query.month = filters.month;
  if (filters.financialYear) query.financialYear = filters.financialYear;

  return StatutoryReport.find(query)
    .populate('generatedBy', 'name')
    .sort({ generatedAt: -1 })
    .lean();
}

export async function getReportById(id: string) {
  return StatutoryReport.findById(id)
    .populate('generatedBy', 'name')
    .lean();
}

export async function updateReport(id: string, data: any, userId?: string) {
  const updateData = userId ? { ...data, updatedBy: userId } : data;
  return StatutoryReport.findByIdAndUpdate(id, { $set: updateData }, { new: true }).lean();
}

export async function getStatutorySummary(month: string) {
  const payrollItems = await PayrollItem.find({
    month,
    status: { $in: ['submitted', 'approved', 'finalized'] },
  }).populate('employee', 'pfExempted esiExempted ptExempted ptState pfUAN esiNumber').lean();

  const defaults = await getStatutoryDefaults();
  let totalPfWages = 0;
  let totalEmployeePf = 0;
  let totalEmployerPf = 0;
  let totalEps = 0;
  let totalEdli = 0;
  let totalEsiWages = 0;
  let totalEsiEmployee = 0;
  let totalEsiEmployer = 0;
  let totalPt = 0;
  let pfCount = 0;
  let esiCount = 0;
  let ptCount = 0;

  for (const item of payrollItems) {
    const emp = item.employee as any;

    const pfWages = Math.min(item.grossEarnings, defaults.pfWageCeiling);
    if (defaults.pfEnabled && !emp?.pfExempted && pfWages > 0) {
      totalPfWages += pfWages;
      pfCount++;
      totalEmployeePf += Math.round(pfWages * (defaults.pfEmployeeRate / 100));
      const epsAmt = Math.round(Math.min(pfWages, 15000) * (defaults.epsRate / 100));
      totalEps += epsAmt;
      totalEmployerPf += Math.round(pfWages * (defaults.pfEmployerRate / 100)) - epsAmt;
      totalEdli += Math.round(pfWages * (defaults.edliRate / 100));
    }

    if (defaults.esiEnabled && !emp?.esiExempted && item.grossEarnings <= defaults.esiThreshold) {
      totalEsiWages += item.grossEarnings;
      esiCount++;
      totalEsiEmployee += Math.round(item.grossEarnings * (defaults.esiEmployeeRate / 100));
      totalEsiEmployer += Math.round(item.grossEarnings * (defaults.esiEmployerRate / 100));
    }

    if (defaults.ptEnabled && !emp?.ptExempted) {
      const state = emp?.ptState || 'Karnataka';
      const stateSlabs = defaults.ptSlabs.find((s) => s.state === state);
      if (stateSlabs) {
        const slab = stateSlabs.slabs.find(
          (s) => item.grossEarnings >= s.minSalary && item.grossEarnings <= s.maxSalary
        );
        if (slab) {
          ptCount++;
          if (slab.frequency === 'monthly') {
            totalPt += slab.amount;
          } else if (slab.frequency === 'half-yearly') {
            const monthIndex = parseInt(month.split('-')[1], 10);
            if ([3, 9].includes(monthIndex)) totalPt += slab.amount;
          } else if (slab.frequency === 'yearly') {
            const monthIndex = parseInt(month.split('-')[1], 10);
            if (monthIndex === 3) totalPt += slab.amount;
          }
        }
      }
    }
  }

  return {
    month,
    pf: {
      enabled: defaults.pfEnabled,
      applicableEmployees: pfCount,
      totalWages: Math.round(totalPfWages),
      employeeContribution: Math.round(totalEmployeePf),
      employerContribution: Math.round(totalEmployerPf),
      eps: Math.round(totalEps),
      edli: Math.round(totalEdli),
      totalPfDue: Math.round(totalEmployeePf + totalEmployerPf + totalEps + totalEdli),
    },
    esi: {
      enabled: defaults.esiEnabled,
      applicableEmployees: esiCount,
      totalWages: Math.round(totalEsiWages),
      employeeContribution: Math.round(totalEsiEmployee),
      employerContribution: Math.round(totalEsiEmployer),
      totalEsiDue: Math.round(totalEsiEmployee + totalEsiEmployer),
    },
    pt: {
      enabled: defaults.ptEnabled,
      applicableEmployees: ptCount,
      totalAmount: Math.round(totalPt),
    },
  };
}

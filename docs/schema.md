# Schema — Manufacturing HRMS V1

## Index Definitions

All indexes are defined in respective model files. This document serves as the authoritative reference.

## 1. User
```
email: unique index
```
Fields: name, email, password, role, isActive, lastLogin, createdBy, timestamps

## 2. Employee
```
employeeCode: unique index
department: regular index
status: regular index
category: regular index
shift: regular index
```
Fields: employeeCode, fullName, fatherName, category, employmentType, department (ref), designation (ref), shift (ref), joiningDate, salaryType, baseSalary, dailyWage, overtimeEligible, status, contactNumber, address, bankDetails (object), photo (cloudinary URL), createdBy, updatedBy, timestamps

## 3. Department
```
name: regular index
code: unique index
```
Fields: name, code, description, isActive, createdBy, timestamps

## 4. Designation
```
name: regular index
department: regular index
```
Fields: name, department (ref), isActive, createdBy, timestamps

## 5. Shift
Fields: name, startTime, endTime, workingHours, applicableTo, isActive, createdBy, timestamps

## 6. Holiday
```
date: regular index
year: regular index
applicableTo: regular index
```
Fields: name, date, type, applicableTo, year, createdBy, timestamps

## 7. WeeklyOffRule
Fields: name, category, offDays (array of 0-6), isActive, createdBy, timestamps

## 8. AttendanceEntry
```
employee + date: compound unique index
date: regular index
status: regular index
```
Fields: employee (ref), date, shift (ref), status, inTime, outTime, overtimeHours (default 0), remarks, source (default "manual-register-entry"), enteredBy (ref), updatedBy, timestamps

## 9. OvertimeRule
Fields: name, applicableTo, multiplier, maxHoursPerDay, maxHoursPerMonth, isActive, createdBy, timestamps

## 10. OvertimeEntry
```
employee + date: compound index
```
Fields: employee (ref), date, hours, overtimeRule (ref), remarks, enteredBy (ref), timestamps

## 11. PayrollRun
```
month (YYYY-MM): unique index
status: regular index
```
Fields: month, status, totalEmployees, totalNetPay, processedBy (ref), finalizedBy (ref), remarks, timestamps

## 12. PayrollItem
```
payrollRun + employee: compound unique index
month: regular index
employee: regular index
```
Fields: payrollRun (ref), employee (ref), month, totalDays, presentDays, absentDays, halfDays, weeklyOffs, holidays, effectiveWorkingDays, overtimeHours, overtimeAmount, basicEarnings, allowances (array), grossEarnings, deductions (array), totalDeductions, netPay, status, timestamps

## 13. SalarySlip
```
slipNumber: unique index
employee: regular index
month: regular index
```
Fields: payrollItem (ref), employee (ref), month, slipNumber, generatedBy (ref), generatedAt, isDownloaded, timestamps

## 14. CompanySettings
Singleton document. Only one record ever exists.

Fields: companyInfo, payrollConfig, attendanceConfig, allowanceConfig, deductionConfig, emailConfig, updatedBy, timestamps

### companyInfo
- name, address, phone, email, logo (cloudinary URL), financialYearStart (month number 1-12)

### payrollConfig
- overtimeBase: "basic" | "basicPlusAllowances"
- overtimeMultiplier: number (default 2.0)
- halfDayDeductionPercent: number (default 50)
- lateDeductionPerDay: number
- paidWeeklyOff: boolean (default true)
- paidHolidays: boolean (default true)
- defaultWorkingDays: number (default 26)
- standardHoursPerDay: number (default 8)
- payrollLockDays: number (days after month end before payroll can be locked, default 10)

### attendanceConfig
- pastEntryLimitDays: number (default 7, how many days back attendance can be entered)
- lateMarkEnabled: boolean (default false)
- lateMarkThresholdMinutes: number (default 15)
- lateToHalfDayAfterOccurrences: number (convert to half-day after N late marks in a month, default 3)

### allowanceConfig
Array of objects:
- name: string
- type: "fixed" | "percentage"
- value: number
- applicableTo: "all" | "worker" | "office-staff" | "permanent" | "contract" | "temporary" | "trainee"
- isActive: boolean

### deductionConfig
Array of objects:
- name: string
- type: "fixed" | "percentage"
- value: number
- applicableTo: "all" | "worker" | "office-staff" | "permanent" | "contract" | "temporary" | "trainee"
- isActive: boolean

### emailConfig
- host, port, user, password, fromAddress
All optional — system falls back to .env if not configured in settings.

### Summary of Configurable Rules
| Rule | Location | Default |
|------|----------|---------|
| OT multiplier | payrollConfig.overtimeMultiplier | 2.0 |
| OT base | payrollConfig.overtimeBase | basic |
| Half-day deduction | payrollConfig.halfDayDeductionPercent | 50% |
| Late deduction | payrollConfig.lateDeductionPerDay | 0 |
| Paid weekly offs | payrollConfig.paidWeeklyOff | true |
| Paid holidays | payrollConfig.paidHolidays | true |
| Working days/month | payrollConfig.defaultWorkingDays | 26 |
| Standard hours/day | payrollConfig.standardHoursPerDay | 8 |
| Payroll lock days | payrollConfig.payrollLockDays | 10 |
| Past entry limit | attendanceConfig.pastEntryLimitDays | 7 |
| Late mark enabled | attendanceConfig.lateMarkEnabled | false |
| Late mark threshold | attendanceConfig.lateMarkThresholdMinutes | 15 |
| Late→half-day after | attendanceConfig.lateToHalfDayAfterOccurrences | 3 |

## 15. AuditLog
```
userId: regular index
module: regular index
createdAt: regular index
```
Fields: action, module, userId (ref), targetId, details (object), ipAddress, userAgent, timestamps

## 16. Notification
```
recipient + isRead: compound index
recipient: regular index
createdAt: regular index
```
Fields: title, message, type, recipient (ref), isRead (default false), module, link, timestamps
# Domain Rules — Manufacturing HRMS V1

## 1. Employee Rules

- Employee code must be unique
- Both "worker" and "office-staff" categories are fully supported from day one
- Worker employees may be daily wage OR monthly salary; office staff are always monthly salary
- Joining date cannot be in the future
- Photo upload is optional, max 1MB, JPG/PNG/WEBP only

## 2. Attendance Rules

- All attendance entries are manual (from physical register)
- Source field always set to "manual-register-entry"
- Status values: present, absent, half-day, leave, weekly-off, holiday
- Overtime hours default to 0, entered separately
- One entry per employee per day (compound unique index)
- Weekly offs and holidays determined by configuration, not by entry

## 3. Overtime Rules

- Overtime multiplier is configurable per rule
- ⚠️ Legal minimum under Factories Act 1948 (Section 59) is 2x — default must be 2.0, not 1.5
- Max hours per day and max hours per month limits apply
- Overtime entries are separate from attendance entries
- Overtime rate is calculated on basic salary (not gross), using 26-day and 8-hour standard

## 4. Payroll Rules

All values come from `CompanySettings.payrollConfig`, `allowanceConfig`, `deductionConfig`. Nothing hardcoded.

### companyInfo
HR Admin sets: name, address, phone, email, logo (Cloudinary), financialYearStart month.

### payrollConfig — all values set by HR Admin
- overtimeBase ("basic" | "basicPlusAllowances") — HR Admin chooses
- overtimeMultiplier (default 2.0 — Factories Act 1948, Section 59)
- halfDayDeductionPercent (default 50%)
- lateDeductionPerDay (amount in currency, default 0)
- paidWeeklyOff (boolean, default true)
- paidHolidays (boolean, default true)
- defaultWorkingDays (default 26 — Payment of Wages Act standard)
- standardHoursPerDay (default 8 — Factories Act 1948, Section 51)
- payrollLockDays (days after month end before payroll locks, default 10)

### attendanceConfig — all values set by HR Admin
- pastEntryLimitDays (default 7, max days back for manual entry)
- lateMarkEnabled (default false, separate late status)
- lateMarkThresholdMinutes (default 15, minutes after shift start to mark late)
- lateToHalfDayAfterOccurrences (default 3, convert to half-day after N late marks/month)

### allowanceConfig — configured by HR Admin from UI
Array of allowance definitions, each with: name, type (fixed | percentage), value, applicableTo, isActive.
HR Admin adds/removes/edits any allowance. Payroll reads active allowances at calculation time.
Default seed: HRA, DA, Transport Allowance, Food Allowance as starting point.

### deductionConfig — configured by HR Admin from UI
Array of deduction definitions, each with: name, type (fixed | percentage), value, applicableTo, isActive.
HR Admin adds/removes/edits any deduction. Includes PF, ESI, PT as configurable items.
System stores and applies them — full statutory slab-based calculation planned for V2.

### emailConfig — configured by HR Admin from UI
SMTP settings: host, port, user, password, fromAddress. Falls back to .env if not set.

### Calculation Flow

1. Get all active employees for the month
2. Fetch attendance summary per employee (using MongoDB aggregation)
3. Fetch overtime entries per employee
4. Read payroll config from CompanySettings
5. Apply payroll calculator (pure functions)
6. Create PayrollRun + PayrollItems
7. Mark as draft for review
8. HR reviews and edits individual items
9. HR finalizes the run
10. Generate salary slips

### Monthly Salary Calculation (Monthly Employees)

```
totalDays             = days in month
weeklyOffs            = count of weekly-off entries in month
holidays              = count of holiday entries in month
effectiveWorkingDays  = totalDays - weeklyOffs - holidays

presentDays           = count of present entries
halfDays              = count of half-day entries
absentDays            = effectiveWorkingDays - presentDays - halfDays

paidWeeklyOffsVal    = paidWeeklyOff ? weeklyOffs : 0
paidHolidaysVal      = paidHolidays ? holidays   : 0
paidDays             = presentDays
                      + (halfDays * (1 - halfDayDeductionPercent / 100))
                      + paidWeeklyOffsVal
                      + paidHolidaysVal

// Allowances calculated from allowanceConfig (applied per employee)
allowances           = sum of active allowances applicable to employee

basicEarnings        = (baseSalary / totalDays) * paidDays

// Overtime rate from payrollConfig
overtimeRate         = baseSalary / defaultWorkingDays / standardHoursPerDay
                      // if overtimeBase = "basic"
                      // = (baseSalary + fixedAllowances) / defaultWorkingDays / standardHoursPerDay
                      // if overtimeBase = "basicPlusAllowances"

overtimeAmount       = overtimeHours * overtimeRate * overtimeMultiplier

lateDeductions       = lateDays * lateDeductionPerDay

grossEarnings        = basicEarnings + allowances + overtimeAmount
deductions           = lateDeductions + sum of active deductions applicable to employee
totalDeductions      = sum of all deduction values
netPay               = grossEarnings - totalDeductions
```

### Daily Wage Calculation (Daily Wage Workers)

```
paidDays        = presentDays
                  + (halfDays * 0.5)
                  + (paidWeeklyOffs ? weeklyOffs : 0)
                  + (paidHolidays   ? holidays   : 0)

overtimeAmount  = overtimeHours
                  * (dailyWageRate / workingHoursPerDay)
                  * overtimeMultiplier

grossEarnings   = (dailyWageRate * paidDays) + overtimeAmount
totalDeductions = sum of applicable deductions (PF, ESIC, PT, etc.)
netPay          = grossEarnings - totalDeductions
```

## 5. Salary Slip Rules

- Slip number is unique
- Generated after payroll run is finalized
- PDF streamed to browser on download
- Nothing stored on server after generation

## 6. Settings Rules

- CompanySettings is a singleton (only one document)
- Created on first run if not exists
- Only updated, never deleted
- Logo upload replaces previous logo on Cloudinary

## 7. Audit Rules

- All create, update, delete, and finalize operations are audited
- User ID, IP address, and user agent recorded
- Audit logs are append-only
- Never delete audit logs

## 8. Permissions

| Role        | Permissions                                                                                                                    |
|-------------|--------------------------------------------------------------------------------------------------------------------------------|
| super-admin | ALL                                                                                                                            |
| hr-admin    | manage-employees, manage-attendance, manage-overtime, process-payroll, manage-settings, manage-users, view-reports, view-audit |
| hr-staff    | view-employees, manage-attendance, manage-overtime, view-reports                                                               |
| accounts    | process-payroll, view-reports                                                                                                  |
| manager     | view-reports (read-only)                                                                                                       |

## 9. Status Values

| Entity      | Statuses                                                      |
|-------------|---------------------------------------------------------------|
| Employee    | active, inactive, terminated                                  |
| PayrollRun  | draft, finalized                                              |
| PayrollItem | draft, finalized                                              |
| User        | active, inactive                                              |
| Department  | active, inactive                                              |
| Shift       | active, inactive                                              |
| Designation | active, inactive                                              |
| Holiday     | active                                                        |
| Attendance  | present, absent, half-day, leave, weekly-off, holiday         |

## 10. Legal References

| Rule                               | Act / Section                                |
|------------------------------------|----------------------------------------------|
| Overtime minimum 2x rate           | Factories Act 1948, Section 59               |
| Weekly off mandatory (paid)        | Factories Act 1948, Section 52               |
| 26-day wage calculation standard   | Payment of Wages Act 1936                    |
| 8-hour standard working day        | Factories Act 1948, Section 51               |
| Max 48 hours/week work limit       | Factories Act 1948, Section 51               |
| Paid national holidays (3 minimum) | Negotiable Instruments Act / State Shop Acts |

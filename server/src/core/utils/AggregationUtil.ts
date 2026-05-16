import mongoose from 'mongoose';

export class AggregationUtil {
  static lookupEmployeeDetails(): mongoose.PipelineStage {
    return {
      $lookup: {
        from: 'employees',
        localField: 'employee',
        foreignField: '_id',
        as: 'employeeDetails',
      },
    };
  }

  static unwindEmployeeDetails(): mongoose.PipelineStage {
    return {
      $unwind: {
        path: '$employeeDetails',
        preserveNullAndEmptyArrays: true,
      },
    };
  }

  static lookupDepartment(): mongoose.PipelineStage {
    return {
      $lookup: {
        from: 'departments',
        localField: 'employeeDetails.department',
        foreignField: '_id',
        as: 'departmentDetails',
      },
    };
  }

  static unwindDepartment(): mongoose.PipelineStage {
    return {
      $unwind: {
        path: '$departmentDetails',
        preserveNullAndEmptyArrays: true,
      },
    };
  }

  static matchMonth(year: number, month: number): mongoose.PipelineStage {
    const startDate = new Date(`${year}-${String(month).padStart(2, '0')}-01`);
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + 1);
    endDate.setDate(0);

    return {
      $match: {
        date: {
          $gte: startDate,
          $lte: endDate,
        },
      },
    };
  }

  static matchDateRange(
    startDate: Date | undefined,
    endDate: Date | undefined,
  ): mongoose.PipelineStage {
    const match: Record<string, unknown> = {};

    if (startDate) {
      match.$gte = startDate;
    }
    if (endDate) {
      match.$lte = endDate;
    }

    if (Object.keys(match).length === 0) {
      return { $match: {} };
    }

    return { $match: { date: match } };
  }

  static addPaginationStages(page: number, limit: number): mongoose.PipelineStage[] {
    return [
      { $skip: (page - 1) * limit },
      { $limit: limit },
    ];
  }

  static groupAttendanceByEmployee(): mongoose.PipelineStage {
    return {
      $group: {
        _id: '$employee',
        presentDays: {
          $sum: { $cond: [{ $eq: ['$status', 'present'] }, 1, 0] },
        },
        absentDays: {
          $sum: { $cond: [{ $eq: ['$status', 'absent'] }, 1, 0] },
        },
        halfDays: {
          $sum: { $cond: [{ $eq: ['$status', 'half-day'] }, 1, 0] },
        },
        totalEntries: { $sum: 1 },
        totalOvertimeHours: { $sum: '$overtimeHours' },
      },
    };
  }

  static projectFields(fields: Record<string, unknown>): mongoose.PipelineStage {
    return { $project: fields };
  }
}

export default AggregationUtil;
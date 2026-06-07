import TrainingProgram from '../../models/TrainingProgram.model.js';
import TrainingEnrollment from '../../models/TrainingEnrollment.model.js';
import Skill from '../../models/Skill.model.js';
import EmployeeSkill from '../../models/EmployeeSkill.model.js';
import Employee from '../../models/Employee.model.js';
import Designation from '../../models/Designation.model.js';
import { AppError } from '../../core/errors/AppError.js';
import { AuditService } from '../../core/audit/AuditService.js';
import { NotificationService } from '../../core/notification/NotificationService.js';
import { PaginationUtil } from '../../core/utils/PaginationUtil.js';

export class TrainingService {
  static async createProgram(data: Record<string, unknown>, userId: string) {
    const program = await TrainingProgram.create({
      ...data,
      startDate: new Date(data.startDate as string),
      endDate: new Date(data.endDate as string),
      createdBy: userId,
    });

    await AuditService.log({
      action: 'create', module: 'training', userId,
      targetId: program._id.toString(), targetName: program.title,
      details: { category: data.category },
    });

    return { ...program.toObject(), id: program._id.toString(), _id: undefined };
  }

  static async getPrograms(queryParams: Record<string, unknown>) {
    const { page, limit, sort, order, search } = PaginationUtil.parseFromObject(queryParams);

    const filter: Record<string, unknown> = {};
    if (queryParams.status) filter.status = queryParams.status;
    if (queryParams.category) filter.category = queryParams.category;
    if (search) {
      const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      filter.$or = [
        { title: { $regex: escaped, $options: 'i' } },
        { trainer: { $regex: escaped, $options: 'i' } },
      ];
    }

    const skip = PaginationUtil.getSkip(page, limit);
    const sortObj: Record<string, 1 | -1> = { [sort]: order === 'asc' ? 1 : -1 };

    const [programs, total] = await Promise.all([
      TrainingProgram.find(filter).sort(sortObj).skip(skip).limit(limit).lean(),
      TrainingProgram.countDocuments(filter),
    ]);

    const data = programs.map((p: any) => ({ ...p, id: String(p._id), _id: undefined }));
    const meta = PaginationUtil.getMeta(page, limit, total);
    return { data, meta };
  }

  static async getProgramById(id: string): Promise<any> {
    const program = await TrainingProgram.findById(id).populate('createdBy', 'name email').lean();
    if (!program) throw new AppError('Program not found', 404);

    const enrollments = await TrainingEnrollment.find({ training: id })
      .populate('employee', 'fullName employeeCode')
      .lean();

    return { ...program, id: program._id.toString(), _id: undefined, enrollments };
  }

  static async updateProgram(id: string, data: Record<string, unknown>, userId: string) {
    const program = await TrainingProgram.findById(id);
    if (!program) throw new AppError('Program not found', 404);
    if (program.status === 'cancelled') throw new AppError('Cannot update a cancelled program', 400);

    Object.assign(program, data);
    if (data.startDate) program.startDate = new Date(data.startDate as string);
    if (data.endDate) program.endDate = new Date(data.endDate as string);
    await program.save();

    await AuditService.log({
      action: 'update', module: 'training', userId,
      targetId: id, targetName: program.title,
    });

    return { ...program.toObject(), id: program._id.toString(), _id: undefined };
  }

  static async cancelProgram(id: string, userId: string) {
    const program = await TrainingProgram.findById(id);
    if (!program) throw new AppError('Program not found', 404);
    if (program.status === 'completed') throw new AppError('Cannot cancel a completed program', 400);

    program.status = 'cancelled';
    await program.save();

    const enrollments = await TrainingEnrollment.find({ training: id, status: { $in: ['enrolled', 'in-progress'] } });
    for (const enrollment of enrollments) {
      enrollment.status = 'dropped';
      await enrollment.save();
      await NotificationService.send({
        title: 'Training Cancelled',
        message: `The training "${program.title}" has been cancelled.`,
        type: 'warning', recipient: enrollment.employee.toString(),
        module: 'training',
      });
    }

    await AuditService.log({
      action: 'update', module: 'training', userId,
      targetId: id, targetName: program.title,
      details: { action: 'cancelled' },
    });

    return { ...program.toObject(), id: program._id.toString(), _id: undefined };
  }

  static async enrollEmployee(trainingId: string, employeeId: string, userId: string) {
    const program = await TrainingProgram.findById(trainingId);
    if (!program) throw new AppError('Training program not found', 404);
    if (program.status === 'cancelled' || program.status === 'completed') {
      throw new AppError('Cannot enroll in a cancelled or completed program', 400);
    }

    const existing = await TrainingEnrollment.findOne({ training: trainingId, employee: employeeId as any });
    if (existing) throw new AppError('Employee already enrolled', 400);

    if (program.maxParticipants > 0) {
      const count = await TrainingEnrollment.countDocuments({ training: trainingId, status: { $ne: 'dropped' } });
      if (count >= program.maxParticipants) throw new AppError('Training program is full', 400);
    }

    const enrollment = await TrainingEnrollment.create({
      training: trainingId,
      employee: employeeId,
    });

    await AuditService.log({
      action: 'create', module: 'training', userId,
      targetId: enrollment._id.toString(),
      details: { training: program.title, employee: employeeId },
    });

    await NotificationService.send({
      title: 'Training Enrollment',
      message: `You have been enrolled in "${program.title}" starting ${program.startDate.toLocaleDateString()}.`,
      type: 'info', recipient: employeeId,
      module: 'training', link: `/training/programs/${trainingId}`,
    });

    return { ...enrollment.toObject(), id: enrollment._id.toString(), _id: undefined };
  }

  static async batchEnroll(trainingId: string, employeeIds: string[], _userId: string) {
    const program = await TrainingProgram.findById(trainingId);
    if (!program) throw new AppError('Training program not found', 404);

    const results = { enrolled: 0, skipped: 0, errors: [] as string[] };

    for (const employeeId of employeeIds) {
      try {
        const existing = await TrainingEnrollment.findOne({ training: trainingId, employee: employeeId as any });
        if (existing) { results.skipped++; continue; }

        if (program.maxParticipants > 0) {
          const count = await TrainingEnrollment.countDocuments({ training: trainingId, status: { $ne: 'dropped' } });
          if (count >= program.maxParticipants) { results.errors.push(`Training full for ${employeeId}`); continue; }
        }

        await TrainingEnrollment.create({ training: trainingId, employee: employeeId });
        results.enrolled++;
      } catch (err: any) {
        results.errors.push(`Failed for ${employeeId}: ${err.message}`);
      }
    }

    return results;
  }

  static async dropEnrollment(enrollmentId: string, reason: string, userId: string) {
    const enrollment = await TrainingEnrollment.findById(enrollmentId).populate('training', 'title');
    if (!enrollment) throw new AppError('Enrollment not found', 404);

    enrollment.status = 'dropped';
    await enrollment.save();

    await AuditService.log({
      action: 'update', module: 'training', userId,
      targetId: enrollmentId,
      details: { action: 'dropped', reason },
    });

    return { ...enrollment.toObject(), id: enrollment._id.toString(), _id: undefined };
  }

  static async markCompleted(enrollmentId: string, data: Record<string, unknown>, userId: string) {
    const enrollment = await TrainingEnrollment.findById(enrollmentId).populate('training', 'title certificationOffered certificationValidForDays');
    if (!enrollment) throw new AppError('Enrollment not found', 404);

    enrollment.status = 'completed';
    if (data.score !== undefined) enrollment.score = data.score as number;
    if (data.feedback !== undefined) enrollment.feedback = data.feedback as string;
    if (data.rating !== undefined) enrollment.rating = data.rating as number;
    enrollment.completionDate = new Date();

    const program = enrollment.training as any;
    if (program?.certificationOffered) {
      enrollment.status = 'certified';
      if (data.certificationNumber) enrollment.certificationNumber = data.certificationNumber as string;
      if (data.certificationExpiry) enrollment.certificationExpiry = new Date(data.certificationExpiry as string);
      if (data.certificateFile) enrollment.certificateFile = data.certificateFile as any;
      if (!enrollment.certificationExpiry && program.certificationValidForDays > 0) {
        const expiry = new Date();
        expiry.setDate(expiry.getDate() + program.certificationValidForDays);
        enrollment.certificationExpiry = expiry;
      }
    }

    await enrollment.save();

    await AuditService.log({
      action: 'update', module: 'training', userId,
      targetId: enrollmentId,
      details: { action: 'completed', score: data.score },
    });

    return { ...enrollment.toObject(), id: enrollment._id.toString(), _id: undefined };
  }

  static async getMyEnrollments(employeeId: string) {
    return TrainingEnrollment.find({ employee: employeeId as any })
      .populate('training', 'title category startDate endDate status')
      .sort({ enrolledAt: -1 })
      .lean();
  }

  static async getPendingEnrollments(employeeId: string) {
    return TrainingEnrollment.find({
      employee: employeeId as any,
      status: { $in: ['enrolled', 'in-progress'] },
    })
      .populate('training', 'title category startDate endDate status')
      .sort({ enrolledAt: -1 })
      .lean();
  }

  static async recordAttendance(trainingId: string, date: string, employeeIds: string[]) {
    const results = { updated: 0, errors: [] as string[] };

    for (const employeeId of employeeIds) {
      try {
        const enrollment = await TrainingEnrollment.findOne({ training: trainingId, employee: employeeId as any });
        if (!enrollment) { results.errors.push(`No enrollment for ${employeeId}`); continue; }

        const existingAttendance = enrollment.attendance.find(
          (a) => a.date.toISOString().split('T')[0] === new Date(date).toISOString().split('T')[0],
        );

        if (existingAttendance) {
          existingAttendance.present = true;
        } else {
          enrollment.attendance.push({ date: new Date(date), present: true });
        }

        if (enrollment.status === 'enrolled') enrollment.status = 'in-progress';
        await enrollment.save();
        results.updated++;
      } catch (err: any) {
        results.errors.push(`Failed for ${employeeId}: ${err.message}`);
      }
    }

    return results;
  }

  static async getSkills(employeeId?: string) {
    const filter: Record<string, unknown> = {};
    if (employeeId) filter.employee = employeeId;

    return EmployeeSkill.find(filter)
      .populate('skill', 'name category')
      .populate('employee', 'fullName employeeCode')
      .lean();
  }

  static async updateSkill(employeeId: string, skillId: string, data: Record<string, unknown>, userId: string) {
    const existing = await EmployeeSkill.findOne({ employee: employeeId as any, skill: skillId as any });
    if (existing) {
      Object.assign(existing, data);
      await existing.save();
      return existing;
    }

    const employeeSkill = await EmployeeSkill.create({
      employee: employeeId,
      skill: skillId,
      ...data,
    });

    await AuditService.log({
      action: 'create', module: 'training', userId,
      targetId: employeeSkill._id.toString(),
      details: { employeeId, skillId },
    });

    return employeeSkill;
  }

  static async getSkillGapAnalysis(designationId: string): Promise<any> {
    const designation = await Designation.findById(designationId).lean();
    if (!designation) throw new AppError('Designation not found', 404);

    const employees = await Employee.find({ designation: designationId as any, status: 'active' }).select('_id fullName').lean();
    const allSkills = await Skill.find({ isActive: true }).lean();

    const gaps: Array<{ employee: any; missingSkills: typeof allSkills }> = [];

    for (const employee of employees) {
      const employeeSkills = await EmployeeSkill.find({ employee: employee._id }).populate('skill', 'name category').lean();
      const employeeSkillNames = new Set(employeeSkills.map((es: any) => es.skill?.name).filter(Boolean));

      const missingSkills = allSkills.filter((s) => !employeeSkillNames.has(s.name));
      if (missingSkills.length > 0) {
        gaps.push({ employee, missingSkills });
      }
    }

    return {
      designation: { ...designation, id: designation._id.toString(), _id: undefined },
      totalEmployees: employees.length,
      employeesWithGaps: gaps.length,
      gaps: gaps.slice(0, 50),
    };
  }

  static async getStats() {
    const [totalPrograms, byStatus, activeEnrollments, completionRate] = await Promise.all([
      TrainingProgram.countDocuments(),
      TrainingProgram.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
      TrainingEnrollment.countDocuments({ status: { $in: ['enrolled', 'in-progress'] } }),
      TrainingEnrollment.aggregate([
        { $group: { _id: null, total: { $sum: 1 }, completed: { $sum: { $cond: [{ $in: ['$status', ['completed', 'certified']] }, 1, 0] } } } },
      ]),
    ]);

    const statusMap: Record<string, number> = { planned: 0, 'in-progress': 0, completed: 0, cancelled: 0 };
    byStatus.forEach((s: { _id: string; count: number }) => { statusMap[s._id] = s.count; });

    const rate = completionRate[0] || { total: 0, completed: 0 };
    const completionPercent = rate.total > 0 ? Math.round((rate.completed / rate.total) * 100) : 0;

    return {
      totalPrograms,
      byStatus: statusMap,
      activeEnrollments,
      completionPercent,
    };
  }

  static async getExpiringCertifications(days: number = 30) {
    const threshold = new Date();
    threshold.setDate(threshold.getDate() + days);

    return TrainingEnrollment.find({
      status: 'certified',
      certificationExpiry: { $lte: threshold, $gte: new Date() },
    })
      .populate('training', 'title')
      .populate('employee', 'fullName employeeCode email')
      .lean();
  }

  static async listSkills(queryParams: Record<string, unknown>) {
    const { page, limit, sort, order, search } = PaginationUtil.parseFromObject(queryParams);

    const filter: Record<string, unknown> = {};
    if (queryParams.category) filter.category = queryParams.category;
    if (search) {
      const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      filter.name = { $regex: escaped, $options: 'i' };
    }

    const skip = PaginationUtil.getSkip(page, limit);
    const sortObj: Record<string, 1 | -1> = { [sort]: order === 'asc' ? 1 : -1 };

    const [skills, total] = await Promise.all([
      Skill.find(filter).sort(sortObj).skip(skip).limit(limit).lean(),
      Skill.countDocuments(filter),
    ]);

    const data = skills.map((s: any) => ({ ...s, id: String(s._id), _id: undefined }));
    const meta = PaginationUtil.getMeta(page, limit, total);
    return { data, meta };
  }

  static async createSkill(data: { name: string; category: string; description?: string }, userId: string) {
    const existing = await Skill.findOne({ name: { $regex: new RegExp(`^${data.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') } });
    if (existing) throw new AppError('Skill with this name already exists', 400);

    const skill = await Skill.create(data);

    await AuditService.log({
      action: 'create', module: 'training', userId,
      targetId: skill._id.toString(), targetName: skill.name,
    });

    return { ...skill.toObject(), id: skill._id.toString(), _id: undefined };
  }
}

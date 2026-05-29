import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import mongoose from 'mongoose';
import TrainingProgram from '../../../models/TrainingProgram.model.js';
import TrainingEnrollment from '../../../models/TrainingEnrollment.model.js';
import Skill from '../../../models/Skill.model.js';
import EmployeeSkill from '../../../models/EmployeeSkill.model.js';
import Employee from '../../../models/Employee.model.js';
import Designation from '../../../models/Designation.model.js';
import User from '../../../models/User.model.js';
import { TrainingService } from '../training.service.js';
import { AppError } from '../../../core/errors/AppError.js';

let userId: string;
let employeeId: string;
let programId: string;
let enrollmentId: string;
let skillId: string;

beforeAll(async () => {
  const user = await User.create({ name: 'Admin', email: 'train@test.com', password: 'TestPass1!', role: 'super-admin' });
  userId = user._id.toString();
});

beforeEach(async () => {
  await Promise.all([
    TrainingProgram.deleteMany({}),
    TrainingEnrollment.deleteMany({}),
    Skill.deleteMany({}),
    EmployeeSkill.deleteMany({}),
    Employee.deleteMany({}),
  ]);

  const employee = await Employee.create({
    employeeCode: 'EMP001',
    fullName: 'Test Employee',
    fatherName: 'Father',
    category: 'office-staff',
    employmentType: 'permanent',
    department: new mongoose.Types.ObjectId(),
    designation: new mongoose.Types.ObjectId(),
    shift: new mongoose.Types.ObjectId(),
    joiningDate: new Date('2023-01-01'),
    salaryType: 'monthly',
    baseSalary: 50000,
    status: 'active',
  });
  employeeId = employee._id.toString();
});

describe('TrainingService', () => {
  describe('createProgram', () => {
    it('creates a training program', async () => {
      const result = await TrainingService.createProgram({
        title: 'Safety Training',
        description: 'Basic safety training',
        category: 'Safety',
        mode: 'Classroom',
        duration: { value: 2, unit: 'days' },
        startDate: new Date('2026-06-01').toISOString(),
        endDate: new Date('2026-06-02').toISOString(),
        maxParticipants: 20,
        trainer: 'John Trainer',
      }, userId) as any;

      expect(result.title).toBe('Safety Training');
      expect(result.status).toBe('planned');
      programId = result.id;
    });
  });

  describe('CRUD operations', () => {
    beforeEach(async () => {
      const program = await TrainingProgram.create({
        title: 'Safety Training', category: 'Safety', mode: 'Classroom',
        duration: { value: 1, unit: 'days' },
        startDate: new Date('2026-06-01'), endDate: new Date('2026-06-01'),
        maxParticipants: 10, status: 'planned', createdBy: userId,
      });
      programId = program._id.toString();
    });

    it('lists programs', async () => {
      const result = await TrainingService.getPrograms({});
      expect(result.data.length).toBeGreaterThan(0);
    });

    it('gets program by id', async () => {
      const result = await TrainingService.getProgramById(programId) as any;
      expect(result.title).toBe('Safety Training');
    });

    it('updates a program', async () => {
      const result = await TrainingService.updateProgram(programId, { title: 'Advanced Safety' }, userId) as any;
      expect(result.title).toBe('Advanced Safety');
    });

    it('cancels a program', async () => {
      const result = await TrainingService.cancelProgram(programId, userId) as any;
      expect(result.status).toBe('cancelled');
    });
  });

  describe('enrollments', () => {
    beforeEach(async () => {
      const program = await TrainingProgram.create({
        title: 'Safety Training', category: 'Safety', mode: 'Classroom',
        duration: { value: 1, unit: 'days' },
        startDate: new Date('2026-06-01'), endDate: new Date('2026-06-01'),
        maxParticipants: 10, status: 'planned', createdBy: userId,
      });
      programId = program._id.toString();
    });

    it('enrolls an employee', async () => {
      const result = await TrainingService.enrollEmployee(programId, employeeId, userId) as any;
      expect(result.status).toBe('enrolled');
      enrollmentId = result.id;
    });

    it('prevents duplicate enrollment', async () => {
      await TrainingService.enrollEmployee(programId, employeeId, userId);
      await expect(TrainingService.enrollEmployee(programId, employeeId, userId)).rejects.toThrow(AppError);
    });

    it('prevents enrollment in full program', async () => {
      const otherEmps: string[] = [];
      for (let i = 0; i < 10; i++) {
        const emp = await Employee.create({
          employeeCode: `EMP0${i + 10}`, fullName: `Employee ${i}`, fatherName: 'F',
          category: 'office-staff', employmentType: 'permanent',
          department: new mongoose.Types.ObjectId(), designation: new mongoose.Types.ObjectId(),
          shift: new mongoose.Types.ObjectId(), joiningDate: new Date(), salaryType: 'monthly',
          baseSalary: 30000, status: 'active',
        });
        otherEmps.push(emp._id.toString());
      }

      for (const eid of otherEmps) {
        await TrainingEnrollment.create({ training: programId, employee: eid as any });
      }

      await expect(TrainingService.enrollEmployee(programId, employeeId, userId)).rejects.toThrow(AppError);
    });

    it('completes enrollment with certification', async () => {
      const enrollment = await TrainingEnrollment.create({ training: programId, employee: employeeId as any });
      enrollmentId = enrollment._id.toString();

      (await TrainingProgram.findByIdAndUpdate(programId, { certificationOffered: true, certificationValidForDays: 365 }))!;

      const result = await TrainingService.markCompleted(enrollmentId, {
        score: 85, feedback: 'Good', rating: 4, certificationNumber: 'CERT-001',
      }, userId) as any;

      expect(result.status).toBe('certified');
      expect(result.score).toBe(85);
    });
  });

  describe('skills', () => {
    beforeEach(async () => {
      const skill = await Skill.create({ name: 'JavaScript', category: 'Technical', description: 'Programming language' });
      skillId = skill._id.toString();
    });

    it('creates a skill', async () => {
      const result = await TrainingService.createSkill({ name: 'TypeScript', category: 'Technical' }, userId) as any;
      expect(result.name).toBe('TypeScript');
    });

    it('prevents duplicate skill names', async () => {
      await expect(TrainingService.createSkill({ name: 'JavaScript', category: 'Technical' }, userId)).rejects.toThrow(AppError);
    });

    it('updates employee skill', async () => {
      const result = await TrainingService.updateSkill(employeeId, skillId, {
        proficiencyLevel: 'advanced', yearsOfExperience: 5,
      }, userId) as any;

      expect(result.proficiencyLevel).toBe('advanced');
    });

    it('gets skill gap analysis', async () => {
      await EmployeeSkill.create({
        employee: employeeId as any, skill: skillId as any,
        proficiencyLevel: 'advanced', source: 'self-reported',
      });

      const designation = await Designation.create({
        name: 'Developer', department: new mongoose.Types.ObjectId(), isActive: true,
      });

      await Employee.findByIdAndUpdate(employeeId, { designation: designation._id });

      await Skill.create({ name: 'Python', category: 'Technical' });
      await Skill.create({ name: 'React', category: 'Technical' });

      const result = await TrainingService.getSkillGapAnalysis(designation._id.toString()) as any;
      expect(result.employeesWithGaps).toBeGreaterThanOrEqual(0);
    });
  });
});

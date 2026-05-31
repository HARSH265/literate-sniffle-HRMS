import Employee from '../models/Employee.model.js';
import Holiday from '../models/Holiday.model.js';
import KioskDevice from '../models/KioskDevice.model.js';
import LoanType from '../models/LoanType.model.js';
import Notification from '../models/Notification.model.js';
import User from '../models/User.model.js';
import Skill from '../models/Skill.model.js';

/**
 * Ensure all high‑impact indexes exist. This runs after the MongoDB connection
 * is established. Mongoose will create the indexes defined in the schemas, but
 * a few compound indexes required by the audit are added here explicitly.
 */
export async function createMissingIndexes(): Promise<void> {
  // Compound index for employee status + department (used by many list filters)
  await Employee.collection.createIndex({ status: 1, department: 1 });

  // Holiday: query often filters by date and applicableTo together
  await Holiday.collection.createIndex({ date: 1, applicableTo: 1 });

  // KioskDevice: active‑device look‑ups
  await KioskDevice.collection.createIndex({ isActive: 1 });

  // LoanType: active flag
  await LoanType.collection.createIndex({ isActive: 1 });

  // Notification: fast look‑up of unread notifications per user
  await Notification.collection.createIndex({ recipient: 1, isRead: 1 });

  // User: role‑based permission checks
  await User.collection.createIndex({ role: 1 });

  // Skill: active flag for filtering
  await Skill.collection.createIndex({ isActive: 1 });

  // The OvertimeRule and Shift compound indexes are already part of the schema.
}

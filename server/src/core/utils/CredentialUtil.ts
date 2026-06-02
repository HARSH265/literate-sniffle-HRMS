import crypto from 'crypto';

/**
 * Generate a random password that meets complexity requirements:
 * - At least 8 characters
 * - At least 1 uppercase letter
 * - At least 1 lowercase letter
 * - At least 1 number
 * - At least 1 special character
 */
export function generatePassword(length: number = 12): string {
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const numbers = '0123456789';
  const special = '!@#$%^&*';
  const all = uppercase + lowercase + numbers + special;

  // Ensure at least one from each category
  let password = '';
  password += uppercase[crypto.randomInt(uppercase.length)];
  password += lowercase[crypto.randomInt(lowercase.length)];
  password += numbers[crypto.randomInt(numbers.length)];
  password += special[crypto.randomInt(special.length)];

  // Fill the rest randomly
  for (let i = password.length; i < length; i++) {
    password += all[crypto.randomInt(all.length)];
  }

  // Shuffle the password
  return password
    .split('')
    .sort(() => crypto.randomInt(3) - 1)
    .join('');
}

/**
 * Generate a user ID from employee code and email.
 * Format: employeeCode (e.g., EMP001)
 * If no employee code, use email prefix.
 */
export function generateUserId(employeeCode?: string, email?: string): string {
  if (employeeCode) {
    return employeeCode.toLowerCase();
  }
  if (email) {
    return email.split('@')[0].toLowerCase();
  }
  throw new Error('Either employeeCode or email is required to generate user ID');
}

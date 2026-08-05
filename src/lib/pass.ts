export interface UserPass {
  id: string;
  remainingClasses: number | null;
  expiresAt?: string | null;
  isActive: boolean;
  passOption?: { name: string } | null;
}

export type UserPassStatus = 'active' | 'completed' | 'expired' | 'inactive';

export function getUserPassStatus(pass: UserPass, now = new Date()): UserPassStatus {
  if (pass.remainingClasses === 0) return 'completed';
  if (pass.expiresAt) {
    const expiry = new Date(pass.expiresAt);
    if (!Number.isNaN(expiry.getTime()) && expiry.getTime() < now.getTime()) return 'expired';
  }
  return pass.isActive ? 'active' : 'inactive';
}

export function formatUserPassStatus(status: UserPassStatus): string {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

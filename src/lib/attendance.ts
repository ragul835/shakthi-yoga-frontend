export interface AttendanceRecord {
  enrollmentId: string;
  studentName: string;
  studentEmail: string;
  attended: boolean | null;
}

interface ApiAttendanceRecord {
  enrollmentId?: string;
  attended?: boolean;
  enrollment?: { user?: { name?: string; email?: string } };
  studentName?: string;
  studentEmail?: string;
}

interface ApiEnrollment {
  id?: string;
  user?: { name?: string; email?: string };
}

export interface MakeupCredit {
  id: string;
  sessionDate: string;
  makeupUsed?: boolean;
  attended?: boolean;
  userPassId?: string | null;
  enrollment?: {
    userPassId?: string | null;
    makeupCreditId?: string | null;
  };
  [key: string]: unknown;
}

export type MakeupCreditStatus = 'available' | 'used' | 'expired' | 'not-applicable';

export function getLocalDateInputValue(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function formatAttendanceDate(value: string | Date): string {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return 'Unknown date';

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

export function getMakeupCreditExpiry(sessionDate: string | Date): Date | null {
  const expiry = sessionDate instanceof Date ? new Date(sessionDate) : new Date(sessionDate);
  if (Number.isNaN(expiry.getTime())) return null;
  // Attendance dates are stored and displayed using UTC calendar fields. A
  // makeup credit remains valid through the final day of that same month.
  expiry.setUTCMonth(expiry.getUTCMonth() + 1, 0);
  expiry.setUTCHours(23, 59, 59, 999);
  return expiry;
}

export function isMakeupCreditAvailable(credit: MakeupCredit, now = new Date()): boolean {
  const expiry = getMakeupCreditExpiry(credit.sessionDate);
  return Boolean(
    expiry
    && expiry.getTime() >= now.getTime()
    && !credit.makeupUsed
    && credit.attended !== true,
  );
}

export function getAvailableMakeupCredits(
  response: unknown,
  now = new Date(),
): MakeupCredit[] {
  const payload = response && typeof response === 'object' && 'data' in response
    ? (response as { data?: unknown }).data
    : response;

  return Array.isArray(payload)
    ? payload.filter((credit): credit is MakeupCredit => (
        Boolean(credit)
        && typeof credit === 'object'
        && typeof credit.id === 'string'
        && isMakeupCreditAvailable(credit as MakeupCredit, now)
      ))
    : [];
}

export function getMakeupCreditStatus(
  credit: Pick<MakeupCredit, 'sessionDate' | 'makeupUsed' | 'attended' | 'userPassId' | 'enrollment'>,
  now = new Date(),
): MakeupCreditStatus {
  if (credit.attended === true) return 'not-applicable';
  if (credit.makeupUsed) return 'used';
  const expiry = getMakeupCreditExpiry(credit.sessionDate);
  if (!expiry || expiry.getTime() < now.getTime()) return 'expired';
  return 'available';
}

export function mergeAttendanceRecords(
  savedRecords: ApiAttendanceRecord[],
  enrollments: ApiEnrollment[],
): AttendanceRecord[] {
  const savedByEnrollment = new Map(
    savedRecords
      .map((record) => [record.enrollmentId, record] as const)
      .filter((entry): entry is [string, ApiAttendanceRecord] => Boolean(entry[0])),
  );

  const merged = enrollments.flatMap((enrollment) => {
    if (!enrollment.id) return [];
    const saved = savedByEnrollment.get(enrollment.id);
    savedByEnrollment.delete(enrollment.id);
    return [{
      enrollmentId: enrollment.id,
      studentName: enrollment.user?.name ?? saved?.studentName ?? 'Unknown',
      studentEmail: enrollment.user?.email ?? saved?.studentEmail ?? '',
      attended: saved?.attended ?? null,
    }];
  });

  // Preserve valid saved records even if the enrollment list is temporarily
  // incomplete (for example because of pagination or a concurrent update).
  for (const [enrollmentId, saved] of savedByEnrollment) {
    merged.push({
      enrollmentId,
      studentName: saved.enrollment?.user?.name ?? saved.studentName ?? 'Unknown',
      studentEmail: saved.enrollment?.user?.email ?? saved.studentEmail ?? '',
      attended: saved.attended ?? null,
    });
  }

  return merged;
}

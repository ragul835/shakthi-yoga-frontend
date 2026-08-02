interface BookableClass {
  type?: string;
  status?: string;
  currentEnrollment?: number;
  maxCapacity?: number;
}

export function isClassFull(yogaClass: BookableClass): boolean {
  if (yogaClass.status === 'FULL') return true;
  if (yogaClass.type !== 'GROUP') return false;
  if (typeof yogaClass.maxCapacity !== 'number' || yogaClass.maxCapacity <= 0) return true;
  return (yogaClass.currentEnrollment ?? 0) >= yogaClass.maxCapacity;
}

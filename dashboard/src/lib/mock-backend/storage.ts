const NAMESPACE = 'devon.dashboard.';

export const Tables = {
  units: 'units',
  employees: 'employees',
  assignments: 'assignments',
  certificates: 'certificates',
  users: 'users',
  audit: 'audit',
  profileRequests: 'profile-requests',
  positions: 'positions',
  notifications: 'notifications',
} as const;

export function readTable<T>(key: string, fallback: T[]): T[] {
  try {
    const raw = localStorage.getItem(NAMESPACE + key);
    return raw ? (JSON.parse(raw) as T[]) : fallback;
  } catch {
    return fallback;
  }
}

export function writeTable<T>(key: string, rows: T[]): void {
  localStorage.setItem(NAMESPACE + key, JSON.stringify(rows));
}

export function clearAll(): void {
  Object.keys(localStorage)
    .filter((k) => k.startsWith(NAMESPACE))
    .forEach((k) => localStorage.removeItem(k));
}

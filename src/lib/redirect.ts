const ADMIN_PATH = /^\/admin(?:\/|$)/;

export function getSafePostLoginPath(value: string | null, isAdmin: boolean): string | null {
  if (!value || !value.startsWith('/') || value.startsWith('//') || value.includes('\\')) return null;

  let decoded: string;
  try {
    decoded = decodeURIComponent(value);
  } catch {
    return null;
  }

  if (!decoded.startsWith('/') || decoded.startsWith('//') || decoded.includes('\\')) return null;
  if (/^[a-z][a-z\d+.-]*:/i.test(decoded.slice(1))) return null;
  if (!isAdmin && ADMIN_PATH.test(decoded)) return null;
  return decoded;
}

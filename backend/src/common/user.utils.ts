export function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

export function normalizeLogin(value: string): string {
  return value.trim().toLowerCase();
}

export function normalizePhone(value: string): string {
  const digits = value.replace(/\D/g, '');

  if (digits.length === 11 && digits.startsWith('8')) {
    return `7${digits.slice(1)}`;
  }

  return digits;
}

export function buildUserLookupConditions(identifier: string) {
  const trimmed = identifier.trim();
  const email = normalizeEmail(trimmed);
  const login = normalizeLogin(trimmed);
  const phone = normalizePhone(trimmed);

  const conditions: Array<{ email: string } | { login: string } | { phone: string }> = [
    { email },
    { login },
  ];

  if (phone.length >= 10) {
    conditions.push({ phone });
  }

  return conditions;
}

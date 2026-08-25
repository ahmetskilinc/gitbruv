export const USERNAME_MIN_LENGTH = 3;
export const USERNAME_MAX_LENGTH = 39;
export const USERNAME_PATTERN = /^[a-zA-Z0-9_-]+$/;
export const PASSWORD_MIN_LENGTH = 8;

export type ValidationResult = {
  valid: boolean;
  error?: string;
};

export function validateUsername(username: string): ValidationResult {
  if (username.length < USERNAME_MIN_LENGTH) {
    return { valid: false, error: `Username must be at least ${USERNAME_MIN_LENGTH} characters` };
  }

  if (username.length > USERNAME_MAX_LENGTH) {
    return { valid: false, error: `Username must be at most ${USERNAME_MAX_LENGTH} characters` };
  }

  if (!USERNAME_PATTERN.test(username)) {
    return { valid: false, error: "Username can only contain letters, numbers, hyphens, and underscores" };
  }

  return { valid: true };
}

export function validatePassword(password: string): ValidationResult {
  if (password.length < PASSWORD_MIN_LENGTH) {
    return { valid: false, error: `Password must be at least ${PASSWORD_MIN_LENGTH} characters` };
  }

  return { valid: true };
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/**
 * Parse a pagination `limit` query value, coercing invalid/NaN input to the
 * default and clamping to a safe range so an unbounded value can't drive a huge
 * query or history walk.
 */
export function parseLimit(value: string | undefined, fallback = 30, max = 100): number {
  const parsed = parseInt(value ?? "", 10);
  const n = Number.isFinite(parsed) ? parsed : fallback;
  return Math.min(Math.max(n, 1), max);
}

/** Parse a pagination `offset`/`skip` value, coercing invalid input to 0. */
export function parseOffset(value: string | undefined): number {
  const parsed = parseInt(value ?? "", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
}

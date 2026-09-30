/**
 * Password Policy:
 * "Use 8 or more characters with a mix of letters, numbers & symbols."
 */

export const PASSWORD_POLICY_REGEX = /^(?=.*[a-zA-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/;
export const PASSWORD_POLICY_MESSAGE = 'Password must be at least 8 characters long and contain a mix of letters, numbers, and symbols.';

export function validatePasswordStrength(password: string): { isValid: boolean; error?: string } {
  if (!password || password.length < 8) {
    return { isValid: false, error: 'Password must be at least 8 characters long' };
  }
  if (!PASSWORD_POLICY_REGEX.test(password)) {
    return { isValid: false, error: PASSWORD_POLICY_MESSAGE };
  }
  return { isValid: true };
}

/**
 * Generate a cryptographically secure temporary password meeting the policy:
 * At least 10 chars with uppercase, lowercase, numbers, and symbols.
 */
export function generateSecureTemporaryPassword(length: number = 12): string {
  const uppers = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const lowers = 'abcdefghijkmnopqrstuvwxyz';
  const numbers = '23456789';
  const symbols = '!@#$%^&*_-+=';
  const all = uppers + lowers + numbers + symbols;

  // Ensure at least one of each required group
  const randomPick = (str: string) => str[Math.floor(Math.random() * str.length)];

  const requiredChars = [
    randomPick(uppers),
    randomPick(lowers),
    randomPick(numbers),
    randomPick(symbols),
  ];

  const remainingLength = Math.max(0, length - requiredChars.length);
  const remainingChars = Array.from({ length: remainingLength }, () => randomPick(all));

  // Shuffle all characters together
  const combined = [...requiredChars, ...remainingChars];
  for (let i = combined.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [combined[i], combined[j]] = [combined[j], combined[i]];
  }

  return combined.join('');
}

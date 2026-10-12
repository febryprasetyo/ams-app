export function getSeedCredentials(source: NodeJS.ProcessEnv = process.env) {
  if (source.NODE_ENV !== 'production') {
    return { password: 'Admin123!', mustChangePassword: false };
  }
  const password = source.INITIAL_ADMIN_PASSWORD;
  if (!password || password.length < 20 || !/[a-z]/.test(password) ||
      !/[A-Z]/.test(password) || !/[0-9]/.test(password)) {
    throw new Error('Production seed requires INITIAL_ADMIN_PASSWORD (min 20 chars with uppercase, lowercase and digits)');
  }
  return { password, mustChangePassword: true };
}

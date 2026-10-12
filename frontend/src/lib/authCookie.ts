// Cookies are shared across ports on the same host; keep production separate.
export const AUTH_COOKIE_NAME = process.env.NODE_ENV === 'production' ? 'ams_prod_token' : 'token';

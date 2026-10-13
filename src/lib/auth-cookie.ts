/**
 * Client-side helper for authentication tokens.
 * Supports both cookies and localStorage fallback for maximum compatibility.
 */

const TOKEN_KEY = 'auth_token';

export function getAuthToken(): string | null {
  if (typeof window === 'undefined') {
    return null;
  }
  // 1. Try reading from document.cookie (auth_token or token)
  try {
    const match = document.cookie.match(/(?:^|;\s*)(?:auth_token|token|access_token)=([^;]*)/);
    if (match && match[1]) {
      const val = decodeURIComponent(match[1]);
      if (val && val !== 'undefined' && val !== 'null') {
        return val;
      }
    }
  } catch {}

  // 2. Fallback to localStorage
  try {
    const local = localStorage.getItem('token') || localStorage.getItem('auth_token') || localStorage.getItem('accessToken');
    if (local && local !== 'undefined' && local !== 'null') {
      return local;
    }
  } catch {}

  return null;
}

export function setAuthToken(token: string, days = 7): void {
  if (typeof window === 'undefined') {
    return;
  }
  const date = new Date();
  date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
  const expires = '; expires=' + date.toUTCString();
  const secure = window.location.protocol === 'https:' ? '; Secure' : '';
  const encoded = encodeURIComponent(token);

  // Set cookies for both auth_token and token
  document.cookie = `${TOKEN_KEY}=${encoded}${expires}; path=/; SameSite=Lax${secure}`;
  document.cookie = `token=${encoded}${expires}; path=/; SameSite=Lax${secure}`;

  try {
    localStorage.setItem('token', token);
    localStorage.setItem('auth_token', token);
  } catch {}

  // Dispatch auth-change event
  try {
    window.dispatchEvent(new Event('auth-change'));
  } catch {}
}

export function removeAuthToken(): void {
  if (typeof window === 'undefined') {
    return;
  }
  document.cookie = `${TOKEN_KEY}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=Lax;`;
  document.cookie = `token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=Lax;`;

  try {
    localStorage.removeItem('token');
    localStorage.removeItem('auth_token');
    localStorage.removeItem('accessToken');
    localStorage.removeItem('role');
  } catch {}

  // Dispatch auth-change event
  try {
    window.dispatchEvent(new Event('auth-change'));
  } catch {}
}


import { jwtDecode } from 'jwt-decode';

interface TokenPayload {
  sub: string;
  role: 'user' | 'dealer' | 'admin';
  phone: string;
  name: string;
  exp: number;
  iat: number;
}

export function decodeToken(token: string): TokenPayload | null {
  try {
    return jwtDecode<TokenPayload>(token);
  } catch {
    return null;
  }
}

export function isTokenExpired(token: string): boolean {
  const payload = decodeToken(token);
  if (!payload) return true;
  return payload.exp * 1000 < Date.now() + 30_000;
}

export function storeAccessToken(token: string): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('accessToken', token);
  }
}

export function storeRefreshToken(token: string): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('refreshToken', token);
  }
}

export function clearTokens(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  }
}

// Keep for backwards compat within session
export function clearAccessToken(): void {
  clearTokens();
}

export function getAccessToken(): string | null {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('accessToken');
  }
  return null;
}

export function getRefreshToken(): string | null {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('refreshToken');
  }
  return null;
}

import { jwtDecode } from 'jwt-decode';

interface TokenPayload {
  sub: string;
  role: 'user' | 'dealer' | 'admin';
  phone: string;
  exp: number;
  iat: number;
}

/**
 * Decodes a JWT access token payload.
 * Per AUTH-001: access token is stored in memory, never localStorage.
 */
export function decodeToken(token: string): TokenPayload | null {
  try {
    return jwtDecode<TokenPayload>(token);
  } catch {
    return null;
  }
}

/**
 * Checks if a JWT token is expired (with 30s buffer).
 */
export function isTokenExpired(token: string): boolean {
  const payload = decodeToken(token);
  if (!payload) return true;
  return payload.exp * 1000 < Date.now() + 30_000;
}

/**
 * Stores access token in memory (window.__accessToken).
 * Per AUTH-001: never in localStorage or sessionStorage.
 */
export function storeAccessToken(token: string): void {
  if (typeof window !== 'undefined') {
    window.__accessToken = token;
  }
}

/**
 * Clears access token from memory.
 */
export function clearAccessToken(): void {
  if (typeof window !== 'undefined') {
    window.__accessToken = undefined;
  }
}

/**
 * Gets access token from memory.
 */
export function getAccessToken(): string | undefined {
  if (typeof window !== 'undefined') {
    return window.__accessToken;
  }
  return undefined;
}

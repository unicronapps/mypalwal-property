'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import api from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();

  const [identifier, setIdentifier] = useState(''); // phone or email
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const isPhone = /^\d{10}$/.test(identifier.trim());
      const payload = isPhone
        ? { phone: identifier.trim(), password }
        : { email: identifier.trim().toLowerCase(), password };

      const { data } = await api.post('/api/auth/login', payload);
      login(data.data.accessToken, data.data.refreshToken, data.data.user);

      const redirect = searchParams.get('redirect') || '/';
      router.push(redirect);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Phone or Email
        </label>
        <input
          type="text"
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value)}
          placeholder="9876543210 or you@email.com"
          className="input-field"
          required
          autoComplete="username"
        />
      </div>

      <div>
        <div className="flex justify-between items-center mb-1">
          <label className="block text-sm font-medium text-gray-700">Password</label>
          <Link href="/auth/forgot-password" className="text-xs text-primary-600 hover:underline">
            Forgot password?
          </Link>
        </div>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          className="input-field"
          required
          autoComplete="current-password"
        />
      </div>

      {error && <p className="error-text text-sm">{error}</p>}

      <button
        type="submit"
        disabled={isLoading}
        className="btn-primary w-full py-2.5"
      >
        {isLoading ? 'Signing in…' : 'Sign In'}
      </button>

      <p className="text-center text-sm text-gray-600">
        Don&apos;t have an account?{' '}
        <Link href="/auth/register" className="text-primary-600 font-medium hover:underline">
          Register
        </Link>
      </p>
    </form>
  );
}

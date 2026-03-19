'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';

type Role = 'user' | 'dealer';

export default function RegisterForm() {
  const router = useRouter();

  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'user' as Role,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  function validate() {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = 'Name is required';
    if (!/^[6-9]\d{9}$/.test(form.phone)) e.phone = 'Enter a valid 10-digit Indian mobile number';
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Invalid email';
    if (form.password.length < 8) e.password = 'Password must be at least 8 characters';
    if (form.password !== form.confirmPassword) e.confirmPassword = 'Passwords do not match';
    return e;
  }

  function handleChange(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
    setErrors((e) => ({ ...e, [field]: '' }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setApiError('');
    const fieldErrors = validate();
    if (Object.keys(fieldErrors).length > 0) {
      setErrors(fieldErrors);
      return;
    }

    setIsLoading(true);
    try {
      await api.post('/api/auth/register', {
        name: form.name.trim(),
        phone: form.phone,
        email: form.email || undefined,
        password: form.password,
        role: form.role,
      });

      // Redirect to OTP verification
      router.push(`/auth/verify-otp?phone=${encodeURIComponent(form.phone)}&purpose=register`);
    } catch (err: any) {
      setApiError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Role selection */}
      <div className="grid grid-cols-2 gap-2">
        {(['user', 'dealer'] as Role[]).map((r) => (
          <button
            key={r}
            type="button"
            onClick={() => handleChange('role', r)}
            className={`py-2 rounded-lg text-sm font-medium border transition-colors ${
              form.role === r
                ? 'bg-primary-600 text-white border-primary-600'
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
            }`}
          >
            {r === 'user' ? 'Individual / Buyer' : 'Dealer / Agent'}
          </button>
        ))}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
        <input
          type="text"
          value={form.name}
          onChange={(e) => handleChange('name', e.target.value)}
          placeholder="Rahul Sharma"
          className="input-field"
        />
        {errors.name && <p className="error-text">{errors.name}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
        <div className="flex">
          <span className="inline-flex items-center px-3 border border-r-0 border-gray-300 rounded-l-lg bg-gray-50 text-gray-500 text-sm">
            +91
          </span>
          <input
            type="tel"
            value={form.phone}
            onChange={(e) => handleChange('phone', e.target.value.replace(/\D/g, '').slice(0, 10))}
            placeholder="9876543210"
            className="input-field rounded-l-none"
            maxLength={10}
          />
        </div>
        {errors.phone && <p className="error-text">{errors.phone}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Email <span className="text-gray-400">(optional)</span>
        </label>
        <input
          type="email"
          value={form.email}
          onChange={(e) => handleChange('email', e.target.value)}
          placeholder="you@example.com"
          className="input-field"
        />
        {errors.email && <p className="error-text">{errors.email}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
        <input
          type="password"
          value={form.password}
          onChange={(e) => handleChange('password', e.target.value)}
          placeholder="Min 8 characters"
          className="input-field"
        />
        {errors.password && <p className="error-text">{errors.password}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
        <input
          type="password"
          value={form.confirmPassword}
          onChange={(e) => handleChange('confirmPassword', e.target.value)}
          placeholder="Repeat password"
          className="input-field"
        />
        {errors.confirmPassword && <p className="error-text">{errors.confirmPassword}</p>}
      </div>

      {apiError && <p className="error-text text-sm bg-red-50 p-2 rounded">{apiError}</p>}

      <button
        type="submit"
        disabled={isLoading}
        className="btn-primary w-full py-2.5"
      >
        {isLoading ? 'Creating account…' : 'Create Account'}
      </button>

      <p className="text-center text-sm text-gray-600">
        Already have an account?{' '}
        <Link href="/auth/login" className="text-primary-600 font-medium hover:underline">
          Sign In
        </Link>
      </p>
    </form>
  );
}

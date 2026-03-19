'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';

type Step = 'phone' | 'otp' | 'reset' | 'done';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  async function handleSendOtp(e: React.FormEvent) {
    e.preventDefault();
    if (!/^[6-9]\d{9}$/.test(phone)) {
      setError('Enter a valid 10-digit Indian mobile number');
      return;
    }
    setError('');
    setIsLoading(true);
    try {
      await api.post('/api/auth/forgot-password', { phone });
      setStep('otp');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to send OTP');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault();
    if (otp.length !== 6) { setError('Enter the 6-digit OTP'); return; }
    if (newPassword.length < 8) { setError('Password must be at least 8 characters'); return; }
    if (newPassword !== confirmPassword) { setError('Passwords do not match'); return; }

    setError('');
    setIsLoading(true);
    try {
      await api.post('/api/auth/reset-password', { phone, otp, newPassword });
      setStep('done');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Reset failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
          {step === 'done' ? (
            <div className="text-center">
              <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Password Reset!</h1>
              <p className="text-gray-500 mb-6">Your password has been updated successfully.</p>
              <Link href="/auth/login" className="btn-primary inline-block">
                Sign In
              </Link>
            </div>
          ) : (
            <>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Forgot password?</h1>
              <p className="text-gray-500 text-sm mb-6">
                {step === 'phone' && "Enter your registered phone number to receive an OTP."}
                {step === 'otp' && `Enter the 6-digit OTP sent to +91 ${phone} and set a new password.`}
              </p>

              {step === 'phone' && (
                <form onSubmit={handleSendOtp} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                    <div className="flex">
                      <span className="inline-flex items-center px-3 border border-r-0 border-gray-300 rounded-l-lg bg-gray-50 text-gray-500 text-sm">+91</span>
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => { setPhone(e.target.value.replace(/\D/g, '').slice(0, 10)); setError(''); }}
                        placeholder="9876543210"
                        className="input-field rounded-l-none"
                        maxLength={10}
                      />
                    </div>
                    {error && <p className="error-text">{error}</p>}
                  </div>
                  <button type="submit" disabled={isLoading} className="btn-primary w-full py-2.5">
                    {isLoading ? 'Sending…' : 'Send OTP'}
                  </button>
                </form>
              )}

              {step === 'otp' && (
                <form onSubmit={handleResetPassword} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">OTP</label>
                    <input
                      type="text"
                      value={otp}
                      onChange={(e) => { setOtp(e.target.value.replace(/\D/g, '').slice(0, 6)); setError(''); }}
                      placeholder="Enter 6-digit OTP"
                      className="input-field text-center text-lg tracking-widest"
                      maxLength={6}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                    <input type="password" value={newPassword} onChange={(e) => { setNewPassword(e.target.value); setError(''); }} placeholder="Min 8 characters" className="input-field" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
                    <input type="password" value={confirmPassword} onChange={(e) => { setConfirmPassword(e.target.value); setError(''); }} placeholder="Repeat password" className="input-field" />
                  </div>
                  {error && <p className="error-text text-sm">{error}</p>}
                  <button type="submit" disabled={isLoading} className="btn-primary w-full py-2.5">
                    {isLoading ? 'Resetting…' : 'Reset Password'}
                  </button>
                </form>
              )}

              <p className="text-center text-sm text-gray-500 mt-4">
                Remember your password?{' '}
                <Link href="/auth/login" className="text-primary-600 font-medium hover:underline">Sign In</Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

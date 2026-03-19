'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import OtpInput from '@/components/auth/OtpInput';
import api from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';

export default function VerifyOtpPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { login } = useAuth();

  const phone = searchParams.get('phone') || '';
  const purpose = (searchParams.get('purpose') || 'register') as 'register' | 'forgot_password';

  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(30);
  const [isResending, setIsResending] = useState(false);

  // Countdown timer for resend
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  async function handleVerify() {
    if (otp.length !== 6) {
      setError('Please enter all 6 digits');
      return;
    }
    setError('');
    setIsLoading(true);

    try {
      const { data } = await api.post('/api/auth/otp/verify', { phone, otp, purpose });

      if (purpose === 'register') {
        login(data.data.accessToken, data.data.user);
        router.push('/');
      } else {
        // forgot_password flow: redirect to reset-password page with phone
        router.push(`/auth/reset-password?phone=${encodeURIComponent(phone)}`);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Verification failed. Please try again.');
      setOtp('');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleResend() {
    setIsResending(true);
    setError('');
    try {
      await api.post('/api/auth/otp/send', { phone, purpose });
      setResendCooldown(30);
      setOtp('');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to resend OTP');
    } finally {
      setIsResending(false);
    }
  }

  // Auto-submit when 6 digits entered
  useEffect(() => {
    if (otp.length === 6) handleVerify();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [otp]);

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 text-center">
          <div className="w-16 h-16 bg-primary-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-2">Verify your phone</h1>
          <p className="text-sm text-gray-500 mb-1">We sent a 6-digit code to</p>
          <p className="font-semibold text-gray-800 mb-6">+91 {phone}</p>

          <OtpInput value={otp} onChange={setOtp} disabled={isLoading} hasError={!!error} />

          {error && <p className="mt-3 text-sm text-red-500">{error}</p>}

          <button
            onClick={handleVerify}
            disabled={isLoading || otp.length !== 6}
            className="btn-primary w-full mt-6 py-2.5"
          >
            {isLoading ? 'Verifying…' : 'Verify OTP'}
          </button>

          <div className="mt-4">
            {resendCooldown > 0 ? (
              <p className="text-sm text-gray-400">Resend in {resendCooldown}s</p>
            ) : (
              <button
                onClick={handleResend}
                disabled={isResending}
                className="text-sm text-primary-600 font-medium hover:underline disabled:opacity-50"
              >
                {isResending ? 'Sending…' : 'Resend OTP'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

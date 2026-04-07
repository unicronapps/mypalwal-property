'use client';
export const runtime = 'edge';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import OtpInput from '@/components/auth/OtpInput';
import api from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';

type Step = 'phone' | 'otp' | 'profile';

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();

  const [step, setStep] = useState<Step>('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<'user' | 'dealer'>('user');
  const [isExistingUser, setIsExistingUser] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

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
      const { data } = await api.post('/api/auth/otp/send', { phone });
      setIsExistingUser(data.data.isExistingUser);
      setStep('otp');
      setResendCooldown(30);
      startResendTimer();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to send OTP');
    } finally {
      setIsLoading(false);
    }
  }

  function startResendTimer() {
    let count = 30;
    const interval = setInterval(() => {
      count--;
      setResendCooldown(count);
      if (count <= 0) clearInterval(interval);
    }, 1000);
  }

  async function handleVerifyOtp() {
    if (otp.length !== 6) { setError('Enter all 6 digits'); return; }
    setError('');
    setIsLoading(true);
    try {
      const { data } = await api.post('/api/auth/otp/verify', { phone, otp });
      if (data.data.isNewUser) {
        // Store token in memory so complete-profile call can use it
        login(data.data.accessToken, data.data.user);
        setStep('profile');
      } else {
        login(data.data.accessToken, data.data.user);
        router.push(searchParams.get('redirect') || '/');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Invalid OTP');
      setOtp('');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleCompleteProfile(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) { setError('Please enter your name'); return; }
    setError('');
    setIsLoading(true);
    try {
      const { data } = await api.post('/api/auth/complete-profile', { name, role });
      login(data.data.accessToken, data.data.user);
      router.push(searchParams.get('redirect') || '/');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save profile');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleResend() {
    setIsLoading(true);
    setError('');
    try {
      await api.post('/api/auth/otp/send', { phone });
      setOtp('');
      setResendCooldown(30);
      startResendTimer();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to resend OTP');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">

          {/* STEP 1: Phone */}
          {step === 'phone' && (
            <>
              <h1 className="text-2xl font-bold text-gray-900 mb-1">Sign in / Register</h1>
              <p className="text-sm text-gray-500 mb-6">Enter your phone number to continue</p>
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
                      autoFocus
                    />
                  </div>
                  {error && <p className="error-text">{error}</p>}
                </div>
                <button type="submit" disabled={isLoading || phone.length !== 10} className="btn-primary w-full py-2.5">
                  {isLoading ? 'Sending OTP\u2026' : 'Send OTP'}
                </button>
              </form>
              <p className="text-xs text-gray-400 text-center mt-4">
                By continuing, you agree to our Terms of Service
              </p>
            </>
          )}

          {/* STEP 2: OTP */}
          {step === 'otp' && (
            <>
              <button onClick={() => { setStep('phone'); setOtp(''); setError(''); }} className="text-sm text-gray-500 hover:text-gray-700 mb-4 flex items-center gap-1">
                &larr; Change number
              </button>
              <h1 className="text-2xl font-bold text-gray-900 mb-1">
                {isExistingUser ? 'Welcome back!' : 'Verify your number'}
              </h1>
              <p className="text-sm text-gray-500 mb-6">
                Enter the 6-digit OTP sent to <span className="font-semibold text-gray-800">+91 {phone}</span>
              </p>
              <div className="space-y-4">
                <OtpInput value={otp} onChange={(v) => { setOtp(v); setError(''); }} disabled={isLoading} hasError={!!error} />
                {error && <p className="text-sm text-red-500 text-center">{error}</p>}
                <button
                  onClick={handleVerifyOtp}
                  disabled={isLoading || otp.length !== 6}
                  className="btn-primary w-full py-2.5"
                >
                  {isLoading ? 'Verifying\u2026' : 'Verify OTP'}
                </button>
                <div className="text-center">
                  {resendCooldown > 0 ? (
                    <p className="text-sm text-gray-400">Resend in {resendCooldown}s</p>
                  ) : (
                    <button onClick={handleResend} disabled={isLoading} className="text-sm text-primary-600 font-medium hover:underline">
                      Resend OTP
                    </button>
                  )}
                </div>
              </div>
            </>
          )}

          {/* STEP 3: Complete Profile (new users only) */}
          {step === 'profile' && (
            <>
              <h1 className="text-2xl font-bold text-gray-900 mb-1">Complete your profile</h1>
              <p className="text-sm text-gray-500 mb-6">Just a few details to get you started</p>
              <form onSubmit={handleCompleteProfile} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Your Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => { setName(e.target.value); setError(''); }}
                    placeholder="Rahul Sharma"
                    className="input-field"
                    autoFocus
                  />
                  {error && <p className="error-text">{error}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">I am a&hellip;</label>
                  <div className="grid grid-cols-2 gap-2">
                    {(['user', 'dealer'] as const).map((r) => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => setRole(r)}
                        className={`py-2.5 rounded-lg text-sm font-medium border transition-colors ${
                          role === r
                            ? 'bg-primary-600 text-white border-primary-600'
                            : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        {r === 'user' ? 'Buyer / Individual' : 'Dealer / Agent'}
                      </button>
                    ))}
                  </div>
                </div>
                <button type="submit" disabled={isLoading} className="btn-primary w-full py-2.5">
                  {isLoading ? 'Saving\u2026' : 'Get Started'}
                </button>
              </form>
            </>
          )}

        </div>
      </div>
    </div>
  );
}

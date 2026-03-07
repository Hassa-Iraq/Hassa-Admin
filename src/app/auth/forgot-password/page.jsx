'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import PhoneCodeSelect from '@/app/components/PhoneCodeSelect';

const PHONE_CODE_OPTIONS = [
  { value: '+1', code: 'US', flagUrl: 'https://flagcdn.com/w20/us.png' },
  { value: '+44', code: 'GB', flagUrl: 'https://flagcdn.com/w20/gb.png' },
  { value: '+92', code: 'PK', flagUrl: 'https://flagcdn.com/w20/pk.png' },
  { value: '+966', code: 'SA', flagUrl: 'https://flagcdn.com/w20/sa.png' },
  { value: '+971', code: 'AE', flagUrl: 'https://flagcdn.com/w20/ae.png' },
  { value: '+964', code: 'IQ', flagUrl: 'https://flagcdn.com/w20/iq.png' },
];

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState(1); // 1: request OTP, 2: verify OTP, 3: reset password
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    phoneCode: '+92',
    phone: '',
    otp: '',
    newPassword: '',
    confirmPassword: '',
  });

  const clearAlerts = () => {
    setError('');
    setSuccess('');
  };

  const updateField = (name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const buildPhoneNumber = () => {
    const code = String(formData.phoneCode || '').trim();
    const number = String(formData.phone || '').trim();
    if (!number) return '';
    const normalizedCode = code ? (code.startsWith('+') ? code : `+${code}`) : '';
    if (!normalizedCode) return number;
    if (number.startsWith('+')) return number;
    return `${normalizedCode}${number.startsWith('0') ? number.slice(1) : number}`;
  };

  const handleSendOtp = async (event) => {
    event.preventDefault();
    clearAlerts();

    const phoneNumber = buildPhoneNumber();
    if (!phoneNumber) {
      setError('Phone number is required.');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/backend-api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: phoneNumber,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.message || 'Failed to send OTP.');
      }

      setSuccess(data?.message || 'OTP sent successfully.');
      setStep(2);
    } catch (apiError) {
      setError(apiError?.message || 'Failed to send OTP.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (event) => {
    event.preventDefault();
    clearAlerts();

    const phoneNumber = buildPhoneNumber();
    if (!phoneNumber || !formData.otp.trim()) {
      setError('Phone number and OTP are required.');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/backend-api/auth/forgot-password/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: phoneNumber,
          otp: formData.otp.trim(),
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.message || 'Invalid OTP.');
      }

      setSuccess(data?.message || 'OTP verified successfully.');
      setStep(3);
    } catch (apiError) {
      setError(apiError?.message || 'Invalid OTP.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (event) => {
    event.preventDefault();
    clearAlerts();

    const phoneNumber = buildPhoneNumber();
    if (!phoneNumber) {
      setError('Phone number is required.');
      return;
    }
    if (!formData.newPassword) {
      setError('New password is required.');
      return;
    }
    if (formData.newPassword !== formData.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/backend-api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: phoneNumber,
          otp: formData.otp.trim(),
          new_password: formData.newPassword,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.message || 'Failed to reset password.');
      }

      setSuccess(data?.message || 'Password reset successful. Redirecting to login...');
      setTimeout(() => router.push('/auth/login'), 1200);
    } catch (apiError) {
      setError(apiError?.message || 'Failed to reset password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full relative overflow-hidden">
      <div className="absolute inset-0 z-0">
        <Image
          src="/images/DeskBg.png"
          alt="Background"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      </div>

      <div className="relative z-10 flex items-center justify-center min-h-screen p-4">
        <div className="w-[1131px]">
          <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
            <div className="grid md:grid-cols-2">
              <div className="relative h-50 md:h-auto min-h-[320px]">
                <Image
                  src="/images/heroBg.png"
                  alt="Food"
                  fill
                  className="object-cover"
                />
              </div>

              <div className="relative p-8 md:p-10 flex flex-col justify-center">
                <div className="text-center mb-6">
                  <h2 className="text-[28px] font-medium text-[#000000] text-center leading-[24px] tracking-[0.15%] font-poppins mb-2">
                    {step === 1 ? 'Forgot Password' : step === 2 ? 'Verify OTP' : 'Reset Password'}
                  </h2>
                  <p className="text-[20px] font-medium text-[#000000] text-center leading-[24px] tracking-[0.15%] font-poppins text-sm">
                    {step === 1 && 'Enter your phone number to receive OTP'}
                    {step === 2 && 'Enter the OTP sent to your phone'}
                    {step === 3 && 'Set your new password'}
                  </p>
                </div>

                {error && (
                  <div className="mb-4 px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm">
                    {error}
                  </div>
                )}

                {success && (
                  <div className="mb-4 px-4 py-3 rounded-lg bg-green-50 border border-green-200 text-green-600 text-sm">
                    {success}
                  </div>
                )}

                {step === 1 && (
                  <form onSubmit={handleSendOtp} className="space-y-4">
                    <div>
                      <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                        Phone Number
                      </label>
                      <div className="flex">
                        <PhoneCodeSelect
                          name="phoneCode"
                          value={formData.phoneCode}
                          onChange={(event) => updateField(event.target.name, event.target.value)}
                          options={PHONE_CODE_OPTIONS}
                          className="w-32"
                        />
                        <input
                          type="text"
                          id="phone"
                          placeholder="3001234567"
                          value={formData.phone}
                          onChange={(event) => updateField('phone', event.target.value)}
                          className="min-w-0 flex-1 rounded-r-lg border border-[#6001D2] px-4 py-3 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all placeholder:text-gray-400"
                          required
                          disabled={loading}
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full bg-[#6001D2] hover:bg-purple-600 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-lg transition-colors shadow-md hover:shadow-lg"
                    >
                      {loading ? 'Sending OTP...' : 'Send OTP'}
                    </button>
                  </form>
                )}

                {step === 2 && (
                  <form onSubmit={handleVerifyOtp} className="space-y-4">
                    <div>
                      <label htmlFor="otp" className="block text-sm font-medium text-gray-700 mb-2">
                        OTP
                      </label>
                      <input
                        type="text"
                        id="otp"
                        placeholder="123456"
                        value={formData.otp}
                        onChange={(event) => updateField('otp', event.target.value)}
                        className="w-full px-4 py-3 rounded-lg border border-[#6001D2] focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all placeholder:text-gray-400"
                        required
                        disabled={loading}
                      />
                    </div>

                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={() => setStep(1)}
                        disabled={loading}
                        className="w-1/2 border border-[#6001D2] text-[#6001D2] font-semibold py-3 rounded-lg hover:bg-purple-50 disabled:opacity-60 disabled:cursor-not-allowed"
                      >
                        Back
                      </button>
                      <button
                        type="submit"
                        disabled={loading}
                        className="w-1/2 bg-[#6001D2] hover:bg-purple-600 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-lg transition-colors shadow-md hover:shadow-lg"
                      >
                        {loading ? 'Verifying...' : 'Verify OTP'}
                      </button>
                    </div>
                  </form>
                )}

                {step === 3 && (
                  <form onSubmit={handleResetPassword} className="space-y-4">
                    <div>
                      <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-2">
                        New Password
                      </label>
                      <div className="relative">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          id="newPassword"
                          placeholder="********"
                          value={formData.newPassword}
                          onChange={(event) => updateField('newPassword', event.target.value)}
                          className="w-full px-4 py-3 rounded-lg border border-[#6001D2] focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all placeholder:text-gray-400"
                          required
                          disabled={loading}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword((prev) => !prev)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6001D2] hover:text-[#4b00a8]"
                          aria-label="Toggle password visibility"
                        >
                          {showPassword ? <FaEyeSlash className="w-5 h-5" /> : <FaEye className="w-5 h-5" />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                        Confirm Password
                      </label>
                      <div className="relative">
                        <input
                          type={showConfirmPassword ? 'text' : 'password'}
                          id="confirmPassword"
                          placeholder="********"
                          value={formData.confirmPassword}
                          onChange={(event) => updateField('confirmPassword', event.target.value)}
                          className="w-full px-4 py-3 rounded-lg border border-[#6001D2] focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all placeholder:text-gray-400"
                          required
                          disabled={loading}
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword((prev) => !prev)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6001D2] hover:text-[#4b00a8]"
                          aria-label="Toggle password visibility"
                        >
                          {showConfirmPassword ? <FaEyeSlash className="w-5 h-5" /> : <FaEye className="w-5 h-5" />}
                        </button>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full bg-[#6001D2] hover:bg-purple-600 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-lg transition-colors shadow-md hover:shadow-lg"
                    >
                      {loading ? 'Updating...' : 'Reset Password'}
                    </button>
                  </form>
                )}

                <div className="mt-4 text-center">
                  <Link href="/auth/login" className="text-sm text-[#6001D2] underline font-medium">
                    Back to Sign In
                  </Link>
                </div>
              </div>
            </div>
          </div>

          <div className="w-full mt-4 flex justify-end pr-0">
            <p className="text-white text-[16px] font-semibold drop-shadow-lg">
              Hassa
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

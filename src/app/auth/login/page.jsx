'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { FaApple, FaGoogle, FaFacebook, FaEye, FaEyeSlash } from 'react-icons/fa';

export default function LoginPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/backend-api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Invalid email or password');
      }

      const token = data.token || data.accessToken || data.data?.token;
      if (token) {
        document.cookie = `token=${token}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`;
        localStorage.setItem('token', token);
      }

      if (data.user || data.data?.user) {
        localStorage.setItem('user', JSON.stringify(data.user || data.data?.user));
      }

      setSuccess('Login successful! Redirecting...');
      setTimeout(() => router.push('/dashboard'), 1500);
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSocialLogin = (provider) => {
    console.log(`Login with ${provider}`);
  };

  return (
    <div className="min-h-screen w-full relative overflow-hidden">
      {/* Background Image */}
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

      {/* Main Content */}
      <div className="relative z-10 flex items-center justify-center min-h-screen p-4">
       <div className="w-[1131px] h-[636px]">
          {/* Card Container */}
          <div className=" bg-white rounded-3xl shadow-2xl overflow-hidden">
            <div className="grid md:grid-cols-2">
              {/* Left Side - Food Image */}
              <div className="relative h-50 md:h-auto min-h-[360px]">
                <Image
                  src="/images/heroBg.png"
                  alt="Pasta salad"
                  fill
                  className="object-cover"
                />
              </div>

              <div className="relative p-8 md:p-12 flex flex-col justify-center">

                {/* Header */}
                <div className="text-center mb-8">
                  <h1 className="text-[28px] font-medium text-gray-900 text-center leading-[24px] tracking-[0.15%] font-poppins mb-2">
                    Sign In
                  </h1>
                  <p className="text-[20px] font-medium text-gray-900 text-center leading-[24px] tracking-[0.15%] font-poppins text-sm">
                    Access Your Admin Panel
                  </p>
                </div>

                {/* Error Message */}
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

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-5">
                  {/* Email Input */}
                  <div>
                    <label
                      htmlFor="email"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Email
                    </label>
                    <input
                      type="email"
                      id="email"
                      placeholder="example@gmail.com"
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                      className="w-full px-4 py-3 rounded-lg border border-[#6001D2] focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all placeholder:text-gray-400"
                      required
                      disabled={loading}
                    />
                  </div>

                  {/* Password Input */}
                  <div>
                    <label
                      htmlFor="password"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Password
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        id="password"
                        placeholder="1223Zf+-"
                        value={formData.password}
                        onChange={(e) =>
                          setFormData({ ...formData, password: e.target.value })
                        }
                        className="w-full px-4 py-3 rounded-lg border border-[#6001D2]  focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all placeholder:text-gray-400"
                        required
                        disabled={loading}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6001D2] hover:text-[#4b00a8]"
                        aria-label="Toggle password visibility"
                      >
                        {showPassword ? (
                          <FaEyeSlash className="w-5 h-5" />
                        ) : (
                          <FaEye className="w-5 h-5" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Forgot Password Link */}
                  <div className="text-right">
                    <a
                      href="#"
                      className="text-sm text-[#6001D2] underline font-medium"
                    >
                      Forgot Password?
                    </a>
                  </div>

                  {/* Sign In Button */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-[#6001D2] hover:bg-purple-600 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-lg transition-colors shadow-md hover:shadow-lg"
                  >
                    {loading ? 'Signing In...' : 'Sign In'}
                  </button>
                </form>

                {/* Divider */}
                <div className="flex flex-col items-center mt-8">
                  <div className="flex items-center justify-between w-[240px] mb-6">
                    <div className="h-[1px] bg-[#6001D2] flex-1" />
                    <span className="px-3 text-[#6001D2] font-semibold text-[16px] leading-[16px] tracking-[0.5%] whitespace-nowrap">
                      or sign in with
                    </span>
                    <div className="h-[1px] bg-[#6001D2] flex-1" />
                  </div>

                  {/* Social Icons */}
                  <div className="flex justify-between w-[240px]">
                    <button
                      onClick={() => handleSocialLogin('Apple')}
                      className="w-16 h-16 rounded-2xl bg-gray-100 border border-gray-300 flex items-center justify-center shadow-sm hover:shadow-md transition"
                    >
                      <FaApple className="w-7 h-7 text-black" />
                    </button>
                    <button
                      onClick={() => handleSocialLogin('Google')}
                      className="w-16 h-16 rounded-2xl bg-gray-100 border border-gray-300 flex items-center justify-center shadow-sm hover:shadow-md transition"
                    >
                      <img src="/images/google.png" alt="Google" className="w-6 h-6" />
                    </button>
                    <button
                      onClick={() => handleSocialLogin('Facebook')}
                      className="w-16 h-16 rounded-2xl bg-gray-100 border border-gray-300 flex items-center justify-center shadow-sm hover:shadow-md transition"
                    >
                      <FaFacebook className="w-6 h-6 text-blue-600" />
                    </button>
                  </div>
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

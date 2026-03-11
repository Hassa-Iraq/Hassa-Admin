'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import { toast } from 'sonner';

export default function LoginPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  const normalizeRole = (user, payload) => {
    const roleSource =
      user?.role?.name ||
      user?.role?.slug ||
      user?.role?.key ||
      user?.role ||
      user?.user_type ||
      payload?.role?.name ||
      payload?.data?.role?.name ||
      '';

    if (typeof roleSource !== 'string') return '';
    return roleSource.trim().toLowerCase().replace(/\s+/g, '_');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
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

      const user = data.user || data.data?.user || data.data;
      const normalizedRole = normalizeRole(user, data);
      if (normalizedRole === 'driver') {
        // Block driver role from admin panel access.
        try {
          localStorage.removeItem('token');
          localStorage.removeItem('adminUser');
          localStorage.removeItem('userRole');
          localStorage.removeItem('sidebarPermissions');
          document.cookie = 'token=; path=/; max-age=0; SameSite=Lax';
        } catch {
          // Ignore storage cleanup failures.
        }
        throw new Error('Driver role is not allowed to login in admin panel.');
      }

      const token = data.token || data.accessToken || data.data?.token;
      if (token) {
        document.cookie = `token=${token}; path=/; max-age=${60 * 60 * 24 * 30}; SameSite=Lax`;
        localStorage.setItem('token', token);
      }

      const permissions =
        user?.role?.permissions ||
        user?.employee_permissions ||
        user?.employee?.employee_permissions ||
        user?.permissions ||
        data?.employee?.employee_permissions ||
        data?.employee_permissions ||
        data?.user?.employee_permissions ||
        data?.user?.role?.permissions ||
        data?.data?.user?.employee_permissions ||
        data?.data?.user?.role?.permissions ||
        data?.data?.employee?.employee_permissions ||
        data?.data?.employee_permissions ||
        data?.data?.role?.permissions ||
        null;
      if (user && typeof user === 'object') {
        const adminInfo = {
          name: user.name || user.full_name || `${user.f_name || user.first_name || ''} ${user.l_name || user.last_name || ''}`.trim(),
          email: user.email || formData.email,
          phone: user.phone || '',
          image: user.image || user.avatar || '',
          role: normalizedRole,
        };
        localStorage.setItem('adminUser', JSON.stringify(adminInfo));
      } else {
        localStorage.setItem('adminUser', JSON.stringify({ name: 'Admin', email: formData.email }));
      }
      if (normalizedRole) {
        localStorage.setItem('userRole', normalizedRole);
      } else {
        localStorage.removeItem('userRole');
      }
      if (permissions && typeof permissions === 'object') {
        localStorage.setItem('sidebarPermissions', JSON.stringify(permissions));
      } else {
        localStorage.removeItem('sidebarPermissions');
      }
      try {
        window.dispatchEvent(new Event('sidebar-auth-updated'));
      } catch {
        // Ignore event dispatch failures.
      }

      toast.success('Login successful! Redirecting...');
      setTimeout(() => router.push('/dashboard'), 1500);
    } catch (err) {
      toast.error(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
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
       <div className="w-[1131px]">
          {/* Card Container */}
          <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
            <div className="grid md:grid-cols-2">
              {/* Left Side - Food Image */}
              <div className="relative h-50 md:h-auto min-h-[320px]">
                <Image
                  src="/images/heroBg.png"
                  alt="Pasta salad"
                  fill
                  className="object-cover"
                />
              </div>

              <div className="relative p-8 md:p-10 flex flex-col justify-center">

                {/* Header */}
                <div className="text-center mb-6">
                  <h2 className="text-[28px] font-medium text-[#000000] text-center leading-[24px] tracking-[0.15%] font-poppins mb-2">
                    Sign In
                  </h2>
                  <p className="text-[20px] font-medium text-[#000000] text-center leading-[24px] tracking-[0.15%] font-poppins text-sm">
                    Access Your Admin Panel
                  </p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-4">
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
                    <Link
                      href="/auth/forgot-password"
                      className="text-sm text-[#6001D2] underline font-medium"
                    >
                      Forgot Password?
                    </Link>
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

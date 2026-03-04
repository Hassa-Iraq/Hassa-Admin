'use client';

import { useState, useRef, useEffect } from 'react';
import { Mail, ShoppingCart, Search, Globe, ChevronDown, LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/app/i18n/LanguageContext';

const LANGUAGES = [
  { code: 'en', label: 'English (US)', flag: '🇺🇸' },
  { code: 'ar', label: 'العربية (AR)', flag: '🇸🇦' },
  { code: 'ku', label: 'کوردی (KU)', flag: '🇮🇶' },
];

const normalizeAdmin = (user, fallbackEmail = '') => ({
  name:
    user?.name ||
    user?.full_name ||
    `${user?.f_name || user?.first_name || ''} ${user?.l_name || user?.last_name || ''}`.trim() ||
    'Admin',
  email: user?.email || fallbackEmail || '',
  phone: user?.phone || '',
  image: user?.image || user?.avatar || '',
});

export default function Topbar({ title, subtitle, rightContent }) {
  const router = useRouter();
  const { locale, dir, t, changeLanguage } = useLanguage();
  const isRTL = dir === 'rtl';
  const [langOpen, setLangOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [admin, setAdmin] = useState({ name: '', email: '', image: '' });
  const [profileReady, setProfileReady] = useState(false);
  const langRef = useRef(null);
  const profileRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (langRef.current && !langRef.current.contains(e.target)) setLangOpen(false);
      if (profileRef.current && !profileRef.current.contains(e.target)) setProfileOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    const fetchAdminProfile = async (token) => {
      const endpoints = ['/api/me'];
      for (const endpoint of endpoints) {
        try {
          const response = await fetch(endpoint, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });
          if (!response.ok) continue;
          const data = await response.json();
          const restaurant =
            data?.restaurant ||
            data?.data?.restaurant ||
            (Array.isArray(data?.data?.restaurants) ? data.data.restaurants[0] : null) ||
            null;
          const user = data?.user || data?.data?.user || data?.data || data;
          if (!user || typeof user !== 'object') continue;
          const normalized = normalizeAdmin(user);
          setAdmin(normalized);
          localStorage.setItem('adminUser', JSON.stringify(normalized));
          if (restaurant?.id) {
            localStorage.setItem('restaurant_id', String(restaurant.id));
            localStorage.setItem('selectedRestaurantId', String(restaurant.id));
          }
          setProfileReady(true);
          return true;
        } catch {
          // Keep trying fallback endpoint.
        }
      }
      setProfileReady(true);
      return false;
    };

    const hydrateAdmin = async () => {
      try {
        const cachedAdmin = localStorage.getItem('adminUser');
        if (cachedAdmin) {
          try {
            const parsed = JSON.parse(cachedAdmin);
            if (parsed && typeof parsed === 'object') {
              setAdmin({
                name: parsed.name || '',
                email: parsed.email || '',
                image: parsed.image || '',
              });
            }
          } catch {
            // Ignore invalid cache value.
          }
        }
        const token = localStorage.getItem('token');
        if (!token) {
          setProfileReady(true);
          return;
        }
        // Keep token in cookie as well so same-origin image/API proxy routes can authorize.
        document.cookie = `token=${token}; path=/; max-age=${60 * 60 * 24 * 30}; SameSite=Lax`;
        await fetchAdminProfile(token);
      } catch {
        // Ignore storage/API failures for topbar rendering.
        setProfileReady(true);
      }
    };

    hydrateAdmin();
  }, []);

  const handleLogout = () => {
    try {
      localStorage.removeItem('token');
      localStorage.removeItem('adminUser');
      localStorage.removeItem('user');
      document.cookie = 'token=; path=/; max-age=0; SameSite=Lax';
    } catch {
      // Continue redirect even if storage cleanup fails.
    }
    setAdmin({ name: '', email: '' });
    setProfileOpen(false);
    router.push('/auth/login');
  };

  const currentLang = LANGUAGES.find((l) => l.code === locale) || LANGUAGES[0];
  const adminInitials = admin.name
    ? admin.name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2)
    : '';

  return (
    <div className={`fixed top-0 h-auto md:h-[144px] bg-white z-30 ${isRTL ? 'left-0 right-0 md:right-64' : 'left-0 right-0 md:left-64'}`}>
      <div className="h-full flex flex-col">

        {/* ===== ROW 1 ===== */}
        <div className="h-[56px] md:h-[64px] flex items-center justify-end gap-3 md:gap-6 border-b border-gray-100 px-4 md:px-6">

          <div className="relative hidden md:block">
            <Search className={`absolute top-1/2 -translate-y-1/2 w-4 h-4 text-purple-600 ${isRTL ? 'right-3' : 'left-3'}`} />
            <input
              type="text"
              placeholder={t.searchPlaceholder}
              className={`py-2 w-72 border border-transparent focus:border-[#6001D2] focus:outline-none rounded-lg bg-[#EAB7FF33] text-sm ${isRTL ? 'pr-9 pl-4' : 'pl-9 pr-4'}`}
            />
          </div>

          <div className="relative">
            <Mail className="w-5 h-5 text-purple-600" />
            <span className={`absolute -top-1 w-2 h-2 bg-red-500 rounded-full ${isRTL ? '-left-1' : '-right-1'}`}></span>
          </div>

          <div className="relative">
            <ShoppingCart className="w-5 h-5 text-purple-600" />
            <span className={`absolute -top-1 bg-red-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center ${isRTL ? '-left-1' : '-right-1'}`}>
              2
            </span>
          </div>

          {/* Language Selector */}
          <div ref={langRef} className="relative hidden sm:block">
            <button
              onClick={() => setLangOpen(!langOpen)}
              className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 px-2 py-1 rounded-lg transition"
            >
              <Globe className="w-4 h-4 text-gray-600" />
              <span className="text-sm text-gray-700">{currentLang.label}</span>
              <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${langOpen ? 'rotate-180' : ''}`} />
            </button>

            {langOpen && (
              <div className={`absolute top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg py-1 min-w-[180px] z-50 ${isRTL ? 'left-0' : 'right-0'}`}>
                {LANGUAGES.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => { changeLanguage(lang.code); setLangOpen(false); }}
                    className={`w-full ${isRTL ? 'text-right' : 'text-left'} px-4 py-2 text-sm flex items-center gap-2 hover:bg-purple-50 transition ${
                      locale === lang.code ? 'text-purple-600 font-medium bg-purple-50' : 'text-gray-700'
                    }`}
                  >
                    <span>{lang.flag}</span>
                    <span>{lang.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div ref={profileRef} className="relative">
            <button
              onClick={() => setProfileOpen((prev) => !prev)}
              className="flex min-w-[190px] items-center gap-2 md:gap-3 rounded-lg px-1.5 py-1 hover:bg-gray-50"
            >
              <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-purple-600 text-white flex items-center justify-center font-semibold text-xs md:text-sm">
                {adminInitials || (profileReady ? '' : '...')}
              </div>
              <div className="hidden sm:block min-w-0 flex-1 text-left">
                <p className="truncate text-sm font-semibold text-gray-900">
                  {admin.name || (profileReady ? '' : 'Loading...')}
                </p>
                <p className="truncate text-xs text-gray-500">{admin.email || ''}</p>
              </div>
              <ChevronDown className={`hidden sm:block h-4 w-4 text-gray-400 transition-transform ${profileOpen ? 'rotate-180' : ''}`} />
            </button>

            {profileOpen && (
              <div className={`absolute top-full mt-1 w-40 rounded-lg border border-gray-200 bg-white py-1 shadow-lg z-50 ${isRTL ? 'left-0' : 'right-0'}`}>
                <button
                  onClick={handleLogout}
                  className={`w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 ${isRTL ? 'justify-end text-right' : 'justify-start text-left'}`}
                >
                  <LogOut className="h-4 w-4" />
                  <span>Logout</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ===== ROW 2 ===== */}
        <div className="min-h-[60px] md:h-[80px] bg-gray-50 flex items-center justify-between px-4 md:px-6 py-3 md:py-0">
          <div className={isRTL ? 'pr-10 md:pr-0' : 'pl-10 md:pl-0'}>
            <h2 className="text-base md:text-xl font-semibold text-gray-900">
              {title}
            </h2>
            {subtitle && (
              <p className="text-xs md:text-sm text-gray-500 mt-0.5">
                {subtitle}
              </p>
            )}
          </div>
          {rightContent}
        </div>

      </div>
    </div>
  );
}

'use client';

import { useState, useRef, useEffect } from 'react';
import { Mail, ShoppingCart, Search, Globe, ChevronDown, LogOut, Loader2 } from 'lucide-react';
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

const extractPermissions = (payload, user) => {
  const candidates = [
    user?.role?.permissions,
    user?.employee_permissions,
    user?.employee_role?.employee_permissions,
    user?.permissions,
    user?.employee?.employee_permissions,
    payload?.role?.permissions,
    payload?.employee_role?.employee_permissions,
    payload?.data?.role?.permissions,
    payload?.employee_permissions,
    payload?.data?.employee_role?.employee_permissions,
    payload?.data?.employee_permissions,
    payload?.employee?.employee_permissions,
    payload?.data?.employee?.employee_permissions,
    payload?.data?.user?.employee_permissions,
    payload?.data?.user?.employee_role?.employee_permissions,
    payload?.data?.user?.role?.permissions,
    payload?.employee?.role?.permissions,
  ];
  const matched = candidates.find((item) => item && typeof item === 'object' && !Array.isArray(item));
  return matched || null;
};

const extractRoleKey = (payload, user) => {
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

const getRestaurantRestriction = (payload, user) => {
  const parseBoolean = (value) => {
    if (value === true || value === 1 || value === '1') return true;
    if (value === false || value === 0 || value === '0') return false;
    if (typeof value === 'string') {
      const normalized = value.trim().toLowerCase();
      if (normalized === 'true' || normalized === 'active' || normalized === 'enabled') return true;
      if (normalized === 'false' || normalized === 'inactive' || normalized === 'disabled') return false;
    }
    return null;
  };

  const restaurant =
    payload?.restaurant ||
    payload?.data?.restaurant ||
    payload?.data?.restaurants?.[0] ||
    user?.restaurant ||
    user?.restaurants?.[0] ||
    null;

  const blockedFlag =
    parseBoolean(restaurant?.is_blocked) ??
    parseBoolean(restaurant?.isBlocked) ??
    parseBoolean(restaurant?.blocked);
  if (blockedFlag === true) return 'blocked';

  const statusText = String(restaurant?.status || user?.status || '').trim().toLowerCase();
  if (statusText === 'blocked') return 'blocked';
  if (statusText === 'inactive' || statusText === 'disabled' || statusText === 'deactivated') {
    return 'inactive';
  }

  const activeFlag =
    parseBoolean(restaurant?.is_active) ??
    parseBoolean(restaurant?.isActive) ??
    parseBoolean(restaurant?.active) ??
    parseBoolean(user?.is_active) ??
    parseBoolean(user?.isActive) ??
    parseBoolean(user?.active);
  if (activeFlag === false) return 'inactive';

  return null;
};

export default function Topbar({ title, titleKey, subtitle, subtitleKey, rightContent }) {
  const router = useRouter();
  const { locale, dir, t, changeLanguage } = useLanguage();
  const isRTL = dir === 'rtl';
  const resolvedTitle = titleKey ? (t[titleKey] || title) : title;
  const resolvedSubtitle = subtitleKey ? (t[subtitleKey] || subtitle) : subtitle;
  const [langOpen, setLangOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [admin, setAdmin] = useState({ name: '', email: '', image: '' });
  const [profileReady, setProfileReady] = useState(false);
  const [pendingOrdersCount, setPendingOrdersCount] = useState(null);
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
    const emitSidebarAuthUpdate = () => {
      try {
        window.dispatchEvent(new Event('sidebar-auth-updated'));
      } catch {
        // Ignore event dispatch failures.
      }
    };

    const resolveEmployeePermissions = async ({ token, user, payload }) => {
      const directPermissions = extractPermissions(payload, user);
      if (directPermissions) return directPermissions;

      const roleKey = extractRoleKey(payload, user);
      const userType = String(
        user?.role ||
        user?.user_type ||
        payload?.role ||
        payload?.data?.role ||
        ''
      ).toLowerCase();
      const shouldLookupEmployeePermissions =
        roleKey === 'employee' ||
        userType === 'employee' ||
        Boolean(user?.employee_role_id || payload?.employee_role_id || payload?.data?.employee_role_id);
      if (!shouldLookupEmployeePermissions) return null;

      const employeeId = String(
        user?.id ||
        payload?.employee?.id ||
        payload?.data?.employee?.id ||
        ''
      ).trim();
      const employeeEmail = String(
        user?.email ||
        payload?.employee?.email ||
        payload?.data?.employee?.email ||
        ''
      ).trim();

      try {
        const params = new URLSearchParams({
          page: '1',
          limit: '50',
          search: employeeEmail,
          employee_role_id: '',
          is_active: 'true',
        });
        const response = await fetch(`/api/auth/admin/employees?${params.toString()}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (!response.ok) return null;
        const listData = await response.json();
        const source =
          listData?.data && typeof listData.data === 'object'
            ? listData.data
            : listData;
        const employees = Array.isArray(source?.employees)
          ? source.employees
          : Array.isArray(source?.list)
            ? source.list
            : [];
        const matchedEmployee = employees.find((item) => {
          const idMatch = employeeId && String(item?.id || '').trim() === employeeId;
          const emailMatch =
            employeeEmail &&
            String(item?.email || '').trim().toLowerCase() === employeeEmail.toLowerCase();
          return idMatch || emailMatch;
        });
        return matchedEmployee?.employee_permissions || null;
      } catch {
        return null;
      }
    };

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
          const roleKey = extractRoleKey(data, user);
          const restriction = roleKey === 'restaurant' ? getRestaurantRestriction(data, user) : null;
          if (restriction) {
            localStorage.removeItem('token');
            localStorage.removeItem('adminUser');
            localStorage.removeItem('userRole');
            localStorage.removeItem('sidebarPermissions');
            localStorage.removeItem('restaurant_id');
            localStorage.removeItem('selectedRestaurantId');
            document.cookie = 'token=; path=/; max-age=0; SameSite=Lax';
            emitSidebarAuthUpdate();
            router.push(`/auth/restaurant-blocked?reason=${restriction}`);
            setProfileReady(true);
            return true;
          }
          if (roleKey) {
            localStorage.setItem('userRole', roleKey);
          } else {
            localStorage.removeItem('userRole');
          }
          emitSidebarAuthUpdate();
          const permissions = await resolveEmployeePermissions({ token, user, payload: data });
          if (permissions) {
            localStorage.setItem('sidebarPermissions', JSON.stringify(permissions));
            emitSidebarAuthUpdate();
          }
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

  useEffect(() => {
    let mounted = true;
    let intervalId;

    const parseCount = (data) => {
      const total =
        data?.data?.total ??
        data?.total ??
        data?.data?.total_size ??
        data?.total_size ??
        data?.data?.count ??
        data?.count ??
        null;
      const parsed = Number(total);
      if (Number.isFinite(parsed)) return parsed;

      const list =
        data?.data?.orders ||
        data?.data?.list ||
        data?.orders ||
        data?.list ||
        data?.data ||
        [];
      return Array.isArray(list) ? list.length : 0;
    };

    const fetchPendingOrdersCount = async () => {
      try {
        const token = localStorage.getItem('token') || '';
        const params = new URLSearchParams({
          page: '1',
          // Prefer counting the returned list when backend omits total/total_size.
          // Large enough for typical pending volumes in admin UI.
          limit: '200',
          status: 'Pending',
          q: '',
          date_from: '',
          date_to: '',
          restaurant_id: '',
          user_id: '',
        });
        const response = await fetch(`/api/orders/?${params.toString()}`, {
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });
        if (!response.ok) return;
        const data = await response.json();
        const list =
          data?.data?.orders ||
          data?.data?.list ||
          data?.orders ||
          data?.list ||
          data?.data ||
          [];
        const listCount = Array.isArray(list) ? list.length : 0;
        const totalCount = parseCount(data);
        const count = totalCount > 0 ? totalCount : listCount;
        if (mounted) setPendingOrdersCount(count);
      } catch {
        // Keep last known count.
      }
    };

    fetchPendingOrdersCount();
    intervalId = window.setInterval(fetchPendingOrdersCount, 30_000);

    return () => {
      mounted = false;
      if (intervalId) window.clearInterval(intervalId);
    };
  }, []);

  const handleLogout = () => {
    try {
      localStorage.removeItem('token');
      localStorage.removeItem('adminUser');
      localStorage.removeItem('user');
      localStorage.removeItem('sidebarPermissions');
      localStorage.removeItem('userRole');
      document.cookie = 'token=; path=/; max-age=0; SameSite=Lax';
      window.dispatchEvent(new Event('sidebar-auth-updated'));
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
    <div className="z-30 h-auto w-full overflow-visible bg-white md:h-[144px]">
      <div className="flex h-full flex-col overflow-visible">

        {/* ===== ROW 1 ===== */}
        <div className="flex h-[56px] w-full min-h-[56px] items-stretch overflow-visible border-b border-gray-100 px-3 pe-2 md:h-[64px] md:min-h-0 md:items-center md:px-6 md:pe-6">
          <div className="relative hidden md:block">
            <Search className={`absolute top-1/2 -translate-y-1/2 w-4 h-4 text-purple-600 ${isRTL ? 'right-3' : 'left-3'}`} />
            <input
              type="text"
              placeholder={t.searchPlaceholder}
              className={`py-2 w-72 border border-transparent focus:border-[#6001D2] focus:outline-none rounded-lg bg-[#EAB7FF33] text-sm ${isRTL ? 'pr-9 pl-4' : 'pl-9 pr-4'}`}
            />
          </div>

          <div
            className={`flex min-h-0 min-w-0 flex-1 items-center justify-end gap-1.5 overflow-visible sm:gap-3 md:gap-6 ${isRTL ? 'pe-10 ps-0' : 'ps-10 pe-0'} md:ps-0 md:pe-0`}
          >
            <div className="relative shrink-0">
              <Mail className="h-5 w-5 text-purple-600" />
              <span
                className={`absolute -top-0.5 h-2 w-2 rounded-full bg-red-500 ${isRTL ? '-left-0.5' : '-right-0.5'}`}
              />
            </div>

            <button
              type="button"
              onClick={() => router.push('/dashboard/orders/pending')}
              className="relative inline-flex h-8 w-8 shrink-0 items-center justify-center overflow-visible rounded-lg text-purple-600 transition hover:bg-gray-50 md:h-9 md:w-9"
              aria-label={
                pendingOrdersCount !== null
                  ? `Pending orders, ${pendingOrdersCount}`
                  : 'Pending orders'
              }
            >
              <ShoppingCart className="h-5 w-5 shrink-0" aria-hidden />
              {pendingOrdersCount !== null && pendingOrdersCount > 0 ? (
                <span
                  className={`pointer-events-none absolute z-10 flex h-3 min-h-3 min-w-3 max-w-[18px] items-center justify-center rounded-full bg-red-500 px-px text-[7px] font-bold tabular-nums leading-none text-white shadow-sm ring-[1px] ring-white md:h-[11px] md:min-w-[11px] md:max-w-[20px] md:px-[2px] md:text-[8px] md:ring-[1.5px] ${
                    isRTL ? 'left-0 top-0' : 'right-0 top-0'
                  }`}
                >
                  {pendingOrdersCount > 99 ? '99+' : pendingOrdersCount}
                </span>
              ) : null}
            </button>

            {/* Language Selector */}
            <div ref={langRef} className="relative hidden sm:block">
              <button
                onClick={() => setLangOpen(!langOpen)}
                className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1 transition hover:bg-gray-50"
              >
                <Globe className="h-4 w-4 text-gray-600" />
                <span className="text-sm text-gray-700">{currentLang.label}</span>
                <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${langOpen ? 'rotate-180' : ''}`} />
              </button>

              {langOpen && (
                <div className={`absolute top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg py-1 min-w-[180px] z-50 ${isRTL ? 'left-0' : 'right-0'}`}>
                  {LANGUAGES.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => {
                        changeLanguage(lang.code);
                        setLangOpen(false);
                      }}
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

            <div ref={profileRef} className="relative shrink-0">
              <button
                onClick={() => setProfileOpen((prev) => !prev)}
                className="flex min-w-0 max-w-none items-center gap-2 rounded-lg px-0.5 py-1 hover:bg-gray-50 sm:min-w-[190px] sm:px-1.5 md:gap-3"
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-purple-600 text-xs font-semibold text-white md:h-10 md:w-10 md:text-sm">
                  {adminInitials || (profileReady ? '' : '...')}
                </div>
                <div className="hidden min-w-0 flex-1 text-left sm:block">
                  <p className="truncate text-sm font-semibold text-gray-900">
                    {admin.name ||
                      (profileReady ? (
                        ''
                      ) : (
                        <span className="inline-flex items-center" aria-label="Loading profile">
                          <Loader2 className="h-4 w-4 animate-spin text-gray-400" aria-hidden />
                        </span>
                      ))}
                  </p>
                  <p className="truncate text-xs text-gray-500">{admin.email || ''}</p>
                </div>
                <ChevronDown
                  className={`hidden h-4 w-4 shrink-0 text-gray-400 transition-transform sm:block ${profileOpen ? 'rotate-180' : ''}`}
                />
              </button>

              {profileOpen && (
                <div className={`absolute top-full mt-1 w-40 rounded-lg border border-gray-200 bg-white py-1 shadow-lg z-50 ${isRTL ? 'left-0' : 'right-0'}`}>
                  <button
                    onClick={handleLogout}
                    className={`flex w-full items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 ${isRTL ? 'justify-end text-right' : 'justify-start text-left'}`}
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Logout</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ===== ROW 2 ===== */}
        <div className="min-h-[60px] md:h-[80px] bg-gray-50 flex items-center justify-between px-4 md:px-6 py-3 md:py-0">
          <div className={isRTL ? 'pr-10 md:pr-0' : 'pl-10 md:pl-0'}>
            <h2 className="text-base md:text-xl font-semibold text-gray-900">
              {resolvedTitle}
            </h2>
            {resolvedSubtitle && (
              <p className="text-xs md:text-sm text-gray-500 mt-0.5">
                {resolvedSubtitle}
              </p>
            )}
          </div>
          {rightContent}
        </div>

      </div>
    </div>
  );
}

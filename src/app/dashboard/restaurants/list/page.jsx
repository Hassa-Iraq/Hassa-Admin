'use client'
import { Fragment, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { API_BASE_URL } from '@/app/config';
import { formatPhoneWithFlag } from '@/app/lib/phone';
import TableLoadingSkeleton from '@/app/components/TableLoadingSkeleton';
import {
  Search, Download,
  CreditCard, TrendingUp, ArrowDownLeft,
  Eye, Edit2,
  ChevronLeft, ChevronRight
} from 'lucide-react';
import { toast } from 'sonner';

const PER_PAGE = 20;
const DEFAULT_RESTAURANT_IMAGE = '/default-restaurant-image.svg';

const STATS = [
  { key: 'total', label: 'Total Restaurants',        icon: '/images/mdi.png',    bg: 'bg-[#F3EAFF]', border: 'border-[#6001D2]' },
  { key: 'active', label: 'Active Restaurants',       icon: '/images/location.png',   bg: 'bg-[#E6FFF5]', border: 'border-[#00C49A]' },
  { key: 'inactive', label: 'Inactive Restaurants',     icon: '/images/food-inactive.png', bg: 'bg-[#FFF0F0]', border: 'border-[#FF6B6B]' },
  { key: 'newlyJoined', label: 'Newly joined Restaurants', icon: '/images/food.png',         bg: 'bg-[#FFF7E6]', border: 'border-[#FF9F43]' },
];

const TRANSACTIONS = [
  { label: 'Total Transactions',           value: 'IQD 5',         icon: CreditCard,    color: 'text-[#6001D2]', dot: 'bg-[#6001D2]' },
  { label: 'Commission Earned',            value: 'IQD 12,546',   icon: TrendingUp,    color: 'text-[#00C49A]', dot: 'bg-[#00C49A]' },
  { label: 'Total Restaurant Withdraws',   value: 'IQD 12546.34', icon: ArrowDownLeft, color: 'text-[#FF6B6B]', dot: 'bg-[#FF6B6B]' },
];

// ─── component ────────────────────────────────────────────────────────────────
export default function RestaurantListPage() {
  const router = useRouter();
  const [userRole, setUserRole] = useState('');
  const [currentRestaurantId, setCurrentRestaurantId] = useState('');
  const canEditRestaurant = ['admin', 'super_admin', 'superadmin', 'restaurant'].includes(userRole);
  const canManageRestaurantBlockStatus = ['admin', 'super_admin', 'superadmin'].includes(userRole);
  const canToggleRestaurantOpenStatus = userRole === 'restaurant';
  const [restaurants, setRestaurants] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [summary, setSummary] = useState({
    total: 0,
    active: 0,
    inactive: 0,
    newlyJoined: 0,
  });
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState('');
  const [search, setSearch] = useState('');
  const [statuses, setStatuses] = useState({});
  const [baseStatuses, setBaseStatuses] = useState({});
  const [statusUpdating, setStatusUpdating] = useState({});
  const [blockedStatuses, setBlockedStatuses] = useState({});
  const [baseBlockedStatuses, setBaseBlockedStatuses] = useState({});
  const [blockUpdating, setBlockUpdating] = useState({});
  const [statusError, setStatusError] = useState('');
  const [page, setPage] = useState(1);
  const [cuisineFilter, setCuisineFilter] = useState('');
  const [radiusFilter, setRadiusFilter]   = useState('');

  useEffect(() => {
    try {
      const role = localStorage.getItem('userRole') || '';
      setUserRole(String(role).trim().toLowerCase());
      const restaurantId =
        localStorage.getItem('restaurant_id') ||
        localStorage.getItem('selectedRestaurantId') ||
        '';
      setCurrentRestaurantId(String(restaurantId).trim());
    } catch {
      setUserRole('');
      setCurrentRestaurantId('');
    }
  }, []);

  useEffect(() => {
    const toAbsoluteUrl = (value) => {
      if (!value || typeof value !== 'string') return '';
      const trimmed = value.trim();
      if (!trimmed) return '';
      if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed;
      if (trimmed.startsWith('//')) return `https:${trimmed}`;
      if (trimmed.startsWith('/')) return `${API_BASE_URL}${trimmed}`;
      return `${API_BASE_URL}/${trimmed}`;
    };

    const normalizeImage = (value) => {
      if (Array.isArray(value)) {
        for (const item of value) {
          const candidate = normalizeImage(item);
          if (candidate) return candidate;
        }
        return '';
      }
      if (typeof value === 'string' && value.trim()) return toAbsoluteUrl(value);
      if (value && typeof value === 'object') {
        const pathWithKey =
          value.path && value.key
            ? `${String(value.path).replace(/\/$/, '')}/${String(value.key).replace(/^\//, '')}`
            : '';

        return (
          normalizeImage(value.full_url) ||
          normalizeImage(value.url) ||
          normalizeImage(pathWithKey) ||
          normalizeImage(value.path) ||
          normalizeImage(value.key) ||
          normalizeImage(value.image) ||
          normalizeImage(value.logo) ||
          ''
        );
      }
      return '';
    };

    const normalizeCountryCode = (value) => {
      if (!value) return '';
      const raw = String(value).trim();
      if (!raw) return '';
      const digits = raw.replace(/[^\d]/g, '');
      return digits ? `+${digits}` : '';
    };

    const formatPhone = (phoneValue, countryCodeValue) => {
      if (!phoneValue) return '-';
      const raw = String(phoneValue).trim();
      if (!raw) return '-';
      if (raw.startsWith('+')) return raw;

      const countryCode = normalizeCountryCode(countryCodeValue);
      if (!countryCode) return raw;

      const rawDigits = raw.replace(/[^\d]/g, '');
      const codeDigits = countryCode.replace('+', '');
      if (!rawDigits) return '-';
      if (rawDigits.startsWith(codeDigits)) return `+${rawDigits}`;

      // If local phone starts with 0, drop it when prefixing country code.
      return `${countryCode}${raw.startsWith('0') ? raw.slice(1) : raw}`;
    };

    const toBoolean = (value) => {
      if (value === true || value === 1 || value === '1') return true;
      if (value === false || value === 0 || value === '0') return false;
      if (typeof value === 'string') {
        const normalized = value.trim().toLowerCase();
        if (normalized === 'active' || normalized === 'true') return true;
        if (normalized === 'inactive' || normalized === 'false') return false;
      }
      return null;
    };

    const resolveRestaurantOpenStatus = (item) => {
      // Toggle controls open/close state, so prefer explicit is_open fields.
      const isOpenRaw =
        item?.is_open ??
        item?.isOpen ??
        item?.open;
      const isOpen = toBoolean(isOpenRaw);
      if (isOpen !== null) return isOpen;

      // Backward compatibility if some responses still expose active/inactive only.
      const isActiveRaw =
        item?.is_active ??
        item?.isActive ??
        item?.active;
      const isActive = toBoolean(isActiveRaw);
      if (isActive !== null) return isActive;

      const statusRaw = item?.status;
      const status = toBoolean(statusRaw);
      if (status !== null) return status;

      return false;
    };

    const resolveRestaurantBlockedStatus = (item) => {
      const normalize = (value) => {
        if (value === true || value === 1 || value === '1') return true;
        if (value === false || value === 0 || value === '0') return false;
        if (typeof value === 'string') {
          const v = value.trim().toLowerCase();
          if (v === 'blocked') return true;
          if (v === 'unblocked') return false;
        }
        return null;
      };

      const directBlocked =
        normalize(item?.is_blocked) ??
        normalize(item?.isBlocked) ??
        normalize(item?.blocked) ??
        normalize(item?.is_block);
      if (directBlocked !== null) return directBlocked;

      const isActive =
        toBoolean(item?.is_active) ??
        toBoolean(item?.isActive) ??
        toBoolean(item?.active);
      if (isActive !== null) return !isActive;

      return false;
    };

    const toShortAddress = (value, maxLen = 34) => {
      const raw = typeof value === 'string' ? value.trim() : '';
      if (!raw || raw === '-') return '-';
      const firstSegment = raw.split(',')[0]?.trim() || raw;
      const candidate = firstSegment.length >= 6 ? firstSegment : raw;
      if (candidate.length <= maxLen) return candidate;
      return `${candidate.slice(0, Math.max(0, maxLen - 1)).trimEnd()}…`;
    };

    const normalizeRestaurant = (item, index) => {
      const editId =
        item?.id ??
        item?.restaurant_id ??
        item?.restaurantId ??
        item?.restaurant?.id ??
        item?.restaurant?.restaurant_id ??
        '';
      const firstName = item?.vendor?.f_name || item?.vendor?.first_name || '';
      const lastName = item?.vendor?.l_name || item?.vendor?.last_name || '';
      const ownerName = `${firstName} ${lastName}`.trim();
      const countryCode =
        item?.country_code ||
        item?.countryCode ||
        item?.dial_code ||
        item?.dialCode ||
        item?.vendor?.country_code ||
        item?.vendor?.countryCode ||
        item?.vendor?.dial_code ||
        item?.vendor?.dialCode ||
        '';
      const rawPhone = item?.phone || item?.vendor?.phone || '';
      const parentRestaurantIdRaw =
        item?.parent_restaurant_id ??
        item?.parent_id ??
        item?.branch_of_restaurant_id ??
        item?.main_restaurant_id ??
        item?.restaurant?.parent_restaurant_id ??
        item?.restaurant?.parent_id ??
        '';
      const parentRestaurantId = parentRestaurantIdRaw ? String(parentRestaurantIdRaw).trim() : '';

      const fullAddress =
        item?.address ||
        item?.location ||
        item?.street ||
        item?.vendor?.address ||
        item?.zone?.name ||
        item?.zone ||
        '-';

      return {
        id: editId || `${page}-${index}`,
        editId: editId || '',
        parentRestaurantId,
        isBranch: Boolean(parentRestaurantId),
        name: item?.name || item?.restaurant_name || item?.translations?.[0]?.name || 'N/A',
        image:
          normalizeImage(item?.logo_url) ||
          normalizeImage(item?.logoUrl) ||
          normalizeImage(item?.logo_full_url) ||
          normalizeImage(item?.logo) ||
          normalizeImage(item?.cover_image_url) ||
          normalizeImage(item?.coverImageUrl) ||
          normalizeImage(item?.image_full_url) ||
          normalizeImage(item?.image) ||
          normalizeImage(item?.cover_photo_full_url) ||
          normalizeImage(item?.cover_photo),
        rating: Number(item?.avg_rating || item?.rating || 0),
        reviews: Number(item?.rating_count || item?.reviews_count || item?.total_reviews || 0),
        owner: ownerName || item?.owner_name || 'N/A',
        ownerEmail: item?.vendor?.email || item?.owner_email || item?.email || '-',
        // List UI should show phone only (no country label like "PK").
        phone: formatPhone(rawPhone, countryCode),
        address: fullAddress,
        addressShort: toShortAddress(fullAddress),
        cuisine:
          (typeof item?.cuisine === 'string' && item.cuisine.trim()) ||
          item?.cuisine?.name ||
          item?.cuisine_name ||
          'Cuisine not found',
        blocked: resolveRestaurantBlockedStatus(item),
        status: resolveRestaurantOpenStatus(item),
        createdAt: item?.created_at || item?.createdAt || null,
      };
    };

    const fetchRestaurants = async () => {
      setLoading(true);
      setFetchError('');
      try {
        const params = new URLSearchParams({
          page: String(page),
          limit: String(PER_PAGE),
        });
        if (search.trim()) params.set('search', search.trim());
        if (cuisineFilter) params.set('cuisine', cuisineFilter);
        const effectiveRole =
          userRole || String(localStorage.getItem('userRole') || '').trim().toLowerCase();
        let effectiveRestaurantId =
          currentRestaurantId ||
          String(
            localStorage.getItem('restaurant_id') ||
            localStorage.getItem('selectedRestaurantId') ||
            ''
          ).trim();

        if (effectiveRole === 'restaurant' && !effectiveRestaurantId) {
          try {
            const token = localStorage.getItem('token') || '';
            if (token) {
              const meResponse = await axios.get('/api/me', {
                headers: { Authorization: `Bearer ${token}` },
              });
              const meData = meResponse?.data || {};
              const meRestaurant =
                meData?.restaurant ||
                meData?.data?.restaurant ||
                meData?.user?.restaurant ||
                meData?.data?.user?.restaurant ||
                (Array.isArray(meData?.data?.restaurants) ? meData.data.restaurants[0] : null);
              effectiveRestaurantId = String(
                meRestaurant?.id || meRestaurant?.restaurant_id || ''
              ).trim();
              if (effectiveRestaurantId) {
                localStorage.setItem('restaurant_id', effectiveRestaurantId);
                localStorage.setItem('selectedRestaurantId', effectiveRestaurantId);
                setCurrentRestaurantId(effectiveRestaurantId);
              }
            }
          } catch {
            // Keep graceful fallback to generic listing when id fetch fails.
          }
        }

        let data;
        let normalized = [];

        if (effectiveRole === 'restaurant' && effectiveRestaurantId) {
          const mainResponse = await axios.get(`/api/restaurants/${effectiveRestaurantId}`);
          const mainData = mainResponse?.data || {};
          data = mainData;

          const mainRestaurant =
            mainData?.data?.restaurant ||
            mainData?.restaurant ||
            mainData?.data ||
            null;
          const branchList =
            mainData?.data?.branches ||
            mainData?.branches ||
            mainData?.data?.list ||
            mainData?.list ||
            [];

          const normalizedMain = mainRestaurant ? [normalizeRestaurant(mainRestaurant, 0)] : [];
          const normalizedBranches = (Array.isArray(branchList) ? branchList : []).map((item, idx) =>
            normalizeRestaurant(
              {
                ...item,
                parent_restaurant_id:
                  item?.parent_restaurant_id ??
                  item?.parent_id ??
                  item?.branch_of_restaurant_id ??
                  effectiveRestaurantId,
              },
              idx + 1
            )
          );
          normalized = [...normalizedMain, ...normalizedBranches];
        } else {
          const restaurantsResponse = await axios.get(`/api/restaurants?${params.toString()}`);
          data = restaurantsResponse?.data || {};
          const list =
            data?.data?.restaurants ||
            data?.data?.list ||
            data?.restaurants ||
            data?.list ||
            data?.data ||
            [];
          normalized = (Array.isArray(list) ? list : []).map(normalizeRestaurant);
        }

        setRestaurants(normalized);

        const toNumber = (value, fallback = null) => {
          const n = Number(value);
          return Number.isFinite(n) ? n : fallback;
        };

        const total =
          data?.data?.total_branches ??
          data?.total_branches ??
          data?.data?.branches_count ??
          data?.branches_count ??
          data?.data?.branches?.length ??
          data?.branches?.length ??
          data?.data?.total ??
          data?.total ??
          data?.data?.total_size ??
          data?.total_size ??
          data?.data?.count ??
          normalized.length;
        const parsedTotal = toNumber(total, 0) || 0;
        setTotalCount(parsedTotal);

        const activeFromApi =
          data?.data?.active_restaurants ??
          data?.active_restaurants ??
          data?.data?.active_count ??
          data?.active_count ??
          data?.data?.active;
        const inactiveFromApi =
          data?.data?.inactive_restaurants ??
          data?.inactive_restaurants ??
          data?.data?.inactive_count ??
          data?.inactive_count ??
          data?.data?.inactive;
        const newlyJoinedFromApi =
          data?.data?.newly_joined_restaurants ??
          data?.newly_joined_restaurants ??
          data?.data?.new_restaurants ??
          data?.new_restaurants;

        const activeFromList = normalized.filter((r) => r.status).length;
        const inactiveFromList = normalized.length - activeFromList;
        const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
        const newlyJoinedFromList = normalized.filter((r) => {
          const ts = r.createdAt ? new Date(r.createdAt).getTime() : NaN;
          return Number.isFinite(ts) && ts >= sevenDaysAgo;
        }).length;

        const active = toNumber(activeFromApi, activeFromList) ?? activeFromList;
        const inactive =
          toNumber(inactiveFromApi, null) ??
          Math.max(parsedTotal - active, inactiveFromList);
        const newlyJoined = toNumber(newlyJoinedFromApi, newlyJoinedFromList) ?? newlyJoinedFromList;

        setSummary({
          total: parsedTotal,
          active,
          inactive,
          newlyJoined,
        });
      } catch (error) {
        setRestaurants([]);
        setTotalCount(0);
        setSummary({
          total: 0,
          active: 0,
          inactive: 0,
          newlyJoined: 0,
        });
        setFetchError(error.message || 'Failed to load restaurants');
      } finally {
        setLoading(false);
      }
    };

    fetchRestaurants();
  }, [page, search, cuisineFilter, radiusFilter, userRole, currentRestaurantId]);

  useEffect(() => {
    setStatuses((prev) => {
      const next = { ...prev };
      restaurants.forEach((r) => {
        if (next[r.id] === undefined) next[r.id] = r.status;
      });
      return next;
    });
    setBaseStatuses((prev) => {
      const next = { ...prev };
      restaurants.forEach((r) => {
        if (next[r.id] === undefined) next[r.id] = r.status;
      });
      return next;
    });
  }, [restaurants]);

  useEffect(() => {
    setBlockedStatuses((prev) => {
      const next = { ...prev };
      restaurants.forEach((r) => {
        if (next[r.id] === undefined) next[r.id] = Boolean(r.blocked);
      });
      return next;
    });
    setBaseBlockedStatuses((prev) => {
      const next = { ...prev };
      restaurants.forEach((r) => {
        if (next[r.id] === undefined) next[r.id] = Boolean(r.blocked);
      });
      return next;
    });
  }, [restaurants]);

  const displaySummary = useMemo(() => {
    let activeDelta = 0;

    Object.keys(statuses).forEach((id) => {
      if (baseStatuses[id] === undefined) return;
      const base = Boolean(baseStatuses[id]);
      const current = Boolean(statuses[id]);
      if (base === current) return;
      if (base && !current) activeDelta -= 1;
      if (!base && current) activeDelta += 1;
    });

    const active = Math.max(0, (summary.active ?? 0) + activeDelta);
    const inactive = Math.max(0, (summary.inactive ?? 0) - activeDelta);

    return {
      ...summary,
      active,
      inactive,
    };
  }, [summary, statuses, baseStatuses]);

  const totalPages = Math.max(1, Math.ceil(totalCount / PER_PAGE));
  const orderedRestaurants = useMemo(() => {
    if (userRole !== 'restaurant') return restaurants;
    if (!currentRestaurantId) return restaurants;

    const mainRestaurant = restaurants.find((item) => String(item.editId) === currentRestaurantId) || null;
    const branches = restaurants.filter((item) => String(item.parentRestaurantId) === currentRestaurantId);
    const consumed = new Set([
      ...(mainRestaurant ? [String(mainRestaurant.editId)] : []),
      ...branches.map((item) => String(item.editId)),
    ]);
    const others = restaurants.filter((item) => !consumed.has(String(item.editId)));

    return [
      ...(mainRestaurant ? [{ ...mainRestaurant, isBranch: false }] : []),
      ...branches.map((item) => ({ ...item, isBranch: true })),
      ...others,
    ];
  }, [restaurants, userRole, currentRestaurantId]);
  const paginated = orderedRestaurants;

  const toggle = async (restaurant) => {
    if (!canToggleRestaurantOpenStatus) return;
    const localId = restaurant?.id;
    const apiRestaurantId = restaurant?.editId;
    if (!localId || !apiRestaurantId) return;
    if (statusUpdating[localId]) return;

    const nextStatus = !Boolean(statuses[localId]);
    setStatusError('');
    setStatuses((prev) => ({ ...prev, [localId]: nextStatus }));
    setStatusUpdating((prev) => ({ ...prev, [localId]: true }));

    try {
      const token = localStorage.getItem('token') || '';
      const requestConfig = {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      };
      const action = nextStatus ? 'open' : 'close';
      await axios.patch(`/api/restaurants/${apiRestaurantId}/${action}`, {}, requestConfig);

      setStatuses((prev) => ({ ...prev, [localId]: nextStatus }));
      setBaseStatuses((prev) => ({ ...prev, [localId]: nextStatus }));
      toast.success(`Restaurant ${nextStatus ? 'opened' : 'closed'} successfully.`);
    } catch (error) {
      setStatuses((prev) => ({ ...prev, [localId]: !nextStatus }));
      const message = axios.isAxiosError(error)
        ? error.response?.data?.message || error.message || 'Failed to update status'
        : error?.message || 'Failed to update status';
      setStatusError(message);
      toast.error(message);
    } finally {
      setStatusUpdating((prev) => ({ ...prev, [localId]: false }));
    }
  };

  const handleExport = () => {
    if (!restaurants.length) return;
    const headers = ['SI', 'Restaurant Name', 'Owner', 'Phone', 'Address', 'Cuisine', 'Status'];
    const rows = restaurants.map((r, i) => [
      (page - 1) * PER_PAGE + i + 1,
      r.name,
      r.owner,
      r.phone,
      r.address,
      r.cuisine,
      statuses[r.id] ? 'Open' : 'Close',
    ]);
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'restaurants-export.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const toggleBlockedStatus = async (restaurant) => {
    const localId = restaurant?.id;
    const apiRestaurantId = restaurant?.editId;
    if (!localId || !apiRestaurantId) return;
    if (!canManageRestaurantBlockStatus) return;
    if (blockUpdating[localId]) return;

    const nextBlocked = !Boolean(blockedStatuses[localId]);
    setStatusError('');
    setBlockedStatuses((prev) => ({ ...prev, [localId]: nextBlocked }));
    setBlockUpdating((prev) => ({ ...prev, [localId]: true }));

    try {
      const token = localStorage.getItem('token') || '';
      const requestConfig = {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      };
      const endpoint = nextBlocked
        ? `/api/restaurants/${apiRestaurantId}/block`
        : `/api/restaurants/${apiRestaurantId}/unblock`;
      await axios.patch(endpoint, {}, requestConfig);
      setBaseBlockedStatuses((prev) => ({ ...prev, [localId]: nextBlocked }));
      toast.success(`Restaurant ${nextBlocked ? 'blocked' : 'unblocked'} successfully.`);
    } catch (error) {
      setBlockedStatuses((prev) => ({ ...prev, [localId]: !nextBlocked }));
      const message = axios.isAxiosError(error)
        ? error.response?.data?.message || error.message || 'Failed to update block status'
        : error?.message || 'Failed to update block status';
      setStatusError(message);
      toast.error(message);
    } finally {
      setBlockUpdating((prev) => ({ ...prev, [localId]: false }));
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="pt-36">
          {/* ── Header ── */}
          <div className="flex items-center justify-between mb-6">
            <div />
          </div>

          {/* ── Filter Bar ── */}
          <div className="flex flex-wrap gap-3 mb-6">
        <select
          value={cuisineFilter}
          onChange={e => setCuisineFilter(e.target.value)}
          className="px-4 py-2 text-sm rounded-lg border border-gray-200 bg-white text-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-300"
        >
          <option value="">Select Cuisine</option>
          {['Italian','Arabian','Chinese','Pakistani','Sea Food','Halal','Syrian','Saudi','Turkish','Indian'].map(c => (
            <option key={c}>{c}</option>
          ))}
        </select>
          </div>

          {/* ── Stat Cards ── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        {STATS.map(s => (
          <div key={s.label} className={`${s.bg} rounded-2xl border ${s.border} p-5 flex items-start justify-between`}>
            <div>
              <p className="text-[24px] font-semibold text-[#1E1E24]">{displaySummary[s.key] ?? 0}</p>
              <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
            </div>
            <img src={s.icon} alt={s.label} className="w-6 h-6 flex-shrink-0" />
          </div>
        ))}
          </div>

          {/* ── Transaction Bar ── */}
          <div className="bg-white rounded-2xl border border-gray-100 px-6 py-4 mb-6 flex flex-wrap items-center justify-between">
        {TRANSACTIONS.map(t => (
          <div key={t.label} className="flex items-center gap-2">
            <span className={`w-2.5 h-2.5 rounded-full ${t.dot} flex-shrink-0`} />
            <span className={`text-[11px] uppercase tracking-wide font-medium ${t.color}`}>{t.label} :</span>
            <span className={`text-sm font-bold ${t.color}`}>{t.value}</span>
          </div>
        ))}
          </div>

      {/* ── Table Card ── */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        {statusError && (
          <div className="mx-6 mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
            {statusError}
          </div>
        )}

        {/* Table Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-[#1E1E24]">Restaurant List</h2>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-purple-600" />
              <input
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(1); }}
                placeholder="Search by restaurant name..."
                className="pl-4 pr-8 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-300 w-72"
              />
            </div>
            <button
              onClick={handleExport}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export</span>
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/60">
                <th className="text-left px-6 py-3 text-[12px] font-semibold text-black">SI</th>
                <th className="text-left px-4 py-3 text-[12px] font-semibold text-black">Restaurant Info</th>
                <th className="text-left px-4 py-3 text-[12px] font-semibold text-black">Owner Information</th>
                <th className="text-left px-4 py-3 text-[12px] font-semibold text-black">Address</th>
                <th className="text-left px-4 py-3 text-[12px] font-semibold text-black">Cuisine</th>
                <th className="text-left px-4 py-3 text-[12px] font-semibold text-balck">Status</th>
                <th className="text-left px-4 py-3 text-[12px] font-semibold text-black">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <TableLoadingSkeleton colSpan={7} rows={8} />
              )}

              {!loading && fetchError && (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-red-400 text-sm">
                    {fetchError}
                  </td>
                </tr>
              )}

              {!loading && !fetchError && paginated.map((r, idx) => (
                <Fragment key={`${r.id}-${idx}`}>
                {userRole === 'restaurant' && idx === 1 && r.isBranch && (
                  <tr className="border-b border-gray-100 bg-purple-50/60">
                    <td colSpan={7} className="px-6 py-2 text-[11px] font-semibold text-purple-700">
                      Branches
                    </td>
                  </tr>
                )}
                <tr
                  onClick={() => {
                    if (!r.editId) return;
                    router.push(`/dashboard/restaurants/details/${r.editId}`);
                  }}
                  className="border-b border-gray-50 hover:bg-purple-50/30 transition-colors cursor-pointer"
                >
                  {/* SI */}
                  <td className="px-6 py-3 text-gray-400 text-xs">{(page - 1) * PER_PAGE + idx + 1}</td>

                  {/* Restaurant Info */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-purple-100 overflow-hidden flex-shrink-0">
                        <img
                          src={r.image || DEFAULT_RESTAURANT_IMAGE}
                          alt={r.name}
                          className="w-full h-full object-cover"
                          onError={(event) => {
                            event.currentTarget.onerror = null;
                            event.currentTarget.src = DEFAULT_RESTAURANT_IMAGE;
                          }}
                        />
                      </div>
                      <div>
                        <p className="font-semibold text-[#1E1E24] text-xs">{r.name}</p>
                        {r.isBranch && (
                          <p className="text-[10px] text-purple-500">Branch</p>
                        )}
                        <div className="flex items-center gap-1 mt-0.5">
                          {'★★★★★'.split('').map((s, i) => (
                            <span key={i} className={`text-[10px] ${i < Math.round(r.rating || 0) ? 'text-amber-400' : 'text-gray-300'}`}>★</span>
                          ))}
                          <span className="text-[10px] text-gray-400">({r.reviews})</span>
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Owner */}
                  <td className="px-4 py-3">
                    <p className="text-xs font-medium text-[#1E1E24]">{r.owner}</p>
                    <p className="text-[10px] text-gray-400">{r.phone}</p>
                  </td>

                  {/* Address */}
                  <td className="px-4 py-3 text-xs text-gray-600">
                    <span title={r.address} className="block max-w-[260px] truncate">
                      {r.addressShort || r.address}
                    </span>
                  </td>

                  {/* Cuisine */}
                  <td className="px-4 py-3">
                    <span className={`inline-flex whitespace-nowrap text-xs px-2.5 py-1 rounded-full font-medium ${
                      r.cuisine === 'Cuisine not found'
                        ? 'bg-gray-100 text-gray-400'
                        : 'bg-purple-50 text-purple-700'
                    }`}>
                      {r.cuisine}
                    </span>
                  </td>

                  {/* Status Toggle (text-based) */}
                  <td className="px-4 py-3">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggle(r);
                      }}
                      type="button"
                      role="button"
                      aria-pressed={Boolean(statuses[r.id])}
                      disabled={!canToggleRestaurantOpenStatus || Boolean(statusUpdating[r.id]) || !r.editId}
                      data-state={statuses[r.id] ? 'checked' : 'unchecked'}
                      className={`inline-flex w-[72px] justify-center whitespace-nowrap rounded-full px-2.5 py-1 text-xs !font-medium !normal-case !tracking-normal transition-colors outline-none focus-visible:ring-2 focus-visible:ring-purple-400 focus-visible:ring-offset-2 disabled:cursor-not-allowed ${
                        statuses[r.id]
                          ? 'bg-green-50 text-green-500'
                          : 'bg-red-50 text-red-400'
                      }`}
                      title={canToggleRestaurantOpenStatus ? 'Toggle open/close status' : 'Only restaurant role can change open/close'}
                    >
                      {statuses[r.id] ? 'Open' : 'Close'}
                    </button>
                  </td>

                  {/* Actions */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5 whitespace-nowrap">
                      {canManageRestaurantBlockStatus && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleBlockedStatus(r);
                          }}
                          type="button"
                          disabled={Boolean(blockUpdating[r.id]) || !r.editId}
                          className={`inline-flex w-[72px] justify-center whitespace-nowrap rounded-full px-2.5 py-1 text-xs !font-medium !normal-case !tracking-normal transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                            blockedStatuses[r.id]
                              ? 'bg-green-50 text-green-500 hover:bg-green-100'
                              : 'bg-red-50 text-red-400 hover:bg-red-100'
                          }`}
                          title={blockedStatuses[r.id] ? 'Unblock restaurant' : 'Block restaurant'}
                        >
                          {blockedStatuses[r.id] ? 'Unblock' : 'Block'}
                        </button>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (!r.editId) return;
                          router.push(`/dashboard/restaurants/details/${r.editId}`);
                        }}
                        disabled={!r.editId}
                        className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center text-blue-500 hover:bg-blue-100 transition disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        <Eye size={13} />
                      </button>
                      {canEditRestaurant && !r.isBranch && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (!r.editId) return;
                            router.push(`/dashboard/restaurants/add?restaurant_id=${r.editId}`);
                          }}
                          title="Edit restaurant"
                          disabled={!r.editId}
                          className="w-7 h-7 rounded-lg bg-amber-50 flex items-center justify-center text-amber-500 hover:bg-amber-100 transition disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          <Edit2 size={13} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
                </Fragment>
              ))}

              {!loading && !fetchError && paginated.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-gray-400 text-sm">
                    No restaurants found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
            </div>

        {/* Pagination */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100">
          <p className="text-xs text-gray-400">
            Showing {totalCount === 0 ? 0 : (page - 1) * PER_PAGE + 1}–{Math.min(page * PER_PAGE, totalCount)} of {totalCount} results
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center text-gray-500 hover:border-purple-400 disabled:opacity-40"
            >
              <ChevronLeft size={14} />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(n => (
              <button
                key={n}
                onClick={() => setPage(n)}
                className={`w-8 h-8 rounded-lg text-xs font-semibold transition-colors ${
                  n === page
                    ? 'bg-purple-600 text-white border border-purple-600'
                    : 'border border-gray-200 text-gray-500 hover:border-purple-400'
                }`}
              >
                {n}
              </button>
            ))}
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center text-gray-500 hover:border-purple-400 disabled:opacity-40"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}

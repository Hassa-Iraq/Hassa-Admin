'use client'
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { API_BASE_URL } from '@/app/config';
import { formatPhoneWithFlag } from '@/app/lib/phone';
import {
  Search, Download,
  CreditCard, TrendingUp, ArrowDownLeft,
  Eye, Edit2,
  ChevronLeft, ChevronRight
} from 'lucide-react';

const PER_PAGE = 20;
const DEFAULT_RESTAURANT_IMAGE = '/default-image.svg';

const STATS = [
  { key: 'total', label: 'Total Restaurants',        icon: '/images/mdi.png',    bg: 'bg-[#F3EAFF]', border: 'border-[#6001D2]' },
  { key: 'active', label: 'Active Restaurants',       icon: '/images/location.png',   bg: 'bg-[#E6FFF5]', border: 'border-[#00C49A]' },
  { key: 'inactive', label: 'Inactive Restaurants',     icon: '/images/food-inactive.png', bg: 'bg-[#FFF0F0]', border: 'border-[#FF6B6B]' },
  { key: 'newlyJoined', label: 'Newly joined Restaurants', icon: '/images/food.png',         bg: 'bg-[#FFF7E6]', border: 'border-[#FF9F43]' },
];

const TRANSACTIONS = [
  { label: 'Total Transactions',           value: '$5',         icon: CreditCard,    color: 'text-[#6001D2]', dot: 'bg-[#6001D2]' },
  { label: 'Commission Earned',            value: '$ 12,546',   icon: TrendingUp,    color: 'text-[#00C49A]', dot: 'bg-[#00C49A]' },
  { label: 'Total Restaurant Withdraws',   value: '$ 12546.34', icon: ArrowDownLeft, color: 'text-[#FF6B6B]', dot: 'bg-[#FF6B6B]' },
];

// ─── component ────────────────────────────────────────────────────────────────
export default function RestaurantListPage() {
  const router = useRouter();
  const [userRole, setUserRole] = useState('');
  const canEditRestaurant = ['admin', 'super_admin', 'superadmin', 'restaurant'].includes(userRole);
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
  const [statusError, setStatusError] = useState('');
  const [page, setPage] = useState(1);
  const [cuisineFilter, setCuisineFilter] = useState('');
  const [radiusFilter, setRadiusFilter]   = useState('');
  const [modelFilter, setModelFilter]     = useState('');

  useEffect(() => {
    try {
      const role = localStorage.getItem('userRole') || '';
      setUserRole(String(role).trim().toLowerCase());
    } catch {
      setUserRole('');
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

      return {
        id: editId || `${page}-${index}`,
        editId: editId || '',
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
        phone: formatPhoneWithFlag(formatPhone(rawPhone, countryCode), countryCode),
        radius: item?.radius || item?.delivery_time || item?.zone || '-',
        cuisine:
          (typeof item?.cuisine === 'string' && item.cuisine.trim()) ||
          item?.cuisine?.name ||
          item?.cuisine_name ||
          'Cuisine not found',
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
        if (modelFilter) params.set('business_model', modelFilter);
        if (cuisineFilter) params.set('cuisine', cuisineFilter);
        if (radiusFilter) params.set('radius', radiusFilter);

        const { data } = await axios.get(`/api/restaurants?${params.toString()}`);

        const list =
          data?.data?.restaurants ||
          data?.data?.list ||
          data?.restaurants ||
          data?.list ||
          data?.data ||
          [];

        const normalized = (Array.isArray(list) ? list : []).map(normalizeRestaurant);
        setRestaurants(normalized);

        const toNumber = (value, fallback = null) => {
          const n = Number(value);
          return Number.isFinite(n) ? n : fallback;
        };

        const total =
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
  }, [page, search, modelFilter, cuisineFilter, radiusFilter]);

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
  const paginated = restaurants;

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
    } catch (error) {
      setStatuses((prev) => ({ ...prev, [localId]: !nextStatus }));
      const message = axios.isAxiosError(error)
        ? error.response?.data?.message || error.message || 'Failed to update status'
        : error?.message || 'Failed to update status';
      setStatusError(message);
    } finally {
      setStatusUpdating((prev) => ({ ...prev, [localId]: false }));
    }
  };

  const handleExport = () => {
    if (!restaurants.length) return;
    const headers = ['SI', 'Restaurant Name', 'Owner', 'Phone', 'Radius', 'Cuisine', 'Status'];
    const rows = restaurants.map((r, i) => [
      (page - 1) * PER_PAGE + i + 1, r.name, r.owner, r.phone, r.radius, r.cuisine, statuses[r.id] ? 'Active' : 'Inactive',
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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="pt-36">
          {/* ── Header ── */}
          <div className="flex items-center justify-between mb-6">
            <div />
          </div>

          {/* ── Filter Bar ── */}
          <div className="flex flex-wrap gap-3 mb-6">
        {[
          { label: 'All', value: '', setter: setModelFilter,  state: modelFilter },
        ].map(f => (
          <button
            key={f.label}
            onClick={() => f.setter('')}
            className="px-4 py-2 text-sm rounded-lg border border-gray-200 bg-white text-gray-600 hover:border-purple-400 transition"
          >
            All ▾
          </button>
        ))}
        <select
          value={modelFilter}
          onChange={e => setModelFilter(e.target.value)}
          className="px-4 py-2 text-sm rounded-lg border border-gray-200 bg-white text-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-300"
        >
          <option value="">Business Model</option>
          <option>Dine-in</option>
          <option>Delivery</option>
          <option>Takeaway</option>
        </select>
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
        <select
          value={radiusFilter}
          onChange={e => setRadiusFilter(e.target.value)}
          className="px-4 py-2 text-sm rounded-lg border border-gray-200 bg-white text-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-300"
        >
          <option value="">Select Radius</option>
          <option>5 km</option>
          <option>All over the world</option>
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
        <div className="overflow-x-auto overflow-y-auto max-h-[52vh]">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/60">
                <th className="text-left px-6 py-3 text-[12px] font-semibold text-black">SI</th>
                <th className="text-left px-4 py-3 text-[12px] font-semibold text-black">Restaurant Info</th>
                <th className="text-left px-4 py-3 text-[12px] font-semibold text-black">Owner Information</th>
                <th className="text-left px-4 py-3 text-[12px] font-semibold text-black">Radius</th>
                <th className="text-left px-4 py-3 text-[12px] font-semibold text-black">Cuisine</th>
                <th className="text-left px-4 py-3 text-[12px] font-semibold text-balck">Status</th>
                <th className="text-left px-4 py-3 text-[12px] font-semibold text-black">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-gray-400 text-sm">
                    Loading restaurants...
                  </td>
                </tr>
              )}

              {!loading && fetchError && (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-red-400 text-sm">
                    {fetchError}
                  </td>
                </tr>
              )}

              {!loading && !fetchError && paginated.map((r, idx) => (
                <tr
                  key={r.id}
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

                  {/* Radius */}
                  <td className="px-4 py-3 text-xs text-gray-600">{r.radius}</td>

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

                  {/* Status Toggle (view-only for admin roles) */}
                  <td className="px-4 py-3">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggle(r);
                      }}
                      type="button"
                      role="switch"
                      aria-checked={Boolean(statuses[r.id])}
                      disabled={!canToggleRestaurantOpenStatus || Boolean(statusUpdating[r.id]) || !r.editId}
                      data-state={statuses[r.id] ? 'checked' : 'unchecked'}
                      className="peer inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors outline-none focus-visible:ring-2 focus-visible:ring-purple-400 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 data-[state=checked]:bg-[#7C3AED] data-[state=unchecked]:bg-gray-200"
                      title={canToggleRestaurantOpenStatus ? 'Toggle open/close status' : 'Only restaurant role can change open/close'}
                    >
                      <span
                        data-state={statuses[r.id] ? 'checked' : 'unchecked'}
                        className="pointer-events-none block h-4 w-4 rounded-full bg-white shadow transition-transform data-[state=checked]:translate-x-4 data-[state=unchecked]:translate-x-0"
                      />
                    </button>
                  </td>

                  {/* Actions */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
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
                      {canEditRestaurant && (
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

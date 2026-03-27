'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { toast } from 'sonner';
import { API_BASE_URL } from '@/app/config';

const PER_PAGE = 20;

const toAbsoluteAssetUrl = (value) => {
  if (!value || typeof value !== 'string') return '';
  const trimmed = value.trim();
  if (!trimmed) return '';
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed;
  if (trimmed.startsWith('//')) return `https:${trimmed}`;
  if (trimmed.startsWith('/')) return `${API_BASE_URL}${trimmed}`;
  return `${API_BASE_URL}/${trimmed}`;
};

export default function AdminBannerListPage() {
  const router = useRouter();
  const [isAllowed, setIsAllowed] = useState(false);
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [statusFilter, setStatusFilter] = useState('');
  const [restaurantIdFilter, setRestaurantIdFilter] = useState('');

  const [restaurants, setRestaurants] = useState([]);
  const [loadingRestaurants, setLoadingRestaurants] = useState(false);
  const [restaurantMenuOpen, setRestaurantMenuOpen] = useState(false);
  const restaurantMenuRef = useRef(null);

  useEffect(() => {
    const role = String(localStorage.getItem('userRole') || '').trim().toLowerCase();
    const isRestaurantRole = ['restaurant', 'resturant', 'restaurant_admin', 'vendor'].includes(role);
    if (isRestaurantRole) {
      setIsAllowed(false);
      toast.error('Restaurant role cannot access admin banner list.');
      router.push('/dashboard/banners/list');
      return;
    }
    setIsAllowed(true);
  }, [router]);

  useEffect(() => {
    if (!isAllowed) return;
    const loadRestaurants = async () => {
      setLoadingRestaurants(true);
      try {
        const token = localStorage.getItem('token') || '';
        const params = new URLSearchParams({ page: '1', limit: '500' });
        const { data } = await axios.get(`/api/restaurants?${params.toString()}`, {
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });
        const payload = data?.data && typeof data.data === 'object' ? data.data : data;
        const list =
          payload?.restaurants ||
          payload?.list ||
          data?.restaurants ||
          data?.list ||
          [];
        const normalized = (Array.isArray(list) ? list : []).map((item) => {
          const id = String(item?.id ?? item?.restaurant_id ?? '').trim();
          const name = String(item?.name || item?.restaurant_name || 'Restaurant').trim();
          const rawImg =
            item?.logo_url ||
            item?.logo ||
            item?.logo_full_url ||
            item?.cover_image_url ||
            item?.image ||
            '';
          return {
            id,
            name,
            image: toAbsoluteAssetUrl(rawImg),
          };
        }).filter((r) => r.id);
        setRestaurants(normalized);
      } catch {
        setRestaurants([]);
      } finally {
        setLoadingRestaurants(false);
      }
    };
    loadRestaurants();
  }, [isAllowed]);

  useEffect(() => {
    const onDocClick = (e) => {
      if (!restaurantMenuRef.current?.contains(e.target)) setRestaurantMenuOpen(false);
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  useEffect(() => {
    if (!isAllowed) return;
    const fetchBanners = async () => {
      setLoading(true);
      setError('');
      try {
        const token = localStorage.getItem('token') || '';
        const params = new URLSearchParams({
          page: String(page),
          limit: String(PER_PAGE),
        });
        if (statusFilter) params.set('status', statusFilter);
        if (restaurantIdFilter.trim()) params.set('restaurant_id', restaurantIdFilter.trim());

        const { data } = await axios.get(`/api/restaurants/admin/banners?${params.toString()}`, {
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });

        const payload = data?.data && typeof data.data === 'object' ? data.data : data;
        const list = payload?.banners || payload?.list || data?.banners || data?.list || [];
        const normalized = (Array.isArray(list) ? list : []).map((item, index) => ({
          id: item?.id || item?.banner_id || `banner-${page}-${index}`,
          bannerName: item?.banner_name || item?.name || 'N/A',
          restaurantName: item?.restaurant_name || 'N/A',
          restaurantId: item?.restaurant_id || '',
          bannerImage: item?.banner_image_url || item?.image_url || item?.image || '',
          description: item?.description || '',
          status: item?.status || 'pending',
          isPublic: Boolean(item?.is_public),
        }));
        setBanners(normalized);

        const meta = payload?.pagination || data?.pagination || {};
        const parsedTotal = Number(meta?.total ?? normalized.length);
        const parsedTotalPages = Number(meta?.totalPages ?? 1);
        setTotal(Number.isFinite(parsedTotal) ? parsedTotal : normalized.length);
        setTotalPages(Number.isFinite(parsedTotalPages) ? parsedTotalPages : 1);
      } catch (err) {
        setBanners([]);
        setTotal(0);
        setTotalPages(1);
        setError(
          axios.isAxiosError(err)
            ? err.response?.data?.message || err.message || 'Failed to load admin banners.'
            : err?.message || 'Failed to load admin banners.'
        );
      } finally {
        setLoading(false);
      }
    };

    fetchBanners();
  }, [isAllowed, page, statusFilter, restaurantIdFilter]);

  const selectedRestaurant = useMemo(
    () => restaurants.find((r) => r.id === restaurantIdFilter) || null,
    [restaurants, restaurantIdFilter]
  );

  const pickRestaurant = (id) => {
    setRestaurantIdFilter(id);
    setPage(1);
    setRestaurantMenuOpen(false);
  };

  return (
    <div className="pt-36 pb-8">
      {!isAllowed ? null : (
        <div className="rounded-xl border border-gray-200 bg-white">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 p-3">
            <h2 className="text-base font-semibold text-[#1E1E24]">Admin List Banners</h2>
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-gray-700 focus:border-[#7C3AED] focus:outline-none"
              >
                <option value="">All status</option>
                <option value="requested">requested</option>
                <option value="pending">pending</option>
                <option value="approved">approved</option>
                <option value="rejected">rejected</option>
              </select>

              <div className="relative min-w-[220px]" ref={restaurantMenuRef}>
                <button
                  type="button"
                  onClick={() => setRestaurantMenuOpen((o) => !o)}
                  className="flex w-full items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-left text-xs text-gray-700 hover:border-[#7C3AED] focus:outline-none"
                >
                  {selectedRestaurant ? (
                    <>
                      <div className="h-8 w-8 flex-shrink-0 overflow-hidden rounded-md bg-purple-100">
                        {selectedRestaurant.image ? (
                          <img
                            src={selectedRestaurant.image}
                            alt=""
                            className="h-full w-full object-cover"
                            onError={(e) => { e.currentTarget.style.visibility = 'hidden'; }}
                          />
                        ) : null}
                      </div>
                      <span className="min-w-0 flex-1 truncate font-medium">{selectedRestaurant.name}</span>
                    </>
                  ) : (
                    <span className="flex-1 text-gray-500">
                      {loadingRestaurants ? 'Loading restaurants...' : 'All restaurants'}
                    </span>
                  )}
                  <ChevronDown size={16} className="flex-shrink-0 text-gray-400" />
                </button>
                {restaurantMenuOpen && (
                  <div className="absolute right-0 z-50 mt-1 max-h-64 w-full min-w-[260px] overflow-auto rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
                    <button
                      type="button"
                      onClick={() => pickRestaurant('')}
                      className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs hover:bg-purple-50"
                    >
                      <span className="font-medium text-[#1E1E24]">All restaurants</span>
                    </button>
                    {restaurants.map((r) => (
                      <button
                        key={r.id}
                        type="button"
                        onClick={() => pickRestaurant(r.id)}
                        className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs hover:bg-purple-50"
                      >
                        <div className="h-8 w-8 flex-shrink-0 overflow-hidden rounded-md bg-purple-100">
                          {r.image ? (
                            <img src={r.image} alt="" className="h-full w-full object-cover" onError={(e) => { e.currentTarget.style.visibility = 'hidden'; }} />
                          ) : null}
                        </div>
                        <span className="min-w-0 flex-1 truncate font-medium text-[#1E1E24]">{r.name}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {loading && <p className="p-4 text-xs text-gray-500">Loading banners...</p>}
          {!loading && error && <p className="p-4 text-xs text-red-500">{error}</p>}

          {!loading && !error && (
            <>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[960px] table-fixed text-sm">
                  <colgroup>
                    <col className="w-14" />
                    <col />
                    <col className="w-[22%]" />
                    <col className="w-[11%]" />
                    <col className="w-[9%]" />
                    <col className="w-[132px]" />
                  </colgroup>
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50/70">
                      <th className="px-4 py-3 text-left text-[11px] font-semibold text-[#1E1E24]">SI</th>
                      <th className="px-4 py-3 text-left text-[11px] font-semibold text-[#1E1E24]">Banner</th>
                      <th className="px-4 py-3 text-left text-[11px] font-semibold text-[#1E1E24]">Restaurant</th>
                      <th className="px-4 py-3 text-left text-[11px] font-semibold text-[#1E1E24]">Status</th>
                      <th className="px-4 py-3 text-left text-[11px] font-semibold text-[#1E1E24]">Public</th>
                      <th className="px-4 py-3 text-center text-[11px] font-semibold text-[#1E1E24]">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {banners.map((item, index) => (
                      <tr key={item.id} className="border-b border-gray-100 last:border-b-0">
                        <td className="px-4 py-3 text-xs text-gray-500">{(page - 1) * PER_PAGE + index + 1}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="h-12 w-16 flex-shrink-0 overflow-hidden rounded-md bg-purple-100">
                              {item.bannerImage ? (
                                <img src={item.bannerImage} alt={item.bannerName} className="h-full w-full object-cover" />
                              ) : null}
                            </div>
                            <div className="min-w-0">
                              <p className="truncate text-xs font-semibold text-[#1E1E24]">{item.bannerName}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-xs text-[#1E1E24]">{item.restaurantName}</td>
                        <td className="px-4 py-3 text-xs text-[#1E1E24]">{item.status}</td>
                        <td className="px-4 py-3 text-xs text-[#1E1E24]">{item.isPublic ? 'Yes' : 'No'}</td>
                        <td className="px-4 py-3 text-center align-middle">
                          <button
                            type="button"
                            onClick={() => router.push(`/dashboard/banners/status?banner_id=${encodeURIComponent(item.id)}`)}
                            className="inline-flex rounded-md border border-[#E9D5FF] bg-[#FAF5FF] px-3 py-1.5 text-[11px] font-semibold text-[#7C3AED]"
                          >
                            Moderate
                          </button>
                        </td>
                      </tr>
                    ))}

                    {banners.length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-4 py-8 text-center text-sm text-gray-400">
                          No banners found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="flex items-center justify-between border-t border-gray-200 px-4 py-3">
                <p className="text-xs text-gray-400">
                  Showing {total === 0 ? 0 : (page - 1) * PER_PAGE + 1}-{Math.min(page * PER_PAGE, total)} of {total}
                </p>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                    disabled={page === 1}
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:border-[#7C3AED] disabled:opacity-40"
                  >
                    <ChevronLeft size={14} />
                  </button>
                  <span className="px-2 text-xs font-semibold text-[#1E1E24]">{page} / {Math.max(1, totalPages)}</span>
                  <button
                    type="button"
                    onClick={() => setPage((prev) => Math.min(Math.max(1, totalPages), prev + 1))}
                    disabled={page >= Math.max(1, totalPages)}
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:border-[#7C3AED] disabled:opacity-40"
                  >
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

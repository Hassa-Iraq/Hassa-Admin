'use client';

import { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Search } from 'lucide-react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { toast } from 'sonner';

const PER_PAGE = 20;

export default function PublicBannersPage() {
  const router = useRouter();
  const [isAllowed, setIsAllowed] = useState(false);
  const [banners, setBanners] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: PER_PAGE,
    total: 0,
    totalPages: 1,
  });
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const role = String(localStorage.getItem('userRole') || '').trim().toLowerCase();
    const isAdminRole =
      role === 'admin' || role === 'super_admin' || role === 'superadmin';
    setIsAllowed(isAdminRole);
    if (!isAdminRole) {
      toast.error('Only administrators can access the public advertisements list.');
      const isRestaurantRole = ['restaurant', 'resturant', 'restaurant_admin', 'vendor'].includes(role);
      router.push(isRestaurantRole ? '/dashboard/banners/list' : '/dashboard');
    }
  }, [router]);

  useEffect(() => {
    if (!isAllowed) return;
    const fetchPublicBanners = async () => {
      setLoading(true);
      setError('');
      try {
        const params = new URLSearchParams({
          page: String(page),
          limit: String(PER_PAGE),
        });
        const { data } = await axios.get(`/api/restaurants/public/banners?${params.toString()}`);
        const payload = data?.data && typeof data.data === 'object' ? data.data : data;
        const list = payload?.banners || payload?.list || data?.banners || data?.list || [];
        const normalized = (Array.isArray(list) ? list : []).map((item, index) => ({
          id: item?.id || `banner-${page}-${index}`,
          bannerName: item?.banner_name || item?.name || 'N/A',
          restaurantName: item?.restaurant_name || 'N/A',
          bannerImage: item?.banner_image_url || item?.image_url || item?.image || '',
          description: item?.description || '',
          status: item?.status || 'pending',
          isPublic: Boolean(item?.is_public),
          validFrom: item?.valid_from || '',
          validTo: item?.valid_to || '',
        }));
        setBanners(normalized);

        const pageMeta = payload?.pagination || data?.pagination || {};
        const total = Number(pageMeta?.total ?? normalized.length);
        const totalPages = Number(pageMeta?.totalPages ?? Math.max(1, Math.ceil(total / PER_PAGE)));
        setPagination({
          page: Number(pageMeta?.page ?? page),
          limit: Number(pageMeta?.limit ?? PER_PAGE),
          total: Number.isFinite(total) ? total : normalized.length,
          totalPages: Number.isFinite(totalPages) ? totalPages : 1,
        });
      } catch (err) {
        setBanners([]);
        setPagination({
          page: 1,
          limit: PER_PAGE,
          total: 0,
          totalPages: 1,
        });
        setError(
          axios.isAxiosError(err)
            ? err.response?.data?.message || err.message || 'Failed to load public advertisements.'
            : err?.message || 'Failed to load public advertisements.'
        );
      } finally {
        setLoading(false);
      }
    };

    fetchPublicBanners();
  }, [isAllowed, page]);

  const formatDate = (value) => {
    if (!value) return '-';
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return '-';
    return parsed.toLocaleDateString();
  };

  const filteredBanners = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return banners;
    return banners.filter((item) =>
      item.bannerName.toLowerCase().includes(query) ||
      item.restaurantName.toLowerCase().includes(query) ||
      item.description.toLowerCase().includes(query)
    );
  }, [search, banners]);

  return (
    <div className="pt-36 pb-8">
      {!isAllowed ? null : (
      <div className="rounded-xl border border-gray-200 bg-white">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 p-3">
          <h2 className="text-base font-semibold text-[#1E1E24]">Public advertisements</h2>
          <div className="relative w-full max-w-[320px]">
            <Search size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7C3AED]" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search advertisements..."
              className="w-full rounded-lg border border-gray-200 py-2 pl-3 pr-8 text-xs text-gray-700 placeholder:text-gray-400 focus:border-[#7C3AED] focus:outline-none"
            />
          </div>
        </div>

        {loading && <p className="p-4 text-xs text-gray-500">Loading advertisements...</p>}
        {!loading && error && <p className="p-4 text-xs text-red-500">{error}</p>}

        {!loading && !error && (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[980px] text-sm">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50/70">
                    <th className="px-4 py-3 text-left text-[11px] font-semibold text-[#1E1E24]">SI</th>
                    <th className="px-3 py-3 text-left text-[11px] font-semibold text-[#1E1E24]">Advertisement</th>
                    <th className="px-3 py-3 text-left text-[11px] font-semibold text-[#1E1E24]">Restaurant</th>
                    <th className="px-3 py-3 text-left text-[11px] font-semibold text-[#1E1E24]">Description</th>
                    <th className="px-3 py-3 text-left text-[11px] font-semibold text-[#1E1E24]">Status</th>
                    <th className="px-3 py-3 text-left text-[11px] font-semibold text-[#1E1E24]">Public</th>
                    <th className="px-3 py-3 text-left text-[11px] font-semibold text-[#1E1E24]">Validity</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBanners.map((item, index) => (
                    <tr key={item.id} className="border-b border-gray-100 last:border-b-0">
                      <td className="px-4 py-3 text-xs text-gray-500">{(page - 1) * PER_PAGE + index + 1}</td>
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-3">
                          <div className="h-12 w-16 overflow-hidden rounded-md bg-purple-100">
                            {item.bannerImage ? (
                              <img src={item.bannerImage} alt={item.bannerName} className="h-full w-full object-cover" />
                            ) : null}
                          </div>
                          <p className="text-xs font-semibold text-[#1E1E24]">{item.bannerName}</p>
                        </div>
                      </td>
                      <td className="px-3 py-3 text-xs text-[#1E1E24]">{item.restaurantName}</td>
                      <td className="px-3 py-3 text-xs text-gray-600">
                        <p className="max-w-[280px] truncate">{item.description || '-'}</p>
                      </td>
                      <td className="px-3 py-3">
                        <span
                          className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                            item.status === 'approved'
                              ? 'bg-green-50 text-green-600'
                              : item.status === 'rejected'
                                ? 'bg-red-50 text-red-500'
                                : 'bg-amber-50 text-amber-600'
                          }`}
                        >
                          {item.status}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-xs text-[#1E1E24]">{item.isPublic ? 'Yes' : 'No'}</td>
                      <td className="px-3 py-3 text-xs text-gray-600">
                        {formatDate(item.validFrom)} - {formatDate(item.validTo)}
                      </td>
                    </tr>
                  ))}

                  {filteredBanners.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center text-sm text-gray-400">
                        No public advertisements found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between border-t border-gray-200 px-4 py-3">
              <p className="text-xs text-gray-400">
                Showing {pagination.total === 0 ? 0 : (page - 1) * PER_PAGE + 1}-{Math.min(page * PER_PAGE, pagination.total)} of {pagination.total}
              </p>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                  disabled={page === 1}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:border-[#7C3AED] disabled:opacity-40"
                >
                  <ChevronLeft size={14} />
                </button>
                <span className="px-2 text-xs font-semibold text-[#1E1E24]">{page} / {Math.max(1, pagination.totalPages)}</span>
                <button
                  onClick={() => setPage((prev) => Math.min(Math.max(1, pagination.totalPages), prev + 1))}
                  disabled={page >= Math.max(1, pagination.totalPages)}
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

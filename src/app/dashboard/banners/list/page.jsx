'use client';

import { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Search, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { API_BASE_URL } from '@/app/config';
import { toast } from 'sonner';
import TableLoadingSkeleton from '@/app/components/TableLoadingSkeleton';

const PER_PAGE = 20;

export default function BannerListPage() {
  const router = useRouter();
  const [isAllowed, setIsAllowed] = useState(false);
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState('');
  const [fetchError, setFetchError] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    const role = String(localStorage.getItem('userRole') || '').trim().toLowerCase();
    const isRestaurantRole = ['restaurant', 'resturant', 'restaurant_admin', 'vendor'].includes(role);
    setIsAllowed(isRestaurantRole);
    if (!isRestaurantRole) {
      toast.error('Only restaurant role can access banner list.');
      router.push('/dashboard/banners/status');
    }
  }, [router]);

  useEffect(() => {
    if (!isAllowed) return;
    const toAbsoluteAssetUrl = (value) => {
      if (!value || typeof value !== 'string') return '';
      const trimmed = value.trim();
      if (!trimmed) return '';
      if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed;
      if (trimmed.startsWith('//')) return `https:${trimmed}`;
      if (trimmed.startsWith('/')) return `${API_BASE_URL}${trimmed}`;
      return `${API_BASE_URL}/${trimmed}`;
    };

    const fetchBanners = async () => {
      setLoading(true);
      setFetchError('');
      try {
        const token = localStorage.getItem('token') || '';
        const restaurantId =
          localStorage.getItem('restaurant_id') ||
          localStorage.getItem('selectedRestaurantId') ||
          '';
        if (!restaurantId) {
          setBanners([]);
          setTotalCount(0);
          setFetchError('Restaurant ID not found. Please login/select restaurant.');
          return;
        }

        const params = new URLSearchParams({
          page: String(page),
          limit: String(PER_PAGE),
          restaurant_id: String(restaurantId).trim(),
        });
        const { data } = await axios.get(`/api/restaurants/banners?${params.toString()}`, {
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });

        const payload =
          data?.data && typeof data.data === 'object'
            ? data.data
            : data;
        const list =
          payload?.banners ||
          payload?.list ||
          data?.banners ||
          data?.list ||
          [];

        const normalized = (Array.isArray(list) ? list : []).map((item, index) => ({
          id: item?.id || item?.banner_id || `${page}-${index}`,
          name: item?.banner_name || item?.name || 'N/A',
          description: item?.description || '',
          image: toAbsoluteAssetUrl(
            item?.banner_image_url || item?.image_url || item?.image || ''
          ),
          status: item?.status || 'pending',
          isPublic: Boolean(item?.is_public),
          validFrom: item?.valid_from || '',
          validTo: item?.valid_to || '',
        }));
        setBanners(normalized);

        const total =
          payload?.pagination?.total ??
          payload?.total ??
          data?.total ??
          normalized.length;
        const parsedTotal = Number(total);
        setTotalCount(Number.isFinite(parsedTotal) ? parsedTotal : normalized.length);
      } catch (error) {
        setBanners([]);
        setTotalCount(0);
        setFetchError(
          axios.isAxiosError(error)
            ? error.response?.data?.message || error.message || 'Failed to load banners'
            : error?.message || 'Failed to load banners'
        );
      } finally {
        setLoading(false);
      }
    };

    fetchBanners();
  }, [page, isAllowed]);

  const filteredBanners = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return banners;
    return banners.filter((item) =>
      item.name.toLowerCase().includes(query) || item.description.toLowerCase().includes(query)
    );
  }, [banners, search]);

  const totalPages = Math.max(1, Math.ceil(totalCount / PER_PAGE));

  const handleDelete = async (bannerId) => {
    if (!bannerId) return;
    try {
      setDeletingId(String(bannerId));
      const token = localStorage.getItem('token') || '';
      await axios.delete(`/api/restaurants/banners/${bannerId}`, {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      setBanners((prev) => prev.filter((item) => String(item.id) !== String(bannerId)));
      setTotalCount((prev) => Math.max(0, prev - 1));
      toast.success('Banner deleted successfully.');
    } catch (error) {
      toast.error(
        axios.isAxiosError(error)
          ? error.response?.data?.message || error.message || 'Failed to delete banner.'
          : error?.message || 'Failed to delete banner.'
      );
    } finally {
      setDeletingId('');
    }
  };

  return (
    <div className="pt-36 pb-8">
      {!isAllowed ? null : (
      <div className="rounded-xl border border-gray-200 bg-white">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 p-3">
          <div className="relative w-full max-w-[360px]">
            <Search size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7C3AED]" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search banner..."
              className="w-full rounded-lg border border-gray-200 py-2 pl-3 pr-8 text-xs text-gray-700 placeholder:text-gray-400 focus:border-[#7C3AED] focus:outline-none"
            />
          </div>

          <Link href="/dashboard/banners/add">
            <button className="rounded-lg bg-[#7C3AED] px-4 py-2 text-xs font-semibold text-white hover:bg-[#6D28D9]">
              Create Banner
            </button>
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[920px] text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50/70">
                <th className="px-4 py-3 text-left text-[11px] font-semibold text-[#1E1E24]">SI</th>
                <th className="px-3 py-3 text-left text-[11px] font-semibold text-[#1E1E24]">Image</th>
                <th className="px-3 py-3 text-left text-[11px] font-semibold text-[#1E1E24]">Banner Name</th>
                <th className="px-3 py-3 text-left text-[11px] font-semibold text-[#1E1E24]">Status</th>
                <th className="px-3 py-3 text-left text-[11px] font-semibold text-[#1E1E24]">Public</th>
                <th className="px-3 py-3 text-left text-[11px] font-semibold text-[#1E1E24]">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading && <TableLoadingSkeleton colSpan={6} rows={8} />}
              {!loading && fetchError && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-sm text-red-500">{fetchError}</td>
                </tr>
              )}
              {!loading && !fetchError && filteredBanners.map((item, index) => (
                <tr key={item.id} className="border-b border-gray-100 last:border-b-0">
                  <td className="px-4 py-3 text-xs text-gray-500">{(page - 1) * PER_PAGE + index + 1}</td>
                  <td className="px-3 py-3">
                    <div className="h-10 w-16 overflow-hidden rounded-md bg-purple-100">
                      {item.image ? (
                        <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
                      ) : null}
                    </div>
                  </td>
                  <td className="px-3 py-3 text-xs text-[#1E1E24]">{item.name}</td>
                  <td className="px-3 py-3 text-xs text-[#1E1E24]">{item.status}</td>
                  <td className="px-3 py-3 text-xs text-[#1E1E24]">{item.isPublic ? 'Yes' : 'No'}</td>
                  <td className="px-3 py-3">
                    <button
                      type="button"
                      onClick={() => handleDelete(item.id)}
                      disabled={deletingId === String(item.id)}
                      className="flex h-6 w-6 items-center justify-center rounded-md border border-[#FECACA] bg-[#FEF2F2] text-[#EF4444] disabled:cursor-not-allowed disabled:opacity-60"
                      aria-label="Delete banner"
                    >
                      <Trash2 size={12} />
                    </button>
                  </td>
                </tr>
              ))}
              {!loading && !fetchError && filteredBanners.length === 0 && (
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
            Showing {totalCount === 0 ? 0 : (page - 1) * PER_PAGE + 1}-{Math.min(page * PER_PAGE, totalCount)} of {totalCount}
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage((prev) => Math.max(1, prev - 1))}
              disabled={page === 1}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:border-[#7C3AED] disabled:opacity-40"
            >
              <ChevronLeft size={14} />
            </button>
            <span className="px-2 text-xs font-semibold text-[#1E1E24]">{page} / {totalPages}</span>
            <button
              onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
              disabled={page === totalPages}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:border-[#7C3AED] disabled:opacity-40"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>
      )}
    </div>
  );
}

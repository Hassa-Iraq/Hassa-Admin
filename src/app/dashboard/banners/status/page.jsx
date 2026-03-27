'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { toast } from 'sonner';

const INITIAL_FORM = {
  bannerId: '',
  status: 'approved',
  isPublic: true,
};

function toIsoOrNull(value) {
  if (value == null || value === '') return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

export default function BannerStatusUpdatePage() {
  const router = useRouter();
  const [isAllowed, setIsAllowed] = useState(false);
  const [selectedBanner, setSelectedBanner] = useState(null);
  const [form, setForm] = useState(INITIAL_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);

  useEffect(() => {
    const role = String(localStorage.getItem('userRole') || '').trim().toLowerCase();
    const isRestaurantRole = ['restaurant', 'resturant', 'restaurant_admin', 'vendor'].includes(role);
    if (isRestaurantRole) {
      setIsAllowed(false);
      toast.error('Restaurant role cannot update banner status.');
      router.push('/dashboard/banners/list');
      return;
    }
    setIsAllowed(true);
  }, [router]);

  useEffect(() => {
    if (!isAllowed) return;
    try {
      const params = new URLSearchParams(window.location.search || '');
      const bannerIdFromQuery = String(params.get('banner_id') || '').trim();
      if (bannerIdFromQuery) {
        setForm((prev) => ({ ...prev, bannerId: bannerIdFromQuery }));
      }
    } catch {
      // ignore
    }
  }, [isAllowed]);

  const loadBannerDetail = async (bannerIdOverride) => {
    const bannerId = String(bannerIdOverride ?? form.bannerId ?? '').trim();
    if (!bannerId) {
      setSelectedBanner(null);
      return;
    }
    setLoadingDetail(true);
    try {
      const token = localStorage.getItem('token') || '';
      const { data } = await axios.get(`/api/restaurants/admin/banners/${bannerId}`, {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      const payload = data?.data && typeof data.data === 'object' ? data.data : data;
      const banner = payload?.banner || payload?.data?.banner || payload?.data || payload || null;
      if (!banner || typeof banner !== 'object') {
        setSelectedBanner(null);
        return;
      }

      setSelectedBanner(banner);
      const rawStatus = String(banner?.status || 'approved').toLowerCase();
      const statusForForm = ['approved', 'rejected'].includes(rawStatus)
        ? rawStatus
        : 'approved';
      setForm((prev) => ({
        ...prev,
        bannerId,
        status: statusForForm,
        isPublic: Boolean(banner?.is_public),
      }));
    } catch {
      setSelectedBanner(null);
    } finally {
      setLoadingDetail(false);
    }
  };

  useEffect(() => {
    if (!isAllowed) return;
    const bannerId = String(form.bannerId || '').trim();
    if (!bannerId) {
      setSelectedBanner(null);
      return;
    }
    loadBannerDetail(bannerId);
  }, [form.bannerId, isAllowed]);

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const bannerId = form.bannerId.trim();
    if (!bannerId) {
      toast.error('Open this page from Admin List Banners (Moderate) so a banner is selected.');
      return;
    }
    try {
      setSubmitting(true);
      const token = localStorage.getItem('token') || '';
      let validFrom = toIsoOrNull(selectedBanner?.valid_from);
      let validTo = toIsoOrNull(selectedBanner?.valid_to);
      if (!validFrom || !validTo) {
        const from = new Date();
        const to = new Date(from);
        to.setFullYear(to.getFullYear() + 1);
        validFrom = validFrom || from.toISOString();
        validTo = validTo || to.toISOString();
      }
      // Backend often ignores status (e.g. stays "requested") when valid_to is before valid_from.
      if (validFrom && validTo && new Date(validTo) < new Date(validFrom)) {
        const tmp = validFrom;
        validFrom = validTo;
        validTo = tmp;
      }
      const payload = {
        status: form.status,
        is_public: form.isPublic,
        valid_from: validFrom,
        valid_to: validTo,
      };
      const response = await axios.patch(`/api/restaurants/admin/banners/${bannerId}/status`, payload, {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      toast.success(response?.data?.message || 'Banner status updated successfully.');
      router.push('/dashboard/banners/admin-list');
    } catch (error) {
      const message = axios.isAxiosError(error)
        ? error.response?.data?.message || error.message || 'Failed to update banner status.'
        : error?.message || 'Failed to update banner status.';
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="pt-36 pb-8">
      {!isAllowed ? null : (
      <form onSubmit={handleSubmit} className="rounded-xl border border-gray-200 bg-white">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 px-4 py-3">
          <div>
            <h2 className="text-xl font-semibold text-[#1E1E24]">Admin Banner Status Update</h2>
            <p className="mt-1 text-xs text-gray-500">Review the banner and update status or visibility.</p>
          </div>
          <button
            type="button"
            onClick={() => loadBannerDetail(form.bannerId)}
            disabled={!form.bannerId.trim() || loadingDetail}
            className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-gray-600 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loadingDetail ? 'Loading...' : 'Refresh'}
          </button>
        </div>

        <div className="space-y-4 p-4">

        {!form.bannerId.trim() && (
          <p className="text-sm text-gray-500">
            No banner selected. Go to{' '}
            <button
              type="button"
              className="font-semibold text-[#7C3AED] underline"
              onClick={() => router.push('/dashboard/banners/admin-list')}
            >
              Admin List Banners
            </button>
            {' '}and click Moderate on a banner.
          </p>
        )}

        {loadingDetail && form.bannerId.trim() && (
          <p className="text-xs text-gray-500">Loading banner details...</p>
        )}

        {selectedBanner && (
          <div className="rounded-lg border border-gray-100 bg-gray-50 p-3">
            <div className="flex items-center gap-3">
              {(selectedBanner?.banner_image_url || selectedBanner?.bannerImageUrl || selectedBanner?.image_url) ? (
                <div className="h-12 w-16 overflow-hidden rounded-md bg-purple-100">
                  <img
                    src={selectedBanner?.banner_image_url || selectedBanner?.bannerImageUrl || selectedBanner?.image_url}
                    alt={selectedBanner?.banner_name || selectedBanner?.name || 'banner'}
                    className="h-full w-full object-cover"
                    onError={(e) => { e.currentTarget.style.display = 'none'; }}
                  />
                </div>
              ) : null}
              <div className="min-w-0">
                <p className="truncate text-xs font-semibold text-[#1E1E24]">
                  {selectedBanner?.banner_name || selectedBanner?.name || 'Banner'}
                </p>
                <p className="mt-0.5 truncate text-[11px] text-gray-500">
                  Restaurant: {selectedBanner?.restaurant_name || selectedBanner?.restaurant?.name || '-'}
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="mb-1.5 block text-[11px] font-medium text-gray-700">Status</label>
            <select
              name="status"
              value={form.status}
              onChange={handleChange}
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:border-[#7C3AED] focus:outline-none"
            >
              <option value="approved">approved</option>
              <option value="rejected">rejected</option>
            </select>
          </div>
          <div className="flex items-end">
            <label className="inline-flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                name="isPublic"
                checked={form.isPublic}
                onChange={handleChange}
              />
              Public Banner
            </label>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={submitting || !form.bannerId.trim() || !selectedBanner}
            className="rounded-lg bg-[#7C3AED] px-5 py-2 text-xs font-semibold text-white hover:bg-[#6D28D9] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? 'Updating...' : 'Update Status'}
          </button>
        </div>
        </div>
      </form>
      )}
    </div>
  );
}

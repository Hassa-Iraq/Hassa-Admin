'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import axios from 'axios';
import Topbar from '@/app/components/Topbar';
import { API_BASE_URL } from '@/app/config';
import { Mail, Phone, MapPin, Tag, Clock, Store, FileText, ShieldCheck, CalendarDays, Receipt, Percent } from 'lucide-react';
import { formatPhoneWithFlag } from '@/app/lib/phone';

const DEFAULT_IMAGE = '/default-image.svg';

const toAbsoluteUrl = (value) => {
  if (!value || typeof value !== 'string') return '';
  const trimmed = value.trim();
  if (!trimmed) return '';
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed;
  if (trimmed.startsWith('//')) return `https:${trimmed}`;
  if (trimmed.startsWith('/')) return `${API_BASE_URL}${trimmed}`;
  return `${API_BASE_URL}/${trimmed}`;
};

const pickText = (...values) => {
  for (const value of values) {
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  return '';
};

export default function RestaurantDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const restaurantId = Array.isArray(params?.restaurant_id)
    ? params.restaurant_id[0]
    : (params?.restaurant_id || '');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [data, setData] = useState(null);

  useEffect(() => {
    if (!restaurantId) {
      setError('Restaurant id is missing.');
      setLoading(false);
      return;
    }

    const fetchDetails = async () => {
      setLoading(true);
      setError('');
      try {
        const token = localStorage.getItem('token') || '';
        const response = await axios.get(`/api/restaurants/${restaurantId}`, {
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });

        const root = response?.data?.data && typeof response.data.data === 'object'
          ? response.data.data
          : response.data;
        const restaurant = root?.restaurant || root?.data?.restaurant || root || {};
        const owner = root?.owner || root?.vendor || restaurant?.owner || restaurant?.vendor || {};

        setData({ restaurant, owner });
      } catch (fetchError) {
        const message = axios.isAxiosError(fetchError)
          ? fetchError.response?.data?.message || fetchError.message || 'Failed to load restaurant details.'
          : 'Failed to load restaurant details.';
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    fetchDetails();
  }, [restaurantId]);

  const viewModel = useMemo(() => {
    const restaurant = data?.restaurant || {};
    const owner = data?.owner || {};
    const additional = restaurant?.additional_data || {};

    const logo = toAbsoluteUrl(
      pickText(restaurant?.logo_url, restaurant?.logo, restaurant?.logo_full_url)
    );
    const cover = toAbsoluteUrl(
      pickText(restaurant?.cover_image_url, restaurant?.cover_image, restaurant?.cover_photo)
    );
    const certificate = toAbsoluteUrl(
      pickText(restaurant?.certificate_url, restaurant?.tin_certificate_url)
    );
    const additionalCertificate = toAbsoluteUrl(
      pickText(additional?.additional_certificate, additional?.additional_certificate_url)
    );
    const name = pickText(restaurant?.name, restaurant?.restaurant_name) || 'N/A';
    const address = pickText(restaurant?.address) || 'N/A';
    const zone = pickText(restaurant?.zone) || '-';
    const cuisine = pickText(restaurant?.cuisine, restaurant?.cuisine_name) || '-';
    const radius = restaurant?.radius_km ?? restaurant?.service_radius_km ?? '-';
    const contactEmail = pickText(
      restaurant?.contact_email,
      restaurant?.owner_email,
      owner?.email
    ) || '-';
    const contactPhone = pickText(
      restaurant?.phone,
      restaurant?.owner_phone,
      owner?.phone
    ) || '-';
    const ownerName = pickText(
      owner?.full_name,
      `${owner?.f_name || owner?.first_name || ''} ${owner?.l_name || owner?.last_name || ''}`.trim()
    ) || 'N/A';
    const tags = Array.isArray(restaurant?.tags)
      ? restaurant.tags
      : (typeof restaurant?.tags === 'string' && restaurant.tags.trim() ? [restaurant.tags.trim()] : []);
    const isOpen = Boolean(
      restaurant?.is_open ?? restaurant?.isOpen ?? restaurant?.open ?? false
    );
    const parentId = pickText(
      restaurant?.parent_id,
      restaurant?.parent_restaurant_id,
      restaurant?.branch_of_restaurant_id
    );
    const lat = restaurant?.lat ?? restaurant?.latitude ?? null;
    const lng = restaurant?.lng ?? restaurant?.longitude ?? null;

    return {
      name,
      address,
      zone,
      cuisine,
      radius,
      contactEmail,
      contactPhone,
      ownerName,
      ownerEmail: pickText(owner?.email, restaurant?.owner_email, restaurant?.contact_email) || '-',
      ownerPhone: pickText(owner?.phone, restaurant?.owner_phone, restaurant?.phone) || '-',
      tags,
      status: isOpen ? 'Open' : 'Closed',
      logo,
      cover,
      certificate,
      additionalCertificate,
      isBranch: Boolean(parentId),
      lat,
      lng,
    };
  }, [data]);

  return (
    <>
      <Topbar
        title="Restaurant Details"
        subtitle="View selected restaurant information"
        rightContent={
          <Link href="/dashboard/restaurants/list">
            <button className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50">
              Back to list
            </button>
          </Link>
        }
      />

      <div className="pt-36 px-4 sm:px-6 pb-10">
        {loading && (
          <div className="space-y-4 rounded-xl border border-gray-200 bg-white p-6">
            <div className="h-6 w-56 animate-pulse rounded bg-gray-200/80" />
            <div className="h-4 w-80 animate-pulse rounded bg-gray-200/70" />
            <div className="h-4 w-72 animate-pulse rounded bg-gray-200/70" />
            <div className="h-48 w-full animate-pulse rounded bg-gray-100" />
          </div>
        )}

        {!loading && error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-6">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {!loading && !error && (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            <div className="col-span-12 rounded-xl border border-gray-100 bg-white p-4 sm:p-6 lg:col-span-8">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h2 className="text-2xl font-semibold text-[#1E1E24]">{viewModel.name}</h2>
                  <p className="mt-1 text-sm text-gray-500">{viewModel.address}</p>
                  <div className={`mt-3 inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${
                    viewModel.status === 'Open'
                      ? 'bg-green-50 text-green-700'
                      : 'bg-rose-50 text-rose-700'
                  }`}>
                    {viewModel.status}
                  </div>
                </div>
                {!viewModel.isBranch && (
                  <button
                    onClick={() => router.push(`/dashboard/restaurants/add?restaurant_id=${restaurantId}`)}
                    className="h-fit w-full rounded-lg bg-[#7C3AED] px-4 py-2 text-sm font-medium text-white hover:bg-[#6D28D9] sm:w-auto"
                  >
                    Edit Restaurant
                  </button>
                )}
              </div>

              <div className="mt-6 grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
                <DetailRow icon={Store} iconClass="text-violet-600 bg-violet-50" label="Cuisine" value={viewModel.cuisine} />
                <DetailRow icon={Tag} iconClass="text-sky-600 bg-sky-50" label="Zone" value={viewModel.zone} />
                <DetailRow icon={Clock} iconClass="text-emerald-600 bg-emerald-50" label="Radius" value={viewModel.radius} />
                <DetailRow icon={Mail} iconClass="text-indigo-600 bg-indigo-50" label="Contact" value={viewModel.contactEmail} />
                <DetailRow icon={Phone} iconClass="text-amber-600 bg-amber-50" label="Phone" value={formatPhoneWithFlag(viewModel.contactPhone)} />
                <DetailRow
                  icon={MapPin}
                  iconClass="text-rose-600 bg-rose-50"
                  label="Location"
                  value={viewModel.lat && viewModel.lng ? `${viewModel.lat}, ${viewModel.lng}` : '-'}
                />
              </div>

              {viewModel.tags.length > 0 && (
                <div className="mt-5 flex flex-wrap gap-2">
                  {viewModel.tags.map((tag) => (
                    <span key={tag} className="rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-700">
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <AssetPreview title="Logo" src={viewModel.logo} />
                <AssetPreview title="Cover Image" src={viewModel.cover} />
                <AssetPreview title="Certificate" src={viewModel.certificate} />
                <AssetPreview title="Additional Certificate" src={viewModel.additionalCertificate} />
              </div>
            </div>

            <div className="col-span-12 space-y-4 lg:col-span-4">
              <div className="rounded-xl border border-gray-100 bg-white p-4 sm:p-5">
                <h3 className="mb-4 text-sm font-semibold text-[#1E1E24]">Owner Information</h3>
                <p className="text-base font-semibold text-[#1E1E24]">{viewModel.ownerName}</p>
                <div className="mt-4 space-y-2">
                  <OwnerContact icon={Phone} value={formatPhoneWithFlag(viewModel.ownerPhone)} />
                  <OwnerContact icon={Mail} value={viewModel.ownerEmail} />
                </div>
              </div>

              <div className="rounded-xl border border-gray-100 bg-white p-4 sm:p-5">
                <h3 className="mb-4 text-sm font-semibold text-[#1E1E24]">Legal Information</h3>
                <div className="space-y-2">
                  <OwnerContact
                    icon={ShieldCheck}
                    value={`TIN: ${pickText(data?.restaurant?.tin) || '-'}`}
                    iconBgClass="bg-cyan-100 text-cyan-600"
                  />
                  <OwnerContact
                    icon={CalendarDays}
                    value={`Expiry: ${pickText(data?.restaurant?.tin_expiry_date) || '-'}`}
                    iconBgClass="bg-indigo-100 text-indigo-600"
                  />
                  <OwnerContact
                    icon={Receipt}
                    value={`Tax Type: ${pickText(data?.restaurant?.tax_type) || '-'}`}
                    iconBgClass="bg-emerald-100 text-emerald-600"
                  />
                  <OwnerContact
                    icon={Percent}
                    value={`Tax Rate: ${data?.restaurant?.tax_rate ?? '-'}`}
                    iconBgClass="bg-amber-100 text-amber-600"
                  />
                </div>
              </div>

              <div className="rounded-xl border border-gray-100 bg-white p-5">
                <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-[#1E1E24]">
                  <FileText size={14} className="text-gray-500" />
                  Description
                </h3>
                <p className="text-sm text-gray-600">
                  {pickText(data?.restaurant?.description) || 'No description available.'}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

function AssetPreview({ title, src }) {
  return (
    <div className="rounded-xl border border-gray-100 p-3">
      <p className="mb-2 text-xs font-semibold text-gray-600">{title}</p>
      {src ? (
        <img
          src={src}
          alt={title}
          className="h-28 w-full rounded-lg object-cover"
          onError={(event) => {
            event.currentTarget.onerror = null;
            event.currentTarget.src = DEFAULT_IMAGE;
          }}
        />
      ) : (
        <div className="flex h-28 items-center justify-center rounded-lg bg-gray-50 text-xs text-gray-400">
          Not uploaded
        </div>
      )}
    </div>
  );
}

function DetailRow({ icon: Icon, iconClass, label, value }) {
  return (
    <div className="flex items-center gap-2 text-gray-700">
      <span className={`inline-flex h-6 w-6 items-center justify-center rounded-md ${iconClass}`}>
        <Icon size={14} />
      </span>
      <span>
        {label}: <span className="font-medium">{value}</span>
      </span>
    </div>
  );
}

function OwnerContact({ icon: Icon, value, iconBgClass = 'bg-purple-100 text-purple-600' }) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-gray-100 bg-gray-50 px-3 py-2 text-sm text-gray-700">
      <span className={`inline-flex h-6 w-6 items-center justify-center rounded-md ${iconBgClass}`}>
        <Icon size={14} />
      </span>
      <span className="font-medium">{value || '-'}</span>
    </div>
  );
}

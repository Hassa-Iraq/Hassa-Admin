'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import axios from 'axios';
import Topbar from '@/app/components/Topbar';
import { API_BASE_URL } from '@/app/config';
import { Bike, Car, CreditCard, FileText, Mail, Phone, UserCircle } from 'lucide-react';
import { formatPhoneWithFlag } from '@/app/lib/phone';

const DEFAULT_IMAGE = '/default-restaurant-image.svg';

const pickText = (...values) => {
  for (const value of values) {
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  return '';
};

const toAbsoluteUrl = (value) => {
  if (!value || typeof value !== 'string') return '';
  const trimmed = value.trim();
  if (!trimmed) return '';
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed;
  if (trimmed.startsWith('//')) return `https:${trimmed}`;
  if (trimmed.startsWith('/')) return `${API_BASE_URL}${trimmed}`;
  return `${API_BASE_URL}/${trimmed}`;
};

const toBool = (value) => {
  if (value === true || value === 1 || value === '1') return true;
  if (value === false || value === 0 || value === '0') return false;
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (normalized === 'true' || normalized === 'active' || normalized === 'online') return true;
    if (normalized === 'false' || normalized === 'inactive' || normalized === 'offline') return false;
  }
  return false;
};

export default function DeliverymanDetailsPage() {
  const params = useParams();
  const driverUserId = Array.isArray(params?.driver_user_id)
    ? params.driver_user_id[0]
    : (params?.driver_user_id || '');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [driver, setDriver] = useState(null);

  useEffect(() => {
    if (!driverUserId) {
      setError('Driver id is missing.');
      setLoading(false);
      return;
    }

    const fetchDetails = async () => {
      setLoading(true);
      setError('');
      try {
        const token = localStorage.getItem('token') || '';
        const response = await axios.get(`/api/auth/drivers/${driverUserId}`, {
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });
        const root =
          response?.data?.data && typeof response.data.data === 'object'
            ? response.data.data
            : response.data;
        const resolvedDriver = root?.driver || root?.data?.driver || root;
        setDriver(resolvedDriver && typeof resolvedDriver === 'object' ? resolvedDriver : null);
      } catch (fetchError) {
        const message = axios.isAxiosError(fetchError)
          ? fetchError.response?.data?.message || fetchError.message || 'Failed to load deliveryman details.'
          : 'Failed to load deliveryman details.';
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    fetchDetails();
  }, [driverUserId]);

  const viewModel = useMemo(() => {
    const additionalData = driver?.additional_data && typeof driver.additional_data === 'object'
      ? driver.additional_data
      : {};
    const isActive = toBool(driver?.is_active ?? driver?.active ?? driver?.status);

    return {
      fullName: pickText(driver?.full_name, driver?.name) || 'N/A',
      email: pickText(driver?.email) || '-',
      phone: pickText(driver?.phone) || '-',
      vehicleType: pickText(driver?.vehicle_type, driver?.vehicleType) || '-',
      vehicleNumber: pickText(driver?.vehicle_number, driver?.vehicleNumber) || '-',
      ownerType: pickText(driver?.owner_type, driver?.ownerType) || '-',
      nationalId: pickText(additionalData?.national_id, additionalData?.nationalId) || '-',
      notes: pickText(additionalData?.notes) || '-',
      driverImage: toAbsoluteUrl(
        pickText(driver?.image_url, driver?.driver_image_url, driver?.avatar)
      ),
      vehicleImage: toAbsoluteUrl(
        pickText(driver?.vehicle_image_url, driver?.vehicleImageUrl)
      ),
      licenseImage: toAbsoluteUrl(
        pickText(driver?.driving_license_image_url, driver?.drivingLicenseImageUrl)
      ),
      status: isActive ? 'Active' : 'Inactive',
    };
  }, [driver]);

  return (
    <>
      <Topbar
        title="Deliveryman Details"
        subtitle="View selected deliveryman information"
      />

      <div className="pt-36 px-6 pb-10">
        {loading && (
          <div className="rounded-xl border border-gray-200 bg-white p-6 text-sm text-gray-500">
            Loading deliveryman details...
          </div>
        )}

        {!loading && error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-6">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {!loading && !error && (
          <div className="grid grid-cols-12 gap-6">
            <div className="col-span-8 bg-white rounded-xl border border-gray-100 p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-semibold text-[#1E1E24]">{viewModel.fullName}</h2>
                  <p className="mt-1 text-sm text-gray-500">{viewModel.email}</p>
                  <div className={`mt-3 inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${
                    viewModel.status === 'Active'
                      ? 'bg-green-50 text-green-700'
                      : 'bg-rose-50 text-rose-700'
                  }`}>
                    {viewModel.status}
                  </div>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-2 gap-4 text-sm">
                <DetailRow icon={UserCircle} iconClass="text-violet-600 bg-violet-50" label="Owner Type" value={viewModel.ownerType} />
                <DetailRow icon={Phone} iconClass="text-amber-600 bg-amber-50" label="Phone" value={formatPhoneWithFlag(viewModel.phone)} />
                <DetailRow icon={Bike} iconClass="text-sky-600 bg-sky-50" label="Vehicle Type" value={viewModel.vehicleType} />
                <DetailRow icon={Car} iconClass="text-emerald-600 bg-emerald-50" label="Vehicle Number" value={viewModel.vehicleNumber} />
                <DetailRow icon={CreditCard} iconClass="text-indigo-600 bg-indigo-50" label="National ID" value={viewModel.nationalId} />
                <DetailRow icon={Mail} iconClass="text-rose-600 bg-rose-50" label="Email" value={viewModel.email} />
              </div>

              <div className="mt-6 rounded-xl border border-gray-100 bg-gray-50 p-4">
                <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-[#1E1E24]">
                  <FileText size={14} className="text-gray-500" />
                  Notes
                </h3>
                <p className="text-sm text-gray-700">{viewModel.notes}</p>
              </div>
            </div>

            <div className="col-span-4 space-y-4">
              <AssetPreview title="Driver Image" src={viewModel.driverImage} />
              <AssetPreview title="Vehicle Image" src={viewModel.vehicleImage} />
              <AssetPreview title="Driving License Image" src={viewModel.licenseImage} />
            </div>
          </div>
        )}
      </div>
    </>
  );
}

function AssetPreview({ title, src }) {
  return (
    <div className="rounded-xl border border-gray-100 bg-white p-4">
      <p className="mb-2 text-xs font-semibold text-gray-600">{title}</p>
      {src ? (
        <img
          src={src}
          alt={title}
          className="h-36 w-full rounded-lg object-cover"
          onError={(event) => {
            event.currentTarget.onerror = null;
            event.currentTarget.src = DEFAULT_IMAGE;
          }}
        />
      ) : (
        <div className="flex h-36 items-center justify-center rounded-lg bg-gray-50 text-xs text-gray-400">
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

'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, Mail, Phone, ShoppingBag, Wallet, CalendarDays } from 'lucide-react';
import { formatPhoneWithFlag } from '@/app/lib/phone';
import { API_BASE_URL } from '@/app/config';

const toAbsoluteAssetUrl = (value) => {
  if (!value || typeof value !== 'string') return '';
  const trimmed = value.trim();
  if (!trimmed) return '';
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed;
  if (trimmed.startsWith('//')) return `https:${trimmed}`;
  if (trimmed.startsWith('/')) return `${API_BASE_URL}${trimmed}`;
  return `${API_BASE_URL}/${trimmed}`;
};

const toDisplayName = (entity) => {
  const fullName = String(entity?.full_name || entity?.name || '').trim();
  if (fullName) return fullName;
  const joined = `${entity?.f_name || entity?.first_name || ''} ${entity?.l_name || entity?.last_name || ''}`.trim();
  if (joined) return joined;
  const email = String(entity?.email || '').trim();
  if (!email) return 'N/A';
  const prefix = email.split('@')[0]?.replace(/[._-]+/g, ' ').trim() || '';
  return prefix
    ? prefix
        .split(' ')
        .filter(Boolean)
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(' ')
    : 'N/A';
};

const formatDateTime = (value) => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const formatAmount = (value, currency = 'PKR') => {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return `${currency} 0.00`;
  return `${currency} ${amount.toFixed(2)}`;
};

export default function CustomerDetailPage() {
  const params = useParams();
  const userId = useMemo(() => {
    const raw = params?.user_id;
    return Array.isArray(raw) ? raw[0] : String(raw || '').trim();
  }, [params?.user_id]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [customer, setCustomer] = useState(null);

  useEffect(() => {
    const fetchDetail = async () => {
      if (!userId) {
        setError('Customer id is missing.');
        setLoading(false);
        return;
      }

      setLoading(true);
      setError('');
      try {
        const token = localStorage.getItem('token') || '';
        const endpoint = `/api/orders/customers?page=1&limit=20&search=${encodeURIComponent(userId)}&restaurant_id=&date_from=&date_to=`;
        const response = await fetch(endpoint, {
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });
        const payload = await response.json();
        if (!response.ok) {
          throw new Error(payload?.message || 'Failed to fetch customer details');
        }

        const list =
          payload?.data?.customers ||
          payload?.data?.list ||
          payload?.customers ||
          payload?.list ||
          payload?.data ||
          [];
        const rows = Array.isArray(list) ? list : [];
        const found = rows.find((item) => String(item?.user_id || item?.id || '').trim() === userId) || rows[0] || null;

        if (!found) {
          setError('Customer not found.');
          setCustomer(null);
        } else {
          setCustomer(found);
        }
      } catch (fetchError) {
        setError(fetchError?.message || 'Failed to fetch customer details');
        setCustomer(null);
      } finally {
        setLoading(false);
      }
    };

    fetchDetail();
  }, [userId]);

  const view = useMemo(() => {
    const entity = customer || {};
    return {
      name: toDisplayName(entity),
      email: entity?.email || '-',
      phone: entity?.phone || '-',
      avatar: toAbsoluteAssetUrl(entity?.profile_picture_url || entity?.image_url || entity?.avatar || ''),
      totalOrders: Number(entity?.total_orders || entity?.orders_count || 0) || 0,
      totalSpent: formatAmount(entity?.total_spent || entity?.total_amount || 0, entity?.currency || 'PKR'),
      firstOrderAt: formatDateTime(entity?.first_order_at),
      lastOrderAt: formatDateTime(entity?.last_order_at),
    };
  }, [customer]);

  return (
    <div className="pt-36 pb-8 space-y-4">
      <div>
        <Link
          href="/dashboard/customers"
          className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50"
        >
          <ArrowLeft size={14} />
          Back to Customers
        </Link>
      </div>

      {loading && (
        <div className="rounded-xl border border-gray-200 bg-white p-6 text-sm text-gray-500">
          Loading customer details...
        </div>
      )}

      {!loading && error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-600">
          {error}
        </div>
      )}

      {!loading && !error && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <section className="rounded-xl border border-gray-200 bg-white p-5 lg:col-span-1">
            <div className="flex items-center gap-3">
              {view.avatar ? (
                <img
                  src={view.avatar}
                  alt={view.name}
                  className="h-14 w-14 rounded-full object-cover"
                  onError={(event) => {
                    event.currentTarget.onerror = null;
                    event.currentTarget.src = '/default-image.svg';
                  }}
                />
              ) : (
                <div className="h-14 w-14 rounded-full bg-gray-200" />
              )}
              <div>
                <h2 className="text-lg font-semibold text-[#1E1E24]">{view.name}</h2>
                <p className="text-xs text-gray-500">Customer details</p>
              </div>
            </div>

            <div className="mt-4 space-y-2">
              <InfoRow icon={Mail} value={view.email} />
              <InfoRow icon={Phone} value={formatPhoneWithFlag(view.phone)} />
            </div>
          </section>

          <section className="rounded-xl border border-gray-200 bg-white p-5 lg:col-span-2">
            <h3 className="text-sm font-semibold text-[#1E1E24]">Order Summary</h3>
            <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
              <MetricCard icon={ShoppingBag} label="Total Orders" value={String(view.totalOrders)} />
              <MetricCard icon={Wallet} label="Total Spent" value={view.totalSpent} />
              <MetricCard icon={CalendarDays} label="First Order" value={view.firstOrderAt} />
              <MetricCard icon={CalendarDays} label="Last Order" value={view.lastOrderAt} />
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

function InfoRow({ icon: Icon, value }) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-gray-100 bg-gray-50 px-3 py-2 text-sm text-gray-700">
      <Icon size={14} className="text-gray-500" />
      <span className="truncate">{value || '-'}</span>
    </div>
  );
}

function MetricCard({ icon: Icon, label, value }) {
  return (
    <div className="rounded-lg border border-gray-100 bg-gray-50 p-3">
      <p className="flex items-center gap-2 text-xs text-gray-500">
        <Icon size={13} />
        {label}
      </p>
      <p className="mt-1 text-sm font-semibold text-[#1E1E24]">{value || '-'}</p>
    </div>
  );
}

'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import axios from 'axios';
import { Mail, Phone, User, Shield, CalendarDays, Pencil } from 'lucide-react';
import { formatPhoneWithFlag } from '@/app/lib/phone';
import { API_BASE_URL } from '@/app/config';

const DEFAULT_EMPLOYEE_IMAGE = '/default-image.svg';

const toAbsoluteAssetUrl = (value) => {
  if (!value || typeof value !== 'string') return '';
  const trimmed = value.trim();
  if (!trimmed) return '';
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed;
  if (trimmed.startsWith('//')) return `https:${trimmed}`;
  if (trimmed.startsWith('/')) return `${API_BASE_URL}${trimmed}`;
  return `${API_BASE_URL}/${trimmed}`;
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

const toDisplayName = (entity) => {
  const fullName = String(entity?.full_name || entity?.name || '').trim();
  if (fullName) return fullName;
  const joined = `${entity?.f_name || entity?.first_name || ''} ${entity?.l_name || entity?.last_name || ''}`.trim();
  if (joined) return joined;
  return 'N/A';
};

export default function EmployeeDetailPage() {
  const params = useParams();
  const router = useRouter();
  const employeeUserId = useMemo(() => {
    const raw = params?.employee_user_id;
    return Array.isArray(raw) ? raw[0] : String(raw || '').trim();
  }, [params?.employee_user_id]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [employee, setEmployee] = useState(null);

  useEffect(() => {
    const fetchDetail = async () => {
      if (!employeeUserId) {
        setError('Employee id is missing.');
        setLoading(false);
        return;
      }

      setLoading(true);
      setError('');
      try {
        const token = localStorage.getItem('token') || '';
        const { data } = await axios.get(`/api/auth/admin/employees/${employeeUserId}`, {
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });

        const payload = data?.data && typeof data.data === 'object' ? data.data : data;
        const entity =
          payload?.employee ||
          payload?.user ||
          payload?.data?.employee ||
          payload?.data?.user ||
          payload ||
          null;

        if (!entity) {
          setEmployee(null);
          setError('Employee not found.');
        } else {
          setEmployee(entity);
        }
      } catch (e) {
        setEmployee(null);
        setError(
          axios.isAxiosError(e)
            ? e.response?.data?.message || e.message || 'Failed to fetch employee details'
            : e?.message || 'Failed to fetch employee details'
        );
      } finally {
        setLoading(false);
      }
    };

    fetchDetail();
  }, [employeeUserId]);

  const view = useMemo(() => {
    const entity = employee || {};
    const roleName =
      entity?.employee_role_name ||
      entity?.role?.name ||
      entity?.role_name ||
      entity?.role ||
      '-';
    return {
      id: String(entity?.id || employeeUserId || '').trim(),
      name: toDisplayName(entity),
      email: entity?.email || '-',
      phone: entity?.phone || '-',
      role: typeof roleName === 'string' ? roleName : '-',
      createdAt: formatDateTime(entity?.created_at || entity?.createdAt),
      avatar: toAbsoluteAssetUrl(entity?.image_url || entity?.image || entity?.avatar || ''),
      isActive:
        entity?.is_active ?? entity?.active ?? entity?.status ?? null,
    };
  }, [employee, employeeUserId]);

  return (
    <div className="pt-36 pb-8 space-y-4">
      {loading && (
        <div className="rounded-xl border border-gray-200 bg-white p-6 text-sm text-gray-500">
          Loading employee details...
        </div>
      )}

      {!loading && error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-600">
          {error}
        </div>
      )}

      {!loading && !error && (
        <>
          <section className="rounded-2xl border border-gray-200 bg-white p-5">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-3">
                <img
                  src={view.avatar || DEFAULT_EMPLOYEE_IMAGE}
                  alt={view.name}
                  className="h-14 w-14 rounded-full object-cover"
                  onError={(event) => {
                    event.currentTarget.onerror = null;
                    event.currentTarget.src = DEFAULT_EMPLOYEE_IMAGE;
                  }}
                />
                <div>
                  <h2 className="text-xl font-semibold text-[#1E1E24]">{view.name}</h2>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Link href={`/dashboard/employees/add?employee_user_id=${encodeURIComponent(employeeUserId)}`}>
                  <button className="inline-flex items-center gap-1.5 rounded-lg bg-[#7C3AED] px-4 py-2 text-xs font-semibold text-white hover:bg-[#6D28D9]">
                    <Pencil size={12} />
                    Edit
                  </button>
                </Link>
                <button
                  type="button"
                  onClick={() => router.push('/dashboard/employees/list')}
                  className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                >
                  Back
                </button>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
              <InfoCard icon={Mail} label="Email" value={view.email} />
              <InfoCard icon={Phone} label="Phone" value={formatPhoneWithFlag(view.phone)} />
              <InfoCard icon={Shield} label="Role" value={view.role} />
              <InfoCard icon={CalendarDays} label="Created At" value={view.createdAt} />
              <InfoCard
                icon={User}
                label="Active"
                value={
                  view.isActive === null
                    ? '-'
                    : Boolean(view.isActive)
                      ? 'Yes'
                      : 'No'
                }
              />
            </div>
          </section>
        </>
      )}
    </div>
  );
}

function InfoCard({ icon: Icon, label, value }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-[#FCFCFF] p-4">
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-purple-50 text-purple-600">
          <Icon size={16} />
        </div>
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">{label}</p>
          <p className="mt-1 truncate text-sm font-semibold text-[#1E1E24]">{value}</p>
        </div>
      </div>
    </div>
  );
}


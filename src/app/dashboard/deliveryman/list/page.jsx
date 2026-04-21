'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { Download, Eye, Search, ChevronLeft, ChevronRight, Pencil } from 'lucide-react';
import { API_BASE_URL } from '@/app/config';
import { formatPhoneWithFlag } from '@/app/lib/phone';
import TableLoadingSkeleton from '@/app/components/TableLoadingSkeleton';

const PER_PAGE = 20;
const RESTAURANT_ROLES = ['restaurant', 'resturant', 'restaurant_admin', 'vendor'];
const ADMIN_ROLES = ['admin', 'super_admin', 'superadmin'];

export default function DeliverymanListPage() {
  const router = useRouter();
  const [deliverymen, setDeliverymen] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const [roleContext, setRoleContext] = useState({
    userRole: '',
    ownerType: '',
    restaurantId: '',
  });
  const [roleResolved, setRoleResolved] = useState(false);

  useEffect(() => {
    try {
      const userRole = String(localStorage.getItem('userRole') || '').trim().toLowerCase();
      const restaurantId =
        String(localStorage.getItem('restaurant_id') || localStorage.getItem('selectedRestaurantId') || '').trim();

      let ownerType = '';
      if (ADMIN_ROLES.includes(userRole)) {
        ownerType = 'platform';
      } else if (RESTAURANT_ROLES.includes(userRole)) {
        ownerType = 'restaurant';
      }

      setRoleContext({
        userRole,
        ownerType,
        restaurantId,
      });
    } catch {
      setRoleContext({
        userRole: '',
        ownerType: '',
        restaurantId: '',
      });
    } finally {
      setRoleResolved(true);
    }
  }, []);

  const toAbsoluteUrl = (value) => {
    if (!value || typeof value !== 'string') return '';
    const trimmed = value.trim();
    if (!trimmed) return '';
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed;
    if (trimmed.startsWith('//')) return `https:${trimmed}`;
    if (trimmed.startsWith('/')) return `${API_BASE_URL}${trimmed}`;
    return `${API_BASE_URL}/${trimmed}`;
  };

  const pickString = (...values) => {
    const matched = values.find((value) => typeof value === 'string' && value.trim());
    return matched ? matched.trim() : '';
  };

  const toBool = (value) => {
    if (value === true || value === 1 || value === '1') return true;
    if (value === false || value === 0 || value === '0') return false;
    if (typeof value === 'string') {
      const normalized = value.trim().toLowerCase();
      if (normalized === 'true' || normalized === 'active' || normalized === 'online') return true;
      if (normalized === 'false' || normalized === 'inactive' || normalized === 'offline') return false;
    }
    return true;
  };

  const normalizeDeliveryman = (item = {}, index = 0) => {
    const id = pickString(
      String(item?.id ?? ''),
      String(item?.driver_id ?? ''),
      String(item?.user_id ?? ''),
      String(item?.driver?.id ?? '')
    ) || `${page}-${index}`;

    const fullName = pickString(
      item?.full_name,
      item?.name,
      item?.driver_name,
      item?.user?.full_name
    ) || 'N/A';

    const avatar = toAbsoluteUrl(
      pickString(
        item?.image_url,
        item?.image,
        item?.avatar,
        item?.driver_image_url,
        item?.profile_picture_url
      )
    );

    const phoneRaw = pickString(item?.phone, item?.user?.phone);
    const countryCode = pickString(item?.country_code, item?.dial_code, item?.user?.country_code);
    const isActive = toBool(item?.is_active ?? item?.active ?? item?.isActive);

    return {
      id,
      name: fullName,
      contactName: fullName,
      ownerType: pickString(item?.owner_type, item?.ownerType).toLowerCase(),
      ownerRestaurantId: pickString(
        String(item?.owner_restaurant_id ?? ''),
        String(item?.ownerRestaurantId ?? '')
      ),
      phone: phoneRaw || '-',
      vehicleType: pickString(item?.vehicle_type, item?.vehicleType) || '-',
      vehicleNumber: pickString(item?.vehicle_number, item?.vehicleNumber) || '-',
      ordersCompleted: Number(item?.orders_completed ?? item?.total_orders ?? item?.orders_count ?? 0) || 0,
      totalReviews: Number(item?.total_reviews ?? item?.reviews_count ?? item?.rating_count ?? 0) || 0,
      avgRating: Number(item?.avg_rating ?? item?.rating ?? 0) || 0,
      isActive,
      avatar,
      countryCode,
    };
  };

  useEffect(() => {
    const fetchDeliverymen = async () => {
      if (!roleResolved) return;

      if (roleContext.ownerType === 'restaurant' && !roleContext.restaurantId) {
        setDeliverymen([]);
        setTotalCount(0);
        setFetchError('Restaurant ID not found. Please login again.');
        return;
      }

      setLoading(true);
      setFetchError('');
      try {
        const params = new URLSearchParams({
          page: String(page),
          limit: String(PER_PAGE),
          search: search.trim(),
          owner_type: roleContext.ownerType || '',
          restaurant_id: roleContext.ownerType === 'restaurant' ? roleContext.restaurantId : '',
          is_active: 'true',
        });

        const { data } = await axios.get(`/api/auth/drivers?${params.toString()}`);
        const source = data?.data && typeof data.data === 'object' ? data.data : data;
        const list =
          source?.drivers ||
          source?.deliverymen ||
          source?.list ||
          source?.items ||
          data?.drivers ||
          data?.deliverymen ||
          [];

        const normalized = (Array.isArray(list) ? list : []).map((item, index) =>
          normalizeDeliveryman(item, index)
        );
        const strictlyFiltered = normalized.filter((item) => {
          if (roleContext.ownerType === 'platform') {
            return item.ownerType === 'platform';
          }
          if (roleContext.ownerType === 'restaurant') {
            if (item.ownerType && item.ownerType !== 'restaurant') return false;
            if (roleContext.restaurantId && item.ownerRestaurantId) {
              return item.ownerRestaurantId === roleContext.restaurantId;
            }
          }
          return true;
        });
        setDeliverymen(strictlyFiltered);

        const total =
          source?.pagination?.total ??
          source?.total ??
          source?.total_size ??
          source?.count ??
          data?.data?.pagination?.total ??
          data?.total ??
          data?.total_size ??
          strictlyFiltered.length;
        const parsedTotal = Number(total);
        setTotalCount(Number.isFinite(parsedTotal) ? parsedTotal : strictlyFiltered.length);
      } catch (error) {
        setDeliverymen([]);
        setTotalCount(0);
        setFetchError(
          axios.isAxiosError(error)
            ? error.response?.data?.message || error.message || 'Failed to load deliverymen'
            : error?.message || 'Failed to load deliverymen'
        );
      } finally {
        setLoading(false);
      }
    };

    fetchDeliverymen();
  }, [page, search, roleContext.ownerType, roleContext.restaurantId, roleResolved]);

  const totalPages = Math.max(1, Math.ceil(totalCount / PER_PAGE));

  const roleLabel = useMemo(() => {
    if (roleContext.ownerType === 'platform') return 'Platform';
    if (roleContext.ownerType === 'restaurant') return 'Restaurant';
    if (!roleContext.userRole) return 'Unknown';
    return roleContext.userRole;
  }, [roleContext.ownerType, roleContext.userRole]);

  const handleExport = () => {
    if (!deliverymen.length) return;
    const headers = ['SI', 'Name', 'Contact', 'Phone', 'Vehicle Type', 'Vehicle Number', 'Total Orders', 'Status'];
    const rows = deliverymen.map((item, index) => [
      (page - 1) * PER_PAGE + index + 1,
      item.name,
      item.contactName,
      item.phone,
      item.vehicleType,
      item.vehicleNumber,
      item.ordersCompleted,
      item.isActive ? 'Active' : 'Inactive',
    ]);
    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'deliverymen-export.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="pt-36 pb-8">
      <section className="rounded-xl border border-gray-200 bg-white">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 p-3">
          <div>
            <h3 className="text-xl font-semibold text-[#1E1E24]">Deliveryman</h3>
            <p className="text-[11px] text-gray-500">Owner Type: {roleLabel}</p>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative w-[220px]">
              <Search size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7C3AED]" />
              <input
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setPage(1);
                }}
                placeholder="Search by name..."
                className="w-full rounded-lg border border-gray-200 py-2 pl-3 pr-8 text-xs text-gray-700 placeholder:text-gray-400 focus:border-[#7C3AED] focus:outline-none"
              />
            </div>
            <button
              onClick={handleExport}
              className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-gray-600 hover:bg-gray-50"
            >
              <Download size={12} />
              <span>Export</span>
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1100px] text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50/70">
                <th className="px-3 py-3 text-left text-[11px] font-semibold text-[#1E1E24]">SI</th>
                <th className="px-3 py-3 text-left text-[11px] font-semibold text-[#1E1E24]">Name</th>
                <th className="px-3 py-3 text-left text-[11px] font-semibold text-[#1E1E24]">Contact</th>
                <th className="px-3 py-3 text-left text-[11px] font-semibold text-[#1E1E24]">Vehicle</th>
                <th className="px-3 py-3 text-left text-[11px] font-semibold text-[#1E1E24]">Total Orders</th>
                <th className="px-3 py-3 text-left text-[11px] font-semibold text-[#1E1E24]">Status</th>
                <th className="px-3 py-3 text-left text-[11px] font-semibold text-[#1E1E24]">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <TableLoadingSkeleton colSpan={7} rows={8} />
              )}

              {!loading && fetchError && (
                <tr>
                  <td colSpan={7} className="px-3 py-10 text-center text-xs text-red-500">
                    {fetchError}
                  </td>
                </tr>
              )}

              {!loading && !fetchError && !deliverymen.length && (
                <tr>
                  <td colSpan={7} className="px-3 py-10 text-center text-xs text-gray-400">
                    No deliveryman found.
                  </td>
                </tr>
              )}

              {!loading && !fetchError && deliverymen.map((item, index) => (
                <tr
                  key={item.id}
                  className="group border-b border-gray-100 last:border-b-0 cursor-pointer transition-colors hover:bg-purple-50"
                  onClick={() => router.push(`/dashboard/deliveryman/details/${item.id}`)}
                >
                  <td className="px-3 py-3 text-xs text-gray-500 group-hover:bg-purple-50">{(page - 1) * PER_PAGE + index + 1}</td>
                  <td className="px-3 py-3 group-hover:bg-purple-50">
                    <div className="flex items-center gap-2">
                      <img
                        src={item.avatar || '/default-image.svg'}
                        alt={item.name}
                        className="h-7 w-7 rounded-full object-cover"
                        onError={(event) => {
                          event.currentTarget.onerror = null;
                          event.currentTarget.src = '/default-image.svg';
                        }}
                      />
                      <div>
                        <p className="text-xs font-semibold text-[#1E1E24]">{item.name}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-3 group-hover:bg-purple-50">
                    <p className="text-xs text-[#1E1E24]">{item.contactName}</p>
                    <p className="text-[11px] text-gray-500">
                      {formatPhoneWithFlag(item.phone, item.countryCode)}
                    </p>
                  </td>
                  <td className="px-3 py-3 group-hover:bg-purple-50">
                    <p className="text-xs text-[#1E1E24]">{item.vehicleType}</p>
                    <p className="text-[11px] text-gray-500">{item.vehicleNumber}</p>
                  </td>
                  <td className="px-3 py-3 text-xs text-[#1E1E24] group-hover:bg-purple-50">{item.ordersCompleted}</td>
                  <td className="px-3 py-3 group-hover:bg-purple-50">
                    <span
                      className={`inline-flex w-fit rounded-full px-2 py-1 text-[11px] font-medium ${
                        item.isActive
                          ? 'bg-[#E8FFF3] text-[#16A34A]'
                          : 'bg-[#FFF1F1] text-[#DC2626]'
                      }`}
                    >
                      {item.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-3 py-3 group-hover:bg-purple-50">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={(event) => {
                          event.stopPropagation();
                          router.push(`/dashboard/deliveryman/add?driver_user_id=${item.id}`);
                        }}
                        className="flex h-6 w-6 items-center justify-center rounded-md border border-[#C4B5FD] bg-[#F5F3FF] text-[#7C3AED]"
                      >
                        <Pencil size={12} />
                      </button>
                      <button
                        onClick={(event) => {
                          event.stopPropagation();
                          router.push(`/dashboard/deliveryman/details/${item.id}`);
                        }}
                        className="flex h-6 w-6 items-center justify-center rounded-md border border-[#FDBA74] bg-[#FFFBEB] text-[#F59E0B]"
                      >
                        <Eye size={12} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-gray-200 px-3 py-3">
          <button
            onClick={() => setPage((prev) => Math.max(1, prev - 1))}
            disabled={page <= 1}
            className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-gray-200 text-gray-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <ChevronLeft size={14} />
          </button>
          <span className="text-xs text-gray-600">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
            disabled={page >= totalPages}
            className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-gray-200 text-gray-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <ChevronRight size={14} />
          </button>
        </div>
      </section>
    </div>
  );
}

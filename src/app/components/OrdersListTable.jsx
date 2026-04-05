'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search as SearchIcon,
  Download,
  SlidersHorizontal,
  Eye,
  Printer,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { formatCurrencyFixed2 } from '@/app/lib/currency';

const statusStyles = {
  Scheduled: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  Pending: 'bg-amber-50 text-amber-700 border-amber-200',
  Accepted: 'bg-blue-50 text-blue-700 border-blue-200',
  Processing: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  'Food On The Way': 'bg-purple-50 text-purple-700 border-purple-200',
  Delivered: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  Cancelled: 'bg-rose-50 text-rose-700 border-rose-200',
  Refunded: 'bg-orange-50 text-orange-700 border-orange-200',
  'Offline Payments': 'bg-slate-50 text-slate-700 border-slate-200',
  'Payments Failed': 'bg-pink-50 text-pink-700 border-pink-200',
};

const paymentStatusStyles = {
  Paid: 'text-emerald-600',
  Unpaid: 'text-amber-500',
  Failed: 'text-rose-500',
  Refunded: 'text-indigo-500',
};

/**
 * Main orders table used on orders pages.
 * - filterLabel: "All" | "Pending" | "Accepted" | ...
 */
export default function OrdersListTable({ filterLabel = 'All', filterSlug='all' }) {
  const [search, setSearch] = useState('');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [orderTypeFilter, setOrderTypeFilter] = useState('All');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('All');
  const [page, setPage] = useState(1);
  const [orders, setOrders] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState('');
  const PER_PAGE = 20;
  const router = useRouter();

  useEffect(() => {
    setPage(1);
  }, [filterLabel]);

  useEffect(() => {
    const normalizeOrderStatus = (value, fallbackLabel) => {
      const raw = String(value ?? '').trim();
      const lower = raw.toLowerCase();

      const map = {
        pending: 'Pending',
        accepted: 'Accepted',
        processing: 'Processing',
        scheduled: 'Scheduled',
        delivered: 'Delivered',
        cancelled: 'Cancelled',
        canceled: 'Cancelled',
        refunded: 'Refunded',
        'food on the way': 'Food On The Way',
        food_on_the_way: 'Food On The Way',
        'food-on-the-way': 'Food On The Way',
        offline: 'Offline Payments',
        'offline payment': 'Offline Payments',
        'offline payments': 'Offline Payments',
        'payments failed': 'Payments Failed',
        payments_failed: 'Payments Failed',
        'payments-failed': 'Payments Failed',
      };

      const label =
        map[lower] ||
        // If API already returns the exact UI labels, keep them
        (statusStyles[raw] ? raw : '') ||
        (typeof fallbackLabel === 'string' && fallbackLabel.trim() && fallbackLabel !== 'All' ? fallbackLabel : '') ||
        'Pending';

      return { statusLabel: label, statusKey: label };
    };

    const formatDate = (value) => {
      if (!value) return '-';
      const date = new Date(value);
      if (Number.isNaN(date.getTime())) return String(value);
      return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    };

    const toAmount = (value) => formatCurrencyFixed2(value);

    const toOrderType = (orderTypeValue) => {
      const raw = String(orderTypeValue || '').toLowerCase();
      if (raw.includes('dine')) return 'Dine In';
      if (raw.includes('delivery')) return 'Home Delivery';
      return orderTypeValue || 'Home Delivery';
    };

    const normalizeOrder = (item, index) => {
      const deliveryAddress = item?.delivery_address || {};
      const customer =
        item?.customer ||
        item?.user ||
        item?.delivery_contact ||
        item?.delivery_address?.contact_person ||
        {};
      const customerName =
        item?.customer_name ||
        item?.customerName ||
        customer?.name ||
        customer?.full_name ||
        deliveryAddress?.contact_name ||
        `${customer?.f_name || customer?.first_name || ''} ${customer?.l_name || customer?.last_name || ''}`.trim() ||
        'N/A';
      const customerPhone =
        item?.customer_phone ||
        item?.customerPhone ||
        customer?.phone ||
        deliveryAddress?.contact_phone ||
        '-';
      const customerEmail =
        item?.customer_email ||
        item?.customerEmail ||
        customer?.email ||
        deliveryAddress?.contact_email ||
        '-';

      const { statusLabel, statusKey } = normalizeOrderStatus(
        item?.order_status || item?.status || '',
        filterLabel
      );

      return {
        id: item?.id ?? item?.order_id ?? `${page}-${index}`,
        orderId: String(item?.order_number || item?.orderNo || item?.order_id || item?.id || '-'),
        date: formatDate(item?.created_at || item?.date || item?.createdAt),
        userId: String(item?.user_id || item?.userId || item?.customer_id || ''),
        restaurantId: String(item?.restaurant_id || item?.restaurantId || ''),
        customerName,
        customerPhone,
        customerEmail,
        restaurant: item?.restaurant_name || item?.restaurant?.name || item?.store?.name || 'N/A',
        totalAmount: toAmount(item?.total_amount ?? item?.order_amount ?? item?.amount ?? 0),
        status: statusLabel,
        statusKey,
        orderType: toOrderType(item?.order_type || item?.delivery_type || item?.type),
        paymentMethod: item?.payment_method || 'Online',
        paymentStatus: item?.payment_status || 'Unpaid',
      };
    };

    const fetchOrders = async () => {
      setLoading(true);
      setFetchError('');
      try {
        const token = localStorage.getItem('token');
        const params = new URLSearchParams({
          page: String(page),
          limit: String(PER_PAGE),
          status: filterLabel || 'All',
          q: search.trim(),
          date_from: '',
          date_to: '',
          restaurant_id: '',
          user_id: '',
        });

        const response = await fetch(`/api/orders/?${params.toString()}`, {
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });

        const data = await response.json();
        if (!response.ok) {
          throw new Error(data?.message || 'Failed to fetch orders');
        }

        const list =
          data?.data?.orders ||
          data?.data?.list ||
          data?.orders ||
          data?.list ||
          data?.data ||
          [];
        const rawOrders = Array.isArray(list) ? list : [];
        const normalized = rawOrders.map(normalizeOrder);
        setOrders(normalized);

        const apiTotal =
          data?.data?.total ??
          data?.total ??
          data?.data?.total_size ??
          data?.total_size ??
          normalized.length;
        const parsedTotal = Number(apiTotal);
        setTotalCount(Number.isFinite(parsedTotal) ? parsedTotal : normalized.length);
      } catch (error) {
        setOrders([]);
        setTotalCount(0);
        setFetchError(error?.message || 'Failed to fetch orders');
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [filterLabel, filterSlug, page, search]);

  const filteredOrders = useMemo(() => {
    let base = orders;

    // Apply order type filter
    if (orderTypeFilter !== 'All') {
      base = base.filter((order) => order.orderType === orderTypeFilter);
    }

    // Apply payment status filter
    if (paymentStatusFilter !== 'All') {
      base = base.filter((order) => order.paymentStatus === paymentStatusFilter);
    }

    return base;
  }, [orders, orderTypeFilter, paymentStatusFilter]);

  const totalPages = Math.max(1, Math.ceil(totalCount / PER_PAGE));
  const paginatedOrders = filteredOrders;

  const handleExport = () => {
    if (!filteredOrders.length) return;

    const headers = [
      'Sl',
      'Order ID',
      'Order Date',
      'Customer Name',
      'Customer Phone',
      'Restaurant',
      'Total Amount',
      'Payment Status',
      'Order Status',
      'Order Type',
      'Payment Method',
    ];

    const rows = filteredOrders.map((order, index) => [
      index + 1,
      order.orderId,
      order.date,
      order.customerName,
      order.customerPhone,
      order.restaurant,
      order.totalAmount,
      order.paymentStatus,
      order.status,
      order.orderType,
      order.paymentMethod,
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], {
      type: 'text/csv;charset=utf-8;',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'orders-export.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-[#E4E4ED]">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 px-6 py-4 border-b border-[#E4E4ED]">
        <div>
          {/* <h2 className="text-lg font-semibold text-gray-900">Orders</h2>
          <p className="text-xs text-gray-500">
            Manage all active and scheduled orders
          </p> */}
          <div className="relative">
            <SearchIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6001D2]" />
            <input
              type="text"
              placeholder="Search any order..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="w-56 pl-3 pr-9 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
        </div>

        <div className="relative flex items-center gap-3">
          <button
            onClick={handleExport}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export</span>
          </button>
          <button
            onClick={() => setIsFilterOpen((prev) => !prev)}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Filters</span>
          </button>

          {isFilterOpen && (
            <div className="absolute right-0 top-11 w-64 bg-white border border-gray-200 rounded-xl shadow-lg p-4 space-y-4 z-10">
              <div>
                <p className="text-xs font-semibold text-gray-700 mb-2">
                  Order Type
                </p>
                <div className="space-y-1">
                  <label className="flex items-center gap-2 text-xs text-gray-700">
                    <input
                      type="radio"
                      name="orderType"
                      value="All"
                      checked={orderTypeFilter === 'All'}
                      onChange={() => setOrderTypeFilter('All')}
                    />
                    <span>All orders</span>
                  </label>
                  <label className="flex items-center gap-2 text-xs text-gray-700">
                    <input
                      type="radio"
                      name="orderType"
                      value="Home Delivery"
                      checked={orderTypeFilter === 'Home Delivery'}
                      onChange={() => setOrderTypeFilter('Home Delivery')}
                    />
                    <span>Home Delivery</span>
                  </label>
                  <label className="flex items-center gap-2 text-xs text-gray-700">
                    <input
                      type="radio"
                      name="orderType"
                      value="Dine In"
                      checked={orderTypeFilter === 'Dine In'}
                      onChange={() => setOrderTypeFilter('Dine In')}
                    />
                    <span>Dine In</span>
                  </label>
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold text-gray-700 mb-2">
                  Payment Status
                </p>
                <div className="space-y-1">
                  <label className="flex items-center gap-2 text-xs text-gray-700">
                    <input
                      type="radio"
                      name="paymentStatus"
                      value="All"
                      checked={paymentStatusFilter === 'All'}
                      onChange={() => setPaymentStatusFilter('All')}
                    />
                    <span>All</span>
                  </label>
                  <label className="flex items-center gap-2 text-xs text-gray-700">
                    <input
                      type="radio"
                      name="paymentStatus"
                      value="Paid"
                      checked={paymentStatusFilter === 'Paid'}
                      onChange={() => setPaymentStatusFilter('Paid')}
                    />
                    <span>Paid</span>
                  </label>
                  <label className="flex items-center gap-2 text-xs text-gray-700">
                    <input
                      type="radio"
                      name="paymentStatus"
                      value="Failed"
                      checked={paymentStatusFilter === 'Failed'}
                      onChange={() => setPaymentStatusFilter('Failed')}
                    />
                    <span>Failed</span>
                  </label>
                  <label className="flex items-center gap-2 text-xs text-gray-700">
                    <input
                      type="radio"
                      name="paymentStatus"
                      value="Refunded"
                      checked={paymentStatusFilter === 'Refunded'}
                      onChange={() => setPaymentStatusFilter('Refunded')}
                    />
                    <span>Refunded</span>
                  </label>
                </div>
              </div>

              <div className="flex justify-between pt-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => {
                    setOrderTypeFilter('All');
                    setPaymentStatusFilter('All');
                  }}
                  className="text-[11px] font-medium text-gray-500 hover:text-gray-700"
                >
                  Clear filters
                </button>
                <button
                  type="button"
                  onClick={() => setIsFilterOpen(false)}
                  className="px-3 py-1.5 text-[11px] font-medium rounded-lg bg-purple-600 text-white hover:bg-purple-700"
                >
                  Apply
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full text-[16px] md:text-sm">
          <thead className="bg-gray-50">
            <tr className="text-left text-black font-bold">
              <th className="py-3 px-4 font-bold whitespace-nowrap">Sl</th>
              <th className="py-3 px-4 font-bold whitespace-nowrap">Order ID</th>
              <th className="py-3 px-4 font-bold whitespace-nowrap">Order Date</th>
              <th className="py-3 px-4 font-bold whitespace-nowrap">Customer Information</th>
              <th className="py-3 px-4 font-bold whitespace-nowrap">Restaurant</th>
              <th className="py-3 px-4 font-bold whitespace-nowrap">Total Amount</th>
              <th className="py-3 px-4 font-bold whitespace-nowrap">Order Status</th>
              <th className="py-3 px-4 font-bold whitespace-nowrap text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={8} className="py-10 text-center text-sm text-gray-500">
                  Loading orders...
                </td>
              </tr>
            )}
            {!loading && fetchError && (
              <tr>
                <td colSpan={8} className="py-10 text-center text-sm text-rose-500">
                  {fetchError}
                </td>
              </tr>
            )}
            {!loading && !fetchError && paginatedOrders.map((order, index) => {
              const chipClass =
                statusStyles[order.statusKey] ??
                statusStyles[order.status] ??
                'bg-gray-50 text-[#1E1E24] border-gray-200';

              return (
                <tr
                  key={order.id}
                  onClick={() => router.push(`/dashboard/orders/${filterSlug}/${order.id}`)}
                  className="border-t border-gray-100 hover:bg-gray-50 cursor-pointer"
                >
                  <td className="py-3 px-6 text-gray-500 whitespace-nowrap">{(page - 1) * PER_PAGE + index + 1}</td>
                  <td className="py-3 px-4 font-regular text-gray-900 whitespace-nowrap">
                    {order.orderId}
                  </td>
                  <td className="py-3 px-4 text-gray-600 whitespace-nowrap">{order.date}</td>
                  <td className="py-3 px-4 whitespace-nowrap">
                    <div className="flex flex-col">
                      <span className="font-regular text-gray-900">
                        {order.customerName}
                      </span>
                      <span className="text-xs text-gray-500">
                        {order.customerEmail}
                      </span>
                      <span className="text-xs text-gray-500">
                        {order.customerPhone}
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-gray-700 whitespace-nowrap">{order.restaurant}</td>
                  <td className="py-3 px-4 whitespace-nowrap">
                    <div className="flex flex-col">
                      <span className="font-regular text-gray-900">
                        {order.totalAmount}
                      </span>
                      <span
                        className={`text-xs font-regular ${
                          paymentStatusStyles[order.paymentStatus] ??
                          'text-gray-500'
                        }`}
                      >
                        {order.paymentStatus}
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center px-3 py-1 rounded-full border text-[11px] font-semibold ${chipClass}`}
                    >
                      {order.status}
                    </span>
                    <div className="mt-1 text-[11px] text-gray-500">
                      {order.orderType}
                    </div>
                  </td>
                  <td className="py-3 px-4 text-right whitespace-nowrap">
  <div className="flex justify-end gap-2">

    {/* View */}
    <button
      onClick={(e) => {
        e.stopPropagation();
        router.push(`/dashboard/orders/${filterSlug}/${order.id}`);
      }}
      className="w-8 h-8 flex items-center justify-center rounded-md border border-orange-200 bg-orange-50 text-orange-500 hover:bg-orange-100 transition"
    >
      <Eye className="w-4 h-4" />
    </button>

    {/* Print */}
    <button
      onClick={(e) => {
        e.stopPropagation();
        console.log('Print order', order.orderId);
      }}
      className="w-8 h-8 flex items-center justify-center rounded-md border border-purple-200 bg-purple-50 text-purple-600 hover:bg-purple-100 transition"
    >
      <Printer className="w-4 h-4" />
    </button>

  </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {!loading && !fetchError && paginatedOrders.length === 0 && (
          <div className="py-10 text-center text-sm text-gray-500">
            No orders found for this filter.
          </div>
        )}
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
  );
}


'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Search, Download,
  Eye, Check, X,
  ChevronLeft, ChevronRight,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { formatPhoneWithFlag } from '@/app/lib/phone';
import { toast } from 'sonner';

const DEFAULT_RESTAURANT_IMAGE = '/default-image.svg';

export default function NewJoiningRequestsPage() {
  const router = useRouter();
  const [tab, setTab] = useState('pending'); // pending | rejected
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const PER_PAGE = 20;
  const [rows, setRows] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState('');
  const [approveConfirmOpen, setApproveConfirmOpen] = useState(false);
  const [selectedApproveId, setSelectedApproveId] = useState('');
  const [approveSubmitting, setApproveSubmitting] = useState(false);
  const [rejectStep, setRejectStep] = useState('closed'); // closed | reason | confirm
  const [rejectReason, setRejectReason] = useState('');
  const [selectedRejectId, setSelectedRejectId] = useState('');
  const [rejectSubmitting, setRejectSubmitting] = useState(false);

  useEffect(() => {
    const fetchRequests = async () => {
      setLoading(true);
      setFetchError('');
      try {
        const token = localStorage.getItem('token') || '';
        const params = new URLSearchParams({
          page: String(page),
          limit: String(PER_PAGE),
          status: tab === 'rejected' ? 'rejected' : 'pending',
        });
        if (search.trim()) params.set('search', search.trim());

        const response = await fetch(`/api/restaurants?${params.toString()}`, {
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });
        const payload = await response.json();
        if (!response.ok) throw new Error(payload?.message || 'Failed to load joining requests');

        const data = payload?.data && typeof payload.data === 'object' ? payload.data : payload;
        const list =
          data?.restaurants ||
          data?.list ||
          payload?.restaurants ||
          payload?.list ||
          [];

        const normalized = (Array.isArray(list) ? list : []).map((r, idx) => ({
          id: String(r?.id || `${page}-${idx}`),
          name: r?.name || 'N/A',
          image: r?.logo_url || r?.logo || '',
          rating: Number(r?.rating_avg || 0) || 0,
          reviews: Number(r?.rating_count || 0) || 0,
          owner: r?.owner_name || 'N/A',
          phone: r?.owner_phone || r?.phone || '-',
          radius: r?.radius_km ?? r?.service_radius_km ?? '-',
          businessMode: r?.business_mode || '-',
          status: String(r?.approval_status || 'pending'),
          address: r?.address || '-',
          raw: r,
        }));

        setRows(normalized);

        const total =
          data?.pagination?.total ??
          data?.total ??
          payload?.pagination?.total ??
          payload?.total ??
          normalized.length;
        const parsedTotal = Number(total);
        setTotalCount(Number.isFinite(parsedTotal) ? parsedTotal : normalized.length);
      } catch (e) {
        setRows([]);
        setTotalCount(0);
        setFetchError(e?.message || 'Failed to load joining requests');
      } finally {
        setLoading(false);
      }
    };

    fetchRequests();
  }, [page, search, tab]);

  const filtered = useMemo(() => rows, [rows]);

  const totalPages = Math.max(1, Math.ceil(totalCount / PER_PAGE));
  const paginated = filtered;

  const handleExport = () => {
    if (!filtered.length) return;
    const headers = ['SI', 'Restaurant Name', 'Owner', 'Phone', 'Radius', 'Status', 'Address'];
    const rows = filtered.map((r, i) => [
      i + 1, r.name, r.owner, r.phone, r.radius, r.status, `"${r.address}"`,
    ]);
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'joining-requests-export.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const goToDetails = (restaurantId) => {
    if (!restaurantId) return;
    router.push(`/dashboard/restaurants/details/${encodeURIComponent(String(restaurantId))}`);
  };

  const handleApprove = async (id) => {
    if (!id) return;
    try {
      setApproveSubmitting(true);
      const token = localStorage.getItem('token') || '';
      const response = await fetch(`/api/restaurants/${encodeURIComponent(String(id))}/approve`, {
        method: 'PATCH',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload?.message || 'Failed to approve request');

      setRows((prev) =>
        prev.map((row) =>
          String(row.id) === String(id)
            ? { ...row, status: 'approved' }
            : row
        )
      );
      toast.success('Restaurant approved successfully.');
    } catch (e) {
      toast.error(e?.message || 'Failed to approve request');
    } finally {
      setApproveSubmitting(false);
    }
  };

  const openApproveConfirm = (id) => {
    setSelectedApproveId(String(id || ''));
    setApproveConfirmOpen(true);
  };

  const handleReject = (id) => {
    setSelectedRejectId(String(id || ''));
    setRejectReason('');
    setRejectStep('reason');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="pt-36">
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">

          {/* Tabs */}
          <div className="flex items-center gap-6 px-6 pt-5">
            <button
              type="button"
              onClick={() => {
                setTab('pending');
                setPage(1);
              }}
              className={`text-sm font-semibold pb-2 border-b-2 ${
                tab === 'pending'
                  ? 'border-purple-600 text-purple-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Pending Requests
            </button>
            <button
              type="button"
              onClick={() => {
                setTab('rejected');
                setPage(1);
              }}
              className={`text-sm font-semibold pb-2 border-b-2 ${
                tab === 'rejected'
                  ? 'border-purple-600 text-purple-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Rejected Request
            </button>
          </div>

          {/* Table toolbar */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 px-6 py-4 border-b border-gray-100">
            <div className="relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6001D2]" />
              <input
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                placeholder="Search by restaurant..."
                className="w-56 pl-3 pr-9 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div className="relative flex items-center gap-3">
              <button
                onClick={handleExport}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export</span>
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/60">
                  <th className="text-left px-6 py-3 text-xs font-semibold text-black w-10">
                    SI
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-black">
                    Restaurant Info
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-black">
                    Owner Info
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-black">
                    Radius
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-black">
                    Status
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-black">
                    Address
                  </th>
                </tr>
              </thead>

              <tbody>
                {loading && (
                  <tr>
                    <td colSpan={6} className="text-center py-10 text-gray-400 text-sm">
                      Loading...
                    </td>
                  </tr>
                )}

                {!loading && fetchError && (
                  <tr>
                    <td colSpan={6} className="text-center py-10 text-red-500 text-sm">
                      {fetchError}
                    </td>
                  </tr>
                )}

                {!loading && !fetchError && paginated.map((r, idx) => (
                  <tr
                    key={r.id}
                    onClick={() => goToDetails(r.id)}
                    className="border-b border-gray-50 hover:bg-purple-50/30 transition-colors"
                  >
                    {/* SI */}
                    <td className="px-6 py-3 text-gray-400 text-xs">
                      {(page - 1) * PER_PAGE + idx + 1}
                    </td>

                    {/* Restaurant Info */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-purple-100 overflow-hidden flex-shrink-0">
                          <img
                            src={r.image || DEFAULT_RESTAURANT_IMAGE}
                            alt={r.name}
                            className="w-full h-full object-cover"
                            onError={(event) => {
                              event.currentTarget.onerror = null;
                              event.currentTarget.src = DEFAULT_RESTAURANT_IMAGE;
                            }}
                          />
                        </div>
                        <div>
                          <p className="font-semibold text-[#1E1E24] text-xs">
                            {r.name}
                          </p>
                          <div className="flex items-center gap-1 mt-0.5">
                            {'★★★★★'.split('').map((s, i) => (
                              <span
                                key={i}
                                className={`text-[10px] ${
                                  i < Math.round(r.rating)
                                    ? 'text-amber-400'
                                    : 'text-gray-300'
                                }`}
                              >
                                ★
                              </span>
                            ))}
                            <span className="text-[10px] text-gray-400">
                              ({r.reviews})
                            </span>
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Owner Info */}
                    <td className="px-4 py-3">
                      <p className="text-xs font-medium text-[#1E1E24]">
                        {r.owner}
                      </p>
                      <p className="text-[10px] text-gray-400">{formatPhoneWithFlag(r.phone)}</p>
                    </td>

                    {/* Radius */}
                    <td className="px-4 py-3 text-xs text-gray-600">
                      {r.radius}
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3">
                      {(() => {
                        const key = String(r.status || '').trim().toLowerCase();
                        const pillClass =
                          key === 'approved'
                            ? 'bg-emerald-50 text-emerald-600'
                            : key === 'rejected' || key === 'denied'
                              ? 'bg-rose-50 text-rose-600'
                              : 'bg-orange-50 text-orange-500';
                        return (
                          <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${pillClass}`}>
                            {r.status}
                          </span>
                        );
                      })()}
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            goToDetails(r.id);
                          }}
                          className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center text-blue-500 hover:bg-blue-100 transition"
                          title="View"
                        >
                          <Eye size={13} />
                        </button>
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            openApproveConfirm(r.id);
                          }}
                          className="w-7 h-7 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-500 hover:bg-emerald-100 transition"
                        >
                          <Check size={13} />
                        </button>
                        {tab !== 'rejected' && (
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              handleReject(r.id);
                            }}
                            className="w-7 h-7 rounded-lg bg-red-50 flex items-center justify-center text-red-400 hover:bg-red-100 transition"
                          >
                            <X size={13} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}

                {!loading && !fetchError && paginated.length === 0 && (
                  <tr>
                    <td
                      colSpan={6}
                      className="text-center py-10 text-gray-400 text-sm"
                    >
                      No joining requests found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100">
            <p className="text-xs text-gray-400">
              Showing{' '}
              {Math.min((page - 1) * PER_PAGE + 1, filtered.length)}–
              {Math.min(page * PER_PAGE, filtered.length)} of{' '}
              {filtered.length} results
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center text-gray-500 hover:border-purple-400 disabled:opacity-40"
              >
                <ChevronLeft size={14} />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
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
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center text-gray-500 hover:border-purple-400 disabled:opacity-40"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Reject modal (reason -> confirm) */}
      {rejectStep !== 'closed' && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onMouseDown={() => {
            if (rejectSubmitting) return;
            setRejectStep('closed');
          }}
        >
          <div
            className="w-full max-w-lg rounded-2xl bg-white shadow-xl"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-5">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-red-200 bg-red-50 text-red-500">
                !
              </div>

              {rejectStep === 'reason' && (
                <>
                  <h3 className="mt-4 text-center text-lg font-semibold text-gray-900">Reject request</h3>
                  <p className="mt-1 text-center text-sm text-gray-500">
                    First enter the rejection reason.
                  </p>

                  <div className="mt-4">
                    <label className="mb-1 block text-xs font-semibold text-gray-700">Reason</label>
                    <textarea
                      value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value)}
                      rows={3}
                      className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-800 focus:border-purple-500 focus:outline-none"
                      placeholder="Documents are incomplete or invalid."
                    />
                  </div>

                  <div className="mt-6 flex items-center justify-center gap-3">
                    <button
                      type="button"
                      disabled={rejectSubmitting}
                      onClick={() => setRejectStep('closed')}
                      className="h-10 w-28 rounded-lg bg-gray-100 text-sm font-semibold text-gray-700 hover:bg-gray-200 disabled:opacity-60"
                    >
                      No
                    </button>
                    <button
                      type="button"
                      disabled={!rejectReason.trim() || rejectSubmitting}
                      onClick={() => setRejectStep('confirm')}
                      className="h-10 w-28 rounded-lg bg-[#7C3AED] text-sm font-semibold text-white hover:bg-[#6D28D9] disabled:opacity-60"
                    >
                      Next
                    </button>
                  </div>
                </>
              )}

              {rejectStep === 'confirm' && (
                <>
                  <h3 className="mt-4 text-center text-lg font-semibold text-gray-900">Are you sure?</h3>
                  <p className="mt-1 text-center text-sm text-gray-500">
                    You want to reject this application.
                  </p>

                  <div className="mt-6 flex items-center justify-center gap-3">
                    <button
                      type="button"
                      disabled={rejectSubmitting}
                      onClick={() => setRejectStep('closed')}
                      className="h-10 w-28 rounded-lg bg-gray-100 text-sm font-semibold text-gray-700 hover:bg-gray-200 disabled:opacity-60"
                    >
                      No
                    </button>
                    <button
                      type="button"
                      disabled={rejectSubmitting}
                      onClick={async () => {
                        if (!selectedRejectId) return;
                        try {
                          setRejectSubmitting(true);
                          const token = localStorage.getItem('token') || '';
                          const response = await fetch(
                            `/api/restaurants/${encodeURIComponent(String(selectedRejectId))}/reject`,
                            {
                              method: 'PATCH',
                              headers: {
                                'Content-Type': 'application/json',
                                ...(token ? { Authorization: `Bearer ${token}` } : {}),
                              },
                              body: JSON.stringify({ reason: rejectReason.trim() }),
                            }
                          );
                          const payload = await response.json();
                          if (!response.ok) {
                            throw new Error(payload?.message || 'Failed to reject request');
                          }

                          setRows((prev) =>
                            prev.map((row) =>
                              String(row.id) === String(selectedRejectId)
                                ? { ...row, status: 'rejected', raw: { ...row.raw, rejection_reason: rejectReason.trim() } }
                                : row
                            )
                          );

                          toast.success('Restaurant rejected successfully.');
                          setRejectStep('closed');
                        } catch (e) {
                          toast.error(e?.message || 'Failed to reject request');
                        } finally {
                          setRejectSubmitting(false);
                          setSelectedRejectId('');
                          setRejectReason('');
                        }
                      }}
                      className="h-10 w-28 rounded-lg bg-red-500 text-sm font-semibold text-white hover:bg-red-600 disabled:opacity-60"
                    >
                      Yes
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Approve confirm modal */}
      {approveConfirmOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onMouseDown={() => {
            if (approveSubmitting) return;
            setApproveConfirmOpen(false);
            setSelectedApproveId('');
          }}
        >
          <div
            className="w-full max-w-lg rounded-2xl bg-white shadow-xl"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-5">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-purple-200 bg-purple-50 text-purple-600">
                !
              </div>
              <h3 className="mt-4 text-center text-lg font-semibold text-gray-900">Are you sure?</h3>
              <p className="mt-1 text-center text-sm text-gray-500">
                You want to approve this application.
              </p>

              <div className="mt-6 flex items-center justify-center gap-3">
                <button
                  type="button"
                  disabled={approveSubmitting}
                  onClick={() => {
                    setApproveConfirmOpen(false);
                    setSelectedApproveId('');
                  }}
                  className="h-10 w-28 rounded-lg bg-gray-100 text-sm font-semibold text-gray-700 hover:bg-gray-200 disabled:opacity-60"
                >
                  No
                </button>
                <button
                  type="button"
                  disabled={approveSubmitting}
                  onClick={async () => {
                    if (!selectedApproveId) return;
                    await handleApprove(selectedApproveId);
                    setApproveConfirmOpen(false);
                    setSelectedApproveId('');
                  }}
                  className="h-10 w-28 rounded-lg bg-[#7C3AED] text-sm font-semibold text-white hover:bg-[#6D28D9] disabled:opacity-60"
                >
                  Yes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

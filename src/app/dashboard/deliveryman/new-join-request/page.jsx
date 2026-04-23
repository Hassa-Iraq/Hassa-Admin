'use client';

import { useEffect, useMemo, useState } from 'react';
import { Check, ChevronLeft, ChevronRight, Download, Eye, Search, X } from 'lucide-react';
import { formatPhoneWithFlag } from '@/app/lib/phone';
import { useRouter } from 'next/navigation';

const PER_PAGE = 20;
const DEFAULT_AVATAR = '/default-image.svg';

export default function NewJoinRequestPage() {
  const router = useRouter();
  const [tab, setTab] = useState('pending'); // pending | rejected
  const [approveConfirmOpen, setApproveConfirmOpen] = useState(false);
  const [selectedApproveId, setSelectedApproveId] = useState('');
  const [approveSubmitting, setApproveSubmitting] = useState(false);
  const [rejectStep, setRejectStep] = useState('closed'); // closed | reason | confirm
  const [rejectReason, setRejectReason] = useState('');
  const [selectedRejectId, setSelectedRejectId] = useState('');
  const [rejectSubmitting, setRejectSubmitting] = useState(false);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState('');

  useEffect(() => {
    const fetchRequests = async () => {
      setLoading(true);
      setFetchError('');
      try {
        const token = localStorage.getItem('token') || '';
        const params = new URLSearchParams({
          page: String(page),
          limit: String(PER_PAGE),
          approval_status: tab,
        });
        if (search.trim()) params.set('search', search.trim());

        const response = await fetch(`/api/auth/drivers?${params.toString()}`, {
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });
        const payload = await response.json();
        if (!response.ok) throw new Error(payload?.message || 'Failed to load driver join requests');

        const data = payload?.data && typeof payload.data === 'object' ? payload.data : payload;
        const list =
          data?.drivers ||
          data?.deliverymen ||
          data?.list ||
          payload?.drivers ||
          payload?.list ||
          [];

        const normalized = (Array.isArray(list) ? list : []).map((d, idx) => {
          const id = String(d?.id ?? d?.driver_id ?? d?.user_id ?? `${page}-${idx}`);
          const name =
            d?.full_name ||
            d?.name ||
            `${d?.f_name || d?.first_name || ''} ${d?.l_name || d?.last_name || ''}`.trim() ||
            'N/A';
          const phone = d?.phone || d?.contact_phone || '-';
          const radius = d?.radius_km ?? d?.service_radius_km ?? d?.radius ?? '-';
          const jobType = d?.job_type || d?.jobType || d?.employment_type || '-';
          const vehicleType = d?.vehicle_type || d?.vehicleType || '-';
          const approvalStatus = String(d?.approval_status || d?.status || 'pending').toLowerCase();
          const avatar =
            d?.image_url ||
            d?.driver_image_url ||
            d?.avatar ||
            d?.profile_picture_url ||
            '';

          return {
            id,
            name,
            contactName: d?.contact_name || name,
            contactPhone: phone,
            radius,
            jobType,
            vehicleType,
            status: approvalStatus,
            avatar,
            raw: d,
          };
        });

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
        setFetchError(e?.message || 'Failed to load driver join requests');
      } finally {
        setLoading(false);
      }
    };

    fetchRequests();
  }, [page, search, tab]);

  const totalPages = Math.max(1, Math.ceil(totalCount / PER_PAGE));

  const handleExport = () => {
    if (!rows.length) return;
    const headers = ['SI', 'Name', 'Contact Name', 'Contact Phone', 'Vehicle Type', 'Status'];
    const csvRows = rows.map((r, i) => [
      i + 1,
      r.name,
      r.contactName,
      r.contactPhone,
      r.vehicleType,
      r.status,
    ]);

    const escapeCsv = (value) => {
      const raw = value === null || value === undefined ? '' : String(value);
      const needsQuotes = /[",\n]/.test(raw);
      const escaped = raw.replace(/"/g, '""');
      return needsQuotes ? `"${escaped}"` : escaped;
    };

    const csv = [
      headers.map(escapeCsv).join(','),
      ...csvRows.map((r) => r.map(escapeCsv).join(',')),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'deliveryman-join-requests-export.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const viewRows = useMemo(() => {
    // If backend ignores approval_status param, keep UI correct.
    return rows.filter((r) => String(r.status || '').toLowerCase() === tab);
  }, [rows, tab]);

  const goToDetails = (driverUserId) => {
    if (!driverUserId) return;
    router.push(`/dashboard/deliveryman/details/${encodeURIComponent(String(driverUserId))}`);
  };

  const openApproveConfirm = (id) => {
    setSelectedApproveId(String(id || ''));
    setApproveConfirmOpen(true);
  };

  const handleApprove = async (id) => {
    if (!id) return;
    try {
      setApproveSubmitting(true);
      const token = localStorage.getItem('token') || '';
      const response = await fetch(`/api/auth/admin/drivers/${encodeURIComponent(String(id))}/approve`, {
        method: 'PATCH',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload?.message || 'Failed to approve deliveryman');

      setRows((prev) => prev.map((row) => (String(row.id) === String(id) ? { ...row, status: 'approved' } : row)));
    } catch (e) {
      setFetchError(e?.message || 'Failed to approve deliveryman');
    } finally {
      setApproveSubmitting(false);
    }
  };

  const handleReject = (id) => {
    setSelectedRejectId(String(id || ''));
    setRejectReason('');
    setRejectStep('reason');
  };

  return (
    <div className="pt-36 pb-8">
      <section className="rounded-xl border border-gray-200 bg-white">
        {/* Tabs (same style as restaurant joining requests) */}
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

        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 p-3">
          <div className="relative w-full max-w-[360px]">
            <Search size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7C3AED]" />
            <input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search by deliveryman..."
              className="w-full rounded-lg border border-gray-200 py-2 pl-3 pr-8 text-xs text-gray-700 placeholder:text-gray-400 focus:border-[#7C3AED] focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
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
                <th className="px-3 py-3 text-left text-[11px] font-semibold text-[#1E1E24]">Vehicle Type</th>
                <th className="px-3 py-3 text-left text-[11px] font-semibold text-[#1E1E24]">Status</th>
                <th className="px-3 py-3 text-left text-[11px] font-semibold text-[#1E1E24]">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={8} className="px-3 py-10 text-center text-xs text-gray-400">
                    Loading...
                  </td>
                </tr>
              )}
              {!loading && fetchError && (
                <tr>
                  <td colSpan={8} className="px-3 py-10 text-center text-xs text-red-500">
                    {fetchError}
                  </td>
                </tr>
              )}
              {!loading && !fetchError && viewRows.map((row, index) => (
                <tr
                  key={row.id}
                  onClick={() => goToDetails(row.id)}
                  className="cursor-pointer border-b border-gray-100 hover:bg-gray-50 last:border-b-0"
                >
                  <td className="px-3 py-3 text-xs text-gray-500">{(page - 1) * PER_PAGE + index + 1}</td>
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-2">
                      <img
                        src={row.avatar || DEFAULT_AVATAR}
                        alt={row.name}
                        className="h-7 w-7 rounded-full object-cover"
                        onError={(event) => {
                          event.currentTarget.onerror = null;
                          event.currentTarget.src = DEFAULT_AVATAR;
                        }}
                      />
                      <p className="text-xs font-semibold text-[#1E1E24]">{row.name}</p>
                    </div>
                  </td>
                  <td className="px-3 py-3">
                    <p className="text-xs text-[#1E1E24]">{row.contactName}</p>
                    <p className="text-[11px] text-gray-500">{formatPhoneWithFlag(row.contactPhone)}</p>
                  </td>
                  <td className="px-3 py-3 text-xs text-[#1E1E24]">{row.vehicleType}</td>
                  <td className="px-3 py-3">
                    {(() => {
                      const st = String(row.status || '').toLowerCase();
                      const pill =
                        st === 'approved'
                          ? 'bg-emerald-50 text-emerald-600'
                          : st === 'rejected' || st === 'denied'
                            ? 'bg-rose-50 text-rose-600'
                            : 'bg-[#FFF7ED] text-[#F59E0B]';
                      return (
                        <span className={`inline-block rounded-sm px-2 py-0.5 text-[10px] font-medium ${pill}`}>
                          {row.status}
                        </span>
                      );
                    })()}
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          goToDetails(row.id);
                        }}
                        className="flex h-6 w-6 items-center justify-center rounded-md border border-[#FDBA74] bg-[#FFF7ED] text-[#F97316]"
                      >
                        <Eye size={12} />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          openApproveConfirm(row.id);
                        }}
                        className="flex h-6 w-6 items-center justify-center rounded-md border border-[#99F6E4] bg-[#ECFEFF] text-[#14B8A6]"
                      >
                        <Check size={12} />
                      </button>
                      {tab !== 'rejected' && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleReject(row.id);
                          }}
                          className="flex h-6 w-6 items-center justify-center rounded-md border border-[#FECACA] bg-[#FEF2F2] text-[#EF4444]"
                        >
                          <X size={12} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {!loading && !fetchError && viewRows.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-3 py-10 text-center text-xs text-gray-400">
                    No join requests found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-gray-100 px-4 py-3">
          <p className="text-xs text-gray-500">
            Page <span className="font-semibold text-gray-700">{page}</span> of{' '}
            <span className="font-semibold text-gray-700">{totalPages}</span>
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <ChevronLeft size={14} />
              Prev
            </button>
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Next
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </section>

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
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl" onMouseDown={(e) => e.stopPropagation()}>
            <div className="px-6 py-5">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-purple-200 bg-purple-50 text-purple-600">
                !
              </div>
              <h3 className="mt-4 text-center text-lg font-semibold text-gray-900">Are you sure?</h3>
              <p className="mt-1 text-center text-sm text-gray-500">You want to approve this application.</p>
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

      {/* Reject modal (reason -> confirm) */}
      {rejectStep !== 'closed' && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onMouseDown={() => {
            if (rejectSubmitting) return;
            setRejectStep('closed');
          }}
        >
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl" onMouseDown={(e) => e.stopPropagation()}>
            <div className="px-6 py-5">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-red-200 bg-red-50 text-red-500">
                !
              </div>

              {rejectStep === 'reason' && (
                <>
                  <h3 className="mt-4 text-center text-lg font-semibold text-gray-900">Reject request</h3>
                  <p className="mt-1 text-center text-sm text-gray-500">First enter the rejection reason.</p>
                  <div className="mt-4">
                    <label className="mb-1 block text-xs font-semibold text-gray-700">Reason</label>
                    <textarea
                      value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value)}
                      rows={3}
                      className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-800 focus:border-purple-500 focus:outline-none"
                      placeholder="Driving license image is unclear or expired."
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
                  <p className="mt-1 text-center text-sm text-gray-500">You want to reject this application.</p>
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
                            `/api/auth/admin/drivers/${encodeURIComponent(String(selectedRejectId))}/reject`,
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
                          if (!response.ok) throw new Error(payload?.message || 'Failed to reject deliveryman');

                          setRows((prev) =>
                            prev.map((row) =>
                              String(row.id) === String(selectedRejectId)
                                ? { ...row, status: 'rejected' }
                                : row
                            )
                          );
                          setRejectStep('closed');
                        } catch (e) {
                          setFetchError(e?.message || 'Failed to reject deliveryman');
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
    </div>
  );
}

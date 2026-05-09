'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { X } from 'lucide-react';
import { CenteredSpinner, LoadingSpinner } from '@/app/components/LoadingSpinner';

const formatDateTime = (value) => {
  if (!value) return '-';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

function DetailCard({ title, rows = [], rightSlot = null }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-[#1E1E24]">{title}</h3>
        {rightSlot}
      </div>
      <div className="mt-3 space-y-2 text-sm">
        {rows.map((r) => (
          <InfoLine key={r.label} label={r.label} value={r.value} />
        ))}
      </div>
    </div>
  );
}

function InfoLine({ label, value }) {
  return (
    <div className="grid grid-cols-1 gap-0.5 sm:grid-cols-[minmax(8rem,38%)_1fr] sm:gap-x-3 sm:gap-y-0">
      <span className="text-gray-500 text-xs">{label}</span>
      <span className="break-all text-xs font-medium text-[#1E1E24]">{value ?? '—'}</span>
    </div>
  );
}

export default function RestaurantWithdrawDetailPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const payoutId = useMemo(() => {
    const raw = params?.id;
    if (Array.isArray(raw)) return raw[0];
    return raw || '';
  }, [params?.id]);

  const lookup = useMemo(() => {
    const walletId = searchParams?.get('wallet_id') || '';
    const userId = searchParams?.get('user_id') || '';
    const requestedAt = searchParams?.get('requested_at') || '';
    const restaurantName = searchParams?.get('restaurant_name') || '';
    const idx = searchParams?.get('idx') || '';
    return { walletId, userId, requestedAt, restaurantName, idx };
  }, [searchParams]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [payout, setPayout] = useState(null);

  const [processOpen, setProcessOpen] = useState(false);
  const [decision, setDecision] = useState('approve'); // approve | reject
  const [note, setNote] = useState('');
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitError, setSubmitError] = useState('');

  useEffect(() => {
    let cancelled = false;

    const fetchDetails = async () => {
      if (!payoutId) return;
      setLoading(true);
      setError('');
      try {
        const token = localStorage.getItem('token') || '';

        // Backend list API is the source of truth (ids may not be unique).
        const query = new URLSearchParams({
          role: 'restaurant',
          page: '1',
          limit: '200',
        });
        // If backend supports searching, this narrows results and speeds up.
        query.set('q', String(payoutId));
        query.set('search', String(payoutId));

        const res = await fetch(`/api/wallet/admin/payouts?${query.toString()}`, {
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });
        const payload = await res.json();
        if (!res.ok) throw new Error(payload?.message || 'Failed to fetch withdraw details');

        const data = payload?.data && typeof payload.data === 'object' ? payload.data : payload;
        const list = data?.payouts || data?.requests || data?.items || data?.list || payload?.payouts || [];
        const payouts = Array.isArray(list) ? list : [];

        const matchesById = payouts.filter((p) => String(p?.id || p?._id || '') === String(payoutId));
        const candidates = matchesById.length ? matchesById : payouts;

        const pick = (arr) => {
          if (!arr.length) return null;
          const byWallet = lookup.walletId ? arr.filter((p) => String(p?.wallet_id || p?.walletId || '') === String(lookup.walletId)) : arr;
          const byUser = lookup.userId ? byWallet.filter((p) => String(p?.user_id || p?.userId || '') === String(lookup.userId)) : byWallet;
          const byRequestedAt = lookup.requestedAt ? byUser.filter((p) => String(p?.requested_at || p?.created_at || p?.requestedAt || p?.requested_time || '') === String(lookup.requestedAt)) : byUser;
          const byRestaurant =
            lookup.restaurantName
              ? byRequestedAt.filter((p) => String(p?.restaurant_name || p?.restaurant?.name || '').trim() === String(lookup.restaurantName).trim())
              : byRequestedAt;
          if (byRestaurant.length === 1) return byRestaurant[0];
          if (byRestaurant.length > 1) {
            const idx = Number(lookup.idx);
            if (Number.isFinite(idx) && idx >= 0 && idx < byRestaurant.length) return byRestaurant[idx];
            return byRestaurant[0];
          }
          if (byRequestedAt.length) return byRequestedAt[0];
          if (byUser.length) return byUser[0];
          if (byWallet.length) return byWallet[0];
          return arr[0];
        };

        const item = pick(candidates);
        if (!item) throw new Error('Withdraw details not found');

        if (!cancelled) setPayout(item);
      } catch (e) {
        if (!cancelled) {
          setPayout(null);
          setError(e?.message || 'Failed to fetch withdraw details');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchDetails();
    return () => {
      cancelled = true;
    };
  }, [payoutId]);

  const header = useMemo(() => {
    const amount = payout?.amount ?? payout?.requested_amount ?? payout?.withdraw_amount ?? '-';
    const requestedAt = payout?.requested_at || payout?.requestedAt || payout?.created_at || payout?.requested_time;
    return {
      amount,
      requestedAt,
      note: payout?.note || payout?.request_note || '',
    };
  }, [payout]);

  const paymentMethodRows = useMemo(() => {
    const bank = payout?.bank_details || payout?.bankDetails || payout?.payment_method || payout?.paymentMethod || {};

    // Prefer backend field names from `bank_details`.
    const iban = bank?.iban || '';
    const bankName = bank?.bank_name || bank?.bankName || '';
    const accountName = bank?.account_name || bank?.accountName || bank?.name || '';

    // Optional / legacy fields (only if backend provides them).
    const accountNumber = bank?.account_number || bank?.accountNumber || bank?.number || '';
    const email = bank?.email || '';
    const methodName = bank?.method_name || bank?.methodName || bank?.method || '';

    return [
      { label: 'Bank Name', value: bankName || '—' },
      { label: 'Account Name', value: accountName || '—' },
      { label: 'IBAN', value: iban || '—' },
      ...(accountNumber ? [{ label: 'Account Number', value: accountNumber }] : []),
      ...(email ? [{ label: 'Email', value: email }] : []),
      ...(methodName ? [{ label: 'Method', value: methodName }] : []),
    ];
  }, [payout]);

  const restaurantRows = useMemo(() => {
    const restaurantName = payout?.restaurant_name || payout?.restaurant?.name || '—';
    const phone = payout?.restaurant_phone || payout?.restaurant?.phone || '—';
    const address = payout?.restaurant_address || payout?.restaurant?.address || '—';
    const balance = payout?.restaurant_balance ?? payout?.balance ?? '';
    return [
      { label: 'Restaurant', value: restaurantName },
      { label: 'Phone', value: phone },
      { label: 'Address', value: address },
      ...(balance !== '' ? [{ label: 'Balance', value: String(balance) }] : []),
    ];
  }, [payout]);

  const ownerRows = useMemo(() => {
    const name = payout?.requester_name || payout?.owner_name || payout?.requester?.name || '—';
    const email = payout?.requester_email || payout?.owner_email || payout?.requester?.email || '—';
    const phone = payout?.requester_phone || payout?.owner_phone || payout?.requester?.phone || '—';
    return [
      { label: 'Name', value: name },
      { label: 'Email', value: email },
      { label: 'Phone', value: phone },
    ];
  }, [payout]);

  const handleSubmit = async () => {
    if (!payoutId) return;
    if (decision === 'reject' && !note.trim()) {
      setSubmitError('Note is required for rejection.');
      return;
    }
    setSubmitLoading(true);
    setSubmitError('');
    try {
      const token = localStorage.getItem('token') || '';
      const endpoint =
        decision === 'approve'
          ? `/api/wallet/admin/payouts/${encodeURIComponent(payoutId)}/approve`
          : `/api/wallet/admin/payouts/${encodeURIComponent(payoutId)}/reject`;

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: decision === 'reject' ? JSON.stringify({ note: note.trim() }) : JSON.stringify({}),
      });
      const payload = await res.json();
      if (!res.ok) throw new Error(payload?.message || 'Failed to process withdraw request');

      const allowed = new Set(['pending', 'approved', 'rejected']);
      const decisionStatus = decision === 'approve' ? 'approved' : 'rejected';
      const apiStatusRaw =
        payload?.data?.payout?.status ||
        payload?.data?.request?.status ||
        payload?.data?.status ||
        null;
      const apiStatus = String(apiStatusRaw || '').toLowerCase();
      const nextStatus = allowed.has(apiStatus) ? apiStatus : decisionStatus;

      // Redirect back to list with a valid payout status filter.
      router.push(`/dashboard/transactions/restaurant-withdraw?status=${encodeURIComponent(nextStatus)}`);
    } catch (e) {
      setSubmitError(e?.message || 'Failed to process withdraw request');
    } finally {
      setSubmitLoading(false);
    }
  };

  return (
    <div className="pt-36 pb-10">
      {loading ? (
        <div className="rounded-xl border border-gray-200 bg-white p-6">
          <CenteredSpinner minHeight="12rem" label="Loading withdraw request" />
        </div>
      ) : error ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-600">
          {error}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="rounded-xl border border-gray-200 bg-white p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="text-sm">
                <div className="flex flex-wrap items-center gap-6 text-xs text-gray-600">
                  <div>
                    <span className="font-semibold text-gray-700">Amount:</span> {header.amount}
                  </div>
                  <div>
                    <span className="font-semibold text-gray-700">Request time:</span> {formatDateTime(header.requestedAt)}
                  </div>
                  {header.note ? (
                    <div className="min-w-[220px]">
                      <span className="font-semibold text-gray-700">Note:</span> {String(header.note)}
                    </div>
                  ) : null}
                </div>
              </div>

              <button
                type="button"
                onClick={() => setProcessOpen(true)}
                className="rounded-lg bg-[#0EA5E9] px-4 py-2 text-xs font-semibold text-white hover:bg-[#0284C7]"
              >
                Proceed →
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <DetailCard title="Payment Method" rows={paymentMethodRows} />
            <DetailCard title="Restaurant info" rows={restaurantRows} />
            <DetailCard title="Owner info" rows={ownerRows} />
          </div>

          {processOpen ? (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
              role="dialog"
              aria-modal="true"
              aria-label="Withdraw request process"
              onMouseDown={() => setProcessOpen(false)}
            >
              <div
                className="w-full max-w-lg rounded-2xl bg-white shadow-xl"
                onMouseDown={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
                  <h3 className="text-sm font-semibold text-[#1E1E24]">Withdraw request process</h3>
                  <button
                    type="button"
                    onClick={() => setProcessOpen(false)}
                    className="rounded-lg p-2 text-gray-500 hover:bg-gray-100"
                    aria-label="Close"
                  >
                    <X size={16} />
                  </button>
                </div>

                <div className="px-6 py-5 space-y-4">
                  <div>
                    <label className="mb-1 block text-[11px] font-medium text-gray-700">Request</label>
                    <select
                      value={decision}
                      onChange={(e) => setDecision(e.target.value)}
                      className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-gray-700"
                    >
                      <option value="approve">Approve</option>
                      <option value="reject">Reject</option>
                    </select>
                  </div>

                  <div>
                    <label className="mb-1 block text-[11px] font-medium text-gray-700">
                      Note about transaction or request
                    </label>
                    <textarea
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      className="h-28 w-full rounded-lg border border-gray-200 px-3 py-2 text-xs text-gray-700"
                      placeholder={decision === 'reject' ? 'Write rejection reason...' : 'Optional note...'}
                    />
                    {submitError ? (
                      <p className="mt-2 text-[11px] text-rose-600">{submitError}</p>
                    ) : null}
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 border-t border-gray-200 px-6 py-4">
                  <button
                    type="button"
                    onClick={() => setProcessOpen(false)}
                    className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                  >
                    Close
                  </button>
                  <button
                    type="button"
                    disabled={submitLoading}
                    onClick={handleSubmit}
                    className="rounded-lg bg-[#0EA5E9] px-6 py-2 text-xs font-semibold text-white hover:bg-[#0284C7] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {submitLoading ? (
                      <span className="inline-flex items-center justify-center px-2">
                        <LoadingSpinner size="sm" className="[&_svg]:text-white" label="Submitting" />
                      </span>
                    ) : (
                      'Submit'
                    )}
                  </button>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}


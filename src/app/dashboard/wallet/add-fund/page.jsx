'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { API_BASE_URL } from '@/app/config';

function Field({ label, children }) {
  return (
    <div>
      <label className="mb-1 block text-[11px] font-medium text-[#1E1E24]">{label}</label>
      {children}
    </div>
  );
}

const DEFAULT_AVATAR = '/default-image.svg';

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
  if (!email) return 'Customer';
  const prefix = email.split('@')[0]?.replace(/[._-]+/g, ' ').trim() || '';
  return prefix
    ? prefix
        .split(' ')
        .filter(Boolean)
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(' ')
    : 'Customer';
};

export default function WalletAddFundPage() {
  const [customers, setCustomers] = useState([]);
  const [customersLoading, setCustomersLoading] = useState(false);
  const [customersError, setCustomersError] = useState('');

  const [walletUserId, setWalletUserId] = useState('');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState('');
  const [customerOpen, setCustomerOpen] = useState(false);
  const customerWrapRef = useRef(null);

  useEffect(() => {
    const fetchCustomers = async () => {
      setCustomersLoading(true);
      setCustomersError('');
      try {
        const token = localStorage.getItem('token') || '';
        const params = new URLSearchParams({
          page: '1',
          limit: '200',
        });

        // Use the same endpoint as Customers List page.
        const response = await fetch(`/api/orders/customers?${params.toString()}`, {
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });
        const payload = await response.json();
        if (!response.ok) throw new Error(payload?.message || 'Failed to load customers');

        const list =
          payload?.data?.customers ||
          payload?.data?.list ||
          payload?.customers ||
          payload?.list ||
          payload?.data ||
          [];

        const normalized = (Array.isArray(list) ? list : []).map((item, idx) => {
          // Same normalization approach as `src/app/dashboard/customers/page.jsx`
          const customer = item?.customer || item?.user || item || {};
          // API expects wallet_user_id (user id) in the URL param.
          const id = String(
            customer?.user_id ||
              item?.user_id ||
              customer?.id ||
              item?.id ||
              item?.customer_id ||
              `customer-${idx}`
          ).trim();
          const name = toDisplayName({
            ...customer,
            email: customer?.email || item?.email,
          });
          const avatar = toAbsoluteAssetUrl(
            customer?.profile_picture_url ||
              customer?.image_url ||
              customer?.avatar ||
              item?.profile_picture_url ||
              item?.image_url ||
              item?.avatar ||
              ''
          );

          return { id, name, avatar, raw: item };
        });

        setCustomers(normalized.filter((c) => Boolean(c.id)));
      } catch (e) {
        setCustomers([]);
        setCustomersError(e?.message || 'Failed to load customers');
      } finally {
        setCustomersLoading(false);
      }
    };

    fetchCustomers();
  }, []);

  useEffect(() => {
    if (!submitSuccess) return;
    const timeout = setTimeout(() => setSubmitSuccess(''), 5000);
    return () => clearTimeout(timeout);
  }, [submitSuccess]);

  const selectedCustomerLabel = useMemo(() => {
    const found = customers.find((c) => String(c.id) === String(walletUserId));
    if (!found) return '';
    return found.name;
  }, [customers, walletUserId]);

  const selectedCustomerAvatar = useMemo(() => {
    const found = customers.find((c) => String(c.id) === String(walletUserId));
    return found?.avatar || '';
  }, [customers, walletUserId]);

  useEffect(() => {
    const handler = (event) => {
      if (!customerWrapRef.current) return;
      if (!customerWrapRef.current.contains(event.target)) {
        setCustomerOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const resetForm = () => {
    setWalletUserId('');
    setAmount('');
    setNote('');
    setSubmitError('');
    setSubmitSuccess('');
    setCustomerOpen(false);
  };

  const handleSubmit = async () => {
    setSubmitError('');
    setSubmitSuccess('');

    const parsedAmount = Number(amount);
    const trimmedWalletUserId = String(walletUserId || '').trim();
    if (!trimmedWalletUserId) {
      setSubmitError('Please select a customer.');
      return;
    }
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      setSubmitError('Please enter a valid amount.');
      return;
    }

    try {
      setSubmitting(true);
      const token = localStorage.getItem('token') || '';
      const response = await fetch(
        `/api/wallet/admin/wallets/${encodeURIComponent(trimmedWalletUserId)}/add-funds`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            amount: parsedAmount,
            note: note?.trim() || undefined,
          }),
        }
      );

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload?.message || 'Failed to add funds');

      setSubmitSuccess(selectedCustomerLabel ? `Funds added successfully for ${selectedCustomerLabel}.` : 'Funds added successfully.');
      setAmount('');
      setNote('');
    } catch (e) {
      setSubmitError(e?.message || 'Failed to add funds');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      <section className="rounded-xl border border-gray-200 bg-white p-4">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <Field label="Customer">
            <div className="relative" ref={customerWrapRef}>
              <button
                type="button"
                onClick={() => setCustomerOpen((v) => !v)}
                disabled={customersLoading}
                className="flex w-full items-center justify-between gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-left text-xs text-gray-700 disabled:opacity-60"
              >
                <span className="flex min-w-0 items-center gap-2">
                  <img
                    src={selectedCustomerAvatar || DEFAULT_AVATAR}
                    onError={(e) => {
                      e.currentTarget.src = DEFAULT_AVATAR;
                    }}
                    alt=""
                    className="h-6 w-6 flex-none rounded-full border border-gray-200 object-cover"
                  />
                  <span className="truncate">
                    {walletUserId
                      ? selectedCustomerLabel
                      : customersLoading
                        ? 'Loading customers...'
                        : 'Select Customer'}
                  </span>
                </span>
                <span className="text-gray-400">{customerOpen ? '▲' : '▼'}</span>
              </button>

              {customerOpen && !customersLoading ? (
                <div className="absolute z-50 mt-1 w-full overflow-hidden rounded-lg border border-gray-200 bg-white shadow-lg">
                  <div className="max-h-64 overflow-auto py-1">
                    {customers.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => {
                          setWalletUserId(c.id);
                          setCustomerOpen(false);
                          setSubmitError('');
                          setSubmitSuccess('');
                        }}
                        className={`flex w-full items-center gap-2 px-3 py-2 text-left text-xs hover:bg-gray-50 ${
                          String(c.id) === String(walletUserId) ? 'bg-gray-50' : ''
                        }`}
                      >
                        <img
                          src={c.avatar || DEFAULT_AVATAR}
                          onError={(e) => {
                            e.currentTarget.src = DEFAULT_AVATAR;
                          }}
                          alt=""
                          className="h-6 w-6 flex-none rounded-full border border-gray-200 object-cover"
                        />
                        <span className="truncate text-gray-700">{c.name}</span>
                      </button>
                    ))}
                    {!customers.length ? (
                      <div className="px-3 py-2 text-xs text-gray-500">No customers found</div>
                    ) : null}
                  </div>
                </div>
              ) : null}
            </div>
            {customersError ? (
              <p className="mt-1 text-[11px] font-medium text-red-600">{customersError}</p>
            ) : null}
          </Field>
          <Field label="Amount">
            <input
              inputMode="decimal"
              type="number"
              value={amount}
              onChange={(e) => {
                setAmount(e.target.value);
                setSubmitError('');
                setSubmitSuccess('');
              }}
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-gray-700 placeholder:text-gray-400"
              placeholder="Ex: 100"
            />
          </Field>
        </div>

        <div className="mt-3">
          <Field label="Reference">
            <input
              value={note}
              onChange={(e) => {
                setNote(e.target.value);
                setSubmitError('');
                setSubmitSuccess('');
              }}
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-gray-700 placeholder:text-gray-400"
              placeholder="Ex: Bank"
            />
          </Field>
        </div>

        {submitError ? (
          <p className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-700">
            {submitError}
          </p>
        ) : null}
        {submitSuccess ? (
          <p className="mt-3 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-xs font-medium text-green-700">
            {submitSuccess}
          </p>
        ) : null}
      </section>

      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={resetForm}
          className="rounded-md border border-[#7C3AED] bg-white px-5 py-1.5 text-xs font-semibold text-[#7C3AED] disabled:opacity-60"
          disabled={submitting}
        >
          Reset
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          className="rounded-md bg-[#7C3AED] px-5 py-1.5 text-xs font-semibold text-white disabled:opacity-60"
          disabled={submitting || customersLoading}
        >
          {submitting ? 'Submitting...' : 'Submit'}
        </button>
      </div>
    </div>
  );
}

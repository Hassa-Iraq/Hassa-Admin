'use client';

import { useMemo, useState } from 'react';

const CUSTOMER_MESSAGES = [
  ['Order pending message', 'Order confirmation message'],
  ['Order processing message', 'Restaurant handover message'],
  ['Order out for delivery message', 'Order delivered message'],
  ['Deliveryman assign message', 'Deliveryman delivered message'],
  ['Order cancelled message', 'Order refunded message'],
  ['Order refund cancel message', 'Offline order accept message'],
  ['Offline order deny message', 'Customer delivery verification message'],
  ['Customer dine in table or token message', 'Customer add fund to wallet message'],
  ['Customer referral bonus earning message', 'Customer new referral join message'],
  ['Customer cashback message', 'Customer account block message'],
  ['Customer account unblock message', ''],
];

const RESTAURANT_MESSAGES = [
  ['Restaurant account block message', 'Restaurant account unblock message'],
  ['Restaurant withdraw approve message', 'Restaurant withdraw rejection message'],
  ['Restaurant campaign join approve message', 'Restaurant campaign join rejection message'],
  ['Restaurant order notification message', 'Restaurant advertisement added by admin message'],
  ['Restaurant advertisement approve message', 'Restaurant advertisement deny message'],
  ['Restaurant advertisement pause message', 'Restaurant advertisement resume message'],
  ['Restaurant subscription success message', 'Restaurant subscription renew message'],
  ['Restaurant subscription shift message', 'Restaurant subscription cancel message'],
  ['Restaurant subscription plan update from admin message', ''],
];

const DELIVERYMAN_MESSAGES = [
  ['Deliveryman account block message', 'Deliveryman account unblock message'],
  ['Deliveryman collect cash message', 'Deliveryman order assign message'],
  ['Deliveryman order unsign message', 'Deliveryman order proceed for cooking message'],
  ['Deliveryman order ready for delivery message', 'Deliveryman new order message'],
];

function Toggle({ checked = true }) {
  return (
    <button
      type="button"
      className={`relative inline-flex h-4 w-8 items-center rounded-full transition-colors ${
        checked ? 'bg-[#7C3AED]' : 'bg-gray-300'
      }`}
      aria-pressed={checked}
    >
      <span
        className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
          checked ? 'translate-x-[17px]' : 'translate-x-0.5'
        }`}
      />
    </button>
  );
}

function MessageInput({ label }) {
  const placeholder = label ? `{${label.split(' ')[0].toLowerCase()}Name} Your ${label.toLowerCase()}...` : '';
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between gap-2">
        <p className="truncate text-xs font-semibold text-[#1E1E24]">{label} (Default)</p>
        <Toggle checked />
      </div>
      <input
        disabled={!label}
        placeholder={placeholder}
        className={`w-full rounded-lg border border-gray-200 px-3 py-2 text-xs placeholder:text-gray-400 ${
          label ? 'bg-white text-gray-700' : 'bg-transparent'
        }`}
      />
    </div>
  );
}

export default function PushNotificationsPage() {
  const [activeTab, setActiveTab] = useState('customer');

  const rows = useMemo(() => {
    if (activeTab === 'restaurant') return RESTAURANT_MESSAGES;
    if (activeTab === 'deliveryman') return DELIVERYMAN_MESSAGES;
    return CUSTOMER_MESSAGES;
  }, [activeTab]);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4 px-1">
        <button
          onClick={() => setActiveTab('customer')}
          className={`text-xs font-medium ${activeTab === 'customer' ? 'text-[#7C3AED] underline underline-offset-4' : 'text-gray-500'}`}
        >
          Customer
        </button>
        <button
          onClick={() => setActiveTab('restaurant')}
          className={`text-xs font-medium ${activeTab === 'restaurant' ? 'text-[#7C3AED] underline underline-offset-4' : 'text-gray-500'}`}
        >
          Restaurant
        </button>
        <button
          onClick={() => setActiveTab('deliveryman')}
          className={`text-xs font-medium ${activeTab === 'deliveryman' ? 'text-[#7C3AED] underline underline-offset-4' : 'text-gray-500'}`}
        >
          Deliveryman
        </button>
      </div>

      <section className="rounded-xl border border-gray-200 bg-white">
        <div className="border-b border-gray-200 px-4 py-3">
          <h3 className="text-[28px] font-semibold leading-none text-[#1E1E24]">Push Notification</h3>
          <p className="mt-1 text-xs text-gray-500">
            Configure and send real-time push notifications to engage users and share important updates.
          </p>
        </div>

        <div className="border-b border-gray-200 px-4 py-2">
          <div className="flex items-center gap-3 text-[11px]">
            <span className="font-semibold text-[#7C3AED]">Default</span>
            <span className="text-gray-500">English (EN)</span>
            <span className="text-gray-500">Arabic (AR)</span>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 p-4 md:grid-cols-2">
          {rows.map(([left, right], index) => (
            <div key={`${left}-${index}`} className="space-y-3 md:col-span-2 md:grid md:grid-cols-2 md:gap-3 md:space-y-0">
              <MessageInput label={left} />
              <MessageInput label={right} />
            </div>
          ))}
        </div>
      </section>

      <div className="flex justify-end gap-2">
        <button className="rounded-md border border-[#7C3AED] bg-white px-6 py-1.5 text-xs font-semibold text-[#7C3AED]">
          Reset
        </button>
        <button className="rounded-md bg-[#7C3AED] px-6 py-1.5 text-xs font-semibold text-white">
          Save Information
        </button>
      </div>
    </div>
  );
}

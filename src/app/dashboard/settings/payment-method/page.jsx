'use client';

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

export default function PaymentMethodPage() {
  return (
    <div className="rounded-xl border border-gray-200 bg-white">
      <div className="border-b border-gray-200 px-4 py-3">
        <h3 className="text-xl font-semibold text-[#1E1E24]">Payment Options</h3>
        <p className="text-xs text-gray-500">Setup your business time zones and payment options from here.</p>
      </div>

      <div className="space-y-3 p-4">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <OptionCard title="Cash on Delivery" desc="Allow customers to pay in cash when the order is delivered." />
          <OptionCard title="Digital Payment" desc="Enable customers to make secure online payments." />
          <OptionCard title="Offline Payment" desc="Let customers pay through offline methods such as bank transfer." />
        </div>

        <InfoBox tone="amber" text="To enable this feature must be activated from Customer wallet and previous payment option section." />
        <InfoBox tone="purple" text="To use any payment method for partial payment you need to activate them from previous section." />

        <div className="rounded-lg border border-gray-200 p-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-[#1E1E24]">Partial Payment</p>
              <p className="text-xs text-gray-500">Customer can pay with wallet balance and partially pay from other gateways.</p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-gray-400">Status</span>
              <Toggle checked />
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 p-3">
          <p className="mb-2 text-sm font-semibold text-[#1E1E24]">Available options to pay the remaining bills *</p>
          <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
            <CheckItem label="Cash on Delivery" />
            <CheckItem label="Digital Payment" />
            <CheckItem label="Offline Payment" />
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <button className="rounded-md border border-[#7C3AED] bg-white px-6 py-1.5 text-xs font-semibold text-[#7C3AED]">Reset</button>
          <button className="rounded-md bg-[#7C3AED] px-6 py-1.5 text-xs font-semibold text-white">Save Information</button>
        </div>
      </div>
    </div>
  );
}

function OptionCard({ title, desc }) {
  return (
    <label className="rounded-lg border border-gray-200 p-3">
      <div className="mb-1 flex items-center gap-2">
        <input type="checkbox" defaultChecked className="h-3.5 w-3.5 accent-[#7C3AED]" />
        <span className="text-xs font-semibold text-[#1E1E24]">{title}</span>
      </div>
      <p className="text-[11px] leading-4 text-gray-500">{desc}</p>
    </label>
  );
}

function CheckItem({ label }) {
  return (
    <label className="flex items-center gap-2 rounded border border-gray-200 px-2 py-2">
      <input type="checkbox" defaultChecked className="h-3.5 w-3.5 accent-[#7C3AED]" />
      <span className="text-xs text-[#1E1E24]">{label}</span>
    </label>
  );
}

function InfoBox({ tone, text }) {
  const toneClass =
    tone === 'amber'
      ? 'border-amber-300 bg-amber-50 text-amber-700'
      : 'border-violet-300 bg-violet-50 text-violet-700';

  return (
    <div className={`rounded-lg border px-3 py-2 text-[11px] ${toneClass}`}>
      {text}
    </div>
  );
}

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

function Note({ tone = 'violet', text }) {
  const cls =
    tone === 'amber'
      ? 'border-amber-300 bg-amber-50 text-amber-700'
      : 'border-violet-300 bg-violet-50 text-violet-700';
  return <div className={`rounded-lg border px-3 py-2 text-[11px] ${cls}`}>{text}</div>;
}

function Field({ label, children }) {
  return (
    <div>
      <label className="mb-1 block text-[11px] font-medium text-[#1E1E24]">{label}</label>
      {children}
    </div>
  );
}

export default function DeliverymanSettingsPage() {
  return (
    <div className="space-y-4">
      <Note text="All Deliveryman you can show & manage them from Deliveryman List Page." />

      <section className="rounded-xl border border-gray-200 bg-white p-4">
        <h3 className="text-sm font-semibold text-[#1E1E24]">Basic Setup</h3>
        <p className="mb-3 text-xs text-gray-500">Manage the Deliveryman registration & order related setup from here</p>
        <Note tone="amber" text="You may setup Registration Form from Deliverymen Registration Form. Page to work properly." />

        <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
          <div className="rounded-lg border border-gray-200 p-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-[#1E1E24]">Deliveryman Self Registration</span>
              <Toggle checked />
            </div>
            <p className="mt-2 text-[11px] text-gray-400">Status</p>
          </div>
          <Field label="Manage Assigned Order Limit">
            <input className="w-full rounded-lg border border-gray-200 px-3 py-2 text-xs" defaultValue="5" />
          </Field>
        </div>
      </section>

      <section className="rounded-xl border border-gray-200 bg-white p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-[#1E1E24]">Tips for Deliveryman</h3>
            <p className="text-xs text-gray-500">If enabled, customer get the option to give tips during checkout.</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-400">Status</span>
            <Toggle checked />
          </div>
        </div>
        <div className="mt-3">
          <Note tone="amber" text="Admin will not earn any commission from the Tips For Delivery." />
        </div>
      </section>

      <section className="rounded-xl border border-gray-200 bg-white p-4">
        <h3 className="text-sm font-semibold text-[#1E1E24]">Deliveryman App Setup</h3>
        <p className="text-xs text-gray-500">Here you can manage the settings related to Deliveryman App</p>
        <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
          <div className="rounded-lg border border-gray-200 p-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-[#1E1E24]">Show Earning in App</span>
              <Toggle checked />
            </div>
            <p className="mt-2 text-[11px] text-gray-400">Status</p>
          </div>
          <div className="rounded-lg border border-gray-200 p-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-[#1E1E24]">Take Picture for Delivery Proof</span>
              <Toggle checked />
            </div>
            <p className="mt-2 text-[11px] text-gray-400">Status</p>
          </div>
        </div>
        <p className="mt-2 text-[11px] text-gray-500">To collect cash from delivery man visit Collect Cash.</p>
      </section>

      <section className="rounded-xl border border-gray-200 bg-white p-4">
        <h3 className="text-sm font-semibold text-[#1E1E24]">Cash in Hand Controls</h3>
        <p className="text-xs text-gray-500">Manage the cash in hand balance of deliveryman from here</p>
        <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-3">
          <div className="rounded-lg border border-gray-200 p-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-[#1E1E24]">Suspend on Cash In Hand Overflow</span>
              <Toggle checked />
            </div>
            <p className="mt-2 text-[11px] text-gray-400">Status</p>
          </div>
          <Field label="Max Amount to Hold Cash ($)">
            <input className="w-full rounded-lg border border-gray-200 px-3 py-2 text-xs" defaultValue="100000" />
          </Field>
          <Field label="Minimum Amount To Pay ($)">
            <input className="w-full rounded-lg border border-gray-200 px-3 py-2 text-xs" defaultValue="1000" />
          </Field>
        </div>
      </section>

      <div className="flex justify-end gap-2">
        <button className="rounded-md border border-[#7C3AED] bg-white px-6 py-1.5 text-xs font-semibold text-[#7C3AED]">Reset</button>
        <button className="rounded-md bg-[#7C3AED] px-6 py-1.5 text-xs font-semibold text-white">Save Information</button>
      </div>
    </div>
  );
}

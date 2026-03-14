'use client';

function Field({ label, children }) {
  return (
    <div>
      <label className="mb-1 block text-[11px] font-medium text-[#1E1E24]">{label}</label>
      {children}
    </div>
  );
}

export default function WalletAddFundPage() {
  return (
    <div className="space-y-4">
      <section className="rounded-xl border border-gray-200 bg-white p-4">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <Field label="Customer">
            <select className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-gray-700">
              <option>Select Customer</option>
            </select>
          </Field>
          <Field label="Amount">
            <input
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-gray-700 placeholder:text-gray-400"
              placeholder="Ex: 100"
            />
          </Field>
        </div>

        <div className="mt-3">
          <Field label="Reference (Optional)">
            <input
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-gray-700 placeholder:text-gray-400"
              placeholder="Ex: Bank"
            />
          </Field>
        </div>
      </section>

      <div className="flex justify-end gap-2">
        <button className="rounded-md border border-[#7C3AED] bg-white px-5 py-1.5 text-xs font-semibold text-[#7C3AED]">
          Reset
        </button>
        <button className="rounded-md bg-[#7C3AED] px-5 py-1.5 text-xs font-semibold text-white">
          Submit
        </button>
      </div>
    </div>
  );
}

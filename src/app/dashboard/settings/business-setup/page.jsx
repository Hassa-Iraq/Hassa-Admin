'use client';

import { Upload } from 'lucide-react';

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

function Input({ placeholder = '' }) {
  return (
    <input
      placeholder={placeholder}
      className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-gray-700 placeholder:text-gray-400 focus:border-[#7C3AED] focus:outline-none"
    />
  );
}

function Select({ children }) {
  return (
    <select className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-gray-700 focus:border-[#7C3AED] focus:outline-none">
      {children}
    </select>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <label className="mb-1 block text-[11px] font-medium text-[#1E1E24]">{label}</label>
      {children}
    </div>
  );
}

function Note({ tone = 'amber', text }) {
  const cls =
    tone === 'amber'
      ? 'border-amber-300 bg-amber-50 text-amber-700'
      : 'border-violet-300 bg-violet-50 text-violet-700';
  return <div className={`rounded-lg border px-3 py-2 text-[11px] ${cls}`}>{text}</div>;
}

function UploadBox({ title }) {
  return (
    <div className="rounded-lg border border-gray-100 bg-gray-50 p-3">
      <p className="text-xs font-semibold text-[#1E1E24]">{title} *</p>
      <p className="mt-0.5 text-[11px] text-gray-500">Upload your business {title.toLowerCase()} here</p>
      <div className="mt-2 flex h-28 flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 bg-white">
        <Upload size={16} className="text-[#7C3AED]" />
        <p className="mt-1 text-[11px] text-gray-500">Click to Upload or</p>
        <p className="text-xs font-semibold text-[#7C3AED]">Drag & Drop</p>
      </div>
      <p className="mt-2 text-[10px] text-gray-400">Jpeg, Jpg, Png, Webp Image : Max 2 MB</p>
    </div>
  );
}

function Section({ title, subtitle, children }) {
  return (
    <section className="rounded-xl border border-gray-200 bg-white">
      <div className="border-b border-gray-200 px-4 py-3">
        <h3 className="text-2xl font-semibold text-[#1E1E24]">{title}</h3>
        {subtitle ? <p className="text-xs text-gray-500">{subtitle}</p> : null}
      </div>
      <div className="p-4">{children}</div>
    </section>
  );
}

export default function BusinessSetupPage() {
  return (
    <div className="space-y-4">
      <section className="rounded-xl border border-gray-200 bg-white p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="text-[30px] font-semibold leading-none text-[#1E1E24]">Maintenance Mood</h3>
            <p className="mt-1 text-xs text-gray-500">
              Turn on maintenance mood will temporarily deactivate your systems as of your chosen date and time.
            </p>
          </div>
          <div className="flex min-w-[170px] items-center justify-between rounded-lg border border-gray-200 px-3 py-2">
            <span className="text-xs text-gray-400">Maintenance</span>
            <Toggle checked={false} />
          </div>
        </div>
      </section>

      <Section title="Basic Information" subtitle="Setup your business information here">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
          <div className="space-y-3 lg:col-span-8">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <Field label="Business Name *">
                <Input placeholder="Enter your Business Name" />
              </Field>
              <Field label="Email *">
                <Input placeholder="admin@admin.com" />
              </Field>
            </div>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <Field label="Phone *">
                <div className="grid grid-cols-[70px_1fr] gap-2">
                  <Input placeholder="+1" />
                  <Input placeholder="123-456-987" />
                </div>
              </Field>
              <Field label="Country Name *">
                <Select>
                  <option>Select Country</option>
                </Select>
              </Field>
            </div>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <Field label="Latitude *">
                <Input placeholder="23.756633" />
              </Field>
              <Field label="Longitude *">
                <Input placeholder="9.234" />
              </Field>
            </div>
            <div className="h-48 rounded-lg border border-gray-200 bg-gray-100 p-2">
              <div className="flex h-full items-center justify-center rounded bg-white text-xs text-gray-500">Map Area</div>
            </div>
          </div>

          <div className="space-y-3 lg:col-span-4">
            <UploadBox title="Business LOGO" />
            <UploadBox title="Favicon" />
          </div>
        </div>
      </Section>

      <Section title="General Setting" subtitle="Setup your all business general setting">
        <div className="space-y-4">
          <div className="rounded-xl border border-gray-200 p-3">
            <h4 className="text-sm font-semibold text-[#1E1E24]">Time Setup</h4>
            <p className="mb-3 text-xs text-gray-500">Setup your business time zone and format from here</p>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <Field label="Time Zone *">
                <Select>
                  <option>GMT(06:00) Central Time (US & Canada)</option>
                </Select>
              </Field>
              <Field label="Time Format *">
                <div className="flex h-[34px] items-center gap-6 rounded-lg border border-gray-200 bg-white px-3">
                  <label className="flex items-center gap-1 text-xs text-[#1E1E24]">
                    <input type="radio" name="timeFormat" className="accent-[#7C3AED]" /> 12 hr
                  </label>
                  <label className="flex items-center gap-1 text-xs text-[#1E1E24]">
                    <input type="radio" name="timeFormat" className="accent-[#7C3AED]" defaultChecked /> 24 hr
                  </label>
                </div>
              </Field>
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 p-3">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <h4 className="text-sm font-semibold text-[#1E1E24]">Country Picker</h4>
                <p className="text-xs text-gray-500">
                  If you disable this option, no country picker will show on customer's apps or websites.
                </p>
              </div>
              <div className="flex min-w-[140px] items-center justify-between rounded-lg border border-gray-200 px-3 py-2">
                <span className="text-xs text-gray-400">Status</span>
                <Toggle checked />
              </div>
            </div>
            <Note tone="amber" text="If you want to business on multiple countries, you need to turn on country picker future." />
          </div>

          <div className="rounded-xl border border-gray-200 p-3">
            <h4 className="text-sm font-semibold text-[#1E1E24]">Currency Setup</h4>
            <p className="mb-3 text-xs text-gray-500">Setup your business time zone and format from here</p>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              <Field label="Currency *">
                <Select>
                  <option>IQD (د.ع — Iraqi Dinar)</option>
                </Select>
              </Field>
              <Field label="Currency Symbol Position *">
                <Select>
                  <option>Left (IQD 123)</option>
                </Select>
              </Field>
              <Field label="Digit after decimal point *">
                <Input placeholder="2" />
              </Field>
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 p-3">
            <h4 className="text-sm font-semibold text-[#1E1E24]">Business Model Setup</h4>
            <p className="mb-3 text-xs text-gray-500">Setup your business model from here</p>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <div className="rounded-lg border border-gray-200 p-3">
                <label className="flex items-center gap-2 text-sm font-semibold text-[#1E1E24]">
                  <input type="radio" name="businessModel" className="accent-[#7C3AED]" />
                  Subscription
                </label>
                <p className="mt-1 text-[11px] text-gray-500">
                  By selecting subscription based business model restaurants can run business with package.
                </p>
                <div className="mt-2">
                  <Note tone="violet" text="To active subscription based business model you need to add subscription package." />
                </div>
              </div>
              <div className="rounded-lg border border-gray-200 p-3">
                <label className="flex items-center gap-2 text-sm font-semibold text-[#1E1E24]">
                  <input type="radio" name="businessModel" className="accent-[#7C3AED]" defaultChecked />
                  Commission
                </label>
                <p className="mt-1 text-[11px] text-gray-500">
                  By selecting commission based business model restaurants can run business with you based on commission.
                </p>
                <div className="mt-2">
                  <Note tone="amber" text="To set different commission for commission based restaurant, Go to restaurant details > business plan." />
                </div>
              </div>
            </div>
            <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
              <Field label="Default Commission (%) *">
                <Input placeholder="10" />
              </Field>
              <Field label="Commission on Delivery Charge (%) *">
                <Input placeholder="25" />
              </Field>
            </div>
            <div className="mt-3">
              <Note tone="amber" text="To set different commission for commission based restaurant, go to Restaurant List > Restaurant Details > Business Plan." />
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 p-3">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <h4 className="text-sm font-semibold text-[#1E1E24]">Additional Charge Setup</h4>
                <p className="text-xs text-gray-500">By switching this feature ON, customer need to pay the amount you set.</p>
              </div>
              <div className="flex min-w-[140px] items-center justify-between rounded-lg border border-gray-200 px-3 py-2">
                <span className="text-xs text-gray-400">Status</span>
                <Toggle checked />
              </div>
            </div>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <Field label="Additional Charge Name *">
                <Input placeholder="Service Charge" />
              </Field>
              <Field label="Charge Amount (IQD) *">
                <Input placeholder="25" />
              </Field>
            </div>
            <div className="mt-3">
              <Note tone="amber" text="Only admin will get the additional amount and customer must pay the amount." />
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 p-3">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <h4 className="text-sm font-semibold text-[#1E1E24]">Content Setup</h4>
                <p className="text-xs text-gray-500">By switching this feature ON, customer need to pay the amount you set.</p>
              </div>
              <div className="flex min-w-[140px] items-center justify-between rounded-lg border border-gray-200 px-3 py-2">
                <span className="text-xs text-gray-400">Status</span>
                <Toggle checked />
              </div>
            </div>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <Field label="Copy Right Text *">
                <Input placeholder="Copyright 2026" />
              </Field>
              <Field label="Cookies Text *">
                <Input placeholder="We use cookies and similar technologies on our website to enhance" />
              </Field>
            </div>
            <div className="mt-3">
              <Note tone="amber" text="Only admin will get the additional amount and customer must pay the amount." />
            </div>
          </div>
        </div>
      </Section>

      <div className="sticky bottom-0 z-20 flex justify-end gap-2 rounded-t-lg border border-gray-200 bg-white/95 px-4 py-3 backdrop-blur">
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

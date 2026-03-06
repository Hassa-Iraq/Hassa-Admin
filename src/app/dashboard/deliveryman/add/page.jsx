'use client';

import { Upload } from 'lucide-react';
import { useRef, useState } from 'react';
import PhoneCodeSelect from '@/app/components/PhoneCodeSelect';

const INITIAL_FORM = {
  firstName: '',
  lastName: '',
  radius: '',
  deliverymanType: '',
  phoneCode: '+1',
  phone: '',
  email: '',
  vehicleType: '',
  identityType: '',
  identityNumber: '',
  extraAge: '',
  birthdate: '',
  password: '',
  confirmPassword: '',
};

const PHONE_CODE_OPTIONS = [
  { value: '+1', code: 'US', flagUrl: 'https://flagcdn.com/w20/us.png' },
  { value: '+44', code: 'GB', flagUrl: 'https://flagcdn.com/w20/gb.png' },
  { value: '+92', code: 'PK', flagUrl: 'https://flagcdn.com/w20/pk.png' },
  { value: '+966', code: 'SA', flagUrl: 'https://flagcdn.com/w20/sa.png' },
  { value: '+971', code: 'AE', flagUrl: 'https://flagcdn.com/w20/ae.png' },
  { value: '+964', code: 'IQ', flagUrl: 'https://flagcdn.com/w20/iq.png' },
];

export default function AddDeliverymanPage() {
  const [form, setForm] = useState(INITIAL_FORM);
  const [previews, setPreviews] = useState({
    employeeImage: '',
    identityImage: '',
    drivingLicense: '',
  });

  const employeeImageRef = useRef(null);
  const identityImageRef = useRef(null);
  const drivingLicenseRef = useRef(null);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleFile = (key, file) => {
    if (!file) return;
    setPreviews((prev) => ({ ...prev, [key]: URL.createObjectURL(file) }));
  };

  const submitForm = (event) => {
    event.preventDefault();
    alert('Add deliveryman form is ready to connect with API.');
  };

  return (
    <div className="pt-36 pb-8">
      <form onSubmit={submitForm} className="space-y-4">
        <Section title="General Information">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <div className="space-y-3 lg:col-span-2">
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <Field label="First Name *">
                  <Input name="firstName" value={form.firstName} onChange={handleChange} placeholder="Enter First Name" />
                </Field>
                <Field label="Last Name *">
                  <Input name="lastName" value={form.lastName} onChange={handleChange} placeholder="Enter Last Name" />
                </Field>
              </div>

              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <Field label="Radius">
                  <Select
                    name="radius"
                    value={form.radius}
                    onChange={handleChange}
                    options={['Select Radius', 'All over the world', '5 km', '10 km']}
                  />
                </Field>
                <Field label="Deliveryman Type">
                  <Select
                    name="deliverymanType"
                    value={form.deliverymanType}
                    onChange={handleChange}
                    options={['Select Employee\'s Role', 'Freelance', 'Salary Based']}
                  />
                </Field>
              </div>

              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <Field label="Phone *">
                  <div className="flex">
                    <PhoneCodeSelect
                      name="phoneCode"
                      value={form.phoneCode}
                      onChange={handleChange}
                      options={PHONE_CODE_OPTIONS}
                      className="w-32"
                    />
                    <Input
                      name="phone"
                      value={form.phone}
                      onChange={handleChange}
                      placeholder="123-456-987"
                      className="rounded-l-none"
                    />
                  </div>
                </Field>
                <Field label="Email">
                  <Input name="email" value={form.email} onChange={handleChange} placeholder="admin@admin.com" />
                </Field>
              </div>
            </div>

            <UploadCard
              title="Deliveryman Image *"
              subtitle="Upload deliveryman image here"
              preview={previews.employeeImage}
              inputRef={employeeImageRef}
              onPick={(file) => handleFile('employeeImage', file)}
            />
          </div>
        </Section>

        <Section title="Vehicle Information">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <div className="space-y-3 lg:col-span-2">
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <Field label="Vehicle *">
                  <Select
                    name="vehicleType"
                    value={form.vehicleType}
                    onChange={handleChange}
                    options={['Select Vehicle Type', 'Car', 'Bike', 'Van']}
                  />
                </Field>
                <Field label="Identity Type *">
                  <Select
                    name="identityType"
                    value={form.identityType}
                    onChange={handleChange}
                    options={['Passport', 'National ID', 'Driving License']}
                  />
                </Field>
              </div>

              <div className="max-w-[340px]">
                <Field label="Identity Number *">
                  <Input name="identityNumber" value={form.identityNumber} onChange={handleChange} placeholder="Vehicle Identity Number" />
                </Field>
              </div>
            </div>

            <UploadCard
              title="Identity Image *"
              subtitle="Upload vehicle identity image here"
              preview={previews.identityImage}
              inputRef={identityImageRef}
              onPick={(file) => handleFile('identityImage', file)}
            />
          </div>
        </Section>

        <Section title="Additional Data">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <div className="space-y-3 lg:col-span-2">
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <Field label="Enter age *">
                  <Select
                    name="extraAge"
                    value={form.extraAge}
                    onChange={handleChange}
                    options={['Select Vehicle Type', '18+', '21+', '25+']}
                  />
                </Field>
                <Field label="Enter Birthdate *">
                  <Select
                    name="birthdate"
                    value={form.birthdate}
                    onChange={handleChange}
                    options={['Passport', '01/01/2000', '02/02/2001']}
                  />
                </Field>
              </div>
            </div>

            <UploadCard
              title="Driving License *"
              subtitle="Upload driving license image here"
              preview={previews.drivingLicense}
              inputRef={drivingLicenseRef}
              onPick={(file) => handleFile('drivingLicense', file)}
            />
          </div>
        </Section>

        <Section title="Account Information">
          <div className="rounded-lg bg-gray-50 p-3">
            <h4 className="text-sm font-semibold text-[#1E1E24]">Account Information</h4>
            <p className="text-xs text-gray-500">Setup your personal information from here</p>

            <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-3">
              <Field label="Email *">
                <Input name="email" value={form.email} onChange={handleChange} placeholder="Ex: dms@gmail.com" />
              </Field>
              <Field label="Password *">
                <Input name="password" value={form.password} onChange={handleChange} placeholder="*********" type="password" />
              </Field>
              <Field label="Confirm Password *">
                <Input name="confirmPassword" value={form.confirmPassword} onChange={handleChange} placeholder="*********" type="password" />
              </Field>
            </div>
          </div>
        </Section>

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={() => setForm(INITIAL_FORM)}
            className="rounded-md border border-[#7C3AED] bg-white px-5 py-1.5 text-xs font-semibold text-[#7C3AED] hover:bg-[#F8F4FF]"
          >
            Reset
          </button>
          <button
            type="submit"
            className="rounded-md bg-[#7C3AED] px-5 py-1.5 text-xs font-semibold text-white hover:bg-[#6D28D9]"
          >
            Save Information
          </button>
        </div>
      </form>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <section className="rounded-xl border border-gray-200 bg-white">
      <div className="border-b border-gray-200 px-4 py-3">
        <h3 className="text-xl font-semibold text-[#1E1E24]">{title}</h3>
      </div>
      <div className="p-4">{children}</div>
    </section>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-medium text-[#1E1E24]">{label}</label>
      {children}
    </div>
  );
}

function Input({ type = 'text', name, value, onChange, placeholder, className = '' }) {
  return (
    <input
      type={type}
      name={name}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className={`w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 placeholder:text-gray-400 focus:border-[#7C3AED] focus:outline-none ${className}`}
    />
  );
}

function Select({ name, value, onChange, options }) {
  return (
    <select
      name={name}
      value={value}
      onChange={onChange}
      className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:border-[#7C3AED] focus:outline-none"
    >
      <option value="">{options[0]}</option>
      {options.slice(1).map((option) => (
        <option key={option} value={option}>
          {option}
        </option>
      ))}
    </select>
  );
}

function UploadCard({ title, subtitle, preview, inputRef, onPick }) {
  return (
    <div className="rounded-lg bg-gray-50 p-3">
      <h4 className="text-sm font-semibold text-[#1E1E24]">{title}</h4>
      <p className="mt-1 text-xs text-gray-500">{subtitle}</p>

      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={(event) => event.preventDefault()}
        onDrop={(event) => {
          event.preventDefault();
          const file = event.dataTransfer?.files?.[0];
          if (file) onPick(file);
        }}
        className="mt-4 flex h-[140px] cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-white hover:border-[#7C3AED]"
      >
        {preview ? (
          <img src={preview} alt="preview" className="h-full w-full rounded-lg object-cover" />
        ) : (
          <>
            <Upload size={18} className="text-[#7C3AED]" />
            <p className="mt-2 text-xs text-gray-500">Click to Upload or</p>
            <p className="text-xs font-semibold text-[#7C3AED]">Drag &amp; Drop</p>
          </>
        )}
      </div>

      <p className="mt-2 text-[11px] text-gray-400">Jpg, Jpeg, Png, Webp Image : Max 2 MB (1:1)</p>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) onPick(file);
          event.target.value = '';
        }}
      />
    </div>
  );
}

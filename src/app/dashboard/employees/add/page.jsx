'use client';

import { Upload } from 'lucide-react';
import { useRef, useState } from 'react';

const INITIAL_FORM = {
  firstName: '',
  lastName: '',
  radius: '',
  role: '',
  phoneCode: '+1',
  phone: '',
  email: '',
  password: '',
  confirmPassword: '',
};

export default function AddEmployeePage() {
  const [form, setForm] = useState(INITIAL_FORM);
  const [preview, setPreview] = useState('');
  const fileRef = useRef(null);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleFile = (file) => {
    if (!file) return;
    setPreview(URL.createObjectURL(file));
  };

  const onDrop = (event) => {
    event.preventDefault();
    const file = event.dataTransfer?.files?.[0];
    if (file) handleFile(file);
  };

  const onSubmit = (event) => {
    event.preventDefault();
    alert('Add employee form is ready to connect with API.');
  };

  return (
    <div className="pt-36 pb-8">
      <form onSubmit={onSubmit} className="space-y-4">
        <section className="rounded-xl border border-gray-200 bg-white">
          <div className="border-b border-gray-200 px-4 py-3">
            <h3 className="text-xl font-semibold text-[#1E1E24]">General Information</h3>
          </div>

          <div className="p-4">
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
              <div className="space-y-3 lg:col-span-2">
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <Field label="First Name">
                    <Input name="firstName" value={form.firstName} onChange={handleChange} placeholder="Enter First Name" />
                  </Field>
                  <Field label="Last Name">
                    <Input name="lastName" value={form.lastName} onChange={handleChange} placeholder="Enter Last Name" />
                  </Field>
                </div>

                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <Field label="Radius">
                    <select
                      name="radius"
                      value={form.radius}
                      onChange={handleChange}
                      className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:border-[#7C3AED] focus:outline-none"
                    >
                      <option value="">Select Radius</option>
                      <option value="3km">3 km</option>
                      <option value="5km">5 km</option>
                      <option value="10km">10 km</option>
                    </select>
                  </Field>
                  <Field label="Role">
                    <select
                      name="role"
                      value={form.role}
                      onChange={handleChange}
                      className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:border-[#7C3AED] focus:outline-none"
                    >
                      <option value="">Select Employee's Role</option>
                      <option value="manager">Manager</option>
                      <option value="customer-care">Customer Care Executive</option>
                    </select>
                  </Field>
                </div>

                <div className="max-w-[320px]">
                  <Field label="Phone *">
                    <div className="flex">
                      <input
                        name="phoneCode"
                        value={form.phoneCode}
                        onChange={handleChange}
                        className="w-14 rounded-l-lg border border-gray-200 border-r-0 bg-[#F9FAFB] px-2 py-2 text-xs text-gray-500 focus:border-[#7C3AED] focus:outline-none"
                      />
                      <input
                        name="phone"
                        value={form.phone}
                        onChange={handleChange}
                        placeholder="123-456-987"
                        className="min-w-0 flex-1 rounded-r-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 placeholder:text-gray-400 focus:border-[#7C3AED] focus:outline-none"
                      />
                    </div>
                  </Field>
                </div>
              </div>

              <div className="rounded-lg bg-gray-50 p-3">
                <h4 className="text-sm font-semibold text-[#1E1E24]">Employee Image</h4>
                <p className="mt-1 text-xs text-gray-500">Upload an employee&apos;s image here</p>

                <div
                  onClick={() => fileRef.current?.click()}
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={onDrop}
                  className="mt-4 flex h-[160px] cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-white hover:border-[#7C3AED]"
                >
                  {preview ? (
                    <img src={preview} alt="employee-preview" className="h-full w-full rounded-lg object-cover" />
                  ) : (
                    <>
                      <Upload size={18} className="text-[#7C3AED]" />
                      <p className="mt-2 text-xs text-gray-500">
                        Click to Upload or
                      </p>
                      <p className="text-xs font-semibold text-[#7C3AED]">Drag &amp; Drop</p>
                    </>
                  )}
                </div>

                <p className="mt-2 text-[11px] text-gray-400">Jpg, Jpeg, Png, Webp Image : Max 2 MB (1:1)</p>

                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) handleFile(file);
                    event.target.value = '';
                  }}
                />
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-xl border border-gray-200 bg-white">
          <div className="border-b border-gray-200 px-4 py-3">
            <h3 className="text-xl font-semibold text-[#1E1E24]">Account Information</h3>
          </div>
          <div className="p-4">
            <div className="rounded-lg bg-gray-50 p-3">
              <h4 className="text-sm font-semibold text-[#1E1E24]">Account Information</h4>
              <p className="text-xs text-gray-500">Setup your personal information from here</p>

              <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-3">
                <Field label="Email *">
                  <Input name="email" value={form.email} onChange={handleChange} placeholder="Ex: admin@admin.com" />
                </Field>
                <Field label="Password *">
                  <Input name="password" value={form.password} onChange={handleChange} placeholder="*********" type="password" />
                </Field>
                <Field label="Confirm Password *">
                  <Input name="confirmPassword" value={form.confirmPassword} onChange={handleChange} placeholder="*********" type="password" />
                </Field>
              </div>
            </div>
          </div>
        </section>

        <div className="flex justify-end">
          <button
            type="submit"
            className="rounded-md bg-[#7C3AED] px-6 py-2 text-xs font-semibold text-white hover:bg-[#6D28D9]"
          >
            Submit
          </button>
        </div>
      </form>
    </div>
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

function Input({ type = 'text', name, value, onChange, placeholder }) {
  return (
    <input
      type={type}
      name={name}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 placeholder:text-gray-400 focus:border-[#7C3AED] focus:outline-none"
    />
  );
}

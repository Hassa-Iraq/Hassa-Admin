'use client';

import { Pencil, Upload } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import PhoneCodeSelect from '@/app/components/PhoneCodeSelect';
import { API_BASE_URL } from '@/app/config';
import { toast } from 'sonner';

const INITIAL_FORM = {
  firstName: '',
  lastName: '',
  phoneCode: '+1',
  phone: '',
  email: '',
  vehicleType: '',
  vehicleNumber: '',
  nationalId: '',
  notes: '',
  password: '',
  isActive: true,
};

const PHONE_CODE_OPTIONS = [
  { value: '+1', code: 'US', flagUrl: 'https://flagcdn.com/w20/us.png' },
  { value: '+44', code: 'GB', flagUrl: 'https://flagcdn.com/w20/gb.png' },
  { value: '+92', code: 'PK', flagUrl: 'https://flagcdn.com/w20/pk.png' },
  { value: '+966', code: 'SA', flagUrl: 'https://flagcdn.com/w20/sa.png' },
  { value: '+971', code: 'AE', flagUrl: 'https://flagcdn.com/w20/ae.png' },
  { value: '+964', code: 'IQ', flagUrl: 'https://flagcdn.com/w20/iq.png' },
];

const toAbsoluteUrl = (value) => {
  if (!value || typeof value !== 'string') return '';
  const trimmed = value.trim();
  if (!trimmed) return '';
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed;
  if (trimmed.startsWith('//')) return `https:${trimmed}`;
  if (trimmed.startsWith('/')) return `${API_BASE_URL}${trimmed}`;
  return `${API_BASE_URL}/${trimmed}`;
};

const pickString = (...values) => {
  const matched = values.find((value) => typeof value === 'string' && value.trim());
  return matched ? matched.trim() : '';
};

export default function AddDeliverymanPage() {
  const router = useRouter();
  const [driverUserId, setDriverUserId] = useState('');
  const isEditMode = Boolean(driverUserId);
  const [form, setForm] = useState(INITIAL_FORM);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [loadingDriver, setLoadingDriver] = useState(false);
  const [existingAssetUrls, setExistingAssetUrls] = useState({
    image_url: '',
    vehicle_image_url: '',
    driving_license_image_url: '',
  });
  const [files, setFiles] = useState({
    deliveryManPicture: null,
    vehicleImage: null,
    drivingLicensePicture: null,
  });
  const [previews, setPreviews] = useState({
    deliveryManPicture: '',
    vehicleImage: '',
    drivingLicensePicture: '',
  });

  const deliveryManPictureRef = useRef(null);
  const vehicleImageRef = useRef(null);
  const drivingLicenseRef = useRef(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const queryDriverUserId = params.get('driver_user_id') || params.get('id') || '';
    setDriverUserId(queryDriverUserId);
  }, []);

  const splitPhoneNumber = (phoneValue = '') => {
    const raw = String(phoneValue || '').trim();
    if (!raw) return { phoneCode: '+1', phone: '' };

    const sortedCodes = [...PHONE_CODE_OPTIONS]
      .map((item) => String(item.value || '').trim())
      .filter(Boolean)
      .sort((a, b) => b.length - a.length);
    const matchedCode = sortedCodes.find((code) => raw.startsWith(code));
    if (!matchedCode) {
      return { phoneCode: '+1', phone: raw.replace(/^\+/, '') };
    }
    return {
      phoneCode: matchedCode,
      phone: raw.slice(matchedCode.length),
    };
  };

  useEffect(() => {
    const loadDriverForEdit = async () => {
      if (!isEditMode) return;
      setLoadingDriver(true);
      setErrors({});
      try {
        const token = localStorage.getItem('token') || '';
        const { data } = await axios.get(`/api/auth/drivers/${driverUserId}`, {
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });
        const root = data?.data && typeof data.data === 'object' ? data.data : data;
        const driver = root?.driver || root?.data?.driver || root;
        const fullName = pickString(driver?.full_name, driver?.name);
        const nameParts = fullName.split(/\s+/).filter(Boolean);
        const phoneParts = splitPhoneNumber(pickString(driver?.phone));
        const imageUrl = pickString(driver?.image_url, driver?.driver_image_url);
        const vehicleImageUrl = pickString(driver?.vehicle_image_url);
        const licenseImageUrl = pickString(driver?.driving_license_image_url);
        const additionalData = driver?.additional_data && typeof driver.additional_data === 'object'
          ? driver.additional_data
          : {};

        setExistingAssetUrls({
          image_url: imageUrl || '',
          vehicle_image_url: vehicleImageUrl || '',
          driving_license_image_url: licenseImageUrl || '',
        });
        setPreviews({
          deliveryManPicture: toAbsoluteUrl(imageUrl),
          vehicleImage: toAbsoluteUrl(vehicleImageUrl),
          drivingLicensePicture: toAbsoluteUrl(licenseImageUrl),
        });
        setForm({
          firstName: nameParts[0] || '',
          lastName: nameParts.slice(1).join(' '),
          phoneCode: phoneParts.phoneCode,
          phone: phoneParts.phone,
          email: pickString(driver?.email),
          vehicleType: pickString(driver?.vehicle_type, driver?.vehicleType),
          vehicleNumber: pickString(driver?.vehicle_number, driver?.vehicleNumber),
          nationalId: pickString(additionalData?.national_id, additionalData?.nationalId),
          notes: pickString(additionalData?.notes),
          password: '',
          isActive: Boolean(driver?.is_active ?? true),
        });
      } catch (error) {
        const message = axios.isAxiosError(error)
          ? error.response?.data?.message || error.message || 'Failed to load deliveryman'
          : error?.message || 'Failed to load deliveryman';
        toast.error(message);
      } finally {
        setLoadingDriver(false);
      }
    };

    loadDriverForEdit();
  }, [driverUserId, isEditMode]);

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;
    setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const handleFile = (key, file) => {
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      setErrors((prev) => ({ ...prev, [key]: 'Image size must be less than 2 MB' }));
      return;
    }
    setErrors((prev) => ({ ...prev, [key]: '' }));
    setFiles((prev) => ({ ...prev, [key]: file }));
    setPreviews((prev) => ({ ...prev, [key]: URL.createObjectURL(file) }));
  };

  const buildPhoneNumber = () => {
    const code = String(form.phoneCode || '').trim();
    const number = String(form.phone || '').trim();
    if (!number) return '';
    const normalizedCode = code ? (code.startsWith('+') ? code : `+${code}`) : '';
    if (!normalizedCode) return number;
    if (number.startsWith('+')) return number;
    return `${normalizedCode}${number.startsWith('0') ? number.slice(1) : number}`;
  };

  const validate = () => {
    const nextErrors = {};
    if (!form.firstName.trim()) nextErrors.firstName = 'First name is required';
    if (!form.lastName.trim()) nextErrors.lastName = 'Last name is required';
    if (!form.phone.trim()) nextErrors.phone = 'Phone is required';
    if (!form.email.trim()) nextErrors.email = 'Email is required';
    if (!form.vehicleType) nextErrors.vehicleType = 'Vehicle type is required';
    if (!form.vehicleNumber.trim()) nextErrors.vehicleNumber = 'Vehicle number is required';
    if (!form.nationalId.trim()) nextErrors.nationalId = 'National ID is required';
    if (!isEditMode && !form.password.trim()) nextErrors.password = 'Password is required';
    if (!isEditMode && !files.deliveryManPicture) nextErrors.deliveryManPicture = 'Deliveryman image is required';
    if (!isEditMode && !files.vehicleImage) nextErrors.vehicleImage = 'Vehicle image is required';
    if (!isEditMode && !files.drivingLicensePicture) nextErrors.drivingLicensePicture = 'Driving license image is required';
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const extractUploadAssetUrls = (data = {}) => {
    const source = data?.data && typeof data.data === 'object' ? data.data : data;
    const assets = source?.assets && typeof source.assets === 'object' ? source.assets : {};
    return {
      image_url: pickString(
        source?.image_url,
        source?.delivery_man_picture_url,
        source?.driver_image_url,
        source?.delivery_man_picture,
        assets?.image_url,
        assets?.delivery_man_picture_url
      ),
      vehicle_image_url: pickString(
        source?.vehicle_image_url,
        source?.vehicle_picture_url,
        source?.vehicle_image,
        assets?.vehicle_image_url
      ),
      driving_license_image_url: pickString(
        source?.driving_license_image_url,
        source?.driving_license_picture_url,
        source?.license_image_url,
        source?.driving_license_picture,
        assets?.driving_license_image_url
      ),
    };
  };

  const uploadDriverAssets = async (token) => {
    const changedKeys = [];
    if (files.deliveryManPicture) changedKeys.push('delivery_man_picture');
    if (files.vehicleImage) changedKeys.push('vehicle_image');
    if (files.drivingLicensePicture) changedKeys.push('driving_license_picture');
    if (!changedKeys.length) {
      return {
        image_url: '',
        vehicle_image_url: '',
        driving_license_image_url: '',
      };
    }

    const formData = new FormData();
    if (files.deliveryManPicture) formData.append('delivery_man_picture', files.deliveryManPicture);
    if (files.vehicleImage) formData.append('vehicle_image', files.vehicleImage);
    if (files.drivingLicensePicture) formData.append('driving_license_picture', files.drivingLicensePicture);
    formData.append('save_to_driver', 'false');

    const { data } = await axios.post('/api/auth/drivers/upload-assets', formData, {
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });

    const urls = extractUploadAssetUrls(data);
    if (files.deliveryManPicture && !urls.image_url) throw new Error('Deliveryman image upload failed. URL not returned.');
    if (files.vehicleImage && !urls.vehicle_image_url) throw new Error('Vehicle image upload failed. URL not returned.');
    if (files.drivingLicensePicture && !urls.driving_license_image_url) throw new Error('Driving license upload failed. URL not returned.');
    return urls;
  };

  const handleReset = () => {
    setForm(INITIAL_FORM);
    setErrors({});
    setFiles({
      deliveryManPicture: null,
      vehicleImage: null,
      drivingLicensePicture: null,
    });
    setPreviews({
      deliveryManPicture: '',
      vehicleImage: '',
      drivingLicensePicture: '',
    });
    setExistingAssetUrls({
      image_url: '',
      vehicle_image_url: '',
      driving_license_image_url: '',
    });
  };

  const submitForm = async (event) => {
    event.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    try {
      const token = localStorage.getItem('token') || '';

      // Required behavior: if user changed image(s), upload assets first.
      const uploadedAssets = await uploadDriverAssets(token);
      const payload = {
        email: form.email.trim(),
        phone: buildPhoneNumber(),
        full_name: `${form.firstName} ${form.lastName}`.trim(),
        image_url: uploadedAssets.image_url || existingAssetUrls.image_url || null,
        vehicle_type: form.vehicleType,
        vehicle_number: form.vehicleNumber.trim(),
        vehicle_image_url: uploadedAssets.vehicle_image_url || existingAssetUrls.vehicle_image_url || null,
        driving_license_image_url: uploadedAssets.driving_license_image_url || existingAssetUrls.driving_license_image_url || null,
        additional_data: {
          national_id: form.nationalId.trim(),
          notes: form.notes.trim(),
        },
        is_active: Boolean(form.isActive),
      };
      if (!isEditMode || form.password.trim()) {
        payload.password = form.password;
      }

      if (isEditMode) {
        await axios.patch(`/api/auth/drivers/${driverUserId}`, payload, {
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });
      } else {
        await axios.post('/api/auth/drivers', payload, {
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });
      }

      toast.success(isEditMode ? 'Deliveryman updated successfully.' : 'Deliveryman created successfully.');
      router.push('/dashboard/deliveryman/list');
    } catch (error) {
      const message = axios.isAxiosError(error)
        ? error.response?.data?.message || error.message || 'Failed to save deliveryman'
        : error?.message || 'Failed to save deliveryman';
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="pt-36 pb-8">
      <form onSubmit={submitForm} className="space-y-4">
        {isEditMode && (
          <div className="inline-flex items-center gap-2 rounded-lg border border-[#C4B5FD] bg-[#F5F3FF] px-3 py-2 text-xs font-medium text-[#6D28D9]">
            <Pencil size={12} />
            Edit mode enabled
          </div>
        )}

        {loadingDriver && (
          <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700">
            Loading deliveryman details...
          </div>
        )}

        <Section title="General Information">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <div className="space-y-3 lg:col-span-2">
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <Field label="First Name *">
                  <Input name="firstName" value={form.firstName} onChange={handleChange} placeholder="Enter First Name" />
                  {errors.firstName && <p className="mt-1 text-[11px] text-red-500">{errors.firstName}</p>}
                </Field>
                <Field label="Last Name *">
                  <Input name="lastName" value={form.lastName} onChange={handleChange} placeholder="Enter Last Name" />
                  {errors.lastName && <p className="mt-1 text-[11px] text-red-500">{errors.lastName}</p>}
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
                  {errors.phone && <p className="mt-1 text-[11px] text-red-500">{errors.phone}</p>}
                </Field>
                <Field label="Email *">
                  <Input name="email" value={form.email} onChange={handleChange} placeholder="admin@admin.com" />
                  {errors.email && <p className="mt-1 text-[11px] text-red-500">{errors.email}</p>}
                </Field>
              </div>
            </div>

            <UploadCard
              title="Deliveryman Image *"
              subtitle="Upload deliveryman image here"
              preview={previews.deliveryManPicture}
              inputRef={deliveryManPictureRef}
              onPick={(file) => handleFile('deliveryManPicture', file)}
              error={errors.deliveryManPicture}
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
                    options={['Select Vehicle Type', 'Bike']}
                  />
                  {errors.vehicleType && <p className="mt-1 text-[11px] text-red-500">{errors.vehicleType}</p>}
                </Field>
                <Field label="Vehicle Number *">
                  <Input name="vehicleNumber" value={form.vehicleNumber} onChange={handleChange} placeholder="KHI-1234" />
                  {errors.vehicleNumber && <p className="mt-1 text-[11px] text-red-500">{errors.vehicleNumber}</p>}
                </Field>
              </div>
            </div>

            <UploadCard
              title="Vehicle Image *"
              subtitle="Upload vehicle image here"
              preview={previews.vehicleImage}
              inputRef={vehicleImageRef}
              onPick={(file) => handleFile('vehicleImage', file)}
              error={errors.vehicleImage}
            />
          </div>
        </Section>

        <Section title="Additional Data">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <div className="space-y-3 lg:col-span-2">
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <Field label="National ID *">
                  <Input name="nationalId" value={form.nationalId} onChange={handleChange} placeholder="42101-1234567-1" />
                  {errors.nationalId && <p className="mt-1 text-[11px] text-red-500">{errors.nationalId}</p>}
                </Field>
                <Field label="Notes">
                  <Input name="notes" value={form.notes} onChange={handleChange} placeholder="Night shift" />
                </Field>
              </div>
            </div>

            <UploadCard
              title="Driving License *"
              subtitle="Upload driving license image here"
              preview={previews.drivingLicensePicture}
              inputRef={drivingLicenseRef}
              onPick={(file) => handleFile('drivingLicensePicture', file)}
              error={errors.drivingLicensePicture}
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
              <Field label={isEditMode ? 'Password (Optional)' : 'Password *'}>
                <Input name="password" value={form.password} onChange={handleChange} placeholder="*********" type="password" />
                {errors.password && <p className="mt-1 text-[11px] text-red-500">{errors.password}</p>}
              </Field>
              <div className="flex items-center gap-2 pt-6">
                <input
                  id="isActive"
                  type="checkbox"
                  name="isActive"
                  checked={form.isActive}
                  onChange={handleChange}
                  className="h-4 w-4 rounded border-gray-300 text-[#7C3AED] focus:ring-[#7C3AED]"
                />
                <label htmlFor="isActive" className="text-xs font-medium text-[#1E1E24]">
                  Active
                </label>
              </div>
            </div>
          </div>
        </Section>

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={handleReset}
            className="rounded-md border border-[#7C3AED] bg-white px-5 py-1.5 text-xs font-semibold text-[#7C3AED] hover:bg-[#F8F4FF]"
          >
            Reset
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="rounded-md bg-[#7C3AED] px-5 py-1.5 text-xs font-semibold text-white hover:bg-[#6D28D9] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? 'Saving...' : (isEditMode ? 'Update Information' : 'Save Information')}
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
      <option value="" disabled hidden>{options[0]}</option>
      {options.slice(1).map((option) => (
        <option key={option} value={option}>
          {option}
        </option>
      ))}
    </select>
  );
}

function UploadCard({ title, subtitle, preview, inputRef, onPick, error = '' }) {
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
      {error ? <p className="mt-1 text-[11px] text-red-500">{error}</p> : null}

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

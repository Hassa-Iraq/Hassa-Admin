'use client';

import { Upload } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import PhoneCodeSelect from '@/app/components/PhoneCodeSelect';
import { toast } from 'sonner';

const INITIAL_FORM = {
  firstName: '',
  lastName: '',
  role: '',
  phoneCode: '+1',
  phone: '',
  email: '',
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

export default function AddEmployeePage() {
  const router = useRouter();
  const [employeeUserId, setEmployeeUserId] = useState('');
  const isEditMode = Boolean(employeeUserId);
  const [form, setForm] = useState(INITIAL_FORM);
  const [preview, setPreview] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [existingImageUrl, setExistingImageUrl] = useState('');
  const [loadingEmployee, setLoadingEmployee] = useState(false);
  const [roles, setRoles] = useState([]);
  const [rolesLoading, setRolesLoading] = useState(false);
  const [rolesError, setRolesError] = useState('');
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const fileRef = useRef(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setEmployeeUserId(params.get('employee_user_id') || '');
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleFile = (file) => {
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      setErrors((prev) => ({ ...prev, image: 'Image size must be less than 2 MB' }));
      return;
    }
    setErrors((prev) => ({ ...prev, image: '', api: '' }));
    setImageFile(file);
    setPreview(URL.createObjectURL(file));
  };

  const onDrop = (event) => {
    event.preventDefault();
    const file = event.dataTransfer?.files?.[0];
    if (file) handleFile(file);
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
    if (!form.role) nextErrors.role = 'Employee role is required';
    if (!form.phone.trim()) nextErrors.phone = 'Phone is required';
    if (!form.email.trim()) nextErrors.email = 'Email is required';
    if (!isEditMode && !form.password) nextErrors.password = 'Password is required';
    if ((form.password || form.confirmPassword) && form.password !== form.confirmPassword) {
      nextErrors.confirmPassword = 'Passwords do not match';
    }
    if (!isEditMode && !imageFile && !existingImageUrl) nextErrors.image = 'Employee image is required';
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const extractUploadedImagePath = (data = {}) => {
    const source = data?.data && typeof data.data === 'object' ? data.data : data;
    const candidates = [
      source?.image_url,
      source?.imageUrl,
      source?.path,
      source?.url,
      source?.full_url,
      source?.image?.url,
      source?.image?.path,
      data?.image_url,
      data?.path,
    ];
    const matched = candidates.find((value) => typeof value === 'string' && value.trim());
    return matched ? matched.trim() : '';
  };

  const uploadEmployeeImage = async (token) => {
    if (!imageFile) return '';
    const formData = new FormData();
    formData.append('profile_picture', imageFile);
    formData.append('save_to_profile', 'false');

    const { data } = await axios.post('/api/auth/profile/upload-image', formData, {
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });

    const imagePath = extractUploadedImagePath(data);
    if (!imagePath) {
      throw new Error('Image upload succeeded but image path was not returned');
    }
    return imagePath;
  };

  useEffect(() => {
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

    const loadEmployeeForEdit = async () => {
      if (!isEditMode) return;
      setLoadingEmployee(true);
      setErrors((prev) => ({ ...prev, api: '' }));
      try {
        const token = localStorage.getItem('token') || '';
        const { data } = await axios.get(`/api/auth/admin/employees/${employeeUserId}`, {
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });
        const payload =
          data?.data && typeof data.data === 'object'
            ? data.data
            : data;
        const employee =
          payload?.employee ||
          payload?.user ||
          payload?.data?.employee ||
          payload?.data?.user ||
          payload;

        const fullName =
          employee?.full_name ||
          `${employee?.f_name || employee?.first_name || ''} ${employee?.l_name || employee?.last_name || ''}`.trim();
        const [firstName = '', ...restName] = String(fullName || '').trim().split(' ');
        const lastName = restName.join(' ');

        const phoneData = splitPhoneNumber(employee?.phone || '');
        const roleId =
          String(
            employee?.employee_role_id ||
            employee?.employee_role?.id ||
            ''
          ).trim();
        const imageUrl = String(employee?.image_url || employee?.image || employee?.avatar || '').trim();

        setForm((prev) => ({
          ...prev,
          firstName: firstName || '',
          lastName: lastName || '',
          role: roleId,
          phoneCode: phoneData.phoneCode,
          phone: phoneData.phone,
          email: String(employee?.email || '').trim(),
          password: '',
          confirmPassword: '',
        }));
        setExistingImageUrl(imageUrl);
        setPreview(imageUrl);
      } catch (error) {
        const rawMessage = axios.isAxiosError(error)
          ? error.response?.data?.message || error.message || 'Failed to load employee details'
          : error?.message || 'Failed to load employee details';
        toast.error(rawMessage);
      } finally {
        setLoadingEmployee(false);
      }
    };

    loadEmployeeForEdit();
  }, [isEditMode, employeeUserId]);

  const onSubmit = async (event) => {
    event.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    setErrors((prev) => ({ ...prev, api: '' }));

    try {
      const token = localStorage.getItem('token') || '';
      let imageUrl = existingImageUrl;
      if (imageFile) {
        // Keep same behavior as add flow: upload first, then submit employee payload.
        imageUrl = await uploadEmployeeImage(token);
      }
      const payload = {
        email: form.email.trim(),
        phone: buildPhoneNumber(),
        full_name: `${form.firstName} ${form.lastName}`.trim(),
        image_url: imageUrl,
        employee_role_id: form.role,
        is_active: true,
      };
      if (form.password) payload.password = form.password;

      await axios({
        method: isEditMode ? 'patch' : 'post',
        url: isEditMode
          ? `/api/auth/admin/employees/${employeeUserId}`
          : '/api/auth/admin/employees',
        data: payload,
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      toast.success(isEditMode ? 'Employee updated successfully.' : 'Employee created successfully.');
      router.push('/dashboard/employees/list');
    } catch (error) {
      const rawMessage = axios.isAxiosError(error)
        ? error.response?.data?.message || error.message || 'Failed to add employee'
        : error?.message || 'Failed to add employee';
      const cleanedMessage =
        typeof rawMessage === 'string' && rawMessage.includes('<!DOCTYPE html>')
          ? 'Image upload failed. Please verify backend upload endpoint and permissions.'
          : rawMessage;
      toast.error(cleanedMessage);
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    const loadRoles = async () => {
      setRolesLoading(true);
      setRolesError('');
      try {
        const token = localStorage.getItem('token') || '';
        const { data } = await axios.get('/api/auth/admin/employee-roles', {
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });
        const payload =
          data?.data && typeof data.data === 'object'
            ? data.data
            : data;
        const list =
          payload?.roles ||
          payload?.list ||
          data?.roles ||
          data?.list ||
          payload ||
          [];
        const normalized = (Array.isArray(list) ? list : [])
          .map((role) => ({
            id: String(role?.id || '').trim(),
            name: String(role?.name || '').trim(),
            description: String(role?.description || '').trim(),
          }))
          .filter((role) => role.id && role.name);
        setRoles(normalized);
      } catch (error) {
        setRoles([]);
        setRolesError(
          axios.isAxiosError(error)
            ? error.response?.data?.message || error.message || 'Failed to load employee roles'
            : error?.message || 'Failed to load employee roles'
        );
      } finally {
        setRolesLoading(false);
      }
    };

    loadRoles();
  }, []);

  return (
    <div className="pt-36 pb-8">
      <form onSubmit={onSubmit} className="space-y-4">
        {loadingEmployee && (
          <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700">
            Loading employee details...
          </div>
        )}
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
                    {errors.firstName && <p className="mt-1 text-[11px] text-red-500">{errors.firstName}</p>}
                  </Field>
                  <Field label="Last Name">
                    <Input name="lastName" value={form.lastName} onChange={handleChange} placeholder="Enter Last Name" />
                    {errors.lastName && <p className="mt-1 text-[11px] text-red-500">{errors.lastName}</p>}
                  </Field>
                </div>

                <div className="grid grid-cols-1 gap-3 md:grid-cols-1">
                  <Field label="Role">
                    <select
                      name="role"
                      value={form.role}
                      onChange={handleChange}
                      disabled={rolesLoading}
                      className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:border-[#7C3AED] focus:outline-none"
                    >
                      <option value="">
                        {rolesLoading ? 'Loading roles...' : 'Select Employee Role'}
                      </option>
                      {roles.map((role) => (
                        <option key={role.id} value={role.id}>
                          {role.name}
                        </option>
                      ))}
                    </select>
                    {errors.role && <p className="mt-1 text-[11px] text-red-500">{errors.role}</p>}
                    {rolesError && <p className="mt-1 text-[11px] text-red-500">{rolesError}</p>}
                  </Field>
                </div>

                <div className="max-w-[320px]">
                  <Field label="Phone *">
                    <div className="flex">
                      <PhoneCodeSelect
                        name="phoneCode"
                        value={form.phoneCode}
                        onChange={handleChange}
                        options={PHONE_CODE_OPTIONS}
                        className="w-32"
                      />
                      <input
                        name="phone"
                        value={form.phone}
                        onChange={handleChange}
                        placeholder="123-456-987"
                        className="min-w-0 flex-1 rounded-r-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 placeholder:text-gray-400 focus:border-[#7C3AED] focus:outline-none"
                      />
                    </div>
                    {errors.phone && <p className="mt-1 text-[11px] text-red-500">{errors.phone}</p>}
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
                {errors.image && <p className="mt-1 text-[11px] text-red-500">{errors.image}</p>}

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
                  {errors.email && <p className="mt-1 text-[11px] text-red-500">{errors.email}</p>}
                </Field>
                <Field label="Password *">
                  <Input name="password" value={form.password} onChange={handleChange} placeholder="*********" type="password" />
                  {errors.password && <p className="mt-1 text-[11px] text-red-500">{errors.password}</p>}
                </Field>
                <Field label="Confirm Password *">
                  <Input name="confirmPassword" value={form.confirmPassword} onChange={handleChange} placeholder="*********" type="password" />
                  {errors.confirmPassword && <p className="mt-1 text-[11px] text-red-500">{errors.confirmPassword}</p>}
                </Field>
              </div>
            </div>
          </div>
        </section>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={submitting || loadingEmployee}
            className="rounded-md bg-[#7C3AED] px-6 py-2 text-xs font-semibold text-white hover:bg-[#6D28D9]"
          >
            {submitting ? 'Submitting...' : (isEditMode ? 'Update' : 'Submit')}
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

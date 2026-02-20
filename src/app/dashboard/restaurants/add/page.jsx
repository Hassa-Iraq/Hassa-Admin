'use client';

import { useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Upload, MapPin, Eye, EyeOff } from 'lucide-react';

const INITIAL_FORM = {
  restaurantName: '',
  restaurantAddress: '',
  cuisine: '',
  radius: '',
  latitude: '',
  longitude: '',
  minDeliveryTime: '',
  maxDeliveryTime: '',
  deliveryTimeUnit: 'Minutes',
  firstName: '',
  lastName: '',
  phone: '',
  phoneCode: '+1',
  tags: '',
  tinNumber: '',
  tinExpiry: '',
  additionalTin: '',
  additionalDate: '',
  email: '',
  password: '',
  confirmPassword: '',
};

export default function AddRestaurantPage() {
  const router = useRouter();

  const [form, setForm] = useState(INITIAL_FORM);
  const [activeTab, setActiveTab] = useState('default');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [coverFile, setCoverFile] = useState(null);
  const [coverPreview, setCoverPreview] = useState(null);
  const [tinCertFile, setTinCertFile] = useState(null);
  const [tinCertPreview, setTinCertPreview] = useState(null);
  const [licenseFile, setLicenseFile] = useState(null);
  const [licensePreview, setLicensePreview] = useState(null);

  const logoRef = useRef(null);
  const coverRef = useRef(null);
  const tinCertRef = useRef(null);
  const licenseRef = useRef(null);

  const [mapSearch, setMapSearch] = useState('');

  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  }, [errors]);

  const handleFileSelect = useCallback((file, setter, previewSetter) => {
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      alert('File size must be less than 2MB');
      return;
    }
    setter(file);
    previewSetter(URL.createObjectURL(file));
  }, []);

  const validate = () => {
    const newErrors = {};
    if (!form.restaurantName.trim()) newErrors.restaurantName = 'Required';
    if (!form.restaurantAddress.trim()) newErrors.restaurantAddress = 'Required';
    if (!form.firstName.trim()) newErrors.firstName = 'Required';
    if (!form.lastName.trim()) newErrors.lastName = 'Required';
    if (!form.phone.trim()) newErrors.phone = 'Required';
    if (!form.email.trim()) newErrors.email = 'Required';
    if (!form.password) newErrors.password = 'Required';
    if (form.password !== form.confirmPassword) newErrors.confirmPassword = 'Passwords do not match';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      alert('Restaurant added successfully!');
      router.push('/dashboard/restaurants/list');
    } catch {
      alert('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setForm(INITIAL_FORM);
    setLogoFile(null);
    setLogoPreview(null);
    setCoverFile(null);
    setCoverPreview(null);
    setTinCertFile(null);
    setTinCertPreview(null);
    setLicenseFile(null);
    setLicensePreview(null);
    setErrors({});
  };

  const langTabs = [
    { key: 'default', label: 'Default' },
    { key: 'en', label: 'English (EN)' },
    { key: 'ar', label: 'Arabic (AR)' },
  ];

  return (
    <div className="pt-36 pb-8">
      <form onSubmit={handleSubmit} className="space-y-6">

        {/* ===================== BASIC INFORMATION ===================== */}
        <section className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-8">
          <h2 className="text-lg font-bold text-[#1E1E24]">
            Basic Information
          </h2>
          <p className="text-xs text-gray-400 mt-1 mb-6">
            Setup your business information here
          </p>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">

            {/* --- LEFT COLUMN --- */}
            <div className="lg:col-span-2 space-y-5">

              {/* Language Tabs */}
              <div className="flex gap-6 border-b border-gray-200">
                {langTabs.map((tab) => (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setActiveTab(tab.key)}
                    className={`pb-2 text-sm font-medium transition-colors ${
                      activeTab === tab.key
                        ? 'text-purple-600 border-b-2 border-purple-600'
                        : 'text-gray-400 hover:text-gray-600'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <InputField
                label="Restaurant Name (Default)"
                name="restaurantName"
                value={form.restaurantName}
                onChange={handleChange}
                placeholder="Ex: ABC Company"
                error={errors.restaurantName}
              />

              <InputField
                label="Restaurant Address (Default)"
                name="restaurantAddress"
                value={form.restaurantAddress}
                onChange={handleChange}
                placeholder="Ex: House #4, Road #4, ABC City"
                error={errors.restaurantAddress}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <SelectField
                  label="Cuisine"
                  name="cuisine"
                  value={form.cuisine}
                  onChange={handleChange}
                  options={['Italian', 'Chinese', 'Indian', 'Mexican', 'Thai']}
                  placeholder="Select Cuisine"
                />
                <SelectField
                  label="Radius"
                  name="radius"
                  value={form.radius}
                  onChange={handleChange}
                  options={['1 km', '3 km', '5 km', '10 km', '15 km']}
                  placeholder="Select Radius"
                />
              </div>

              {/* Map Search */}
              <div className="relative">
                <MapPin size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-purple-500" />
                <input
                  value={mapSearch}
                  onChange={(e) => setMapSearch(e.target.value)}
                  className="w-full border border-purple-400 rounded-lg pl-10 pr-4 py-2.5 text-sm focus:border-purple-500 focus:outline-none"
                  placeholder="Select location on Map for your exact pickup location"
                />
              </div>

              {/* Map Embed */}
              <div className="w-full h-48 sm:h-56 rounded-xl overflow-hidden border border-gray-200">
                <iframe
                  title="map"
                  width="100%"
                  height="100%"
                  loading="lazy"
                  style={{ border: 0 }}
                  src="https://www.openstreetmap.org/export/embed.html?bbox=46.5,24.6,46.8,24.8&layer=mapnik"
                />
              </div>
            </div>

            {/* --- RIGHT COLUMN (Uploads) --- */}
            <div className="space-y-6">
              <UploadCard
                title="Restaurant LOGO"
                subtitle="Upload your restaurant logo image"
                inputRef={logoRef}
                preview={logoPreview}
                accept="image/*"
                hint="Jpeg, Jpg, Png, Webp Image : Max 2 MB (1:1)"
                onFileSelect={(file) => handleFileSelect(file, setLogoFile, setLogoPreview)}
              />
              <UploadCard
                title="Restaurant Cover"
                subtitle="Upload your restaurant cover photo. Each restaurant must have a unique cover."
                inputRef={coverRef}
                preview={coverPreview}
                accept="image/*"
                hint="Jpeg, Jpg, Png, Webp Image : Max 2 MB (3:1)"
                onFileSelect={(file) => handleFileSelect(file, setCoverFile, setCoverPreview)}
              />
            </div>
          </div>
        </section>

        {/* ===================== GENERAL SETTING ===================== */}
        <section className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-8">
          <h2 className="text-lg font-bold text-[#1E1E24]">
            General Setting
          </h2>
          <p className="text-xs text-gray-400 mt-1 mb-8">
            Setup your all business general setting
          </p>

          {/* --- Restaurant Information --- */}
          <SubSection
            title="Restaurant Information"
            subtitle="Setup your estimated delivery time from here"
            hasBorder
          >
            <label className="text-sm font-medium text-gray-700 block mb-3">
              Estimated Delivery Time (Min & Max Time)
            </label>
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="number"
                name="minDeliveryTime"
                value={form.minDeliveryTime}
                onChange={handleChange}
                placeholder="Ex: 30"
                className="flex-1 border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:border-purple-400 focus:outline-none"
              />
              <input
                type="number"
                name="maxDeliveryTime"
                value={form.maxDeliveryTime}
                onChange={handleChange}
                placeholder="Ex: 60"
                className="flex-1 border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:border-purple-400 focus:outline-none"
              />
              <select
                name="deliveryTimeUnit"
                value={form.deliveryTimeUnit}
                onChange={handleChange}
                className="w-full sm:w-32 border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:border-purple-400 focus:outline-none bg-white"
              >
                <option>Minutes</option>
                <option>Hours</option>
              </select>
            </div>
          </SubSection>

          {/* --- Owner Information --- */}
          <SubSection
            title="Owner Information"
            subtitle="Setup your personal information from here"
            hasBorder
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <InputField
                label="First Name *"
                name="firstName"
                value={form.firstName}
                onChange={handleChange}
                placeholder="Ex: John"
                error={errors.firstName}
              />
              <InputField
                label="Last Name *"
                name="lastName"
                value={form.lastName}
                onChange={handleChange}
                placeholder="Ex: Doe"
                error={errors.lastName}
              />
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-2">
                  Phone *
                </label>
                <div className="flex">
                  <span className="inline-flex items-center px-3 bg-white border border-gray-200 rounded-l-lg text-sm text-gray-600 border-r-0">
                    +1
                  </span>
                  <input
                    name="phone"
                    value={form.phone}
                    onChange={handleChange}
                    placeholder="123-456-987"
                    className={`flex-1 min-w-0 border border-gray-200 rounded-r-lg px-4 py-2.5 text-sm focus:border-purple-400 focus:outline-none ${
                      errors.phone ? 'border-red-400' : ''
                    }`}
                  />
                </div>
                {errors.phone && <p className="text-xs text-red-500 mt-1">{errors.phone}</p>}
              </div>
            </div>
          </SubSection>

          {/* --- Tags --- */}
          <SubSection
            title="Tags"
            subtitle="Set your business tag for better brand visibility"
            hasBorder
          >
            <InputField
              label="Tags"
              name="tags"
              value={form.tags}
              onChange={handleChange}
              placeholder="Enter tags"
            />
          </SubSection>

          {/* --- Business TIN --- */}
          <SubSection
            title="Business TIN"
            subtitle="Setup your business TIN"
            hasBorder
          >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-4">
                <InputField
                  label="Taxpayer Identification Number (TIN)"
                  name="tinNumber"
                  value={form.tinNumber}
                  onChange={handleChange}
                  placeholder="Type your TIN Number"
                />
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-2">
                    Expire Date
                  </label>
                  <input
                    type="date"
                    name="tinExpiry"
                    value={form.tinExpiry}
                    onChange={handleChange}
                    className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:border-purple-400 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 block mb-3">
                  TIN Certificate
                </label>
                <UploadZone
                  inputRef={tinCertRef}
                  preview={tinCertPreview}
                  accept="image/*"
                  hint="Jpeg, Jpg, Png, Webp Image : Max 2 MB (1:1)"
                  onFileSelect={(file) => handleFileSelect(file, setTinCertFile, setTinCertPreview)}
                />
                <p className="text-xs text-gray-400 mt-2">Jpeg, Jpg, Png, Webp Image : Max 2 MB (1:1)</p>
              </div>
            </div>
          </SubSection>

          {/* --- Additional Data --- */}
          <SubSection
            title="Additional Data"
            subtitle="Setup your additional legal information"
          >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-4">
                <InputField
                  label="Enter your TIN Number"
                  name="additionalTin"
                  value={form.additionalTin}
                  onChange={handleChange}
                  placeholder="TIN Number"
                />
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-2">
                    Date
                  </label>
                  <input
                    type="date"
                    name="additionalDate"
                    value={form.additionalDate}
                    onChange={handleChange}
                    className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:border-purple-400 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 block mb-3">
                  License Document
                </label>
                <UploadZone
                  inputRef={licenseRef}
                  preview={licensePreview}
                  accept="image/*"
                  hint="Jpeg, Jpg, Png, Webp Image : Max 2 MB"
                  onFileSelect={(file) => handleFileSelect(file, setLicenseFile, setLicensePreview)}
                />
                <p className="text-xs text-gray-400 mt-2">Jpeg, Jpg, Png, Webp Image : Max 2 MB</p>
              </div>
            </div>
          </SubSection>
        </section>

        {/* ===================== ACCOUNT INFORMATION ===================== */}
        <section className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-8">
          <h2 className="text-lg font-bold text-[#1E1E24]">
            Account Information
          </h2>
          <p className="text-xs text-gray-400 mt-1 mb-6">
            Account information
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <InputField
              label="Email *"
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              placeholder="restaurant@email.com"
              error={errors.email}
            />
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-2">
                Password *
              </label>
              <div className="relative">
                <input
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className={`w-full border rounded-lg px-4 py-2.5 text-sm pr-10 focus:border-purple-400 focus:outline-none ${
                    errors.password ? 'border-red-400' : 'border-gray-200'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password}</p>}
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-2">
                Confirm Password *
              </label>
              <div className="relative">
                <input
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={form.confirmPassword}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className={`w-full border rounded-lg px-4 py-2.5 text-sm pr-10 focus:border-purple-400 focus:outline-none ${
                    errors.confirmPassword ? 'border-red-400' : 'border-gray-200'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="text-xs text-red-500 mt-1">{errors.confirmPassword}</p>
              )}
            </div>
          </div>
        </section>

        {/* ===================== ACTION BUTTONS ===================== */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="px-8 py-2.5 text-sm font-semibold bg-[#7C3AED] hover:bg-[#6D28D9] disabled:opacity-60 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
          >
            {loading ? 'Saving...' : 'Save Restaurant'}
          </button>
        </div>
      </form>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   REUSABLE SUB-COMPONENTS
   ══════════════════════════════════════════════════════════════════════════ */

function SubSection({ title, subtitle, hasBorder, children }) {
  return (
    <div className={`pb-6 mb-6 ${hasBorder ? 'border-b border-gray-200' : ''}`}>
      <h3 className="text-sm font-bold text-[#1E1E24]">{title}</h3>
      {subtitle && <p className="text-xs text-gray-400 mb-4">{subtitle}</p>}
      {children}
    </div>
  );
}

function InputField({ label, name, value, onChange, placeholder, type = 'text', error }) {
  return (
    <div>
      <label className="text-sm font-medium text-gray-700 block mb-2">{label}</label>
      <input
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={`w-full border rounded-lg px-4 py-2.5 text-sm focus:border-purple-400 focus:outline-none ${
          error ? 'border-red-400' : 'border-gray-200'
        }`}
      />
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
}

function SelectField({ label, name, value, onChange, options, placeholder }) {
  return (
    <div>
      <label className="text-sm font-medium text-gray-700 block mb-2">{label}</label>
      <select
        name={name}
        value={value}
        onChange={onChange}
        className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:border-purple-400 focus:outline-none bg-white"
      >
        <option value="">{placeholder}</option>
        {options.map((opt) => (
          <option key={opt} value={opt}>{opt}</option>
        ))}
      </select>
    </div>
  );
}

function UploadZone({ inputRef, preview, accept, hint, onFileSelect }) {
  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer?.files?.[0];
    if (file) onFileSelect(file);
  };

  return (
    <>
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
        className="border-2 border-dashed border-gray-300 rounded-lg h-28 flex flex-col items-center justify-center cursor-pointer hover:border-purple-400 transition-colors bg-white"
      >
        {preview ? (
          <img src={preview} alt="preview" className="h-full w-full object-cover rounded-lg" />
        ) : (
          <>
            <Upload size={18} className="text-purple-500 mb-1.5" />
            <p className="text-xs text-gray-500 text-center px-2">
              <span className="text-purple-600 font-medium">Click to Upload</span>{' '}
              or Drag & Drop
            </p>
          </>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onFileSelect(file);
          e.target.value = '';
        }}
      />
    </>
  );
}

function UploadCard({ title, subtitle, inputRef, preview, accept, hint, onFileSelect }) {
  return (
    <div className="border border-gray-200 rounded-xl p-5">
      <h3 className="text-sm font-bold text-[#1E1E24] mb-1">{title}</h3>
      {subtitle && <p className="text-xs text-gray-400 mb-4">{subtitle}</p>}
      <UploadZone
        inputRef={inputRef}
        preview={preview}
        accept={accept}
        hint={hint}
        onFileSelect={onFileSelect}
      />
      <p className="text-xs text-gray-400 mt-2">{hint}</p>
    </div>
  );
}

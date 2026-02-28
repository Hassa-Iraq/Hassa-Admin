'use client';

import { useRef, useState } from 'react';
import { Upload } from 'lucide-react';

const INITIAL_FORM = {
  itemName: '',
  shortDescription: '',
  category: '',
  subCategory: '',
  foodType: '',
  nutrition: '',
  allergenIngredients: '',
  statisticsNutrition: '',
  availableTimeStart: '',
  availableTimeEnd: '',
  tags: '',
  unitPrice: '',
  discountType: '',
  discount: '',
  maxPurchaseLimit: '',
  stockType: '',
  variation: '',
};

const languageTabs = [
  { key: 'default', label: 'Default' },
  { key: 'en', label: 'English (EN)' },
  { key: 'ar', label: 'Arabic (AR)' },
];

const discountTypeOptions = ['Percent', 'Amount'];
const stockTypeOptions = ['Unlimited', 'Limited'];

export default function AddFoodPage() {
  const [activeTab, setActiveTab] = useState('default');
  const [form, setForm] = useState(INITIAL_FORM);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [errors, setErrors] = useState({});

  const imageRef = useRef(null);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleImageSelect = (file) => {
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleDrop = (event) => {
    event.preventDefault();
    const file = event.dataTransfer?.files?.[0];
    if (file) handleImageSelect(file);
  };

  const validate = () => {
    const nextErrors = {};
    if (!form.itemName.trim()) nextErrors.itemName = 'Name is required';
    if (!form.foodType.trim()) nextErrors.foodType = 'Food type is required';
    if (!form.unitPrice.trim()) nextErrors.unitPrice = 'Unit price is required';
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!validate()) return;
    alert('Food item form is ready to integrate with API.');
  };

  const handleReset = () => {
    setForm(INITIAL_FORM);
    setImageFile(null);
    setImagePreview('');
    setErrors({});
  };

  return (
    <div className="pt-36 pb-8">
      <form onSubmit={handleSubmit} className="space-y-4">
        <section className="rounded-xl border border-gray-200 bg-white p-4">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <div className="space-y-4 lg:col-span-2">
              <div className="flex items-center gap-5 border-b border-gray-200">
                {languageTabs.map((tab) => (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setActiveTab(tab.key)}
                    className={`pb-2 text-xs font-medium ${
                      activeTab === tab.key
                        ? 'border-b-2 border-[#7C3AED] text-[#7C3AED]'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <FormField label="Name (Default) *" error={errors.itemName}>
                <Input
                  name="itemName"
                  value={form.itemName}
                  onChange={handleChange}
                  placeholder="Ex: ADC Company"
                  hasError={Boolean(errors.itemName)}
                />
              </FormField>

              <FormField label="Short description (Default)">
                <textarea
                  name="shortDescription"
                  value={form.shortDescription}
                  onChange={handleChange}
                  placeholder="Ex: House #4, Road #4, ABC City"
                  className="min-h-[78px] w-full resize-none rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 placeholder:text-gray-400 focus:border-[#7C3AED] focus:outline-none"
                />
              </FormField>
            </div>

            <div className="rounded-xl border border-gray-200 p-3">
              <h3 className="text-xs font-semibold text-[#1E1E24]">Food Image</h3>
              <p className="mt-1 text-[11px] text-gray-400">Upload your item image here</p>

              <div
                onClick={() => imageRef.current?.click()}
                onDragOver={(event) => event.preventDefault()}
                onDrop={handleDrop}
                className="mt-3 flex h-[165px] cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-[#FAFAFF] hover:border-[#7C3AED]"
              >
                {imagePreview ? (
                  <img src={imagePreview} alt={imageFile?.name || 'food-preview'} className="h-full w-full rounded-lg object-cover" />
                ) : (
                  <>
                    <Upload size={18} className="text-[#7C3AED]" />
                    <p className="mt-2 text-xs text-gray-500">
                      <span className="font-semibold text-[#7C3AED]">Click to Upload</span> or
                    </p>
                    <p className="text-xs font-semibold text-[#7C3AED]">Drag Drop</p>
                  </>
                )}
              </div>
              <p className="mt-2 text-[11px] text-gray-400">Jpeg, Jpg, Png, Webp Image : Max 2 MB (1:1)</p>

              <input
                ref={imageRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) handleImageSelect(file);
                  event.target.value = '';
                }}
              />
            </div>
          </div>
        </section>

        <Card title="Restaurant & Category Info">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <FormField label="Category *">
              <Input name="category" value={form.category} onChange={handleChange} placeholder="Ex: indianrestaurant.com" />
            </FormField>
            <FormField label="Sub Category">
              <Input name="subCategory" value={form.subCategory} onChange={handleChange} placeholder="" />
            </FormField>
            <FormField label="Food Type *" error={errors.foodType}>
              <Input
                name="foodType"
                value={form.foodType}
                onChange={handleChange}
                placeholder="-----------"
                hasError={Boolean(errors.foodType)}
              />
            </FormField>
          </div>

          <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
            <FormField label="Nutrition">
              <Input name="nutrition" value={form.nutrition} onChange={handleChange} placeholder="Order wise" />
            </FormField>
            <FormField label="Allergen ingredients">
              <Input name="allergenIngredients" value={form.allergenIngredients} onChange={handleChange} placeholder="Custom Tax (5%)" />
            </FormField>
          </div>

          <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
            <div className="rounded-lg border border-gray-200 p-3">
              <div className="mb-3">
                <h4 className="text-sm font-semibold text-[#1E1E24]">User Statistics</h4>
              </div>
              <FormField label="Nutrition">
                <Input
                  name="statisticsNutrition"
                  value={form.statisticsNutrition}
                  onChange={handleChange}
                  placeholder="Order wise"
                />
              </FormField>
            </div>

            <div className="rounded-lg border border-gray-200 p-3">
              <div className="mb-3">
                <h4 className="text-sm font-semibold text-[#1E1E24]">User Statistics</h4>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <FormField label="Available Time starts *">
                  <Input name="availableTimeStart" value={form.availableTimeStart} onChange={handleChange} placeholder="Ex: admin@domain.com" />
                </FormField>
                <FormField label="Available Time Ends *">
                  <Input name="availableTimeEnd" value={form.availableTimeEnd} onChange={handleChange} placeholder="-----------" />
                </FormField>
              </div>
            </div>
          </div>
        </Card>

        <Card title="Search tags">
          <Input name="tags" value={form.tags} onChange={handleChange} placeholder="Enter Tags" />
        </Card>

        <Card title="Price Information">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <FormField label="Unit Price *" error={errors.unitPrice}>
              <Input
                name="unitPrice"
                value={form.unitPrice}
                onChange={handleChange}
                placeholder="Ex: admin@domain.com"
                hasError={Boolean(errors.unitPrice)}
              />
            </FormField>
            <FormField label="Discount Type">
              <select
                name="discountType"
                value={form.discountType}
                onChange={handleChange}
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:border-[#7C3AED] focus:outline-none"
              >
                <option value="">Select type</option>
                {discountTypeOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </FormField>
            <FormField label="Discount *">
              <Input name="discount" value={form.discount} onChange={handleChange} placeholder="-----------" />
            </FormField>
          </div>

          <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-3">
            <FormField label="Maximum Purchase Quantity Limit">
              <Input name="maxPurchaseLimit" value={form.maxPurchaseLimit} onChange={handleChange} placeholder="Ex: admin@domain.com" />
            </FormField>
            <FormField label="Stock Type">
              <select
                name="stockType"
                value={form.stockType}
                onChange={handleChange}
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:border-[#7C3AED] focus:outline-none"
              >
                <option value="">Unlimited</option>
                {stockTypeOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </FormField>
          </div>
        </Card>

        <Card title="Food Variation">
          <Input name="variation" value={form.variation} onChange={handleChange} placeholder="Add New Variation" />
        </Card>

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={handleReset}
            className="rounded-lg border border-[#D8B4FE] bg-white px-5 py-2 text-xs font-semibold text-[#7C3AED] hover:bg-[#F8F4FF]"
          >
            Reset
          </button>
          <button
            type="submit"
            className="rounded-lg bg-[#7C3AED] px-5 py-2 text-xs font-semibold text-white hover:bg-[#6D28D9]"
          >
            Submit
          </button>
        </div>
      </form>
    </div>
  );
}

function Card({ title, children }) {
  return (
    <section className="rounded-xl border border-gray-200 bg-white p-4">
      <h3 className="text-xs font-semibold text-[#1E1E24]">{title}</h3>
      <div className="mt-3">{children}</div>
    </section>
  );
}

function FormField({ label, error, children }) {
  return (
    <div>
      {label && <label className="mb-1.5 block text-[11px] font-medium text-gray-700">{label}</label>}
      {children}
      {error && <p className="mt-1 text-[11px] text-red-500">{error}</p>}
    </div>
  );
}

function Input({ name, value, onChange, placeholder, hasError = false }) {
  return (
    <input
      name={name}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className={`w-full rounded-lg border px-3 py-2 text-sm text-gray-700 placeholder:text-gray-400 focus:border-[#7C3AED] focus:outline-none ${
        hasError ? 'border-red-400' : 'border-gray-200'
      }`}
    />
  );
}

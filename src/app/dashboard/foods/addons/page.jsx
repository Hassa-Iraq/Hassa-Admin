'use client';

import { useMemo, useState } from 'react';
import { Download, Pencil, Search, SlidersHorizontal, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

const INITIAL_FORM = {
  name: 'Cheese',
  price: 'IQD 45.00',
  stockType: 'Unlimited',
  category: 'Sauces',
};

const MOCK_ADDONS = [
  { id: 1, name: 'Cheese', category: 'Sauce', price: 'IQD 95.00', stock: 'Unlimited', stockType: 'Unlimited', status: true },
  { id: 2, name: 'Cheese', category: 'Sauce', price: 'IQD 95.00', stock: 'Unlimited', stockType: 'Unlimited', status: true },
  { id: 3, name: 'Cheese', category: 'Sauce', price: 'IQD 95.00', stock: 'Unlimited', stockType: 'Unlimited', status: true },
  { id: 4, name: 'Cheese', category: 'Sauce', price: 'IQD 95.00', stock: 'Unlimited', stockType: 'Unlimited', status: true },
  { id: 5, name: 'Cheese', category: 'Sauce', price: 'IQD 95.00', stock: 'Unlimited', stockType: 'Unlimited', status: true },
];

export default function AddonsPage() {
  const [form, setForm] = useState(INITIAL_FORM);
  const [search, setSearch] = useState('');
  const [statuses, setStatuses] = useState(() =>
    Object.fromEntries(MOCK_ADDONS.map((row) => [row.id, row.status]))
  );

  const rows = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return MOCK_ADDONS;
    return MOCK_ADDONS.filter((row) => row.name.toLowerCase().includes(query));
  }, [search]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const toggleStatus = (id) => {
    setStatuses((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleReset = () => setForm(INITIAL_FORM);

  const handleSubmit = (event) => {
    event.preventDefault();
    toast.info('Addon form is ready to connect with API.');
  };

  return (
    <div className="pt-36 pb-8 space-y-4">
      <section className="rounded-xl border border-gray-200 bg-white">
        <div className="border-b border-gray-200 px-4 py-3">
          <h3 className="text-sm font-semibold text-[#1E1E24]">Add New Addon</h3>
        </div>

        <form onSubmit={handleSubmit} className="p-4">
          <div className="rounded-lg bg-gray-50 p-3">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              <Field label="Name *">
                <select
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:border-[#7C3AED] focus:outline-none"
                >
                  <option>Cheese</option>
                  <option>Mayonnaise</option>
                  <option>Ketchup</option>
                </select>
              </Field>

              <Field label="Price">
                <input
                  name="price"
                  value={form.price}
                  onChange={handleChange}
                  placeholder="IQD 45.00"
                  className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:border-[#7C3AED] focus:outline-none"
                />
              </Field>

              <Field label="Stock Type *">
                <select
                  name="stockType"
                  value={form.stockType}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:border-[#7C3AED] focus:outline-none"
                >
                  <option>Unlimited</option>
                  <option>Limited</option>
                </select>
              </Field>
            </div>

            <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-3">
              <Field label="Category *">
                <select
                  name="category"
                  value={form.category}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:border-[#7C3AED] focus:outline-none"
                >
                  <option>Sauces</option>
                  <option>Toppings</option>
                  <option>Dips</option>
                </select>
              </Field>
            </div>
          </div>

          <div className="mt-4 flex justify-end gap-2">
            <button
              type="button"
              onClick={handleReset}
              className="rounded-md border border-[#7C3AED] bg-white px-5 py-1.5 text-xs font-semibold text-[#7C3AED] hover:bg-[#F8F4FF]"
            >
              Reset
            </button>
            <button
              type="submit"
              className="rounded-md bg-[#7C3AED] px-5 py-1.5 text-xs font-semibold text-white hover:bg-[#6D28D9]"
            >
              Submit
            </button>
          </div>
        </form>
      </section>

      <section className="rounded-xl border border-gray-200 bg-white">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 p-3">
          <div className="relative w-full max-w-[360px]">
            <Search size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7C3AED]" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search any food..."
              className="w-full rounded-lg border border-gray-200 py-2 pl-3 pr-8 text-xs text-gray-700 placeholder:text-gray-400 focus:border-[#7C3AED] focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-2">
            <button className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-gray-600 hover:bg-gray-50">
              <Download size={12} />
              <span>Export</span>
            </button>
            <button className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-gray-600 hover:bg-gray-50">
              <SlidersHorizontal size={12} />
              <span>Filters</span>
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50/70">
                <th className="px-4 py-3 text-left text-[11px] font-semibold text-[#1E1E24]">SI</th>
                <th className="px-3 py-3 text-left text-[11px] font-semibold text-[#1E1E24]">Name</th>
                <th className="px-3 py-3 text-left text-[11px] font-semibold text-[#1E1E24]">Category</th>
                <th className="px-3 py-3 text-left text-[11px] font-semibold text-[#1E1E24]">Price</th>
                <th className="px-3 py-3 text-left text-[11px] font-semibold text-[#1E1E24]">Stock</th>
                <th className="px-3 py-3 text-left text-[11px] font-semibold text-[#1E1E24]">Stock Type</th>
                <th className="px-3 py-3 text-left text-[11px] font-semibold text-[#1E1E24]">Status</th>
                <th className="px-3 py-3 text-left text-[11px] font-semibold text-[#1E1E24]">Action</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, index) => (
                <tr key={row.id} className="border-b border-gray-100 last:border-b-0">
                  <td className="px-4 py-3 text-xs text-gray-500">{index + 1}</td>
                  <td className="px-3 py-3 text-xs font-semibold text-[#1E1E24]">{row.name}</td>
                  <td className="px-3 py-3 text-xs font-semibold text-[#1E1E24]">{row.category}</td>
                  <td className="px-3 py-3 text-xs text-[#1E1E24]">{row.price}</td>
                  <td className="px-3 py-3 text-xs text-[#1E1E24]">{row.stock}</td>
                  <td className="px-3 py-3 text-xs text-[#1E1E24]">{row.stockType}</td>
                  <td className="px-3 py-3">
                    <button
                      onClick={() => toggleStatus(row.id)}
                      className={`relative inline-flex h-4.5 w-8 items-center rounded-full transition-colors ${
                        statuses[row.id] ? 'bg-[#7C3AED]' : 'bg-gray-300'
                      }`}
                    >
                      <span
                        className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                          statuses[row.id] ? 'translate-x-[17px]' : 'translate-x-0.5'
                        }`}
                      />
                    </button>
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-2">
                      <button className="flex h-6 w-6 items-center justify-center rounded-md border border-[#7C3AED] bg-[#F8F4FF] text-[#7C3AED]">
                        <Pencil size={12} />
                      </button>
                      <button className="flex h-6 w-6 items-center justify-center rounded-md border border-[#FECACA] bg-[#FEF2F2] text-[#EF4444]">
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {rows.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-sm text-gray-400">
                    No addons found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <label className="mb-1.5 block text-[11px] font-medium text-gray-700">{label}</label>
      {children}
    </div>
  );
}

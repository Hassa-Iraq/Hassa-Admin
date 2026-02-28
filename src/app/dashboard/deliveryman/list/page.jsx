'use client';

import { Download, Pencil, Search, Trash2 } from 'lucide-react';

const DELIVERYMEN = [
  {
    id: 1,
    name: 'Hamza Khan',
    contactName: 'Hamza Khan',
    phone: '+91**********',
    radius: 'All over the world',
    totalOrders: 3,
    assignedOrders: 4,
    status: 'Online',
    avatar: 'https://i.pravatar.cc/40?img=41',
  },
  {
    id: 2,
    name: 'Hamza Khan',
    contactName: 'Hamza Khan',
    phone: '+91**********',
    radius: 'All over the world',
    totalOrders: 3,
    assignedOrders: 4,
    status: 'Online',
    avatar: 'https://i.pravatar.cc/40?img=42',
  },
  {
    id: 3,
    name: 'Hamza Khan',
    contactName: 'Hamza Khan',
    phone: '+91**********',
    radius: 'All over the world',
    totalOrders: 3,
    assignedOrders: 4,
    status: 'Online',
    avatar: 'https://i.pravatar.cc/40?img=43',
  },
  {
    id: 4,
    name: 'Hamza Khan',
    contactName: 'Hamza Khan',
    phone: '+91**********',
    radius: 'All over the world',
    totalOrders: 3,
    assignedOrders: 4,
    status: 'Online',
    avatar: 'https://i.pravatar.cc/40?img=44',
  },
  {
    id: 5,
    name: 'Hamza Khan',
    contactName: 'Hamza Khan',
    phone: '+91**********',
    radius: 'All over the world',
    totalOrders: 3,
    assignedOrders: 4,
    status: 'Online',
    avatar: 'https://i.pravatar.cc/40?img=45',
  },
];

export default function DeliverymanListPage() {
  return (
    <div className="pt-36 pb-8">
      <section className="rounded-xl border border-gray-200 bg-white">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 p-3">
          <h3 className="text-xl font-semibold text-[#1E1E24]">Deliveryman</h3>

          <div className="flex items-center gap-2">
            <div className="relative w-[220px]">
              <Search size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7C3AED]" />
              <input
                placeholder="Search by name..."
                className="w-full rounded-lg border border-gray-200 py-2 pl-3 pr-8 text-xs text-gray-700 placeholder:text-gray-400 focus:border-[#7C3AED] focus:outline-none"
              />
            </div>
            <button className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-gray-600 hover:bg-gray-50">
              <Download size={12} />
              <span>Export</span>
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1100px] text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50/70">
                <th className="px-3 py-3 text-left text-[11px] font-semibold text-[#1E1E24]">SI</th>
                <th className="px-3 py-3 text-left text-[11px] font-semibold text-[#1E1E24]">Name</th>
                <th className="px-3 py-3 text-left text-[11px] font-semibold text-[#1E1E24]">Contact</th>
                <th className="px-3 py-3 text-left text-[11px] font-semibold text-[#1E1E24]">Radius</th>
                <th className="px-3 py-3 text-left text-[11px] font-semibold text-[#1E1E24]">Total Orders</th>
                <th className="px-3 py-3 text-left text-[11px] font-semibold text-[#1E1E24]">Availability Status</th>
                <th className="px-3 py-3 text-left text-[11px] font-semibold text-[#1E1E24]">Actions</th>
              </tr>
            </thead>
            <tbody>
              {DELIVERYMEN.map((item, index) => (
                <tr key={item.id} className="border-b border-gray-100 last:border-b-0">
                  <td className="px-3 py-3 text-xs text-gray-500">{index + 1}</td>
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-2">
                      <img src={item.avatar} alt={item.name} className="h-7 w-7 rounded-full object-cover" />
                      <div>
                        <p className="text-xs font-semibold text-[#1E1E24]">{item.name}</p>
                        <p className="text-[11px] text-[#F59E0B]">⭐ #L9(2)</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-3">
                    <p className="text-xs text-[#1E1E24]">{item.contactName}</p>
                    <p className="text-[11px] text-gray-500">{item.phone}</p>
                  </td>
                  <td className="px-3 py-3 text-xs text-[#1E1E24]">{item.radius}</td>
                  <td className="px-3 py-3 text-xs text-[#1E1E24]">{item.totalOrders}</td>
                  <td className="px-3 py-3 text-[11px] text-[#1E1E24]">
                    <p>Currently Assigned Orders : {item.assignedOrders}</p>
                    <p>Active Status : {item.status}</p>
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-2">
                      <button className="flex h-6 w-6 items-center justify-center rounded-md border border-[#C4B5FD] bg-[#F5F3FF] text-[#7C3AED]">
                        <Pencil size={12} />
                      </button>
                      <button className="flex h-6 w-6 items-center justify-center rounded-md border border-[#FECACA] bg-[#FEF2F2] text-[#EF4444]">
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

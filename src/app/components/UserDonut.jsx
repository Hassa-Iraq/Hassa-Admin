'use client'
import { useEffect, useMemo, useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { ChevronDown } from 'lucide-react';

export default function UserStatistics() {
  const [data, setData] = useState([
    { name: 'Customers', value: 0, color: '#7c3aed' },
    { name: 'Restaurants', value: 0, color: '#14b8a6' },
    { name: 'Delivery Man', value: 0, color: '#f87171' },
  ]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('overall'); // overall | this_month | this_week | today

  useEffect(() => {
    let cancelled = false;

    const fetchStatistics = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('token') || '';
        const res = await fetch(`/api/admin/analytics/statistics?filter=${encodeURIComponent(filter)}`, {
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });
        const payload = await res.json();
        if (!res.ok) throw new Error(payload?.message || 'Failed to fetch statistics');

        const raw = payload?.data || payload?.result || payload || {};

        const customers =
          raw?.customers ??
          raw?.customer ??
          raw?.customers_count ??
          raw?.customersCount ??
          raw?.total_customers ??
          raw?.customers_registered ??
          0;

        const restaurants =
          raw?.restaurants ??
          raw?.restaurant ??
          raw?.restaurants_count ??
          raw?.restaurantsCount ??
          raw?.total_restaurants ??
          raw?.restaurants_registered ??
          0;

        const deliveryMan =
          raw?.delivery_men ??
          raw?.deliverymen ??
          raw?.delivery_man ??
          raw?.deliveryMan ??
          raw?.delivery_men_count ??
          raw?.deliveryMenCount ??
          raw?.total_delivery_men ??
          raw?.total_deliverymen ??
          raw?.delivery_men_registered ??
          0;

        if (!cancelled) {
          setData([
            { name: 'Customers', value: Number(customers) || 0, color: '#7c3aed' },
            { name: 'Restaurants', value: Number(restaurants) || 0, color: '#14b8a6' },
            { name: 'Delivery Man', value: Number(deliveryMan) || 0, color: '#f87171' },
          ]);
        }
      } catch {
        // Keep zeros on failure.
        if (!cancelled) setData([
          { name: 'Customers', value: 0, color: '#7c3aed' },
          { name: 'Restaurants', value: 0, color: '#14b8a6' },
          { name: 'Delivery Man', value: 0, color: '#f87171' },
        ]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchStatistics();
    return () => {
      cancelled = true;
    };
  }, [filter]);

  const total = data.reduce((sum, item) => sum + item.value, 0);
  const hasAnyValue = total > 0;

  const COLORS = ['#7c3aed', '#14b8a6', '#f87171'];
  const placeholderData = useMemo(
    () => [{ name: 'No Data', value: 1, color: '#e5e7eb' }],
    []
  );

  const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
    // Hide tiny labels to avoid clipping/overlap near edges.
    if (!Number.isFinite(percent) || percent < 0.03) return null;
    const RADIAN = Math.PI / 180;
    // Keep labels comfortably inside the donut ring.
    const radius = innerRadius + (outerRadius - innerRadius) * 0.35;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor="middle"
        dominantBaseline="central"
        className="text-[11px] font-semibold"
        stroke="rgba(0,0,0,0.25)"
        strokeWidth={2}
        paintOrder="stroke"
      >
        {`${(percent * 100).toFixed(1)}%`}
      </text>
    );
  };

  const CustomLegend = () => (
    <div className="flex items-center justify-center gap-8 mt-6 ">
      {data.map((entry, index) => (
        <div key={index} className="flex items-center gap-2">
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: entry.color }}
          ></div>
          <span className="text-sm text-gray-700">{entry.name}</span>
        </div>
      ))}
    </div>
  );

  return (
    <div className="bg-white rounded-lg shadow p-6 border border-[#8A8A9E80]">
      {/* Header with border bottom */}
      <div className="flex items-center justify-between pb-4 border-b border-[#8A8A9E80] mb-4">
        <h2 className="text-lg font-bold text-gray-900">User Statistics</h2>
        
        {/* Radius Dropdown */}
      </div>

      {/* Overall Dropdown */}
      <div className="flex justify-end mb-4">
        <div className="relative w-32">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="appearance-none w-full bg-white border border-[#8A8A9E80] rounded-lg px-4 py-2 pr-10 text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500 cursor-pointer"
          >
            <option value="overall">Overall</option>
            <option value="this_month">This Month</option>
            <option value="this_year">This Year</option>
            <option value="today">Today</option>
          </select>
          <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        </div>
      </div>

      {/* Donut Chart */}
      {loading ? (
        <div className="mt-6 h-[260px] flex items-center justify-center text-sm text-gray-500">
          Loading...
        </div>
      ) : (
        <div className="relative">
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={hasAnyValue ? data : placeholderData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={hasAnyValue ? renderCustomLabel : undefined}
                outerRadius={120}
                innerRadius={70}
                fill="#8884d8"
                dataKey="value"
              >
                {(hasAnyValue ? data : placeholderData).map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={hasAnyValue ? COLORS[index] : entry.color}
                  />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>

          {!hasAnyValue && (
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <div className="text-2xl font-bold text-gray-800">0</div>
              <div className="mt-1 text-xs text-gray-500">No data for this period</div>
            </div>
          )}
        </div>
      )}

      {/* Custom Legend */}
      <CustomLegend />
    </div>
  );
}
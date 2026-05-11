'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
 CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { ChevronDown } from 'lucide-react';
import { ChartSkeleton } from '@/app/components/LoadingSpinner';

export default function RevenueChart() {
  const [loading, setLoading] = useState(false);

  // overall | this_month | this_year | today
  const [filter, setFilter] = useState('overall');

  const [summary, setSummary] = useState({
    total_sells: 0,
    admission_commission: 0,
    subscriptions: 0,
  });

  const emptyMonths = [
    { month: 'JAN', admission: 0, sales: 0, subscriptions: 0 },
    { month: 'FEB', admission: 0, sales: 0, subscriptions: 0 },
    { month: 'MAR', admission: 0, sales: 0, subscriptions: 0 },
    { month: 'APR', admission: 0, sales: 0, subscriptions: 0 },
    { month: 'MAY', admission: 0, sales: 0, subscriptions: 0 },
    { month: 'JUN', admission: 0, sales: 0, subscriptions: 0 },
    { month: 'JUL', admission: 0, sales: 0, subscriptions: 0 },
    { month: 'AUG', admission: 0, sales: 0, subscriptions: 0 },
    { month: 'SEP', admission: 0, sales: 0, subscriptions: 0 },
    { month: 'OCT', admission: 0, sales: 0, subscriptions: 0 },
    { month: 'NOV', admission: 0, sales: 0, subscriptions: 0 },
    { month: 'DEC', admission: 0, sales: 0, subscriptions: 0 },
  ];

  const [data, setData] = useState(emptyMonths);

  useEffect(() => {
    let cancelled = false;

    const fetchRevenueOverview = async () => {
      setLoading(true);

      try {
        const token = localStorage.getItem('token') || '';

        const res = await fetch(
          `/api/admin/analytics/revenue-overview?filter=${encodeURIComponent(
            filter
          )}`,
          {
            headers: {
              ...(token
                ? {
                    Authorization: `Bearer ${token}`,
                  }
                : {}),
            },
          }
        );

        let payload = {};

        try {
          payload = await res.json();
        } catch {
          throw new Error('Invalid JSON response');
        }

        if (!res.ok) {
          throw new Error(
            payload?.message || 'Failed to fetch revenue overview'
          );
        }

        const raw = payload?.data || {};

        const summaryData = raw?.summary || {};

        const monthlyData = raw?.monthly || [];

        const formattedData =
          monthlyData.length > 0
            ? monthlyData.map((item) => ({
                month: item?.month?.toUpperCase() || '',
                admission:
                  Number(item?.admission_commission) || 0,
                sales: Number(item?.total_sells) || 0,
                subscriptions:
                  Number(item?.subscriptions) || 0,
              }))
            : emptyMonths;

        if (!cancelled) {
          setSummary({
            total_sells:
              Number(summaryData?.total_sells) || 0,

            admission_commission:
              Number(
                summaryData?.admission_commission
              ) || 0,

            subscriptions:
              Number(summaryData?.subscriptions) || 0,
          });

          setData(formattedData);
        }
      } catch (error) {
        if (!cancelled) {
          setSummary({
            total_sells: 0,
            admission_commission: 0,
            subscriptions: 0,
          });

          setData(emptyMonths);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchRevenueOverview();

    return () => {
      cancelled = true;
    };
  }, [filter]);

  const maxValue = useMemo(() => {
    const values = data.flatMap((item) => [
      item.admission,
      item.sales,
      item.subscriptions,
    ]);

    const max = Math.max(...values, 0);

    return max === 0 ? 10 : Math.ceil(max * 1.1);
  }, [data]);

  return (
    <div className="bg-white rounded-lg shadow p-6 border border-[#8A8A9E80]">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-[#8A8A9E80] mb-6">
        <h2 className="text-lg font-bold text-gray-900">
          Revenue Overview
        </h2>
      </div>

      {/* Filter Dropdown */}
      <div className="flex justify-end mb-6">
        <div className="relative w-36">
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

          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        </div>
      </div>

      {/* Top Legend */}
      <div className="flex flex-wrap items-center gap-6 mb-6 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-purple-600"></div>

          <span className="text-gray-700">
            Admission commission: IQD{' '}
            {summary.admission_commission.toLocaleString()}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-teal-500"></div>

          <span className="text-gray-700">
            Total sells: IQD{' '}
            {summary.total_sells.toLocaleString()}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-orange-500"></div>

          <span className="text-gray-700">
            Subscriptions: IQD{' '}
            {summary.subscriptions.toLocaleString()}
          </span>
        </div>
      </div>

      {/* Chart */}
      {loading ? (
        <ChartSkeleton
          heightClass="h-[350px]"
          className="mt-4"
        />
      ) : (
        <ResponsiveContainer width="100%" height={350}>
          <LineChart
            data={data}
            margin={{
              top: 10,
              right: 20,
              left: 0,
              bottom: 0,
            }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#f1f5f9"
            />

            <XAxis
              dataKey="month"
              axisLine={false}
              tickLine={false}
              tick={{
                fill: '#6B7280',
                fontSize: 12,
              }}
            />

            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{
                fill: '#6B7280',
                fontSize: 12,
              }}
              domain={[0, maxValue]}
            />

            <Tooltip
              contentStyle={{
                backgroundColor: '#fff',
                border: '1px solid #e5e7eb',
                borderRadius: '10px',
                padding: '10px',
              }}
            />

            <Line
              type="monotone"
              dataKey="admission"
              stroke="#7c3aed"
              strokeWidth={3}
              dot={false}
              name="Admission commission"
            />

            <Line
              type="monotone"
              dataKey="sales"
              stroke="#14b8a6"
              strokeWidth={3}
              dot={false}
              name="Total sells"
            />

            <Line
              type="monotone"
              dataKey="subscriptions"
              stroke="#f97316"
              strokeWidth={3}
              dot={false}
              name="Subscriptions"
            />
          </LineChart>
        </ResponsiveContainer>
      )}

      {/* Bottom Legend */}
      <div className="flex flex-wrap items-center justify-center gap-8 mt-6 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-purple-600"></div>
          <span className="text-gray-700">
            Admission commission
          </span>
        </div>

        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-teal-500"></div>
          <span className="text-gray-700">
            Total sells
          </span>
        </div>

        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-orange-500"></div>
          <span className="text-gray-700">
            Subscriptions
          </span>
        </div>
      </div>
    </div>
  );
}
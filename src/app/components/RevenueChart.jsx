'use client'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { ChevronDown } from 'lucide-react';

export default function RevenueChart() {
  const data = [
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
    { month: 'DEC', admission: 0, sales: 0, subscriptions: 0 }
  ];

  return (
    <div className="bg-white rounded-lg shadow p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-8">
          <h2 className="text-lg font-bold text-gray-900">Revenue Overview</h2>
          
          {/* Legend */}
          <div className="flex items-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-purple-600"></div>
              <span className="text-gray-700">Admission commission: $ 0.00</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-teal-500"></div>
              <span className="text-gray-700">Total sells: $ 0.00</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-orange-500"></div>
              <span className="text-gray-700">Subscriptions: $ 0.00</span>
            </div>
          </div>
        </div>

        {/* Radius Dropdown */}
      </div>

      {/* Chart */}
      <ResponsiveContainer width="100%" height={350}>
        <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis 
            dataKey="month" 
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#6B7280', fontSize: 12 }}
          />
          <YAxis 
            label={{ value: '$ (USD)', angle: -90, position: 'insideLeft', style: { fill: '#6B7280', fontSize: 12 } }}
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#6B7280', fontSize: 12 }}
            domain={[0, 12]}
            ticks={[0, 2, 4, 6, 8, 10, 12]}
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: '#fff', 
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              padding: '8px 12px'
            }}
          />
          <Line 
            type="monotone" 
            dataKey="admission" 
            stroke="#7c3aed" 
            strokeWidth={2}
            dot={false}
            name="Admission commission"
          />
          <Line 
            type="monotone" 
            dataKey="sales" 
            stroke="#14b8a6" 
            strokeWidth={2}
            dot={false}
            name="Total sells"
          />
          <Line 
            type="monotone" 
            dataKey="subscriptions" 
            stroke="#f97316" 
            strokeWidth={2}
            dot={false}
            name="Subscriptions"
          />
        </LineChart>
      </ResponsiveContainer>

      {/* Bottom Legend */}
      <div className="flex items-center justify-center gap-8 mt-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-purple-600"></div>
          <span className="text-gray-700">Admission commission</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-teal-500"></div>
          <span className="text-gray-700">Total sells</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-orange-500"></div>
          <span className="text-gray-700">Subscriptions</span>
        </div>
      </div>
    </div>
  );
}
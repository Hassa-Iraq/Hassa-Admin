'use client'
import { PieChart, Pie, Cell, ResponsiveContainer, Legend } from 'recharts';
import { ChevronDown } from 'lucide-react';

export default function UserStatistics() {
  const data = [
    { name: 'Customers', value: 444, color: '#7c3aed' },
    { name: 'Restaurants', value: 345, color: '#14b8a6' },
    { name: 'Delivery Man', value: 289, color: '#f87171' }
  ];

  const total = data.reduce((sum, item) => sum + item.value, 0);

  const COLORS = ['#7c3aed', '#14b8a6', '#f87171'];

  const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor={x > cx ? 'start' : 'end'}
        dominantBaseline="central"
        className="text-sm font-semibold"
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
        <div className="relative w-32">
          <select className="appearance-none w-full bg-white border border-purple-300 rounded-lg px-2 py-2 pr-10 text-sm text-purple-600 focus:outline-none focus:ring-2 focus:ring-purple-500 cursor-pointer">
            <option>Radius: 5km</option>
            <option>Radius: 10km</option>
            <option>Radius: 15km</option>
            <option>Radius: 20km</option>
          </select>
          <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-purple-600 pointer-events-none" />
        </div>
      </div>

      {/* Overall Dropdown */}
      <div className="flex justify-end mb-4">
        <div className="relative w-32">
          <select className="appearance-none w-full bg-white border border-[#8A8A9E80] rounded-lg px-4 py-2 pr-10 text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500 cursor-pointer">
            <option>Overall</option>
            <option>This Month</option>
            <option>This Week</option>
            <option>Today</option>
          </select>
          <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        </div>
      </div>

      {/* Donut Chart */}
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={renderCustomLabel}
            outerRadius={120}
            innerRadius={70}
            fill="#8884d8"
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index]} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>

      {/* Custom Legend */}
      <CustomLegend />
    </div>
  );
}
'use client';

import { Mail, ShoppingCart, Search, Globe, ChevronDown } from 'lucide-react';

export default function Topbar({
  title,
  subtitle,
  rightContent,
}) {
  return (
    <div className="fixed top-0 right-0 left-64 h-[144px] bg-white z-50">

      <div className="h-full flex flex-col">

        {/* ===== ROW 1 ===== */}
        <div className="h-[64px] flex items-center justify-end gap-6 border-b border-gray-100 px-6">

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-600" />
            <input
              type="text"
              placeholder="Search in Hassa..."
              className="pl-9 pr-4 py-2 w-72 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          {/* Mail */}
          <div className="relative">
            <Mail className="w-5 h-5 text-purple-600" />
            <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></span>
          </div>

          {/* Cart */}
          <div className="relative">
            <ShoppingCart className="w-5 h-5 text-purple-600" />
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
              2
            </span>
          </div>

          {/* Language */}
          <div className="flex items-center gap-2 cursor-pointer">
            <Globe className="w-4 h-4 text-gray-600" />
            <span className="text-sm text-gray-700">English (US)</span>
            <ChevronDown className="w-4 h-4 text-gray-400" />
          </div>

          {/* Profile */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-purple-600 text-white flex items-center justify-center font-semibold">
              JD
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">John Doe</p>
              <p className="text-xs text-gray-500">admin@gmail.com</p>
            </div>
          </div>
        </div>


        {/* ===== ROW 2 (FULL WIDTH BG) ===== */}
        <div className="h-[80px] bg-gray-50 flex items-center justify-between px-6">

          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              {title}
            </h2>

            {subtitle && (
              <p className="text-sm text-gray-500 mt-1">
                {subtitle}
              </p>
            )}
          </div>

          {rightContent}

        </div>

      </div>
    </div>
  );
}
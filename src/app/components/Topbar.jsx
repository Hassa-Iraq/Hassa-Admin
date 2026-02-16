import { Mail, ShoppingCart, Search, Globe, ChevronDown } from 'lucide-react';

export default function Topbar() {
  return (
    <div className="h-16 bg-white shadow flex items-center justify-between px-6">
      {/* Left Side - Title and Subtitle */}
      <div>
        <h2 className="text-xl font-bold text-gray-900">Dashboard Overview</h2>
        <p className="text-sm text-gray-500">Welcome back Admin!</p>
      </div>

      {/* Center - Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[#6001D2]" />
        <input
          type="text"
          placeholder="Search in Hassa..."
          className="pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm text-[#6001D2] focus:outline-none focus:ring-2 focus:ring-purple-500 w-96"
        />
      </div>

      {/* Right Side - Icons, Language, Profile */}
      <div className="flex items-center gap-4">
        {/* Mail Icon with Badge */}
        <div className="relative cursor-pointer">
          <Mail className="w-5 h-5 text-purple-600" />
          <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></span>
        </div>

        {/* Shopping Cart Icon with Badge */}
        <div className="relative cursor-pointer">
          <ShoppingCart className="w-5 h-5 text-purple-600" />
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
            2
          </span>
        </div>

        {/* Language Selector */}
        <div className="flex items-center gap-2 cursor-pointer">
          <Globe className="w-4 h-4 text-gray-600" />
          <span className="text-sm text-gray-700">English (US)</span>
          <ChevronDown className="w-4 h-4 text-gray-400" />
        </div>

        {/* Profile Section */}
        <div className="flex items-center gap-3 cursor-pointer">
          <img
            src="https://ui-avatars.com/api/?name=John+Doe&background=7c3aed&color=fff"
            alt="Profile"
            className="w-10 h-10 rounded-full"
          />
          <div>
            <p className="text-sm font-semibold text-gray-900">John Doe</p>
            <p className="text-xs text-gray-500">admin@gmail.com</p>
          </div>
        </div>
      </div>
    </div>
  );
}
'use client'
import { useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { ChevronDown, LayoutDashboard, ShoppingCart, Store, Users, FileText, Wallet, DollarSign, CreditCard, Building2, UserCircle, Settings, Bell, ChevronUp, Search } from 'lucide-react';

export default function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const [activeItem, setActiveItem] = useState(null);
  const [expandedSections, setExpandedSections] = useState({
    orderManagement: true,
    vendorManagement: false,
    walletManagement: false,
    apartmentManagement: false,
    employeeManagement: false,
    transactionManagement: false,
    taxManagement: false,
    businessSettings: false,
    reportLog: false,
    marketing: false
  });
    
const [searchQuery, setSearchQuery] = useState('');

  const ordersFilterSlugByLabel = useMemo(() => ({
    All: 'all',
    Pending: 'pending',
    Accepted: 'accepted',
    Processing: 'processing',
    Scheduled: 'scheduled',
    'Food On The Way': 'food-on-the-way',
    Delivered: 'delivered',
    Cancelled: 'cancelled',
    Refunded: 'refunded',
    'Dine In': 'dine-in',
    'Offline Payments': 'offline-payments',
    'Payments Failed': 'payments-failed',
  }), []);

  const ordersFilterLabelBySlug = useMemo(() => {
    const entries = Object.entries(ordersFilterSlugByLabel);
    return Object.fromEntries(entries.map(([label, slug]) => [slug, label]));
  }, [ordersFilterSlugByLabel]);

  useEffect(() => {
    if (!pathname) return;

    if (pathname === '/dashboard') {
      setActiveItem('Dashboard');
      return;
    }

    const match = pathname.match(/^\/dashboard\/orders\/([^/]+)$/);
    if (match) {
      const slug = match[1];
      const label = ordersFilterLabelBySlug[slug] ?? 'All';
      setActiveItem(label);
      setExpandedSections(prev => ({ ...prev, orderManagement: true }));
    }
  }, [pathname, ordersFilterLabelBySlug]);

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const menuItems = [
    {
      icon: LayoutDashboard,
      label: 'Dashboard',
      hasSubmenu: false
    },
    {
      label: 'ORDER MANAGEMENT',
      isHeader: true,
      items: [
        { icon: ShoppingCart, label: 'Orders', key: 'orderManagement', submenu: ['All', 'Pending', 'Accepted', 'Processing', 'Scheduled', 'Food On The Way', 'Delivered', 'Cancelled', 'Refunded', 'Dine In', 'Offline Payments', 'Payments Failed'] },
        { icon: Store, label: 'Dispatch Management', hasSubmenu: false },
        { icon: ShoppingCart, label: 'Order Refund', hasSubmenu: false }
      ]
    },
    {
      label: 'VENDOR MANAGEMENT',
      isHeader: true,
      items: [
        { icon: Store, label: 'Restaurants', key: 'vendorManagement', submenu: ['All Restaurants', 'Pending Approval', 'Active Restaurants', 'Suspended'] },
        // { icon: Users, label: 'Customers', hasSubmenu: false }
      ]
      },
     {
      label: 'CUSTOMER MANAGEMENT',
      isHeader: true,
      items: [
        { icon: Users, label: 'Customers', hasSubmenu: false }
      ]
    },
    {
      label: 'WALLET MANAGEMENT',
      isHeader: true,
      items: [
        { icon: Wallet, label: 'Wallet', key: 'walletManagement', submenu: ['Customer Wallet', 'Vendor Wallet', 'Driver Wallet'] }
      ]
    },
    {
      label: 'APARTMENT MANAGEMENT',
      isHeader: true,
      items: [
        { icon: Building2, label: 'Zip/Apartments', key: 'apartmentManagement', submenu: ['All Apartments', 'Add New'] }
      ]
      },
    {
      label: 'DELIVERY MANAGEMENT',
      isHeader: true,
      items: [
        { icon: UserCircle, label: 'Deliveryman', key: 'deliveryManagement', submenu: ['All Employees', 'Roles', 'Permissions'] },
      ]
      },
    {
      label: 'EMPLOYEE MANAGEMENT',
      isHeader: true,
      items: [
        { icon: UserCircle, label: 'Employees', key: 'employeeManagement', submenu: ['All Employees', 'Roles', 'Permissions'] },
      ]
      },
    {
      label: 'RADIUS MANAGEMENT',
      isHeader: true,
      items: [
        { icon: Users, label: 'Riders Setup', hasSubmenu: false }
      ]
    },
    {
      label: 'TRANSACTION MANAGEMENT',
      isHeader: true,
      items: [
        { icon: DollarSign, label: 'Collect Cash', hasSubmenu: false },
        { icon: CreditCard, label: 'Restaurant Withdraw', hasSubmenu: false },
        { icon: CreditCard, label: 'Deliveryman Payments', hasSubmenu: false },
        { icon: FileText, label: 'Withdraw Method', hasSubmenu: false }
      ]
    },
    {
      label: 'TAX MANAGEMENT',
      isHeader: true,
      items: [
        { icon: FileText, label: 'Tax Setup', hasSubmenu: false }
      ]
    },
    {
      label: 'BUSINESS SETTINGS',
      isHeader: true,
      items: [
        { icon: Settings, label: 'Payment Method', hasSubmenu: false },
        { icon: Settings, label: 'Social Media', hasSubmenu: false },
        { icon: Settings, label: 'Deliveryman Settings', hasSubmenu: false }
      ]
    },
    {
      label: 'REPORT MANAGEMENT',
      isHeader: true,
      items: [
        { icon: FileText, label: 'Transaction Report', hasSubmenu: false },
        { icon: FileText, label: 'Food Report', hasSubmenu: false },
        { icon: FileText, label: 'Order Report', key: 'reportLog', submenu: ['Daily Report', 'Monthly Report', 'Yearly Report'] },
        { icon: FileText, label: 'Restaurant Report', hasSubmenu: false },
        { icon: FileText, label: 'Tax Report', hasSubmenu: false },
        { icon: FileText, label: 'Customer Report', key: 'customerReport', submenu: ['Active Customers', 'Inactive Customers'] },
        { icon: FileText, label: 'Restaurant WP Report', hasSubmenu: false }
      ]
    },
    {
      label: 'MARKETING',
      isHeader: true,
      items: [
        { icon: Bell, label: 'Push Notification', hasSubmenu: false }
      ]
    }
  ];

  const renderSubItem = (item, index) => {
    const Icon = item.icon;
    const hasSubmenu = item.submenu && item.submenu.length > 0;
    const isExpanded = expandedSections[item.key];

    return (
      <div key={index}>
        <div
          // className="sidebar-item flex items-center gap-2  cursor-pointer p-2 rounded hover:bg-purple-50 text-gray-700 hover:text-purple-600 transition-colors"
         className={`flex items-center gap-2 cursor-pointer p-2 rounded border transition-all
${activeItem === item.label 
  ? 'border-[#7C3AED] bg-purple-50 text-purple-600'
  : 'border-transparent  hover:bg-purple-50 hover:text-purple-600'
}`}
onClick={() => {
  setActiveItem(item.label);
  hasSubmenu && toggleSection(item.key);
  if (!hasSubmenu) {
    if (item.label === 'Dashboard') router.push('/dashboard');
  }
}}
> 
          {Icon && <Icon size={18} />}
          <span className="flex-1 font-semibold text-[#1E1E24] ">{item.label}</span>
          {hasSubmenu && (
            isExpanded ? <ChevronDown size={16} /> : <ChevronUp size={16} />
          )}
        </div>
        
        {hasSubmenu && isExpanded && (
          <div className="ml-6 mt-1 space-y-1 font-medium text-[#1E1E24] ">
            {item.submenu.map((subMenuItem, subIndex) => {
              const isOrdersSubItem = item.label === 'Orders';
              const slug = isOrdersSubItem
                ? ordersFilterSlugByLabel[subMenuItem] ?? 'all'
                : null;

              return (
                <div
                  key={subIndex}
                  className={`flex items-center gap-2 cursor-pointer p-2 rounded text-sm border transition-all
                  ${activeItem === subMenuItem 
                    ? 'border-[#7C3AED] bg-purple-50 text-purple-600'
                    : 'border-transparent  hover:bg-purple-50 hover:text-purple-600'
                  }`}
                  onClick={() => {
                    setActiveItem(subMenuItem);
                    if (slug) {
                      router.push(`/dashboard/orders/${slug}`);
                    }
                  }}
                >
                  <div className="w-1.5 h-1.5 rounded-full bg-[#00C49A]"></div>
                  <span>{subMenuItem}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  const renderMenuItem = (item, index) => {
    if (item.isHeader) {
      return (
        <div key={index}>
          <div className="text-[14px] font-medium text-[#1E1E24] mt-4 mb-2 px-2">
            {item.label}
          </div>
          {item.items.map((subItem, subIndex) => renderSubItem(subItem, subIndex))}
        </div>
      );
    }

    const Icon = item.icon;
    return (
      <div
        key={index}
        className="flex items-center font-semibold gap-2 cursor-pointer p-2 rounded hover:bg-purple-50 text-[#1E1E24] hover:text-purple-600 transition-colors"
        onClick={() => {
          setActiveItem(item.label);
          if (item.label === 'Dashboard') router.push('/dashboard');
        }}
      >
        {Icon && <Icon size={18} />}
        <span>{item.label}</span>
      </div>
    );
  };

  return (
      // <aside className="w-64 bg-white shadow-md hidden md:block h-screen overflow-y-auto">
      <aside className="fixed left-0 top-0 w-64 h-screen bg-white shadow-md hidden md:block overflow-y-auto z-50">
      <div className="p-4 ">
        <div className="font-bold text-purple-600 text-xl flex items-center gap-2">
          Hassa
        </div>
          </div>
          
          <div className="p-4">
        <div className="relative">
          <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search Menu..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-purple-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-purple-50 text-sm"
          />
        </div>
      </div>

      <nav className="px-3 py-4 text-sm">
        {menuItems.map((item, index) => renderMenuItem(item, index))}
      </nav>
    </aside>
  );
}


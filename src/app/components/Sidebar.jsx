'use client'
import { useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { ChevronDown, LayoutDashboard, ShoppingCart, Store, Users, FileText, Wallet, DollarSign, CreditCard, Building2, UserCircle, Settings, Bell, ChevronUp, Search } from 'lucide-react';
import { useLanguage } from '@/app/i18n/LanguageContext';

export default function Sidebar({ isOpen = false, onClose = () => {} }) {
  const router = useRouter();
  const { dir, t } = useLanguage();
  const isRTL = dir === 'rtl';
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
    'Offline Payments': 'offline-payments',
    'Payments Failed': 'payments-failed',
  }), []);

  const ordersFilterLabelBySlug = useMemo(() => {
    const entries = Object.entries(ordersFilterSlugByLabel);
    return Object.fromEntries(entries.map(([label, slug]) => [slug, label]));
  }, [ordersFilterSlugByLabel]);

  // Route map for sidebar items
  const routeMap = useMemo(() => ({
    'Add Restaurants': '/dashboard/restaurants/add',
    'Restaurant List': '/dashboard/restaurants/list',
    'New Joining Request': '/dashboard/restaurants/requests',
    'Customers': '/dashboard/customers',
    'Dispatch Management': '/dashboard/dispatch',
    'Order Refund': '/dashboard/order-refund',
    'Customer Wallet': '/dashboard/wallet/customer',
    'Vendor Wallet': '/dashboard/wallet/vendor',
    'Driver Wallet': '/dashboard/wallet/driver',
    'All Apartments': '/dashboard/apartments',
    'Add New': '/dashboard/apartments/add',
    'Riders Setup': '/dashboard/riders-setup',
    'Collect Cash': '/dashboard/transactions/collect-cash',
    'Restaurant Withdraw': '/dashboard/transactions/restaurant-withdraw',
    'Deliveryman Payments': '/dashboard/transactions/deliveryman-payments',
    'Withdraw Method': '/dashboard/transactions/withdraw-method',
    'Tax Setup': '/dashboard/tax',
    'Payment Method': '/dashboard/settings/payment-method',
    'Social Media': '/dashboard/settings/social-media',
    'Deliveryman Settings': '/dashboard/settings/deliveryman',
    'Transaction Report': '/dashboard/reports/transaction',
    'Food Report': '/dashboard/reports/food',
    'Restaurant Report': '/dashboard/reports/restaurant',
    'Tax Report': '/dashboard/reports/tax',
    'Customer Report': '/dashboard/reports/customer',
    'Restaurant WP Report': '/dashboard/reports/restaurant-wp',
    'Push Notification': '/dashboard/marketing/notifications',
  }), []);

  useEffect(() => {
    if (!pathname) return;

    if (pathname === '/dashboard') {
      setActiveItem('Dashboard');
      return;
    }

    if (pathname === '/dashboard/restaurants/add') {
      setActiveItem('Add Restaurants');
      setExpandedSections(prev => ({ ...prev, vendorManagement: true }));
      return;
    }

    if (pathname === '/dashboard/restaurants/list') {
      setActiveItem('Restaurant List');
      setExpandedSections(prev => ({ ...prev, vendorManagement: true }));
      return;
    }

    if (pathname === '/dashboard/restaurants/requests') {
      setActiveItem('New Joining Request');
      setExpandedSections(prev => ({ ...prev, vendorManagement: true }));
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

  const submenuTKeys = {
    'All': 'all', 'Pending': 'pending', 'Accepted': 'accepted', 'Processing': 'processing',
    'Scheduled': 'scheduled', 'Food On The Way': 'foodOnTheWay', 'Delivered': 'delivered',
    'Cancelled': 'cancelled', 'Refunded': 'refunded', 'Offline Payments': 'offlinePayments',
    'Payments Failed': 'paymentsFailed', 'Add Restaurants': 'addRestaurants',
    'Restaurant List': 'restaurantList', 'New Joining Request': 'newJoiningRequest',
    'Customer Wallet': 'customerWallet', 'Vendor Wallet': 'vendorWallet', 'Driver Wallet': 'driverWallet',
    'All Apartments': 'allEmployees', 'Add New': 'addNewRestaurant',
    'All Employees': 'allEmployees', 'Roles': 'roles', 'Permissions': 'permissions',
    'Daily Report': 'dailyReport', 'Monthly Report': 'monthlyReport', 'Yearly Report': 'yearlyReport',
    'Active Customers': 'activeCustomers', 'Inactive Customers': 'inactiveCustomers',
  };

  const menuItems = [
    {
      icon: LayoutDashboard,
      label: 'Dashboard', tKey: 'dashboard',
      hasSubmenu: false
    },
    {
      label: 'ORDER MANAGEMENT', tKey: 'orderManagement',
      isHeader: true,
      items: [
        { icon: ShoppingCart, label: 'Orders', tKey: 'orders', key: 'orderManagement', submenu: ['All', 'Pending', 'Accepted', 'Processing', 'Scheduled', 'Food On The Way', 'Delivered', 'Cancelled', 'Refunded', 'Offline Payments', 'Payments Failed'] },
        { icon: Store, label: 'Dispatch Management', tKey: 'dispatchManagement', hasSubmenu: false },
        { icon: ShoppingCart, label: 'Order Refund', tKey: 'orderRefund', hasSubmenu: false }
      ]
    },
    {
      label: 'VENDOR MANAGEMENT', tKey: 'vendorManagement',
      isHeader: true,
      items: [
        { icon: Store, label: 'Restaurants', tKey: 'restaurants', key: 'vendorManagement', submenu: ['Add Restaurants', 'Restaurant List', 'New Joining Request'] },
      ]
    },
    {
      label: 'CUSTOMER MANAGEMENT', tKey: 'customerManagement',
      isHeader: true,
      items: [
        { icon: Users, label: 'Customers', tKey: 'customers', hasSubmenu: false }
      ]
    },
    {
      label: 'WALLET MANAGEMENT', tKey: 'walletManagement',
      isHeader: true,
      items: [
        { icon: Wallet, label: 'Wallet', tKey: 'wallet', key: 'walletManagement', submenu: ['Customer Wallet', 'Vendor Wallet', 'Driver Wallet'] }
      ]
    },
    {
      label: 'APARTMENT MANAGEMENT', tKey: 'radiusManagement',
      isHeader: true,
      items: [
        { icon: Building2, label: 'Zip/Apartments', tKey: 'ridersSetup', key: 'apartmentManagement', submenu: ['All Apartments', 'Add New'] }
      ]
    },
    {
      label: 'DELIVERY MANAGEMENT', tKey: 'deliveryManagement',
      isHeader: true,
      items: [
        { icon: UserCircle, label: 'Deliveryman', tKey: 'deliveryman', key: 'deliveryManagement', submenu: ['All Employees', 'Roles', 'Permissions'] },
      ]
    },
    {
      label: 'EMPLOYEE MANAGEMENT', tKey: 'employeeManagement',
      isHeader: true,
      items: [
        { icon: UserCircle, label: 'Employees', tKey: 'employees', key: 'employeeManagement', submenu: ['All Employees', 'Roles', 'Permissions'] },
      ]
    },
    {
      label: 'RADIUS MANAGEMENT', tKey: 'radiusManagement',
      isHeader: true,
      items: [
        { icon: Users, label: 'Riders Setup', tKey: 'ridersSetup', hasSubmenu: false }
      ]
    },
    {
      label: 'TRANSACTION MANAGEMENT', tKey: 'transactionManagement',
      isHeader: true,
      items: [
        { icon: DollarSign, label: 'Collect Cash', tKey: 'collectCash', hasSubmenu: false },
        { icon: CreditCard, label: 'Restaurant Withdraw', tKey: 'restaurantWithdraw', hasSubmenu: false },
        { icon: CreditCard, label: 'Deliveryman Payments', tKey: 'deliverymanPayments', hasSubmenu: false },
        { icon: FileText, label: 'Withdraw Method', tKey: 'withdrawMethod', hasSubmenu: false }
      ]
    },
    {
      label: 'TAX MANAGEMENT', tKey: 'taxManagement',
      isHeader: true,
      items: [
        { icon: FileText, label: 'Tax Setup', tKey: 'taxSetup', hasSubmenu: false }
      ]
    },
    {
      label: 'BUSINESS SETTINGS', tKey: 'businessSettings',
      isHeader: true,
      items: [
        { icon: Settings, label: 'Payment Method', tKey: 'paymentMethod', hasSubmenu: false },
        { icon: Settings, label: 'Social Media', tKey: 'socialMedia', hasSubmenu: false },
        { icon: Settings, label: 'Deliveryman Settings', tKey: 'deliverymanSettings', hasSubmenu: false }
      ]
    },
    {
      label: 'REPORT MANAGEMENT', tKey: 'reportManagement',
      isHeader: true,
      items: [
        { icon: FileText, label: 'Transaction Report', tKey: 'transactionReport', hasSubmenu: false },
        { icon: FileText, label: 'Food Report', tKey: 'foodReport', hasSubmenu: false },
        { icon: FileText, label: 'Order Report', tKey: 'orderReport', key: 'reportLog', submenu: ['Daily Report', 'Monthly Report', 'Yearly Report'] },
        { icon: FileText, label: 'Restaurant Report', tKey: 'restaurantReport', hasSubmenu: false },
        { icon: FileText, label: 'Tax Report', tKey: 'taxReport', hasSubmenu: false },
        { icon: FileText, label: 'Customer Report', tKey: 'customerReport', key: 'customerReport', submenu: ['Active Customers', 'Inactive Customers'] },
        { icon: FileText, label: 'Restaurant WP Report', tKey: 'restaurantWPReport', hasSubmenu: false }
      ]
    },
    {
      label: 'MARKETING', tKey: 'marketing',
      isHeader: true,
      items: [
        { icon: Bell, label: 'Push Notification', tKey: 'pushNotification', hasSubmenu: false }
      ]
    }
  ];

  // Filter menu items based on search
  const filteredMenuItems = useMemo(() => {
    if (!searchQuery.trim()) return menuItems;
    const q = searchQuery.toLowerCase();
    return menuItems.map(section => {
      if (!section.isHeader) {
        const translated = (t[section.tKey] || section.label).toLowerCase();
        if (section.label.toLowerCase().includes(q) || translated.includes(q)) return section;
        return null;
      }
      const matchedItems = section.items.filter(item => {
        const translated = (t[item.tKey] || item.label).toLowerCase();
        if (item.label.toLowerCase().includes(q) || translated.includes(q)) return true;
        if (item.submenu) return item.submenu.some(s => {
          const st = (t[submenuTKeys[s]] || s).toLowerCase();
          return s.toLowerCase().includes(q) || st.includes(q);
        });
        return false;
      });
      if (matchedItems.length === 0) return null;
      return { ...section, items: matchedItems };
    }).filter(Boolean);
  }, [searchQuery, t]);

  const handleSubItemClick = (item, hasSubmenu) => {
    setActiveItem(item.label);
    if (hasSubmenu) {
      toggleSection(item.key);
    } else {
      const route = routeMap[item.label];
      if (route) { router.push(route); onClose(); }
      else if (item.label === 'Dashboard') { router.push('/dashboard'); onClose(); }
    }
  };

  const handleSubmenuItemClick = (subMenuItem, parentItem) => {
    setActiveItem(subMenuItem);
    const route = routeMap[subMenuItem];
    if (route) {
      router.push(route);
      onClose();
    } else if (parentItem.label === 'Orders') {
      const slug = ordersFilterSlugByLabel[subMenuItem] ?? 'all';
      router.push(`/dashboard/orders/${slug}`);
      onClose();
    }
  };

  const renderSubItem = (item, index) => {
    const Icon = item.icon;
    const hasSubmenu = item.submenu && item.submenu.length > 0;
    const isExpanded = expandedSections[item.key];

    return (
      <div key={index}>
        <div
          className={`flex items-center gap-2 cursor-pointer p-2 rounded border transition-all
${activeItem === item.label 
  ? 'border-[#7C3AED] bg-purple-50 text-purple-600'
  : 'border-transparent hover:bg-purple-50 hover:text-purple-600'
}`}
          onClick={() => handleSubItemClick(item, hasSubmenu)}
        >
          {Icon && <Icon size={18} />}
          <span className="flex-1 font-semibold text-[#1E1E24]">{t[item.tKey] || item.label}</span>
          {hasSubmenu && (
            isExpanded ? <ChevronDown size={16} /> : <ChevronUp size={16} />
          )}
        </div>
        
        {hasSubmenu && isExpanded && (
          <div className="ml-6 mt-1 space-y-1 font-medium text-[#1E1E24]">
            {item.submenu.map((subMenuItem, subIndex) => (
              <div
                key={subIndex}
                className={`flex items-center gap-2 cursor-pointer p-2 rounded text-sm border transition-all
                ${activeItem === subMenuItem 
                  ? 'border-[#7C3AED] bg-purple-50 text-purple-600'
                  : 'border-transparent hover:bg-purple-50 hover:text-purple-600'
                }`}
                onClick={() => handleSubmenuItemClick(subMenuItem, item)}
              >
                <div className="w-1.5 h-1.5 rounded-full bg-[#00C49A]"></div>
                <span>{t[submenuTKeys[subMenuItem]] || subMenuItem}</span>
              </div>
            ))}
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
            {t[item.tKey] || item.label}
          </div>
          {item.items.map((subItem, subIndex) => renderSubItem(subItem, subIndex))}
        </div>
      );
    }

    const Icon = item.icon;
    return (
      <div
        key={index}
        className={`flex items-center font-semibold gap-2 cursor-pointer p-2 rounded border transition-all
          ${activeItem === item.label
            ? 'border-[#7C3AED] bg-purple-50 text-purple-600'
            : 'border-transparent hover:bg-purple-50 text-[#1E1E24] hover:text-purple-600'
          }`}
        onClick={() => {
          setActiveItem(item.label);
          if (item.label === 'Dashboard') router.push('/dashboard');
        }}
      >
        {Icon && <Icon size={18} />}
        <span>{t[item.tKey] || item.label}</span>
      </div>
    );
  };

  return (
    <aside className={`fixed top-0 ${isRTL ? 'right-0' : 'left-0'} w-64 h-screen bg-white shadow-md overflow-y-auto z-50 transition-transform duration-300 ${isOpen ? 'translate-x-0' : isRTL ? 'translate-x-full' : '-translate-x-full'} md:translate-x-0`}>
      <div className="p-4 flex items-center justify-between">
        <div className="font-bold text-purple-600 text-xl flex items-center gap-2">
          Hassa
        </div>
        <button onClick={onClose} className="md:hidden text-gray-400 hover:text-gray-600">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>
          
      <div className="p-4">
        <div className="relative">
          <Search size={18} className={`absolute top-1/2 transform -translate-y-1/2 text-[#6001D2] ${isRTL ? 'right-3' : 'left-3'}`} />
          <input
            type="text"
            placeholder={t.searchMenu || "Search Menu..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`w-full py-2 border border-transparent focus:border-[#6001D2] focus:outline-none rounded-lg bg-[#EAB7FF33] text-sm ${isRTL ? 'pr-10 pl-4' : 'pl-10 pr-4'}`}
          />
        </div>
      </div>

      <nav className="px-3 py-4 text-sm">
        {filteredMenuItems.map((item, index) => renderMenuItem(item, index))}
      </nav>
    </aside>
  );
}

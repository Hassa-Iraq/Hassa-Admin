'use client'
import { useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { ChevronDown, ChevronUp, Search } from 'lucide-react';
import { useLanguage } from '@/app/i18n/LanguageContext';

export default function Sidebar({ isOpen = false, onClose = () => {} }) {
  const SIDEBAR_ICONS = {
    dashboard: '/icons/Vector.png',
    orders: '/icons/orders.png',
    restaurants: '/icons/restaurant.png',
    foods: '/icons/food.png',
    categories: '/icons/orders.png',
    addons: '/icons/customer.png',
    reviews: '/icons/customers.png',
    customers: '/icons/customer.png',
    wallet: '/icons/material-symbols_wallet.png',
    apartments: '/icons/iocn4.png',
    deliveryman: '/icons/driver.png',
    employees: '/icons/employee.png',
    riders: '/icons/radius.png',
    collectCash: '/icons/cash.png',
    restaurantWithdraw: '/icons/withdraw.png',
    deliverymanPayments: '/icons/deliveryman.png',
    withdrawMethod: '/icons/withdraw-method.png',
    tax: '/icons/tax.png',
    businessSetup: '/icons/business.png',
    paymentMethod: '/icons/pay.png',
    socialMedia: '/icons/social.png',
    deliverymanSettings: '/icons/driver.png',
    transactionReport: '/icons/cash.png',
    foodReport: '/icons/food.png',
    orderReport: '/icons/orders.png',
    restaurantReport: '/icons/resReport.png',
    taxReport: '/icons/taxReport.png',
    customerReport: '/icons/customers.png',
    restaurantWpReport: '/icons/dispatch.png',
    banners: '/icons/notification.png',
  };
  const router = useRouter();
  const { dir, t } = useLanguage();
  const isRTL = dir === 'rtl';
  const pathname = usePathname();
  const [userRole, setUserRole] = useState('');
  const [sidebarPermissions, setSidebarPermissions] = useState({});
  const [activeItem, setActiveItem] = useState(null);
  const [expandedSections, setExpandedSections] = useState({
    orderManagement: false,
    vendorManagement: false,
    walletManagement: false,
    apartmentManagement: false,
    employeeManagement: false,
    transactionManagement: false,
    taxManagement: false,
    businessSettings: false,
    reportLog: false,
    foodManagement: false,
    categoriesManagement: false,
    cuisineCategories: false,
    bannersManagement: false,
  });
    
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const hydrateSidebarAuth = () => {
      try {
        const roleFromStorage = localStorage.getItem('userRole') || '';
        const normalized = String(roleFromStorage).trim().toLowerCase();
        setUserRole(normalized);
        const rawPermissions = localStorage.getItem('sidebarPermissions') || '';
        if (rawPermissions) {
          try {
            const parsed = JSON.parse(rawPermissions);
            setSidebarPermissions(parsed && typeof parsed === 'object' ? parsed : {});
          } catch {
            setSidebarPermissions({});
          }
        } else {
          setSidebarPermissions({});
        }
      } catch {
        setUserRole('');
        setSidebarPermissions({});
      }
    };

    hydrateSidebarAuth();

    const handleStorage = (event) => {
      if (!event?.key || event.key === 'userRole' || event.key === 'sidebarPermissions') {
        hydrateSidebarAuth();
      }
    };
    const handleAuthUpdate = () => hydrateSidebarAuth();

    window.addEventListener('storage', handleStorage);
    window.addEventListener('sidebar-auth-updated', handleAuthUpdate);
    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('sidebar-auth-updated', handleAuthUpdate);
    };
  }, []);

  useEffect(() => {
    const hasPermissions =
      sidebarPermissions &&
      typeof sidebarPermissions === 'object' &&
      Object.keys(sidebarPermissions).length > 0;
    if (userRole !== 'employee' || hasPermissions) return;

    const extractPermissionsFromMe = (payload = {}) => {
      const user = payload?.user || payload?.data?.user || payload?.data || payload;
      const candidates = [
        user?.employee_permissions,
        user?.employee_role?.employee_permissions,
        user?.role?.permissions,
        user?.permissions,
        payload?.employee_permissions,
        payload?.employee_role?.employee_permissions,
        payload?.data?.employee_permissions,
        payload?.data?.employee_role?.employee_permissions,
        payload?.employee?.employee_permissions,
        payload?.data?.employee?.employee_permissions,
        payload?.data?.user?.employee_permissions,
        payload?.data?.user?.employee_role?.employee_permissions,
        payload?.data?.user?.role?.permissions,
      ];
      return candidates.find((item) => item && typeof item === 'object' && !Array.isArray(item)) || null;
    };

    const fetchEmployeePermissions = async () => {
      try {
        const token = localStorage.getItem('token') || '';
        if (!token) return;
        const response = await fetch('/api/me', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (response.ok) {
          const data = await response.json();
          const permissions = extractPermissionsFromMe(data);
          if (permissions) {
            setSidebarPermissions(permissions);
            localStorage.setItem('sidebarPermissions', JSON.stringify(permissions));
            window.dispatchEvent(new Event('sidebar-auth-updated'));
            return;
          }
        }

        // Fallback: resolve employee permissions from employees listing API by current user email/id.
        let currentEmail = '';
        let currentId = '';
        try {
          const cachedUser = localStorage.getItem('adminUser') || '';
          if (cachedUser) {
            const parsedUser = JSON.parse(cachedUser);
            currentEmail = String(parsedUser?.email || '').trim().toLowerCase();
            currentId = String(parsedUser?.id || '').trim();
          }
        } catch {
          currentEmail = '';
          currentId = '';
        }

        const params = new URLSearchParams({
          page: '1',
          limit: '100',
          search: currentEmail,
          employee_role_id: '',
          is_active: 'true',
        });
        const employeesResponse = await fetch(`/api/auth/admin/employees?${params.toString()}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (!employeesResponse.ok) return;
        const employeesData = await employeesResponse.json();
        const source =
          employeesData?.data && typeof employeesData.data === 'object'
            ? employeesData.data
            : employeesData;
        const employees = Array.isArray(source?.employees)
          ? source.employees
          : Array.isArray(source?.list)
            ? source.list
            : [];
        const matched = employees.find((item) => {
          const emailMatch =
            currentEmail &&
            String(item?.email || '').trim().toLowerCase() === currentEmail;
          const idMatch =
            currentId &&
            String(item?.id || '').trim() === currentId;
          return emailMatch || idMatch;
        });
        const fallbackPermissions = matched?.employee_permissions;
        if (!fallbackPermissions || typeof fallbackPermissions !== 'object') return;
        setSidebarPermissions(fallbackPermissions);
        localStorage.setItem('sidebarPermissions', JSON.stringify(fallbackPermissions));
        window.dispatchEvent(new Event('sidebar-auth-updated'));
      } catch {
      }
    };

    fetchEmployeePermissions();
  }, [userRole, sidebarPermissions]);

  const EMPLOYEE_MENU_PERMISSION_MAP = useMemo(() => ({
    Orders: ['orders'],
    All: ['orders'],
    Pending: ['orders'],
    Accepted: ['orders'],
    Processing: ['orders'],
    Scheduled: ['orders'],
    'Food On The Way': ['orders'],
    Delivered: ['orders'],
    Cancelled: ['orders'],
    Refunded: ['orders'],
    'Offline Payments': ['orders'],
    'Payments Failed': ['orders'],
    'Dispatch Management': ['orders', 'deliveryman'],
    'Searching Deliverymen': ['orders', 'deliveryman'],
    'Ongoing Orders': ['orders', 'deliveryman'],
    'Order Refund': ['orders'],
    'New Refund Request': ['orders'],
    'Refund Cancelled': ['orders'],
    'Refunded Orders': ['orders'],
    Restaurants: ['restaurants'],
    'Add Restaurants': ['restaurants'],
    'Restaurant List': ['restaurants'],
    'New Joining Request': ['restaurants'],
    Foods: ['restaurants'],
    'Add New Item': ['restaurants'],
    List: ['restaurants'],
    'Items options & add-ons': ['restaurants'],
    Categories: ['restaurants'],
    Category: ['restaurants'],
    'Sub category': ['restaurants'],
    'Cuisine Categories': ['restaurants'],
    'Add Cuisine': ['restaurants'],
    'Add Category': ['restaurants'],
    'Add Subcategory': ['restaurants'],
    Reviews: ['restaurants'],
    Customers: ['customers'],
    Wallet: ['collect_cash', 'restaurant_withdraws', 'disbursement'],
    'Customer Wallet': ['collect_cash', 'restaurant_withdraws', 'disbursement'],
    'Vendor Wallet': ['collect_cash', 'restaurant_withdraws', 'disbursement'],
    'Driver Wallet': ['collect_cash', 'restaurant_withdraws', 'disbursement'],
    'Add Fund': ['collect_cash', 'restaurant_withdraws', 'disbursement'],
    'Zip/Apartments': ['radius_setup'],
    'All Apartments': ['radius_setup'],
    'Add New': ['radius_setup'],
    Deliveryman: ['deliveryman'],
    'New Join Request': ['deliveryman'],
    'Add New Deliveryman': ['deliveryman'],
    'Deliveryman List': ['deliveryman'],
    'Deliveryman Reviews': ['deliveryman'],
    Employees: ['employee'],
    'Employee Role': ['employee'],
    'Add New Employee': ['employee'],
    'Employee List': ['employee'],
    'Riders Setup': ['radius_setup'],
    'Collect Cash': ['collect_cash'],
    'Restaurant Withdraw': ['restaurant_withdraws'],
    'Deliveryman Payments': ['disbursement'],
    'Withdraw Method': ['disbursement'],
    'Tax Setup': ['business_setting'],
    'Payment Method': ['business_setting'],
    'Social Media': ['business_setting'],
    'Deliveryman Settings': ['business_setting'],
    'Transaction Report': ['report'],
    'Food Report': ['report'],
    'Order Report': ['report'],
    'Restaurant Report': ['report'],
    'Tax Report': ['report'],
    'Customer Report': ['report'],
    'Customer Wallet': ['report'],
    'Restaurant VAT Report': ['report'],
    'Restaurant WP Report': ['report'],
    'Daily Report': ['report'],
    'Monthly Report': ['report'],
    'Yearly Report': ['report'],
    'Active Customers': ['report'],
    'Inactive Customers': ['report'],
    Advertisements: ['restaurants'],
    'Create Advertisement': ['restaurants'],
    'List Advertisements': ['restaurants'],
    'List Public Advertisements': ['restaurants'],
    'Update Advertisement Status': ['restaurants'],
    'Admin List Advertisements': ['restaurants'],
  }), []);

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
    'Dispatch Management': '/dashboard/dispatch/searching',
    'Searching Deliverymen': '/dashboard/dispatch/searching',
    'Ongoing Orders': '/dashboard/dispatch/ongoing',
    'Order Refund': '/dashboard/order-refund/new-request',
    'New Refund Request': '/dashboard/order-refund/new-request',
    'Refund Cancelled': '/dashboard/order-refund/cancelled',
    'Refunded Orders': '/dashboard/order-refund/refunded',
    'Customer Wallet': '/dashboard/wallet/customer',
    'Vendor Wallet': '/dashboard/wallet/vendor',
    'Driver Wallet': '/dashboard/wallet/driver',
    'Add Fund': '/dashboard/wallet/add-fund',
    'All Apartments': '/dashboard/apartments',
    'Add New': '/dashboard/apartments/add',
    'Riders Setup': '/dashboard/riders-setup',
    'Collect Cash': '/dashboard/transactions/collect-cash',
    'Restaurant Withdraw': '/dashboard/transactions/restaurant-withdraw',
    'Deliveryman Payments': '/dashboard/transactions/deliveryman-payments',
    'Withdraw Method': '/dashboard/transactions/withdraw-method',
    'Tax Setup': '/dashboard/tax',
    'Business Setup': '/dashboard/settings/business-setup',
    'Payment Method': '/dashboard/settings/payment-method',
    'Social Media': '/dashboard/settings/social-media',
    'Deliveryman Settings': '/dashboard/settings/deliveryman',
    'Transaction Report': '/dashboard/reports/transaction',
    'Food Report': '/dashboard/reports/food',
    'Restaurant Report': '/dashboard/reports/restaurant',
    'Tax Report': '/dashboard/reports/tax',
    'Customer Report': '/dashboard/reports/customer',
    'Customer Wallet': '/dashboard/reports/customer',
    'Regular Order Report': '/dashboard/reports/order/regular',
    'Coupon Order Report': '/dashboard/reports/order/coupon',
    'Restaurant VAT Report': '/dashboard/reports/restaurant-vat',
    'Restaurant WP Report': '/dashboard/reports/restaurant-wp',
    'Add New Item': '/dashboard/foods/add',
    'List': '/dashboard/foods/list',
    'Items options & add-ons': '/dashboard/foods/menu-item-options',
    'Category': '/dashboard/foods/categories',
    'Sub category': '/dashboard/foods/sub-categories',
    'Cuisine Categories': '/dashboard/foods/cuisine-categories',
    'Add Cuisine': '/dashboard/foods/cuisine-categories/add',
    'Cuisine List': '/dashboard/foods/cuisine-categories',
    'Add Category': '/dashboard/foods/categories/add',
    'Add Subcategory': '/dashboard/foods/sub-categories/add',
    'Reviews': '/dashboard/foods/reviews',
    'Employee Role': '/dashboard/employees/role',
    'Add New Employee': '/dashboard/employees/add',
    'Employee List': '/dashboard/employees/list',
    'New Join Request': '/dashboard/deliveryman/new-join-request',
    'Add New Deliveryman': '/dashboard/deliveryman/add',
    'Deliveryman List': '/dashboard/deliveryman/list',
    'Deliveryman Reviews': '/dashboard/deliveryman/reviews',
    'Create Advertisement': '/dashboard/banners/add',
    'List Advertisements': '/dashboard/banners/list',
    'List Public Advertisements': '/dashboard/banners/public',
    'Update Advertisement Status': '/dashboard/banners/status',
    'Admin List Advertisements': '/dashboard/banners/admin-list',
  }), []);

  useEffect(() => {
    if (!pathname) return;

    if (pathname === '/dashboard') {
      setActiveItem('Dashboard');
      return;
    }

    if (pathname === '/dashboard/restaurants/add') {
      setActiveItem('Add Restaurants');
      return;
    }

    if (pathname === '/dashboard/restaurants/list') {
      setActiveItem('Restaurant List');
      return;
    }

    if (pathname === '/dashboard/restaurants/requests') {
      setActiveItem('New Joining Request');
      return;
    }

    if (pathname === '/dashboard/dispatch/searching') {
      setActiveItem('Searching Deliverymen');
      return;
    }

    if (pathname === '/dashboard/dispatch/ongoing') {
      setActiveItem('Ongoing Orders');
      return;
    }

    if (pathname === '/dashboard/order-refund/new-request') {
      setActiveItem('New Refund Request');
      return;
    }

    if (pathname === '/dashboard/order-refund/cancelled') {
      setActiveItem('Refund Cancelled');
      return;
    }

    if (pathname === '/dashboard/order-refund/refunded') {
      setActiveItem('Refunded Orders');
      return;
    }

    if (pathname === '/dashboard/foods/add') {
      setActiveItem('Add New Item');
      return;
    }

    if (pathname === '/dashboard/foods/list') {
      setActiveItem('List');
      return;
    }

    if (pathname === '/dashboard/foods/menu-item-options') {
      setActiveItem('Items options & add-ons');
      return;
    }

    if (pathname === '/dashboard/foods/categories') {
      setActiveItem('Category');
      return;
    }

    if (pathname === '/dashboard/foods/categories/add') {
      setActiveItem('Add Category');
      return;
    }

    if (pathname === '/dashboard/foods/sub-categories') {
      setActiveItem('Sub category');
      return;
    }

    if (pathname === '/dashboard/foods/sub-categories/add') {
      setActiveItem('Add Subcategory');
      return;
    }

    if (pathname === '/dashboard/foods/cuisine-categories') {
      setActiveItem('Cuisine List');
      return;
    }

    if (pathname === '/dashboard/foods/cuisine-categories/add') {
      setActiveItem('Add Cuisine');
      return;
    }

    if (pathname === '/dashboard/foods/reviews') {
      setActiveItem('Reviews');
      return;
    }

    if (pathname === '/dashboard/employees/role') {
      setActiveItem('Employee Role');
      return;
    }

    if (pathname === '/dashboard/employees/add') {
      setActiveItem('Add New Employee');
      return;
    }

    if (pathname === '/dashboard/employees/list') {
      setActiveItem('Employee List');
      return;
    }

    if (pathname === '/dashboard/deliveryman/new-join-request') {
      setActiveItem('New Join Request');
      return;
    }

    if (pathname === '/dashboard/deliveryman/add') {
      setActiveItem('Add New Deliveryman');
      return;
    }

    if (pathname === '/dashboard/deliveryman/list') {
      setActiveItem('Deliveryman List');
      return;
    }

    if (pathname === '/dashboard/deliveryman/reviews') {
      setActiveItem('Deliveryman Reviews');
      return;
    }

    if (pathname === '/dashboard/banners/add') {
      setActiveItem('Create Advertisement');
      return;
    }

    if (pathname === '/dashboard/banners/list') {
      setActiveItem('List Advertisements');
      return;
    }

    if (pathname === '/dashboard/banners/public') {
      setActiveItem('List Public Advertisements');
      return;
    }

    if (pathname === '/dashboard/banners/status') {
      setActiveItem('Update Advertisement Status');
      return;
    }

    if (pathname === '/dashboard/banners/admin-list') {
      setActiveItem('Admin List Advertisements');
      return;
    }

    if (pathname === '/dashboard/settings/business-setup') {
      setActiveItem('Business Setup');
      return;
    }

    if (pathname === '/dashboard/wallet/add-fund') {
      setActiveItem('Add Fund');
      return;
    }

    if (pathname === '/dashboard/settings/payment-method') {
      setActiveItem('Payment Method');
      return;
    }

    if (pathname === '/dashboard/settings/social-media') {
      setActiveItem('Social Media');
      return;
    }

    if (pathname === '/dashboard/settings/deliveryman') {
      setActiveItem('Deliveryman Settings');
      return;
    }

    if (pathname === '/dashboard/reports/transaction') {
      setActiveItem('Transaction Report');
      return;
    }

    if (pathname === '/dashboard/reports/food') {
      setActiveItem('Food Report');
      return;
    }

    if (pathname === '/dashboard/reports/order/regular') {
      setActiveItem('Regular Order Report');
      return;
    }

    if (pathname === '/dashboard/reports/order/coupon') {
      setActiveItem('Coupon Order Report');
      return;
    }

    if (pathname === '/dashboard/reports/restaurant') {
      setActiveItem('Restaurant Report');
      return;
    }

    if (pathname === '/dashboard/reports/customer') {
      setActiveItem('Customer Wallet');
      return;
    }

    if (pathname === '/dashboard/reports/tax') {
      setActiveItem('Tax Report');
      return;
    }

    if (pathname === '/dashboard/reports/restaurant-vat') {
      setActiveItem('Restaurant VAT Report');
      return;
    }

    if (pathname === '/dashboard/tax') {
      setActiveItem('Tax Setup');
      return;
    }

    const match = pathname.match(/^\/dashboard\/orders\/([^/]+)$/);
    if (match) {
      const slug = match[1];
      const label = ordersFilterLabelBySlug[slug] ?? 'All';
      setActiveItem(label);
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
    'Searching Deliverymen': 'searchingDeliverymen',
    'Ongoing Orders': 'ongoingOrders',
    'New Refund Request': 'newRefundRequest',
    'Refund Cancelled': 'refundCancelled',
    'Refunded Orders': 'refundedOrders',
    'Customer Wallet': 'customerWallet', 'Vendor Wallet': 'vendorWallet', 'Driver Wallet': 'driverWallet', 'Add Fund': 'addFund',
    'All Apartments': 'allEmployees', 'Add New': 'addNewRestaurant',
    'Add New Item': 'addNewItem',
    'Items options & add-ons': 'itemsOptionsAndAddons',
    'Category': 'category',
    'Sub category': 'subCategory',
    'Cuisine Categories': 'cuisineCategories',
    'Add Cuisine': 'addCuisine',
    'Cuisine List': 'cuisineCategories',
    'Add Category': 'addCategory',
    'Add Subcategory': 'addSubcategory',
    'Employee Role': 'employeeRole',
    'Add New Employee': 'addNewEmployee',
    'Employee List': 'employeeList',
    'New Join Request': 'newJoinRequest',
    'Add New Deliveryman': 'addNewDeliveryman',
    'Deliveryman List': 'deliverymanList',
    'Deliveryman Reviews': 'deliverymanReviews',
    'Business Setup': 'businessSetup',
    'All Employees': 'allEmployees', 'Roles': 'roles', 'Permissions': 'permissions',
    'Daily Report': 'dailyReport', 'Monthly Report': 'monthlyReport', 'Yearly Report': 'yearlyReport',
    'Regular Order Report': 'regularOrderReport', 'Coupon Order Report': 'couponOrderReport',
    'Active Customers': 'activeCustomers', 'Inactive Customers': 'inactiveCustomers', 'Customer Wallet': 'customerWalletReport',
    'Create Advertisement': 'createAdvertisement',
    'List Advertisements': 'listAdvertisements',
    'List Public Advertisements': 'listPublicAdvertisements',
    'Update Advertisement Status': 'updateAdvertisementStatus',
    'Admin List Advertisements': 'adminListAdvertisements',
  };

  const menuItems = [
    {
      icon: SIDEBAR_ICONS.dashboard,
      label: 'Dashboard', tKey: 'dashboard',
      hasSubmenu: false
    },
    {
      label: 'ORDER MANAGEMENT', tKey: 'orderManagement',
      isHeader: true,
      items: [
        { icon: SIDEBAR_ICONS.orders, label: 'Orders', tKey: 'orders', key: 'orderManagement', submenu: ['All', 'Pending', 'Accepted', 'Processing', 'Scheduled', 'Food On The Way', 'Delivered', 'Cancelled', 'Refunded', 'Offline Payments', 'Payments Failed'] },
      ]
    },
    {
      label: 'VENDOR MANAGEMENT', tKey: 'vendorManagement',
      isHeader: true,
      items: [
        { icon: SIDEBAR_ICONS.restaurants, label: 'Restaurants', tKey: 'restaurants', key: 'vendorManagement', submenu: ['Add Restaurants', 'Restaurant List', 'New Joining Request'] },
      ]
    },
    {
      label: 'FOOD MANAGEMENT', tKey: 'foodManagement',
      isHeader: true,
      items: [
        {
          icon: SIDEBAR_ICONS.foods,
          label: 'Foods',
          tKey: 'foods',
          key: 'foodManagement',
          submenu: ['Add New Item', 'List', 'Items options & add-ons'],
        },
        { icon: SIDEBAR_ICONS.categories, label: 'Categories', tKey: 'categories', key: 'categoriesManagement', submenu: ['Add Category', 'Category', 'Add Subcategory', 'Sub category'] },
        { icon: SIDEBAR_ICONS.categories, label: 'Cuisine Categories', tKey: 'cuisineCategories', key: 'cuisineCategories', submenu: ['Add Cuisine', 'Cuisine List'] },
        { icon: SIDEBAR_ICONS.reviews, label: 'Reviews', tKey: 'reviews', hasSubmenu: false },
      ]
    },
    {
      label: 'CUSTOMER MANAGEMENT', tKey: 'customerManagement',
      isHeader: true,
      items: [
        { icon: SIDEBAR_ICONS.customers, label: 'Customers', tKey: 'customers', hasSubmenu: false }
      ]
    },
    {
      label: 'WALLET MANAGEMENT', tKey: 'walletManagement',
      isHeader: true,
      items: [
        { icon: SIDEBAR_ICONS.wallet, label: 'Wallet', tKey: 'wallet', key: 'walletManagement', submenu: ['Add Fund'] }
      ]
    },
    {
      label: 'DELIVERY MANAGEMENT', tKey: 'deliveryManagement',
      isHeader: true,
      items: [
        { icon: SIDEBAR_ICONS.deliveryman, label: 'Deliveryman', tKey: 'deliveryman', key: 'deliveryManagement', submenu: ['New Join Request', 'Add New Deliveryman', 'Deliveryman List', 'Deliveryman Reviews'] },
      ]
    },
    {
      label: 'EMPLOYEE MANAGEMENT', tKey: 'employeeManagement',
      isHeader: true,
      items: [
        { icon: SIDEBAR_ICONS.employees, label: 'Employees', tKey: 'employees', key: 'employeeManagement', submenu: ['Employee Role', 'Add New Employee', 'Employee List'] },
      ]
    },
    {
      label: 'RADIUS MANAGEMENT', tKey: 'radiusManagement',
      isHeader: true,
      items: [
        { icon: SIDEBAR_ICONS.riders, label: 'Riders Setup', tKey: 'ridersSetup', hasSubmenu: false }
      ]
    },
    {
      label: 'TRANSACTION MANAGEMENT', tKey: 'transactionManagement',
      isHeader: true,
      items: [
        { icon: SIDEBAR_ICONS.collectCash, label: 'Collect Cash', tKey: 'collectCash', hasSubmenu: false },
        { icon: SIDEBAR_ICONS.restaurantWithdraw, label: 'Restaurant Withdraw', tKey: 'restaurantWithdraw', hasSubmenu: false },
        { icon: SIDEBAR_ICONS.deliverymanPayments, label: 'Deliveryman Payments', tKey: 'deliverymanPayments', hasSubmenu: false },
        { icon: SIDEBAR_ICONS.withdrawMethod, label: 'Withdraw Method', tKey: 'withdrawMethod', hasSubmenu: false }
      ]
    },
    {
      label: 'TAX MANAGEMENT', tKey: 'taxManagement',
      isHeader: true,
      items: [
        { icon: SIDEBAR_ICONS.tax, label: 'Tax Setup', tKey: 'taxSetup', hasSubmenu: false }
      ]
    },
    {
      label: 'BUSINESS SETTINGS', tKey: 'businessSettings',
      isHeader: true,
      items: [
        { icon: SIDEBAR_ICONS.businessSetup, label: 'Business Setup', tKey: 'businessSetup', hasSubmenu: false },
        { icon: SIDEBAR_ICONS.paymentMethod, label: 'Payment Method', tKey: 'paymentMethod', hasSubmenu: false },
        { icon: SIDEBAR_ICONS.socialMedia, label: 'Social Media', tKey: 'socialMedia', hasSubmenu: false },
        { icon: SIDEBAR_ICONS.deliverymanSettings, label: 'Deliveryman Settings', tKey: 'deliverymanSettings', hasSubmenu: false }
      ]
    },
    {
      label: 'REPORT MANAGEMENT', tKey: 'reportManagement',
      isHeader: true,
      items: [
        { icon: SIDEBAR_ICONS.transactionReport, label: 'Transaction Report', tKey: 'transactionReport', hasSubmenu: false },
        { icon: SIDEBAR_ICONS.foodReport, label: 'Food Report', tKey: 'foodReport', hasSubmenu: false },
        { icon: SIDEBAR_ICONS.orderReport, label: 'Order Report', tKey: 'orderReport', key: 'reportLog', submenu: ['Regular Order Report', 'Coupon Order Report'] },
        { icon: SIDEBAR_ICONS.restaurantReport, label: 'Restaurant Report', tKey: 'restaurantReport', hasSubmenu: false },
        { icon: SIDEBAR_ICONS.taxReport, label: 'Tax Report', tKey: 'taxReport', hasSubmenu: false },
        { icon: SIDEBAR_ICONS.customerReport, label: 'Customer Report', tKey: 'customerReport', key: 'customerReport', submenu: ['Customer Wallet'] },
        { icon: SIDEBAR_ICONS.restaurantWpReport, label: 'Restaurant VAT Report', tKey: 'restaurantVATReport', hasSubmenu: false }
      ]
    },
    {
      label: 'MARKETING', tKey: 'marketing',
      isHeader: true,
      items: [
        {
          icon: SIDEBAR_ICONS.banners,
          label: 'Advertisements',
          tKey: 'advertisements',
          key: 'bannersManagement',
          submenu: ['Create Advertisement', 'List Advertisements'],
        },
      ],
    },
  ];

  const roleFilteredMenuItems = useMemo(() => {
    const isAdmin =
      userRole === 'admin' ||
      userRole === 'super_admin' ||
      userRole === 'superadmin';
    const isRestaurantRole = [
      'restaurant',
      'resturant',
      'restaurant_admin',
      'vendor',
    ].includes(userRole);

    if (isRestaurantRole) {
      const restaurantVisibleSections = new Set([
        'VENDOR MANAGEMENT',
        'FOOD MANAGEMENT',
        'DELIVERY MANAGEMENT',
        'MARKETING',
      ]);

      return menuItems
        .map((section) => {
          // Restaurant role should not see admin-only menus.
          if (section?.isHeader && section.label === 'FOOD MANAGEMENT') {
            const filteredItems = (section.items || []).filter((item) => item?.label !== 'Cuisine Categories');
            return { ...section, items: filteredItems };
          }
          return section;
        })
        .filter((section) => {
        if (!section?.isHeader) {
          return section?.label === 'Dashboard';
        }
        return (
          restaurantVisibleSections.has(section.label) &&
          Array.isArray(section.items) &&
          section.items.length > 0
        );
      });
    }

    if (!isAdmin) return menuItems;

    return menuItems
      .map((section) => {
        if (section.isHeader && section.label === 'FOOD MANAGEMENT') {
          return null;
        }
        if (section.isHeader && section.label === 'VENDOR MANAGEMENT') {
          const filteredItems = [...(section.items || [])];

          const hasCuisine = filteredItems.some((item) => item?.label === 'Cuisine Categories');
          if (!hasCuisine) {
            filteredItems.push({
              icon: SIDEBAR_ICONS.categories,
              label: 'Cuisine Categories',
              tKey: 'cuisineCategories',
              key: 'cuisineCategories',
              submenu: ['Add Cuisine', 'Cuisine List'],
            });
          }

          return { ...section, items: filteredItems };
        }
        if (section.isHeader && section.label === 'MARKETING') {
          const filteredItems = (section.items || []).map((item) => {
            if (item.label === 'Advertisements') {
              return { ...item, submenu: ['Admin List Advertisements', 'List Public Advertisements'] };
            }
            return item;
          });
          return { ...section, items: filteredItems };
        }
        return section;
      })
      .filter((section) => section && (!section.isHeader || (section.items && section.items.length > 0)));
  }, [menuItems, userRole]);

  const permissionFilteredMenuItems = useMemo(() => {
    const isEmployee = userRole === 'employee';
    if (!isEmployee) return roleFilteredMenuItems;
    const hasPermissions =
      sidebarPermissions &&
      typeof sidebarPermissions === 'object' &&
      Object.keys(sidebarPermissions).length > 0;
    if (!hasPermissions) return roleFilteredMenuItems;

    const canManagePermission = (permissionKey) => {
      if (!permissionKey) return false;
      const permissionValue = sidebarPermissions?.[permissionKey];
      return (
        permissionValue?.can_manage === true ||
        permissionValue?.can_manage === 1 ||
        permissionValue === true
      );
    };

    const isLabelVisible = (label) => {
      if (label === 'Dashboard') return true;
      const permissionKeys = EMPLOYEE_MENU_PERMISSION_MAP[label];
      if (!Array.isArray(permissionKeys) || permissionKeys.length === 0) {
        return false;
      }
      return permissionKeys.some(canManagePermission);
    };

    return roleFilteredMenuItems
      .map((section) => {
        if (!section?.isHeader) {
          return isLabelVisible(section?.label) ? section : null;
        }

        const filteredItems = (section.items || [])
          .map((item) => {
            if (Array.isArray(item.submenu) && item.submenu.length > 0) {
              const filteredSubmenu = item.submenu.filter((submenuLabel) => isLabelVisible(submenuLabel));
              const parentAllowed = isLabelVisible(item.label);
              if (!parentAllowed && filteredSubmenu.length === 0) return null;
              return { ...item, submenu: filteredSubmenu };
            }
            return isLabelVisible(item.label) ? item : null;
          })
          .filter(Boolean);

        if (filteredItems.length === 0) return null;
        return { ...section, items: filteredItems };
      })
      .filter(Boolean);
  }, [roleFilteredMenuItems, userRole, sidebarPermissions, EMPLOYEE_MENU_PERMISSION_MAP]);

  // Filter menu items based on search
  const filteredMenuItems = useMemo(() => {
    if (!searchQuery.trim()) return permissionFilteredMenuItems;
    const q = searchQuery.toLowerCase();
    return permissionFilteredMenuItems.map(section => {
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
  }, [searchQuery, t, permissionFilteredMenuItems]);

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
          {typeof Icon === 'string' ? (
            <img src={Icon} alt={item.label} className="h-4 w-4 object-contain" />
          ) : Icon ? (
            <Icon size={18} />
          ) : null}
          <span className="min-w-0 flex-1 truncate font-semibold text-[#1E1E24]">
            {t[item.tKey] || item.label}
          </span>
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
                <span className="min-w-0 flex-1 truncate">
                  {t[submenuTKeys[subMenuItem]] || subMenuItem}
                </span>
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
        {typeof Icon === 'string' ? (
          <img src={Icon} alt={item.label} className="h-4 w-4 object-contain" />
        ) : Icon ? (
          <Icon size={18} />
        ) : null}
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

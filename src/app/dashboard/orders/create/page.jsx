'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Check,
  ChevronDown,
  ChevronRight,
  ClipboardList,
  Loader2,
  MapPin,
  Search,
  ShoppingCart,
  Store,
  User,
  X,
} from 'lucide-react';
import Topbar from '@/app/components/Topbar';
import { FoodWideCardSkeletonGrid } from '@/app/components/LoadingSpinner';
import { API_BASE_URL } from '@/app/config';
import { formatCurrencyFixed2, formatOptionDelta } from '@/app/lib/currency';

const STEP_TITLES = ['Customer', 'Address', 'Restaurant & items', 'Cart & delivery', 'Review'];

const STEP_ICONS = [User, MapPin, Store, ShoppingCart, ClipboardList];

const normalizeList = (payload, candidatePaths = []) => {
  const root = payload?.data && typeof payload.data === 'object' ? payload.data : payload;
  for (const path of candidatePaths) {
    const parts = String(path).split('.');
    let cur = root;
    for (const p of parts) cur = cur?.[p];
    if (Array.isArray(cur)) return cur;
  }
  if (Array.isArray(root)) return root;
  if (Array.isArray(root?.list)) return root.list;
  return [];
};

const toId = (value) => String(value?.id || value?.user_id || value?.uuid || value || '').trim();

const toAbsoluteAssetUrl = (value) => {
  if (!value || typeof value !== 'string') return '';
  const trimmed = value.trim();
  if (!trimmed) return '';
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed;
  if (trimmed.startsWith('//')) return `https:${trimmed}`;
  if (trimmed.startsWith('/')) return `${API_BASE_URL}${trimmed}`;
  return `${API_BASE_URL}/${trimmed}`;
};

const pickCustomerImage = (c) => {
  if (!c || typeof c !== 'object') return '';
  const inner = c.customer || c.user;
  const candidates = [
    c.profile_picture_url,
    c.profile_picture,
    c.profilePicture,
    c.avatar_url,
    c.image_url,
    c.image_full_url,
    c.image,
    c.avatar,
    c.photo,
    c.profile_image,
    c.profile_photo,
    c.profile_image_url,
    inner?.profile_picture_url,
    inner?.profile_picture,
    inner?.profilePicture,
    inner?.avatar_url,
    inner?.image_url,
    inner?.image_full_url,
    inner?.avatar,
    inner?.image,
    inner?.photo,
    inner?.profile_image,
    inner?.profile_photo,
    inner?.profile_image_url,
  ].filter(Boolean);
  const first = candidates[0];
  return first ? toAbsoluteAssetUrl(String(first)) : '';
};

/** Order/customers API often returns `{ customer, user, ... }` wrappers — use inner profile for display & id. */
const rowCustomer = (row) => {
  if (!row || typeof row !== 'object') return row;
  return row.customer || row.user || row;
};

const pickRestaurantImage = (r) => {
  const candidates = [
    r?.logo_full_url,
    r?.logo_url,
    r?.logoUrl,
    r?.image_full_url,
    r?.cover_image_url,
    r?.coverImageUrl,
    r?.logo,
    r?.image,
  ].filter(Boolean);
  const first = candidates[0];
  return first ? toAbsoluteAssetUrl(String(first)) : '';
};

const pickMenuItemImage = (raw) => {
  const v =
    raw?.image_full_url ||
    raw?.image_url ||
    raw?.menu_item_image_url ||
    raw?.item_image_url ||
    raw?.thumbnail_url ||
    raw?.image ||
    raw?.thumbnail;
  return v ? toAbsoluteAssetUrl(String(v)) : '';
};

const customerDisplayName = (c) => {
  const name =
    c?.name ||
    c?.full_name ||
    `${c?.first_name || c?.f_name || ''} ${c?.last_name || c?.l_name || ''}`.trim();
  return name || 'Customer';
};

const customerSecondaryLine = (c) => {
  const phone = c?.phone ? String(c.phone) : '';
  const email = c?.email ? String(c.email) : '';
  return [phone, email].filter(Boolean).join(' · ');
};

const addressDisplayPrimary = (a) => {
  const complete = a?.complete_address || '';
  const line1 = a?.line1 || a?.address_line1 || '';
  return (complete || line1 || 'Address').trim();
};

const addressDisplaySecondary = (a) => {
  const category = a?.category || a?.type || '';
  const area = a?.area || '';
  const city = a?.city || '';
  return [category, area, city].filter(Boolean).join(' · ');
};

const restaurantDisplayName = (r) => r?.name || r?.restaurant_name || 'Restaurant';

/**
 * Restaurant row id for APIs (create order, menu-items, etc.).
 * Must match dashboard restaurant list `editId` — do not use `user_id` here (vendor user ≠ restaurant).
 */
const toRestaurantRecordId = (r) => {
  if (r == null || typeof r !== 'object') return '';
  const raw =
    r.id ??
    r.restaurant_id ??
    r.restaurantId ??
    r.restaurant?.id ??
    r.restaurant?.restaurant_id ??
    '';
  return String(raw ?? '').trim();
};

const normalizeOptionGroups = (raw) => {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((g) => {
      const opts = (Array.isArray(g?.options) ? g.options : [])
        .map((o) => ({
          id: String(o?.id || '').trim(),
          name: o?.name || 'Option',
          additionalPrice: Number(o?.additional_price ?? o?.price ?? 0),
          isAvailable: o?.is_available !== false,
          displayOrder: Number(o?.display_order ?? 0),
        }))
        .filter((o) => o.id && o.isAvailable)
        .sort((a, b) => a.displayOrder - b.displayOrder);
      const minSel = Number(g?.min_selections ?? 0);
      const maxRaw = g?.max_selections;
      let maxSel =
        maxRaw == null || maxRaw === ''
          ? opts.length
          : Number(maxRaw);
      if (!Number.isFinite(maxSel) || maxSel < 1) maxSel = Math.max(opts.length, 1);
      return {
        id: String(g?.id || '').trim(),
        name: g?.name || 'Options',
        isRequired: Boolean(g?.is_required),
        minSelections: minSel,
        maxSelections: maxSel,
        displayOrder: Number(g?.display_order ?? 0),
        options: opts,
      };
    })
    .filter((g) => g.id && g.options.length > 0)
    .sort((a, b) => a.displayOrder - b.displayOrder);
};

const optionGroupsDepth = (mi) =>
  Array.isArray(mi?.option_groups) ? mi.option_groups.length : 0;

/** Collect menu rows from discover/restaurant details payloads (flat lists and category-nested items). */
const collectMenuRowsFromDetailsPayload = (root) => {
  if (!root || typeof root !== 'object') return [];
  const out = [];
  const add = (arr) => {
    if (Array.isArray(arr)) out.push(...arr);
  };

  const menu = root.menu;
  if (menu && typeof menu === 'object') {
    add(menu.uncategorized_items);
    if (Array.isArray(menu.categories)) {
      for (const cat of menu.categories) {
        if (!cat || typeof cat !== 'object') continue;
        add(cat.items);
        add(cat.menu_items);
      }
    }
  }

  add(root.menu_items);
  add(root.menuItems);
  add(root.items);
  add(root.list);
  add(root.restaurant?.menu_items);
  add(root.restaurant?.menuItems);
  add(root.data?.menu_items);
  add(root.data?.menuItems);
  add(root.data?.list);

  const categoryBuckets = [
    root.categories,
    root.menu_categories,
    root.menuCategories,
    root.restaurant?.categories,
    root.restaurant?.menu_categories,
    root.restaurant?.menuCategories,
  ];
  for (const buckets of categoryBuckets) {
    if (!Array.isArray(buckets)) continue;
    for (const cat of buckets) {
      if (!cat || typeof cat !== 'object') continue;
      add(cat.menu_items);
      add(cat.menuItems);
      add(cat.items);
      add(cat.foods);
    }
  }

  add(root.popular_items);
  return out;
};

const normalizeMenuItems = (payload) => {
  const root = payload?.data && typeof payload.data === 'object' ? payload.data : payload;
  const rawList = collectMenuRowsFromDetailsPayload(root);
  const byId = new Map();
  for (const mi of rawList) {
    const id = toId(mi);
    if (!id) continue;
    const prev = byId.get(id);
    if (!prev || optionGroupsDepth(mi) > optionGroupsDepth(prev)) {
      byId.set(id, mi);
    }
  }
  const list = [];
  for (const mi of byId.values()) {
    const id = toId(mi);
    list.push({
      id,
      name: mi?.name || mi?.title || mi?.item_name || 'Item',
      description: String(mi?.description || mi?.short_description || '').trim(),
      price: Number(mi?.price ?? mi?.unit_price ?? mi?.amount ?? 0),
      imageUrl: pickMenuItemImage(mi),
      categoryId: String(mi?.category_id ?? mi?.categoryId ?? '').trim(),
      optionGroups: normalizeOptionGroups(mi?.option_groups),
      raw: mi,
    });
  }
  return list;
};

/** Category tabs from discover `data.menu.categories` (and uncategorized), aligned with normalized menu item ids. */
const extractMenuCategoryTabsFromPayload = (payload, normalizedMenuItems) => {
  const root = payload?.data && typeof payload.data === 'object' ? payload.data : payload;
  const menu = root?.menu;
  const allIdsOrdered = normalizedMenuItems.map((m) => m.id);
  const allSet = new Set(allIdsOrdered);

  const fallbackAll = () => [{ id: '__all__', name: 'All items', displayOrder: 0, itemIds: [...allIdsOrdered] }];

  if (!menu || typeof menu !== 'object' || !Array.isArray(menu.categories) || menu.categories.length === 0) {
    return fallbackAll();
  }

  const tabs = [];
  for (const cat of menu.categories) {
    if (!cat || typeof cat !== 'object') continue;
    const items = cat.items || cat.menu_items || cat.menuItems || [];
    const itemIds = [];
    for (const it of Array.isArray(items) ? items : []) {
      const id = toId(it);
      if (id && allSet.has(id)) itemIds.push(id);
    }
    const cid = String(cat.id ?? '').trim() || `cat-${tabs.length}`;
    tabs.push({
      id: cid,
      name: String(cat.name || 'Category').trim() || 'Category',
      displayOrder: Number(cat.display_order ?? cat.displayOrder ?? 0),
      itemIds,
    });
  }

  const unc = menu.uncategorized_items || menu.uncategorizedItems || [];
  const uncIds = [];
  for (const it of Array.isArray(unc) ? unc : []) {
    const id = toId(it);
    if (id && allSet.has(id)) uncIds.push(id);
  }
  if (uncIds.length) {
    tabs.push({ id: '__uncategorized__', name: 'Other', displayOrder: 9998, itemIds: uncIds });
  }

  tabs.sort((a, b) => a.displayOrder - b.displayOrder);

  const inTabs = new Set(tabs.flatMap((t) => t.itemIds));
  const orphanIds = allIdsOrdered.filter((id) => !inTabs.has(id));
  if (orphanIds.length) {
    tabs.push({ id: '__more__', name: 'More', displayOrder: 9999, itemIds: orphanIds });
  }

  const nonEmpty = tabs.filter((t) => t.itemIds.length > 0);
  return nonEmpty.length ? nonEmpty : fallbackAll();
};

const sortedIdsEqual = (a, b) => {
  const sa = [...a].filter(Boolean).sort();
  const sb = [...b].filter(Boolean).sort();
  if (sa.length !== sb.length) return false;
  return sa.every((v, i) => v === sb[i]);
};

const lineUnitPrice = (menuItem, selectedOptionIds) => {
  if (!menuItem) return 0;
  const idSet = new Set(selectedOptionIds);
  let add = 0;
  for (const g of menuItem.optionGroups || []) {
    for (const o of g.options || []) {
      if (idSet.has(o.id)) add += Number(o.additionalPrice || 0);
    }
  }
  return Number(menuItem.price || 0) + add;
};

const selectionSummary = (menuItem, selectedOptionIds) => {
  if (!menuItem?.optionGroups?.length || !selectedOptionIds?.length) return '';
  const idSet = new Set(selectedOptionIds);
  const parts = [];
  for (const g of menuItem.optionGroups) {
    const picked = g.options.filter((o) => idSet.has(o.id)).map((o) => o.name);
    if (picked.length) parts.push(picked.join(', '));
  }
  return parts.join(' · ');
};

export default function AdminCreateOrderPage() {
  const router = useRouter();

  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [customers, setCustomers] = useState([]);
  const [customerId, setCustomerId] = useState('');
  const [customerSearch, setCustomerSearch] = useState('');

  const [addresses, setAddresses] = useState([]);
  const [addressId, setAddressId] = useState('');

  const [restaurants, setRestaurants] = useState([]);
  const [restaurantId, setRestaurantId] = useState('');
  const [menuItems, setMenuItems] = useState([]);
  const [menuCategories, setMenuCategories] = useState([]);
  const [activeCategoryId, setActiveCategoryId] = useState('');
  const [restaurantPickerOpen, setRestaurantPickerOpen] = useState(false);
  const [restaurantSearchQuery, setRestaurantSearchQuery] = useState('');
  const restaurantPickerRef = useRef(null);
  const [menuSearch, setMenuSearch] = useState('');
  /** Cart lines: supports multiple variants (options) per menu item. */
  const [cartLines, setCartLines] = useState([]);
  /** Item opened in add-to-cart modal (with or without option groups). */
  const [optionModalItem, setOptionModalItem] = useState(null);

  const [orderType, setOrderType] = useState('delivery');
  const [paymentType, setPaymentType] = useState('cash');
  const [deliveryFee, setDeliveryFee] = useState(100);
  const [taxAmount, setTaxAmount] = useState(0);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [notes, setNotes] = useState('Order by admin');

  const selectedItems = useMemo(() => {
    return cartLines
      .filter((l) => l.quantity > 0)
      .map((l) => ({
        menu_item_id: l.menuItemId,
        quantity: l.quantity,
        selected_option_ids: [...l.selectedOptionIds],
        special_instructions: l.note ? l.note : undefined,
      }));
  }, [cartLines]);

  const filteredCustomers = useMemo(() => {
    const q = customerSearch.trim().toLowerCase();
    if (!q) return customers;
    return customers.filter((raw) => {
      const c = rowCustomer(raw);
      const name = customerDisplayName(c).toLowerCase();
      const secondary = customerSecondaryLine(c).toLowerCase();
      const id = String(toId(raw) || toId(c) || '').toLowerCase();
      return name.includes(q) || secondary.includes(q) || id.includes(q);
    });
  }, [customers, customerSearch]);

  const customersListForStep0 = useMemo(() => {
    const rid = String(customerId || '').trim();
    if (!rid) return filteredCustomers;
    const selectedRow = customers.find((row) => {
      const c = rowCustomer(row);
      return toId(row) === rid || toId(c) === rid;
    });
    if (!selectedRow) return filteredCustomers;
    const inFiltered = filteredCustomers.some((row) => {
      const c = rowCustomer(row);
      return toId(row) === rid || toId(c) === rid;
    });
    if (inFiltered) return filteredCustomers;
    return [selectedRow, ...filteredCustomers];
  }, [filteredCustomers, customers, customerId]);

  const itemsSubtotal = useMemo(() => {
    const itemById = new Map(menuItems.map((m) => [m.id, m]));
    return cartLines.reduce((acc, line) => {
      const mi = itemById.get(line.menuItemId);
      if (!mi) return acc;
      const unit = lineUnitPrice(mi, line.selectedOptionIds);
      return acc + unit * line.quantity;
    }, 0);
  }, [cartLines, menuItems]);

  const orderGrandTotal = useMemo(() => {
    const d = Number(deliveryFee) || 0;
    const t = Number(taxAmount) || 0;
    const disc = Number(discountAmount) || 0;
    return itemsSubtotal + d + t - disc;
  }, [itemsSubtotal, deliveryFee, taxAmount, discountAmount]);

  const totalQtyForMenuItem = useMemo(() => {
    const map = new Map();
    for (const l of cartLines) {
      map.set(l.menuItemId, (map.get(l.menuItemId) || 0) + l.quantity);
    }
    return map;
  }, [cartLines]);

  const addOrMergeCartLine = (menuItemId, selectedOptionIds, note, qtyDelta) => {
    const sorted = [...new Set(selectedOptionIds)].filter(Boolean).sort();
    const nNote = String(note || '').trim();
    setCartLines((prev) => {
      const idx = prev.findIndex(
        (l) =>
          l.menuItemId === menuItemId &&
          sortedIdsEqual(l.selectedOptionIds, sorted) &&
          String(l.note || '').trim() === nNote
      );
      if (idx >= 0) {
        const next = [...prev];
        const q = next[idx].quantity + qtyDelta;
        if (q <= 0) next.splice(idx, 1);
        else next[idx] = { ...next[idx], quantity: q };
        return next;
      }
      if (qtyDelta <= 0) return prev;
      return [
        ...prev,
        {
          lineId:
            typeof crypto !== 'undefined' && crypto.randomUUID
              ? crypto.randomUUID()
              : `ln-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
          menuItemId,
          selectedOptionIds: sorted,
          note: nNote,
          quantity: qtyDelta,
        },
      ];
    });
  };

  useEffect(() => {
    const onDoc = (e) => {
      if (!restaurantPickerRef.current?.contains(e.target)) setRestaurantPickerOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  const filteredRestaurantsForPicker = useMemo(() => {
    const q = restaurantSearchQuery.trim().toLowerCase();
    if (!q) return restaurants;
    return restaurants.filter((r) => {
      const name = restaurantDisplayName(r).toLowerCase();
      const cuisine = (typeof r?.cuisine === 'string' ? r.cuisine : r?.cuisine?.name || '').toLowerCase();
      const zone = String(r?.zone || '').toLowerCase();
      const addr = (typeof r?.address === 'string' ? r.address : '').toLowerCase();
      return name.includes(q) || cuisine.includes(q) || zone.includes(q) || addr.includes(q);
    });
  }, [restaurants, restaurantSearchQuery]);

  const itemsInActiveCategory = useMemo(() => {
    if (!restaurantId || !menuCategories.length) return menuItems;
    const tab = menuCategories.find((c) => c.id === activeCategoryId);
    if (!tab || !tab.itemIds?.length) return menuItems;
    const allowed = new Set(tab.itemIds);
    return menuItems.filter((m) => allowed.has(m.id));
  }, [menuItems, menuCategories, activeCategoryId, restaurantId]);

  const filteredMenuItems = useMemo(() => {
    const q = menuSearch.trim().toLowerCase();
    if (!q) return itemsInActiveCategory;
    return itemsInActiveCategory.filter((m) => {
      const name = String(m.name || '').toLowerCase();
      const desc = String(m.description || '').toLowerCase();
      return name.includes(q) || desc.includes(q);
    });
  }, [itemsInActiveCategory, menuSearch]);

  const canGoNext = useMemo(() => {
    if (step === 0) return Boolean(customerId);
    if (step === 1) return Boolean(addressId);
    if (step === 2) return Boolean(restaurantId) && selectedItems.length > 0;
    if (step === 3) return selectedItems.length > 0;
    return true;
  }, [step, customerId, addressId, restaurantId, selectedItems.length]);

  const selectedCustomer = useMemo(
    () =>
      customers.find((row) => {
        const c = rowCustomer(row);
        const rid = String(customerId || '').trim();
        return toId(row) === rid || toId(c) === rid;
      }),
    [customers, customerId]
  );
  const selectedAddress = useMemo(
    () => addresses.find((a) => toId(a) === String(addressId || '').trim()),
    [addresses, addressId]
  );
  const selectedRestaurant = useMemo(
    () => restaurants.find((r) => toRestaurantRecordId(r) === String(restaurantId || '').trim()),
    [restaurants, restaurantId]
  );

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      setError('');
      try {
        const token = localStorage.getItem('token') || '';
        const res = await fetch('/api/orders/customers', {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data?.message || 'Failed to fetch customers');
        const list = normalizeList(data, ['customers', 'order_customers', 'data.customers', 'data.order_customers']);
        setCustomers(Array.isArray(list) ? list : []);
      } catch (e) {
        setCustomers([]);
        setError(e?.message || 'Failed to fetch customers');
      } finally {
        setLoading(false);
      }
    };
    run();
  }, []);

  useEffect(() => {
    if (!customerId) {
      setAddresses([]);
      setAddressId('');
      return;
    }

    const run = async () => {
      setLoading(true);
      setError('');
      try {
        const token = localStorage.getItem('token') || '';
        const params = new URLSearchParams({ user_id: customerId });
        const res = await fetch(`/api/auth/addresses?${params.toString()}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data?.message || 'Failed to fetch addresses');
        const list = normalizeList(data, ['addresses', 'data.addresses', 'data.list', 'list']);
        setAddresses(Array.isArray(list) ? list : []);
        setAddressId('');
      } catch (e) {
        setAddresses([]);
        setAddressId('');
        setError(e?.message || 'Failed to fetch addresses');
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [customerId]);

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      setError('');
      try {
        const token = localStorage.getItem('token') || '';
        const res = await fetch('/api/restaurants/', {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data?.message || 'Failed to fetch restaurants');
        const list = normalizeList(data, ['restaurants', 'data.restaurants', 'data.list', 'list']);
        setRestaurants(Array.isArray(list) ? list : []);
      } catch (e) {
        setRestaurants([]);
        setError(e?.message || 'Failed to fetch restaurants');
      } finally {
        setLoading(false);
      }
    };
    run();
  }, []);

  useEffect(() => {
    if (!restaurantId) {
      setMenuItems([]);
      setMenuCategories([]);
      setActiveCategoryId('');
      setCartLines([]);
      setOptionModalItem(null);
      return;
    }

    const run = async () => {
      setLoading(true);
      setError('');
      setMenuItems([]);
      setMenuCategories([]);
      setActiveCategoryId('');
      try {
        const token = localStorage.getItem('token') || '';
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        const rid = encodeURIComponent(String(restaurantId).trim());

        // Prefer discover details (customer-style menu + categories). Many backends return 404 for
        // admin-only restaurants here; we then fall back to admin menu-items.
        let normalized = [];
        let discoverMessage = '';
        let lastPayload = null;

        // Prefer discover details (customer-style menu + categories). Many backends return 404 for
        // admin-only restaurants here; we then fall back to admin menu-items.
        const discoverRes = await fetch(`/api/restaurants/discover/restaurants/${rid}/details`, {
          headers,
        });
        const discoverData = await discoverRes.json().catch(() => ({}));
        if (discoverRes.ok) {
          lastPayload = discoverData;
          normalized = normalizeMenuItems(discoverData);
        } else {
          const m = discoverData?.message;
          discoverMessage = typeof m === 'string' ? m : m != null ? String(m) : '';
        }

        if (normalized.length === 0) {
        const params = new URLSearchParams({
          restaurant_id: restaurantId,
          page: '1',
          limit: '500',
        });
          const menuRes = await fetch(`/api/restaurants/menu-items?${params.toString()}`, {
            headers,
          });
          const menuData = await menuRes.json().catch(() => ({}));
          if (!menuRes.ok) {
            throw new Error(
              menuData?.message ||
                discoverMessage ||
                'Failed to fetch restaurant menu items'
            );
          }
          lastPayload = menuData;
          normalized = normalizeMenuItems(menuData);
        }

        const tabs = extractMenuCategoryTabsFromPayload(lastPayload, normalized);
        const firstTabId = tabs.find((t) => t.itemIds.length)?.id || tabs[0]?.id || '';

        setMenuItems(normalized);
        setMenuCategories(tabs);
        setActiveCategoryId(firstTabId);
        setCartLines([]);
        setOptionModalItem(null);
      } catch (e) {
        setMenuItems([]);
        setMenuCategories([]);
        setActiveCategoryId('');
        setCartLines([]);
        setOptionModalItem(null);
        setError(e?.message || 'Failed to fetch restaurant menu items');
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [restaurantId]);

  const goNext = () => setStep((s) => Math.min(4, s + 1));
  const goBack = () => setStep((s) => Math.max(0, s - 1));

  const createOrder = async () => {
    setLoading(true);
    setError('');
    try {
      const addressBelongsToCustomer = addresses.some((a) => toId(a) === String(addressId || '').trim());
      if (!addressBelongsToCustomer) {
        setError("Selected address doesn't belong to the chosen customer. Please re-select the customer/address.");
        return;
      }

      const token = localStorage.getItem('token') || '';
      const payload = {
        customer_id: customerId,
        restaurant_id: restaurantId,
        items: selectedItems,
        order_type: orderType,
        payment_type: paymentType,
        address_id: addressId,
        delivery_fee: Number(deliveryFee) || 0,
        tax_amount: Number(taxAmount) || 0,
        discount_amount: Number(discountAmount) || 0,
        notes: notes || 'Order by admin',
      };

      const res = await fetch('/api/orders/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || 'Failed to create order');

      const created =
        data?.data?.order ||
        data?.order ||
        data?.data ||
        null;
      const newOrderId = String(created?.id || created?.order_id || created?.orderId || '').trim();
      router.push(newOrderId ? `/dashboard/orders/all/${newOrderId}` : '/dashboard/orders/all');
    } catch (e) {
      setError(e?.message || 'Failed to create order');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Topbar
        title="Create order"
        subtitle="Customer → address → menu → cart & delivery → review."
      />
      <div className="pt-36 px-6 pb-10">
        <div className="w-full rounded-2xl border border-gray-200/80 bg-gradient-to-b from-[#FAFAFF] to-[#F4F4FB] p-4 shadow-sm sm:p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
            <div className="flex flex-wrap gap-2">
              {STEP_TITLES.map((t, idx) => {
                const Icon = STEP_ICONS[idx];
                const active = idx === step;
                const done = idx < step;
                return (
                <button
                  key={t}
                  type="button"
                  onClick={() => setStep(idx)}
                    className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold transition-all ${
                      active
                        ? 'border-violet-600 bg-violet-600 text-white shadow-md shadow-violet-600/20'
                        : done
                          ? 'border-violet-200 bg-white text-violet-700 hover:bg-violet-50'
                          : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5 shrink-0 opacity-90" aria-hidden />
                    <span className="hidden sm:inline">{idx + 1}.</span>
                    <span>{t}</span>
                </button>
                );
              })}
            </div>
            {loading ? (
              <span
                className="inline-flex items-center justify-center self-start rounded-full bg-white p-2 shadow-sm ring-1 ring-violet-100 sm:self-center"
                aria-busy="true"
                aria-label="Loading"
              >
                <Loader2 className="h-4 w-4 animate-spin text-violet-600" aria-hidden />
              </span>
            ) : null}
          </div>

          {error ? (
            <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50/90 px-4 py-3 text-sm text-rose-700 shadow-sm">
              {error}
            </div>
          ) : null}

          <div className="mt-4 rounded-xl border border-gray-200/90 bg-white p-4 shadow-sm sm:p-5">
            {step === 0 ? (
              <div className="space-y-4">
                <h2 className="text-base font-semibold text-[#1E1E24]">Who is ordering?</h2>
                <div className="relative">
                  <Search
                    className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
                    aria-hidden
                  />
                  <input
                    type="search"
                    value={customerSearch}
                    onChange={(e) => setCustomerSearch(e.target.value)}
                    placeholder="Search by name, phone, or email…"
                    className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-10 pr-10 text-sm text-[#1E1E24] shadow-sm placeholder:text-gray-400 focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20"
                    autoComplete="off"
                  />
                  {customerSearch.trim() ? (
                    <button
                      type="button"
                      onClick={() => setCustomerSearch('')}
                      className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                      aria-label="Clear search"
                    >
                      <X className="h-4 w-4" aria-hidden />
                    </button>
                  ) : null}
                </div>
                <div className="space-y-2">
                  {customers.length === 0 && !loading ? (
                    <p className="text-sm text-gray-500">No customers loaded.</p>
                  ) : null}
                  {customers.length > 0 && customersListForStep0.length === 0 && !loading ? (
                    <p className="text-sm text-gray-500">No customers match your search.</p>
                  ) : null}
                  {customersListForStep0.map((raw, idx) => {
                    const c = rowCustomer(raw);
                    const id = toId(raw) || toId(c);
                    if (!id) return null;
                    const sel = customerId === id;
                    return (
                      <ChoiceRow
                        key={id || `c-${idx}`}
                        selected={sel}
                        onClick={() => setCustomerId(id)}
                        leading={
                          <RoundMedia
                            src={pickCustomerImage(raw)}
                            alt=""
                            fallbackLetter={customerDisplayName(c)}
                            sizeClass="h-12 w-12"
                          />
                        }
                        title={customerDisplayName(c)}
                        subtitle={customerSecondaryLine(c)}
                      />
                    );
                  })}
                </div>
              </div>
            ) : null}

            {step === 1 ? (
              <div className="space-y-4">
                <h2 className="text-base font-semibold text-[#1E1E24]">Delivery address</h2>
                {!customerId ? (
                  <p className="text-sm text-gray-500">Go back and pick a customer first.</p>
                ) : (
                  <div className="max-h-[min(420px,55vh)] space-y-2 overflow-y-auto pr-1">
                    {addresses.length === 0 && !loading ? (
                      <p className="text-sm text-gray-500">No saved addresses for this customer.</p>
                    ) : null}
                    {addresses.map((a, idx) => {
                    const id = toId(a);
                      if (!id) return null;
                      const sel = addressId === id;
                      const sec = addressDisplaySecondary(a);
                    return (
                        <ChoiceRow
                          key={id || `a-${idx}`}
                          selected={sel}
                          onClick={() => setAddressId(id)}
                          leading={
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
                              <MapPin className="h-5 w-5" aria-hidden />
                            </div>
                          }
                          title={addressDisplayPrimary(a)}
                          subtitle={sec}
                        />
                    );
                  })}
                  </div>
                )}
              </div>
            ) : null}

            {step === 2 ? (
              <div className="space-y-5">
                <div>
                  <h2 className="text-base font-semibold text-[#1E1E24]">Restaurant & menu</h2>
                  <p className="mt-0.5 text-sm text-gray-500">
                    Select a restaurant, choose a category, then add items to the cart.
                  </p>
                </div>

                <div className="relative max-w-xl" ref={restaurantPickerRef}>
                  <p className="mb-1.5 text-[11px] font-semibold text-gray-600">Restaurant</p>
                  <button
                    type="button"
                    onClick={() => setRestaurantPickerOpen((o) => !o)}
                    className="flex w-full items-center gap-3 rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-left shadow-sm transition hover:border-violet-300 focus:outline-none focus:ring-2 focus:ring-violet-500/25"
                  >
                    <RoundMedia
                      src={selectedRestaurant ? pickRestaurantImage(selectedRestaurant) : ''}
                      alt=""
                      fallbackLetter={selectedRestaurant ? restaurantDisplayName(selectedRestaurant) : '?'}
                      sizeClass="h-10 w-10"
                      rounded="rounded-lg"
                    />
                    <span className="min-w-0 flex-1 truncate text-sm font-semibold text-[#1E1E24]">
                      {selectedRestaurant ? restaurantDisplayName(selectedRestaurant) : 'Select restaurant…'}
                    </span>
                    <ChevronDown
                      className={`h-4 w-4 shrink-0 text-gray-500 transition ${restaurantPickerOpen ? 'rotate-180' : ''}`}
                      aria-hidden
                    />
                  </button>
                  {restaurantPickerOpen ? (
                    <div className="absolute left-0 right-0 z-40 mt-2 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xl">
                      <div className="border-b border-gray-100 p-2">
                        <div className="relative">
                          <Search
                            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
                            aria-hidden
                          />
                          <input
                            value={restaurantSearchQuery}
                            onChange={(e) => setRestaurantSearchQuery(e.target.value)}
                            placeholder="Search restaurants…"
                            className="w-full rounded-lg border border-gray-200 py-2 pl-9 pr-3 text-sm focus:border-violet-400 focus:outline-none"
                            autoFocus
                          />
                        </div>
                      </div>
                      <div className="max-h-64 overflow-y-auto py-1">
                        {filteredRestaurantsForPicker.length === 0 ? (
                          <p className="px-3 py-4 text-center text-sm text-gray-500">No restaurants match.</p>
                        ) : (
                          filteredRestaurantsForPicker.map((r) => {
                            const id = toRestaurantRecordId(r);
                            if (!id) return null;
                            const sel = restaurantId === id;
                        return (
                              <button
                                key={id}
                                type="button"
                                onClick={() => {
                                  setRestaurantId(id);
                                  setRestaurantPickerOpen(false);
                                  setRestaurantSearchQuery('');
                                }}
                                className={`flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm transition hover:bg-violet-50 ${
                                  sel ? 'bg-violet-50' : ''
                                }`}
                              >
                                <RoundMedia
                                  src={pickRestaurantImage(r)}
                                  alt=""
                                  fallbackLetter={restaurantDisplayName(r)}
                                  sizeClass="h-9 w-9"
                                  rounded="rounded-lg"
                                />
                                <span className="min-w-0 flex-1 truncate font-medium text-[#1E1E24]">
                                  {restaurantDisplayName(r)}
                                </span>
                                {sel ? <Check className="h-4 w-4 shrink-0 text-violet-600" aria-hidden /> : null}
                              </button>
                            );
                          })
                        )}
                      </div>
                    </div>
                  ) : null}
                </div>

                {restaurantId && loading && menuItems.length === 0 ? (
                  <FoodWideCardSkeletonGrid
                    count={6}
                    columnsClass="grid-cols-1 sm:grid-cols-2 xl:grid-cols-3"
                  />
                ) : null}

                {restaurantId && !loading && menuCategories.length > 1 ? (
                  <div>
                    <p className="mb-2 text-[11px] font-semibold text-gray-600">Categories</p>
                    <div className="-mx-1 flex gap-2 overflow-x-auto pb-1 pt-0.5 [scrollbar-width:thin]">
                      {menuCategories.map((cat) => {
                        const active = activeCategoryId === cat.id;
                        return (
                          <button
                            key={cat.id}
                            type="button"
                            onClick={() => setActiveCategoryId(cat.id)}
                            className={`shrink-0 rounded-full border px-4 py-2 text-xs font-semibold transition ${
                              active
                                ? 'border-violet-600 bg-violet-600 text-white shadow-md shadow-violet-600/20'
                                : 'border-gray-200 bg-white text-gray-700 hover:border-violet-200 hover:bg-violet-50/50'
                            }`}
                          >
                            {cat.name}
                          </button>
                        );
                      })}
                  </div>
                  </div>
                ) : null}

                <div className="relative">
                  <Search
                    className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
                    aria-hidden
                  />
                    <input
                      value={menuSearch}
                      onChange={(e) => setMenuSearch(e.target.value)}
                    placeholder="Search items in this category…"
                    className="w-full rounded-xl border border-gray-200 bg-gray-50/80 py-2.5 pl-10 pr-3 text-sm outline-none ring-violet-500/0 transition focus:border-violet-300 focus:bg-white focus:ring-2 focus:ring-violet-500/20"
                    disabled={!restaurantId || (loading && menuItems.length === 0)}
                  />
                </div>

                {!restaurantId ? (
                  <p className="text-sm text-gray-500">Select a restaurant to load categories and menu.</p>
                      ) : null}
                {restaurantId && !loading && filteredMenuItems.length === 0 && menuItems.length > 0 ? (
                  <p className="text-sm text-gray-500">
                    No items in this category{menuSearch.trim() ? ' match your search' : ''}.
                  </p>
                ) : null}
                {restaurantId && !loading && menuItems.length === 0 ? (
                  <p className="text-sm text-gray-500">No menu items for this restaurant.</p>
                ) : null}

                {restaurantId && !loading && filteredMenuItems.length > 0 ? (
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                      {filteredMenuItems.map((m) => {
                      const hasOpts = (m.optionGroups?.length || 0) > 0;
                      const inCartTotal = totalQtyForMenuItem.get(m.id) || 0;
                        return (
                        <div
                          key={m.id}
                          className={`flex items-stretch overflow-hidden rounded-xl border bg-white shadow-sm transition hover:shadow-md ${
                            inCartTotal
                              ? 'border-red-500 ring-1 ring-red-200/80 hover:border-red-600'
                              : 'border-gray-200 hover:border-violet-300'
                          }`}
                        >
                          <div className="relative w-28 shrink-0 self-stretch min-h-[8rem] overflow-hidden rounded-none rounded-l-xl bg-gray-100 sm:min-h-[9rem] sm:w-32">
                            <RoundMedia
                              fillContainer
                              src={m.imageUrl}
                              alt=""
                              fallbackLetter={m.name}
                              rounded="rounded-none rounded-l-xl"
                            />
                          </div>
                          <div className="flex min-w-0 flex-1 flex-col justify-between p-3">
                            <div>
                              <div className="flex flex-wrap items-start gap-2">
                                <p className="line-clamp-2 font-semibold leading-tight text-[#1E1E24]">{m.name}</p>
                                {hasOpts ? (
                                  <span className="shrink-0 rounded bg-amber-50 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-800">
                                    Options
                                  </span>
                                ) : null}
                              </div>
                              {m.description ? (
                                <p className="mt-1 line-clamp-2 text-[11px] leading-snug text-gray-500">
                                  {m.description}
                                </p>
                              ) : null}
                              {inCartTotal > 0 ? (
                                <p className="mt-1 text-[11px] font-semibold text-red-600">
                                  {inCartTotal} in cart
                                </p>
                              ) : null}
                            </div>
                            <div className="mt-3 flex flex-col gap-2">
                              <span className="inline-flex w-fit rounded-full bg-violet-50 px-2.5 py-1 text-xs font-bold text-violet-800 ring-1 ring-violet-100">
                                {formatCurrencyFixed2(m.price)}
                                {hasOpts ? (
                                  <span className="ml-1 font-normal text-gray-500">+ add-ons</span>
                                ) : null}
                              </span>
                                <button
                                  type="button"
                                onClick={() => setOptionModalItem(m)}
                                className={`w-full rounded-lg px-3 py-2.5 text-center text-xs font-semibold text-white shadow-sm transition active:scale-[0.99] ${
                                  inCartTotal > 0
                                    ? 'bg-red-600 shadow-red-600/20 hover:bg-red-700'
                                    : 'bg-violet-600 shadow-violet-600/20 hover:bg-violet-700'
                                }`}
                              >
                                {inCartTotal > 0 ? 'Add another' : 'Add to cart'}
                                </button>
                              </div>
                          </div>
                        </div>
                        );
                      })}
                </div>
                ) : null}

                <div className="rounded-xl border border-violet-100/80 bg-violet-50/40 px-4 py-3 text-sm text-violet-900">
                  <p>
                    When you&apos;re finished adding items, tap <strong className="font-semibold">Next</strong> for{' '}
                    <strong className="font-semibold">Cart & delivery</strong> — fees, payment type, and your cart
                    summary.
                  </p>
                </div>
              </div>
            ) : null}

            {step === 3 ? (
              <div className="space-y-5">
                <div>
                  <h2 className="text-base font-semibold text-[#1E1E24]">Cart & delivery</h2>
                  <p className="mt-0.5 text-sm text-gray-500">
                    Set order type and charges, then review your cart and totals. Use Back to add more menu items.
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                  <div className="space-y-3 rounded-xl border border-gray-200 bg-gray-50/50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Order options</p>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <label className="text-xs font-semibold text-gray-700">
                        Order type
                        <select
                          value={orderType}
                          onChange={(e) => setOrderType(e.target.value)}
                          className="mt-1.5 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-normal shadow-sm"
                        >
                          <option value="delivery">Delivery</option>
                          <option value="dine_in">Dine in</option>
                          <option value="pickup">Pickup</option>
                        </select>
                      </label>
                      <label className="text-xs font-semibold text-gray-700">
                        Payment
                        <select
                          value={paymentType}
                          onChange={(e) => setPaymentType(e.target.value)}
                          className="mt-1.5 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-normal shadow-sm"
                        >
                          <option value="cash">Cash</option>
                          <option value="wallet">Wallet</option>
                          <option value="card">Card</option>
                        </select>
                      </label>
                    </div>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <label className="text-xs font-semibold text-gray-700">
                        Delivery fee
                        <input
                          value={deliveryFee}
                          onChange={(e) => setDeliveryFee(e.target.value)}
                          className="mt-1.5 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm shadow-sm"
                          inputMode="numeric"
                        />
                      </label>
                      <label className="text-xs font-semibold text-gray-700">
                        Tax
                        <input
                          value={taxAmount}
                          onChange={(e) => setTaxAmount(e.target.value)}
                          className="mt-1.5 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm shadow-sm"
                          inputMode="numeric"
                        />
                      </label>
                    </div>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <label className="text-xs font-semibold text-gray-700">
                        Discount
                        <input
                          value={discountAmount}
                          onChange={(e) => setDiscountAmount(e.target.value)}
                          className="mt-1.5 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm shadow-sm"
                          inputMode="numeric"
                        />
                      </label>
                      <div />
                    </div>
                    <label className="text-xs font-semibold text-gray-700">
                      Order note
                      <input
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        className="mt-1.5 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm shadow-sm"
                      />
                    </label>
                  </div>

                  <div className="space-y-3 rounded-xl border border-violet-100 bg-gradient-to-b from-violet-50/60 to-white p-4 shadow-sm ring-1 ring-violet-100/80">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-semibold uppercase tracking-wide text-violet-800/80">Your cart</p>
                      {cartLines.length > 0 ? (
                        <button
                          type="button"
                          onClick={() => setCartLines([])}
                          className="text-xs font-semibold text-violet-600 underline-offset-2 hover:text-violet-800 hover:underline"
                        >
                          Clear cart
                        </button>
                      ) : null}
                    </div>
                    {cartLines.length === 0 ? (
                      <p className="text-sm text-gray-500">Add at least one item to continue.</p>
                    ) : (
                      <>
                        <div className="max-h-[min(360px,50vh)] space-y-2 overflow-y-auto pr-1">
                          {cartLines.map((line) => {
                            const item = menuItems.find((x) => x.id === line.menuItemId);
                            const unit = lineUnitPrice(item, line.selectedOptionIds);
                            const optText = selectionSummary(item, line.selectedOptionIds);
                          return (
                              <div
                                key={line.lineId}
                                className="flex items-start gap-2 rounded-lg border border-violet-100/80 bg-white/90 p-2 text-sm shadow-sm"
                              >
                                <RoundMedia
                                  src={item?.imageUrl}
                                  alt=""
                                  fallbackLetter={item?.name || 'Item'}
                                  sizeClass="h-9 w-9"
                                  rounded="rounded-md"
                                />
                                <div className="min-w-0 flex-1">
                                  <p className="truncate font-medium text-[#1E1E24]">{item?.name || 'Item'}</p>
                                  {optText ? <p className="text-xs text-gray-500">{optText}</p> : null}
                                  {line.note ? <p className="text-[11px] text-gray-400">Note: {line.note}</p> : null}
                                  <div className="mt-1 inline-flex items-center rounded-md border border-gray-200 bg-gray-50/80 p-0.5">
                                    <button
                                      type="button"
                                      onClick={() =>
                                        addOrMergeCartLine(line.menuItemId, line.selectedOptionIds, line.note, -1)
                                      }
                                      className="flex h-7 w-7 items-center justify-center rounded text-gray-600 hover:bg-white"
                                      aria-label="Decrease"
                                    >
                                      −
                                    </button>
                                    <span className="min-w-[1.5rem] text-center text-xs font-semibold">
                                      {line.quantity}
                              </span>
                                    <button
                                      type="button"
                                      onClick={() =>
                                        addOrMergeCartLine(line.menuItemId, line.selectedOptionIds, line.note, 1)
                                      }
                                      className="flex h-7 w-7 items-center justify-center rounded text-gray-600 hover:bg-white"
                                      aria-label="Increase"
                                    >
                                      +
                                    </button>
                                  </div>
                                </div>
                                <span className="shrink-0 text-xs font-semibold text-violet-800">
                                  {formatCurrencyFixed2(unit * line.quantity)}
                              </span>
                            </div>
                          );
                        })}
                        </div>
                        <div className="mt-3 space-y-1.5 border-t border-violet-100 pt-3 text-sm">
                          <div className="flex justify-between text-gray-600">
                            <span>Items</span>
                            <span className="font-medium text-[#1E1E24]">
                              {formatCurrencyFixed2(itemsSubtotal)}
                            </span>
                      </div>
                          <div className="flex justify-between text-gray-600">
                            <span>Delivery fee</span>
                            <span className="font-medium text-[#1E1E24]">
                              {formatCurrencyFixed2(Number(deliveryFee) || 0)}
                            </span>
                          </div>
                          <div className="flex justify-between text-gray-600">
                            <span>Tax</span>
                            <span className="font-medium text-[#1E1E24]">
                              {formatCurrencyFixed2(Number(taxAmount) || 0)}
                            </span>
                          </div>
                          {(Number(discountAmount) || 0) > 0 ? (
                            <div className="flex justify-between text-gray-600">
                              <span>Discount</span>
                              <span className="font-medium text-emerald-700">
                                −{formatCurrencyFixed2(Number(discountAmount) || 0)}
                              </span>
                            </div>
                          ) : null}
                          <div className="flex justify-between border-t border-violet-200/80 pt-2 text-base font-bold text-violet-800">
                            <span>Total</span>
                            <span>{formatCurrencyFixed2(orderGrandTotal)}</span>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ) : null}

            {step === 4 ? (
              <div className="space-y-5">
                <h2 className="text-base font-semibold text-[#1E1E24]">Review & confirm</h2>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <ReviewCard
                    title="Customer"
                    primary={selectedCustomer ? customerDisplayName(rowCustomer(selectedCustomer)) : '—'}
                    secondary={selectedCustomer ? customerSecondaryLine(rowCustomer(selectedCustomer)) : ''}
                    media={
                      selectedCustomer ? (
                        <RoundMedia
                          src={pickCustomerImage(selectedCustomer)}
                          alt=""
                          fallbackLetter={customerDisplayName(rowCustomer(selectedCustomer))}
                          sizeClass="h-12 w-12"
                        />
                      ) : null
                    }
                  />
                  <ReviewCard
                    title="Address"
                    primary={selectedAddress ? addressDisplayPrimary(selectedAddress) : '—'}
                    secondary={selectedAddress ? addressDisplaySecondary(selectedAddress) : ''}
                    media={
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
                        <MapPin className="h-6 w-6" aria-hidden />
                </div>
                    }
                  />
                  <ReviewCard
                    title="Restaurant"
                    primary={selectedRestaurant ? restaurantDisplayName(selectedRestaurant) : '—'}
                    secondary={selectedRestaurant?.address || selectedRestaurant?.addressShort || ''}
                    media={
                      selectedRestaurant ? (
                        <RoundMedia
                          src={pickRestaurantImage(selectedRestaurant)}
                          alt=""
                          fallbackLetter={restaurantDisplayName(selectedRestaurant)}
                          sizeClass="h-12 w-12"
                        />
                      ) : null
                    }
                  />
                  <ReviewCard
                    title="Payment"
                    primary={`${paymentType.replace(/_/g, ' ')} · ${orderType.replace(/_/g, ' ')}`}
                    secondary={`Total due ${formatCurrencyFixed2(orderGrandTotal)}`}
                    media={
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                        <ClipboardList className="h-6 w-6" aria-hidden />
                      </div>
                    }
                  />
                </div>
                {cartLines.length > 0 ? (
                  <div className="rounded-xl border border-gray-200 bg-gray-50/50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Items</p>
                    <ul className="mt-3 space-y-3">
                      {cartLines.map((line) => {
                        const item = menuItems.find((m) => m.id === line.menuItemId);
                        const unit = lineUnitPrice(item, line.selectedOptionIds);
                        const optText = selectionSummary(item, line.selectedOptionIds);
                        return (
                          <li key={line.lineId} className="flex gap-2 text-sm">
                            <RoundMedia
                              src={item?.imageUrl}
                              alt=""
                              fallbackLetter={item?.name || 'Item'}
                              sizeClass="h-8 w-8"
                              rounded="rounded-md"
                            />
                            <div className="min-w-0 flex-1">
                              <p className="font-medium text-[#1E1E24]">{item?.name || 'Item'}</p>
                              {optText ? <p className="text-xs text-gray-500">{optText}</p> : null}
                              {line.note ? <p className="text-[11px] text-gray-400">{line.note}</p> : null}
                              <p className="text-xs text-gray-600">× {line.quantity}</p>
                            </div>
                            <span className="shrink-0 font-medium text-gray-800">
                              {formatCurrencyFixed2(unit * line.quantity)}
                            </span>
                          </li>
                        );
                      })}
                    </ul>
                    <div className="mt-4 space-y-1.5 border-t border-gray-200 pt-3 text-sm">
                      <div className="flex justify-between text-gray-600">
                        <span>Items</span>
                        <span className="font-medium text-[#1E1E24]">
                          {formatCurrencyFixed2(itemsSubtotal)}
                        </span>
                      </div>
                      <div className="flex justify-between text-gray-600">
                        <span>Delivery fee</span>
                        <span className="font-medium text-[#1E1E24]">
                          {formatCurrencyFixed2(Number(deliveryFee) || 0)}
                        </span>
                      </div>
                      <div className="flex justify-between text-gray-600">
                        <span>Tax</span>
                        <span className="font-medium text-[#1E1E24]">
                          {formatCurrencyFixed2(Number(taxAmount) || 0)}
                        </span>
                      </div>
                      {(Number(discountAmount) || 0) > 0 ? (
                        <div className="flex justify-between text-gray-600">
                          <span>Discount</span>
                          <span className="font-medium text-emerald-700">
                            −{formatCurrencyFixed2(Number(discountAmount) || 0)}
                          </span>
                        </div>
                      ) : null}
                      <div className="flex justify-between pt-2 text-base font-bold text-violet-800">
                        <span>Total</span>
                        <span>{formatCurrencyFixed2(orderGrandTotal)}</span>
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-gray-200/80 pt-4">
            <button
              type="button"
              onClick={() => router.push('/dashboard/orders/all')}
              className="rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-xs font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50"
            >
              Cancel
            </button>
            <div className="flex flex-wrap items-center justify-end gap-2">
              <button
                type="button"
                onClick={goBack}
                disabled={step === 0}
                className="rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-xs font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50 disabled:pointer-events-none disabled:opacity-40"
              >
                Back
              </button>
              {step < 4 ? (
                <button
                  type="button"
                  onClick={goNext}
                  disabled={!canGoNext}
                  className="inline-flex items-center gap-1 rounded-lg bg-violet-600 px-4 py-2.5 text-xs font-semibold text-white shadow-md shadow-violet-600/25 transition hover:bg-violet-700 disabled:pointer-events-none disabled:opacity-45"
                >
                  Next
                  <ChevronRight className="h-3.5 w-3.5" aria-hidden />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={createOrder}
                  disabled={loading || !customerId || !addressId || !restaurantId || selectedItems.length === 0}
                  className="rounded-lg bg-violet-600 px-4 py-2.5 text-xs font-semibold text-white shadow-md shadow-violet-600/25 transition hover:bg-violet-700 disabled:pointer-events-none disabled:opacity-45"
                >
                  Place order
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {optionModalItem ? (
        <ItemOptionsModal
          item={optionModalItem}
          onClose={() => setOptionModalItem(null)}
          onConfirm={(selectedOptionIds, quantity, note) => {
            addOrMergeCartLine(optionModalItem.id, selectedOptionIds, note, Math.max(1, quantity));
          }}
        />
      ) : null}
    </>
  );
}

function ItemOptionsModal({ item, onClose, onConfirm }) {
  const [byGroup, setByGroup] = useState({});
  const [qty, setQty] = useState(1);
  const [note, setNote] = useState('');
  const [err, setErr] = useState('');

  useEffect(() => {
    setByGroup({});
    setQty(1);
    setNote('');
    setErr('');
  }, [item?.id]);

  const selectedFlat = useMemo(() => {
    const ids = [];
    for (const g of item?.optionGroups || []) {
      ids.push(...(byGroup[g.id] || []));
    }
    return ids;
  }, [item, byGroup]);

  const validate = () => {
    for (const g of item?.optionGroups || []) {
      const picked = byGroup[g.id] || [];
      const need = Math.max(Number(g.minSelections || 0), g.isRequired ? 1 : 0);
      const maxAllowed = g.maxSelections > 0 ? g.maxSelections : g.options.length;
      if (picked.length < need) {
        return `Pick at least ${need} option(s) for “${g.name}”.`;
      }
      if (picked.length > maxAllowed) {
        return `Too many options for “${g.name}”.`;
      }
    }
    return '';
  };

  const handleConfirm = () => {
    const msg = validate();
    if (msg) {
      setErr(msg);
      return;
    }
    onConfirm(selectedFlat, Math.max(1, Math.floor(Number(qty) || 1)), note);
    onClose();
  };

  const bumpQty = (delta) => {
    setQty((q) => Math.max(1, Math.floor(Number(q) || 1) + delta));
  };

  const setSingle = (group, optionId) => {
    setErr('');
    setByGroup((prev) => ({ ...prev, [group.id]: optionId ? [optionId] : [] }));
  };

  const toggleMulti = (group, optionId) => {
    setErr('');
    setByGroup((prev) => {
      const cur = prev[group.id] || [];
      const maxAllowed = group.maxSelections > 0 ? group.maxSelections : group.options.length;
      if (cur.includes(optionId)) {
        return { ...prev, [group.id]: cur.filter((id) => id !== optionId) };
      }
      if (cur.length >= maxAllowed) return prev;
      return { ...prev, [group.id]: [...cur, optionId] };
    });
  };

  const unit = lineUnitPrice(item, selectedFlat);
  const groups = item?.optionGroups || [];

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center" role="dialog" aria-modal="true">
      <button
        type="button"
        className="absolute inset-0 bg-black/40 backdrop-blur-[1px]"
        aria-label="Close dialog"
        onClick={onClose}
      />
      <div
        className="relative z-[1] flex max-h-[min(92vh,720px)] w-full max-w-lg flex-col overflow-hidden rounded-t-2xl border border-gray-200 bg-white shadow-2xl sm:mx-4 sm:max-w-3xl sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex min-h-0 flex-1 flex-col sm:flex-row">
          {item.imageUrl ? (
            <div className="relative h-44 w-full shrink-0 bg-gray-100 sm:h-auto sm:min-h-[260px] sm:w-[40%]">
              {/* eslint-disable-next-line @next/next/no-img-element -- remote API URLs */}
              <img
                src={item.imageUrl}
                alt=""
                className="h-full w-full object-cover sm:absolute sm:inset-0 sm:h-full"
              />
            </div>
          ) : null}

          <div className="flex min-h-0 min-w-0 flex-1 flex-col">
            <div className="flex items-start justify-between gap-3 border-b border-gray-100 px-4 py-3">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-[#1E1E24]">{item.name}</p>
                <p className="mt-0.5 text-sm text-violet-700">{formatCurrencyFixed2(unit)}</p>
                {item.description ? (
                  <p className="mt-2 text-xs leading-relaxed text-gray-500">{item.description}</p>
                ) : null}
              </div>
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg p-1.5 text-gray-500 transition hover:bg-gray-100 hover:text-gray-800"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3">
              <div className="space-y-5">
                {groups.length === 0 ? (
                  <p className="rounded-xl border border-violet-100/80 bg-violet-50/40 px-3 py-2.5 text-sm text-gray-600">
                    No options to configure — set quantity below and add to your cart.
                  </p>
                ) : null}
                {groups.map((g) => {
                  const picked = byGroup[g.id] || [];
                  const isSingle = g.maxSelections <= 1;
                  const need = Math.max(Number(g.minSelections || 0), g.isRequired ? 1 : 0);
                  const optionalSingle = isSingle && need === 0;
                  return (
                    <div key={g.id} className="space-y-2">
                      <div className="flex flex-wrap items-baseline justify-between gap-2">
                        <p className="text-sm font-semibold text-[#1E1E24]">
                          {g.name}
                          {need > 0 ? <span className="ml-0.5 text-rose-500">*</span> : null}
                        </p>
                        {!isSingle ? (
                          <span className="text-[11px] text-gray-400">
                            Up to {g.maxSelections > 0 ? g.maxSelections : g.options.length}
                          </span>
                        ) : null}
                </div>
                      <div className="space-y-1.5">
                        {isSingle
                          ? g.options.map((o) => (
                              <label
                                key={o.id}
                                className={`flex min-w-0 cursor-pointer items-center justify-between gap-2 rounded-xl border px-3 py-2 text-sm transition ${
                                  picked[0] === o.id
                                    ? 'border-violet-500 bg-violet-50/60'
                                    : 'border-gray-200 hover:border-violet-200'
                                }`}
                              >
                                <span className="flex min-w-0 items-center gap-2">
                                  <input
                                    type="radio"
                                    name={`og-${g.id}`}
                                    checked={picked[0] === o.id}
                                    onChange={() => setSingle(g, o.id)}
                                    className="shrink-0 accent-violet-600"
                                  />
                                  <span className="truncate font-medium text-[#1E1E24]">{o.name}</span>
                                </span>
                                <span className="shrink-0 text-xs text-violet-700">
                                  {Number(o.additionalPrice) > 0
                                    ? formatOptionDelta(o.additionalPrice)
                                    : ''}
                                </span>
                              </label>
                            ))
                          : g.options.map((o) => (
                              <label
                                key={o.id}
                                className={`flex min-w-0 cursor-pointer items-center justify-between gap-2 rounded-xl border px-3 py-2 text-sm transition ${
                                  picked.includes(o.id)
                                    ? 'border-violet-500 bg-violet-50/60'
                                    : 'border-gray-200 hover:border-violet-200'
                                }`}
                              >
                                <span className="flex min-w-0 items-center gap-2">
                                  <input
                                    type="checkbox"
                                    checked={picked.includes(o.id)}
                                    onChange={() => toggleMulti(g, o.id)}
                                    className="shrink-0 accent-violet-600"
                                  />
                                  <span className="truncate font-medium text-[#1E1E24]">{o.name}</span>
                                </span>
                                <span className="shrink-0 text-xs text-violet-700">
                                  {Number(o.additionalPrice) > 0
                                    ? formatOptionDelta(o.additionalPrice)
                                    : ''}
                                </span>
                              </label>
                            ))}
              </div>
                      {optionalSingle ? (
                        <button
                          type="button"
                          onClick={() => setSingle(g, '')}
                          className="text-xs font-medium text-gray-500 underline-offset-2 hover:text-violet-700 hover:underline"
                        >
                          Clear selection
                        </button>
            ) : null}
          </div>
                  );
                })}
        </div>

              {err ? <p className="mt-4 text-sm text-rose-600">{err}</p> : null}
      </div>

            <div className="space-y-3 border-t border-gray-100 bg-gray-50/90 px-4 py-3 shadow-[0_-6px_16px_rgba(0,0,0,0.04)]">
              <label className="block space-y-1.5">
                <span className="text-xs font-semibold uppercase tracking-wide text-gray-600">
                  Instructions <span className="font-normal normal-case text-gray-400">(optional)</span>
                </span>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={2}
                  placeholder="e.g. no onions, extra sauce…"
                  className="w-full resize-y rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-[#1E1E24] shadow-sm outline-none ring-violet-500/0 placeholder:text-gray-400 focus:border-violet-300 focus:ring-2 focus:ring-violet-500/20"
                />
              </label>
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs font-semibold uppercase tracking-wide text-gray-600">Quantity</span>
                <div className="inline-flex items-center rounded-xl border border-gray-200 bg-white p-0.5 shadow-sm">
                  <button
                    type="button"
                    onClick={() => bumpQty(-1)}
                    className="flex h-10 min-w-[2.75rem] items-center justify-center rounded-lg text-lg font-medium text-violet-700 transition hover:bg-violet-50"
                    aria-label="Decrease quantity"
                  >
                    −
                  </button>
                  <span className="min-w-[2.5rem] text-center text-sm font-semibold tabular-nums text-[#1E1E24]">
                    {Math.max(1, Math.floor(Number(qty) || 1))}
                  </span>
                  <button
                    type="button"
                    onClick={() => bumpQty(1)}
                    className="flex h-10 min-w-[2.75rem] items-center justify-center rounded-lg text-lg font-medium text-violet-700 transition hover:bg-violet-50"
                    aria-label="Increase quantity"
                  >
                    +
                  </button>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 rounded-xl border border-gray-200 bg-white py-2.5 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirm}
                  className="flex flex-[1.4] flex-col items-center justify-center gap-0.5 rounded-xl bg-violet-600 px-3 py-2.5 text-white shadow-md transition hover:bg-violet-700 sm:flex-row sm:gap-3"
                >
                  <span className="text-xs font-semibold tabular-nums opacity-95">
                    {formatCurrencyFixed2(unit * Math.max(1, Math.floor(Number(qty) || 1)))}
                  </span>
                  <span className="text-sm font-semibold">Add to cart</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function RoundMedia({ src, alt, fallbackLetter, sizeClass, rounded = 'rounded-xl', fillContainer = false }) {
  const [failed, setFailed] = useState(false);
  const letter = String(fallbackLetter || '?')
    .trim()
    .slice(0, 1)
    .toUpperCase() || '?';

  if (fillContainer) {
    if (!src || failed) {
  return (
        <div
          className={`absolute inset-0 flex items-center justify-center bg-gradient-to-br from-violet-100 to-indigo-100 text-base font-semibold text-violet-800 ${rounded}`}
          aria-hidden
        >
          {letter}
    </div>
      );
    }
    return (
      // eslint-disable-next-line @next/next/no-img-element -- remote API URLs; sizes vary by backend
      <img
        src={src}
        alt={alt || ''}
        className={`absolute inset-0 h-full w-full object-cover ${rounded}`}
        onError={() => setFailed(true)}
      />
    );
  }

  if (!src || failed) {
    return (
      <div
        className={`flex shrink-0 items-center justify-center ${rounded} bg-gradient-to-br from-violet-100 to-indigo-100 text-sm font-semibold text-violet-800 ${sizeClass}`}
        aria-hidden
      >
        {letter}
      </div>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element -- remote API URLs; sizes vary by backend
    <img
      src={src}
      alt={alt || ''}
      className={`${sizeClass} shrink-0 object-cover ${rounded}`}
      onError={() => setFailed(true)}
    />
  );
}

function ChoiceRow({ selected, onClick, leading, title, subtitle }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition-all active:scale-[0.99] ${
        selected
          ? 'border-violet-500 bg-violet-50/80 shadow-sm ring-1 ring-violet-500/20'
          : 'border-gray-200 bg-white hover:border-violet-200 hover:bg-violet-50/30'
      }`}
    >
      {leading}
      <div className="min-w-0 flex-1">
        <p className="truncate font-semibold text-[#1E1E24]">{title}</p>
        {subtitle ? <p className="truncate text-xs text-gray-500">{subtitle}</p> : null}
      </div>
      {selected ? <Check className="h-5 w-5 shrink-0 text-violet-600" aria-hidden /> : null}
    </button>
  );
}

function ReviewCard({ title, primary, secondary, media }) {
  return (
    <div className="flex gap-3 rounded-xl border border-gray-200 bg-white p-3 shadow-sm">
      {media}
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">{title}</p>
        <p className="mt-1 break-words text-sm font-semibold text-[#1E1E24]">{primary}</p>
        {secondary ? <p className="mt-0.5 break-words text-xs text-gray-500">{secondary}</p> : null}
      </div>
    </div>
  );
}


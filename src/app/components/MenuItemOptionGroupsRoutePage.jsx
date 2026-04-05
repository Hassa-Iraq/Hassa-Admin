'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import axios from 'axios';
import MenuItemOptionGroupsPanel from '@/app/components/MenuItemOptionGroupsPanel';

function normalizeListItem(raw, index) {
  const id = String(
    raw?.id ?? raw?.menu_item_id ?? raw?.item_id ?? `idx-${index}`
  ).trim();
  const name = String(raw?.name ?? raw?.title ?? raw?.item_name ?? 'Untitled').trim() || 'Untitled';
  return { id, name };
}

const DEFAULT_BASE = '/dashboard/foods/menu-item-options';

export default function MenuItemOptionGroupsRoutePage({ basePath = DEFAULT_BASE }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const menuItemIdFromUrl = String(searchParams.get('menu_item_id') || '').trim();

  const [items, setItems] = useState([]);
  const [loadingItems, setLoadingItems] = useState(true);
  const [listError, setListError] = useState('');

  const copy = useMemo(
    () => ({
      hint:
        'Sizes (pick one) and add-ons (pick many) share the same option groups. Set required, min, and max per group — same as on the full item editor.',
      selectHelp: 'Choose a menu item to manage its option groups.',
    }),
    []
  );

  const loadItems = useCallback(async () => {
    setLoadingItems(true);
    setListError('');
    try {
      const restaurantId =
        localStorage.getItem('restaurant_id') ||
        localStorage.getItem('selectedRestaurantId') ||
        '';
      const token = localStorage.getItem('token') || '';
      if (!restaurantId) {
        setItems([]);
        setListError('Restaurant ID not found. Please select a restaurant first.');
        return;
      }
      const params = new URLSearchParams({
        restaurant_id: restaurantId,
        page: '1',
        limit: '500',
      });
      const { data } = await axios.get(`/api/restaurants/menu-items?${params.toString()}`, {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      const payload = data?.data && typeof data.data === 'object' ? data.data : data;
      const list =
        payload?.menu_items ||
        payload?.menuItems ||
        payload?.items ||
        payload?.list ||
        data?.menu_items ||
        data?.items ||
        data?.list ||
        [];
      const rows = (Array.isArray(list) ? list : []).map(normalizeListItem).filter((r) => r.id);
      const byId = new Map();
      rows.forEach((r) => {
        if (!byId.has(r.id)) byId.set(r.id, r);
      });
      setItems(Array.from(byId.values()));
    } catch (e) {
      setItems([]);
      setListError(
        axios.isAxiosError(e)
          ? e.response?.data?.message || e.message || 'Failed to load menu items'
          : e?.message || 'Failed to load menu items'
      );
    } finally {
      setLoadingItems(false);
    }
  }, []);

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  const onItemChange = (nextId) => {
    const id = String(nextId || '').trim();
    if (id) {
      router.replace(`${basePath}?menu_item_id=${encodeURIComponent(id)}`);
    } else {
      router.replace(basePath);
    }
  };

  return (
    <div className="pt-36 pb-8">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <p className="max-w-2xl text-[11px] text-gray-500">{copy.hint}</p>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/dashboard/foods/list"
            className="text-xs font-semibold text-[#7C3AED] hover:text-[#6D28D9]"
          >
            ← Food list
          </Link>
          {menuItemIdFromUrl ? (
            <Link
              href={`/dashboard/foods/add?menu_item_id=${encodeURIComponent(menuItemIdFromUrl)}`}
              className="text-xs font-semibold text-gray-600 underline-offset-2 hover:text-[#7C3AED]"
            >
              Open full item editor
            </Link>
          ) : null}
        </div>
      </div>

      <section className="rounded-xl border border-gray-200 bg-white p-4">
        <label className="mb-1.5 block text-[11px] font-medium text-gray-700">Menu item</label>
        <p className="mb-2 text-[11px] text-gray-500">{copy.selectHelp}</p>
        <select
          value={menuItemIdFromUrl}
          onChange={(e) => onItemChange(e.target.value)}
          disabled={loadingItems}
          className="w-full max-w-md rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 focus:border-[#7C3AED] focus:outline-none disabled:opacity-60"
        >
          <option value="">{loadingItems ? 'Loading items…' : 'Select a menu item…'}</option>
          {items.map((row) => (
            <option key={row.id} value={row.id}>
              {row.name}
            </option>
          ))}
        </select>
        {listError ? <p className="mt-2 text-xs text-red-600">{listError}</p> : null}
      </section>

      {menuItemIdFromUrl ? (
        <div className="mt-4">
          <MenuItemOptionGroupsPanel menuItemId={menuItemIdFromUrl} />
        </div>
      ) : (
        <p className="mt-6 rounded-lg border border-dashed border-gray-200 bg-gray-50/80 px-4 py-6 text-center text-sm text-gray-500">
          Choose a menu item above to load <span className="font-semibold">Options &amp; Add-ons</span> for
          that dish.
        </p>
      )}
    </div>
  );
}

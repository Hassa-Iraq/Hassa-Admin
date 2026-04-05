import { redirect } from 'next/navigation';

/** Old URL — option groups are unified under menu-item-options. */
export default async function MenuItemAddonsRedirectPage({ searchParams }) {
  const sp = await searchParams;
  const raw = sp?.menu_item_id;
  const id = Array.isArray(raw) ? raw[0] : raw;
  const q =
    id != null && String(id).trim()
      ? `?menu_item_id=${encodeURIComponent(String(id).trim())}`
      : '';
  redirect(`/dashboard/foods/menu-item-options${q}`);
}

import { redirect } from 'next/navigation';

/** Push notifications were removed from the sidebar; old links land on Banners (Marketing). */
export default function MarketingNotificationsRedirectPage() {
  redirect('/dashboard/banners/list');
}

import { redirect } from 'next/navigation';

export default function DispatchIndexPage() {
  redirect('/dashboard/dispatch/searching');
}

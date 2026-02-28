import { redirect } from 'next/navigation';

export default function OrderRefundIndexPage() {
  redirect('/dashboard/order-refund/new-request');
}

/**
 * Maps backend order status strings to dashboard labels used in OrdersListTable badges.
 * Backend may use e.g. "confirmed" / "preparing" while the UI uses "Accepted" / "Processing".
 */
const KNOWN_UI_LABELS = new Set([
  'Scheduled',
  'Pending',
  'Accepted',
  'Processing',
  'Food On The Way',
  'Delivered',
  'Cancelled',
  'Refunded',
  'Offline Payments',
  'Payments Failed',
]);

const API_TO_UI = {
  pending: 'Pending',
  confirmed: 'Accepted',
  accepted: 'Accepted',
  processing: 'Processing',
  preparing: 'Processing',
  scheduled: 'Scheduled',
  ready_for_pickup: 'Processing',
  'ready-for-pickup': 'Processing',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
  canceled: 'Cancelled',
  refunded: 'Refunded',
  'food on the way': 'Food On The Way',
  food_on_the_way: 'Food On The Way',
  'food-on-the-way': 'Food On The Way',
  out_for_delivery: 'Food On The Way',
  'out-for-delivery': 'Food On The Way',
  on_the_way: 'Food On The Way',
  offline: 'Offline Payments',
  'offline payment': 'Offline Payments',
  'offline payments': 'Offline Payments',
  'payments failed': 'Payments Failed',
  payments_failed: 'Payments Failed',
  'payments-failed': 'Payments Failed',
  payment_failed: 'Payments Failed',
};

function humanizeApiStatus(raw) {
  const s = String(raw ?? '').trim();
  if (!s) return 'Pending';
  return s
    .replace(/_/g, ' ')
    .replace(/-/g, ' ')
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
}

export function mapApiOrderStatusToUiLabel(value) {
  const raw = String(value ?? '').trim();
  if (!raw) return 'Pending';
  const lower = raw.toLowerCase();
  if (API_TO_UI[lower]) return API_TO_UI[lower];
  if (KNOWN_UI_LABELS.has(raw)) return raw;
  return humanizeApiStatus(raw);
}

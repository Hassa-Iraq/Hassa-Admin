'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Topbar from '@/app/components/Topbar';
import {
  AlertCircle,
  Bike,
  Loader2,
  Printer,
  Phone,
  Mail,
  MapPin,
  Store,
  X,
} from 'lucide-react';
import { formatPhoneWithFlag } from '@/app/lib/phone';
import { API_BASE_URL } from '@/app/config';
import { APP_CURRENCY } from '@/app/lib/currency';
import { mapApiOrderStatusToUiLabel } from '@/app/lib/orderStatus';
import {
  isUsableLatLng,
  parseLatLng,
  parseLatLngFromRecord,
  resolveDeliveryAssignmentOrderId,
} from '@/app/lib/geo';
import { CenteredSpinner } from '@/app/components/LoadingSpinner';
import AssignDeliveryModal from '@/app/components/AssignDeliveryModal';

function pickNonEmptyString(...values) {
  for (const v of values) {
    if (typeof v === 'string' && v.trim()) return v.trim();
  }
  return '';
}

function normalizeAssignedDriverFromOrder(order) {
  if (!order || typeof order !== 'object') return null;

  const unwrap = (raw) => {
    if (raw == null) return null;
    if (Array.isArray(raw)) return raw[0] && typeof raw[0] === 'object' ? raw[0] : null;
    if (typeof raw === 'object') return raw;
    return null;
  };

  const deliveryBlock = order.delivery && typeof order.delivery === 'object' ? order.delivery : null;

  const candidates = [
    unwrap(deliveryBlock?.driver),
    unwrap(order.delivery_man),
    unwrap(order.deliveryman),
    unwrap(order.delivery_partner),
    unwrap(order.assigned_driver),
    unwrap(order.driver),
    unwrap(order.rider),
    unwrap(order.delivery_driver),
    unwrap(order.delivery_details?.driver),
    unwrap(order.delivery_assignment?.driver),
    unwrap(order.delivery_assignment),
    unwrap(order.assignment?.driver),
  ].filter((x) => x != null && typeof x === 'object');

  const dm = candidates[0];

  const buildExtras = (d) => {
    if (!d || typeof d !== 'object') {
      return {
        email: '',
        vehicleType: '',
        vehicleNumber: '',
        role: '',
        ownerType: '',
        approvalStatus: '',
        totalOrders: null,
        isActive: null,
      };
    }
    const totalRaw = d.total_orders ?? d.totalOrders;
    const totalOrders = Number.isFinite(Number(totalRaw)) ? Number(totalRaw) : null;
    return {
      email: pickNonEmptyString(d.email, d.user?.email),
      vehicleType: pickNonEmptyString(d.vehicle_type, d.vehicleType),
      vehicleNumber: pickNonEmptyString(d.vehicle_number, d.vehicleNumber),
      role: pickNonEmptyString(d.role),
      ownerType: pickNonEmptyString(d.owner_type, d.ownerType),
      approvalStatus: pickNonEmptyString(d.approval_status, d.approvalStatus),
      totalOrders,
      isActive: typeof d.is_active === 'boolean' ? d.is_active : typeof d.isActive === 'boolean' ? d.isActive : null,
    };
  };

  const deliveryMeta = deliveryBlock
    ? {
        assignmentStatus: pickNonEmptyString(deliveryBlock.status, deliveryBlock.state),
        assignedAt: deliveryBlock.assigned_at || deliveryBlock.assignedAt || null,
        pickupLine: pickNonEmptyString(deliveryBlock.pickup_address),
        dropLine: pickNonEmptyString(deliveryBlock.delivery_address),
        jobNotes: pickNonEmptyString(deliveryBlock.delivery_notes, deliveryBlock.notes),
      }
    : {
        assignmentStatus: '',
        assignedAt: null,
        pickupLine: '',
        dropLine: '',
        jobNotes: '',
      };

  if (dm) {
    const driverUserId = pickNonEmptyString(
      String(dm.user_id ?? ''),
      String(dm.driver_user_id ?? ''),
      String(dm.id ?? ''),
      String(dm.driver_id ?? ''),
      deliveryBlock ? String(deliveryBlock.driver_user_id ?? '') : ''
    );
    const name =
      pickNonEmptyString(dm.full_name, dm.name, dm.driver_name, dm.user?.full_name, dm.user?.name) || '';
    const phone = pickNonEmptyString(dm.phone, dm.mobile, dm.contact_phone, dm.user?.phone);
    const avatar = pickNonEmptyString(
      dm.image_url,
      dm.driver_image_url,
      dm.avatar,
      dm.profile_picture_url,
      dm.photo,
      dm.picture
    );
    if (!name && !driverUserId) return null;
    return {
      driverUserId,
      name: name || 'Delivery partner',
      phone,
      avatar,
      ...buildExtras(dm),
      ...deliveryMeta,
    };
  }

  const driverUserId = pickNonEmptyString(
    String(order.driver_user_id ?? ''),
    String(order.delivery_man_id ?? ''),
    String(order.deliveryman_id ?? ''),
    String(order.delivery_man_user_id ?? ''),
    String(order.assigned_driver_id ?? ''),
    deliveryBlock ? String(deliveryBlock.driver_user_id ?? '') : ''
  );
  const name = pickNonEmptyString(
    order.driver_name,
    order.delivery_man_name,
    order.deliveryman_name,
    order.rider_name,
    order.assigned_driver_name
  );
  const phone = pickNonEmptyString(
    order.driver_phone,
    order.delivery_man_phone,
    order.deliveryman_phone,
    order.rider_phone
  );
  const avatar = pickNonEmptyString(
    order.driver_image_url,
    order.driver_avatar,
    order.delivery_man_image,
    order.deliveryman_image
  );

  if (!driverUserId && !name) return null;
  return {
    driverUserId,
    name: name || 'Delivery partner',
    phone,
    avatar,
    ...buildExtras({}),
    ...deliveryMeta,
  };
}

/** When lat/lng are missing, open Maps search from address text (same UX as precise coordinates). */
function googleMapsSearchFromAddress(addressText) {
  const q = String(addressText || '').trim();
  if (q.length < 4 || q === '—' || q === '-' || q === 'Customer address' || q === 'Restaurant kitchen') return '';
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;
}

const toAbsoluteAssetUrl = (value) => {
  if (!value || typeof value !== 'string') return '';
  const trimmed = value.trim();
  if (!trimmed) return '';
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed;
  if (trimmed.startsWith('//')) return `https:${trimmed}`;
  if (trimmed.startsWith('/')) return `${API_BASE_URL}${trimmed}`;
  return `${API_BASE_URL}/${trimmed}`;
};

const humanizeEnum = (value) => {
  const raw = String(value ?? '').trim();
  if (!raw) return '';
  return raw
    .replace(/_/g, ' ')
    .replace(/-/g, ' ')
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
};

const toOrderTypeUi = (orderTypeValue) => {
  const raw = String(orderTypeValue || '').toLowerCase();
  if (!raw) return '—';
  if (raw.includes('dine')) return 'Dine In';
  if (raw.includes('delivery')) return 'Home Delivery';
  return humanizeEnum(orderTypeValue) || '—';
};

/** Preferred order for known delivery_address keys; any extra keys from API are appended after. */
const DELIVERY_KEY_ORDER = [
  'complete_address',
  'line1',
  'line2',
  'house',
  'road',
  'floor',
  'area',
  'city',
  'state',
  'province',
  'postal_code',
  'zip',
  'country',
  'category',
  'landmark',
  'location_details',
  'contact_name',
  'contact_phone',
  'contact_email',
  'latitude',
  'longitude',
];

/** Internal IDs — not shown in Delivery Info */
const DELIVERY_KEYS_HIDDEN_FROM_UI = new Set(['address_id', 'delivery_address_id']);

const DELIVERY_FIELD_LABELS = {
  complete_address: 'Complete address',
  category: 'Address type',
  landmark: 'Landmark',
  location_details: 'Location details',
  latitude: 'Latitude',
  longitude: 'Longitude',
  lat: 'Latitude',
  lng: 'Longitude',
  line1: 'Address line 1',
  line2: 'Address line 2',
  house: 'House / building',
  road: 'Road',
  floor: 'Floor',
  area: 'Area',
  city: 'City',
  state: 'State / province',
  province: 'Province',
  postal_code: 'Postal code',
  zip: 'ZIP code',
  country: 'Country',
  contact_name: 'Contact name',
  contact_phone: 'Contact phone',
  contact_email: 'Contact email',
};

// Temporary: hide delivery proof section from UI.
const ENABLE_DELIVERY_PROOF = false;

/** Backend order lifecycle — values sent to PATCH `/api/orders/:id/status`. */
const ORDER_STATUS_FLOW_LABELS = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  preparing: 'Preparing',
  ready_for_pickup: 'Ready for Pickup',
  out_for_delivery: 'Out for delivery',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};

/**
 * Allowed next statuses per current status (matches backend ALLOWED_NEXT_STATUSES).
 */
const ALLOWED_NEXT_ORDER_STATUSES = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['preparing', 'cancelled'],
  preparing: ['ready_for_pickup', 'cancelled'],
  ready_for_pickup: ['out_for_delivery', 'cancelled'],
  out_for_delivery: ['delivered', 'cancelled'],
  delivered: [],
  cancelled: [],
};

function normalizeOrderStatusValue(raw) {
  if (raw == null || raw === '') return 'pending';
  let s = String(raw).trim().toLowerCase().replace(/-/g, '_').replace(/\s+/g, '_');
  const alias = {
    canceled: 'cancelled',
    food_on_the_way: 'out_for_delivery',
    on_the_way: 'out_for_delivery',
    processing: 'preparing',
    handover: 'ready_for_pickup',
    accepted: 'confirmed',
  };
  if (alias[s]) s = alias[s];
  return s;
}

const ASSIGN_DELIVERY_STATUSES = new Set(['confirmed', 'preparing', 'ready_for_pickup', 'out_for_delivery']);

function titleCaseDeliveryKey(key) {
  return String(key || '')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatDeliveryFieldValue(value) {
  if (value === null || value === undefined) return '—';
  if (value === '') return '—';
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (typeof value === 'number') return Number.isFinite(value) ? String(value) : '—';
  if (Array.isArray(value)) return value.length ? value.map((v) => formatDeliveryFieldValue(v)).join(', ') : '—';
  if (typeof value === 'object') {
    try {
      return JSON.stringify(value);
    } catch {
      return '—';
    }
  }
  return String(value);
}

function buildDeliveryDisplayRows(delivery) {
  const d = delivery && typeof delivery === 'object' ? delivery : {};
  const keys = Object.keys(d);
  if (keys.length === 0) return [];

  const skip = new Set();
  if (
    d.latitude != null &&
    d.lat != null &&
    Number(d.latitude) === Number(d.lat)
  ) {
    skip.add('lat');
  }
  if (
    d.longitude != null &&
    d.lng != null &&
    Number(d.longitude) === Number(d.lng)
  ) {
    skip.add('lng');
  }

  const ordered = [
    ...DELIVERY_KEY_ORDER.filter((k) => keys.includes(k)),
    ...keys
      .filter((k) => !DELIVERY_KEY_ORDER.includes(k))
      .sort((a, b) => a.localeCompare(b)),
  ].filter(
    (k) => keys.includes(k) && !skip.has(k) && !DELIVERY_KEYS_HIDDEN_FROM_UI.has(k)
  );

  return ordered.map((key) => ({
    key,
    label: DELIVERY_FIELD_LABELS[key] || titleCaseDeliveryKey(key),
    value: formatDeliveryFieldValue(d[key]),
  }));
}

export default function OrderDetailPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const [orderPayload, setOrderPayload] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const hasAutoPrintedRef = useRef(false);
  const [isProofModalOpen, setIsProofModalOpen] = useState(false);
  const [proofFile, setProofFile] = useState(null);
  const [proofPreviewUrl, setProofPreviewUrl] = useState('');
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [pendingApiStatus, setPendingApiStatus] = useState('');
  const [statusReason, setStatusReason] = useState('');
  const [statusSaving, setStatusSaving] = useState(false);
  const [statusActionError, setStatusActionError] = useState('');
  const [selectStatusValue, setSelectStatusValue] = useState('pending');
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [geocodedPickup, setGeocodedPickup] = useState(null);
  const [geocodedDelivery, setGeocodedDelivery] = useState(null);

  const orderId = useMemo(() => {
    const rawId = params?.id;
    if (Array.isArray(rawId)) return rawId[0];
    return rawId || '';
  }, [params?.id]);

  const loadOrderDetails = useCallback(async () => {
    if (!orderId) return;
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      /** Order Service: GET /api/orders/:order_id */
      const response = await fetch(`/api/orders/${encodeURIComponent(orderId)}`, {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.message || 'Failed to fetch order details');
      }

      setOrderPayload(data);
    } catch (err) {
      setError(err?.message || 'Failed to fetch order details');
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    loadOrderDetails();
  }, [loadOrderDetails]);

  const refreshOrderPayload = useCallback(async () => {
    if (!orderId) return;
    const token = localStorage.getItem('token');
    const response = await fetch(`/api/orders/${encodeURIComponent(orderId)}`, {
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data?.message || 'Failed to refresh order');
    }
    setOrderPayload(data);
  }, [orderId]);

  useEffect(() => {
    if (hasAutoPrintedRef.current) return;
    const shouldAutoPrint = searchParams?.get('print') === '1';
    if (!shouldAutoPrint) return;
    if (loading || error) return;

    hasAutoPrintedRef.current = true;
    window.setTimeout(() => window.print(), 150);
  }, [searchParams, loading, error]);

  useEffect(() => {
    return () => {
      if (proofPreviewUrl) URL.revokeObjectURL(proofPreviewUrl);
    };
  }, [proofPreviewUrl]);

  const order = useMemo(() => {
    const payload = orderPayload || {};
    return (
      payload?.data?.order ||
      payload?.order ||
      payload?.data ||
      {}
    );
  }, [orderPayload]);

  const currentApiStatus = useMemo(() => normalizeOrderStatusValue(order?.status), [order?.status]);

  const statusSelectOptions = useMemo(() => {
    const current = currentApiStatus;
    const nextAllowed = ALLOWED_NEXT_ORDER_STATUSES[current];

    if (nextAllowed === undefined) {
      return [
        {
          value: current,
          label:
            ORDER_STATUS_FLOW_LABELS[current] ||
            mapApiOrderStatusToUiLabel(order?.status || current) ||
            humanizeEnum(current),
        },
      ];
    }

    const values = new Set([current, ...nextAllowed]);
    return Array.from(values).map((value) => ({
      value,
      label: ORDER_STATUS_FLOW_LABELS[value] || humanizeEnum(value),
    }));
  }, [currentApiStatus, order?.status]);

  const canChangeOrderStatus = useMemo(() => {
    const next = ALLOWED_NEXT_ORDER_STATUSES[currentApiStatus];
    return Array.isArray(next) && next.length > 0;
  }, [currentApiStatus]);

  useEffect(() => {
    setSelectStatusValue(currentApiStatus);
  }, [currentApiStatus]);

  const customer = useMemo(() => {
    const direct = order?.customer || order?.user;
    return direct && typeof direct === 'object' ? direct : {};
  }, [order]);

  const restaurant = useMemo(() => {
    const direct = order?.restaurant;
    return direct && typeof direct === 'object' ? direct : {};
  }, [order]);

  const delivery = useMemo(() => {
    const addr =
      order?.delivery_address && typeof order.delivery_address === 'object'
        ? { ...order.delivery_address }
        : {};
    return addr;
  }, [order?.delivery_address]);

  const deliveryDisplayRows = useMemo(() => buildDeliveryDisplayRows(delivery), [delivery]);

  const items = useMemo(
    () => (Array.isArray(order?.items) ? order.items : []),
    [order?.items]
  );
  const restaurantImage =
    toAbsoluteAssetUrl(
      restaurant?.logo_url ||
      restaurant?.cover_image_url ||
      restaurant?.logo ||
      restaurant?.image ||
      ''
    );

  const customerName =
    order?.customer_name ||
    customer?.name ||
    customer?.full_name ||
    `${customer?.f_name || customer?.first_name || ''} ${customer?.l_name || customer?.last_name || ''}`.trim() ||
    'N/A';
  const customerPhone =
    order?.customer_phone ||
    customer?.phone ||
    delivery?.contact_phone ||
    '-';
  const customerEmail =
    order?.customer_email ||
    customer?.email ||
    delivery?.contact_email ||
    '-';
  const restaurantName =
    order?.restaurant_name ||
    restaurant?.name ||
    'N/A';
  const ownerPhone = restaurant?.owner?.phone || restaurant?.owner_phone || '';
  const ownerEmail = restaurant?.owner?.email || restaurant?.owner_email || '';
  const restaurantPhone =
    restaurant?.phone ||
    ownerPhone ||
    '-';
  const restaurantAddress =
    [restaurant?.address, restaurant?.zone].filter(Boolean).join(', ') ||
    [delivery?.line1, delivery?.area, delivery?.city].filter(Boolean).join(', ') ||
    '-';

  const placedDate = order?.placed_at || order?.created_at || order?.date;
  const formattedDate = placedDate
    ? new Date(placedDate).toLocaleString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : '-';

  const paymentType = humanizeEnum(order?.payment_type || order?.paymentType || '');
  const paymentStatus = humanizeEnum(order?.payment_status || order?.paymentStatus || '') || '—';
  const orderStatus = order?.status
    ? mapApiOrderStatusToUiLabel(order.status)
    : '-';
  const paymentMethod = humanizeEnum(order?.payment_method || order?.paymentMethod || '') || paymentType || '—';
  const referenceCode = order?.reference_code || order?.reference || '-';
  const orderType = toOrderTypeUi(order?.order_type || order?.delivery_type || order?.type);
  const cutleryRaw = order?.need_cutlery ?? order?.cutlery ?? order?.is_cutlery_required;
  const cutlery = cutleryRaw === true || cutleryRaw === 'yes' ? 'Yes' : 'No';

  const subtotal = Number(order?.subtotal || 0);
  const addonCost = Number(order?.addon_cost || 0);
  const discountAmount = Number(order?.discount_amount || 0);
  const couponDiscount = Number(order?.coupon_discount || 0);
  const taxAmount = Number(order?.tax_amount || 0);
  const deliveryFee = Number(order?.delivery_fee || 0);
  const serviceCharges = Number(order?.service_charges || 0);
  const totalAmount = Number(order?.total_amount || 0);
  const toCurrency = (value) =>
    `${order?.currency || APP_CURRENCY} ${Number(value || 0).toFixed(2)}`;
  const statusKey = String(orderStatus || '').toLowerCase();
  const paymentKey = String(paymentStatus || '').toLowerCase();
  const orderStatusClass =
    statusKey === 'delivered'
      ? 'bg-emerald-50 text-emerald-700'
      : statusKey === 'cancelled'
      ? 'bg-rose-50 text-rose-700'
      : statusKey === 'pending'
      ? 'bg-amber-50 text-amber-700'
      : statusKey === 'accepted'
      ? 'bg-blue-50 text-blue-700'
      : statusKey === 'processing'
      ? 'bg-indigo-50 text-indigo-700'
      : statusKey === 'ready for pickup'
      ? 'bg-cyan-50 text-cyan-800'
      : statusKey === 'food on the way'
      ? 'bg-purple-50 text-purple-700'
      : statusKey === 'scheduled'
      ? 'bg-yellow-50 text-yellow-700'
      : statusKey === 'refunded'
      ? 'bg-orange-50 text-orange-700'
      : statusKey === 'offline payments'
      ? 'bg-slate-50 text-slate-700'
      : statusKey === 'payments failed'
      ? 'bg-pink-50 text-pink-700'
      : 'bg-slate-50 text-slate-700';
  const paymentStatusClass =
    paymentKey === 'paid'
      ? 'text-emerald-600'
      : paymentKey === 'unpaid'
      ? 'text-amber-600'
      : paymentKey === 'failed'
      ? 'text-rose-600'
    : paymentKey === 'refunded'
      ? 'text-indigo-600'
    : paymentKey === 'cash'
      ? 'text-emerald-600'
    : paymentKey === 'wallet'
      ? 'text-purple-600'
    : paymentKey === 'card'
      ? 'text-indigo-600'
      : 'text-gray-600';
  const customerImage = toAbsoluteAssetUrl(
    customer?.profile_picture_url ||
    customer?.image_url ||
    customer?.image ||
    ''
  );
  const deliveryAddressText =
    delivery?.complete_address ||
    delivery?.line1 ||
    [delivery?.house, delivery?.road, delivery?.floor, delivery?.area, delivery?.city].filter(Boolean).join(', ') ||
    '—';

  const orderTypeRaw = useMemo(
    () => String(order?.order_type || order?.delivery_type || order?.type || '').toLowerCase(),
    [order?.order_type, order?.delivery_type, order?.type]
  );
  const isDeliveryOrder = useMemo(() => {
    const label = String(orderType || '').toLowerCase();
    return (
      orderTypeRaw.includes('delivery') ||
      orderTypeRaw.includes('home') ||
      label.includes('home') ||
      label.includes('delivery')
    );
  }, [orderTypeRaw, orderType]);

  const showAssignDelivery = useMemo(
    () => isDeliveryOrder && ASSIGN_DELIVERY_STATUSES.has(currentApiStatus),
    [isDeliveryOrder, currentApiStatus]
  );

  const assignedDriver = useMemo(() => normalizeAssignedDriverFromOrder(order), [order]);

  const assignmentIds = useMemo(() => resolveDeliveryAssignmentOrderId(orderId, order), [orderId, order]);

  const pickupFromApi = useMemo(() => {
    const fromRestaurant = parseLatLngFromRecord(restaurant);
    if (fromRestaurant) return fromRestaurant;
    const orderLevel = [
      parseLatLng(order?.pickup_latitude, order?.pickup_longitude),
      parseLatLng(order?.pickup_lat, order?.pickup_lng),
      parseLatLng(order?.pickupLatitude, order?.pickupLongitude),
      parseLatLngFromRecord(order?.pickup_location),
      parseLatLngFromRecord(order?.branch),
      parseLatLng(order?.restaurant_latitude, order?.restaurant_longitude),
      parseLatLng(
        order?.restaurant_location?.latitude ?? order?.restaurant_location?.lat,
        order?.restaurant_location?.longitude ?? order?.restaurant_location?.lng
      ),
      parseLatLng(order?.restaurant?.latitude ?? order?.restaurant?.lat, order?.restaurant?.longitude ?? order?.restaurant?.lng),
    ].find(Boolean);
    if (orderLevel) return orderLevel;
    return null;
  }, [restaurant, order]);

  const deliveryFromApi = useMemo(() => {
    const addressBlocks = [
      order?.delivery_address,
      order?.shipping_address,
      order?.dropoff_address,
      order?.drop_address,
      order?.customer_address,
    ];
    for (const block of addressBlocks) {
      if (block && typeof block === 'object') {
        const p = parseLatLngFromRecord(block);
        if (p) return p;
      }
    }
    const fromMergedDelivery = parseLatLngFromRecord(delivery);
    if (fromMergedDelivery) return fromMergedDelivery;
    return (
      parseLatLng(order?.delivery_latitude, order?.delivery_longitude) ||
      parseLatLng(order?.deliveryLatitude, order?.deliveryLongitude) ||
      parseLatLng(order?.drop_latitude, order?.drop_longitude) ||
      parseLatLng(order?.customer_latitude, order?.customer_longitude) ||
      parseLatLngFromRecord(order?.delivery_location) ||
      parseLatLngFromRecord(customer?.default_address) ||
      parseLatLngFromRecord(customer?.address) ||
      null
    );
  }, [delivery, order, customer]);

  /** Restaurant / pickup pin — never use customer delivery coords here. */
  const pickupMapsUrl = useMemo(() => {
    const p =
      pickupFromApi ||
      (geocodedPickup && isUsableLatLng(geocodedPickup.lat, geocodedPickup.lng) ? geocodedPickup : null);
    if (!p) return '';
    return `https://www.google.com/maps?q=${p.lat},${p.lng}`;
  }, [pickupFromApi, geocodedPickup]);

  const deliveryMapsUrl = useMemo(() => {
    const p =
      deliveryFromApi ||
      (geocodedDelivery && isUsableLatLng(geocodedDelivery.lat, geocodedDelivery.lng) ? geocodedDelivery : null) ||
      parseLatLng(delivery?.latitude ?? delivery?.lat, delivery?.longitude ?? delivery?.lng) ||
      parseLatLng(order?.delivery_latitude, order?.delivery_longitude);
    if (!p) return '';
    return `https://www.google.com/maps?q=${p.lat},${p.lng}`;
  }, [deliveryFromApi, geocodedDelivery, delivery, order?.delivery_latitude, order?.delivery_longitude]);

  const pickupMapHref = useMemo(() => {
    if (pickupMapsUrl) return pickupMapsUrl;
    const addr =
      String(restaurantAddress || '').trim() ||
      String(order?.pickup_address || order?.pickup_address_line || '').trim();
    return googleMapsSearchFromAddress(addr);
  }, [pickupMapsUrl, restaurantAddress, order?.pickup_address, order?.pickup_address_line]);

  const deliveryMapHref = useMemo(() => {
    if (deliveryMapsUrl) return deliveryMapsUrl;
    return googleMapsSearchFromAddress(deliveryAddressText);
  }, [deliveryMapsUrl, deliveryAddressText]);

  const assignPickupAddressDefault = useMemo(() => {
    const addr = String(restaurantAddress || '').trim();
    if (addr && addr !== '—') return addr;
    const orderPickup = String(order?.pickup_address || order?.pickup_address_line || '').trim();
    if (orderPickup) return orderPickup;
    return 'Restaurant kitchen';
  }, [restaurantAddress, order?.pickup_address, order?.pickup_address_line]);

  const assignDeliveryAddressDefault = useMemo(() => {
    if (deliveryAddressText && deliveryAddressText !== '—') return deliveryAddressText;
    return 'Customer address';
  }, [deliveryAddressText]);

  const assignDeliveryNotesDefault = useMemo(
    () => String(order?.notes || order?.delivery_notes || '').trim(),
    [order?.notes, order?.delivery_notes]
  );

  useEffect(() => {
    if (pickupFromApi) {
      setGeocodedPickup(null);
      return;
    }
    const q = assignPickupAddressDefault?.trim();
    if (!q || q === 'Restaurant kitchen' || q === '—') {
      setGeocodedPickup(null);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/geocode?q=${encodeURIComponent(q)}`);
        const data = await res.json().catch(() => ({}));
        if (cancelled) return;
        if (res.ok && data.lat != null && data.lng != null) {
          setGeocodedPickup({ lat: Number(data.lat), lng: Number(data.lng) });
        } else {
          setGeocodedPickup(null);
        }
      } catch {
        if (!cancelled) setGeocodedPickup(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [pickupFromApi, assignPickupAddressDefault]);

  useEffect(() => {
    if (deliveryFromApi) {
      setGeocodedDelivery(null);
      return;
    }
    const q = assignDeliveryAddressDefault?.trim();
    if (!q || q === 'Customer address' || q === '—') {
      setGeocodedDelivery(null);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/geocode?q=${encodeURIComponent(q)}`);
        const data = await res.json().catch(() => ({}));
        if (cancelled) return;
        if (res.ok && data.lat != null && data.lng != null) {
          setGeocodedDelivery({ lat: Number(data.lat), lng: Number(data.lng) });
        } else {
          setGeocodedDelivery(null);
        }
      } catch {
        if (!cancelled) setGeocodedDelivery(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [deliveryFromApi, assignDeliveryAddressDefault]);

  const pickupLat = pickupFromApi?.lat ?? geocodedPickup?.lat ?? null;
  const pickupLng = pickupFromApi?.lng ?? geocodedPickup?.lng ?? null;
  const deliveryLat = deliveryFromApi?.lat ?? geocodedDelivery?.lat ?? null;
  const deliveryLng = deliveryFromApi?.lng ?? geocodedDelivery?.lng ?? null;

  return (
    <>
      <Topbar
        title="Order Details"
        subtitle="Manage all active and scheduled orders"
      />

      <div className="pt-36 px-6 pb-10">
        {ENABLE_DELIVERY_PROOF && isProofModalOpen && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
            role="dialog"
            aria-modal="true"
            aria-label="Add delivery proof"
            onMouseDown={() => setIsProofModalOpen(false)}
          >
            <div
              className="w-full max-w-3xl rounded-2xl bg-white shadow-xl"
              onMouseDown={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
                <h3 className="text-sm font-semibold text-[#1E1E24]">Add delivery proof</h3>
                <button
                  type="button"
                  onClick={() => setIsProofModalOpen(false)}
                  className="rounded-lg p-2 text-gray-500 hover:bg-gray-100"
                  aria-label="Close"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="px-6 py-5">
                <p className="mb-2 text-xs font-semibold text-gray-500">Upload image</p>

                <label className="flex min-h-[180px] w-full cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 bg-gray-50 px-4 py-8 text-center">
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0] || null;
                      setProofFile(file);
                      if (proofPreviewUrl) URL.revokeObjectURL(proofPreviewUrl);
                      setProofPreviewUrl(file ? URL.createObjectURL(file) : '');
                    }}
                  />

                  {proofPreviewUrl ? (
                    <img
                      src={proofPreviewUrl}
                      alt="Delivery proof preview"
                      className="h-40 w-full max-w-[520px] rounded-lg object-cover"
                    />
                  ) : (
                    <p className="text-xs text-gray-400">Click to select an image</p>
                  )}
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 border-t border-gray-200 px-6 py-4">
                <button
                  type="button"
                  onClick={() => {
                    setIsProofModalOpen(false);
                    setProofFile(null);
                    if (proofPreviewUrl) URL.revokeObjectURL(proofPreviewUrl);
                    setProofPreviewUrl('');
                  }}
                  className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={!proofFile}
                  onClick={() => {
                    // UI-only for now: close modal after selecting.
                    setIsProofModalOpen(false);
                    setProofFile(null);
                    if (proofPreviewUrl) URL.revokeObjectURL(proofPreviewUrl);
                    setProofPreviewUrl('');
                  }}
                  className="rounded-lg bg-[#7C3AED] px-6 py-2 text-xs font-semibold text-white hover:bg-[#6D28D9] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Submit
                </button>
              </div>
            </div>
          </div>
        )}

        {loading && (
          <div className="rounded-xl border border-gray-200 bg-white p-6">
            <CenteredSpinner minHeight="12rem" label="Loading order details" />
          </div>
        )}
        {!loading && error && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-600">
            {error}
          </div>
        )}
        {!loading && !error && (
        <div className="rounded-2xl border border-gray-200 bg-[#FCFCFF] p-3 md:p-4">
          <div className="grid grid-cols-12 gap-4">
            <div className="col-span-12 order-2 min-w-0 lg:order-1 lg:col-span-8">
              <div className="rounded-xl bg-white p-4">
                <div className="grid min-w-0 grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(240px,280px)] xl:gap-8">
                  <div className="min-w-0">
                    <div
                      className="break-words text-xs font-semibold leading-snug text-[#1E1E24]"
                      role="heading"
                      aria-level={2}
                    >
                      Order ID # {order?.order_number || order?.id || orderId}
                    </div>
                    <p className="mt-2 text-sm text-gray-500">Placed Date : {formattedDate}</p>

                    <p className="mt-3 flex min-w-0 flex-wrap items-center gap-2 text-sm">
                      <Store size={14} className="shrink-0 text-gray-500" />
                      <span className="font-medium">Restaurant :</span>
                      <span className="min-w-0 break-words text-purple-600">{restaurantName}</span>
                    </p>
                    {pickupMapHref ? (
                      <a
                        href={pickupMapHref}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-2 inline-flex text-xs font-semibold text-purple-700 hover:underline"
                      >
                        Open restaurant address in Google Maps
                      </a>
                    ) : (
                      <p className="mt-2 text-xs text-gray-400">Add a restaurant address to open in Maps.</p>
                    )}
                  </div>

                  <div className="min-w-0 space-y-3 text-sm xl:border-l xl:border-gray-100 xl:pl-6">
                    <button
                      type="button"
                      onClick={() => window.print()}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#7C3AED] px-4 py-2 text-sm font-semibold text-white hover:bg-[#6D28D9]"
                    >
                      <Printer size={14} />
                      Print Invoice
                    </button>
                    <MetaLine label="Order Type" value={orderType} />
                    <MetaLine label="Payment Method" value={paymentMethod} />
                    {paymentStatus && paymentStatus !== '—' ? (
                      <MetaLine label="Payment Status" value={paymentStatus} valueClass={paymentStatusClass} />
                    ) : null}
                    {referenceCode && referenceCode !== '-' ? (
                      <MetaLine label="Reference Code" value={referenceCode} />
                    ) : null}
                    <MetaLine label="Status" value={orderStatus} valueAsPill pillClass={orderStatusClass} />
                    <MetaLine
                      label="Cutlery"
                      value={cutlery}
                      valueAsPill
                      pillClass={cutlery === 'Yes' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}
                    />
                  </div>
                </div>

                <div className="mt-4 overflow-hidden rounded-lg border border-gray-200">
                  <div className="grid grid-cols-12 bg-[#F3EAFD] px-4 py-2 text-xs font-semibold text-[#4B4B57]">
                    <span className="col-span-1">Sl</span>
                    <span className="col-span-6">Item Details</span>
                    <span className="col-span-3">Addons</span>
                    <span className="col-span-2 text-right">Price</span>
                  </div>

                  {items.map((item, i) => {
                    const itemImage = toAbsoluteAssetUrl(
                      item?.menu_item?.image_url ||
                        item?.menu_item?.image ||
                        item?.menu_item?.photo ||
                        item?.image_url ||
                        item?.image ||
                        item?.photo ||
                        ''
                    );

                    return (
                      <div key={i} className="grid grid-cols-12 items-center border-t border-gray-100 px-4 py-3 text-sm first:border-t-0">
                        <span className="col-span-1 text-gray-700">{i + 1}</span>
                        <div className="col-span-6 flex items-center gap-3">
                          {itemImage ? (
                            <img
                              src={itemImage}
                              alt={item?.item_name || item?.name || 'Item'}
                              className="h-11 w-11 rounded-md object-cover"
                              onError={(event) => {
                                event.currentTarget.onerror = null;
                                event.currentTarget.src = '/default-image.svg';
                              }}
                            />
                          ) : (
                            <div className="h-11 w-11 rounded-md bg-gray-100" />
                          )}
                          <div className="min-w-0">
                            <p className="truncate font-medium text-[#1E1E24]">{item?.item_name || item?.name || 'Item'}</p>
                            <p className="text-xs text-gray-500">Unit Price : {toCurrency(item?.unit_price || 0)}</p>
                            <p className="text-xs text-gray-400">Qty : {item?.quantity || item?.qty || 0}</p>
                          </div>
                        </div>
                        <span className="col-span-3 text-xs text-gray-500">{item?.special_instructions || '—'}</span>
                        <span className="col-span-2 text-right font-semibold text-[#1E1E24]">
                          {toCurrency(item?.line_total || item?.unit_price || 0)}
                        </span>
                      </div>
                    );
                  })}

                  {items.length === 0 && (
                    <div className="px-4 py-6 text-sm text-gray-500">No items found for this order.</div>
                  )}
                </div>

                <div className="mt-5 ml-auto w-full max-w-[300px] border-t border-gray-200 pt-4 text-sm">
                  <PriceLine label="Item Price" value={toCurrency(subtotal)} />
                  <PriceLine label="Addon Cost" value={toCurrency(addonCost)} />
                  <PriceLine label="Subtotal" value={toCurrency(subtotal + addonCost)} />
                  <PriceLine label="Discount" value={`- ${toCurrency(discountAmount)}`} />
                  <PriceLine label="Coupon Discount" value={`- ${toCurrency(couponDiscount)}`} />
                  <PriceLine label="VAT/Tax" value={`+ ${toCurrency(taxAmount)}`} />
                  <PriceLine label="Delivery Fee" value={`+ ${toCurrency(deliveryFee)}`} />
                  <PriceLine label="Service Charges" value={`+ ${toCurrency(serviceCharges)}`} />
                  <div className="mt-2 border-t border-gray-200 pt-3">
                    <PriceLine label="Total" value={toCurrency(totalAmount)} bold />
                  </div>
                </div>
              </div>
            </div>

            <div className="col-span-12 order-1 min-w-0 space-y-3 lg:order-2 lg:col-span-4">
              <div className="rounded-xl bg-[#F5F5FA] p-4">
                <h3 className="text-sm font-semibold text-[#1E1E24]">Order Setup</h3>
                <label className="mt-3 block text-xs font-semibold text-gray-600" htmlFor="order-status-select">
                  Change order status
                </label>
                <select
                  id="order-status-select"
                  disabled={!canChangeOrderStatus}
                  className="mt-1.5 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-[#1E1E24] shadow-sm outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-200 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-500"
                  value={selectStatusValue}
                  onChange={(e) => {
                    const next = e.target.value;
                    if (next === currentApiStatus) return;
                    setPendingApiStatus(next);
                    setStatusReason('');
                    setStatusActionError('');
                    setStatusModalOpen(true);
                    setSelectStatusValue(currentApiStatus);
                  }}
                >
                  {statusSelectOptions.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
                {!canChangeOrderStatus ? (
                  <p className="mt-1.5 text-xs text-gray-500">
                    No further status changes are allowed for this order.
                  </p>
                ) : null}
                {!statusModalOpen && statusActionError ? (
                  <p className="mt-2 text-xs text-rose-600">{statusActionError}</p>
                ) : null}
              </div>

              {showAssignDelivery ? (
                <div className="rounded-xl border border-violet-200/70 bg-gradient-to-br from-violet-50/90 via-white to-white p-4 shadow-sm">
                  {assignedDriver ? (
                    <>
                      <h3 className="text-sm font-semibold text-[#1E1E24]">Delivery partner</h3>
                      <p className="mt-1 text-xs text-gray-600">Currently assigned to this order.</p>
                      <div className="mt-3 flex items-start gap-3">
                        {assignedDriver.avatar ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={toAbsoluteAssetUrl(assignedDriver.avatar)}
                            alt=""
                            className="h-12 w-12 shrink-0 rounded-full object-cover ring-2 ring-violet-100"
                            onError={(e) => {
                              e.currentTarget.onerror = null;
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                        ) : (
                          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-violet-100 text-sm font-bold text-violet-800 ring-2 ring-violet-100">
                            {assignedDriver.name.slice(0, 1).toUpperCase()}
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-[#1E1E24]">{assignedDriver.name}</p>
                        </div>
                      </div>
                      <div className="mt-3 space-y-2 border-t border-violet-100/70 pt-3">
                        {assignedDriver.phone ? (
                          <InfoLine label="Phone" value={formatPhoneWithFlag(assignedDriver.phone)} />
                        ) : null}
                        {assignedDriver.email ? <InfoLine label="Email" value={assignedDriver.email} /> : null}
                        {assignedDriver.vehicleType || assignedDriver.vehicleNumber ? (
                          <InfoLine
                            label="Type"
                            value={
                              [assignedDriver.vehicleType, assignedDriver.vehicleNumber].filter(Boolean).join(' · ') ||
                              '—'
                            }
                          />
                        ) : null}
                        {assignedDriver.assignmentStatus || assignedDriver.approvalStatus ? (
                          <InfoLine
                            label="Status"
                            value={humanizeEnum(
                              assignedDriver.assignmentStatus || assignedDriver.approvalStatus || ''
                            )}
                          />
                        ) : null}
                        {assignedDriver.totalOrders != null ? (
                          <InfoLine label="Total orders" value={String(assignedDriver.totalOrders)} />
                        ) : null}
                      </div>
                      <button
                        type="button"
                        onClick={() => setAssignModalOpen(true)}
                        className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-violet-600 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-violet-700"
                      >
                        <Bike className="h-4 w-4" aria-hidden />
                        Change delivery person
                      </button>
                    </>
                  ) : (
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="text-sm font-semibold text-[#1E1E24]">Assign delivery partner</h3>
                        <p className="mt-1 text-xs leading-relaxed text-gray-600">
                          Choose an available rider for this order. Distance from pickup is shown when live location is
                          available.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setAssignModalOpen(true)}
                        className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-violet-600 px-3 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-violet-700"
                      >
                        <Bike className="h-4 w-4" aria-hidden />
                        Open
                      </button>
                    </div>
                  )}
                </div>
              ) : null}

              <div className="rounded-xl bg-[#F5F5FA] p-4">
                <h3 className="text-sm font-semibold text-[#1E1E24]">Customer Info</h3>
                <div className="mt-3 flex items-start gap-3">
                  <img
                    src={customerImage || '/default-image.svg'}
                    alt={customerName}
                    className="h-14 w-14 rounded-full object-cover"
                    onError={(event) => {
                      event.currentTarget.onerror = null;
                      event.currentTarget.src = '/default-image.svg';
                    }}
                  />
                  <div className="min-w-0">
                    <p className="truncate text-[30px] font-semibold leading-none text-[#1E1E24]">{customerName}</p>
                    <p className="mt-1 text-xs text-gray-500">Customer Details</p>
                    <p className="mt-2 flex items-center gap-2 text-xs text-[#3A3A45]">
                      <Phone size={13} className="text-gray-500" />
                      {formatPhoneWithFlag(customerPhone)}
                    </p>
                    <p className="mt-1 flex items-center gap-2 text-xs text-[#3A3A45]">
                      <Mail size={13} className="text-gray-500" />
                      {customerEmail}
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-xl bg-[#F5F5FA] p-4">
                <h3 className="text-sm font-semibold text-[#1E1E24]">Delivery Info</h3>
                <div className="mt-3 space-y-2 text-sm">
                  <InfoLine label="Customer name" value={customerName} />
                  <InfoLine label="Phone" value={formatPhoneWithFlag(customerPhone)} />
                  <InfoLine label="Email" value={customerEmail} />
                  {order?.notes ? (
                    <InfoLine label="Order notes" value={String(order.notes)} />
                  ) : null}
                </div>
                <div className="mt-4 border-t border-gray-200 pt-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Delivery address
                  </p>
                  {deliveryDisplayRows.length === 0 ? (
                    <p className="mt-2 text-sm text-gray-500">No delivery address on this order.</p>
                  ) : (
                    <div className="mt-2 space-y-2">
                      {deliveryDisplayRows.map((row) => (
                        <InfoLine key={row.key} label={row.label} value={row.value} />
                      ))}
                    </div>
                  )}
                </div>
                <p className="mt-3 flex items-start gap-2 text-sm text-[#1E1E24]">
                  <MapPin size={14} className="mt-0.5 shrink-0" />
                  <span className="min-w-0 break-words">{deliveryAddressText}</span>
                </p>
                {deliveryMapHref ? (
                  <a
                    href={deliveryMapHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 inline-flex text-xs font-semibold text-purple-700 hover:underline"
                  >
                    Open delivery address in Google Maps
                  </a>
                ) : (
                  <p className="mt-2 text-xs text-gray-400">Add a delivery address to open in Maps.</p>
                )}
              </div>

              {ENABLE_DELIVERY_PROOF ? (
                <div className="rounded-xl bg-[#F5F5FA] p-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-[#1E1E24]">Delivery Proof</h3>
                    <button
                      type="button"
                      onClick={() => setIsProofModalOpen(true)}
                      className="rounded-lg bg-[#7C3AED] px-3 py-1 text-xs font-semibold text-white hover:bg-[#6D28D9]"
                    >
                      Add
                    </button>
                  </div>
                </div>
              ) : null}

              <div className="rounded-xl bg-[#F5F5FA] p-4">
                <h3 className="text-sm font-semibold text-[#1E1E24]">Restaurant Info</h3>
                <div className="mt-3 flex items-start gap-3">
                  {restaurantImage ? (
                    <img
                      src={restaurantImage}
                      alt={restaurantName}
                      className="h-14 w-14 shrink-0 rounded-lg object-cover"
                      onError={(event) => {
                        event.currentTarget.onerror = null;
                        event.currentTarget.src = '/default-image.svg';
                      }}
                    />
                  ) : (
                    <div className="h-14 w-14 shrink-0 rounded-lg bg-gray-200" />
                  )}
                  <div className="min-w-0">
                    <p className="break-words text-2xl font-semibold leading-tight text-[#1E1E24] sm:text-[30px] sm:leading-none">
                      {restaurantName}
                    </p>
                    <p className="mt-1 text-xs text-gray-500">Restaurant Details</p>
                    <p className="mt-2 flex items-center gap-2 text-xs text-[#3A3A45]">
                      <Phone size={13} className="shrink-0 text-gray-500" />
                      {formatPhoneWithFlag(restaurantPhone)}
                    </p>
                    {ownerPhone && ownerPhone !== restaurantPhone && (
                      <p className="mt-1 flex items-center gap-2 text-xs text-[#3A3A45]">
                        <Phone size={13} className="shrink-0 text-gray-500" />
                        Owner: {formatPhoneWithFlag(ownerPhone)}
                      </p>
                    )}
                    {ownerEmail && (
                      <p className="mt-1 flex items-center gap-2 text-xs text-[#3A3A45]">
                        <Mail size={13} className="shrink-0 text-gray-500" />
                        {ownerEmail}
                      </p>
                    )}
                  </div>
                </div>
                <div className="mt-4 border-t border-gray-200 pt-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Restaurant / pickup address
                  </p>
                  <p className="mt-3 flex items-start gap-2 text-sm text-[#1E1E24]">
                    <MapPin size={14} className="mt-0.5 shrink-0 text-gray-500" />
                    <span className="min-w-0 break-words">{restaurantAddress}</span>
                  </p>
                  {pickupMapHref ? (
                    <a
                      href={pickupMapHref}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 inline-flex text-xs font-semibold text-purple-700 hover:underline"
                    >
                      Open restaurant address in Google Maps
                    </a>
                  ) : (
                    <p className="mt-2 text-xs text-gray-400">Add a restaurant address to open in Maps.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
        )}
      </div>

      {statusModalOpen ? (
        <div
          className="fixed inset-0 z-[65] flex items-center justify-center overflow-y-auto bg-black/45 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="status-confirm-title"
          onMouseDown={(e) => {
            if (statusSaving) return;
            if (e.target === e.currentTarget) {
              setStatusModalOpen(false);
              setPendingApiStatus('');
              setStatusReason('');
              setStatusActionError('');
            }
          }}
        >
          <div
            className="relative w-full max-w-md rounded-2xl border-2 border-orange-200 bg-white p-5 shadow-2xl ring-1 ring-orange-100/80"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              disabled={statusSaving}
              onClick={() => {
                setStatusModalOpen(false);
                setPendingApiStatus('');
                setStatusReason('');
                setStatusActionError('');
              }}
              className="absolute right-3 top-3 rounded-lg p-1.5 text-gray-500 transition hover:bg-gray-100 disabled:opacity-50"
              aria-label="Close"
            >
              <X className="h-5 w-5" aria-hidden />
            </button>
            <div className="flex gap-3 pr-8">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-rose-100">
                <AlertCircle className="h-5 w-5 text-rose-600" aria-hidden />
              </div>
              <div className="min-w-0 flex-1">
                <h2 id="status-confirm-title" className="text-base font-semibold text-[#1E1E24]">
                  Are you sure?
                </h2>
                <p className="mt-1 text-sm text-gray-600">
                  Change status to{' '}
                  <span className="font-medium text-[#1E1E24]">
                    {statusSelectOptions.find((o) => o.value === pendingApiStatus)?.label ||
                      humanizeEnum(pendingApiStatus)}
                  </span>
                  ?
                </p>
                <label className="mt-4 block">
                  <span className="text-xs font-semibold text-gray-600">Note / reason (optional)</span>
                  <textarea
                    value={statusReason}
                    onChange={(e) => setStatusReason(e.target.value)}
                    rows={3}
                    placeholder={
                      pendingApiStatus === 'cancelled'
                        ? 'e.g. Item not available'
                        : 'Optional note for this change'
                    }
                    className="mt-1.5 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-200"
                  />
                </label>
                {statusActionError ? (
                  <p className="mt-2 text-xs text-rose-600">{statusActionError}</p>
                ) : null}
                <div className="mt-5 flex gap-2">
                  <button
                    type="button"
                    disabled={statusSaving}
                    onClick={() => {
                      setStatusModalOpen(false);
                      setPendingApiStatus('');
                      setStatusReason('');
                      setStatusActionError('');
                    }}
                    className="flex-1 rounded-xl border border-gray-200 bg-gray-50 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-100 disabled:opacity-50"
                  >
                    No
                  </button>
                  <button
                    type="button"
                    disabled={statusSaving}
                    onClick={async () => {
                      setStatusSaving(true);
                      setStatusActionError('');
                      try {
                        const token = localStorage.getItem('token');
                        const res = await fetch(`/api/orders/${encodeURIComponent(orderId)}/status`, {
                          method: 'PATCH',
                          headers: {
                            'Content-Type': 'application/json',
                            ...(token ? { Authorization: `Bearer ${token}` } : {}),
                          },
                          body: JSON.stringify({
                            status: pendingApiStatus,
                            ...(statusReason.trim() ? { reason: statusReason.trim() } : {}),
                          }),
                        });
                        const data = await res.json().catch(() => ({}));
                        if (!res.ok) {
                          throw new Error(
                            typeof data?.message === 'string' ? data.message : 'Failed to update order status'
                          );
                        }
                        await refreshOrderPayload();
                        setStatusModalOpen(false);
                        setPendingApiStatus('');
                        setStatusReason('');
                      } catch (e) {
                        setStatusActionError(e?.message || 'Failed to update order status');
                      } finally {
                        setStatusSaving(false);
                      }
                    }}
                    className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-orange-600 py-2.5 text-sm font-semibold text-white hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {statusSaving ? (
                      <Loader2 className="h-4 w-4 animate-spin shrink-0" aria-hidden />
                    ) : null}
                    Yes
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      <AssignDeliveryModal
        isOpen={assignModalOpen}
        onClose={() => setAssignModalOpen(false)}
        orderApiId={assignmentIds.orderId}
        orderUuid={assignmentIds.orderUuid}
        pickupAddress={assignPickupAddressDefault}
        deliveryAddress={assignDeliveryAddressDefault}
        pickupLatitude={pickupLat}
        pickupLongitude={pickupLng}
        deliveryLatitude={deliveryLat}
        deliveryLongitude={deliveryLng}
        initialDeliveryNotes={assignDeliveryNotesDefault}
        onSuccess={() => {
          refreshOrderPayload();
        }}
      />
    </>
  );
}

function MetaLine({ label, value, valueClass = 'text-[#1E1E24]', valueAsPill = false, pillClass = '' }) {
  return (
    <div className="min-w-0 text-sm break-words">
      <span className="text-[#1E1E24]">{label} : </span>
      {valueAsPill ? (
        <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${pillClass}`}>{value || '-'}</span>
      ) : (
        <span className={`font-medium ${valueClass}`}>{value || '-'}</span>
      )}
    </div>
  );
}

function InfoLine({ label, value }) {
  return (
    <div className="grid grid-cols-1 gap-0.5 sm:grid-cols-[minmax(8rem,38%)_1fr] sm:gap-x-3 sm:gap-y-0">
      <span className="text-gray-500">{label}</span>
      <span className="break-words font-medium text-[#1E1E24]">{value ?? '—'}</span>
    </div>
  );
}

function PriceLine({ label, value, bold = false }) {
  return (
    <div className={`flex items-center justify-between py-0.5 text-sm ${bold ? 'font-semibold text-[#1E1E24]' : 'text-[#3A3A45]'}`}>
      <span>{label} :</span>
      <span>{value}</span>
    </div>
  );
}

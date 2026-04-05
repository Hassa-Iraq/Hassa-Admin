'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import Topbar from '@/app/components/Topbar';
import {
  Printer,
  Phone,
  Mail,
  MapPin,
  Store,
} from 'lucide-react';
import { formatPhoneWithFlag } from '@/app/lib/phone';
import { API_BASE_URL } from '@/app/config';
import { APP_CURRENCY } from '@/app/lib/currency';

const toAbsoluteAssetUrl = (value) => {
  if (!value || typeof value !== 'string') return '';
  const trimmed = value.trim();
  if (!trimmed) return '';
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed;
  if (trimmed.startsWith('//')) return `https:${trimmed}`;
  if (trimmed.startsWith('/')) return `${API_BASE_URL}${trimmed}`;
  return `${API_BASE_URL}/${trimmed}`;
};

export default function OrderDetailPage() {
  const params = useParams();
  const [orderPayload, setOrderPayload] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const orderId = useMemo(() => {
    const rawId = params?.id;
    if (Array.isArray(rawId)) return rawId[0];
    return rawId || '';
  }, [params?.id]);

  useEffect(() => {
    const fetchOrderDetails = async () => {
      if (!orderId) return;
      setLoading(true);
      setError('');
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`/api/orders/${orderId}`, {
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
    };

    fetchOrderDetails();
  }, [orderId]);

  const order = useMemo(() => {
    const payload = orderPayload || {};
    return (
      payload?.data?.order ||
      payload?.order ||
      payload?.data ||
      {}
    );
  }, [orderPayload]);

  const customer = useMemo(() => {
    const direct = order?.customer || order?.user;
    return direct && typeof direct === 'object' ? direct : {};
  }, [order]);

  const restaurant = useMemo(() => {
    const direct = order?.restaurant;
    return direct && typeof direct === 'object' ? direct : {};
  }, [order]);
  const delivery = order?.delivery_address || {};
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

  const paymentStatus = order?.payment_status || 'Unpaid';
  const orderStatus = order?.status || '-';
  const paymentMethod = order?.payment_method || 'N/A';
  const referenceCode = order?.reference_code || order?.reference || '-';
  const orderType = order?.order_type || order?.delivery_type || 'Home Delivery';
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
      : 'bg-slate-50 text-slate-700';
  const paymentStatusClass =
    paymentKey === 'paid'
      ? 'text-emerald-600'
      : paymentKey === 'unpaid'
      ? 'text-amber-600'
      : paymentKey === 'failed'
      ? 'text-rose-600'
      : 'text-indigo-600';
  const customerImage = toAbsoluteAssetUrl(
    customer?.profile_picture_url ||
    customer?.image_url ||
    customer?.image ||
    ''
  );
  const deliveryAddressText =
    delivery?.line1 ||
    [delivery?.house, delivery?.road, delivery?.floor, delivery?.area, delivery?.city].filter(Boolean).join(', ') ||
    '-';

  return (
    <>
      <Topbar
        title="Order Details"
        subtitle="Manage all active and scheduled orders"
      />

      <div className="pt-36 px-6 pb-10">
        {loading && (
          <div className="rounded-xl border border-gray-200 bg-white p-6 text-sm text-gray-500">
            Loading order details...
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
            <div className="col-span-12 lg:col-span-8">
              <div className="rounded-xl bg-white p-4">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-[1fr_210px]">
                  <div>
                    <h2 className="text-[34px] font-semibold leading-none text-[#1E1E24]">
                      Order ID # {order?.order_number || order?.id || orderId}
                    </h2>
                    <p className="mt-2 text-sm text-gray-500">Placed Date : {formattedDate}</p>

                    <p className="mt-3 flex items-center gap-2 text-sm">
                      <Store size={14} className="text-gray-500" />
                      <span className="font-medium">Restaurant :</span>
                      <span className="text-purple-600">{restaurantName}</span>
                    </p>
                    <button type="button" className="mt-2 rounded-md bg-purple-100 px-2.5 py-1 text-xs font-semibold text-purple-700">
                      Show Location On Map
                    </button>
                  </div>

                  <div className="space-y-3 text-sm">
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
                    <MetaLine label="Payment Status" value={paymentStatus} valueClass={paymentStatusClass} />
                    <MetaLine label="Reference Code" value={referenceCode} />
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

            <div className="col-span-12 space-y-3 lg:col-span-4">
              <div className="rounded-xl bg-[#F5F5FA] p-4">
                <h3 className="text-sm font-semibold text-[#1E1E24]">Customer Info</h3>
                <div className="mt-3 flex items-start gap-3">
                  {customerImage ? (
                    <img
                      src={customerImage}
                      alt={customerName}
                      className="h-14 w-14 rounded-full object-cover"
                      onError={(event) => {
                        event.currentTarget.onerror = null;
                        event.currentTarget.src = '/default-image.svg';
                      }}
                    />
                  ) : (
                    <div className="h-14 w-14 rounded-full bg-gray-200" />
                  )}
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
                <div className="mt-3 space-y-1 text-sm">
                  <InfoLine label="Name" value={customerName} />
                  <InfoLine label="Contact" value={formatPhoneWithFlag(customerPhone)} />
                  <InfoLine label="Area" value={delivery?.area || '-'} />
                  <InfoLine label="City" value={delivery?.city || '-'} />
                </div>
                <p className="mt-3 flex items-center gap-2 text-sm text-[#1E1E24]">
                  <MapPin size={14} />
                  {deliveryAddressText}
                </p>
              </div>

              <div className="rounded-xl bg-[#F5F5FA] p-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-[#1E1E24]">Delivery Proof</h3>
                  <button className="rounded-lg bg-[#7C3AED] px-3 py-1 text-xs font-semibold text-white hover:bg-[#6D28D9]">
                    Add
                  </button>
                </div>
              </div>

              <div className="rounded-xl bg-[#F5F5FA] p-4">
                <h3 className="text-sm font-semibold text-[#1E1E24]">Restaurant Info</h3>
                <div className="mt-3 flex items-start gap-3">
                  {restaurantImage ? (
                    <img
                      src={restaurantImage}
                      alt={restaurantName}
                      className="h-14 w-14 rounded-lg object-cover"
                      onError={(event) => {
                        event.currentTarget.onerror = null;
                        event.currentTarget.src = '/default-image.svg';
                      }}
                    />
                  ) : (
                    <div className="h-14 w-14 rounded-lg bg-gray-200" />
                  )}
                  <div className="min-w-0">
                    <p className="truncate text-[30px] font-semibold leading-none text-[#1E1E24]">{restaurantName}</p>
                    <p className="mt-1 text-xs text-gray-500">Restaurant Details</p>
                    <p className="mt-2 flex items-center gap-2 text-xs text-[#3A3A45]">
                      <Phone size={13} className="text-gray-500" />
                      {formatPhoneWithFlag(restaurantPhone)}
                    </p>
                    {ownerPhone && ownerPhone !== restaurantPhone && (
                      <p className="mt-1 flex items-center gap-2 text-xs text-[#3A3A45]">
                        <Phone size={13} className="text-gray-500" />
                        Owner: {formatPhoneWithFlag(ownerPhone)}
                      </p>
                    )}
                    {ownerEmail && (
                      <p className="mt-1 flex items-center gap-2 text-xs text-[#3A3A45]">
                        <Mail size={13} className="text-gray-500" />
                        {ownerEmail}
                      </p>
                    )}
                    <p className="mt-1 flex items-center gap-2 text-xs text-[#3A3A45]">
                      <MapPin size={13} className="text-gray-500" />
                      {restaurantAddress}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        )}
      </div>
    </>
  );
}

function MetaLine({ label, value, valueClass = 'text-[#1E1E24]', valueAsPill = false, pillClass = '' }) {
  return (
    <div className="text-sm">
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
    <p className="text-[#1E1E24]">
      <span className="inline-block w-16 text-gray-500">{label}</span>
      <span className="mx-1 text-gray-400">:</span>
      <span>{value || '-'}</span>
    </p>
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

'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Bike, Loader2, MapPin, Search, X } from 'lucide-react';
import { formatPhoneWithFlag } from '@/app/lib/phone';
import { isUsableLatLng, coordsRoughlyMatchAddressHints, normalizeLikelySwappedLatLng } from '@/app/lib/geo';
import LeafletPinPicker from '@/app/components/LeafletPinPicker';

const RESTAURANT_ROLES = ['restaurant', 'resturant', 'restaurant_admin', 'vendor'];
const ADMIN_ROLES = ['admin', 'super_admin', 'superadmin'];
const ASSIGN_MAP_DEFAULT = { lat: 24.8607, lng: 67.0011 };

/** Same Nominatim search as add restaurant; tries Pakistan first, then worldwide. */
async function geocodeAddressToLatLng(rawAddress) {
  const q = String(rawAddress || '').trim();
  if (!q || q.length < 3) return null;
  if (q === 'Restaurant kitchen' || q === 'Customer address' || q === '—') return null;

  const parseFirst = (data) => {
    const first = Array.isArray(data) ? data[0] : null;
    if (!first?.lat || !first?.lon) return null;
    const lat = Number(first.lat);
    const lng = Number(first.lon);
    if (!isUsableLatLng(lat, lng)) return null;
    return { lat, lng };
  };

  try {
    const pkUrl = `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&limit=1&countrycodes=pk&q=${encodeURIComponent(q)}`;
    const pkRes = await fetch(pkUrl, { headers: { 'Accept-Language': 'en' } });
    const pkData = await pkRes.json();
    const pkPt = parseFirst(pkData);
    if (pkPt) return pkPt;

    const wUrl = `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&limit=1&q=${encodeURIComponent(q)}`;
    const wRes = await fetch(wUrl, { headers: { 'Accept-Language': 'en' } });
    const wData = await wRes.json();
    return parseFirst(wData);
  } catch {
    return null;
  }
}

function pickString(...values) {
  const matched = values.find((v) => typeof v === 'string' && v.trim());
  return matched ? matched.trim() : '';
}

function toNum(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function haversineKm(lat1, lon1, lat2, lon2) {
  const a = toNum(lat1);
  const b = toNum(lon1);
  const c = toNum(lat2);
  const d = toNum(lon2);
  if (a == null || b == null || c == null || d == null) return null;
  const R = 6371;
  const dLat = ((c - a) * Math.PI) / 180;
  const dLon = ((d - b) * Math.PI) / 180;
  const x =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((a * Math.PI) / 180) * Math.cos((c * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const y = 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
  return R * y;
}

function buildOsmEmbedUrl(lat1, lng1, lat2, lng2) {
  const pts = [
    [toNum(lat1), toNum(lng1)],
    [toNum(lat2), toNum(lng2)],
  ].filter(([la, ln]) => isUsableLatLng(la, ln));
  if (pts.length === 0) return null;
  if (pts.length === 1) {
    const [la, ln] = pts[0];
    const pad = 0.04;
    return `https://www.openstreetmap.org/export/embed.html?bbox=${ln - pad}%2C${la - pad}%2C${ln + pad}%2C${la + pad}&layer=mapnik&marker=${la}%2C${ln}`;
  }
  const lats = pts.map((p) => p[0]);
  const lngs = pts.map((p) => p[1]);
  const pad = 0.015;
  const minLat = Math.min(...lats) - pad;
  const maxLat = Math.max(...lats) + pad;
  const minLng = Math.min(...lngs) - pad;
  const maxLng = Math.max(...lngs) + pad;
  return `https://www.openstreetmap.org/export/embed.html?bbox=${minLng}%2C${minLat}%2C${maxLng}%2C${maxLat}&layer=mapnik`;
}

function normalizeDriverRow(item, index) {
  const driverUserId = pickString(
    String(item?.user_id ?? ''),
    String(item?.driver_user_id ?? ''),
    String(item?.id ?? ''),
    String(item?.driver_id ?? '')
  );
  const name = pickString(item?.full_name, item?.name, item?.driver_name, item?.user?.full_name) || 'Driver';
  const phone = pickString(item?.phone, item?.user?.phone) || '';
  const avatar = pickString(item?.image_url, item?.driver_image_url, item?.avatar, item?.profile_picture_url);
  const activeOrders = Number(item?.active_orders ?? item?.ongoing_orders ?? item?.current_orders ?? 0) || 0;
  const dLat = toNum(
    item?.latitude ?? item?.lat ?? item?.current_latitude ?? item?.location?.latitude ?? item?.location?.lat
  );
  const dLng = toNum(
    item?.longitude ?? item?.lng ?? item?.current_longitude ?? item?.location?.longitude ?? item?.location?.lng
  );
  const ownerType = pickString(item?.owner_type, item?.ownerType).toLowerCase();
  const ownerRestaurantId = pickString(
    String(item?.owner_restaurant_id ?? ''),
    String(item?.ownerRestaurantId ?? '')
  );
  return {
    key: driverUserId || `d-${index}`,
    driverUserId,
    name,
    phone,
    avatar,
    activeOrders,
    latitude: dLat,
    longitude: dLng,
    ownerType,
    ownerRestaurantId,
  };
}

export default function AssignDeliveryModal({
  isOpen,
  onClose,
  orderApiId,
  orderUuid = '',
  pickupAddress,
  deliveryAddress,
  pickupLatitude,
  pickupLongitude,
  deliveryLatitude,
  deliveryLongitude,
  initialDeliveryNotes,
  onSuccess,
}) {
  const [roleResolved, setRoleResolved] = useState(false);
  const [roleContext, setRoleContext] = useState({ ownerType: '', restaurantId: '' });
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [listError, setListError] = useState('');
  const [drivers, setDrivers] = useState([]);
  const [selectedId, setSelectedId] = useState('');
  const [pickupAddr, setPickupAddr] = useState(pickupAddress);
  const [dropAddr, setDropAddr] = useState(deliveryAddress);
  const [notes, setNotes] = useState(initialDeliveryNotes || '');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [geoWorking, setGeoWorking] = useState(false);
  const [pickupPin, setPickupPin] = useState(null);
  const [dropPin, setDropPin] = useState(null);
  const pickupUserRef = useRef(false);
  const dropUserRef = useRef(false);

  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedSearch(search.trim()), 320);
    return () => window.clearTimeout(t);
  }, [search]);

  useEffect(() => {
    try {
      const userRole = String(localStorage.getItem('userRole') || '').trim().toLowerCase();
      const restaurantId = String(
        localStorage.getItem('restaurant_id') || localStorage.getItem('selectedRestaurantId') || ''
      ).trim();
      let ownerType = '';
      if (ADMIN_ROLES.includes(userRole)) ownerType = 'platform';
      else if (RESTAURANT_ROLES.includes(userRole)) ownerType = 'restaurant';
      setRoleContext({ ownerType, restaurantId });
    } catch {
      setRoleContext({ ownerType: '', restaurantId: '' });
    } finally {
      setRoleResolved(true);
    }
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    pickupUserRef.current = false;
    dropUserRef.current = false;
    setPickupAddr(pickupAddress);
    setDropAddr(deliveryAddress);
    setNotes(initialDeliveryNotes || '');
    setSelectedId('');
    setSubmitError('');
    setListError('');
    if (isUsableLatLng(pickupLatitude, pickupLongitude)) {
      setPickupPin({ lat: Number(pickupLatitude), lng: Number(pickupLongitude) });
    } else {
      setPickupPin(null);
    }
    if (isUsableLatLng(deliveryLatitude, deliveryLongitude)) {
      setDropPin({ lat: Number(deliveryLatitude), lng: Number(deliveryLongitude) });
    } else {
      setDropPin(null);
    }
  }, [
    isOpen,
    orderApiId,
    pickupAddress,
    deliveryAddress,
    initialDeliveryNotes,
    pickupLatitude,
    pickupLongitude,
    deliveryLatitude,
    deliveryLongitude,
  ]);

  /** Only geocode from address text when the order did not already supply both map coordinates. */
  useEffect(() => {
    if (!isOpen) return;
    const needPick = !isUsableLatLng(pickupLatitude, pickupLongitude);
    const needDrop = !isUsableLatLng(deliveryLatitude, deliveryLongitude);
    if (!needPick && !needDrop) return;

    let cancelled = false;
    const t = window.setTimeout(() => {
      void (async () => {
        setGeoWorking(true);
        try {
          await Promise.all([
            (async () => {
              if (!needPick || pickupUserRef.current || cancelled) return;
              const next = await geocodeAddressToLatLng(pickupAddr);
              if (cancelled || pickupUserRef.current) return;
              setPickupPin(next);
            })(),
            (async () => {
              if (!needDrop || dropUserRef.current || cancelled) return;
              const next = await geocodeAddressToLatLng(dropAddr);
              if (cancelled || dropUserRef.current) return;
              setDropPin(next);
            })(),
          ]);
        } finally {
          if (!cancelled) setGeoWorking(false);
        }
      })();
    }, 280);
    return () => {
      cancelled = true;
      window.clearTimeout(t);
    };
  }, [
    isOpen,
    orderApiId,
    pickupAddr,
    dropAddr,
    pickupLatitude,
    pickupLongitude,
    deliveryLatitude,
    deliveryLongitude,
  ]);

  const loadDrivers = useCallback(async () => {
    if (!isOpen || !roleResolved) return;
    if (roleContext.ownerType === 'restaurant' && !roleContext.restaurantId) {
      setDrivers([]);
      setListError('Restaurant ID not found. Please sign in again.');
      return;
    }
    setLoading(true);
    setListError('');
    try {
      const token = localStorage.getItem('token') || '';
      const params = new URLSearchParams({
        page: '1',
        limit: '100',
        search: debouncedSearch,
        owner_type: roleContext.ownerType || '',
        restaurant_id: roleContext.ownerType === 'restaurant' ? roleContext.restaurantId : '',
        is_active: 'true',
      });
      const res = await fetch(`/api/auth/drivers?${params.toString()}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message || 'Failed to load delivery partners');
      const source = data?.data && typeof data.data === 'object' ? data.data : data;
      const raw =
        source?.drivers ||
        source?.deliverymen ||
        source?.list ||
        source?.items ||
        data?.drivers ||
        data?.deliverymen ||
        [];
      const normalized = (Array.isArray(raw) ? raw : []).map((item, i) => normalizeDriverRow(item, i));
      let list = normalized.filter((d) => d.driverUserId);
      if (roleContext.ownerType === 'platform') {
        list = list.filter((d) => !d.ownerType || d.ownerType === 'platform');
      } else if (roleContext.ownerType === 'restaurant') {
        list = list.filter((d) => {
          if (d.ownerType && d.ownerType !== 'restaurant') return false;
          if (roleContext.restaurantId && d.ownerRestaurantId) {
            return d.ownerRestaurantId === roleContext.restaurantId;
          }
          return true;
        });
      }
      setDrivers(list);
    } catch (e) {
      setDrivers([]);
      setListError(e?.message || 'Failed to load delivery partners');
    } finally {
      setLoading(false);
    }
  }, [isOpen, roleResolved, roleContext.ownerType, roleContext.restaurantId, debouncedSearch]);

  useEffect(() => {
    loadDrivers();
  }, [loadDrivers]);

  const pickupResolved =
    pickupPin && isUsableLatLng(pickupPin.lat, pickupPin.lng) ? pickupPin : null;
  const deliveryResolved = dropPin && isUsableLatLng(dropPin.lat, dropPin.lng) ? dropPin : null;

  const coordsReady = Boolean(pickupResolved && deliveryResolved);

  const coordsFromOrderSnapshot = useMemo(
    () =>
      isUsableLatLng(pickupLatitude, pickupLongitude) &&
      isUsableLatLng(deliveryLatitude, deliveryLongitude),
    [pickupLatitude, pickupLongitude, deliveryLatitude, deliveryLongitude]
  );

  const mapUrl = useMemo(() => {
    if (pickupResolved && deliveryResolved) {
      return buildOsmEmbedUrl(
        pickupResolved.lat,
        pickupResolved.lng,
        deliveryResolved.lat,
        deliveryResolved.lng
      );
    }
    if (pickupResolved) {
      return buildOsmEmbedUrl(pickupResolved.lat, pickupResolved.lng, null, null);
    }
    if (deliveryResolved) {
      return buildOsmEmbedUrl(null, null, deliveryResolved.lat, deliveryResolved.lng);
    }
    return null;
  }, [pickupResolved, deliveryResolved]);

  const handleAssign = async () => {
    setSubmitError('');
    if (!orderApiId) {
      setSubmitError('Order id is missing.');
      return;
    }
    if (!selectedId) {
      setSubmitError('Select a delivery partner.');
      return;
    }
    if (!pickupResolved || !deliveryResolved) {
      setSubmitError(
        'Could not resolve one or both locations. Check the addresses, or set the pin on the map / search.'
      );
      return;
    }
    const plat = pickupResolved.lat;
    const plng = pickupResolved.lng;
    const dlat = deliveryResolved.lat;
    const dlng = deliveryResolved.lng;
    if (!isUsableLatLng(plat, plng) || !isUsableLatLng(dlat, dlng)) {
      setSubmitError('Pickup and delivery coordinates are invalid.');
      return;
    }
    const pNorm = normalizeLikelySwappedLatLng(plat, plng);
    const dNorm = normalizeLikelySwappedLatLng(dlat, dlng);
    if (!pNorm || !dNorm || !isUsableLatLng(pNorm.lat, pNorm.lng) || !isUsableLatLng(dNorm.lat, dNorm.lng)) {
      setSubmitError('Pickup and delivery coordinates are invalid after normalization.');
      return;
    }
    if (!coordsRoughlyMatchAddressHints(pickupAddr, pNorm.lat, pNorm.lng)) {
      setSubmitError(
        'Pickup coordinates do not match the pickup address region. Adjust the pickup map pin or address.'
      );
      return;
    }
    if (!coordsRoughlyMatchAddressHints(dropAddr, dNorm.lat, dNorm.lng)) {
      setSubmitError(
        'Delivery coordinates do not match the delivery address (e.g. Iraq for Baghdad). Adjust the delivery map pin.'
      );
      return;
    }
    setSubmitting(true);
    try {
      const token = localStorage.getItem('token') || '';
      const payload = {
        order_id: String(orderApiId),
        driver_user_id: String(selectedId),
        pickup_address: pickupAddr.trim() || 'Restaurant',
        delivery_address: dropAddr.trim() || 'Customer address',
        pickup_latitude: pNorm.lat,
        pickup_longitude: pNorm.lng,
        delivery_latitude: dNorm.lat,
        delivery_longitude: dNorm.lng,
        delivery_notes: notes.trim() || 'Assigned from admin panel',
      };
      if (orderUuid && String(orderUuid).trim() !== String(orderApiId).trim()) {
        payload.order_uuid = String(orderUuid).trim();
      }
      const res = await fetch('/api/deliveries/assignments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(typeof data?.message === 'string' ? data.message : 'Assignment failed');
      }
      onSuccess?.(data);
      onClose();
    } catch (e) {
      setSubmitError(e?.message || 'Assignment failed');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[70] flex items-end justify-center overflow-x-hidden overflow-y-auto bg-black/45 p-0 sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="assign-delivery-title"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="flex max-h-[min(94vh,920px)] w-full min-w-0 max-w-full flex-col overflow-hidden rounded-t-2xl border border-gray-200 bg-white shadow-2xl sm:max-w-7xl sm:rounded-2xl"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-gray-100 bg-gradient-to-r from-violet-50/90 to-white px-3 py-3 sm:px-5">
          <div className="min-w-0 flex-1 pr-2">
            <h2 id="assign-delivery-title" className="text-base font-semibold text-[#1E1E24]">
              Assign delivery partner
            </h2>
            <p className="mt-0.5 text-xs text-gray-600">
              {loading ? 'Loading available partners…' : `${drivers.length} delivery partner${drivers.length === 1 ? '' : 's'} available`}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-lg p-2 text-gray-500 transition hover:bg-gray-100"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="grid min-h-0 min-w-0 flex-1 grid-cols-1 overflow-hidden lg:grid-cols-[minmax(220px,32%)_1fr]">
          <div className="flex min-h-0 min-w-0 flex-col border-b border-gray-100 lg:border-b-0 lg:border-e">
            <div className="shrink-0 border-b border-gray-100 p-2.5 sm:p-3">
              <div className="relative min-w-0">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by name or phone…"
                  className="w-full min-w-0 rounded-xl border border-gray-200 bg-gray-50/80 py-2.5 pl-10 pr-3 text-sm outline-none focus:border-violet-400 focus:bg-white focus:ring-2 focus:ring-violet-200"
                />
              </div>
            </div>
            <div className="min-h-[min(36vh,260px)] flex-1 overflow-y-auto overflow-x-hidden p-2.5 sm:min-h-[280px] sm:p-3">
              {loading ? (
                <div className="flex justify-center py-16">
                  <Loader2 className="h-8 w-8 animate-spin text-violet-600" aria-hidden />
                </div>
              ) : null}
              {!loading && listError ? (
                <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{listError}</p>
              ) : null}
              {!loading && !listError && drivers.length === 0 ? (
                <p className="py-8 text-center text-sm text-gray-500">No active delivery partners found.</p>
              ) : null}
              {!loading &&
                !listError &&
                drivers.map((d) => {
                  const dist = isUsableLatLng(d.latitude, d.longitude)
                    ? haversineKm(
                        d.latitude,
                        d.longitude,
                        pickupResolved?.lat ?? pickupLatitude,
                        pickupResolved?.lng ?? pickupLongitude
                      )
                    : null;
                  const selected = selectedId === d.driverUserId;
                  return (
                    <button
                      key={d.key}
                      type="button"
                      onClick={() => setSelectedId(d.driverUserId)}
                      className={`mb-2 flex w-full min-w-0 items-start gap-2 rounded-xl border p-2.5 text-left transition sm:gap-3 sm:p-3 ${
                        selected
                          ? 'border-violet-500 bg-violet-50/70 ring-1 ring-violet-500/30'
                          : 'border-gray-200 bg-white hover:border-violet-200 hover:bg-violet-50/30'
                      }`}
                    >
                      {d.avatar ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={d.avatar} alt="" className="h-11 w-11 shrink-0 rounded-full object-cover" />
                      ) : (
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-violet-100 text-sm font-bold text-violet-800">
                          {d.name.slice(0, 1).toUpperCase()}
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-semibold text-[#1E1E24]">{d.name}</p>
                        <p className="text-[11px] text-gray-500">
                          Active orders: <span className="font-medium text-gray-700">{d.activeOrders}</span>
                          {dist != null ? (
                            <>
                              {' '}
                              · <span className="text-violet-700">{dist.toFixed(1)} km</span> from pickup
                            </>
                          ) : (
                            <>
                              {' '}
                              · <span className="text-gray-400">Location unknown</span>
                            </>
                          )}
                        </p>
                        {d.phone ? (
                          <p className="mt-0.5 text-[11px] text-gray-600">{formatPhoneWithFlag(d.phone)}</p>
                        ) : null}
                      </div>
                      <span
                        className={`inline-flex shrink-0 self-start rounded-full px-2 py-1 text-[9px] font-bold uppercase ${
                          selected ? 'bg-violet-600 text-white' : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {selected ? 'Selected' : 'Pick'}
                      </span>
                    </button>
                  );
                })}
            </div>
          </div>

          <div className="flex min-h-0 min-w-0 flex-col gap-3 overflow-y-auto overflow-x-hidden bg-slate-50/40 p-3 sm:gap-3.5 sm:p-4">
            <div className="min-w-0 shrink-0 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
              <div className="flex items-center justify-between border-b border-gray-100 px-3 py-2">
                <span className="text-xs font-semibold text-[#1E1E24]">Route map</span>
                {coordsReady ? (
                  <span className="text-[10px] font-medium text-emerald-600">Both points set</span>
                ) : geoWorking ? (
                  <span className="flex items-center gap-1 text-[10px] font-medium text-violet-600">
                    <Loader2 className="h-3 w-3 animate-spin" aria-hidden />
                    Locating…
                  </span>
                ) : null}
              </div>
              <div className="h-[min(260px,38vh)] w-full bg-gray-100 sm:h-[min(300px,40vh)] lg:h-[min(400px,48vh)]">
                {mapUrl ? (
                  <iframe title="Route map" className="h-full w-full border-0" src={mapUrl} loading="lazy" />
                ) : (
                  <div className="flex h-full flex-col items-center justify-center gap-2 px-4 text-center text-sm text-gray-500">
                    <MapPin className="h-8 w-8 text-gray-400" />
                    Set pickup and delivery to preview the route.
                  </div>
                )}
              </div>
            </div>

            <div className="min-w-0 space-y-2.5 rounded-xl border border-gray-200 bg-white p-3 shadow-sm sm:space-y-3 sm:p-3.5">
              <label className="block min-w-0">
                <span className="text-[11px] font-semibold text-gray-600">Pickup address</span>
                <textarea
                  value={pickupAddr}
                  onChange={(e) => setPickupAddr(e.target.value)}
                  rows={2}
                  className="mt-1 w-full min-w-0 max-w-full resize-y break-words rounded-lg border border-gray-200 px-2 py-1.5 text-xs outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
                />
              </label>
              <label className="block min-w-0">
                <span className="text-[11px] font-semibold text-gray-600">Delivery address</span>
                <textarea
                  value={dropAddr}
                  onChange={(e) => setDropAddr(e.target.value)}
                  rows={2}
                  className="mt-1 w-full min-w-0 max-w-full resize-y break-words rounded-lg border border-gray-200 px-2 py-1.5 text-xs outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
                />
              </label>
              <label className="block min-w-0">
                <span className="text-[11px] font-semibold text-gray-600">Delivery notes</span>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  placeholder="Optional"
                  className="mt-1 w-full min-w-0 max-w-full resize-y break-words rounded-lg border border-gray-200 px-2 py-1.5 text-xs outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
                />
              </label>

              {coordsFromOrderSnapshot ? null : (
                <>
                  <LeafletPinPicker
                    title="Pickup pin"
                    committed={pickupPin}
                    suggestedCenter={pickupPin ?? ASSIGN_MAP_DEFAULT}
                    searchSeed={pickupAddr}
                    onCommit={(la, ln) => {
                      pickupUserRef.current = true;
                      setPickupPin({ lat: la, lng: ln });
                    }}
                    minHeightClass="min-h-[160px]"
                  />

                  <LeafletPinPicker
                    title="Delivery pin"
                    committed={dropPin}
                    suggestedCenter={dropPin ?? ASSIGN_MAP_DEFAULT}
                    searchSeed={dropAddr}
                    onCommit={(la, ln) => {
                      dropUserRef.current = true;
                      setDropPin({ lat: la, lng: ln });
                    }}
                    minHeightClass="min-h-[160px]"
                  />

                  {!coordsReady && !geoWorking ? (
                    <p className="rounded-lg border border-amber-200 bg-amber-50 px-2 py-1.5 text-[11px] text-amber-900">
                      Set both pins or fix addresses.
                    </p>
                  ) : null}
                </>
              )}
              {submitError ? <p className="break-words text-xs text-rose-600">{submitError}</p> : null}
            </div>

            <div className="mt-auto flex min-w-0 flex-col gap-2 pt-0.5 sm:flex-row">
              <button
                type="button"
                onClick={onClose}
                className="w-full min-w-0 rounded-xl border border-gray-200 bg-white py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 sm:flex-1"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={submitting || !selectedId || !coordsReady}
                onClick={handleAssign}
                className="inline-flex w-full min-w-0 flex-1 items-center justify-center gap-2 rounded-xl bg-violet-600 py-2.5 text-sm font-semibold text-white shadow-md transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-50 sm:min-w-[200px]"
              >
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Bike className="h-4 w-4" />}
                Assign to order
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
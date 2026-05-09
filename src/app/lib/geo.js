/**
 * Food-admin heuristics: many backends send 0 / 0 as "unset".
 * Rejects (0, anything), (anything, 0), and (0, 0). Adjust if you need prime meridian / equator.
 */
export function isUsableLatLng(lat, lng) {
  if (lat == null || lng == null) return false;
  if (typeof lat === 'string' && lat.trim() === '') return false;
  if (typeof lng === 'string' && lng.trim() === '') return false;
  const la = Number(lat);
  const ln = Number(lng);
  if (!Number.isFinite(la) || !Number.isFinite(ln)) return false;
  if (la === 0 || ln === 0) return false;
  if (Math.abs(la) > 90 || Math.abs(ln) > 180) return false;
  return true;
}

export function parseLatLng(latRaw, lngRaw) {
  return isUsableLatLng(latRaw, lngRaw) ? { lat: Number(latRaw), lng: Number(lngRaw) } : null;
}

/**
 * Reads lat/lng from one object using common REST / GeoJSON shapes (nested `location`, camelCase, etc.).
 */
export function parseLatLngFromRecord(rec) {
  if (!rec || typeof rec !== 'object') return null;
  const pairs = [
    [rec.latitude, rec.longitude],
    [rec.lat, rec.lng],
    [rec.geo_lat, rec.geo_lng],
    [rec.geo_latitude, rec.geo_longitude],
    [rec.Latitude, rec.Longitude],
    [rec.pickup_latitude, rec.pickup_longitude],
    [rec.delivery_latitude, rec.delivery_longitude],
  ];
  for (const [la, ln] of pairs) {
    const p = parseLatLng(la, ln);
    if (p) return p;
  }
  const loc = rec.location;
  if (loc && typeof loc === 'object') {
    const nested = parseLatLngFromRecord(loc);
    if (nested) return nested;
  }
  if (rec.type === 'Point' && Array.isArray(rec.coordinates) && rec.coordinates.length >= 2) {
    const lng = Number(rec.coordinates[0]);
    const lat = Number(rec.coordinates[1]);
    return parseLatLng(lat, lng);
  }
  return null;
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isUuidString(s) {
  return typeof s === 'string' && UUID_RE.test(s.trim());
}

/**
 * Delivery APIs often expect the numeric DB id; the admin URL may use the same UUID as `order.id`.
 * Prefer a pure-numeric `order.order_id` when the route id is a UUID and the numeric id differs.
 */
export function resolveDeliveryAssignmentOrderId(routeOrderId, order) {
  const route = String(routeOrderId ?? '').trim();
  const id = order?.id != null ? String(order.id).trim() : '';
  const legacyRaw = order?.order_id != null ? String(order.order_id).trim() : '';
  const legacyNumeric = /^\d+$/.test(legacyRaw);
  const routeIsUuid = isUuidString(route);

  if (legacyNumeric && routeIsUuid && legacyRaw !== route) {
    return { orderId: legacyRaw, orderUuid: id && isUuidString(id) ? id : route };
  }
  if (route) return { orderId: route, orderUuid: id && isUuidString(id) && id !== route ? id : '' };
  if (id) return { orderId: id, orderUuid: '' };
  if (legacyRaw) return { orderId: legacyRaw, orderUuid: '' };
  return { orderId: '', orderUuid: '' };
}

/**
 * Obvious lat/lng field swap: longitude stored in `latitude` (e.g. ~44) and latitude in `longitude` (~33).
 */
export function normalizeLikelySwappedLatLng(lat, lng) {
  const la = Number(lat);
  const ln = Number(lng);
  if (!Number.isFinite(la) || !Number.isFinite(ln)) return null;
  if (Math.abs(la) > 90 && Math.abs(ln) <= 90) return { lat: ln, lng: la };
  if (Math.abs(ln) > 180 && Math.abs(la) <= 180) return { lat: ln, lng: la };
  // MENA: Baghdad-like (lat ~33, lng ~44) often saved reversed as lat=44, lng=33
  if (la >= 37 && la <= 52 && ln >= 28 && ln <= 39 && la > ln) {
    return { lat: ln, lng: la };
  }
  return { lat: la, lng: ln };
}

/** Rough bbox check so bad geocode / swapped coords fail before hitting the API. */
export function coordsRoughlyMatchAddressHints(address, lat, lng) {
  const t = String(address || '').toLowerCase();
  const la = Number(lat);
  const ln = Number(lng);
  if (!Number.isFinite(la) || !Number.isFinite(ln)) return false;
  if (t.includes('iraq') || t.includes('baghdad')) {
    return la >= 28 && la <= 38.5 && ln >= 38 && ln <= 51;
  }
  if (t.includes('pakistan') || t.includes('karachi') || t.includes('sindh') || t.includes('lahore')) {
    return la >= 23 && la <= 37.5 && ln >= 60 && ln <= 75;
  }
  return true;
}

import { NextResponse } from 'next/server';

const NOMINATIM = 'https://nominatim.openstreetmap.org/search';

/**
 * Forward-geocode a free-text address (server-side only; respects Nominatim usage policy).
 * GET ?q=full+address
 */
export async function GET(request) {
  const q = request.nextUrl.searchParams.get('q')?.trim();
  if (!q || q.length < 2) {
    return NextResponse.json({ message: 'Query q is required' }, { status: 400 });
  }

  try {
    const url = `${NOMINATIM}?format=json&limit=1&q=${encodeURIComponent(q)}`;
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'AdminPanel/1.0 (order pickup geocode)',
        Accept: 'application/json',
        'Accept-Language': 'en',
      },
      cache: 'no-store',
    });

    if (!res.ok) {
      return NextResponse.json({ message: 'Geocoding service error' }, { status: 502 });
    }

    const data = await res.json();
    const first = Array.isArray(data) ? data[0] : null;
    if (!first?.lat || !first?.lon) {
      return NextResponse.json({ message: 'No results for this address' }, { status: 404 });
    }

    const lat = Number(first.lat);
    const lng = Number(first.lon);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      return NextResponse.json({ message: 'Invalid geocode result' }, { status: 502 });
    }

    return NextResponse.json({
      lat,
      lng,
      display_name: typeof first.display_name === 'string' ? first.display_name : '',
    });
  } catch (e) {
    return NextResponse.json(
      { message: e?.message || 'Geocoding failed' },
      { status: 500 }
    );
  }
}

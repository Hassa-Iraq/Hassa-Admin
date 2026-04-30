import { NextResponse } from 'next/server';
import { API_BASE_URL } from '@/app/config';

const REQUEST_TIMEOUT_MS = 15000;

export async function GET(request, { params }) {
  try {
    const resolvedParams = params ? await params : {};
    const payoutId = resolvedParams?.payout_id;
    if (!payoutId) {
      return NextResponse.json({ message: 'payout_id is required' }, { status: 400 });
    }

    const authorization = request.headers.get('authorization');
    const cookieToken = request.cookies.get('token')?.value;
    const authHeader = authorization || (cookieToken ? `Bearer ${cookieToken}` : '');

    const { searchParams } = new URL(request.url);
    const query = new URLSearchParams();
    for (const [k, v] of searchParams.entries()) {
      if (v !== undefined && v !== null && String(v).trim() !== '') {
        query.set(k, v);
      }
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
      const backendResponse = await fetch(
        `${API_BASE_URL}/api/wallet/admin/payouts/${encodeURIComponent(String(payoutId))}${
          query.toString() ? `?${query.toString()}` : ''
        }`,
        {
          method: 'GET',
          headers: {
            ...(authHeader ? { Authorization: authHeader } : {}),
          },
          signal: controller.signal,
        }
      );

      const data = await backendResponse.json().catch(() => ({}));
      return NextResponse.json(data, { status: backendResponse.status });
    } finally {
      clearTimeout(timeout);
    }
  } catch (error) {
    const timeoutLike =
      error?.name === 'AbortError' ||
      String(error?.message || '').toLowerCase().includes('aborted') ||
      String(error?.message || '').toLowerCase().includes('timed out');

    if (timeoutLike) {
      return NextResponse.json({ message: 'Backend request timed out. Please try again.' }, { status: 504 });
    }

    return NextResponse.json({ message: error?.message || 'Failed to fetch payout details' }, { status: 500 });
  }
}


import { NextResponse } from 'next/server';
import { API_BASE_URL } from '@/app/config';

const REQUEST_TIMEOUT_MS = 15000;

const getAuthHeader = (request) => {
  const authorization = request.headers.get('authorization');
  const cookieToken = request.cookies.get('token')?.value;
  return authorization || (cookieToken ? `Bearer ${cookieToken}` : '');
};

const isTimeoutLike = (error) => {
  return (
    error?.name === 'AbortError' ||
    String(error?.message || '').toLowerCase().includes('aborted') ||
    String(error?.message || '').toLowerCase().includes('timed out')
  );
};

export async function GET(request) {
  try {
    const authHeader = getAuthHeader(request);
    const { searchParams } = new URL(request.url);
    const params = new URLSearchParams();
    for (const [k, v] of searchParams.entries()) {
      if (v !== undefined && v !== null && String(v).trim() !== '') {
        params.set(k, v);
      }
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    try {
      const backendResponse = await fetch(
        `${API_BASE_URL}/api/admin/analytics/reports/wallet/transactions?${params.toString()}`,
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
    if (isTimeoutLike(error)) {
      return NextResponse.json(
        { message: 'Backend request timed out. Please try again.' },
        { status: 504 }
      );
    }
    return NextResponse.json(
      { message: error?.message || 'Failed to fetch wallet transactions report' },
      { status: 500 }
    );
  }
}


import { NextResponse } from 'next/server';
import axios from 'axios';
import { API_BASE_URL } from '@/app/config';

const REQUEST_TIMEOUT_MS = 15000;

const joinBackendUrl = (baseUrl, path, search) => {
  const base = String(baseUrl || '').replace(/\/+$/, '');
  const cleanPath = `/${String(path || '').replace(/^\/+/, '')}`;
  const cleanSearch = String(search || '');
  return `${base}${cleanPath}${cleanSearch}`;
};

const getAuthHeader = (request) => {
  const authorization = request.headers.get('authorization');
  const cookieToken = request.cookies.get('token')?.value;
  return authorization || (cookieToken ? `Bearer ${cookieToken}` : '');
};

const getErrorResponse = (error, fallbackMessage) => {
  if (axios.isAxiosError(error)) {
    const status = error.response?.status || 500;
    const message =
      error.response?.data?.message ||
      error.response?.data ||
      error.message ||
      fallbackMessage;
    return NextResponse.json({ message }, { status });
  }

  return NextResponse.json(
    { message: error?.message || fallbackMessage },
    { status: 500 }
  );
};

export async function GET(request) {
  try {
    const authHeader = getAuthHeader(request);
    const search = request.nextUrl.search || '';

    const base = String(API_BASE_URL || '').replace(/\/+$/, '');
    // Some environments set API_BASE_URL to ".../api/admin".
    // In that case, avoid duplicating "/api/admin" in the upstream request.
    // Backend path (per API collection): /api/admin/analytics/reports/transactions
    const upstreamPath = base.endsWith('/api/admin')
      ? '/analytics/reports/transactions'
      : '/api/admin/analytics/reports/transactions';

    const backendResponse = await axios.get(
      joinBackendUrl(base, upstreamPath, search),
      {
        headers: {
          ...(authHeader ? { Authorization: authHeader } : {}),
        },
        timeout: REQUEST_TIMEOUT_MS,
      }
    );

    return NextResponse.json(backendResponse.data, {
      status: backendResponse.status,
    });
  } catch (error) {
    return getErrorResponse(error, 'Failed to fetch transaction report');
  }
}


import { NextResponse } from 'next/server';
import axios from 'axios';
import { API_BASE_URL } from '@/app/config';

const REQUEST_TIMEOUT_MS = 15000;

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

    const backendResponse = await axios.get(
      `${API_BASE_URL}/api/admin/analytics/popular-restaurants${search}`,
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
    return getErrorResponse(error, 'Failed to fetch popular restaurants');
  }
}


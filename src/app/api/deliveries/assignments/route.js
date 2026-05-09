import { NextResponse } from 'next/server';
import axios from 'axios';
import { API_BASE_URL } from '@/app/config';

const REQUEST_TIMEOUT_MS = 20000;

const getAuthHeader = (request) => {
  const authorization = request.headers.get('authorization');
  const cookieToken = request.cookies.get('token')?.value;
  return authorization || (cookieToken ? `Bearer ${cookieToken}` : '');
};

export async function POST(request) {
  try {
    const body = await request.json();
    const authHeader = getAuthHeader(request);

    if (!body?.order_id && body?.order_id !== 0) {
      return NextResponse.json({ message: 'order_id is required' }, { status: 400 });
    }
    if (!body?.driver_user_id && body?.driver_user_id !== 0) {
      return NextResponse.json({ message: 'driver_user_id is required' }, { status: 400 });
    }

    const backendResponse = await axios.post(
      `${API_BASE_URL}/api/deliveries/assignments`,
      body,
      {
        headers: {
          ...(authHeader ? { Authorization: authHeader } : {}),
          'Content-Type': 'application/json',
        },
        timeout: REQUEST_TIMEOUT_MS,
      }
    );

    return NextResponse.json(backendResponse.data, { status: backendResponse.status });
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const timeoutLike =
        error.code === 'ECONNABORTED' ||
        error.code === 'ETIMEDOUT' ||
        String(error.message || '').toLowerCase().includes('timedout');
      if (timeoutLike) {
        return NextResponse.json(
          { message: 'Assign delivery request timed out. Please try again.' },
          { status: 504 }
        );
      }
      const status = error.response?.status || 500;
      const message =
        error.response?.data?.message ||
        error.response?.data ||
        error.message ||
        'Failed to assign delivery';
      return NextResponse.json(
        typeof message === 'string' ? { message } : { message: 'Failed to assign delivery', details: message },
        { status }
      );
    }
    return NextResponse.json(
      { message: error?.message || 'Failed to assign delivery' },
      { status: 500 }
    );
  }
}

import { NextResponse } from 'next/server';
import axios from 'axios';
import { API_BASE_URL } from '../../../config';

const REQUEST_TIMEOUT_MS = 15000;

export async function GET(request) {
  try {
    const authorization = request.headers.get('authorization');
    const cookieToken = request.cookies.get('token')?.value;
    const authHeader = authorization || (cookieToken ? `Bearer ${cookieToken}` : '');
    const search = request.nextUrl.search || '';

    const backendResponse = await axios.get(`${API_BASE_URL}/api/orders/customers${search}`, {
      headers: {
        ...(authHeader ? { Authorization: authHeader } : {}),
      },
      timeout: REQUEST_TIMEOUT_MS,
    });

    return NextResponse.json(backendResponse.data, { status: backendResponse.status });
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const timeoutLike =
        error.code === 'ECONNABORTED' ||
        error.code === 'ETIMEDOUT' ||
        String(error.message || '').toLowerCase().includes('timedout');

      if (timeoutLike) {
        return NextResponse.json(
          { message: 'Backend request timed out. Please try again.' },
          { status: 504 }
        );
      }

      const status = error.response?.status || 500;
      const message =
        error.response?.data?.message ||
        error.response?.data ||
        error.message ||
        'Failed to fetch order customers';

      return NextResponse.json({ message }, { status });
    }

    return NextResponse.json(
      { message: error?.message || 'Failed to fetch order customers' },
      { status: 500 }
    );
  }
}

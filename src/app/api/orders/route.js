import { NextResponse } from 'next/server';
import axios from 'axios';
import { API_BASE_URL } from '../../config';

export async function GET(request) {
  try {
    const authorization = request.headers.get('authorization');
    const cookieToken = request.cookies.get('token')?.value;
    const authHeader = authorization || (cookieToken ? `Bearer ${cookieToken}` : '');
    const search = request.nextUrl.search || '';

    const backendResponse = await axios.get(`${API_BASE_URL}/api/orders/${search}`, {
      headers: {
        ...(authHeader ? { Authorization: authHeader } : {}),
      },
    });

    return NextResponse.json(backendResponse.data, { status: backendResponse.status });
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status || 500;
      const message =
        error.response?.data?.message ||
        error.response?.data ||
        error.message ||
        'Failed to fetch orders';

      return NextResponse.json({ message }, { status });
    }

    return NextResponse.json(
      { message: error?.message || 'Failed to fetch orders' },
      { status: 500 }
    );
  }
}

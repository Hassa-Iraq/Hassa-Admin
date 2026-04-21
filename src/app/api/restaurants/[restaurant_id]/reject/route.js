import { NextResponse } from 'next/server';
import axios from 'axios';
import { API_BASE_URL } from '@/app/config';

export async function PATCH(request, { params }) {
  try {
    const { restaurant_id: restaurantId } = await params;
    const body = await request.json().catch(() => ({}));
    const reason = typeof body?.reason === 'string' ? body.reason : '';

    const authorization = request.headers.get('authorization');
    const cookieToken = request.cookies.get('token')?.value;
    const authHeader = authorization || (cookieToken ? `Bearer ${cookieToken}` : '');

    const backendResponse = await axios.patch(
      `${API_BASE_URL}/api/restaurants/${restaurantId}/reject`,
      { reason },
      {
        headers: {
          ...(authHeader ? { Authorization: authHeader } : {}),
        },
      }
    );

    return NextResponse.json(backendResponse.data, { status: backendResponse.status });
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status || 500;
      const message =
        error.response?.data?.message ||
        error.response?.data ||
        error.message ||
        'Failed to reject restaurant';
      return NextResponse.json({ message }, { status });
    }

    return NextResponse.json(
      { message: error?.message || 'Failed to reject restaurant' },
      { status: 500 }
    );
  }
}


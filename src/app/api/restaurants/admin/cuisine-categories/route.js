import { NextResponse } from 'next/server';
import axios from 'axios';
import { API_BASE_URL } from '../../../../config';

export async function GET(request) {
  try {
    const authorization = request.headers.get('authorization');
    const cookieToken = request.cookies.get('token')?.value;
    const authHeader = authorization || (cookieToken ? `Bearer ${cookieToken}` : '');
    const search = request.nextUrl.search || '';

    const backendResponse = await axios.get(
      `${API_BASE_URL}/api/restaurants/admin/cuisine-categories${search}`,
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
        'Failed to fetch cuisine categories';
      return NextResponse.json({ message }, { status });
    }
    return NextResponse.json(
      { message: error?.message || 'Failed to fetch cuisine categories' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  let normalizedPayload = null;
  try {
    const payload = await request.json();
    const authorization = request.headers.get('authorization');
    const cookieToken = request.cookies.get('token')?.value;
    const authHeader = authorization || (cookieToken ? `Bearer ${cookieToken}` : '');

    normalizedPayload = {
      name: typeof payload?.name === 'string' ? payload.name.trim() : '',
      image_url: typeof payload?.image_url === 'string' ? payload.image_url.trim() : '',
      display_order: payload?.display_order ?? payload?.displayOrder ?? 1,
      is_active: payload?.is_active ?? payload?.isActive ?? true,
    };

    const backendResponse = await axios.post(
      `${API_BASE_URL}/api/restaurants/admin/cuisine-categories`,
      normalizedPayload,
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
        'Failed to create cuisine category';
      return NextResponse.json(
        {
          message,
          forwarded_payload: normalizedPayload,
          backend_response: error.response?.data || null,
        },
        { status }
      );
    }
    return NextResponse.json(
      { message: error?.message || 'Failed to create cuisine category' },
      { status: 500 }
    );
  }
}


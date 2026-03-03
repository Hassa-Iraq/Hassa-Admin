import { NextResponse } from 'next/server';
import axios from 'axios';
import { API_BASE_URL } from '../../../config';

export async function GET(request) {
  try {
    const authorization = request.headers.get('authorization');
    const cookieToken = request.cookies.get('token')?.value;
    const authHeader = authorization || (cookieToken ? `Bearer ${cookieToken}` : '');
    const search = request.nextUrl.search || '';
    const restaurantId = request.nextUrl.searchParams.get('restaurant_id') || '';
    if (!restaurantId) {
      return NextResponse.json(
        { message: 'restaurant_id is required' },
        { status: 400 }
      );
    }

    const backendResponse = await axios.get(`${API_BASE_URL}/api/restaurants/menu-categories${search}`, {
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
        'Failed to fetch categories';

      return NextResponse.json({ message }, { status });
    }

    return NextResponse.json(
      { message: error?.message || 'Failed to fetch categories' },
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
    const headers = {
      ...(authHeader ? { Authorization: authHeader } : {}),
    };

    const resolvedImage =
      (typeof payload?.image_url === 'string' && payload.image_url.trim()) ||
      (typeof payload?.image === 'string' && payload.image.trim()) ||
      '';
    const restaurantId =
      typeof payload?.restaurant_id === 'string'
        ? payload.restaurant_id.trim()
        : payload?.restaurant_id;
    if (!restaurantId) {
      return NextResponse.json(
        { message: 'restaurant_id is required' },
        { status: 400 }
      );
    }

    normalizedPayload = {
      restaurant_id: restaurantId,
      parent_id: payload?.parent_id ?? null,
      name: typeof payload?.name === 'string' ? payload.name.trim() : '',
      description: typeof payload?.description === 'string' ? payload.description.trim() : '',
      image_url: resolvedImage,
      display_order: payload?.display_order ?? 1,
    };

    const backendResponse = await axios.post(`${API_BASE_URL}/api/restaurants/menu-categories`, normalizedPayload, {
      headers,
    });
    return NextResponse.json(backendResponse.data, { status: backendResponse.status });
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status || 500;
      const message =
        error.response?.data?.message ||
        error.response?.data ||
        error.message ||
        'Failed to create category';
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
      { message: error?.message || 'Failed to create category' },
      { status: 500 }
    );
  }
}

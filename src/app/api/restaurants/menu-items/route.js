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

    const backendResponse = await axios.get(`${API_BASE_URL}/api/restaurants/menu-items${search}`, {
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
        'Failed to fetch menu items';

      return NextResponse.json({ message }, { status });
    }

    return NextResponse.json(
      { message: error?.message || 'Failed to fetch menu items' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const payload = await request.json();
    const authorization = request.headers.get('authorization');
    const cookieToken = request.cookies.get('token')?.value;
    const authHeader = authorization || (cookieToken ? `Bearer ${cookieToken}` : '');
    const backendResponse = await axios.post(`${API_BASE_URL}/api/restaurants/menu-items`, payload, {
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
        'Failed to create menu item';

      return NextResponse.json({ message }, { status });
    }

    return NextResponse.json(
      { message: error?.message || 'Failed to create menu item' },
      { status: 500 }
    );
  }
}

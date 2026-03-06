import { NextResponse } from 'next/server';
import axios from 'axios';
import { API_BASE_URL } from '../../../config';

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

export async function GET(request, context) {
  try {
    const { restaurant_id: restaurantId } = await context.params;
    if (!restaurantId) {
      return NextResponse.json({ message: 'restaurant_id is required' }, { status: 400 });
    }

    const authHeader = getAuthHeader(request);
    const backendResponse = await axios.get(`${API_BASE_URL}/api/restaurants/${restaurantId}`, {
      headers: {
        ...(authHeader ? { Authorization: authHeader } : {}),
      },
    });

    return NextResponse.json(backendResponse.data, { status: backendResponse.status });
  } catch (error) {
    return getErrorResponse(error, 'Failed to fetch restaurant');
  }
}

export async function PUT(request, context) {
  try {
    const { restaurant_id: restaurantId } = await context.params;
    if (!restaurantId) {
      return NextResponse.json({ message: 'restaurant_id is required' }, { status: 400 });
    }

    const payload = await request.json();
    const authHeader = getAuthHeader(request);
    const backendResponse = await axios.put(
      `${API_BASE_URL}/api/restaurants/${restaurantId}`,
      payload,
      {
        headers: {
          ...(authHeader ? { Authorization: authHeader } : {}),
        },
      }
    );

    return NextResponse.json(backendResponse.data, { status: backendResponse.status });
  } catch (error) {
    return getErrorResponse(error, 'Failed to update restaurant');
  }
}

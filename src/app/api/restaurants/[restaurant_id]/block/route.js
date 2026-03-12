import { NextResponse } from 'next/server';
import axios from 'axios';
import { API_BASE_URL } from '../../../../config';

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

export async function PATCH(request, context) {
  try {
    const { restaurant_id: restaurantId } = await context.params;
    if (!restaurantId) {
      return NextResponse.json({ message: 'restaurant_id is required' }, { status: 400 });
    }

    const authHeader = getAuthHeader(request);
    const candidateEndpoints = [
      `/api/restaurants/${restaurantId}/block`,
      `/api/restaurants/admin/${restaurantId}/block`,
    ];
    let lastAxiosError = null;

    for (const endpoint of candidateEndpoints) {
      try {
        const backendResponse = await axios.patch(
          `${API_BASE_URL}${endpoint}`,
          {},
          {
            headers: {
              ...(authHeader ? { Authorization: authHeader } : {}),
            },
          }
        );
        return NextResponse.json(backendResponse.data, { status: backendResponse.status });
      } catch (error) {
        if (axios.isAxiosError(error) && error.response?.status === 404) {
          lastAxiosError = error;
          continue;
        }
        throw error;
      }
    }

    if (lastAxiosError) {
      throw lastAxiosError;
    }
    throw new Error('Restaurant block endpoint not found');
  } catch (error) {
    return getErrorResponse(error, 'Failed to block restaurant');
  }
}

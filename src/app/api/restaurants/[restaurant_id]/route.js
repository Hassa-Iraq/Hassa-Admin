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

const parseDesiredIsActive = (payload = {}) => {
  if (typeof payload?.is_active === 'boolean') return payload.is_active;
  if (typeof payload?.active === 'boolean') return payload.active;
  if (typeof payload?.restaurant?.is_active === 'boolean') return payload.restaurant.is_active;
  if (typeof payload?.restaurant?.active === 'boolean') return payload.restaurant.active;
  return null;
};

const parseResponseIsActive = (responseData = {}) => {
  const payload =
    responseData?.data && typeof responseData.data === 'object'
      ? responseData.data
      : responseData;
  const restaurant =
    payload?.restaurant ||
    payload?.data?.restaurant ||
    payload;

  if (typeof restaurant?.is_active === 'boolean') return restaurant.is_active;
  if (restaurant?.is_active === 1) return true;
  if (restaurant?.is_active === 0) return false;
  if (typeof restaurant?.active === 'boolean') return restaurant.active;
  return null;
};

export async function GET(request, context) {
  try {
    const { restaurant_id: restaurantId } = await context.params;
    if (!restaurantId) {
      return NextResponse.json({ message: 'restaurant_id is required' }, { status: 400 });
    }

    const authHeader = getAuthHeader(request);
    const candidateEndpoints = [
      `/api/restaurants/${restaurantId}`,
      `/api/restaurants/admin/${restaurantId}`,
    ];
    let lastAxiosError = null;

    for (const endpoint of candidateEndpoints) {
      try {
        const backendResponse = await axios.get(`${API_BASE_URL}${endpoint}`, {
          headers: {
            ...(authHeader ? { Authorization: authHeader } : {}),
          },
        });
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
    throw new Error('Restaurant details endpoint not found');
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
    const desiredIsActive = parseDesiredIsActive(payload);
    const candidateEndpoints = [
      `/api/restaurants/admin/${restaurantId}`,
      `/api/restaurants/${restaurantId}`,
    ];
    let lastAxiosError = null;

    for (const endpoint of candidateEndpoints) {
      try {
        const backendResponse = await axios.put(
          `${API_BASE_URL}${endpoint}`,
          payload,
          {
            headers: {
              ...(authHeader ? { Authorization: authHeader } : {}),
            },
          }
        );
        const responseIsActive = parseResponseIsActive(backendResponse.data);
        if (
          desiredIsActive !== null &&
          responseIsActive !== null &&
          responseIsActive !== desiredIsActive &&
          endpoint !== candidateEndpoints[candidateEndpoints.length - 1]
        ) {
          continue;
        }
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
    throw new Error('Restaurant update endpoint not found');
  } catch (error) {
    return getErrorResponse(error, 'Failed to update restaurant');
  }
}

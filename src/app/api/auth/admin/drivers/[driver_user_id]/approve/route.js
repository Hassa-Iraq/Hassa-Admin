import { NextResponse } from 'next/server';
import axios from 'axios';
import { API_BASE_URL } from '@/app/config';

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
    const { driver_user_id: driverUserId } = await context.params;
    if (!driverUserId) {
      return NextResponse.json({ message: 'driver_user_id is required' }, { status: 400 });
    }

    const authHeader = getAuthHeader(request);
    const backendResponse = await axios.patch(
      `${API_BASE_URL}/api/auth/admin/drivers/${driverUserId}/approve`,
      {},
      {
        headers: {
          ...(authHeader ? { Authorization: authHeader } : {}),
        },
      }
    );

    return NextResponse.json(backendResponse.data, { status: backendResponse.status });
  } catch (error) {
    return getErrorResponse(error, 'Failed to approve deliveryman');
  }
}


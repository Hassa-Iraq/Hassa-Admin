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

export async function POST(request) {
  try {
    const payload = await request.json();
    const authHeader = getAuthHeader(request);
    const backendResponse = await axios.post(
      `${API_BASE_URL}/api/auth/drivers`,
      payload,
      {
        headers: {
          ...(authHeader ? { Authorization: authHeader } : {}),
        },
      }
    );

    return NextResponse.json(backendResponse.data, { status: backendResponse.status });
  } catch (error) {
    return getErrorResponse(error, 'Failed to add deliveryman');
  }
}

export async function GET(request) {
  try {
    const authHeader = getAuthHeader(request);
    const search = request.nextUrl.search || '';
    const backendResponse = await axios.get(`${API_BASE_URL}/api/auth/drivers${search}`, {
      headers: {
        ...(authHeader ? { Authorization: authHeader } : {}),
      },
    });

    return NextResponse.json(backendResponse.data, { status: backendResponse.status });
  } catch (error) {
    return getErrorResponse(error, 'Failed to fetch deliverymen');
  }
}

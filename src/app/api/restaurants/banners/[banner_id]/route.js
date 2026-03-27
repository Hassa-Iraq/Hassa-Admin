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
  return NextResponse.json({ message: error?.message || fallbackMessage }, { status: 500 });
};

export async function GET(request, context) {
  try {
    const { banner_id: bannerId } = await context.params;
    if (!bannerId) {
      return NextResponse.json({ message: 'banner_id is required' }, { status: 400 });
    }

    const authHeader = getAuthHeader(request);
    const backendResponse = await axios.get(`${API_BASE_URL}/api/restaurants/banners/${bannerId}`, {
      headers: {
        ...(authHeader ? { Authorization: authHeader } : {}),
      },
    });
    return NextResponse.json(backendResponse.data, { status: backendResponse.status });
  } catch (error) {
    return getErrorResponse(error, 'Failed to fetch banner');
  }
}

export async function DELETE(request, context) {
  try {
    const { banner_id: bannerId } = await context.params;
    if (!bannerId) {
      return NextResponse.json({ message: 'banner_id is required' }, { status: 400 });
    }
    const authHeader = getAuthHeader(request);
    const backendResponse = await axios.delete(`${API_BASE_URL}/api/restaurants/banners/${bannerId}`, {
      headers: {
        ...(authHeader ? { Authorization: authHeader } : {}),
      },
    });
    return NextResponse.json(backendResponse.data, { status: backendResponse.status });
  } catch (error) {
    return getErrorResponse(error, 'Failed to delete banner');
  }
}

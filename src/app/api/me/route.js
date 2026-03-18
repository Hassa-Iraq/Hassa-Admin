import { NextResponse } from 'next/server';
import axios from 'axios';
import { API_BASE_URL } from '../../config';

export async function GET(request) {
  try {
    const authorization = request.headers.get('authorization');
    const cookieToken = request.cookies.get('token')?.value;
    const authHeader = authorization || (cookieToken ? `Bearer ${cookieToken}` : '');
    const bearerToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : cookieToken || '';
    const headers = {
      Accept: 'application/json',
      ...(authHeader ? { Authorization: authHeader } : {}),
      ...(bearerToken ? { token: bearerToken, 'x-access-token': bearerToken } : {}),
    };
    const backendResponse = await axios.get(`${API_BASE_URL}/api/auth/me`, { headers });
    return NextResponse.json(backendResponse.data, { status: backendResponse.status });
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status || 500;
      const message =
        error.response?.data?.message ||
        error.response?.data ||
        error.message ||
        'Failed to fetch profile';

      return NextResponse.json({ message }, { status });
    }

    return NextResponse.json(
      { message: error?.message || 'Failed to fetch profile' },
      { status: 500 }
    );
  }
}

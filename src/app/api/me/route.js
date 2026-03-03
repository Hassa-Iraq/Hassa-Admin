import { NextResponse } from 'next/server';
import axios from 'axios';
import { API_BASE_URL } from '../../config';

export async function GET(request) {
  try {
    const authorization = request.headers.get('authorization');
    const cookieToken = request.cookies.get('token')?.value;
    const authHeader = authorization || (cookieToken ? `Bearer ${cookieToken}` : '');
    const headers = {
      ...(authHeader ? { Authorization: authHeader } : {}),
    };

    const candidateEndpoints = ['/api/me', '/api/auth/me', '/api/admin/me', '/api/user/me', '/api/profile'];
    let lastAxiosError = null;

    for (const endpoint of candidateEndpoints) {
      try {
        const backendResponse = await axios.get(`${API_BASE_URL}${endpoint}`, { headers });
        return NextResponse.json(backendResponse.data, { status: backendResponse.status });
      } catch (error) {
        if (axios.isAxiosError(error)) {
          if (error.response?.status === 404) {
            lastAxiosError = error;
            continue;
          }
          const status = error.response?.status || 500;
          const message =
            error.response?.data?.message ||
            error.response?.data ||
            error.message ||
            'Failed to fetch profile';
          return NextResponse.json({ message }, { status });
        }
        throw error;
      }
    }

    if (lastAxiosError) {
      return NextResponse.json(
        { message: 'Profile endpoint not found on backend. Please confirm the correct /me path.' },
        { status: 404 }
      );
    }
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

import { NextResponse } from 'next/server';
import axios from 'axios';
import { API_BASE_URL } from '../../../config';

const REQUEST_TIMEOUT_MS = 12000;

const pickFirstUserFromPayload = (payload, userId) => {
  const direct =
    payload?.data?.user ||
    payload?.user ||
    payload?.data?.customer ||
    payload?.customer ||
    null;
  if (direct && typeof direct === 'object' && !Array.isArray(direct)) return direct;

  const list =
    payload?.data?.users ||
    payload?.users ||
    payload?.data?.customers ||
    payload?.customers ||
    payload?.data?.list ||
    payload?.list ||
    [];

  if (!Array.isArray(list)) return null;
  return (
    list.find((item) => {
      const directId = String(item?.id || item?.user_id || item?.userId || '').trim();
      const nestedUserId = String(item?.user?.id || item?.customer?.id || '').trim();
      return (directId && directId === userId) || (nestedUserId && nestedUserId === userId);
    }) || list[0] || null
  );
};

export async function GET(request, context) {
  try {
    const { user_id: userIdRaw } = await context.params;
    const userId = String(userIdRaw || '').trim();
    if (!userId) {
      return NextResponse.json({ message: 'user_id is required' }, { status: 400 });
    }

    const authorization = request.headers.get('authorization');
    const cookieToken = request.cookies.get('token')?.value;
    const authHeader = authorization || (cookieToken ? `Bearer ${cookieToken}` : '');

    const candidateEndpoints = [
      `/api/auth/users/${userId}`,
      `/api/users/${userId}`,
      `/api/auth/customers/${userId}`,
      `/api/customers/${userId}`,
      `/api/auth/admin/users/${userId}`,
      `/api/auth/admin/customers/${userId}`,
      `/api/auth/users?id=${userId}`,
      `/api/users?id=${userId}`,
      `/api/auth/customers?user_id=${userId}&page=1&limit=1`,
      `/api/customers?user_id=${userId}&page=1&limit=1`,
      `/api/auth/admin/customers?page=1&limit=100&search=${userId}`,
      `/api/auth/admin/customers?page=1&limit=100&user_id=${userId}`,
      `/api/auth/admin/customers?page=1&limit=100&id=${userId}`,
      `/api/customers?page=1&limit=100&search=${userId}`,
      `/api/customers?page=1&limit=100&user_id=${userId}`,
    ];

    let lastAxiosError = null;

    for (const endpoint of candidateEndpoints) {
      try {
        const backendResponse = await axios.get(`${API_BASE_URL}${endpoint}`, {
          headers: {
            ...(authHeader ? { Authorization: authHeader } : {}),
          },
          timeout: REQUEST_TIMEOUT_MS,
        });

        const picked = pickFirstUserFromPayload(backendResponse.data, userId);
        if (picked) {
          return NextResponse.json(
            {
              success: true,
              data: { user: picked },
            },
            { status: 200 }
          );
        }
      } catch (error) {
        if (axios.isAxiosError(error) && [404, 405].includes(error.response?.status || 0)) {
          lastAxiosError = error;
          continue;
        }
        throw error;
      }
    }

    if (lastAxiosError) {
      return NextResponse.json(
        { message: 'User endpoint not found or no user returned for this id.' },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: 'User not found.' }, { status: 404 });
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const timeoutLike =
        error.code === 'ECONNABORTED' ||
        error.code === 'ETIMEDOUT' ||
        String(error.message || '').toLowerCase().includes('timedout');
      if (timeoutLike) {
        return NextResponse.json(
          { message: 'User details request timed out. Please retry.' },
          { status: 504 }
        );
      }

      const status = error.response?.status || 500;
      const message =
        error.response?.data?.message ||
        error.response?.data ||
        error.message ||
        'Failed to fetch user';

      return NextResponse.json({ message }, { status });
    }

    return NextResponse.json(
      { message: error?.message || 'Failed to fetch user' },
      { status: 500 }
    );
  }
}

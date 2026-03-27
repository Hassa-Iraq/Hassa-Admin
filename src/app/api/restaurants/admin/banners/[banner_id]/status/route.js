import { NextResponse } from 'next/server';
import axios from 'axios';
import { API_BASE_URL } from '../../../../../../config';

export async function PATCH(request, context) {
  try {
    const { banner_id: bannerId } = await context.params;
    if (!bannerId) {
      return NextResponse.json({ message: 'banner_id is required' }, { status: 400 });
    }

    const authorization = String(request.headers.get('authorization') || '').trim();
    const cookieToken = String(request.cookies.get('token')?.value || '').trim();
    const cookieAuthHeader = cookieToken ? `Bearer ${cookieToken}` : '';
    const payload = await request.json();
    const authCandidates = Array.from(new Set([authorization, cookieAuthHeader].filter(Boolean)));
    if (authCandidates.length === 0) {
      authCandidates.push('');
    }

    let lastError = null;
    for (const authHeader of authCandidates) {
      try {
        const backendResponse = await axios.patch(
          `${API_BASE_URL}/api/restaurants/admin/banners/${bannerId}/status`,
          payload,
          {
            headers: {
              ...(authHeader ? { Authorization: authHeader } : {}),
            },
          }
        );
        return NextResponse.json(backendResponse.data, { status: backendResponse.status });
      } catch (error) {
        lastError = error;
        if (!axios.isAxiosError(error)) break;
        const status = error.response?.status || 500;
        // Retry with next token source only for auth/permission errors.
        if (status !== 401 && status !== 403) break;
      }
    }

    throw lastError || new Error('Failed to update banner status');
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status || 500;
      const message =
        error.response?.data?.message ||
        error.response?.data ||
        error.message ||
        'Failed to update banner status';
      return NextResponse.json({ message }, { status });
    }
    return NextResponse.json(
      { message: error?.message || 'Failed to update banner status' },
      { status: 500 }
    );
  }
}

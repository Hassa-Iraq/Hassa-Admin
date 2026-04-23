import { NextResponse } from 'next/server';
import { API_BASE_URL } from '@/app/config';

const REQUEST_TIMEOUT_MS = 15000;

export async function POST(request, { params }) {
  try {
    const resolvedParams = params ? await params : {};
    const walletUserId = resolvedParams?.wallet_user_id;
    if (!walletUserId) {
      return NextResponse.json({ message: 'wallet_user_id is required' }, { status: 400 });
    }

    const authorization = request.headers.get('authorization');
    const cookieToken = request.cookies.get('token')?.value;
    const authHeader = authorization || (cookieToken ? `Bearer ${cookieToken}` : '');

    const payload = await request.json().catch(() => ({}));

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
      const backendResponse = await fetch(
        `${API_BASE_URL}/api/wallet/admin/wallets/${encodeURIComponent(String(walletUserId))}/add-funds`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(authHeader ? { Authorization: authHeader } : {}),
          },
          body: JSON.stringify(payload ?? {}),
          signal: controller.signal,
        }
      );

      const data = await backendResponse.json().catch(() => ({}));
      return NextResponse.json(data, { status: backendResponse.status });
    } finally {
      clearTimeout(timeout);
    }
  } catch (error) {
    const timeoutLike =
      error?.name === 'AbortError' ||
      String(error?.message || '').toLowerCase().includes('aborted') ||
      String(error?.message || '').toLowerCase().includes('timed out');

    if (timeoutLike) {
      return NextResponse.json({ message: 'Backend request timed out. Please try again.' }, { status: 504 });
    }

    return NextResponse.json({ message: error?.message || 'Failed to add funds' }, { status: 500 });
  }
}


import { NextResponse } from 'next/server';
import { API_BASE_URL } from '../../../../config';

export async function POST(request) {
  try {
    const authorization = request.headers.get('authorization');
    const cookieToken = request.cookies.get('token')?.value;
    const authHeader = authorization || (cookieToken ? `Bearer ${cookieToken}` : '');

    const incomingFormData = await request.formData();
    const forwardedFormData = new FormData();

    for (const [key, value] of incomingFormData.entries()) {
      forwardedFormData.append(key, value);
    }

    const backendResponse = await fetch(`${API_BASE_URL}/api/restaurants/uploads/restaurant-assets`, {
      method: 'POST',
      headers: {
        ...(authHeader ? { Authorization: authHeader } : {}),
      },
      body: forwardedFormData,
      cache: 'no-store',
    });

    const raw = await backendResponse.text();
    let data = {};

    if (raw) {
      try {
        data = JSON.parse(raw);
      } catch {
        data = { message: raw };
      }
    }

    return NextResponse.json(data, { status: backendResponse.status });
  } catch (error) {
    return NextResponse.json(
      { message: error?.message || 'Failed to upload restaurant assets' },
      { status: 500 }
    );
  }
}

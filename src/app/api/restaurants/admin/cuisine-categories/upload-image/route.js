import { NextResponse } from 'next/server';
import { API_BASE_URL } from '../../../../../config';

export async function POST(request) {
  try {
    const authorization = request.headers.get('authorization');
    const cookieToken = request.cookies.get('token')?.value;
    const authHeader = authorization || (cookieToken ? `Bearer ${cookieToken}` : '');

    const incomingFormData = await request.formData();
    const isFileLike = (value) =>
      value &&
      typeof value === 'object' &&
      typeof value.arrayBuffer === 'function' &&
      typeof value.type === 'string';

    const hasImage =
      isFileLike(incomingFormData.get('cuisine_category_image')) ||
      isFileLike(incomingFormData.get('image')) ||
      isFileLike(incomingFormData.get('category_image'));
    if (!hasImage) {
      return NextResponse.json(
        { message: 'Image file is required for cuisine category upload' },
        { status: 400 }
      );
    }

    const endpoint = '/api/restaurants/admin/cuisine-categories/upload-image';

    const parseBackendPayload = async (backendResponse) => {
      const raw = await backendResponse.text();
      if (!raw) return {};
      try {
        return JSON.parse(raw);
      } catch {
        return { message: raw };
      }
    };

    const forwardedFormData = new FormData();
    for (const [key, value] of incomingFormData.entries()) {
      forwardedFormData.append(key, value);
    }

    const backendResponse = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        ...(authHeader ? { Authorization: authHeader } : {}),
      },
      body: forwardedFormData,
      cache: 'no-store',
    });

    const data = await parseBackendPayload(backendResponse);
    return NextResponse.json(data, { status: backendResponse.status });
  } catch (error) {
    return NextResponse.json(
      { message: error?.message || 'Failed to upload cuisine category image' },
      { status: 500 }
    );
  }
}


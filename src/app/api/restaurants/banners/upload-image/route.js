import { NextResponse } from 'next/server';
import { API_BASE_URL } from '../../../../config';

const parseBackendPayload = async (backendResponse) => {
  const raw = await backendResponse.text();
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch {
    return { message: raw };
  }
};

export async function POST(request) {
  try {
    const authorization = request.headers.get('authorization');
    const cookieToken = request.cookies.get('token')?.value;
    const authHeader = authorization || (cookieToken ? `Bearer ${cookieToken}` : '');

    const incomingFormData = await request.formData();
    const imageFile =
      incomingFormData.get('banner_image') ||
      incomingFormData.get('image');

    const isFileLike = (value) =>
      value &&
      typeof value === 'object' &&
      typeof value.arrayBuffer === 'function' &&
      typeof value.type === 'string';

    if (!isFileLike(imageFile)) {
      return NextResponse.json(
        { message: 'Image file is required for banner upload' },
        { status: 400 }
      );
    }

    const forwardedFormData = new FormData();
    for (const [key, value] of incomingFormData.entries()) {
      if (key === 'banner_image' || key === 'image') continue;
      forwardedFormData.append(key, value);
    }
    forwardedFormData.append('banner_image', imageFile);

    const backendResponse = await fetch(`${API_BASE_URL}/api/restaurants/banners/upload-image`, {
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
      { message: error?.message || 'Failed to upload banner image' },
      { status: 500 }
    );
  }
}

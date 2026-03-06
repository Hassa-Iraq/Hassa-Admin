import { NextResponse } from 'next/server';
import { API_BASE_URL } from '../../../../config';

export async function POST(request) {
  try {
    const authorization = request.headers.get('authorization');
    const cookieToken = request.cookies.get('token')?.value;
    const authHeader = authorization || (cookieToken ? `Bearer ${cookieToken}` : '');

    const incomingFormData = await request.formData();
    const image =
      incomingFormData.get('profile_picture') ||
      incomingFormData.get('image') ||
      incomingFormData.get('file');
    const isFileLike =
      image &&
      typeof image === 'object' &&
      typeof image.arrayBuffer === 'function' &&
      typeof image.type === 'string';

    if (!isFileLike) {
      return NextResponse.json({ message: 'Image file is required' }, { status: 400 });
    }

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
    if (
      !forwardedFormData.has('profile_picture') &&
      !forwardedFormData.has('image') &&
      !forwardedFormData.has('file')
    ) {
      forwardedFormData.append('profile_picture', image);
    }

    const backendResponse = await fetch(`${API_BASE_URL}/api/auth/profile/upload-image`, {
      method: 'POST',
      headers: {
        ...(authHeader ? { Authorization: authHeader } : {}),
      },
      body: forwardedFormData,
      cache: 'no-store',
    });

    const payload = await parseBackendPayload(backendResponse);
    return NextResponse.json(payload, { status: backendResponse.status });
  } catch (error) {
    return NextResponse.json(
      { message: error?.message || 'Failed to upload image' },
      { status: 500 }
    );
  }
}

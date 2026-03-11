import { NextResponse } from 'next/server';
import { API_BASE_URL } from '@/app/config';

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

    const isFileLike = (value) =>
      value &&
      typeof value === 'object' &&
      typeof value.arrayBuffer === 'function' &&
      typeof value.type === 'string';

    const fileKeys = ['delivery_man_picture', 'vehicle_image', 'driving_license_picture'];
    const hasAnyAssetFile = fileKeys.some((key) => isFileLike(incomingFormData.get(key)));
    if (!hasAnyAssetFile) {
      return NextResponse.json(
        { message: 'At least one driver asset file is required' },
        { status: 400 }
      );
    }

    const forwardedFormData = new FormData();
    for (const [key, value] of incomingFormData.entries()) {
      forwardedFormData.append(key, value);
    }

    if (!forwardedFormData.has('save_to_driver')) {
      forwardedFormData.append('save_to_driver', 'false');
    }

    const backendResponse = await fetch(`${API_BASE_URL}/api/auth/drivers/upload-assets`, {
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
      { message: error?.message || 'Failed to upload driver assets' },
      { status: 500 }
    );
  }
}

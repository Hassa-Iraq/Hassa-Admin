import { NextResponse } from 'next/server';
import { API_BASE_URL } from '../../../../config';

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

    const fileKeys = ['logo', 'cover_image', 'certificate', 'license_document'];
    const hasAnyAssetFile = fileKeys.some((key) => isFileLike(incomingFormData.get(key)));
    if (!hasAnyAssetFile) {
      return NextResponse.json(
        { message: 'At least one restaurant asset file is required' },
        { status: 400 }
      );
    }

    const candidateEndpoints = [
      '/api/restaurants/uploads/restaurant-assets',
      '/api/restaurants/admin/uploads/restaurant-assets',
    ];

    const parseBackendPayload = async (backendResponse) => {
      const raw = await backendResponse.text();
      if (!raw) return {};
      try {
        return JSON.parse(raw);
      } catch {
        return { message: raw };
      }
    };

    let saw404 = false;
    let lastErrorData = null;
    let lastErrorStatus = 500;

    for (const endpoint of candidateEndpoints) {
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
      if (backendResponse.ok) {
        return NextResponse.json(data, { status: backendResponse.status });
      }
      if (backendResponse.status === 404) {
        saw404 = true;
        continue;
      }
      lastErrorData = data;
      lastErrorStatus = backendResponse.status || 500;
    }

    if (saw404 && !lastErrorData) {
      return NextResponse.json(
        { message: 'Restaurant asset upload endpoint not found on backend. Please verify backend upload route.' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      lastErrorData || { message: 'Failed to upload restaurant assets' },
      { status: lastErrorStatus }
    );
  } catch (error) {
    return NextResponse.json(
      { message: error?.message || 'Failed to upload restaurant assets' },
      { status: 500 }
    );
  }
}

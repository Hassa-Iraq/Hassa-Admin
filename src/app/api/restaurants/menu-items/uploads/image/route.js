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

    const imageFile =
      incomingFormData.get('menu_item_image') ||
      incomingFormData.get('item_image') ||
      incomingFormData.get('image');

    if (!isFileLike(imageFile)) {
      return NextResponse.json(
        { message: 'Image file is required for menu item upload' },
        { status: 400 }
      );
    }

    const candidateEndpoints = [
      '/api/restaurants/menu-items/uploads/image',
      '/api/restaurants/admin/menu-items/uploads/image',
    ];
    const candidateImageKeys = ['menu_item_image', 'item_image', 'image'];

    const parseBackendPayload = async (backendResponse) => {
      const raw = await backendResponse.text();
      if (!raw) return {};
      try {
        return JSON.parse(raw);
      } catch {
        return { message: raw };
      }
    };

    let lastErrorData = null;
    let lastErrorStatus = 500;

    for (const endpoint of candidateEndpoints) {
      for (const imageKey of candidateImageKeys) {
        const forwardedFormData = new FormData();
        for (const [key, value] of incomingFormData.entries()) {
          if (key === 'image' || key === 'item_image' || key === 'menu_item_image') continue;
          forwardedFormData.append(key, value);
        }
        forwardedFormData.append(imageKey, imageFile);

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

        lastErrorData = data;
        lastErrorStatus = backendResponse.status || 500;
      }
    }

    return NextResponse.json(
      lastErrorData || { message: 'Failed to upload menu item image' },
      { status: lastErrorStatus }
    );
  } catch (error) {
    return NextResponse.json(
      { message: error?.message || 'Failed to upload menu item image' },
      { status: 500 }
    );
  }
}

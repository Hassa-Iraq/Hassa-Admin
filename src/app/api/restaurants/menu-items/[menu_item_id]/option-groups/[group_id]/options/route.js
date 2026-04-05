import { NextResponse } from 'next/server';
import axios from 'axios';
import { API_BASE_URL } from '../../../../../../../config';

const getAuthHeader = (request) => {
  const authorization = request.headers.get('authorization');
  const cookieToken = request.cookies.get('token')?.value;
  return authorization || (cookieToken ? `Bearer ${cookieToken}` : '');
};

const getErrorResponse = (error, fallbackMessage) => {
  if (axios.isAxiosError(error)) {
    const status = error.response?.status || 500;
    const message =
      error.response?.data?.message ||
      error.response?.data ||
      error.message ||
      fallbackMessage;
    return NextResponse.json({ message }, { status });
  }
  return NextResponse.json({ message: error?.message || fallbackMessage }, { status: 500 });
};

export async function POST(request, context) {
  try {
    const { menu_item_id: menuItemId, group_id: groupId } = await context.params;
    if (!menuItemId || !groupId) {
      return NextResponse.json({ message: 'menu_item_id and group_id are required' }, { status: 400 });
    }
    const payload = await request.json();
    const authHeader = getAuthHeader(request);
    const backendResponse = await axios.post(
      `${API_BASE_URL}/api/restaurants/menu-items/${menuItemId}/option-groups/${groupId}/options`,
      payload,
      {
        headers: {
          'Content-Type': 'application/json',
          ...(authHeader ? { Authorization: authHeader } : {}),
        },
      }
    );
    return NextResponse.json(backendResponse.data, { status: backendResponse.status });
  } catch (error) {
    return getErrorResponse(error, 'Failed to create option');
  }
}

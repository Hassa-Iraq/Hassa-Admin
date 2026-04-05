import { NextResponse } from 'next/server';
import axios from 'axios';
import { API_BASE_URL } from '../../../../../../../../config';

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

export async function PATCH(request, context) {
  try {
    const { menu_item_id: menuItemId, group_id: groupId, option_id: optionId } = await context.params;
    if (!menuItemId || !groupId || !optionId) {
      return NextResponse.json(
        { message: 'menu_item_id, group_id, and option_id are required' },
        { status: 400 }
      );
    }
    const payload = await request.json();
    const authHeader = getAuthHeader(request);
    const backendResponse = await axios.patch(
      `${API_BASE_URL}/api/restaurants/menu-items/${menuItemId}/option-groups/${groupId}/options/${optionId}`,
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
    return getErrorResponse(error, 'Failed to update option');
  }
}

export async function DELETE(request, context) {
  try {
    const { menu_item_id: menuItemId, group_id: groupId, option_id: optionId } = await context.params;
    if (!menuItemId || !groupId || !optionId) {
      return NextResponse.json(
        { message: 'menu_item_id, group_id, and option_id are required' },
        { status: 400 }
      );
    }
    const authHeader = getAuthHeader(request);
    const backendResponse = await axios.delete(
      `${API_BASE_URL}/api/restaurants/menu-items/${menuItemId}/option-groups/${groupId}/options/${optionId}`,
      {
        headers: {
          ...(authHeader ? { Authorization: authHeader } : {}),
        },
      }
    );
    return NextResponse.json(backendResponse.data, { status: backendResponse.status });
  } catch (error) {
    return getErrorResponse(error, 'Failed to delete option');
  }
}

import { NextResponse } from 'next/server';
import axios from 'axios';
import { API_BASE_URL } from '../../../../config';

const REQUEST_TIMEOUT_MS = 15000;

export async function PATCH(request, context) {
  try {
    const { order_id: orderId } = await context.params;
    if (!orderId) {
      return NextResponse.json({ message: 'order_id is required' }, { status: 400 });
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ message: 'Invalid JSON body' }, { status: 400 });
    }

    const status = body?.status;
    if (status === undefined || status === null || String(status).trim() === '') {
      return NextResponse.json({ message: 'status is required' }, { status: 400 });
    }

    const payload = {
      status: String(status).trim(),
      reason:
        body?.reason != null && String(body.reason).trim() !== ''
          ? String(body.reason).trim()
          : 'Order status updated',
    };

    const authorization = request.headers.get('authorization');
    const cookieToken = request.cookies.get('token')?.value;
    const authHeader = authorization || (cookieToken ? `Bearer ${cookieToken}` : '');

    const backendResponse = await axios.patch(
      `${API_BASE_URL}/api/orders/${encodeURIComponent(String(orderId).trim())}/status`,
      payload,
      {
        headers: {
          ...(authHeader ? { Authorization: authHeader } : {}),
          'Content-Type': 'application/json',
        },
        timeout: REQUEST_TIMEOUT_MS,
      }
    );

    return NextResponse.json(backendResponse.data, { status: backendResponse.status });
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const timeoutLike =
        error.code === 'ECONNABORTED' ||
        error.code === 'ETIMEDOUT' ||
        String(error.message || '').toLowerCase().includes('timedout');
      if (timeoutLike) {
        return NextResponse.json(
          { message: 'Update order status request timed out. Please try again.' },
          { status: 504 }
        );
      }

      const status = error.response?.status || 500;
      const message =
        error.response?.data?.message ||
        error.response?.data ||
        error.message ||
        'Failed to update order status';

      return NextResponse.json(
        typeof message === 'string' ? { message } : { message: 'Failed to update order status', details: message },
        { status }
      );
    }

    return NextResponse.json(
      { message: error?.message || 'Failed to update order status' },
      { status: 500 }
    );
  }
}

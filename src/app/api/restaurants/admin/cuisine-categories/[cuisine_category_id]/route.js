import { NextResponse } from 'next/server';
import axios from 'axios';
import { API_BASE_URL } from '../../../../../config';

const resolveCuisineCategoryId = (request, context) => {
  const rawFromContext =
    context?.params?.cuisine_category_id ??
    context?.cuisine_category_id ??
    '';
  const normalizedFromContext = rawFromContext ? String(rawFromContext).trim() : '';
  if (normalizedFromContext) return normalizedFromContext;

  // Fallback when Next calls handler without context/params (or trailing slash issues).
  const pathname = request?.nextUrl?.pathname || '';
  const parts = pathname.split('/').filter(Boolean);
  const last = parts[parts.length - 1] || '';
  return last && last !== 'cuisine-categories' ? String(last).trim() : '';
};

export async function GET(request, context) {
  try {
    const cuisineCategoryId = resolveCuisineCategoryId(request, context);
    if (!cuisineCategoryId) {
      return NextResponse.json({ message: 'cuisine_category_id is required' }, { status: 400 });
    }

    const authorization = request.headers.get('authorization');
    const cookieToken = request.cookies.get('token')?.value;
    const authHeader = authorization || (cookieToken ? `Bearer ${cookieToken}` : '');

    const requestConfig = {
      headers: {
        ...(authHeader ? { Authorization: authHeader } : {}),
      },
    };

    try {
      const backendResponse = await axios.get(
        `${API_BASE_URL}/api/restaurants/admin/cuisine-categories/${cuisineCategoryId}`,
        requestConfig
      );
      return NextResponse.json(backendResponse.data, { status: backendResponse.status });
    } catch (error) {
      // Some backends don't expose a single GET endpoint (only list + patch/delete).
      if (axios.isAxiosError(error) && (error.response?.status === 404 || error.response?.status === 405)) {
        const search = request.nextUrl.search || '';
        const params = new URLSearchParams(search);
        if (!params.get('page')) params.set('page', '1');
        if (!params.get('limit')) params.set('limit', '200');
        const listResponse = await axios.get(
          `${API_BASE_URL}/api/restaurants/admin/cuisine-categories?${params.toString()}`,
          requestConfig
        );
        const payload =
          listResponse.data?.data && typeof listResponse.data.data === 'object'
            ? listResponse.data.data
            : listResponse.data;
        const list =
          payload?.cuisine_categories ||
          payload?.categories ||
          payload?.list ||
          listResponse.data?.cuisine_categories ||
          listResponse.data?.list ||
          payload ||
          [];
        const found = (Array.isArray(list) ? list : []).find((item) => {
          const id =
            item?.id ??
            item?.cuisine_category_id ??
            item?.cuisineCategoryId ??
            item?.cuisine_id ??
            '';
          return String(id).trim() === String(cuisineCategoryId).trim();
        });
        if (!found) {
          return NextResponse.json({ message: 'Cuisine category not found' }, { status: 404 });
        }
        return NextResponse.json({ cuisine_category: found }, { status: 200 });
      }
      throw error;
    }
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status || 500;
      const message =
        error.response?.data?.message ||
        error.response?.data ||
        error.message ||
        'Failed to fetch cuisine category';
      return NextResponse.json({ message }, { status });
    }
    return NextResponse.json(
      { message: error?.message || 'Failed to fetch cuisine category' },
      { status: 500 }
    );
  }
}

export async function PATCH(request, context) {
  let normalizedPayload = null;
  try {
    const cuisineCategoryId = resolveCuisineCategoryId(request, context);
    if (!cuisineCategoryId) {
      return NextResponse.json({ message: 'cuisine_category_id is required' }, { status: 400 });
    }

    const payload = await request.json();
    const authorization = request.headers.get('authorization');
    const cookieToken = request.cookies.get('token')?.value;
    const authHeader = authorization || (cookieToken ? `Bearer ${cookieToken}` : '');

    normalizedPayload = {
      name: typeof payload?.name === 'string' ? payload.name.trim() : '',
      image_url: typeof payload?.image_url === 'string' ? payload.image_url.trim() : '',
      display_order: payload?.display_order ?? payload?.displayOrder ?? 1,
      is_active: payload?.is_active ?? payload?.isActive ?? true,
    };

    const backendResponse = await axios.patch(
      `${API_BASE_URL}/api/restaurants/admin/cuisine-categories/${cuisineCategoryId}`,
      normalizedPayload,
      {
        headers: {
          ...(authHeader ? { Authorization: authHeader } : {}),
        },
      }
    );

    return NextResponse.json(backendResponse.data, { status: backendResponse.status });
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status || 500;
      const message =
        error.response?.data?.message ||
        error.response?.data ||
        error.message ||
        'Failed to update cuisine category';
      return NextResponse.json(
        {
          message,
          forwarded_payload: normalizedPayload,
          backend_response: error.response?.data || null,
        },
        { status }
      );
    }
    return NextResponse.json(
      { message: error?.message || 'Failed to update cuisine category' },
      { status: 500 }
    );
  }
}

export async function DELETE(request, context) {
  try {
    const cuisineCategoryId = resolveCuisineCategoryId(request, context);
    if (!cuisineCategoryId) {
      return NextResponse.json({ message: 'cuisine_category_id is required' }, { status: 400 });
    }

    const authorization = request.headers.get('authorization');
    const cookieToken = request.cookies.get('token')?.value;
    const authHeader = authorization || (cookieToken ? `Bearer ${cookieToken}` : '');

    const backendResponse = await axios.delete(
      `${API_BASE_URL}/api/restaurants/admin/cuisine-categories/${cuisineCategoryId}`,
      {
        headers: {
          ...(authHeader ? { Authorization: authHeader } : {}),
        },
      }
    );

    return NextResponse.json(backendResponse.data, { status: backendResponse.status });
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status || 500;
      const message =
        error.response?.data?.message ||
        error.response?.data ||
        error.message ||
        'Failed to delete cuisine category';
      return NextResponse.json({ message }, { status });
    }
    return NextResponse.json(
      { message: error?.message || 'Failed to delete cuisine category' },
      { status: 500 }
    );
  }
}


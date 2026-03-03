import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    const imageUrl = request.nextUrl.searchParams.get('url') || '';
    if (!imageUrl) {
      return NextResponse.json(
        { message: 'url is required' },
        { status: 400 }
      );
    }

    const authorization = request.headers.get('authorization');
    const cookieToken = request.cookies.get('token')?.value;
    const authHeader = authorization || (cookieToken ? `Bearer ${cookieToken}` : '');

    const backendResponse = await fetch(imageUrl, {
      method: 'GET',
      headers: {
        ...(authHeader ? { Authorization: authHeader } : {}),
      },
      cache: 'no-store',
    });

    const contentType = backendResponse.headers.get('content-type') || 'application/octet-stream';
    const body = await backendResponse.arrayBuffer();

    return new Response(body, {
      status: backendResponse.status,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    return NextResponse.json(
      { message: error?.message || 'Failed to fetch category image' },
      { status: 500 }
    );
  }
}

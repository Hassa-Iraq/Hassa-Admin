import { NextResponse } from 'next/server';
import axios from 'axios';
import { API_BASE_URL } from '@/app/config';

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

  return NextResponse.json(
    { message: error?.message || fallbackMessage },
    { status: 500 }
  );
};

export async function GET(request, context) {
  try {
    const { employee_user_id: employeeUserId } = await context.params;
    if (!employeeUserId) {
      return NextResponse.json({ message: 'employee_user_id is required' }, { status: 400 });
    }

    const authHeader = getAuthHeader(request);
    const backendResponse = await axios.get(
      `${API_BASE_URL}/api/auth/admin/employees/${employeeUserId}`,
      {
        headers: {
          ...(authHeader ? { Authorization: authHeader } : {}),
        },
      }
    );

    return NextResponse.json(backendResponse.data, { status: backendResponse.status });
  } catch (error) {
    return getErrorResponse(error, 'Failed to fetch employee');
  }
}

const updateEmployee = async (request, context) => {
  const { employee_user_id: employeeUserId } = await context.params;
  if (!employeeUserId) {
    return NextResponse.json({ message: 'employee_user_id is required' }, { status: 400 });
  }

  const payload = await request.json();
  const authHeader = getAuthHeader(request);
  const backendResponse = await axios.patch(
    `${API_BASE_URL}/api/auth/admin/employees/${employeeUserId}`,
    payload,
    {
      headers: {
        ...(authHeader ? { Authorization: authHeader } : {}),
      },
    }
  );

  return NextResponse.json(backendResponse.data, { status: backendResponse.status });
};

export async function PUT(request, context) {
  try {
    // Backend only supports PATCH for employee updates.
    return await updateEmployee(request, context);
  } catch (error) {
    return getErrorResponse(error, 'Failed to update employee');
  }
}

export async function PATCH(request, context) {
  try {
    return await updateEmployee(request, context);
  } catch (error) {
    return getErrorResponse(error, 'Failed to update employee');
  }
}

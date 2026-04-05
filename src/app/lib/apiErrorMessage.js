/**
 * Human-readable API error for axios failures. Maps 403 to product copy when appropriate.
 */
export function apiErrorMessage(error, fallback = 'Something went wrong.') {
  if (!error) return fallback;
  if (typeof error === 'string') return error;
  const status = error.response?.status;
  const body = error.response?.data;
  const serverMsg =
    (typeof body === 'string' ? body : null) ||
    (typeof body?.message === 'string' ? body.message : null);
  if (status === 403) {
    if (serverMsg?.trim()) return serverMsg.trim();
    return "You don't have permission to perform this action.";
  }
  const msg = serverMsg || error.message || fallback;
  return typeof msg === 'string' ? msg : fallback;
}

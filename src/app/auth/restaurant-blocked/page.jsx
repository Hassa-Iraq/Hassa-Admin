import Link from 'next/link';
 
export default async function RestaurantBlockedPage({ searchParams }) {
  const params = await searchParams;
  const reason = String(params?.reason || '').toLowerCase();
  const isInactive = reason === 'inactive';

  return (
    <div className="w-full max-w-2xl overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-xl">
      <div className="bg-gradient-to-r from-[#6001D2] to-[#7C3AED] px-6 py-5 sm:px-8">
        <p className="text-xs font-medium uppercase tracking-wide text-white/80">
          Access Restricted
        </p>
        <div className="mt-3 flex items-center gap-3">
          <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-white/15">
            <svg viewBox="0 0 24 24" className="h-6 w-6 text-white" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2a5 5 0 0 0-5 5v3H6a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7a2 2 0 0 0-2-2h-1V7a5 5 0 0 0-5-5Z" />
            </svg>
          </div>
          <h1 className="text-2xl font-semibold text-white sm:text-3xl">
            {isInactive ? 'Restaurant Account Not Active' : 'Restaurant Account Blocked'}
          </h1>
        </div>
      </div>

      <div className="px-6 py-6 sm:px-8 sm:py-8">
        <p className="text-sm leading-6 text-gray-600">
          {isInactive
            ? 'Your restaurant account is currently not active, so login access is disabled. Please contact Hassa officials to activate your account.'
            : 'Your restaurant access is temporarily disabled. For re-activation, please contact Hassa officials and share your registered restaurant email or phone number.'}
        </p>

        <div className="mt-5 rounded-2xl border border-gray-100 bg-gray-50 px-4 py-3 text-sm text-gray-700">
          <p><span className="font-medium">Support Email:</span> support@hassa.app</p>
          <p className="mt-1"><span className="font-medium">Support Hours:</span> Mon - Sat, 9:00 AM - 6:00 PM</p>
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
          <a
            href="mailto:support@hassa.app"
            className="inline-flex justify-center rounded-xl bg-[#6001D2] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#4f01ad]"
          >
            Contact Hassa Officials
          </a>
          <Link
            href="/auth/login"
            className="inline-flex justify-center rounded-xl border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
}

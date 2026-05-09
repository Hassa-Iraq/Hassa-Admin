'use client';

import { Loader2 } from 'lucide-react';

const sizes = {
  xs: 'h-3.5 w-3.5',
  sm: 'h-4 w-4',
  md: 'h-8 w-8',
  lg: 'h-10 w-10',
};

/** Accessible spinner only — no visible loading copy */
export function LoadingSpinner({ size = 'md', className = '', label = 'Loading' }) {
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center ${className}`}
      role="status"
      aria-busy="true"
      aria-label={label}
    >
      <Loader2 className={`${sizes[size] || sizes.md} animate-spin text-violet-600`} aria-hidden />
    </span>
  );
}

export function CenteredSpinner({ className = '', minHeight = '12rem', label = 'Loading' }) {
  return (
    <div
      className={`flex flex-col items-center justify-center gap-2 ${className}`}
      style={{ minHeight }}
      role="status"
      aria-busy="true"
      aria-label={label}
    >
      <Loader2 className="h-10 w-10 animate-spin text-violet-600" aria-hidden />
    </div>
  );
}

export function ChartSkeleton({ className = '', heightClass = 'h-[260px]' }) {
  return (
    <div
      className={`w-full animate-pulse rounded-xl bg-gradient-to-b from-gray-100 to-gray-50 ${heightClass} ${className}`}
      role="status"
      aria-busy="true"
      aria-label="Loading chart"
    />
  );
}

export function FoodCardSkeletonGrid({ count = 8, columnsClass = 'grid-cols-2 md:grid-cols-4' }) {
  return (
    <div
      className={`grid ${columnsClass} gap-3`}
      role="status"
      aria-busy="true"
      aria-label="Loading"
    >
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex flex-col items-center rounded-lg border border-gray-200/60 p-3">
          <div className="mb-1.5 h-14 w-14 animate-pulse rounded-lg bg-gray-200/90" />
          <div className="h-3 w-20 animate-pulse rounded bg-gray-200/90" />
          <div className="mt-1 h-3 w-14 animate-pulse rounded bg-gray-200/80" />
        </div>
      ))}
    </div>
  );
}

export function FoodWideCardSkeletonGrid({ count = 6, columnsClass = 'grid-cols-2 md:grid-cols-3' }) {
  return (
    <div
      className={`grid ${columnsClass} gap-3`}
      role="status"
      aria-busy="true"
      aria-label="Loading"
    >
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex flex-col rounded-lg border border-gray-200/60 p-2">
          <div className="mb-1.5 h-20 w-full animate-pulse rounded-lg bg-gray-200/90" />
          <div className="mx-auto mt-1 h-3 w-[75%] max-w-[8rem] animate-pulse rounded bg-gray-200/90" />
        </div>
      ))}
    </div>
  );
}

export function PopularRestaurantRowSkeleton({ rows = 5 }) {
  return (
    <div className="space-y-3" role="status" aria-busy="true" aria-label="Loading">
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="flex animate-pulse items-center justify-between rounded-lg border border-[#6001D2]/30 bg-purple-50/50 p-3"
        >
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 shrink-0 rounded-full bg-gray-200/90" />
            <div className="h-4 w-36 rounded bg-gray-200/90" />
          </div>
          <div className="h-6 w-6 rounded bg-gray-200/80" />
        </div>
      ))}
    </div>
  );
}

export default LoadingSpinner;

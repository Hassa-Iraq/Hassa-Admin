'use client';

export default function TableLoadingSkeleton({ colSpan = 1, rows = 6 }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, index) => (
        <tr key={index} className="border-b border-gray-100 last:border-b-0">
          <td colSpan={colSpan} className="px-4 py-3">
            <div className="h-4 w-full animate-pulse rounded bg-gray-200/80" />
          </td>
        </tr>
      ))}
    </>
  );
}

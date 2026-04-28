export default function StatCard({ title, value, color, bg, icon, index, loading = false }) {
  const isBottomRow = index >= 4;
  const showSkeleton = loading || value === null || typeof value === 'undefined';

  return (
    <div
      className={`rounded-xl border-2 ${color} ${bg} p-4 flex ${
        isBottomRow ? "items-center gap-3" : "flex-col gap-2"
      }`}
    >
      {/* ICON */}
      {icon && (
        <div
          className={`w-6 h-6 flex items-center justify-center ${
            isBottomRow ? "" : "self-end"
          }`}
        >
          {icon}
        </div>
      )}

      {/* TEXT */}
      <div
        className={`${
          isBottomRow
            ? "flex items-center justify-between w-full"
            : ""
        }`}
      >
        <p className="text-sm text-gray-500">{title}</p>

        <h2
          className={`font-bold text-gray-900 ${
            isBottomRow ? "text-2xl" : "text-2xl"
          }`}
        >
          {showSkeleton ? (
            <span className="inline-block h-7 w-12 rounded-md bg-gray-200/80 animate-pulse align-middle" />
          ) : (
            value
          )}
        </h2>
      </div>
    </div>
  );
}

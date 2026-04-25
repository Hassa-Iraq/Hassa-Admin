export default function OrderStats({ children, rightContent = null }) {
  return (
    <div className="ui-card">
      {/* Header */}
      <div className="ui-card-header flex items-center justify-between gap-3 px-4 py-3">
        <h3 className="font-semibold text-gray-800">Order Statistics</h3>
        {rightContent}
      </div>

      {/* Cards */}
      <div className="p-4 grid grid-cols-2 md:grid-cols-4 gap-4">
        {children}
      </div>
    </div>
  );
}

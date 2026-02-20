export default function OrderStats({ children }) {
  return (
    <div className="bg-white rounded-xl border border-[#8A8A9E80] shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#8A8A9E80]">
        <h3 className="font-semibold text-gray-800">Order Statistics</h3>
      </div>

      {/* Cards */}
      <div className="p-4 grid grid-cols-2 md:grid-cols-4 gap-4">
        {children}
      </div>
    </div>
  );
}

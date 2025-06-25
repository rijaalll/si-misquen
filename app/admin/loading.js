export default function Loading() {
  return (
    <div className="fixed inset-0 bg-slate-100/20 backdrop-blur-xs bg-opacity-50 z-50 flex items-center justify-center">
      <div className="bg-white p-6 rounded-lg shadow-lg flex items-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <p className="ml-3 text-lg font-medium text-gray-700">Memuat halaman...</p>
      </div>
    </div>
  );
}

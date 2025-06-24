// app/misquen/layout.js
// Layout khusus untuk halaman pengguna (misquen).

"use client";

import { useAuth } from '@/context/AuthContext';
import ProtectedLayout from '@/controller/role.controller'; // Mengimpor ProtectedLayout
import { ArrowRightStartOnRectangleIcon } from '@heroicons/react/24/outline';

export default function MisquenRootLayout({ children }) {
  const { currentUser, logout } = useAuth();

  return (
    // Membungkus dengan ProtectedLayout untuk otentikasi dan otorisasi
    <ProtectedLayout allowedRoles={['user']}>
      <div className="flex flex-col min-h-screen bg-gray-50">
        {/* Header/Navbar Section untuk halaman misquen */}
        <header className="bg-gray-800 text-white p-4 shadow-lg flex justify-between items-center rounded-b-lg">
          {/* Judul Aplikasi atau Logo */}
          <h1 className="text-2xl font-bold tracking-wide">Si-Misquen</h1>
          {/* Info Pengguna dan Tombol Logout */}
          <div className="flex items-center space-x-4">
            {/* Menampilkan Nama Pengguna */}
            <span className="text-lg font-medium hidden sm:block"> {/* Sembunyikan di layar sangat kecil */}
              Halo, {currentUser?.fullName || currentUser?.userName}!
            </span>
            {/* Tombol Logout */}
            <button
              onClick={logout}
              className="bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded-lg shadow-sm transition duration-150 ease-in-out font-semibold text-sm flex items-center"
            >
              <ArrowRightStartOnRectangleIcon className="w-5 h-5 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Logout</span> {/* Sembunyikan teks di layar sangat kecil */}
            </button>
          </div>
        </header>

        {/* Area Konten Utama */}
        <main className="flex-grow p-6">
          {children} {/* Merender komponen anak (UserView) */}
        </main>

        {/* Footer Section */}
        <footer className="bg-gray-900 text-white p-4 text-center text-sm">
          <p>&copy; 2024 Si-Misquen. Semua hak dilindungi.</p>
        </footer>
      </div>
    </ProtectedLayout>
  );
}

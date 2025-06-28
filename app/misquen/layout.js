// app/misquen/layout.js
// Layout khusus untuk halaman pengguna (misquen).

"use client";

import { useAuth } from '@/context/AuthContext';
import ProtectedLayout from '@/controller/role.controller'; // Mengimpor ProtectedLayout
import { ArrowRightStartOnRectangleIcon, UserCircleIcon } from '@heroicons/react/24/outline';
import Link from 'next/link'; // Impor Link

export default function MisquenRootLayout({ children }) {
  const { currentUser, logout } = useAuth();

  return (
    // Membungkus dengan ProtectedLayout untuk otentikasi dan otorisasi
    <ProtectedLayout allowedRoles={['user']}>
      <div className="flex flex-col min-h-screen bg-gray-50">
        {/* Header/Navbar Section untuk halaman misquen */}
        <header className="bg-white text-gray-800 p-4 shadow-md flex justify-between items-center sticky top-0 z-40">
          {/* Judul Aplikasi atau Logo */}
          <Link href="/misquen">
            <h1 className="text-2xl font-bold tracking-wide text-blue-600">Si-Misquen</h1>
          </Link>
          {/* Info Pengguna dan Tombol Logout */}
          <div className="flex items-center space-x-4">
            {/* Menampilkan Nama Pengguna */}
            <span className="text-base font-medium hidden sm:block">
              Halo, {currentUser?.fullName || currentUser?.userName}!
            </span>
            
            {/* Tombol Profil */}
            <Link href="/misquen/profil" className="p-2 rounded-full hover:bg-gray-100 transition-colors">
                <UserCircleIcon className="w-7 h-7 text-gray-600"/>
            </Link>

            {/* Tombol Logout */}
            <button
              onClick={logout}
              className="bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded-lg shadow-sm transition duration-150 ease-in-out font-semibold text-sm flex items-center"
            >
              <ArrowRightStartOnRectangleIcon className="w-5 h-5 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </header>

        {/* Area Konten Utama */}
        <main className="flex-grow">
          {children} {/* Merender komponen anak (UserView atau ProfileView) */}
        </main>

        {/* Footer Section */}
        <footer className="bg-gray-800 text-white p-4 text-center text-sm">
          <p>&copy; {new Date().getFullYear()} Si-Misquen. Semua hak dilindungi.</p>
        </footer>
      </div>
    </ProtectedLayout>
  );
}

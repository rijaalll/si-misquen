// app/components/ProtectedLayout.js
// Komponen layout yang melindungi rute berdasarkan role pengguna.

"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';

const ProtectedLayout = ({ children, allowedRoles }) => {
  const { currentUser, loading, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!currentUser) {
        // Jika tidak ada user, redirect ke login
        router.push('/');
      } else if (!allowedRoles.includes(currentUser.role)) {
        // Jika user tidak memiliki role yang diizinkan, redirect ke halaman awal
        alert('Anda tidak memiliki akses ke halaman ini.'); // Menggunakan alert sebagai placeholder
        router.push('/');
      }
    }
  }, [currentUser, loading, router, allowedRoles]);

  if (loading || !currentUser || !allowedRoles.includes(currentUser.role)) {
    // Tampilkan loading atau apapun selama proses otentikasi
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="text-xl font-semibold text-gray-700">Memuat...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <header className="bg-gradient-to-r from-emerald-600 to-green-700 text-white p-4 shadow-md flex justify-between items-center">
        <h1 className="text-2xl font-bold">Koperasi Digital</h1>
        <div className="flex items-center space-x-4">
          <span className="text-lg">Halo, {currentUser.fullName || currentUser.userName}! ({currentUser.role})</span>
          <button
            onClick={logout}
            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md shadow-sm transition duration-150 ease-in-out"
          >
            Logout
          </button>
        </div>
      </header>
      <main className="flex-grow p-6">
        {children}
      </main>
      <footer className="bg-gray-800 text-white p-4 text-center">
        <p>&copy; 2024 Koperasi Digital. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default ProtectedLayout;

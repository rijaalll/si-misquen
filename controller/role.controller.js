// FILE KONTROLLER UNTUK ROLE
// Fokus pada autentikasi dan otorisasi berbasis peran.

"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

const ProtectedLayout = ({ children, allowedRoles }) => {
  const { currentUser, loading, logout } = useAuth();
  const router = useRouter();

  // Effect hook untuk menangani otentikasi pengguna dan akses berbasis peran
  useEffect(() => {
    // Setelah pemuatan selesai
    if (!loading) {
      // Jika tidak ada pengguna yang diautentikasi, alihkan ke halaman beranda
      if (!currentUser) {
        router.push('/');
      } 
      // Jika peran pengguna saat ini tidak diizinkan untuk halaman saat ini
      else if (!allowedRoles.includes(currentUser.role)) {
        // Mencatat pesan peringatan (menggantikan alert() yang mengganggu)
        console.warn('Akses ditolak: Anda tidak memiliki akses ke halaman ini.');
        // Alihkan ke halaman beranda
        router.push('/');
      }
    }
  }, [currentUser, loading, router, allowedRoles]); // Dependensi untuk efek

  // Menampilkan layar pemuatan saat status otentikasi sedang ditentukan
  // Atau jika pengguna tidak memiliki peran yang diizinkan
  if (loading || !currentUser || !allowedRoles.includes(currentUser.role)) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="text-xl font-semibold text-gray-700">Memuat...</div>
      </div>
    );
  }

  // Merender komponen anak jika pengguna diautentikasi dan diotorisasi
  // Tanpa navbar dan footer, karena ini akan ditangani oleh layout khusus admin.
  return <>{children}</>;
};

export default ProtectedLayout;

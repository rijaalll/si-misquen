// app/admin/layout.js
// Layout khusus untuk halaman admin.

"use client";

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import ProtectedLayout from '@/controller/role.controller'; // Mengimpor ProtectedLayout

import {
  HomeIcon,
  UserGroupIcon,
  CurrencyDollarIcon,
  BanknotesIcon,
  CreditCardIcon,
  ChartBarIcon,
  Bars3Icon, // Untuk toggle sidebar mobile
  XMarkIcon, // Untuk menutup sidebar mobile
  ArrowRightStartOnRectangleIcon // Untuk ikon logout
} from '@heroicons/react/24/outline';

export default function AdminRootLayout({ children }) {
  const { currentUser, logout } = useAuth();
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Definisi tautan navigasi admin
  const adminNavLinks = [
    { name: 'Dashboard', href: '/admin', icon: HomeIcon },
    { name: 'Manajemen Pengguna', href: '/admin/users', icon: UserGroupIcon },
    { name: 'Manajemen Bunga & Tenor', href: '/admin/bunga-tenor', icon: CurrencyDollarIcon },
    { name: 'Manajemen Simpanan', href: '/admin/simpanan', icon: BanknotesIcon },
    { name: 'Manajemen Pinjaman', href: '/admin/pinjaman', icon: CreditCardIcon },
    { name: 'Laporan Keuangan', href: '/admin/laporan', icon: ChartBarIcon },
  ];

  return (
    <ProtectedLayout allowedRoles={['admin']}>
      <div className="flex min-h-screen bg-gray-50">
        {/* Sidebar untuk Desktop */}
        <aside className="w-64 bg-gray-800 text-white p-4 hidden md:flex flex-col shadow-lg rounded-r-lg">
          <div className="text-2xl font-bold mb-8 text-center">Admin Panel</div>
          <nav className="flex-grow">
            <ul className="space-y-2">
              {adminNavLinks.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className={`flex items-center p-3 rounded-lg transition-colors 
                    ${pathname === link.href ? 'bg-blue-600 text-white shadow-md' : 'hover:bg-gray-700 text-gray-200'}`}>
                      <link.icon className="w-5 h-5 mr-3" />
                      <span className="font-medium">{link.name}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          {/* Logout button di desktop sidebar */}
          <div className="mt-auto pt-4 border-t border-gray-700">
            <button
              onClick={logout}
              className="w-full flex items-center justify-center bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg shadow-sm transition duration-150 ease-in-out font-semibold text-base"
            >
              <ArrowRightStartOnRectangleIcon className="w-5 h-5 mr-2" />
              Logout
            </button>
          </div>
        </aside>

        {/* Konten Utama */}
        <div className="flex-grow flex flex-col">
          {/* Header/Navbar untuk Mobile (hanya menampilkan toggle sidebar dan info user) */}
          <header className="bg-gray-800 text-white p-4 shadow-lg flex justify-between items-center md:hidden rounded-b-lg">
            <button onClick={() => setIsSidebarOpen(true)} className="p-2 rounded-md hover:bg-gray-700">
              <Bars3Icon className="w-6 h-6" />
            </button>
            <h1 className="text-xl font-bold tracking-wide">Admin Panel</h1>
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium">Halo, {currentUser?.fullName || currentUser?.userName}!</span>
            </div>
          </header>

          {/* Sidebar overlay untuk Mobile */}
          {isSidebarOpen && (
            <div className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden" onClick={() => setIsSidebarOpen(false)}></div>
          )}
          {isSidebarOpen && (
            <aside className="fixed top-0 left-0 w-64 h-full bg-gray-800 text-white p-4 flex flex-col shadow-lg z-50 md:hidden">
              <div className="flex justify-between items-center mb-8">
                <span className="text-2xl font-bold">Admin Panel</span>
                <button onClick={() => setIsSidebarOpen(false)} className="p-2 rounded-md hover:bg-gray-700">
                  <XMarkIcon className="w-6 h-6" />
                </button>
              </div>
              <nav className="flex-grow">
                <ul className="space-y-2">
                  {adminNavLinks.map((link) => (
                    <li key={link.href}>
                      <Link href={link.href} onClick={() => setIsSidebarOpen(false)} className={`flex items-center p-3 rounded-lg transition-colors 
                        ${pathname === link.href ? 'bg-blue-600 text-white shadow-md' : 'hover:bg-gray-700 text-gray-200'}`}>
                          <link.icon className="w-5 h-5 mr-3" />
                          <span className="font-medium">{link.name}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
              {/* Logout button di mobile sidebar */}
              <div className="mt-auto pt-4 border-t border-gray-700">
                <button
                  onClick={logout}
                  className="w-full flex items-center justify-center bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg shadow-sm transition duration-150 ease-in-out font-semibold text-base"
                >
                  <ArrowRightStartOnRectangleIcon className="w-5 h-5 mr-2" />
                  Logout
                </button>
              </div>
            </aside>
          )}

          <main className="flex-grow p-6 pb-20 md:pb-6"> {/* Padding bottom lebih besar untuk bottom bar */}
            {children} {/* Merender komponen anak (misalnya, DashboardView, UserManagementView) */}
          </main>

          {/* Bottom Navigation Bar untuk Mobile */}
          <nav className="fixed bottom-0 left-0 right-0 bg-gray-800 text-white p-2 shadow-lg md:hidden z-30">
            <ul className="flex justify-around items-center h-full">
              {adminNavLinks.map((link) => (
                <li key={link.href} className="flex-1">
                  <Link href={link.href} className={`flex flex-col items-center p-2 rounded-lg text-xs transition-colors 
                    ${pathname === link.href ? 'bg-blue-600 text-white' : 'hover:bg-gray-700 text-gray-200'}`}>
                      <link.icon className="w-5 h-5 mb-1" />
                      <span className="font-medium truncate">{link.name.split(' ')[0]}</span> {/* Hanya menampilkan kata pertama */}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Footer Section (hanya di desktop, atau di mobile jika tidak ada bottom bar) */}
          <footer className="bg-gray-900 text-white p-4 text-center text-sm hidden md:block">
            <p>&copy; 2024 Koperasi Digital. Semua hak dilindungi.</p>
          </footer>
        </div>
      </div>
    </ProtectedLayout>
  );
}

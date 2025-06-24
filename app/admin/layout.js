"use client";

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import ProtectedLayout from '@/controller/role.controller';

import {
  HomeIcon,
  UserGroupIcon,
  CurrencyDollarIcon,
  BanknotesIcon,
  CreditCardIcon,
  ChartBarIcon,
  ArrowRightStartOnRectangleIcon
} from '@heroicons/react/24/outline';

export default function AdminRootLayout({ children }) {
  const { currentUser, logout } = useAuth();
  const pathname = usePathname();

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
      <div className="h-[100dvh] flex flex-col md:flex-row bg-gray-50 overflow-hidden">
        {/* Sidebar - Hidden on mobile, visible on desktop */}
        <aside className="hidden md:flex w-64 lg:w-72 bg-white border-r border-gray-200 shadow-lg flex-col">
          {/* Header Sidebar */}
          <div className="p-6 border-b border-gray-200 flex-shrink-0">
            <div className="text-2xl font-bold text-gray-800 text-center">
              Admin Panel
            </div>
            <div className="text-sm text-gray-600 text-center mt-2">
              Halo, {currentUser?.fullName || currentUser?.userName}!
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 overflow-y-auto">
            <ul className="space-y-2">
              {adminNavLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className={`flex items-center p-3 rounded-xl transition-all duration-200 group
                      ${pathname === link.href
                        ? 'bg-blue-50 text-blue-700 border border-blue-200 shadow-sm'
                        : 'hover:bg-gray-50 text-gray-700 hover:text-gray-900 border border-transparent'
                      }`}
                  >
                    <link.icon className={`w-5 h-5 mr-3 transition-colors
                      ${pathname === link.href ? 'text-blue-600' : 'text-gray-500 group-hover:text-gray-700'}
                    `} />
                    <span className="font-medium text-sm lg:text-base">
                      {link.name}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Logout Button */}
          <div className="p-4 border-t border-gray-200 flex-shrink-0">
            <button
              onClick={logout}
              className="w-full flex items-center justify-center bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 px-4 py-3 rounded-xl shadow-sm transition-all duration-200 font-medium text-sm lg:text-base hover:shadow-md"
            >
              <ArrowRightStartOnRectangleIcon className="w-5 h-5 mr-2" />
              Logout
            </button>
          </div>
        </aside>

        {/* Konten Utama */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {/* Header */}
          <header className="bg-white border-b border-gray-200 shadow-sm p-4 lg:p-6 flex-shrink-0">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-xl lg:text-2xl font-bold text-gray-900">
                  {adminNavLinks.find(link => link.href === pathname)?.name || 'Admin Panel'}
                </h1>
                <p className="text-sm text-gray-600 mt-1">
                  Kelola sistem koperasi digital Anda
                </p>
              </div>
              <div className="hidden sm:flex items-center space-x-4">
                <div className="bg-gray-50 px-3 py-2 rounded-lg border">
                  <span className="text-sm font-medium text-gray-700">
                    {new Date().toLocaleDateString('id-ID', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </span>
                </div>
              </div>
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1 overflow-y-auto">
            <div className="h-full">
              {children}
            </div>
          </main>

          {/* Desktop Footer */}
          <footer className="hidden md:block bg-white border-t border-gray-200 p-4 text-center flex-shrink-0">
            <p className="text-gray-600">
              &copy; 2024 Koperasi Digital. Semua hak dilindungi.
            </p>
          </footer>
        </div>

        {/* Mobile Bottom Navigation */}
        <footer className="
          md:hidden
          fixed
          bottom-0
          left-0
          right-0
          bg-white
          border-t
          border-gray-200
          p-2
          z-10
          shadow-lg
        ">
          <div className="flex justify-around items-center">
            {adminNavLinks.slice(0, 5).map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`flex flex-col items-center text-gray-600 hover:text-gray-900 transition-colors px-1 py-1
                  ${pathname === link.href ? 'text-blue-600' : ''}
                `}
              >
                <link.icon className="w-5 h-5" />
                <span className="text-[10px] mt-1 text-center leading-tight">{link.name.split(' ')[0]}</span>
              </Link>
            ))}
            <button
              onClick={logout}
              className="flex flex-col items-center text-red-600 hover:text-red-700 transition-colors px-1 py-1"
            >
              <ArrowRightStartOnRectangleIcon className="w-5 h-5" />
              <span className="text-[10px] mt-1">Logout</span>
            </button>
          </div>
        </footer>
      </div>
    </ProtectedLayout>
  );
}

// LOGIN PAGE CLIENT COMPONENT

"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { EyeIcon, EyeSlashIcon, UserIcon, LockClosedIcon, BuildingOfficeIcon } from '@heroicons/react/24/outline';

export default function LoginView() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login, currentUser, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && currentUser) {
      if (currentUser.role === 'admin') {
        router.push('/admin');
      } else if (currentUser.role === 'teller') {
        router.push('/teller');
      } else if (currentUser.role === 'user') {
        router.push('/misquen');
      }
    } else if (!loading && !currentUser) {
        const storedUsername = localStorage.getItem('username');
        const storedPassword = localStorage.getItem('password');
        if (storedUsername && storedPassword) {
            login(storedUsername, storedPassword).then(res => {
                if (!res.success) {
                    setError(res.error);
                }
            });
        }
    }
  }, [currentUser, loading, router, login]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    
    const result = await login(username, password);
    if (!result.success) {
      setError(result.error);
    }
    setIsSubmitting(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="loading loading-spinner loading-lg text-blue-500 mb-4"></div>
          <p className="text-gray-600 text-lg font-medium">Memuat...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-md">
        {/* Header Section */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-white rounded-full shadow-lg border border-gray-100 mb-6">
            <img 
              src="/webIcon.png" 
              alt="Si-Misquen Logo" 
              className="w-14 h-14 object-contain"
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.nextSibling.style.display = 'block';
              }}
            />
            <BuildingOfficeIcon 
              className="w-12 h-12 text-blue-500 hidden"
              style={{ display: 'none' }}
            />
          </div>
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            Si-Misquen
          </h1>
          <p className="text-gray-500 text-base">
            Sistem Informasi Koperasi Modern
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          <div className="p-8">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-2">
                Selamat Datang Kembali
              </h2>
              <p className="text-gray-500 text-sm">
                Masuk untuk mengakses sistem koperasi
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Username Input */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">
                  Nama Pengguna
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <UserIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="username"
                    name="username"
                    type="text"
                    required
                    className="w-full pl-10 pr-4 py-3 text-black border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white"
                    placeholder="Masukkan nama pengguna"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              {/* Password Input */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">
                  Kata Sandi
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <LockClosedIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    required
                    className="w-full pl-10 pr-12 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white text-black"
                    placeholder="Masukkan kata sandi"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isSubmitting}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center hover:bg-gray-100 rounded-r-xl transition-colors"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={isSubmitting}
                  >
                    {showPassword ? (
                      <EyeSlashIcon className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                    ) : (
                      <EyeIcon className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                    )}
                  </button>
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                  <div className="flex items-center">
                    <svg className="h-5 w-5 text-red-400 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-sm text-red-700 font-medium">{error}</span>
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  className={`w-full py-3 px-4 rounded-xl text-white font-semibold text-base transition-all duration-200 ${
                    isSubmitting || !username || !password
                      ? 'bg-gray-300 cursor-not-allowed'
                      : 'bg-blue-500 hover:bg-blue-600 active:bg-blue-700 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5'
                  }`}
                  disabled={isSubmitting || !username || !password}
                >
                  {isSubmitting ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Memproses...
                    </div>
                  ) : (
                    'Masuk'
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-8 py-6 border-t border-gray-100">
            <div className="text-center">
              <p className="text-xs text-gray-500 mb-2">
                © 2024 Si-Misquen. Semua hak dilindungi.
              </p>
              <p className="text-xs text-gray-400">
                Sistem Koperasi Terpercaya
              </p>
            </div>
          </div>
        </div>

        {/* Help Section */}
        <div className="mt-8 text-center">
          <div className="inline-flex items-center justify-center px-4 py-2 bg-white rounded-full shadow-sm border border-gray-100">
            <svg className="h-4 w-4 text-gray-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-sm text-gray-500">
              Butuh bantuan? Hubungi administrator
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
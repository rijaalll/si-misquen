// components/misquen/ProfileView.jsx
// Komponen klien untuk halaman profil pengguna.

"use client";

import { useEffect, useState } from 'react';
import ProtectedLayout from '@/controller/role.controller';
import { useAuth } from '@/context/AuthContext';
import { database } from '@/utils/firebaseConfig';
import { ref, onValue, update, get } from 'firebase/database'; // Import 'get'
import { UserCircleIcon, PhoneIcon, CheckCircleIcon, XCircleIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';

export default function ProfileView() {
  const { currentUser } = useAuth();
  const [initialUserData, setInitialUserData] = useState(null); // Store initial data
  const [formData, setFormData] = useState({
    userName: '',
    telepon: ''
  });
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState(''); // 'success' or 'error'
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Mengambil data pengguna dari Firebase saat komponen dimuat
  useEffect(() => {
    if (currentUser) {
      const userRef = ref(database, `koperasi/user/${currentUser.uid}`);
      const unsubscribe = onValue(userRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
          setInitialUserData(data); // Simpan data awal
          setFormData({
            userName: data.userName || '',
            telepon: data.detail?.telepon || ''
          });
        }
        setLoading(false);
      });

      return () => unsubscribe();
    }
  }, [currentUser]);

  // Fungsi untuk menangani perubahan pada input form
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Fungsi untuk menyimpan perubahan ke Firebase
  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setIsSubmitting(true);

    if (!formData.userName) {
      showMessage('Nama pengguna tidak boleh kosong.', 'error');
      setIsSubmitting(false);
      return;
    }

    // Cek jika username berubah dan apakah sudah ada yang pakai
    if (formData.userName !== initialUserData.userName) {
        const usersRef = ref(database, 'koperasi/user');
        const snapshot = await get(usersRef);
        const usersData = snapshot.val();
        let isUsernameTaken = false;
        for (const userId in usersData) {
            if (usersData[userId].userName === formData.userName) {
                isUsernameTaken = true;
                break;
            }
        }

        if (isUsernameTaken) {
            showMessage('Nama pengguna sudah digunakan. Silakan pilih yang lain.', 'error');
            setIsSubmitting(false);
            return;
        }
    }


    try {
      const userRef = ref(database, `koperasi/user/${currentUser.uid}`);
      await update(userRef, {
        userName: formData.userName,
        'detail/telepon': formData.telepon
      });
      showMessage('Profil berhasil diperbarui!', 'success');
    } catch (error) {
      console.error("Error updating profile:", error);
      showMessage(`Gagal memperbarui profil: ${error.message}`, 'error');
    } finally {
        setIsSubmitting(false);
    }
  };

  // Fungsi untuk menampilkan pesan sementara
  const showMessage = (msg, type) => {
    setMessage(msg);
    setMessageType(type);
    setTimeout(() => {
      setMessage('');
      setMessageType('');
    }, 5000);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full p-10">
         <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Memuat profil...</span>
      </div>
    );
  }

  return (
    <ProtectedLayout allowedRoles={['user']}>
      <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
        {/* Tombol Kembali */}
        <div className="mb-6">
            <Link href="/misquen" className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 transition-colors">
                <ArrowLeftIcon className="w-5 h-5" />
                <span>Kembali ke Dashboard</span>
            </Link>
        </div>

        {/* Header Halaman */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-800 flex items-center justify-center gap-3">
            <UserCircleIcon className="w-8 h-8 text-blue-600" />
            Edit Profil Anda
          </h1>
          <p className="text-gray-600 mt-1">Perbarui informasi akun Anda di sini.</p>
        </div>

        {/* Card Form Profil */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
          <form onSubmit={handleSubmit}>
            <div className="p-8 space-y-6">
                {/* Info Akun */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-500">Nama Lengkap</label>
                        <p className="mt-1 text-lg font-semibold text-gray-800 bg-gray-100 p-3 rounded-lg">{initialUserData?.fullName || '-'}</p>
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-gray-500">Role</label>
                        <p className="mt-1 text-lg font-semibold text-gray-800 bg-gray-100 p-3 rounded-lg">{initialUserData?.role || '-'}</p>
                    </div>
                </div>

                 {/* Input Form */}
                <div>
                  <label htmlFor="userName" className="block text-sm font-medium text-gray-700">Nama Pengguna</label>
                  <div className="relative mt-1">
                    <UserCircleIcon className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2"/>
                    <input
                      type="text"
                      name="userName"
                      id="userName"
                      value={formData.userName}
                      onChange={handleChange}
                      className="w-full pl-10 pr-4 py-3 border text-black border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition"
                      placeholder="Masukkan nama pengguna baru"
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="telepon" className="block text-sm font-medium text-gray-700">Nomor Telepon</label>
                   <div className="relative mt-1">
                    <PhoneIcon className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2"/>
                    <input
                      type="tel"
                      name="telepon"
                      id="telepon"
                      value={formData.telepon}
                      onChange={handleChange}
                      className="w-full pl-10 pr-4 py-3 border text-black border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition"
                      placeholder="Contoh: 081234567890"
                    />
                  </div>
                </div>
            </div>

            {/* Footer Form */}
            <div className="bg-gray-50 px-8 py-4 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-4">
               {message && (
                <div className={`flex items-center gap-2 text-sm ${messageType === 'success' ? 'text-green-600' : 'text-red-600'}`}>
                  {messageType === 'success' ? <CheckCircleIcon className="w-5 h-5"/> : <XCircleIcon className="w-5 h-5"/>}
                  <span>{message}</span>
                </div>
              )}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition-all shadow-md hover:shadow-lg disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                    <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        <span>Menyimpan...</span>
                    </>
                ) : (
                    "Simpan Perubahan"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </ProtectedLayout>
  );
}

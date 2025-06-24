// components/admin/DashboardView.jsx
// Komponen klien untuk tampilan dashboard admin.

"use client";

import { useEffect, useState } from 'react';
import ProtectedLayout from '../../controller/role.controller';
import { database } from '@/utils/firebaseConfig';
import { ref, onValue } from 'firebase/database';
import {
  UserGroupIcon,
  CurrencyDollarIcon,
  BanknotesIcon,
  CreditCardIcon,
  ChartBarIcon,
  UsersIcon, // Ganti dengan icon yang lebih sesuai untuk dashboard admin
  ArrowPathIcon, // Icon untuk transaksi terbaru
  ArrowUpTrayIcon, // <-- Tambahkan impor ini
  ArrowDownTrayIcon // <-- Tambahkan impor ini
} from '@heroicons/react/24/outline';
import Link from 'next/link';

export default function AdminDashboardView() {
  const [usersCount, setUsersCount] = useState(0);
  const [totalSimpanan, setTotalSimpanan] = useState(0);
  const [totalPinjamanDisetujui, setTotalPinjamanDisetujui] = useState(0);
  const [latestTransactions, setLatestTransactions] = useState([]);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');

  useEffect(() => {
    // Mengambil jumlah pengguna
    const usersRef = ref(database, 'koperasi/user');
    const unsubscribeUsers = onValue(usersRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setUsersCount(Object.keys(data).length);
      } else {
        setUsersCount(0);
      }
    });

    // Mengambil total simpanan dan transaksi terbaru
    const simpananRef = ref(database, 'koperasi/data/transaksi/simpan');
    const unsubscribeSimpanan = onValue(simpananRef, (snapshot) => {
      const data = snapshot.val();
      let currentTotalSimpanan = 0;
      let transactions = [];
      if (data) {
        for (const simpananId in data) {
          currentTotalSimpanan += data[simpananId].total || 0;
          if (data[simpananId].detail) {
            for (const detailId in data[simpananId].detail) {
              const tx = data[simpananId].detail[detailId];
              // Pastikan tx.detail ada dan berisi properti yang diharapkan
              if (tx.detail && tx.detail.tanggal && tx.detail.bulan && tx.detail.tahun && tx.detail.jam) {
                const timestamp = new Date(tx.detail.tahun, tx.detail.bulan - 1, tx.detail.tanggal, tx.detail.jam.split(':')[0], tx.detail.jam.split(':')[1]);
                transactions.push({
                  id: detailId,
                  userId: data[simpananId].userId,
                  type: tx.status,
                  nominal: tx.nominal,
                  date: timestamp,
                });
              } else {
                console.warn("Missing date/time details in transaction:", tx);
              }
            }
          }
        }
      }
      setTotalSimpanan(currentTotalSimpanan);
      setLatestTransactions(prev => 
        [...prev, ...transactions].sort((a, b) => b.date - a.date).slice(0, 5) // Ambil 5 transaksi terbaru
      );
    });

    // Mengambil total pinjaman disetujui dan transaksi pinjaman terbaru
    const pinjamanRef = ref(database, 'koperasi/data/transaksi/pinjam');
    const unsubscribePinjaman = onValue(pinjamanRef, (snapshot) => {
      const data = snapshot.val();
      let currentTotalPinjamanDisetujui = 0;
      let transactions = [];
      if (data) {
        for (const pinjamanId in data) {
          if (data[pinjamanId].status === 'disetujui') {
            currentTotalPinjamanDisetujui += data[pinjamanId].total || 0;
          }
          if (data[pinjamanId].detail) {
            for (const detailId in data[pinjamanId].detail) {
              const tx = data[pinjamanId].detail[detailId];
              // Pastikan tx.tempo ada dan berisi properti yang diharapkan
              if (tx.tempo && tx.tempo.tanggal && tx.tempo.bulan && tx.tempo.tahun) {
                const timestamp = new Date(tx.tempo.tahun, tx.tempo.bulan - 1, tx.tempo.tanggal);
                transactions.push({
                  id: detailId,
                  userId: data[pinjamanId].userId,
                  type: `Angsuran (${tx.status})`,
                  nominal: parseFloat(tx.totalTagihan),
                  date: timestamp,
                });
              } else {
                console.warn("Missing tempo details in loan installment:", tx);
              }
            }
          }
        }
      }
      setTotalPinjamanDisetujui(currentTotalPinjamanDisetujui);
      setLatestTransactions(prev => 
        [...prev, ...transactions].sort((a, b) => b.date - a.date).slice(0, 5) // Ambil 5 transaksi terbaru
      );
    });

    return () => {
      unsubscribeUsers();
      unsubscribeSimpanan();
      unsubscribePinjaman();
    };
  }, []);

  // Fungsi untuk menampilkan pesan sementara
  const showMessage = (msg, type) => {
    setMessage(msg);
    setMessageType(type);
    setTimeout(() => {
      setMessage('');
      setMessageType('');
    }, 3000);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'simpan': return 'bg-emerald-100 text-emerald-800';
      case 'tarik': return 'bg-purple-100 text-purple-800';
      case 'Angsuran (sudah bayar)': return 'bg-blue-100 text-blue-800';
      case 'Angsuran (belum bayar)': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatTransactionDate = (dateObj) => {
    if (!dateObj) return '';
    const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return dateObj.toLocaleDateString('id-ID', options);
  };

  return (
    <ProtectedLayout allowedRoles={['admin']}>
      <div className="container mx-auto p-4">
        {message && (
          <div className={`p-3 rounded-md mb-4 text-center ${messageType === 'success' ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'}`}>
            {message}
          </div>
        )}

        <h2 className="text-3xl font-bold text-gray-800 mb-6">Dashboard Admin Koperasi</h2>

        {/* Ringkasan Statistik */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Jumlah Pengguna */}
          <div className="bg-white p-6 rounded-lg shadow-md border border-gray-100 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Pengguna</p>
              <p className="text-3xl font-bold text-indigo-600">{usersCount}</p>
            </div>
            <UsersIcon className="w-12 h-12 text-indigo-300 opacity-50" />
          </div>

          {/* Total Simpanan Anggota */}
          <div className="bg-white p-6 rounded-lg shadow-md border border-gray-100 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Simpanan</p>
              <p className="text-3xl font-bold text-emerald-600">Rp {totalSimpanan.toLocaleString('id-ID')}</p>
            </div>
            <BanknotesIcon className="w-12 h-12 text-emerald-300 opacity-50" />
          </div>

          {/* Total Pinjaman Disetujui */}
          <div className="bg-white p-6 rounded-lg shadow-md border border-gray-100 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Pinjaman Disetujui</p>
              <p className="text-3xl font-bold text-blue-600">Rp {totalPinjamanDisetujui.toLocaleString('id-ID')}</p>
            </div>
            <CreditCardIcon className="w-12 h-12 text-blue-300 opacity-50" />
          </div>
        </div>

        {/* Bagian Navigasi Cepat */}
        <div className="bg-white p-6 rounded-lg shadow-md mb-8 border border-gray-100">
          <h3 className="text-2xl font-semibold text-gray-800 mb-4">Navigasi Cepat</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            <Link href="/admin/users" className="flex flex-col items-center justify-center p-4 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors shadow-sm">
                <UserGroupIcon className="w-8 h-8 text-indigo-600 mb-2" />
                <span className="text-sm font-medium text-indigo-800 text-center">Manajemen Anggota</span>
            </Link>
            <Link href="/admin/bunga-tenor" className="flex flex-col items-center justify-center p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors shadow-sm">
                <CurrencyDollarIcon className="w-8 h-8 text-green-600 mb-2" />
                <span className="text-sm font-medium text-green-800 text-center">Manajemen Bunga & Tenor</span>
            </Link>
            <Link href="/admin/simpanan" className="flex flex-col items-center justify-center p-4 bg-emerald-50 rounded-lg hover:bg-emerald-100 transition-colors shadow-sm">
                <BanknotesIcon className="w-8 h-8 text-emerald-600 mb-2" />
                <span className="text-sm font-medium text-emerald-800 text-center">Manajemen Simpanan</span>
            </Link>
            <Link href="/admin/pinjaman" className="flex flex-col items-center justify-center p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors shadow-sm">
                <CreditCardIcon className="w-8 h-8 text-blue-600 mb-2" />
                <span className="text-sm font-medium text-blue-800 text-center">Manajemen Pinjaman</span>
            </Link>
            <Link href="/admin/laporan" className="flex flex-col items-center justify-center p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors shadow-sm">
                <ChartBarIcon className="w-8 h-8 text-purple-600 mb-2" />
                <span className="text-sm font-medium text-purple-800 text-center">Laporan Keuangan</span>
            </Link>
          </div>
        </div>

        {/* Transaksi Terbaru */}
        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-100">
            <h3 className="text-2xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <ArrowPathIcon className="w-6 h-6 text-gray-600" /> Transaksi Terbaru
            </h3>
            {latestTransactions.length === 0 ? (
                <p className="text-gray-600 py-4 text-center">Tidak ada transaksi terbaru.</p>
            ) : (
                <div className="space-y-3">
                    {latestTransactions.map(tx => (
                        <div key={tx.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-lg ${getStatusColor(tx.type)}`}>
                                    {tx.type === 'simpan' && <ArrowUpTrayIcon className="w-4 h-4 text-emerald-600" />}
                                    {tx.type === 'tarik' && <ArrowDownTrayIcon className="w-4 h-4 text-purple-600" />}
                                    {tx.type.startsWith('Angsuran') && <CreditCardIcon className="w-4 h-4 text-blue-600" />}
                                </div>
                                <div>
                                    <p className="font-medium text-gray-900">
                                        Rp {tx.nominal.toLocaleString('id-ID')}
                                    </p>
                                    <p className="text-sm text-gray-500">
                                        {tx.type} oleh {tx.userId} • {formatTransactionDate(tx.date)}
                                    </p>
                                </div>
                            </div>
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(tx.type)}`}>
                                {tx.type === 'simpan' ? 'Setor' : tx.type === 'tarik' ? 'Tarik' : tx.type}
                            </span>
                        </div>
                    ))}
                </div>
            )}
        </div>
      </div>
    </ProtectedLayout>
  );
}

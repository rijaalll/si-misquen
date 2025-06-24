// components/admin/PinjamanManagementView.jsx
// Komponen klien untuk manajemen pinjaman di panel admin.

"use client";

import { useEffect, useState } from 'react';
import ProtectedLayout from '@/controller/role.controller'; // Mengimpor ProtectedLayout
import { database } from '@/utils/firebaseConfig';
import { ref, onValue, remove, update } from 'firebase/database';
import {
  TrashIcon,
  XMarkIcon,
  InformationCircleIcon,
  EyeIcon,
  CreditCardIcon, // Icon untuk pinjaman
  CalendarDaysIcon,
  CheckIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import ConfirmationModal from './ConfirmationModal'; // Mengimpor modal konfirmasi

export default function PinjamanManagementView() {
  const [users, setUsers] = useState([]); // Diperlukan untuk menampilkan nama pengguna
  const [pinjamanData, setPinjamanData] = useState([]);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');

  // Status Modal Detail Pinjaman
  const [showPinjamanDetailModal, setShowPinjamanDetailModal] = useState(false);
  const [selectedPinjamanToView, setSelectedPinjamanToView] = useState(null);

  // Status Modal Konfirmasi Umum
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmMessage, setConfirmMessage] = useState('');
  const [onConfirmAction, setOnConfirmAction] = useState(() => () => {});

  // Mengambil semua data yang diperlukan dari Firebase
  useEffect(() => {
    const usersRef = ref(database, 'koperasi/user');
    const unsubscribeUsers = onValue(usersRef, (snapshot) => {
      const data = snapshot.val();
      const userList = [];
      for (const id in data) {
        userList.push({ id, ...data[id] });
      }
      setUsers(userList);
    });

    const pinjamanRef = ref(database, 'koperasi/data/transaksi/pinjam');
    const unsubscribePinjaman = onValue(pinjamanRef, (snapshot) => {
      const data = snapshot.val();
      const pinjamanList = [];
      for (const id in data) {
        pinjamanList.push({ id, ...data[id] });
      }
      setPinjamanData(pinjamanList);
    });

    return () => {
      unsubscribeUsers();
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

  // --- Logika Modal Konfirmasi Umum ---
  const openConfirmModal = (message, action) => {
    setConfirmMessage(message);
    setOnConfirmAction(() => action);
    setShowConfirmModal(true);
  };

  const handleConfirm = () => {
    onConfirmAction();
    setShowConfirmModal(false);
  };

  const handleCancelConfirm = () => {
    setShowConfirmModal(false);
  };

  // --- Manajemen Pinjaman ---
  const openPinjamanDetailModal = (pinjaman) => {
    setSelectedPinjamanToView(pinjaman);
    setShowPinjamanDetailModal(true);
  };

  const handleUpdatePinjamanStatus = async (pinjamanId, newStatus) => {
    try {
      await update(ref(database, `koperasi/data/transaksi/pinjam/${pinjamanId}`), {
        status: newStatus
      });
      if (selectedPinjamanToView && selectedPinjamanToView.id === pinjamanId) {
        setSelectedPinjamanToView(prev => ({ ...prev, status: newStatus }));
      }
      showMessage('Status pinjaman berhasil diperbarui!', 'success');
    } catch (error) {
      console.error("Error updating pinjaman status:", error);
      showMessage(`Gagal memperbarui status pinjaman: ${error.message}`, 'error');
    }
  };

  const handleUpdateTagihanStatus = async (pinjamanId, detailId, newStatus) => {
    try {
      await update(ref(database, `koperasi/data/transaksi/pinjam/${pinjamanId}/detail/${detailId}`), {
        status: newStatus
      });
      if (selectedPinjamanToView && selectedPinjamanToView.id === pinjamanId) {
        setSelectedPinjamanToView(prev => ({
          ...prev,
          detail: {
            ...prev.detail,
            [detailId]: { ...prev.detail[detailId], status: newStatus }
          }
        }));
      }
      showMessage('Status tagihan berhasil diperbarui!', 'success');
    } catch (error) {
      console.error("Error updating tagihan status:", error);
      showMessage(`Gagal memperbarui status tagihan: ${error.message}`, 'error');
    }
  };

  const handleDeletePinjaman = async (pinjamanId) => {
    openConfirmModal('Anda yakin ingin menghapus seluruh data pinjaman ini? Ini akan menghapus semua riwayat pinjaman untuk pengguna ini.', async () => {
      try {
        await remove(ref(database, `koperasi/data/transaksi/pinjam/${pinjamanId}`));
        showMessage('Data pinjaman berhasil dihapus!', 'success');
      } catch (error) {
        console.error("Error deleting pinjaman:", error);
        showMessage(`Gagal menghapus data pinjaman: ${error.message}`, 'error');
      }
    });
  };

  // Fungsi Pembantu
  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'disetujui': return 'bg-green-100 text-green-800';
      case 'ditolak': return 'bg-red-100 text-red-800';
      case 'sudah bayar': return 'bg-blue-100 text-blue-800';
      case 'belum bayar': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (tanggal, bulan, tahun) => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    return `${tanggal} ${months[bulan - 1]} ${tahun}`;
  };
  
  const getTagihanColor = (detailData) => {
    const today = new Date();
    const tempoDate = new Date(detailData.tempo.tahun, detailData.tempo.bulan - 1, detailData.tempo.tanggal);

    if (detailData.status === 'belum bayar' && 
        (tempoDate.getFullYear() < today.getFullYear() || 
         (tempoDate.getFullYear() === today.getFullYear() && tempoDate.getMonth() < today.getMonth()) ||
         (tempoDate.getFullYear() === today.getFullYear() && tempoDate.getMonth() === today.getMonth() && tempoDate.getDate() <= today.getDate())
        )) {
      return 'text-red-600 font-semibold';
    }
    return 'text-gray-900';
  };

  return (
    <ProtectedLayout allowedRoles={['admin']}>
      <div className="container mx-auto p-4">
        {message && (
          <div className={`p-3 rounded-md mb-4 text-center ${messageType === 'success' ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'}`}>
            {message}
          </div>
        )}

        <h2 className="text-3xl font-bold text-gray-800 mb-6 flex items-center gap-2">
            <CreditCardIcon className="w-8 h-8 text-blue-600" /> Manajemen Pinjaman
        </h2>

        {/* Manajemen Pinjaman */}
        <div className="bg-white p-6 rounded-lg shadow-md mb-8 border border-gray-100">
          {pinjamanData.length === 0 ? (
            <p className="text-gray-600 py-4 text-center">Tidak ada data pinjaman.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ID User
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Nama Anggota
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Jumlah Pinjaman
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tenor
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Bunga
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status Pinjaman
                    </th>
                    <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Aksi
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {pinjamanData.map((pinjam) => (
                    <tr key={pinjam.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{pinjam.userId}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{users.find(u => u.id === pinjam.userId)?.fullName || 'Tidak Diketahui'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">Rp {pinjam.total.toLocaleString('id-ID')}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{pinjam.tenor.bulan} Bulan</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{pinjam.tenor.bunga}%</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(pinjam.status)}`}>
                          {pinjam.status.charAt(0).toUpperCase() + pinjam.status.slice(1)}
                        </span>
                        <div className="mt-2">
                          <select
                            value={pinjam.status}
                            onChange={(e) => handleUpdatePinjamanStatus(pinjam.id, e.target.value)}
                            className="block w-full py-1 px-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm text-gray-900"
                          >
                            <option value="pending">Pending</option>
                            <option value="disetujui">Disetujui</option>
                            <option value="ditolak">Ditolak</option>
                          </select>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                        <button
                          onClick={() => openPinjamanDetailModal(pinjam)}
                          className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded-md shadow-sm mr-2 transition duration-150 ease-in-out flex items-center gap-1"
                        >
                          <EyeIcon className="w-4 h-4" /> Lihat Detail
                        </button>
                        <button
                          onClick={() => handleDeletePinjaman(pinjam.id)}
                          className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-md shadow-sm transition duration-150 ease-in-out flex items-center gap-1"
                        >
                          <TrashIcon className="w-4 h-4" /> Hapus Data Ini
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Modal Detail Pinjaman */}
      {showPinjamanDetailModal && selectedPinjamanToView && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                  <CreditCardIcon className="w-5 h-5 text-blue-600" />
                  Detail Pinjaman
                </h2>
                <button
                  onClick={() => setShowPinjamanDetailModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <XMarkIcon className="w-5 h-5 text-gray-500" />
                </button>
              </div>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-2 gap-4 text-sm mb-6">
                <div>
                  <p className="text-gray-500">ID User:</p>
                  <p className="font-medium text-gray-900">{selectedPinjamanToView.userId}</p>
                </div>
                <div>
                  <p className="text-gray-500">Nama Anggota:</p>
                  <p className="font-medium text-gray-900">{users.find(u => u.id === selectedPinjamanToView.userId)?.fullName || 'Tidak Diketahui'}</p>
                </div>
                <div>
                  <p className="text-gray-500">Jumlah Pinjaman:</p>
                  <p className="font-medium text-gray-900">Rp {selectedPinjamanToView.total.toLocaleString('id-ID')}</p>
                </div>
                <div>
                  <p className="text-gray-500">Status Pinjaman:</p>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(selectedPinjamanToView.status)}`}>
                    {selectedPinjamanToView.status.charAt(0).toUpperCase() + selectedPinjamanToView.status.slice(1)}
                  </span>
                  <div className="mt-2">
                      <select
                        value={selectedPinjamanToView.status}
                        onChange={(e) => handleUpdatePinjamanStatus(selectedPinjamanToView.id, e.target.value)}
                        className="block w-full py-1 px-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm text-gray-900"
                      >
                        <option value="pending">Pending</option>
                        <option value="disetujui">Disetujui</option>
                        <option value="ditolak">Ditolak</option>
                      </select>
                    </div>
                </div>
                <div>
                  <p className="text-gray-500">Tenor:</p>
                  <p className="font-medium text-gray-900">{selectedPinjamanToView.tenor.bulan} Bulan</p>
                </div>
                <div>
                  <p className="text-gray-500">Bunga Per Bulan:</p>
                  <p className="font-medium text-gray-900">{selectedPinjamanToView.tenor.bunga}%</p>
                </div>
              </div>

              <h3 className="text-lg font-semibold text-gray-800 mb-4">Detail Angsuran:</h3>
              <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
                {Object.entries(selectedPinjamanToView.detail || {}).sort(([, dataA], [, dataB]) => {
                    const dateA = new Date(dataA.tempo.tahun, dataA.tempo.bulan - 1, dataA.tempo.tanggal);
                    const dateB = new Date(dataB.tempo.tahun, dataB.tempo.bulan - 1, dataB.tempo.tanggal);
                    return dateA - dateB;
                }).map(([detailId, detailData]) => (
                  <div key={detailId} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${detailData.status === 'sudah bayar' ? 'bg-blue-100' : 'bg-orange-100'}`}>
                        {detailData.status === 'sudah bayar' ? (
                          <CheckIcon className="w-4 h-4 text-blue-600" />
                        ) : (
                          <ClockIcon className="w-4 h-4 text-orange-600" />
                        )}
                      </div>
                      <div>
                        <p className={`font-medium ${getTagihanColor(detailData)}`}>
                          Rp {parseFloat(detailData.totalTagihan).toLocaleString('id-ID')}
                        </p>
                        <p className="text-sm text-gray-500 flex items-center gap-1">
                          <CalendarDaysIcon className="w-3 h-3" />
                          Tempo: {formatDate(detailData.tempo.tanggal, detailData.tempo.bulan, detailData.tempo.tahun)}
                        </p>
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(detailData.status)}`}>
                      {detailData.status === 'sudah bayar' ? 'Lunas' : 'Belum Bayar'}
                    </span>
                    <div className="mt-2">
                        <select
                            value={detailData.status}
                            onChange={(e) => handleUpdateTagihanStatus(selectedPinjamanToView.id, detailId, e.target.value)}
                            className="block w-full py-1 px-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm text-gray-900"
                        >
                            <option value="belum bayar">Belum Bayar</option>
                            <option value="sudah bayar">Sudah Bayar</option>
                        </select>
                    </div>
                  </div>
                ))}
                {Object.keys(selectedPinjamanToView.detail || {}).length === 0 && (
                    <p className="text-gray-500 text-center py-4">Belum ada detail angsuran.</p>
                )}
              </div>
            </div>
            <div className="p-6 border-t border-gray-100 flex justify-end">
              <button
                onClick={() => setShowPinjamanDetailModal(false)}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Konfirmasi Umum */}
      <ConfirmationModal
        show={showConfirmModal}
        message={confirmMessage}
        onConfirm={handleConfirm}
        onCancel={handleCancelConfirm}
      />
    </ProtectedLayout>
  );
}

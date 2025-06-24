// components/admin/PinjamanManagementView.jsx
// Komponen klien untuk manajemen pinjaman di panel admin dengan light theme dan responsive design.

"use client";

import { useEffect, useState } from 'react';
import ProtectedLayout from '@/controller/role.controller';
import { database } from '@/utils/firebaseConfig';
import { ref, onValue, remove, update } from 'firebase/database';
import {
  TrashIcon,
  XMarkIcon,
  InformationCircleIcon,
  EyeIcon,
  CreditCardIcon,
  CalendarDaysIcon,
  CheckIcon,
  ClockIcon,
  PencilSquareIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import ConfirmationModal from './ConfirmationModal';

export default function PinjamanManagementView() {
  const [users, setUsers] = useState([]);
  const [pinjamanData, setPinjamanData] = useState([]);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [loading, setLoading] = useState(true);

  // Modal states
  const [showPinjamanDetailModal, setShowPinjamanDetailModal] = useState(false);
  const [selectedPinjamanToView, setSelectedPinjamanToView] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmMessage, setConfirmMessage] = useState('');
  const [onConfirmAction, setOnConfirmAction] = useState(() => () => {});

  // Mengambil data dari Firebase
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
      setLoading(false);
    });

    return () => {
      unsubscribeUsers();
      unsubscribePinjaman();
    };
  }, []);

  // Fungsi helper
  const showMessage = (msg, type) => {
    setMessage(msg);
    setMessageType(type);
    setTimeout(() => {
      setMessage('');
      setMessageType('');
    }, 5000);
  };

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

  // CRUD Functions
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
    openConfirmModal(
      'Anda yakin ingin menghapus seluruh data pinjaman ini? Tindakan ini tidak dapat dibatalkan dan akan menghapus semua riwayat pinjaman.',
      async () => {
        try {
          await remove(ref(database, `koperasi/data/transaksi/pinjam/${pinjamanId}`));
          showMessage('Data pinjaman berhasil dihapus!', 'success');
        } catch (error) {
          console.error("Error deleting pinjaman:", error);
          showMessage(`Gagal menghapus data pinjaman: ${error.message}`, 'error');
        }
      }
    );
  };

  // Helper functions untuk styling
  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': 
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'disetujui': 
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'ditolak': 
        return 'bg-red-50 text-red-700 border-red-200';
      case 'sudah bayar': 
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'belum bayar': 
        return 'bg-orange-50 text-orange-700 border-orange-200';
      default: 
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending': 
        return <ClockIcon className="w-4 h-4" />;
      case 'disetujui': 
        return <CheckIcon className="w-4 h-4" />;
      case 'ditolak': 
        return <XMarkIcon className="w-4 h-4" />;
      case 'sudah bayar': 
        return <CheckIcon className="w-4 h-4" />;
      case 'belum bayar': 
        return <ExclamationTriangleIcon className="w-4 h-4" />;
      default: 
        return <InformationCircleIcon className="w-4 h-4" />;
    }
  };

  const formatDate = (tanggal, bulan, tahun) => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    return `${tanggal} ${months[bulan - 1]} ${tahun}`;
  };
  
  const getTagihanColor = (detailData) => {
    const today = new Date();
    const tempoDate = new Date(detailData.tempo.tahun, detailData.tempo.bulan - 1, detailData.tempo.tanggal);

    if (detailData.status === 'belum bayar' && tempoDate <= today) {
      return 'text-red-600 font-semibold';
    }
    return 'text-gray-900';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Memuat data pinjaman...</span>
      </div>
    );
  }

  return (
    <ProtectedLayout allowedRoles={['admin']}>
      <div className="space-y-6">
        {/* Alert Messages */}
        {message && (
          <div className={`p-4 rounded-xl border-l-4 ${
            messageType === 'success' 
              ? 'bg-emerald-50 border-emerald-400 text-emerald-700' 
              : 'bg-red-50 border-red-400 text-red-700'
          }`}>
            <div className="flex items-center">
              <div className="flex-shrink-0">
                {messageType === 'success' ? (
                  <CheckIcon className="h-5 w-5" />
                ) : (
                  <ExclamationTriangleIcon className="h-5 w-5" />
                )}
              </div>
              <div className="ml-3">
                <p className="font-medium">{message}</p>
              </div>
            </div>
          </div>
        )}

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-6 rounded-xl border border-blue-200">
            <div className="flex items-center">
              <div className="p-2 bg-blue-500 rounded-lg">
                <CreditCardIcon className="w-6 h-6 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-blue-600">Total Pinjaman</p>
                <p className="text-2xl font-bold text-blue-900">{pinjamanData.length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-r from-amber-50 to-amber-100 p-6 rounded-xl border border-amber-200">
            <div className="flex items-center">
              <div className="p-2 bg-amber-500 rounded-lg">
                <ClockIcon className="w-6 h-6 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-amber-600">Pending</p>
                <p className="text-2xl font-bold text-amber-900">
                  {pinjamanData.filter(p => p.status === 'pending').length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-emerald-50 to-emerald-100 p-6 rounded-xl border border-emerald-200">
            <div className="flex items-center">
              <div className="p-2 bg-emerald-500 rounded-lg">
                <CheckIcon className="w-6 h-6 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-emerald-600">Disetujui</p>
                <p className="text-2xl font-bold text-emerald-900">
                  {pinjamanData.filter(p => p.status === 'disetujui').length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-red-50 to-red-100 p-6 rounded-xl border border-red-200">
            <div className="flex items-center">
              <div className="p-2 bg-red-500 rounded-lg">
                <XMarkIcon className="w-6 h-6 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-red-600">Ditolak</p>
                <p className="text-2xl font-bold text-red-900">
                  {pinjamanData.filter(p => p.status === 'ditolak').length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {pinjamanData.length === 0 ? (
            <div className="text-center py-12">
              <CreditCardIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">Belum ada pinjaman</h3>
              <p className="mt-1 text-sm text-gray-500">
                Data pinjaman akan muncul di sini ketika anggota mengajukan pinjaman.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Anggota
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Pinjaman
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Tenor & Bunga
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Aksi
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {pinjamanData.map((pinjam) => (
                    <tr key={pinjam.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {users.find(u => u.id === pinjam.userId)?.fullName || 'Tidak Diketahui'}
                          </div>
                          <div className="text-sm text-gray-500">ID: {pinjam.userId}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          Rp {pinjam.total.toLocaleString('id-ID')}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm text-gray-900">{pinjam.tenor.bulan} Bulan</div>
                          <div className="text-sm text-gray-500">{pinjam.tenor.bunga}% per bulan</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="space-y-2">
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(pinjam.status)}`}>
                            {getStatusIcon(pinjam.status)}
                            <span className="ml-1">{pinjam.status.charAt(0).toUpperCase() + pinjam.status.slice(1)}</span>
                          </span>
                          <select
                            value={pinjam.status}
                            onChange={(e) => handleUpdatePinjamanStatus(pinjam.id, e.target.value)}
                            className="block w-full text-sm border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                          >
                            <option value="pending">Pending</option>
                            <option value="disetujui">Disetujui</option>
                            <option value="ditolak">Ditolak</option>
                          </select>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <div className="flex items-center justify-center space-x-2">
                          <button
                            onClick={() => openPinjamanDetailModal(pinjam)}
                            className="inline-flex items-center px-3 py-2 border border-blue-300 rounded-lg text-sm font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                          >
                            <EyeIcon className="w-4 h-4 mr-1" />
                            Detail
                          </button>
                          <button
                            onClick={() => handleDeletePinjaman(pinjam.id)}
                            className="inline-flex items-center px-3 py-2 border border-red-300 rounded-lg text-sm font-medium text-red-700 bg-red-50 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors"
                          >
                            <TrashIcon className="w-4 h-4 mr-1" />
                            Hapus
                          </button>
                        </div>
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
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-6 border-b border-blue-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-blue-500 rounded-lg">
                    <CreditCardIcon className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Detail Pinjaman</h2>
                    <p className="text-sm text-gray-600">
                      {users.find(u => u.id === selectedPinjamanToView.userId)?.fullName || 'Tidak Diketahui'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowPinjamanDetailModal(false)}
                  className="p-2 hover:bg-blue-200 rounded-lg transition-colors"
                >
                  <XMarkIcon className="w-5 h-5 text-gray-500" />
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto max-h-[70vh]">
              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Jumlah Pinjaman</label>
                    <p className="text-lg font-bold text-gray-900">
                      Rp {selectedPinjamanToView.total.toLocaleString('id-ID')}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Tenor</label>
                    <p className="text-lg font-medium text-gray-900">
                      {selectedPinjamanToView.tenor.bulan} Bulan
                    </p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Bunga per Bulan</label>
                    <p className="text-lg font-medium text-gray-900">
                      {selectedPinjamanToView.tenor.bunga}%
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Status Pinjaman</label>
                    <div className="mt-1">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(selectedPinjamanToView.status)}`}>
                        {getStatusIcon(selectedPinjamanToView.status)}
                        <span className="ml-1">{selectedPinjamanToView.status.charAt(0).toUpperCase() + selectedPinjamanToView.status.slice(1)}</span>
                      </span>
                      <select
                        value={selectedPinjamanToView.status}
                        onChange={(e) => handleUpdatePinjamanStatus(selectedPinjamanToView.id, e.target.value)}
                        className="mt-2 block w-full text-sm border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="pending">Pending</option>
                        <option value="disetujui">Disetujui</option>
                        <option value="ditolak">Ditolak</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* Angsuran Details */}
              <div className="border-t border-gray-200 pt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <CalendarDaysIcon className="w-5 h-5 mr-2 text-blue-600" />
                  Detail Angsuran
                </h3>
                <div className="space-y-3 max-h-80 overflow-y-auto">
                  {Object.entries(selectedPinjamanToView.detail || {})
                    .sort(([, dataA], [, dataB]) => {
                      const dateA = new Date(dataA.tempo.tahun, dataA.tempo.bulan - 1, dataA.tempo.tanggal);
                      const dateB = new Date(dataB.tempo.tahun, dataB.tempo.bulan - 1, dataB.tempo.tanggal);
                      return dateA - dateB;
                    })
                    .map(([detailId, detailData]) => (
                      <div key={detailId} className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center space-x-3">
                            <div className={`p-2 rounded-lg ${detailData.status === 'sudah bayar' ? 'bg-blue-100' : 'bg-orange-100'}`}>
                              {detailData.status === 'sudah bayar' ? (
                                <CheckIcon className="w-4 h-4 text-blue-600" />
                              ) : (
                                <ClockIcon className="w-4 h-4 text-orange-600" />
                              )}
                            </div>
                            <div>
                              <p className={`font-semibold ${getTagihanColor(detailData)}`}>
                                Rp {parseFloat(detailData.totalTagihan).toLocaleString('id-ID')}
                              </p>
                              <p className="text-sm text-gray-500 flex items-center">
                                <CalendarDaysIcon className="w-3 h-3 mr-1" />
                                Tempo: {formatDate(detailData.tempo.tanggal, detailData.tempo.bulan, detailData.tempo.tahun)}
                              </p>
                            </div>
                          </div>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(detailData.status)}`}>
                            {detailData.status === 'sudah bayar' ? 'Lunas' : 'Belum Bayar'}
                          </span>
                        </div>
                        <select
                          value={detailData.status}
                          onChange={(e) => handleUpdateTagihanStatus(selectedPinjamanToView.id, detailId, e.target.value)}
                          className="w-full text-sm border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value="belum bayar">Belum Bayar</option>
                          <option value="sudah bayar">Sudah Bayar</option>
                        </select>
                      </div>
                    ))}
                  {Object.keys(selectedPinjamanToView.detail || {}).length === 0 && (
                    <div className="text-center py-8">
                      <InformationCircleIcon className="mx-auto h-8 w-8 text-gray-400" />
                      <p className="mt-2 text-sm text-gray-500">Belum ada detail angsuran</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex justify-end">
              <button
                onClick={() => setShowPinjamanDetailModal(false)}
                className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Konfirmasi */}
      <ConfirmationModal
        show={showConfirmModal}
        message={confirmMessage}
        onConfirm={handleConfirm}
        onCancel={handleCancelConfirm}
      />
    </ProtectedLayout>
  );
}
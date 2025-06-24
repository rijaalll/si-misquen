// components/admin/SimpananManagementView.jsx
// Komponen klien untuk manajemen simpanan di panel admin.

"use client";

import { useEffect, useState } from 'react';
import ProtectedLayout from '@/controller/role.controller'; // Mengimpor ProtectedLayout
import { database } from '@/utils/firebaseConfig';
import { ref, onValue, set, remove, update } from 'firebase/database';
import { v4 as uuidv4 } from 'uuid';
import {
  PlusIcon,
  TrashIcon,
  XMarkIcon,
  InformationCircleIcon,
  EyeIcon,
  BanknotesIcon, // Icon untuk simpanan
  ArrowDownTrayIcon,
  ArrowUpTrayIcon,
  CalendarDaysIcon
} from '@heroicons/react/24/outline';
import ConfirmationModal from './ConfirmationModal'; // Mengimpor modal konfirmasi

export default function SimpananManagementView() {
  const [users, setUsers] = useState([]); // Diperlukan untuk menampilkan nama pengguna
  const [simpananData, setSimpananData] = useState([]);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');

  // Status Modal Detail Simpanan
  const [showSimpananDetailModal, setShowSimpananDetailModal] = useState(false);
  const [selectedSimpananToView, setSelectedSimpananToView] = useState(null);
  const [simpananDetailNominal, setSimpananDetailNominal] = useState('');

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

    const simpananRef = ref(database, 'koperasi/data/transaksi/simpan');
    const unsubscribeSimpanan = onValue(simpananRef, (snapshot) => {
      const data = snapshot.val();
      const simpananList = [];
      for (const id in data) {
        simpananList.push({ id, ...data[id] });
      }
      setSimpananData(simpananList);
    });

    return () => {
      unsubscribeUsers();
      unsubscribeSimpanan();
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


  // --- Manajemen Simpanan ---
  const openSimpananDetailModal = (simpanan) => {
    setSelectedSimpananToView(simpanan);
    setShowSimpananDetailModal(true);
    setSimpananDetailNominal('');
  };

  const handleAddSimpananDetail = async (simpananId, currentTotal, type, nominalValue) => {
    if (!nominalValue || isNaN(nominalValue) || parseFloat(nominalValue) <= 0) {
      showMessage('Nominal tidak valid.', 'error');
      return;
    }

    const newNominal = parseFloat(nominalValue);
    const now = new Date();
    const tanggal = now.getDate();
    const bulan = now.getMonth() + 1;
    const tahun = now.getFullYear();
    const jam = `${now.getHours()}:${now.getMinutes()}`;

    const newDetailId = uuidv4();
    let newTotal = currentTotal;

    if (type === 'simpan') {
      newTotal += newNominal;
    } else if (type === 'tarik') {
      if (currentTotal < newNominal) {
        showMessage('Saldo tidak mencukupi untuk penarikan ini.', 'error');
        return;
      }
      newTotal -= newNominal;
    }

    try {
      await set(ref(database, `koperasi/data/transaksi/simpan/${simpananId}/detail/${newDetailId}`), {
        status: type,
        nominal: newNominal,
        detail: { tanggal, bulan, tahun, jam }
      });
      await update(ref(database, `koperasi/data/transaksi/simpan/${simpananId}`), {
        total: newTotal
      });
      
      setSelectedSimpananToView(prev => ({
        ...prev,
        total: newTotal,
        detail: {
          ...prev.detail,
          [newDetailId]: { status: type, nominal: newNominal, detail: { tanggal, bulan, tahun, jam } }
        }
      }));

      showMessage('Detail simpanan berhasil ditambahkan!', 'success');
      setSimpananDetailNominal('');
    } catch (error) {
      console.error("Error adding simpanan detail:", error);
      showMessage(`Gagal menambahkan detail simpanan: ${error.message}`, 'error');
    }
  };

  const handleDeleteSimpanan = async (simpananId) => {
    openConfirmModal('Anda yakin ingin menghapus seluruh data simpanan ini? Ini akan menghapus semua riwayat transaksi simpanan untuk pengguna ini.', async () => {
      try {
        await remove(ref(database, `koperasi/data/transaksi/simpan/${simpananId}`));
        showMessage('Data simpanan berhasil dihapus!', 'success');
      }
      catch (error) {
        console.error("Error deleting simpanan:", error);
        showMessage(`Gagal menghapus data simpanan: ${error.message}`, 'error');
      }
    });
  };

  const handleDeleteSimpananDetail = async (simpananId, detailId, nominal, status) => {
    openConfirmModal('Anda yakin ingin menghapus detail transaksi ini? Saldo akan disesuaikan.', async () => {
      try {
          const simpananRef = ref(database, `koperasi/data/transaksi/simpan/${simpananId}`);
          const snapshot = await new Promise((resolve) => {
              onValue(simpananRef, resolve, { onlyOnce: true });
          });
          const currentSimpanan = snapshot.val();
          let newTotal = currentSimpanan.total;

          if (status === 'simpan') {
              newTotal -= nominal;
          } else if (status === 'tarik') {
              newTotal += nominal;
          }

          if (newTotal < 0) {
              showMessage('Tidak dapat menghapus, saldo akan menjadi negatif.', 'error');
              return;
          }

          await remove(ref(database, `koperasi/data/transaksi/simpan/${simpananId}/detail/${detailId}`));
          await update(ref(database, `koperasi/data/transaksi/simpan/${simpananId}`), {
              total: newTotal
          });

          setSelectedSimpananToView(prev => {
            const updatedDetails = { ...prev.detail };
            delete updatedDetails[detailId];
            return {
              ...prev,
              total: newTotal,
              detail: updatedDetails
            };
          });

          showMessage('Detail simpanan berhasil dihapus!', 'success');
      }
      catch (error) {
          console.error("Error deleting simpanan detail:", error);
          showMessage(`Gagal menghapus detail simpanan: ${error.message}`, 'error');
      }
    });
  };


  // Fungsi Pembantu
  const getStatusColor = (status) => {
    switch (status) {
      case 'simpan': return 'bg-emerald-100 text-emerald-800';
      case 'tarik': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (tanggal, bulan, tahun) => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    return `${tanggal} ${months[bulan - 1]} ${tahun}`;
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
            <BanknotesIcon className="w-8 h-8 text-emerald-600" /> Manajemen Simpanan
        </h2>

        {/* Manajemen Simpanan */}
        <div className="bg-white p-6 rounded-lg shadow-md mb-8 border border-gray-100">
          {simpananData.length === 0 ? (
            <p className="text-gray-600 py-4 text-center">Tidak ada data simpanan.</p>
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
                      Total Saldo
                    </th>
                    <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Aksi
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {simpananData.map((simpanan) => (
                    <tr key={simpanan.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{simpanan.userId}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{users.find(u => u.id === simpanan.userId)?.fullName || 'Tidak Diketahui'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        Rp {simpanan.total.toLocaleString('id-ID')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                        <button
                          onClick={() => openSimpananDetailModal(simpanan)}
                          className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded-md shadow-sm mr-2 transition duration-150 ease-in-out flex items-center gap-1"
                        >
                          <EyeIcon className="w-4 h-4" /> Lihat Detail
                        </button>
                        <button
                          onClick={() => handleDeleteSimpanan(simpanan.id)}
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

      {/* Modal Detail Simpanan */}
      {showSimpananDetailModal && selectedSimpananToView && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                  <BanknotesIcon className="w-5 h-5 text-emerald-600" />
                  Detail Simpanan
                </h2>
                <button
                  onClick={() => setShowSimpananDetailModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <XMarkIcon className="w-5 h-5 text-gray-500" />
                </button>
              </div>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm mb-6">
                <div>
                  <p className="text-gray-500">ID User:</p>
                  <p className="font-medium text-gray-900">{selectedSimpananToView.userId}</p>
                </div>
                <div>
                  <p className="text-gray-500">Nama Anggota:</p>
                  <p className="font-medium text-gray-900">{users.find(u => u.id === selectedSimpananToView.userId)?.fullName || 'Tidak Diketahui'}</p>
                </div>
                <div className="col-span-full">
                  <p className="text-gray-500">Total Saldo:</p>
                  <p className="text-2xl font-bold text-emerald-600">Rp {selectedSimpananToView.total.toLocaleString('id-ID')}</p>
                </div>
              </div>

              <h3 className="text-lg font-semibold text-gray-800 mb-4">Riwayat Transaksi:</h3>
              <div className="space-y-3 max-h-60 overflow-y-auto pr-2 mb-4">
                {Object.entries(selectedSimpananToView.detail || {})
                  .sort(([, a], [, b]) => {
                    const dateA = new Date(a.detail.tahun, a.detail.bulan - 1, a.detail.tanggal, a.detail.jam.split(':')[0], a.detail.jam.split(':')[1]);
                    const dateB = new Date(b.detail.tahun, b.detail.bulan - 1, b.detail.tanggal, b.detail.jam.split(':')[0], b.detail.jam.split(':')[1]);
                    return dateB - dateA;
                  })
                  .map(([detailId, detail]) => (
                    <div key={detailId} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${detail.status === 'simpan' ? 'bg-emerald-100' : 'bg-purple-100'}`}>
                          {detail.status === 'simpan' ? (
                            <ArrowUpTrayIcon className={`w-4 h-4 ${detail.status === 'simpan' ? 'text-emerald-600' : 'text-purple-600'}`} />
                          ) : (
                            <ArrowDownTrayIcon className={`w-4 h-4 ${detail.status === 'simpan' ? 'text-emerald-600' : 'text-purple-600'}`} />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            {detail.status === 'simpan' ? '+' : '-'} Rp {detail.nominal.toLocaleString('id-ID')}
                          </p>
                          <p className="text-sm text-gray-500">
                            {formatDate(detail.detail.tanggal, detail.detail.bulan, detail.detail.tahun)} • {detail.detail.jam}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleDeleteSimpananDetail(selectedSimpananToView.id, detailId, detail.nominal, detail.status)}
                        className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 text-xs rounded-md shadow-sm transition duration-150 ease-in-out flex items-center gap-1"
                      >
                        <TrashIcon className="w-3 h-3" /> Hapus
                      </button>
                    </div>
                  ))}
                  {Object.keys(selectedSimpananToView.detail || {}).length === 0 && (
                    <p className="text-gray-500 text-center py-4">Belum ada transaksi simpanan.</p>
                  )}
              </div>

              {/* Tambah Input Simpanan/Tarik di dalam modal */}
              <div className="mt-4 flex flex-wrap gap-2 items-end justify-between border-t pt-4 border-gray-100">
                  <div>
                      <label htmlFor="simpananDetailNominal" className="block text-xs font-medium text-gray-700">Nominal Transaksi</label>
                      <input
                          type="number"
                          placeholder="Nominal"
                          className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm text-gray-900"
                          id="simpananDetailNominal"
                          min="1"
                          value={simpananDetailNominal}
                          onChange={(e) => setSimpananDetailNominal(e.target.value)}
                      />
                  </div>
                  <div className="flex gap-2">
                    <button
                        onClick={() => handleAddSimpananDetail(selectedSimpananToView.id, selectedSimpananToView.total, 'simpan', simpananDetailNominal)}
                        className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 text-xs rounded-md shadow-sm flex items-center gap-1"
                    >
                        <PlusIcon className="w-3 h-3" /> Setor
                    </button>
                    <button
                        onClick={() => handleAddSimpananDetail(selectedSimpananToView.id, selectedSimpananToView.total, 'tarik', simpananDetailNominal)}
                        className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 text-xs rounded-md shadow-sm flex items-center gap-1"
                    >
                        <MinusIcon className="w-3 h-3" /> Tarik
                    </button>
                  </div>
              </div>
            </div>
            <div className="p-6 border-t border-gray-100 flex justify-end">
              <button
                onClick={() => setShowSimpananDetailModal(false)}
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

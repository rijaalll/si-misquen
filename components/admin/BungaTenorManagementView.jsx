// components/admin/BungaTenorManagementView.jsx
// Komponen klien untuk manajemen bunga dan tenor di panel admin.

"use client";

import { useEffect, useState } from 'react';
import ProtectedLayout from '@/controller/role.controller'; // Mengimpor ProtectedLayout
import { database } from '@/utils/firebaseConfig';
import { ref, onValue, set, remove, update } from 'firebase/database';
import { v4 as uuidv4 } from 'uuid';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  XMarkIcon,
  InformationCircleIcon,
  CurrencyDollarIcon, // Icon baru untuk manajemen bunga/tenor
  CheckIcon, // Icon untuk pesan sukses
  ExclamationTriangleIcon // Icon untuk pesan error
} from '@heroicons/react/24/outline';
import ConfirmationModal from './ConfirmationModal'; // Mengimpor modal konfirmasi

export default function BungaTenorManagementView() {
  const [bungaTenorData, setBungaTenorData] = useState([]);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');

  // Status Manajemen Bunga Tenor
  const [showBungaTenorModal, setShowBungaTenorModal] = useState(false);
  const [currentBungaTenorData, setCurrentBungaTenorData] = useState(null);
  const [newBungaTenor, setNewBungaTenor] = useState({
    bulan: '',
    bunga: ''
  });

  // Status Modal Konfirmasi Umum
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmMessage, setConfirmMessage] = useState('');
  const [onConfirmAction, setOnConfirmAction] = useState(() => () => {});

  // Mengambil data bunga/tenor dari Firebase
  useEffect(() => {
    const bungaRef = ref(database, `koperasi/bunga`);
    const unsubscribeBunga = onValue(bungaRef, (snapshot) => {
        const data = snapshot.val();
        const bungaTenorList = [];
        for (const id in data) {
            bungaTenorList.push({ id, ...data[id] });
        }
        setBungaTenorData(bungaTenorList);
    });
    return () => unsubscribeBunga();
  }, []);

  // Fungsi untuk menampilkan pesan sementara
  const showMessage = (msg, type) => {
    setMessage(msg);
    setMessageType(type);
    setTimeout(() => {
      setMessage('');
      setMessageType('');
    }, 5000); // Tampilkan pesan lebih lama
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

  // --- Manajemen Bunga Tenor ---
  const handleAddBungaTenor = () => {
    setCurrentBungaTenorData(null);
    setNewBungaTenor({ bulan: '', bunga: '' });
    setShowBungaTenorModal(true);
  };

  const handleEditBungaTenor = (bungaTenor) => {
    setCurrentBungaTenorData(bungaTenor);
    setNewBungaTenor({
      bulan: bungaTenor.tenor.bulan.toString(),
      bunga: bungaTenor.tenor.bunga.toString()
    });
    setShowBungaTenorModal(true);
  };

  const handleDeleteBungaTenor = async (bungaTenorId) => {
    openConfirmModal('Anda yakin ingin menghapus data bunga dan tenor ini?', async () => {
      try {
        await remove(ref(database, `koperasi/bunga/${bungaTenorId}`));
        showMessage('Data bunga dan tenor berhasil dihapus!', 'success');
      } catch (error) {
        console.error("Error deleting bunga/tenor:", error);
        showMessage(`Gagal menghapus data bunga dan tenor: ${error.message}`, 'error');
      }
    });
  };

  const handleBungaTenorModalSave = async () => {
    if (!newBungaTenor.bulan || isNaN(newBungaTenor.bulan) || parseInt(newBungaTenor.bulan) <= 0 ||
        !newBungaTenor.bunga || isNaN(newBungaTenor.bunga) || parseFloat(newBungaTenor.bunga) < 0) {
      showMessage('Bulan dan bunga harus diisi dengan angka valid.', 'error');
      return;
    }

    const bungaDataToSave = {
      tenor: {
        bulan: parseInt(newBungaTenor.bulan),
        bunga: parseFloat(newBungaTenor.bunga)
      }
    };

    try {
      if (currentBungaTenorData) {
        await update(ref(database, `koperasi/bunga/${currentBungaTenorData.id}`), bungaDataToSave);
        showMessage('Data bunga dan tenor berhasil diperbarui!', 'success');
      } else {
        const newBungaId = uuidv4();
        await set(ref(database, `koperasi/bunga/${newBungaId}`), {
          id: newBungaId,
          ...bungaDataToSave
        });
        showMessage('Data bunga dan tenor berhasil ditambahkan!', 'success');
      }
      setShowBungaTenorModal(false);
    } catch (error) {
      console.error("Error saving bunga/tenor:", error);
      showMessage(`Gagal menyimpan data bunga dan tenor: ${error.message}`, 'error');
    }
  };

  const handleBungaTenorChange = (e) => {
    const { name, value } = e.target;
    setNewBungaTenor(prev => ({ ...prev, [name]: value }));
  };

  return (
    <ProtectedLayout allowedRoles={['admin']}>
      <div className="container mx-auto p-4">
        {/* Alert Messages */}
        {message && (
          <div className={`p-4 rounded-xl border-l-4 ${
            messageType === 'success'
              ? 'bg-emerald-50 border-emerald-400 text-emerald-700'
              : 'bg-red-50 border-red-400 text-red-700'
          } mb-6`}>
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

        <h2 className="text-3xl font-bold text-gray-800 mb-6 flex items-center gap-2">
            <CurrencyDollarIcon className="w-8 h-8 text-green-600" /> Manajemen Bunga & Tenor
        </h2>

        {/* Manajemen Bunga & Tenor */}
        <div className="bg-white p-6 rounded-xl shadow-md mb-8 border border-gray-200 overflow-hidden"> {/* Updated styling */}
          <div className="flex justify-end mb-4">
            <button
              onClick={handleAddBungaTenor}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md shadow-sm transition duration-150 ease-in-out flex items-center gap-1"
            >
              <PlusIcon className="w-5 h-5" /> Tambah Bunga/Tenor
            </button>
          </div>
          {bungaTenorData.length === 0 ? (
            <div className="text-center py-12">
              <CurrencyDollarIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">Belum ada data bunga dan tenor</h3>
              <p className="mt-1 text-sm text-gray-500">
                Data bunga dan tenor akan muncul di sini.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto"> {/* Added overflow-x-auto for table responsiveness */}
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      ID
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Tenor (Bulan)
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Bunga (% Per Bulan)
                    </th>
                    <th scope="col" className="px-6 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Aksi
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {bungaTenorData.map((data) => (
                    <tr key={data.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{data.id}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{data.tenor.bulan}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{data.tenor.bunga}%</td>
                      <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                        <div className="flex items-center justify-center space-x-2">
                          <button
                            onClick={() => handleEditBungaTenor(data)}
                            className="inline-flex items-center px-3 py-2 border border-yellow-300 rounded-lg text-sm font-medium text-yellow-700 bg-yellow-50 hover:bg-yellow-100 focus:outline-none focus:ring-2 focus:ring-yellow-500 transition-colors"
                          >
                            <PencilIcon className="w-4 h-4 mr-1" /> Edit
                          </button>
                          <button
                            onClick={() => handleDeleteBungaTenor(data.id)}
                            className="inline-flex items-center px-3 py-2 border border-red-300 rounded-lg text-sm font-medium text-red-700 bg-red-50 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors"
                          >
                            <TrashIcon className="w-4 h-4 mr-1" /> Hapus
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

      {/* Modal Bunga & Tenor (Tambah/Edit) */}
      {showBungaTenorModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 overflow-y-auto p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-hidden flex flex-col"> {/* Updated styling */}
            <div className="bg-gradient-to-r from-green-50 to-green-100 p-6 border-b border-green-200 flex-shrink-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-green-500 rounded-lg">
                    <CurrencyDollarIcon className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">{currentBungaTenorData ? 'Edit Bunga & Tenor' : 'Tambah Bunga & Tenor Baru'}</h2>
                    <p className="text-sm text-gray-600">Sesuaikan atau tambahkan data bunga dan tenor.</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowBungaTenorModal(false)}
                  className="p-2 hover:bg-green-200 rounded-lg transition-colors"
                >
                  <XMarkIcon className="w-5 h-5 text-gray-500" />
                </button>
              </div>
            </div>

            <div className="p-6 flex-1 overflow-y-auto"> {/* Added flex-1 and overflow-y-auto */}
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label htmlFor="bulan" className="block text-sm font-medium text-gray-700">Tenor (Bulan)</label>
                  <input type="number" name="bulan" id="bulan" value={newBungaTenor.bulan} onChange={handleBungaTenorChange} required
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-gray-900" min="1" />
                </div>
                <div>
                  <label htmlFor="bunga" className="block text-sm font-medium text-gray-700">Bunga (% Per Bulan)</label>
                  <input type="number" name="bunga" id="bunga" value={newBungaTenor.bunga} onChange={handleBungaTenorChange} required
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-gray-900" min="0" step="0.01" />
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex justify-end flex-shrink-0">
              <button
                onClick={() => setShowBungaTenorModal(false)}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition duration-150 ease-in-out font-medium"
              >
                Batal
              </button>
              <button
                onClick={handleBungaTenorModalSave}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition duration-150 ease-in-out font-medium ml-3"
              >
                Simpan
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

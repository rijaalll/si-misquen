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
  CurrencyDollarIcon // Icon baru untuk manajemen bunga/tenor
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
        {message && (
          <div className={`p-3 rounded-md mb-4 text-center ${messageType === 'success' ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'}`}>
            {message}
          </div>
        )}

        <h2 className="text-3xl font-bold text-gray-800 mb-6 flex items-center gap-2">
            <CurrencyDollarIcon className="w-8 h-8 text-green-600" /> Manajemen Bunga & Tenor
        </h2>

        {/* Manajemen Bunga & Tenor */}
        <div className="bg-white p-6 rounded-lg shadow-md mb-8 border border-gray-100">
          <div className="flex justify-end mb-4">
            <button
              onClick={handleAddBungaTenor}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md shadow-sm transition duration-150 ease-in-out flex items-center gap-1"
            >
              <PlusIcon className="w-5 h-5" /> Tambah Bunga/Tenor
            </button>
          </div>
          {bungaTenorData.length === 0 ? (
            <p className="text-gray-600 py-4 text-center">Tidak ada data bunga dan tenor.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ID
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tenor (Bulan)
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Bunga (% Per Bulan)
                    </th>
                    <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Aksi
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {bungaTenorData.map((data) => (
                    <tr key={data.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{data.id}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{data.tenor.bulan}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{data.tenor.bunga}%</td>
                      <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                        <button
                          onClick={() => handleEditBungaTenor(data)}
                          className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded-md shadow-sm mr-2 transition duration-150 ease-in-out flex items-center gap-1"
                        >
                          <PencilIcon className="w-4 h-4" /> Edit
                        </button>
                        <button
                          onClick={() => handleDeleteBungaTenor(data.id)}
                          className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-md shadow-sm transition duration-150 ease-in-out flex items-center gap-1"
                        >
                          <TrashIcon className="w-4 h-4" /> Hapus
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

      {/* Modal Bunga & Tenor (Tambah/Edit) */}
      {showBungaTenorModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 overflow-y-auto p-4">
          <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-4 text-gray-800">{currentBungaTenorData ? 'Edit Bunga & Tenor' : 'Tambah Bunga & Tenor Baru'}</h2>
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

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowBungaTenorModal(false)}
                className="px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400 transition duration-150 ease-in-out"
              >
                Batal
              </button>
              <button
                onClick={handleBungaTenorModalSave}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition duration-150 ease-in-out"
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

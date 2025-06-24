// components/admin/UserManagementView.jsx
// Komponen klien untuk manajemen pengguna di panel admin.

"use client";

import { useEffect, useState, useCallback } from 'react';
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
  UserGroupIcon // Icon baru untuk manajemen pengguna
} from '@heroicons/react/24/outline';
import ConfirmationModal from './ConfirmationModal'; // Mengimpor modal konfirmasi

export default function UserManagementView() {
  const [users, setUsers] = useState([]);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');

  // Status Manajemen Pengguna
  const [showUserModal, setShowUserModal] = useState(false);
  const [currentUserData, setCurrentUserData] = useState(null);
  const [newUserData, setNewUserData] = useState({
    userName: '',
    fullName: '',
    password: '',
    role: 'user',
    detail: {
      nik: '', nkk: '', hari: '', tanggal: '', bulan: '', tahun: '', gender: 'laki-laki',
      provinsi: { code: '', name: '' },
      kota: { code: '', name: '' },
      kecamatan: { code: '', name: '' },
      desa: { code: '', name: '' },
      rw: '', rt: '',
      anggota: { pekerjaan: '', pendapatan: '' }
    }
  });

  // Status data API Wilayah.id
  const [provinces, setProvinces] = useState([]);
  const [regencies, setRegencies] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [villages, setVillages] = useState([]);

  // Status untuk mengontrol nilai yang dipilih di dropdown (untuk mengambil data anak)
  const [selectedProvinceCode, setSelectedProvinceCode] = useState('');
  const [selectedRegencyCode, setSelectedRegencyCode] = useState('');
  const [selectedDistrictCode, setSelectedDistrictCode] = useState('');

  // Status Modal Konfirmasi Umum
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmMessage, setConfirmMessage] = useState('');
  const [onConfirmAction, setOnConfirmAction] = useState(() => () => {});

  // URL dasar untuk API Wilayah.id dengan proxy AllOrigins CORS
  const WILAYAH_API_PROXY_URL = 'https://api.allorigins.win/raw?url=https://wilayah.id/api/';

  // Mengambil data pengguna dari Firebase
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
    return () => unsubscribeUsers();
  }, []);

  // Mengambil Provinsi saat modal pengguna terbuka
  useEffect(() => {
    if (showUserModal) {
      fetch(`${WILAYAH_API_PROXY_URL}provinces.json`)
        .then(res => {
          if (!res.ok) {
            throw new Error(`HTTP error! status: ${res.status}`);
          }
          return res.json();
        })
        .then(data => {
          setProvinces(data.data);
          if (currentUserData && currentUserData.detail?.provinsi?.code) {
            setSelectedProvinceCode(currentUserData.detail.provinsi.code);
          }
        })
        .catch(error => console.error("Error fetching provinces:", error));
    } else {
      setProvinces([]);
      setRegencies([]);
      setDistricts([]);
      setVillages([]);
      setSelectedProvinceCode('');
      setSelectedRegencyCode('');
      setSelectedDistrictCode('');
    }
  }, [showUserModal, currentUserData]);

  // Mengambil Kabupaten/Kota berdasarkan Provinsi yang dipilih
  useEffect(() => {
    if (selectedProvinceCode) {
      fetch(`${WILAYAH_API_PROXY_URL}regencies/${selectedProvinceCode}.json`)
        .then(res => {
          if (!res.ok) {
            throw new Error(`HTTP error! status: ${res.status}`);
          }
          return res.json();
        })
        .then(data => {
          setRegencies(data.data);
          if (currentUserData && currentUserData.detail?.kota?.code && data.data.some(item => item.code === currentUserData.detail.kota.code)) {
            setSelectedRegencyCode(currentUserData.detail.kota.code);
          } else {
            setSelectedRegencyCode('');
          }
          setDistricts([]);
          setVillages([]);
          setNewUserData(prev => ({
              ...prev,
              detail: {
                  ...prev.detail,
                  kota: { code: '', name: '' },
                  kecamatan: { code: '', name: '' },
                  desa: { code: '', name: '' },
              }
          }));
        })
        .catch(error => console.error(`Error fetching regencies for ${selectedProvinceCode}:`, error));
    } else {
      setRegencies([]);
      setDistricts([]);
      setVillages([]);
      setSelectedRegencyCode('');
      setSelectedDistrictCode('');
      setNewUserData(prev => ({
          ...prev,
          detail: {
              ...prev.detail,
              kota: { code: '', name: '' },
              kecamatan: { code: '', name: '' },
              desa: { code: '', name: '' },
          }
      }));
    }
  }, [selectedProvinceCode, currentUserData]);

  // Mengambil Kecamatan berdasarkan Kabupaten/Kota yang dipilih
  useEffect(() => {
    if (selectedRegencyCode) {
      fetch(`${WILAYAH_API_PROXY_URL}districts/${selectedRegencyCode}.json`)
        .then(res => {
          if (!res.ok) {
            throw new Error(`HTTP error! status: ${res.status}`);
          }
          return res.json();
        })
        .then(data => {
          setDistricts(data.data);
          if (currentUserData && currentUserData.detail?.kecamatan?.code && data.data.some(item => item.code === currentUserData.detail.kecamatan.code)) {
            setSelectedDistrictCode(currentUserData.detail.kecamatan.code);
          } else {
            setSelectedDistrictCode('');
          }
          setVillages([]);
          setNewUserData(prev => ({
              ...prev,
              detail: {
                  ...prev.detail,
                  kecamatan: { code: '', name: '' },
                  desa: { code: '', name: '' },
              }
          }));
        })
        .catch(error => console.error(`Error fetching districts for ${selectedRegencyCode}:`, error));
    } else {
      setDistricts([]);
      setVillages([]);
      setSelectedDistrictCode('');
      setNewUserData(prev => ({
          ...prev,
          detail: {
              ...prev.detail,
              kecamatan: { code: '', name: '' },
              desa: { code: '', name: '' },
          }
      }));
    }
  }, [selectedRegencyCode, currentUserData]);

  // Mengambil Desa/Kelurahan berdasarkan Kecamatan yang dipilih
  useEffect(() => {
    if (selectedDistrictCode) {
      fetch(`${WILAYAH_API_PROXY_URL}villages/${selectedDistrictCode}.json`)
        .then(res => {
          if (!res.ok) {
            throw new Error(`HTTP error! status: ${res.status}`);
          }
          return res.json();
        })
        .then(data => {
          setVillages(data.data);
          setNewUserData(prev => ({
            ...prev,
            detail: {
                ...prev.detail,
                desa: currentUserData && currentUserData.detail?.desa?.code && data.data.some(item => item.code === currentUserData.detail.desa.code)
                    ? currentUserData.detail.desa
                    : { code: '', name: '' },
            }
        }));
        })
        .catch(error => console.error(`Error fetching villages for ${selectedDistrictCode}:`, error));
    } else {
      setVillages([]);
      setNewUserData(prev => ({
          ...prev,
          detail: {
              ...prev.detail,
              desa: { code: '', name: '' },
          }
      }));
    }
  }, [selectedDistrictCode, currentUserData]);


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


  // --- Manajemen Pengguna ---
  const handleAddUser = () => {
    setCurrentUserData(null);
    setNewUserData({
      userName: '',
      fullName: '',
      password: '',
      role: 'user',
      detail: {
        nik: '', nkk: '', hari: '', tanggal: '', bulan: '', tahun: '', gender: 'laki-laki',
        provinsi: { code: '', name: '' },
        kota: { code: '', name: '' },
        kecamatan: { code: '', name: '' },
        desa: { code: '', name: '' },
        rw: '', rt: '',
        anggota: { pekerjaan: '', pendapatan: '' }
      }
    });
    setSelectedProvinceCode('');
    setSelectedRegencyCode('');
    setSelectedDistrictCode('');
    setShowUserModal(true);
  };

  const handleEditUser = (user) => {
    setCurrentUserData(user);
    setNewUserData(JSON.parse(JSON.stringify({
      userName: user.userName || '',
      fullName: user.fullName || '',
      password: user.password || '', // Penting: Jangan menyimpan password plaintext di produksi
      role: user.role || 'user',
      detail: {
        nik: user.detail?.nik || '',
        nkk: user.detail?.nkk || '',
        hari: user.detail?.hari || '',
        tanggal: user.detail?.tanggal || '',
        bulan: user.detail?.bulan || '',
        tahun: user.detail?.tahun || '',
        gender: user.detail?.gender || 'laki-laki',
        provinsi: user.detail?.provinsi || { code: '', name: '' },
        kota: user.detail?.kota || { code: '', name: '' },
        kecamatan: user.detail?.kecamatan || { code: '', name: '' },
        desa: user.detail?.desa || { code: '', name: '' },
        rw: user.detail?.rw || '',
        rt: user.detail?.rt || '',
        anggota: {
          pekerjaan: user.detail?.anggota?.pekerjaan || '',
          pendapatan: user.detail?.anggota?.pendapatan || ''
        }
      }
    })));
    setSelectedProvinceCode(user.detail?.provinsi?.code || '');
    setSelectedRegencyCode(user.detail?.kota?.code || '');
    setSelectedDistrictCode(user.detail?.kecamatan?.code || '');
    setShowUserModal(true);
  };

  const handleDeleteUser = async (userId) => {
    openConfirmModal('Anda yakin ingin menghapus pengguna ini? Ini juga akan menghapus data simpanan dan pinjaman terkait.', async () => {
      try {
        await remove(ref(database, `koperasi/user/${userId}`));
        showMessage('Pengguna berhasil dihapus!', 'success');
      } catch (error) {
        console.error("Error deleting user:", error);
        showMessage(`Gagal menghapus pengguna: ${error.message}`, 'error');
      }
    });
  };

  const handleUserModalSave = async () => {
    if (!newUserData.userName || !newUserData.password || !newUserData.role) {
      showMessage('Nama Pengguna, Kata Sandi, dan Peran harus diisi.', 'error');
      return;
    }
    if ((newUserData.role === 'user' || newUserData.role === 'teller') &&
        (!newUserData.detail.provinsi.code || !newUserData.detail.kota.code ||
         !newUserData.detail.kecamatan.code || !newUserData.detail.desa.code)) {
        showMessage('Provinsi, Kota/Kabupaten, Kecamatan, dan Desa harus dipilih.', 'error');
        return;
    }

    try {
      if (currentUserData) {
        await update(ref(database, `koperasi/user/${currentUserData.id}`), {
          ...newUserData,
          detail: {
            ...newUserData.detail,
            anggota: newUserData.role === 'user' ? newUserData.detail.anggota : null
          }
        });
        showMessage('Pengguna berhasil diperbarui!', 'success');
      } else {
        const newUserId = uuidv4();
        await set(ref(database, `koperasi/user/${newUserId}`), {
          id: newUserId,
          ...newUserData,
          detail: {
            ...newUserData.detail,
            anggota: newUserData.role === 'user' ? newUserData.detail.anggota : null
          }
        });
        showMessage('Pengguna berhasil ditambahkan!', 'success');
      }
      setShowUserModal(false);
    } catch (error) {
      console.error("Error saving user:", error);
      showMessage(`Gagal menyimpan pengguna: ${error.message}`, 'error');
    }
  };

  const handleUserChange = useCallback((e) => {
    const { name, value } = e.target;
    if (name.startsWith('detail.provinsi')) {
        const selectedOption = provinces.find(p => p.code === value);
        setNewUserData(prev => ({
            ...prev,
            detail: {
                ...prev.detail,
                provinsi: selectedOption ? { code: value, name: selectedOption.name } : { code: '', name: '' },
                kota: { code: '', name: '' },
                kecamatan: { code: '', name: '' },
                desa: { code: '', name: '' },
            }
        }));
        setSelectedProvinceCode(value);
        setSelectedRegencyCode('');
        setSelectedDistrictCode('');
    } else if (name.startsWith('detail.kota')) {
        const selectedOption = regencies.find(r => r.code === value);
        setNewUserData(prev => ({
            ...prev,
            detail: {
                ...prev.detail,
                kota: selectedOption ? { code: value, name: selectedOption.name } : { code: '', name: '' },
                kecamatan: { code: '', name: '' },
                desa: { code: '', name: '' },
            }
        }));
        setSelectedRegencyCode(value);
        setSelectedDistrictCode('');
    } else if (name.startsWith('detail.kecamatan')) {
        const selectedOption = districts.find(d => d.code === value);
        setNewUserData(prev => ({
            ...prev,
            detail: {
                ...prev.detail,
                kecamatan: selectedOption ? { code: value, name: selectedOption.name } : { code: '', name: '' },
                desa: { code: '', name: '' },
            }
        }));
        setSelectedDistrictCode(value);
    } else if (name.startsWith('detail.desa')) {
        const selectedOption = villages.find(v => v.code === value);
        setNewUserData(prev => ({
            ...prev,
            detail: {
                ...prev.detail,
                desa: selectedOption ? { code: value, name: selectedOption.name } : { code: '', name: '' },
            }
        }));
    } else if (name.includes('.')) {
      const [parent, child, grandChild] = name.split('.');
      if (parent === 'detail') {
        if (child === 'anggota') {
            setNewUserData(prev => ({
                ...prev,
                detail: {
                    ...prev.detail,
                    anggota: {
                        ...prev.detail.anggota,
                        [grandChild]: value
                    }
                }
            }));
        } else {
            setNewUserData(prev => ({
                ...prev,
                detail: {
                    ...prev.detail,
                    [child]: value
                }
            }));
        }
      }
    } else {
      setNewUserData(prev => ({ ...prev, [name]: value }));
    }
  }, [provinces, regencies, districts, villages, currentUserData]);


  // Fungsi Pembantu
  const getStatusColor = (status) => {
    switch (status) {
      case 'user': return 'bg-blue-100 text-blue-800';
      case 'teller': return 'bg-purple-100 text-purple-800';
      case 'admin': return 'bg-emerald-100 text-emerald-800';
      default: return 'bg-gray-100 text-gray-800';
    }
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
            <UserGroupIcon className="w-8 h-8 text-indigo-600" /> Manajemen Pengguna
        </h2>

        {/* Manajemen Pengguna */}
        <div className="bg-white p-6 rounded-lg shadow-md mb-8 border border-gray-100">
          <div className="flex justify-end mb-4">
            <button
              onClick={handleAddUser}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md shadow-sm transition duration-150 ease-in-out flex items-center gap-1"
            >
              <PlusIcon className="w-5 h-5" /> Tambah Pengguna
            </button>
          </div>
          {users.length === 0 ? (
            <p className="text-gray-600 py-4 text-center">Tidak ada pengguna yang terdaftar.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ID Pengguna
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Nama Pengguna
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Nama Lengkap
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Role
                    </th>
                    <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Aksi
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {users.map((user) => (
                    <tr key={user.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{user.id}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{user.userName}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{user.fullName || '-'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(user.role)}`}>
                          {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                        <button
                          onClick={() => handleEditUser(user)}
                          className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded-md shadow-sm mr-2 transition duration-150 ease-in-out flex items-center gap-1"
                        >
                          <PencilIcon className="w-4 h-4" /> Edit
                        </button>
                        <button
                          onClick={() => handleDeleteUser(user.id)}
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

      {/* Modal Pengguna (Tambah/Edit) */}
      {showUserModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 overflow-y-auto p-4">
          <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-4 text-gray-800">{currentUserData ? 'Edit Pengguna' : 'Tambah Pengguna Baru'}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="userName" className="block text-sm font-medium text-gray-700">Nama Pengguna</label>
                <input type="text" name="userName" id="userName" value={newUserData.userName} onChange={handleUserChange} required
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-gray-900" />
              </div>
              <div>
                <label htmlFor="fullName" className="block text-sm font-medium text-gray-700">Nama Lengkap</label>
                <input type="text" name="fullName" id="fullName" value={newUserData.fullName} onChange={handleUserChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-gray-900" />
              </div>
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">Kata Sandi</label>
                <input type="password" name="password" id="password" value={newUserData.password} onChange={handleUserChange} required
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-gray-900" />
              </div>
              <div>
                <label htmlFor="role" className="block text-sm font-medium text-gray-700">Role</label>
                <select name="role" id="role" value={newUserData.role} onChange={handleUserChange} required
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-gray-900">
                  <option value="user">User</option>
                  <option value="teller">Teller</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              {/* Bidang Detail jika peran adalah pengguna atau teller */}
              {(newUserData.role === 'user' || newUserData.role === 'teller') && (
                <>
                  <div className="col-span-full mt-4">
                    <h3 className="text-lg font-semibold text-gray-800">Detail Personal</h3>
                  </div>
                  <div>
                    <label htmlFor="nik" className="block text-sm font-medium text-gray-700">NIK</label>
                    <input type="text" name="detail.nik" id="nik" value={newUserData.detail.nik} onChange={handleUserChange}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-gray-900" />
                  </div>
                  <div>
                    <label htmlFor="nkk" className="block text-sm font-medium text-gray-700">NKK</label>
                    <input type="text" name="detail.nkk" id="nkk" value={newUserData.detail.nkk} onChange={handleUserChange}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-gray-900" />
                  </div>
                  <div>
                    <label htmlFor="gender" className="block text-sm font-medium text-gray-700">Gender</label>
                    <select name="detail.gender" id="gender" value={newUserData.detail.gender} onChange={handleUserChange}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-gray-900">
                      <option value="laki-laki">Laki-laki</option>
                      <option value="perempuan">Perempuan</option>
                      <option value="other">Lainnya</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Tanggal Lahir</label>
                    <div className="flex space-x-2 mt-1">
                      <input type="text" name="detail.hari" placeholder="Hari" value={newUserData.detail.hari} onChange={handleUserChange} className="w-1/3 px-3 py-2 border border-gray-300 rounded-md shadow-sm text-gray-900" />
                      <input type="text" name="detail.tanggal" placeholder="Tanggal" value={newUserData.detail.tanggal} onChange={handleUserChange} className="w-1/3 px-3 py-2 border border-gray-300 rounded-md shadow-sm text-gray-900" />
                      <input type="text" name="detail.bulan" placeholder="Bulan" value={newUserData.detail.bulan} onChange={handleUserChange} className="w-1/3 px-3 py-2 border border-gray-300 rounded-md shadow-sm text-gray-900" />
                      <input type="text" name="detail.tahun" placeholder="Tahun" value={newUserData.detail.tahun} onChange={handleUserChange} className="w-1/3 px-3 py-2 border border-gray-300 rounded-md shadow-sm text-gray-900" />
                    </div>
                  </div>
                  
                  {/* Integrasi API Wilayah.id */}
                  <div className="col-span-full mt-4">
                    <h3 className="text-lg font-semibold text-gray-800">Alamat Wilayah</h3>
                  </div>
                  <div>
                    <label htmlFor="provinsi" className="block text-sm font-medium text-gray-700">Provinsi</label>
                    <select
                      name="detail.provinsi.code"
                      id="provinsi"
                      value={selectedProvinceCode}
                      onChange={handleUserChange}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-gray-900"
                    >
                      <option value="">Pilih Provinsi</option>
                      {provinces.map(p => (
                        <option key={p.code} value={p.code}>{p.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="kota" className="block text-sm font-medium text-gray-700">Kota/Kabupaten</label>
                    <select
                      name="detail.kota.code"
                      id="kota"
                      value={selectedRegencyCode}
                      onChange={handleUserChange}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-gray-900"
                      disabled={!selectedProvinceCode || regencies.length === 0}
                    >
                      <option value="">Pilih Kota/Kabupaten</option>
                      {regencies.map(r => (
                        <option key={r.code} value={r.code}>{r.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="kecamatan" className="block text-sm font-medium text-gray-700">Kecamatan</label>
                    <select
                      name="detail.kecamatan.code"
                      id="kecamatan"
                      value={selectedDistrictCode}
                      onChange={handleUserChange}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-gray-900"
                      disabled={!selectedRegencyCode || districts.length === 0}
                    >
                      <option value="">Pilih Kecamatan</option>
                      {districts.map(d => (
                        <option key={d.code} value={d.code}>{d.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="desa" className="block text-sm font-medium text-gray-700">Kelurahan/Desa</label>
                    <select
                      name="detail.desa.code"
                      id="desa"
                      value={newUserData.detail.desa.code}
                      onChange={handleUserChange}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-gray-900"
                      disabled={!selectedDistrictCode || villages.length === 0}
                    >
                      <option value="">Pilih Kelurahan/Desa</option>
                      {villages.map(v => (
                        <option key={v.code} value={v.code}>{v.name}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label htmlFor="rw" className="block text-sm font-medium text-gray-700">RW</label>
                    <input type="text" name="detail.rw" id="rw" value={newUserData.detail.rw} onChange={handleUserChange}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-gray-900" />
                  </div>
                  <div>
                    <label htmlFor="rt" className="block text-sm font-medium text-gray-700">RT</label>
                    <input type="text" name="detail.rt" id="rt" value={newUserData.detail.rt} onChange={handleUserChange}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-gray-900" />
                  </div>
                </>
              )}

              {/* Bidang Anggota jika peran adalah pengguna */}
              {newUserData.role === 'user' && (
                <>
                  <div className="col-span-full mt-4">
                    <h3 className="text-lg font-semibold text-gray-800">Detail Anggota</h3>
                  </div>
                  <div>
                    <label htmlFor="pekerjaan" className="block text-sm font-medium text-gray-700">Pekerjaan</label>
                    <input type="text" name="detail.anggota.pekerjaan" id="pekerjaan" value={newUserData.detail.anggota.pekerjaan} onChange={handleUserChange}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-gray-900" />
                  </div>
                  <div>
                    <label htmlFor="pendapatan" className="block text-sm font-medium text-gray-700">Pendapatan/Bulan</label>
                    <input type="number" name="detail.anggota.pendapatan" id="pendapatan" value={newUserData.detail.anggota.pendapatan} onChange={handleUserChange}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-gray-900" />
                  </div>
                </>
              )}
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowUserModal(false)}
                className="px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400 transition duration-150 ease-in-out"
              >
                Batal
              </button>
              <button
                onClick={handleUserModalSave}
                className="px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 transition duration-150 ease-in-out"
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

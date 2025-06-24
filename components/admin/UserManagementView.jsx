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
  CheckIcon,
  ExclamationTriangleIcon,
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
      <div className="container mx-auto p-4"> {/* Added container for better spacing */}
        {message && (
          <div className={`p-4 rounded-xl border-l-4 ${
            messageType === 'success'
              ? 'bg-emerald-50 border-emerald-400 text-emerald-700'
              : 'bg-red-50 border-red-400 text-red-700'
          } mb-6`}> {/* Added margin-bottom */}
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
            <UserGroupIcon className="w-8 h-8 text-indigo-600" /> Manajemen Pengguna
        </h2>

        {/* Manajemen Pengguna */}
        <div className="bg-white p-6 rounded-xl shadow-md mb-8 border border-gray-200 overflow-hidden"> {/* Updated shadow and border */}
          <div className="flex justify-end mb-4">
            <button
              onClick={handleAddUser}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md shadow-sm transition duration-150 ease-in-out flex items-center gap-1"
            >
              <PlusIcon className="w-5 h-5" /> Tambah Pengguna
            </button>
          </div>
          {users.length === 0 ? (
            <div className="text-center py-12">
              <UserGroupIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">Belum ada pengguna</h3>
              <p className="mt-1 text-sm text-gray-500">
                Data pengguna akan muncul di sini.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto"> {/* Added overflow-x-auto for table responsiveness */}
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      ID Pengguna
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Nama Pengguna
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Nama Lengkap
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Role
                    </th>
                    <th scope="col" className="px-6 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Aksi
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {users.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{user.id}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{user.userName}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{user.fullName || '-'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(user.role)}`}>
                          {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                        <div className="flex items-center justify-center space-x-2">
                          <button
                            onClick={() => handleEditUser(user)}
                            className="inline-flex items-center px-3 py-2 border border-yellow-300 rounded-lg text-sm font-medium text-yellow-700 bg-yellow-50 hover:bg-yellow-100 focus:outline-none focus:ring-2 focus:ring-yellow-500 transition-colors"
                          >
                            <PencilIcon className="w-4 h-4 mr-1" /> Edit
                          </button>
                          <button
                            onClick={() => handleDeleteUser(user.id)}
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

      {/* Modal Pengguna (Tambah/Edit) */}
      {showUserModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 overflow-y-auto p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col"> {/* Updated styling */}
            <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-6 border-b border-blue-200 flex-shrink-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-blue-500 rounded-lg">
                    <UserGroupIcon className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">{currentUserData ? 'Edit Pengguna' : 'Tambah Pengguna Baru'}</h2>
                    <p className="text-sm text-gray-600">Lengkapi detail pengguna.</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowUserModal(false)}
                  className="p-2 hover:bg-blue-200 rounded-lg transition-colors"
                >
                  <XMarkIcon className="w-5 h-5 text-gray-500" />
                </button>
              </div>
            </div>

            <div className="p-6 flex-1 overflow-y-auto"> {/* Added flex-1 and overflow-y-auto */}
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
            </div>

            {/* Modal Footer */}
            <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex justify-end flex-shrink-0">
              <button
                onClick={() => setShowUserModal(false)}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition duration-150 ease-in-out font-medium"
              >
                Batal
              </button>
              <button
                onClick={handleUserModalSave}
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

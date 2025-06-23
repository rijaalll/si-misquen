// app/admin/page.js (Halaman Admin)
// Halaman untuk admin mengelola semua data (CRUD).

"use client";

import { useEffect, useState } from 'react';
import ProtectedLayout from '../components/ProtectedLayout';
import { database } from '../../firebaseConfig';
import { ref, onValue, set, remove, push, update } from 'firebase/database';
import { v4 as uuidv4 } from 'uuid';

export default function AdminPage() {
  const [users, setUsers] = useState([]);
  const [simpananData, setSimpananData] = useState([]);
  const [pinjamanData, setPinjamanData] = useState([]);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState(''); // 'success' or 'error'

  const [showUserModal, setShowUserModal] = useState(false);
  const [currentUserData, setCurrentUserData] = useState(null); // For editing/adding user
  const [newUserData, setNewUserData] = useState({
    userName: '',
    fullName: '',
    password: '',
    role: 'user', // Default role
    detail: {
      nik: '', nkk: '', hari: '', tanggal: '', bulan: '', tahun: '', gender: 'laki-laki',
      provinsi: '', kota: '', kecamatan: '', desa: '', rw: '', rt: '',
      anggota: { pekerjaan: '', pendapatan: '' }
    }
  });

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
      unsubscribeSimpanan();
      unsubscribePinjaman();
    };
  }, []);

  const showMessage = (msg, type) => {
    setMessage(msg);
    setMessageType(type);
    setTimeout(() => {
      setMessage('');
      setMessageType('');
    }, 3000);
  };

  // --- User Management ---
  const handleAddUser = () => {
    setCurrentUserData(null);
    setNewUserData({
      userName: '',
      fullName: '',
      password: '',
      role: 'user',
      detail: {
        nik: '', nkk: '', hari: '', tanggal: '', bulan: '', tahun: '', gender: 'laki-laki',
        provinsi: '', kota: '', kecamatan: '', desa: '', rw: '', rt: '',
        anggota: { pekerjaan: '', pendapatan: '' }
      }
    });
    setShowUserModal(true);
  };

  const handleEditUser = (user) => {
    setCurrentUserData(user);
    setNewUserData({
      userName: user.userName || '',
      fullName: user.fullName || '',
      password: user.password || '', // Password might not be stored directly or masked
      role: user.role || 'user',
      detail: {
        nik: user.detail?.nik || '',
        nkk: user.detail?.nkk || '',
        hari: user.detail?.hari || '',
        tanggal: user.detail?.tanggal || '',
        bulan: user.detail?.bulan || '',
        tahun: user.detail?.tahun || '',
        gender: user.detail?.gender || 'laki-laki',
        provinsi: user.detail?.provinsi || '',
        kota: user.detail?.kota || '',
        kecamatan: user.detail?.kecamatan || '',
        desa: user.detail?.desa || '',
        rw: user.detail?.rw || '',
        rt: user.detail?.rt || '',
        anggota: {
          pekerjaan: user.detail?.anggota?.pekerjaan || '',
          pendapatan: user.detail?.anggota?.pendapatan || ''
        }
      }
    });
    setShowUserModal(true);
  };

  const handleDeleteUser = async (userId) => {
    if (window.confirm('Anda yakin ingin menghapus pengguna ini?')) {
      try {
        await remove(ref(database, `koperasi/user/${userId}`));
        showMessage('Pengguna berhasil dihapus!', 'success');
      } catch (error) {
        console.error("Error deleting user:", error);
        showMessage(`Gagal menghapus pengguna: ${error.message}`, 'error');
      }
    }
  };

  const handleUserModalSave = async () => {
    if (!newUserData.userName || !newUserData.password || !newUserData.role) {
      showMessage('Username, password, dan role harus diisi.', 'error');
      return;
    }

    try {
      if (currentUserData) {
        // Update user
        await update(ref(database, `koperasi/user/${currentUserData.id}`), {
          ...newUserData,
          detail: {
            ...newUserData.detail,
            anggota: newUserData.role === 'user' ? newUserData.detail.anggota : null // Only for user role
          }
        });
        showMessage('Pengguna berhasil diperbarui!', 'success');
      } else {
        // Add new user
        const newUserId = uuidv4();
        await set(ref(database, `koperasi/user/${newUserId}`), {
          id: newUserId,
          ...newUserData,
          detail: {
            ...newUserData.detail,
            anggota: newUserData.role === 'user' ? newUserData.detail.anggota : null // Only for user role
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

  const handleUserChange = (e) => {
    const { name, value } = e.target;
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      if (parent === 'detail' && child === 'anggota') {
        const [p, c, grandChild] = name.split('.');
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
    } else {
      setNewUserData(prev => ({ ...prev, [name]: value }));
    }
  };


  // --- Simpanan Management ---
  // CRUD for Simpanan is more complex due to nested structure
  // For simplicity, let's allow editing total saldo and adding new details.
  const handleEditSimpananTotal = async (simpananId, newTotal) => {
    try {
      await update(ref(database, `koperasi/data/transaksi/simpan/${simpananId}`), {
        total: parseFloat(newTotal)
      });
      showMessage('Saldo simpanan berhasil diperbarui!', 'success');
    } catch (error) {
      console.error("Error updating simpanan total:", error);
      showMessage(`Gagal memperbarui saldo simpanan: ${error.message}`, 'error');
    }
  };

  const handleDeleteSimpanan = async (simpananId) => {
    if (window.confirm('Anda yakin ingin menghapus seluruh data simpanan ini?')) {
      try {
        await remove(ref(database, `koperasi/data/transaksi/simpan/${simpananId}`));
        showMessage('Data simpanan berhasil dihapus!', 'success');
      } catch (error) {
        console.error("Error deleting simpanan:", error);
        showMessage(`Gagal menghapus data simpanan: ${error.message}`, 'error');
      }
    }
  };

  const handleAddSimpananDetail = async (simpananId, currentTotal, type, nominal) => {
    if (!nominal || isNaN(nominal) || parseFloat(nominal) <= 0) {
      showMessage('Nominal tidak valid.', 'error');
      return;
    }

    const newNominal = parseFloat(nominal);
    const now = new Date();
    const tanggal = now.getDate();
    const bulan = now.getMonth() + 1;
    const tahun = now.getFullYear();
    const jam = `${now.getHours()}:${now.getMinutes()}`;

    const newDetailId = uuidv4();
    const newTotal = type === 'simpan' ? currentTotal + newNominal : currentTotal - newNominal;

    if (newTotal < 0) {
        showMessage('Saldo tidak mencukupi untuk penarikan ini.', 'error');
        return;
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
      showMessage('Detail simpanan berhasil ditambahkan!', 'success');
    } catch (error) {
      console.error("Error adding simpanan detail:", error);
      showMessage(`Gagal menambahkan detail simpanan: ${error.message}`, 'error');
    }
  };

  const handleDeleteSimpananDetail = async (simpananId, detailId, nominal, status) => {
    if (window.confirm('Anda yakin ingin menghapus detail transaksi ini?')) {
        try {
            const simpananRef = ref(database, `koperasi/data/transaksi/simpan/${simpananId}`);
            const snapshot = await new Promise((resolve) => {
                onValue(simpananRef, resolve, { onlyOnce: true });
            });
            const currentSimpanan = snapshot.val();
            let newTotal = currentSimpanan.total;

            // Sesuaikan total saldo jika transaksi dihapus
            if (status === 'simpan') {
                newTotal -= nominal;
            } else if (status === 'tarik') {
                newTotal += nominal;
            }

            if (newTotal < 0) {
                // Ini seharusnya tidak terjadi jika logika penarikan sudah benar
                // tapi sebagai fallback
                showMessage('Tidak dapat menghapus, saldo akan menjadi negatif.', 'error');
                return;
            }

            await remove(ref(database, `koperasi/data/transaksi/simpan/${simpananId}/detail/${detailId}`));
            await update(ref(database, `koperasi/data/transaksi/simpan/${simpananId}`), {
                total: newTotal
            });
            showMessage('Detail simpanan berhasil dihapus!', 'success');
        } catch (error) {
            console.error("Error deleting simpanan detail:", error);
            showMessage(`Gagal menghapus detail simpanan: ${error.message}`, 'error');
        }
    }
  };

  // --- Pinjaman Management ---
  const handleUpdatePinjamanStatus = async (pinjamanId, newStatus) => {
    try {
      await update(ref(database, `koperasi/data/transaksi/pinjam/${pinjamanId}`), {
        status: newStatus
      });
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
      showMessage('Status tagihan berhasil diperbarui!', 'success');
    } catch (error) {
      console.error("Error updating tagihan status:", error);
      showMessage(`Gagal memperbarui status tagihan: ${error.message}`, 'error');
    }
  };

  const handleDeletePinjaman = async (pinjamanId) => {
    if (window.confirm('Anda yakin ingin menghapus data pinjaman ini?')) {
      try {
        await remove(ref(database, `koperasi/data/transaksi/pinjam/${pinjamanId}`));
        showMessage('Data pinjaman berhasil dihapus!', 'success');
      } catch (error) {
        console.error("Error deleting pinjaman:", error);
        showMessage(`Gagal menghapus data pinjaman: ${error.message}`, 'error');
      }
    }
  };

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

  return (
    <ProtectedLayout allowedRoles={['admin']}>
      <div className="container mx-auto p-4">
        {message && (
          <div className={`p-3 rounded-md mb-4 text-center ${messageType === 'success' ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'}`}>
            {message}
          </div>
        )}

        <h2 className="text-3xl font-bold text-gray-800 mb-6">Panel Admin</h2>

        {/* User Management */}
        <div className="bg-white p-6 rounded-lg shadow-md mb-8">
          <h3 className="text-2xl font-semibold text-gray-800 mb-4 flex justify-between items-center">
            Manajemen Pengguna
            <button
              onClick={handleAddUser}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md shadow-sm transition duration-150 ease-in-out"
            >
              Tambah Pengguna
            </button>
          </h3>
          {users.length === 0 ? (
            <p className="text-gray-600">Tidak ada pengguna.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Nama Pengguna
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Nama Lengkap
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Role
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Aksi
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {users.map((user) => (
                    <tr key={user.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{user.userName}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{user.fullName || '-'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{user.role}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => handleEditUser(user)}
                          className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-md shadow-sm mr-2 transition duration-150 ease-in-out"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteUser(user.id)}
                          className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md shadow-sm transition duration-150 ease-in-out"
                        >
                          Hapus
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Simpanan Management */}
        <div className="bg-white p-6 rounded-lg shadow-md mb-8">
          <h3 className="text-2xl font-semibold text-gray-800 mb-4">Manajemen Simpanan</h3>
          {simpananData.length === 0 ? (
            <p className="text-gray-600">Tidak ada data simpanan.</p>
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
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Detail Transaksi
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Aksi Saldo
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
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {Object.entries(simpanan.detail || {}).map(([detailId, detail]) => (
                          <div key={detailId} className="mb-2 p-2 border border-gray-200 rounded-md">
                            <p>Tipe: <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${detail.status === 'simpan' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{detail.status}</span></p>
                            <p>Nominal: Rp {detail.nominal.toLocaleString('id-ID')}</p>
                            <p>Tanggal: {detail.detail.tanggal}/{detail.detail.bulan}/{detail.detail.tahun} {detail.detail.jam}</p>
                            <button
                                onClick={() => handleDeleteSimpananDetail(simpanan.id, detailId, detail.nominal, detail.status)}
                                className="mt-2 bg-red-500 hover:bg-red-600 text-white px-3 py-1 text-xs rounded-md shadow-sm transition duration-150 ease-in-out"
                            >
                                Hapus Detail
                            </button>
                          </div>
                        ))}
                        <div className="mt-4 flex space-x-2">
                            <input
                                type="number"
                                placeholder="Nominal"
                                className="w-24 px-2 py-1 border border-gray-300 rounded-md text-sm"
                                id={`add-simpan-${simpanan.id}`}
                            />
                            <button
                                onClick={() => handleAddSimpananDetail(simpanan.id, simpanan.total, 'simpan', document.getElementById(`add-simpan-${simpanan.id}`).value)}
                                className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 text-xs rounded-md shadow-sm"
                            >
                                + Simpan
                            </button>
                            <input
                                type="number"
                                placeholder="Nominal"
                                className="w-24 px-2 py-1 border border-gray-300 rounded-md text-sm"
                                id={`add-tarik-${simpanan.id}`}
                            />
                            <button
                                onClick={() => handleAddSimpananDetail(simpanan.id, simpanan.total, 'tarik', document.getElementById(`add-tarik-${simpanan.id}`).value)}
                                className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 text-xs rounded-md shadow-sm"
                            >
                                + Tarik
                            </button>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => handleDeleteSimpanan(simpanan.id)}
                          className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md shadow-sm transition duration-150 ease-in-out"
                        >
                          Hapus Data Ini
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Pinjaman Management */}
        <div className="bg-white p-6 rounded-lg shadow-md mb-8">
          <h3 className="text-2xl font-semibold text-gray-800 mb-4">Manajemen Pinjaman</h3>
          {pinjamanData.length === 0 ? (
            <p className="text-gray-600">Tidak ada data pinjaman.</p>
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
                      Status Pinjaman
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Detail Tagihan
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
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
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(pinjam.status)}`}>
                          {pinjam.status}
                        </span>
                        <div className="mt-2">
                          <select
                            value={pinjam.status}
                            onChange={(e) => handleUpdatePinjamanStatus(pinjam.id, e.target.value)}
                            className="block w-full py-1 px-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                          >
                            <option value="pending">Pending</option>
                            <option value="disetujui">Disetujui</option>
                            <option value="ditolak">Ditolak</option>
                          </select>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {Object.entries(pinjam.detail || {}).map(([detailId, tagihan]) => (
                          <div key={detailId} className="mb-2 p-2 border border-gray-200 rounded-md">
                            <p>Tagihan: Rp {parseFloat(tagihan.totalTagihan).toLocaleString('id-ID')}</p>
                            <p>Tempo: {tagihan.tempo.tanggal}/{tagihan.tempo.bulan}/{tagihan.tempo.tahun}</p>
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(tagihan.status)}`}>
                              {tagihan.status}
                            </span>
                            <div className="mt-2">
                              <select
                                value={tagihan.status}
                                onChange={(e) => handleUpdateTagihanStatus(pinjam.id, detailId, e.target.value)}
                                className="block w-full py-1 px-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                              >
                                <option value="belum bayar">Belum Bayar</option>
                                <option value="sudah bayar">Sudah Bayar</option>
                              </select>
                            </div>
                          </div>
                        ))}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => handleDeletePinjaman(pinjam.id)}
                          className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md shadow-sm transition duration-150 ease-in-out"
                        >
                          Hapus Data Ini
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

      {/* User Modal (Add/Edit) */}
      {showUserModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto p-4">
          <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-4 text-gray-800">{currentUserData ? 'Edit Pengguna' : 'Tambah Pengguna Baru'}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="userName" className="block text-sm font-medium text-gray-700">Nama Pengguna</label>
                <input type="text" name="userName" id="userName" value={newUserData.userName} onChange={handleUserChange} required
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm" />
              </div>
              <div>
                <label htmlFor="fullName" className="block text-sm font-medium text-gray-700">Nama Lengkap</label>
                <input type="text" name="fullName" id="fullName" value={newUserData.fullName} onChange={handleUserChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm" />
              </div>
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">Kata Sandi</label>
                <input type="password" name="password" id="password" value={newUserData.password} onChange={handleUserChange} required
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm" />
              </div>
              <div>
                <label htmlFor="role" className="block text-sm font-medium text-gray-700">Role</label>
                <select name="role" id="role" value={newUserData.role} onChange={handleUserChange} required
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm">
                  <option value="user">User</option>
                  <option value="teller">Teller</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              {/* Detail fields if role is user or teller */}
              {(newUserData.role === 'user' || newUserData.role === 'teller') && (
                <>
                  <div className="col-span-full mt-4">
                    <h3 className="text-lg font-semibold text-gray-800">Detail Personal</h3>
                  </div>
                  <div>
                    <label htmlFor="nik" className="block text-sm font-medium text-gray-700">NIK</label>
                    <input type="text" name="detail.nik" id="nik" value={newUserData.detail.nik} onChange={handleUserChange}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm" />
                  </div>
                  <div>
                    <label htmlFor="nkk" className="block text-sm font-medium text-gray-700">NKK</label>
                    <input type="text" name="detail.nkk" id="nkk" value={newUserData.detail.nkk} onChange={handleUserChange}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm" />
                  </div>
                  <div>
                    <label htmlFor="gender" className="block text-sm font-medium text-gray-700">Gender</label>
                    <select name="detail.gender" id="gender" value={newUserData.detail.gender} onChange={handleUserChange}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm">
                      <option value="laki-laki">Laki-laki</option>
                      <option value="perempuan">Perempuan</option>
                      <option value="other">Lainnya</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Tanggal Lahir</label>
                    <div className="flex space-x-2 mt-1">
                      <input type="text" name="detail.hari" placeholder="Hari" value={newUserData.detail.hari} onChange={handleUserChange} className="w-1/3 px-3 py-2 border border-gray-300 rounded-md shadow-sm" />
                      <input type="text" name="detail.tanggal" placeholder="Tanggal" value={newUserData.detail.tanggal} onChange={handleUserChange} className="w-1/3 px-3 py-2 border border-gray-300 rounded-md shadow-sm" />
                      <input type="text" name="detail.bulan" placeholder="Bulan" value={newUserData.detail.bulan} onChange={handleUserChange} className="w-1/3 px-3 py-2 border border-gray-300 rounded-md shadow-sm" />
                      <input type="text" name="detail.tahun" placeholder="Tahun" value={newUserData.detail.tahun} onChange={handleUserChange} className="w-1/3 px-3 py-2 border border-gray-300 rounded-md shadow-sm" />
                    </div>
                  </div>
                  <div>
                    <label htmlFor="provinsi" className="block text-sm font-medium text-gray-700">Provinsi</label>
                    <input type="text" name="detail.provinsi" id="provinsi" value={newUserData.detail.provinsi} onChange={handleUserChange}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm" />
                  </div>
                  <div>
                    <label htmlFor="kota" className="block text-sm font-medium text-gray-700">Kota/Kabupaten</label>
                    <input type="text" name="detail.kota" id="kota" value={newUserData.detail.kota} onChange={handleUserChange}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm" />
                  </div>
                  <div>
                    <label htmlFor="kecamatan" className="block text-sm font-medium text-gray-700">Kecamatan</label>
                    <input type="text" name="detail.kecamatan" id="kecamatan" value={newUserData.detail.kecamatan} onChange={handleUserChange}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm" />
                  </div>
                  <div>
                    <label htmlFor="desa" className="block text-sm font-medium text-gray-700">Desa</label>
                    <input type="text" name="detail.desa" id="desa" value={newUserData.detail.desa} onChange={handleUserChange}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm" />
                  </div>
                  <div>
                    <label htmlFor="rw" className="block text-sm font-medium text-gray-700">RW</label>
                    <input type="text" name="detail.rw" id="rw" value={newUserData.detail.rw} onChange={handleUserChange}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm" />
                  </div>
                  <div>
                    <label htmlFor="rt" className="block text-sm font-medium text-gray-700">RT</label>
                    <input type="text" name="detail.rt" id="rt" value={newUserData.detail.rt} onChange={handleUserChange}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm" />
                  </div>
                </>
              )}

              {/* Anggota fields if role is user */}
              {newUserData.role === 'user' && (
                <>
                  <div className="col-span-full mt-4">
                    <h3 className="text-lg font-semibold text-gray-800">Detail Anggota</h3>
                  </div>
                  <div>
                    <label htmlFor="pekerjaan" className="block text-sm font-medium text-gray-700">Pekerjaan</label>
                    <input type="text" name="detail.anggota.pekerjaan" id="pekerjaan" value={newUserData.detail.anggota.pekerjaan} onChange={handleUserChange}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm" />
                  </div>
                  <div>
                    <label htmlFor="pendapatan" className="block text-sm font-medium text-gray-700">Pendapatan/Bulan</label>
                    <input type="number" name="detail.anggota.pendapatan" id="pendapatan" value={newUserData.detail.anggota.pendapatan} onChange={handleUserChange}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm" />
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
    </ProtectedLayout>
  );
}

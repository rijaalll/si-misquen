// ADMIN PAGE CLIENT COMPONENT

"use client";

import { useEffect, useState, useCallback } from 'react';
import ProtectedLayout from '../../controller/role.controller';
import { database } from '@/utils/firebaseConfig';
import { ref, onValue, set, remove, push, update } from 'firebase/database';
import { v4 as uuidv4 } from 'uuid';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  XMarkIcon,
  InformationCircleIcon,
  EyeIcon,
  BanknotesIcon,
  CreditCardIcon,
  ArrowDownTrayIcon,
  ArrowUpTrayIcon,
  CalendarDaysIcon,
  CheckIcon,
  ClockIcon
} from '@heroicons/react/24/outline';

export default function AdminView() {
  const [users, setUsers] = useState([]);
  const [simpananData, setSimpananData] = useState([]);
  const [pinjamanData, setPinjamanData] = useState([]);
  const [bungaTenorData, setBungaTenorData] = useState([]);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');

  // User Management States
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

  // States for Wilayah.id API data
  const [provinces, setProvinces] = useState([]);
  const [regencies, setRegencies] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [villages, setVillages] = useState([]);

  // States to control selected values in dropdowns (for fetching children)
  const [selectedProvinceCode, setSelectedProvinceCode] = useState('');
  const [selectedRegencyCode, setSelectedRegencyCode] = useState('');
  const [selectedDistrictCode, setSelectedDistrictCode] = useState('');

  // Bunga Tenor Management States
  const [showBungaTenorModal, setShowBungaTenorModal] = useState(false);
  const [currentBungaTenorData, setCurrentBungaTenorData] = useState(null);
  const [newBungaTenor, setNewBungaTenor] = useState({
    bulan: '',
    bunga: ''
  });

  // Simpanan Detail Modal States
  const [showSimpananDetailModal, setShowSimpananDetailModal] = useState(false);
  const [selectedSimpananToView, setSelectedSimpananToView] = useState(null);
  const [simpananDetailNominal, setSimpananDetailNominal] = useState('');

  // Pinjaman Detail Modal States
  const [showPinjamanDetailModal, setShowPinjamanDetailModal] = useState(false);
  const [selectedPinjamanToView, setSelectedPinjamanToView] = useState(null);

  // Generic Confirmation Modal States
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmMessage, setConfirmMessage] = useState('');
  const [onConfirmAction, setOnConfirmAction] = useState(() => () => {});

  // Base URL for Wilayah.id API with AllOrigins CORS proxy
  const WILAYAH_API_PROXY_URL = 'https://api.allorigins.win/raw?url=https://wilayah.id/api/';


  // Fetch all necessary data from Firebase
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
    // FIX: Changed 'loansRef' to 'pinjamanRef'
    const unsubscribePinjaman = onValue(pinjamanRef, (snapshot) => { 
      const data = snapshot.val();
      const pinjamanList = [];
      for (const id in data) {
        pinjamanList.push({ id, ...data[id] });
      }
      setPinjamanData(pinjamanList);
    });

    const bungaRef = ref(database, `koperasi/bunga`);
    const unsubscribeBunga = onValue(bungaRef, (snapshot) => {
        const data = snapshot.val();
        const bungaTenorList = [];
        for (const id in data) {
            bungaTenorList.push({ id, ...data[id] });
        }
        setBungaTenorData(bungaTenorList);
    });

    return () => {
      unsubscribeUsers();
      unsubscribeSimpanan();
      unsubscribePinjaman();
      unsubscribeBunga();
    };
  }, []);

  // Fetch Provinces when user modal is open
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

  // Fetch Regencies based on selected Province
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

  // Fetch Districts based on selected Regency
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

  // Fetch Villages based on selected District
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


  // Function to display transient messages
  const showMessage = (msg, type) => {
    setMessage(msg);
    setMessageType(type);
    setTimeout(() => {
      setMessage('');
      setMessageType('');
    }, 3000);
  };

  // --- Generic Confirmation Modal Logic ---
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
      password: user.password || '',
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
      showMessage('Username, password, dan role harus diisi.', 'error');
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
  }, [provinces, regencies, districts, villages]);


  // --- Simpanan Management ---
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

  // --- Pinjaman Management ---
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

  // --- Bunga Tenor Management ---
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


  // --- Helper Functions ---
  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'disetujui': return 'bg-green-100 text-green-800';
      case 'ditolak': return 'bg-red-100 text-red-800';
      case 'sudah bayar': return 'bg-blue-100 text-blue-800';
      case 'belum bayar': return 'bg-orange-100 text-orange-800';
      case 'user': return 'bg-blue-100 text-blue-800';
      case 'teller': return 'bg-purple-100 text-purple-800';
      case 'admin': return 'bg-emerald-100 text-emerald-800';
      case 'simpan': return 'bg-emerald-100 text-emerald-800';
      case 'tarik': return 'bg-purple-100 text-purple-800';
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

        <h2 className="text-3xl font-bold text-gray-800 mb-6">Panel Admin Koperasi</h2>

        {/* User Management */}
        <div className="bg-white p-6 rounded-lg shadow-md mb-8 border border-gray-100">
          <h3 className="text-2xl font-semibold text-gray-800 mb-4 flex justify-between items-center">
            Manajemen Pengguna
            <button
              onClick={handleAddUser}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md shadow-sm transition duration-150 ease-in-out"
            >
              <PlusIcon className="w-5 h-5 inline-block mr-1" /> Tambah Pengguna
            </button>
          </h3>
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
                          className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded-md shadow-sm mr-2 transition duration-150 ease-in-out"
                        >
                          <PencilIcon className="w-4 h-4 inline-block" /> Edit
                        </button>
                        <button
                          onClick={() => handleDeleteUser(user.id)}
                          className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-md shadow-sm transition duration-150 ease-in-out"
                        >
                          <TrashIcon className="w-4 h-4 inline-block" /> Hapus
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Bunga & Tenor Management */}
        <div className="bg-white p-6 rounded-lg shadow-md mb-8 border border-gray-100">
          <h3 className="text-2xl font-semibold text-gray-800 mb-4 flex justify-between items-center">
            Manajemen Bunga & Tenor
            <button
              onClick={handleAddBungaTenor}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md shadow-sm transition duration-150 ease-in-out"
            >
              <PlusIcon className="w-5 h-5 inline-block mr-1" /> Tambah Bunga/Tenor
            </button>
          </h3>
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
                          className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded-md shadow-sm mr-2 transition duration-150 ease-in-out"
                        >
                          <PencilIcon className="w-4 h-4 inline-block" /> Edit
                        </button>
                        <button
                          onClick={() => handleDeleteBungaTenor(data.id)}
                          className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-md shadow-sm transition duration-150 ease-in-out"
                        >
                          <TrashIcon className="w-4 h-4 inline-block" /> Hapus
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
        <div className="bg-white p-6 rounded-lg shadow-md mb-8 border border-gray-100">
          <h3 className="text-2xl font-semibold text-gray-800 mb-4">Manajemen Simpanan</h3>
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
                          className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded-md shadow-sm mr-2 transition duration-150 ease-in-out"
                        >
                          <EyeIcon className="w-4 h-4 inline-block" /> Lihat Detail
                        </button>
                        <button
                          onClick={() => handleDeleteSimpanan(simpanan.id)}
                          className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-md shadow-sm transition duration-150 ease-in-out"
                        >
                          <TrashIcon className="w-4 h-4 inline-block" /> Hapus Data Ini
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
        <div className="bg-white p-6 rounded-lg shadow-md mb-8 border border-gray-100">
          <h3 className="text-2xl font-semibold text-gray-800 mb-4">Manajemen Pinjaman</h3>
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
                          className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded-md shadow-sm mr-2 transition duration-150 ease-in-out"
                        >
                          <EyeIcon className="w-4 h-4 inline-block" /> Lihat Detail
                        </button>
                        <button
                          onClick={() => handleDeletePinjaman(pinjam.id)}
                          className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-md shadow-sm transition duration-150 ease-in-out"
                        >
                          <TrashIcon className="w-4 h-4 inline-block" /> Hapus Data Ini
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

              {/* Detail fields if role is user or teller */}
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
                  
                  {/* Wilayah.id API Integration */}
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

              {/* Anggota fields if role is user */}
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

      {/* Bunga & Tenor Modal (Add/Edit) */}
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

      {/* Simpanan Detail Modal */}
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

              {/* Add Simpanan/Tarik input within modal */}
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

      {/* Pinjaman Detail Modal */}
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

      {/* Generic Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-sm">
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <InformationCircleIcon className="w-6 h-6 text-blue-500" />
                <h2 className="text-xl font-bold text-gray-800">Konfirmasi</h2>
              </div>
            </div>
            <div className="p-6">
              <p className="text-gray-700 mb-6">{confirmMessage}</p>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={handleCancelConfirm}
                  className="px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400 transition duration-150 ease-in-out"
                >
                  Batal
                </button>
                <button
                  onClick={handleConfirm}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition duration-150 ease-in-out"
                >
                  Konfirmasi
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </ProtectedLayout>
  );
}
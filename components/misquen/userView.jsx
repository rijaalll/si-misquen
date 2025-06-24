// USER PAGE CLIENT COMPONENT

"use client";

import { useEffect, useState, useRef } from 'react';
import ProtectedLayout from '@/controller/role.controller';
import { useAuth } from '@/context/AuthContext';
import { database } from '@/utils/firebaseConfig';
import { ref, onValue, set, push, update } from 'firebase/database';
import { v4 as uuidv4 } from 'uuid';
import {
  PlusIcon,
  MinusIcon,
  CreditCardIcon,
  BanknotesIcon,
  ClockIcon,
  EyeIcon,
  XMarkIcon,
  ArrowDownTrayIcon,
  ArrowUpTrayIcon,
  DocumentTextIcon,
  CalendarDaysIcon,
  CheckIcon,
  BellAlertIcon
} from '@heroicons/react/24/outline';

export default function UserView() {
  const { currentUser } = useAuth();
  const [saldoSimpanan, setSaldoSimpanan] = useState(0);
  const [riwayatTransaksi, setRiwayatTransaksi] = useState([]);
  const [riwayatPinjaman, setRiwayatPinjaman] = useState([]); // This state is used for rendering "Tagihan Pinjaman"

  const [showSimpanModal, setShowSimpanModal] = useState(false);
  const [showTarikModal, setShowTarikModal] = useState(false);
  const [nominalSimpan, setNominalSimpan] = useState('');
  const [nominalTarik, setNominalTarik] = useState('');
  const [showPinjamModal, setShowPinjamModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showWithdrawWarningModal, setShowWithdrawWarningModal] = useState(false);
  const [selectedPinjaman, setSelectedPinjaman] = useState(null);
  const [jumlahPinjaman, setJumlahPinjaman] = useState('');
  const [availableBungaTenor, setAvailableBungaTenor] = useState([]);
  const [selectedBungaId, setSelectedBungaId] = useState('');
  const [calculatedMonthlyInstallment, setCalculatedMonthlyInstallment] = useState(0);
  
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [hasUnpaidLoans, setHasUnpaidLoans] = useState(false);

  // Notification States
  const [notifications, setNotifications] = useState([]);
  const nextNotificationId = useRef(0);
  const notificationTimeoutIds = useRef({});
  const previousLoanStatuses = useRef({});
  const notifiedInstallments = useRef(new Set());

  // Helper to add a new notification
  const addNotification = (message, type = 'info', duration = 5000) => {
    const id = nextNotificationId.current++;
    setNotifications(prev => [...prev, { id, message, type }]);

    // Auto-dismiss after duration
    const timeoutId = setTimeout(() => {
      removeNotification(id);
    }, duration);
    notificationTimeoutIds.current[id] = timeoutId;
  };

  // Helper to remove a notification
  const removeNotification = (id) => {
    setNotifications(prev => prev.filter(notif => notif.id !== id));
    clearTimeout(notificationTimeoutIds.current[id]);
    delete notificationTimeoutIds.current[id];
  };


  // Fetch savings and loan history
  useEffect(() => {
    if (currentUser) {
      // Log the current user ID for debugging
      console.log("Current User ID:", currentUser.uid);

      const simpananRef = ref(database, `koperasi/data/transaksi/simpan`);
      const unsubscribeSimpanan = onValue(simpananRef, (snapshot) => {
        const data = snapshot.val();
        let currentSaldo = 0;
        let transaksiList = [];
        for (const simpanId in data) {
          const simpanData = data[simpanId];
          if (simpanData.userId === currentUser.uid) {
            currentSaldo = simpanData.total;
            for (const detailId in simpanData.detail) {
              transaksiList.push({ id: detailId, ...simpanData.detail[detailId] });
            }
            break;
          }
        }
        setSaldoSimpanan(currentSaldo);
        setRiwayatTransaksi(transaksiList.sort((a, b) => {
            const dateA = new Date(a.detail.tahun, a.detail.bulan - 1, a.detail.tanggal, a.detail.jam.split(':')[0], a.detail.jam.split(':')[1]);
            const dateB = new Date(b.detail.tahun, b.detail.bulan - 1, b.detail.tanggal, b.detail.jam.split(':')[0], b.detail.jam.split(':')[1]);
            return dateB - dateA;
        }));
      });

      const loansRef = ref(database, `koperasi/data/transaksi/pinjam`);
      const unsubscribeLoans = onValue(loansRef, (snapshot) => {
        const data = snapshot.val();
        let pinjamanList = [];
        let anyUnpaid = false;
        const currentLoanStatuses = {};
        const today = new Date();
        const currentMonth = today.getMonth();
        const currentYear = today.getFullYear();
        const nextMonth = (currentMonth + 1) % 12;
        const nextMonthYear = currentMonth === 11 ? currentYear + 1 : currentYear;

        for (const id in data) {
          const loan = { id, ...data[id] };
          if (loan.userId === currentUser.uid) {
            pinjamanList.push(loan);
            currentLoanStatuses[loan.id] = loan.status;

            // --- Loan Status Change Notifications ---
            const prevStatus = previousLoanStatuses.current[loan.id];
            if (loan.status === 'pending' && (!prevStatus || prevStatus !== 'pending')) {
                addNotification('Pengajuan pinjaman Anda telah dibuat dan menunggu persetujuan.', 'info');
            } else if (loan.status === 'disetujui' && prevStatus !== 'disetujui') {
                addNotification('Selamat! Pinjaman Anda telah disetujui.', 'success');
            } else if (loan.status === 'ditolak' && prevStatus !== 'ditolak') {
                addNotification('Maaf, pengajuan pinjaman Anda ditolak.', 'error');
            }

            // --- Unpaid Loan Installment Notifications ---
            if (loan.status === 'disetujui' && loan.detail) {
                for (const detailId in loan.detail) {
                    const tagihan = loan.detail[detailId];
                    if (tagihan.status === 'belum bayar') {
                        anyUnpaid = true;

                        const tempoDate = new Date(tagihan.tempo.tahun, tagihan.tempo.bulan - 1, tagihan.tempo.tanggal);
                        const notificationKey = `${loan.id}-${detailId}`;

                        const isDueThisMonth = (tempoDate.getFullYear() === currentYear && tempoDate.getMonth() === currentMonth);
                        const isDueNextMonth = (tempoDate.getFullYear() === nextMonthYear && tempoDate.getMonth() === nextMonth);

                        if ((isDueThisMonth || isDueNextMonth) && !notifiedInstallments.current.has(notificationKey)) {
                            let notificationMessage = '';
                            if (isDueThisMonth) {
                                notificationMessage = `Peringatan: Tagihan pinjaman Anda (Rp ${parseFloat(tagihan.totalTagihan).toLocaleString('id-ID')}) jatuh tempo di bulan ini.`;
                            } else {
                                notificationMessage = `Pemberitahuan: Tagihan pinjaman Anda (Rp ${parseFloat(tagihan.totalTagihan).toLocaleString('id-ID')}) akan jatuh tempo bulan depan.`;
                            }
                            addNotification(notificationMessage, 'warning', 10000);
                            notifiedInstallments.current.add(notificationKey);
                        }
                    }
                }
            }
          }
        }
        // Removed setAllLoans as it's not declared and riwayatPinjaman serves the purpose
        setRiwayatPinjaman(pinjamanList); // This state is used for rendering "Tagihan Pinjaman"
        setHasUnpaidLoans(anyUnpaid);
        previousLoanStatuses.current = currentLoanStatuses;
        // Log the list of loans for the current user (which populates riwayatPinjaman)
        console.log("Fetched loans for current user:", pinjamanList);
      });

      return () => {
        unsubscribeSimpanan();
        unsubscribeLoans();
        Object.values(notificationTimeoutIds.current).forEach(clearTimeout);
      };
    }
  }, [currentUser]);

  // Fetch bunga/tenor data from database
  useEffect(() => {
    const bungaRef = ref(database, `koperasi/bunga`);
    const unsubscribeBunga = onValue(bungaRef, (snapshot) => {
        const data = snapshot.val();
        const bungaTenorList = [];
        for (const id in data) {
            bungaTenorList.push({ id, ...data[id] });
        }
        setAvailableBungaTenor(bungaTenorList);
        if (bungaTenorList.length > 0 && !selectedBungaId) {
            setSelectedBungaId(bungaTenorList[0].id);
        }
    });

    return () => unsubscribeBunga();
  }, [selectedBungaId]);

  // Calculate monthly installment whenever loan amount or selected bunga/tenor changes
  useEffect(() => {
    if (jumlahPinjaman && selectedBungaId) {
      const selectedBunga = availableBungaTenor.find(b => b.id === selectedBungaId);
      if (selectedBunga) {
        const totalPinjaman = parseFloat(jumlahPinjaman);
        const tenor = parseInt(selectedBunga.tenor.bulan);
        const bunga = parseFloat(selectedBunga.tenor.bunga);

        if (tenor === 0) {
          setCalculatedMonthlyInstallment(0);
          return;
        }

        const totalBunga = totalPinjaman * (bunga / 100) * tenor;
        const totalTagihanKeseluruhan = totalPinjaman + totalBunga;
        const totalTagihanPerBulan = totalTagihanKeseluruhan / tenor;
        setCalculatedMonthlyInstallment(totalTagihanPerBulan);
      } else {
        setCalculatedMonthlyInstallment(0);
      }
    } else {
      setCalculatedMonthlyInstallment(0);
    }
  }, [jumlahPinjaman, selectedBungaId, availableBungaTenor]);

  // Function to show transient message alerts (for form submissions)
  const showMessage = (msg, type) => {
    setMessage(msg);
    setMessageType(type);
    setTimeout(() => {
      setMessage('');
      setMessageType('');
    }, 3000);
  };

  // Handle deposit operation
  const handleSimpan = async () => {
    if (!nominalSimpan || isNaN(nominalSimpan) || parseFloat(nominalSimpan) <= 0) {
      showMessage('Nominal simpan tidak valid.', 'error');
      return;
    }

    const nominal = parseFloat(nominalSimpan);
    const now = new Date();
    const tanggal = now.getDate();
    const bulan = now.getMonth() + 1;
    const tahun = now.getFullYear();
    const jam = `${now.getHours()}:${now.getMinutes()}`;

    try {
      const userSimpananRef = ref(database, `koperasi/data/transaksi/simpan`);
      let userSimpananId = null;
      let currentTotalSimpanan = 0;

      const snapshot = await new Promise((resolve) => {
        onValue(userSimpananRef, resolve, { onlyOnce: true });
      });

      const data = snapshot.val();
      for (const id in data) {
        if (data[id].userId === currentUser.uid) {
          userSimpananId = id;
          currentTotalSimpanan = data[id].total;
          break;
        }
      }

      const newDetailId = uuidv4();
      const newDetailEntry = {
        status: 'simpan',
        nominal: nominal,
        detail: { tanggal, bulan, tahun, jam }
      };

      if (userSimpananId) {
        await update(ref(database, `koperasi/data/transaksi/simpan/${userSimpananId}`), {
          total: currentTotalSimpanan + nominal,
        });
        await set(ref(database, `koperasi/data/transaksi/simpan/${userSimpananId}/detail/${newDetailId}`), newDetailEntry);
      } else {
        userSimpananId = uuidv4();
        await set(ref(database, `koperasi/data/transaksi/simpan/${userSimpananId}`), {
          userId: currentUser.uid,
          total: nominal,
          detail: {
            [newDetailId]: newDetailEntry
          }
        });
      }

      showMessage('Simpanan berhasil ditambahkan!', 'success');
      setNominalSimpan('');
      setShowSimpanModal(false);
    } catch (error) {
      console.error("Error during saving:", error);
      showMessage(`Gagal menyimpan: ${error.message}`, 'error');
    }
  };

  // Handle withdrawal operation
  const handleTarik = async () => {
    if (!nominalTarik || isNaN(nominalTarik) || parseFloat(nominalTarik) <= 0) {
      showMessage('Nominal tarik tidak valid.', 'error');
      return;
    }

    const nominal = parseFloat(nominalTarik);
    
    if (nominal > saldoSimpanan) {
      setShowTarikModal(false);
      setShowWithdrawWarningModal(true);
      return;
    }

    const now = new Date();
    const tanggal = now.getDate();
    const bulan = now.getMonth() + 1;
    const tahun = now.getFullYear();
    const jam = `${now.getHours()}:${now.getMinutes()}`;

    try {
      const userSimpananRef = ref(database, `koperasi/data/transaksi/simpan`);
      let userSimpananId = null;
      let currentTotalSimpanan = 0;

      const snapshot = await new Promise((resolve) => {
        onValue(userSimpananRef, resolve, { onlyOnce: true });
      });

      const data = snapshot.val();
      for (const id in data) {
        if (data[id].userId === currentUser.uid) {
          userSimpananId = id;
          currentTotalSimpanan = data[id].total;
          break;
        }
      }

      const newDetailId = uuidv4();
      const newDetailEntry = {
        status: 'tarik',
        nominal: nominal,
        detail: { tanggal, bulan, tahun, jam }
      };

      if (userSimpananId) {
        await update(ref(database, `koperasi/data/transaksi/simpan/${userSimpananId}`), {
          total: currentTotalSimpanan - nominal,
        });
        await set(ref(database, `koperasi/data/transaksi/simpan/${userSimpananId}/detail/${newDetailId}`), newDetailEntry);
      }

      showMessage('Penarikan berhasil dilakukan!', 'success');
      setNominalTarik('');
      setShowTarikModal(false);
    } catch (error) {
      console.error("Error during withdrawal:", error);
      showMessage(`Gagal melakukan penarikan: ${error.message}`, 'error');
    }
  };

  // Handle loan application
  const handleAjukanPinjaman = async () => {
    if (hasUnpaidLoans) {
        showMessage('Anda tidak dapat mengajukan pinjaman baru karena ada tagihan pinjaman yang belum lunas.', 'error');
        return;
    }

    if (!jumlahPinjaman || isNaN(jumlahPinjaman) || parseFloat(jumlahPinjaman) <= 0 || !selectedBungaId) {
      showMessage('Data pinjaman tidak valid. Pastikan jumlah pinjaman dan tenor/bunga dipilih.', 'error');
      return;
    }

    const selectedBunga = availableBungaTenor.find(b => b.id === selectedBungaId);
    if (!selectedBunga) {
        showMessage('Pilihan tenor/bunga tidak valid.', 'error');
        return;
    }

    const totalPinjaman = parseFloat(jumlahPinjaman);
    const tenor = parseInt(selectedBunga.tenor.bulan);
    const bunga = parseFloat(selectedBunga.tenor.bunga);

    const totalBunga = totalPinjaman * (bunga / 100) * tenor;
    const totalTagihanKeseluruhan = totalPinjaman + totalBunga;
    const totalTagihanPerBulan = tenor > 0 ? totalTagihanKeseluruhan / tenor : 0;

    const detailTagihan = {};
    const now = new Date();
    for (let i = 0; i < tenor; i++) {
      const tempoDate = new Date(now.getFullYear(), now.getMonth() + i + 1, now.getDate());
      detailTagihan[uuidv4()] = {
        status: 'belum bayar',
        totalTagihan: totalTagihanPerBulan.toFixed(2),
        tempo: {
          tanggal: tempoDate.getDate(),
          bulan: tempoDate.getMonth() + 1,
          tahun: tempoDate.getFullYear()
        }
      };
    }

    try {
      await push(ref(database, 'koperasi/data/transaksi/pinjam'), {
        userId: currentUser.uid,
        total: totalPinjaman,
        status: 'pending',
        tenor: {
          bulan: tenor,
          bunga: bunga
        },
        detail: detailTagihan
      });
      showMessage('Pengajuan pinjaman berhasil diajukan! Menunggu persetujuan teller.', 'success');
      setJumlahPinjaman('');
      setSelectedBungaId('');
      setShowPinjamModal(false);
    } catch (error) {
      console.error("Error during loan application:", error);
      showMessage(`Gagal mengajukan pinjaman: ${error.message}`, 'error');
    }
  };

  // Open loan detail modal
  const openDetailModal = (pinjaman) => {
    setSelectedPinjaman(pinjaman);
    setShowDetailModal(true);
  };

  // Get CSS class for status badges
  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'disetujui': return 'bg-green-100 text-green-800 border-green-200';
      case 'ditolak': return 'bg-red-100 text-red-800 border-red-200';
      case 'sudah bayar': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'belum bayar': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'simpan': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'tarik': return 'bg-purple-100 text-purple-800 border-purple-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Get CSS class for loan installment text color (red if unpaid and due this month)
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

  // Format date for display
  const formatDate = (tanggal, bulan, tahun) => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    return `${tanggal} ${months[bulan - 1]} ${tahun}`;
  };

  return (
    <ProtectedLayout allowedRoles={['user']}>
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Dashboard Anggota</h1>
            <p className="text-gray-600">Kelola simpanan dan pinjaman Anda dengan mudah</p>
          </div>

          {/* Message Alert (for form submissions) */}
          {message && (
            <div className={`mb-6 p-4 rounded-xl border ${messageType === 'success' 
              ? 'bg-green-50 border-green-200 text-green-800' 
              : 'bg-red-50 border-red-200 text-red-800'
            }`}>
              <div className="flex items-center">
                <div className={`w-2 h-2 rounded-full mr-3 ${messageType === 'success' ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <span className="font-medium">{message}</span>
              </div>
            </div>
          )}

          {/* Global Notifications - Positioned at bottom center, responsive width */}
          <div className="fixed bottom-4 left-1/2 -translate-x-1/2 md:right-4 md:left-auto md:-translate-x-0 z-50 flex flex-col items-end space-y-3 md:max-w-xs lg:max-w-sm w-full px-4">
            {notifications.map(notif => (
              <div
                key={notif.id}
                className={`p-4 rounded-lg shadow-lg flex items-center justify-between gap-4 transition-all duration-300 ease-out transform w-full
                  ${notif.type === 'success' ? 'bg-emerald-500 text-white' : ''}
                  ${notif.type === 'error' ? 'bg-red-500 text-white' : ''}
                  ${notif.type === 'info' ? 'bg-blue-500 text-white' : ''}
                  ${notif.type === 'warning' ? 'bg-orange-500 text-white' : ''}
                `}
              >
                <div className="flex items-center">
                  <BellAlertIcon className="w-5 h-5 mr-2" />
                  <span className="font-semibold text-sm">{notif.message}</span>
                </div>
                <button onClick={() => removeNotification(notif.id)} className="ml-4 text-white opacity-75 hover:opacity-100">
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </div>
            ))}
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {/* Saldo Simpanan Card */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-emerald-100 rounded-xl">
                    <BanknotesIcon className="w-6 h-6 text-emerald-600" />
                  </div>
                  <span className="text-sm font-medium text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full">
                    Aktif
                  </span>
                </div>
                <h3 className="text-lg font-semibold text-gray-700 mb-2">Saldo Simpanan</h3>
                <p className="text-3xl font-bold text-emerald-600 mb-4">
                  Rp {saldoSimpanan.toLocaleString('id-ID')}
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowSimpanModal(true)}
                    className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-xl font-medium transition-all duration-200 flex items-center justify-center gap-2"
                  >
                    <ArrowUpTrayIcon className="w-4 h-4" />
                    Simpan
                  </button>
                  <button
                    onClick={() => setShowTarikModal(true)}
                    className="flex-1 bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-xl font-medium transition-all duration-200 flex items-center justify-center gap-2"
                  >
                    <ArrowDownTrayIcon className="w-4 h-4" />
                    Tarik
                  </button>
                </div>
              </div>
            </div>

            {/* Pinjaman Card */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-blue-100 rounded-xl">
                    <CreditCardIcon className="w-6 h-6 text-blue-600" />
                  </div>
                  <span className="text-sm font-medium text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
                    Tersedia
                  </span>
                </div>
                <h3 className="text-lg font-semibold text-gray-700 mb-2">Pinjaman</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Ajukan pinjaman dengan bunga kompetitif
                </p>
                <button
                  onClick={() => setShowPinjamModal(true)}
                  className={`w-full px-4 py-2 rounded-xl font-medium transition-all duration-200 flex items-center justify-center gap-2 
                    ${hasUnpaidLoans || availableBungaTenor.length === 0
                      ? 'bg-gray-300 text-gray-600 cursor-not-allowed' 
                      : 'bg-blue-500 hover:bg-blue-600 text-white'
                    }`}
                  disabled={hasUnpaidLoans || availableBungaTenor.length === 0}
                >
                  <PlusIcon className="w-4 h-4" />
                  Ajukan Pinjaman
                </button>
                {hasUnpaidLoans && (
                    <p className="text-red-500 text-xs mt-2 text-center">
                        Selesaikan tagihan pinjaman Anda yang belum lunas untuk mengajukan pinjaman baru.
                    </p>
                )}
                 {availableBungaTenor.length === 0 && !hasUnpaidLoans && (
                    <p className="text-orange-500 text-xs mt-2 text-center">
                        Data bunga dan tenor pinjaman belum tersedia. Silakan hubungi admin.
                    </p>
                )}
              </div>
            </div>

            {/* Quick Info Card */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-indigo-100 rounded-xl">
                    <DocumentTextIcon className="w-6 h-6 text-indigo-600" />
                  </div>
                  <span className="text-sm font-medium text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full">
                    Info
                  </span>
                </div>
                <h3 className="text-lg font-semibold text-gray-700 mb-2">Ringkasan</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Transaksi:</span>
                    <span className="font-medium text-gray-800">{riwayatTransaksi.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Pinjaman:</span>
                    <span className="font-medium text-gray-800">{riwayatPinjaman.length}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Content Tabs */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Riwayat Simpanan */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100">
              <div className="p-6 border-b border-gray-100">
                <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                  <BanknotesIcon className="w-5 h-5 text-emerald-600" />
                  Riwayat Simpanan
                </h3>
              </div>
              <div className="p-6">
                {riwayatTransaksi.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <BanknotesIcon className="w-8 h-8 text-gray-400" />
                    </div>
                    <p className="text-gray-500 text-sm">Belum ada riwayat transaksi simpanan</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {riwayatTransaksi.slice(0, 10).map((transaksi) => (
                      <div key={transaksi.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${transaksi.status === 'simpan' ? 'bg-emerald-100' : 'bg-purple-100'}`}>
                            {transaksi.status === 'simpan' ? (
                              <ArrowUpTrayIcon className={`w-4 h-4 ${transaksi.status === 'simpan' ? 'text-emerald-600' : 'text-purple-600'}`} />
                            ) : (
                              <ArrowDownTrayIcon className={`w-4 h-4 ${transaksi.status === 'simpan' ? 'text-emerald-600' : 'text-purple-600'}`} />
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">
                              {transaksi.status === 'simpan' ? '+' : '-'} Rp {transaksi.nominal.toLocaleString('id-ID')}
                            </p>
                            <p className="text-sm text-gray-500">
                              {formatDate(transaksi.detail.tanggal, transaksi.detail.bulan, transaksi.detail.tahun)} • {transaksi.detail.jam}
                            </p>
                          </div>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(transaksi.status)}`}>
                          {transaksi.status === 'simpan' ? 'Setor' : 'Tarik'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Tagihan Pinjaman */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100">
              <div className="p-6 border-b border-gray-100">
                <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                  <CreditCardIcon className="w-5 h-5 text-blue-600" />
                  Tagihan Pinjaman
                </h3>
              </div>
              <div className="p-6">
                {riwayatPinjaman.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <CreditCardIcon className="w-8 h-8 text-gray-400" />
                    </div>
                    <p className="text-gray-500 text-sm">Belum ada riwayat pinjaman</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {riwayatPinjaman.map((pinjam) => (
                      <div key={pinjam.id} className="p-4 bg-gray-50 rounded-xl">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <p className="font-semibold text-gray-900">
                              Rp {pinjam.total.toLocaleString('id-ID')}
                            </p>
                            <p className="text-sm text-gray-500">
                              {pinjam.tenor.bulan} bulan • {pinjam.tenor.bunga}% per bulan
                            </p>
                          </div>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(pinjam.status)}`}>
                            {pinjam.status.charAt(0).toUpperCase() + pinjam.status.slice(1)}
                          </span>
                        </div>
                        <button
                          onClick={() => openDetailModal(pinjam)}
                          className="w-full bg-blue-50 hover:bg-blue-100 text-blue-600 px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
                        >
                          <EyeIcon className="w-4 h-4" />
                          Lihat Detail
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Simpan Modal */}
      {showSimpanModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                  <ArrowUpTrayIcon className="w-5 h-5 text-emerald-600" />
                  Simpan Dana
                </h2>
                <button
                  onClick={() => setShowSimpanModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <XMarkIcon className="w-5 h-5 text-gray-500" />
                </button>
              </div>
            </div>
            <div className="p-6">
              <div className="mb-6">
                <label htmlFor="nominalSimpan" className="block text-sm font-medium text-gray-700 mb-2">
                  Nominal Simpanan
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">Rp</span>
                  <input
                    type="number"
                    id="nominalSimpan"
                    className="w-full pl-8 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-gray-50 focus:bg-white transition-all duration-200 text-gray-900"
                    placeholder="0"
                    value={nominalSimpan}
                    onChange={(e) => setNominalSimpan(e.target.value)}
                    min="1"
                  />
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowSimpanModal(false)}
                  className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
                >
                  Batal
                </button>
                <button
                  onClick={handleSimpan}
                  className="flex-1 px-4 py-3 bg-emerald-500 text-white rounded-xl font-medium hover:bg-emerald-600 transition-colors"
                >
                  Simpan
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tarik Modal */}
      {showTarikModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                  <ArrowDownTrayIcon className="w-5 h-5 text-purple-600" />
                  Tarik Dana
                </h2>
                <button
                  onClick={() => setShowTarikModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <XMarkIcon className="w-5 h-5 text-gray-500" />
                </button>
              </div>
            </div>
            <div className="p-6">
              <div className="mb-4 p-4 bg-purple-50 rounded-xl border border-purple-200">
                <p className="text-sm text-purple-700">
                  <span className="font-medium">Saldo Tersedia:</span> Rp {saldoSimpanan.toLocaleString('id-ID')}
                </p>
              </div>
              <div className="mb-6">
                <label htmlFor="nominalTarik" className="block text-sm font-medium text-gray-700 mb-2">
                  Nominal Penarikan
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">Rp</span>
                  <input
                    type="number"
                    id="nominalTarik"
                    className="w-full pl-8 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-gray-50 focus:bg-white transition-all duration-200 text-gray-900"
                    placeholder="0"
                    value={nominalTarik}
                    onChange={(e) => setNominalTarik(e.target.value)}
                    min="1"
                  />
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowTarikModal(false)}
                  className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
                >
                  Batal
                </button>
                <button
                  onClick={handleTarik}
                  className="flex-1 px-4 py-3 bg-purple-500 text-white rounded-xl font-medium hover:bg-purple-600 transition-colors"
                >
                  Tarik
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Pinjam Modal */}
      {showPinjamModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                  <CreditCardIcon className="w-5 h-5 text-blue-600" />
                  Ajukan Pinjaman
                </h2>
                <button
                  onClick={() => setShowPinjamModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <XMarkIcon className="w-5 h-5 text-gray-500" />
                </button>
              </div>
            </div>
            <div className="p-6">
              <div className="mb-4">
                <label htmlFor="jumlahPinjaman" className="block text-sm font-medium text-gray-700 mb-2">
                  Jumlah Pinjaman
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">Rp</span>
                  <input
                    type="number"
                    id="jumlahPinjaman"
                    className="w-full pl-8 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 focus:bg-white transition-all duration-200 text-gray-900"
                    placeholder="0"
                    value={jumlahPinjaman}
                    onChange={(e) => setJumlahPinjaman(e.target.value)}
                    min="1"
                  />
                </div>
              </div>
              <div className="mb-4">
                <label htmlFor="tenorBunga" className="block text-sm font-medium text-gray-700 mb-2">
                  Pilih Tenor dan Bunga
                </label>
                <select
                  id="tenorBunga"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 focus:bg-white transition-all duration-200 text-gray-900"
                  value={selectedBungaId}
                  onChange={(e) => setSelectedBungaId(e.target.value)}
                  disabled={availableBungaTenor.length === 0}
                >
                  {availableBungaTenor.length === 0 && <option value="">Loading...</option>}
                  {availableBungaTenor.map((bungaItem) => (
                    <option key={bungaItem.id} value={bungaItem.id}>
                      {bungaItem.tenor.bulan} Bulan ({bungaItem.tenor.bunga}% per bulan)
                    </option>
                  ))}
                </select>
                {availableBungaTenor.length === 0 && (
                    <p className="text-red-500 text-xs mt-2">
                        Tidak ada data bunga dan tenor tersedia.
                    </p>
                )}
              </div>
              
              {/* Display calculated monthly installment */}
              {calculatedMonthlyInstallment > 0 && (
                <div className="mb-6 p-4 bg-blue-50 rounded-xl border border-blue-200">
                  <p className="text-sm text-blue-700 flex items-center">
                    <BanknotesIcon className="w-4 h-4 mr-2" />
                    <span className="font-medium">Estimasi Tagihan Per Bulan:</span>{' '}
                    <span className="font-bold ml-1">Rp {calculatedMonthlyInstallment.toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </p>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => setShowPinjamModal(false)}
                  className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
                >
                  Batal
                </button>
                <button
                  onClick={handleAjukanPinjaman}
                  className="flex-1 px-4 py-3 bg-blue-500 text-white rounded-xl font-medium hover:bg-blue-600 transition-colors"
                  disabled={!jumlahPinjaman || !selectedBungaId || calculatedMonthlyInstallment <= 0 || hasUnpaidLoans}
                >
                  Ajukan
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Detail Pinjaman Modal */}
      {showDetailModal && selectedPinjaman && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                  <EyeIcon className="w-5 h-5 text-blue-600" />
                  Detail Pinjaman
                </h2>
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <XMarkIcon className="w-5 h-5 text-gray-500" />
                </button>
              </div>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-2 gap-4 text-sm mb-6">
                <div>
                  <p className="text-gray-500">Jumlah Pinjaman:</p>
                  <p className="font-medium text-gray-900">Rp {selectedPinjaman.total.toLocaleString('id-ID')}</p>
                </div>
                <div>
                  <p className="text-gray-500">Status:</p>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(selectedPinjaman.status)}`}>
                    {selectedPinjaman.status.charAt(0).toUpperCase() + selectedPinjaman.status.slice(1)}
                  </span>
                </div>
                <div>
                  <p className="text-gray-500">Tenor:</p>
                  <p className="font-medium text-gray-900">{selectedPinjaman.tenor.bulan} Bulan</p>
                </div>
                <div>
                  <p className="text-gray-500">Bunga Per Bulan:</p>
                  <p className="font-medium text-gray-900">{selectedPinjaman.tenor.bunga}%</p>
                </div>
              </div>

              <h3 className="text-lg font-semibold text-gray-800 mb-4">Detail Angsuran:</h3>
              <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
                {Object.entries(selectedPinjaman.detail || {}).sort(([, dataA], [, dataB]) => {
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
                  </div>
                ))}
              </div>
            </div>
            <div className="p-6 border-t border-gray-100 flex justify-end">
              <button
                onClick={() => setShowDetailModal(false)}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Withdraw Warning Modal */}
      {showWithdrawWarningModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm">
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-red-600 flex items-center gap-2">
                  <XMarkIcon className="w-5 h-5 text-red-600" />
                  Peringatan Penarikan
                </h2>
                <button
                  onClick={() => setShowWithdrawWarningModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <XMarkIcon className="w-5 h-5 text-gray-500" />
                </button>
              </div>
            </div>
            <div className="p-6">
              <p className="text-gray-700 mb-6">
                Nominal penarikan melebihi saldo simpanan Anda yang tersedia.
                <br />
                <span className="font-semibold">Saldo Tersedia:</span> Rp {saldoSimpanan.toLocaleString('id-ID')}
              </p>
              <div className="flex justify-end">
                <button
                  onClick={() => setShowWithdrawWarningModal(false)}
                  className="px-4 py-2 bg-red-500 text-white rounded-xl font-medium hover:bg-red-600 transition-colors"
                >
                  Oke
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </ProtectedLayout>
  );
}

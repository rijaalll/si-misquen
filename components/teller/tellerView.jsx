// TELLER PAGE CLIENT COMPONENT

"use client";

import { useEffect, useState } from 'react';
import ProtectedLayout from '../../controller/role.controller'; // Jalur impor diperbarui
import { database } from '../../utils/firebaseConfig'; // Jalur impor diperbarui
import { ref, onValue, update, get } from 'firebase/database';
import { v4 as uuidv4 } from 'uuid';
import {
  ClockIcon,
  CheckCircleIcon, // For approve loan (now used for paid installments)
  XCircleIcon, // For reject loan
  EyeIcon, // For detail view modal
  CreditCardIcon, // Icon for loan management
  BanknotesIcon, // Icon for payment confirmation
  InformationCircleIcon, // For generic confirmation modal
  XMarkIcon, // For closing modals
  CalendarDaysIcon, // For date in detail modals
  MagnifyingGlassIcon, // Icon for search input
  HomeIcon, // Icon for domicile information
  CheckIcon, // Used for success messages and paid status
  ExclamationTriangleIcon // Used for error messages and unpaid status
} from '@heroicons/react/24/outline'; // Importing necessary icons

export default function TellerView() {
  const [pendingLoans, setPendingLoans] = useState([]);
  const [allLoans, setAllLoans] = useState([]);
  // Stores user details for lookup {userId: {fullName, userName, detail: {nkk, provinsi, kota, kecamatan, desa, rw, rt}}}
  const [users, setUsers] = useState({});
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState(''); // 'success' or 'error'

  // State for search inputs
  const [searchTermPending, setSearchTermPending] = useState('');
  const [searchTermAllLoans, setSearchTermAllLoans] = useState('');

  // State for loan detail modal
  const [showLoanDetailModal, setShowLoanDetailModal] = useState(false);
  const [selectedLoanForDetail, setSelectedLoanForDetail] = useState(null);

  // Generic Confirmation Modal States (similar to admin view)
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmMessage, setConfirmMessage] = useState('');
  const [onConfirmAction, setOnConfirmAction] = useState(() => () => {});


  useEffect(() => {
    // Fetch users data to display full names and for search filtering
    const usersRef = ref(database, 'koperasi/user');
    const unsubscribeUsers = onValue(usersRef, (snapshot) => {
      const userData = snapshot.val();
      const usersMap = {};
      if (userData) {
        for (const uid in userData) {
          usersMap[uid] = {
            fullName: userData[uid].fullName || 'Tidak Diketahui',
            userName: userData[uid].userName || 'Tidak Diketahui',
            nkk: userData[uid].detail?.nkk || '',
            detail: userData[uid].detail || {} // Store full detail object for domicile
          };
        }
      }
      setUsers(usersMap);
    });

    // Fetch all loan data and separate into pending and all loans
    const loansRef = ref(database, 'koperasi/data/transaksi/pinjam');
    const unsubscribeLoans = onValue(loansRef, (snapshot) => {
      const data = snapshot.val();
      const allList = [];
      const pendingList = []; // New list for pending loans
      if (data) {
        for (const id in data) {
          const loan = { id, ...data[id] };
          allList.push(loan);
          if (loan.status === 'pending') { // Populate pending loans explicitly
            pendingList.push(loan);
          }
        }
      }
      setAllLoans(allList);
      setPendingLoans(pendingList); // Set pending loans
    });

    return () => {
      unsubscribeUsers();
      unsubscribeLoans();
    };
  }, []);

  // Filtered pending loans based on search term
  const filteredPendingLoans = pendingLoans.filter(loan => {
    const user = users[loan.userId] || {};
    const lowerCaseSearchTerm = searchTermPending.toLowerCase();
    return (
      (user.fullName && user.fullName.toLowerCase().includes(lowerCaseSearchTerm)) ||
      (user.userName && user.userName.toLowerCase().includes(lowerCaseSearchTerm)) ||
      (user.nkk && user.nkk.toLowerCase().includes(lowerCaseSearchTerm))
    );
  });

  // Filtered all loans based on search term
  const filteredAllLoans = allLoans.filter(loan => {
    const user = users[loan.userId] || {};
    const lowerCaseSearchTerm = searchTermAllLoans.toLowerCase();
    return (
      (user.fullName && user.fullName.toLowerCase().includes(lowerCaseSearchTerm)) ||
      (user.userName && user.userName.toLowerCase().includes(lowerCaseSearchTerm)) ||
      (user.nkk && user.nkk.toLowerCase().includes(lowerCaseSearchTerm))
    );
  });


  // Function to show transient message alerts
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
    setOnConfirmAction(() => action); // Use a functional update for setOnConfirmAction
    setShowConfirmModal(true);
  };

  const handleConfirm = () => {
    onConfirmAction();
    setShowConfirmModal(false);
  };

  const handleCancelConfirm = () => {
    setShowConfirmModal(false);
  };

  // Handle general loan status update (replaces handleApproveLoan and handleRejectLoan)
  const handleUpdateLoanStatus = async (loanId, newStatus) => {
    openConfirmModal(`Anda yakin ingin mengubah status pinjaman ini menjadi "${newStatus.charAt(0).toUpperCase() + newStatus.slice(1)}"?`, async () => {
      try {
        await update(ref(database, `koperasi/data/transaksi/pinjam/${loanId}`), {
          status: newStatus
        });
        // If the detail modal is open for this loan, update its status
        if (selectedLoanForDetail && selectedLoanForDetail.id === loanId) {
          setSelectedLoanForDetail(prev => ({ ...prev, status: newStatus }));
        }
        showMessage(`Status pinjaman berhasil diubah menjadi "${newStatus}"!`, 'success');
      } catch (error) {
        console.error("Error updating loan status:", error);
        showMessage(`Gagal mengubah status pinjaman: ${error.message}`, 'error');
      }
    });
  };

  // Handle payment confirmation / installment status update
  const handleConfirmPayment = async (loanId, detailId, newStatus) => {
    openConfirmModal(`Anda yakin ingin mengubah status pembayaran tagihan ini menjadi "${newStatus === 'sudah bayar' ? 'Sudah Bayar' : 'Belum Bayar'}"?`, async () => {
      try {
        await update(ref(database, `koperasi/data/transaksi/pinjam/${loanId}/detail/${detailId}`), {
          status: newStatus
        });
        // Update the selected loan detail if the modal is open
        if (selectedLoanForDetail && selectedLoanForDetail.id === loanId) {
          setSelectedLoanForDetail(prev => ({
            ...prev,
            detail: {
              ...prev.detail,
              [detailId]: { ...prev.detail[detailId], status: newStatus }
            }
          }));
        }
        showMessage('Status pembayaran berhasil diperbarui!', 'success');
      } catch (error) {
        console.error("Error confirming payment:", error);
        showMessage(`Gagal memperbarui pembayaran: ${error.message}`, 'error');
      }
    });
  };

  // Open loan detail modal
  const openLoanDetailModal = (loan) => {
    setSelectedLoanForDetail(loan);
    setShowLoanDetailModal(true);
  };

  // Helper function to get status badge color
  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'disetujui': return 'bg-green-100 text-green-800 border-green-200';
      case 'ditolak': return 'bg-red-100 text-red-800 border-red-200';
      case 'sudah bayar': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'belum bayar': return 'bg-orange-100 text-orange-800 border-orange-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Helper function to get tagihan color (red for unpaid and due this month)
  const getTagihanColor = (detailData) => {
    const today = new Date();
    const tempoDate = new Date(detailData.tempo.tahun, detailData.tempo.bulan - 1, detailData.tempo.tanggal);

    // Check if due or overdue and unpaid
    if (detailData.status === 'belum bayar' && tempoDate <= today) {
      return 'text-red-600 font-semibold'; // Red for unpaid installments due or overdue
    }
    return 'text-gray-900'; // Default color for others
  };

  // Helper function to format date
  const formatDate = (tanggal, bulan, tahun) => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    return `${tanggal} ${months[bulan - 1]} ${tahun}`;
  };

  const getFullAddress = (userDetail) => {
    if (!userDetail) return 'Data alamat tidak tersedia';
    const parts = [];
    if (userDetail.desa?.name) parts.push(`Desa ${userDetail.desa.name}`);
    if (userDetail.kecamatan?.name) parts.push(`Kec. ${userDetail.kecamatan.name}`);
    if (userDetail.kota?.name) parts.push(`Kota/Kab. ${userDetail.kota.name}`);
    if (userDetail.provinsi?.name) parts.push(`Prov. ${userDetail.provinsi.name}`);
    
    let address = parts.join(', ');
    if (userDetail.rw || userDetail.rt) {
      address += ` (RW ${userDetail.rw}, RT ${userDetail.rt})`;
    }
    return address || 'Data alamat tidak lengkap';
  };

  return (
    <ProtectedLayout allowedRoles={['teller']}>
      <div className="container mx-auto p-4">
        {/* Message Alert */}
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

        <h2 className="text-3xl font-bold text-gray-800 mb-6">Panel Teller Koperasi</h2>

        {/* Pending Loan Applications Section */}
        <div className="bg-white p-6 rounded-lg shadow-md mb-8 border border-gray-100">
          <h3 className="text-2xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <CreditCardIcon className="w-6 h-6 text-blue-600" /> Pengajuan Pinjaman Tertunda
          </h3>
          {/* Search Input for Pending Loans */}
          <div className="relative mb-4">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Cari berdasarkan NKK, Nama Pengguna, atau Nama Lengkap..."
              value={searchTermPending}
              onChange={(e) => setSearchTermPending(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>
          {filteredPendingLoans.length === 0 ? (
            <p className="text-gray-600 py-4 text-center">Tidak ada pengajuan pinjaman yang tertunda yang cocok dengan pencarian Anda.</p>
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
                      Tenor (Bulan)
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Bunga (%)
                    </th>
                    <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Aksi
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredPendingLoans.map((loan) => (
                    <tr key={loan.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{loan.userId}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{users[loan.userId]?.fullName || 'Tidak Diketahui'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">Rp {loan.total.toLocaleString('id-ID')}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{loan.tenor.bulan}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{loan.tenor.bunga}%</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(loan.status)}`}>
                          {loan.status.charAt(0).toUpperCase() + loan.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                        <select
                          value={loan.status}
                          onChange={(e) => handleUpdateLoanStatus(loan.id, e.target.value)}
                          className="block w-full text-sm text-black border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value="pending">Pending</option>
                          <option value="disetujui">Disetujui</option>
                          <option value="ditolak">Ditolak</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* All Loan History Section */}
        <div className="bg-white p-6 rounded-lg shadow-md mb-8 border border-gray-100">
          <h3 className="text-2xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <BanknotesIcon className="w-6 h-6 text-emerald-600" /> Semua Riwayat Pinjaman & Pembayaran
          </h3>
          {/* Search Input for All Loans */}
          <div className="relative mb-4">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Cari berdasarkan NKK, Nama Pengguna, atau Nama Lengkap..."
              value={searchTermAllLoans}
              onChange={(e) => setSearchTermAllLoans(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>
          {filteredAllLoans.length === 0 ? (
            <p className="text-gray-600 py-4 text-center">Tidak ada riwayat pinjaman yang cocok dengan pencarian Anda.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ID Pinjaman
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
                    <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Aksi
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredAllLoans.map((loan) => (
                    <tr key={loan.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{loan.id}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{users[loan.userId]?.fullName || 'Tidak Diketahui'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">Rp {loan.total.toLocaleString('id-ID')}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <select
                          value={loan.status}
                          onChange={(e) => handleUpdateLoanStatus(loan.id, e.target.value)}
                          className="block w-full text-sm border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value="pending">Pending</option>
                          <option value="disetujui">Disetujui</option>
                          <option value="ditolak">Ditolak</option>
                        </select>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                        <button
                          onClick={() => openLoanDetailModal(loan)}
                          className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded-md shadow-sm transition duration-150 ease-in-out flex items-center gap-1"
                        >
                          <EyeIcon className="w-4 h-4" /> Lihat Detail
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

      {/* Loan Detail Modal */}
      {showLoanDetailModal && selectedLoanForDetail && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                  <CreditCardIcon className="w-5 h-5 text-blue-600" />
                  Detail Pinjaman & Pembayaran
                </h2>
                <button
                  onClick={() => setShowLoanDetailModal(false)}
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
                  <p className="font-medium text-gray-900">{selectedLoanForDetail.userId}</p>
                </div>
                <div>
                  <p className="text-gray-500">Nama Anggota:</p>
                  <p className="font-medium text-gray-900">{users[selectedLoanForDetail.userId]?.fullName || 'Tidak Diketahui'}</p>
                </div>
                {/* Domicile Information */}
                <div className="col-span-2"> {/* Span across two columns */}
                  <p className="text-gray-500 flex items-center gap-1">
                    <HomeIcon className="w-4 h-4" /> Domisili:
                  </p>
                  <p className="font-medium text-gray-900">
                    {getFullAddress(users[selectedLoanForDetail.userId]?.detail)}
                  </p>
                </div>
                {/* End Domicile Information */}
                <div>
                  <p className="text-gray-500">Jumlah Pinjaman:</p>
                  <p className="font-medium text-gray-900">Rp {selectedLoanForDetail.total.toLocaleString('id-ID')}</p>
                </div>
                <div>
                  <p className="text-gray-500">Status Pinjaman:</p>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(selectedLoanForDetail.status)}`}>
                    {selectedLoanForDetail.status.charAt(0).toUpperCase() + selectedLoanForDetail.status.slice(1)}
                  </span>
                </div>
                <div>
                  <p className="text-gray-500">Tenor:</p>
                  <p className="font-medium text-gray-900">{selectedLoanForDetail.tenor.bulan} Bulan</p>
                </div>
                <div>
                  <p className="text-gray-500">Bunga Per Bulan:</p>
                  <p className="font-medium text-gray-900">{selectedLoanForDetail.tenor.bunga}%</p>
                </div>
              </div>

              <h3 className="text-lg font-semibold text-gray-800 mb-4">Detail Angsuran:</h3>
              <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
                {Object.entries(selectedLoanForDetail.detail || {})
                  .sort(([, dataA], [, dataB]) => {
                    const dateA = new Date(dataA.tempo.tahun, dataA.tempo.bulan - 1, dataA.tempo.tanggal);
                    const dateB = new Date(dataB.tempo.tahun, dataB.tempo.bulan - 1, dataB.tempo.tanggal);
                    return dateA - dateB; // Sort ascending by due date
                  })
                  .map(([detailId, tagihan]) => (
                    <div key={detailId} className="flex flex-col sm:flex-row items-center justify-between p-3 bg-gray-50 rounded-xl gap-2">
                      <div className="flex items-center gap-3 w-full sm:w-auto">
                        <div className={`p-2 rounded-lg ${tagihan.status === 'sudah bayar' ? 'bg-blue-100' : 'bg-orange-100'}`}>
                          {tagihan.status === 'sudah bayar' ? (
                            <CheckCircleIcon className="w-4 h-4 text-blue-600" />
                          ) : (
                            <ClockIcon className="w-4 h-4 text-orange-600" />
                          )}
                        </div>
                        <div className="flex-1">
                          <p className={`font-medium ${getTagihanColor(tagihan)}`}>
                            Rp {parseFloat(tagihan.totalTagihan).toLocaleString('id-ID')}
                          </p>
                          <p className="text-sm text-gray-500 flex items-center gap-1">
                            <CalendarDaysIcon className="w-3 h-3" />
                            Tempo: {formatDate(tagihan.tempo.tanggal, tagihan.tempo.bulan, tagihan.tempo.tahun)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 mt-2 sm:mt-0">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(tagihan.status)}`}>
                          {tagihan.status === 'sudah bayar' ? 'Lunas' : 'Belum Bayar'}
                        </span>
                        {selectedLoanForDetail.status === 'disetujui' && (
                          <select
                            value={tagihan.status}
                            onChange={(e) => handleConfirmPayment(selectedLoanForDetail.id, detailId, e.target.value)}
                            className="block text-sm border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 py-1 px-2"
                          >
                            <option value="belum bayar">Belum Bayar</option>
                            <option value="sudah bayar">Sudah Bayar</option>
                          </select>
                        )}
                      </div>
                    </div>
                  ))}
                  {Object.keys(selectedLoanForDetail.detail || {}).length === 0 && (
                    <p className="text-gray-500 text-center py-4">Belum ada detail angsuran.</p>
                  )}
              </div>
            </div>
            <div className="p-6 border-t border-gray-100 flex justify-end">
              <button
                onClick={() => setShowLoanDetailModal(false)}
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
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


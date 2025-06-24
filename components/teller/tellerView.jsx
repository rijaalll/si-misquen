// TELLER PAGE CLIENT COMPONENT

"use client";

import { useEffect, useState } from 'react';
import ProtectedLayout from '@/controller/role.controller';
import { database } from '@/utils/firebaseConfig';
import { ref, onValue, update, get } from 'firebase/database';
import { v4 as uuidv4 } from 'uuid';
import {
  ClockIcon,
  CheckCircleIcon, // For approve loan
  XCircleIcon, // For reject loan
  EyeIcon, // For detail view modal
  CreditCardIcon, // Icon for loan management
  BanknotesIcon, // Icon for payment confirmation
  InformationCircleIcon, // For generic confirmation modal
  XMarkIcon, // For closing modals
  CalendarDaysIcon // For date in detail modals
} from '@heroicons/react/24/outline'; // Importing necessary icons

export default function TellerView() {
  const [pendingLoans, setPendingLoans] = useState([]);
  const [allLoans, setAllLoans] = useState([]);
  const [users, setUsers] = useState({});
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState(''); // 'success' or 'error'

  // State for loan detail modal
  const [showLoanDetailModal, setShowLoanDetailModal] = useState(false);
  const [selectedLoanForDetail, setSelectedLoanForDetail] = useState(null);

  // Generic Confirmation Modal States (similar to admin view)
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmMessage, setConfirmMessage] = useState('');
  const [onConfirmAction, setOnConfirmAction] = useState(() => () => {});


  useEffect(() => {
    // Fetch users data to display full names
    const usersRef = ref(database, 'koperasi/user');
    const unsubscribeUsers = onValue(usersRef, (snapshot) => {
      const userData = snapshot.val();
      const usersMap = {};
      for (const uid in userData) {
        usersMap[uid] = userData[uid].fullName || userData[uid].userName;
      }
      setUsers(usersMap);
    });

    // Fetch all loan data and separate into pending and all loans
    const loansRef = ref(database, 'koperasi/data/transaksi/pinjam');
    const unsubscribeLoans = onValue(loansRef, (snapshot) => {
      const data = snapshot.val();
      const pendingList = [];
      const allList = [];
      for (const id in data) {
        const loan = { id, ...data[id] };
        allList.push(loan);
        if (loan.status === 'pending') {
          pendingList.push(loan);
        }
      }
      setPendingLoans(pendingList);
      setAllLoans(allList);
    });

    return () => {
      unsubscribeUsers();
      unsubscribeLoans();
    };
  }, []);

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

  // Handle loan approval
  const handleApproveLoan = async (loanId) => {
    openConfirmModal('Anda yakin ingin MENYETUJUI pengajuan pinjaman ini?', async () => {
      try {
        await update(ref(database, `koperasi/data/transaksi/pinjam/${loanId}`), {
          status: 'disetujui'
        });
        showMessage('Pinjaman berhasil disetujui!', 'success');
      } catch (error) {
        console.error("Error approving loan:", error);
        showMessage(`Gagal menyetujui pinjaman: ${error.message}`, 'error');
      }
    });
  };

  // Handle loan rejection
  const handleRejectLoan = async (loanId) => {
    openConfirmModal('Anda yakin ingin MENOLAK pengajuan pinjaman ini?', async () => {
      try {
        await update(ref(database, `koperasi/data/transaksi/pinjam/${loanId}`), {
          status: 'ditolak'
        });
        showMessage('Pinjaman berhasil ditolak!', 'success');
      } catch (error) {
        console.error("Error rejecting loan:", error);
        showMessage(`Gagal menolak pinjaman: ${error.message}`, 'error');
      }
    });
  };

  // Handle payment confirmation
  const handleConfirmPayment = async (loanId, detailId) => {
    openConfirmModal('Anda yakin ingin MENGKONFIRMASI pembayaran tagihan ini?', async () => {
      try {
        await update(ref(database, `koperasi/data/transaksi/pinjam/${loanId}/detail/${detailId}`), {
          status: 'sudah bayar'
        });
        // Update the selected loan detail if the modal is open
        if (selectedLoanForDetail && selectedLoanForDetail.id === loanId) {
          setSelectedLoanForDetail(prev => ({
            ...prev,
            detail: {
              ...prev.detail,
              [detailId]: { ...prev.detail[detailId], status: 'sudah bayar' }
            }
          }));
        }
        showMessage('Pembayaran berhasil dikonfirmasi!', 'success');
      } catch (error) {
        console.error("Error confirming payment:", error);
        showMessage(`Gagal mengkonfirmasi pembayaran: ${error.message}`, 'error');
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

    // Check if due this month and unpaid
    if (detailData.status === 'belum bayar' && 
        tempoDate.getFullYear() === today.getFullYear() && 
        tempoDate.getMonth() === today.getMonth()) {
      return 'text-red-600 font-semibold'; // Red for unpaid installments due this month
    }
    return 'text-gray-900'; // Default color for others
  };

  // Helper function to format date
  const formatDate = (tanggal, bulan, tahun) => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    return `${tanggal} ${months[bulan - 1]} ${tahun}`;
  };

  return (
    <ProtectedLayout allowedRoles={['teller']}>
      <div className="container mx-auto p-4">
        {/* Message Alert */}
        {message && (
          <div className={`p-3 rounded-md mb-4 text-center ${messageType === 'success' ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'}`}>
            {message}
          </div>
        )}

        <h2 className="text-3xl font-bold text-gray-800 mb-6">Panel Teller Koperasi</h2>

        {/* Pending Loan Applications Section */}
        <div className="bg-white p-6 rounded-lg shadow-md mb-8 border border-gray-100">
          <h3 className="text-2xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <CreditCardIcon className="w-6 h-6 text-blue-600" /> Pengajuan Pinjaman Tertunda
          </h3>
          {pendingLoans.length === 0 ? (
            <p className="text-gray-600 py-4 text-center">Tidak ada pengajuan pinjaman yang tertunda.</p>
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
                      Aksi
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {pendingLoans.map((loan) => (
                    <tr key={loan.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{loan.userId}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{users[loan.userId] || 'Tidak Diketahui'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">Rp {loan.total.toLocaleString('id-ID')}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{loan.tenor.bulan}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{loan.tenor.bunga}%</td>
                      <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                        <button
                          onClick={() => handleApproveLoan(loan.id)}
                          className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded-md shadow-sm mr-2 transition duration-150 ease-in-out flex items-center gap-1"
                        >
                          <CheckCircleIcon className="w-4 h-4" /> Setujui
                        </button>
                        <button
                          onClick={() => handleRejectLoan(loan.id)}
                          className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-md shadow-sm transition duration-150 ease-in-out flex items-center gap-1"
                        >
                          <XCircleIcon className="w-4 h-4" /> Tolak
                        </button>
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
          {allLoans.length === 0 ? (
            <p className="text-gray-600 py-4 text-center">Tidak ada riwayat pinjaman.</p>
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
                  {allLoans.map((loan) => (
                    <tr key={loan.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{loan.id}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{users[loan.userId] || 'Tidak Diketahui'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">Rp {loan.total.toLocaleString('id-ID')}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(loan.status)}`}>
                          {loan.status.charAt(0).toUpperCase() + loan.status.slice(1)}
                        </span>
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
                  <p className="font-medium text-gray-900">{users[selectedLoanForDetail.userId] || 'Tidak Diketahui'}</p>
                </div>
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
                    <div key={detailId} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${tagihan.status === 'sudah bayar' ? 'bg-blue-100' : 'bg-orange-100'}`}>
                          {tagihan.status === 'sudah bayar' ? (
                            <CheckCircleIcon className="w-4 h-4 text-blue-600" />
                          ) : (
                            <ClockIcon className="w-4 h-4 text-orange-600" />
                          )}
                        </div>
                        <div>
                          <p className={`font-medium ${getTagihanColor(tagihan)}`}>
                            Rp {parseFloat(tagihan.totalTagihan).toLocaleString('id-ID')}
                          </p>
                          <p className="text-sm text-gray-500 flex items-center gap-1">
                            <CalendarDaysIcon className="w-3 h-3" />
                            Tempo: {formatDate(tagihan.tempo.tanggal, tagihan.tempo.bulan, tagihan.tempo.tahun)}
                          </p>
                        </div>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(tagihan.status)} mr-2`}>
                        {tagihan.status === 'sudah bayar' ? 'Lunas' : 'Belum Bayar'}
                      </span>
                      {tagihan.status === 'belum bayar' && selectedLoanForDetail.status === 'disetujui' && (
                        <button
                          onClick={() => handleConfirmPayment(selectedLoanForDetail.id, detailId)}
                          className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 text-xs rounded-md shadow-sm transition duration-150 ease-in-out flex items-center gap-1"
                        >
                          <BanknotesIcon className="w-3 h-3" /> Konfirmasi Bayar
                        </button>
                      )}
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

// /teller/page.js (Halaman Teller)
// Halaman untuk teller mengelola persetujuan pinjaman dan konfirmasi pembayaran.

"use client";

import { useEffect, useState } from 'react';
import ProtectedLayout from '@/controller/role.controller';
import { database } from '@/utils/firebaseConfig';
import { ref, onValue, update, get } from 'firebase/database';
import { v4 as uuidv4 } from 'uuid';

export default function TellerView() {
  const [pendingLoans, setPendingLoans] = useState([]);
  const [allLoans, setAllLoans] = useState([]);
  const [users, setUsers] = useState({});
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState(''); // 'success' or 'error'

  useEffect(() => {
    const usersRef = ref(database, 'koperasi/user');
    const unsubscribeUsers = onValue(usersRef, (snapshot) => {
      const userData = snapshot.val();
      const usersMap = {};
      for (const uid in userData) {
        usersMap[uid] = userData[uid].fullName || userData[uid].userName;
      }
      setUsers(usersMap);
    });

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

  const showMessage = (msg, type) => {
    setMessage(msg);
    setMessageType(type);
    setTimeout(() => {
      setMessage('');
      setMessageType('');
    }, 3000);
  };

  const handleApproveLoan = async (loanId) => {
    try {
      await update(ref(database, `koperasi/data/transaksi/pinjam/${loanId}`), {
        status: 'disetujui'
      });
      showMessage('Pinjaman berhasil disetujui!', 'success');
    } catch (error) {
      console.error("Error approving loan:", error);
      showMessage(`Gagal menyetujui pinjaman: ${error.message}`, 'error');
    }
  };

  const handleRejectLoan = async (loanId) => {
    try {
      await update(ref(database, `koperasi/data/transaksi/pinjam/${loanId}`), {
        status: 'ditolak'
      });
      showMessage('Pinjaman berhasil ditolak!', 'success');
    } catch (error) {
      console.error("Error rejecting loan:", error);
      showMessage(`Gagal menolak pinjaman: ${error.message}`, 'error');
    }
  };

  const handleConfirmPayment = async (loanId, detailId) => {
    try {
      await update(ref(database, `koperasi/data/transaksi/pinjam/${loanId}/detail/${detailId}`), {
        status: 'sudah bayar'
      });
      showMessage('Pembayaran berhasil dikonfirmasi!', 'success');
    } catch (error) {
      console.error("Error confirming payment:", error);
      showMessage(`Gagal mengkonfirmasi pembayaran: ${error.message}`, 'error');
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
    <ProtectedLayout allowedRoles={['teller']}>
      <div className="container mx-auto p-4">
        {message && (
          <div className={`p-3 rounded-md mb-4 text-center ${messageType === 'success' ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'}`}>
            {message}
          </div>
        )}

        <h2 className="text-3xl font-bold text-gray-800 mb-6">Panel Teller</h2>

        <div className="bg-white p-6 rounded-lg shadow-md mb-8">
          <h3 className="text-2xl font-semibold text-gray-800 mb-4">Pengajuan Pinjaman Tertunda</h3>
          {pendingLoans.length === 0 ? (
            <p className="text-gray-600">Tidak ada pengajuan pinjaman yang tertunda.</p>
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
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
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
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => handleApproveLoan(loan.id)}
                          className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-md shadow-sm mr-2 transition duration-150 ease-in-out"
                        >
                          Setujui
                        </button>
                        <button
                          onClick={() => handleRejectLoan(loan.id)}
                          className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md shadow-sm transition duration-150 ease-in-out"
                        >
                          Tolak
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-2xl font-semibold text-gray-800 mb-4">Semua Riwayat Pinjaman & Pembayaran</h3>
          {allLoans.length === 0 ? (
            <p className="text-gray-600">Tidak ada riwayat pinjaman.</p>
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
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Detail Tagihan
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
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {Object.entries(loan.detail || {}).map(([detailId, tagihan], index) => (
                          <div key={detailId} className="mb-2 p-2 border border-gray-200 rounded-md">
                            <p>Tagihan: Rp {parseFloat(tagihan.totalTagihan).toLocaleString('id-ID')}</p>
                            <p>Tempo: {tagihan.tempo.tanggal}/{tagihan.tempo.bulan}/{tagihan.tempo.tahun}</p>
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(tagihan.status)}`}>
                              {tagihan.status.charAt(0).toUpperCase() + tagihan.status.slice(1)}
                            </span>
                            {tagihan.status === 'belum bayar' && loan.status === 'disetujui' && (
                              <button
                                onClick={() => handleConfirmPayment(loan.id, detailId)}
                                className="ml-2 bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 text-xs rounded-md shadow-sm transition duration-150 ease-in-out"
                              >
                                Konfirmasi Bayar
                              </button>
                            )}
                          </div>
                        ))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </ProtectedLayout>
  );
}

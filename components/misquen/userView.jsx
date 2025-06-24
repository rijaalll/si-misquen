// app/misquen/page.js (Halaman Anggota)
// Halaman untuk anggota koperasi dengan fungsionalitas simpan, pinjam, dll.

"use client";

import { useEffect, useState } from 'react';
import ProtectedLayout from '@/controller/role.controller';
import { useAuth } from '@/context/AuthContext';
import { database } from '@/utils/firebaseConfig';
import { ref, onValue, set, push, update } from 'firebase/database';
import { v4 as uuidv4 } from 'uuid';

export default function UserView() {
  const { currentUser } = useAuth();
  const [saldoSimpanan, setSaldoSimpanan] = useState(0);
  const [riwayatTransaksi, setRiwayatTransaksi] = useState([]);
  const [riwayatPinjaman, setRiwayatPinjaman] = useState([]);
  const [showSimpanModal, setShowSimpanModal] = useState(false);
  const [nominalSimpan, setNominalSimpan] = useState('');
  const [showPinjamModal, setShowPinjamModal] = useState(false);
  const [jumlahPinjaman, setJumlahPinjaman] = useState('');
  const [tenorBulan, setTenorBulan] = useState('');
  const [bungaPerBulan, setBungaPerBulan] = useState('');
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState(''); // 'success' or 'error'

  useEffect(() => {
    if (currentUser) {
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
            break; // Asumsi hanya ada satu entri simpanan per userId
          }
        }
        setSaldoSimpanan(currentSaldo);
        setRiwayatTransaksi(transaksiList.sort((a, b) => {
            // Sort by year, month, day, then hour
            const dateA = new Date(a.detail.tahun, a.detail.bulan - 1, a.detail.tanggal, a.detail.jam.split(':')[0], a.detail.jam.split(':')[1]);
            const dateB = new Date(b.detail.tahun, b.detail.bulan - 1, b.detail.tanggal, b.detail.jam.split(':')[0], b.detail.jam.split(':')[1]);
            return dateB - dateA; // Descending order (latest first)
        }));
      });

      const pinjamanRef = ref(database, `koperasi/data/transaksi/pinjam`);
      const unsubscribePinjaman = onValue(pinjamanRef, (snapshot) => {
        const data = snapshot.val();
        let pinjamanList = [];
        for (const pinjamId in data) {
          const pinjamData = data[pinjamId];
          if (pinjamData.userId === currentUser.uid) {
            pinjamanList.push({ id: pinjamId, ...pinjamData });
          }
        }
        setRiwayatPinjaman(pinjamanList);
      });

      return () => {
        unsubscribeSimpanan();
        unsubscribePinjaman();
      };
    }
  }, [currentUser]);

  const showMessage = (msg, type) => {
    setMessage(msg);
    setMessageType(type);
    setTimeout(() => {
      setMessage('');
      setMessageType('');
    }, 3000); // Pesan akan hilang setelah 3 detik
  };

  const handleSimpan = async () => {
    if (!nominalSimpan || isNaN(nominalSimpan) || parseFloat(nominalSimpan) <= 0) {
      showMessage('Nominal simpan tidak valid.', 'error');
      return;
    }

    const nominal = parseFloat(nominalSimpan);
    const now = new Date();
    const tanggal = now.getDate();
    const bulan = now.getMonth() + 1; // getMonth() is 0-indexed
    const tahun = now.getFullYear();
    const jam = `${now.getHours()}:${now.getMinutes()}`;

    try {
      const userSimpananRef = ref(database, `koperasi/data/transaksi/simpan`);
      let userSimpananId = null;
      let currentTotalSimpanan = 0;

      // Cari entri simpanan user saat ini
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
        // Update entri simpanan yang sudah ada
        await update(ref(database, `koperasi/data/transaksi/simpan/${userSimpananId}`), {
          total: currentTotalSimpanan + nominal,
        });
        await set(ref(database, `koperasi/data/transaksi/simpan/${userSimpananId}/detail/${newDetailId}`), newDetailEntry);
      } else {
        // Buat entri simpanan baru jika belum ada
        userSimpananId = uuidv4(); // Generate ID baru untuk entri simpanan
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

  const handleAjukanPinjaman = async () => {
    if (!jumlahPinjaman || isNaN(jumlahPinjaman) || parseFloat(jumlahPinjaman) <= 0 ||
        !tenorBulan || isNaN(tenorBulan) || parseInt(tenorBulan) <= 0 ||
        !bungaPerBulan || isNaN(bungaPerBulan) || parseFloat(bungaPerBulan) < 0) {
      showMessage('Data pinjaman tidak valid. Pastikan semua kolom terisi dengan angka positif.', 'error');
      return;
    }

    const totalPinjaman = parseFloat(jumlahPinjaman);
    const tenor = parseInt(tenorBulan);
    const bunga = parseFloat(bungaPerBulan); // Bunga dalam persen, misal 0.05 untuk 5%

    // Hitung total bunga dan total tagihan per bulan
    const totalBunga = totalPinjaman * (bunga / 100) * tenor;
    const totalTagihanKeseluruhan = totalPinjaman + totalBunga;
    const totalTagihanPerBulan = totalTagihanKeseluruhan / tenor;

    const detailTagihan = {};
    const now = new Date();
    for (let i = 0; i < tenor; i++) {
      const tempoDate = new Date(now.getFullYear(), now.getMonth() + i + 1, now.getDate()); // Tempo bulan berikutnya
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
      setTenorBulan('');
      setBungaPerBulan('');
      setShowPinjamModal(false);
    } catch (error) {
      console.error("Error during loan application:", error);
      showMessage(`Gagal mengajukan pinjaman: ${error.message}`, 'error');
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
    <ProtectedLayout allowedRoles={['user']}>
      <div className="container mx-auto p-4">
        {message && (
          <div className={`p-3 rounded-md mb-4 text-center ${messageType === 'success' ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'}`}>
            {message}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-md text-center border-l-4 border-emerald-500">
            <h3 className="text-xl font-semibold text-gray-700 mb-2">Saldo Simpanan</h3>
            <p className="text-4xl font-bold text-emerald-600">Rp {saldoSimpanan.toLocaleString('id-ID')}</p>
            <button
              onClick={() => setShowSimpanModal(true)}
              className="mt-4 bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-2 rounded-md shadow-md transition duration-150 ease-in-out"
            >
              Simpan Dana
            </button>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md text-center border-l-4 border-blue-500">
            <h3 className="text-xl font-semibold text-gray-700 mb-2">Mulai Meminjam</h3>
            <p className="text-lg text-gray-600 mb-4">Ajukan pinjaman baru dan lihat persetujuan.</p>
            <button
              onClick={() => setShowPinjamModal(true)}
              className="mt-4 bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-md shadow-md transition duration-150 ease-in-out"
            >
              Ajukan Pinjaman
            </button>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md mb-8">
          <h3 className="text-2xl font-semibold text-gray-800 mb-4">Riwayat Simpanan</h3>
          {riwayatTransaksi.length === 0 ? (
            <p className="text-gray-600">Belum ada riwayat transaksi simpanan.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tipe
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Nominal
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tanggal
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Waktu
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {riwayatTransaksi.map((transaksi) => (
                    <tr key={transaksi.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${transaksi.status === 'simpan' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                          {transaksi.status.charAt(0).toUpperCase() + transaksi.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        Rp {transaksi.nominal.toLocaleString('id-ID')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {transaksi.detail.tanggal}/{transaksi.detail.bulan}/{transaksi.detail.tahun}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {transaksi.detail.jam}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-2xl font-semibold text-gray-800 mb-4">Tagihan Pinjaman</h3>
          {riwayatPinjaman.length === 0 ? (
            <p className="text-gray-600">Belum ada riwayat pinjaman.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
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
                      Status Pinjaman
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Detail Tagihan
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {riwayatPinjaman.map((pinjam) => (
                    <tr key={pinjam.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        Rp {pinjam.total.toLocaleString('id-ID')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {pinjam.tenor.bulan}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {pinjam.tenor.bunga}%
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(pinjam.status)}`}>
                          {pinjam.status.charAt(0).toUpperCase() + pinjam.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {Object.values(pinjam.detail || {}).map((tagihan, index) => (
                          <div key={index} className="mb-2 p-2 border border-gray-200 rounded-md">
                            <p>Tagihan: Rp {parseFloat(tagihan.totalTagihan).toLocaleString('id-ID')}</p>
                            <p>Tempo: {tagihan.tempo.tanggal}/{tagihan.tempo.bulan}/{tagihan.tempo.tahun}</p>
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(tagihan.status)}`}>
                              {tagihan.status.charAt(0).toUpperCase() + tagihan.status.slice(1)}
                            </span>
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

      {/* Simpan Modal */}
      {showSimpanModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-sm">
            <h2 className="text-2xl font-bold mb-4 text-gray-800">Simpan Dana</h2>
            <div className="mb-4">
              <label htmlFor="nominalSimpan" className="block text-sm font-medium text-gray-700">Nominal</label>
              <input
                type="number"
                id="nominalSimpan"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                value={nominalSimpan}
                onChange={(e) => setNominalSimpan(e.target.value)}
                min="1"
              />
            </div>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowSimpanModal(false)}
                className="px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400 transition duration-150 ease-in-out"
              >
                Batal
              </button>
              <button
                onClick={handleSimpan}
                className="px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 transition duration-150 ease-in-out"
              >
                Simpan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Pinjam Modal */}
      {showPinjamModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-lg">
            <h2 className="text-2xl font-bold mb-4 text-gray-800">Ajukan Pinjaman</h2>
            <div className="space-y-4">
              <div>
                <label htmlFor="jumlahPinjaman" className="block text-sm font-medium text-gray-700">Jumlah Pinjaman</label>
                <input
                  type="number"
                  id="jumlahPinjaman"
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  value={jumlahPinjaman}
                  onChange={(e) => setJumlahPinjaman(e.target.value)}
                  min="1"
                />
              </div>
              <div>
                <label htmlFor="tenorBulan" className="block text-sm font-medium text-gray-700">Tenor (Bulan)</label>
                <input
                  type="number"
                  id="tenorBulan"
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  value={tenorBulan}
                  onChange={(e) => setTenorBulan(e.target.value)}
                  min="1"
                />
              </div>
              <div>
                <label htmlFor="bungaPerBulan" className="block text-sm font-medium text-gray-700">Bunga per Bulan (%)</label>
                <input
                  type="number"
                  id="bungaPerBulan"
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  value={bungaPerBulan}
                  onChange={(e) => setBungaPerBulan(e.target.value)}
                  min="0"
                  step="0.01"
                />
              </div>
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowPinjamModal(false)}
                className="px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400 transition duration-150 ease-in-out"
              >
                Batal
              </button>
              <button
                onClick={handleAjukanPinjaman}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition duration-150 ease-in-out"
              >
                Ajukan Pinjaman
              </button>
            </div>
          </div>
        </div>
      )}
    </ProtectedLayout>
  );
}

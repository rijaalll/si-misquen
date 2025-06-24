// components/admin/LaporanKeuanganView.jsx
// Komponen klien untuk laporan keuangan di panel admin.

"use client";

import { useEffect, useState } from 'react';
import ProtectedLayout from '@/controller/role.controller'; // Mengimpor ProtectedLayout
import { database } from '@/utils/firebaseConfig';
import { ref, onValue } from 'firebase/database';
import {
  ChartBarIcon, // Icon untuk laporan
  BanknotesIcon,
  CreditCardIcon,
  ArrowUpTrayIcon,
  ArrowDownTrayIcon,
  ClockIcon, // Ditambahkan untuk Pinjaman Pending
  XCircleIcon, // Ditambahkan untuk Pinjaman Ditolak
  BellAlertIcon, // Ditambahkan untuk Total Tagihan Belum Bayar
  CurrencyDollarIcon, // Ditambahkan untuk Total Bunga Didapatkan
  DocumentArrowDownIcon // Icon untuk Cetak Excel
} from '@heroicons/react/24/outline';

export default function LaporanKeuanganView() {
  const [users, setUsers] = useState({});
  const [simpananData, setSimpananData] = useState([]);
  const [pinjamanData, setPinjamanData] = useState([]);
  const [laporan, setLaporan] = useState({
    totalSimpananAnggota: 0,
    totalPinjamanDisetujui: 0,
    totalPemasukanSimpanan: 0,
    totalPenarikanSimpanan: 0,
    totalPembayaranPinjamanLunas: 0,
    totalPinjamanPending: 0,
    totalPinjamanDitolak: 0,
    totalTagihanBelumBayar: 0,
    totalBungaDidapatkan: 0,
    saldoBersihKoperasi: 0, // Aset - Kewajiban
  });
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');

  // Mengambil semua data yang diperlukan dari Firebase
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

  // Menghitung laporan keuangan setiap kali data berubah
  useEffect(() => {
    let totalSimpananAnggota = 0;
    let totalPemasukanSimpanan = 0;
    let totalPenarikanSimpanan = 0;

    simpananData.forEach(simpanan => {
      totalSimpananAnggota += simpanan.total || 0;
      if (simpanan.detail) {
        for (const detailId in simpanan.detail) {
          const detail = simpanan.detail[detailId];
          if (detail.status === 'simpan') {
            totalPemasukanSimpanan += detail.nominal || 0;
          } else if (detail.status === 'tarik') {
            totalPenarikanSimpanan += detail.nominal || 0;
          }
        }
      }
    });

    let totalPinjamanDisetujui = 0;
    let totalPembayaranPinjamanLunas = 0;
    let totalPinjamanPending = 0;
    let totalPinjamanDitolak = 0;
    let totalTagihanBelumBayar = 0;
    let totalBungaDidapatkan = 0;

    pinjamanData.forEach(pinjaman => {
      if (pinjaman.status === 'disetujui') {
        totalPinjamanDisetujui += pinjaman.total || 0;
        if (pinjaman.tenor && pinjaman.tenor.bunga && pinjaman.tenor.bulan) {
          totalBungaDidapatkan += pinjaman.total * (pinjaman.tenor.bunga / 100) * pinjaman.tenor.bulan;
        }
        if (pinjaman.detail) {
          for (const detailId in pinjaman.detail) {
            const detail = pinjaman.detail[detailId];
            if (detail.status === 'sudah bayar') {
              totalPembayaranPinjamanLunas += parseFloat(detail.totalTagihan) || 0;
            } else if (detail.status === 'belum bayar') {
              totalTagihanBelumBayar += parseFloat(detail.totalTagihan) || 0;
            }
          }
        }
      } else if (pinjaman.status === 'pending') {
        totalPinjamanPending += pinjaman.total || 0;
      } else if (pinjaman.status === 'ditolak') {
        totalPinjamanDitolak += pinjaman.total || 0;
      }
    });

    // Perhitungan saldo bersih koperasi
    // Saldo bersih adalah total simpanan anggota (kewajiban koperasi) 
    // dikurangi dengan total pinjaman yang disetujui (aset koperasi)
    // Ditambah dengan bunga yang didapatkan (pendapatan)
    // Ini adalah model yang sangat disederhanakan, di sistem nyata lebih kompleks.
    // Saldo Bersih = Aset (Pinjaman Disetujui + Tagihan Belum Bayar) - Kewajiban (Total Simpanan Anggota)
    const saldoBersihKoperasi = totalPinjamanDisetujui + totalTagihanBelumBayar - totalSimpananAnggota;


    setLaporan({
      totalSimpananAnggota,
      totalPinjamanDisetujui,
      totalPemasukanSimpanan,
      totalPenarikanSimpanan,
      totalPembayaranPinjamanLunas,
      totalPinjamanPending,
      totalPinjamanDitolak,
      totalTagihanBelumBayar,
      totalBungaDidapatkan,
      saldoBersihKoperasi
    });
  }, [simpananData, pinjamanData]);

  // Fungsi untuk menampilkan pesan sementara (jika diperlukan)
  const showMessage = (msg, type) => {
    setMessage(msg);
    setMessageType(type);
    setTimeout(() => {
      setMessage('');
      setMessageType('');
    }, 3000);
  };

  // Fungsi untuk mencetak laporan ke Excel (CSV)
  const handleExportToExcel = () => {
    let csvContent = "data:text/csv;charset=utf-8,";
    
    // Header CSV
    const headers = [
      "Metrik Keuangan", "Jumlah (Rp)"
    ];
    csvContent += headers.join(",") + "\n";

    // Data Laporan
    const reportData = [
      ["Total Simpanan Anggota", laporan.totalSimpananAnggota],
      ["Total Pinjaman Disetujui", laporan.totalPinjamanDisetujui],
      ["Saldo Bersih Koperasi", laporan.saldoBersihKoperasi],
      ["Total Pemasukan Simpanan", laporan.totalPemasukanSimpanan],
      ["Total Penarikan Simpanan", laporan.totalPenarikanSimpanan],
      ["Total Pembayaran Pinjaman Lunas", laporan.totalPembayaranPinjamanLunas],
      ["Total Pinjaman Pending", laporan.totalPinjamanPending],
      ["Total Pinjaman Ditolak", laporan.totalPinjamanDitolak],
      ["Total Tagihan Belum Bayar", laporan.totalTagihanBelumBayar],
      ["Total Bunga Didapatkan", laporan.totalBungaDidapatkan],
    ];

    reportData.forEach(row => {
      csvContent += row.map(item => {
        // Handle numbers to ensure correct formatting in Excel
        if (typeof item === 'number') {
          return item.toFixed(2).replace('.', ','); // Use comma for decimal in some Excel locales
        }
        return `"${item}"`; // Wrap text in quotes to handle commas within text
      }).join(",") + "\n";
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "Laporan_Keuangan_Koperasi.csv");
    document.body.appendChild(link); // Required for Firefox
    link.click();
    document.body.removeChild(link); // Clean up
    showMessage('Laporan berhasil diunduh dalam format CSV!', 'success');
  };


  return (
    <ProtectedLayout allowedRoles={['admin']}>
      <div className="container mx-auto p-4">
        {message && (
          <div className={`p-3 rounded-md mb-4 text-center ${messageType === 'success' ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'}`}>
            {message}
          </div>
        )}

        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
            <ChartBarIcon className="w-8 h-8 text-purple-600" /> Laporan Keuangan Koperasi
          </h2>
          <button
            onClick={handleExportToExcel}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md shadow-sm transition duration-150 ease-in-out flex items-center gap-1"
          >
            <DocumentArrowDownIcon className="w-5 h-5" /> Cetak ke Excel
          </button>
        </div>


        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {/* Total Simpanan Anggota */}
          <div className="bg-white p-6 rounded-lg shadow-md border border-gray-100 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Simpanan Anggota</p>
              <p className="text-2xl font-bold text-emerald-600">Rp {laporan.totalSimpananAnggota.toLocaleString('id-ID')}</p>
            </div>
            <BanknotesIcon className="w-12 h-12 text-emerald-300 opacity-50" />
          </div>

          {/* Total Pinjaman Disetujui */}
          <div className="bg-white p-6 rounded-lg shadow-md border border-gray-100 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Pinjaman Disetujui</p>
              <p className="text-2xl font-bold text-blue-600">Rp {laporan.totalPinjamanDisetujui.toLocaleString('id-ID')}</p>
            </div>
            <CreditCardIcon className="w-12 h-12 text-blue-300 opacity-50" />
          </div>

          {/* Saldo Bersih Koperasi */}
          <div className="bg-white p-6 rounded-lg shadow-md border border-gray-100 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Saldo Bersih Koperasi</p>
              <p className={`text-2xl font-bold ${laporan.saldoBersihKoperasi >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                Rp {laporan.saldoBersihKoperasi.toLocaleString('id-ID')}
              </p>
            </div>
            <ChartBarIcon className="w-12 h-12 text-purple-300 opacity-50" />
          </div>

          {/* Pemasukan Simpanan */}
          <div className="bg-white p-6 rounded-lg shadow-md border border-gray-100 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Pemasukan Simpanan</p>
              <p className="text-2xl font-bold text-green-600">Rp {laporan.totalPemasukanSimpanan.toLocaleString('id-ID')}</p>
            </div>
            <ArrowUpTrayIcon className="w-12 h-12 text-green-300 opacity-50" />
          </div>

          {/* Penarikan Simpanan */}
          <div className="bg-white p-6 rounded-lg shadow-md border border-gray-100 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Penarikan Simpanan</p>
              <p className="text-2xl font-bold text-red-600">Rp {laporan.totalPenarikanSimpanan.toLocaleString('id-ID')}</p>
            </div>
            <ArrowDownTrayIcon className="w-12 h-12 text-red-300 opacity-50" />
          </div>

          {/* Pembayaran Pinjaman Lunas */}
          <div className="bg-white p-6 rounded-lg shadow-md border border-gray-100 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Pembayaran Pinjaman Lunas</p>
              <p className="text-2xl font-bold text-blue-600">Rp {laporan.totalPembayaranPinjamanLunas.toLocaleString('id-ID')}</p>
            </div>
            <CreditCardIcon className="w-12 h-12 text-blue-300 opacity-50" />
          </div>

          {/* Pinjaman Pending */}
          <div className="bg-white p-6 rounded-lg shadow-md border border-gray-100 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Pinjaman Pending</p>
              <p className="text-2xl font-bold text-yellow-600">Rp {laporan.totalPinjamanPending.toLocaleString('id-ID')}</p>
            </div>
            <ClockIcon className="w-12 h-12 text-yellow-300 opacity-50" />
          </div>

          {/* Pinjaman Ditolak */}
          <div className="bg-white p-6 rounded-lg shadow-md border border-gray-100 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Pinjaman Ditolak</p>
              <p className="text-2xl font-bold text-red-600">Rp {laporan.totalPinjamanDitolak.toLocaleString('id-ID')}</p>
            </div>
            <XCircleIcon className="w-12 h-12 text-red-300 opacity-50" />
          </div>

          {/* Total Tagihan Belum Bayar */}
          <div className="bg-white p-6 rounded-lg shadow-md border border-gray-100 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Tagihan Belum Bayar</p>
              <p className="text-2xl font-bold text-orange-600">Rp {laporan.totalTagihanBelumBayar.toLocaleString('id-ID')}</p>
            </div>
            <BellAlertIcon className="w-12 h-12 text-orange-300 opacity-50" />
          </div>
           {/* Total Bunga Didapatkan */}
           <div className="bg-white p-6 rounded-lg shadow-md border border-gray-100 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Bunga Didapatkan</p>
              <p className="text-2xl font-bold text-purple-600">Rp {laporan.totalBungaDidapatkan.toLocaleString('id-ID')}</p>
            </div>
            <CurrencyDollarIcon className="w-12 h-12 text-purple-300 opacity-50" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-100">
          <h3 className="text-xl font-bold text-gray-800 mb-4">Detail Perhitungan (Sederhana)</h3>
          <p className="text-gray-700 mb-2">
            **Total Simpanan Anggota:** Jumlah kumulatif saldo simpanan semua anggota. Ini adalah kewajiban koperasi kepada anggotanya.
          </p>
          <p className="text-gray-700 mb-2">
            **Total Pinjaman Disetujui:** Jumlah total pinjaman yang telah disetujui dan diberikan kepada anggota. Ini adalah aset bagi koperasi.
          </p>
          <p className="text-gray-700 mb-2">
            **Saldo Bersih Koperasi:** Estimasi sederhana dari kesehatan keuangan koperasi. Di sini dihitung sebagai: <br />
            (Total Pinjaman yang Telah Disetujui) + (Total Tagihan Pinjaman yang Belum Dibayar) - (Total Simpanan Anggota).
             Perhitungan ini menyederhanakan banyak aspek akuntansi, namun memberikan gambaran umum.
          </p>
          <p className="text-gray-700 mb-2">
            **Total Pemasukan Simpanan:** Total dana yang masuk dari kegiatan menyetor.
          </p>
          <p className="text-gray-700 mb-2">
            **Total Penarikan Simpanan:** Total dana yang keluar dari kegiatan penarikan.
          </p>
          <p className="text-gray-700 mb-2">
            **Total Pembayaran Pinjaman Lunas:** Total nominal angsuran pinjaman yang telah dibayar lunas oleh anggota.
          </p>
          <p className="text-gray-700 mb-2">
            **Total Bunga Didapatkan:** Total bunga yang diperkirakan akan didapatkan dari semua pinjaman yang disetujui selama tenornya.
          </p>
          <p className="text-gray-700 text-sm italic mt-4">
            *Catatan: Laporan ini adalah representasi yang disederhanakan dan mungkin tidak mencerminkan semua prinsip akuntansi keuangan yang kompleks.*
          </p>
        </div>
      </div>
    </ProtectedLayout>
  );
}
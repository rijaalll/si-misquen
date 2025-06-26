// components/admin/ConfirmationModal.jsx
// Komponen modal konfirmasi yang dapat digunakan kembali.

"use client";

import React from 'react';
import { InformationCircleIcon, XMarkIcon } from '@heroicons/react/24/outline';

export default function ConfirmationModal({ show, message, onConfirm, onCancel }) {
  if (!show) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md sm:max-w-lg md:max-w-xl lg:max-w-2xl border border-gray-200 mx-4">
        <div className="p-4 sm:p-6 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <InformationCircleIcon className="w-6 h-6 text-blue-500 flex-shrink-0" />
            <h2 className="text-lg sm:text-xl font-bold text-gray-800">Konfirmasi</h2>
          </div>
          <button
            onClick={onCancel}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
          >
            <XMarkIcon className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        <div className="p-4 sm:p-6">
          <p className="text-gray-700 mb-6 text-sm sm:text-base leading-relaxed">{message}</p>
          <div className="flex flex-col sm:flex-row justify-end gap-3 sm:space-x-3 sm:space-y-0">
            <button
              onClick={onCancel}
              className="w-full sm:w-auto px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition duration-150 ease-in-out font-medium order-2 sm:order-1"
            >
              Batal
            </button>
            <button
              onClick={onConfirm}
              className="w-full sm:w-auto px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition duration-150 ease-in-out font-medium order-1 sm:order-2"
            >
              Konfirmasi
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
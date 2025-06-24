// FILE KONTROLLER UNTUK ROLE

"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

const ProtectedLayout = ({ children, allowedRoles }) => {
  const { currentUser, loading, logout } = useAuth();
  const router = useRouter();

  // Effect hook to handle user authentication and role-based access
  useEffect(() => {
    // Once loading is complete
    if (!loading) {
      // If no current user is authenticated, redirect to the home page
      if (!currentUser) {
        router.push('/');
      } 
      // If the current user's role is not allowed for the current page
      else if (!allowedRoles.includes(currentUser.role)) {
        // Log a warning message (replacing the disruptive alert())
        console.warn('Akses ditolak: Anda tidak memiliki akses ke halaman ini.');
        // Redirect to the home page
        router.push('/');
      }
    }
  }, [currentUser, loading, router, allowedRoles]); // Dependencies for the effect

  // Display a loading screen while authentication status is being determined
  if (loading || !currentUser || !allowedRoles.includes(currentUser.role)) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="text-xl font-semibold text-gray-700">Memuat...</div>
      </div>
    );
  }

  // Render the protected layout once authenticated and authorized
  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* Header/Navbar Section */}
      <header className="bg-gray-800 text-white p-4 shadow-lg flex flex-col md:flex-row justify-between items-center rounded-b-lg space-y-3 md:space-y-0 md:space-x-4">
        {/* Application Title */}
        <h1 className="text-2xl font-bold tracking-wide">Koperasi Digital</h1>
        {/* User Info and Logout Button */}
        <div className="flex flex-col md:flex-row items-center space-y-2 md:space-y-0 md:space-x-4">
          {/* Display User's Name and Role */}
          <span className="text-lg text-center md:text-left font-medium">
            Halo, {currentUser.fullName || currentUser.userName}! ({currentUser.role.charAt(0).toUpperCase() + currentUser.role.slice(1)})
          </span>
          {/* Logout Button */}
          <button
            onClick={logout}
            className="bg-red-500 hover:bg-red-600 text-white px-5 py-2 rounded-lg shadow-sm transition duration-150 ease-in-out font-semibold text-base"
          >
            Logout
          </button>
        </div>
      </header>
      {/* Main Content Area */}
      <main className="flex-grow p-6">
        {children} {/* Renders the child components (e.g., AdminView, UserView) */}
      </main>
      {/* Footer Section */}
      <footer className="bg-gray-900 text-white p-4 text-center text-sm">
        <p>&copy; 2024 Koperasi Digital. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default ProtectedLayout;

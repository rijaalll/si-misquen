"use client";

import { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, database } from '@/utils/firebaseConfig';
import { ref, get } from 'firebase/database';
import { useRouter } from 'next/navigation';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const userRef = ref(database, `koperasi/user/${user.uid}`);
        const snapshot = await get(userRef);
        if (snapshot.exists()) {
          const userData = snapshot.val();
          setCurrentUser({ ...user, role: userData.role, userName: userData.userName, fullName: userData.fullName });
        } else {
          await auth.signOut();
          setCurrentUser(null);
          localStorage.removeItem('username');
          localStorage.removeItem('password');
          localStorage.removeItem('userRole');
          router.push('/');
        }
      } else {
        setCurrentUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [router]);

  const login = async (username, password) => {
    setLoading(true);
    try {
      const usersRef = ref(database, 'koperasi/user');
      const snapshot = await get(usersRef);
      if (snapshot.exists()) {
        const users = snapshot.val();
        let foundUser = null;
        for (const uid in users) {
          const user = users[uid];
          if (user.userName === username && user.password === password) {
            foundUser = { ...user, uid: uid };
            break;
          }
        }

        if (foundUser) {
          localStorage.setItem('username', username);
          localStorage.setItem('password', password);
          localStorage.setItem('userRole', foundUser.role);

          setCurrentUser(foundUser);
          if (foundUser.role === 'admin') {
            router.push('/admin');
          } else if (foundUser.role === 'teller') {
            router.push('/teller');
          } else if (foundUser.role === 'user') {
            router.push('/misquen');
          }
          return { success: true };
        } else {
          return { success: false, error: "Username atau password salah." };
        }
      } else {
        return { success: false, error: "Tidak ada pengguna terdaftar." };
      }
    } catch (error) {
      console.error("Error during login:", error);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    await auth.signOut();
    setCurrentUser(null);
    localStorage.removeItem('username');
    localStorage.removeItem('password');
    localStorage.removeItem('userRole');
    router.push('/');
  };

  return (
    <AuthContext.Provider value={{ currentUser, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

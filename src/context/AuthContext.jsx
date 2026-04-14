import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth, db } from '../services/firebase';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (authUser) => {
      if (authUser) {
        try {
          const userDoc = await getDoc(doc(db, 'users', authUser.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            setUser({ ...authUser, ...userData });
            setRole(userData.role);
          } else {
            setUser(authUser);
            setRole('pangkalan'); 
          }
        } catch (error) {
          console.error("Error fetching user role:", error);
          setUser(authUser);
        }
      } else {
        setUser(null);
        setRole(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const login = async (username, password) => {
    let loginEmail = username;
    setLoading(true);

    try {
      // 1. Cari email berdasarkan username di Firestore jika username bukan email
      if (!username.includes('@')) {
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where('username', '==', username));
        const querySnapshot = await getDocs(q);
        
        if (querySnapshot.empty) {
          throw new Error('Username "' + username + '" tidak ditemukan.');
        }
        
        loginEmail = querySnapshot.docs[0].data().email;
      }

      // 2. Login dengan email dan password
      const userCredential = await signInWithEmailAndPassword(auth, loginEmail, password);
      
      // 3. Ambil role segera untuk navigasi yang tepat
      const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid));
      const role = userDoc.exists() ? userDoc.data().role : 'pangkalan';
      
      return { user: userCredential.user, role };
    } catch (error) {
      console.error("Login Error Details:", error.code, error.message);
      if (error.code === 'auth/invalid-credential' || error.code === 'auth/wrong-password' || error.code === 'auth/user-not-found') {
        throw new Error('Sandi yang Anda masukkan salah atau akun tidak terdaftar.');
      }
      throw error;
    }
  };

  const logout = () => {
    return signOut(auth);
  };

  return (
    <AuthContext.Provider value={{ user, role, loading, login, logout }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

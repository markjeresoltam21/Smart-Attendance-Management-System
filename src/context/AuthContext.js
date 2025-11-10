// Authentication Context for managing user state (COMPAT API)
import React, { createContext, useState, useEffect, useContext, useMemo } from 'react';
import { auth } from '../config/firebaseServices';
import { getUserData } from '../services/authService';
import { NotificationProvider } from './NotificationContext';

export const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState(null);

  useEffect(() => {
    console.log('🔐 Setting up auth state listener...');
    
    try {
      // Listen for authentication state changes
      const unsubscribe = auth.onAuthStateChanged(async (firebaseUser) => {
        console.log('👤 Auth state changed:', firebaseUser ? 'User logged in' : 'User logged out');
        
        if (firebaseUser) {
          // Keep loading true while fetching user data
          setLoading(true);
          
          // User is signed in - fetch user data
          const result = await getUserData(firebaseUser.uid);
          if (result.success) {
            setUser(firebaseUser);
            setUserData(result.data);
            console.log('✅ User data loaded:', result.data.email);
          } else {
            console.error('❌ Failed to load user data:', result.error);
            // If user data fails, sign out
            setUser(null);
            setUserData(null);
          }
          setLoading(false);
        } else {
          // User is signed out
          setUser(null);
          setUserData(null);
          setLoading(false);
        }
      });

      console.log('✅ Auth listener registered successfully');

      // Cleanup subscription on unmount
      return () => {
        console.log('🧹 Cleaning up auth listener');
        unsubscribe();
      };
    } catch (error) {
      console.error('❌ FATAL: Failed to set up auth listener:', error);
      console.error('Error details:', error.message);
      console.error('Error stack:', error.stack);
      setLoading(false);
    }
  }, []);

  const refreshUserData = async () => {
    if (user) {
      const result = await getUserData(user.uid);
      if (result.success) {
        setUserData(result.data);
        console.log('✅ User data refreshed');
      }
    }
  };

  const logout = async () => {
    try {
      await auth.signOut();
      setUser(null);
      setUserData(null);
      console.log('✅ User logged out successfully');
    } catch (error) {
      console.error('❌ Logout error:', error);
      throw error;
    }
  };

  // Memoize the context value to prevent unnecessary re-renders
  const value = useMemo(() => ({
    user,
    userData,
    loading,
    isAuthenticated: !!user,
    isAdmin: userData?.role === 'admin',
    isClient: userData?.role === 'client',
    refreshUserData,
    logout
  }), [user, userData, loading]);

  return (
    <AuthContext.Provider value={value}>
      <NotificationProvider user={user} userData={userData}>
        {children}
      </NotificationProvider>
    </AuthContext.Provider>
  );
};

// Custom hook to use the auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;

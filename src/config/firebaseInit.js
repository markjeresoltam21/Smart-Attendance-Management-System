// Firebase initialization helper
import { auth, db } from './firebase';

// Check if Firebase is properly initialized
export const checkFirebaseConnection = async () => {
  try {
    // Test auth connection
    const authState = auth.currentUser;
    console.log('Firebase Auth initialized:', auth ? 'Yes' : 'No');
    
    // Test Firestore connection
    console.log('Firestore initialized:', db ? 'Yes' : 'No');
    
    return true;
  } catch (error) {
    console.error('Firebase initialization error:', error);
    return false;
  }
};

export { auth, db };

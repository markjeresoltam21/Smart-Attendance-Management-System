// Authentication service for user management (COMPAT API)
import { auth, db, Timestamp } from '../config/firebaseServices';

/**
 * Register a new user
 * @param {string} email - User email
 * @param {string} password - User password
 * @param {string} fullName - User's full name
 * @param {string} role - User role (admin or client)
 * @param {string} employeeId - Employee ID
 * @param {object} additionalData - Additional user data (homeAddress, contact, gender, assignedArea)
 */
export const registerUser = async (email, password, fullName, role = 'client', employeeId, additionalData = {}) => {
  try {
    // Create user in Firebase Auth
    const userCredential = await auth.createUserWithEmailAndPassword(email, password);
    const user = userCredential.user;

    // Create user document in Firestore
    await db.collection('users').doc(user.uid).set({
      uid: user.uid,
      email: email,
      fullName: fullName,
      role: role,
      employeeId: employeeId,
      homeAddress: additionalData.homeAddress || '',
      contact: additionalData.contact || '',
      gender: additionalData.gender || 'male',
      assignedArea: additionalData.assignedArea || '',
      createdAt: Timestamp.now(),
      isActive: true
    });

    return { success: true, user };
  } catch (error) {
    console.error('Registration error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Login user
 * @param {string} email - User email
 * @param {string} password - User password
 */
export const loginUser = async (email, password) => {
  try {
    const userCredential = await auth.signInWithEmailAndPassword(email, password);
    const user = userCredential.user;

    // Get user data from Firestore
    const userDoc = await db.collection('users').doc(user.uid).get();
    
    if (!userDoc.exists) {
      throw new Error('User data not found');
    }

    const userData = userDoc.data();

    return { 
      success: true, 
      user: {
        ...user,
        ...userData
      }
    };
  } catch (error) {
    console.error('Login error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Logout user
 */
export const logoutUser = async () => {
  try {
    await auth.signOut();
    return { success: true };
  } catch (error) {
    console.error('Logout error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get current user data
 * @param {string} uid - User ID
 */
export const getUserData = async (uid) => {
  try {
    const userDoc = await db.collection('users').doc(uid).get();
    
    if (!userDoc.exists) {
      throw new Error('User not found');
    }

    return { success: true, data: { id: userDoc.id, ...userDoc.data() } };
  } catch (error) {
    console.error('Get user data error:', error);
    return { success: false, error: error.message };
  }
};

// User management service for CRUD operations (COMPAT API)
import { db, Timestamp } from '../config/firebaseServices';

/**
 * Get all users (Admin only)
 */
export const getAllUsers = async () => {
  try {
    const usersSnapshot = await db.collection('users').get();
    const users = usersSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    return { success: true, data: users };
  } catch (error) {
    console.error('Get all users error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get user by ID
 * @param {string} userId - User ID
 */
export const getUserById = async (userId) => {
  try {
    const userDoc = await db.collection('users').doc(userId).get();
    
    if (!userDoc.exists) {
      throw new Error('User not found');
    }

    return { 
      success: true, 
      data: { id: userDoc.id, ...userDoc.data() } 
    };
  } catch (error) {
    console.error('Get user by ID error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Update user data
 * @param {string} userId - User ID
 * @param {object} updates - Data to update
 */
export const updateUser = async (userId, updates) => {
  try {
    const userRef = db.collection('users').doc(userId);
    const userDoc = await userRef.get();
    
    if (!userDoc.exists) {
      throw new Error('User document does not exist');
    }
    
    // Update existing document only
    await userRef.update({
      ...updates,
      updatedAt: Timestamp.now()
    });
    
    return { success: true };
  } catch (error) {
    console.error('Update user error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Delete user
 * @param {string} userId - User ID
 */
export const deleteUser = async (userId) => {
  try {
    await db.collection('users').doc(userId).delete();
    return { success: true };
  } catch (error) {
    console.error('Delete user error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get users by role
 * @param {string} role - User role (admin or client)
 */
export const getUsersByRole = async (role) => {
  try {
    const querySnapshot = await db.collection('users').where('role', '==', role).get();
    
    const users = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    return { success: true, data: users };
  } catch (error) {
    console.error('Get users by role error:', error);
    return { success: false, error: error.message };
  }
};

// Export as default object for easier imports
export const userService = {
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  getUsersByRole
};
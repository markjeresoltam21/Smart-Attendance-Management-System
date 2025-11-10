// Attendance service for CRUD operations (COMPAT API)
import { db, Timestamp } from '../config/firebaseServices';

/**
 * Mark attendance
 * @param {string} userId - User ID
 * @param {string} userName - User name
 * @param {string} status - Attendance status (present, absent, late)
 * @param {Date} customDate - Optional custom date for attendance
 */
export const markAttendance = async (userId, userName, status = 'present', customDate = null) => {
  try {
    const date = customDate || new Date();
    const dateString = date.toISOString().split('T')[0]; // YYYY-MM-DD
    const attendanceId = `${userId}_${dateString}`;

    // Check if attendance already marked for this date
    const existingDoc = await db.collection('attendance').doc(attendanceId).get();
    
    if (existingDoc.exists) {
      return { 
        success: false, 
        error: 'Attendance already marked for this date' 
      };
    }

    // Create attendance record with custom or current date
    await db.collection('attendance').doc(attendanceId).set({
      userId: userId,
      userName: userName,
      status: status,
      date: dateString,
      timestamp: Timestamp.fromDate(date),
      checkInTime: date.toLocaleTimeString(),
      createdAt: Timestamp.now()
    });

    return { success: true, message: 'Attendance marked successfully' };
  } catch (error) {
    console.error('Mark attendance error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get attendance records for a user
 * @param {string} userId - User ID
 */
export const getUserAttendance = async (userId) => {
  try {
    const querySnapshot = await db.collection('attendance')
      .where('userId', '==', userId)
      .get();
    
    const attendance = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // Sort by date in JavaScript to avoid needing a composite index
    attendance.sort((a, b) => {
      const dateA = a.date ? new Date(a.date) : (a.timestamp?.toDate ? a.timestamp.toDate() : new Date(0));
      const dateB = b.date ? new Date(b.date) : (b.timestamp?.toDate ? b.timestamp.toDate() : new Date(0));
      return dateB - dateA; // Descending order (newest first)
    });

    return { success: true, data: attendance };
  } catch (error) {
    console.error('Get user attendance error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get all attendance records (Admin only)
 */
export const getAllAttendance = async () => {
  try {
    const querySnapshot = await db.collection('attendance')
      .orderBy('date', 'desc')
      .get();
    
    const attendance = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    return { success: true, data: attendance };
  } catch (error) {
    console.error('Get all attendance error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get attendance by date
 * @param {string} date - Date in YYYY-MM-DD format
 */
export const getAttendanceByDate = async (date) => {
  try {
    const querySnapshot = await db.collection('attendance')
      .where('date', '==', date)
      .get();
    
    const attendance = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    return { success: true, data: attendance };
  } catch (error) {
    console.error('Get attendance by date error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Update attendance record
 * @param {string} attendanceId - Attendance record ID
 * @param {object} updates - Data to update
 */
export const updateAttendance = async (attendanceId, updates) => {
  try {
    await db.collection('attendance').doc(attendanceId).update({
      ...updates,
      updatedAt: Timestamp.now()
    });

    return { success: true, message: 'Attendance updated successfully' };
  } catch (error) {
    console.error('Update attendance error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Delete attendance record
 * @param {string} attendanceId - Attendance record ID
 */
export const deleteAttendance = async (attendanceId) => {
  try {
    await db.collection('attendance').doc(attendanceId).delete();
    return { success: true, message: 'Attendance deleted successfully' };
  } catch (error) {
    console.error('Delete attendance error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get today's attendance status for a user
 * @param {string} userId - User ID
 */
export const getTodayAttendance = async (userId) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const attendanceId = `${userId}_${today}`;
    
    const attendanceDoc = await db.collection('attendance').doc(attendanceId).get();
    
    if (!attendanceDoc.exists) {
      return { success: true, marked: false, data: null };
    }

    return { 
      success: true, 
      marked: true, 
      data: { id: attendanceDoc.id, ...attendanceDoc.data() } 
    };
  } catch (error) {
    console.error('Get today attendance error:', error);
    return { success: false, error: error.message };
  }
};

// Export as default object for easier imports
export const attendanceService = {
  markAttendance,
  getUserAttendance,
  getAllAttendance,
  getAttendanceByDate,
  updateAttendance,
  deleteAttendance,
  getTodayAttendance
};

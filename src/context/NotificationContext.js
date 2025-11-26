// Notification Context for managing real-time notifications
import React, { createContext, useContext, useState, useEffect } from 'react';
import { db } from '../config/firebaseServices';

const NotificationContext = createContext();

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children, user, userData }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [lastChecked, setLastChecked] = useState(null);

  useEffect(() => {
    if (!user || !userData) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    // Load last checked timestamp from Firestore
    loadLastChecked();

    // Subscribe to notifications based on user role
    let unsubscribe;
    if (userData.role === 'admin') {
      unsubscribe = subscribeToAttendanceNotifications();
    } else {
      unsubscribe = subscribeToAdminNotifications();
    }

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [user, userData]);

  const loadLastChecked = async () => {
    try {
      const userDoc = await db.collection('users').doc(user.uid).get();
      const data = userDoc.data();
      setLastChecked(data?.lastNotificationCheck || null);
    } catch (error) {
      console.error('Error loading last checked:', error);
    }
  };

  const subscribeToAttendanceNotifications = () => {
    // Admin: Listen to all new attendance records
    return db.collection('attendance')
      .orderBy('createdAt', 'desc')
      .limit(50)
      .onSnapshot((snapshot) => {
        const attendanceNotifications = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          attendanceNotifications.push({
            id: doc.id,
            type: 'attendance',
            userName: data.userName,
            status: data.status,
            date: data.date,
            checkInTime: data.checkInTime,
            timestamp: data.createdAt || data.timestamp,
            createdAt: data.createdAt
          });
        });

        setNotifications(attendanceNotifications);

        // Calculate unread count (records created after last check)
        if (lastChecked) {
          const lastCheckDate = lastChecked.toDate ? lastChecked.toDate() : new Date(lastChecked);
          const unread = attendanceNotifications.filter(notif => {
            const notifDate = notif.createdAt?.toDate 
              ? notif.createdAt.toDate() 
              : new Date(notif.timestamp);
            return notifDate > lastCheckDate;
          });
          setUnreadCount(unread.length);
        } else {
          setUnreadCount(attendanceNotifications.length);
        }
      }, (error) => {
        console.error('Error subscribing to attendance:', error);
      });
  };

  const subscribeToAdminNotifications = () => {
    // Client: Listen to notifications addressed to them
    // Note: We only filter by recipientId and sort client-side to avoid composite index
    return db.collection('notifications')
      .where('recipientId', '==', user.uid)
      .onSnapshot((snapshot) => {
        const adminNotifications = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          adminNotifications.push({
            id: doc.id,
            type: data.type || 'message',
            title: data.title,
            message: data.message,
            timestamp: data.createdAt,
            createdAt: data.createdAt,
            from: data.from || 'Admin',
            isRead: data.isRead
          });
        });

        // Sort by createdAt client-side (descending - newest first)
        adminNotifications.sort((a, b) => {
          const aDate = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt);
          const bDate = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
          return bDate - aDate;
        });

        // Filter unread notifications
        const unreadNotifications = adminNotifications.filter(n => n.isRead === false);

        setNotifications(adminNotifications);
        setUnreadCount(unreadNotifications.length);
      }, (error) => {
        console.error('Error subscribing to notifications:', error);
      });
  };

  const markAsChecked = async () => {
    try {
      const now = new Date();
      await db.collection('users').doc(user.uid).update({
        lastNotificationCheck: now
      });
      setLastChecked(now);
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking notifications as checked:', error);
    }
  };

  const markNotificationAsRead = async (notificationId) => {
    try {
      // For client notifications from admin
      await db.collection('notifications').doc(notificationId).update({
        isRead: true
      });
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const sendNotificationToClient = async (recipientId, title, message) => {
    try {
      await db.collection('notifications').add({
        recipientId,
        type: 'admin_message',
        title,
        message,
        from: userData.fullName || 'Admin',
        fromId: user.uid,
        isRead: false,
        createdAt: new Date()
      });
      return { success: true };
    } catch (error) {
      console.error('Error sending notification:', error);
      return { success: false, error: error.message };
    }
  };

  const value = {
    notifications,
    unreadCount,
    markAsChecked,
    markNotificationAsRead,
    sendNotificationToClient
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export default NotificationContext;

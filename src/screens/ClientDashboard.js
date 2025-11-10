// Client Dashboard Screen
import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Alert,
  TouchableOpacity,
  Modal,
  Image,
  Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BarChart } from 'react-native-chart-kit';
import { theme } from '../config/theme';
import Card from '../components/Card';
import Button from '../components/Button';
import TextInput from '../components/TextInput';
import LoadingSpinner from '../components/LoadingSpinner';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { markAttendance, getUserAttendance, getTodayAttendance, updateAttendance, deleteAttendance } from '../services/attendanceService';
import { logoutUser } from '../services/authService';
import notificationService from '../services/notificationService';

const ClientDashboard = ({ navigation }) => {
  const { user, userData } = useAuth();
  const { notifications, unreadCount, markAsChecked, markNotificationAsRead } = useNotifications();
  const [attendance, setAttendance] = useState([]);
  const [todayMarked, setTodayMarked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [markingAttendance, setMarkingAttendance] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [notificationModalVisible, setNotificationModalVisible] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard' or 'history'
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [editStatus, setEditStatus] = useState('present');

  const screenWidth = Dimensions.get('window').width;

  useEffect(() => {
    loadData();
    setupNotifications();
  }, []);

  const setupNotifications = async () => {
    try {
      // Push notifications are disabled for Expo Go (SDK 51+)
      // To enable push notifications, build with EAS Build or create a development build
      // See: https://docs.expo.dev/develop/development-builds/introduction/
      
      console.log('⚠️ Push notifications disabled in Expo Go. Use development build for full functionality.');
      
      /* UNCOMMENT THIS CODE WHEN USING DEVELOPMENT BUILD OR PRODUCTION BUILD
      // Request notification permissions
      const permissionResult = await notificationService.registerForPushNotifications();
      
      if (permissionResult.success) {
        console.log('✅ Notification permissions granted');
        
        // Save push token to user document
        if (permissionResult.token) {
          await notificationService.savePushToken(user.uid, permissionResult.token);
        }
        
        // Schedule daily attendance reminder
        const scheduleResult = await notificationService.scheduleAttendanceReminder();
        if (scheduleResult.success) {
          console.log('✅ Daily attendance reminder scheduled');
        }
      } else {
        console.log('⚠️ Notification permissions denied');
      }
      */
    } catch (error) {
      console.error('❌ Error setting up notifications:', error);
    }
  };

  const loadData = async () => {
    await Promise.all([checkTodayAttendance(), fetchAttendance()]);
    setLoading(false);
  };

  const checkTodayAttendance = async () => {
    const result = await getTodayAttendance(user.uid);
    if (result.success) {
      setTodayMarked(result.marked);
    }
  };

  const fetchAttendance = async () => {
    const result = await getUserAttendance(user.uid);
    if (result.success) {
      setAttendance(result.data);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleMarkAttendance = async () => {
    setMarkingAttendance(true);
    const result = await markAttendance(user.uid, userData.fullName, 'present');
    setMarkingAttendance(false);

    if (result.success) {
      Alert.alert('Success', result.message);
      setTodayMarked(true);
      await fetchAttendance();
      
      // Send confirmation notification
      await notificationService.sendImmediateNotification(
        '✅ Attendance Marked',
        'Your attendance has been successfully recorded for today!'
      );
    } else {
      Alert.alert('Error', result.error);
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            setShowProfileMenu(false);
            // Cancel all scheduled notifications before logout
            await notificationService.cancelAllNotifications();
            await logoutUser();
          }
        }
      ]
    );
  };

  const handleProfile = () => {
    setShowProfileMenu(false);
    navigation.navigate('Profile');
  };

  const handleEditAttendance = (record) => {
    setEditItem(record);
    setEditStatus(record.status);
    setEditModalVisible(true);
  };

  const handleSaveEdit = async () => {
    try {
      await updateAttendance(editItem.id, { status: editStatus });
      Alert.alert('Success', 'Attendance updated successfully');
      setEditModalVisible(false);
      await fetchAttendance();
    } catch (error) {
      Alert.alert('Error', 'Failed to update attendance');
    }
  };

  const handleDeleteAttendance = (recordId) => {
    Alert.alert(
      'Delete Attendance',
      'Are you sure you want to delete this attendance record?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const result = await deleteAttendance(recordId);
            if (result.success) {
              Alert.alert('Success', 'Attendance deleted successfully');
              await fetchAttendance();
              await checkTodayAttendance();
            } else {
              Alert.alert('Error', result.error);
            }
          }
        }
      ]
    );
  };

  // Calculate chart data for last 7 days
  const chartData = useMemo(() => {
    const last7Days = [];
    const today = new Date();
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      last7Days.push({
        date: dateStr,
        label: date.toLocaleDateString('en-US', { weekday: 'short' }),
        present: 0,
        absent: 0
      });
    }

    // Count present/absent for each day
    attendance.forEach(record => {
      const recordDate = record.date ? record.date.split('T')[0] : '';
      const dayData = last7Days.find(d => d.date === recordDate);
      if (dayData) {
        if (record.status === 'present' || record.status === 'late') {
          dayData.present = 1;
        } else if (record.status === 'absent') {
          dayData.absent = 1;
        }
      }
    });

    return {
      labels: last7Days.map(d => d.label),
      datasets: [
        {
          data: last7Days.map(d => d.present),
          color: (opacity = 1) => `rgba(46, 204, 113, ${opacity})`, // Green for present
          strokeWidth: 2
        },
        {
          data: last7Days.map(d => d.absent),
          color: (opacity = 1) => `rgba(231, 76, 60, ${opacity})`, // Red for absent
          strokeWidth: 2
        }
      ],
      legend: ['Present', 'Absent']
    };
  }, [attendance]);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'present':
        return theme.colors.success;
      case 'absent':
        return theme.colors.danger;
      case 'late':
        return theme.colors.warning;
      default:
        return theme.colors.textLight;
    }
  };

  if (loading) {
    return <LoadingSpinner message="Loading dashboard..." />;
  }

  return (
    <View style={styles.container}>
      {/* Header with Profile Button */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Welcome, {userData?.fullName}!</Text>
          <Text style={styles.subtitle}>Employee ID: {userData?.employeeId}</Text>
        </View>
        
        <View style={styles.headerRight}>
          {/* Notification Button */}
          <TouchableOpacity 
            style={styles.notificationButton}
            onPress={() => {
              setNotificationModalVisible(true);
              markAsChecked();
            }}
          >
            <Ionicons name="notifications-outline" size={28} color={theme.colors.white} />
            {unreadCount > 0 && (
              <View style={styles.notificationBadge}>
                <Text style={styles.notificationBadgeText}>
                  {unreadCount > 99 ? '99+' : unreadCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>
          
          {/* Profile Button */}
          <TouchableOpacity 
            style={styles.profileButton}
            onPress={() => setShowProfileMenu(true)}
          >
            {userData?.profileImage ? (
              <Image 
                source={{ uri: userData.profileImage }} 
                style={styles.profileImage}
              />
            ) : (
              <Ionicons name="person-circle" size={40} color={theme.colors.white} />
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Notification Modal */}
      <Modal
        visible={notificationModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setNotificationModalVisible(false)}
      >
        <View style={styles.notificationModalOverlay}>
          <View style={styles.notificationModalContent}>
            <View style={styles.notificationModalHeader}>
              <View style={styles.modalTitleContainer}>
                <Ionicons name="notifications" size={24} color={theme.colors.primary} />
                <Text style={styles.notificationModalTitle}>Notifications from Admin</Text>
              </View>
              <TouchableOpacity onPress={() => setNotificationModalVisible(false)}>
                <Ionicons name="close" size={28} color="#333" />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.notificationList}>
              {notifications.length === 0 ? (
                <View style={styles.emptyNotifications}>
                  <Ionicons name="checkmark-circle-outline" size={64} color="#ccc" />
                  <Text style={styles.emptyNotificationsText}>All caught up!</Text>
                  <Text style={styles.emptyNotificationsSubtext}>No new notifications</Text>
                </View>
              ) : (
                notifications.map((notif, index) => (
                  <TouchableOpacity
                    key={notif.id || index}
                    style={styles.notificationItem}
                    onPress={async () => {
                      if (notif.id) {
                        await markNotificationAsRead(notif.id);
                      }
                    }}
                  >
                    <View style={styles.notificationIconContainer}>
                      <Ionicons name="mail" size={32} color={theme.colors.primary} />
                    </View>
                    <View style={styles.notificationContent}>
                      <Text style={styles.notificationTitle}>{notif.title}</Text>
                      <Text style={styles.notificationMessage}>{notif.message}</Text>
                      <Text style={styles.notificationFrom}>From: {notif.from}</Text>
                      <Text style={styles.notificationTime}>
                        {notif.timestamp?.toDate 
                          ? notif.timestamp.toDate().toLocaleString()
                          : new Date().toLocaleString()
                        }
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>
            
            <TouchableOpacity 
              style={styles.closeNotificationButton} 
              onPress={() => setNotificationModalVisible(false)}
            >
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Profile Menu Modal */}
      <Modal
        visible={showProfileMenu}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowProfileMenu(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowProfileMenu(false)}
        >
          <View style={styles.profileMenu}>
            <TouchableOpacity 
              style={styles.menuItem}
              onPress={handleProfile}
            >
              <Ionicons name="person" size={24} color={theme.colors.text} />
              <Text style={styles.menuText}>Profile</Text>
            </TouchableOpacity>
            
            <View style={styles.menuDivider} />
            
            <TouchableOpacity 
              style={styles.menuItem}
              onPress={handleLogout}
            >
              <Ionicons name="log-out" size={24} color={theme.colors.danger} />
              <Text style={[styles.menuText, { color: theme.colors.danger }]}>Logout</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {activeTab === 'dashboard' ? (
          // Dashboard View
          <>
            <Card>
              <View style={styles.statsHeader}>
                <View style={styles.cardHeader}>
                  <Ionicons name="stats-chart" size={24} color={theme.colors.primary} />
                  <Text style={styles.cardTitle}>My Statistics</Text>
                </View>
              </View>
              <View style={styles.statsContainer}>
                <View style={styles.statItem}>
                  <View style={[styles.statIconContainer, { backgroundColor: theme.colors.primary + '20' }]}>
                    <Ionicons name="calendar" size={28} color={theme.colors.primary} />
                  </View>
                  <Text style={styles.statNumber}>{attendance.length}</Text>
                  <Text style={styles.statLabel}>Total Days</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <View style={[styles.statIconContainer, { backgroundColor: theme.colors.success + '20' }]}>
                    <Ionicons name="checkmark-circle" size={28} color={theme.colors.success} />
                  </View>
                  <Text style={[styles.statNumber, { color: theme.colors.success }]}>
                    {attendance.filter(a => a.status === 'present' || a.status === 'late').length}
                  </Text>
                  <Text style={styles.statLabel}>Present</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <View style={[styles.statIconContainer, { backgroundColor: theme.colors.danger + '20' }]}>
                    <Ionicons name="close-circle" size={28} color={theme.colors.danger} />
                  </View>
                  <Text style={[styles.statNumber, { color: theme.colors.danger }]}>
                    {attendance.filter(a => a.status === 'absent').length}
                  </Text>
                  <Text style={styles.statLabel}>Absent</Text>
                </View>
              </View>
            </Card>

            <Card style={styles.attendanceCard}>
              <View style={styles.cardHeader}>
                <Ionicons name="location" size={24} color={theme.colors.primary} />
                <Text style={styles.cardTitle}>Mark Attendance</Text>
              </View>
              <Text style={styles.dateText}>
                {new Date().toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </Text>
          
          {todayMarked ? (
            <View style={styles.markedContainer}>
              <Ionicons name="checkmark-circle" size={24} color={theme.colors.success} />
              <Text style={styles.markedText}>Attendance marked for today</Text>
            </View>
          ) : (
            <Button
              title="Mark Present"
              onPress={handleMarkAttendance}
              loading={markingAttendance}
              variant="secondary"
              style={styles.markButton}
            />
          )}
        </Card>

        <Card>
          <View style={styles.cardHeader}>
            <Ionicons name="bar-chart" size={24} color={theme.colors.primary} />
            <Text style={styles.cardTitle}>Daily Attendance (Last 7 Days)</Text>
          </View>
          
          {attendance.length > 0 ? (
            <View style={styles.chartContainer}>
              <BarChart
                data={chartData}
                width={screenWidth - 64}
                height={220}
                chartConfig={{
                  backgroundColor: '#ffffff',
                  backgroundGradientFrom: '#ffffff',
                  backgroundGradientTo: '#ffffff',
                  decimalPlaces: 0,
                  color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                  labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                  style: {
                    borderRadius: 16
                  },
                  propsForLabels: {
                    fontSize: 12
                  },
                  fillShadowGradient: theme.colors.success,
                  fillShadowGradientOpacity: 1
                }}
                style={styles.chart}
                fromZero
                showBarTops={false}
                withInnerLines={true}
                segments={1}
              />
              <View style={styles.legendContainer}>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: 'rgba(46, 204, 113, 1)' }]} />
                  <Text style={styles.legendText}>Present</Text>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: 'rgba(231, 76, 60, 1)' }]} />
                  <Text style={styles.legendText}>Absent</Text>
                </View>
              </View>
            </View>
          ) : (
            <Text style={styles.emptyText}>No attendance data yet</Text>
          )}
        </Card>

        <Card>
          <View style={styles.cardHeader}>
            <Ionicons name="time" size={24} color={theme.colors.primary} />
            <Text style={styles.cardTitle}>Recent Activity</Text>
          </View>
          {attendance.length === 0 ? (
            <Text style={styles.emptyText}>No attendance records yet</Text>
          ) : (
            <View style={styles.historyList}>
              {attendance.slice(0, 5).map((record) => (
                <View key={record.id} style={styles.historyItem}>
                  <View style={styles.historyIconContainer}>
                    <Ionicons 
                      name={record.status === 'present' ? 'checkmark-circle' : record.status === 'late' ? 'time' : 'close-circle'} 
                      size={24} 
                      color={getStatusColor(record.status)} 
                    />
                  </View>
                  <View style={styles.historyContent}>
                    <Text style={styles.historyDate}>
                      {formatDate(record.date)}
                    </Text>
                    <Text style={styles.historyTime}>
                      {record.checkInTime || 'N/A'}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.statusBadge,
                      { backgroundColor: getStatusColor(record.status) }
                    ]}
                  >
                    <Text style={styles.statusText}>
                      {record.status.toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.actionButtons}>
                    <TouchableOpacity 
                      onPress={() => handleEditAttendance(record)}
                      style={styles.actionButton}
                    >
                      <Ionicons name="create-outline" size={20} color={theme.colors.primary} />
                    </TouchableOpacity>
                    <TouchableOpacity 
                      onPress={() => handleDeleteAttendance(record.id)}
                      style={styles.actionButton}
                    >
                      <Ionicons name="trash-outline" size={20} color={theme.colors.danger} />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          )}
        </Card>
      </>
        ) : (
          // History View
          <Card>
            <View style={styles.cardHeader}>
              <Ionicons name="list" size={24} color={theme.colors.primary} />
              <Text style={styles.cardTitle}>Attendance History</Text>
            </View>
            <Text style={styles.statsText}>
              Total Days: {attendance.length}
            </Text>

            {attendance.length === 0 ? (
              <Text style={styles.emptyText}>No attendance records yet</Text>
            ) : (
              <View style={styles.historyList}>
                {attendance.map((record) => (
                  <View key={record.id} style={styles.historyItem}>
                    <View style={styles.historyIconContainer}>
                      <Ionicons 
                        name={record.status === 'present' ? 'checkmark-circle' : record.status === 'late' ? 'time' : 'close-circle'} 
                        size={24} 
                        color={getStatusColor(record.status)} 
                      />
                    </View>
                    <View style={styles.historyContent}>
                      <Text style={styles.historyDate}>
                        {formatDate(record.date)}
                      </Text>
                      <Text style={styles.historyTime}>
                        {record.checkInTime || 'N/A'}
                      </Text>
                    </View>
                    <View
                      style={[
                        styles.statusBadge,
                        { backgroundColor: getStatusColor(record.status) }
                      ]}
                    >
                      <Text style={styles.statusText}>
                        {record.status.toUpperCase()}
                      </Text>
                    </View>
                    <View style={styles.actionButtons}>
                      <TouchableOpacity 
                        onPress={() => handleEditAttendance(record)}
                        style={styles.actionButton}
                      >
                        <Ionicons name="create-outline" size={20} color={theme.colors.primary} />
                      </TouchableOpacity>
                      <TouchableOpacity 
                        onPress={() => handleDeleteAttendance(record.id)}
                        style={styles.actionButton}
                      >
                        <Ionicons name="trash-outline" size={20} color={theme.colors.danger} />
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </Card>
        )}
      </ScrollView>

      {/* Edit Attendance Modal */}
      <Modal visible={editModalVisible} transparent={true} animationType="slide" onRequestClose={() => setEditModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Attendance</Text>
              <TouchableOpacity onPress={() => setEditModalVisible(false)}>
                <Ionicons name="close" size={28} color="#333" />
              </TouchableOpacity>
            </View>
            
            <Text style={styles.inputLabel}>Status</Text>
            <View style={styles.statusButtons}>
              <TouchableOpacity 
                style={[styles.statusButton, editStatus === 'present' && styles.statusButtonActive]} 
                onPress={() => setEditStatus('present')}
              >
                <Ionicons name="checkmark-circle" size={20} color={editStatus === 'present' ? '#fff' : theme.colors.success} />
                <Text style={[styles.statusButtonText, editStatus === 'present' && styles.statusButtonTextActive]}>Present</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.statusButton, editStatus === 'absent' && styles.statusButtonActive]} 
                onPress={() => setEditStatus('absent')}
              >
                <Ionicons name="close-circle" size={20} color={editStatus === 'absent' ? '#fff' : theme.colors.danger} />
                <Text style={[styles.statusButtonText, editStatus === 'absent' && styles.statusButtonTextActive]}>Absent</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.statusButton, editStatus === 'late' && styles.statusButtonActive]} 
                onPress={() => setEditStatus('late')}
              >
                <Ionicons name="time" size={20} color={editStatus === 'late' ? '#fff' : theme.colors.warning} />
                <Text style={[styles.statusButtonText, editStatus === 'late' && styles.statusButtonTextActive]}>Late</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.saveButton} onPress={handleSaveEdit}>
              <Text style={styles.saveButtonText}>Save Changes</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Bottom Navigation Bar */}
      <View style={styles.bottomNav}>
        <TouchableOpacity 
          style={styles.navItem}
          onPress={() => setActiveTab('dashboard')}
        >
          <Ionicons 
            name={activeTab === 'dashboard' ? 'grid' : 'grid-outline'} 
            size={28} 
            color={activeTab === 'dashboard' ? theme.colors.primary : theme.colors.textLight} 
          />
          <Text style={[
            styles.navText,
            activeTab === 'dashboard' && styles.navTextActive
          ]}>Dashboard</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.navItem}
          onPress={() => setActiveTab('history')}
        >
          <Ionicons 
            name={activeTab === 'history' ? 'time' : 'time-outline'} 
            size={28} 
            color={activeTab === 'history' ? theme.colors.primary : theme.colors.textLight} 
          />
          <Text style={[
            styles.navText,
            activeTab === 'history' && styles.navTextActive
          ]}>History</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background
  },
  header: {
    backgroundColor: theme.colors.primary,
    padding: theme.spacing.lg,
    paddingTop: theme.spacing.xl + 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12
  },
  notificationButton: {
    padding: theme.spacing.xs,
    marginRight: 8,
    position: 'relative'
  },
  notificationBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: '#f44336',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4
  },
  notificationBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: 'bold'
  },
  profileButton: {
    padding: theme.spacing.xs
  },
  profileImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: theme.colors.white
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    paddingTop: 60,
    paddingRight: theme.spacing.md
  },
  profileMenu: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.sm,
    minWidth: 180,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.md,
    gap: theme.spacing.md
  },
  menuText: {
    fontSize: theme.fontSize.md,
    color: theme.colors.text,
    fontWeight: theme.fontWeight.medium
  },
  menuDivider: {
    height: 1,
    backgroundColor: theme.colors.border,
    marginVertical: theme.spacing.xs
  },
  greeting: {
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.white,
    marginBottom: theme.spacing.xs
  },
  subtitle: {
    fontSize: theme.fontSize.md,
    color: theme.colors.white,
    opacity: 0.9
  },
  content: {
    flex: 1,
    padding: theme.spacing.md
  },
  attendanceCard: {
    backgroundColor: theme.colors.cardBackground
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: theme.spacing.sm
  },
  cardTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text
  },
  dateText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textLight,
    marginBottom: theme.spacing.md
  },
  markButton: {
    marginTop: theme.spacing.sm
  },
  markedContainer: {
    backgroundColor: theme.colors.success + '20',
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: theme.spacing.sm
  },
  markedText: {
    color: theme.colors.success,
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold
  },
  chartContainer: {
    alignItems: 'center',
    marginTop: theme.spacing.md
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16
  },
  legendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
    marginTop: theme.spacing.md
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6
  },
  legendText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text
  },
  statsHeader: {
    marginBottom: theme.spacing.sm
  },
  statsText: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textLight,
    marginBottom: theme.spacing.md
  },
  emptyText: {
    textAlign: 'center',
    color: theme.colors.textLight,
    fontSize: theme.fontSize.md,
    marginVertical: theme.spacing.lg
  },
  historyList: {
    marginTop: theme.spacing.sm
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    gap: 12
  },
  historyIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.background,
    justifyContent: 'center',
    alignItems: 'center'
  },
  historyContent: {
    flex: 1
  },
  historyLeft: {
    flex: 1
  },
  historyDate: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.text
  },
  historyTime: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textLight,
    marginTop: 2
  },
  statusBadge: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 6,
    borderRadius: theme.borderRadius.sm,
    minWidth: 70,
    alignItems: 'center'
  },
  statusText: {
    color: theme.colors.white,
    fontSize: theme.fontSize.xs,
    fontWeight: theme.fontWeight.bold
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8
  },
  actionButton: {
    padding: 6,
    borderRadius: 6,
    backgroundColor: theme.colors.background
  },
  inputLabel: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
    marginTop: theme.spacing.md
  },
  statusButtons: {
    flexDirection: 'row',
    gap: 8,
    marginTop: theme.spacing.sm
  },
  statusButton: {
    flex: 1,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6
  },
  statusButtonActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary
  },
  statusButtonText: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text
  },
  statusButtonTextActive: {
    color: theme.colors.white
  },
  saveButton: {
    backgroundColor: theme.colors.primary,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    marginTop: theme.spacing.xl
  },
  saveButtonText: {
    color: theme.colors.white,
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.bold
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    width: '90%',
    maxWidth: 400
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333'
  },
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: theme.colors.white,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    paddingBottom: theme.spacing.sm,
    paddingTop: theme.spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 8
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.xs
  },
  navText: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textLight,
    marginTop: 4,
    fontWeight: theme.fontWeight.medium
  },
  navTextActive: {
    color: theme.colors.primary,
    fontWeight: theme.fontWeight.bold
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: theme.spacing.lg,
    marginTop: theme.spacing.sm
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    gap: 8
  },
  statIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4
  },
  statNumber: {
    fontSize: 28,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.primary
  },
  statLabel: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textLight,
    textAlign: 'center'
  },
  statDivider: {
    width: 1,
    height: 60,
    backgroundColor: theme.colors.border
  },
  notificationModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  notificationModalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    width: '90%',
    maxWidth: 400,
    maxHeight: '80%'
  },
  notificationModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20
  },
  modalTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  notificationModalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333'
  },
  notificationList: {
    maxHeight: 400
  },
  emptyNotifications: {
    alignItems: 'center',
    padding: 40
  },
  emptyNotificationsText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#999',
    marginTop: 16
  },
  emptyNotificationsSubtext: {
    fontSize: 14,
    color: '#ccc',
    marginTop: 4
  },
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    marginBottom: 8
  },
  notificationIconContainer: {
    marginRight: 12,
    marginTop: 4
  },
  notificationContent: {
    flex: 1
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333'
  },
  notificationMessage: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
    lineHeight: 20
  },
  notificationFrom: {
    fontSize: 12,
    color: theme.colors.primary,
    marginTop: 6,
    fontWeight: '600'
  },
  notificationTime: {
    fontSize: 11,
    color: '#999',
    marginTop: 4
  },
  closeNotificationButton: {
    backgroundColor: theme.colors.primary,
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold'
  },
});

export default ClientDashboard;

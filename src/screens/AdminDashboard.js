import * as React from 'react';
import { useState, useEffect, useContext } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, TextInput, Modal, ActivityIndicator, Platform, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AuthContext } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { theme } from '../config/theme';
import { userService } from '../services/userService';
import { attendanceService } from '../services/attendanceService';
import { registerUser } from '../services/authService';
import { Dimensions } from 'react-native';
import { PieChart } from 'react-native-chart-kit';
import * as Print from 'expo-print';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import DateTimePicker from '@react-native-community/datetimepicker';

const screenWidth = Dimensions.get('window').width;

const AdminDashboard = ({ navigation }) => {
  const { user, userData, logout } = useContext(AuthContext);
  const { notifications, unreadCount, markAsChecked } = useNotifications();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [users, setUsers] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ totalUsers: 0, presentToday: 0, totalRecords: 0, clientUsers: 0, attendanceRate: 0, absentToday: 0 });
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [addAttendanceModalVisible, setAddAttendanceModalVisible] = useState(false);
  const [addUserModalVisible, setAddUserModalVisible] = useState(false);
  const [notificationModalVisible, setNotificationModalVisible] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [editType, setEditType] = useState('');
  const [editItem, setEditItem] = useState(null);
  const [editForm, setEditForm] = useState({});
  
  // Add user form states
  const [newUserForm, setNewUserForm] = useState({
    fullName: '',
    email: '',
    password: '',
    employeeId: '',
    role: 'client',
    homeAddress: '',
    contactNumber: '',
    gender: 'male',
    assignedArea: ''
  });
  
  // Date filter states
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [filteredAttendance, setFilteredAttendance] = useState([]);
  
  // Add attendance states
  const [selectedUser, setSelectedUser] = useState(null);
  const [attendanceStatus, setAttendanceStatus] = useState('present');
  const [attendanceDate, setAttendanceDate] = useState(new Date());
  const [showAttendanceDatePicker, setShowAttendanceDatePicker] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    filterAttendanceByDate();
  }, [selectedDate, attendance]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [usersResult, attendanceResult] = await Promise.all([
        userService.getAllUsers(), 
        attendanceService.getAllAttendance()
      ]);
      
      const usersData = usersResult?.success ? usersResult.data : [];
      const attendanceData = attendanceResult?.success ? attendanceResult.data : [];
      
      console.log('📊 Loaded users:', usersData.length);
      console.log('📊 Loaded attendance:', attendanceData.length);
      
      // Sort attendance from newest to oldest
      const sortedAttendance = attendanceData.sort((a, b) => {
        const dateA = a.date ? new Date(a.date) : (a.timestamp?.toDate ? a.timestamp.toDate() : new Date(0));
        const dateB = b.date ? new Date(b.date) : (b.timestamp?.toDate ? b.timestamp.toDate() : new Date(0));
        return dateB - dateA; // Descending order (newest first)
      });
      
      setUsers(usersData);
      setAttendance(sortedAttendance);
      const clientCount = usersData.filter(u => u?.role === 'client').length;
      const presentToday = sortedAttendance.filter(a => a?.status === 'present' && isToday(a?.timestamp)).length;
      const absentToday = clientCount - presentToday;
      const attendanceRate = clientCount > 0 ? Math.round((presentToday / clientCount) * 100) : 0;
      setStats({ totalUsers: usersData.length, presentToday, totalRecords: sortedAttendance.length, clientUsers: clientCount, attendanceRate, absentToday });
    } catch (error) {
      console.error('❌ Error loading data:', error);
      console.error('Error details:', error.message);
      Alert.alert('Error', 'Failed to load data: ' + error.message);
      // Set empty data to prevent crashes
      setUsers([]);
      setAttendance([]);
      setStats({ totalUsers: 0, presentToday: 0, totalRecords: 0, clientUsers: 0, attendanceRate: 0, absentToday: 0 });
    } finally {
      setLoading(false);
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
            try {
              await logout();
              // Navigation will happen automatically via auth state change
            } catch (error) {
              console.error('Logout error:', error);
              Alert.alert('Error', 'Failed to logout');
            }
          }
        }
      ]
    );
  };

  const isToday = (timestamp) => {
    if (!timestamp) return false;
    const date = timestamp?.toDate ? timestamp.toDate() : new Date(timestamp);
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    try {
      const date = timestamp?.toDate ? timestamp.toDate() : new Date(timestamp);
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch (error) {
      return 'Invalid Date';
    }
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return 'N/A';
    try {
      const date = timestamp?.toDate ? timestamp.toDate() : new Date(timestamp);
      return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    } catch (error) {
      return 'N/A';
    }
  };

  const filterAttendanceByDate = () => {
    const attendanceArray = Array.isArray(attendance) ? attendance : [];
    const filtered = attendanceArray.filter(record => {
      try {
        // Handle both date string format (YYYY-MM-DD) and timestamp format
        let recordDate;
        
        if (record?.date) {
          // Date is stored as string like "2025-11-10"
          recordDate = new Date(record.date);
        } else if (record?.timestamp) {
          // Date is stored as Firestore timestamp
          recordDate = record.timestamp?.toDate ? record.timestamp.toDate() : new Date(record.timestamp);
        } else {
          return false;
        }
        
        // Compare dates (ignoring time)
        const selectedDateStr = selectedDate.toISOString().split('T')[0];
        const recordDateStr = recordDate.toISOString().split('T')[0];
        
        return selectedDateStr === recordDateStr;
      } catch (error) {
        console.error('Error filtering attendance:', error);
        return false;
      }
    });
    console.log('📅 Filtered attendance for', selectedDate.toISOString().split('T')[0], ':', filtered.length);
    setFilteredAttendance(filtered);
  };

  const onDateChange = (event, date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (date) {
      setSelectedDate(date);
    }
  };

  const onAttendanceDateChange = (event, date) => {
    setShowAttendanceDatePicker(Platform.OS === 'ios');
    if (date) {
      setAttendanceDate(date);
    }
  };

  const getHeaderTitle = () => {
    switch (activeTab) {
      case 'dashboard': return 'Admin Dashboard';
      case 'attendance': return 'Attendance Management';
      case 'users': return 'User Management';
      default: return 'Admin Dashboard';
    }
  };

  const getHeaderSubtitle = () => {
    switch (activeTab) {
      case 'dashboard': return `Welcome, ${userData?.fullName || 'Administrator'}`;
      case 'attendance': return 'Manage all attendance records';
      case 'users': return 'Manage system users';
      default: return 'System Administration';
    }
  };

  const handleEditUser = (userItem) => {
    setEditType('user');
    setEditItem(userItem);
    setEditForm({ 
      fullName: userItem.fullName, 
      employeeId: userItem.employeeId, 
      role: userItem.role,
      homeAddress: userItem.homeAddress || '',
      contact: userItem.contact || '',
      gender: userItem.gender || 'male',
      assignedArea: userItem.assignedArea || ''
    });
    setEditModalVisible(true);
  };

  const handleEditAttendance = (record) => {
    setEditType('attendance');
    setEditItem(record);
    setEditForm({ status: record.status });
    setEditModalVisible(true);
  };

  const handleSaveEdit = async () => {
    try {
      if (editType === 'user') {
        await userService.updateUser(editItem.id, editForm);
        Alert.alert('Success', 'User updated successfully');
      } else if (editType === 'attendance') {
        await attendanceService.updateAttendance(editItem.id, { status: editForm.status });
        Alert.alert('Success', 'Attendance updated successfully');
      }
      setEditModalVisible(false);
      loadData();
    } catch (error) {
      Alert.alert('Error', 'Failed to update');
    }
  };

  const handleAddAttendance = async () => {
    try {
      if (!selectedUser) {
        Alert.alert('Error', 'Please select a user');
        return;
      }

      const dateString = attendanceDate.toISOString().split('T')[0];
      const attendanceId = `${selectedUser.id}_${dateString}`;

      // Check if attendance already exists
      const existing = attendance.find(a => a.id === attendanceId);
      if (existing) {
        Alert.alert('Error', 'Attendance already marked for this user on this date');
        return;
      }

      const result = await attendanceService.markAttendance(
        selectedUser.id,
        selectedUser.fullName,
        attendanceStatus,
        attendanceDate
      );

      if (result.success) {
        Alert.alert('Success', 'Attendance added successfully');
        setAddAttendanceModalVisible(false);
        setSelectedUser(null);
        setAttendanceStatus('present');
        setAttendanceDate(new Date());
        loadData();
      } else {
        Alert.alert('Error', result.error || 'Failed to add attendance');
      }
    } catch (error) {
      console.error('Error adding attendance:', error);
      Alert.alert('Error', 'Failed to add attendance');
    }
  };

  const handleAddUser = async () => {
    try {
      // Validation
      if (!newUserForm.fullName.trim()) {
        Alert.alert('Error', 'Full name is required');
        return;
      }
      if (!newUserForm.email.trim() || !/\S+@\S+\.\S+/.test(newUserForm.email)) {
        Alert.alert('Error', 'Valid email is required');
        return;
      }
      if (!newUserForm.password || newUserForm.password.length < 6) {
        Alert.alert('Error', 'Password must be at least 6 characters');
        return;
      }
      if (!newUserForm.employeeId.trim()) {
        Alert.alert('Error', 'Employee ID is required');
        return;
      }

      // Register new user
      const result = await registerUser(
        newUserForm.email,
        newUserForm.password,
        newUserForm.fullName,
        newUserForm.role,
        newUserForm.employeeId,
        newUserForm.homeAddress,
        newUserForm.contactNumber,
        newUserForm.gender,
        newUserForm.assignedArea
      );

      if (result.success) {
        Alert.alert('Success', `New ${newUserForm.role} user created successfully`);
        setAddUserModalVisible(false);
        // Reset form
        setNewUserForm({
          fullName: '',
          email: '',
          password: '',
          employeeId: '',
          role: 'client',
          homeAddress: '',
          contactNumber: '',
          gender: 'male',
          assignedArea: ''
        });
        loadData();
      } else {
        Alert.alert('Error', result.error || 'Failed to create user');
      }
    } catch (error) {
      console.error('Error adding user:', error);
      Alert.alert('Error', 'Failed to create user');
    }
  };

  const handleDelete = (itemId, type) => {
    Alert.alert('Confirm Delete', `Are you sure you want to delete this ${type}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            if (type === 'user') {
              await userService.deleteUser(itemId);
              Alert.alert('Success', 'User deleted successfully');
            } else if (type === 'attendance') {
              await attendanceService.deleteAttendance(itemId);
              Alert.alert('Success', 'Attendance record deleted successfully');
            }
            loadData();
          } catch (error) {
            Alert.alert('Error', 'Failed to delete');
          }
        },
      },
    ]);
  };

  const generateReport = async (type) => {
    try {
      const date = new Date().toLocaleDateString();
      const time = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
      let htmlContent = '';
      
      if (type === 'attendance') {
        // Filter attendance by selected date (month and year)
        const selectedMonth = selectedDate.getMonth();
        const selectedYear = selectedDate.getFullYear();
        
        const filteredRecords = attendance.filter(record => {
          let recordDate;
          if (record.date) {
            recordDate = new Date(record.date);
          } else if (record.timestamp?.toDate) {
            recordDate = record.timestamp.toDate();
          } else if (record.timestamp) {
            recordDate = new Date(record.timestamp);
          } else {
            return false;
          }
          
          return recordDate.getMonth() === selectedMonth && 
                 recordDate.getFullYear() === selectedYear;
        });
        
        // Calculate stats for filtered records
        const filteredPresent = filteredRecords.filter(r => r.status === 'present' || r.status === 'late').length;
        const filteredAbsent = filteredRecords.filter(r => r.status === 'absent').length;
        const filteredRate = filteredRecords.length > 0 
          ? Math.round((filteredPresent / filteredRecords.length) * 100) 
          : 0;
        
        htmlContent = `
          <html>
            <head>
              <style>
                body { font-family: Arial, sans-serif; padding: 20px; }
                h1 { color: ${theme.colors.primary}; }
                table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
                th { background-color: ${theme.colors.primary}; color: white; }
                .stats { display: flex; justify-content: space-around; margin: 20px 0; }
                .stat-box { border: 1px solid #ddd; padding: 15px; border-radius: 8px; text-align: center; }
                .stat-number { font-size: 32px; font-weight: bold; color: ${theme.colors.primary}; }
                .present { color: #4CAF50; font-weight: bold; }
                .absent { color: #f44336; font-weight: bold; }
                .report-header { margin-bottom: 20px; }
                .report-date { color: #666; font-size: 14px; }
              </style>
            </head>
            <body>
              <h1>📊 Attendance Report</h1>
              <div class="report-header">
                <p class="report-date"><strong>Report Period:</strong> ${selectedDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</p>
                <p class="report-date"><strong>Generated:</strong> ${date} at ${time}</p>
              </div>
              
              <div class="stats">
                <div class="stat-box">
                  <div class="stat-number">${filteredRecords.length}</div>
                  <div>Total Records</div>
                </div>
                <div class="stat-box">
                  <div class="stat-number" style="color: #4CAF50;">${filteredPresent}</div>
                  <div>Present</div>
                </div>
                <div class="stat-box">
                  <div class="stat-number" style="color: #f44336;">${filteredAbsent}</div>
                  <div>Absent</div>
                </div>
                <div class="stat-box">
                  <div class="stat-number">${filteredRate}%</div>
                  <div>Attendance Rate</div>
                </div>
              </div>
              
              <h2>Detailed Records</h2>
              <table>
                <tr>
                  <th>#</th>
                  <th>Name</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th>Time</th>
                </tr>
                ${filteredRecords.map((record, index) => {
                  const recordDate = record.date || formatDate(record.timestamp);
                  const recordTime = record.checkInTime || formatTime(record.timestamp);
                  return `
                    <tr>
                      <td>${index + 1}</td>
                      <td>${record.userName}</td>
                      <td class="${record.status}">${record.status.toUpperCase()}</td>
                      <td>${recordDate}</td>
                      <td>${recordTime}</td>
                    </tr>
                  `;
                }).join('')}
              </table>
            </body>
          </html>
        `;
      } else if (type === 'users') {
        htmlContent = `
          <html>
            <head>
              <style>
                body { font-family: Arial, sans-serif; padding: 20px; }
                h1 { color: ${theme.colors.primary}; }
                table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
                th { background-color: ${theme.colors.primary}; color: white; }
                .stats { display: flex; justify-content: space-around; margin: 20px 0; }
                .stat-box { border: 1px solid #ddd; padding: 15px; border-radius: 8px; text-align: center; }
                .stat-number { font-size: 32px; font-weight: bold; color: ${theme.colors.primary}; }
                .admin { color: #f44336; font-weight: bold; }
                .client { color: ${theme.colors.primary}; font-weight: bold; }
              </style>
            </head>
            <body>
              <h1>👥 User Management Report</h1>
              <p><strong>Generated:</strong> ${date}</p>
              
              <div class="stats">
                <div class="stat-box">
                  <div class="stat-number">${stats.totalUsers}</div>
                  <div>Total Users</div>
                </div>
                <div class="stat-box">
                  <div class="stat-number" style="color: #f44336;">${users.filter(u => u.role === 'admin').length}</div>
                  <div>Admins</div>
                </div>
                <div class="stat-box">
                  <div class="stat-number">${stats.clientUsers}</div>
                  <div>Clients</div>
                </div>
              </div>
              
              <h2>User List</h2>
              <table>
                <tr>
                  <th>#</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Employee ID</th>
                  <th>Role</th>
                </tr>
                ${users.map((u, index) => `
                  <tr>
                    <td>${index + 1}</td>
                    <td>${u.fullName}</td>
                    <td>${u.email}</td>
                    <td>${u.employeeId || 'N/A'}</td>
                    <td class="${u.role}">${u.role.toUpperCase()}</td>
                  </tr>
                `).join('')}
              </table>
            </body>
          </html>
        `;
      }

      // Generate PDF
      const { uri } = await Print.printToFileAsync({ html: htmlContent });
      
      // Define file name
      const fileName = `${type === 'attendance' ? 'Attendance' : 'User'}_Report_${new Date().toISOString().split('T')[0]}.pdf`;
      
      // For Android, save to Downloads folder
      if (Platform.OS === 'android') {
        const permissions = await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();
        
        if (permissions.granted) {
          const base64 = await FileSystem.readAsStringAsync(uri, {
            encoding: FileSystem.EncodingType.Base64,
          });
          
          await FileSystem.StorageAccessFramework.createFileAsync(
            permissions.directoryUri,
            fileName,
            'application/pdf'
          )
          .then(async (fileUri) => {
            await FileSystem.writeAsStringAsync(fileUri, base64, {
              encoding: FileSystem.EncodingType.Base64,
            });
            Alert.alert('Success', `Report saved to your selected folder as ${fileName}`);
          })
          .catch((e) => {
            console.error(e);
            Alert.alert('Error', 'Failed to save file');
          });
        } else {
          // Fallback: share the file
          if (await Sharing.isAvailableAsync()) {
            await Sharing.shareAsync(uri, {
              mimeType: 'application/pdf',
              dialogTitle: 'Save Report',
              UTI: 'com.adobe.pdf'
            });
          }
        }
      } else {
        // For iOS, use sharing
        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(uri, {
            mimeType: 'application/pdf',
            dialogTitle: 'Save Report',
            UTI: 'com.adobe.pdf'
          });
        } else {
          Alert.alert('Error', 'Sharing is not available on this device');
        }
      }
    } catch (error) {
      console.error('Error generating report:', error);
      Alert.alert('Error', 'Failed to generate report: ' + error.message);
    }
  };

  const getAttendanceChartData = () => {
    const last7Days = [];
    const presentCounts = [];
    const absentCounts = [];
    const attendanceRates = [];
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toDateString();
      const dayAttendance = attendance.filter(a => {
        const aDate = a.timestamp?.toDate ? a.timestamp.toDate() : new Date(a.timestamp);
        return aDate.toDateString() === dateStr;
      });
      const present = dayAttendance.filter(a => a.status === 'present').length;
      const absent = stats.clientUsers - present;
      const rate = stats.clientUsers > 0 ? Math.round((present / stats.clientUsers) * 100) : 0;
      
      last7Days.push(date.toLocaleDateString('en-US', { weekday: 'short' }));
      presentCounts.push(present);
      absentCounts.push(absent);
      attendanceRates.push(rate);
    }
    return { labels: last7Days, presentCounts, absentCounts, attendanceRates };
  };

  const getPieChartData = () => {
    // Use filtered attendance based on selected date in attendance tab
    // For dashboard, use all attendance data
    const dataToUse = activeTab === 'attendance' ? filteredAttendance : attendance;
    const attendanceArray = Array.isArray(dataToUse) ? dataToUse : [];
    const totalPresent = attendanceArray.filter(a => a?.status === 'present').length;
    const totalAbsent = attendanceArray.filter(a => a?.status === 'absent').length;
    
    // Return at least 1 for each to avoid empty pie chart
    const presentCount = totalPresent || 1;
    const absentCount = totalAbsent || 1;
    
    return [
      {
        name: `Present ${totalPresent}`,
        population: presentCount,
        color: '#4CAF50',
        legendFontColor: '#333',
        legendFontSize: 14
      },
      {
        name: `Absent ${totalAbsent}`,
        population: absentCount,
        color: '#f44336',
        legendFontColor: '#333',
        legendFontSize: 14
      }
    ];
  };

  // Recalculate pie chart data when filtered attendance or active tab changes
  const pieChartData = React.useMemo(() => {
    try {
      return getPieChartData();
    } catch (error) {
      console.error('Error generating pie chart data:', error);
      return [
        { name: 'Present\n0', population: 1, color: '#4CAF50', legendFontColor: '#333', legendFontSize: 14 },
        { name: 'Absent\n0', population: 1, color: '#f44336', legendFontColor: '#333', legendFontSize: 14 }
      ];
    }
  }, [filteredAttendance, attendance, activeTab]);

  let chartData = { 
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'], 
    presentCounts: [0, 0, 0, 0, 0, 0, 0], 
    absentCounts: [0, 0, 0, 0, 0, 0, 0],
    attendanceRates: [0, 0, 0, 0, 0, 0, 0]
  };
  
  try {
    chartData = getAttendanceChartData();
  } catch (error) {
    console.error('Error generating chart data:', error);
  }

  const chartConfig = {
    backgroundColor: '#ffffff',
    backgroundGradientFrom: '#ffffff',
    backgroundGradientTo: '#ffffff',
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(66, 133, 244, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
    style: { borderRadius: 16 },
    propsForDots: {
      r: '6',
      strokeWidth: '2',
      stroke: theme.colors.primary
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>{getHeaderTitle()}</Text>
          <Text style={styles.headerSubtitle}>{getHeaderSubtitle()}</Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity 
            style={styles.notificationButton} 
            onPress={() => {
              setNotificationModalVisible(true);
              markAsChecked();
            }}
          >
            <Ionicons name="notifications-outline" size={28} color="#fff" />
            {unreadCount > 0 && (
              <View style={styles.notificationBadge}>
                <Text style={styles.notificationBadgeText}>
                  {unreadCount > 99 ? '99+' : unreadCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>
          <View>
            <TouchableOpacity 
              style={styles.profileButton} 
              onPress={() => setShowProfileDropdown(!showProfileDropdown)}
            >
              {userData?.profileImage ? (
                <Image 
                  source={{ uri: userData.profileImage }} 
                  style={styles.profileImage}
                />
              ) : (
                <Ionicons name="person-circle-outline" size={40} color="#fff" />
              )}
            </TouchableOpacity>
            {showProfileDropdown && (
              <View style={styles.profileDropdown}>
                <TouchableOpacity 
                  style={styles.dropdownItem}
                  onPress={() => {
                    setShowProfileDropdown(false);
                    navigation.navigate('Profile');
                  }}
                >
                  <Ionicons name="person-outline" size={20} color="#333" />
                  <Text style={styles.dropdownText}>Profile</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.dropdownItem, styles.dropdownItemLast]}
                  onPress={() => {
                    setShowProfileDropdown(false);
                    handleLogout();
                  }}
                >
                  <Ionicons name="log-out-outline" size={20} color="#f44336" />
                  <Text style={[styles.dropdownText, { color: '#f44336' }]}>Logout</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </View>

      <ScrollView style={styles.content}>
        {activeTab === 'dashboard' && (
          <View>
            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <Ionicons name="people" size={40} color={theme.colors.primary} />
                <Text style={styles.statNumber}>{stats.totalUsers}</Text>
                <Text style={styles.statLabel}>Total Users</Text>
              </View>
              <View style={styles.statCard}>
                <Ionicons name="checkmark-circle" size={40} color="#4CAF50" />
                <Text style={styles.statNumber}>{stats.presentToday}</Text>
                <Text style={styles.statLabel}>Present Today</Text>
              </View>
              <View style={styles.statCard}>
                <Ionicons name="close-circle" size={40} color="#f44336" />
                <Text style={styles.statNumber}>{stats.absentToday}</Text>
                <Text style={styles.statLabel}>Absent Today</Text>
              </View>
              <View style={styles.statCard}>
                <Ionicons name="person" size={40} color={theme.colors.primary} />
                <Text style={styles.statNumber}>{stats.clientUsers}</Text>
                <Text style={styles.statLabel}>Client Users</Text>
              </View>
            </View>

            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Ionicons name="pie-chart" size={24} color={theme.colors.primary} />
                <Text style={styles.cardTitle}>Attendance Distribution</Text>
              </View>
              <View style={styles.chartContainer}>
                {pieChartData && pieChartData.length > 0 ? (
                  <PieChart
                    data={pieChartData}
                    width={screenWidth - 64}
                    height={220}
                    chartConfig={chartConfig}
                    accessor="population"
                    backgroundColor="transparent"
                    paddingLeft="15"
                  />
                ) : (
                  <Text style={styles.emptyText}>No attendance data available</Text>
                )}
              </View>
            </View>

            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Ionicons name="time-outline" size={24} color={theme.colors.primary} />
                <Text style={styles.cardTitle}>Recent Activity (Today)</Text>
              </View>
              {(() => {
                const today = new Date();
                const todayStr = today.toISOString().split('T')[0];
                
                // Filter for today's records only and take first 5
                const todaysRecords = attendance.filter(record => {
                  let recordDate;
                  if (record.date) {
                    recordDate = record.date.split('T')[0];
                  } else if (record.timestamp?.toDate) {
                    recordDate = record.timestamp.toDate().toISOString().split('T')[0];
                  } else if (record.timestamp) {
                    recordDate = new Date(record.timestamp).toISOString().split('T')[0];
                  }
                  return recordDate === todayStr;
                }).slice(0, 5);
                
                if (todaysRecords.length === 0) {
                  return <Text style={styles.emptyText}>No attendance records for today</Text>;
                }
                
                return todaysRecords.map((record, index) => {
                  const displayDate = record.date || formatDate(record.timestamp);
                  const displayTime = record.checkInTime || record.timeIn || formatTime(record.timestamp);
                  return (
                    <View key={index} style={styles.activityItem}>
                      <View style={styles.activityIcon}>
                        <Ionicons name={record.status === 'present' ? 'checkmark-circle' : 'close-circle'} size={24} color={record.status === 'present' ? '#4CAF50' : '#f44336'} />
                      </View>
                      <View style={styles.activityInfo}>
                        <Text style={styles.activityName}>{record.userName}</Text>
                        <Text style={styles.activityDate}>{displayDate} at {displayTime}</Text>
                      </View>
                      <View style={[styles.statusBadge, { backgroundColor: record.status === 'present' ? '#4CAF50' : '#f44336' }]}>
                        <Text style={styles.statusText}>{record.status.toUpperCase()}</Text>
                      </View>
                    </View>
                  );
                });
              })()}
            </View>
          </View>
        )}

        {activeTab === 'attendance' && (
          <View>
            {/* Filter by Date - Moved to Top */}
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Ionicons name="calendar" size={24} color={theme.colors.primary} />
                <Text style={styles.cardTitle}>Filter by Date</Text>
              </View>
              <TouchableOpacity style={styles.datePickerButton} onPress={() => setShowDatePicker(true)}>
                <Ionicons name="calendar-outline" size={24} color={theme.colors.primary} />
                <Text style={styles.datePickerText}>{formatDate(selectedDate)}</Text>
                <Ionicons name="chevron-down" size={24} color="#666" />
              </TouchableOpacity>
              {showDatePicker && (
                <DateTimePicker
                  value={selectedDate}
                  mode="date"
                  display="default"
                  onChange={onDateChange}
                />
              )}
             
              </View>
            

            {/* Pie Chart - Shows filtered data */}
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Ionicons name="pie-chart" size={24} color={theme.colors.primary} />
                <Text style={styles.cardTitle}>Attendance Distribution</Text>
              </View>
              <View style={styles.chartContainer}>
                {pieChartData && pieChartData.length > 0 ? (
                  <PieChart
                    data={pieChartData}
                    width={screenWidth - 64}
                    height={220}
                    chartConfig={chartConfig}
                    accessor="population"
                    backgroundColor="transparent"
                    paddingLeft="15"
                  />
                ) : (
                  <Text style={styles.emptyText}>No attendance data available</Text>
                )}
              </View>
            </View>

            {/* All Attendance Records for Selected Date */}
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Ionicons name="list" size={24} color={theme.colors.primary} />
                <Text style={styles.cardTitle}>All Attendance Records</Text>
                <TouchableOpacity style={styles.reportButton} onPress={() => generateReport('attendance')}>
                  <Ionicons name="download" size={20} color="#fff" />
                  <Text style={styles.reportButtonText}>PDF</Text>
                </TouchableOpacity>
              </View>
              {filteredAttendance.length === 0 ? (
                <Text style={styles.emptyText}>No attendance records for {formatDate(selectedDate)}</Text>
              ) : (
                filteredAttendance.map((record) => (
                  <View key={record.id} style={styles.attendanceCard}>
                    <Ionicons name={record.status === 'present' ? 'checkmark-circle' : 'close-circle'} size={32} color={record.status === 'present' ? '#4CAF50' : '#f44336'} />
                    <View style={styles.attendanceInfo}>
                      <Text style={styles.attendanceName}>{record.userName}</Text>
                      <Text style={styles.attendanceDate}>
                        {record.date || formatDate(record.timestamp)} at {record.timeIn || formatTime(record.timestamp)}
                      </Text>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: record.status === 'present' ? '#4CAF50' : '#f44336' }]}>
                      <Text style={styles.statusText}>{record.status.toUpperCase()}</Text>
                    </View>
                    <TouchableOpacity onPress={() => handleEditAttendance(record)}>
                      <Ionicons name="create-outline" size={24} color={theme.colors.primary} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleDelete(record.id, 'attendance')}>
                      <Ionicons name="trash-outline" size={24} color="#f44336" />
                    </TouchableOpacity>
                  </View>
                ))
              )}
            </View>
          </View>
        )}

        {activeTab === 'users' && (
          <View>
            {/* User Statistics */}
            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <Ionicons name="shield-checkmark" size={40} color="#f44336" />
                <Text style={styles.statNumber}>{users.filter(u => u.role === 'admin').length}</Text>
                <Text style={styles.statLabel}>Administrators</Text>
              </View>
              <View style={styles.statCard}>
                <Ionicons name="people" size={40} color={theme.colors.primary} />
                <Text style={styles.statNumber}>{users.filter(u => u.role === 'client').length}</Text>
                <Text style={styles.statLabel}>Clients</Text>
              </View>
            </View>

            {/* Admin Users Section */}
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Ionicons name="shield-checkmark" size={24} color="#f44336" />
                <Text style={styles.cardTitle}>Administrators ({users.filter(u => u.role === 'admin').length})</Text>
              </View>
              {users.filter(u => u.role === 'admin').length === 0 ? (
                <Text style={styles.emptyText}>No administrators found</Text>
              ) : (
                users.filter(u => u.role === 'admin').map((userItem) => (
                  <View key={userItem.id} style={styles.userCard}>
                    {userItem.profileImage ? (
                      <Image 
                        source={{ uri: userItem.profileImage }} 
                        style={styles.userAvatar}
                      />
                    ) : (
                      <View style={styles.userAvatarPlaceholder}>
                        <Ionicons name="shield-checkmark" size={24} color="#f44336" />
                      </View>
                    )}
                    <View style={styles.userInfo}>
                      <Text style={styles.userName}>{userItem.fullName}</Text>
                      <Text style={styles.userEmail}>{userItem.email}</Text>
                      {userItem.employeeId && <Text style={styles.userEmployeeId}>ID: {userItem.employeeId}</Text>}
                      <View style={[styles.roleBadge, { backgroundColor: '#f44336' }]}>
                        <Text style={styles.roleBadgeText}>ADMIN</Text>
                      </View>
                    </View>
                    <TouchableOpacity onPress={() => handleEditUser(userItem)} style={styles.iconButton}>
                      <Ionicons name="create-outline" size={24} color={theme.colors.primary} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleDelete(userItem.id, 'user')} style={styles.iconButton}>
                      <Ionicons name="trash-outline" size={24} color="#f44336" />
                    </TouchableOpacity>
                  </View>
                ))
              )}
            </View>

            {/* Client Users Section */}
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Ionicons name="people" size={24} color={theme.colors.primary} />
                <Text style={styles.cardTitle}>Clients ({users.filter(u => u.role === 'client').length})</Text>
                <TouchableOpacity style={styles.reportButton} onPress={() => generateReport('users')}>
                  <Ionicons name="download" size={20} color="#fff" />
                  <Text style={styles.reportButtonText}>PDF</Text>
                </TouchableOpacity>
              </View>
              {users.filter(u => u.role === 'client').length === 0 ? (
                <Text style={styles.emptyText}>No client users found</Text>
              ) : (
                users.filter(u => u.role === 'client').map((userItem) => (
                  <View key={userItem.id} style={styles.userCard}>
                    {userItem.profileImage ? (
                      <Image 
                        source={{ uri: userItem.profileImage }} 
                        style={styles.userAvatar}
                      />
                    ) : (
                      <View style={styles.userAvatarPlaceholder}>
                        <Ionicons name="person" size={24} color={theme.colors.primary} />
                      </View>
                    )}
                    <View style={styles.userInfo}>
                      <Text style={styles.userName}>{userItem.fullName}</Text>
                      <Text style={styles.userEmail}>{userItem.email}</Text>
                      {userItem.employeeId && <Text style={styles.userEmployeeId}>ID: {userItem.employeeId}</Text>}
                      {userItem.contactNumber && (
                        <View style={styles.userInfoRow}>
                          <Ionicons name="call-outline" size={14} color="#666" />
                          <Text style={styles.userDetailText}> {userItem.contactNumber}</Text>
                        </View>
                      )}
                      {userItem.homeAddress && (
                        <View style={styles.userInfoRow}>
                          <Ionicons name="home-outline" size={14} color="#666" />
                          <Text style={styles.userDetailText}> {userItem.homeAddress}</Text>
                        </View>
                      )}
                      {userItem.gender && (
                        <View style={styles.userInfoRow}>
                          <Ionicons name={userItem.gender === 'male' ? 'male' : 'female'} size={14} color="#666" />
                          <Text style={styles.userDetailText}> {userItem.gender}</Text>
                        </View>
                      )}
                      {userItem.assignedArea && (
                        <View style={styles.userInfoRow}>
                          <Ionicons name="location-outline" size={14} color="#666" />
                          <Text style={styles.userDetailText}> {userItem.assignedArea}</Text>
                        </View>
                      )}
                      <View style={[styles.roleBadge, { backgroundColor: theme.colors.primary }]}>
                        <Text style={styles.roleBadgeText}>CLIENT</Text>
                      </View>
                    </View>
                    <TouchableOpacity onPress={() => handleEditUser(userItem)} style={styles.iconButton}>
                      <Ionicons name="create-outline" size={24} color={theme.colors.primary} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleDelete(userItem.id, 'user')} style={styles.iconButton}>
                      <Ionicons name="trash-outline" size={24} color="#f44336" />
                    </TouchableOpacity>
                  </View>
                ))
              )}
            </View>
          </View>
        )}
      </ScrollView>

      {/* Notification Modal */}
      <Modal visible={notificationModalVisible} transparent={true} animationType="slide" onRequestClose={() => setNotificationModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleContainer}>
                <Ionicons name="notifications" size={24} color={theme.colors.primary} />
                <Text style={styles.modalTitle}>New Attendance Records</Text>
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
                  <Text style={styles.emptyNotificationsSubtext}>No new attendance records</Text>
                </View>
              ) : (
                notifications.map((notif, index) => (
                  <View key={notif.id || index} style={styles.notificationItem}>
                    <View style={styles.notificationIcon}>
                      <Ionicons 
                        name={notif.status === 'present' ? 'checkmark-circle' : 'close-circle'} 
                        size={32} 
                        color={notif.status === 'present' ? '#4CAF50' : '#f44336'} 
                      />
                    </View>
                    <View style={styles.notificationContent}>
                      <Text style={styles.notificationTitle}>{notif.userName}</Text>
                      <Text style={styles.notificationMessage}>
                        Marked {notif.status} • {notif.date} at {notif.checkInTime}
                      </Text>
                      <Text style={styles.notificationTime}>
                        {notif.timestamp?.toDate 
                          ? notif.timestamp.toDate().toLocaleString()
                          : new Date(notif.timestamp).toLocaleString()
                        }
                      </Text>
                    </View>
                    <View style={[styles.statusBadge, { 
                      backgroundColor: notif.status === 'present' ? '#4CAF50' : '#f44336' 
                    }]}>
                      <Text style={styles.statusText}>{notif.status.toUpperCase()}</Text>
                    </View>
                  </View>
                ))
              )}
            </ScrollView>
            
            <TouchableOpacity 
              style={styles.closeButton} 
              onPress={() => setNotificationModalVisible(false)}
            >
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={editModalVisible} transparent={true} animationType="slide" onRequestClose={() => setEditModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit {editType === 'user' ? 'User' : 'Attendance'}</Text>
              <TouchableOpacity onPress={() => setEditModalVisible(false)}>
                <Ionicons name="close" size={28} color="#333" />
              </TouchableOpacity>
            </View>
            {editType === 'user' ? (
              <ScrollView style={{ maxHeight: 500 }}>
                <Text style={styles.inputLabel}>Full Name</Text>
                <TextInput 
                  style={styles.input} 
                  value={editForm.fullName} 
                  onChangeText={(text) => setEditForm({ ...editForm, fullName: text })} 
                  placeholder="Full Name" 
                />
                
                <Text style={styles.inputLabel}>Email</Text>
                <TextInput 
                  style={[styles.input, styles.disabledInput]} 
                  value={editItem?.email} 
                  editable={false}
                  placeholder="Email" 
                />
                <Text style={styles.helpText}>Email cannot be changed</Text>
                
                <Text style={styles.inputLabel}>Employee ID</Text>
                <TextInput 
                  style={styles.input} 
                  value={editForm.employeeId} 
                  onChangeText={(text) => setEditForm({ ...editForm, employeeId: text })} 
                  placeholder="Employee ID" 
                />
                
                <Text style={styles.inputLabel}>Home Address</Text>
                <TextInput 
                  style={styles.input} 
                  value={editForm.homeAddress} 
                  onChangeText={(text) => setEditForm({ ...editForm, homeAddress: text })} 
                  placeholder="Home Address"
                  multiline
                  numberOfLines={2}
                />
                
                <Text style={styles.inputLabel}>Contact Number</Text>
                <TextInput 
                  style={styles.input} 
                  value={editForm.contactNumber} 
                  onChangeText={(text) => setEditForm({ ...editForm, contactNumber: text })} 
                  placeholder="Contact Number"
                  keyboardType="phone-pad"
                />
                
                <Text style={styles.inputLabel}>Gender</Text>
                <View style={styles.roleButtons}>
                  <TouchableOpacity 
                    style={[styles.roleButton, editForm.gender === 'male' && styles.roleButtonActive]} 
                    onPress={() => setEditForm({ ...editForm, gender: 'male' })}
                  >
                    <Ionicons name="male" size={20} color={editForm.gender === 'male' ? '#fff' : '#666'} />
                    <Text style={[styles.roleButtonText, editForm.gender === 'male' && styles.roleButtonTextActive]}>Male</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.roleButton, editForm.gender === 'female' && styles.roleButtonActive]} 
                    onPress={() => setEditForm({ ...editForm, gender: 'female' })}
                  >
                    <Ionicons name="female" size={20} color={editForm.gender === 'female' ? '#fff' : '#666'} />
                    <Text style={[styles.roleButtonText, editForm.gender === 'female' && styles.roleButtonTextActive]}>Female</Text>
                  </TouchableOpacity>
                </View>
                
                <Text style={styles.inputLabel}>Assigned Area</Text>
                <TextInput 
                  style={styles.input} 
                  value={editForm.assignedArea} 
                  onChangeText={(text) => setEditForm({ ...editForm, assignedArea: text })} 
                  placeholder="Assigned Area"
                />
                
                <Text style={styles.inputLabel}>Role</Text>
                <View style={styles.roleButtons}>
                  <TouchableOpacity 
                    style={[styles.roleButton, editForm.role === 'admin' && styles.roleButtonActive]} 
                    onPress={() => setEditForm({ ...editForm, role: 'admin' })}
                  >
                    <Ionicons name="shield-checkmark" size={20} color={editForm.role === 'admin' ? '#fff' : '#666'} />
                    <Text style={[styles.roleButtonText, editForm.role === 'admin' && styles.roleButtonTextActive]}>Admin</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.roleButton, editForm.role === 'client' && styles.roleButtonActive]} 
                    onPress={() => setEditForm({ ...editForm, role: 'client' })}
                  >
                    <Ionicons name="person" size={20} color={editForm.role === 'client' ? '#fff' : '#666'} />
                    <Text style={[styles.roleButtonText, editForm.role === 'client' && styles.roleButtonTextActive]}>Client</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            ) : (
              <View style={styles.roleButtons}>
                <TouchableOpacity style={[styles.roleButton, editForm.status === 'present' && styles.roleButtonActive]} onPress={() => setEditForm({ ...editForm, status: 'present' })}>
                  <Text style={styles.roleButtonText}>Present</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.roleButton, editForm.status === 'absent' && styles.roleButtonActive]} onPress={() => setEditForm({ ...editForm, status: 'absent' })}>
                  <Text style={styles.roleButtonText}>Absent</Text>
                </TouchableOpacity>
              </View>
            )}
            <TouchableOpacity style={styles.saveButton} onPress={handleSaveEdit}>
              <Text style={styles.saveButtonText}>Save Changes</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={addAttendanceModalVisible} transparent={true} animationType="slide" onRequestClose={() => setAddAttendanceModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Attendance Record</Text>
              <TouchableOpacity onPress={() => setAddAttendanceModalVisible(false)}>
                <Ionicons name="close" size={28} color="#333" />
              </TouchableOpacity>
            </View>
            
            <Text style={styles.inputLabel}>Select User</Text>
            <ScrollView style={styles.userSelectList}>
              {users.filter(u => u.role === 'client').map((userItem) => (
                <TouchableOpacity
                  key={userItem.id}
                  style={[styles.userSelectItem, selectedUser?.id === userItem.id && styles.userSelectItemActive]}
                  onPress={() => setSelectedUser(userItem)}
                >
                  <Ionicons name="person" size={24} color={selectedUser?.id === userItem.id ? '#fff' : theme.colors.primary} />
                  <Text style={[styles.userSelectText, selectedUser?.id === userItem.id && styles.userSelectTextActive]}>
                    {userItem.fullName}
                  </Text>
                  {selectedUser?.id === userItem.id && (
                    <Ionicons name="checkmark-circle" size={24} color="#fff" />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={styles.inputLabel}>Select Date</Text>
            <TouchableOpacity style={styles.datePickerButton} onPress={() => setShowAttendanceDatePicker(true)}>
              <Ionicons name="calendar-outline" size={24} color={theme.colors.primary} />
              <Text style={styles.datePickerText}>{formatDate(attendanceDate)}</Text>
              <Ionicons name="chevron-down" size={24} color="#666" />
            </TouchableOpacity>
            {showAttendanceDatePicker && (
              <DateTimePicker
                value={attendanceDate}
                mode="date"
                display="default"
                onChange={onAttendanceDateChange}
              />
            )}

            <Text style={styles.inputLabel}>Status</Text>
            <View style={styles.roleButtons}>
              <TouchableOpacity 
                style={[styles.roleButton, attendanceStatus === 'present' && styles.roleButtonActive]} 
                onPress={() => setAttendanceStatus('present')}
              >
                <Ionicons name="checkmark-circle" size={20} color={attendanceStatus === 'present' ? '#fff' : '#666'} />
                <Text style={[styles.roleButtonText, attendanceStatus === 'present' && styles.roleButtonTextActive]}>Present</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.roleButton, attendanceStatus === 'absent' && styles.roleButtonActive]} 
                onPress={() => setAttendanceStatus('absent')}
              >
                <Ionicons name="close-circle" size={20} color={attendanceStatus === 'absent' ? '#fff' : '#666'} />
                <Text style={[styles.roleButtonText, attendanceStatus === 'absent' && styles.roleButtonTextActive]}>Absent</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.saveButton} onPress={handleAddAttendance}>
              <Text style={styles.saveButtonText}>Add Attendance</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Add User Modal */}
      <Modal visible={addUserModalVisible} transparent={true} animationType="slide" onRequestClose={() => setAddUserModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ScrollView style={{ maxHeight: 500 }}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Add New User</Text>
                <TouchableOpacity onPress={() => setAddUserModalVisible(false)}>
                  <Ionicons name="close" size={28} color="#333" />
                </TouchableOpacity>
              </View>

              <Text style={styles.inputLabel}>Full Name *</Text>
              <TextInput
                style={styles.input}
                value={newUserForm.fullName}
                onChangeText={(text) => setNewUserForm({ ...newUserForm, fullName: text })}
                placeholder="Enter full name"
              />

              <Text style={styles.inputLabel}>Email *</Text>
              <TextInput
                style={styles.input}
                value={newUserForm.email}
                onChangeText={(text) => setNewUserForm({ ...newUserForm, email: text })}
                placeholder="Enter email"
                keyboardType="email-address"
                autoCapitalize="none"
              />

              <Text style={styles.inputLabel}>Password *</Text>
              <TextInput
                style={styles.input}
                value={newUserForm.password}
                onChangeText={(text) => setNewUserForm({ ...newUserForm, password: text })}
                placeholder="Enter password (min 6 characters)"
                secureTextEntry
              />

              <Text style={styles.inputLabel}>Employee ID *</Text>
              <TextInput
                style={styles.input}
                value={newUserForm.employeeId}
                onChangeText={(text) => setNewUserForm({ ...newUserForm, employeeId: text })}
                placeholder="Enter employee ID"
              />

              <Text style={styles.inputLabel}>Role *</Text>
              <View style={styles.roleButtons}>
                <TouchableOpacity
                  style={[styles.roleButton, newUserForm.role === 'admin' && styles.roleButtonActive]}
                  onPress={() => setNewUserForm({ ...newUserForm, role: 'admin' })}
                >
                  <Ionicons name="shield-checkmark" size={20} color={newUserForm.role === 'admin' ? '#fff' : '#666'} />
                  <Text style={[styles.roleButtonText, newUserForm.role === 'admin' && styles.roleButtonTextActive]}>Admin</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.roleButton, newUserForm.role === 'client' && styles.roleButtonActive]}
                  onPress={() => setNewUserForm({ ...newUserForm, role: 'client' })}
                >
                  <Ionicons name="person" size={20} color={newUserForm.role === 'client' ? '#fff' : '#666'} />
                  <Text style={[styles.roleButtonText, newUserForm.role === 'client' && styles.roleButtonTextActive]}>Client</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.inputLabel}>Home Address</Text>
              <TextInput
                style={styles.input}
                value={newUserForm.homeAddress}
                onChangeText={(text) => setNewUserForm({ ...newUserForm, homeAddress: text })}
                placeholder="Enter home address"
                multiline
                numberOfLines={2}
              />

              <Text style={styles.inputLabel}>Contact Number</Text>
              <TextInput
                style={styles.input}
                value={newUserForm.contactNumber}
                onChangeText={(text) => setNewUserForm({ ...newUserForm, contactNumber: text })}
                placeholder="Enter contact number"
                keyboardType="phone-pad"
              />

              <Text style={styles.inputLabel}>Gender</Text>
              <View style={styles.roleButtons}>
                <TouchableOpacity
                  style={[styles.roleButton, newUserForm.gender === 'male' && styles.roleButtonActive]}
                  onPress={() => setNewUserForm({ ...newUserForm, gender: 'male' })}
                >
                  <Ionicons name="male" size={20} color={newUserForm.gender === 'male' ? '#fff' : '#666'} />
                  <Text style={[styles.roleButtonText, newUserForm.gender === 'male' && styles.roleButtonTextActive]}>Male</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.roleButton, newUserForm.gender === 'female' && styles.roleButtonActive]}
                  onPress={() => setNewUserForm({ ...newUserForm, gender: 'female' })}
                >
                  <Ionicons name="female" size={20} color={newUserForm.gender === 'female' ? '#fff' : '#666'} />
                  <Text style={[styles.roleButtonText, newUserForm.gender === 'female' && styles.roleButtonTextActive]}>Female</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.inputLabel}>Assigned Area</Text>
              <TextInput
                style={styles.input}
                value={newUserForm.assignedArea}
                onChangeText={(text) => setNewUserForm({ ...newUserForm, assignedArea: text })}
                placeholder="Enter assigned area"
              />

              <TouchableOpacity style={styles.saveButton} onPress={handleAddUser}>
                <Text style={styles.saveButtonText}>Create User</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem} onPress={() => setActiveTab('dashboard')}>
          <Ionicons name={activeTab === 'dashboard' ? 'grid' : 'grid-outline'} size={24} color={activeTab === 'dashboard' ? theme.colors.primary : '#999'} />
          <Text style={[styles.navLabel, activeTab === 'dashboard' && styles.navLabelActive]}>Dashboard</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => setActiveTab('attendance')}>
          <Ionicons name={activeTab === 'attendance' ? 'clipboard' : 'clipboard-outline'} size={24} color={activeTab === 'attendance' ? theme.colors.primary : '#999'} />
          <Text style={[styles.navLabel, activeTab === 'attendance' && styles.navLabelActive]}>Attendance</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => setActiveTab('users')}>
          <Ionicons name={activeTab === 'users' ? 'people' : 'people-outline'} size={24} color={activeTab === 'users' ? theme.colors.primary : '#999'} />
          <Text style={[styles.navLabel, activeTab === 'users' && styles.navLabelActive]}>Users</Text>
        </TouchableOpacity>
      </View>

      {/* Floating Action Button - Only show in Users tab */}
      {activeTab === 'users' && (
        <TouchableOpacity 
          style={styles.fab} 
          onPress={() => setAddUserModalVisible(true)}
          activeOpacity={0.8}
        >
          <Ionicons name="person-add" size={28} color="#fff" />
        </TouchableOpacity>
      )}

      {/* Floating Action Button for Attendance - Only show in Attendance tab */}
      {activeTab === 'attendance' && (
        <TouchableOpacity 
          style={styles.fab} 
          onPress={() => setAddAttendanceModalVisible(true)}
          activeOpacity={0.8}
        >
          <Ionicons name="add-circle" size={28} color="#fff" />
        </TouchableOpacity>
      )}
    </View>
  );
};

export default AdminDashboard;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f5f5f5' },
  loadingText: { marginTop: 12, fontSize: 16, color: '#666' },
  header: { backgroundColor: theme.colors.primary, padding: 20, paddingTop: 50, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#fff' },
  headerSubtitle: { fontSize: 14, color: '#fff', opacity: 0.9, marginTop: 4 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  notificationButton: { padding: 4, marginRight: 8, position: 'relative' },
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
  notificationBadgeText: { color: '#fff', fontSize: 11, fontWeight: 'bold' },
  profileButton: { padding: 4 },
  content: { flex: 1, padding: 16 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 16 },
  statCard: { backgroundColor: '#fff', borderRadius: 12, padding: 20, width: '48%', alignItems: 'center', marginBottom: 16, elevation: 2 },
  statNumber: { fontSize: 32, fontWeight: 'bold', color: '#333', marginTop: 12 },
  statLabel: { fontSize: 14, color: '#666', marginTop: 4, textAlign: 'center' },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 16, elevation: 2 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#eee' },
  cardTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', marginLeft: 8, flex: 1 },
  reportButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.colors.primary, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  reportButtonText: { color: '#fff', fontSize: 12, fontWeight: '600', marginLeft: 4 },
  addButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#4CAF50', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, marginLeft: 8 },
  addButtonText: { color: '#fff', fontSize: 12, fontWeight: '600', marginLeft: 4 },
  placeholderText: { padding: 20, textAlign: 'center', color: '#999', fontSize: 14 },
  emptyText: { padding: 20, textAlign: 'center', color: '#999', fontSize: 14, fontStyle: 'italic' },
  chart: { marginVertical: 8, borderRadius: 16 },
  chartContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 10 },
  activityItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  activityIcon: { marginRight: 12 },
  activityInfo: { flex: 1 },
  activityName: { fontSize: 16, fontWeight: '500', color: '#333' },
  activityDate: { fontSize: 12, color: '#666', marginTop: 2 },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 },
  statusText: { color: '#fff', fontSize: 11, fontWeight: '600' },
  attendanceCard: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f0f0f0', gap: 12 },
  attendanceInfo: { flex: 1, marginLeft: 12 },
  attendanceName: { fontSize: 16, fontWeight: '500', color: '#333' },
  attendanceDate: { fontSize: 12, color: '#666', marginTop: 2 },
  userCard: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f0f0f0', gap: 12 },
  userInfo: { flex: 1, marginLeft: 12 },
  userName: { fontSize: 16, fontWeight: '500', color: '#333' },
  userEmail: { fontSize: 12, color: '#666', marginTop: 2 },
  userRole: { fontSize: 11, color: '#999', marginTop: 2 },
  userInfoRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  userDetailText: { fontSize: 11, color: '#666', marginLeft: 4 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: '#fff', borderRadius: 16, padding: 24, width: '90%', maxWidth: 400, maxHeight: '80%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitleContainer: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#333' },
  notificationList: { maxHeight: 400 },
  emptyNotifications: { alignItems: 'center', padding: 40 },
  emptyNotificationsText: { fontSize: 18, fontWeight: 'bold', color: '#999', marginTop: 16 },
  emptyNotificationsSubtext: { fontSize: 14, color: '#ccc', marginTop: 4 },
  notificationItem: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    padding: 12, 
    borderBottomWidth: 1, 
    borderBottomColor: '#f0f0f0',
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    marginBottom: 8
  },
  notificationIcon: { marginRight: 12 },
  notificationContent: { flex: 1 },
  notificationTitle: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  notificationMessage: { fontSize: 14, color: '#666', marginTop: 4 },
  notificationTime: { fontSize: 11, color: '#999', marginTop: 4 },
  closeButton: { 
    backgroundColor: theme.colors.primary, 
    padding: 14, 
    borderRadius: 8, 
    alignItems: 'center', 
    marginTop: 16 
  },
  closeButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, fontSize: 16, marginBottom: 12 },
  disabledInput: { backgroundColor: '#f5f5f5', color: '#999' },
  helpText: { fontSize: 12, color: '#999', marginTop: -8, marginBottom: 12, fontStyle: 'italic' },
  roleButtons: { flexDirection: 'row', gap: 8, marginTop: 8 },
  roleButton: { flex: 1, padding: 12, borderWidth: 1, borderColor: '#ddd', borderRadius: 8, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 6 },
  roleButtonActive: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
  roleButtonText: { fontSize: 14, fontWeight: '600', color: '#666' },
  roleButtonTextActive: { color: '#fff' },
  saveButton: { backgroundColor: theme.colors.primary, padding: 16, borderRadius: 8, alignItems: 'center', marginTop: 24 },
  saveButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  bottomNav: { flexDirection: 'row', backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#e0e0e0', paddingVertical: 8, elevation: 8 },
  navItem: { flex: 1, alignItems: 'center', paddingVertical: 8 },
  navLabel: { fontSize: 12, color: '#999', marginTop: 4 },
  navLabelActive: { color: theme.colors.primary, fontWeight: '600' },
  datePickerButton: { flexDirection: 'row', alignItems: 'center', padding: 12, borderWidth: 1, borderColor: '#ddd', borderRadius: 8, marginVertical: 8, justifyContent: 'space-between' },
  datePickerText: { flex: 1, fontSize: 16, color: '#333', marginLeft: 8 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: '#eee' },
  statItem: { alignItems: 'center' },
  statItemNumber: { fontSize: 24, fontWeight: 'bold', color: '#4CAF50' },
  statItemLabel: { fontSize: 12, color: '#666', marginTop: 4 },
  inputLabel: { fontSize: 14, fontWeight: '600', color: '#333', marginTop: 12, marginBottom: 8 },
  userSelectList: { maxHeight: 200, borderWidth: 1, borderColor: '#ddd', borderRadius: 8, marginBottom: 12 },
  userSelectItem: { flexDirection: 'row', alignItems: 'center', padding: 12, borderBottomWidth: 1, borderBottomColor: '#f0f0f0', gap: 12 },
  userSelectItemActive: { backgroundColor: theme.colors.primary },
  userSelectText: { flex: 1, fontSize: 16, color: '#333' },
  userSelectTextActive: { color: '#fff', fontWeight: '600' },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', marginTop: 20, marginBottom: 12, flexDirection: 'row', alignItems: 'center', gap: 8 },
  roleBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8, alignSelf: 'flex-start', marginTop: 4 },
  roleBadgeText: { fontSize: 10, fontWeight: '600', color: '#fff', textTransform: 'uppercase' },
  userEmployeeId: { fontSize: 11, color: '#999', marginTop: 2, fontFamily: 'monospace' },
  iconButton: { padding: 8, borderRadius: 8, backgroundColor: '#f0f0f0', marginLeft: 4 },
  profileImage: { width: 40, height: 40, borderRadius: 20, borderWidth: 2, borderColor: '#fff' },
  userAvatar: { 
    width: 48, 
    height: 48, 
    borderRadius: 24, 
    borderWidth: 2, 
    borderColor: theme.colors.primary 
  },
  userAvatarPlaceholder: { 
    width: 48, 
    height: 48, 
    borderRadius: 24, 
    backgroundColor: '#f0f0f0', 
    justifyContent: 'center', 
    alignItems: 'center',
    borderWidth: 2, 
    borderColor: '#ddd'
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 80,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: theme.colors.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8
  },
  profileDropdown: {
    position: 'absolute',
    top: 50,
    right: 0,
    backgroundColor: '#fff',
    borderRadius: 12,
    minWidth: 180,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    zIndex: 1000
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0'
  },
  dropdownItemLast: {
    borderBottomWidth: 0
  },
  dropdownText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500'
  }
});

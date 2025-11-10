// Report Generation Service
import { Alert, Share } from 'react-native';

export const generateAttendanceReport = async (attendance, users) => {
  try {
    // Calculate statistics
    const totalRecords = attendance.length;
    const presentCount = attendance.filter(a => a.status === 'present').length;
    const absentCount = attendance.filter(a => a.status === 'absent').length;
    const lateCount = attendance.filter(a => a.status === 'late').length;
    
    // Get unique dates
    const dates = [...new Set(attendance.map(a => a.date))].sort().reverse();
    
    // Generate report text
    let reportText = `SMART ATTENDANCE MANAGEMENT SYSTEM\n`;
    reportText += `========================================\n\n`;
    reportText += `ATTENDANCE REPORT\n`;
    reportText += `Generated: ${new Date().toLocaleString()}\n\n`;
    reportText += `SUMMARY\n`;
    reportText += `========================================\n`;
    reportText += `Total Records: ${totalRecords}\n`;
    reportText += `Present: ${presentCount} (${((presentCount/totalRecords)*100).toFixed(1)}%)\n`;
    reportText += `Absent: ${absentCount} (${((absentCount/totalRecords)*100).toFixed(1)}%)\n`;
    reportText += `Late: ${lateCount} (${((lateCount/totalRecords)*100).toFixed(1)}%)\n\n`;
    
    reportText += `DETAILED RECORDS\n`;
    reportText += `========================================\n`;
    
    dates.slice(0, 10).forEach(date => {
      const dayRecords = attendance.filter(a => a.date === date);
      reportText += `\nDate: ${date}\n`;
      reportText += `----------------------------\n`;
      dayRecords.forEach(record => {
        reportText += `${record.userName} - ${record.status.toUpperCase()} (${record.checkInTime})\n`;
      });
    });
    
    reportText += `\n========================================\n`;
    reportText += `Total Users: ${users.length}\n`;
    reportText += `Admin Users: ${users.filter(u => u.role === 'admin').length}\n`;
    reportText += `Client Users: ${users.filter(u => u.role === 'client').length}\n`;
    
    return reportText;
  } catch (error) {
    console.error('Error generating report:', error);
    return null;
  }
};

export const generateUserReport = async (users, attendance) => {
  try {
    let reportText = `SMART ATTENDANCE MANAGEMENT SYSTEM\n`;
    reportText += `========================================\n\n`;
    reportText += `USER MANAGEMENT REPORT\n`;
    reportText += `Generated: ${new Date().toLocaleString()}\n\n`;
    reportText += `SUMMARY\n`;
    reportText += `========================================\n`;
    reportText += `Total Users: ${users.length}\n`;
    reportText += `Administrators: ${users.filter(u => u.role === 'admin').length}\n`;
    reportText += `Clients: ${users.filter(u => u.role === 'client').length}\n\n`;
    
    reportText += `USER LIST\n`;
    reportText += `========================================\n`;
    
    users.forEach((user, index) => {
      const userAttendance = attendance.filter(a => a.userId === user.id);
      reportText += `\n${index + 1}. ${user.fullName}\n`;
      reportText += `   Email: ${user.email}\n`;
      reportText += `   ID: ${user.employeeId}\n`;
      reportText += `   Role: ${user.role.toUpperCase()}\n`;
      reportText += `   Attendance Records: ${userAttendance.length}\n`;
    });
    
    reportText += `\n========================================\n`;
    reportText += `End of Report\n`;
    
    return reportText;
  } catch (error) {
    console.error('Error generating user report:', error);
    return null;
  }
};

export const shareReport = async (reportText, reportName) => {
  try {
    const result = await Share.share({
      message: reportText,
      title: reportName
    });
    
    if (result.action === Share.sharedAction) {
      if (result.activityType) {
        Alert.alert('Success', 'Report shared successfully');
      } else {
        Alert.alert('Success', 'Report shared');
      }
    } else if (result.action === Share.dismissedAction) {
      // dismissed
    }
  } catch (error) {
    Alert.alert('Error', 'Failed to share report: ' + error.message);
  }
};

export const downloadReport = (reportText, reportName) => {
  // For now, we'll use share functionality
  // In a full implementation, you would save to device storage
  Alert.alert(
    'Download Report',
    'Report will be shared. You can save it from the share menu.',
    [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Share', onPress: () => shareReport(reportText, reportName) }
    ]
  );
};

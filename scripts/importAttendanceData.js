// Script to import sample attendance data for client users
// This script uses Firebase Web SDK (compat) instead of Admin SDK

const firebase = require('firebase/compat/app');
require('firebase/compat/firestore');

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyD_hTz3PJtJa6zNgQ0Qvxs5cP9zQw8xKzM",
  authDomain: "attendance-ms-b6e71.firebaseapp.com",
  projectId: "attendance-ms-b6e71",
  storageBucket: "attendance-ms-b6e71.firebasestorage.app",
  messagingSenderId: "1077933816009",
  appId: "1:1077933816009:web:1e0db0e0f70f8e8a8c9e8e"
};

// Initialize Firebase
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

const db = firebase.firestore();

async function importAttendanceData() {
  try {
    console.log('📊 Starting attendance data import...');

    // Get all client users
    const usersSnapshot = await db.collection('users').where('role', '==', 'client').get();
    
    if (usersSnapshot.empty) {
      console.log('⚠️  No client users found. Please create users first.');
      return;
    }

    const clients = usersSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    console.log(`👥 Found ${clients.length} client users`);

    // Generate attendance for the last 14 days
    const attendanceRecords = [];
    const today = new Date();
    
    for (let dayOffset = 0; dayOffset < 14; dayOffset++) {
      const date = new Date(today);
      date.setDate(date.getDate() - dayOffset);
      const dateString = date.toISOString().split('T')[0];
      
      for (const client of clients) {
        // Random attendance: 80% present, 20% absent
        const isPresent = Math.random() < 0.8;
        const status = isPresent ? 'present' : 'absent';
        
        const attendanceId = `${client.id}_${dateString}`;
        
        attendanceRecords.push({
          id: attendanceId,
          userId: client.id,
          userName: client.fullName,
          status: status,
          date: dateString,
          timestamp: firebase.firestore.Timestamp.fromDate(date),
          checkInTime: date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
          createdAt: firebase.firestore.Timestamp.now()
        });
      }
    }

    console.log(`📝 Generated ${attendanceRecords.length} attendance records`);

    // Import records in batches
    const batchSize = 500;
    let imported = 0;

    for (let i = 0; i < attendanceRecords.length; i += batchSize) {
      const batch = db.batch();
      const chunk = attendanceRecords.slice(i, i + batchSize);

      for (const record of chunk) {
        const docRef = db.collection('attendance').doc(record.id);
        const { id, ...data } = record;
        batch.set(docRef, data, { merge: true });
      }

      await batch.commit();
      imported += chunk.length;
      console.log(`✅ Imported ${imported}/${attendanceRecords.length} records...`);
    }

    console.log('🎉 Attendance data import completed successfully!');
    
    // Print statistics
    const presentCount = attendanceRecords.filter(r => r.status === 'present').length;
    const absentCount = attendanceRecords.filter(r => r.status === 'absent').length;
    
    console.log('\n📊 Statistics:');
    console.log(`   Total Records: ${attendanceRecords.length}`);
    console.log(`   Present: ${presentCount} (${Math.round(presentCount/attendanceRecords.length*100)}%)`);
    console.log(`   Absent: ${absentCount} (${Math.round(absentCount/attendanceRecords.length*100)}%)`);
    console.log(`   Date Range: ${attendanceRecords[attendanceRecords.length-1].date} to ${attendanceRecords[0].date}`);

  } catch (error) {
    console.error('❌ Error importing attendance data:', error);
    throw error;
  }
}

// Run the import
importAttendanceData()
  .then(() => {
    console.log('\n✨ Done!');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n💥 Fatal error:', error);
    process.exit(1);
  });

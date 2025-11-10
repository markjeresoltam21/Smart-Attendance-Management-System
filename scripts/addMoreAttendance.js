const firebase = require('firebase/compat/app');
require('firebase/compat/firestore');
require('firebase/compat/auth');

// Firebase configuration (same as in your app)
const firebaseConfig = {
  apiKey: "AIzaSyCS1l_5NnaeWOAgrEsgFaGg_1iWvS8PMOo",
  authDomain: "smartattendance-92bd0.firebaseapp.com",
  projectId: "smartattendance-92bd0",
  storageBucket: "smartattendance-92bd0.firebasestorage.app",
  messagingSenderId: "45288136361",
  appId: "1:45288136361:android:bb055131277b29edb8d3b8"
};

// Initialize Firebase
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

const db = firebase.firestore();

async function addAttendanceRecords() {
  try {
    console.log('🔄 Starting to add attendance records...');

    // Get all client users
    const usersSnapshot = await db.collection('users').where('role', '==', 'client').get();
    const clients = [];
    
    usersSnapshot.forEach(doc => {
      clients.push({ id: doc.id, ...doc.data() });
    });

    console.log(`📊 Found ${clients.length} client users`);

    if (clients.length === 0) {
      console.log('❌ No client users found. Please create some clients first.');
      process.exit(0);
    }

    // Define dates for the past week
    const dates = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      dates.push(date);
    }

    let addedCount = 0;
    let skippedCount = 0;

    // Add attendance for each client on each date
    for (const client of clients) {
      for (const date of dates) {
        const dateString = date.toISOString().split('T')[0];
        const attendanceId = `${client.id}_${dateString}`;

        // Check if attendance already exists
        const existingDoc = await db.collection('attendance').doc(attendanceId).get();
        
        if (existingDoc.exists) {
          console.log(`⏭️  Skipping: ${client.fullName} on ${dateString} (already exists)`);
          skippedCount++;
          continue;
        }

        // Randomly decide if present or absent (80% present, 20% absent)
        const isPresent = Math.random() < 0.8;
        const status = isPresent ? 'present' : 'absent';

        // Generate random times for check-in/check-out
        const checkInHour = 8 + Math.floor(Math.random() * 2); // 8-9 AM
        const checkInMinute = Math.floor(Math.random() * 60);
        const checkOutHour = 17 + Math.floor(Math.random() * 2); // 5-6 PM
        const checkOutMinute = Math.floor(Math.random() * 60);

        const timeIn = `${dateString}T${String(checkInHour).padStart(2, '0')}:${String(checkInMinute).padStart(2, '0')}:00.000Z`;
        const timeOut = isPresent ? `${dateString}T${String(checkOutHour).padStart(2, '0')}:${String(checkOutMinute).padStart(2, '0')}:00.000Z` : null;

        const attendanceData = {
          userId: client.id,
          userName: client.fullName,
          status: status,
          date: dateString,
          timeIn: timeIn,
          timeOut: timeOut,
          createdAt: firebase.firestore.FieldValue.serverTimestamp(),
          updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        };

        await db.collection('attendance').doc(attendanceId).set(attendanceData);
        console.log(`✅ Added: ${client.fullName} - ${status} on ${dateString}`);
        addedCount++;
      }
    }

    console.log('\n📊 Summary:');
    console.log(`✅ Added: ${addedCount} records`);
    console.log(`⏭️  Skipped: ${skippedCount} records`);
    console.log('✅ Attendance records added successfully!');

  } catch (error) {
    console.error('❌ Error adding attendance records:', error);
  } finally {
    process.exit(0);
  }
}

addAttendanceRecords();

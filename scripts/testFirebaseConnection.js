// Test Firebase connection and create first collection
// This will verify your API key works and create initial data

const { initializeApp } = require('firebase/app');
const { getFirestore, collection, addDoc, serverTimestamp } = require('firebase/firestore');

const firebaseConfig = {
  apiKey: "AIzaSyCS1l_5NnaeWOAgrEsgFaGg_1iWvS8PMOo",
  authDomain: "smartattendance-92bd0.firebaseapp.com",
  projectId: "smartattendance-92bd0",
  storageBucket: "smartattendance-92bd0.firebasestorage.app",
  messagingSenderId: "45288136361",
  appId: "1:45288136361:android:bb055131277b29edb8d3b8"
};

async function testConnection() {
  try {
    console.log('\n🔄 Testing Firebase connection...\n');
    
    // Initialize Firebase
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);
    
    console.log('✅ Firebase initialized successfully');
    console.log('📦 Project ID:', firebaseConfig.projectId);
    console.log('🔑 API Key:', firebaseConfig.apiKey.substring(0, 20) + '...');
    
    // Try to create a test document to verify connection
    console.log('\n🔄 Creating test collection...\n');
    
    const testRef = collection(db, 'test_connection');
    const docRef = await addDoc(testRef, {
      message: 'Firebase connection successful!',
      timestamp: serverTimestamp(),
      createdBy: 'testScript'
    });
    
    console.log('✅ SUCCESS! Test document created with ID:', docRef.id);
    console.log('✅ Collection "test_connection" now visible in Firebase Console');
    console.log('\n📊 Go to Firebase Console → Firestore Database → Data tab');
    console.log('   You should see "test_connection" collection appear!\n');
    
    // Now create the users collection structure
    console.log('🔄 Creating users collection...\n');
    const usersRef = collection(db, 'users');
    const userDoc = await addDoc(usersRef, {
      email: 'admin@example.com',
      fullName: 'System Administrator',
      role: 'admin',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    
    console.log('✅ Users collection created with test admin');
    console.log('✅ Document ID:', userDoc.id);
    
    // Create attendance collection structure
    console.log('\n🔄 Creating attendance collection...\n');
    const attendanceRef = collection(db, 'attendance');
    const attendanceDoc = await addDoc(attendanceRef, {
      userId: userDoc.id,
      userName: 'System Administrator',
      date: new Date().toISOString().split('T')[0],
      timeIn: new Date().toISOString(),
      timeOut: null,
      status: 'present',
      createdAt: serverTimestamp()
    });
    
    console.log('✅ Attendance collection created with test record');
    console.log('✅ Document ID:', attendanceDoc.id);
    
    console.log('\n🎉 ALL COLLECTIONS CREATED SUCCESSFULLY!\n');
    console.log('📊 Refresh your Firebase Console to see:');
    console.log('   ✓ test_connection collection');
    console.log('   ✓ users collection');
    console.log('   ✓ attendance collection\n');
    
  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    console.error('\n🔍 Common issues:');
    console.error('   1. Firebase Authentication not enabled');
    console.error('   2. Firestore Database not created in Firebase Console');
    console.error('   3. Network connection issues');
    console.error('   4. API key restrictions\n');
    
    if (error.message.includes('PERMISSION_DENIED')) {
      console.error('⚠️  PERMISSION DENIED: You need to update Firestore Rules');
      console.error('   Go to Firestore → Rules tab and use these rules:\n');
      console.error('   rules_version = \'2\';');
      console.error('   service cloud.firestore {');
      console.error('     match /databases/{database}/documents {');
      console.error('       match /{document=**} {');
      console.error('         allow read, write: if true;');
      console.error('       }');
      console.error('     }');
      console.error('   }\n');
    }
  }
}

testConnection();

// Migration script to add client data fields to ALL users (clients and admin)
// Uses Firebase client SDK with admin authentication

const firebase = require('firebase/compat/app');
require('firebase/compat/firestore');
require('firebase/compat/auth');

// Firebase configuration from your app
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
const auth = firebase.auth();

// ⚠️ IMPORTANT: You need to sign in as admin first
// Replace with your admin credentials
const ADMIN_EMAIL = 'admin@gmail.com'; // Change this to your admin email
const ADMIN_PASSWORD = 'admin123'; // Change this to your admin password

// Sample data arrays
const areas = ['North District', 'South District', 'East District', 'West District', 'Central District'];
const streets = ['Main St', 'Oak Ave', 'Pine Rd', 'Maple Dr', 'Cedar Ln', 'Elm St', 'Birch Ave'];
const cities = ['Sample City', 'Metro City', 'Central City'];
const genders = ['male', 'female'];

// Function to generate random contact number
function generateContactNumber() {
  const prefix = '09';
  const number = Math.floor(100000000 + Math.random() * 900000000);
  return prefix + number.toString().substring(0, 9);
}

// Function to generate random address
function generateAddress() {
  const houseNumber = Math.floor(100 + Math.random() * 900);
  const street = streets[Math.floor(Math.random() * streets.length)];
  const city = cities[Math.floor(Math.random() * cities.length)];
  return `${houseNumber} ${street}, ${city}`;
}

// Main migration function
async function migrateAllUsers() {
  try {
    // First, authenticate as admin
    console.log('\n🔐 Authenticating as admin...');
    await auth.signInWithEmailAndPassword(ADMIN_EMAIL, ADMIN_PASSWORD);
    console.log('✓ Authentication successful!\n');
    
    console.log('='.repeat(60));
    console.log('MIGRATION: Adding Client Data Fields to ALL Users');
    console.log('='.repeat(60));
    console.log('\nFetching all users from Firestore...\n');
    
    const usersSnapshot = await db.collection('users').get();
    
    if (usersSnapshot.empty) {
      console.log('❌ No users found in database.');
      return;
    }
    
    console.log(`✓ Found ${usersSnapshot.docs.length} user(s) in database.\n`);
    
    let updatedCount = 0;
    let skippedCount = 0;
    
    for (const doc of usersSnapshot.docs) {
      const userData = doc.data();
      const userId = doc.id;
      
      console.log(`\nProcessing: ${userData.fullName} (${userData.role.toUpperCase()})`);
      console.log('-'.repeat(50));
      
      // Check if user already has all the new fields
      const hasAllFields = userData.homeAddress && 
                          userData.contactNumber && 
                          userData.gender && 
                          userData.assignedArea;
      
      if (hasAllFields) {
        console.log(`⊘ Skipping - Already has complete data`);
        console.log(`  Current data:`);
        console.log(`    - Home: ${userData.homeAddress}`);
        console.log(`    - Phone: ${userData.contactNumber}`);
        console.log(`    - Gender: ${userData.gender}`);
        console.log(`    - Area: ${userData.assignedArea}`);
        skippedCount++;
        continue;
      }
      
      // Generate sample data for missing fields
      const updates = {};
      
      if (!userData.homeAddress) {
        updates.homeAddress = generateAddress();
      }
      
      if (!userData.contactNumber) {
        updates.contactNumber = generateContactNumber();
      }
      
      if (!userData.gender) {
        updates.gender = genders[Math.floor(Math.random() * genders.length)];
      }
      
      if (!userData.assignedArea) {
        updates.assignedArea = areas[Math.floor(Math.random() * areas.length)];
      }
      
      // Add update timestamp
      updates.updatedAt = firebase.firestore.Timestamp.now();
      
      // Update the document
      await db.collection('users').doc(userId).update(updates);
      
      console.log(`✓ Updated successfully!`);
      console.log(`  New/Updated fields:`);
      if (updates.homeAddress) console.log(`    - Home Address: ${updates.homeAddress}`);
      if (updates.contactNumber) console.log(`    - Contact Number: ${updates.contactNumber}`);
      if (updates.gender) console.log(`    - Gender: ${updates.gender}`);
      if (updates.assignedArea) console.log(`    - Assigned Area: ${updates.assignedArea}`);
      
      updatedCount++;
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('MIGRATION COMPLETED');
    console.log('='.repeat(60));
    console.log(`✅ Successfully updated: ${updatedCount} user(s)`);
    console.log(`⊘ Skipped (already complete): ${skippedCount} user(s)`);
    console.log(`📊 Total processed: ${usersSnapshot.docs.length} user(s)`);
    console.log('='.repeat(60));
    
  } catch (error) {
    console.error('\n❌ ERROR during migration:', error);
    if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
      console.error('\n⚠️  Authentication failed! Please check your admin credentials in the script.');
    }
    console.error('Stack trace:', error.stack);
  } finally {
    // Sign out
    await auth.signOut();
    console.log('\n✓ Signed out successfully.');
  }
}

// Run the migration
console.log('\nStarting migration in 2 seconds...');
setTimeout(() => {
  migrateAllUsers();
}, 2000);

// Script to add sample client data (homeAddress, contactNumber, gender, assignedArea) to existing clients
const firebase = require('firebase/compat/app');
require('firebase/compat/firestore');

// Firebase configuration - REPLACE WITH YOUR ACTUAL CONFIG
const firebaseConfig = {
  apiKey: "AIzaSyD8K_KcF-zCQGnwxFjxjCJVoYZxQ-q8J8s",
  authDomain: "sams-7b82f.firebaseapp.com",
  projectId: "sams-7b82f",
  storageBucket: "sams-7b82f.firebasestorage.app",
  messagingSenderId: "664969969343",
  appId: "1:664969969343:web:5f962c17e7b3ef9fb9f94d"
};

// Initialize Firebase
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

const db = firebase.firestore();

// Sample data arrays
const areas = ['North District', 'South District', 'East District', 'West District', 'Central District'];
const streets = ['Main St', 'Oak Ave', 'Pine Rd', 'Maple Dr', 'Cedar Ln', 'Elm St', 'Birch Ave'];
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
  const city = 'Sample City';
  return `${houseNumber} ${street}, ${city}`;
}

// Main function to update clients
async function updateClientData() {
  try {
    console.log('Fetching all users with role "client"...');
    
    const usersSnapshot = await db.collection('users')
      .where('role', '==', 'client')
      .get();
    
    if (usersSnapshot.empty) {
      console.log('No client users found.');
      return;
    }
    
    console.log(`Found ${usersSnapshot.docs.length} client users.`);
    
    let updatedCount = 0;
    
    for (const doc of usersSnapshot.docs) {
      const userData = doc.data();
      
      // Check if user already has the new fields
      if (userData.homeAddress && userData.contactNumber && userData.gender && userData.assignedArea) {
        console.log(`Skipping ${userData.fullName} - already has all client data`);
        continue;
      }
      
      // Generate sample data
      const updates = {
        homeAddress: userData.homeAddress || generateAddress(),
        contactNumber: userData.contactNumber || generateContactNumber(),
        gender: userData.gender || genders[Math.floor(Math.random() * genders.length)],
        assignedArea: userData.assignedArea || areas[Math.floor(Math.random() * areas.length)],
        updatedAt: firebase.firestore.Timestamp.now()
      };
      
      // Update the document
      await db.collection('users').doc(doc.id).update(updates);
      
      console.log(`✓ Updated ${userData.fullName}:`);
      console.log(`  - Home Address: ${updates.homeAddress}`);
      console.log(`  - Contact: ${updates.contactNumber}`);
      console.log(`  - Gender: ${updates.gender}`);
      console.log(`  - Assigned Area: ${updates.assignedArea}`);
      
      updatedCount++;
    }
    
    console.log(`\n✅ Successfully updated ${updatedCount} client(s).`);
    
  } catch (error) {
    console.error('❌ Error updating client data:', error);
  } finally {
    process.exit();
  }
}

// Run the script
updateClientData();

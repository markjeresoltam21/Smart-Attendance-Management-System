// Database Migration Script for Firestore
// Run this to set up your Firestore collections and initial data
// Usage: npm run migrate-db

const schema = require('./firestoreSchema');

/**
 * FIRESTORE DATABASE MIGRATION GUIDE
 * ===================================
 * 
 * This script helps you set up Firestore collections.
 * 
 * MANUAL SETUP REQUIRED (Firebase Console):
 * 
 * 1. Enable Firestore Database
 *    - Go to: https://console.firebase.google.com
 *    - Select project: smartattendance-92bd0
 *    - Click "Firestore Database" → "Create Database"
 *    - Choose "Start in test mode" → Select region → Enable
 * 
 * 2. Create Collections Manually:
 *    
 *    A. USERS COLLECTION
 *       - Click "Start collection"
 *       - Collection ID: users
 *       - Add first document with Auto-ID
 *       - Add fields as per schema below
 * 
 *    B. ATTENDANCE COLLECTION
 *       - Create collection: attendance
 *       - Will be auto-populated when users mark attendance
 * 
 * 3. Set Up Indexes (Required for queries)
 *    - Go to "Firestore Database" → "Indexes" tab
 *    - Click "Create Index"
 *    
 *    Index 1 - For attendance queries:
 *      Collection: attendance
 *      Fields: userId (Ascending), date (Descending)
 *      Query scope: Collection
 *    
 *    Index 2 - For user queries:
 *      Collection: users
 *      Fields: role (Ascending), createdAt (Descending)
 *      Query scope: Collection
 * 
 * 4. Apply Security Rules
 *    - Go to "Rules" tab in Firestore
 *    - Copy content from firestore.rules file
 *    - Paste and Publish
 */

console.log('\n================================');
console.log('🔥 FIRESTORE DATABASE MIGRATION');
console.log('================================\n');

console.log('📋 Database Schema:\n');

// Display Users Collection Schema
console.log('1️⃣  USERS COLLECTION');
console.log('   Collection ID: users');
console.log('   Document ID: {Firebase Auth UID}');
console.log('\n   Required Fields:');
console.log('   ├─ uid: string (Firebase Auth UID)');
console.log('   ├─ email: string (user email)');
console.log('   ├─ fullName: string (full name)');
console.log('   ├─ role: string ("admin" or "client")');
console.log('   ├─ employeeId: string (unique ID)');
console.log('   ├─ isActive: boolean (true/false)');
console.log('   ├─ createdAt: string (ISO timestamp)');
console.log('   └─ updatedAt: string (ISO timestamp)\n');

console.log('   Example Document:');
console.log('   {');
console.log('     "uid": "xyz123abc456",');
console.log('     "email": "admin@smartattendance.com",');
console.log('     "fullName": "System Administrator",');
console.log('     "role": "admin",');
console.log('     "employeeId": "ADMIN001",');
console.log('     "isActive": true,');
console.log('     "createdAt": "2025-11-10T08:00:00.000Z"');
console.log('   }\n');

// Display Attendance Collection Schema
console.log('2️⃣  ATTENDANCE COLLECTION');
console.log('   Collection ID: attendance');
console.log('   Document ID: {userId}_{date} (e.g., abc123_2025-11-10)');
console.log('\n   Required Fields:');
console.log('   ├─ userId: string (reference to user)');
console.log('   ├─ userName: string (user full name)');
console.log('   ├─ status: string ("present", "absent", "late")');
console.log('   ├─ date: string (YYYY-MM-DD format)');
console.log('   ├─ checkInTime: string (time of check-in)');
console.log('   ├─ timestamp: string (ISO timestamp)');
console.log('   └─ createdAt: string (ISO timestamp)\n');

console.log('   Example Document:');
console.log('   {');
console.log('     "userId": "xyz123abc456",');
console.log('     "userName": "John Doe",');
console.log('     "status": "present",');
console.log('     "date": "2025-11-10",');
console.log('     "checkInTime": "09:15:30 AM",');
console.log('     "timestamp": "2025-11-10T09:15:30.000Z",');
console.log('     "createdAt": "2025-11-10T09:15:30.000Z"');
console.log('   }\n');

// Display Setup Instructions
console.log('📝 SETUP INSTRUCTIONS:\n');
console.log('Step 1: Enable Firestore Database');
console.log('   → Go to: https://console.firebase.google.com');
console.log('   → Select: smartattendance-92bd0');
console.log('   → Firestore Database → Create Database');
console.log('   → Start in test mode → Enable\n');

console.log('Step 2: Collections will be created automatically');
console.log('   → When you register first user → "users" collection created');
console.log('   → When attendance marked → "attendance" collection created\n');

console.log('Step 3: Create Composite Indexes (IMPORTANT!)');
console.log('   → Firestore → Indexes tab → Create Index');
console.log('   → Collection: attendance');
console.log('   → Fields: userId (Ascending), date (Descending)');
console.log('   → Click "Create"\n');

console.log('Step 4: Apply Security Rules');
console.log('   → Firestore → Rules tab');
console.log('   → Copy from: firestore.rules');
console.log('   → Publish rules\n');

console.log('Step 5: Enable Authentication');
console.log('   → Authentication → Get Started');
console.log('   → Email/Password → Enable\n');

// Display Admin User Creation
console.log('👤 CREATE ADMIN USER:\n');
console.log('Option 1: Through App');
console.log('   1. Register a new user in the app');
console.log('   2. Go to Firestore → users collection');
console.log('   3. Find the user document');
console.log('   4. Change "role" field from "client" to "admin"');
console.log('   5. Save changes\n');

console.log('Option 2: Manual Creation');
console.log('   1. Go to Firestore → users collection');
console.log('   2. Add document with custom ID');
console.log('   3. Add all required fields');
console.log('   4. Set role: "admin"\n');

// Display Testing Checklist
console.log('✅ TESTING CHECKLIST:\n');
console.log('□ Firestore database created');
console.log('□ Authentication enabled (Email/Password)');
console.log('□ Security rules applied');
console.log('□ Indexes created');
console.log('□ First user registered');
console.log('□ Admin user created');
console.log('□ Attendance marking works');
console.log('□ Data saves to Firestore');
console.log('□ Admin can see all records\n');

console.log('================================');
console.log('📱 Ready to test on Android!');
console.log('   Run: npm start');
console.log('   Open in Expo Go app');
console.log('================================\n');

// Export schema for reference
module.exports = {
  schema,
  setupComplete: false,
  instructions: 'Follow the manual setup steps above'
};

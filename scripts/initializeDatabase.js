// Firebase Database Initialization Script
// Run this script to set up initial admin user and test data
// Usage: npm run init-db

const admin = require('firebase-admin');
const serviceAccount = require('../google-services.json');

// Initialize Firebase Admin SDK
admin.initializeApp({
  credential: admin.credential.cert({
    projectId: serviceAccount.project_info.project_id,
    clientEmail: `firebase-adminsdk@${serviceAccount.project_info.project_id}.iam.gserviceaccount.com`,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')
  })
});

const db = admin.firestore();
const auth = admin.auth();

async function initializeDatabase() {
  try {
    console.log('🔥 Initializing Firebase database...\n');

    // Create admin user
    console.log('Creating admin user...');
    let adminUser;
    try {
      adminUser = await auth.createUser({
        email: 'admin@smartattendance.com',
        password: 'admin123',
        displayName: 'System Administrator'
      });
      console.log('✅ Admin user created with UID:', adminUser.uid);
    } catch (error) {
      if (error.code === 'auth/email-already-exists') {
        console.log('ℹ️  Admin user already exists');
        const existingUser = await auth.getUserByEmail('admin@smartattendance.com');
        adminUser = existingUser;
      } else {
        throw error;
      }
    }

    // Add admin user to Firestore
    console.log('Adding admin data to Firestore...');
    await db.collection('users').doc(adminUser.uid).set({
      uid: adminUser.uid,
      email: 'admin@smartattendance.com',
      fullName: 'System Administrator',
      role: 'admin',
      employeeId: 'ADMIN001',
      createdAt: new Date().toISOString(),
      isActive: true
    }, { merge: true });
    console.log('✅ Admin data saved to Firestore\n');

    // Create sample client user
    console.log('Creating sample client user...');
    let clientUser;
    try {
      clientUser = await auth.createUser({
        email: 'client@smartattendance.com',
        password: 'client123',
        displayName: 'John Doe'
      });
      console.log('✅ Client user created with UID:', clientUser.uid);
    } catch (error) {
      if (error.code === 'auth/email-already-exists') {
        console.log('ℹ️  Client user already exists');
        const existingUser = await auth.getUserByEmail('client@smartattendance.com');
        clientUser = existingUser;
      } else {
        throw error;
      }
    }

    // Add client user to Firestore
    await db.collection('users').doc(clientUser.uid).set({
      uid: clientUser.uid,
      email: 'client@smartattendance.com',
      fullName: 'John Doe',
      role: 'client',
      employeeId: 'EMP001',
      createdAt: new Date().toISOString(),
      isActive: true
    }, { merge: true });
    console.log('✅ Client data saved to Firestore\n');

    console.log('✨ Database initialization completed!\n');
    console.log('📋 Login Credentials:');
    console.log('   Admin: admin@smartattendance.com / admin123');
    console.log('   Client: client@smartattendance.com / client123\n');

  } catch (error) {
    console.error('❌ Error initializing database:', error);
  } finally {
    process.exit();
  }
}

// Run initialization
initializeDatabase();

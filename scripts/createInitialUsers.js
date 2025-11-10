// Script to create initial users in Firebase
const { initializeApp } = require('firebase/app');
const { getAuth, createUserWithEmailAndPassword } = require('firebase/auth');
const { getFirestore, doc, setDoc } = require('firebase/firestore');

const firebaseConfig = {
  apiKey: "AIzaSyCS1l_5NnaeWOAgrEsgFaGg_1iWvS8PMOo",
  authDomain: "smartattendance-92bd0.firebaseapp.com",
  projectId: "smartattendance-92bd0",
  storageBucket: "smartattendance-92bd0.firebasestorage.app",
  messagingSenderId: "45288136361",
  appId: "1:45288136361:android:bb055131277b29edb8d3b8"
};

async function createUsers() {
  console.log('🚀 Starting user creation...\n');

  // Initialize Firebase
  const app = initializeApp(firebaseConfig);
  const auth = getAuth(app);
  const db = getFirestore(app);

  // List of users to create
  const users = [
    {
      email: 'admin@gmail.com',
      password: 'admin123',
      fullName: 'System Administrator',
      role: 'admin',
      employeeId: 'ADMIN001'
    },
    {
      email: 'markjeresoltam@gmail.com',
      password: 'student123',
      fullName: 'Mark Jeresoltam',
      role: 'client',
      employeeId: 'STU001'
    },
    {
      email: 'fernandogeraldez@gmail.com',
      password: 'students123',
      fullName: 'Fernando Geraldez',
      role: 'client',
      employeeId: 'STU002'
    },
    {
      email: 'charminsarona@gmail.com',
      password: 'students123',
      fullName: 'Charmin Sarona',
      role: 'client',
      employeeId: 'STU003'
    },
    {
      email: 'aevankrizlalicante@gmail.com',
      password: 'students123',
      fullName: 'Aevan Krizl Alicante',
      role: 'client',
      employeeId: 'STU004'
    },
    {
      email: 'leorenzparilla@gmail.com',
      password: 'students123',
      fullName: 'Leo Renz Parilla',
      role: 'client',
      employeeId: 'STU005'
    },
    {
      email: 'abbiejosol@gmail.com',
      password: 'students123',
      fullName: 'Abbie Josol',
      role: 'client',
      employeeId: 'STU006'
    }
  ];

  let successCount = 0;
  let failCount = 0;

  for (const userData of users) {
    try {
      console.log(`📝 Creating user: ${userData.fullName}...`);
      
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        userData.email,
        userData.password
      );
      
      await setDoc(doc(db, 'users', userCredential.user.uid), {
        uid: userCredential.user.uid,
        email: userData.email,
        fullName: userData.fullName,
        role: userData.role,
        employeeId: userData.employeeId,
        createdAt: new Date().toISOString(),
        isActive: true
      });
      
      console.log(`✅ ${userData.fullName} created successfully!`);
      console.log(`   Email: ${userData.email}`);
      console.log(`   Password: ${userData.password}`);
      console.log(`   Role: ${userData.role}\n`);
      
      successCount++;
      
      // Sign out before creating next user
      await auth.signOut();
      
    } catch (error) {
      if (error.code === 'auth/email-already-in-use') {
        console.log(`⚠️  ${userData.fullName} already exists (${userData.email})\n`);
      } else {
        console.error(`❌ Error creating ${userData.fullName}:`, error.message, '\n');
        failCount++;
      }
    }
  }

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🎉 User Creation Summary');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`✅ Successfully created: ${successCount}`);
  if (failCount > 0) console.log(`❌ Failed: ${failCount}`);
  console.log('\nYou can now login with these accounts:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('👨‍💼 ADMIN:');
  console.log('   Email: admin@gmail.com');
  console.log('   Password: admin123\n');
  console.log('👨‍🎓 STUDENTS:');
  console.log('   Mark Jeresoltam: markjeresoltam@gmail.com / student123');
  console.log('   Fernando Geraldez: fernandogeraldez@gmail.com / students123');
  console.log('   Charmin Sarona: charminsarona@gmail.com / students123');
  console.log('   Aevan Krizl Alicante: aevankrizlalicante@gmail.com / students123');
  console.log('   Leo Renz Parilla: leorenzparilla@gmail.com / students123');
  console.log('   Abbie Josol: abbiejosol@gmail.com / students123');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  process.exit(0);
}

createUsers();

// Firebase configuration using COMPAT API for Expo Go compatibility
// This uses the older API that works reliably with React Native/Expo Go
import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import 'firebase/compat/firestore';

console.log('🔧 Initializing Firebase (compat mode)...');

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCS1l_5NnaeWOAgrEsgFaGg_1iWvS8PMOo",
  authDomain: "smartattendance-92bd0.firebaseapp.com",
  projectId: "smartattendance-92bd0",
  storageBucket: "smartattendance-92bd0.firebasestorage.app",
  messagingSenderId: "45288136361",
  appId: "1:45288136361:android:bb055131277b29edb8d3b8"
};

// Initialize Firebase only once
if (!firebase.apps.length) {
  console.log('📱 Initializing Firebase app...');
  firebase.initializeApp(firebaseConfig);
  console.log('✅ Firebase initialized successfully');
} else {
  console.log('♻️  Firebase already initialized');
}

// Get Auth and Firestore instances
const auth = firebase.auth();
const db = firebase.firestore();

console.log('✅ Firebase setup complete!');
console.log('📦 Project:', firebaseConfig.projectId);

export { auth, db, firebase };
export default firebase;

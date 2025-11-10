// Firebase service exports for easy access (COMPAT API)
import { auth, db, firebase } from './firebase';

// Re-export Firebase instances
export { auth, db, firebase };

// Firestore helper to get Timestamp
export const Timestamp = firebase.firestore.Timestamp;

// Export commonly used Firestore methods as helpers
export const collection = (collectionPath) => db.collection(collectionPath);
export const doc = (collectionPath, docId) => db.collection(collectionPath).doc(docId);
export const getDoc = (docRef) => docRef.get();
export const getDocs = (collectionRef) => collectionRef.get();
export const setDoc = (docRef, data) => docRef.set(data);
export const updateDoc = (docRef, data) => docRef.update(data);
export const deleteDoc = (docRef) => docRef.delete();
export const query = (collectionRef) => collectionRef;
export const where = (field, operator, value) => ({ field, operator, value });
export const orderBy = (field, direction = 'asc') => ({ field, direction });

// Auth helpers
export const createUserWithEmailAndPassword = (email, password) => 
  auth.createUserWithEmailAndPassword(email, password);

export const signInWithEmailAndPassword = (email, password) => 
  auth.signInWithEmailAndPassword(email, password);

export const signOut = () => auth.signOut();

export const onAuthStateChanged = (callback) => auth.onAuthStateChanged(callback);

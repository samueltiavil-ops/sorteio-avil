import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, getDocs, deleteDoc, doc, onSnapshot, query, orderBy, writeBatch } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

export interface User {
  id?: string;
  fullName: string;
  phone: string;
  city: string;
  activityBranch: string;
  rawMaterial: string;
  followedInstagram: boolean;
  createdAt: number;
}

const COLLECTION_NAME = 'participants';

export const addUser = async (user: Omit<User, 'id' | 'createdAt'>) => {
  return addDoc(collection(db, COLLECTION_NAME), {
    ...user,
    createdAt: Date.now(),
  });
};

export const getUsers = async () => {
  const q = query(collection(db, COLLECTION_NAME), orderBy('createdAt', 'desc'));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as User[];
};

export const subscribeToUsers = (callback: (users: User[]) => void) => {
  const q = query(collection(db, COLLECTION_NAME), orderBy('createdAt', 'desc'));
  return onSnapshot(q, (snapshot) => {
    const users = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as User[];
    callback(users);
  });
};

export const deleteUser = async (id: string) => {
  return deleteDoc(doc(db, COLLECTION_NAME, id));
};

export const clearUsers = async () => {
  const querySnapshot = await getDocs(collection(db, COLLECTION_NAME));
  const batch = writeBatch(db);
  querySnapshot.docs.forEach((d) => {
    batch.delete(d.ref);
  });
  return batch.commit();
};

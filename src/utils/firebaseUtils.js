const { initializeApp } = require('firebase/app');
const { getMessaging, getToken, onMessage } = require('firebase/messaging');
const { getFirestore, collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, query, where, orderBy } = require('firebase/firestore');

const firebaseConfig = {
  apiKey: "AIzaSyDY1xIbPrs_--dUrAxY5GNCMOgfEiX6k8M",
  authDomain: "push-noti-36d6b.firebaseapp.com",
  projectId: "push-noti-36d6b",
  storageBucket: "push-noti-36d6b.firebasestorage.app",
  messagingSenderId: "68130770467",
  appId: "1:68130770467:web:5976a014bc944c1a84ab96",
  measurementId: "G-PYRXNPBKG9"
};

const vapidKey = "BJPMBzbM5XCnWcgzKp1Y130V0ci7W7tKjxkiI3V4zPR6TuBzdxPfXCPzE8HMoiLDSbFS_JBSyeAUiiLKUATrylU";

const app = initializeApp(firebaseConfig);
const messaging = getMessaging(app);
const db = getFirestore(app);


export { db, collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, query, where, orderBy };

export const requestFCMToken = async () => {
    return Notification.requestPermission().then((permission) => { 
        if (permission === 'granted') {
            return getToken(messaging, {vapidKey});
        }
        else {
            throw new Error('Permission not granted for Notification');
        }});
}


export { messaging, onMessage };
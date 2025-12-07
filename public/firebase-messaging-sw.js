importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

const firebaseConfig = {
  apiKey: "AIzaSyDY1xIbPrs_--dUrAxY5GNCMOgfEiX6k8M",
  authDomain: "push-noti-36d6b.firebaseapp.com",
  projectId: "push-noti-36d6b",
  storageBucket: "push-noti-36d6b.firebasestorage.app",
  messagingSenderId: "68130770467",
  appId: "1:68130770467:web:5976a014bc944c1a84ab96",
  measurementId: "G-PYRXNPBKG9"
};

firebase.initializeApp(firebaseConfig);

const messaging = firebase.messaging();

// Handle background messages (when browser/app is not focused)
messaging.onBackgroundMessage(function(payload) {
  console.log('Received background message ', payload);
  
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/favicon.ico'
  };

  return self.registration.showNotification(notificationTitle, notificationOptions);
});

// This is for foreground messages (when browser/app is focused)
// Note: This won't work in service workers, it should be in the main app
// We'll handle foreground messages in the main application instead
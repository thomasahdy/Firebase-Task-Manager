import './App.css';
import { useEffect, useState } from 'react';
import { requestFCMToken, messaging, onMessage } from './utils/firebaseUtils';
import TaskList from './components/TaskList';

function App() {
  const [fcmToken, setFcmToken] = useState(null);
  const [notificationPermission, setNotificationPermission] = useState(false);

  useEffect(() => { 
    // Set up foreground message handler
    const unsubscribe = onMessage(messaging, (payload) => {
      console.log('Message received in foreground: ', payload);
      // Display notification using the Notification API
      if (Notification.permission === 'granted') {
        new Notification(payload.notification.title, {
          body: payload.notification.body,
          icon: '/favicon.ico'
        });
      }
    });
    
    const fetchFCMToken = async () => {
      try {
        const token = await requestFCMToken();
        setFcmToken(token);
        setNotificationPermission(true);
        console.log('FCM Token:', token);
      } catch (error) {
        console.error('Error fetching FCM token:', error);
      }
    }
    
    fetchFCMToken();
    
    // Cleanup function to unsubscribe from foreground message handler
    return () => {
      unsubscribe();
    };
  }, []);

  return (
    <div className="App">
      <header className="App-header">
        <h1>Firebase Task Manager</h1>
        {notificationPermission ? (
          <p>Notifications enabled. FCM Token: {fcmToken ? 'Received' : 'Loading...'}</p>
        ) : (
          <p>Please enable notifications to receive task updates</p>
        )}
      </header>
      <main>
        <TaskList fcmToken={fcmToken} />
      </main>
    </div>
  );
}

export default App;
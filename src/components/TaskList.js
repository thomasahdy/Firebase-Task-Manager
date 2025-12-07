import React, { useState, useEffect } from 'react';
import './TaskList.css';
import { db, collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, query, where, orderBy } from '../utils/firebaseUtils';

const TaskList = ({ fcmToken }) => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    status: 'pending'
  });
  

  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');


  useEffect(() => {
    let tasksQuery;
    
    try {
    
      if (statusFilter === 'all') {
        tasksQuery = query(
          collection(db, 'tasks'),
          orderBy(sortBy, sortOrder)
        );
      } else {
        tasksQuery = query(
          collection(db, 'tasks'),
          where('status', '==', statusFilter),
          orderBy(sortBy, sortOrder)
        );
      }
      
      const unsubscribe = onSnapshot(tasksQuery, (snapshot) => {
        const tasksData = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          tasksData.push({
            id: doc.id,
            ...data
          });
        });
        setTasks(tasksData);
        setLoading(false);
      }, (error) => {
        console.error("Error fetching tasks:", error);
    
        if (error.code === 'failed-precondition') {
          setError(`Firestore requires composite indexes for queries.`);
          
        
          let fallbackQuery;
          if (statusFilter === 'all') {
            fallbackQuery = collection(db, 'tasks');
          } else {
            fallbackQuery = query(
              collection(db, 'tasks'),
              where('status', '==', statusFilter)
            );
          }
          
          const fallbackUnsubscribe = onSnapshot(fallbackQuery, (snapshot) => {
            const tasksData = [];
            snapshot.forEach((doc) => {
              const data = doc.data();
              tasksData.push({
                id: doc.id,
                ...data
              });
            });
            setTasks(tasksData);
            setLoading(false);
          });
          
          return fallbackUnsubscribe;
        } else {
          setError(`Failed to fetch tasks: ${error.message || 'Unknown error'}`);
          setLoading(false);
        }
      });

      
      return () => unsubscribe();
    } catch (err) {
      console.error("Error setting up query:", err);
      setError(`Error setting up real-time listener: ${err.message || 'Unknown error'}`);
      setLoading(false);
    }
  }, [statusFilter, sortBy, sortOrder]);


  const createTask = async (e) => {
    e.preventDefault();
    try {
      const tasksCollection = collection(db, 'tasks');
      const taskData = {
        title: newTask.title,
        description: newTask.description || '',
        status: newTask.status,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      const docRef = await addDoc(tasksCollection, taskData);
      
      setNewTask({ title: '', description: '', status: 'pending' });
      

      if (fcmToken) {
        sendTaskNotification({
          id: docRef.id,
          ...taskData
        });
      }
    } catch (err) {
      console.error("Error creating task:", err);
      setError(`Failed to create task: ${err.message || 'Unknown error'}. Please check your Firestore security rules.`);
    }
  };


  const updateTaskStatus = async (taskId, status) => {
    try {
      const taskDoc = doc(db, 'tasks', taskId);
      const updateData = {
        status: status,
        updatedAt: new Date()
      };
      
      await updateDoc(taskDoc, updateData);
      

      if (fcmToken) {
        const updatedTask = tasks.find(task => task.id === taskId);
        if (updatedTask) {
          sendTaskNotification({
            ...updatedTask,
            status: status,
            updatedAt: new Date()
          });
        }
      }
    } catch (err) {
      console.error("Error updating task:", err);
      setError(`Failed to update task: ${err.message || 'Unknown error'}. Please check your Firestore security rules.`);
    }
  };


  const sendTaskNotification = async (task) => {
    try {
      const response = await fetch('http://localhost:30000/api/firebase/send-notification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          deviceToken: fcmToken,
          title: 'Task Updated',
          body: `Task "${task.title}" has been updated to ${task.status}`
        }),
      });
      
      if (!response.ok) {
        console.error('Failed to send notification');
      }
    } catch (err) {
      console.error('Error sending notification:', err);
    }
  };


  const deleteTask = async (taskId) => {
    try {
      const taskDoc = doc(db, 'tasks', taskId);
      await deleteDoc(taskDoc);
    } catch (err) {
      console.error("Error deleting task:", err);
      setError(`Failed to delete task: ${err.message || 'Unknown error'}. Please check your Firestore security rules.`);
    }
  };

  if (loading) return <div>Loading tasks...</div>;
  if (error) return <div className="error">Error: {error}</div>;

  return (
    <div className="TaskList">
      <h2>Task Management</h2>
      
      {/* Filter and sort controls */}
      <div className="controls">
        <div>
          <label htmlFor="statusFilter">Filter by status: </label>
          <select 
            id="statusFilter"
            value={statusFilter} 
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Tasks</option>
            <option value="pending">Pending</option>
            <option value="in-progress">In Progress</option>
            <option value="completed">Completed</option>
          </select>
        </div>
        
        <div>
          <label htmlFor="sortBy">Sort by: </label>
          <select 
            id="sortBy"
            value={sortBy} 
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="createdAt">Created Date</option>
            <option value="updatedAt">Updated Date</option>
            <option value="title">Title</option>
            <option value="status">Status</option>
          </select>
          
          <select 
            value={sortOrder} 
            onChange={(e) => setSortOrder(e.target.value)}
          >
            <option value="desc">Descending</option>
            <option value="asc">Ascending</option>
          </select>
        </div>
      </div>
      
      {/* Task creation form */}
      <div>
        <h3>Create New Task</h3>
        <form onSubmit={createTask}>
          <div>
            <input
              type="text"
              placeholder="Task title"
              value={newTask.title}
              onChange={(e) => setNewTask({...newTask, title: e.target.value})}
              required
            />
          </div>
          <div>
            <textarea
              placeholder="Task description"
              value={newTask.description}
              onChange={(e) => setNewTask({...newTask, description: e.target.value})}
            />
          </div>
          <div>
            <select
              value={newTask.status}
              onChange={(e) => setNewTask({...newTask, status: e.target.value})}
            >
              <option value="pending">Pending</option>
              <option value="in-progress">In Progress</option>
              <option value="completed">Completed</option>
            </select>
          </div>
          <button type="submit">Create Task</button>
        </form>
      </div>
      
      {/* Task list */}
      <div>
        <h3>Tasks ({tasks.length})</h3>
        {tasks.length === 0 ? (
          <p>No tasks found</p>
        ) : (
          <ul>
            {tasks.map(task => (
              <li key={task.id}>
                <h4>{task.title}</h4>
                <p>{task.description}</p>
                <p>Status: {task.status}</p>
                <p>Created: {task.createdAt ? new Date(task.createdAt.seconds * 1000).toLocaleString() : 'N/A'}</p>
                <p>Updated: {task.updatedAt ? new Date(task.updatedAt.seconds * 1000).toLocaleString() : 'N/A'}</p>
                
                <div className="task-actions">
                  <select 
                    value={task.status} 
                    onChange={(e) => updateTaskStatus(task.id, e.target.value)}
                  >
                    <option value="pending">Pending</option>
                    <option value="in-progress">In Progress</option>
                    <option value="completed">Completed</option>
                  </select>
                  <button onClick={() => deleteTask(task.id)}>Delete</button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default TaskList;
import React, { useEffect, useState } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Assignments from './pages/Assignments';
import AssignmentDetails from './pages/AssignmentDetails';
import Issues from './pages/Issues';
import Messages from './pages/Messages';
import Login from './pages/Login';
import Assistant from './pages/Assistant';
import Users from './pages/Users';
import { dataService } from './services/store';
import { User, Assignment, Issue, Message } from './types';

// Updated to the correct repository URL where the Excel file is hosted
const SYNC_URL = 'https://jckraus1.github.io/Tillman-Dashboard/tillman-project.xlsx';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(dataService.getCurrentUser());
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [issues, setIssues] = useState<Issue[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);

  // Load initial data
  const refreshData = () => {
    setAssignments(dataService.getAssignments());
    setIssues(dataService.getIssues());
    setMessages(dataService.getMessages());
  };

  useEffect(() => {
    if (user) {
      refreshData();
      
      // Auto-Sync Logic
      const performAutoSync = async () => {
        if (dataService.shouldAutoSync()) {
          console.log("Auto-sync triggered...");
          const result = await dataService.syncProjectsFromExcel(SYNC_URL);
          if (result.success) {
            console.log("Auto-sync success", result);
            refreshData();
          } else {
            console.error("Auto-sync failed", result.error);
          }
        }
      };

      // Check immediately on load
      performAutoSync();

      // Check every minute if a sync is due (30 min interval)
      const intervalId = setInterval(performAutoSync, 60000);

      return () => clearInterval(intervalId);
    }
  }, [user]);

  const handleLogout = () => {
    dataService.logout();
    setUser(null);
  };

  const handleUpdateStatus = (id: string, status: any, notes?: string, footage?: number) => {
    if (!user) return;
    dataService.updateAssignmentStatus(id, status, user.id, notes, footage);
    refreshData();
  };

  const handleCreateIssue = (issue: any) => {
    dataService.createIssue(issue);
    refreshData();
  };

  return (
    <HashRouter>
      <Routes>
        <Route 
          path="/login" 
          element={
            !user ? <Login onLogin={setUser} /> : <Navigate to="/" replace />
          } 
        />
        
        {/* Protected Routes */}
        <Route 
          path="*" 
          element={
            user ? (
              <Layout user={user} onLogout={handleLogout}>
                <Routes>
                  <Route 
                    path="/" 
                    element={
                      user.role === 'crew' 
                        ? <Navigate to="/assignments" replace /> 
                        : <Dashboard assignments={assignments} issues={issues} />
                    } 
                  />
                  <Route 
                    path="/assignments" 
                    element={
                      <Assignments 
                        assignments={assignments} 
                        currentUser={user} 
                        onUpdateStatus={handleUpdateStatus}
                      />
                    } 
                  />
                  <Route 
                    path="/assignments/:id" 
                    element={
                      <AssignmentDetails 
                        currentUser={user}
                        onUpdateStatus={handleUpdateStatus}
                      />
                    } 
                  />
                  <Route 
                    path="/issues" 
                    element={
                      <Issues 
                        issues={issues} 
                        assignments={assignments} 
                        currentUser={user} 
                        onCreateIssue={handleCreateIssue}
                      />
                    } 
                  />
                  <Route 
                    path="/messages" 
                    element={
                      <Messages 
                        messages={messages} 
                        currentUser={user}
                      />
                    } 
                  />
                   <Route 
                    path="/users" 
                    element={
                      <Users />
                    } 
                  />
                  <Route 
                    path="/assistant" 
                    element={
                      <Assistant />
                    } 
                  />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </Layout>
            ) : (
              <Navigate to="/login" replace />
            )
          } 
        />
      </Routes>
    </HashRouter>
  );
};

export default App;
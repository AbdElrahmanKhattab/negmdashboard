import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'sonner'
import AppShell from './components/layout/AppShell'
import Dashboard from './pages/Dashboard'
import Projects from './pages/Projects'
import ProjectDetail from './pages/ProjectDetail'
import MilestoneDetail from './pages/MilestoneDetail'
import Clients from './pages/Clients'
import ClientDetail from './pages/ClientDetail'
import Transactions from './pages/Transactions'
import Settings from './pages/Settings'
import Login from './pages/Login'
import ClientShare from './pages/ClientShare'
import Analytics from './pages/Analytics'
import Reports from './pages/Reports'

import { useAuthListener } from './hooks/useAuth'

function AuthInitializer() {
  useAuthListener();
  return null;
}

function App() {
  return (
    <BrowserRouter>
      <AuthInitializer />
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/share/project/:token" element={<ClientShare />} />
        
        {/* Protected Routes inside AppShell */}
        <Route element={<AppShell />}>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          
          <Route path="/projects" element={<Projects />} />
          <Route path="/projects/:id" element={<ProjectDetail />} />
          <Route path="/projects/:projectId/milestones/:id" element={<MilestoneDetail />} />
          
          <Route path="/clients" element={<Clients />} />
          <Route path="/clients/:id" element={<ClientDetail />} />
          
          <Route path="/transactions" element={<Transactions />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/settings" element={<Settings />} />
        </Route>
      </Routes>
      <Toaster position="bottom-right" richColors theme="dark" />
    </BrowserRouter>
  )
}

export default App

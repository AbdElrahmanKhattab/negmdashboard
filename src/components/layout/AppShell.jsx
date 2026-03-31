import React from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import { useAuthStore } from '@/stores/authStore';
import { useAuthListener } from '@/hooks/useAuth';

export default function AppShell() {
  const user = useAuthStore(s => s.user);
  const initialized = useAuthStore(s => s.initialized);
  
  // Listen for auth state changes (login/logout/session refresh handled in App.jsx)

  // Show loading state while checking initial session
  if (!initialized) {
    return (
      <div className="min-h-screen bg-bg-base flex items-center justify-center">
        <div className="animate-spin w-10 h-10 border-4 border-accent border-t-transparent rounded-full" />
      </div>
    );
  }

  // After initialization, if no user is present, redirect to login  
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="flex h-screen w-full bg-[#f4f7fb] overflow-hidden selection:bg-accent/30 selection:text-text-primary">
      {/* Sidebar - Left aligned in LTR */}
      <Sidebar />
      
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden relative">
        <Header />
        
        {/* Scrollable Page Content */}
        <main className="flex-1 overflow-y-auto w-full relative">
          <div className="h-full w-full p-6 md:p-8 max-w-[1600px] mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}

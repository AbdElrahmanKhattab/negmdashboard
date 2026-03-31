import React from 'react';
import { NavLink } from 'react-router-dom';
import { Bell, HelpCircle } from 'lucide-react';
import Avatar from '@/components/common/Avatar';
import NotificationDropdown from '@/components/common/NotificationDropdown';
import { useAuthStore } from '@/stores/authStore';
import { useNotifications, useMarkNotificationRead, useMarkAllNotificationsRead } from '@/hooks/useData';
import { useRealtimeNotifications } from '@/hooks/useRealtime';

export default function Header() {
  const user = useAuthStore((state) => state.user);
  const { data: notifications } = useNotifications();
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();

  useRealtimeNotifications(user?.id);

  return (
    <header className="h-20 bg-bg-surface border-b border-border-subtle flex items-center px-8 shrink-0 relative z-10">
      
      {/* Left side: Brand / Tabs */}
      <div className="flex items-center gap-10 flex-1">
        <h1 className="text-xl font-bold text-[#1e3a8a] tracking-tight">
          Blueprint Engineering
        </h1>
        
        <nav className="hidden md:flex items-center gap-8 h-full pt-1">
          <NavLink to="/dashboard" className={({isActive}) => `text-sm font-semibold pb-6 pt-6 border-b-2 transition-colors ${isActive ? 'text-[#0d47a1] border-[#0d47a1]' : 'text-text-muted hover:text-text-primary border-transparent'}`}>
            Dashboard
          </NavLink>
          <NavLink to="/analytics" className={({isActive}) => `text-sm font-semibold pb-6 pt-6 border-b-2 transition-colors ${isActive ? 'text-[#0d47a1] border-[#0d47a1]' : 'text-text-muted hover:text-text-primary border-transparent'}`}>
            Analytics
          </NavLink>
          <NavLink to="/reports" className={({isActive}) => `text-sm font-semibold pb-6 pt-6 border-b-2 transition-colors ${isActive ? 'text-[#0d47a1] border-[#0d47a1]' : 'text-text-muted hover:text-text-primary border-transparent'}`}>
            Reports
          </NavLink>
        </nav>
      </div>

      {/* Right side actions */}
      <div className="flex items-center gap-6">
        
        {/* Icons */}
        <div className="flex items-center gap-4 text-text-muted">
          <button className="hover:text-text-primary transition-colors relative">
            <Bell className="w-5 h-5" />
            {(notifications?.filter(n => !n.is_read)?.length > 0) && (
              <span className="absolute top-0 right-0 w-2 h-2 bg-status-critical rounded-full border-2 border-bg-surface translate-x-1/2 -translate-y-1/2"></span>
            )}
          </button>
          <button className="hover:text-text-primary transition-colors">
            <HelpCircle className="w-5 h-5" />
          </button>
        </div>

        {/* Divider */}
        <div className="h-8 w-px bg-border-subtle" />

        {/* Profile */}
        <div className="flex items-center gap-3 cursor-pointer hover:bg-bg-base p-1.5 -mr-1.5 rounded-lg transition-colors">
          <div className="hidden md:flex flex-col items-end">
            <span className="text-sm font-bold text-text-primary font-sans leading-tight">
              {user?.user_metadata?.full_name || user?.email || 'User'}
            </span>
            <span className="text-[11px] text-text-muted font-sans font-medium capitalize">
              {user?.user_metadata?.role || 'Administrator'}
            </span>
          </div>
          <Avatar 
            alt={user?.user_metadata?.full_name || 'User'} 
            size="md"
          />
        </div>
      </div>
    </header>
  );
}

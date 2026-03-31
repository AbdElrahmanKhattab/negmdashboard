import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { LayoutDashboard, ReceiptText, FileText, BarChart3, History, Settings, LogOut, Cloud, Plus, UsersRound } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { signOut } from '@/hooks/useAuth';

const navigation = [
  { name: 'Overview', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Transactions (المعاملات)', href: '/transactions', icon: ReceiptText },
  { name: 'Clients (العملاء)', href: '/clients', icon: Users }, // Using clients instead of specs for now since we have a clients page
  { name: 'Projects (المشاريع)', href: '/projects', icon: FileText },
  { name: 'Team (فريق العمل)', href: '/employees', icon: UsersRound },
  { name: 'Settings', href: '/settings', icon: Settings },
];
// Note: We adjusted the nav slightly to fit the existing pages while keeping the design aesthetic.
import { Users } from 'lucide-react';

export default function Sidebar() {
  const office = useAuthStore((state) => state.office);
  const clearAuth = useAuthStore((state) => state.clearAuth);
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await signOut();
    } catch (e) {
      // silent
    }
    clearAuth();
    navigate('/login');
  };

  return (
    <div className="flex h-full w-64 flex-col bg-bg-surface border-r border-border-default shrink-0 overflow-y-auto">
      {/* Brand header */}
      <div className="flex px-6 pt-8 pb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#0f52ba] rounded-lg flex items-center justify-center font-bold text-white shadow-sm shrink-0">
            <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <div>
            <h2 className="font-bold text-text-primary tracking-tight font-sans text-base">
              {office?.name || 'Project Alpha'}
            </h2>
            <p className="text-[10px] text-text-muted font-sans font-semibold uppercase tracking-wider">
              Engineering Lead
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-4 space-y-1">
        {navigation.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.href}
              to={item.href}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-4 py-2.5 rounded-md font-sans text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-[#f0f4f8] text-[#0d47a1]'
                    : 'text-text-secondary hover:bg-bg-base hover:text-text-primary'
                )
              }
            >
              {({ isActive }) => (
                <>
                  <Icon className={cn("h-5 w-5 shrink-0", isActive ? "text-[#0d47a1]" : "")} />
                  {item.name}
                </>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Footer Actions */}
      <div className="p-4 space-y-4">
        {/* New Transaction Button */}
        <button 
          className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-[#0d47a1] to-[#1565c0] text-white py-2.5 px-4 rounded-md text-sm font-medium shadow-sm hover:shadow transition-all font-sans"
        >
          <Plus className="w-4 h-4" />
          NEW TRANSACTION
        </button>

        <div className="pt-4 border-t border-border-default space-y-1">
          <div className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-text-secondary hover:text-text-primary transition-colors cursor-default">
            <Cloud className="h-5 w-5 shrink-0" />
            System Status
          </div>
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 px-4 py-2.5 text-sm font-medium text-text-secondary hover:text-text-primary hover:bg-bg-base rounded-md transition-colors font-sans"
          >
            <LogOut className="h-5 w-5 shrink-0" />
            Log Out
          </button>
        </div>
      </div>
    </div>
  );
}

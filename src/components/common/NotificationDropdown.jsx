import React, { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Bell, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function NotificationDropdown({ notifications = [], onMarkRead, onMarkAllRead, className }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const unreadCount = notifications.filter(n => !n.read).length;

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className={cn("relative", className)} ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-text-secondary hover:text-text-primary transition-colors rounded-full hover:bg-bg-elevated"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-status-critical opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-status-critical border-2 border-bg-surface"></span>
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-80 bg-bg-surface border border-border-default rounded-xl shadow-lg z-50 overflow-hidden focus:outline-none">
          <div className="p-3 border-b border-border-default flex justify-between items-center bg-bg-elevated">
            <h3 className="font-semibold text-text-primary font-sans text-sm">الإشعارات ({unreadCount})</h3>
            {unreadCount > 0 && (
              <button 
                onClick={() => { onMarkAllRead && onMarkAllRead(); setIsOpen(false); }}
                className="text-xs text-accent hover:underline font-sans"
              >
                تحديد الكل كمقروء
              </button>
            )}
          </div>
          
          <div className="max-h-[300px] overflow-y-auto divide-y divide-border-subtle">
            {notifications.length === 0 ? (
              <div className="p-6 text-center text-text-muted text-sm font-sans">
                لا توجد إشعارات حالياً
              </div>
            ) : (
              notifications.map((notif, idx) => (
                <div key={notif.id || idx} className={cn("p-4 hover:bg-bg-elevated/50 transition-colors flex gap-3", !notif.read && "bg-accent/5")}>
                  {!notif.read && <div className="w-1.5 h-1.5 rounded-full bg-accent mt-1.5 shrink-0" />}
                  <div className="flex-1">
                    <p className="text-sm text-text-primary font-sans leading-tight mb-1">{notif.body}</p>
                    <span className="text-xs text-text-muted font-mono" dir="ltr">{notif.created_at}</span>
                  </div>
                  {!notif.read && (
                    <button 
                      onClick={() => onMarkRead && onMarkRead(notif.id)}
                      className="text-text-muted hover:text-status-good shrink-0 p-1 rounded-md hover:bg-bg-base transition-colors"
                      title="تحديد كمقروء"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

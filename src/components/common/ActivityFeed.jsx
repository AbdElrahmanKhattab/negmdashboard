import React from 'react';
import { cn } from '@/lib/utils';
import Avatar from './Avatar';

const ACTIVITY_ICONS = {
  create: '📝',
  update: '🔄',
  delete: '🗑️',
  payment: '💰',
  status: '🚥',
  default: '🔔'
};

export default function ActivityFeed({ activities = [], className }) {
  return (
    <div className={cn("relative", className)}>
      {/* Vertical line connecting events */}
      <div className="absolute top-4 bottom-4 right-5 w-px bg-border-subtle" />
      
      <div className="space-y-6 relative z-10">
        {activities.length === 0 ? (
          <div className="text-center text-text-muted text-sm font-sans py-8">
            لا توجد نشاطات مسجلة
          </div>
        ) : (
          activities.map((activity, index) => {
            const icon = ACTIVITY_ICONS[activity.action_type] || ACTIVITY_ICONS.default;
            
            return (
              <div key={activity.id || index} className="flex items-start gap-4">
                <div className="bg-bg-surface border border-border-default w-10 h-10 rounded-full flex items-center justify-center shadow-sm text-lg shrink-0 z-10">
                  {icon}
                </div>
                <div className="flex-1 pt-2">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 mb-1">
                    <p className="text-sm font-medium text-text-primary font-sans">
                      {activity.description}
                    </p>
                    <time className="text-xs text-text-muted font-mono whitespace-nowrap" dir="ltr">
                      {activity.created_at}
                    </time>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-text-muted font-sans mt-2">
                    <Avatar alt={activity.user?.full_name} size="sm" />
                    <span>بواسطة {activity.user?.full_name || 'النظام'}</span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

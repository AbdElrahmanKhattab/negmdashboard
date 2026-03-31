import React from 'react';
import { cn } from '@/lib/utils';
import StatusBadge from './StatusBadge';
import { Calendar, CircleDot } from 'lucide-react';

export default function TimelineView({ milestones = [], className }) {
  // Sort milestones by due date
  const sortedMilestones = [...milestones].sort((a, b) => new Date(a.due_date) - new Date(b.due_date));

  return (
    <div className={cn("relative p-4", className)}>
      {/* Central vertical line */}
      <div className="absolute top-8 bottom-8 right-8 w-0.5 bg-border-default rounded-full" />
      
      <div className="space-y-8 relative z-10">
        {sortedMilestones.length === 0 ? (
          <div className="text-center text-text-muted text-sm font-sans py-12">
            الجدول الزمني فارغ. أضف مراحل للمشروع لتظهر هنا.
          </div>
        ) : (
          sortedMilestones.map((milestone, index) => {
            const isCompleted = milestone.status === 'completed' || milestone.status === 'paid';
            const isLate = milestone.status === 'late';
            
            return (
              <div key={milestone.id || index} className="flex items-start gap-6 group">
                
                {/* Timeline node */}
                <div className="relative flex flex-col items-center mt-1">
                  <div className={cn(
                    "w-8 h-8 rounded-full border-2 flex items-center justify-center bg-bg-base z-10 transition-colors",
                    isCompleted ? "border-status-good text-status-good" : 
                    isLate ? "border-status-critical text-status-critical" : 
                    "border-accent text-accent"
                  )}>
                    <CircleDot className="w-4 h-4" />
                  </div>
                </div>

                {/* Content Card */}
                <div className={cn(
                  "flex-1 bg-bg-surface border border-border-default rounded-xl p-5 shadow-sm transition-all group-hover:border-border-strong",
                  isLate && "border-status-critical/50"
                )}>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
                    <h3 className="font-semibold text-text-primary text-base font-sans">{milestone.title}</h3>
                    <StatusBadge type={milestone.status} size="sm" />
                  </div>
                  
                  <div className="flex items-center gap-1.5 text-xs text-text-muted font-sans font-medium">
                    <Calendar className="w-4 h-4" />
                    <span dir="ltr">{milestone.due_date}</span>
                    <div className="w-1 h-1 rounded-full bg-border-strong mx-1" />
                    <span className="font-mono text-text-primary" dir="ltr">{Number(milestone.amount).toLocaleString()} ج.م</span>
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

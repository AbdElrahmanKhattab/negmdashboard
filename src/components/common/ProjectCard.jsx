import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Calendar, Briefcase } from 'lucide-react';
import { cn } from '@/lib/utils';
import HealthBadge from './HealthBadge';
import Avatar from './Avatar';
import AmountDisplay from './AmountDisplay';

export default function ProjectCard({ project, className }) {
  const navigate = useNavigate();
  // Safe defaults
  const {
    id = '',
    name = 'مشروع بدون اسم',
    client_name = 'عميل مجهول',
    health = 'good',
    progress = 0,
    total_value = 0,
    start_date,
    end_date
  } = project || {};

  return (
    <div 
      onClick={() => navigate(`/projects/${id}`)}
      className={cn(
        "bg-bg-surface border border-border-default rounded-xl p-5 hover:border-border-strong transition-all flex flex-col group shadow-sm cursor-pointer hover:shadow-md",
        className
      )}>
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-bg-base border border-border-default flex items-center justify-center text-text-muted group-hover:text-accent transition-colors">
            <Briefcase className="w-5 h-5" />
          </div>
          <div>
            <Link to={`/projects/${id}`} onClick={e => e.stopPropagation()} className="font-semibold text-text-primary hover:text-accent font-sans text-base block">
              {name}
            </Link>
            <div className="flex items-center gap-2 mt-1">
              <Avatar alt={client_name} size="sm" />
              <span className="text-xs text-text-secondary font-sans">{client_name}</span>
            </div>
          </div>
        </div>
        <HealthBadge health={health} />
      </div>

      <div className="mt-auto pt-4 border-t border-border-subtle grid grid-cols-2 gap-4">
        <div>
          <span className="text-xs text-text-muted font-sans block mb-1">قيمة المشروع</span>
          <AmountDisplay amount={total_value} size="sm" type="neutral" />
        </div>
        <div>
          <div className="flex justify-between items-center mb-1">
            <span className="text-xs text-text-muted font-sans">الإنجاز ({progress}%)</span>
          </div>
          <div className="w-full h-1.5 bg-bg-base rounded-full overflow-hidden border border-border-subtle">
            <div 
              className={cn("h-full transition-all", progress === 100 ? "bg-status-good" : "bg-accent")} 
              style={{ width: `${progress}%` }} 
            />
          </div>
        </div>
      </div>
      
      {(start_date || end_date) && (
        <div className="mt-4 flex items-center gap-1.5 text-xs text-text-muted font-sans bg-bg-base px-2.5 py-1.5 rounded-md self-start border border-border-subtle">
          <Calendar className="w-3.5 h-3.5" />
          <span dir="ltr">{start_date}</span>
          <span>إلى</span>
          <span dir="ltr">{end_date || 'غير محدد'}</span>
        </div>
      )}
    </div>
  );
}

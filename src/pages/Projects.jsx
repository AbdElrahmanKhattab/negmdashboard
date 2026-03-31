import React, { useState } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search, Filter } from 'lucide-react';
import HealthBadge from '@/components/common/HealthBadge';
import Avatar from '@/components/common/Avatar';
import AmountDisplay from '@/components/common/AmountDisplay';
import PageTransition from '@/components/common/PageTransition';
import ProjectForm from '@/components/forms/ProjectForm';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';
import { useProjects } from '@/hooks/useData';

export default function Projects() {
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const { data: projects, isLoading } = useProjects();
  const role = useAuthStore(state => state.role);
  const isOwner = role === 'owner';

  const filtered = (projects || []).filter(p =>
    p.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.client_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <PageTransition className="space-y-8 pb-10">
      <ProjectForm isOpen={showForm} onClose={() => setShowForm(false)} />
      
      {/* Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-sans text-[#1e3a8a] tracking-tight flex items-center gap-3">
            Projects 
            <span className="text-[#0d47a1] font-sans">المشاريع</span>
          </h1>
          <p className="text-sm font-sans text-text-secondary mt-1 font-medium">Manage all engineering projects and monitor their health status.</p>
        </div>
        
        {isOwner && (
          <Button onClick={() => setShowForm(true)} className="bg-[#0d47a1] hover:bg-[#1565c0] shadow-sm text-white font-sans flex items-center gap-2 h-10 px-5 transition-colors border border-[#0d47a1]">
            <Plus className="w-4 h-4 mr-1" />
            <span className="font-bold text-sm">New Project</span>
          </Button>
        )}
      </div>

      {/* Main Content Area */}
      <div className="bg-bg-surface border border-border-subtle rounded-2xl shadow-sm overflow-hidden">
        
        {/* Toolbar */}
        <div className="p-6 border-b border-border-default flex flex-col sm:flex-row gap-4 justify-between items-center bg-white">
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-text-muted" />
            <Input
              type="text"
              className="pl-9 pr-4 bg-bg-surface border-border-default h-10 font-sans text-sm rounded-lg shadow-sm focus-visible:ring-[#0d47a1] focus-visible:border-[#0d47a1] w-full"
              placeholder="Search by name or client..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Button variant="outline" className="border-border-default text-text-secondary hover:text-[#0d47a1] hover:bg-[#f8fafc] hover:border-[#0d47a1] font-sans h-10 px-4 w-full sm:w-auto transition-colors">
              <Filter className="w-4 h-4 mr-2" />
              Filters
            </Button>
          </div>
        </div>

        {/* Data Table */}
        <div className="overflow-x-auto w-full" dir="ltr">
          {isLoading ? (
            <div className="p-12 flex justify-center"><div className="animate-spin w-8 h-8 border-2 border-[#0d47a1] border-t-transparent rounded-full" /></div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center text-text-muted font-sans text-sm">No projects found.</div>
          ) : (
            <table className="w-full text-left font-sans text-sm border-collapse">
              <thead className="bg-[#f4f7fb] border-b border-border-default text-text-secondary uppercase text-xs font-bold tracking-wider">
                <tr>
                  <th className="px-6 py-4">
                    Project Name <div className="text-[10px] text-text-muted mt-0.5 lowercase capitalize-first font-sans">اسم المشروع</div>
                  </th>
                  <th className="px-6 py-4">
                    Client <div className="text-[10px] text-text-muted mt-0.5 lowercase capitalize-first font-sans">العميل</div>
                  </th>
                  <th className="px-6 py-4">
                    Health <div className="text-[10px] text-text-muted mt-0.5 lowercase capitalize-first font-sans">الحالة الصحية</div>
                  </th>
                  <th className="px-6 py-4">
                    Progress <div className="text-[10px] text-text-muted mt-0.5 lowercase capitalize-first font-sans">الإنجاز</div>
                  </th>
                  <th className="px-6 py-4 text-right">
                    Value / Due <div className="text-[10px] text-text-muted mt-0.5 lowercase capitalize-first font-sans text-right">القيمة / المستحق</div>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle text-text-primary">
                {filtered.map((project) => (
                  <tr key={project.id} className="hover:bg-[#f8fafc] transition-colors cursor-pointer group">
                    <td className="px-6 py-5">
                      <Link to={`/projects/${project.id}`} className="font-bold text-sm text-text-primary group-hover:text-[#0d47a1] transition-colors block">
                        {project.name}
                      </Link>
                      <span className="text-xs text-text-muted font-medium mt-1 inline-block">ID: {project.id.slice(0,8)}</span>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <Avatar alt={project.client_name} size="sm" />
                        <span className="font-semibold text-sm text-text-secondary">{project.client_name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <HealthBadge health={project.health} />
                    </td>
                    <td className="px-6 py-5 w-48">
                      <div className="flex items-center gap-3">
                        <div className="w-full h-2 bg-[#e2e8f0] rounded-full overflow-hidden">
                          <div 
                            className={cn("h-full rounded-full transition-all", project.progress === 100 ? "bg-[#10b981]" : "bg-[#0d47a1]")}
                            style={{ width: `${project.progress}%` }}
                          />
                        </div>
                        <span className="text-xs font-bold text-text-secondary tracking-widest">{project.progress}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-right flex flex-col items-end gap-1">
                      <div className="font-bold text-sm">
                        <AmountDisplay amount={Number(project.total_contract_value)} size="sm" type="neutral" />
                      </div>
                      {project.due > 0 && (
                        <div className="text-[11px] font-bold text-[#b91c1c] bg-[#fee2e2] px-2 py-0.5 rounded border border-[#fecaca] tracking-wide inline-flex items-center gap-1">
                          <span>Overdue:</span> {Number(project.due).toLocaleString()} ج.م
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </PageTransition>
  );
}

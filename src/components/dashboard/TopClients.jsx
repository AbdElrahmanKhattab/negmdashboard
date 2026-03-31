import React, { useMemo } from 'react';
import { useProjects } from '@/hooks/useData';
import AmountDisplay from '@/components/common/AmountDisplay';

export default function TopClients() {
  const { data: projects, isLoading } = useProjects();

  const clients = useMemo(() => {
    if (!projects) return [];
    
    // Group projects by client_name and sum up the contract value
    const clientTotals = projects.reduce((acc, project) => {
      const client = project.client_name || 'Unknown Client';
      const val = Number(project.total_contract_value) || 0;
      if (!acc[client]) {
        acc[client] = 0;
      }
      acc[client] += val;
      return acc;
    }, {});

    // Sort by value descending and take top 5
    const sorted = Object.entries(clientTotals)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    // Calculate max value for progress bars
    const maxVal = sorted.length > 0 ? sorted[0][1] : 1;

    return sorted.map(([name, value]) => ({
      id: name.substring(0, 2).toUpperCase(),
      name,
      value,
      percent: Math.round((value / maxVal) * 100)
    }));
  }, [projects]);

  return (
    <div className="bg-bg-surface border border-border-subtle rounded-2xl p-6 shadow-sm flex flex-col h-full min-h-[300px]">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="font-bold text-sm text-text-primary tracking-wide">Top Clients</h3>
          <p className="text-xs text-text-muted mt-0.5 font-sans font-medium">كبار العملاء</p>
        </div>
      </div>
      
      <div className="space-y-5 flex-1 mt-2">
        {isLoading ? (
          <div className="flex items-center justify-center p-4">
            <div className="animate-spin w-6 h-6 border-2 border-[#0d47a1] border-t-transparent rounded-full" />
          </div>
        ) : clients.length === 0 ? (
          <p className="text-sm text-text-muted text-center">No client data found</p>
        ) : (
          clients.map((client, idx) => (
            <div key={idx} className="group">
              <div className="flex items-center justify-between mb-2 gap-4">
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className="w-8 h-8 rounded bg-[#f4f7fb] text-text-secondary font-bold text-xs flex items-center justify-center shrink-0 border border-border-default">
                    {client.id}
                  </div>
                  <span className="text-sm font-semibold text-text-primary group-hover:text-[#0d47a1] transition-colors truncate">{client.name}</span>
                </div>
                <span className="text-sm font-bold text-[#0d47a1] whitespace-nowrap">
                  <AmountDisplay amount={client.value} size="sm" type="neutral" />
                </span>
              </div>
              {/* Progress Bar */}
              <div className="w-full h-1.5 bg-[#f4f7fb] rounded-full overflow-hidden">
                <div 
                  className="h-full bg-[#0d47a1] rounded-full" 
                  style={{ width: `${client.percent}%` }}
                />
              </div>
            </div>
          ))
        )}
      </div>

      <div className="mt-6 pt-6 border-t border-border-subtle">
        <button className="w-full text-center text-sm font-semibold text-text-secondary hover:text-[#0d47a1] transition-colors py-2 border border-border-default rounded-lg hover:border-[#0d47a1] bg-white shadow-sm">
          View All Analytics
        </button>
      </div>
    </div>
  );
}

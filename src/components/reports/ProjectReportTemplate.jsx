import React from 'react';
import AmountDisplay from '@/components/common/AmountDisplay';
import { useProjects } from '@/hooks/useData';

export default function ProjectReportTemplate({ projectId }) {
  const { data: projects, isLoading } = useProjects();

  if (isLoading) return <div className="p-8 text-center text-text-muted">Loading report data...</div>;
  if (!projects || projects.length === 0) return <div className="p-8 text-center text-text-muted">No projects found.</div>;

  // Determine active project based on props or just take the first one for preview
  const project = projectId ? projects.find(p => p.id === projectId) : projects[0];

  if (!project) return <div className="p-8 text-center text-text-muted">Select a project to view its report.</div>;

  const totalValue = Number(project.total_contract_value) || 0;
  const milestones = project.milestones || [];
  
  // Calculations
  const completedMilestones = milestones.filter(m => m.status === 'done' || m.status === 'fully_paid');
  const pendingMilestones = milestones.filter(m => m.status !== 'done' && m.status !== 'fully_paid');
  
  const paidAmount = completedMilestones.reduce((acc, m) => acc + Number(m.amount || 0), 0);
  const remainingValue = totalValue - paidAmount;

  return (
    <div className="w-full bg-white text-black print-source p-8 pt-12 shadow-sm ring-1 ring-border-default md:ring-0 max-w-4xl mx-auto">
      {/* Header */}
      <div className="border-b-2 border-black pb-6 mb-8 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-black mb-1">Project Status Report</h1>
          <p className="text-lg font-medium text-gray-700">{project.name}</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-500 font-bold uppercase tracking-widest mb-1">Client</p>
          <h2 className="text-xl font-bold text-[#0d47a1]">{project.client_name || 'Generic Client'}</h2>
          <p className="text-xs text-gray-500 mt-1">Date: {new Date().toLocaleDateString()}</p>
        </div>
      </div>

      {/* Financial Breakdown */}
      <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3 block">Financial Summary</h3>
      <div className="grid grid-cols-3 gap-0 border-y-2 border-gray-800 mb-10">
        <div className="p-4 border-r border-gray-200">
          <p className="text-xs text-gray-500 font-semibold mb-1">Total Contract Value</p>
          <div className="text-xl font-bold text-black"><AmountDisplay amount={totalValue} type="neutral" /></div>
        </div>
        <div className="p-4 border-r border-gray-200 bg-green-50">
          <p className="text-xs text-green-700 font-semibold mb-1">Amount Paid / Verified</p>
          <div className="text-xl font-bold text-green-800"><AmountDisplay amount={paidAmount} type="income" /></div>
        </div>
        <div className="p-4 bg-orange-50">
          <p className="text-xs text-orange-700 font-semibold mb-1">Remaining Balance</p>
          <div className="text-xl font-bold text-orange-800"><AmountDisplay amount={remainingValue} type="neutral" /></div>
        </div>
      </div>

      {/* Milestones Details */}
      <div className="mb-10">
        <h3 className="text-lg font-bold border-b border-gray-300 pb-2 mb-4">Completed Deliverables <span className="text-sm font-normal text-gray-500">({completedMilestones.length})</span></h3>
        <ul className="space-y-3">
          {completedMilestones.length === 0 ? (
            <li className="text-sm text-gray-500 italic">No completed deliverables yet.</li>
          ) : completedMilestones.map((m, idx) => (
            <li key={idx} className="flex justify-between items-center p-3 bg-gray-50 rounded border border-gray-200">
              <span className="font-semibold text-sm text-gray-800">{m.status === 'done' ? '✓' : '✓'} {m.name || `Milestone ${idx+1}`}</span>
              <span className="text-sm font-bold text-gray-600"><AmountDisplay amount={Number(m.amount)} type="neutral" size="sm" /></span>
            </li>
          ))}
        </ul>
      </div>

      <div>
        <h3 className="text-lg font-bold border-b border-gray-300 pb-2 mb-4">Pending Deliverables <span className="text-sm font-normal text-gray-500">({pendingMilestones.length})</span></h3>
        <ul className="space-y-3">
          {pendingMilestones.length === 0 ? (
            <li className="text-sm text-gray-500 italic">No pending deliverables. Project complete.</li>
          ) : pendingMilestones.map((m, idx) => (
            <li key={idx} className="flex justify-between items-center p-3 border border-gray-200 border-dashed rounded opacity-75">
              <span className="font-medium text-sm text-gray-600">○ {m.name || `Milestone ${idx+1}`}</span>
              <span className="text-sm font-semibold text-gray-500"><AmountDisplay amount={Number(m.amount)} type="neutral" size="sm" /></span>
            </li>
          ))}
        </ul>
      </div>

      {/* Footer */}
      <div className="mt-16 pt-6 border-t border-gray-300 text-center text-xs text-gray-400">
        <p>End of Report • engitrack.blueprint.com</p>
      </div>
    </div>
  );
}

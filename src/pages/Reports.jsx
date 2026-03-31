import React, { useState, useMemo } from 'react';
import { Download, Printer, Filter, FileSpreadsheet, FileDown } from 'lucide-react';
import { useProjects, useTransactions } from '@/hooks/useData';
import FinancialReportTemplate from '@/components/reports/FinancialReportTemplate';
import ProjectReportTemplate from '@/components/reports/ProjectReportTemplate';
import { exportFinancialXLS, exportProjectXLS, exportPDF } from '@/lib/exportUtils';

export default function Reports() {
  const [activeReport, setActiveReport] = useState('financial');
  const [selectedMonth, setSelectedMonth] = useState('all');
  const [exporting, setExporting] = useState(false);
  
  const { data: projects } = useProjects();
  const { data: transactions } = useTransactions();

  const handlePrint = () => window.print();

  const availableMonths = useMemo(() => {
    if (!transactions) return [];
    const months = new Set();
    transactions.forEach(tx => {
      const d = new Date(tx.date);
      months.add(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
    });
    return Array.from(months).sort().reverse();
  }, [transactions]);

  const handleExportXLS = () => {
    if (activeReport === 'financial') {
      exportFinancialXLS(transactions, selectedMonth);
    } else {
      const project = projects?.find(p => p.id === activeReport);
      exportProjectXLS(project);
    }
  };

  const handleExportPDF = async () => {
    setExporting(true);
    try {
      await exportPDF();
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-8 pb-10 h-full flex flex-col">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 print-hide">
        <div>
          <h1 className="text-3xl font-bold font-sans text-[#1e3a8a] tracking-tight flex items-center gap-3">
            Reports
            <span className="text-[#0d47a1] font-sans">التقارير</span>
          </h1>
          <p className="text-sm font-sans text-text-secondary mt-1 font-medium">Generate professional documents and styled spreadsheet exports.</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8 flex-1">
        {/* Sidebar Selector */}
        <div className="col-span-1 bg-bg-surface border border-border-subtle rounded-2xl p-6 shadow-sm h-full max-h-[800px] overflow-y-auto print-hide">
          <h3 className="font-bold text-sm text-text-secondary mb-4 uppercase tracking-wider">Report Type</h3>
          <div className="space-y-2 mb-8">
            <button 
              onClick={() => setActiveReport('financial')}
              className={`w-full text-left px-4 py-3 rounded-xl font-semibold text-sm transition-colors border shadow-sm ${
                activeReport === 'financial' 
                  ? 'bg-[#e0e7ff] text-[#0d47a1] border-[#c7d2fe]' 
                  : 'bg-transparent text-text-primary border-transparent hover:border-border-default hover:bg-bg-base'
              }`}
            >
              Financial Overview
            </button>

            {activeReport === 'financial' && (
              <div className="mt-4 px-2">
                <label className="block text-xs font-bold text-text-muted uppercase mb-2 flex items-center gap-1">
                  <Filter className="w-3 h-3" /> Filter by Month
                </label>
                <select 
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="w-full bg-white border border-border-default rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-[#0d47a1] focus:border-transparent"
                >
                  <option value="all">All Time</option>
                  {availableMonths.map(month => {
                    const d = new Date(month + '-01');
                    return (
                      <option key={month} value={month}>
                        {d.toLocaleString('en-US', { month: 'long', year: 'numeric' })}
                      </option>
                    )
                  })}
                </select>
              </div>
            )}
          </div>
          
          <h3 className="font-bold text-sm text-text-secondary mb-4 uppercase tracking-wider">Project Reports</h3>
          <div className="space-y-2">
            {projects?.map((p) => (
              <button 
                key={p.id}
                onClick={() => setActiveReport(p.id)}
                className={`w-full text-left px-4 py-3 rounded-xl font-semibold text-sm transition-colors border shadow-sm truncate ${
                  activeReport === p.id 
                    ? 'bg-[#e0e7ff] text-[#0d47a1] border-[#c7d2fe]' 
                    : 'bg-transparent text-text-primary border-transparent hover:border-border-default hover:bg-bg-base'
                }`}
              >
                {p.name}
              </button>
            ))}
            {(!projects || projects.length === 0) && (
              <p className="text-sm text-text-muted italic px-2">No projects available.</p>
            )}
          </div>
        </div>
        
        {/* Preview Area */}
        <div className="col-span-1 md:col-span-3 bg-bg-surface border border-border-subtle rounded-2xl shadow-sm flex flex-col h-full min-h-[800px] overflow-hidden print-hide-container">
          <div className="p-4 border-b border-border-default flex justify-between items-center bg-[#f8fafc] print-hide">
            <span className="text-sm font-semibold text-text-secondary">
              Preview: {activeReport === 'financial' ? 'Financial Overview' : 'Project Status'}
            </span>
            <div className="flex items-center gap-2">
              <button onClick={handleExportXLS} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#10b981] text-white text-sm font-semibold hover:bg-[#059669] transition-colors shadow-sm">
                <FileSpreadsheet className="w-4 h-4" /> Export XLS
              </button>
              <button onClick={handleExportPDF} disabled={exporting} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white border border-border-default text-text-primary text-sm font-semibold hover:bg-bg-base transition-colors shadow-sm disabled:opacity-50">
                <FileDown className="w-4 h-4" /> {exporting ? 'Generating...' : 'Export PDF'}
              </button>
              <button onClick={handlePrint} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#0d47a1] text-white text-sm font-semibold hover:bg-[#1565c0] transition-colors shadow-sm">
                <Printer className="w-4 h-4" /> Print
              </button>
            </div>
          </div>
          
          <div className="flex-1 bg-bg-base p-8 overflow-y-auto w-full flex justify-center print-preview-scroll">
             <div className="print-canvas">
                {activeReport === 'financial' ? (
                  <FinancialReportTemplate selectedMonth={selectedMonth} />
                ) : (
                  <ProjectReportTemplate projectId={activeReport} />
                )}
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}

import React from 'react';
import KPICard from '@/components/common/KPICard';
import { useAuthStore } from '@/stores/authStore';
import { useDashboardKPIs, useProjects, useTransactions } from '@/hooks/useData';
import { WalletCards, Calendar, CandlestickChart, AlertTriangle, Download, FileText, Search, Filter, FileSpreadsheet } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useInvoiceSearch } from '@/hooks/useData';
import { useState } from 'react';

// New Custom Widgets
import EfficiencyWidget from '@/components/dashboard/EfficiencyWidget';
import FinancialsChart from '@/components/dashboard/FinancialsChart';
import TopClients from '@/components/dashboard/TopClients';
import RecentLogs from '@/components/dashboard/RecentLogs';
import Avatar from '@/components/common/Avatar';
import { cn } from '@/lib/utils';
import { exportFinancialXLS } from '@/lib/exportUtils';

const CATEGORY_MAP_EN = {
  project_payment: 'Project Payment',
  salaries: 'Salaries',
  office_rent: 'Office Rent',
  materials: 'Materials',
  government_fees: 'Gov Fees',
  misc: 'Misc',
};

export default function Dashboard() {
  const user = useAuthStore(state => state.user);
  const navigate = useNavigate();
  
  const { data: dbKpis, isLoading: kpisLoading } = useDashboardKPIs();
  const { data: transactions, isLoading: txLoading } = useTransactions();
  const { data: projects, isLoading: projectsLoading } = useProjects();
  
  const [searchId, setSearchId] = useState('');
  const { data: searchResults } = useInvoiceSearch(searchId);

  const k = dbKpis || { totalIncome: 0, totalExpenses: 0, activeProjects: 0, lateMilestones: 0, totalContractValue: 0 };
  
  const recentTransactions = (transactions || []).slice(0, 6).map(tx => ({
    client: tx.project?.client_name || tx.project?.name || tx.title || 'General',
    id: `#${tx.id.substring(0, 5).toUpperCase()}`,
    type: CATEGORY_MAP_EN[tx.category] || tx.category || 'Transaction',
    dateStr: new Date(tx.date).toLocaleDateString(),
    status: tx.type === 'income' ? 'Done' : 'Pending',
    statusAr: tx.type === 'income' ? 'منجز' : 'إجراء',
    statusColor: tx.type === 'income' ? 'text-[#10b981] bg-[#dcfce7]' : 'text-[#f59e0b] bg-[#fef3c7]',
    assignee: user?.user_metadata?.full_name || 'System',
    amount: `${tx.type === 'income' ? '+' : '-'}${Number(tx.amount).toLocaleString()}`
  }));

  return (
    <div className="space-y-8 pb-10">
      
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-sans text-[#1e3a8a] tracking-tight flex items-center gap-3">
            Dashboard 
            <span className="text-[#0d47a1] font-sans">لوحة التحكم</span>
          </h1>
          <p className="text-sm font-sans text-text-secondary mt-1 font-medium">Operational Overview for Project Alpha Engineering Cluster.</p>
        </div>
        
        {/* Invoice Search Bar */}
        <div className="flex-1 max-w-md relative no-print">
          <div className="relative group">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted transition-colors group-focus-within:text-accent" />
            <input 
              type="text" 
              placeholder="Search by Invoice ID (e.g. INV-A632)..."
              className="w-full pr-10 pl-4 py-2 bg-white border border-border-default rounded-lg text-sm font-sans focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all shadow-sm"
              onChange={(e) => setSearchId(e.target.value)}
              value={searchId}
            />
          </div>
          
          {searchResults && searchResults.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-border-default rounded-xl shadow-2xl z-50 overflow-hidden divide-y divide-border-subtle animate-in fade-in slide-in-from-top-1">
              <div className="px-4 py-2 bg-bg-base/50 text-[10px] font-bold text-text-muted uppercase tracking-wider">Matched Invoices</div>
              {searchResults.map(doc => (
                <div 
                  key={doc.id}
                  onClick={() => window.open(doc.file_url, '_blank')}
                  className="px-4 py-3 hover:bg-bg-base cursor-pointer flex items-center justify-between group transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-accent/5 rounded-lg group-hover:bg-accent/10">
                      <FileText className="w-4 h-4 text-accent" />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-text-primary flex items-center gap-2">
                        {doc.invoice_id}
                        <span className="text-[10px] font-normal text-text-muted">({doc.project?.name})</span>
                      </div>
                      <div className="text-[10px] text-text-muted mt-0.5">{doc.name}</div>
                    </div>
                  </div>
                  <Download className="w-4 h-4 text-text-muted group-hover:text-accent opacity-0 group-hover:opacity-100 transition-all" />
                </div>
              ))}
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={() => exportFinancialXLS(transactions, 'all')}
            className="px-4 py-2 rounded-md bg-[#10b981] text-white text-sm font-semibold hover:bg-[#059669] transition-colors border border-[#10b981] font-sans flex items-center gap-2"
          >
            <FileSpreadsheet className="w-4 h-4" />
            Export XLS
          </button>
          <button 
            onClick={() => navigate('/reports')}
            className="px-4 py-2 rounded-md bg-[#0d47a1] text-white text-sm font-semibold shadow-sm hover:bg-[#1565c0] transition-colors font-sans border border-[#0d47a1]"
          >
            Generate Report
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard 
          title="Total Income" 
          value={k.totalIncome}
          isCurrency={true}
          subtitle="إجمالي الإيرادات"
          icon={WalletCards}
          iconBgColor="bg-[#e0e7ff]"
          iconColor="text-[#0d47a1]"
          badgeText="Active"
          badgeType="positive"
        />
        <KPICard 
          title="Total Expenses" 
          value={k.totalExpenses}
          isCurrency={true}
          subtitle="إجمالي المصروفات"
          icon={CandlestickChart}
          iconBgColor="bg-[#fee2e2]"
          iconColor="text-[#ef4444]"
          badgeText="Tracked"
          badgeType="text"
        />
        <KPICard 
          title="Active Projects" 
          value={k.activeProjects}
          isCurrency={false}
          subtitle="المشاريع النشطة"
          icon={Calendar}
          iconBgColor="bg-[#f1f5f9]"
          iconColor="text-[#475569]"
          badgeText={<span>↗</span>}
          badgeType="neutral"
        />
        <KPICard 
          title="Delayed Milestones" 
          value={`${k.lateMilestones} Overdue`}
          subtitle="متأخرة"
          icon={AlertTriangle}
          iconBgColor="bg-[#fee2e2]"
          iconColor="text-[#ef4444]"
          badgeText="Critical"
          badgeType="negative"
          valueColor={k.lateMilestones > 0 ? "text-[#ef4444]" : "text-text-primary"}
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        
        {/* Left Column (Main App Area) */}
        <div className="xl:col-span-2 space-y-8 flex flex-col">
          
          {/* Recent Transactions Table */}
          <div className="bg-bg-surface border border-border-subtle rounded-2xl shadow-sm overflow-hidden flex-1">
            <div className="p-6 lg:p-8 flex flex-col md:flex-row md:items-center justify-between border-b border-border-default gap-4">
              <div>
                <h2 className="text-xl font-bold text-text-primary tracking-tight font-sans">
                  Recent Transactions <span className="text-text-primary font-sans">المعاملات الأخيرة</span>
                </h2>
                <p className="text-sm font-medium text-text-muted mt-1 font-sans">Live audit trail of current engineering permits and site works.</p>
              </div>
              <div className="flex items-center gap-3">
                <button className="p-2 text-text-muted hover:text-text-primary hover:bg-bg-base rounded-md transition-colors border border-transparent hover:border-border-default">
                  <Filter className="w-5 h-5" />
                </button>
                <button className="p-2 text-text-muted hover:text-text-primary hover:bg-bg-base rounded-md transition-colors border border-transparent hover:border-border-default">
                  <Search className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#f4f7fb] border-b border-border-default text-xs font-bold text-text-secondary uppercase tracking-wider font-sans">
                    <th className="py-4 px-6">
                      Client Name <div className="text-[10px] text-text-muted mt-0.5 font-sans lowercase capitalize-first">العميل</div>
                    </th>
                    <th className="py-4 px-6">
                      Type <div className="text-[10px] text-text-muted mt-0.5 font-sans lowercase capitalize-first">النوع</div>
                    </th>
                    <th className="py-4 px-6">
                      Date <div className="text-[10px] text-text-muted mt-0.5 font-sans lowercase capitalize-first">التاريخ</div>
                    </th>
                    <th className="py-4 px-6">
                      Status <div className="text-[10px] text-text-muted mt-0.5 font-sans lowercase capitalize-first">الحالة</div>
                    </th>
                    <th className="py-4 px-6 flex justify-end">
                      Amount <div className="text-[10px] text-text-muted mt-0.5 text-right font-sans lowercase capitalize-first ml-1">القيمة</div>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-subtle">
                  {txLoading ? (
                    <tr><td colSpan={5} className="py-8 text-center text-text-muted text-sm font-sans">Loading transactions...</td></tr>
                  ) : recentTransactions.length === 0 ? (
                    <tr><td colSpan={5} className="py-8 text-center text-text-muted text-sm font-sans">No recent transactions.</td></tr>
                  ) : recentTransactions.map((tx, idx) => (
                    <tr key={idx} className="hover:bg-[#f8fafc] transition-colors cursor-pointer group">
                      <td className="py-5 px-6">
                        <div className="font-bold text-sm text-text-primary font-sans max-w-[150px] truncate" title={tx.client}>{tx.client}</div>
                        <div className="text-xs text-text-muted font-sans font-medium mt-0.5">ID: {tx.id}</div>
                      </td>
                      <td className="py-5 px-6">
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#f1f5f9] text-xs font-semibold text-text-secondary border border-border-default shadow-sm border-b-2">
                          <span className="truncate max-w-[100px]">{tx.type}</span>
                          {tx.status === 'Delayed' ? <AlertTriangle className="w-3.5 h-3.5 text-[#ef4444] shrink-0" /> : 
                           <WalletCards className="w-3.5 h-3.5 text-[#0d47a1] shrink-0" />}
                        </div>
                      </td>
                      <td className="py-5 px-6 text-xs font-semibold text-text-secondary w-28 leading-relaxed">
                        {tx.dateStr}
                      </td>
                      <td className="py-5 px-6">
                        <span className={cn("inline-flex flex-col items-center px-3 py-1.5 rounded-lg text-xs font-bold border border-transparent shadow-[0_1px_2px_rgba(0,0,0,0.05)] min-w-[70px]", tx.statusColor, tx.status === 'Done' ? "border-[#a7f3d0]" : "border-[#fde68a]")}>
                          <span className="mb-0.5">{tx.status}</span>
                          <span className="text-[10px] font-sans leading-none">{tx.statusAr}</span>
                        </span>
                      </td>
                      <td className="py-5 px-6 text-right font-bold text-sm text-text-primary whitespace-nowrap">
                        {tx.amount}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="p-4 border-t border-border-default flex justify-center bg-[#f8fafc]">
              <Link to="/transactions" className="text-sm font-bold text-[#0d47a1] hover:text-[#1565c0] transition-colors font-sans flex items-center gap-1">
                View All Transactions <span className="font-medium text-xs ml-1 font-sans">عرض كافة المعاملات</span>
              </Link>
            </div>
          </div>

          <RecentLogs />

        </div>

        {/* Right Column (Widgets) */}
        <div className="space-y-8 flex flex-col xl:col-span-1">
          <EfficiencyWidget rate={94} />
          <FinancialsChart />
          <TopClients />
        </div>

      </div>
    
    </div>
  );
}

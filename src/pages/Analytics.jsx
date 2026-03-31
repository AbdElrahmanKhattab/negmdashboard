import React, { useMemo } from 'react';
import { useProjects, useTransactions, useDashboardKPIs } from '@/hooks/useData';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { cn } from '@/lib/utils';
import AmountDisplay from '@/components/common/AmountDisplay';

const COLORS = ['#0d47a1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export default function Analytics() {
  const { data: projects, isLoading: projectsLoading } = useProjects();
  const { data: transactions, isLoading: txLoading } = useTransactions();
  const { data: kpis } = useDashboardKPIs();

  // Process Transactions for Financial Trends (Last 6 Months)
  const financialData = useMemo(() => {
    if (!transactions) return [];
    
    // Group by month
    const monthly = {};
    const monthsArray = [];
    
    // Create last 6 months buckets
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const mStr = d.toLocaleString('en-US', { month: 'short' });
      monthly[mStr] = { name: mStr, Income: 0, Expenses: 0 };
      monthsArray.push(mStr);
    }

    transactions.forEach(tx => {
      const d = new Date(tx.date);
      const mStr = d.toLocaleString('en-US', { month: 'short' });
      if (monthly[mStr]) {
        if (tx.type === 'income') {
          monthly[mStr].Income += Number(tx.amount) || 0;
        } else {
          monthly[mStr].Expenses += Number(tx.amount) || 0;
        }
      }
    });

    return Object.values(monthly);
  }, [transactions]);

  // Process Projects for Health Matrix
  const healthData = useMemo(() => {
    if (!projects) return [];
    const counts = { Good: 0, Warning: 0, Critical: 0 };
    projects.forEach(p => {
      if (p.health === 'danger') counts.Critical++;
      else if (p.health === 'warning') counts.Warning++;
      else counts.Good++;
    });
    return [
      { name: 'Healthy', value: counts.Good, color: '#10b981' },
      { name: 'Needs Attention', value: counts.Warning, color: '#f59e0b' },
      { name: 'Critical', value: counts.Critical, color: '#ef4444' },
    ].filter(i => i.value > 0);
  }, [projects]);

  // Process Top Clients Value
  const clientData = useMemo(() => {
    if (!projects) return [];
    const totals = {};
    projects.forEach(p => {
      const client = p.client_name || 'Generic';
      totals[client] = (totals[client] || 0) + Number(p.total_contract_value || 0);
    });
    return Object.entries(totals)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, value], idx) => ({ name, value, fill: COLORS[idx % COLORS.length] }));
  }, [projects]);

  const isLoading = projectsLoading || txLoading;

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-sans text-[#1e3a8a] tracking-tight flex items-center gap-3">
            Analytics 
            <span className="text-[#0d47a1] font-sans">التحليلات</span>
          </h1>
          <p className="text-sm font-sans text-text-secondary mt-1 font-medium">In-depth data driven analysis for operational performance.</p>
        </div>
      </div>
      
      {isLoading ? (
        <div className="flex items-center justify-center p-20">
          <div className="animate-spin w-8 h-8 border-4 border-[#0d47a1] border-t-transparent rounded-full" />
        </div>
      ) : (
        <div className="space-y-8">
          
          {/* Top Level Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
             <div className="bg-gradient-to-br from-[#0d47a1] to-[#1e3a8a] rounded-2xl p-6 text-white shadow-md relative overflow-hidden flex flex-col justify-center min-h-[160px]">
               <h3 className="text-white/80 font-bold text-sm tracking-widest uppercase mb-2">Net Profit Margin</h3>
               <div className="text-4xl font-bold mb-1">
                 {kpis ? Math.round(((kpis.totalIncome - kpis.totalExpenses) / (kpis.totalIncome || 1)) * 100) : 0}%
               </div>
               <p className="text-white/60 text-xs">Overall Company Health</p>
             </div>
             <div className="bg-bg-surface border border-border-subtle rounded-2xl p-6 shadow-sm flex flex-col justify-center min-h-[160px]">
               <h3 className="text-text-secondary font-bold text-sm tracking-widest uppercase mb-2">Total Contract Volume</h3>
               <div className="text-4xl font-bold text-text-primary mb-1">
                 <AmountDisplay amount={kpis?.totalContractValue || 0} size="lg" type="neutral" />
               </div>
               <p className="text-text-muted text-xs">Across {projects?.length || 0} Projects</p>
             </div>
             <div className="bg-bg-surface border border-border-subtle rounded-2xl p-6 shadow-sm flex flex-col justify-center min-h-[160px]">
               <h3 className="text-text-secondary font-bold text-sm tracking-widest uppercase mb-2">Delayed Milestones</h3>
               <div className={cn("text-4xl font-bold mb-1", kpis?.lateMilestones > 0 ? "text-[#ef4444]" : "text-[#10b981]")}>
                 {kpis?.lateMilestones || 0}
               </div>
               <p className="text-text-muted text-xs">Tasks requiring immediate attention</p>
             </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* Financial Trends */}
            <div className="bg-bg-surface border border-border-subtle rounded-2xl p-6 shadow-sm min-h-[400px] flex flex-col">
              <h3 className="font-bold text-lg mb-1 text-text-primary">Financial Trends</h3>
              <p className="text-sm text-text-muted mb-8 font-sans font-medium">Income vs Expenses (Last 6 Months)</p>
              
              <div className="flex-1 w-full relative">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={financialData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#0d47a1" stopOpacity={0.1}/>
                        <stop offset="95%" stopColor="#0d47a1" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.1}/>
                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} tickFormatter={(val) => `$${val/1000}k`} />
                    <Tooltip 
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', padding: '12px' }}
                      formatter={(value) => [`$${Number(value).toLocaleString()}`, '']}
                    />
                    <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px', fontSize: '12px' }} />
                    <Area type="monotone" dataKey="Income" stroke="#0d47a1" strokeWidth={3} fillOpacity={1} fill="url(#colorIncome)" />
                    <Area type="monotone" dataKey="Expenses" stroke="#ef4444" strokeWidth={3} fillOpacity={1} fill="url(#colorExpense)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Client Distribution */}
            <div className="bg-bg-surface border border-border-subtle rounded-2xl p-6 shadow-sm min-h-[400px] flex flex-col">
              <h3 className="font-bold text-lg mb-1 text-text-primary">Client Revenue Distribution</h3>
              <p className="text-sm text-text-muted mb-8 font-sans font-medium">Top 5 Clients by Total Contract Value</p>
              
              <div className="flex-1 w-full relative">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={clientData} layout="vertical" margin={{ top: 0, right: 30, left: 40, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
                    <XAxis type="number" hide />
                    <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#475569' }} width={100} />
                    <Tooltip 
                      cursor={{fill: 'transparent'}}
                      contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '12px' }}
                      formatter={(value) => [`$${Number(value).toLocaleString()}`, 'Contract Value']}
                    />
                    <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={24}>
                      {
                        clientData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))
                      }
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Project Health */}
            <div className="bg-bg-surface border border-border-subtle rounded-2xl p-6 shadow-sm min-h-[350px] flex flex-col lg:col-span-2">
              <h3 className="font-bold text-lg mb-1 text-text-primary">Project Health Overview</h3>
              <p className="text-sm text-text-muted mb-4 font-sans font-medium">Distribution by System Health Status</p>
              
              <div className="flex-1 w-full flex items-center justify-center">
                 <div className="w-full max-w-sm h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={healthData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {healthData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                      />
                      <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px' }}/>
                    </PieChart>
                  </ResponsiveContainer>
                 </div>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}

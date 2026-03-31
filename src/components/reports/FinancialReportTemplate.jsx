import React from 'react';
import AmountDisplay from '@/components/common/AmountDisplay';
import { useTransactions } from '@/hooks/useData';

export default function FinancialReportTemplate({ selectedMonth }) {
  const { data: transactions, isLoading: txLoading } = useTransactions();

  if (txLoading) return <div className="p-8 text-center text-text-muted">Loading report data...</div>;

  // Filter transactions by month if selectedMonth is provided (format: 'YYYY-MM')
  const filteredTx = (transactions || []).filter(tx => {
    if (!selectedMonth || selectedMonth === 'all') return true;
    const txDate = new Date(tx.date);
    const txMonth = `${txDate.getFullYear()}-${String(txDate.getMonth() + 1).padStart(2, '0')}`;
    return txMonth === selectedMonth;
  });

  const totalIncome = filteredTx.filter(t => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0);
  const totalExpenses = filteredTx.filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0);
  const profit = totalIncome - totalExpenses;

  // Sort and limit for display
  const sortedTx = [...filteredTx].sort((a,b) => new Date(b.date) - new Date(a.date)).slice(0, 30);

  const displayMonth = selectedMonth && selectedMonth !== 'all' 
    ? new Date(selectedMonth + '-01').toLocaleString('en-US', { month: 'long', year: 'numeric' })
    : 'All Time';

  return (
    <div className="w-full bg-white text-black print-source p-8 pt-12 shadow-sm ring-1 ring-border-default md:ring-0 max-w-4xl mx-auto">
      {/* Header */}
      <div className="border-b-2 border-black pb-6 mb-8 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-black mb-1">Financial Overview Report</h1>
          <p className="text-sm font-medium text-gray-600">Generated on {new Date().toLocaleDateString()} | Period: {displayMonth}</p>
        </div>
        <div className="text-right">
          <h2 className="text-xl font-bold text-[#0d47a1]">Blueprint Engineering</h2>
          <p className="text-xs text-gray-500 mt-1">Confidential & Internal</p>
        </div>
      </div>

      {/* KPI Summary Block */}
      <div className="grid grid-cols-3 gap-6 mb-10">
        <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
          <p className="text-xs uppercase tracking-wider text-gray-500 font-bold mb-1">Total Income ({displayMonth})</p>
          <div className="text-2xl font-bold text-[#10b981]"><AmountDisplay amount={totalIncome} type="income" size="md" /></div>
        </div>
        <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
          <p className="text-xs uppercase tracking-wider text-gray-500 font-bold mb-1">Total Expenses ({displayMonth})</p>
          <div className="text-2xl font-bold text-[#ef4444]"><AmountDisplay amount={totalExpenses} type="expense" size="md" /></div>
        </div>
        <div className="bg-[#0d47a1] p-6 rounded-lg text-white">
          <p className="text-xs uppercase tracking-wider text-white/80 font-bold mb-1">Net Profit</p>
          <div className="text-2xl font-bold">${profit.toLocaleString()}</div>
        </div>
      </div>

      {/* Recent Transactions List */}
      <div>
        <h3 className="text-lg font-bold border-b border-gray-300 pb-2 mb-4">Recent Transactions (Last 20)</h3>
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b-2 border-gray-800 text-gray-700">
              <th className="py-2 px-2 font-bold">Date</th>
              <th className="py-2 px-2 font-bold">Description</th>
              <th className="py-2 px-2 font-bold">Project / Client</th>
              <th className="py-2 px-2 font-bold">Type</th>
              <th className="py-2 px-2 font-bold text-right">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {sortedTx.map((tx, idx) => (
              <tr key={idx} className="hover:bg-gray-50">
                <td className="py-3 px-2 text-gray-600 font-medium">{new Date(tx.date).toLocaleDateString()}</td>
                <td className="py-3 px-2 text-gray-900 font-semibold">{tx.title || 'General Activity'}</td>
                <td className="py-3 px-2 text-gray-600">{tx.project?.name || 'Internal'}</td>
                <td className="py-3 px-2">
                  <span className={`px-2 py-1 rounded text-xs font-bold ${tx.type === 'income' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {tx.type.toUpperCase()}
                  </span>
                </td>
                <td className="py-3 px-2 text-right font-bold text-black border-l border-gray-100">
                  <AmountDisplay amount={Number(tx.amount)} type={tx.type} />
                </td>
              </tr>
            ))}
            {sortedTx.length === 0 && (
              <tr><td colSpan="5" className="py-6 text-center text-gray-500">No transactions fully recorded yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="mt-16 pt-6 border-t border-gray-300 text-center text-xs text-gray-400">
        <p>End of Report • engitrack.blueprint.com</p>
      </div>
    </div>
  );
}

import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const data = [
  { name: 'MAR', profit: 4000, expenses: 2400 },
  { name: 'APR', profit: 6000, expenses: 3908 },
  { name: 'MAY', profit: 2000, expenses: 3800 },
  { name: 'JUN', profit: 5780, expenses: 4300 },
];

export default function FinancialsChart() {
  return (
    <div className="bg-bg-surface border border-border-subtle rounded-2xl p-6 shadow-sm h-full min-h-[300px] flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="font-bold text-sm text-text-primary tracking-wide">Monthly Financials</h3>
          <p className="text-xs text-text-muted mt-0.5 font-sans font-medium text-right">الأرباح والمصاريف</p>
        </div>
      </div>
      
      <div className="flex-1 w-full min-h-[200px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 0, right: 0, left: -20, bottom: 0 }} barGap={2} barSize={12}>
            {/* Custom CartesianGrid to match the minimal look */}
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} dy={10} />
            <YAxis hide={true} />
            <Tooltip 
              cursor={{ fill: 'transparent' }}
              contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '12px', padding: '8px 12px' }}
            />
            {/* Soft blue for expenses, strong blue for profit based on screenshot */}
            <Bar dataKey="expenses" fill="#bae6fd" radius={[2, 2, 0, 0]} />
            <Bar dataKey="profit" fill="#0d47a1" radius={[2, 2, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="flex items-center justify-center gap-6 mt-4 pt-4 border-t border-border-subtle">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-[#0d47a1]" />
          <span className="text-xs font-semibold text-text-secondary">Profit</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-[#bae6fd]" />
          <span className="text-xs font-semibold text-text-secondary">Expenses</span>
        </div>
      </div>
    </div>
  );
}

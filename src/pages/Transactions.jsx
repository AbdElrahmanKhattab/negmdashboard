import React, { useState } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search, Filter, ArrowDownCircle, ArrowUpCircle } from 'lucide-react';
import AmountDisplay from '@/components/common/AmountDisplay';
import DataTable from '@/components/common/DataTable';
import PageTransition from '@/components/common/PageTransition';
import TransactionForm from '@/components/forms/TransactionForm';
import { useTransactions } from '@/hooks/useData';
import { cn } from '@/lib/utils';

const CATEGORY_MAP = {
  project_payment: 'دفعة مشروع',
  salaries: 'رواتب',
  office_rent: 'إيجار مكتب',
  materials: 'مواد',
  government_fees: 'رسوم حكومية',
  misc: 'متفرقات',
};

const CATEGORY_MAP_EN = {
  project_payment: 'Project Payment',
  salaries: 'Salaries',
  office_rent: 'Office Rent',
  materials: 'Materials',
  government_fees: 'Gov Fees',
  misc: 'Misc',
};

export default function Transactions() {
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const { data: transactions, isLoading } = useTransactions();
  const role = useAuthStore(state => state.role);
  const canManageTx = role === 'owner' || role === 'accountant';

  const txns = (transactions || []).filter(t =>
    t.title?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    t.project?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalIncome = txns.filter(t => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0);
  const totalExpense = txns.filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0);

  const columns = [
    {
      title: <div className="text-left font-sans">Type <span className="text-[10px] block text-text-muted mt-0.5">النوع</span></div>, 
      key: 'type',
      render: (val) => val === 'income'
        ? <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#dcfce7] text-[#15803d] font-sans text-xs font-bold border border-[#bbf7d0]"><ArrowDownCircle className="w-3.5 h-3.5" /> Income</span>
        : <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#fee2e2] text-[#b91c1c] font-sans text-xs font-bold border border-[#fecaca]"><ArrowUpCircle className="w-3.5 h-3.5" /> Expense</span>
    },
    { 
      title: <div className="text-left font-sans">Description <span className="text-[10px] block text-text-muted mt-0.5">البيان</span></div>, 
      key: 'title',
      render: (val) => <span className="font-semibold text-sm text-text-primary">{val}</span>
    },
    { 
      title: <div className="text-left font-sans">Category <span className="text-[10px] block text-text-muted mt-0.5">التصنيف</span></div>, 
      key: 'category', 
      render: (val) => (
        <div className="flex flex-col">
          <span className="text-sm font-semibold text-text-secondary">{CATEGORY_MAP_EN[val] || val}</span>
          <span className="text-xs text-text-muted font-sans font-medium">{CATEGORY_MAP[val] || val}</span>
        </div>
      )
    },
    { 
      title: <div className="text-left font-sans">Project <span className="text-[10px] block text-text-muted mt-0.5">المشروع</span></div>, 
      key: 'project', 
      render: (_, row) => <span className="font-medium text-sm text-text-secondary">{row.project?.name || '–'}</span>
    },
    { 
      title: <div className="text-left font-sans">Date <span className="text-[10px] block text-text-muted mt-0.5">التاريخ</span></div>, 
      key: 'date', 
      cellClassName: 'text-sm font-medium text-text-secondary' 
    },
    { 
      title: <div className="text-right font-sans">Amount <span className="text-[10px] block text-text-muted mt-0.5 text-right">المبلغ</span></div>, 
      key: 'amount', 
      cellClassName: 'text-right',
      render: (val, row) => <div className="text-right font-bold text-sm"><AmountDisplay amount={Number(val)} size="sm" type={row.type === 'income' ? 'income' : 'expense'} /></div> 
    },
  ];

  return (
    <PageTransition className="space-y-8 pb-10">
      <TransactionForm isOpen={showForm} onClose={() => setShowForm(false)} />
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-sans text-[#1e3a8a] tracking-tight flex items-center gap-3">
            Transactions 
            <span className="text-[#0d47a1] font-sans">المعاملات المالية</span>
          </h1>
          <p className="text-sm font-sans text-text-secondary mt-1 font-medium">Complete record of all incoming and outgoing financial transactions.</p>
        </div>
        {canManageTx && (
          <Button onClick={() => setShowForm(true)} className="bg-[#0d47a1] hover:bg-[#1565c0] text-white font-sans flex items-center gap-2 shadow-sm h-10 px-5 transition-colors border border-[#0d47a1]">
            <Plus className="w-4 h-4 ml-1" />
            <span className="font-bold text-sm">New Transaction</span>
          </Button>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-bg-surface border border-border-subtle rounded-2xl p-6 shadow-sm overflow-hidden relative group">
          <div className="absolute right-0 top-0 w-2 h-full bg-[#10b981]" />
          <div className="flex justify-between items-start mb-4">
             <div>
               <h3 className="text-text-secondary font-medium text-sm font-sans mb-1">Total Income</h3>
               <span className="text-xs text-text-muted font-sans font-medium">إجمالي الإيرادات</span>
             </div>
             <div className="w-10 h-10 rounded-xl bg-[#dcfce7] text-[#15803d] flex items-center justify-center">
               <ArrowDownCircle className="w-5 h-5" />
             </div>
          </div>
          <div className="text-3xl font-bold tracking-tight text-[#15803d]">
            <AmountDisplay amount={totalIncome} type="neutral" size="xl" />
          </div>
        </div>
        
        <div className="bg-bg-surface border border-border-subtle rounded-2xl p-6 shadow-sm overflow-hidden relative group">
          <div className="absolute right-0 top-0 w-2 h-full bg-[#ef4444]" />
          <div className="flex justify-between items-start mb-4">
             <div>
               <h3 className="text-text-secondary font-medium text-sm font-sans mb-1">Total Expenses</h3>
               <span className="text-xs text-text-muted font-sans font-medium">إجمالي المصروفات</span>
             </div>
             <div className="w-10 h-10 rounded-xl bg-[#fee2e2] text-[#b91c1c] flex items-center justify-center">
               <ArrowUpCircle className="w-5 h-5" />
             </div>
          </div>
          <div className="text-3xl font-bold tracking-tight text-[#b91c1c]">
            <AmountDisplay amount={totalExpense} type="neutral" size="xl" />
          </div>
        </div>
        
        <div className="bg-bg-surface border border-border-subtle rounded-2xl p-6 shadow-sm overflow-hidden relative group">
           <div className={cn("absolute right-0 top-0 w-2 h-full", totalIncome - totalExpense >= 0 ? "bg-[#0d47a1]" : "bg-[#ef4444]")} />
           <div className="flex justify-between items-start mb-4">
             <div>
               <h3 className="text-text-secondary font-medium text-sm font-sans mb-1">Net Balance</h3>
               <span className="text-xs text-text-muted font-sans font-medium">صافي الحركة</span>
             </div>
             <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", totalIncome - totalExpense >= 0 ? "bg-[#e0e7ff] text-[#0d47a1]" : "bg-[#fee2e2] text-[#b91c1c]")}>
               <ArrowDownCircle className="w-5 h-5" />
             </div>
          </div>
          <div className={cn("text-3xl font-bold tracking-tight", totalIncome - totalExpense >= 0 ? "text-[#0d47a1]" : "text-[#b91c1c]")}>
            <AmountDisplay amount={totalIncome - totalExpense} type="neutral" size="xl" />
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="bg-bg-surface border border-border-subtle rounded-2xl shadow-sm overflow-hidden">
        {/* Toolbar */}
        <div className="p-6 border-b border-border-default flex flex-col md:flex-row gap-4 justify-between items-center bg-white">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-text-muted" />
            <Input 
              placeholder="Search transactions..." 
              className="pl-9 pr-4 bg-bg-surface border-border-default h-10 font-sans text-sm rounded-lg shadow-sm focus-visible:ring-[#0d47a1] focus-visible:border-[#0d47a1]"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex gap-2 w-full md:w-auto">
             <Button variant="outline" className="border-border-default text-text-secondary hover:text-[#0d47a1] hover:bg-[#f8fafc] hover:border-[#0d47a1] font-sans h-10 px-4 w-full md:w-auto transition-colors">
               <Filter className="w-4 h-4 mr-2" /> Filter Filters
             </Button>
          </div>
        </div>

        {/* Table wrapper to enforce LTR styling explicitly if needed */}
        <div dir="ltr" className="w-full">
          <DataTable 
            columns={columns} 
            data={txns} 
            isLoading={isLoading} 
            emptyStateTitle="No transactions found" 
            emptyStateDesc="Add your first financial transaction to start tracking." 
          />
        </div>
      </div>
    </PageTransition>
  );
}

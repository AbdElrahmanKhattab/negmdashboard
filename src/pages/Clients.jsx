import React, { useState } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search, Mail, Phone } from 'lucide-react';
import Avatar from '@/components/common/Avatar';
import AmountDisplay from '@/components/common/AmountDisplay';
import PageTransition from '@/components/common/PageTransition';
import ClientForm from '@/components/forms/ClientForm';
import { Link } from 'react-router-dom';
import { useClients } from '@/hooks/useData';

export default function Clients() {
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const { data: clients, isLoading } = useClients();
  const role = useAuthStore(state => state.role);
  const isOwner = role === 'owner';

  const filtered = (clients || []).filter(c =>
    c.name?.includes(searchTerm) || c.email?.includes(searchTerm)
  );

  return (
    <PageTransition className="space-y-6">
      <ClientForm isOpen={showForm} onClose={() => setShowForm(false)} />
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-sans text-text-primary tracking-tight">العملاء</h1>
          <p className="text-sm font-sans text-text-secondary mt-1">إدارة بيانات العملاء والشركات التي تتعامل معها.</p>
        </div>
        {isOwner && (
          <Button onClick={() => setShowForm(true)} className="bg-accent hover:bg-accent-hover text-white font-sans flex items-center gap-2 pr-4">
            <Plus className="w-4 h-4" />
            إضافة عميل
          </Button>
        )}
      </div>

      <div className="bg-bg-surface border border-border-default rounded-xl p-4 flex flex-col sm:flex-row gap-4 justify-between items-center shadow-sm">
        <div className="relative w-full sm:w-80">
          <Search className="absolute right-3 top-2.5 h-4 w-4 text-text-muted" />
          <Input 
            placeholder="بحث باسم العميل أو الشركة..." 
            className="pl-3 pr-9 bg-bg-base border-border-default h-9 font-sans" 
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {isLoading ? (
        <div className="p-8 flex justify-center"><div className="animate-spin w-6 h-6 border-2 border-accent border-t-transparent rounded-full" /></div>
      ) : filtered.length === 0 ? (
        <div className="p-8 text-center text-text-muted font-sans text-sm">لا توجد بيانات عملاء. أضف أول عميل للبدء.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((client) => (
            <div key={client.id} className="bg-bg-surface border border-border-default rounded-xl p-5 hover:border-border-strong transition-colors shadow-sm group">
              <div className="flex items-center gap-4 mb-4">
                <Avatar alt={client.name} size="lg" />
                <div>
                  <Link to={`/clients/${client.id}`} className="font-semibold text-text-primary hover:text-accent font-sans text-base block">
                    {client.name}
                  </Link>
                </div>
              </div>
              
              <div className="space-y-2 mb-4">
                {client.email && (
                  <div className="flex items-center gap-2 text-sm text-text-secondary font-sans">
                    <Mail className="w-4 h-4 shrink-0 text-text-muted" />
                    <span className="truncate" dir="ltr">{client.email}</span>
                  </div>
                )}
                {client.phone && (
                  <div className="flex items-center gap-2 text-sm text-text-secondary font-sans">
                    <Phone className="w-4 h-4 shrink-0 text-text-muted" />
                    <span dir="ltr">{client.phone}</span>
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-border-subtle flex justify-between items-center bg-bg-base/50 -mx-5 -mb-5 px-5 py-3 rounded-b-xl">
                <div>
                  <span className="block text-xs text-text-muted font-sans mb-0.5">المشاريع</span>
                  <span className="font-semibold text-text-primary text-sm font-sans">{client.total_projects}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </PageTransition>
  );
}

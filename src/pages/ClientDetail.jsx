import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Mail, Phone, MapPin, Edit, ArrowRight } from 'lucide-react';
import Avatar from '@/components/common/Avatar';
import KPICard from '@/components/common/KPICard';
import ProjectCard from '@/components/common/ProjectCard';
import { useClient } from '@/hooks/useData';

export default function ClientDetail() {
  const { id } = useParams();
  const { data: client, isLoading } = useClient(id);

  if (isLoading) {
    return <div className="p-12 flex justify-center"><div className="animate-spin w-8 h-8 border-4 border-accent border-t-transparent rounded-full" /></div>;
  }
  if (!client) {
    return <div className="p-12 text-center text-text-muted font-sans">لم يتم العثور على العميل.</div>;
  }

  const totalRevenue = (client.projects || []).reduce((s, p) => s + Number(p.total_contract_value), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-sm text-text-muted font-sans mb-2">
        <Link to="/clients" className="hover:text-text-primary flex items-center gap-1 transition-colors">
          <ArrowRight className="w-4 h-4" /> العودة للعملاء
        </Link>
      </div>

      <div className="bg-bg-surface border border-border-default rounded-xl p-6 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-5">
          <Avatar alt={client.name} size="xl" className="border-4 border-bg-base shadow-sm" />
          <div>
            <h1 className="text-2xl font-bold font-sans text-text-primary tracking-tight">{client.name}</h1>
            <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-text-secondary font-sans">
              {client.email && <span className="flex items-center gap-1.5"><Mail className="w-4 h-4" /><span dir="ltr">{client.email}</span></span>}
              {client.phone && <span className="flex items-center gap-1.5"><Phone className="w-4 h-4" /><span dir="ltr">{client.phone}</span></span>}
              {client.address && <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4" />{client.address}</span>}
            </div>
          </div>
        </div>
        <Button variant="outline" className="border-border-default font-sans shrink-0">
          <Edit className="w-4 h-4 ml-2" /> تعديل البيانات
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <KPICard title="إجمالي التعاملات" value={totalRevenue} trend={0} />
        <KPICard title="المشاريع" value={(client.projects || []).length} isCurrency={false} trend={0} />
      </div>

      <div>
        <h2 className="text-lg font-semibold text-text-primary font-sans mb-4">مشاريع العميل</h2>
        {(client.projects || []).length === 0 ? (
          <div className="p-8 text-center text-text-muted font-sans text-sm">لا توجد مشاريع لهذا العميل.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {client.projects.map(proj => (
              <ProjectCard key={proj.id} project={{ ...proj, client_name: client.name, total_value: proj.total_contract_value }} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

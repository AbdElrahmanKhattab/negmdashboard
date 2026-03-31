import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Save, Building, Bell, Shield, Wallet } from 'lucide-react';

export default function Settings() {
  const [activeTab, setActiveTab] = useState('general');

  const tabs = [
    { id: 'general', label: 'عام', icon: Building },
    { id: 'notifications', label: 'الإشعارات', icon: Bell },
    { id: 'billing', label: 'الفوترة والدفع', icon: Wallet },
    { id: 'security', label: 'الأمان', icon: Shield },
  ];

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold font-sans text-text-primary tracking-tight">الإعدادات</h1>
        <p className="text-sm font-sans text-text-secondary mt-1">إدارة تفضيلات النظام وإعدادات المكتب الهندسي.</p>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        {/* Settings Sidebar */}
        <div className="w-full md:w-64 shrink-0 space-y-1">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-sans transition-colors ${
                activeTab === tab.id 
                  ? 'bg-accent/10 text-accent font-semibold' 
                  : 'text-text-secondary hover:bg-bg-elevated hover:text-text-primary'
              }`}
            >
              <tab.icon className={`w-4 h-4 ${activeTab === tab.id ? 'text-accent' : 'text-text-muted'}`} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Settings Content */}
        <div className="flex-1 bg-bg-surface border border-border-default rounded-xl shadow-sm p-6 lg:p-8">
          
          {activeTab === 'general' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="border-b border-border-subtle pb-4 mb-6">
                <h2 className="text-lg font-semibold text-text-primary font-sans">معلومات المكتب</h2>
                <p className="text-sm text-text-muted mt-1 font-sans">تحديث اسم المكتب وبيانات التواصل الأساسية.</p>
              </div>
              
              <div className="grid grid-cols-1 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-text-primary font-sans">اسم المكتب الهندسي</label>
                  <Input defaultValue="مكتب أبعاد الهندسي" className="max-w-md" />
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium text-text-primary font-sans">البريد الإلكتروني للتواصل</label>
                  <Input type="email" defaultValue="contact@abaad.com" className="max-w-md dir-ltr text-left" dir="ltr" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-md">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-text-primary font-sans">الهاتف</label>
                    <Input type="tel" defaultValue="0501234567" className="dir-ltr text-left" dir="ltr" />
                  </div>
                  <div className="space-y-2">
                     <label className="text-sm font-medium text-text-primary font-sans">الرقم الضريبي</label>
                     <Input defaultValue="310000000000003" className="dir-ltr text-left font-mono" dir="ltr" />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium text-text-primary font-sans">نسبة غرامة التأخير الافتراضية (%)</label>
                  <Input type="number" defaultValue="2.5" className="max-w-[120px] font-mono dir-ltr text-left" dir="ltr" />
                  <p className="text-xs text-text-muted font-sans">يتم تطبيقها تلقائياً عند تجاوز الدفعات لتاريخ الاستحقاق لأكثر من 14 يوم.</p>
                </div>
              </div>

              <div className="pt-6 border-t border-border-default mt-8 flex justify-end">
                <Button className="bg-accent hover:bg-accent-hover text-white font-sans">
                  <Save className="w-4 h-4 ml-2 ml-rtl-mr" /> حفظ التغييرات
                </Button>
              </div>
            </div>
          )}

          {activeTab !== 'general' && (
            <div className="flex flex-col items-center justify-center py-16 text-center animate-in fade-in duration-300">
               <div className="w-16 h-16 rounded-full bg-bg-base border border-border-default flex items-center justify-center mb-4 text-text-muted">
                 {activeTab === 'notifications' && <Bell className="w-8 h-8" />}
                 {activeTab === 'billing' && <Wallet className="w-8 h-8" />}
                 {activeTab === 'security' && <Shield className="w-8 h-8" />}
               </div>
               <h3 className="text-lg font-semibold text-text-primary font-sans mb-2">قريباً</h3>
               <p className="text-sm text-text-secondary font-sans max-w-xs">هذا القسم قيد التطوير وسيتم توفيره في التحديثات القادمة للمنصة.</p>
            </div>
          )}
          
        </div>
      </div>
    </div>
  );
}

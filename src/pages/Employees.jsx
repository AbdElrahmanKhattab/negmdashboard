import React, { useState } from 'react';
import { useEmployees, useCreateEmployee, useUpdateEmployeeRole, useDeleteEmployee } from '@/hooks/useData';
import { useAuthStore } from '@/stores/authStore';
import { Users, Plus, Shield, Eye, Calculator, Crown, Trash2, X, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';
import Avatar from '@/components/common/Avatar';

const ROLES = [
  { value: 'owner',      label: 'Owner',      labelAr: 'مالك',    icon: Crown,      color: 'text-[#0d47a1]', bg: 'bg-[#e0e7ff]', border: 'border-[#c7d2fe]' },
  { value: 'accountant', label: 'Accountant', labelAr: 'محاسب',   icon: Calculator,  color: 'text-[#059669]', bg: 'bg-[#d1fae5]', border: 'border-[#a7f3d0]' },
  { value: 'viewer',     label: 'Viewer',     labelAr: 'مشاهد',   icon: Eye,         color: 'text-[#6366f1]', bg: 'bg-[#e0e7ff]', border: 'border-[#c7d2fe]' },
];

function getRoleConfig(role) {
  return ROLES.find(r => r.value === role) || ROLES[2];
}

export default function Employees() {
  const currentUser = useAuthStore(state => state.user);
  const { data: employees, isLoading } = useEmployees();
  const createEmployee = useCreateEmployee();
  const updateRole = useUpdateEmployeeRole();
  const deleteEmployee = useDeleteEmployee();
  const role = useAuthStore(state => state.role);
  const isOwner = role === 'owner';

  const [showAddModal, setShowAddModal] = useState(false);
  const [form, setForm] = useState({ full_name: '', email: '', password: '', role: 'viewer' });
  const [editingRole, setEditingRole] = useState(null); // employee id being edited

  const handleAdd = async (e) => {
    e.preventDefault();
    try {
      await createEmployee.mutateAsync(form);
      toast.success('Employee added successfully');
      setForm({ full_name: '', email: '', password: '', role: 'viewer' });
      setShowAddModal(false);
    } catch (err) {
      toast.error(err.message || 'Failed to add employee');
    }
  };

  const handleRoleChange = async (id, role) => {
    try {
      await updateRole.mutateAsync({ id, role });
      toast.success('Role updated');
      setEditingRole(null);
    } catch (err) {
      toast.error(err.message || 'Failed to update role');
    }
  };

  const handleDelete = async (id, name) => {
    if (!confirm(`Are you sure you want to remove ${name}?`)) return;
    try {
      await deleteEmployee.mutateAsync(id);
      toast.success('Employee removed');
    } catch (err) {
      toast.error(err.message || 'Failed to remove employee');
    }
  };

  return (
    <div className="space-y-8 pb-10">
      
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-sans text-[#1e3a8a] tracking-tight flex items-center gap-3">
            <Users className="w-8 h-8 text-[#0d47a1]" />
            Team Members
            <span className="text-[#0d47a1] font-sans">فريق العمل</span>
          </h1>
          <p className="text-sm font-sans text-text-secondary mt-1 font-medium">Manage employee accounts, roles, and access levels.</p>
        </div>
        
        {isOwner && (
          <button 
            onClick={() => setShowAddModal(true)}
            className="px-5 py-2.5 rounded-lg bg-[#0d47a1] text-white text-sm font-semibold shadow-sm hover:bg-[#1565c0] transition-colors font-sans border border-[#0d47a1] flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Employee
          </button>
        )}
      </div>

      {/* Role Legend */}
      <div className="flex flex-wrap items-center gap-3">
        {ROLES.map(r => {
          const Icon = r.icon;
          return (
            <div key={r.value} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold border ${r.bg} ${r.color} ${r.border}`}>
              <Icon className="w-3.5 h-3.5" />
              {r.label}
              <span className="font-sans text-[10px] font-semibold opacity-70">{r.labelAr}</span>
            </div>
          );
        })}
      </div>

      {/* Employees Table */}
      <div className="bg-bg-surface border border-border-subtle rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#f4f7fb] border-b border-border-default text-xs font-bold text-text-secondary uppercase tracking-wider font-sans">
                <th className="py-4 px-6">
                  Employee <div className="text-[10px] text-text-muted mt-0.5 font-sans lowercase">الموظف</div>
                </th>
                <th className="py-4 px-6">
                  Email <div className="text-[10px] text-text-muted mt-0.5 font-sans lowercase">البريد</div>
                </th>
                <th className="py-4 px-6">
                  Role <div className="text-[10px] text-text-muted mt-0.5 font-sans lowercase">الصلاحية</div>
                </th>
                <th className="py-4 px-6">
                  Joined <div className="text-[10px] text-text-muted mt-0.5 font-sans lowercase">تاريخ الانضمام</div>
                </th>
                {isOwner && (
                  <th className="py-4 px-6 text-right">
                    Actions <div className="text-[10px] text-text-muted mt-0.5 font-sans lowercase text-right">إجراءات</div>
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {isLoading ? (
                <tr><td colSpan={5} className="py-12 text-center text-text-muted text-sm font-sans">Loading employees...</td></tr>
              ) : !employees || employees.length === 0 ? (
                <tr><td colSpan={5} className="py-12 text-center text-text-muted text-sm font-sans">No employees found. Add your first team member.</td></tr>
              ) : employees.map((emp) => {
                const rc = getRoleConfig(emp.role);
                const RoleIcon = rc.icon;
                const isCurrentUser = emp.id === currentUser?.id;

                return (
                  <tr key={emp.id} className="hover:bg-[#f8fafc] transition-colors group">
                    {/* Name */}
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <Avatar alt={emp.full_name || 'User'} size="sm" />
                        <div>
                          <div className="font-bold text-sm text-text-primary font-sans">
                            {emp.full_name || 'Unnamed'}
                            {isCurrentUser && <span className="ml-2 text-[10px] text-[#0d47a1] bg-[#e0e7ff] px-1.5 py-0.5 rounded font-bold">YOU</span>}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Email */}
                    <td className="py-4 px-6 text-sm text-text-secondary font-sans font-medium">
                      {emp.email || '—'}
                    </td>

                    {/* Role */}
                    <td className="py-4 px-6">
                      {editingRole === emp.id && isOwner ? (
                        <div className="flex items-center gap-2">
                          <select
                            defaultValue={emp.role}
                            onChange={(e) => handleRoleChange(emp.id, e.target.value)}
                            className="bg-white border border-border-default rounded-lg px-3 py-1.5 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-[#0d47a1] focus:border-transparent font-sans"
                          >
                            {ROLES.map(r => (
                              <option key={r.value} value={r.value}>{r.label}</option>
                            ))}
                          </select>
                          <button onClick={() => setEditingRole(null)} className="p-1 text-text-muted hover:text-text-primary">
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => isOwner && setEditingRole(emp.id)}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border ${isOwner ? 'cursor-pointer hover:opacity-80' : 'cursor-default'} transition-opacity ${rc.bg} ${rc.color} ${rc.border}`}
                        >
                          <RoleIcon className="w-3.5 h-3.5" />
                          {rc.label}
                          {isOwner && <ChevronDown className="w-3 h-3 opacity-50" />}
                        </button>
                      )}
                    </td>

                    {/* Joined */}
                    <td className="py-4 px-6 text-xs font-semibold text-text-secondary font-sans">
                      {emp.created_at ? new Date(emp.created_at).toLocaleDateString() : '—'}
                    </td>

                    {/* Actions */}
                    {isOwner && (
                      <td className="py-4 px-6 text-right">
                        {!isCurrentUser && (
                          <button
                            onClick={() => handleDelete(emp.id, emp.full_name)}
                            className="p-2 text-text-muted hover:text-[#ef4444] hover:bg-[#fee2e2] rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                            title="Remove employee"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Summary Footer */}
        {employees && employees.length > 0 && (
          <div className="p-4 border-t border-border-default bg-[#f8fafc] flex items-center justify-between">
            <span className="text-sm font-medium text-text-muted font-sans">
              {employees.length} team member{employees.length !== 1 ? 's' : ''}
            </span>
            <div className="flex items-center gap-4 text-xs font-semibold text-text-secondary">
              <span>{employees.filter(e => e.role === 'owner').length} Owner(s)</span>
              <span>{employees.filter(e => e.role === 'accountant').length} Accountant(s)</span>
              <span>{employees.filter(e => e.role === 'viewer').length} Viewer(s)</span>
            </div>
          </div>
        )}
      </div>

      {/* Add Employee Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setShowAddModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-8 space-y-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-text-primary font-sans flex items-center gap-2">
                <Plus className="w-5 h-5 text-[#0d47a1]" />
                Add Employee
                <span className="text-[#0d47a1] font-sans text-base">إضافة موظف</span>
              </h2>
              <button onClick={() => setShowAddModal(false)} className="p-2 text-text-muted hover:text-text-primary hover:bg-bg-base rounded-lg transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAdd} className="space-y-5">
              <div>
                <label className="block text-sm font-bold text-text-secondary mb-1.5 font-sans">Full Name <span className="text-text-muted font-sans text-xs">(الاسم الكامل)</span></label>
                <input
                  type="text"
                  required
                  value={form.full_name}
                  onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))}
                  className="w-full bg-white border border-border-default rounded-lg px-4 py-2.5 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-[#0d47a1] focus:border-transparent font-sans"
                  placeholder="e.g. Ahmed Hassan"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-text-secondary mb-1.5 font-sans">Email <span className="text-text-muted font-sans text-xs">(البريد الإلكتروني)</span></label>
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  className="w-full bg-white border border-border-default rounded-lg px-4 py-2.5 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-[#0d47a1] focus:border-transparent font-sans"
                  placeholder="ahmed@company.com"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-text-secondary mb-1.5 font-sans">Password <span className="text-text-muted font-sans text-xs">(كلمة المرور)</span></label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  className="w-full bg-white border border-border-default rounded-lg px-4 py-2.5 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-[#0d47a1] focus:border-transparent font-sans"
                  placeholder="Minimum 6 characters"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-text-secondary mb-1.5 font-sans">Role <span className="text-text-muted font-sans text-xs">(الصلاحية)</span></label>
                <div className="grid grid-cols-3 gap-3">
                  {ROLES.map(r => {
                    const Icon = r.icon;
                    const isSelected = form.role === r.value;
                    return (
                      <button
                        key={r.value}
                        type="button"
                        onClick={() => setForm(f => ({ ...f, role: r.value }))}
                        className={`flex flex-col items-center gap-1.5 p-4 rounded-xl border-2 transition-all ${
                          isSelected 
                            ? `${r.bg} ${r.color} ${r.border} shadow-md scale-[1.02]`
                            : 'bg-white border-border-default text-text-secondary hover:border-[#c7d2fe]'
                        }`}
                      >
                        <Icon className="w-6 h-6" />
                        <span className="text-xs font-bold">{r.label}</span>
                        <span className="text-[10px] font-sans opacity-60">{r.labelAr}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-5 py-2.5 rounded-lg bg-[#f1f5f9] text-text-primary text-sm font-semibold hover:bg-[#e2e8f0] transition-colors border border-border-default font-sans"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createEmployee.isPending}
                  className="px-5 py-2.5 rounded-lg bg-[#0d47a1] text-white text-sm font-semibold shadow-sm hover:bg-[#1565c0] transition-colors font-sans border border-[#0d47a1] disabled:opacity-50"
                >
                  {createEmployee.isPending ? 'Adding...' : 'Add Employee'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

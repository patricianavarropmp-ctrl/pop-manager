import React, { useState, useEffect } from 'react';
import { Building2, Plus, Edit3, Trash2, X, Loader2, Save, Crown, Users, Download } from 'lucide-react';
import { AvatarCircle } from '../components';
import { Profile, View } from '../types';
import { departmentService, DepartmentWithLeader } from '../services/departments';
import { userService } from '../services/users';
import { pdfExportService } from '../services/pdfExport';

interface DepartmentsViewProps {
    setView: (v: View) => void;
}

interface DeptFormData {
    name: string;
    description: string;
    leader_id: string | null;
}

const defaultForm: DeptFormData = { name: '', description: '', leader_id: null };

export const DepartmentsView = ({ setView }: DepartmentsViewProps) => {
    const [departments, setDepartments] = useState<DepartmentWithLeader[]>([]);
    const [allUsers, setAllUsers] = useState<Profile[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Modal
    const [showModal, setShowModal] = useState(false);
    const [editingDept, setEditingDept] = useState<DepartmentWithLeader | null>(null);
    const [formData, setFormData] = useState<DeptFormData>(defaultForm);
    const [isSaving, setIsSaving] = useState(false);
    const [exportingDeptId, setExportingDeptId] = useState<string | null>(null);

    const handleExportDeptPdf = async (dept: DepartmentWithLeader) => {
        setExportingDeptId(dept.id);
        try {
            await pdfExportService.generateDepartmentPdf(dept.id, dept.name);
        } catch (err) {
            console.error('PDF export error:', err);
            alert('Erro ao gerar PDF do departamento.');
        } finally {
            setExportingDeptId(null);
        }
    };

    const fetchAll = async () => {
        setIsLoading(true);
        try {
            const [depts, users] = await Promise.all([
                departmentService.getDepartments(),
                userService.getProfiles(),
            ]);
            setDepartments(depts);
            setAllUsers(users);
        } catch (error) {
            console.error('Failed to load departments', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => { fetchAll(); }, []);

    // Count users per department
    const getUserCount = (deptId: string) => allUsers.filter(u => u.department_id === deptId).length;

    // --- CREATE / EDIT ---
    const handleOpenCreate = () => {
        setEditingDept(null);
        setFormData(defaultForm);
        setShowModal(true);
    };

    const handleOpenEdit = (dept: DepartmentWithLeader) => {
        setEditingDept(dept);
        setFormData({
            name: dept.name,
            description: dept.description || '',
            leader_id: dept.leader_id,
        });
        setShowModal(true);
    };

    const handleSave = async () => {
        if (!formData.name.trim()) { alert('Nome do departamento é obrigatório.'); return; }
        setIsSaving(true);
        try {
            if (editingDept) {
                await departmentService.updateDepartment(editingDept.id, {
                    name: formData.name,
                    description: formData.description || null,
                    leader_id: formData.leader_id || null,
                });
                alert('Departamento atualizado!');
            } else {
                await departmentService.createDepartment({
                    name: formData.name,
                    description: formData.description || undefined,
                    leader_id: formData.leader_id || null,
                });
                alert('Departamento criado!');
            }
            setShowModal(false);
            await fetchAll();
        } catch (error: any) {
            alert(`Erro: ${error.message}`);
        } finally {
            setIsSaving(false);
        }
    };

    // --- DELETE ---
    const handleDelete = async (dept: DepartmentWithLeader) => {
        const userCount = getUserCount(dept.id);
        const msg = userCount > 0
            ? `Este departamento tem ${userCount} membro(s). Tem certeza que deseja excluí-lo? Os membros ficarão sem departamento.`
            : `Tem certeza que deseja excluir o departamento "${dept.name}"?`;
        if (!window.confirm(msg)) return;
        try {
            await departmentService.deleteDepartment(dept.id);
            alert('Departamento excluído.');
            await fetchAll();
        } catch (error: any) {
            alert(`Erro ao excluir: ${error.message}`);
        }
    };

    // --- MODAL ---
    const Modal = ({ title, show, onClose, children }: { title: string; show: boolean; onClose: () => void; children: React.ReactNode }) => {
        if (!show) return null;
        return (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
                <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-lg border border-slate-200 dark:border-slate-700" onClick={e => e.stopPropagation()}>
                    <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800">
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white">{title}</h3>
                        <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 transition-colors"><X size={20} /></button>
                    </div>
                    <div className="p-6 space-y-5">{children}</div>
                </div>
            </div>
        );
    };

    const inputClass = "w-full bg-slate-50 border border-slate-300 text-slate-900 text-sm rounded-xl focus:ring-blue-500 focus:border-blue-500 block p-3 dark:bg-slate-800 dark:border-slate-700 dark:placeholder-slate-400 dark:text-white transition-colors";

    return (
        <div className="flex-1 flex flex-col overflow-hidden">
            <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 p-8">
                <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h2 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">Departamentos</h2>
                        <p className="text-slate-500 dark:text-slate-400 mt-1">Gerencie os departamentos e seus líderes.</p>
                    </div>
                    <button onClick={handleOpenCreate} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg flex items-center gap-2 font-bold transition-all shadow-lg shadow-blue-600/20">
                        <Plus size={20} />
                        <span>Novo Departamento</span>
                    </button>
                </div>
            </header>

            <section className="flex-1 overflow-y-auto p-8">
                <div className="max-w-6xl mx-auto">
                    {isLoading ? (
                        <div className="flex items-center justify-center py-20 text-slate-500">
                            <Loader2 size={28} className="animate-spin mr-3" /> Carregando departamentos...
                        </div>
                    ) : departments.length === 0 ? (
                        <div className="text-center py-20 text-slate-500">
                            <Building2 size={48} className="mx-auto mb-4 text-slate-300" />
                            <p className="text-lg font-medium">Nenhum departamento cadastrado.</p>
                            <p className="text-sm mt-1">Clique em "Novo Departamento" para começar.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {departments.map((dept) => {
                                const memberCount = getUserCount(dept.id);
                                return (
                                    <div key={dept.id} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow overflow-hidden group">
                                        <div className="p-6">
                                            <div className="flex items-start justify-between mb-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                                                        <Building2 size={20} className="text-blue-600 dark:text-blue-400" />
                                                    </div>
                                                    <div>
                                                        <h3 className="font-bold text-slate-900 dark:text-white">{dept.name}</h3>
                                                        {dept.description && <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{dept.description}</p>}
                                                    </div>
                                                </div>
                                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button onClick={() => handleOpenEdit(dept)} className="p-1.5 text-slate-400 hover:text-blue-600 transition-colors" title="Editar"><Edit3 size={16} /></button>
                                                    <button onClick={() => handleDelete(dept)} className="p-1.5 text-slate-400 hover:text-rose-500 transition-colors" title="Excluir"><Trash2 size={16} /></button>
                                                </div>
                                            </div>

                                            {/* Leader */}
                                            <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl mb-3">
                                                <Crown size={14} className="text-amber-500 shrink-0" />
                                                {dept.leader ? (
                                                    <div className="flex items-center gap-2 min-w-0">
                                                        <AvatarCircle src={dept.leader.avatar_url || ''} fallback={dept.leader.full_name?.[0] || 'L'} size="sm" />
                                                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300 truncate">{dept.leader.full_name || dept.leader.email}</span>
                                                    </div>
                                                ) : (
                                                    <span className="text-sm text-slate-400 italic">Sem líder definido</span>
                                                )}
                                            </div>

                                            {/* Member count */}
                                            <div className="flex items-center gap-2 text-sm text-slate-500">
                                                <Users size={14} />
                                                <span>{memberCount} membro{memberCount !== 1 ? 's' : ''}</span>
                                            </div>

                                            {/* Export PDF button */}
                                            <button
                                                onClick={() => handleExportDeptPdf(dept)}
                                                disabled={exportingDeptId === dept.id}
                                                className="w-full mt-3 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-xl text-xs font-bold hover:bg-blue-600 hover:text-white transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                                            >
                                                {exportingDeptId === dept.id ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
                                                {exportingDeptId === dept.id ? 'Gerando...' : 'Exportar POPs em PDF'}
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </section>

            {/* ===== CREATE/EDIT MODAL ===== */}
            <Modal title={editingDept ? 'Editar Departamento' : 'Novo Departamento'} show={showModal} onClose={() => setShowModal(false)}>
                <div>
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">Nome do Departamento</label>
                    <input type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className={inputClass} placeholder="Ex: Produção, Qualidade, TI..." />
                </div>
                <div>
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">Descrição (Opcional)</label>
                    <textarea value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} className={`${inputClass} resize-none`} rows={3} placeholder="Descreva brevemente o departamento..." />
                </div>
                <div>
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">Líder do Departamento</label>
                    <select value={formData.leader_id || ''} onChange={e => setFormData({ ...formData, leader_id: e.target.value || null })} className={inputClass}>
                        <option value="">— Nenhum líder —</option>
                        {allUsers.filter(u => u.status === 'active').map(u => (
                            <option key={u.id} value={u.id}>{u.full_name || u.email} ({u.role === 'admin' ? 'Admin' : 'Colab.'})</option>
                        ))}
                    </select>
                </div>
                <div className="flex justify-end gap-3 pt-2">
                    <button onClick={() => setShowModal(false)} className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">Cancelar</button>
                    <button onClick={handleSave} disabled={isSaving} className="flex items-center gap-2 px-5 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700 transition-all disabled:opacity-50">
                        {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                        {isSaving ? 'Salvando...' : (editingDept ? 'Salvar Alterações' : 'Criar Departamento')}
                    </button>
                </div>
            </Modal>
        </div>
    );
};

import React, { useState, useEffect } from 'react';
import { Search, UserPlus, Filter, Edit3, Trash2, X, Loader2, Users, UserCheck, Shield, Save } from 'lucide-react';
import { StatsCard, StatusBadge, Pagination, AvatarCircle } from '../components';
import { Profile, Department, View } from '../types';
import { userService } from '../services/users';
import { departmentService } from '../services/departments';
import { useAuth } from '../contexts/AuthContext';

interface UserManagementViewProps {
    setView: (v: View) => void;
}

interface UserFormData {
    email: string;
    password: string;
    full_name: string;
    role: 'admin' | 'collaborator';
    department_id: string | null;
}

const defaultFormData: UserFormData = {
    email: '',
    password: '',
    full_name: '',
    role: 'collaborator',
    department_id: null,
};

export const UserManagementView = ({ setView }: UserManagementViewProps) => {
    const { profile: currentProfile } = useAuth();
    const [users, setUsers] = useState<Profile[]>([]);
    const [filteredUsers, setFilteredUsers] = useState<Profile[]>([]);
    const [departments, setDepartments] = useState<Department[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    // Modal States
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [editingUser, setEditingUser] = useState<Profile | null>(null);
    const [formData, setFormData] = useState<UserFormData>(defaultFormData);
    const [isSaving, setIsSaving] = useState(false);

    const fetchUsers = async () => {
        setIsLoading(true);
        try {
            const [userData, deptData] = await Promise.all([
                userService.getProfiles(),
                departmentService.getDepartments(),
            ]);
            setUsers(userData);
            setFilteredUsers(userData);
            setDepartments(deptData);
        } catch (error) {
            console.error('Failed to load users', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => { fetchUsers(); }, []);

    useEffect(() => {
        if (!searchQuery.trim()) {
            setFilteredUsers(users);
        } else {
            const q = searchQuery.toLowerCase();
            setFilteredUsers(users.filter(u =>
                (u.full_name || '').toLowerCase().includes(q) ||
                u.email.toLowerCase().includes(q) ||
                u.role.toLowerCase().includes(q)
            ));
        }
    }, [searchQuery, users]);

    const activeUsers = users.filter(u => u.status === 'active').length;
    const adminUsers = users.filter(u => u.role === 'admin').length;

    const USER_STATS = [
        { label: 'Total de Usuários', value: users.length.toString(), icon: Users, color: 'blue' as const },
        { label: 'Usuários Ativos', value: activeUsers.toString(), icon: UserCheck, color: 'emerald' as const },
        { label: 'Acesso Administrativo', value: adminUsers.toString(), icon: Shield, color: 'purple' as const },
    ];

    // --- CREATE ---
    const handleOpenCreate = () => {
        setFormData(defaultFormData);
        setShowCreateModal(true);
    };

    const handleCreate = async () => {
        if (!formData.email || !formData.password) {
            alert('E-mail e Senha são obrigatórios.');
            return;
        }
        setIsSaving(true);
        try {
            await userService.createUser({
                email: formData.email,
                password: formData.password,
                full_name: formData.full_name,
                role: formData.role,
            });
            alert('Usuário criado com sucesso!');
            setShowCreateModal(false);
            setFormData(defaultFormData);
            await fetchUsers();
        } catch (error: any) {
            alert(`Erro ao criar usuário: ${error.message}`);
        } finally {
            setIsSaving(false);
        }
    };

    // --- EDIT ---
    const handleOpenEdit = (user: Profile) => {
        setEditingUser(user);
        setFormData({
            email: user.email,
            password: '',
            full_name: user.full_name || '',
            role: user.role as 'admin' | 'collaborator',
            department_id: user.department_id || null,
        });
        setShowEditModal(true);
    };

    const handleUpdate = async () => {
        if (!editingUser) return;
        setIsSaving(true);
        try {
            await userService.updateProfile(editingUser.id, {
                full_name: formData.full_name,
                role: formData.role,
                department_id: formData.department_id,
            });
            alert('Usuário atualizado com sucesso!');
            setShowEditModal(false);
            setEditingUser(null);
            await fetchUsers();
        } catch (error: any) {
            alert(`Erro ao atualizar: ${error.message}`);
        } finally {
            setIsSaving(false);
        }
    };

    // --- DELETE ---
    const handleDelete = async (user: Profile) => {
        if (user.id === currentProfile?.id) {
            alert('Você não pode excluir a si mesmo.');
            return;
        }
        if (!window.confirm(`Tem certeza que deseja EXCLUIR o usuário "${user.full_name || user.email}"? Esta ação não pode ser desfeita.`)) return;

        try {
            await userService.deleteUser(user.id);
            alert('Usuário excluído com sucesso.');
            await fetchUsers();
        } catch (error: any) {
            alert(`Erro ao excluir: ${error.message}`);
        }
    };

    // --- TOGGLE STATUS ---
    const handleToggleStatus = async (user: Profile) => {
        const newStatus = user.status === 'active' ? 'inactive' : 'active';
        try {
            await userService.updateProfile(user.id, { status: newStatus });
            await fetchUsers();
        } catch (error: any) {
            alert(`Erro ao alterar status: ${error.message}`);
        }
    };

    // --- MODAL Component ---
    const Modal = ({ title, show, onClose, children }: { title: string; show: boolean; onClose: () => void; children: React.ReactNode }) => {
        if (!show) return null;
        return (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
                <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-lg border border-slate-200 dark:border-slate-700" onClick={e => e.stopPropagation()}>
                    <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800">
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white">{title}</h3>
                        <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 transition-colors"><X size={20} /></button>
                    </div>
                    <div className="p-6 space-y-5">
                        {children}
                    </div>
                </div>
            </div>
        );
    };

    const FormField = ({ label, children }: { label: string; children: React.ReactNode }) => (
        <div>
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">{label}</label>
            {children}
        </div>
    );

    const inputClass = "w-full bg-slate-50 border border-slate-300 text-slate-900 text-sm rounded-xl focus:ring-blue-500 focus:border-blue-500 block p-3 dark:bg-slate-800 dark:border-slate-700 dark:placeholder-slate-400 dark:text-white transition-colors";

    return (
        <div className="flex-1 flex flex-col overflow-hidden">
            <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 p-8">
                <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h2 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">Gestão de Usuários</h2>
                        <p className="text-slate-500 dark:text-slate-400 mt-1">Visualize e gerencie as permissões de acesso dos colaboradores.</p>
                    </div>
                    <button
                        onClick={handleOpenCreate}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg flex items-center gap-2 font-bold transition-all shadow-lg shadow-blue-600/20"
                    >
                        <UserPlus size={20} />
                        <span>Adicionar Novo Usuário</span>
                    </button>
                </div>
            </header>

            <section className="flex-1 overflow-y-auto p-8">
                <div className="max-w-6xl mx-auto space-y-6">
                    {/* Search */}
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="relative flex-1">
                            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-600 outline-none text-sm shadow-sm"
                                placeholder="Pesquisar por nome, e-mail ou cargo..."
                            />
                        </div>
                    </div>

                    {/* Table */}
                    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                        <div className="overflow-x-auto min-h-[300px]">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Nome</th>
                                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">E-mail</th>
                                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Acesso</th>
                                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Ações</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                    {isLoading ? (
                                        <tr>
                                            <td colSpan={5} className="text-center py-10 text-slate-500">
                                                <Loader2 size={24} className="animate-spin mx-auto mb-2" /> Carregando usuários...
                                            </td>
                                        </tr>
                                    ) : filteredUsers.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="text-center py-10 text-slate-500">
                                                Nenhum usuário encontrado.
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredUsers.map((user) => (
                                            <tr key={user.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors group">
                                                <td className="px-6 py-5">
                                                    <div className="flex items-center gap-3">
                                                        <AvatarCircle
                                                            src={user.avatar_url || ''}
                                                            fallback={user.full_name?.[0]?.toUpperCase() || user.email[0].toUpperCase()}
                                                            size="md"
                                                        />
                                                        <span className="text-sm font-semibold text-slate-900 dark:text-white">{user.full_name || 'Usuário Sem Nome'}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-5 text-sm text-slate-500 dark:text-slate-400">{user.email}</td>
                                                <td className="px-6 py-5">
                                                    <span className={`px-3 py-1 rounded-full text-[12px] font-bold ${user.role === 'admin'
                                                        ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
                                                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                                                        }`}>
                                                        {user.role === 'admin' ? 'Administrador' : 'Colaborador'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-5">
                                                    <button onClick={() => handleToggleStatus(user)} title="Clique para alternar status">
                                                        <StatusBadge status={user.status === 'active' ? 'Ativo' : 'Inativo'} />
                                                    </button>
                                                </td>
                                                <td className="px-6 py-5 text-right">
                                                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <button onClick={() => handleOpenEdit(user)} className="p-1.5 text-slate-400 hover:text-blue-600 transition-colors" title="Editar"><Edit3 size={18} /></button>
                                                        <button onClick={() => handleDelete(user)} className="p-1.5 text-slate-400 hover:text-rose-500 transition-colors" title="Excluir"><Trash2 size={18} /></button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                        {filteredUsers.length > 0 && (
                            <Pagination
                                currentPage={1}
                                totalPages={1}
                                totalItems={filteredUsers.length}
                                itemsShown={filteredUsers.length}
                                itemLabel="usuários"
                            />
                        )}
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {USER_STATS.map((stat, i) => (
                            <div key={i}>
                                <StatsCard stat={stat} animated={false} index={i} />
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ===== CREATE MODAL ===== */}
            <Modal title="Adicionar Novo Usuário" show={showCreateModal} onClose={() => setShowCreateModal(false)}>
                <FormField label="Nome Completo">
                    <input type="text" value={formData.full_name} onChange={e => setFormData({ ...formData, full_name: e.target.value })} className={inputClass} placeholder="Nome do colaborador" />
                </FormField>
                <FormField label="E-mail">
                    <input type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} className={inputClass} placeholder="email@empresa.com" />
                </FormField>
                <FormField label="Senha Inicial">
                    <input type="password" value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} className={inputClass} placeholder="Mínimo 6 caracteres" />
                </FormField>
                <FormField label="Nível de Acesso">
                    <select value={formData.role} onChange={e => setFormData({ ...formData, role: e.target.value as any })} className={inputClass}>
                        <option value="collaborator">Colaborador</option>
                        <option value="admin">Administrador</option>
                    </select>
                </FormField>
                <FormField label="Departamento">
                    <select value={formData.department_id || ''} onChange={e => setFormData({ ...formData, department_id: e.target.value || null })} className={inputClass}>
                        <option value="">— Sem departamento —</option>
                        {departments.map(d => (<option key={d.id} value={d.id}>{d.name}</option>))}
                    </select>
                </FormField>
                <div className="flex justify-end gap-3 pt-2">
                    <button onClick={() => setShowCreateModal(false)} className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">Cancelar</button>
                    <button onClick={handleCreate} disabled={isSaving} className="flex items-center gap-2 px-5 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700 transition-all disabled:opacity-50">
                        {isSaving ? <Loader2 size={16} className="animate-spin" /> : <UserPlus size={16} />}
                        {isSaving ? 'Criando...' : 'Criar Usuário'}
                    </button>
                </div>
            </Modal>

            {/* ===== EDIT MODAL ===== */}
            <Modal title="Editar Usuário" show={showEditModal} onClose={() => setShowEditModal(false)}>
                <FormField label="Nome Completo">
                    <input type="text" value={formData.full_name} onChange={e => setFormData({ ...formData, full_name: e.target.value })} className={inputClass} />
                </FormField>
                <FormField label="E-mail">
                    <input type="email" value={formData.email} disabled className={`${inputClass} opacity-60 cursor-not-allowed`} />
                    <p className="text-xs text-slate-500 mt-1">O e-mail não pode ser alterado por aqui.</p>
                </FormField>
                <FormField label="Nível de Acesso">
                    <select value={formData.role} onChange={e => setFormData({ ...formData, role: e.target.value as any })} className={inputClass}>
                        <option value="collaborator">Colaborador</option>
                        <option value="admin">Administrador</option>
                    </select>
                </FormField>
                <FormField label="Departamento">
                    <select value={formData.department_id || ''} onChange={e => setFormData({ ...formData, department_id: e.target.value || null })} className={inputClass}>
                        <option value="">— Sem departamento —</option>
                        {departments.map(d => (<option key={d.id} value={d.id}>{d.name}</option>))}
                    </select>
                </FormField>
                <div className="flex justify-end gap-3 pt-2">
                    <button onClick={() => setShowEditModal(false)} className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">Cancelar</button>
                    <button onClick={handleUpdate} disabled={isSaving} className="flex items-center gap-2 px-5 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700 transition-all disabled:opacity-50">
                        {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                        {isSaving ? 'Salvando...' : 'Salvar Alterações'}
                    </button>
                </div>
            </Modal>
        </div>
    );
};

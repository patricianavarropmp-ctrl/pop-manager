import React, { useState } from 'react';
import { User, Lock, Mail, Save, Loader2, Camera } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { AvatarCircle } from '../components';
import type { View } from '../types';
import { authService } from '../lib/auth';

interface ProfileViewProps {
    setView: (v: View) => void;
}

export const ProfileView = ({ setView }: ProfileViewProps) => {
    const { profile, user, refreshProfile } = useAuth();

    // States for "Dados Pessoais"
    const [fullName, setFullName] = useState(profile?.full_name || '');
    const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url || '');
    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
    const [isSavingProfile, setIsSavingProfile] = useState(false);

    // States for "Segurança"
    const [email, setEmail] = useState(user?.email || '');
    const [password, setPassword] = useState('');
    const [isSavingSecurity, setIsSavingSecurity] = useState(false);

    const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setAvatarFile(file);
            setAvatarPreview(URL.createObjectURL(file));
        }
    };

    const handleSaveProfile = async () => {
        if (!user || !profile) return;
        setIsSavingProfile(true);
        try {
            let finalAvatarUrl = avatarUrl;

            if (avatarFile) {
                finalAvatarUrl = await authService.uploadAvatar(user.id, avatarFile);
            }

            await authService.updateProfile(user.id, {
                full_name: fullName,
                avatar_url: finalAvatarUrl
            });

            await refreshProfile();
            setAvatarUrl(finalAvatarUrl);
            setAvatarPreview(null);
            setAvatarFile(null);

            alert('Perfil atualizado com sucesso!');
        } catch (error: any) {
            console.error('Erro ao atualizar perfil', error);
            alert(`Erro ao atualizar perfil: ${error.message}`);
        } finally {
            setIsSavingProfile(false);
        }
    };

    const handleSaveSecurity = async () => {
        setIsSavingSecurity(true);
        try {
            await authService.updateCredentials({
                email: email !== user?.email ? email : undefined,
                password: password ? password : undefined
            });
            alert('Credenciais atualizadas com sucesso! Se você alterou o email, confirme no link enviado.');
            setPassword('');
        } catch (error: any) {
            console.error('Erro ao atualizar credenciais', error);
            alert(`Erro ao atualizar credenciais: ${error.message}`);
        } finally {
            setIsSavingSecurity(false);
        }
    };

    return (
        <div className="flex-1 flex flex-col p-6 md:p-10 overflow-y-auto max-w-4xl mx-auto w-full">
            <div className="mb-10">
                <nav className="flex items-center gap-2 text-sm text-slate-500 mb-4">
                    <button onClick={() => setView('dashboard')} className="hover:text-blue-600">Visão Geral</button>
                    <span>/</span>
                    <span className="text-slate-900 dark:text-slate-200 font-medium">Meu Perfil</span>
                </nav>
                <h1 className="text-slate-900 dark:text-white text-3xl font-extrabold tracking-tight mb-2">Meu Perfil</h1>
                <p className="text-slate-500 dark:text-slate-400 text-lg">Gerencie suas informações pessoais e de segurança.</p>
            </div>

            <div className="space-y-8 pb-20">
                {/* Dados Pessoais */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
                    <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            <User size={20} className="text-blue-500" />
                            Dados Pessoais
                        </h3>
                    </div>
                    <div className="p-6 md:p-8 space-y-8">
                        {/* Avatar */}
                        <div className="flex flex-col sm:flex-row items-center gap-6">
                            <div className="relative group">
                                <AvatarCircle
                                    src={avatarPreview || avatarUrl}
                                    fallback={fullName[0] || 'U'}
                                    size="lg"
                                    className="w-24 h-24 text-3xl"
                                />
                                <label className="absolute inset-0 bg-black/50 text-white flex items-center justify-center rounded-full opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity">
                                    <Camera size={24} />
                                    <input type="file" className="hidden" accept="image/*" onChange={handleAvatarChange} />
                                </label>
                            </div>
                            <div className="text-center sm:text-left">
                                <h4 className="font-semibold text-slate-900 dark:text-white">Foto de Perfil</h4>
                                <p className="text-sm text-slate-500 mt-1 mb-3">Recomendado: 256x256px, formato JPG, PNG ou WebP.</p>
                                <label className="cursor-pointer text-sm font-medium text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 py-1.5 px-3 rounded-lg transition-colors">
                                    Alterar Foto
                                    <input type="file" className="hidden" accept="image/*" onChange={handleAvatarChange} />
                                </label>
                            </div>
                        </div>

                        {/* Nome */}
                        <div className="max-w-md">
                            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Nome Completo</label>
                            <input
                                type="text"
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-300 text-slate-900 text-sm rounded-xl focus:ring-blue-500 focus:border-blue-500 block p-3 dark:bg-slate-800 dark:border-slate-700 dark:placeholder-slate-400 dark:text-white transition-colors"
                            />
                        </div>

                        <div className="pt-2">
                            <button
                                onClick={handleSaveProfile}
                                disabled={isSavingProfile}
                                className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold shadow-sm hover:bg-blue-700 transition-all disabled:opacity-50"
                            >
                                {isSavingProfile ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                                {isSavingProfile ? 'Salvando...' : 'Salvar Alterações'}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Segurança */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
                    <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            <Lock size={20} className="text-rose-500" />
                            Segurança & Acesso
                        </h3>
                    </div>
                    <div className="p-6 md:p-8 space-y-6">
                        <div className="max-w-md">
                            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-2">
                                <Mail size={16} className="text-slate-400" /> Endereço de E-mail
                            </label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-300 text-slate-900 text-sm rounded-xl focus:ring-blue-500 focus:border-blue-500 block p-3 dark:bg-slate-800 dark:border-slate-700 dark:placeholder-slate-400 dark:text-white transition-colors"
                            />
                            <p className="text-xs text-slate-500 mt-2">Alterar o e-mail enviará um link de confirmação para o novo endereço antes de ser validado.</p>
                        </div>

                        <div className="max-w-md">
                            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-2">
                                <Lock size={16} className="text-slate-400" /> Nova Senha
                            </label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Deixe em branco para não alterar"
                                className="w-full bg-slate-50 border border-slate-300 text-slate-900 text-sm rounded-xl focus:ring-blue-500 focus:border-blue-500 block p-3 dark:bg-slate-800 dark:border-slate-700 dark:placeholder-slate-400 dark:text-white transition-colors"
                            />
                        </div>

                        <div className="pt-2">
                            <button
                                onClick={handleSaveSecurity}
                                disabled={isSavingSecurity || (!password && email === user?.email)}
                                className="flex items-center gap-2 px-6 py-2.5 bg-slate-900 dark:bg-slate-700 text-white rounded-xl text-sm font-bold shadow-sm hover:bg-slate-800 dark:hover:bg-slate-600 transition-all disabled:opacity-50"
                            >
                                {isSavingSecurity ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                                {isSavingSecurity ? 'Atualizando...' : 'Atualizar Acesso'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

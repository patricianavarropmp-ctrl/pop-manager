import React, { useState, useEffect, useRef } from 'react';
import { KeyRound, ShieldCheck, Save, Loader2, Building2, Image as ImageIcon, Upload } from 'lucide-react';
import { settingsService } from '../services/settings';
import { useAuth } from '../contexts/AuthContext';

export const SettingsView = () => {
    const { profile } = useAuth();
    const [apiKey, setApiKey] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');

    // Company settings
    const [companyName, setCompanyName] = useState('');
    const [companyLogoUrl, setCompanyLogoUrl] = useState('');
    const [isSavingCompany, setIsSavingCompany] = useState(false);
    const [isUploadingLogo, setIsUploadingLogo] = useState(false);
    const [companySuccess, setCompanySuccess] = useState('');
    const logoInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const fetchSettings = async () => {
            setIsLoading(true);
            try {
                const [key, name, logo] = await Promise.all([
                    settingsService.getGeminiApiKey(),
                    settingsService.getCompanySetting('company_name'),
                    settingsService.getCompanySetting('company_logo_url'),
                ]);
                if (key) setApiKey(key);
                if (name) setCompanyName(name);
                if (logo) setCompanyLogoUrl(logo);
            } catch (error) {
                console.error('Failed to fetch settings:', error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchSettings();
    }, []);

    const handleSave = async () => {
        setIsSaving(true);
        setSuccessMessage('');
        try {
            const success = await settingsService.updateGeminiApiKey(apiKey);
            if (success) {
                setSuccessMessage('Chave da API atualizada com sucesso!');
                setTimeout(() => setSuccessMessage(''), 3000);
            } else {
                alert('Erro ao salvar no banco. Verifique suas permissões.');
            }
        } catch (error) {
            console.error('Save error:', error);
            alert('Erro inesperado ao salvar.');
        } finally {
            setIsSaving(false);
        }
    };

    const handleSaveCompany = async () => {
        setIsSavingCompany(true);
        setCompanySuccess('');
        try {
            const success = await settingsService.updateCompanySetting('company_name', companyName);
            if (success) {
                setCompanySuccess('Dados da empresa salvos com sucesso!');
                setTimeout(() => setCompanySuccess(''), 3000);
            } else {
                alert('Erro ao salvar. Verifique permissões.');
            }
        } catch {
            alert('Erro inesperado ao salvar.');
        } finally {
            setIsSavingCompany(false);
        }
    };

    const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setIsUploadingLogo(true);
        try {
            const url = await settingsService.uploadCompanyLogo(file);
            if (url) {
                setCompanyLogoUrl(url);
                setCompanySuccess('Logo atualizado com sucesso!');
                setTimeout(() => setCompanySuccess(''), 3000);
            } else {
                alert('Erro ao enviar logo. Verifique se o bucket "pop-images" existe e as permissões estão corretas.');
            }
        } catch {
            alert('Erro inesperado no upload.');
        } finally {
            setIsUploadingLogo(false);
        }
    };

    if (profile?.role !== 'admin') {
        return (
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
                <ShieldCheck size={48} className="text-slate-300 mb-4" />
                <h2 className="text-xl font-bold text-slate-700">Acesso Restrito</h2>
                <p className="text-slate-500">Apenas administradores podem acessar as configurações globais de IA.</p>
            </div>
        );
    }

    return (
        <div className="p-6 md:p-10 max-w-4xl mx-auto w-full">
            <div className="mb-10">
                <h1 className="text-slate-900 dark:text-white text-3xl font-extrabold tracking-tight mb-2">Configurações Avançadas</h1>
                <p className="text-slate-500 dark:text-slate-400 text-lg">Gerencie instâncias de inteligência artificial e dados da empresa.</p>
            </div>

            {/* Company Settings */}
            <div className="bg-white dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden mb-8">
                <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <Building2 size={20} className="text-blue-500" />
                        Dados da Empresa
                    </h3>
                </div>
                <div className="p-8">
                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-8">
                        Essas informações aparecerão no <strong>cabeçalho dos PDFs</strong> gerados.
                    </p>

                    {isLoading ? (
                        <div className="animate-pulse flex h-12 bg-slate-100 rounded-xl"></div>
                    ) : (
                        <div className="space-y-8">
                            {/* Logo */}
                            <div>
                                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-3">Logo da Empresa</label>
                                <div className="flex items-center gap-6">
                                    <div className="size-24 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 flex items-center justify-center overflow-hidden shrink-0">
                                        {companyLogoUrl ? (
                                            <img src={companyLogoUrl} alt="Logo" className="w-full h-full object-contain" />
                                        ) : (
                                            <ImageIcon size={28} className="text-slate-400" />
                                        )}
                                    </div>
                                    <div className="flex flex-col gap-3">
                                        <input
                                            ref={logoInputRef}
                                            type="file"
                                            accept="image/*"
                                            onChange={handleLogoUpload}
                                            className="hidden"
                                        />
                                        <button
                                            onClick={() => logoInputRef.current?.click()}
                                            disabled={isUploadingLogo}
                                            className="flex items-center gap-2 px-5 py-2.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-xl text-sm font-bold hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-all disabled:opacity-50 w-fit"
                                        >
                                            {isUploadingLogo ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
                                            {isUploadingLogo ? 'Enviando...' : 'Enviar Logo'}
                                        </button>
                                        <p className="text-xs text-slate-400">PNG ou JPG, recomendado 200x200px</p>
                                    </div>
                                </div>
                            </div>

                            {/* Company Name */}
                            <div>
                                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-3">Nome da Empresa</label>
                                <input
                                    type="text"
                                    value={companyName}
                                    onChange={(e) => setCompanyName(e.target.value)}
                                    placeholder="Ex: Minha Empresa LTDA"
                                    className="w-full bg-slate-50 border border-slate-300 text-slate-900 text-sm rounded-xl focus:ring-blue-500 focus:border-blue-500 block p-3.5 dark:bg-slate-800 dark:border-slate-700 dark:placeholder-slate-400 dark:text-white transition-colors"
                                />
                            </div>
                        </div>
                    )}
                </div>
                {!isLoading && (
                    <div className="px-8 py-5 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={handleSaveCompany}
                                disabled={isSavingCompany}
                                className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-xl font-bold transition-all shadow-sm active:scale-95"
                            >
                                {isSavingCompany ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                                <span>{isSavingCompany ? 'Salvando...' : 'Salvar Dados'}</span>
                            </button>
                            {companySuccess && <span className="text-emerald-600 font-medium text-sm animate-in fade-in slide-in-from-left-2">{companySuccess}</span>}
                        </div>
                    </div>
                )}
            </div>

            {/* AI Settings */}
            <div className="bg-white dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <KeyRound size={20} className="text-indigo-500" />
                        Google Gemini (Configuração de Vídeos)
                    </h3>
                </div>
                <div className="p-8">
                    <div className="bg-indigo-50 dark:bg-indigo-900/20 p-5 rounded-2xl mb-8 border border-indigo-100 dark:border-indigo-900/30">
                        <p className="text-sm text-indigo-700 dark:text-indigo-300 font-medium leading-relaxed">
                            <span className="inline-block px-2 py-0.5 bg-indigo-200 dark:bg-indigo-800 text-indigo-800 dark:text-indigo-200 rounded-md text-[10px] uppercase font-bold tracking-wider mr-2 align-middle">Dica</span>
                            <strong>Como obter uma chave?</strong> Acesse o <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="underline font-bold hover:text-indigo-900 dark:hover:text-indigo-100 transition-colors">Google AI Studio</a>, crie um novo projeto e gere sua API Key gratuita.
                        </p>
                    </div>

                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-8 leading-relaxed">
                        Para que o recurso de criação mágica de POPs através de vídeos funcione, é necessário prover a
                        Chave de Autenticação da API do Google AI Studio.
                        <span className="block mt-2 font-medium text-slate-800 dark:text-slate-200">
                            Essa chave é criptografada e armazenada com segurança no banco de dados.
                        </span>
                    </p>

                    {isLoading ? (
                        <div className="animate-pulse flex h-12 bg-slate-100 rounded-xl"></div>
                    ) : (
                        <div className="space-y-6">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-3">API Key (Gemini 1.5 Pro)</label>
                                <input
                                    type="password"
                                    value={apiKey}
                                    onChange={(e) => setApiKey(e.target.value)}
                                    placeholder="AIzaSy..."
                                    className="w-full bg-slate-50 border border-slate-300 text-slate-900 text-sm rounded-xl focus:ring-blue-500 focus:border-blue-500 block p-3.5 dark:bg-slate-800 dark:border-slate-700 dark:placeholder-slate-400 dark:text-white transition-colors"
                                />
                            </div>
                        </div>
                    )}
                </div>

                {!isLoading && (
                    <div className="px-8 py-5 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={handleSave}
                                disabled={isSaving}
                                className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white rounded-xl font-bold transition-all shadow-sm active:scale-95"
                            >
                                {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                                <span>{isSaving ? 'Salvando...' : 'Salvar Chave'}</span>
                            </button>

                            {successMessage && <span className="text-emerald-600 font-medium text-sm animate-in fade-in slide-in-from-left-2">{successMessage}</span>}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import {
    ChevronRight,
    PlusCircle,
    Save,
    Users,
    Clock,
    AlertCircle,
    Terminal,
    CloudUpload,
    Image as ImageIcon,
    Loader2,
    Sparkles,
    Video,
    Play,
    Trash2,
    X,
    Upload
} from 'lucide-react';
import type { View, EditorStep, Department } from '../types';
import { popService, dropsService } from '../services/pops';
import { aiService } from '../services/ai';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

interface EditorViewProps {
    setView: (v: View) => void;
    popId?: string | null;
    onPopCreated?: (id: string) => void;
}

export const EditorView = ({ setView, popId, onPopCreated }: EditorViewProps) => {
    const { profile } = useAuth();
    const [isSaving, setIsSaving] = useState(false);
    const [departments, setDepartments] = useState<Department[]>([]);

    // Form state
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [departmentId, setDepartmentId] = useState('');
    const [status, setStatus] = useState<'draft' | 'published'>('draft');
    const [videoUrl, setVideoUrl] = useState<string | null>(null);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const [steps, setSteps] = useState<EditorStep[]>([
        {
            id: 1,
            title: 'Novo Passo',
            description: '',
            image: null,
            video_timestamp: null
        }
    ]);

    useEffect(() => {
        const loadPopData = async () => {
            if (!popId) return;
            try {
                const result = await popService.getPopById(popId);
                if (result) {
                    setTitle(result.pop.title);
                    setDescription(result.pop.description || '');
                    setDepartmentId(result.pop.department_id || '');
                    setStatus(result.pop.status as any);
                    setVideoUrl(result.pop.video_url);
                    setSteps(result.steps.map(s => ({
                        id: s.id,
                        title: s.title,
                        description: s.content || '',
                        image: s.image_url,
                        video_timestamp: s.video_timestamp
                    })));
                    // After loading, we don't want to trigger "unsaved changes" immediately
                    setTimeout(() => setHasUnsavedChanges(false), 200);
                }
            } catch (error) {
                console.error('Failed to load POP for editing', error);
            }
        };

        loadPopData();
    }, [popId]);

    useEffect(() => {
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            if (hasUnsavedChanges) {
                e.preventDefault();
                e.returnValue = '';
            }
        };
        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [hasUnsavedChanges]);

    // Mark as dirty when changes occur
    useEffect(() => {
        if (title || description || steps.length > 0) {
            setHasUnsavedChanges(true);
        }
    }, [title, description, steps]);

    // AI Processing state
    const [isProcessingAI, setIsProcessingAI] = useState(false);
    const [aiProgress, setAiProgress] = useState('');
    const [aiLogs, setAiLogs] = useState<string[]>([]);
    const [aiSeconds, setAiSeconds] = useState(0);
    const [showAiModal, setShowAiModal] = useState(false);
    const [tokenUsage, setTokenUsage] = useState<{ prompt: number; response: number; total: number } | null>(null);

    useEffect(() => {
        let interval: any;
        if (isProcessingAI) {
            setAiSeconds(0);
            interval = setInterval(() => setAiSeconds(s => s + 1), 1000);
        } else {
            clearInterval(interval);
        }
        return () => clearInterval(interval);
    }, [isProcessingAI]);

    const addAiLog = (msg: string) => {
        setAiProgress(msg);
        setAiLogs(prev => [...prev.slice(-4), msg]); // Keep last 5 logs for context
    };

    const parseTimestamp = (ts: string | null): number => {
        if (!ts) return 0;
        const parts = ts.split(':').map(Number);
        if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
        if (parts.length === 2) return parts[0] * 60 + parts[1];
        if (parts.length === 1) return parts[0];
        return 0;
    };

    const jumpToVideo = (ts: string | null) => {
        const video = document.getElementById('pop-reference-video') as HTMLVideoElement;
        if (video) {
            video.currentTime = parseTimestamp(ts);
            video.play()?.catch(console.error);
            video.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    };

    const captureCurrentTime = (index: number) => {
        let video = document.getElementById(`step-video-editor-${index}`) as HTMLVideoElement;

        // Fallback pro vídeo principal se não achar o do passo por algum motivo
        if (!video) {
            video = document.getElementById('pop-reference-video') as HTMLVideoElement;
        }

        if (video) {
            const time = video.currentTime;
            const h = Math.floor(time / 3600);
            const m = Math.floor((time % 3600) / 60);
            const s = Math.floor(time % 60);
            const ts = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
            updateStepField(index, 'video_timestamp', ts);
        }
    };

    const handleTimestampChange = (index: number, value: string) => {
        let v = value.replace(/\D/g, '');
        if (v.length > 6) v = v.slice(0, 6);

        let formatted = v;
        if (v.length >= 5) {
            formatted = `${v.slice(0, 2)}:${v.slice(2, 4)}:${v.slice(4, 6)}`;
        } else if (v.length >= 3) {
            formatted = `${v.slice(0, 2)}:${v.slice(2, 4)}`;
        }
        updateStepField(index, 'video_timestamp', formatted);
    };

    const formatTime = (seconds: number) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = Math.floor(seconds % 60);
        return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };


    useEffect(() => {
        const fetchDrops = async () => {
            try {
                const depts = await dropsService.getDepartments();
                setDepartments(depts);
                if (depts.length > 0) {
                    setDepartmentId(depts[0].id);
                }
            } catch (error) {
                console.error("Falha ao carregar departamentos", error);
            }
        };
        fetchDrops();
    }, []);

    const handleSave = async (redirect: boolean = true) => {
        console.log("handleSave called", { redirect, popId, title, departmentId });
        if (!title.trim() || !departmentId || !profile) {
            alert("Preencha o título e selecione um departamento.");
            return;
        }

        setIsSaving(true);
        try {
            const popData = {
                title,
                description,
                status,
                department_id: departmentId,
                author_id: profile.id,
                video_url: videoUrl
            };

            const stepsData = steps.map((s, index) => ({
                title: s.title,
                content: s.description,
                image_url: s.image,
                video_timestamp: s.video_timestamp,
                order: index
            }));

            if (popId) {
                await popService.updatePop(popId, popData, stepsData);
                setHasUnsavedChanges(false);
                if (redirect) {
                    alert("POP salvo com sucesso!");
                    setView('dashboard');
                } else {
                    alert("Passo salvo com sucesso!");
                }
            } else {
                const newPop = await popService.createPop(popData, stepsData);
                setHasUnsavedChanges(false);
                alert("Novo POP criado com sucesso!");
                // Se criou um POP inteiro, precisamos avisar o componente pai (ou ir pro dashboard)
                // Se tentou só "Atualizar Passo" de um POP que ainda nem existia, obriga a sair para não bugar o state
                if (onPopCreated && newPop) {
                    onPopCreated(newPop.id);
                } else {
                    setView('dashboard');
                }
            }
        } catch (error: any) {
            console.error("Erro ao salvar POP:", error);
            alert(`Erro ao salvar o POP: ${error.message || JSON.stringify(error)}`);
        } finally {
            setIsSaving(false);
        }
    };

    const updateStepField = (index: number, field: keyof EditorStep, value: string | null) => {
        const newSteps = [...steps];
        newSteps[index] = { ...newSteps[index], [field]: value };
        setSteps(newSteps);
    };

    const addStep = () => {
        setSteps([...steps, { id: Date.now(), title: 'Novo Passo', description: '', image: null }]);
    };

    const [uploadingStepIndex, setUploadingStepIndex] = useState<number | null>(null);

    const handleStepImageUpload = async (index: number, file: File) => {
        setUploadingStepIndex(index);
        try {
            const ext = file.name.split('.').pop();
            const fileName = `step-${Date.now()}-${Math.random().toString(36).substring(2)}.${ext}`;
            const path = `steps/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('pop-images')
                .upload(path, file);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('pop-images')
                .getPublicUrl(path);

            updateStepField(index, 'image', publicUrl);
        } catch (err: any) {
            console.error('Step image upload error:', err);
            alert('Erro ao enviar imagem. Verifique se o bucket "pop-images" existe.');
        } finally {
            setUploadingStepIndex(null);
        }
    };

    const handleAiVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsProcessingAI(true);
        setTokenUsage(null);
        setAiLogs(['Iniciando pipeline...']);
        try {
            // 1. Upload do vídeo para persistência
            addAiLog("Enviando vídeo para o armazenamento seguro...");
            const fileExt = file.name.split('.').pop();
            const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
            const filePath = `raw-captures/${fileName}`;

            const { data: uploadData, error: uploadError } = await supabase.storage
                .from('pop-videos')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('pop-videos')
                .getPublicUrl(filePath);

            // 2. Processamento IA
            const result = await aiService.processVideo(file, (msg) => addAiLog(msg));
            const generatedSteps = result.steps;
            setTokenUsage({
                prompt: result.usage.promptTokens,
                response: result.usage.responseTokens,
                total: result.usage.totalTokens
            });

            if (confirm(`IA processou o vídeo com sucesso! Consumo: ${result.usage.totalTokens} tokens.\nDeseja substituir os passos atuais pelos gerados pela IA?\n(O rascunho será salvo automaticamente)`)) {
                setSteps(generatedSteps);

                // 3. Auto-save automático para evitar perda de dados
                addAiLog("Salvando rascunho automático...");
                const popData = {
                    title: title || `POP Gerado em ${new Date().toLocaleDateString()}`,
                    description: description || "Gerado automaticamente via vídeo",
                    status: 'draft' as const,
                    department_id: departmentId || null,
                    author_id: profile?.id,
                    video_url: publicUrl,
                    ai_usage: result.usage
                };
                setVideoUrl(publicUrl);

                const stepsData = generatedSteps.map((s, index) => ({
                    title: s.title,
                    content: s.description,
                    image_url: s.image,
                    order: index
                }));

                await popService.createPop(popData, stepsData);
                setHasUnsavedChanges(false);
                addAiLog("Rascunho salvo com sucesso.");
                alert("POP salvo como rascunho com o vídeo vinculado!");
            } else {
                setSteps([...steps, ...generatedSteps]);
            }
            setShowAiModal(false);
        } catch (error: any) {
            console.error("Erro no processamento de IA:", error);
            alert(error.message || "Erro ao processar vídeo.");
        } finally {
            setIsProcessingAI(false);
            setAiProgress('');
        }
    };

    const removeStep = (index: number) => {
        if (steps.length > 1) {
            if (window.confirm("Tem certeza que deseja excluir este passo? Esta ação não pode ser desfeita.")) {
                const newSteps = [...steps];
                newSteps.splice(index, 1);
                setSteps(newSteps);
                setHasUnsavedChanges(true);
            }
        } else {
            alert("O POP deve ter pelo menos um passo.");
        }
    };

    const handleDeletePop = async () => {
        if (!popId) return;
        if (window.confirm("ATENÇÃO: Tem certeza que deseja excluir ESTE POP INTEIRO e todos os seus passos? Esta ação NÃO PODE ser desfeita.")) {
            try {
                setIsSaving(true);
                await popService.deletePop(popId);
                alert("POP excluído com sucesso.");
                setView('dashboard');
            } catch (error: any) {
                console.error("Erro ao excluir POP:", error);
                alert(`Erro ao excluir: ${error.message || 'Tente novamente.'}`);
            } finally {
                setIsSaving(false);
            }
        }
    };

    return (
        <div className="flex-1 flex flex-col overflow-hidden bg-white dark:bg-slate-950">
            <div className="flex-1 overflow-y-auto custom-scrollbar">
                <div className={`max-w-5xl mx-auto w-full p-6 lg:p-10 space-y-8 pb-32`}>
                    {/* Breadcrumbs & Actions */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <nav className="flex items-center gap-2 text-sm text-slate-500">
                            <button onClick={() => setView('dashboard')} className="hover:text-blue-600">Processos Operacionais</button>
                            <ChevronRight size={14} />
                            <span className="text-slate-900 dark:text-slate-200 font-medium">{popId ? 'Editar POP' : 'Criar POP'}</span>
                        </nav>
                        <div className="flex gap-3">
                            <select
                                value={status}
                                onChange={(e) => setStatus(e.target.value as 'draft' | 'published')}
                                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-700 dark:text-slate-300 outline-none"
                            >
                                <option value="draft">Salvar como Rascunho</option>
                                <option value="published">Publicado</option>
                            </select>
                            <button
                                onClick={() => setShowAiModal(true)}
                                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg text-sm font-bold shadow-md hover:shadow-indigo-500/20 transition-all"
                            >
                                <Sparkles size={16} />
                                Criação Mágica (Vídeo)
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={isSaving}
                                className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold shadow-sm hover:bg-blue-700 transition-all disabled:opacity-50"
                            >
                                {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                                {isSaving ? 'Salvando...' : 'Salvar POP'}
                            </button>
                            {popId && (
                                <button
                                    onClick={handleDeletePop}
                                    disabled={isSaving}
                                    className="flex items-center gap-2 px-4 py-2 bg-rose-50 text-rose-600 dark:bg-rose-900/20 dark:text-rose-400 rounded-lg text-sm font-bold shadow-sm hover:bg-rose-600 hover:text-white transition-all disabled:opacity-50"
                                    title="Excluir o POP permanentemente"
                                >
                                    <Trash2 size={16} />
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Split Layout Removido: Video no Topo (Grande) */}
                    {videoUrl && (
                        <div className="w-full bg-slate-900 rounded-2xl overflow-hidden shadow-2xl border border-slate-800 relative group aspect-video">
                            <video
                                id="pop-reference-video"
                                src={videoUrl}
                                controls
                                crossOrigin="anonymous"
                                className="w-full h-full"
                            />
                            <div className="absolute top-4 left-4 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
                                <span className="bg-black/60 backdrop-blur-sm text-white text-[10px] font-bold px-3 py-1.5 rounded-full flex items-center gap-2">
                                    <Video size={12} /> REFERÊNCIA EM VÍDEO PRINCIPAL
                                </span>
                            </div>
                            <button
                                onClick={() => setVideoUrl(null)}
                                className="absolute top-4 right-4 bg-rose-600/80 hover:bg-rose-600 text-white p-2 rounded-full transition-all opacity-0 group-hover:opacity-100"
                                title="Remover Vídeo"
                            >
                                <X size={16} />
                            </button>
                        </div>
                    )}

                    {tokenUsage && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            className="bg-indigo-50 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-900/20 rounded-xl p-4 flex items-center justify-between"
                        >
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg text-indigo-600">
                                    <Sparkles size={16} />
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-indigo-900 dark:text-indigo-200 uppercase tracking-wider">Último Processamento de IA</p>
                                    <p className="text-sm text-indigo-600 dark:text-indigo-400">
                                        Consumo total: <strong>{tokenUsage.total}</strong> tokens
                                        <span className="text-xs opacity-70 ml-2">({tokenUsage.prompt} entrada / {tokenUsage.response} saída)</span>
                                    </p>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* AI Modal */}
                    {showAiModal && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
                            <motion.div
                                initial={{ scale: 0.9, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-lg overflow-hidden"
                            >
                                <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                                    <h3 className="text-xl font-bold flex items-center gap-2 text-slate-800 dark:text-white">
                                        <Video className="text-indigo-500" />
                                        Gerar POP via Vídeo
                                    </h3>
                                    <button onClick={() => !isProcessingAI && setShowAiModal(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                                        <X size={20} />
                                    </button>
                                </div>

                                <div className="p-8 text-center">
                                    {isProcessingAI ? (
                                        <div className="space-y-6 py-4">
                                            <div className="relative">
                                                <div className="size-20 rounded-full border-4 border-indigo-100 dark:border-indigo-900/30 border-t-indigo-600 animate-spin mx-auto"></div>
                                                <Sparkles className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-indigo-500 animate-pulse" size={24} />
                                            </div>
                                            <div className="space-y-4">
                                                <p className="text-lg font-bold text-slate-800 dark:text-white">Processando com Gemini Flash</p>
                                                <div className="flex flex-col gap-1">
                                                    <p className="text-sm font-medium text-indigo-600 dark:text-indigo-400">{aiProgress}</p>
                                                    <p className="text-[10px] text-slate-400 dark:text-slate-500 uppercase font-bold tracking-widest">Tempo decorrido: {Math.floor(aiSeconds / 60)}:{(aiSeconds % 60).toString().padStart(2, '0')}</p>
                                                </div>

                                                <div className="bg-slate-50 dark:bg-slate-950 rounded-lg p-3 text-left border border-slate-100 dark:border-slate-800">
                                                    <p className="text-[9px] text-slate-400 font-bold uppercase mb-2">Logs Recentes</p>
                                                    <div className="space-y-1">
                                                        {aiLogs.map((log, i) => (
                                                            <p key={i} className="text-[11px] text-slate-600 dark:text-slate-400 font-mono">
                                                                {i === aiLogs.length - 1 ? '→ ' : '  '} {log}
                                                            </p>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="space-y-6">
                                            <div className="p-10 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl bg-slate-50 dark:bg-slate-950 flex flex-col items-center gap-4 group hover:border-indigo-400 dark:hover:border-indigo-500 transition-colors cursor-pointer relative">
                                                <input
                                                    type="file"
                                                    accept="video/*"
                                                    onChange={handleAiVideoUpload}
                                                    className="absolute inset-0 opacity-0 cursor-pointer"
                                                />
                                                <div className="size-16 rounded-full bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center text-indigo-600 group-hover:scale-110 transition-transform">
                                                    <CloudUpload size={32} />
                                                </div>
                                                <div className="space-y-1">
                                                    <p className="text-base font-bold text-slate-800 dark:text-white">Selecione ou arraste o vídeo</p>
                                                    <p className="text-xs text-rose-500 font-bold uppercase">Máximo 20MB (Vídeos curtos ~1min)</p>
                                                </div>
                                            </div>
                                            <p className="text-xs text-slate-400 dark:text-slate-500 italic">
                                                A IA irá transcrever as ações, identificando passos e gerando descrições técnicas automaticamente.
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        </div>
                    )}

                    <div className="bg-white dark:bg-slate-900 rounded-xl p-8 shadow-sm border border-slate-200 dark:border-slate-800">
                        <div className="grid grid-cols-1 gap-6">
                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Título do Processo</label>
                                <input
                                    className="w-full text-2xl font-black bg-transparent border-none p-0 focus:ring-0 text-slate-900 dark:text-white placeholder:text-slate-300 outline-none"
                                    placeholder="Dê um título ao POP..."
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-100 dark:border-slate-800">
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Departamento / Equipe</label>
                                    <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 px-3 py-2 rounded-lg">
                                        <Users size={16} className="text-slate-400" />
                                        <select
                                            className="bg-transparent border-none text-sm p-0 focus:ring-0 text-slate-700 dark:text-slate-300 w-full appearance-none outline-none"
                                            value={departmentId}
                                            onChange={(e) => setDepartmentId(e.target.value)}
                                        >
                                            <option value="" disabled>Selecione um departamento</option>
                                            {departments.map(d => (
                                                <option key={d.id} value={d.id}>{d.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Responsável Primário</label>
                                    <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 px-3 py-2 rounded-lg">
                                        <Clock size={16} className="text-slate-400" />
                                        <span className="text-sm text-slate-700 dark:text-slate-300 truncate">{profile?.full_name || 'Usuário Atual'}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="pt-4">
                                <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Objetivo do Procedimento</label>
                                <textarea
                                    className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-lg text-sm text-slate-700 dark:text-slate-300 focus:ring-2 focus:ring-blue-600/20 p-3 outline-none"
                                    rows={2}
                                    placeholder="Descreva por que este procedimento existe..."
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="flex items-center justify-between px-2">
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                <PlusCircle size={20} className="text-blue-600" />
                                Passos Executáveis
                            </h3>
                            <span className="text-xs text-slate-500 font-medium bg-slate-200 dark:bg-slate-800 px-2 py-1 rounded">
                                {steps.length} PASSOS DEFINIDOS
                            </span>
                        </div>

                        {steps.map((step, i) => (
                            <motion.div
                                key={step.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                className={`group relative bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden`}
                            >
                                <div className={`flex items-center justify-between bg-slate-50 dark:bg-slate-800/50 px-6 py-3 border-b border-slate-100 dark:border-slate-800`}>
                                    <div className="flex items-center gap-3 flex-1">
                                        <div className="size-6 rounded-full bg-blue-600 text-white text-xs font-bold flex shrink-0 items-center justify-center">{i + 1}</div>
                                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 flex-1">
                                            <input
                                                type="text"
                                                className="font-bold text-slate-700 dark:text-slate-200 bg-transparent border-none outline-none focus:ring-0 w-full"
                                                value={step.title}
                                                onChange={(e) => updateStepField(i, 'title', e.target.value)}
                                                placeholder="Título do Passo"
                                            />
                                            {step.video_timestamp && (
                                                <button
                                                    onClick={() => {
                                                        const v = document.getElementById(`step-video-editor-${i}`) as HTMLVideoElement;
                                                        if (v) {
                                                            v.currentTime = parseTimestamp(step.video_timestamp);
                                                            v.play()?.catch(console.error);
                                                        }
                                                    }}
                                                    title="Reproduzir neste passo"
                                                    className="flex items-center gap-1.5 px-2 py-0.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-full text-[10px] font-black hover:bg-indigo-100 transition-colors w-fit shrink-0"
                                                >
                                                    <Video size={10} />
                                                    {step.video_timestamp}
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => removeStep(i)}
                                        title="Remover Passo"
                                        className="text-[10px] font-bold text-rose-600 bg-rose-100 dark:bg-rose-900/30 px-2 py-0.5 rounded-full uppercase transition-colors hover:bg-rose-200 dark:hover:bg-rose-900/50"
                                    >
                                        Excluir
                                    </button>
                                </div>
                                <div className="p-6">
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                        <div className="space-y-4">
                                            <div>
                                                <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Descrição do Passo</label>
                                                <textarea
                                                    className="w-full bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg border-none text-slate-700 dark:text-slate-300 text-sm outline-none focus:ring-2 focus:ring-blue-600/20 leading-relaxed"
                                                    rows={5}
                                                    value={step.description}
                                                    onChange={(e) => updateStepField(i, 'description', e.target.value)}
                                                    placeholder="Descreva as instruções detalhadas..."
                                                />
                                            </div>

                                            {/* Seletor de Mídia / Timestamp */}
                                            <div className="pt-2">
                                                <div className="flex items-center gap-4 mb-3">
                                                    <button
                                                        onClick={() => updateStepField(i, 'image', null)}
                                                        className={`text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full transition-all ${!step.image ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}
                                                    >
                                                        Ponto no Vídeo
                                                    </button>
                                                    <button
                                                        onClick={() => updateStepField(i, 'image', step.image || 'uploading')}
                                                        className={`text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full transition-all ${step.image ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}
                                                    >
                                                        Imagem Fixa
                                                    </button>
                                                </div>

                                                {step.image !== null ? (
                                                    <div className="space-y-3">
                                                        <label className="block text-[10px] font-bold text-slate-400 uppercase">Imagem do Passo</label>
                                                        <div className="flex items-center gap-3">
                                                            <label className="flex items-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-xl text-xs font-bold cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-all">
                                                                {uploadingStepIndex === i ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                                                                {uploadingStepIndex === i ? 'Enviando...' : 'Enviar Imagem'}
                                                                <input
                                                                    type="file"
                                                                    accept="image/*"
                                                                    className="hidden"
                                                                    onChange={(e) => {
                                                                        const file = e.target.files?.[0];
                                                                        if (file) handleStepImageUpload(i, file);
                                                                    }}
                                                                />
                                                            </label>
                                                            {step.image && step.image !== 'uploading' && (
                                                                <span className="text-[10px] text-emerald-600 font-bold">✓ Imagem carregada</span>
                                                            )}
                                                        </div>
                                                        <input
                                                            className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-lg text-sm text-slate-700 dark:text-slate-300 focus:ring-2 focus:ring-blue-600/20 px-3 py-2 outline-none"
                                                            placeholder="Ou cole a URL da imagem"
                                                            value={step.image === 'uploading' ? '' : (step.image || '')}
                                                            onChange={(e) => updateStepField(i, 'image', e.target.value)}
                                                        />
                                                    </div>
                                                ) : (
                                                    <div className="space-y-3">
                                                        <label className="block text-[10px] font-bold text-slate-400 uppercase">Tempo de Referência</label>
                                                        <div className="flex items-center gap-2">
                                                            <div className="relative flex-1">
                                                                <input
                                                                    type="text"
                                                                    maxLength={8}
                                                                    className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-lg text-sm text-slate-700 dark:text-slate-300 focus:ring-2 focus:ring-blue-600/20 pl-8 pr-3 py-2 outline-none font-mono tracking-wider"
                                                                    placeholder="00:00"
                                                                    value={step.video_timestamp || ''}
                                                                    onChange={(e) => handleTimestampChange(i, e.target.value)}
                                                                />
                                                                <Clock size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                                            </div>
                                                            <button
                                                                onClick={() => captureCurrentTime(i)}
                                                                className="px-3 py-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg text-xs font-bold hover:bg-indigo-600 hover:text-white transition-all flex items-center gap-2"
                                                                title="Capturar tempo atual do vídeo"
                                                            >
                                                                <Sparkles size={14} />
                                                                Capturar
                                                            </button>
                                                            <button
                                                                onClick={() => {
                                                                    const v = document.getElementById(`step-video-editor-${i}`) as HTMLVideoElement;
                                                                    if (v) {
                                                                        v.currentTime = parseTimestamp(step.video_timestamp);
                                                                        v.play()?.catch(console.error);
                                                                    }
                                                                }}
                                                                className="px-4 py-2 bg-slate-900 text-white dark:bg-white dark:text-slate-900 rounded-lg text-xs font-black shadow-lg hover:scale-105 active:scale-95 transition-all"
                                                            >
                                                                Play Local
                                                            </button>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex flex-col gap-4">
                                            <label className="block text-xs font-bold text-slate-400 uppercase">Visualização do Referencial</label>
                                            <div className="relative group/img aspect-video rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-800 flex items-center justify-center bg-slate-50 dark:bg-slate-950 overflow-hidden shadow-inner">
                                                {step.image ? (
                                                    <img src={step.image} className="w-full h-full object-cover" alt="" referrerPolicy="no-referrer" />
                                                ) : videoUrl ? (
                                                    <div className="w-full h-full relative bg-black">
                                                        <video
                                                            id={`step-video-editor-${i}`}
                                                            src={videoUrl}
                                                            crossOrigin="anonymous"
                                                            controls
                                                            className="w-full h-full object-contain"
                                                            onLoadedData={(e) => {
                                                                const v = e.currentTarget;
                                                                v.currentTime = parseTimestamp(step.video_timestamp);
                                                            }}
                                                        />
                                                    </div>
                                                ) : (
                                                    <div className="flex flex-col items-center gap-3 text-center p-4">
                                                        <div className="size-12 rounded-full bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center text-indigo-600">
                                                            <Video size={24} />
                                                        </div>
                                                        <div>
                                                            <p className="text-xs font-bold text-slate-500 uppercase">Vínculo de Vídeo</p>
                                                            <p className="text-[10px] text-slate-400 mt-1">Nenhum vídeo carregado</p>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex justify-end pt-2">
                                                <button
                                                    className="px-4 py-2 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-xl text-xs font-black uppercase tracking-tight hover:bg-emerald-600 hover:text-white transition-all flex items-center gap-2"
                                                    onClick={() => handleSave(false)}
                                                    disabled={isSaving}
                                                >
                                                    {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                                                    {isSaving ? 'Salvando...' : 'Atualizar Passo'}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    <div className="flex items-center justify-center py-10">
                        <button
                            onClick={addStep}
                            className="group flex flex-col items-center gap-2 opacity-60 hover:opacity-100 transition-all"
                        >
                            <div className="size-12 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center border-2 border-transparent group-hover:border-blue-600 group-hover:text-blue-600 transition-all">
                                <PlusCircle size={24} />
                            </div>
                            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 group-hover:text-blue-600">ADICIONAR NOVO PASSO</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

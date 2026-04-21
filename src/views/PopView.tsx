import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
    ArrowLeft,
    FileText,
    Video,
    Clock,
    Users,
    ChevronRight,
    Play,
    Info,
    Download,
    Loader2
} from 'lucide-react';
import type { View, PopDatabase, PopStepDatabase } from '../types';
import { popService } from '../services/pops';
import { pdfExportService } from '../services/pdfExport';
import { ProgressBar } from '../components';

interface PopViewProps {
    setView: (v: View) => void;
    popId: string | null;
}

export const PopView = ({ setView, popId }: PopViewProps) => {
    const [pop, setPop] = useState<PopDatabase | null>(null);
    const [steps, setSteps] = useState<PopStepDatabase[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

    const handleExportPdf = async () => {
        if (!pop) return;
        setIsGeneratingPdf(true);
        try {
            await pdfExportService.generateSinglePopPdf(pop, steps);
        } catch (err) {
            console.error('PDF export error:', err);
            alert('Erro ao gerar PDF.');
        } finally {
            setIsGeneratingPdf(false);
        }
    };

    useEffect(() => {
        const fetchPop = async () => {
            if (!popId) return;
            setIsLoading(true);
            try {
                const result = await popService.getPopById(popId);
                if (result) {
                    setPop(result.pop);
                    setSteps(result.steps);
                }
            } catch (error) {
                console.error('Failed to load POP', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchPop();
    }, [popId]);

    const parseTimestamp = (ts: string | null): number => {
        if (!ts) return 0;
        const parts = ts.split(':').map(Number);
        if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
        if (parts.length === 2) return parts[0] * 60 + parts[1];
        if (parts.length === 1) return parts[0];
        return 0;
    };

    const jumpToVideo = (ts: string | null) => {
        const video = document.getElementById('pop-view-video') as HTMLVideoElement;
        if (video) {
            video.currentTime = parseTimestamp(ts);
            video.play()?.catch(console.error);
            video.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    };

    if (isLoading) {
        return (
            <div className="flex-1 flex items-center justify-center">
                <div className="text-center space-y-4">
                    <div className="size-12 rounded-full border-4 border-blue-100 border-t-blue-600 animate-spin mx-auto"></div>
                    <p className="text-slate-500 font-medium">Carregando procedimento...</p>
                </div>
            </div>
        );
    }

    if (!pop) {
        return (
            <div className="flex-1 flex items-center justify-center p-10">
                <div className="bg-white dark:bg-slate-900 p-10 rounded-3xl border border-slate-200 dark:border-slate-800 text-center max-w-md shadow-xl">
                    <div className="size-20 bg-rose-50 dark:bg-rose-900/20 rounded-full flex items-center justify-center text-rose-600 mx-auto mb-6">
                        <Info size={40} />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">POP não encontrado</h2>
                    <p className="text-slate-500 mb-8">O procedimento solicitado não existe ou foi removido.</p>
                    <button
                        onClick={() => setView('dashboard')}
                        className="w-full py-3 bg-slate-900 dark:bg-white dark:text-slate-900 text-white rounded-xl font-bold hover:scale-[1.02] active:scale-95 transition-all"
                    >
                        Voltar ao Início
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex-1 flex flex-col overflow-hidden bg-white dark:bg-slate-950">
            <div className="flex-1 overflow-y-auto p-6 lg:p-10 custom-scrollbar">
                <div className="max-w-5xl mx-auto w-full space-y-8 pb-20">
                    {/* Header */}
                    <div className="flex items-center gap-4 mb-8">
                        <button
                            onClick={() => setView('dashboard')}
                            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-500 transition-colors"
                        >
                            <ArrowLeft size={24} />
                        </button>
                        <div>
                            <div className="flex items-center gap-3 mb-1">
                                <span className="text-[10px] font-black uppercase tracking-widest text-blue-600 bg-blue-50 dark:bg-blue-900/30 px-2 py-0.5 rounded-full">
                                    Procedimento Operacional
                                </span>
                                {pop.status === 'draft' && (
                                    <span className="text-[10px] font-black uppercase tracking-widest text-amber-600 bg-amber-50 dark:bg-amber-900/30 px-2 py-0.5 rounded-full">
                                        Rascunho
                                    </span>
                                )}
                            </div>
                            <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tight leading-none">{pop.title}</h1>
                        </div>
                    </div>

                    {/* Vídeo no Topo */}
                    {pop.video_url && (
                        <div className="w-full bg-slate-900 rounded-2xl overflow-hidden shadow-2xl border border-slate-800 relative group aspect-video">
                            <video
                                id="pop-view-video"
                                src={pop.video_url}
                                controls
                                crossOrigin="anonymous"
                                className="w-full h-full"
                            />
                            <div className="absolute top-4 left-4 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
                                <span className="bg-black/60 backdrop-blur-md text-white text-[10px] font-bold px-3 py-1.5 rounded-full flex items-center gap-2">
                                    <Video size={12} /> REFERÊNCIA EM VÍDEO
                                </span>
                            </div>
                        </div>
                    )}

                    <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                        {/* Main Content */}
                        <div className="xl:col-span-2 space-y-10">
                            {/* Goal Section */}
                            <div className="bg-slate-50 dark:bg-slate-900/40 p-6 rounded-2xl border border-slate-100 dark:border-slate-800/50">
                                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                                    <Info size={14} /> Objetivo
                                </h3>
                                <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed">
                                    {pop.description || 'Nenhuma descrição detalhada fornecida.'}
                                </p>
                            </div>

                            {/* Steps List */}
                            <div className="space-y-6">
                                <div className="flex items-center justify-between px-2">
                                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">Passos Executáveis</h3>
                                    <span className="text-[10px] font-bold text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">
                                        {steps.length} PASSOS
                                    </span>
                                </div>

                                <div className="space-y-6">
                                    {steps.map((step, i) => (
                                        <motion.div
                                            key={step.id}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm group"
                                        >
                                            <div className="p-6 md:p-8 flex flex-col md:flex-row gap-6">
                                                <div className="shrink-0 flex flex-row md:flex-col items-center gap-4">
                                                    <div className="size-10 rounded-xl bg-blue-600 text-white font-black flex items-center justify-center shadow-lg shadow-blue-600/20">
                                                        {i + 1}
                                                    </div>
                                                    {step.video_timestamp && (
                                                        <button
                                                            onClick={() => {
                                                                const v = document.getElementById(`step-video-view-${i}`) as HTMLVideoElement;
                                                                if (v) {
                                                                    v.currentTime = parseTimestamp(step.video_timestamp);
                                                                    v.play()?.catch(console.error);
                                                                }
                                                            }}
                                                            title="Reproduzir neste passo"
                                                            className="size-10 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center hover:bg-slate-900 hover:text-white transition-all shadow-sm"
                                                        >
                                                            <Play size={16} fill="currentColor" />
                                                        </button>
                                                    )}
                                                </div>
                                                <div className="flex-1 space-y-4">
                                                    <div className="flex items-center justify-between gap-4">
                                                        <h4 className="font-bold text-slate-900 dark:text-white text-xl">{step.title}</h4>
                                                        {step.video_timestamp && (
                                                            <span className="text-[10px] font-black text-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 px-2 py-1 rounded-lg shrink-0">
                                                                {step.video_timestamp}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed whitespace-pre-wrap">
                                                        {step.content}
                                                    </p>

                                                    {step.image_url ? (
                                                        <div className="mt-6 rounded-2xl overflow-hidden border border-slate-100 dark:border-slate-800 aspect-video bg-slate-50 dark:bg-slate-950">
                                                            {(() => {
                                                                const url = step.image_url;
                                                                if (url.includes('drive.google.com/file/d/')) {
                                                                    const fileId = url.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/)?.[1];
                                                                    return fileId ? (
                                                                        <iframe src={`https://drive.google.com/file/d/${fileId}/preview`} className="w-full h-full border-0" allow="autoplay" allowFullScreen></iframe>
                                                                    ) : <img src={url} className="w-full h-full object-cover" alt={step.title} referrerPolicy="no-referrer" />;
                                                                }
                                                                if (url.match(/\.(mp4|webm|ogg)$/i)) {
                                                                    return <video src={url} controls className="w-full h-full object-contain" />;
                                                                }
                                                                return <img src={url} className="w-full h-full object-cover" alt={step.title} referrerPolicy="no-referrer" />;
                                                            })()}
                                                        </div>
                                                    ) : pop.video_url ? (
                                                        <div className="mt-6 rounded-2xl overflow-hidden border border-slate-100 dark:border-slate-800 aspect-video bg-black relative">
                                                            <video
                                                                id={`step-video-view-${i}`}
                                                                src={pop.video_url}
                                                                crossOrigin="anonymous"
                                                                controls
                                                                className="w-full h-full object-contain"
                                                                onLoadedData={(e) => {
                                                                    const v = e.currentTarget;
                                                                    v.currentTime = parseTimestamp(step.video_timestamp);
                                                                }}
                                                            />
                                                        </div>
                                                    ) : null}
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Sidebar Info */}
                        <div className="space-y-6">
                            <div className="bg-slate-50 dark:bg-slate-900/50 rounded-2xl p-6 border border-slate-100 dark:border-slate-800/50">
                                <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-6">Informações</h4>

                                <div className="space-y-6">
                                    <div className="flex items-center gap-4">
                                        <div className="size-10 rounded-xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 flex items-center justify-center text-slate-400 shadow-sm">
                                            <Users size={18} />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase">Autor</p>
                                            <p className="text-sm font-bold text-slate-900 dark:text-white">{(pop as any).author?.full_name || 'Usuário'}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-4">
                                        <div className="size-10 rounded-xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 flex items-center justify-center text-slate-400 shadow-sm">
                                            <Clock size={18} />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase">Editado em</p>
                                            <p className="text-sm font-bold text-slate-900 dark:text-white">
                                                {new Date(pop.updated_at).toLocaleDateString('pt-BR')}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="pt-6 border-t border-slate-200 dark:border-slate-800">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase mb-2">Conclusão</p>
                                        <ProgressBar progress={pop.status === 'published' ? 100 : 50} />
                                    </div>

                                    <button
                                        onClick={() => setView('editor')}
                                        className="w-full mt-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-xl font-bold text-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-all shadow-sm"
                                    >
                                        Editar Procedimento
                                    </button>
                                    
                                    <div className="w-full mt-2 relative">
                                        <select
                                            value={pop.status}
                                            onChange={async (e) => {
                                                const newStatus = e.target.value as any;
                                                const oldStatus = pop.status;
                                                setPop({ ...pop, status: newStatus });
                                                try {
                                                    await popService.updatePopStatus(pop.id, newStatus);
                                                } catch (error) {
                                                    console.error('Failed to update status', error);
                                                    setPop({ ...pop, status: oldStatus });
                                                    alert('Erro ao atualizar o status.');
                                                }
                                            }}
                                            className="w-full py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-xl font-bold text-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-all shadow-sm appearance-none cursor-pointer outline-none pl-4 pr-10"
                                        >
                                            <option value="draft">Status: Rascunho</option>
                                            <option value="published">Status: Publicado</option>
                                            <option value="archived">Status: Arquivado</option>
                                        </select>
                                        <ChevronRight size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none rotate-90" />
                                    </div>

                                    <button
                                        onClick={handleExportPdf}
                                        disabled={isGeneratingPdf}
                                        className="w-full mt-2 py-3 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700 transition-all shadow-sm flex items-center justify-center gap-2 disabled:opacity-50"
                                    >
                                        {isGeneratingPdf ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
                                        {isGeneratingPdf ? 'Gerando PDF...' : 'Exportar PDF'}
                                    </button>
                                </div>
                            </div>

                            <div className="bg-gradient-to-br from-indigo-600 to-blue-700 rounded-2xl p-6 text-white shadow-xl shadow-indigo-600/20">
                                <div className="flex items-center gap-3 mb-3">
                                    <Info size={20} className="text-indigo-200" />
                                    <h4 className="font-bold text-sm">Práticas Seguras</h4>
                                </div>
                                <p className="text-xs text-indigo-100 leading-relaxed">
                                    Use o vídeo para validar a execução. Em caso de inconsistência, notifique o supervisor ou edite os passos.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

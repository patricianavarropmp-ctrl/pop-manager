import { useState, useEffect } from 'react';
import { PlusCircle, MoreVertical, FileText, CheckCircle2, Clock, Download, Loader2 } from 'lucide-react';
import { StatsCard, StatusBadge, ProgressBar, Pagination, AvatarCircle } from '../components';
import type { View, PopDatabase } from '../types';
import { popService } from '../services/pops';
import { pdfExportService } from '../services/pdfExport';

interface DashboardViewProps {
    setView: (v: View) => void;
    onSelectPop: (id: string, view?: View) => void;
    onCreatePop?: () => void;
}

export const DashboardView = ({ setView, onSelectPop, onCreatePop }: DashboardViewProps) => {
    const [pops, setPops] = useState<PopDatabase[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isExportingAll, setIsExportingAll] = useState(false);

    const handleExportAll = async () => {
        setIsExportingAll(true);
        try {
            await pdfExportService.generateAllPopsPdf();
        } catch (err) {
            console.error('PDF export error:', err);
            alert('Erro ao gerar PDF.');
        } finally {
            setIsExportingAll(false);
        }
    };

    useEffect(() => {
        const fetchDashboardData = async () => {
            setIsLoading(true);
            try {
                const data = await popService.getPops();
                setPops(data);
            } catch (error) {
                console.error('Failed to load dashboard data', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchDashboardData();
    }, []);

    // Estatísticas dinâmicas baseadas nos dados
    const totalPops = pops.length;
    const publishedPops = pops.filter(p => p.status === 'published').length;
    const draftingPops = pops.filter(p => p.status === 'draft').length;

    const dashboardStats = [
        { label: 'Total de Manuais (POPs)', value: totalPops.toString(), icon: FileText, color: 'blue' as const },
        { label: 'POPs Publicados', value: publishedPops.toString(), change: '+12%', icon: CheckCircle2, color: 'emerald' as const },
        { label: 'Em Desenvolvimento', value: draftingPops.toString(), icon: Clock, color: 'amber' as const },
    ];

    return (
        <div className="flex-1 flex flex-col p-6 md:p-10 overflow-y-auto max-w-7xl mx-auto w-full">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
                <div>
                    <h1 className="text-slate-900 dark:text-white text-3xl font-extrabold tracking-tight mb-2">Painel de Gestão de POPs</h1>
                    <p className="text-slate-500 dark:text-slate-400 text-lg">Centralize, padronize e otimize os processos operacionais da sua equipe.</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={handleExportAll}
                        disabled={isExportingAll || pops.length === 0}
                        className="flex items-center gap-2 px-5 py-3 bg-white dark:bg-slate-800 text-blue-600 border border-blue-200 dark:border-blue-800 rounded-xl font-bold hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all disabled:opacity-50"
                    >
                        {isExportingAll ? <Loader2 size={20} className="animate-spin" /> : <Download size={20} />}
                        <span>{isExportingAll ? 'Gerando...' : 'Exportar Todos'}</span>
                    </button>
                    <button
                        onClick={() => onCreatePop ? onCreatePop() : setView('editor')}
                        className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl font-bold shadow-xl shadow-blue-600/30 hover:scale-[1.02] active:scale-95 transition-all"
                    >
                        <PlusCircle size={20} />
                        <span>Criar Novo POP</span>
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
                {dashboardStats.map((stat, i) => (
                    <div key={i}>
                        <StatsCard stat={stat} index={i} />
                    </div>
                ))}
            </div>

            <div className="bg-white dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">Documentos Recentes e Status</h3>
                    <button className="text-sm font-medium text-blue-600 hover:underline">Ver todos</button>
                </div>
                <div className="overflow-x-auto min-h-[300px]">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 text-xs uppercase tracking-widest font-bold">
                                <th className="px-6 py-4">Manual / Procedimento</th>
                                <th className="px-6 py-4">Responsável</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4">Progresso</th>
                                <th className="px-6 py-4 text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={5} className="text-center py-10 text-slate-500">
                                        Carregando POPs...
                                    </td>
                                </tr>
                            ) : pops.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="text-center py-10 text-slate-500">
                                        Nenhum POP encontrado.
                                    </td>
                                </tr>
                            ) : (
                                pops.map((pop) => (
                                    <tr
                                        key={pop.id}
                                        className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer"
                                        onClick={() => onSelectPop(pop.id, 'viewer')}
                                    >
                                        <td className="px-6 py-5">
                                            <div className="flex items-center gap-3">
                                                <div className="h-10 w-10 flex items-center justify-center rounded-lg bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400">
                                                    <FileText size={20} />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-slate-900 dark:text-white">{pop.title}</p>
                                                    <p className="text-xs text-slate-500">{(pop as any).department?.name || 'Geral'}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="flex items-center gap-2">
                                                <AvatarCircle initials={(pop as any).author?.full_name?.[0] || 'U'} size="sm" />
                                                <span className="text-sm text-slate-600 dark:text-slate-400">{(pop as any).author?.full_name || 'Desconhecido'}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <StatusBadge status={pop.status === 'draft' ? 'Rascunho' : pop.status === 'published' ? 'Publicado' : 'Arquivado'} />
                                        </td>
                                        <td className="px-6 py-5">
                                            <ProgressBar progress={pop.status === 'published' ? 100 : 50} />
                                        </td>
                                        <td className="px-6 py-5 text-right">
                                            <button className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 hover:text-blue-600 transition-colors">
                                                <MoreVertical size={18} />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
                {pops.length > 0 && (
                    <Pagination
                        currentPage={1}
                        totalPages={1}
                        totalItems={pops.length}
                        itemsShown={pops.length}
                        itemLabel="documentos"
                    />
                )}
            </div>
        </div>
    );
};

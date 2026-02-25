import { useState, useEffect } from 'react';
import { CheckCircle2, MoreVertical, FileText } from 'lucide-react';
import { StatusBadge, ProgressBar, Pagination, AvatarCircle } from '../components';
import { popService } from '../services/pops';
import type { PopDatabase, View } from '../types';

interface RevisionsViewProps {
    setView: (v: View) => void;
    onSelectPop: (id: string, view?: View) => void;
}

export const RevisionsView = ({ setView, onSelectPop }: RevisionsViewProps) => {
    const [pops, setPops] = useState<PopDatabase[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchRevisions = async () => {
            setIsLoading(true);
            try {
                const data = await popService.getPops();
                // Filter only pops that are 'draft' to represent "Under Revision"
                setPops(data.filter(p => p.status === 'draft'));
            } catch (error) {
                console.error('Failed to load revisions', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchRevisions();
    }, []);

    return (
        <div className="flex-1 flex flex-col p-6 md:p-10 overflow-y-auto max-w-7xl mx-auto w-full">
            <div className="mb-10">
                <h1 className="text-slate-900 dark:text-white text-3xl font-extrabold tracking-tight mb-2">Revisões Pendentes</h1>
                <p className="text-slate-500 dark:text-slate-400 text-lg">Aprove, solicite alterações ou discuta POPs em rascunho.</p>
            </div>

            <div className="bg-white dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <CheckCircle2 size={20} className="text-amber-500" />
                        Aguardando Validação
                    </h3>
                </div>
                <div className="overflow-x-auto min-h-[300px]">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 text-xs uppercase tracking-widest font-bold">
                                <th className="px-6 py-4">Procedimento Opeacional</th>
                                <th className="px-6 py-4">Requerente</th>
                                <th className="px-6 py-4">Progresso Atual</th>
                                <th className="px-6 py-4 text-right">Ação</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={4} className="text-center py-10 text-slate-500">
                                        Carregando revisões...
                                    </td>
                                </tr>
                            ) : pops.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="text-center py-10 text-slate-500">
                                        Nenhuma revisão pendente no momento. Parabéns!
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
                                                <div className="h-10 w-10 flex items-center justify-center rounded-lg bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-400">
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
                                            <ProgressBar progress={50} />
                                        </td>
                                        <td className="px-6 py-5 text-right">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onSelectPop(pop.id, 'editor');
                                                }}
                                                className="px-3 py-1.5 bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 font-bold rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-all text-sm"
                                            >
                                                Revisar agora
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

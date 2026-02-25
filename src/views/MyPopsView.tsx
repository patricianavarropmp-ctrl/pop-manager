import { useState, useEffect } from 'react';
import { PlusCircle, MoreVertical, FileText, Video } from 'lucide-react';
import { StatusBadge, ProgressBar, Pagination, AvatarCircle } from '../components';
import { popService } from '../services/pops';
import type { PopDatabase, View } from '../types';
import { useAuth } from '../contexts/AuthContext';

interface MyPopsViewProps {
    setView: (v: View) => void;
    onSelectPop: (id: string, view?: View) => void;
}

export const MyPopsView = ({ setView, onSelectPop }: MyPopsViewProps) => {
    const { profile } = useAuth();
    const [pops, setPops] = useState<PopDatabase[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchMyPops = async () => {
            setIsLoading(true);
            try {
                const data = await popService.getPops();
                // Filter pops where current user is the author
                setPops(data.filter(p => p.author_id === profile?.id));
            } catch (error) {
                console.error('Failed to load my pops', error);
            } finally {
                setIsLoading(false);
            }
        };

        if (profile?.id) {
            fetchMyPops();
        } else {
            setIsLoading(false);
        }
    }, [profile]);

    return (
        <div className="flex-1 flex flex-col p-6 md:p-10 overflow-y-auto max-w-7xl mx-auto w-full">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
                <div>
                    <h1 className="text-slate-900 dark:text-white text-3xl font-extrabold tracking-tight mb-2">Meus Procedimentos</h1>
                    <p className="text-slate-500 dark:text-slate-400 text-lg">POPs de sua autoria ou atribuídos diretamente à sua revisão.</p>
                </div>
                <button
                    onClick={() => setView('editor')}
                    className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl font-bold shadow-xl shadow-blue-600/30 hover:scale-[1.02] active:scale-95 transition-all"
                >
                    <PlusCircle size={20} />
                    <span>Criar Novo POP</span>
                </button>
            </div>

            <div className="bg-white dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                <div className="overflow-x-auto min-h-[300px]">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 text-xs uppercase tracking-widest font-bold">
                                <th className="px-6 py-4">Manual / Procedimento</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4">Progresso</th>
                                <th className="px-6 py-4 text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={4} className="text-center py-10 text-slate-500">
                                        Carregando seus POPs...
                                    </td>
                                </tr>
                            ) : pops.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="text-center py-10 text-slate-500">
                                        Você ainda não possui POPs. Crie um agora!
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
                                                <div className={`h-10 w-10 flex items-center justify-center rounded-lg ${pop.status === 'published'
                                                    ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400'
                                                    : 'bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400'
                                                    }`}>
                                                    <FileText size={20} />
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <p className="text-sm font-bold text-slate-900 dark:text-white">{pop.title}</p>
                                                        {pop.video_url && (
                                                            <Video size={14} className="text-indigo-500" title="Vídeo vinculado" />
                                                        )}
                                                    </div>
                                                    <p className="text-xs text-slate-500">{(pop as any).department?.name || 'Geral'}</p>
                                                </div>
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
            </div>
        </div>
    );
};

interface StatusBadgeProps {
    status: string;
}

const statusStyles: Record<string, string> = {
    'Publicado': 'bg-emerald-100 text-emerald-600',
    'Em Revisão': 'bg-amber-100 text-amber-600',
    'Rascunho': 'bg-slate-100 text-slate-600',
    'Ativo': 'text-emerald-600',
    'Inativo': 'text-slate-400',
};

const dotStyles: Record<string, string> = {
    'Publicado': 'bg-emerald-600',
    'Em Revisão': 'bg-amber-600',
    'Rascunho': 'bg-slate-600',
    'Ativo': 'bg-emerald-500',
    'Inativo': 'bg-slate-400',
};

export const StatusBadge = ({ status }: StatusBadgeProps) => {
    const isInlineStatus = status === 'Ativo' || status === 'Inativo';

    if (isInlineStatus) {
        return (
            <span className={`flex items-center gap-1.5 text-xs font-bold ${statusStyles[status] || 'text-slate-400'}`}>
                <span className={`size-2 rounded-full ${dotStyles[status] || 'bg-slate-400'}`} />
                {status}
            </span>
        );
    }

    return (
        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold uppercase ${statusStyles[status] || 'bg-slate-100 text-slate-600'}`}>
            <span className={`h-1 w-1 rounded-full ${dotStyles[status] || 'bg-slate-600'}`} />
            {status}
        </span>
    );
};

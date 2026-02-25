import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsShown: number;
    itemLabel?: string;
    onPageChange?: (page: number) => void;
}

export const Pagination = ({
    currentPage,
    totalPages,
    totalItems,
    itemsShown,
    itemLabel = 'itens',
    onPageChange,
}: PaginationProps) => (
    <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between border-t border-slate-200 dark:border-slate-800">
        <span className="text-xs text-slate-500">
            Exibindo {itemsShown} de {totalItems} {itemLabel}
        </span>
        <div className="flex items-center gap-1">
            <button
                onClick={() => onPageChange?.(currentPage - 1)}
                disabled={currentPage <= 1}
                className="p-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-500 hover:bg-slate-50 transition-colors disabled:opacity-40"
            >
                <ChevronLeft size={16} />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                    key={page}
                    onClick={() => onPageChange?.(page)}
                    className={`size-8 flex items-center justify-center rounded-lg text-xs font-bold transition-colors ${page === currentPage
                            ? 'bg-blue-600 text-white'
                            : 'border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-500 hover:bg-slate-50'
                        }`}
                >
                    {page}
                </button>
            ))}
            <button
                onClick={() => onPageChange?.(currentPage + 1)}
                disabled={currentPage >= totalPages}
                className="p-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-500 hover:bg-slate-50 transition-colors disabled:opacity-40"
            >
                <ChevronRight size={16} />
            </button>
        </div>
    </div>
);

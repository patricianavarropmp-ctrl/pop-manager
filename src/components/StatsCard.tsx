import { motion } from 'motion/react';
import type { StatItem } from '../types';

const bgColorMap: Record<string, string> = {
    blue: 'bg-blue-100 dark:bg-blue-900/30',
    amber: 'bg-amber-100 dark:bg-amber-900/30',
    emerald: 'bg-emerald-100 dark:bg-emerald-900/30',
    purple: 'bg-purple-100 dark:bg-purple-900/30',
    rose: 'bg-rose-100 dark:bg-rose-900/30',
    slate: 'bg-slate-100 dark:bg-slate-900/30',
};

const textColorMap: Record<string, string> = {
    blue: 'text-blue-600',
    amber: 'text-amber-600',
    emerald: 'text-emerald-600',
    purple: 'text-purple-600',
    rose: 'text-rose-600',
    slate: 'text-slate-600',
};

interface StatsCardProps {
    stat: StatItem;
    index?: number;
    animated?: boolean;
}

export const StatsCard = ({ stat, index = 0, animated = true }: StatsCardProps) => {
    const content = (
        <>
            <div className="flex justify-between items-start mb-4">
                <div className={`p-2 rounded-lg ${bgColorMap[stat.color] || bgColorMap.blue} ${textColorMap[stat.color] || textColorMap.blue}`}>
                    <stat.icon size={20} />
                </div>
                {stat.change && (
                    <span className={`${stat.change.startsWith('+') ? 'text-emerald-500' : 'text-rose-500'} text-xs font-bold flex items-center`}>
                        {stat.change}
                    </span>
                )}
            </div>
            <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">{stat.label}</p>
            <p className="text-3xl font-black text-slate-900 dark:text-white mt-1">{stat.value}</p>
        </>
    );

    const className = "bg-white dark:bg-slate-900/50 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm";

    if (animated) {
        return (
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={className}
            >
                {content}
            </motion.div>
        );
    }

    return <div className={className}>{content}</div>;
};

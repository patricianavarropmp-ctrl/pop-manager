interface ProgressBarProps {
    progress: number;
    showLabel?: boolean;
    size?: 'sm' | 'md';
}

export const ProgressBar = ({ progress, showLabel = true, size = 'sm' }: ProgressBarProps) => {
    const barHeight = size === 'sm' ? 'h-1' : 'h-1.5';
    const barColor = progress === 100 ? 'bg-emerald-500' : 'bg-blue-600';

    return (
        <div className="flex flex-col gap-1 w-32">
            {showLabel && (
                <div className="flex justify-between text-[10px] font-medium text-slate-400">
                    <span>Concluído</span>
                    <span>{progress}%</span>
                </div>
            )}
            <div className={`w-full bg-slate-200 dark:bg-slate-800 ${barHeight} rounded-full`}>
                <div
                    className={`${barColor} h-full rounded-full transition-all duration-500`}
                    style={{ width: `${progress}%` }}
                />
            </div>
        </div>
    );
};

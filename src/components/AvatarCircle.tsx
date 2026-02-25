interface AvatarCircleProps {
    src?: string;
    initials?: string;
    fallback?: string;
    size?: 'sm' | 'md' | 'lg';
    className?: string;
    onClick?: () => void;
}

const sizeMap = {
    sm: 'h-6 w-6',
    md: 'size-9',
    lg: 'h-10 w-10',
};

export const AvatarCircle = ({ src, initials, fallback, size = 'md', className = '', onClick }: AvatarCircleProps) => {
    const sizeClass = sizeMap[size];

    if (src) {
        return (
            <div
                className={`${sizeClass} rounded-full overflow-hidden ${className} ${onClick ? 'cursor-pointer' : ''}`}
                onClick={onClick}
            >
                <img
                    className="h-full w-full object-cover"
                    src={src}
                    alt={initials || fallback || 'Avatar'}
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        e.currentTarget.parentElement!.innerText = fallback || initials || '?';
                        e.currentTarget.parentElement!.className += ' bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-sm';
                    }}
                />
            </div>
        );
    }

    return (
        <div
            className={`${sizeClass} rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-sm ${className} ${onClick ? 'cursor-pointer' : ''}`}
            onClick={onClick}
        >
            {initials || fallback || '?'}
        </div>
    );
};

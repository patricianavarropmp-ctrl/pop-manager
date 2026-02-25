import { FileText, Search, Bell, Settings, LogOut } from 'lucide-react';
import { AvatarCircle } from './AvatarCircle';
import type { View } from '../types';
import { useAuth } from '../contexts/AuthContext';

interface HeaderProps {
    setView: (v: View) => void;
}

export const Header = ({ setView }: HeaderProps) => {
    const { profile, signOut } = useAuth();

    return (
        <header className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-6 md:px-16 py-4 sticky top-0 z-50">
            <div className="flex items-center gap-8">
                <div className="flex items-center gap-3 text-blue-600 cursor-pointer" onClick={() => setView('dashboard')}>
                    <div className="size-8 flex items-center justify-center bg-blue-100 rounded-lg">
                        <FileText size={20} />
                    </div>
                    <h2 className="text-slate-900 dark:text-white text-xl font-bold tracking-tight">POP Manager</h2>
                </div>
                <div className="hidden lg:flex items-center gap-6">
                    <button onClick={() => setView('dashboard')} className="text-blue-600 font-semibold text-sm">Dashboard</button>
                    <button className="text-slate-600 dark:text-slate-400 hover:text-blue-600 font-medium text-sm">Manuais</button>
                    <button className="text-slate-600 dark:text-slate-400 hover:text-blue-600 font-medium text-sm">Equipes</button>
                </div>
            </div>
            <div className="flex items-center gap-4">
                <div className="hidden sm:flex items-center bg-slate-100 dark:bg-slate-800 rounded-lg px-3 py-1.5 border border-slate-200 dark:border-slate-700">
                    <Search size={16} className="text-slate-400" />
                    <input
                        className="bg-transparent border-none focus:ring-0 text-sm text-slate-900 dark:text-white placeholder:text-slate-500 w-48 lg:w-64"
                        placeholder="Buscar POPs..."
                        type="text"
                    />
                </div>
                <div className="flex gap-2 items-center">
                    <button className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-blue-600 hover:text-white transition-all">
                        <Bell size={20} />
                    </button>
                    <button className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-blue-600 hover:text-white transition-all">
                        <Settings size={20} />
                    </button>
                    <button
                        onClick={signOut}
                        title="Sair"
                        className="p-2 ml-2 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-600 hover:text-white transition-all"
                    >
                        <LogOut size={20} />
                    </button>
                </div>
                <div
                    className="flex items-center gap-3 border-l border-slate-200 dark:border-slate-700 pl-4 ml-2 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 p-2 rounded-xl transition-colors"
                    onClick={() => setView('profile')}
                    title="Meu Perfil"
                >
                    <div className="hidden md:flex flex-col items-end">
                        <span className="text-sm font-semibold text-slate-900 dark:text-white">{profile?.full_name || 'Usuário'}</span>
                        <span className="text-xs text-slate-500 capitalize">{profile?.role || 'Avaliando'}</span>
                    </div>
                    <AvatarCircle
                        src={profile?.avatar_url || ''}
                        fallback={profile?.full_name?.[0] || 'U'}
                        size="md"
                        className="border-2 border-slate-200 dark:border-slate-700"
                    />
                </div>
            </div>
        </header>
    );
};

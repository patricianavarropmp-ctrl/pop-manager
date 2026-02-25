import {
    LayoutDashboard,
    FileText,
    CheckCircle2,
    Clock,
    Users,
    Settings,
    Building2
} from 'lucide-react';
import type { View } from '../types';

interface SidebarProps {
    currentView: View;
    setView: (v: View) => void;
}

const menuItems = [
    { id: 'dashboard' as View, label: 'Visão Geral', icon: LayoutDashboard },
    { id: 'my-pops' as View, label: 'Meus POPs', icon: FileText },
    { id: 'reviews' as View, label: 'Revisões', icon: CheckCircle2, badge: '!' },
    { id: 'dashboard' as View, label: 'Arquivados', icon: Clock },
];

const orgItems = [
    { id: 'users' as View, label: 'Usuários', icon: Users },
    { id: 'departments' as View, label: 'Departamentos', icon: Building2 },
    { id: 'settings' as View, label: 'Configurações', icon: Settings },
];

export const Sidebar = ({ currentView, setView }: SidebarProps) => (
    <aside className="hidden md:flex w-64 flex-col border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 gap-8">
        <div className="flex flex-col gap-2">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest px-3">Principal</p>
            <nav className="flex flex-col gap-1">
                {menuItems.map((item) => (
                    <button
                        key={item.label}
                        onClick={() => setView(item.id)}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${currentView === item.id
                            ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                            : 'text-slate-600 dark:text-slate-400 hover:bg-blue-50 dark:hover:bg-slate-800 hover:text-blue-600'
                            }`}
                    >
                        <item.icon size={18} />
                        <span className="text-sm font-semibold">{item.label}</span>
                        {item.badge && (
                            <span className={`ml-auto text-[10px] px-1.5 py-0.5 rounded-full font-bold ${currentView === item.id ? 'bg-white/20 text-white' : 'bg-blue-100 text-blue-600'
                                }`}>
                                {item.badge}
                            </span>
                        )}
                    </button>
                ))}
            </nav>
        </div>

        <div className="flex flex-col gap-2">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest px-3">Organização</p>
            <nav className="flex flex-col gap-1">
                {orgItems.map((item) => (
                    <button
                        key={item.label}
                        onClick={() => setView(item.id)}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${currentView === item.id
                            ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                            : 'text-slate-600 dark:text-slate-400 hover:bg-blue-50 dark:hover:bg-slate-800 hover:text-blue-600'
                            }`}
                    >
                        <item.icon size={18} />
                        <span className="text-sm font-semibold">{item.label}</span>
                    </button>
                ))}
            </nav>
        </div>

        <div className="mt-auto bg-blue-50 dark:bg-blue-900/10 rounded-xl p-4 border border-blue-100 dark:border-blue-900/20">
            <p className="text-xs font-bold text-blue-600 mb-2">Plano Corporativo</p>
            <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full mb-3">
                <div className="bg-blue-600 h-full rounded-full" style={{ width: '75%' }} />
            </div>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">
                Você utilizou 75% da sua capacidade de armazenamento de POPs.
            </p>
        </div>
    </aside>
);

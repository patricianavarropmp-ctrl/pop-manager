import {
    FileText,
    Shield,
    LayoutDashboard,
    BarChart3,
    Clock,
    CheckCircle2,
    Users,
} from 'lucide-react';
import type { POP, User, StatItem } from '../types';

export const MOCK_POPS: POP[] = [
    {
        id: '1',
        title: 'Controle de Estoque Mensal',
        department: 'Logística & Suprimentos',
        responsible: 'Ricardo M.',
        status: 'Publicado',
        progress: 100,
        icon: FileText,
        iconColor: 'text-blue-600 bg-blue-100',
    },
    {
        id: '2',
        title: 'Protocolo de Segurança TI',
        department: 'Tecnologia da Informação',
        responsible: 'Carla S.',
        status: 'Em Revisão',
        progress: 65,
        icon: Shield,
        iconColor: 'text-amber-600 bg-amber-100',
    },
    {
        id: '3',
        title: 'Atendimento ao Cliente v2',
        department: 'Customer Success',
        responsible: 'João P.',
        status: 'Rascunho',
        progress: 15,
        icon: LayoutDashboard,
        iconColor: 'text-slate-600 bg-slate-100',
    },
    {
        id: '4',
        title: 'Fechamento de Caixa',
        department: 'Financeiro',
        responsible: 'Beatriz L.',
        status: 'Publicado',
        progress: 100,
        icon: BarChart3,
        iconColor: 'text-purple-600 bg-purple-100',
    },
];

export const MOCK_USERS: User[] = [
    { name: 'Ana Silva', email: 'ana.silva@empresa.com', dept: 'Qualidade', role: 'Admin', status: 'Ativo', initials: 'AS' },
    { name: 'Carlos Souza', email: 'carlos.s@empresa.com', dept: 'Produção', role: 'Editor', status: 'Ativo', initials: 'CS' },
    { name: 'Mariana Oliveira', email: 'mari.oliveira@empresa.com', dept: 'Recursos Humanos', role: 'Leitor', status: 'Inativo', initials: 'MO' },
    { name: 'João Pereira', email: 'joao.p@empresa.com', dept: 'Operações', role: 'Editor', status: 'Ativo', initials: 'JP' },
];

export const DASHBOARD_STATS: StatItem[] = [
    { label: 'Total de POPs', value: '128', change: '+5%', icon: FileText, color: 'blue' },
    { label: 'Em Revisão', value: '12', change: '-2%', icon: Clock, color: 'amber' },
    { label: 'Publicados', value: '114', change: '+8%', icon: CheckCircle2, color: 'emerald' },
    { label: 'Taxa de Adesão', value: '92%', change: '+1%', icon: BarChart3, color: 'blue' },
];

export const USER_STATS: StatItem[] = [
    { label: 'Total de Usuários', value: '128', icon: Users, color: 'blue' },
    { label: 'Usuários Ativos', value: '114', icon: CheckCircle2, color: 'emerald' },
    { label: 'Administradores', value: '12', icon: Shield, color: 'amber' },
];

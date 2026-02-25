import { LucideIcon } from 'lucide-react';

export type View = 'login' | 'dashboard' | 'editor' | 'users' | 'forgot-password' | 'my-pops' | 'reviews' | 'settings' | 'viewer' | 'profile' | 'departments';

// Database Entity Types
export interface Profile {
    id: string; // uuid
    email: string;
    full_name: string | null;
    role: 'admin' | 'collaborator';
    avatar_url: string | null;
    status: 'active' | 'inactive';
    department_id: string | null;
    created_at: string;
}

export interface Department {
    id: string; // uuid
    name: string;
    description: string | null;
    leader_id: string | null;
    created_at: string;
}

export interface PopDatabase {
    id: string; // uuid
    title: string;
    description: string | null;
    status: 'draft' | 'published' | 'archived';
    department_id: string | null;
    author_id: string | null;
    video_url: string | null;
    ai_usage: any;
    created_at: string;
    updated_at: string;
}

export interface PopStepDatabase {
    id: string; // uuid
    pop_id: string; // uuid
    order: number;
    title: string;
    content: string | null;
    image_url: string | null;
    video_timestamp: string | null;
    created_at: string;
}

// UI Types
export interface POP {
    id: string;
    title: string;
    department: string;
    responsible: string;
    status: 'draft' | 'published' | 'archived' | 'Publicado' | 'Em Revisão' | 'Rascunho'; // Mantendo retrocompatibilidade temp
    progress: number;
    icon?: LucideIcon; // Opcional, pois virá do banco
    iconColor?: string;
}

export interface User {
    id?: string;
    name: string;
    email: string;
    dept: string;
    role: string;
    status: 'active' | 'inactive' | 'Ativo' | 'Inativo'; // retrocompatibilidade
    initials: string;
}

export interface StatItem {
    label: string;
    value: string;
    change?: string;
    icon: LucideIcon;
    color: 'blue' | 'amber' | 'emerald' | 'purple' | 'rose' | 'slate';
}

export interface EditorStep {
    id: number | string;
    title: string;
    description: string;
    image: string | null;
    video_timestamp: string | null;
}

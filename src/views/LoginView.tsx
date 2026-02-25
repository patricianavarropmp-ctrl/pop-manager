import React, { useState } from 'react';
import { motion } from 'motion/react';
import { FileText, Lock, ArrowRight, CheckCircle2, Loader2, AlertCircle } from 'lucide-react';
import { InputField } from '../components';
import type { View } from '../types';
import { supabase } from '../lib/supabase';

interface LoginViewProps {
    setView: (v: View) => void;
}

export const LoginView = ({ setView }: LoginViewProps) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);

        try {
            const { error: signInError } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (signInError) {
                let errorMsg = 'E-mail ou senha incorretos.';
                if (signInError.message.includes('Invalid login credentials')) errorMsg = 'E-mail ou senha incorretos.';
                else errorMsg = signInError.message;
                throw new Error(errorMsg);
            }

            // O useEffect do App.tsx cuidará do redirect para 'dashboard' após a sessão ser setada
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-[440px] flex flex-col items-center"
            >
                <div className="mb-8 flex flex-col items-center gap-2">
                    <div className="size-12 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-600/20">
                        <CheckCircle2 size={28} className="text-white" />
                    </div>
                    <h1 className="text-slate-900 dark:text-white text-2xl font-bold tracking-tight">POP Manager</h1>
                    <p className="text-slate-500 dark:text-slate-400 text-sm">Simplificando seus processos operacionais</p>
                </div>

                <div className="bg-white dark:bg-slate-900 w-full rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-8">
                    <div className="mb-6">
                        <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Bem-vindo de volta</h2>
                        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Insira suas credenciais para acessar a plataforma.</p>
                    </div>

                    {error && (
                        <div className="mb-6 p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/30 flex items-start gap-3">
                            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
                            <p className="text-sm text-red-800 dark:text-red-300 font-medium leading-relaxed">{error}</p>
                        </div>
                    )}

                    <form className="space-y-5" onSubmit={handleLogin}>
                        <InputField
                            icon={FileText}
                            label="E-mail corporativo"
                            type="email"
                            placeholder="exemplo@empresa.com.br"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                        <InputField
                            icon={Lock}
                            label="Senha"
                            type="password"
                            placeholder="Digite sua senha"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            rightElement={
                                <button
                                    type="button"
                                    onClick={() => setView('forgot-password')}
                                    className="text-blue-600 text-xs font-semibold hover:underline"
                                >
                                    Esqueceu a senha?
                                </button>
                            }
                        />

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-70 disabled:hover:bg-blue-600 text-white font-semibold py-3.5 rounded-lg shadow-md shadow-blue-600/10 transition-colors flex items-center justify-center gap-2"
                        >
                            {isLoading ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <>
                                    <span>Entrar no sistema</span>
                                    <ArrowRight size={18} />
                                </>
                            )}
                        </button>
                    </form>

                    <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800 text-center flex flex-col gap-2">
                        <p className="text-slate-500 dark:text-slate-400 text-sm">
                            Não tem uma conta? <button className="text-blue-600 font-semibold hover:underline">Solicite acesso ao RH</button>
                        </p>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

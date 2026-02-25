import React, { useState } from 'react';
import { motion } from 'motion/react';
import { FileText, AlertCircle, ArrowRight, ArrowLeft, CheckCircle2, Loader2 } from 'lucide-react';
import { InputField } from '../components';
import type { View } from '../types';
import { authService } from '../lib/auth';

interface ForgotPasswordViewProps {
    setView: (v: View) => void;
}

export const ForgotPasswordView = ({ setView }: ForgotPasswordViewProps) => {
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);

        try {
            await authService.resetPasswordForEmail(email);
            setIsSuccess(true);
        } catch (err: any) {
            setError(err.message || 'Ocorreu um erro ao enviar o link de recuperação.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-md bg-white dark:bg-slate-900 p-8 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800"
            >
                {isSuccess ? (
                    <div className="flex flex-col items-center text-center">
                        <div className="size-16 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mb-6">
                            <CheckCircle2 size={32} className="text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <h2 className="text-2xl font-bold tracking-tight mb-2 text-slate-900 dark:text-white">E-mail Enviado!</h2>
                        <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed mb-8">
                            Enviamos as instruções de recuperação de senha para <span className="font-semibold text-slate-700 dark:text-slate-300">{email}</span>. Por favor, verifique sua caixa de entrada e também a pasta de spam.
                        </p>
                        <button
                            onClick={() => setView('login')}
                            className="w-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-900 dark:text-white py-3 px-6 rounded-lg font-bold transition-colors shadow-sm flex items-center justify-center gap-2"
                        >
                            <span>Voltar para o Login</span>
                        </button>
                    </div>
                ) : (
                    <>
                        <div className="flex flex-col items-center text-center mb-8">
                            <div className="size-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mb-4">
                                <AlertCircle size={32} className="text-blue-600" />
                            </div>
                            <h2 className="text-2xl font-bold tracking-tight mb-2">Esqueceu sua senha?</h2>
                            <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
                                Insira o e-mail associado à sua conta e enviaremos um link para redefinir sua senha de acesso ao POP Manager.
                            </p>
                        </div>

                        {error && (
                            <div className="mb-6 p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/30 flex items-start gap-3">
                                <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
                                <p className="text-sm text-red-800 dark:text-red-300 font-medium leading-relaxed">{error}</p>
                            </div>
                        )}

                        <form className="space-y-6" onSubmit={handleSubmit}>
                            <InputField
                                icon={FileText}
                                label="E-mail corporativo"
                                type="email"
                                placeholder="exemplo@empresa.com.br"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full bg-blue-600 disabled:opacity-70 disabled:hover:bg-blue-600 text-white py-3 px-6 rounded-lg font-bold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2"
                            >
                                {isLoading ? (
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                ) : (
                                    <>
                                        <span>Enviar link de recuperação</span>
                                        <ArrowRight size={18} />
                                    </>
                                )}
                            </button>
                        </form>

                        <div className="mt-8 text-center">
                            <button
                                onClick={() => setView('login')}
                                className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-blue-600 transition-colors group"
                            >
                                <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                                Voltar para o Login
                            </button>
                        </div>
                    </>
                )}
            </motion.div>
        </div>
    );
};

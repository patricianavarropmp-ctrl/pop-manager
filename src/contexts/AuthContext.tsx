import React, { createContext, useContext, useEffect, useState, useMemo, useRef } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { Profile } from '../types';

interface AuthContextType {
    session: Session | null;
    user: User | null;
    profile: Profile | null;
    isLoading: boolean;
    signOut: () => Promise<void>;
    refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
    session: null,
    user: null,
    profile: null,
    isLoading: true,
    signOut: async () => { },
    refreshProfile: async () => { },
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [session, setSession] = useState<Session | null>(null);
    const [user, setUser] = useState<User | null>(null);
    const [profile, setProfile] = useState<Profile | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const isInitialized = useRef(false);
    const loadingRef = useRef(true);

    // Sincroniza o ref com o estado para uso em closures (setTimeout)
    useEffect(() => {
        loadingRef.current = isLoading;
    }, [isLoading]);

    useEffect(() => {
        let mounted = true;

        async function getInitialSession() {
            // Safety timeout to ensure app eventually loads
            const timeout = setTimeout(() => {
                if (mounted && loadingRef.current) {
                    console.warn('Auth initialization timed out, forcing isLoading = false');
                    setIsLoading(false);
                }
            }, 6000);

            try {
                const { data: { session }, error } = await supabase.auth.getSession();
                if (error) throw error;

                if (mounted) {
                    setSession(session);
                    setUser(session?.user ?? null);
                    if (session?.user) {
                        await fetchProfile(session.user.id);
                    }
                }
            } catch (error) {
                console.error('Error getting initial session:', error);
            } finally {
                clearTimeout(timeout);
                if (mounted) {
                    isInitialized.current = true;
                    setIsLoading(false);
                }
            }
        }

        getInitialSession();

        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (_event, session) => {
                console.log('Auth state change:', _event, session?.user?.id);
                
                if (mounted) {
                    setSession(session);
                    setUser(session?.user ?? null);
                    
                    if (session?.user) {
                        fetchProfile(session.user.id).finally(() => {
                            if (mounted) setIsLoading(false);
                        });
                    } else {
                        setProfile(null);
                        // Apenas remove o loading se já inicializou via getSession ou timeout
                        if (mounted) setIsLoading(false);
                    }
                }
            }
        );

        return () => {
            mounted = false;
            subscription.unsubscribe();
        };
    }, []);

    const fetchProfile = async (userId: string) => {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single();

            if (error) {
                // O trigger do auth demora um pouco, então o Profile pode não existir no exato segundo
                if (error.code !== 'PGRST116') {
                    console.error('Error fetching profile:', error);
                }
                return;
            }
            setProfile(data as Profile);
        } catch (error) {
            console.error('Error fetching profile:', error);
        }
    };

    const signOut = async () => {
        setIsLoading(true);
        await supabase.auth.signOut();
        setIsLoading(false);
    };

    const value = useMemo(() => ({
        session,
        user,
        profile,
        isLoading,
        signOut,
        refreshProfile: () => user ? fetchProfile(user.id) : Promise.resolve()
    }), [session, user, profile, isLoading]);

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

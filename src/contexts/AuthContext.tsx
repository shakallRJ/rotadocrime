import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { User, Session } from '@supabase/supabase-js';
import { Jogador } from '../types';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  jogador: Jogador | null;
  loading: boolean;
  signOut: () => Promise<void>;
  fetchJogador: (userId: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({ user: null, session: null, jogador: null, loading: true, signOut: async () => {}, fetchJogador: async () => {} });

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [jogador, setJogador] = useState<Jogador | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchJogador(session.user.id);
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchJogador(session.user.id);
      } else {
        setJogador(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchJogador = async (userId: string) => {
    try {
      const { data, error } = await supabase.from('jogadores').select('*').eq('id', userId).single();
      if (!error && data) {
        setJogador(data as Jogador);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, session, jogador, loading, signOut, fetchJogador }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
